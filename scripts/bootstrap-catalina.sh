#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/catalina-common.sh"
cd "$PROJECT_ROOT"

require_node

if ! is_catalina_or_older; then
  printf 'Catalina compatibility bootstrap is not required on this macOS version.\n'
  npm install --no-audit
  npm run verify
  exit 0
fi

printf 'GAGA Catalina bootstrap · Consumer Blog Signature 0.0.39.0\n'
printf 'Project: %s\n' "$PROJECT_ROOT"
printf 'Node: %s\n' "$(node -v)"
printf 'npm:  %s\n' "$(npm -v)"
printf 'macOS: %s\n\n' "$(sw_vers -productVersion 2>/dev/null || true)"

EXPECTED_ASTRO="$(read_lock_value canonical.astro)"
EXPECTED_ESBUILD="$(read_lock_value resolvedCompatibility.esbuild)"
EXPECTED_COMPILER_BINDING="$(read_lock_value resolvedCompatibility.astroCompilerBinding)"
EXPECTED_ROLLDOWN="$(read_lock_value resolvedCompatibility.rolldown)"
EXPECTED_WASM_RUNTIME="$(read_lock_value resolvedCompatibility.napiRsWasmRuntime)"
EXPECTED_ASTRO_CORE="$(read_lock_value resolvedCompatibility.astroEmnapiCore)"
EXPECTED_ASTRO_RUNTIME="$(read_lock_value resolvedCompatibility.astroEmnapiRuntime)"
EXPECTED_ASTRO_THREADS="$(read_lock_value resolvedCompatibility.astroEmnapiWasiThreads)"
EXPECTED_ROLLDOWN_CORE="$(read_lock_value resolvedCompatibility.rolldownEmnapiCore)"
EXPECTED_ROLLDOWN_RUNTIME="$(read_lock_value resolvedCompatibility.rolldownEmnapiRuntime)"

node - "$TOOLCHAIN_LOCK" <<'NODE'
const fs = require('node:fs')
const lock = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const rolldown = lock.resolvedCompatibility.rolldown
const esbuild = lock.resolvedCompatibility.esbuild
if (pkg.devDependencies?.rolldown !== rolldown) {
  throw new Error(`package.json must pin devDependencies.rolldown=${rolldown}`)
}
if (pkg.overrides?.rolldown !== rolldown) {
  throw new Error(`package.json must pin overrides.rolldown=${rolldown}`)
}
if (pkg.devDependencies?.esbuild !== esbuild) {
  throw new Error(`package.json must pin devDependencies.esbuild=${esbuild}`)
}
NODE

if [ ! -f "$READY_FILE" ] && [ -d "$PROJECT_ROOT/node_modules" ]; then
  printf 'Cold bootstrap found a partial node_modules tree; resetting it.\n'
  rm -rf "$PROJECT_ROOT/node_modules"
fi

printf '1/7 Installing canonical dependencies without native install scripts...\n'
npm install --ignore-scripts --omit=optional --no-audit --no-fund

ACTUAL_ASTRO="$(node -p "require('./node_modules/astro/package.json').version")"
ACTUAL_ESBUILD="$(node -p "require('./node_modules/esbuild/package.json').version")"
ACTUAL_COMPILER_BINDING="$(node -p "require('./node_modules/@astrojs/compiler-binding/package.json').version")"
ACTUAL_ROLLDOWN="$(node -p "require('./node_modules/rolldown/package.json').version")"

[ "$ACTUAL_ASTRO" = "$EXPECTED_ASTRO" ] || fail "Toolchain drift: Astro expected $EXPECTED_ASTRO, got $ACTUAL_ASTRO."
[ "$ACTUAL_ESBUILD" = "$EXPECTED_ESBUILD" ] || fail "Toolchain drift: esbuild expected $EXPECTED_ESBUILD, got $ACTUAL_ESBUILD."
[ "$ACTUAL_COMPILER_BINDING" = "$EXPECTED_COMPILER_BINDING" ] || fail "Toolchain drift: Astro compiler binding expected $EXPECTED_COMPILER_BINDING, got $ACTUAL_COMPILER_BINDING."
[ "$ACTUAL_ROLLDOWN" = "$EXPECTED_ROLLDOWN" ] || fail "Toolchain drift: Rolldown expected $EXPECTED_ROLLDOWN, got $ACTUAL_ROLLDOWN."

printf '   Astro %s · esbuild %s · compiler %s · Rolldown %s\n' \
  "$ACTUAL_ASTRO" "$ACTUAL_ESBUILD" "$ACTUAL_COMPILER_BINDING" "$ACTUAL_ROLLDOWN"

