#!/usr/bin/env bash
# Wait for campaign prep to finish, then run the upload loop.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

STATE_FILE="tasks/gutenberg/manifests/philosophy_500_run_state.json"
LOG_DIR="logs/philosophy_500"
WAIT_LOG="${LOG_DIR}/wait_upload.log"
POLL_SECS="${POLL_SECS:-120}"

mkdir -p "$LOG_DIR"
exec >>"$WAIT_LOG" 2>&1

echo "=== wait_prep_and_upload started $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

prep_done() {
  python3 -c "
import json, sys
s = json.load(open('$STATE_FILE'))
sys.exit(0 if s.get('prep_done') else 1)
" 2>/dev/null
}

while ! prep_done; do
  cached="$(python3 -c "
import json, os, sys
sys.path.insert(0, 'tasks/gutenberg/scripts')
from manifest_utils import load_json, has_split_cache
prep = load_json('tasks/gutenberg/manifests/philosophy_500_prep.json')
entries = prep.get('entries') or []
cached = sum(1 for e in entries if isinstance(e.get('gutenberg_id'), int) and has_split_cache(e['gutenberg_id']))
print(f'{cached}/{len(entries)}')
" 2>/dev/null || echo '?/?')"
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) waiting for prep (cached=$cached, prep_done=false)..."
  sleep "$POLL_SECS"
done

echo "=== Prep complete — starting upload loop $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

LOCK_FILE="tasks/gutenberg/.upload.lock"
if [[ -f "$LOCK_FILE" ]]; then
  holder="$(cat "$LOCK_FILE" 2>/dev/null || echo "")"
  if [[ -n "$holder" ]] && kill -0 "$holder" 2>/dev/null; then
    echo "Upload already running (PID $holder); watcher exiting."
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi

bash tasks/gutenberg/scripts/run_500_upload.sh --skip-prep
echo "=== wait_prep_and_upload finished $(date -u +%Y-%m-%dT%H:%M:%SZ) exit=$? ==="
