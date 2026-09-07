#!/usr/bin/env bash
# Finish incomplete fiction_next500 batches, continue upload, then auto-chain campaigns.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

export UPLOAD_GENRE=fiction
export UPLOAD_BATCH_PREFIX=fiction_next500
export UPLOAD_TARGET=1000
export UPLOAD_SIGNER="${UPLOAD_SIGNER:-Alexandria-II}"
export UPLOAD_KEY_COUNT="${UPLOAD_KEY_COUNT:-100}"
export UPLOAD_BOOK_CONCURRENCY="${UPLOAD_BOOK_CONCURRENCY:-25}"
export UPLOAD_LAUNCH_STAGGER_MS="${UPLOAD_LAUNCH_STAGGER_MS:-100}"
export UPLOAD_REPAIR_CONCURRENCY="${UPLOAD_REPAIR_CONCURRENCY:-25}"

LOG_DIR="logs/fiction_1000"
CONTINUE_LOG="${CONTINUE_LOG:-${LOG_DIR}/continue_$(date +%Y%m%d_%H%M%S).log}"

if [[ "${CONTINUE_DETACHED:-}" != "1" && ! -t 1 ]]; then
  export CONTINUE_DETACHED=1
  mkdir -p "$LOG_DIR"
  nohup env CONTINUE_DETACHED=1 CONTINUE_LOG="$CONTINUE_LOG" \
    python3 -c "import os,sys; os.setsid(); os.execvpe(sys.argv[1], sys.argv[1:], os.environ)" \
    bash "$0" >>"$CONTINUE_LOG" 2>&1 &
  echo "Detached continue_fiction_campaign PID $! Log: $CONTINUE_LOG"
  exit 0
fi

mkdir -p "$LOG_DIR"
exec >>"$CONTINUE_LOG" 2>&1

echo "=== continue_fiction_campaign started $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# Retry any batch manifest that still has split entries.
for MANIFEST in tasks/gutenberg/manifests/fiction_next500_batch*.json; do
  [[ -f "$MANIFEST" ]] || continue
  BATCH="$(basename "$MANIFEST" | sed -E 's/^fiction_next500_batch([0-9]+)\.json$/\1/')"
  [[ "$BATCH" =~ ^[0-9]+$ ]] || continue
  SPLIT="$(python3 -c "import json; m=json.load(open('$MANIFEST')); print(sum(1 for e in m['entries'] if e.get('status')=='split'))")"
  if [[ "$SPLIT" -eq 0 ]]; then
    continue
  fi
  echo "=== Running batch $BATCH ($SPLIT split remaining) ==="
  bash tasks/gutenberg/scripts/run_batch_upload.sh "$BATCH"
done

echo "=== Continuing campaign upload loop (--skip-prep) ==="
set +e
UPLOAD_FOREGROUND=1 bash tasks/gutenberg/scripts/run_500_upload.sh --genre fiction --skip-prep
SKIP_RC=$?
set -e
echo "=== skip-prep upload finished exit=$SKIP_RC ==="

echo "=== Auto-chaining campaigns until master manifest exhausted ==="
exec bash tasks/gutenberg/scripts/wait_campaign_and_next.sh
