#!/usr/bin/env bash
# Upload one batch: gates -> upload@15 -> repair@5 -> verify -> sync.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
source tasks/gutenberg/scripts/upload_lock.sh

BATCH_NUM="${1:?usage: run_batch_upload.sh BATCH_NUM}"
GENRE="${UPLOAD_GENRE:-philosophy}"
BATCH_PREFIX="${UPLOAD_BATCH_PREFIX:-philosophy_next25}"
LOG_DIR="logs/${GENRE}_500"
BOOK_CONCURRENCY="${UPLOAD_BOOK_CONCURRENCY:-15}"
KEY_COUNT="${UPLOAD_KEY_COUNT:-25}"
REPAIR_CONCURRENCY="${UPLOAD_REPAIR_CONCURRENCY:-5}"
MANIFEST="tasks/gutenberg/manifests/${BATCH_PREFIX}_batch${BATCH_NUM}.json"
LOG_FILE="${LOG_DIR}/batch${BATCH_NUM}_$(date +%Y%m%d_%H%M%S).log"
UPLOAD_LOG="${LOG_DIR}/batch${BATCH_NUM}_upload.log"
REPAIR_LOG="${LOG_DIR}/batch${BATCH_NUM}_repair.log"

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== Batch $BATCH_NUM upload started $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

acquire_upload_lock
trap release_upload_lock EXIT

# Gate 1: manifest exists
if [[ ! -f "$MANIFEST" ]]; then
  echo "ERROR: manifest not found: $MANIFEST" >&2
  exit 1
fi

# Gate 2: entry count (allow partial final batch >=1)
ENTRY_COUNT="$(python3 -c "import json; print(len(json.load(open('$MANIFEST'))['entries']))")"
if [[ "$ENTRY_COUNT" -lt 1 ]]; then
  echo "ERROR: batch manifest empty" >&2
  exit 1
fi
echo "Batch entries: $ENTRY_COUNT"

# Gate 3: all entries have cache
python3 -c "
import json, sys, os
sys.path.insert(0, os.path.join('$ROOT', 'tasks/gutenberg/scripts'))
from manifest_utils import has_split_cache, rel
m = json.load(open(rel('$MANIFEST')))
missing = [e['gutenberg_id'] for e in m['entries'] if not has_split_cache(e['gutenberg_id'])]
if missing:
    print('Missing cache for IDs:', missing, file=sys.stderr)
    sys.exit(1)
print('Cache gate OK for', len(m['entries']), 'books')
" || { echo "ERROR: cache gate failed"; exit 1; }

# Gate 4: overflow preflight on batch (mark deferred before upload)
python3 tasks/gutenberg/scripts/preflight_overflow.py --manifest "$MANIFEST" --log "$LOG_FILE" || true

# Gate 5: Flow CLI reachable
echo "Flow ping..."
flow_ping || { echo "ERROR: Flow CLI unreachable"; exit 1; }

# Initial upload pass
echo "Initial upload (concurrency ${BOOK_CONCURRENCY}, keys ${KEY_COUNT})..."
set +e
go run ./cmd/gutenberg upload \
  -manifest "$MANIFEST" \
  -network mainnet \
  -signer Prime-librarian \
  -uploader sdk \
  -book-concurrency "$BOOK_CONCURRENCY" \
  -proposer-key-count "$KEY_COUNT" 2>&1 | tee "$UPLOAD_LOG"
UPLOAD_RC=${PIPESTATUS[0]}
set -e
echo "Initial upload exit code: $UPLOAD_RC"

# Auto-repair pass if any split entries remain
SPLIT_REMAINING="$(python3 -c "import json; m=json.load(open('$MANIFEST')); print(sum(1 for e in m['entries'] if e.get('status')=='split'))")"
if [[ "$SPLIT_REMAINING" -gt 0 ]]; then
  echo "Repair pass for $SPLIT_REMAINING remaining split entries (concurrency ${REPAIR_CONCURRENCY})..."
  set +e
  go run ./cmd/gutenberg upload \
    -manifest "$MANIFEST" \
    -network mainnet \
    -signer Prime-librarian \
    -uploader sdk \
    -book-concurrency "$REPAIR_CONCURRENCY" \
    -proposer-key-count "$KEY_COUNT" \
    -repair 2>&1 | tee "$REPAIR_LOG"
  REPAIR_RC=${PIPESTATUS[0]}
  set -e
  echo "Repair exit code: $REPAIR_RC"
