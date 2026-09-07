#!/usr/bin/env python3
"""
Build a manifest slice of the next N books ready for upload (status=split)
whose titles are not yet on-chain.

Requires: flow CLI configured in repo root (flow.json), network access for mainnet.

Examples:
  # First 25 status=split rows (no Flow; use when CLI is not configured):
  python3 tasks/gutenberg/scripts/build_next_manifest.py --local-only --limit 25 \\
    --source-manifest tasks/gutenberg/manifests/philosophy.json \\
    --out tasks/gutenberg/manifests/philosophy_next25_batch1.json

  # Exclude titles already on mainnet (requires `flow` + flow.json):
  python3 tasks/gutenberg/scripts/build_next_manifest.py --limit 25 --require-cache \\
    --source-manifest tasks/gutenberg/manifests/philosophy.json \\
    --out tasks/gutenberg/manifests/philosophy_next25_batch1.json

  # Skip specific IDs (e.g. known oversized books):
  python3 tasks/gutenberg/scripts/build_next_manifest.py --limit 25 --require-cache \\
    --exclude-ids 11248,11275 \\
    --out tasks/gutenberg/manifests/philosophy_next25_batch1.json

  # Skip IDs already present in other batch manifests:
  python3 tasks/gutenberg/scripts/build_next_manifest.py --limit 25 --require-cache \\
    --exclude-manifests tasks/gutenberg/manifests/philosophy_next25_batch1.json \\
    --out tasks/gutenberg/manifests/philosophy_next25_batch2.json
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import subprocess
import sys
from typing import Any


def repo_root() -> str:
    # This file lives at tasks/gutenberg/scripts/ — three levels up is the repo root.
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def has_split_cache(gutenberg_id: int, cache_root: str) -> bool:
    """True when books/pg-cache/<id>/ has at least one section file."""
    cache_dir = os.path.join(cache_root, str(gutenberg_id))
    if not os.path.isdir(cache_dir):
        return False
    return bool(glob.glob(os.path.join(cache_dir, "PG*_Section_*.txt")))


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
        "--config-path",
        os.path.join(root, "flow.json"),
        "scripts",
        "execute",
        "tasks/gutenberg/scripts/list_all_book_titles.cdc",
        "--network",
        network,
        "--format",
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
    ap.add_argument("--limit", type=int, default=25, help="Max entries (default 25)")
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
    ap.add_argument(
        "--exclude-ids",
        default="",
        help="Comma-separated gutenberg_id values to skip (e.g. --exclude-ids 11248,11275).",
    )
    ap.add_argument(
        "--exclude-manifests",
        default="",
        help="Comma-separated manifest file paths whose IDs to exclude (e.g. already-batched manifests).",
    )
    ap.add_argument(
        "--require-cache",
        action="store_true",
        help="Only include entries with split section files under books/pg-cache/<id>/.",
    )
    ap.add_argument(
        "--cache-root",
        default="books/pg-cache",
        help="Cache root for --require-cache (default books/pg-cache).",
    )
    ap.add_argument(
        "--status",
        default="split",
        help="Manifest status to select (default split). Use pending for the next fetch/split queue.",
    )
    ap.add_argument(
        "--mark-split",
        action="store_true",
        help="Set status=split on output entries (use with --status pending before pipeline-manifest).",
    )
    args = ap.parse_args()

    # Build excluded ID set from --exclude-ids and --exclude-manifests
    exclude_ids: set[int] = set()
    for part in args.exclude_ids.split(","):
        part = part.strip()
        if part:
            try:
                exclude_ids.add(int(part))
            except ValueError:
                sys.stderr.write(f"Warning: --exclude-ids value {part!r} is not an integer; ignored.\n")
    for mpath in args.exclude_manifests.split(","):
        mpath = mpath.strip()
        if not mpath:
            continue
        full = mpath if os.path.isabs(mpath) else os.path.join(repo_root(), mpath)
        if not os.path.exists(full):
            sys.stderr.write(f"Warning: --exclude-manifests file {full!r} not found; ignored.\n")
            continue
        with open(full, encoding="utf-8") as f:
            em = json.load(f)
        for e in em.get("entries") or []:
            gid = e.get("gutenberg_id")
            if isinstance(gid, int):
                exclude_ids.add(gid)

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

    cache_root = args.cache_root if os.path.isabs(args.cache_root) else os.path.join(root, args.cache_root)

    want_status = (args.status or "split").strip().lower()
    entries = manifest.get("entries") or []
    picked: list[dict] = []
    for e in entries:
        if len(picked) >= args.limit:
            break
        status = (e.get("status") or "").strip().lower()
        if status != want_status:
            continue
        title = (e.get("title") or "").strip()
        if not title:
            continue
        gid = e.get("gutenberg_id")
        if isinstance(gid, int) and gid in exclude_ids:
            continue
        if args.require_cache:
            if not isinstance(gid, int) or not has_split_cache(gid, cache_root):
                continue
        if on_chain is not None and title in on_chain:
            continue
        row = dict(e)
        if args.mark_split:
            row["status"] = "split"
        picked.append(row)

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
    if exclude_ids:
        print(f"Excluded IDs: {sorted(exclude_ids)}")
    if len(picked) < args.limit:
        print(f"Warning: only {len(picked)} books matched (limit was {args.limit}).", file=sys.stderr)


if __name__ == "__main__":
    main()
