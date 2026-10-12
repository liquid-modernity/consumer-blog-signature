import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = JSON.parse(read('architecture/context-aware-surfaces-policy.json'));

if (policy.schema !== 'gaga.context-aware-surfaces-policy.v1') {
  fail('invalid context-aware surfaces policy schema');
}

for (const file of [
  'src/config/signature-surfaces.ts',
  'src/config/context-rails.ts',
  'src/gaga/extraction/signature-surface-contract.ts',
  'src/components/frame/GlobalNavigationRail.astro',
  'src/components/frame/LeftRail.astro',
  'src/components/frame/RightInfoRail.astro'
]) {
  if (!fs.existsSync(file)) fail(`missing context surface source: ${file}`);
}

const globalNav = read('src/components/frame/GlobalNavigationRail.astro');
if (!globalNav.includes('globalNavigationProjection')) {
  fail('Dynamic Global Navigation must consume the canonical navigation projection');
}
if (!globalNav.includes('data-gaga-signature-surface="dynamic-global-navigation"')) {
  fail('Dynamic Global Navigation ownership marker missing');
}

const left = read('src/components/frame/LeftRail.astro');
for (const forbidden of ['SearchBox', 'gaga-brand__dot', 'class="gaga-brand"']) {
  if (left.includes(forbidden)) fail(`left context rail still owns duplicate global capability: ${forbidden}`);
}
if (!left.includes('data-gaga-global-navigation-projection')) {
  fail('compact global-navigation projection missing from left drawer');
}
if (!left.includes('data-gaga-signature-surface="context-left-rail"')) {
  fail('left context rail ownership marker missing');
}

const app = read('src/components/frame/AppFrameBase.astro');
if (app.includes('ContextSurfaceTrigger')) {
  fail('floating ContextSurfaceTrigger still duplicates Dynamic Notch Island');
}

const experience = read('src/config/experience.ts');
if (experience.includes("'context-info', 'info-rail'")) {
  fail('Dynamic Notch Island still exposes duplicate context-info/info-rail controls');
}
if (!experience.includes("'context-info'")) {
  fail('Dynamic Notch Island must own context surface triggering');
}

const shell = read('src/config/shell-context.ts');
if (shell.includes("'outline'")) {
  fail('right rail context priority still claims outline ownership');
}

const right = read('src/components/frame/RightInfoRail.astro');
if (right.includes('TocBlock') || right.includes('gaga-info-block--toc')) {
  fail('right context rail still renders article outline');
}
if (!right.includes('data-gaga-signature-surface="context-right-rail"')) {
  fail('right context rail ownership marker missing');
}

const outline = read('src/components/frame/ArticleOutlinePeek.astro');
if (!outline.includes('data-gaga-surface="dynamic-outline-peek"')) {
  fail('Dynamic Outline Peek ownership marker missing');
}

const pageFrame = read('src/components/gaga/PageFrame.astro');
for (const marker of ['projectContextRail', '<LeftRail', '<RightInfoRail']) {
  if (!pageFrame.includes(marker)) fail(`native route context integration missing: ${marker}`);
}

const standalone = read('src/components/frame/StandaloneAppFrame.astro');
for (const marker of ['resolveGagaWorkspace', 'resolveGagaShellContext', 'projectContextRail']) {
  if (!standalone.includes(marker)) fail(`standalone route context integration missing: ${marker}`);
}

const extraction = read('src/gaga/extraction/signature-surface-contract.ts');
for (const marker of ['engineCandidates', 'siteOwned', 'extractionRule']) {
  if (!extraction.includes(marker)) fail(`engine extraction boundary missing: ${marker}`);
}


const inputs = read('src/components/frame/component-inputs.ts');
const searchPrimitive = 'src/components/navigation/SearchBox.astro';
if (fs.existsSync(searchPrimitive) && !inputs.includes('export type SearchBoxInput')) {
  fail('SearchBox primitive exists but SearchBoxInput contract was removed');
}
if (inputs.includes("export type RightRailMode = 'outline'")) {
  fail('right rail type contract still exposes outline ownership');
}

const rightRailSource = read('src/components/frame/RightInfoRail.astro');
if (rightRailSource.includes('const Meta = () =>')) {
  fail('RightInfoRail must not return Astro markup from frontmatter TypeScript');
}
if (!rightRailSource.includes("import RightRailMeta from './RightRailMeta.astro'")) {
  fail('RightInfoRail metadata rendering must use the dedicated RightRailMeta component');
}
if (!fs.existsSync('src/components/frame/RightRailMeta.astro')) {
  fail('RightRailMeta component missing');
}

if (failures.length) {
  console.error('GAGA context-aware surface audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA context-aware surface audit OK');
console.log('✓ Dynamic Global Navigation is the sole global destination authority');
console.log('✓ Dynamic Notch Island owns context-surface triggering');
console.log('✓ Dynamic Outline Peek is the sole article outline surface');
console.log('✓ left rail is route-local context; right rail is context intelligence');
console.log('✓ native and standalone routes share the same workspace/context contract');
console.log('✓ reusable signature contracts have an explicit Gaga Engine extraction boundary');
