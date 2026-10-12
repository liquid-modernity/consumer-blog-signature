import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = JSON.parse(read('architecture/section-front-policy.json'));

if (policy.schema !== 'gaga.section-front-policy.v1') {
  fail('invalid section front policy schema');
}

for (const file of [
  'src/pages/sections/index.astro',
  'src/pages/sections/[slug].astro',
  'src/components/reader/SectionIndex.astro',
  'src/components/reader/SectionFront.astro',
  'src/styles/partials/_section-front.scss'
]) {
  if (!fs.existsSync(file)) fail(`missing section-front source: ${file}`);
}

const editorial = read('src/lib/editorial.ts');
for (const marker of ['deriveEditorialSections', 'getEditorialSections', 'getEditorialSectionFront', "href: `/sections/${slug}`"]) {
  if (!editorial.includes(marker)) fail(`section registry marker missing: ${marker}`);
}

const detail = read('src/pages/sections/[slug].astro');
for (const marker of ['getStaticPaths', 'getEditorialSections', 'getEditorialSectionFront', "Astro.redirect('/404')"]) {
  if (!detail.includes(marker)) fail(`section detail route marker missing: ${marker}`);
}

const workspace = read('src/config/workspaces.ts');
if (!workspace.includes("{ id: 'sections', href: '/sections'")) {
  fail('sections workspace missing');
}

const nav = read('src/config/nav.ts');
if (!nav.includes("item('sections', 'navigation.sections', '/sections'")) {
  fail('sections primary navigation item missing');
}

const sitemap = read('src/pages/sitemap-index.xml.ts');
if (!sitemap.includes('getEditorialSections') || !sitemap.includes('/sections')) {
  fail('sections missing from sitemap projection');
}

const discovery = read('src/lib/discovery.ts');
if (!discovery.includes("'section'") || !discovery.includes('getEditorialSections')) {
  fail('sections missing from machine/search discovery');
}


for (const component of [
  'src/components/reader/SectionIndex.astro',
  'src/components/reader/SectionFront.astro'
]) {
  const source = read(component);

  if (!source.includes('resolveContentDateLocale')) {
    fail(`${component}: section previews must resolve ContentDateLocaleConfig into Intl.LocalesArgument`);
  }

  if (source.includes('toArticlePreview(section.lead.article, contentDefaults.dateLocale')) {
    fail(`${component}: do not pass contentDefaults.dateLocale directly to toArticlePreview`);
  }

  if (/toArticlePreview\([^)]*,\s*locale\s*,/.test(source)) {
    fail(`${component}: unresolved locale object passed to toArticlePreview`);
  }
}

if (failures.length) {
  console.error('GAGA section front audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA section front audit OK');
console.log('✓ first-class /sections workspace');
console.log('✓ static section detail routes');
console.log('✓ section fronts reuse editorial hierarchy');
console.log('✓ sections participate in nav, sitemap, search/machine discovery');
console.log('✓ section identity remains derived from canonical article metadata');
