import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const performance = readJson('architecture/performance-budget.json');
const accessibility = readJson('architecture/accessibility-policy.json');
const security = readJson('architecture/security-privacy-policy.json');
const failures = [];
const fail = (message) => failures.push(message);
const normalize = (file) => file.split(path.sep).join('/');

function walk(dir, matcher = () => true) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(file, matcher));
    else if (matcher(file)) result.push(file);
  }
  return result;
}

for (const [file, schema] of [
  ['architecture/performance-budget.json', 'gaga.performance-budget.v1'],
  ['architecture/accessibility-policy.json', 'gaga.accessibility-policy.v1'],
  ['architecture/security-privacy-policy.json', 'gaga.security-privacy-policy.v1']
]) {
  const value = readJson(file);
  if (value.schema !== schema) fail(`${file}: expected schema ${schema}`);
}

const runtimeFiles = walk(path.join(root, 'src/scripts'), (file) => /\.(?:ts|js|mjs)$/.test(file));
const runtimeSizes = runtimeFiles.map((file) => ({ file, bytes: fs.statSync(file).size }));
const runtimeTotal = runtimeSizes.reduce((sum, item) => sum + item.bytes, 0);
const largestRuntime = runtimeSizes.reduce(
  (largest, item) => item.bytes > largest.bytes ? item : largest,
  { file: '', bytes: 0 }
);
if (runtimeTotal > performance.source.maxTotalRuntimeSourceBytes) {
  fail(`runtime source total ${runtimeTotal} B exceeds ${performance.source.maxTotalRuntimeSourceBytes} B`);
}
if (largestRuntime.bytes > performance.source.maxLargestRuntimeModuleBytes) {
  fail(`largest runtime module ${normalize(path.relative(root, largestRuntime.file))} ${largestRuntime.bytes} B exceeds ${performance.source.maxLargestRuntimeModuleBytes} B`);
}

const styleFiles = walk(path.join(root, 'src/styles'), (file) => /\.(?:scss|css)$/.test(file));
const styleTotal = styleFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
if (styleTotal > performance.source.maxTotalStyleSourceBytes) {
  fail(`style source total ${styleTotal} B exceeds ${performance.source.maxTotalStyleSourceBytes} B`);
}

const sourceFiles = walk(path.join(root, 'src'), (file) => /\.(?:astro|ts|tsx|js|mjs|css|scss)$/.test(file));
const storageAllowlist = new Set(security.browserStorage.transitionalAllowlist);
const innerHtmlAllowlist = new Set(security.domMutation.transitionalAllowlist);
const iframeAllowlist = new Set(security.embeds.allowedIframeFiles);
const storageFiles = new Set();
const innerHtmlFiles = new Set();
const iframeFiles = new Set();
let hydration = 0;
let remoteStylesheets = 0;
let autoplay = 0;
let preloadAuto = 0;
let imageCount = 0;