fi

# Mark overflow failures from logs as deferred
python3 -c "
import json, re, sys, os
sys.path.insert(0, os.path.join('$ROOT', 'tasks/gutenberg/scripts'))
from manifest_utils import load_json, save_json, load_run_state, save_run_state, MASTER_MANIFEST

manifest_path = '$MANIFEST'
upload_log = '$UPLOAD_LOG'
m = load_json(manifest_path)
state = load_run_state()
deferred = set(state.get('deferred_ids') or [])

overflow_re = re.compile(r'overflow paragraphs', re.I)

try:
    log_text = open(upload_log).read()
except FileNotFoundError:
    log_text = ''

for e in m.get('entries') or []:
    if e.get('status') != 'split':
        continue
    gid = e.get('gutenberg_id')
    if f'PG {gid}' in log_text and overflow_re.search(log_text):
        e['status'] = 'deferred_repair'
        e['error'] = 'section overflow; requires contract bulk-append'
        deferred.add(gid)

save_json(manifest_path, m)
master = load_json(MASTER_MANIFEST)
for e in master.get('entries') or []:
    if e.get('gutenberg_id') in deferred:
        e['status'] = 'deferred_repair'
        e['error'] = 'section overflow; requires contract bulk-append'
save_json(MASTER_MANIFEST, master)
state['deferred_ids'] = sorted(deferred)
state['exclude_ids'] = sorted(set(state.get('exclude_ids') or []) | deferred)
save_run_state(state)
"

# Verify (non-fatal mismatch -> logged in run state)
set +e
python3 tasks/gutenberg/scripts/verify_batch.py --manifest "$MANIFEST"
VERIFY_RC=$?
set -e
if [[ "$VERIFY_RC" -ne 0 ]]; then
  echo "WARNING: verify_batch reported issues (see needs_repair_ids in run state)"
fi

# Sync to master manifest
python3 tasks/gutenberg/scripts/sync_manifest_status.py --manifest "$MANIFEST"

# Update run state
python3 -c "
import json, os, sys
sys.path.insert(0, os.path.join('$ROOT', 'tasks/gutenberg/scripts'))
from manifest_utils import load_json, load_run_state, save_run_state

batch_num = int('$BATCH_NUM')
manifest = '$MANIFEST'
m = load_json(manifest)
state = load_run_state()

uploaded = sum(1 for e in m['entries'] if e.get('status') == 'uploaded')
deferred = sum(1 for e in m['entries'] if e.get('status') == 'deferred_repair')
ids = [e['gutenberg_id'] for e in m['entries']]

prev_uploaded = 0
for b in state.get('batches') or []:
    if b.get('batch') == batch_num:
        prev_uploaded = b.get('uploaded', 0)
        break
delta = max(0, uploaded - prev_uploaded)
state['uploaded_count'] = state.get('uploaded_count', 0) + delta

found = False
for b in state.get('batches') or []:
    if b.get('batch') == batch_num:
        b['uploaded'] = uploaded
        b['deferred'] = deferred
        b['ids'] = ids
        b['manifest'] = manifest
        found = True
        break
if not found:
    state.setdefault('batches', []).append({
        'batch': batch_num,
        'manifest': manifest,
        'uploaded': uploaded,
        'deferred': deferred,
        'ids': ids,
    })

state['current_batch'] = batch_num + 1
state['exclude_ids'] = sorted(set(state.get('exclude_ids') or []) | set(ids))
save_run_state(state)
print(f'Run state: uploaded_count={state[\"uploaded_count\"]}/{state[\"target\"]} batch={batch_num} uploaded={uploaded} deferred={deferred}')
"

echo "=== Batch $BATCH_NUM complete $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
