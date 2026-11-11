#!/bin/bash
# Automatic site refresh (GitHub Actions). Run from the repo root:  bash src/tools/auto_run.sh [nba|nfl|nhl|all]
# Refreshes data from ESPN JSON + hoopR + the PropLine feed, rebuilds, runs the full check, and only then
# replaces the live index.html. Any failed data step keeps the previous data (the site never breaks).
set -u
WHAT=${1:-all}; ROOT=$(pwd); export REPO=$ROOT WORK=${RUNNER_TEMP:-/tmp}/rla; mkdir -p "$WORK"
cd "$ROOT/src"
TODAY=$(TZ=America/Toronto date +%F); NOWS=$(TZ=America/Toronto date "+%a %b %-d")
log(){ echo "::notice::$*"; echo "$*" >> "$WORK/summary.txt"; }
want(){ [ "$WHAT" = all ] || [[ ",$WHAT," == *",$1,"* ]]; }   # WHAT: all, or a comma list like nba,nhl
if want nba; then
  python3 tools/auto_espn.py nba-finals "$TODAY" >> "$WORK/summary.txt" 2>&1 || log "NBA finals (ESPN): kept old"
  if bash tools/nbafetch.sh > "$WORK/nbafetch.log" 2>&1; then
    python3 tools/auto_espn.py nba-inj 2>>"$WORK/summary.txt" && log "NBA injuries refreshed" || log "NBA injuries: kept old"
    python3 tools/nbalineups.py "$TODAY" > "$WORK/lu.js" 2>>"$WORK/summary.txt" && grep -q "^var NBA_LU" "$WORK/lu.js" && cp "$WORK/lu.js" nba_lu.js && log "NBA starting lineups refreshed" || log "NBA starting lineups: kept old"
    python3 tools/auto_espn.py nba-lines "$TODAY" 2>>"$WORK/summary.txt" && log "NBA lines checked" || log "NBA lines: kept old"
    python3 tools/nbarefs.py "$ROOT" > "$WORK/refs.js" 2>> "$WORK/summary.txt" && grep -q "^var NBA_REFS" "$WORK/refs.js" && cp "$WORK/refs.js" nba_refs.js || log "NBA referees: kept old"
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
if want nfl; then
  for f in engine.js real.js market.js inj.js data/espn_inj.txt; do cp "$f" "$WORK/$(basename $f).bak"; done
  python3 tools/auto_espn.py nfl-update >> "$WORK/summary.txt" 2>&1 || log "NFL lines/finals: kept old"
  python3 tools/auto_espn.py nfl-roll >> "$WORK/summary.txt" 2>&1 || log "NFL new week: not set up yet (kept this week)"   # writes nothing unless it completes   # once every game of the week is final: next week's games + lines, plays archived
  grep -q "nfl-roll: Week" "$WORK/summary.txt" && python3 tools/auto_espn.py nfl-update >> "$WORK/summary.txt" 2>&1   # fill the new week's lines right away
  python3 tools/auto_espn.py nfl-inj "$NOWS" >> "$WORK/summary.txt" 2>&1 || log "NFL injuries: kept old"
  python3 tools/auto_espn.py nfl-qtr >> "$WORK/summary.txt" 2>&1 || log "NFL quarter scores: kept old"
  python3 tools/nflbox.py "$ROOT" > "$WORK/nflbox.js" 2>> "$WORK/summary.txt" && grep -q "^var BOX_ESPN" "$WORK/nflbox.js" && cp "$WORK/nflbox.js" nfl_box.js || log "NFL box scores (ESPN): kept old"
  NFLV=0; if [ "$(TZ=America/Toronto date +%u)" = 2 ] && [ "$(TZ=America/Toronto date +%H)" -lt 12 ]; then NFLV=1; fi   # Tuesday morning: weekly nflverse refresh
  if [ "$NFLV" = 0 ] && [ "$(TZ=America/Toronto date +%H)" -ge 9 ] && [ "$(TZ=America/Toronto date +%H)" -le 10 ]; then python3 tools/staleness.py "$ROOT" > /dev/null 2>&1; [ $? = 2 ] && NFLV=1 && log "NFL weekly data is behind — retrying the nflverse refresh"; fi
  if [ "$NFLV" = 1 ]; then
    bash tools/nflfetch.sh > "$WORK/nflfetch.log" 2>&1 && python3 tools/nfltgt.py "$WORK/nflv" > "$WORK/tgt.js" 2>> "$WORK/summary.txt" && [ -s "$WORK/tgt.js" ] && cp "$WORK/tgt.js" nfl_tgt.js && log "NFL targets/spreads/rest refreshed"
    python3 tools/nflrush.py "$WORK/nflv" > "$WORK/rush.js" 2>> "$WORK/summary.txt" && [ -s "$WORK/rush.js" ] && cp "$WORK/rush.js" nfl_rush.js && log "NFL pass rush vs O-line refreshed"
    python3 tools/nflgen.py "$WORK/nflv" > "$WORK/extra.js" 2>> "$WORK/summary.txt" && grep -q "NFL_STAND" "$WORK/extra.js" && cp "$WORK/extra.js" nfl_extra.js && log "NFL standings / schedule / shares (nflverse) refreshed"
    python3 tools/usagegen.py "$WORK/nflv" > "$WORK/usage.js" 2>> "$WORK/summary.txt" && grep -q "USAGE_RAW" "$WORK/usage.js" && cp "$WORK/usage.js" usage_data.js && log "NFL usage (snaps / targets / carries) refreshed"
    python3 tools/nflweekly.py "$WORK/nflv" > "$WORK/weekly.js" 2>> "$WORK/summary.txt" && grep -q "^var NFLW" "$WORK/weekly.js" && cp "$WORK/weekly.js" nfl_weekly.js && log "NFL defense vs position / recent players / QB1 / head to head refreshed"
    python3 tools/nfllogs.py "$WORK/nflv" > "$WORK/logs.js" 2>> "$WORK/summary.txt" && grep -q "^var NFLV_LOGS" "$WORK/logs.js" && cp "$WORK/logs.js" nfl_logs.js && log "NFL player game logs (nflverse) refreshed"
    python3 tools/advgen.py "$WORK/nflv" auto > "$WORK/adv.js" 2>> "$WORK/summary.txt" && grep -q "^const BOX=" "$WORK/adv.js" && cp "$WORK/adv.js" adv_data.js && log "NFL box scores / red zone / pace (nflverse) refreshed"
    python3 tools/nflx2.py "$WORK/nflv" > "$WORK/x2.js" 2>> "$WORK/summary.txt" && grep -q "^var NFL_K" "$WORK/x2.js" && cp "$WORK/x2.js" nfl_x2.js && log "NFL red zone / QB runs / PROE / division / kickers refreshed"; fi
