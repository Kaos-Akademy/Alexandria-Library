#!/usr/bin/env bash
# Main orchestrator: prep (fetch/split/overflow/batch-slice) then upload loop until target.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
source tasks/gutenberg/scripts/upload_lock.sh

SKIP_PREP=false
PREP_ONLY=false
FROM_BATCH=0
PREP_LIMIT=0
PREP_STATUS="pending"
DRY_RUN=false
MAX_BATCHES=0
UPLOAD_GENRE="philosophy"

usage() {
  echo "Usage: $0 [--genre NAME] [--skip-prep] [--prep-only] [--prep-status STATUS] [--from-batch N] [--prep-limit N] [--dry-run] [--max-batches N]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --genre) UPLOAD_GENRE="$2"; shift 2 ;;
    --skip-prep) SKIP_PREP=true; shift ;;
    --prep-only) PREP_ONLY=true; shift ;;
    --prep-status) PREP_STATUS="$2"; shift 2 ;;
    --from-batch) FROM_BATCH="$2"; shift 2 ;;
    --prep-limit) PREP_LIMIT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; PREP_LIMIT=5; MAX_BATCHES=1; shift ;;
    --max-batches) MAX_BATCHES="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

export UPLOAD_GENRE

if [[ "$UPLOAD_GENRE" == "fiction" ]]; then
  export UPLOAD_BATCH_PREFIX="${UPLOAD_BATCH_PREFIX:-fiction_next50}"
  export UPLOAD_BATCH_SIZE="${UPLOAD_BATCH_SIZE:-50}"
  export UPLOAD_BOOK_CONCURRENCY="${UPLOAD_BOOK_CONCURRENCY:-50}"
  export UPLOAD_KEY_COUNT="${UPLOAD_KEY_COUNT:-50}"
  export UPLOAD_REPAIR_CONCURRENCY="${UPLOAD_REPAIR_CONCURRENCY:-10}"
else
  export UPLOAD_BATCH_PREFIX="${UPLOAD_BATCH_PREFIX:-${UPLOAD_GENRE}_next25}"
  export UPLOAD_BATCH_SIZE="${UPLOAD_BATCH_SIZE:-25}"
  export UPLOAD_BOOK_CONCURRENCY="${UPLOAD_BOOK_CONCURRENCY:-15}"
  export UPLOAD_KEY_COUNT="${UPLOAD_KEY_COUNT:-25}"
  export UPLOAD_REPAIR_CONCURRENCY="${UPLOAD_REPAIR_CONCURRENCY:-5}"
fi

LOG_DIR="logs/${UPLOAD_GENRE}_500"
mkdir -p "$LOG_DIR"
RUN_LOG="${LOG_DIR}/run_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$RUN_LOG") 2>&1

echo "=== 500-book upload run started $(date -u +%Y-%m-%dT%H:%M:%SZ) genre=${UPLOAD_GENRE} ==="
echo "Log: $RUN_LOG"
echo "Batch prefix: ${UPLOAD_BATCH_PREFIX} size=${UPLOAD_BATCH_SIZE} concurrency=${UPLOAD_BOOK_CONCURRENCY} keys=${UPLOAD_KEY_COUNT}"

read -r STATE_FILE PREP_MANIFEST MASTER_MANIFEST <<< "$(python3 -c "
import os, sys
sys.path.insert(0, 'tasks/gutenberg/scripts')
from manifest_utils import RUN_STATE_PATH, PREP_MANIFEST, MASTER_MANIFEST
print(RUN_STATE_PATH, PREP_MANIFEST, MASTER_MANIFEST)
")"

if [[ ! -f "$STATE_FILE" ]]; then
  python3 tasks/gutenberg/scripts/init_run_state.py --force
fi

# --- Phase A: Prep ---
PREP_DONE="$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('prep_done', False))")"

