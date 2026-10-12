import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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
  'src/config/experience.ts',
  'src/config/workspaces.ts',
  'src/config/shell-context.ts',
  'architecture/performance-budget.json',
  'architecture/accessibility-policy.json',
  'architecture/security-privacy-policy.json',
  'tools/audit-policy-source.mjs',
  'src/config/discovery.ts',
  'src/lib/discovery.ts',
  'src/pages/machine.json.ts',
  'src/pages/agent.json.ts',
  'src/pages/llms.txt.ts',
  'architecture/discovery-policy.json',
  'tools/audit-discovery-source.mjs',
  'architecture/reading-continuity-policy.json',
  'architecture/freshness-policy.json',
  'src/config/freshness.ts',
  'tools/audit-continuity-freshness-source.mjs',
  'architecture/local-development-policy.json',
  'scripts/local-env.sh',
  'preview_local.command',
  'tools/audit-local-dx-source.mjs',
  'architecture/editorial-projection-policy.json',
  'src/config/editorial-schema.ts',
  'src/lib/editorial.ts',
  'src/components/reader/EditorialFront.astro',
  'tools/audit-editorial-projection.mjs',
  'architecture/section-front-policy.json',
  'src/components/reader/SectionFront.astro',
  'src/pages/sections/[slug].astro',
  'tools/audit-section-fronts.mjs',
  'architecture/coverage-policy.json',
  'src/config/coverage.ts',
  'src/lib/coverage.ts',
  'src/components/coverage/CoverageTimeline.astro',
  'tools/audit-coverage-foundation.mjs'
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


const nativeLayout = fs.readFileSync('src/components/gaga/GagaSiteLayout.astro', 'utf8');
for (const marker of ['data-gaga-publishing-shell="native"', 'data-gaga-workspace=', 'resolveGagaWorkspace']) {
  if (!nativeLayout.includes(marker)) {
    console.error(`Native publishing shell workspace contract missing: ${marker}`);
    process.exit(1);
  }
}


const shellContext = fs.readFileSync('src/config/shell-context.ts', 'utf8');
for (const marker of ['resolveGagaShellContext', 'context-first', 'rightPriority']) {
  if (!shellContext.includes(marker)) {
    console.error(`Shell context contract missing: ${marker}`);
    process.exit(1);
  }
}

for (const marker of [
  'data-gaga-context-intent=',
  'data-gaga-context-left=',
  'data-gaga-context-right=',
  'data-gaga-context-mobile=',
  'data-gaga-context-priority='
]) {
  if (!nativeLayout.includes(marker)) {
    console.error(`Native layout context projection missing: ${marker}`);
    process.exit(1);
  }
}

const policyAudit = spawnSync(process.execPath, ['tools/audit-policy-source.mjs'], { stdio: 'inherit' });
if (policyAudit.status !== 0) {
  process.exit(policyAudit.status ?? 1);
}

const discoveryAudit = spawnSync(process.execPath, ['tools/audit-discovery-source.mjs'], { stdio: 'inherit' });
if (discoveryAudit.status !== 0) {
  process.exit(discoveryAudit.status ?? 1);
}

const continuityFreshnessAudit = spawnSync(process.execPath, ['tools/audit-continuity-freshness-source.mjs'], { stdio: 'inherit' });
if (continuityFreshnessAudit.status !== 0) {
  process.exit(continuityFreshnessAudit.status ?? 1);
}

const localDxAudit = spawnSync(process.execPath, ['tools/audit-local-dx-source.mjs'], { stdio: 'inherit' });
if (localDxAudit.status !== 0) {
  process.exit(localDxAudit.status ?? 1);
}

const editorialAudit = spawnSync(process.execPath, ['tools/audit-editorial-projection.mjs'], { stdio: 'inherit' });
if (editorialAudit.status !== 0) {
  process.exit(editorialAudit.status ?? 1);
}

const sectionFrontAudit = spawnSync(process.execPath, ['tools/audit-section-fronts.mjs'], { stdio: 'inherit' });
if (sectionFrontAudit.status !== 0) {
  process.exit(sectionFrontAudit.status ?? 1);
}

const coverageAudit = spawnSync(process.execPath, ['tools/audit-coverage-foundation.mjs'], { stdio: 'inherit' });
if (coverageAudit.status !== 0) {
  process.exit(coverageAudit.status ?? 1);
}

console.log('Signature contract OK');
