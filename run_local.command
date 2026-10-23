#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

REVIEW_URL="${CONSUMER_REVIEW_URL:-}"
if [ -z "$REVIEW_URL" ] && [ -f .review-url ]; then
  REVIEW_URL="$(tr -d '\r\n ' < .review-url)"
fi

open_url() {
  local url="$1"
  echo "Opening review surface: $url"
  if command -v open >/dev/null 2>&1; then
    open "$url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url"
  else
    echo "$url"
  fi
}

# shellcheck source=/dev/null
. scripts/local-env.sh
prepare_local_gaga_env

if ! [ -x "$PROJECT_ROOT/node_modules/.bin/astro" ]; then
  if [ -n "$REVIEW_URL" ]; then
    echo "Local dependencies are not ready; using configured remote review URL."
    open_url "$REVIEW_URL"
    exit 0
  fi
  require_local_dependencies
fi

npm run verify:toolchain

LOG_FILE="$COMPAT_DIR/dev-server.log"
PID_FILE="$COMPAT_DIR/dev-server.pid"
URL="http://127.0.0.1:3000"

rm -f "$PID_FILE"
: > "$LOG_FILE"

echo "Starting GAGA local dev server at $URL"
npm run dev -- --host 127.0.0.1 --port 3000 >"$LOG_FILE" 2>&1 &
PID=$!
printf '%s\n' "$PID" > "$PID_FILE"

cleanup() {
  kill "$PID" 2>/dev/null || true
  rm -f "$PID_FILE"
}
trap cleanup EXIT INT TERM

if ! wait_for_http "$URL" 60 0.25; then
  echo "Local server did not become ready."
  echo "===== DEV SERVER LOG ====="
  tail -80 "$LOG_FILE" || true
  exit 1
fi

echo "GAGA local server READY."
open_url "$URL"
echo "Log: $LOG_FILE"
wait "$PID"
