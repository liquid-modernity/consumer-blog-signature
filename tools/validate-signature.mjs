import fs from 'node:fs';
const required = [
  'src/config/capabilities.ts','src/config/actions.ts','src/config/routes.ts','src/config/design.ts',
  'src/components/frame/GlobalNavigationRail.astro','src/components/frame/LeftRail.astro',
  'src/components/frame/MainCanvas.astro','src/components/frame/RightInfoRail.astro','src/components/frame/GagaDock.astro',
  'src/config/experience.ts'
];
const missing = required.filter(file => !fs.existsSync(file));
if (missing.length) { console.error('Missing signature files:', missing); process.exit(1); }
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
for (const name of ['@gaga/engine','@gaga/engine-web','@gaga/engine-astro']) {
  if (pkg.dependencies?.[name] !== '0.1.6') { console.error(`${name} must be pinned to 0.1.6`); process.exit(1); }
}
console.log('Signature contract OK');
