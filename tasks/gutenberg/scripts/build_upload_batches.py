#!/usr/bin/env python3
"""Slice prep manifest into philosophy_next25_batchN.json upload batches."""

from __future__ import annotations

import argparse
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import (
    PREP_MANIFEST,
    flow_on_chain_titles,
    has_split_cache,
    load_json,
    load_run_state,
    save_json,
    save_run_state,
)


def main() -> None:
    ap = argparse.ArgumentParser(description="Build upload batch manifests from prep pool.")
    ap.add_argument("--prep-manifest", default=PREP_MANIFEST)
    default_batch_size = int(os.environ.get("UPLOAD_BATCH_SIZE", "25"))
    ap.add_argument("--batch-size", type=int, default=default_batch_size)
    ap.add_argument("--start-batch", type=int, default=0, help="Override start batch number")
    ap.add_argument("--max-batches", type=int, default=0, help="Max batches to create (0=until target)")
    ap.add_argument("--network", default="mainnet")
    args = ap.parse_args()

    state = load_run_state()
    prep = load_json(args.prep_manifest)
    on_chain = flow_on_chain_titles(args.network)
    deferred = set(state.get("deferred_ids") or [])
    exclude = set(state.get("exclude_ids") or [])

    eligible = []
    for e in prep.get("entries") or []:
        gid = e.get("gutenberg_id")
        if not isinstance(gid, int):
            continue
        st = (e.get("status") or "").strip().lower()
        if st != "split":
            continue
        if gid in deferred or gid in exclude:
            continue
        if not has_split_cache(gid):
            continue
        title = (e.get("title") or "").strip()
        if title in on_chain:
            continue
        eligible.append(e)

    remaining_target = max(0, state["target"] - state["uploaded_count"])
    need = min(len(eligible), remaining_target)
    eligible = eligible[:need]

    start = args.start_batch or state.get("current_batch") or 5
    batch_size = args.batch_size
    n_batches = math.ceil(len(eligible) / batch_size) if eligible else 0
    if args.max_batches:
        n_batches = min(n_batches, args.max_batches)

    batch_prefix = os.environ.get("UPLOAD_BATCH_PREFIX", f"philosophy_next{args.batch_size}")
    created = []
    idx = 0
    for b in range(n_batches):
        batch_num = start + b
        chunk = eligible[idx : idx + batch_size]
        if not chunk:
            break
        idx += len(chunk)
        out = f"tasks/gutenberg/manifests/{batch_prefix}_batch{batch_num}.json"
        save_json(out, {"version": prep.get("version", 1), "entries": chunk})
        created.append({"batch": batch_num, "manifest": out, "count": len(chunk)})
        print(f"Wrote batch {batch_num}: {len(chunk)} entries -> {out}")

    if created:
        # Next upload starts at the first manifest created, not the last.
        state["current_batch"] = created[0]["batch"]
    state["prep_done"] = True
    save_run_state(state)
    print(f"Created {len(created)} batch manifest(s); eligible pool={len(eligible)}")


if __name__ == "__main__":
    main()
