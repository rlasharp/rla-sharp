#!/usr/bin/env bash
# Copy a checked build (src/) to the site root and stamp version.json with the page's own BUILD_AT.
# The open site compares version.json to its BUILD_AT to offer "tap to update", so they must match exactly.
# usage: bash tools/publish_copy.sh <repo root> [what]     (run from src/, after build.sh + check.js passed)
set -e
ROOT="$1"; WHAT="${2:-site}"
for f in index.html nhl_data.js nba_detail.js lines_hist.js soccer_data.js nfl_boxq.js nfl_box2.js; do if [ -f "$f" ]; then cp "$f" "$ROOT/$f"; fi; done
# soccer player logs: one file per league (soccer_p_*.js) + soccer_old.js; the old single soccer_players.js goes once they exist
if ls soccer_p_*.js >/dev/null 2>&1; then rm -f "$ROOT"/soccer_p_*.js "$ROOT/soccer_players.js"; cp soccer_p_*.js "$ROOT/"; [ -f soccer_old.js ] && cp soccer_old.js "$ROOT/"; rm -f soccer_players.js
elif [ -f soccer_players.js ]; then cp soccer_players.js "$ROOT/"; fi
AT=$(grep -o 'var BUILD_AT="[^"]*"' index.html | head -1 | cut -d'"' -f2)
[ -n "$AT" ] || { echo "publish_copy: no BUILD_AT in index.html" >&2; exit 1; }
printf '{"at":"%s","what":"%s"}\n' "$AT" "$WHAT" > "$ROOT/version.json"
echo "$AT"
