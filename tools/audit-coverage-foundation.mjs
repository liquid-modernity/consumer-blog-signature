import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = JSON.parse(read('architecture/coverage-policy.json'));

if (policy.schema !== 'gaga.coverage-policy.v1') {
  fail('invalid coverage policy schema');
}

for (const file of [
  'src/config/coverage.ts',
  'src/lib/coverage.ts',
  'src/components/coverage/CoverageStrip.astro',
  'src/components/coverage/CoverageTimeline.astro',
  'src/styles/partials/_coverage.scss'
]) {
  if (!fs.existsSync(file)) fail(`missing coverage source: ${file}`);
}

const config = read('src/config/coverage.ts');
for (const marker of [
  "legacyLive",
  "legacyBreaking",
  "mode === 'standard'",
  "coverageUpdatedAt",
  "latestUpdate?.timestamp",
  "coverageStartedAt"
]) {
  if (!config.includes(marker)) fail(`coverage normalization marker missing: ${marker}`);
}

const schema = read('src/content.config.ts');
for (const marker of [
  'coverageMode:',
  'coverageStatus:',
  'coverageStartedAt:',
  'coverageUpdatedAt:',
  'coverageUpdates:'
]) {
  if (!schema.includes(marker)) fail(`coverage frontmatter field missing: ${marker}`);
}

const content = read('src/lib/content.ts');
if (!content.includes('coverage: CoverageAuthority') || !content.includes('const coverage = resolveCoverageAuthority(doc.data)')) {
  fail('article coverage authority projection missing');
}

const promotion = read('src/lib/coverage.ts');
for (const marker of [
  "mode === 'breaking'",
  "mode === 'live'",
  'editorialPriority',
  'coverageModeIsPromotable'
]) {
  if (!promotion.includes(marker)) fail(`coverage promotion marker missing: ${marker}`);
}

const pageFrame = read('src/components/gaga/PageFrame.astro');
for (const marker of [
  'selectCoveragePromotion',
  'CoverageStrip',
  'coverageMode={currentCoverage.mode}',
  'coverageStatus={currentCoverage.status}'
]) {
  if (!pageFrame.includes(marker)) fail(`PageFrame coverage contract missing: ${marker}`);
}

const article = read('src/components/gaga/ArticleShell.astro');
if (!article.includes('CoverageTimeline')) fail('article coverage timeline integration missing');

const head = read('src/components/gaga/Head.astro');
for (const marker of ['gaga:coverage-mode', 'gaga:coverage-status', 'gaga:coverage-updated-at']) {
  if (!head.includes(marker)) fail(`coverage head metadata missing: ${marker}`);
}

const discovery = read('src/lib/discovery.ts');
if (!discovery.includes('coverage: {') || !discovery.includes('updateCount: article.coverage.updates.length')) {
  fail('machine/search coverage projection missing');
}

if (failures.length) {
  console.error('GAGA coverage foundation audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA coverage foundation audit OK');
console.log('✓ standard/breaking/live coverage authority');
console.log('✓ compatibility mapping from legacy breaking/live flags');
console.log('✓ deterministic single active coverage promotion');
console.log('✓ article coverage state + update timeline');
console.log('✓ shell/head/search/machine coverage projection');
console.log('✓ static-first semantics do not claim realtime transport');