fi
if want nhl; then   # NHL: official NHL API + PropLine feed (box scores cached in data/nhl_box.json)
  if python3 tools/nhlfetch.py "$ROOT" "$TODAY" > "$WORK/nhl.js" 2> "$WORK/nhl.log" && grep -q "^var NHL_PROPS" "$WORK/nhl.js"; then
    python3 tools/nhlpp.py >> "$WORK/nhl.js" 2>> "$WORK/summary.txt" || log "NHL power-play time: skipped"
    cp "$WORK/nhl.js" nhl_data.js; log "$(tail -1 "$WORK/nhl.log")"
  else log "NHL data FAILED — kept old: $(tail -3 "$WORK/nhl.log" | tr '\n' ' ')"; fi
fi
if want soc; then   # Soccer: ESPN box scores (cached in data/soccer_box.json) + PropLine odds/referees (data/live_odds.json) + Open-Meteo weather
  if python3 tools/soccerfetch.py "$ROOT" > "$WORK/soc.js" 2> "$WORK/soc.log" && grep -q "^var SOC_OK=1" "$WORK/soc.js"; then
    cp "$WORK/soc.js" soccer_data.js; log "$(tail -1 "$WORK/soc.log")"
  else log "Soccer data FAILED — kept old: $(tail -3 "$WORK/soc.log" | tr '\n' ' ')"; fi
fi
bash build.sh > /dev/null || { log "BUILD FAILED"; exit 1; }
# tracker: snapshot best props / game numbers / NHL plays before games, grade after (uses the site's own functions)
if node tools/track.js "$ROOT/src/index.html" > "$WORK/track.log" 2>&1; then log "$(tail -1 "$WORK/track.log")"; bash build.sh > /dev/null || { log "BUILD FAILED"; exit 1; }
else log "tracker FAILED (kept old): $(tail -2 "$WORK/track.log" | tr '\n' ' ')"; fi
if node tools/check.js "$ROOT/src/index.html" > "$WORK/check.log" 2>&1; then
  AT=$(bash tools/publish_copy.sh "$ROOT" "$WHAT")   # copies the build + stamps version.json (the open site checks it to refresh itself)
  log "Site check OK — published ($AT)"
else
  log "SITE CHECK FAILED — live site left unchanged"; cat "$WORK/check.log"
  git -C "$ROOT" checkout -- src 2>/dev/null; exit 1
fi