printf '\n2/7 Preparing cached Catalina esbuild...\n'
ESBUILD_BIN="$CACHE_ESBUILD/esbuild-$ACTUAL_ESBUILD-darwin-x64"
if [ -x "$ESBUILD_BIN" ] && [ "$($ESBUILD_BIN --version 2>/dev/null || true)" = "$ACTUAL_ESBUILD" ]; then
  printf '   Cache hit: %s\n' "$ESBUILD_BIN"
else
  command -v go >/dev/null 2>&1 || fail "Go 1.22.x is required once to compile esbuild for Catalina. Install Go 1.22.x, then rerun ./bootstrap_catalina.command."
  GO_RAW="$(go version 2>/dev/null || true)"
  printf '   Go: %s\n' "$GO_RAW"
  case "$GO_RAW" in
    *go1.22.*) ;;
    *) fail "Validated Catalina build requires Go 1.22.x. Found: $GO_RAW" ;;
  esac

  SRC_CACHE="$CACHE_ROOT/sources/esbuild-$ACTUAL_ESBUILD"
  mkdir -p "$CACHE_ROOT/sources"
  if [ ! -d "$SRC_CACHE/.git" ]; then
    rm -rf "$SRC_CACHE"
    printf '   Fetching esbuild v%s source once...\n' "$ACTUAL_ESBUILD"
    git clone --depth 1 --branch "v$ACTUAL_ESBUILD" https://github.com/evanw/esbuild.git "$SRC_CACHE"
  fi

  printf '   Compiling cached Catalina binary...\n'
  (cd "$SRC_CACHE" && env CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -trimpath -ldflags='-s -w' -o "$ESBUILD_BIN" ./cmd/esbuild)
  chmod +x "$ESBUILD_BIN"
fi

[ "$($ESBUILD_BIN --version 2>/dev/null || true)" = "$ACTUAL_ESBUILD" ] || fail "Cached esbuild verification failed."
printf '   esbuild ready: %s\n' "$ACTUAL_ESBUILD"

export ESBUILD_BINARY_PATH="$ESBUILD_BIN"
export NAPI_RS_FORCE_WASI=1

STAGE_ROOT="$COMPAT_DIR/stage"
rm -rf "$STAGE_ROOT"
mkdir -p "$STAGE_ROOT"

fetch_verified_package() {
  PKG="$1"
  VER="$2"
  LABEL="$3"
  SAFE_NAME="$(printf '%s' "$PKG" | tr '/@' '__')"
  TARBALL_DIR="$CACHE_WASI/tarballs"
  TGZ="$TARBALL_DIR/${SAFE_NAME}-${VER}.tgz"
  SRI_FILE="$TGZ.sri"
  mkdir -p "$TARBALL_DIR"

  if [ ! -f "$TGZ" ] || [ ! -s "$SRI_FILE" ]; then
    printf '   Downloading official %s@%s once...\n' "$PKG" "$VER"
    URL="$(npm view "$PKG@$VER" dist.tarball 2>/dev/null || true)"
    SRI="$(npm view "$PKG@$VER" dist.integrity 2>/dev/null || true)"
    [ -n "$URL" ] || fail "Cannot resolve official tarball for $PKG@$VER. Network/cache required."
    [ -n "$SRI" ] || fail "Cannot resolve integrity metadata for $PKG@$VER."
    curl -fL --retry 3 "$URL" -o "$TGZ.tmp"
    mv "$TGZ.tmp" "$TGZ"
    printf '%s\n' "$SRI" > "$SRI_FILE"
  else
    SRI="$(cat "$SRI_FILE")"
    printf '   Cache hit: %s@%s\n' "$PKG" "$VER"
  fi

  node - "$TGZ" "$SRI" <<'NODE'
const fs = require('node:fs')
const crypto = require('node:crypto')
const file = process.argv[2]
const sri = process.argv[3]
const dash = sri.indexOf('-')
if (dash <= 0) process.exit(2)
const algo = sri.slice(0, dash)
const expected = sri.slice(dash + 1)
const actual = crypto.createHash(algo).update(fs.readFileSync(file)).digest('base64')
if (actual !== expected) {
  console.error(`Integrity mismatch: ${file}`)
  process.exit(1)
}
NODE

  DEST="$STAGE_ROOT/$LABEL"
  rm -rf "$DEST"
  mkdir -p "$DEST"
  tar -xzf "$TGZ" -C "$DEST" --strip-components=1
  ACTUAL="$(node -p "require('$DEST/package.json').version")"
  [ "$ACTUAL" = "$VER" ] || fail "Staged $PKG version mismatch: expected $VER, got $ACTUAL."
}

