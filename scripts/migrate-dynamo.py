#!/usr/bin/env python3
"""
Copy cairn-prod → asgard-fjall-prod with Asgard key remaps + Provisions→Audr.

Default is dry-run (no writes). Source table is never modified.

Usage:
  AWS_REGION=us-east-2 python3 scripts/migrate-dynamo.py
  AWS_REGION=us-east-2 python3 scripts/migrate-dynamo.py --apply
  AWS_REGION=us-east-2 python3 scripts/migrate-dynamo.py --apply --copy-ssm

Profiles (override with env):
  SOURCE_PROFILE=cairn-prod  SOURCE_TABLE=cairn-prod
  TARGET_PROFILE=asgard      TARGET_TABLE=asgard-fjall-prod
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
SOURCE_PROFILE = os.environ.get("SOURCE_PROFILE", "cairn-prod")
TARGET_PROFILE = os.environ.get("TARGET_PROFILE", "asgard")
SOURCE_TABLE = os.environ.get("SOURCE_TABLE", "cairn-prod")
TARGET_TABLE = os.environ.get("TARGET_TABLE", "asgard-fjall-prod")

# Dropped product surfaces (Guides / Outpost leftovers) — do not copy.
SKIP_SK_PREFIXES = (
    "STONE#",
    "GUIDE#",
    "STOP#",
    "INVITATION#",
    # Legacy Audr/calendar shapes superseded by live prefixes (same ids / composites).
    "BUDGET#",  # → would collide with CACHE#→SKATT#
    "PROVISION#",  # → would collide with SUPPLYLINE#→IDUNN#
    "CAL_SUB#",  # → would collide with ITINERARY_SUB#→DAGATAL_SUB#
)

# Live product prefixes → Fjall greenfield (see apps/api/functions/shared/keys.ts).
SK_PREFIX_MAP: list[tuple[str, str]] = [
    # Longer / more specific first for SIGNAL replies and composites.
    ("SIGNAL#", "SENDIBOD#"),
    ("ITINERARY_SUB#", "DAGATAL_SUB#"),
    ("ITINERARY#", "DAGATAL#"),
    ("WAYPOINT#", "LAUF#"),
    ("TRAIL#", "GREIN#"),
    ("MARKER#", "RUN#"),
    ("BURN#", "SURTR#"),
    ("SUPPLYLINE#", "IDUNN#"),
    ("CACHE#", "SKATT#"),
    ("LOG#", "SOGUR#"),
    # Legacy burns still present under EXPENSE# (ids do not overlap BURN#).
    ("EXPENSE#", "SURTR#"),
    ("FUND#", "SJODR#"),
]

LEGACY_ROOT = "Provisions"
NEW_ROOT = "Audr"


def aws_json(profile: str, *args: str) -> Any:
    cmd = ["aws", "--profile", profile, "--region", REGION, "--output", "json", *args]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"aws {' '.join(args)} failed:\n{proc.stderr or proc.stdout}")
    if not proc.stdout.strip():
        return None
    return json.loads(proc.stdout)


def scan_all(profile: str, table: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    start_key = None
    while True:
        args = ["dynamodb", "scan", "--table-name", table]
        if start_key:
            args += ["--exclusive-start-key", json.dumps(start_key)]
        page = aws_json(profile, *args)
        items.extend(page.get("Items", []))
        start_key = page.get("LastEvaluatedKey")
        if not start_key:
            break
    return items


def rewrite_sk_prefix(value: str) -> str:
    for old, new in SK_PREFIX_MAP:
        if value.startswith(old):
            return new + value[len(old) :]
    return value


def rewrite_provisions_path(value: str) -> str:
    if value == LEGACY_ROOT:
        return NEW_ROOT
    if value.startswith(LEGACY_ROOT + "/"):
        return NEW_ROOT + value[len(LEGACY_ROOT) :]
    return value


def rewrite_ssm_path(value: str) -> str:
    # /cairn/users/{uid}/itinerary/{id}/password → /asgard-fjall/users/{uid}/dagatal/{id}/password
    marker = "/itinerary/"
    if value.startswith("/cairn/users/") and marker in value:
        rest = value[len("/cairn/users/") :]
        uid, _, tail = rest.partition(marker)
        return f"/asgard-fjall/users/{uid}/dagatal/{tail}"
    return value


def transform_attr(attr: dict[str, Any]) -> dict[str, Any]:
    """Deep-transform a DynamoDB AttributeValue."""
    if "S" in attr:
        s = attr["S"]
        s2 = rewrite_sk_prefix(s)
        s2 = rewrite_provisions_path(s2)
        s2 = rewrite_ssm_path(s2)
        return {"S": s2}
    if "B" in attr or "N" in attr or "BOOL" in attr or "NULL" in attr:
        return attr
    if "SS" in attr:
        return {"SS": [rewrite_provisions_path(rewrite_sk_prefix(x)) for x in attr["SS"]]}
    if "NS" in attr or "BS" in attr:
        return attr
    if "L" in attr:
        return {"L": [transform_attr(x) for x in attr["L"]]}
    if "M" in attr:
        return {"M": {k: transform_attr(v) for k, v in attr["M"].items()}}
    return attr


def transform_item(item: dict[str, Any]) -> dict[str, Any] | None:
    sk = item.get("sk", {}).get("S", "")
    for skip in SKIP_SK_PREFIXES:
        if sk.startswith(skip):
            return None
    return {k: transform_attr(v) for k, v in item.items()}


def batch_write(profile: str, table: str, items: list[dict[str, Any]]) -> None:
    # DynamoDB BatchWriteItem max 25
    for i in range(0, len(items), 25):
        chunk = items[i : i + 25]
        request = {
            table: [{"PutRequest": {"Item": it}} for it in chunk],
        }
        unprocessed = request
        while unprocessed:
            resp = aws_json(
                profile,
                "dynamodb",
                "batch-write-item",
                "--request-items",
                json.dumps(unprocessed),
            )
            unprocessed = resp.get("UnprocessedItems") or {}
            if unprocessed:
                # tiny backoff via CLI retry is enough; loop until clear
                pass


def copy_ssm_passwords(items: list[dict[str, Any]], *, apply: bool) -> tuple[int, int]:
    """Copy itinerary passwords into asgard-fjall dagatal paths."""
    copied = 0
    missing = 0
    for item in items:
        src_path = item.get("ssmPasswordPath", {}).get("S")
        if not src_path or "/itinerary/" not in src_path:
            continue
        dst_path = rewrite_ssm_path(src_path)
        try:
            param = aws_json(
                SOURCE_PROFILE,
                "ssm",
                "get-parameter",
                "--name",
                src_path,
                "--with-decryption",
            )
        except RuntimeError:
            missing += 1
            print(f"  SSM missing: {src_path}")
            continue
        value = param["Parameter"]["Value"]
        print(f"  SSM {'COPY' if apply else 'WOULD COPY'}: {src_path} → {dst_path}")
        if apply:
            subprocess.run(
                [
                    "aws",
                    "--profile",
                    TARGET_PROFILE,
                    "--region",
                    REGION,
                    "ssm",
                    "put-parameter",
                    "--name",
                    dst_path,
                    "--type",
                    "SecureString",
                    "--value",
                    value,
                    "--overwrite",
                ],
                check=True,
                capture_output=True,
                text=True,
            )
        copied += 1
    return copied, missing


def sk_prefix(sk: str) -> str:
    return sk.split("#", 1)[0] + "#" if "#" in sk else sk


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="Write to the target table (default: dry-run)")
    parser.add_argument("--copy-ssm", action="store_true", help="Also copy CalDAV app passwords in SSM")
    parser.add_argument("--limit", type=int, default=0, help="Only transform first N source items (debug)")
    args = parser.parse_args()

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[{mode}] {SOURCE_PROFILE}/{SOURCE_TABLE} → {TARGET_PROFILE}/{TARGET_TABLE} ({REGION})")

    source_items = scan_all(SOURCE_PROFILE, SOURCE_TABLE)
    if args.limit:
        source_items = source_items[: args.limit]
    print(f"Source items: {len(source_items)}")

    skipped: Counter[str] = Counter()
    rewritten_sk: Counter[str] = Counter()
    provisions_hits = 0
    out_items: list[dict[str, Any]] = []

    for item in source_items:
        sk = item.get("sk", {}).get("S", "")
        blob = json.dumps(item)
        if LEGACY_ROOT in blob:
            provisions_hits += 1

        transformed = transform_item(item)
        if transformed is None:
            skipped[sk_prefix(sk)] += 1
            continue

        new_sk = transformed.get("sk", {}).get("S", "")
        if new_sk != sk:
            rewritten_sk[f"{sk_prefix(sk)}→{sk_prefix(new_sk)}"] += 1
        out_items.append(transformed)

    print(f"Would write / writing: {len(out_items)}")
    print(f"Skipped (dropped surfaces): {dict(skipped)}")
    print(f"SK remaps: {dict(rewritten_sk)}")
    print(f"Items containing '{LEGACY_ROOT}' before transform: {provisions_hits}")

    # Sample a few remapped Provisions names
    samples = []
    for it in out_items:
        name = it.get("name", {}).get("S", "")
        if name.startswith(NEW_ROOT):
            samples.append((it["sk"]["S"], name))
    print(f"Audr name samples ({min(5, len(samples))}):")
    for sk, name in samples[:5]:
        print(f"  {sk}  {name}")

    if args.copy_ssm:
        # Use pre-transform source items for original SSM paths
        print("SSM password migration:")
        copied, missing = copy_ssm_passwords(source_items, apply=args.apply)
        print(f"  SSM passwords: {copied} {'copied' if args.apply else 'pending'}, {missing} missing")

    if not args.apply:
        print("Dry-run only. Re-run with --apply to write.")
        return 0

    print(f"Writing {len(out_items)} items to {TARGET_TABLE}…")
    batch_write(TARGET_PROFILE, TARGET_TABLE, out_items)
    print("Done.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        sys.exit(0)
