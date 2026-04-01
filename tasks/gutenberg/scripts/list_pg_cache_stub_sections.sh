#!/usr/bin/env bash
# Lists pg-cache directory ids (Gutenberg id) that contain at least one section file
# with line count <= MAX (default 8). Use after noticing TOC-style or bogus tiny sections.
# Re-split with: go run ./cmd/gutenberg pipeline-manifest -manifest <manifest.json> -only-id <id>
set -euo pipefail
MAX="${1:-8}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
find books/pg-cache -name 'PG*_Section_*.txt' 2>/dev/null | while read -r f; do
  c=$(wc -l < "$f" | tr -d ' ')
  if [ "$c" -le "$MAX" ]; then
    dirname "$f" | sed 's|.*/pg-cache/||'
  fi
done | sort -n -u
