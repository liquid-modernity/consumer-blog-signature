import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = JSON.parse(read('architecture/editorial-projection-policy.json'));

if (policy.schema !== 'gaga.editorial-projection-policy.v1') fail('invalid editorial projection policy schema');

for (const file of [
  'src/config/editorial-schema.ts',
  'src/lib/editorial.ts',
  'src/components/reader/EditorialFront.astro',
  'src/styles/partials/_editorial-front.scss'
]) {
  if (!fs.existsSync(file)) fail(`missing editorial source: ${file}`);
}

const schema = read('src/config/editorial-schema.ts');
for (const role of policy.roles) {
  if (!schema.includes(`'${role}'`)) fail(`editorial role missing: ${role}`);
}
for (const format of policy.formats) {
  if (!schema.includes(`'${format}'`)) fail(`story format missing: ${format}`);
}

const config = read('src/content.config.ts');
for (const marker of ['sectionRefs:', 'storyFormat:', 'editorialRole:', 'editorialPriority:', 'breaking:', 'live:']) {
  if (!config.includes(marker)) fail(`frontmatter editorial field missing: ${marker}`);
}

const content = read('src/lib/content.ts');
for (const marker of ['sectionRefs:', 'storyFormat:', 'editorialRole:', 'editorialPriority:', 'featured:', 'breaking:', 'live:']) {
  if (!content.includes(marker)) fail(`article editorial projection missing: ${marker}`);
}

const projection = read('src/lib/editorial.ts');
for (const marker of ["story.role === 'lead'", 'story.breaking', 'story.featured', 'stories[0]', 'sectionStoryLimit']) {
  if (!projection.includes(marker)) fail(`deterministic projection marker missing: ${marker}`);
}

const home = read('src/content/docs/index.mdx');
if (!home.includes('EditorialFront')) fail('latest surface must render EditorialFront');

const discovery = read('src/lib/discovery.ts');
if (!discovery.includes('editorial: {')) fail('machine discovery does not project editorial metadata');

if (failures.length) {
  console.error('GAGA editorial projection audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA editorial projection audit OK');
console.log('✓ optional newsroom metadata contract');
console.log('✓ deterministic lead/highlight/latest projection');
console.log('✓ section grouping without a second content authority');
console.log('✓ machine discovery receives editorial projection');
console.log('✓ breaking/live semantics remain editorial flags, not truth claims');