for (const file of sourceFiles) {
  const rel = normalize(path.relative(root, file));
  const text = fs.readFileSync(file, 'utf8');

  if (/client:(?:load|idle|visible|media|only)/.test(text)) {
    hydration += 1;
    if (!performance.source.allowClientHydrationDirectives) fail(`${rel}: client hydration directive detected`);
  }
  if (/(?:@import|<link[^>]+stylesheet)[^\n>]*https?:\/\//i.test(text)) {
    remoteStylesheets += 1;
    if (!performance.source.allowRemoteStylesheets) fail(`${rel}: remote stylesheet detected`);
  }
  if (/<(?:video|audio)\b[^>]*\bautoplay\b/i.test(text)) {
    autoplay += 1;
    if (!performance.source.allowAutoplayMedia) fail(`${rel}: autoplay media detected`);
  }
  if (/<video\b[^>]*\bpreload\s*=\s*["']auto["']/i.test(text)) {
    preloadAuto += 1;
    if (!performance.source.allowVideoPreloadAuto) fail(`${rel}: video preload=auto detected`);
  }

  const hardSecurityRules = [
    [/(^|[^\w])eval\s*\(/m, 'eval()'],
    [/new\s+Function\s*\(/, 'new Function()'],
    [/document\.write\s*\(/, 'document.write()'],
    [/<[^>]+\son[a-z]+\s*=/i, 'inline event handler'],
    [/(?:href|src)\s*=\s*["']javascript:/i, 'javascript: URL']
  ];
  for (const [pattern, label] of hardSecurityRules) {
    if (pattern.test(text)) fail(`${rel}: forbidden ${label}`);
  }

  if (/(?:window\.)?(?:localStorage|sessionStorage)\b|document\.cookie\b/.test(text)) {
    storageFiles.add(rel);
    if (!storageAllowlist.has(rel)) fail(`${rel}: direct browser storage access is outside the transitional allowlist`);
  }
  if (/\.innerHTML\b|insertAdjacentHTML\s*\(/.test(text)) {
    innerHtmlFiles.add(rel);
    if (!innerHtmlAllowlist.has(rel)) fail(`${rel}: string HTML mutation is outside the transitional allowlist`);
  }

  if (file.endsWith('.astro')) {
    for (const match of text.matchAll(/<img\b[\s\S]*?>/gi)) {
      imageCount += 1;
      if (accessibility.source.requireImageAltAttribute && !/\balt\s*=/.test(match[0])) {
        fail(`${rel}: img is missing alt`);
      }
    }
    for (const match of text.matchAll(/<iframe\b[\s\S]*?>/gi)) {
      iframeFiles.add(rel);
      if (!iframeAllowlist.has(rel)) fail(`${rel}: iframe is outside the governed embed component`);
      if (security.embeds.requireSandbox && !/\bsandbox\s*=/.test(match[0])) fail(`${rel}: iframe is missing sandbox`);
      if (security.embeds.requireLazyLoading && !/\bloading\s*=\s*["']lazy["']/.test(match[0])) fail(`${rel}: iframe is missing loading="lazy"`);
      if (security.embeds.requireTitle && !/\btitle\s*=/.test(match[0])) fail(`${rel}: iframe is missing title`);
    }
  }
}

for (const allowed of storageAllowlist) {
  if (!storageFiles.has(allowed)) fail(`${allowed}: stale browser-storage allowlist entry`);
}
for (const allowed of innerHtmlAllowlist) {
  if (!innerHtmlFiles.has(allowed)) fail(`${allowed}: stale innerHTML allowlist entry`);
}
for (const allowed of iframeAllowlist) {
  if (!iframeFiles.has(allowed)) fail(`${allowed}: stale iframe allowlist entry`);
}

const skipLink = fs.readFileSync(path.join(root, 'src/components/ui/SkipLink.astro'), 'utf8');
if (!skipLink.includes(`href="${accessibility.source.requiredSkipHref}"`)) {
  fail(`SkipLink must target ${accessibility.source.requiredSkipHref}`);
}
const frame = fs.readFileSync(path.join(root, 'src/components/frame/AppFrameBase.astro'), 'utf8');
if (!frame.includes(`id="${accessibility.source.requiredMainId}"`)) {
  fail(`AppFrameBase must expose id="${accessibility.source.requiredMainId}"`);
}
if (!frame.includes('tabindex="-1"')) fail('AppFrameBase main region must be programmatically focusable');
const layout = fs.readFileSync(path.join(root, 'src/components/gaga/GagaSiteLayout.astro'), 'utf8');
if (!/<html\s+[\s\S]*lang=/.test(layout)) fail('GagaSiteLayout must expose document language semantics');

if (failures.length) {
  console.error('GAGA policy-as-code source audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA policy-as-code source audit OK');
console.log(`✓ runtime source: ${runtimeTotal} B / ${performance.source.maxTotalRuntimeSourceBytes} B`);
console.log(`✓ largest runtime module: ${largestRuntime.bytes} B / ${performance.source.maxLargestRuntimeModuleBytes} B`);
console.log(`✓ style source: ${styleTotal} B / ${performance.source.maxTotalStyleSourceBytes} B`);
console.log(`✓ hydration directives: ${hydration}`);
console.log(`✓ remote stylesheets: ${remoteStylesheets}`);
console.log(`✓ autoplay media: ${autoplay}`);
console.log(`✓ preload=auto video: ${preloadAuto}`);
console.log(`✓ governed storage files: ${storageFiles.size}`);
console.log(`✓ governed string-HTML mutation files: ${innerHtmlFiles.size}`);
console.log(`✓ governed iframe files: ${iframeFiles.size}`);
console.log(`✓ image alt contracts checked: ${imageCount}`);
console.log('NOTE: browser performance/accessibility scores and deployment security headers still require measured/live evidence.');
