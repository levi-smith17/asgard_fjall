#!/usr/bin/env bash
# Sync Cairn media buckets into Asgard (idempotent).
set -euo pipefail

REGION="${AWS_REGION:-us-east-2}"
SOURCE_PROFILE="${SOURCE_PROFILE:-cairn-prod}"
TARGET_PROFILE="${TARGET_PROFILE:-asgard}"
TMP="${TMPDIR:-/tmp}/asgard-media-sync-$$"

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/public" "$TMP/private"

echo "Syncing public media…"
AWS_PROFILE="$SOURCE_PROFILE" AWS_REGION="$REGION" aws s3 sync \
  "s3://cairn-prod-public-media/" "$TMP/public/"
AWS_PROFILE="$TARGET_PROFILE" AWS_REGION="$REGION" aws s3 sync \
  "$TMP/public/" "s3://asgard-fjall-prod-public-media/"

echo "Syncing private media…"
AWS_PROFILE="$SOURCE_PROFILE" AWS_REGION="$REGION" aws s3 sync \
  "s3://cairn-prod-private-media/" "$TMP/private/"
AWS_PROFILE="$TARGET_PROFILE" AWS_REGION="$REGION" aws s3 sync \
  "$TMP/private/" "s3://asgard-fjall-prod-private-media/"

echo "Done."
AWS_PROFILE="$TARGET_PROFILE" AWS_REGION="$REGION" aws s3 ls s3://asgard-fjall-prod-public-media/ --recursive --summarize | tail -2
AWS_PROFILE="$TARGET_PROFILE" AWS_REGION="$REGION" aws s3 ls s3://asgard-fjall-prod-private-media/ --recursive --summarize | tail -2
