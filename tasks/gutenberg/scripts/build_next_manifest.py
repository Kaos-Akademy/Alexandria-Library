#!/usr/bin/env python3
"""
Build a manifest slice of the next N books ready for upload (status=split)
whose titles are not yet on-chain.

Requires: flow CLI configured in repo root (flow.json), network access for mainnet.

Examples:
  # First 100 status=split rows (no Flow; use when CLI is not configured):
  python3 tasks/gutenberg/scripts/build_next_manifest.py --local-only --limit 100 \\
    --source-manifest tasks/gutenberg/manifests/philosophy.json \\
    --out tasks/gutenberg/manifests/philosophy_next100.json

  # Exclude titles already on mainnet (requires `flow` + flow.json):
  python3 tasks/gutenberg/scripts/build_next_manifest.py --limit 100 \\
    --source-manifest tasks/gutenberg/manifests/philosophy.json \\
    --out tasks/gutenberg/manifests/philosophy_next100.json
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from typing import Any


def repo_root() -> str:
    # This file lives at tasks/gutenberg/scripts/ — three levels up is the repo root.
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def extract_string_titles(obj: Any) -> list[str] | None:
    """Parse Flow script JSON: find an array of strings (Cadence [String])."""
    if isinstance(obj, str):
        return None
    if isinstance(obj, list):
        if obj and all(isinstance(x, str) for x in obj):
            return obj
        for x in obj:
            r = extract_string_titles(x)
            if r is not None:
                return r
        return None
    if isinstance(obj, dict):
        t = obj.get("type")
        if t == "Array" and "value" in obj:
            inner = obj["value"]
            if isinstance(inner, list):
                out: list[str] = []
                for item in inner:
                    if isinstance(item, dict) and item.get("type") == "String" and "value" in item:
                        out.append(str(item["value"]))
                    elif isinstance(item, str):
                        out.append(item)
                if out:
                    return out
        for v in obj.values():
            r = extract_string_titles(v)
            if r is not None:
                return r
    return None


def flow_on_chain_titles(network: str) -> set[str]:
    root = repo_root()
    cmd = [
        "flow",
        "scripts",
        "execute",
        "tasks/gutenberg/scripts/list_all_book_titles.cdc",
        "--network",
        network,
        "-f",
        "json",
    ]
    proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr or proc.stdout or "flow failed\n")
        sys.exit(proc.returncode or 1)
    data = json.loads(proc.stdout)
    titles = extract_string_titles(data)
    if titles is None:
        sys.stderr.write("Could not parse Flow JSON for [String] titles.\n")
        sys.stderr.write(proc.stdout[:2000] + "\n")
        sys.exit(1)
    return {t.strip() for t in titles if t and t.strip()}


def main() -> None:
    ap = argparse.ArgumentParser(description="Build next-N manifest not yet on-chain.")
    ap.add_argument("--limit", type=int, default=100, help="Max entries (default 100)")
    ap.add_argument(
        "--source-manifest",
        default="tasks/gutenberg/manifests/philosophy.json",
        help="Full manifest JSON path",
    )
    ap.add_argument("--out", required=True, help="Output manifest path")
    ap.add_argument("--network", default="mainnet", help="Flow network for title list")
    ap.add_argument(
        "--titles-json",
        default="",
        help="Optional path to JSON array of on-chain titles (skip flow if set)",
    )
    ap.add_argument(
        "--local-only",
        action="store_true",
        help="Do not call flow: take the first --limit manifest rows with status=split (manifest order).",
    )
    args = ap.parse_args()

    if args.local_only:
        on_chain: set[str] | None = None
    elif args.titles_json:
        with open(args.titles_json, encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, list):
            on_chain = {str(t).strip() for t in raw}
        else:
            t = extract_string_titles(raw)
            on_chain = set(t) if t else set()
    else:
        on_chain = flow_on_chain_titles(args.network)

    root = repo_root()
    src = args.source_manifest if os.path.isabs(args.source_manifest) else os.path.join(root, args.source_manifest)
    with open(src, encoding="utf-8") as f:
        manifest = json.load(f)

    entries = manifest.get("entries") or []
    picked: list[dict] = []
    for e in entries:
        if len(picked) >= args.limit:
            break
        status = (e.get("status") or "").strip().lower()
        if status != "split":
            continue
        title = (e.get("title") or "").strip()
        if not title:
            continue
        if on_chain is not None and title in on_chain:
            continue
        picked.append(e)

    out_path = args.out if os.path.isabs(args.out) else os.path.join(root, args.out)
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    out_manifest = {"version": manifest.get("version", 1), "entries": picked}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_manifest, f, indent=2)
        f.write("\n")

    if on_chain is None:
        print(f"Wrote {len(picked)} entries to {out_path} (--local-only, first split rows)")
    else:
        print(f"Wrote {len(picked)} entries to {out_path} (on-chain titles excluded: {len(on_chain)})")
    if len(picked) < args.limit:
        print(f"Warning: only {len(picked)} books matched (limit was {args.limit}).", file=sys.stderr)


if __name__ == "__main__":
    main()
