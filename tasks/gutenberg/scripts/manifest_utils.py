"""Shared helpers for philosophy batch upload orchestration."""

from __future__ import annotations

import glob
import json
import os
import subprocess
import sys
import time
from typing import Any

DEBUG_LOG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".cursor", "debug-4fb16a.log"
)
DEBUG_SESSION = "4fb16a"


def debug_log(hypothesis_id: str, location: str, message: str, data: dict | None = None, run_id: str = "prep") -> None:
    # #region agent log
    try:
        payload = {
            "sessionId": DEBUG_SESSION,
            "runId": run_id,
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data or {},
            "timestamp": int(time.time() * 1000),
        }
        path = os.path.abspath(DEBUG_LOG_PATH)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except OSError:
        pass
    # #endregion

MAX_CHAPTER_TX_BYTES = 1_200_000
DEFAULT_DEFERRED_IDS = {11248, 11275, 8646, 6798, 12261, 5775, 6798, 8646, 11248, 11275, 12261}


def repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def rel(path: str) -> str:
    return path if os.path.isabs(path) else os.path.join(repo_root(), path)


def load_json(path: str) -> dict:
    with open(rel(path), encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data: dict) -> None:
    full = rel(path)
    os.makedirs(os.path.dirname(full) or ".", exist_ok=True)
    tmp = full + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    os.replace(tmp, full)


def has_split_cache(gutenberg_id: int, cache_root: str = "books/pg-cache") -> bool:
    cache_dir = os.path.join(rel(cache_root), str(gutenberg_id))
    if not os.path.isdir(cache_dir):
        return False
    return bool(glob.glob(os.path.join(cache_dir, "PG*_Section_*.txt")))


def section_files(gutenberg_id: int, cache_root: str = "books/pg-cache") -> list[str]:
    cache_dir = os.path.join(rel(cache_root), str(gutenberg_id))
    return sorted(glob.glob(os.path.join(cache_dir, "PG*_Section_*.txt")))


def read_paragraphs(path: str) -> list[str]:
    with open(path, encoding="utf-8", errors="replace") as f:
        return [line.strip() for line in f if line.strip()]


def split_paragraphs_for_tx(
    book_title: str, section_title: str, paragraphs: list[str]
) -> tuple[list[str], list[str]]:
    used = 20_000 + len(book_title) * 2 + len(section_title) * 2 + 20
    for i, p in enumerate(paragraphs):
        cost = len(p) * 2 + 25
        if used + cost > MAX_CHAPTER_TX_BYTES:
            return paragraphs[:i], paragraphs[i:]
        used += cost
    return paragraphs, []


def section_has_overflow(book_title: str, section_path: str, section_index: int) -> tuple[bool, int]:
    section_title = f"Chapter {section_index}"
    paragraphs = read_paragraphs(section_path)
    _, overflow = split_paragraphs_for_tx(book_title, section_title, paragraphs)
    return len(overflow) > 0, len(overflow)


def book_has_overflow(entry: dict, cache_root: str = "books/pg-cache") -> tuple[bool, str | None]:
    gid = entry["gutenberg_id"]
    title = (entry.get("title") or "").strip()
    for path in section_files(gid, cache_root):
        base = os.path.basename(path)
        # PG123_Section_4.txt -> index 4
        try:
            idx = int(base.rsplit("_", 1)[1].replace(".txt", ""))
        except (IndexError, ValueError):
            idx = 1
        has, n = section_has_overflow(title, path, idx)
        if has:
            return True, f"section {idx} has {n} overflow paragraphs"
    return False, None


def extract_string_titles(obj: Any) -> list[str] | None:
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
        if obj.get("type") == "Array" and "value" in obj:
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


def flow_on_chain_titles(network: str = "mainnet") -> set[str]:
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
        raise RuntimeError(proc.stderr or proc.stdout or "flow failed")
    data = json.loads(proc.stdout)
    titles = extract_string_titles(data)
    if titles is None:
        raise RuntimeError("Could not parse Flow JSON for [String] titles")
    return {t.strip() for t in titles if t and t.strip()}


def flow_chapter_count(title: str, network: str = "mainnet") -> int:
    root = repo_root()
    arg = json.dumps(title)
    cmd = [
        "flow",
        "--config-path",
        os.path.join(root, "flow.json"),
        "scripts",
        "execute",
        "scripts/get_book_chapter_titles.cdc",
        arg,
        "--network",
        network,
        "--format",
        "json",
    ]
    proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True)
    if proc.returncode != 0:
        return -1
    data = json.loads(proc.stdout)
    if isinstance(data, dict) and data.get("type") == "Array":
        return len(data.get("value") or [])
    titles = extract_string_titles(data)
    return len(titles) if titles else -1


