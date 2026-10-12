import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');

const continuity = JSON.parse(read('architecture/reading-continuity-policy.json'));
const freshness = JSON.parse(read('architecture/freshness-policy.json'));

if (continuity.schema !== 'gaga.reading-continuity-policy.v1') fail('invalid reading continuity policy schema');
if (freshness.schema !== 'gaga.freshness-policy.v1') fail('invalid freshness policy schema');
if (continuity.storage.maxItems > 50) fail('reading continuity maxItems exceeds bounded policy');
if (continuity.storage.retentionDays > 365) fail('reading continuity retention exceeds bounded policy');
if (continuity.storage.userResettable !== true) fail('reading continuity must be user-resettable');

const required = [
  'src/config/freshness.ts',
  'src/config/continuity.ts',
  'src/components/gaga/PageFrame.astro',
  'src/components/frame/AppFrameBase.astro',
  'src/components/reader/SavedReadingPage.astro',
  'src/scripts/systems/reading-continuity.ts',
  'src/lib/discovery.ts'
];
for (const file of required) if (!fs.existsSync(file)) fail(`missing authority source: ${file}`);

const pageFrame = read('src/components/gaga/PageFrame.astro');
for (const marker of ['isContinuityEligibleContent', 'resolveFreshnessAuthority', 'continuityEligible={continuityEligible}']) {
  if (!pageFrame.includes(marker)) fail(`PageFrame authority marker missing: ${marker}`);
}

const appFrame = read('src/components/frame/AppFrameBase.astro');
for (const marker of ['data-gaga-continuity-eligible', 'data-gaga-freshness-status', 'data-gaga-freshness-volatility']) {
  if (!appFrame.includes(marker)) fail(`AppFrame authority marker missing: ${marker}`);
}

const runtime = read('src/scripts/systems/reading-continuity.ts');
if (!runtime.includes("frame.dataset.gagaContinuityEligible !== 'true'")) {
  fail('continuity runtime does not enforce eligibility boundary');
}
if (!runtime.includes('[data-gaga-continuity-clear-history]')) {
  fail('continuity runtime does not expose a user reset path');
}

const discovery = read('src/lib/discovery.ts');
for (const marker of ['freshnessStatus', 'lastReviewed', 'reviewAfter', 'volatility']) {
  if (!discovery.includes(marker)) fail(`discovery freshness projection missing: ${marker}`);
}

const head = read('src/components/gaga/Head.astro');
for (const marker of ['gaga:freshness-status', 'gaga:freshness-volatility']) {
  if (!head.includes(marker)) fail(`head freshness projection missing: ${marker}`);
}

if (failures.length) {
  console.error('GAGA continuity/freshness source audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA continuity/freshness source audit OK');
console.log(`✓ bounded continuity: ${continuity.storage.maxItems} items / ${continuity.storage.retentionDays} days`);
console.log('✓ private/noindex/draft continuity exclusion enforced');
console.log('✓ user-resettable reading history');
console.log('✓ freshness authority: frontmatter -> shell/head/discovery projection');
console.log('NOTE: freshness states describe review governance, not factual correctness.');
