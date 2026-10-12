import fs from 'node:fs';
import path from 'node:path';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = JSON.parse(read('architecture/route-visual-review-policy.json'));

if (policy.schema !== 'gaga.route-visual-review-policy.v1') fail('invalid route visual review policy schema');

const reader = read('src/styles/partials/_reader.scss');
if (/body\[data-gaga-reader-font-family=['"][^'"]+['"]\]\s*\{[^}]*\n\s*font-family\s*:/m.test(reader)) {
  fail('reader font-family preference still mutates the whole body/application shell');
}
if (reader.includes("body[data-gaga-reader-links='plain'] article a")) fail('reader links still target every article card');
if (/^article,\s*$/m.test(reader)) fail('reader typography still targets all article elements');

const visual = read('src/styles/partials/_visual-polish.scss');
for (const marker of [
  '.gaga-index-screen',
  '.gaga-archive-log { position: relative',
  '.gaga-author-card',
  '.gaga-search-workspace__row',
  "data-gaga-workspace-mode='reference'",
  '.gaga-system-screen h1',
  '.gaga-contact-card'
]) {
  if (!visual.includes(marker)) fail(`route visual correction marker missing: ${marker}`);
}

const landing = read('src/pages/landing.astro');
if (landing.includes('style=')) fail('landing still contains inline presentation style');
if (!landing.includes('gaga-landing-kicker')) fail('landing kicker class missing');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const styles = walk('src/styles').filter((file) => /\.(css|scss)$/i.test(file));
const bytes = styles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const reserve = 196608 - bytes;
if (reserve < policy.cssSourceReserveBytes) {
  fail(`style source reserve too small: ${reserve} B remaining; require ${policy.cssSourceReserveBytes} B`);
}

if (failures.length) {
  console.error('GAGA route visual closure audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA route visual closure audit OK');
console.log('✓ reader preferences are scoped to reading surfaces');
console.log('✓ route-specific visual corrections are present');
console.log('✓ landing route has no inline presentation style');
console.log(`✓ style source reserve: ${reserve} B`);