printf '\n3/7 Preparing official WASI packages from verified cache...\n'
fetch_verified_package '@astrojs/compiler-binding-wasm32-wasi' "$ACTUAL_COMPILER_BINDING" 'astro-wasi'
fetch_verified_package '@rolldown/binding-wasm32-wasi' "$ACTUAL_ROLLDOWN" 'rolldown-wasi'

printf '\n4/7 Building isolated WASI runtime trees...\n'
ASTRO_RUNTIME_CACHE="$CACHE_WASI/runtime-astro-$ACTUAL_COMPILER_BINDING"
ASTRO_RUNTIME_KEY="$ASTRO_RUNTIME_CACHE/.runtime-key"
ASTRO_KEY="$EXPECTED_WASM_RUNTIME|$EXPECTED_ASTRO_CORE|$EXPECTED_ASTRO_RUNTIME|$EXPECTED_ASTRO_THREADS"

if [ ! -d "$ASTRO_RUNTIME_CACHE/node_modules" ] || [ "$(cat "$ASTRO_RUNTIME_KEY" 2>/dev/null || true)" != "$ASTRO_KEY" ]; then
  rm -rf "$ASTRO_RUNTIME_CACHE"
  mkdir -p "$ASTRO_RUNTIME_CACHE"
  cat > "$ASTRO_RUNTIME_CACHE/package.json" <<JSON
{
  "private": true,
  "dependencies": {
    "@napi-rs/wasm-runtime": "$EXPECTED_WASM_RUNTIME",
    "@emnapi/core": "$EXPECTED_ASTRO_CORE",
    "@emnapi/runtime": "$EXPECTED_ASTRO_RUNTIME",
    "@emnapi/wasi-threads": "$EXPECTED_ASTRO_THREADS"
  }
}
JSON
  (cd "$ASTRO_RUNTIME_CACHE" && npm install --ignore-scripts --no-audit --no-fund --package-lock=false)
  printf '%s\n' "$ASTRO_KEY" > "$ASTRO_RUNTIME_KEY"
else
  printf '   Astro runtime cache hit.\n'
fi

ROLLDOWN_RUNTIME_CACHE="$CACHE_WASI/runtime-rolldown-$ACTUAL_ROLLDOWN"
ROLLDOWN_RUNTIME_KEY="$ROLLDOWN_RUNTIME_CACHE/.runtime-key"
ROLLDOWN_KEY="$EXPECTED_WASM_RUNTIME|$EXPECTED_ROLLDOWN_CORE|$EXPECTED_ROLLDOWN_RUNTIME"

if [ ! -d "$ROLLDOWN_RUNTIME_CACHE/node_modules" ] || [ "$(cat "$ROLLDOWN_RUNTIME_KEY" 2>/dev/null || true)" != "$ROLLDOWN_KEY" ]; then
  rm -rf "$ROLLDOWN_RUNTIME_CACHE"
  mkdir -p "$ROLLDOWN_RUNTIME_CACHE"
  node - "$STAGE_ROOT/rolldown-wasi/package.json" "$ROLLDOWN_RUNTIME_CACHE/package.json" \
    "$EXPECTED_WASM_RUNTIME" "$EXPECTED_ROLLDOWN_CORE" "$EXPECTED_ROLLDOWN_RUNTIME" <<'NODE'
const fs = require('node:fs')
const source = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const output = process.argv[3]
const wasmRuntime = process.argv[4]
const core = process.argv[5]
const runtime = process.argv[6]
const deps = { ...(source.dependencies || {}) }
if (deps['@napi-rs/wasm-runtime']) deps['@napi-rs/wasm-runtime'] = wasmRuntime
if (deps['@emnapi/core']) deps['@emnapi/core'] = core
if (deps['@emnapi/runtime']) deps['@emnapi/runtime'] = runtime
fs.writeFileSync(output, JSON.stringify({ private: true, dependencies: deps }, null, 2) + '\n')
NODE
  (cd "$ROLLDOWN_RUNTIME_CACHE" && npm install --ignore-scripts --no-audit --no-fund --package-lock=false)
  printf '%s\n' "$ROLLDOWN_KEY" > "$ROLLDOWN_RUNTIME_KEY"
else
  printf '   Rolldown runtime cache hit.\n'
fi

printf '\n5/7 Materializing isolated WASI packages...\n'
ASTRO_WASI_DIR="$PROJECT_ROOT/node_modules/@astrojs/compiler-binding-wasm32-wasi"
ROLLDOWN_WASI_DIR="$PROJECT_ROOT/node_modules/@rolldown/binding-wasm32-wasi"

