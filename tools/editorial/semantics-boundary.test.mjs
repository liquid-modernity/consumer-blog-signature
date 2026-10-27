import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createPortableTextSemantics } from '../../editorial/portable-content.mjs';
import * as current from '../../editorial/portable-text.mjs';
import * as semantic from '../../editorial/content-semantics.mjs';
import { blockRegistry } from '../../editorial/registry.mjs';
import { markdownToPortableText } from '../../editorial/markdown.mjs';
import { qualifyEditorial, previewDocument } from '../../editorial/content-release.mjs';
import { withEditorialText } from '../../editorial/search.mjs';
import { richFixture } from './fixture.mjs';
import { readEmDashPublished } from '@gaga/corps-emdash';
import { defineQuery, executeSearchReference } from '@gaga/engine-capabilities/search';

const baseline = '5b593c3ee0b42645941c648c0e2f01fb3028b8d3';
const sha = value => createHash('sha256').update(value).digest('hex');
mkdirSync('.gaga', { recursive: true });
const oracleDirectory = mkdtempSync(resolve('.gaga/editorial-baseline-'));
const baselineFiles = {};
for (const name of ['portable-text.mjs', 'registry.mjs', 'search.mjs', 'markdown.mjs', 'content-release.mjs']) {
  const bytes = execFileSync('git', ['show', `${baseline}:editorial/${name}`]);
  baselineFiles[`editorial/${name}`] = sha(bytes);
  writeFileSync(join(oracleDirectory, name), bytes);
}
const original = await import(pathToFileURL(join(oracleDirectory, 'portable-text.mjs')));
const originalSearch = await import(pathToFileURL(join(oracleDirectory, 'search.mjs')));
const originalMarkdown = await import(pathToFileURL(join(oracleDirectory, 'markdown.mjs')));
const originalPreview = await import(pathToFileURL(join(oracleDirectory, 'content-release.mjs')));
after(() => rmSync(oracleDirectory, { recursive: true, force: true }));
const snapshotBytes = readFileSync('content/emdash/published.json');
const snapshot = JSON.parse(snapshotBytes);
const report = { baseline, baselineFiles, exportSha256: sha(snapshotBytes), records: [] };
const paragraph = (text, extra = {}) => ({ _type: 'block', _key: 'p', children: [{ _type: 'span', _key: 's', text }], ...extra });
const outcome = (fn, body, context) => {
  try { return { value: fn(structuredClone(body), structuredClone(context)) }; }
  catch (error) { return { error: { name: error.name, message: error.message } }; }
};
const examples = [
  ['empty array', [], ''],
  ['empty span', [paragraph('')], ''],
  ['whitespace span', [paragraph(' \t\n')], ' \t\n'],
  ['meaningful span', [paragraph('Meaningful text')], 'Meaningful text'],
  ['combining and non-Latin text', [paragraph('é é 日本語 العربية')], 'é é 日本語 العربية'],
  ['formatting-only break', [{ _type: 'break', _key: 'b' }], ''],
  ['captionless media', [{ _type: 'image', _key: 'i', asset: { _ref: 'provider-native-id', url: '/media/image.png' } }], ''],
  ['media descriptions', [{ _type: 'image', _key: 'i', url: '/image.png', alt: 'Alt', caption: 'Caption' }], 'Caption Alt'],
  ['provider metadata is not text', [paragraph('Public words', { pluginId: 'provider-id', internalMetadata: 'not searchable' })], 'Public words'],
  ['reference metadata is not all projected', [{ _type: 'reference', _key: 'r', id: 'r', authors: 'Not projected', doi: 'not projected' }], ''],
  ['gallery coerces existing caption values', [{ _type: 'gallery', _key: 'g', images: [{ url: '/image.png', alt: 42, caption: 'Caption' }] }], '42 Caption'],
  ['empty table', [{ _type: 'table', _key: 't', rows: [] }], ''],
];
for (const [name, body, expected] of examples) test(`preserves validation and text: ${name}`, () => {
  for (const operation of ['validatePortableText', 'resolveSections', 'plainText'])
    assert.deepEqual(outcome(semantic[operation], body, {}), outcome(original[operation], body, {}));
  assert.equal(semantic.plainText(body), expected);
  // Meaningfulness is a consumer decision; validation does not require non-whitespace prose.
  assert.equal(semantic.plainText(body).trim().length > 0, expected.trim().length > 0);
});
const invalid = [
  ['missing', undefined], ['null', null], ['Markdown scalar', 'Writing'], ['object', {}], ['null block', [null]],
  ['missing stable key', [{ _type: 'break' }]],
  ['duplicate key', [{ _type: 'break', _key: 'b' }, { _type: 'break', _key: 'b' }]],
  ['unknown executable block', [{ _type: 'htmlBlock', _key: 'b', html: '<script>x()</script>' }]],
  ['provider asset identity without readable URL', [{ _type: 'image', _key: 'b', asset: { _ref: 'provider-id' } }]],
  ['provider wrapper instead of content', { type: 'portableText', value: [paragraph('Text')] }],
  ['malformed gallery', [{ _type: 'gallery', _key: 'b', images: null }]],
  ['malformed table', [{ _type: 'table', _key: 'b', rows: [{ _key: 'r', cells: [{}] }] }]],
  ['invalid custom field', [{ _type: 'callout', _key: 'b', text: { value: 'Wrapped string' } }]],
  ['invalid link', [paragraph('Link', { markDefs: [{ _type: 'link', _key: 'l', href: 'javascript:x()' }] })]],
  ['unknown mark', [paragraph('Mark', { children: [{ _type: 'span', _key: 's', text: 'Text', marks: ['unknown'] }] })]],
  ['oversized document', Array.from({ length: 5001 }, (_, i) => ({ _type: 'break', _key: 'b' + i }))],
  ['oversized serialization', [paragraph('x'.repeat(2_000_000))]],
];
for (const [name, body] of invalid) test(`preserves rejection: ${name}`, () => {
  for (const operation of ['validatePortableText', 'resolveSections', 'plainText']) {
    const before = outcome(original[operation], body, {});
    assert.ok(before.error, name);
    assert.deepEqual(outcome(semantic[operation], body, {}), before);
  }
});
test('rich block fixture, sections, analysis and renderer stay exactly equivalent without input mutation', () => {
  const { body, sections } = richFixture(), before = JSON.stringify({ body, sections });
  for (const operation of ['validatePortableText', 'resolveSections', 'plainText'])
    assert.deepEqual(outcome(semantic[operation], body, { sections }), outcome(original[operation], body, { sections }));
  assert.deepEqual(current.analyzeEditorial(body, {}, { sections }), original.analyzeEditorial(body, {}, { sections }));
  assert.equal(current.renderPortableText(body, { sections }), original.renderPortableText(body, { sections }));
  assert.equal(JSON.stringify({ body, sections }), before);
  assert.deepEqual(Object.keys(current).sort(), Object.keys(original).sort());
  assert.equal(current.validatePortableText(body), body);
});
for (const [name, body, sections] of [
  ['missing section', [{ _type: 'sectionRef', _key: 'r', id: 'missing' }], {}],
  ['cycle', [{ _type: 'sectionRef', _key: 'r', id: 'loop' }], { loop: [{ _type: 'sectionRef', _key: 'r', id: 'loop' }] }],
  ['duplicate expansion keys', [{ _type: 'sectionRef', _key: 'r1', id: 'shared' }, { _type: 'sectionRef', _key: 'r2', id: 'shared' }], { shared: [paragraph('Shared')] }],
]) test(`preserves section failure: ${name}`, () => {
  const before = outcome(original.plainText, body, { sections });
  assert.ok(before.error); assert.deepEqual(outcome(semantic.plainText, body, { sections }), before);
});
test('native widget declarations must be adapted; the portable descriptor has no widget surface', () => {
  assert.throws(() => createPortableTextSemantics(blockRegistry), /Invalid Portable Text block definitions/);
  for (const config of [null, [{ type: 'block', stringFields: [] }], [{ type: 'note', stringFields: ['text', 'text'] }], [{ type: 'note' }], [{ type: 'note', stringFields: [] }, { type: 'note', stringFields: [] }]])
    assert.throws(() => createPortableTextSemantics(config), /Invalid Portable Text block definitions/);
});
test('detached differently configured consumer runs with only the portable module and Node built-ins', () => {
  const dir = mkdtempSync(join(tmpdir(), 'portable-editorial-'));
  try {
    copyFileSync('editorial/portable-content.mjs', join(dir, 'portable-content.mjs'));
    const code = `import assert from 'node:assert/strict';
      import {createPortableTextSemantics} from './portable-content.mjs';
      const s=createPortableTextSemantics([{type:'researchNote',stringFields:['title','text']}]);
      const b=[{_type:'researchNote',_key:'n',title:'Methods',text:'Independent project'}];
      assert.equal(s.validatePortableText(b),b);
      assert.equal(s.plainText(b),'Methods Independent project');
      assert.throws(()=>s.validatePortableText([{_type:'callout',_key:'n',text:'Unselected'}]));
      assert.throws(()=>s.validatePortableText([{_type:'researchNote',_key:'n',text:42}]));
      console.log('PASS: detached vocabulary, no dependencies');`;
    assert.match(execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: dir, encoding: 'utf8', env: {} }), /PASS: detached vocabulary/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('portable core has no imports, renderer, provider, framework, application routes or ambient services', () => {
  const source = readFileSync('editorial/portable-content.mjs', 'utf8');
  assert.doesNotMatch(source, /\bimport\s|\brequire\s*\(|\bexport\s+[^;]*\sfrom\s|emdash|astro|react|cloudflare|katex|pakrpp|\/authors\/|\b(?:fetch|process|window|document)\./i);
  for (const file of ['editorial/search.mjs', 'editorial/markdown.mjs', 'cms/editorial/plugin.mjs'])
    assert.doesNotMatch(readFileSync(file, 'utf8'), /from\s*['"][^'"]*portable-text\.mjs/);
});
test('all eight admitted records preserve conversion, canonical body, render bytes, preview and Engine Search', async () => {
  assert.equal(snapshot.documents.length, 8);
  const profile = JSON.parse(readFileSync('content-release.json'));
  const query = defineQuery({ id: 'equivalence-query', text: 'Akal Imitasi', filters: [], facets: [], scope: [], constraints: [], diagnostics: [] });
  const beforeArtifacts = [], afterArtifacts = [];
  for (const d of snapshot.documents) {
    const data = d.item.data, originalBytes = JSON.stringify(d);
    const oldConversion = originalMarkdown.markdownToPortableText(data.body);
    assert.equal(oldConversion.ok, true);
    assert.deepEqual(markdownToPortableText(data.body), oldConversion);
    const body = current.editorialBody(data);
    assert.deepEqual(body, original.editorialBody(data));
    assert.ok(Array.isArray(body));
    assert.equal(semantic.plainText(body), original.plainText(body));
    assert.equal(current.renderPortableText(body, { mediaOrigin: snapshot.origin }), original.renderPortableText(body, { mediaOrigin: snapshot.origin }));
    const projection = await readEmDashPublished(d.pin, { origin: d.pin.origin, authorizeRead: async resource => ({ decision: 'ALLOW', resource }), readRaw: async () => d.item });
    assert.equal(projection.status, 'projected');
    const before = originalSearch.withEditorialText(projection, body), after = withEditorialText(projection, body);
    assert.deepEqual(after, before); beforeArtifacts.push(before); afterArtifacts.push(after);
    if (d.pin.collection === 'posts') {
      const args = { request: { resource: 'posts/' + d.item.id }, selected: { published: d.item, revision: { data } }, profile, snapshot };
      const oldPreview = originalPreview.qualifyEditorial(args), newPreview = qualifyEditorial(args);
      assert.deepEqual(newPreview, oldPreview);
      assert.equal(previewDocument(newPreview), originalPreview.previewDocument(oldPreview));
    }
    assert.equal(JSON.stringify(d), originalBytes);
    report.records.push({ applicationId: d.applicationId, pin: d.pin, bodySha256: d.bodySha256, portableTextSha256: sha(JSON.stringify(body)), textSha256: sha(semantic.plainText(body)), renderedSha256: sha(current.renderPortableText(body, { mediaOrigin: snapshot.origin })), conversionEqual: true, searchArtifactEqual: true });
  }
  const execute = artifacts => executeSearchReference({ id: 'equivalence-search', query, artifacts, limitations: [], diagnostics: [] });
  const before = execute(beforeArtifacts), after = execute(afterArtifacts);
  assert.deepEqual(after, before); assert.equal(after.status, 'succeeded'); assert.ok(after.output.results.length);
  assert.equal(sha(readFileSync('content/emdash/published.json')), report.exportSha256);
  report.search = { status: after.status, matchedArtifactIds: after.output.matchedArtifactIds };
  if (process.env.GAGA_EVIDENCE_DIRECTORY) {
    const directory = resolve(process.env.GAGA_EVIDENCE_DIRECTORY);
    assert.ok(!directory.startsWith(resolve('.') + '/'), 'Evidence belongs outside the checkout');
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'semantics-equivalence.json'), JSON.stringify({ status: 'PASS', ...report, productionWrites: 0 }, null, 2) + '\n');
  }
});
test('section depth bound and URL contexts remain the baseline contract', () => {
  for (const depth of [7, 9]) {
    const ref = i => ({ _type: 'sectionRef', _key: 'r' + i, id: 'part' + i });
    const sections = Object.fromEntries(Array.from({ length: depth }, (_, i) => ['part' + i, i === depth - 1 ? [paragraph('Leaf')] : [ref(i + 1)]]));
    const before = outcome(original.plainText, [ref(0)], { sections });
    assert.deepEqual(outcome(semantic.plainText, [ref(0)], { sections }), before);
    assert.equal(Boolean(before.error), depth === 9);
  }
  for (const value of [undefined, null, '', ' ', '#note', '#', '/image.png', '//host/file', '/\\host/file', 'https://example.org', 'mailto:editor@example.org', 'javascript:x()', 'https://user:pass@example.org'])
    for (const media of [false, true]) assert.equal(semantic.safeUrl(value, { media }), original.safeUrl(value, { media }));
});
