#!/usr/bin/env bash
# Copy a checked build (src/) to the site root and stamp version.json with the page's own BUILD_AT.
# The open site compares version.json to its BUILD_AT to offer "tap to update", so they must match exactly.
# usage: bash tools/publish_copy.sh <repo root> [what]     (run from src/, after build.sh + check.js passed)
set -e
ROOT="$1"; WHAT="${2:-site}"
for f in index.html nhl_data.js nba_detail.js lines_hist.js; do cp "$f" "$ROOT/$f"; done
AT=$(grep -o 'var BUILD_AT="[^"]*"' index.html | head -1 | cut -d'"' -f2)
[ -n "$AT" ] || { echo "publish_copy: no BUILD_AT in index.html" >&2; exit 1; }
printf '{"at":"%s","what":"%s"}\n' "$AT" "$WHAT" > "$ROOT/version.json"
echo "$AT"
