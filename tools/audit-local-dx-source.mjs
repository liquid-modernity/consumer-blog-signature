import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');

const policy = JSON.parse(read('architecture/local-development-policy.json'));
if (policy.schema !== 'gaga.local-development-policy.v1') {
  fail('invalid local development policy schema');
}

for (const file of [
  'scripts/local-env.sh',
  'run_local.command',
  'verify_local.command',
  'preview_local.command',
  'architecture/local-development-policy.json'
]) {
  if (!fs.existsSync(file)) fail(`missing local DX source: ${file}`);
}

const run = read('run_local.command');
if (/\bnpm\s+(install|ci)\b/.test(run)) {
  fail('daily run_local.command must not install dependencies');
}
for (const marker of ['wait_for_http', 'dev-server.log', 'verify:toolchain']) {
  if (!run.includes(marker)) fail(`run_local readiness contract missing: ${marker}`);
}

const env = read('scripts/local-env.sh');
if (!env.includes('--disable-warning=ExperimentalWarning')) {
  fail('local environment must selectively suppress WASI ExperimentalWarning noise');
}
if (env.includes('NODE_NO_WARNINGS=1') || env.includes('--no-warnings')) {
  fail('local environment must not suppress all Node warnings');
}

const verify = read('verify_local.command');
if (/\bnpm\s+(install|ci)\b/.test(verify)) {
  fail('verify_local.command must not install dependencies');
}
if (!verify.includes('npm run verify:full')) {
  fail('verify_local.command must execute the canonical full verification closure');
}

if (fs.existsSync('public/llms.txt') && fs.existsSync('src/pages/llms.txt.ts')) {
  fail('duplicate llms.txt authorities detected: keep src/pages/llms.txt.ts and remove public/llms.txt');
}

if (failures.length) {
  console.error('GAGA local DX source audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA local DX source audit OK');
console.log('✓ daily dev runner performs no dependency install');
console.log('✓ server readiness is probed before browser open');
console.log('✓ WASI warning suppression is selective');
console.log('✓ local verify uses canonical full verification');
console.log('✓ llms.txt has a single generated authority');
