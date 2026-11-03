#!/bin/bash
# Automatic site refresh (GitHub Actions). Run from the repo root:  bash src/tools/auto_run.sh [nba|nfl|all]
# Refreshes data from ESPN JSON + hoopR + the PropLine feed, rebuilds, runs the full check, and only then
# replaces the live index.html. Any failed data step keeps the previous data (the site never breaks).
set -u
WHAT=${1:-all}; ROOT=$(pwd); export REPO=$ROOT WORK=${RUNNER_TEMP:-/tmp}/rla; mkdir -p "$WORK"
cd "$ROOT/src"
TODAY=$(TZ=America/Toronto date +%F); NOWS=$(TZ=America/Toronto date "+%a %b %-d")
log(){ echo "::notice::$*"; echo "$*" >> "$WORK/summary.txt"; }
if [ "$WHAT" = nba ] || [ "$WHAT" = all ]; then
  python3 tools/auto_espn.py nba-finals "$TODAY" >> "$WORK/summary.txt" 2>&1 || log "NBA finals (ESPN): kept old"
  if bash tools/nbafetch.sh > "$WORK/nbafetch.log" 2>&1; then
    python3 tools/auto_espn.py nba-inj 2>>"$WORK/summary.txt" && log "NBA injuries refreshed" || log "NBA injuries: kept old"
    python3 tools/auto_espn.py nba-lines "$TODAY" 2>>"$WORK/summary.txt" && log "NBA lines checked" || log "NBA lines: kept old"
    if ! grep -q "^# day: $TODAY" data/nba_props.txt; then   # new day: drop yesterday's props
      grep '^#' data/nba_props.txt | grep -v '^# day:' > "$WORK/h.txt"; echo "# day: $TODAY" >> "$WORK/h.txt"; cp "$WORK/h.txt" data/nba_props.txt; log "NBA props reset for $TODAY"; fi
    cp nba_data.js "$WORK/nba_data.bak"
    if node tools/nbagen.mjs "$WORK/nba" "$TODAY" > "$WORK/nd.js" 2> "$WORK/nbagen.log" && [ -s "$WORK/nd.js" ]; then cp "$WORK/nd.js" nba_data.js
      [ -f "$ROOT/data/live_odds.json" ] && python3 tools/liveprops.py "$ROOT/data/live_odds.json" "$TODAY" | tee -a "$WORK/summary.txt"
      node tools/nbagen.mjs "$WORK/nba" "$TODAY" > "$WORK/nd.js" 2>> "$WORK/nbagen.log" && cp "$WORK/nd.js" nba_data.js
      grep -q "^$TODAY|" data/nba_plays.txt || { node tools/nbaplays.mjs --window=360 >> "$WORK/summary.txt" 2>&1 && node tools/nbagen.mjs "$WORK/nba" "$TODAY" > "$WORK/nd.js" 2>> "$WORK/nbagen.log" && cp "$WORK/nd.js" nba_data.js; }
      log "NBA data: $(tail -1 "$WORK/nbagen.log")"
    else cp "$WORK/nba_data.bak" nba_data.js; log "NBA data generation FAILED — kept old (see nbagen.log)"; fi
  else log "hoopR download FAILED — NBA data kept as is"; fi
fi
if [ "$WHAT" = nfl ] || [ "$WHAT" = all ]; then
  for f in engine.js real.js market.js inj.js data/espn_inj.txt; do cp "$f" "$WORK/$(basename $f).bak"; done
  python3 tools/auto_espn.py nfl-update >> "$WORK/summary.txt" 2>&1 || log "NFL lines/finals: kept old"
  python3 tools/auto_espn.py nfl-inj "$NOWS" >> "$WORK/summary.txt" 2>&1 || log "NFL injuries: kept old"
  if [ "$(TZ=America/Toronto date +%u)" = 2 ] && [ "$(TZ=America/Toronto date +%H)" -lt 12 ]; then   # Tuesday morning: weekly nflverse refresh
    bash tools/nflfetch.sh > "$WORK/nflfetch.log" 2>&1 && python3 tools/nfltgt.py "$WORK/nflv" > "$WORK/tgt.js" 2>> "$WORK/summary.txt" && [ -s "$WORK/tgt.js" ] && cp "$WORK/tgt.js" nfl_tgt.js && log "NFL targets/spreads/rest refreshed"
    python3 tools/nflrush.py "$WORK/nflv" > "$WORK/rush.js" 2>> "$WORK/summary.txt" && [ -s "$WORK/rush.js" ] && cp "$WORK/rush.js" nfl_rush.js && log "NFL pass rush vs O-line refreshed"; fi
fi
bash build.sh > /dev/null || { log "BUILD FAILED"; exit 1; }
if node tools/check.js "$ROOT/src/index.html" > "$WORK/check.log" 2>&1; then
  cp index.html "$ROOT/index.html"; log "Site check OK — published"
else
  log "SITE CHECK FAILED — live site left unchanged"; cat "$WORK/check.log"
  git -C "$ROOT" checkout -- src 2>/dev/null; exit 1
fi
