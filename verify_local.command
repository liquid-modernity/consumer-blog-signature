#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# shellcheck source=/dev/null
. scripts/local-env.sh
prepare_local_gaga_env
require_local_dependencies

STARTED_AT="$(date +%s)"
npm run verify:full
ENDED_AT="$(date +%s)"

echo
echo "GAGA local verification complete in $((ENDED_AT - STARTED_AT))s."