rm -rf "$ASTRO_WASI_DIR" "$ROLLDOWN_WASI_DIR"
mkdir -p "$ASTRO_WASI_DIR" "$ROLLDOWN_WASI_DIR"
cp -R "$STAGE_ROOT/astro-wasi/." "$ASTRO_WASI_DIR/"
cp -R "$STAGE_ROOT/rolldown-wasi/." "$ROLLDOWN_WASI_DIR/"
mkdir -p "$ASTRO_WASI_DIR/node_modules" "$ROLLDOWN_WASI_DIR/node_modules"
cp -R "$ASTRO_RUNTIME_CACHE/node_modules/." "$ASTRO_WASI_DIR/node_modules/"
cp -R "$ROLLDOWN_RUNTIME_CACHE/node_modules/." "$ROLLDOWN_WASI_DIR/node_modules/"

node - "$TOOLCHAIN_LOCK" <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const lock = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).resolvedCompatibility
function v(rel) { return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8')).version }
const checks = [
  ['Astro WASI', 'node_modules/@astrojs/compiler-binding-wasm32-wasi/package.json', lock.astroCompilerBinding],
  ['Astro wasm runtime', 'node_modules/@astrojs/compiler-binding-wasm32-wasi/node_modules/@napi-rs/wasm-runtime/package.json', lock.napiRsWasmRuntime],
  ['Astro emnapi core', 'node_modules/@astrojs/compiler-binding-wasm32-wasi/node_modules/@emnapi/core/package.json', lock.astroEmnapiCore],
  ['Astro emnapi runtime', 'node_modules/@astrojs/compiler-binding-wasm32-wasi/node_modules/@emnapi/runtime/package.json', lock.astroEmnapiRuntime],
  ['Rolldown WASI', 'node_modules/@rolldown/binding-wasm32-wasi/package.json', lock.rolldown],
  ['Rolldown emnapi core', 'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/core/package.json', lock.rolldownEmnapiCore],
  ['Rolldown emnapi runtime', 'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/runtime/package.json', lock.rolldownEmnapiRuntime]
]
for (const [label, rel, expected] of checks) {
  const actual = v(rel)
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`)
  console.log(`   ✓ ${label} ${actual}`)
}
NODE

printf '\n6/7 Verifying native/WASI execution...\n'
NAPI_RS_FORCE_WASI=1 node -e "require('@astrojs/compiler-binding-wasm32-wasi'); console.log('   ✓ Astro WASI direct')"
NAPI_RS_FORCE_WASI=1 node --input-type=module -e "await import('@astrojs/compiler-rs'); console.log('   ✓ Astro compiler loader')"
NAPI_RS_FORCE_WASI=1 node --input-type=module -e "await import('rolldown'); console.log('   ✓ Rolldown loader')"

cat > "$ENV_FILE" <<EOF_ENV
# Generated by GAGA Consumer Blog Signature 0.0.39.0. Do not edit manually.
export ESBUILD_BINARY_PATH="$ESBUILD_BIN"
export NAPI_RS_FORCE_WASI=1
EOF_ENV

STATE_TMP="$STATE_FILE.tmp"
node - "$STATE_TMP" "$ESBUILD_BIN" <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const out = process.argv[2]
const esbuild = process.argv[3]
function pkg(rel) { return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8')).version }
const state = {
  schemaVersion: 1,
  bootstrappedAt: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  node: process.version,
  npm: cp.execFileSync('npm', ['-v'], {encoding:'utf8'}).trim(),
  esbuildBinary: esbuild,
  versions: {
    astro: pkg('node_modules/astro/package.json'),
    esbuild: pkg('node_modules/esbuild/package.json'),
    astroCompilerBinding: pkg('node_modules/@astrojs/compiler-binding/package.json'),
    rolldown: pkg('node_modules/rolldown/package.json'),
    astroWasi: pkg('node_modules/@astrojs/compiler-binding-wasm32-wasi/package.json'),
    rolldownWasi: pkg('node_modules/@rolldown/binding-wasm32-wasi/package.json')
  }
}
fs.writeFileSync(out, JSON.stringify(state, null, 2) + '\n')
NODE
mv "$STATE_TMP" "$STATE_FILE"
touch "$READY_FILE"

printf '\n7/7 Running canonical verification/build closure once...\n'
# shellcheck source=/dev/null
. "$ENV_FILE"
npm run verify:full

printf '\nCatalina bootstrap COMPLETE. Local check/build closure verified.\n'
printf 'Future daily starts use run_local.command without reinstalling dependencies.\n'
printf 'Use verify_local.command when you want the full local verification gate.\n'
