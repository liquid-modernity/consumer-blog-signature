import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const lock = JSON.parse(fs.readFileSync(path.join(root, 'architecture', 'catalina-toolchain-lock.json'), 'utf8'));
const failures = [];
const notes = [];

function readJson(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function expectVersion(label, rel, expected) {
  const pkg = readJson(rel);
  if (!pkg) {
    failures.push(`${label}: missing (${rel})`);
    return;
  }
  if (pkg.version !== expected) failures.push(`${label}: expected ${expected}, got ${pkg.version}`);
  else notes.push(`${label} ${pkg.version}`);
}

const [major, minor] = process.versions.node.split('.').map(Number);
if (!(major === 22 && minor >= 13 && major < 23)) {
  failures.push(`Node: expected 22.13+ / <23, got ${process.version}`);
} else {
  notes.push(`Node ${process.version}`);
}

expectVersion('Astro', 'node_modules/astro/package.json', lock.canonical.astro);
expectVersion('Astro MDX', 'node_modules/@astrojs/mdx/package.json', lock.canonical.astroMdx);
expectVersion('GAGA Engine', 'node_modules/@gaga/engine/package.json', lock.canonical.gagaEngine);
expectVersion('GAGA Engine Web', 'node_modules/@gaga/engine-web/package.json', lock.canonical.gagaEngineWeb);
expectVersion('GAGA Engine Astro', 'node_modules/@gaga/engine-astro/package.json', lock.canonical.gagaEngineAstro);
expectVersion('GAGA Engine Obsidian', 'node_modules/@gaga/engine-obsidian/package.json', lock.canonical.gagaEngineObsidian);
expectVersion('esbuild package', 'node_modules/esbuild/package.json', lock.resolvedCompatibility.esbuild);
expectVersion('Astro compiler binding', 'node_modules/@astrojs/compiler-binding/package.json', lock.resolvedCompatibility.astroCompilerBinding);
expectVersion('Rolldown', 'node_modules/rolldown/package.json', lock.resolvedCompatibility.rolldown);

const packageJson = readJson('package.json');
for (const [label, actual, expected] of [
  ['esbuild declaration', packageJson?.devDependencies?.esbuild, lock.resolvedCompatibility.esbuild],
  ['Rolldown declaration', packageJson?.devDependencies?.rolldown, lock.resolvedCompatibility.rolldown],
  ['Rolldown override', packageJson?.overrides?.rolldown, lock.resolvedCompatibility.rolldown]
]) {
  if (actual !== expected) failures.push(`${label}: expected ${expected}, got ${actual ?? 'missing'}`);
  else notes.push(`${label} ${actual}`);
}

try {
  const configUrl = pathToFileURL(path.join(root, 'astro.config.mjs')).href + `?verify=${Date.now()}`;
  const { default: astroConfig } = await import(configUrl);
  const cssMinify = astroConfig?.vite?.build?.cssMinify;
  if (cssMinify !== lock.buildPolicy.cssMinifier) {
    failures.push(`Production CSS minifier: expected ${lock.buildPolicy.cssMinifier}, got ${String(cssMinify)}`);
  } else {
    notes.push(`Production CSS minifier ${cssMinify}`);
  }
} catch (error) {
  failures.push(`Astro config inspection failed: ${error instanceof Error ? error.message : String(error)}`);
}

const compatReady = fs.existsSync(path.join(root, '.compat', 'READY'));

if (process.platform === 'darwin') {
  try {
    const { execFileSync } = await import('node:child_process');
    const macosVersion = execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim();
    const macosMajor = Number.parseInt(macosVersion.split('.')[0], 10);
    if (Number.isFinite(macosMajor) && macosMajor < 11) {
      if (!compatReady) {
        failures.push('Catalina compatibility runtime is not bootstrapped. Run ./bootstrap_catalina.command once.');
      } else {
        const binary = process.env.ESBUILD_BINARY_PATH;
        if (!binary) {
          failures.push('Catalina compatibility environment: ESBUILD_BINARY_PATH is not set.');
        } else if (!fs.existsSync(binary)) {
          failures.push(`Catalina esbuild binary missing: ${binary}`);
        } else {
          fs.accessSync(binary, fs.constants.X_OK);
          const version = execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim();
          if (version !== lock.resolvedCompatibility.esbuild) failures.push(`Catalina esbuild binary: expected ${lock.resolvedCompatibility.esbuild}, got ${version}`);
          else notes.push(`Catalina esbuild binary ${version}`);
        }
        if (process.env.NAPI_RS_FORCE_WASI !== '1') failures.push('Catalina compatibility environment: NAPI_RS_FORCE_WASI=1 is required.');
        else notes.push('Catalina WASI environment active');
      }
    }
  } catch (error) {
    failures.push(`Catalina version/toolchain inspection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (compatReady) {
  expectVersion('Astro WASI binding', 'node_modules/@astrojs/compiler-binding-wasm32-wasi/package.json', lock.resolvedCompatibility.astroCompilerBinding);
  expectVersion('Astro nested wasm runtime', 'node_modules/@astrojs/compiler-binding-wasm32-wasi/node_modules/@napi-rs/wasm-runtime/package.json', lock.resolvedCompatibility.napiRsWasmRuntime);
  expectVersion('Astro nested emnapi core', 'node_modules/@astrojs/compiler-binding-wasm32-wasi/node_modules/@emnapi/core/package.json', lock.resolvedCompatibility.astroEmnapiCore);
  expectVersion('Astro nested emnapi runtime', 'node_modules/@astrojs/compiler-binding-wasm32-wasi/node_modules/@emnapi/runtime/package.json', lock.resolvedCompatibility.astroEmnapiRuntime);
  expectVersion('Rolldown WASI binding', 'node_modules/@rolldown/binding-wasm32-wasi/package.json', lock.resolvedCompatibility.rolldown);
  expectVersion('Rolldown nested emnapi core', 'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/core/package.json', lock.resolvedCompatibility.rolldownEmnapiCore);
  expectVersion('Rolldown nested emnapi runtime', 'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/runtime/package.json', lock.resolvedCompatibility.rolldownEmnapiRuntime);

  for (const required of ['package-lock.json', '.compat/env.sh', '.compat/toolchain-state.json', '.compat/READY']) {
    if (!fs.existsSync(path.join(root, required))) failures.push(`Bootstrap artifact missing: ${required}`);
  }
}

if (failures.length) {
  console.error('Local toolchain verification FAILED');
  for (const item of failures) console.error(`✗ ${item}`);
  console.error('\nRun ./bootstrap_catalina.command again; do not patch node_modules manually.');
  process.exit(1);
}

console.log('Local toolchain verification PASS');
for (const item of notes) console.log(`✓ ${item}`);
