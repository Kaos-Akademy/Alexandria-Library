#!/usr/bin/env python3
"""Sync statuses from batch/prep manifests into philosophy.json master manifest."""

from __future__ import annotations

import argparse
import glob
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import MASTER_MANIFEST, load_json, rel, save_json


def main() -> None:
    ap = argparse.ArgumentParser(description="Sync manifest statuses to philosophy.json.")
    ap.add_argument("--manifest", action="append", default=[], help="Manifest(s) to sync from")
    ap.add_argument("--all-batches", action="store_true", help="Sync all philosophy_next25_batch*.json")
    args = ap.parse_args()

    paths = list(args.manifest)
    if args.all_batches:
        paths.extend(sorted(glob.glob(rel("tasks/gutenberg/manifests/philosophy_next25_batch*.json"))))
    if not paths:
        ap.error("Provide --manifest or --all-batches")

    master = load_json(MASTER_MANIFEST)
    by_id = {e["gutenberg_id"]: e for e in master.get("entries") or [] if isinstance(e.get("gutenberg_id"), int)}

    updated = 0
    for path in paths:
        src = load_json(path)
        for e in src.get("entries") or []:
            gid = e.get("gutenberg_id")
            if not isinstance(gid, int) or gid not in by_id:
                continue
            new_status = e.get("status")
            if not new_status:
                continue
            row = by_id[gid]
            if row.get("status") != new_status:
                row["status"] = new_status
                updated += 1
            if e.get("error"):
                row["error"] = e["error"]

    save_json(MASTER_MANIFEST, master)
    print(f"Updated {updated} entries in {MASTER_MANIFEST}")


if __name__ == "__main__":
    main()
