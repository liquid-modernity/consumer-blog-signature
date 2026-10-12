#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# shellcheck source=/dev/null
. scripts/catalina-common.sh
require_node

if is_catalina_or_older; then
  [ -f "$READY_FILE" ] || fail "Catalina toolchain is not ready. Run ./bootstrap_catalina.command once."
  # shellcheck source=/dev/null
  . "$ENV_FILE"
fi

npm run verify:full
