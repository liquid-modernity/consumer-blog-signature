import { stripQualifiedFamilyGuards } from '../family/release-browser-guards.mjs';
import { stripQualifiedMotionGuards } from '../signature/release-browser-guards.mjs';
import { stripQualifiedPersonalGuards } from '../personal/release-browser-guards.mjs';
import { stripQualifiedDocumentationGuards } from '../documentation/release-browser-guards.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { resolveNotchPresentation, contextualRails, positionLinkPreview, outlineForRoute } from '../../src/config/contextual-ux.mjs';
const base = '93b7c9617a2055543958852fd39205cb3aa0aac7';
test('validated presentation presets have deterministic desktop/mobile defaults and side fallbacks', () => {
  assert.deepEqual(resolveNotchPresentation(undefined, 1440), { placement: 'top', shape: 'notch' });
  assert.deepEqual(resolveNotchPresentation(undefined, 390), { placement: 'top', shape: 'island' });
  for (const placement of ['top', 'bottom', 'left', 'right']) for (const shape of ['island', 'pill']) {
    assert.deepEqual(resolveNotchPresentation({ placement, shape }, 1440), { placement, shape });
    assert.deepEqual(resolveNotchPresentation({ placement, shape }, 320), ['left', 'right'].includes(placement) ? { placement: 'top', shape: 'island' } : { placement, shape });
  }
  for (const value of [{ placement: 'bottom', shape: 'notch' }, { placement: 'random', shape: 'pill' }, { placement: 'top', shape: 'custom' }, { placement: 'top', shape: 'notch', style: 'arbitrary' }, null]) assert.throws(() => resolveNotchPresentation(value), /Unsupported/);
  for (const width of [0, -1, NaN, Infinity]) assert.throws(() => resolveNotchPresentation(undefined, width));
});
test('only meaningful route families are eligible for rails, with no global empty reservations', () => {
  for (const path of ['/', '/saved', '/search', '/publications/article', '/publications', '/archive/2026', '/about']) assert.deepEqual(contextualRails(path), { left: false, right: false });
  assert.deepEqual(contextualRails('/topics/teknologi/'), { left: true, right: true });
  assert.deepEqual(contextualRails('/sections'), { left: true, right: false });
  assert.deepEqual(contextualRails('/knowledge/index'), { left: true, right: false });
});
test('link preview flips and clamps without changing anchor or page identity', () => {
  const anchor = { left: 295, top: 700, bottom: 725 }, before = structuredClone(anchor);
  const p = positionLinkPreview(anchor, { width: 352, height: 130 }, { width: 390, height: 844 });
  assert.equal(p.top, 560); assert.equal(p.left, 30); assert.equal(p.width, 352); assert.deepEqual(anchor, before);
  assert.deepEqual(positionLinkPreview({ left: -10, top: 50, bottom: 70 }, { width: 352, height: 100 }, { width: 320, height: 844 }), { left: 8, top: 80, width: 304 });
});
test('all public packages, CMS/source authority and release guards remain byte-identical', () => {
  assert.equal(stripQualifiedDocumentationGuards(stripQualifiedPersonalGuards(stripQualifiedMotionGuards(stripQualifiedFamilyGuards(readFileSync('.github/workflows/deploy.yml','utf8'))))), execFileSync('git',['show',base+':.github/workflows/deploy.yml'],{encoding:'utf8'}), 'Only exact additional documentation browser guards are authorized');
  for (const path of ['package.json','package-lock.json','cms/package-lock.json','gaga.app.json','content-release.json','content/emdash/published.json','content/emdash/published-receipt.json','cms/editorial/plugin.mjs','cms/editorial/admin.tsx','cms/editorial/studio.css','docs/UI-PRESERVATION.json','.github/workflows/content-release.yml','.github/workflows/content-publish.yml']) assert.deepEqual(readFileSync(path), execFileSync('git', ['show',base+':'+path]), path);
});
test('existing saved state and Save dispatch have no alternate store or duplicate app implementation', () => {
  const root=readFileSync('src/components/reader/EditorialFront.astro','utf8'),notch=readFileSync('src/components/frame/ActionRuntime.astro','utf8'),adapter=readFileSync('src/scripts/systems/saved-reading.ts','utf8');
  assert.ok(root.includes('personalState.saved().slice(0, 5)'));
  const personal=readFileSync('src/lib/personal-state.ts','utf8');
  assert.ok(personal.includes('readArray(keys.saved') && personal.includes('isSavedItem(v)') && personal.includes('localPersonalHref(v.href, origin)'), 'Root must use the same Engine-validated, local-only Saved domain as the library');
  assert.ok(!root.includes('gaga:saved-items:v1')); assert.ok(!root.includes('idx % publications.length'));
  assert.ok(adapter.includes('createSavedReadingCapability(')); assert.ok(adapter.includes('buttonSelector:'));
  assert.ok(notch.includes("if (button?.dataset.gagaAction === 'save-reading') return;"));
  assert.ok(!notch.includes("document.addEventListener('pointerover'"));
});

test('reviewed UI is still rejected by the unchanged historical production preservation admission', () => {
 const historical = execFileSync('git',['show',base+':tools/gaga/preservation.mjs'],{encoding:'utf8'});
 const r=spawnSync(process.execPath,['--input-type=module','-e',historical],{encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI\/style\/routing change/);
});

test('outline has explicit empty, short, fallback and non-reading route semantics', () => {
 const heading={slug:'intro',text:'Introduction'},fallback={slug:'_top',text:'Title'};
 assert.deepEqual(outlineForRoute([], '/publications/short', 'article'), []);
 assert.deepEqual(outlineForRoute([fallback], '/publications/short', 'article'), []);
 assert.deepEqual(outlineForRoute([fallback,heading], '/publications/short', 'article'), [heading]);
 assert.deepEqual(outlineForRoute([heading], '/saved', 'saved'), []);
 assert.deepEqual(outlineForRoute([heading], '/', 'index'), []);
});