def local_section_count(gutenberg_id: int, cache_root: str = "books/pg-cache") -> int:
    return len(section_files(gutenberg_id, cache_root))


_GENRE = os.environ.get("UPLOAD_GENRE", "philosophy")
RUN_STATE_PATH = f"tasks/gutenberg/manifests/{_GENRE}_500_run_state.json"
PREP_MANIFEST = f"tasks/gutenberg/manifests/{_GENRE}_500_prep.json"
MASTER_MANIFEST = f"tasks/gutenberg/manifests/{_GENRE}.json"
PREP_LOCK_PATH = f"tasks/gutenberg/.{_GENRE}_prep.lock"


def batch_glob_pattern() -> str:
    prefix = os.environ.get("UPLOAD_BATCH_PREFIX", f"{_GENRE}_next25")
    return f"tasks/gutenberg/manifests/{prefix}_batch*.json"


def pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def acquire_prep_lock() -> None:
    path = rel(PREP_LOCK_PATH)
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                holder = int(f.read().strip())
            if holder != os.getpid() and pid_alive(holder):
                print(f"ERROR: prep lock held by PID {holder}. Only one fetch_split worker allowed.", file=sys.stderr)
                sys.exit(1)
        except (ValueError, OSError):
            pass
    with open(path, "w", encoding="utf-8") as f:
        f.write(str(os.getpid()))


def release_prep_lock() -> None:
    path = rel(PREP_LOCK_PATH)
    try:
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                holder = int(f.read().strip())
            if holder == os.getpid():
                os.remove(path)
    except (ValueError, OSError):
        pass


def gutenberg_bin() -> list[str]:
    """Prefer prebuilt binary (faster than go run per book)."""
    bin_path = os.path.join(repo_root(), "bin", "gutenberg")
    if os.path.isfile(bin_path) and os.access(bin_path, os.X_OK):
        return [bin_path]
    return ["go", "run", "./cmd/gutenberg"]


def load_run_state() -> dict:
    return load_json(RUN_STATE_PATH)


def save_run_state(state: dict) -> None:
    save_json(RUN_STATE_PATH, state)


def log(msg: str, log_path: str | None = None) -> None:
    line = msg.rstrip()
    print(line, flush=True)
    if log_path:
        os.makedirs(os.path.dirname(rel(log_path)), exist_ok=True)
        with open(rel(log_path), "a", encoding="utf-8") as f:
            f.write(line + "\n")


def seed_run_state() -> dict:
    """Build initial run state from existing batch manifests and philosophy.json."""
    exclude: set[int] = set()
    uploaded_count = 0
    batches_summary: list[dict] = []

    batch_prefix = os.environ.get("UPLOAD_BATCH_PREFIX", f"{_GENRE}_next25")
    for path in sorted(glob.glob(rel(batch_glob_pattern()))):
        with open(path, encoding="utf-8") as f:
            m = json.load(f)
        name = os.path.basename(path)
        batch_num = 0
        try:
            batch_num = int(name.replace(f"{batch_prefix}_batch", "").replace(".json", ""))
        except ValueError:
            pass
        ids = []
        batch_uploaded = 0
        for e in m.get("entries") or []:
            gid = e.get("gutenberg_id")
            if isinstance(gid, int):
                exclude.add(gid)
                ids.append(gid)
                if e.get("status") == "uploaded":
                    batch_uploaded += 1
        uploaded_count += batch_uploaded
        if m.get("entries"):
            batches_summary.append(
                {
                    "batch": batch_num,
                    "manifest": f"tasks/gutenberg/manifests/{name}",
                    "uploaded": batch_uploaded,
                    "deferred": sum(1 for e in m["entries"] if e.get("status") == "deferred_repair"),
                    "ids": ids,
                }
            )

    master = load_json(MASTER_MANIFEST)
    deferred_ids = [
        e["gutenberg_id"]
        for e in master.get("entries") or []
        if e.get("status") == "deferred_repair" and isinstance(e.get("gutenberg_id"), int)
    ]
    exclude.update(deferred_ids)

    current_batch = 1
    if batches_summary:
        current_batch = max(b["batch"] for b in batches_summary) + 1

    return {
        "target": 500,
        "uploaded_count": uploaded_count,
        "prep_done": False,
        "current_batch": current_batch,
        "exclude_ids": sorted(exclude),
        "deferred_ids": sorted(set(deferred_ids)),
        "failed_ids": [],
        "needs_repair_ids": [],
        "batches": batches_summary,
    }
