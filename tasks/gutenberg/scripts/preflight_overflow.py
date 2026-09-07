#!/usr/bin/env python3
"""Preflight overflow scan; mark deferred_repair before upload."""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import (
    MASTER_MANIFEST,
    PREP_MANIFEST,
    book_has_overflow,
    has_split_cache,
    load_json,
    load_run_state,
    log,
    save_json,
    save_run_state,
)


def sync_master_status(gids: set[int], status: str, error: str | None = None) -> None:
    master = load_json(MASTER_MANIFEST)
    for e in master.get("entries") or []:
        if e.get("gutenberg_id") in gids:
            e["status"] = status
            if error:
                e["error"] = error
    save_json(MASTER_MANIFEST, master)


def scan_manifest(manifest_path: str, state: dict, log_path: str | None) -> int:
    m = load_json(manifest_path)
    deferred = set(state.get("deferred_ids") or [])
    marked = 0
    overflow_msg = "section overflow; requires contract bulk-append"

    for e in m.get("entries") or []:
        gid = e.get("gutenberg_id")
        if not isinstance(gid, int):
            continue
        st = (e.get("status") or "").strip().lower()
        if st in ("uploaded", "deferred_repair", "needs_review"):
            continue
        if not has_split_cache(gid):
            continue
        has_ov, detail = book_has_overflow(e)
        if not has_ov:
            continue
        e["status"] = "deferred_repair"
        e["error"] = detail or overflow_msg
        deferred.add(gid)
        marked += 1
        log(f"deferred PG {gid}: {detail}", log_path)

    save_json(manifest_path, m)
    if marked:
        sync_master_status({e["gutenberg_id"] for e in m["entries"] if e.get("status") == "deferred_repair"}, "deferred_repair", overflow_msg)
    state["deferred_ids"] = sorted(deferred)
    state["exclude_ids"] = sorted(set(state.get("exclude_ids") or []) | deferred)
    save_run_state(state)
    return marked


def main() -> None:
    ap = argparse.ArgumentParser(description="Preflight overflow scan.")
    ap.add_argument("--manifest", default="", help="Manifest to scan (default: prep manifest)")
    ap.add_argument("--log", default="logs/philosophy_500/prep.log")
    args = ap.parse_args()

    state = load_run_state()
    path = args.manifest or PREP_MANIFEST
    n = scan_manifest(path, state, args.log)
    print(f"Marked {n} book(s) deferred_repair in {path}")


if __name__ == "__main__":
    main()
