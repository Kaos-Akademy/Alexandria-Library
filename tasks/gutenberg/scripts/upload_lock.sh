#!/usr/bin/env bash
# Lock helpers for unattended upload (single-process guard).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
LOCK_FILE="${ROOT}/tasks/gutenberg/.upload.lock"

acquire_upload_lock() {
  if [[ -f "$LOCK_FILE" ]]; then
    local holder
    holder="$(cat "$LOCK_FILE" 2>/dev/null || echo unknown)"
    if [[ "$holder" =~ ^[0-9]+$ ]] && kill -0 "$holder" 2>/dev/null; then
      echo "ERROR: upload lock held (PID $holder). Only one upload process allowed." >&2
      exit 1
    fi
    echo "Removing stale upload lock (PID $holder no longer running)" >&2
    rm -f "$LOCK_FILE"
  fi
  echo $$ > "$LOCK_FILE"
}

release_upload_lock() {
  rm -f "$LOCK_FILE"
}

flow_ping() {
  flow --config-path "$ROOT/flow.json" scripts execute \
    tasks/gutenberg/scripts/list_all_book_titles.cdc \
    --network mainnet --format json >/dev/null
}
