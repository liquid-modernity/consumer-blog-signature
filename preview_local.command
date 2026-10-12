#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# shellcheck source=/dev/null
. scripts/local-env.sh
prepare_local_gaga_env
require_local_dependencies

[ -f dist/index.html ] || fail "dist/ is not ready. Run ./verify_local.command first."

URL="http://127.0.0.1:3001"
LOG_FILE="$COMPAT_DIR/preview-server.log"
PID_FILE="$COMPAT_DIR/preview-server.pid"

: > "$LOG_FILE"
npm run preview -- --host 127.0.0.1 --port 3001 >"$LOG_FILE" 2>&1 &
PID=$!
printf '%s\n' "$PID" > "$PID_FILE"

cleanup() {
  kill "$PID" 2>/dev/null || true
  rm -f "$PID_FILE"
}
trap cleanup EXIT INT TERM

if ! wait_for_http "$URL" 60 0.25; then
  echo "Preview server did not become ready."
  tail -80 "$LOG_FILE" || true
  exit 1
fi

echo "GAGA production preview READY: $URL"
if command -v open >/dev/null 2>&1; then open "$URL"; fi
echo "Log: $LOG_FILE"
wait "$PID"
