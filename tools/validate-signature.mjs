import fs from 'node:fs';
import path from 'node:path';

const required = [
  'src/config/capabilities.ts',
  'src/config/actions.ts',
  'src/config/routes.ts',
  'src/config/design.ts',
  'src/components/frame/GlobalNavigationRail.astro',
  'src/components/frame/LeftRail.astro',
  'src/components/frame/MainCanvas.astro',
  'src/components/frame/RightInfoRail.astro',
  'src/components/frame/GagaDock.astro',
  'src/components/gaga/GagaSiteLayout.astro',
  'src/components/gaga/PageFrame.astro',
  'src/components/gaga/MarkdownContent.astro',
  'src/config/experience.ts'
];

const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error('Missing signature files:', missing);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const name of ['@gaga/engine', '@gaga/engine-web', '@gaga/engine-astro']) {
  if (pkg.dependencies?.[name] !== '0.1.6') {
    console.error(`${name} must be pinned to 0.1.6`);
    process.exit(1);
  }
}

if (pkg.dependencies?.['@astrojs/starlight'] || pkg.devDependencies?.['@astrojs/starlight']) {
  console.error('Legacy Starlight dependency is not allowed in the native GAGA publishing shell.');
  process.exit(1);
}

function sourceFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const resolved = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(resolved));
    else if (/\.(astro|ts|tsx|js|mjs|css|scss)$/.test(entry.name)) files.push(resolved);
  }
  return files;
}

const legacyPatterns = [
  /starlight/i,
  /toStarlightSidebar/,
  /--sl-/,
  /\.sl-container/
];

const legacyHits = [];
for (const file of sourceFiles('src')) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of legacyPatterns) {
    if (pattern.test(text)) {
      legacyHits.push(`${file}: ${pattern}`);
    }
  }
}

if (legacyHits.length) {
  console.error('Legacy Starlight surface remains in active source:', legacyHits);
  process.exit(1);
}

console.log('Signature contract OK');
