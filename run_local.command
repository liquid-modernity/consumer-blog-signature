#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

REVIEW_URL="${CONSUMER_REVIEW_URL:-}"
if [ -z "$REVIEW_URL" ] && [ -f .review-url ]; then REVIEW_URL="$(tr -d '\r\n ' < .review-url)"; fi

open_url() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    echo "Checking remote review manifest..."
    curl -fsS --max-time 8 "${url%/}/__consumer/review.json" >/tmp/consumer-review.json 2>/dev/null || echo "Warning: review manifest unavailable; opening preview anyway."
    [ -s /tmp/consumer-review.json ] && cat /tmp/consumer-review.json && echo
  fi
  echo "Opening remote UI/UX review: $url"
  if command -v open >/dev/null 2>&1; then open "$url"; elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url"; else echo "$url"; fi
}

if command -v sw_vers >/dev/null 2>&1; then
  MAJOR="$(sw_vers -productVersion | cut -d. -f1)"
  if [ "${MAJOR:-0}" -le 10 ]; then
    if [ -z "$REVIEW_URL" ]; then
      echo "Catalina/legacy macOS detected. Local Node build is intentionally disabled."
      echo "Set CONSUMER_REVIEW_URL or create .review-url containing the Cloudflare preview URL."
      exit 2
    fi
    open_url "$REVIEW_URL"; exit 0
  fi
fi

if [ -n "$REVIEW_URL" ]; then open_url "$REVIEW_URL"; exit 0; fi
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  echo "No remote review URL configured; starting local Astro dev server."
  npm install
  npm run dev -- --host 127.0.0.1 &
  PID=$!
  trap 'kill $PID 2>/dev/null || true' EXIT
  sleep 3
  open_url "http://127.0.0.1:4321"
  wait $PID
else
  echo "Set CONSUMER_REVIEW_URL or .review-url to a deployed Cloudflare preview."
  exit 2
fi