if [[ "$SKIP_PREP" != true && "$PREP_DONE" != "True" ]]; then
  echo "=== Phase A: build prep manifest ==="
  REMAINING="$(python3 -c "import json; s=json.load(open('$STATE_FILE')); print(max(0, s['target']-s['uploaded_count']))")"
  EXCLUDE="$(python3 -c "import json; print(','.join(str(x) for x in json.load(open('$STATE_FILE'))['exclude_ids']))")"

  if [[ "$DRY_RUN" == true ]]; then
    REMAINING=5
    PREP_OUT="tasks/gutenberg/manifests/${UPLOAD_GENRE}_500_prep_dryrun.json"
  else
    PREP_OUT="$PREP_MANIFEST"
  fi

  python3 tasks/gutenberg/scripts/build_next_manifest.py \
    --limit "$REMAINING" \
    --status "$PREP_STATUS" \
    --mark-split \
    --exclude-ids "$EXCLUDE" \
    --source-manifest "$MASTER_MANIFEST" \
    --out "$PREP_OUT"

  echo "=== Phase A: fetch+split ==="
  echo "Building bin/gutenberg (once) for faster per-book fetch/split..."
  mkdir -p bin
  go build -o bin/gutenberg ./cmd/gutenberg
  if [[ "$PREP_LIMIT" -gt 0 ]]; then
    python3 tasks/gutenberg/scripts/fetch_split_resumable.py \
      --prep-manifest "$PREP_OUT" \
      --log "$LOG_DIR/prep.log" \
      --limit "$PREP_LIMIT"
  else
    python3 tasks/gutenberg/scripts/fetch_split_resumable.py \
      --prep-manifest "$PREP_OUT" \
      --log "$LOG_DIR/prep.log"
  fi

  echo "=== Phase A: overflow preflight ==="
  python3 tasks/gutenberg/scripts/preflight_overflow.py \
    --manifest "$PREP_OUT" \
    --log "$LOG_DIR/prep.log"

  echo "=== Phase A: build upload batches ==="
  if [[ "$MAX_BATCHES" -gt 0 ]]; then
    python3 tasks/gutenberg/scripts/build_upload_batches.py \
      --prep-manifest "$PREP_OUT" \
      --max-batches "$MAX_BATCHES"
  else
    python3 tasks/gutenberg/scripts/build_upload_batches.py \
      --prep-manifest "$PREP_OUT"
  fi

  if [[ "$DRY_RUN" != true ]]; then
    python3 -c "
import json
s=json.load(open('$STATE_FILE'))
s['prep_done']=True
json.dump(s, open('$STATE_FILE','w'), indent=2)
open('$STATE_FILE','a').write('\n')
"
  else
    python3 -c "
import json
s=json.load(open('$STATE_FILE'))
s['prep_done']=False
json.dump(s, open('$STATE_FILE','w'), indent=2)
open('$STATE_FILE','a').write('\n')
"
    echo "Dry-run complete (prep_done left false for full run)"
  fi
else
  echo "Skipping Phase A (--skip-prep or prep_done=true)"
fi

if [[ "$PREP_ONLY" == true ]]; then
  echo "=== Prep-only run complete (prep_done=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('prep_done', False))")) ==="
  exit 0
fi

# --- Phase B: Upload loop ---
echo "=== Phase B: upload batches ==="
TARGET="$(python3 -c "import json; s=json.load(open('$STATE_FILE')); print(s['target'])")"
UPLOADED="$(python3 -c "import json; s=json.load(open('$STATE_FILE')); print(s['uploaded_count'])")"
CURRENT="$(python3 -c "import json; s=json.load(open('$STATE_FILE')); print(s['current_batch'])")"

if [[ "$FROM_BATCH" -gt 0 ]]; then
  CURRENT="$FROM_BATCH"
fi

BATCHES_RUN=0
while [[ "$UPLOADED" -lt "$TARGET" ]]; do
  MANIFEST="tasks/gutenberg/manifests/${UPLOAD_BATCH_PREFIX}_batch${CURRENT}.json"
  if [[ ! -f "$MANIFEST" ]]; then
    echo "No more batch manifests (missing $MANIFEST). Stopping."
    break
  fi

  bash tasks/gutenberg/scripts/run_batch_upload.sh "$CURRENT"

  UPLOADED="$(python3 -c "import json; print(json.load(open('$STATE_FILE'))['uploaded_count'])")"
  CURRENT="$(python3 -c "import json; print(json.load(open('$STATE_FILE'))['current_batch'])")"
  BATCHES_RUN=$((BATCHES_RUN + 1))

  if [[ "$MAX_BATCHES" -gt 0 && "$BATCHES_RUN" -ge "$MAX_BATCHES" ]]; then
    echo "Reached --max-batches $MAX_BATCHES"
    break
  fi
done

echo "=== Run complete: uploaded_count=$UPLOADED / target=$TARGET ==="
python3 -c "import json; print(json.dumps(json.load(open('$STATE_FILE')), indent=2))"
