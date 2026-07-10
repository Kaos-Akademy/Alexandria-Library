#!/usr/bin/env python3
"""Post-upload batch verification: on-chain title + chapter counts."""

from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import (
    flow_chapter_count,
    flow_on_chain_titles,
    load_json,
    load_run_state,
    local_section_count,
    save_run_state,
)


def main() -> None:
    ap = argparse.ArgumentParser(description="Verify uploaded batch entries on-chain.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--network", default="mainnet")
    ap.add_argument("--json", action="store_true", help="Print JSON report")
    args = ap.parse_args()

    m = load_json(args.manifest)
    on_chain = flow_on_chain_titles(args.network)
    state = load_run_state()
    needs_repair = set(state.get("needs_repair_ids") or [])

    report = {"ok": [], "missing_title": [], "chapter_mismatch": [], "skipped": []}

    for e in m.get("entries") or []:
        gid = e.get("gutenberg_id")
        title = (e.get("title") or "").strip()
        st = (e.get("status") or "").strip().lower()

        if st == "deferred_repair":
            report["skipped"].append({"gutenberg_id": gid, "reason": "deferred"})
            continue
        if st != "uploaded":
            report["skipped"].append({"gutenberg_id": gid, "reason": f"status={st}"})
            continue

        if title not in on_chain:
            report["missing_title"].append({"gutenberg_id": gid, "title": title})
            continue

        local = local_section_count(gid)
        remote = flow_chapter_count(title, args.network)
        if remote < 0:
            report["chapter_mismatch"].append(
                {"gutenberg_id": gid, "local": local, "remote": "unknown"}
            )
            if isinstance(gid, int):
                needs_repair.add(gid)
        elif remote < local:
            report["chapter_mismatch"].append(
                {"gutenberg_id": gid, "local": local, "remote": remote}
            )
            if isinstance(gid, int):
                needs_repair.add(gid)
        else:
            report["ok"].append({"gutenberg_id": gid, "local": local, "remote": remote})

    state["needs_repair_ids"] = sorted(needs_repair)
    save_run_state(state)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"OK: {len(report['ok'])} missing_title: {len(report['missing_title'])} "
              f"chapter_mismatch: {len(report['chapter_mismatch'])} skipped: {len(report['skipped'])}")

    if report["missing_title"] or report["chapter_mismatch"]:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
