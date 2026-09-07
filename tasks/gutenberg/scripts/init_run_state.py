#!/usr/bin/env python3
"""Initialize or refresh philosophy_500_run_state.json from existing batch manifests."""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import RUN_STATE_PATH, save_run_state, seed_run_state


def main() -> None:
    ap = argparse.ArgumentParser(description="Seed philosophy 500 run state from batch manifests.")
    ap.add_argument("--force", action="store_true", help="Overwrite existing run state")
    args = ap.parse_args()

    import os

    from manifest_utils import rel

    if os.path.exists(rel(RUN_STATE_PATH)) and not args.force:
        print(f"Run state already exists at {RUN_STATE_PATH} (use --force to overwrite)")
        return

    state = seed_run_state()
    save_run_state(state)
    print(f"Wrote run state: uploaded_count={state['uploaded_count']} current_batch={state['current_batch']}")
    print(f"exclude_ids={len(state['exclude_ids'])} deferred_ids={len(state['deferred_ids'])}")


if __name__ == "__main__":
    main()
