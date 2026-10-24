#!/bin/bash
set -euo pipefail
umask 077
cms_project_root="$(cd "$(dirname "$0")/.." && pwd)"
if [ -x "$cms_project_root/.compat/cms-node/bin/node" ]; then
  export PATH="$cms_project_root/.compat/cms-node/bin:$PATH"
fi
node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);if(a!==22||b<22||(b===22&&c<2))throw Error("EmDash CMS requires Node 22.22.2+ in the Node 22 line")'
cms_cpu_args=()
if [ "$(uname -s)" = Darwin ] && [ "$(sw_vers -productVersion | cut -d. -f1)" -lt 11 ]; then
  # Reuse the application's already-built Catalina esbuild; package binaries stay untouched.
  export ESBUILD_BINARY_PATH="$HOME/Library/Caches/ConsumerBlogSignatureGaga/esbuild/esbuild-0.28.2-darwin-x64"
  test -x "$ESBUILD_BINARY_PATH" || { echo 'Catalina esbuild cache unavailable; use the existing local bootstrap.' >&2; exit 1; }
  export NAPI_RS_FORCE_WASI=1
  cms_cpu_args=(--cpu=wasm32)
fi
cd "$cms_project_root/cms"
mkdir -p .data/uploads .data/sessions
case "${1:-dev}" in
  install) exec npm ci "${cms_cpu_args[@]}" --ignore-scripts --no-audit --no-fund ;;
  dev) exec npm run dev ;;
  seed) exec npm run seed ;;
  verify) cd "$cms_project_root"; exec node --env-file-if-exists=.env.cms.local tools/cms/verify-local.mjs ;;
  *) echo 'Usage: npm run cms:install | cms:dev | cms:seed' >&2; exit 1 ;;
esac
