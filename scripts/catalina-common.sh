#!/bin/bash
# Shared Consumer Blog Signature Catalina compatibility helpers.
# Bash 3.2 compatible.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLCHAIN_LOCK="$PROJECT_ROOT/architecture/catalina-toolchain-lock.json"
COMPAT_DIR="$PROJECT_ROOT/.compat"
READY_FILE="$COMPAT_DIR/READY"
ENV_FILE="$COMPAT_DIR/env.sh"
STATE_FILE="$COMPAT_DIR/toolchain-state.json"
CACHE_ROOT="$HOME/Library/Caches/ConsumerBlogSignatureGaga"
CACHE_ESBUILD="$CACHE_ROOT/esbuild"
CACHE_WASI="$CACHE_ROOT/wasi"

mkdir -p "$COMPAT_DIR" "$CACHE_ESBUILD" "$CACHE_WASI"

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

is_catalina_or_older() {
  [ "$(uname -s)" = "Darwin" ] || return 1
  local version major
  version="$(sw_vers -productVersion 2>/dev/null || true)"
  major="${version%%.*}"
  case "$major" in
    ''|*[!0-9]*) return 1 ;;
  esac
  [ "$major" -lt 11 ]
}

require_node() {
  command -v node >/dev/null 2>&1 || fail "Node.js was not found. Install Node 22.13+ (22.19.0 is the validated baseline)."
  node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a===22 && b>=13 ? 0 : 1)' >/dev/null 2>&1 || \
    fail "Node $(node -v) is outside the validated 22.13+ / <23 line. Use Node 22.19.0 where possible."
}

read_lock_value() {
  node - "$TOOLCHAIN_LOCK" "$1" <<'NODE'
const fs = require('node:fs')
const file = process.argv[2]
const dotted = process.argv[3]
const obj = JSON.parse(fs.readFileSync(file, 'utf8'))
let value = obj
for (const part of dotted.split('.')) value = value?.[part]
if (value === undefined || value === null) process.exit(2)
process.stdout.write(String(value))
NODE
}
