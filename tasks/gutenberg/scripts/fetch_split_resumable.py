#!/usr/bin/env python3
"""Resumable per-book fetch+split for philosophy_500_prep.json."""

from __future__ import annotations

import argparse
import atexit
import os
import signal
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manifest_utils import (
    PREP_MANIFEST,
    acquire_prep_lock,
    debug_log,
    gutenberg_bin,
    has_split_cache,
    load_json,
    load_run_state,
    log,
    rel,
    release_prep_lock,
    repo_root,
    save_json,
    save_run_state,
)


def count_prep_cache(prep: dict) -> int:
    return sum(
        1
        for e in prep.get("entries") or []
        if isinstance(e.get("gutenberg_id"), int) and has_split_cache(e["gutenberg_id"])
    )


def other_prep_pids() -> list[int]:
    me = os.getpid()
    try:
        out = subprocess.run(["pgrep", "-f", "fetch_split_resumable.py"], capture_output=True, text=True)
        if out.returncode != 0:
            return []
        return [int(p) for p in out.stdout.split() if p.strip() and int(p) != me]
    except (ValueError, OSError):
        return []


def run_pipeline(manifest: str, gid: int) -> tuple[bool, str, float, int]:
    cmd = gutenberg_bin() + [
        "pipeline-manifest",
        "-manifest",
        manifest,
        "-fetch",
        "-only-id",
        str(gid),
    ]
    t0 = time.monotonic()
    proc = subprocess.run(cmd, cwd=repo_root(), capture_output=True, text=True)
    elapsed = time.monotonic() - t0
    out = (proc.stdout or "") + (proc.stderr or "")
    if proc.returncode != 0:
        return False, out.strip() or f"exit {proc.returncode}", elapsed, proc.returncode
    if "needs_review" in out:
        return False, "needs_review", elapsed, proc.returncode
    return True, out.strip(), elapsed, proc.returncode


def _signal_debug(signum: int, _frame) -> None:
    # #region agent log
    debug_log(
        "H5",
        "fetch_split_resumable.py:signal",
        "prep worker received signal",
        {"pid": os.getpid(), "signum": signum, "signame": signal.Signals(signum).name},
    )
    # #endregion
    raise SystemExit(128 + signum)


def main() -> None:
    ap = argparse.ArgumentParser(description="Resumable fetch+split for prep manifest.")
    ap.add_argument("--prep-manifest", default=PREP_MANIFEST)
    ap.add_argument("--limit", type=int, default=0, help="Max books to process (0=all remaining)")
    ap.add_argument("--log", default="logs/philosophy_500/prep.log")
    args = ap.parse_args()

    for sig in (signal.SIGHUP, signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, _signal_debug)

    acquire_prep_lock()
    atexit.register(release_prep_lock)

    state = load_run_state()
    prep_path = rel(args.prep_manifest)
    prep = load_json(args.prep_manifest)
    total_entries = len(prep.get("entries") or [])
    failed = set(state.get("failed_ids") or [])
    processed = 0
    skipped = 0
    others = other_prep_pids()
    # #region agent log
    debug_log(
        "H1",
        "fetch_split_resumable.py:main:start",
        "prep worker started",
        {
            "pid": os.getpid(),
            "otherPrepPids": others,
            "prepEntries": len(prep.get("entries") or []),
            "cacheCount": count_prep_cache(prep),
            "limit": args.limit,
        },
    )
    # #endregion
    if others:
        log(f"WARNING: {len(others)} other fetch_split_resumable.py process(es) running: {others}", args.log)

    log(
        f"Prep worker PID {os.getpid()}: {count_prep_cache(prep)}/{total_entries} already cached, "
        f"limit={'all' if not args.limit else args.limit}",
        args.log,
    )

    for i, e in enumerate(prep.get("entries") or []):
        if args.limit and processed >= args.limit:
            break
        gid = e.get("gutenberg_id")
        if not isinstance(gid, int):
            continue
        status = (e.get("status") or "").strip().lower()
        if status in ("uploaded", "deferred_repair", "needs_review"):
            continue
        if has_split_cache(gid):
            skipped += 1
            continue

        cached_now = count_prep_cache(prep)
        log(
            f"[row {i + 1}/{total_entries}] cached={cached_now}/{total_entries} PG {gid} — fetch+split …",
            args.log,
        )
        # #region agent log
        debug_log(
            "H3",
            "fetch_split_resumable.py:main:before_pipeline",
            "starting pipeline for book",
            {"pid": os.getpid(), "manifestIndex": i + 1, "gutenbergId": gid},
        )
        # #endregion
        ok, msg, elapsed, rc = run_pipeline(args.prep_manifest, gid)
        cache_after = has_split_cache(gid)
        # #region agent log
        debug_log(
            "H2",
            "fetch_split_resumable.py:main:after_pipeline",
            "pipeline finished",
            {
                "pid": os.getpid(),
                "gutenbergId": gid,
                "ok": ok,
                "returnCode": rc,
                "elapsedSec": round(elapsed, 2),
                "hasCacheAfter": cache_after,
                "msgPreview": msg[:120],
            },
        )
        # #endregion
        if ok and cache_after:
            e["status"] = "split"
            processed += 1
            log(f"  OK PG {gid}", args.log)
        else:
            e["status"] = "needs_review" if "needs_review" in msg else "failed"
            e["error"] = msg[:500]
            failed.add(gid)
            state.setdefault("failed_ids", [])
            if gid not in state["failed_ids"]:
                state["failed_ids"].append(gid)
            log(f"  FAIL PG {gid}: {msg[:200]}", args.log)

        save_json(args.prep_manifest, prep)
        save_run_state(state)

    # #region agent log
    debug_log(
        "H4",
        "fetch_split_resumable.py:main:end",
        "prep worker finished",
        {
            "pid": os.getpid(),
            "processed": processed,
            "skipped": skipped,
            "failedTotal": len(failed),
            "cacheCount": count_prep_cache(prep),
        },
    )
    # #endregion
    log(
        f"Done: +{processed} new, {count_prep_cache(prep)}/{total_entries} cached, "
        f"skipped={skipped}, failed={len(failed)}",
        args.log,
    )


if __name__ == "__main__":
    main()
