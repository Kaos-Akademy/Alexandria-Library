#!/usr/bin/env python3
"""Build fiction.json from Project Gutenberg pg_catalog.csv."""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import load_json, rel, repo_root, save_json

CATALOG_URL = "https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv"
FICTION_LOCC_PREFIXES = ("PR", "PS", "PZ")
FICTION_SUBJECTS = (
    "fiction",
    "short stories",
    "adventure stories",
    "detective and mystery",
    "western stories",
    "science fiction",
    "historical fiction",
    "love stories",
    "fantasy fiction",
    "sea stories",
    "horror tales",
)


def download_catalog(dest: str) -> None:
    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    print(f"Downloading {CATALOG_URL} -> {dest}")
    urllib.request.urlretrieve(CATALOG_URL, dest)


def load_exclude_ids(exclude_run_state: str | None) -> set[int]:
    exclude: set[int] = set()
    if exclude_run_state:
        path = rel(exclude_run_state)
        if os.path.exists(path):
            state = load_json(exclude_run_state)
            for gid in state.get("exclude_ids") or []:
                if isinstance(gid, int):
                    exclude.add(gid)
            print(f"Loaded {len(exclude)} exclude_ids from {exclude_run_state}")
    return exclude


def parse_gutenberg_id(row: dict) -> int | None:
    raw = (row.get("Text#") or row.get("Text") or "").strip()
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def is_english(row: dict) -> bool:
    lang = (row.get("Language") or "").strip().lower()
    return lang in ("en", "english")


def locc_matches(locc: str) -> bool:
    locc = (locc or "").strip().upper()
    if not locc:
        return False
    for prefix in FICTION_LOCC_PREFIXES:
        if locc.startswith(prefix):
            return True
    return False


def subjects_match(subjects: str) -> bool:
    subj = (subjects or "").lower()
    return any(term in subj for term in FICTION_SUBJECTS)


def is_fiction_row(row: dict) -> bool:
    if not is_english(row):
        return False
    locc = row.get("LoCC") or ""
    subjects = row.get("Subjects") or ""
    return locc_matches(locc) or subjects_match(subjects)


def assign_genre(locc: str, subjects: str) -> str:
    subj = (subjects or "").lower()
    locc_u = (locc or "").upper()
    if "science fiction" in subj:
        return "Science Fiction"
    if "detective and mystery" in subj or "mystery fiction" in subj:
        return "Mystery"
    if "historical fiction" in subj:
        return "Historical Fiction"
    if "adventure stories" in subj:
        return "Adventure"
    if "poetry" in subj and (locc_u.startswith("PR") or locc_u.startswith("PS")):
        return "Poetry"
    return "Fiction"


def build_entries(rows: list[dict], exclude_ids: set[int]) -> list[dict]:
    seen: set[int] = set()
    entries: list[dict] = []
    for row in rows:
        gid = parse_gutenberg_id(row)
        if gid is None or gid in seen or gid in exclude_ids:
            continue
        if not is_fiction_row(row):
            continue
        title = (row.get("Title") or "").strip()
        if not title:
            continue
        seen.add(gid)
        locc = (row.get("LoCC") or "").strip()
        subjects = (row.get("Subjects") or "").strip()
        entries.append(
            {
                "gutenberg_id": gid,
                "title": title,
                "author": (row.get("Authors") or row.get("Author") or "").strip(),
                "genre": assign_genre(locc, subjects),
                "language": "en",
                "subjects": subjects,
                "source": "catalog:csv",
                "status": "pending",
            }
        )
    entries.sort(key=lambda e: e["gutenberg_id"])
    return entries


def main() -> None:
    ap = argparse.ArgumentParser(description="Build fiction.json from pg_catalog.csv.")
    ap.add_argument(
        "--out",
        default="tasks/gutenberg/manifests/fiction.json",
        help="Output manifest path",
    )
    ap.add_argument(
        "--catalog",
        default="tasks/gutenberg/data/pg_catalog.csv",
        help="Local catalog CSV path (downloaded if missing)",
    )
    ap.add_argument(
        "--exclude-run-state",
        default="tasks/gutenberg/manifests/philosophy_500_run_state.json",
        help="Run state whose exclude_ids to skip",
    )
    ap.add_argument("--skip-download", action="store_true", help="Require local catalog file")
    args = ap.parse_args()

    catalog_path = rel(args.catalog)
    if not os.path.exists(catalog_path):
        if args.skip_download:
            print(f"ERROR: catalog not found: {catalog_path}", file=sys.stderr)
            sys.exit(1)
        download_catalog(catalog_path)

    exclude_ids = load_exclude_ids(args.exclude_run_state)

    with open(catalog_path, encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    entries = build_entries(rows, exclude_ids)
    out_path = args.out if os.path.isabs(args.out) else os.path.join(repo_root(), args.out)
    save_json(out_path, {"version": 1, "entries": entries})

    from collections import Counter

    genres = Counter(e["genre"] for e in entries)
    print(f"Wrote {len(entries)} entries to {out_path}")
    print("Genres:", dict(genres.most_common()))


if __name__ == "__main__":
    main()
