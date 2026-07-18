#!/usr/bin/env python3
"""
Backfill English→Norse domain attribute names on asgard-fjall-prod.

Rewrites stored DynamoDB item attributes in-place (same pk/sk):
  trailId      → greinId
  waypointId   → laufId
  markerId     → runId
  markerName   → runName
  markers      → runir
  waypoints    → laufar   (Thing settings map key)
  itinerary    → dagatal  (Thing settings map key)
  waypointsPerPage → laufarPerPage

Default is dry-run. Source of truth for live data is TARGET_TABLE.

Usage:
  AWS_REGION=us-east-2 python3 scripts/migrate-domain-attrs.py
  AWS_REGION=us-east-2 python3 scripts/migrate-domain-attrs.py --apply
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from collections import Counter
from typing import Any

REGION = os.environ.get("AWS_REGION", "us-east-2")
PROFILE = os.environ.get("TARGET_PROFILE", "asgard")
TABLE = os.environ.get("TARGET_TABLE", "asgard-fjall-prod")

# Top-level attribute renames (old → new). Longer / more specific first.
ATTR_RENAMES: list[tuple[str, str]] = [
    ("waypointsPerPage", "laufarPerPage"),
    ("waypointId", "laufId"),
    ("markerName", "runName"),
    ("markerId", "runId"),
    ("markers", "runir"),
    ("trailId", "greinId"),
    ("waypoints", "laufar"),
    ("itinerary", "dagatal"),
]


def aws_json(*args: str) -> Any:
    cmd = ["aws", "--profile", PROFILE, "--region", REGION, "--output", "json", *args]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"aws {' '.join(args)} failed:\n{proc.stderr or proc.stdout}")
    if not proc.stdout.strip():
        return None
    return json.loads(proc.stdout)


def scan_all() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    start_key = None
    while True:
        args = ["dynamodb", "scan", "--table-name", TABLE]
        if start_key:
            args += ["--exclusive-start-key", json.dumps(start_key)]
        page = aws_json(*args)
        items.extend(page.get("Items", []))
        start_key = page.get("LastEvaluatedKey")
        if not start_key:
            break
    return items


def rename_map_keys(mapping: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """Rename keys in a DynamoDB AttributeValue map; recurse into nested M/L."""
    changed: list[str] = []
    out: dict[str, Any] = {}
    for key, value in mapping.items():
        new_key = key
        for old, new in ATTR_RENAMES:
            if key == old:
                new_key = new
                changed.append(f"{old}→{new}")
                break
        out[new_key] = rewrite_attr(value, changed)
    return out, changed


def rewrite_attr(attr: dict[str, Any], changed: list[str]) -> dict[str, Any]:
    if "M" in attr:
        nested, nested_changes = rename_map_keys(attr["M"])
        changed.extend(nested_changes)
        return {"M": nested}
    if "L" in attr:
        return {"L": [rewrite_attr(x, changed) for x in attr["L"]]}
    return attr


def transform_item(item: dict[str, Any]) -> tuple[dict[str, Any] | None, list[str]]:
    rewritten, changes = rename_map_keys(item)
    if not changes:
        return None, []
    # Prefer the new name if both old and new somehow coexist.
    for old, new in ATTR_RENAMES:
        if old in rewritten and new in rewritten and old != new:
            del rewritten[old]
            changes.append(f"drop-dup:{old}")
    return rewritten, changes


def put_item(item: dict[str, Any]) -> None:
    aws_json(
        "dynamodb",
        "put-item",
        "--table-name",
        TABLE,
        "--item",
        json.dumps(item),
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--apply", action="store_true", help="Write rewritten items (default: dry-run)"
    )
    parser.add_argument("--limit", type=int, default=0, help="Only process first N items")
    args = parser.parse_args()

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[{mode}] profile={PROFILE} table={TABLE} region={REGION}")

    items = scan_all()
    if args.limit:
        items = items[: args.limit]
    print(f"Scanned {len(items)} items")

    rewrite_count = 0
    change_counter: Counter[str] = Counter()
    for item in items:
        rewritten, changes = transform_item(item)
        if not rewritten:
            continue
        rewrite_count += 1
        for c in changes:
            change_counter[c] += 1
        pk = item.get("pk", {}).get("S", "?")
        sk = item.get("sk", {}).get("S", "?")
        print(f"  {'WRITE' if args.apply else 'WOULD'} {pk} / {sk}: {', '.join(changes)}")
        if args.apply:
            put_item(rewritten)

    print(f"\nItems to rewrite: {rewrite_count}")
    if change_counter:
        print("Change counts:")
        for key, count in change_counter.most_common():
            print(f"  {key}: {count}")
    if not args.apply and rewrite_count:
        print("\nRe-run with --apply to write.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
