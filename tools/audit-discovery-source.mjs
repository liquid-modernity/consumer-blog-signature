import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = JSON.parse(read('architecture/discovery-policy.json'));

if (policy.schema !== 'gaga.discovery-policy.v1') {
  fail('architecture/discovery-policy.json: invalid schema');
}

const requiredFiles = [
  'src/config/discovery.ts',
  'src/lib/discovery.ts',
  'src/pages/search-index.json.ts',
  'src/pages/machine.json.ts',
  'src/pages/agent.json.ts',
  'src/pages/llms.txt.ts',
  'src/components/seo/SeoHead.astro'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) fail(`missing discovery source: ${file}`);
}

const config = read('src/config/discovery.ts');
for (const endpoint of policy.requiredEndpoints) {
  if (!config.includes(endpoint)) fail(`discovery config missing endpoint ${endpoint}`);
}

const search = read('src/pages/search-index.json.ts');
for (const marker of ['schema:', 'items,', 'records']) {
  if (!search.includes(marker)) fail(`search-index compatibility marker missing: ${marker}`);
}

const machine = read('src/pages/machine.json.ts');
if (!machine.includes('buildMachineIndex')) fail('machine.json must be generated from the shared public discovery projection');

const agent = read('src/pages/agent.json.ts');
for (const marker of [
  'standard: false',
  'autonomousPublishing: false',
  'autonomousEditing: false',
  'autonomousSubmission: false',
  'consequentialActions: false'
]) {
  if (!agent.includes(marker)) fail(`agent boundary missing: ${marker}`);
}

const llms = read('src/pages/llms.txt.ts');
for (const marker of ['not a formal web standard', 'Machine-readable discovery', 'Content boundary']) {
  if (!llms.includes(marker)) fail(`llms.txt evidence boundary missing: ${marker}`);
}

const seo = read('src/components/seo/SeoHead.astro');
for (const marker of ['/machine.json', '/agent.json', '/search-index.json', '/llms.txt']) {
  if (!seo.includes(marker)) fail(`SeoHead discovery advertisement missing: ${marker}`);
}

const projection = read('src/lib/discovery.ts');
for (const marker of ['getArticles()', 'getAuthors()', 'getTopicGroups()', 'getTagGroups()', 'GAGA_WORKSPACES']) {
  if (!projection.includes(marker)) fail(`public discovery projection missing source: ${marker}`);
}

if (failures.length) {
  console.error('GAGA discovery source audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA discovery source audit OK');
console.log(`✓ required discovery endpoints: ${policy.requiredEndpoints.length}`);
console.log('✓ search compatibility: legacy items + rich records');
console.log('✓ machine index: shared public projection');
console.log('✓ agent boundary: descriptive/read-only');
console.log('✓ llms.txt: informational/non-standard boundary');
console.log('NOTE: endpoint availability and payload correctness still require generated/live evidence.');
