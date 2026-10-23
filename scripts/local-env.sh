#!/bin/bash
set -euo pipefail

LOCAL_ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "$LOCAL_ENV_DIR/catalina-common.sh"

require_node

append_node_option() {
  local option="$1"
  case " ${NODE_OPTIONS:-} " in
    *" $option "*) ;;
    *) export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }$option" ;;
  esac
}

prepare_local_gaga_env() {
  if is_catalina_or_older; then
    [ -f "$READY_FILE" ] || fail "Catalina runtime is not ready. Run ./bootstrap_catalina.command once."
    [ -f "$ENV_FILE" ] || fail "Catalina environment file is missing. Run ./bootstrap_catalina.command again."
    # shellcheck source=/dev/null
    . "$ENV_FILE"
  fi

  # Node 22 emits repeated WASI ExperimentalWarning lines for the required
  # compatibility bindings. Silence only that warning class, not general warnings.
  append_node_option "--disable-warning=ExperimentalWarning"
}

require_local_dependencies() {
  [ -x "$PROJECT_ROOT/node_modules/.bin/astro" ] || \
    fail "Local dependencies are not ready. On Catalina run ./bootstrap_catalina.command. Do not run npm install manually."
}

wait_for_http() {
  local url="$1"
  local attempts="${2:-40}"
  local delay="${3:-0.25}"
  local i=1

  while [ "$i" -le "$attempts" ]; do
    if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
    i=$((i + 1))
  done
  return 1
}
