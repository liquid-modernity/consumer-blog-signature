#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

REVIEW_URL="${CONSUMER_REVIEW_URL:-}"
if [ -z "$REVIEW_URL" ] && [ -f .review-url ]; then REVIEW_URL="$(tr -d '\r\n ' < .review-url)"; fi

open_url() {
  local url="$1"
  echo "Opening review surface: $url"
  if command -v open >/dev/null 2>&1; then open "$url"; elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url"; else echo "$url"; fi
}

# shellcheck source=/dev/null
. scripts/catalina-common.sh
require_node

if is_catalina_or_older; then
  if [ -f "$READY_FILE" ]; then
    # shellcheck source=/dev/null
    . "$ENV_FILE"
    npm run verify:toolchain
    echo "Starting local GAGA dev server with Catalina compatibility runtime."
    npm run dev -- --host 127.0.0.1 &
    PID=$!
    trap 'kill $PID 2>/dev/null || true' EXIT
    sleep 4
    open_url "http://127.0.0.1:3000"
    wait $PID
    exit 0
  fi

  if [ -n "$REVIEW_URL" ]; then
    echo "Catalina compatibility runtime is not bootstrapped yet; using configured remote review URL."
    open_url "$REVIEW_URL"
    exit 0
  fi

  echo "Catalina detected and local runtime is not ready."
  echo "Run ./bootstrap_catalina.command once, then rerun ./run_local.command."
  exit 2
fi

if [ -n "$REVIEW_URL" ]; then
  open_url "$REVIEW_URL"
  exit 0
fi

npm install --no-audit
npm run dev -- --host 127.0.0.1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
sleep 4
open_url "http://127.0.0.1:3000"
wait $PID
