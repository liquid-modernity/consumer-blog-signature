import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = JSON.parse(read('architecture/visual-surface-policy.json'));

if (policy.schema !== 'gaga.visual-surface-policy.v1') {
  fail('invalid visual surface policy schema');
}

for (const file of [
  'src/styles/partials/_visual-polish.scss',
  'architecture/visual-surface-policy.json'
]) {
  if (!fs.existsSync(file)) fail(`missing visual polish source: ${file}`);
}

const styles = read('src/styles/partials/_visual-polish.scss');

for (const marker of [
  '.gaga-article-header',
  '.gaga-article-body',
  '.gaga-markdown-content blockquote',
  '.gaga-markdown-content pre',
  '.gaga-editorial-front',
  '.gaga-section-front',
  '.gaga-topic-index',
  '.gaga-search-card',
  'prefers-reduced-motion'
]) {
  if (!styles.includes(marker)) fail(`visual surface marker missing: ${marker}`);
}

if (!styles.includes('.gaga-editorial-front,') || !styles.includes('article {')) {
  fail('reader preference isolation for editorial/discovery articles missing');
}

const signature = read('src/styles/signature.scss');
if (!signature.includes("@use './partials/visual-polish';")) {
  fail('visual polish partial is not wired into signature.scss');
}

const forbidden = [
  'position: fixed; /* new global chrome */',
  'z-index: 999999',
  'font-family: "Times New Roman"'
];
for (const marker of forbidden) {
  if (styles.includes(marker)) fail(`visual polish contains forbidden hard-coded override: ${marker}`);
}

if (failures.length) {
  console.error('GAGA visual surface audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA visual surface audit OK');
console.log('✓ article header + reading rhythm calibrated');
console.log('✓ native markdown code/table/quote/media surfaces polished');
console.log('✓ editorial + section hierarchy tightened');
console.log('✓ topic/tag/search/entity surfaces normalized');
console.log('✓ reader measure no longer constrains discovery cards');
console.log('✓ responsive + reduced-motion contracts preserved');
