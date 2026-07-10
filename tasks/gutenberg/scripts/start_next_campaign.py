#!/usr/bin/env python3
"""Archive current run state and reset for the next 500-book prep/upload cycle."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import RUN_STATE_PATH, load_json, rel, save_run_state


def main() -> None:
    path = rel(RUN_STATE_PATH)
    state = load_json(RUN_STATE_PATH)

    campaign = int(state.get("campaign") or 1)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    archive = rel(f"tasks/gutenberg/manifests/philosophy_500_run_state_campaign{campaign}_{stamp}.json")
    with open(archive, "w", encoding="utf-8") as f:
        import json

        json.dump(state, f, indent=2)
        f.write("\n")

    exclude = set(state.get("exclude_ids") or [])
    deferred = sorted(set(state.get("deferred_ids") or []))
    failed = sorted(set(state.get("failed_ids") or []))

    next_batch = 1
    for b in state.get("batches") or []:
        n = b.get("batch")
        if isinstance(n, int) and n >= next_batch:
            next_batch = n + 1
    cur = state.get("current_batch")
    if isinstance(cur, int) and cur >= next_batch:
        next_batch = cur

    new_campaign = campaign + 1
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
        "campaign": new_campaign,
        "previous_campaign": {
            "campaign": campaign,
            "uploaded_count": state.get("uploaded_count", 0),
            "archive": archive,
        },
    }
    save_run_state(new_state)

    print(f"Archived campaign {campaign} -> {archive}")
    print(
        f"Campaign {new_campaign}: target=500 uploaded_count=0 prep_done=false "
        f"start_batch={next_batch} exclude_ids={len(exclude)}"
    )


if __name__ == "__main__":
    main()
