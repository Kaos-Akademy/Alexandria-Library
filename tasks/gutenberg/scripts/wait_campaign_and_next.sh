#!/usr/bin/env bash
# Wait for the current genre upload run to finish, then auto-chain campaigns until exhausted.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

GENRE="${UPLOAD_GENRE:-philosophy}"
POLL_SECS="${POLL_SECS:-60}"
export UPLOAD_GENRE="$GENRE"

if [[ "$GENRE" == "fiction" ]]; then
  export UPLOAD_BATCH_PREFIX="${UPLOAD_BATCH_PREFIX:-fiction_next500}"
  export UPLOAD_BATCH_SIZE="${UPLOAD_BATCH_SIZE:-500}"
  export UPLOAD_SIGNER="${UPLOAD_SIGNER:-Alexandria-II}"
  export UPLOAD_KEY_COUNT="${UPLOAD_KEY_COUNT:-100}"
  export UPLOAD_BOOK_CONCURRENCY="${UPLOAD_BOOK_CONCURRENCY:-25}"
  export UPLOAD_LAUNCH_STAGGER_MS="${UPLOAD_LAUNCH_STAGGER_MS:-100}"
  export UPLOAD_REPAIR_CONCURRENCY="${UPLOAD_REPAIR_CONCURRENCY:-25}"
  export UPLOAD_TARGET="${UPLOAD_TARGET:-1000}"
else
  export UPLOAD_BATCH_PREFIX="${UPLOAD_BATCH_PREFIX:-${GENRE}_next25}"
  export UPLOAD_BATCH_SIZE="${UPLOAD_BATCH_SIZE:-25}"
  export UPLOAD_BOOK_CONCURRENCY="${UPLOAD_BOOK_CONCURRENCY:-15}"
  export UPLOAD_KEY_COUNT="${UPLOAD_KEY_COUNT:-25}"
  export UPLOAD_REPAIR_CONCURRENCY="${UPLOAD_REPAIR_CONCURRENCY:-5}"
  export UPLOAD_TARGET="${UPLOAD_TARGET:-500}"
fi

LOG_DIR="logs/${GENRE}_${UPLOAD_TARGET}"
WAIT_LOG="${LOG_DIR}/wait_next_campaign.log"

mkdir -p "$LOG_DIR"
exec >>"$WAIT_LOG" 2>&1

echo "=== wait_campaign_and_next started $(date -u +%Y-%m-%dT%H:%M:%SZ) genre=${GENRE} target=${UPLOAD_TARGET} ==="

pending_count() {
  python3 -c "
import json, os, sys
sys.path.insert(0, 'tasks/gutenberg/scripts')
from manifest_utils import MASTER_MANIFEST, rel
master = json.load(open(rel(MASTER_MANIFEST)))
print(sum(1 for e in master.get('entries') or [] if (e.get('status') or '').strip().lower() == 'pending'))
"
}

run_state_summary() {
  python3 -c "
import json, os, sys
sys.path.insert(0, 'tasks/gutenberg/scripts')
from manifest_utils import RUN_STATE_PATH, load_json
s = load_json(RUN_STATE_PATH)
print(f\"campaign={s.get('campaign')} uploaded={s.get('uploaded_count')}/{s.get('target')} batch={s.get('current_batch')}\")
" 2>/dev/null || echo 'status=?'
}

clear_stale_upload_lock() {
  local lock_file="tasks/gutenberg/.upload.lock"
  if [[ ! -f "$lock_file" ]]; then
    return 0
  fi
  local holder
  holder="$(cat "$lock_file" 2>/dev/null || echo "")"
  if [[ -n "$holder" ]] && kill -0 "$holder" 2>/dev/null; then
    echo "Upload lock held by PID $holder; skipping new run."
    return 1
  fi
  rm -f "$lock_file"
  return 0
}

wait_for_upload_run() {
  while pgrep -f "run_500_upload.sh --genre ${GENRE}" >/dev/null 2>&1; do
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) waiting for upload run to finish ($(run_state_summary))"
    sleep "$POLL_SECS"
  done
}

while true; do
  pending="$(pending_count)"
  if [[ "$pending" -eq 0 ]]; then
    echo "=== No pending books in master manifest — watcher exiting $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
    exit 0
  fi

  wait_for_upload_run

  pending="$(pending_count)"
  if [[ "$pending" -eq 0 ]]; then
    echo "=== No pending books after upload finished — watcher exiting $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
    exit 0
  fi

  echo "=== Upload run finished — starting next campaign $(date -u +%Y-%m-%dT%H:%M:%SZ) pending=${pending} ==="
  sleep 5

  python3 tasks/gutenberg/scripts/start_next_campaign.py

  if ! clear_stale_upload_lock; then
    echo "Another upload holds the lock; will retry on next loop iteration."
    sleep "$POLL_SECS"
    continue
  fi

  set +e
  UPLOAD_FOREGROUND=1 bash tasks/gutenberg/scripts/run_500_upload.sh --genre "$GENRE" 2>&1 | tee -a "${LOG_DIR}/wait_upload.log"
  rc=$?
  set -e
  echo "=== Campaign upload finished $(date -u +%Y-%m-%dT%H:%M:%SZ) exit=$rc ==="

  uploaded="$(python3 -c "
import json, os, sys
sys.path.insert(0, 'tasks/gutenberg/scripts')
from manifest_utils import RUN_STATE_PATH, load_json
s = load_json(RUN_STATE_PATH)
print(s.get('uploaded_count', 0))
" 2>/dev/null || echo 0)"

  prep_done="$(python3 -c "
import json, os, sys
sys.path.insert(0, 'tasks/gutenberg/scripts')
from manifest_utils import RUN_STATE_PATH, load_json
print(load_json(RUN_STATE_PATH).get('prep_done', False))
" 2>/dev/null || echo False)"

  # Only stop if upload phase ran (prep_done) but nothing was uploaded.
  if [[ "$uploaded" -eq 0 && "$prep_done" == "True" ]]; then
    echo "=== Campaign uploaded 0 books after prep — manifest likely exhausted; watcher exiting ==="
    exit 0
  fi
done
