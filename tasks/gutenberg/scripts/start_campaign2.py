#!/usr/bin/env python3
"""Archive campaign 1 run state and reset for the next 500-book prep/upload cycle."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import RUN_STATE_PATH, rel, save_run_state


def main() -> None:
    path = rel(RUN_STATE_PATH)
    with open(path, encoding="utf-8") as f:
        state = json.load(f)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    archive = rel(f"tasks/gutenberg/manifests/philosophy_500_run_state_campaign1_{stamp}.json")
    with open(archive, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")

    exclude = set(state.get("exclude_ids") or [])
    deferred = sorted(set(state.get("deferred_ids") or []))
    failed = sorted(set(state.get("failed_ids") or []))

    # Continue batch numbering after campaign 1 (batches 1–22).
    next_batch = 23
    for b in state.get("batches") or []:
        n = b.get("batch")
        if isinstance(n, int) and n >= next_batch:
            next_batch = n + 1

    new_state = {
        "target": 500,
        "uploaded_count": 0,
        "prep_done": False,
        "current_batch": next_batch,
        "exclude_ids": sorted(exclude),
        "deferred_ids": deferred,
        "failed_ids": failed,
        "needs_repair_ids": list(state.get("needs_repair_ids") or []),
        "batches": [],
        "campaign": 2,
        "previous_campaign": {
            "uploaded_count": state.get("uploaded_count", 0),
            "archive": archive,
        },
    }
    save_run_state(new_state)

    print(f"Archived campaign 1 -> {archive}")
    print(
        f"Campaign 2: target=500 uploaded_count=0 prep_done=false "
        f"start_batch={next_batch} exclude_ids={len(exclude)}"
    )


if __name__ == "__main__":
    main()
