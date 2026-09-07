#!/usr/bin/env python3
"""Register Alexandria-II account and proposer key aliases in flow.json."""
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
FLOW_JSON = os.path.join(ROOT, "flow.json")


def main():
    if len(sys.argv) < 3:
        print("usage: setup_alexandria_ii.py ADDRESS KEY_FILE [NUM_PROPOSER_ALIASES]", file=sys.stderr)
        sys.exit(1)
    address = sys.argv[1].replace("0x", "")
    key_file = sys.argv[2]
    num_aliases = int(sys.argv[3]) if len(sys.argv) > 3 else 100

    with open(FLOW_JSON, encoding="utf-8") as f:
        cfg = json.load(f)

    base = "mainnet-Alexandria-II"
    cfg["accounts"][base] = {
        "address": address,
        "key": {"type": "file", "location": key_file, "index": 0},
    }
    for i in range(1, num_aliases):
        cfg["accounts"][f"{base}-p{i}"] = {
            "address": address,
            "key": {"type": "file", "location": key_file, "index": i},
        }

    deps = cfg.setdefault("deployments", {}).setdefault("mainnet", {})
    if base not in deps:
        deps[base] = ["Alexandria"]

    with open(FLOW_JSON, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent="\t")
        f.write("\n")

    print(f"Registered {base} @ 0x{address} with {num_aliases} proposer aliases")


if __name__ == "__main__":
    main()
