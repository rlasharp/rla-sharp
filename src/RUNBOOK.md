# ⚙️ AUTOMATION (Nov 3 2026) — READ FIRST
**Source of truth = the GitHub repo rlasharp/rla-sharp, folder `src/`** (all site source, tools/ and data/). The artifact is a private mirror.
- **GitHub Action `auto.yml` (every 2 h, no Claude needed)** runs `bash src/tools/auto_run.sh`: hoopR download → ESPN JSON injuries + lines (NBA), PropLine feed props merge, day roll (drops yesterday's NBA props), plays lock, nbagen; NFL lines + **final scores** (SLATE final:[a,h] + RESULTS) + ESPN injuries; Tuesday mornings nflverse → nfl_tgt.js. Then `build.sh` and `tools/check.js` (every page at 390/1200px, no errors/overflow). Only if the check passes is the root `index.html` replaced and committed. Results → `data/health.json` + the run summary.
- Other Actions: `odds.yml` (PropLine live odds every 30 min → data/live_odds.json, data/close/), `spreads.yml` (NBA closing spreads nightly → data/nba_spreads.json).
- **Claude scheduled tasks now only do judgment work** (NFL props Tue/Wed + player stat lines, Saturday weather/plays check, Sunday-night week roll + new Plays of the Week) and the daily **health check** (re-runs failures, syncs the artifact). Every Claude task must: clone the repo, edit files in `src/`, run `bash src/build.sh` + `node src/tools/check.js $PWD/src/index.html`, copy `src/index.html` to `index.html`, commit **src/ and index.html** to main, push, then publish the same files to the artifact (index.html + src/<file> paths). Never edit only the artifact — the next Action run rebuilds from the repo.
- Off days (no NBA games, NFL bye/off-season): the pipeline keeps the last data and the site shows "no games today" — not an error.

# RLA Sharp — weekly update runbook

RLA Sharp is a single-page NFL betting-research site published as a private Claude artifact
(slug `238b7b7f-ad5d-43a1-b967-16ff34cf75e6`, served file `index.html`). `index.html` is
**built** by concatenating the source files stored in this artifact under `src/`.
Owner: Quebec (Eastern time; 18+ gambling age; Jeu : aide et référence 1-800-461-0140, Montreal 514-527-0140). Friends may be in Ontario (19+, ConnexOntario 1-866-531-2600).

## Get the source
1. `list_files` / `read_file` on the artifact to download every `src/*` file into a working
   folder (e.g. `/home/claude/nfl-edge/`), keeping file names. `src/tools/ins.py.txt` → save as `/home/claude/work/ins.py`.
2. Build: `bash build.sh (stored as src/build.sh.txt — rename to build.sh)` (concatenates, in this exact order:
   `shell_head.html real.js pfr.js h2h_notes.js plogs.js plogs2.js posv.js qb1.js engine.js dataview.js inj.js plays.js calc.js ui.js > index.html`).
   It is ONE inline `<script>`: never declare a top-level `const`/`function` name twice
   across files (that silently kills the whole page).
3. Test with Playwright (pre-installed; `require('playwright')`). Route `**/chart.umd.min.js` to
   `window.Chart=class{constructor(){}destroy(){}};Chart.defaults={font:{},borderColor:''};` and abort
   `**fonts.g**`, load `file://…/index.html#<page>`, and fail on any `pageerror`. Visit
   `#games #plays #props #weeks #public #trends #injuries #calc` (the old #data import page is hidden — not linked or routable) and one `#game-<id>`; check
   `document.documentElement.scrollWidth` is not wider than a 390px viewport.
4. Publish: `publish_files` to the slug above with `files:[{as:"index.html",path:…}]` plus any
   changed `src/…` files (same `as` paths), `base_version` = current live version
   (`get_artifact`). **Never change sharing** — it must stay private (`read:"owner"`).
   Do not change the title "RLA Sharp — NFL Betting Research".

## Where the data lives
| What | File / variable |
|---|---|
| Final scores, all weeks | `real.js` `RESULTS=[[week,away,aPts,home,hPts],…]` |
| Current week's games | `engine.js` `SLATE=[{id,away,home,when,tv,final?:[a,h]}]` |
| Game lines | `engine.js` `LINES={id:{sp:homeSpread,ml:[away,home],tot}}` |
| Team season stats | `engine.js` `TEAM_STATS` (ppg, pass_, rush, dpass, drush, gp) |
| ATS / O/U records | `ui.js` `const ATS={…}`, `const OU={…}` |
| Prop lines | `engine.js` `REAL_PROPS={"Name|market":[line,overOdds,underOdds,source]}` (+ later no-overwrite IIFE batches) |
| Players shown | `engine.js` `STARTERS` (5 per team) and `PINFO[name]={name,team,pos}` |
| Game logs (ESPN) | `plogs2.js` `add(name,team,pos,[["M/D",R(...)/W(...)/Q(...)],…])` — insert new rows before `//@@MORE@@` (use `ins.py`, reads stdin). Row may carry a 3rd element team code for traded players. Helpers: `R(att,yds,td,rec,recYds,recTD)`, `W(rec,yds,td,rushAtt,rushYds,rushTD)`, `Q(cmp,att,yds,td,int,rushAtt,rushYds,rushTD)`. Week from date via `WK()` — **extend WK's date cutoffs** for each new week (Week N ends the Monday/Tuesday after its Sunday). |
| Older CBS logs | `plogs.js` `NFL_LOGS` |
| Defense vs position (PFR) | `pfr.js` `PFR_DVP` (season totals) |
| QB1 missed weeks | `qb1.js` `QB1_STATUS`, `LOG_NOTES`, `QB_ATT` |
| Injuries | `data/espn_inj.txt` (source list) → `tools/injgen.py` writes `INJ={TEAM:[[name,pos,status,injury,return]]}` + `INJ_ASOF` into `inj.js`. Full report page: `#injuries` |
| Weather | `inj.js` `WX={gameId:{w,t,wind,rain,lvl(0-3,-1 unknown),note}|{dome:"…"}}` |
| Plays of the Week | `plays.js` `PLAYS_WEEK`, `PLAYS_ASOF`, `PLAYS=[…]`, `PLAY_ARCHIVE` |
| "Oct 31" / "Week 8" labels | grep `Oct 31`, `Week 8`, `Oct 28` across files and update |

## Data sources (use WebSearch; WebFetch only on URLs that appear in results)
- Scores: ESPN scoreboard / CBS. Game logs: WebSearch with `allowed_domains:["espn.com"]`,
  query like `2026 Stats per Game ESPN <Name1> <Name2> <Name3> <Name4> <Name5>` (5 names per search).
  ESPN snapshots can be stale — cross-check totals with the player's profile "Recent Games".
- Lines/props: DraftKings/FanDuel/BetMGM via SI, Covers, Action Network, FTN, Yahoo. Only list a prop
  when a real public book line exists. Never invent odds.
- Injuries: ESPN ONLY — https://www.espn.com/nfl/injuries (all 32 teams). It is long: WebFetch it, then again with offset 100000; for any team cut off, WebSearch "<Team> Injury Status ESPN" (allowed_domains espn.com) and WebFetch the ESPN team injuries page from the results. Include EVERY listed player (Out, Doubtful, Questionable, IR, IR-R, PUP-R, NFI-R, Reserve-DNR, Reserve-CEL).
- Weather: Sharp Football weather page, FantasyAlarm, Covers, FootballDB.

## SUNDAY-NIGHT run (after the last Sunday game)
1. Add final scores for every completed game of the current week to `RESULTS` (include last
   week's Monday game if not yet added). Mark them final in `SLATE` (`final:[a,h]`).
2. Add the week's stat lines for every player in `PINFO` who played (ESPN logs), and any
   missing earlier weeks. Re-run the coverage check (every `STARTERS` player has a log).
3. Plays of the Week grade themselves from `RESULTS` + logs. Verify the record panel. If the
   Monday game isn't played yet, its plays stay "Pending" (they grade on next Sunday's run).
4. Roll to the next week: move current `PLAYS` (with their resolved `title`,`odds`,`line`,
   `type`,`player`,`market`,`side`,`team`,`away`,`home`,`L`) into `PLAY_ARCHIVE[week]` so
   the record keeps them; build next week's `SLATE` (ids, kickoff times ET, TV), `LINES`
   (consensus opening lines), `TEAM_STATS`, ATS/O-U records, PFR defense-vs-position
   totals, `STARTERS`/`PINFO` changes, and refresh `REAL_PROPS` with lines that are posted.
   Remove/replace old week props. Update every "Week N" / date label.
5. Pick 5–6 new Plays of the Week (mix: 2–3 player props, a spread, a moneyline, a total)
   using the same method: props need a strong season hit rate vs the posted line and a
   matchup that doesn't work against it; game plays need the score model (`projScore`) to
   disagree with the line by a meaningful margin. Explanations: 2–3 sentences, facts only
   from the site's data, verified. Never promise wins.
6. Build, test, publish. Finish with a short summary: scores added, record update
   (W-L, units), new plays, anything that couldn't be found.

## SATURDAY run (injuries, weather, line moves)
1. Rewrite `data/espn_inj.txt` from ESPN's injury report (all 32 teams, every listed player,
   format `#TEAM` then `name|POS|status|injury|est. return`), then run
   `python3 tools/injgen.py data/espn_inj.txt "<Sat Mon D>"` (sets `INJ` and `INJ_ASOF`). Update `QB1_STATUS[...].now` if a starting QB's status changed.
2. Update `WX` forecasts for outdoor games (domes/roofs stay `{dome:…}`).
3. Refresh `LINES` and `REAL_PROPS` odds that moved; add newly posted props (with ESPN logs
   for any new player — every prop player must have a game log).
4. If a Plays of the Week player is ruled Out or a line moved past the edge, swap that play
   for another qualifying one and say so in the summary. Update `PLAYS_ASOF`.
5. Build, test, publish. Short summary of key injuries, weather risks, and any play changes.

## Rules
- Real data only; if something can't be found, leave it out and say so in the summary.
- Plays are labelled as data-based leans, never guarantees; keep the US-first notice
  (21+ (18+ in some states) · 1-800-GAMBLER, then Quebec 1-800-461-0140 and Ontario lines) on the Plays page, My Bets and footer. Wins AND losses stay on the record.
- Keep the artifact private. Don't remove features. Keep mobile layout within 390px.

## Odds format
Odds are stored as American numbers everywhere. Display always goes through `amTxt()` / `oddsFmt()` / `fmtOdds()`
(engine.js), which follow the viewer's American/Decimal toggle in the header (`ODDS_FMT`, saved in localStorage
key `rla_odds`). Never hard-code an odds string like "−110" in the UI — use `amTxt(-110)`.

## Usage data (snap share, target share, air-yards share, carry share) — refresh EVERY run
Source: nflverse open data on GitHub (CC-BY 4.0) — reachable from the workspace with curl (GitHub is allowed):
```
mkdir -p /home/claude/nflv && cd /home/claude/nflv
curl -sSLO https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv
curl -sSLO https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_2026.csv
cd /home/claude/nfl-edge && python3 tools/usagegen.py /home/claude/nflv > usage_data.js
```
Spot-check one player against ESPN before publishing. The same stats file has every player's full box-score line
for every game (completions/attempts/yds/TD, carries, targets, receptions) — use it to fill game-log gaps too.

## Market data (market.js) — refresh on the SATURDAY run and when rolling to a new week
- `MOVE[gameId]`: opening vs current spread (home, negative = home favoured), total, moneyline — from ESPN's NFL
  odds page (https://www.espn.com/nfl/odds, "Open" column vs current, DraftKings).
- `BEST[gameId]`: best price per side across US books — WIN DAILY odds page for the week
  (WebSearch "windailysports NFL Week N odds", fetch the result). Format is in the file header.
- `PROP_MOVE["Player|market"]`: only when an article publishes BOTH the opening and current prop number. Never guess.
- Update `MARKET_ASOF`. When rolling to a new week, clear MOVE/BEST/PROP_MOVE and rebuild for the new slate.

## My Bets + share cards (bets.js)
Per-viewer, stored in the viewer's browser (localStorage key ge_bets). Bets store the week, line and odds at the time
they were added and grade from RESULTS + player logs, so keep RESULTS and logs complete. Nothing to update weekly.

## Advanced data (adv_data.js): box scores, red zone, pace/pass rate, rest & travel — refresh EVERY run
Needs three nflverse files in /home/claude/nflv (GitHub release downloads work from the workspace):
```
cd /home/claude/nflv
curl -sSLO https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv
curl -sSLO https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz
curl -sSLO https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv
cd /home/claude/nfl-edge && python3 tools/advgen.py /home/claude/nflv <CURRENT_WEEK_NUMBER> > adv_data.js
```
- BOX feeds the Scores page box scores (tap a final). RZ feeds the player-page "Red zone & goal line" card and the
  anytime-TD prop line. PACE feeds "Pace & play style" on game pages. REST (for <CURRENT_WEEK_NUMBER>) feeds
  "Rest & travel" and the 🧳 line on the games list — pass the week being previewed (after the Sunday-night roll,
  that's the NEW week).
- Spot-check one box score against ESPN before publishing.
- Player search (header) and home/away + last-5 splits are computed in the page from PINFO and the game logs.

## NBA section (separate sport, NFL/NBA switch in the header)
Files: `data/nba_lines.txt`, `data/nba_props.txt`, `data/nba_inj.txt` (hand-kept text) + `tools/nbagen.mjs` → `nba_data.js`; views in `nba.js`.
Routes: `#nba` (games + ⭐ Plays of the day), `#nba-game-<espn id>`, `#nba-best` (every line ranked, both sides), `#nba-props`, `#nba-players`, `#nba-player-<name>`, `#nba-scores`, `#nba-teams`, `#nba-injuries`.

1. Data (hoopR, refreshed by sportsdataverse in the morning): `bash tools/nbafetch.sh` (src/tools/nbafetch.sh.txt → tools/nbafetch.sh; it also needs tools/read_parquet.mjs). It sparse-clones sportsdataverse/hoopr-nba-data and writes /home/claude/nba/{player_box_2027, player_box_2026, nba_schedule_2027, team_box_2027, rosters_2027, pbp_2027}.json. ALL six are needed: team_box → offense/defense matchups on game pages, pbp → shot-zone court on player pages, rosters → height/weight/age, player_box_2026 → last-season H2H/L10.
2. Lines: WebFetch https://www.espn.com/nba/odds → `data/nba_lines.txt` (`AWAY@HOME|open home spread|open total|home spread|spread price|total|over|under|away ML|home ML`, update the `# asof:` line). Keep the open values from the first fetch of the day.
3. Injuries: WebFetch https://www.espn.com/nba/injuries → `data/nba_inj.txt` (`#Full Team Name` then `name|POS|status|injury|est return`). Every team, every row.
4. Props: ONLY real posted sportsbook lines. Best source: covers.com player pages (WebSearch '"Projections, Prop Bets, Odds, And Stats" <player names>' with allowed_domains covers.com to surface https://www.covers.com/sport/basketball/nba/players/<id>/<slug>, then WebFetch). Use a page ONLY if its 'odds last updated' date and game are today's (cached pages can show an older game — skip those). Prefer DraftKings, else FanDuel/BetMGM/Caesars/Fanatics/bet365; over and under from the same book and line. Do EVERY rotation player: every healthy player averaging 15+ minutes over his last 5 games (about 7–9 per team). Fetch prompt that works: ask WebFetch for the upcoming game + odds-last-updated time and a table market|line|over|under|sportsbook of current odds where one book shows both sides (covers names: Points Scored=pts, Total Rebounds=reb, Total Assists=ast, 3 Pointers Made=3pm, Points and Assists=pa, Points and Rebounds=pr, Rebounds and Assists=ra, Points Rebounds and Assists=pra, Total Blocks=blk, Total Steals=stl; skip Steals and Blocks, double-doubles). One line per player+market (no duplicates). Also vegasinsider / scoresandodds props pages. `player|market|line|over|under|book` with market one of pts, reb, ast, 3pm, 3pa, pa (pts+ast), pra, pr (pts+reb), ra (reb+ast), blk, stl. Prediction-market "cents" prices and alt ladders (0.5, 1.5) don't count. The player must exist in NBA_LOGS (nbagen drops others). Books post the morning of the game; if none are up, leave the file empty — the props page then shows tonight's player form.
5. `node tools/nbagen.mjs /home/claude/nba <today YYYY-MM-DD Eastern> > nba_data.js`, then build, smoke test, test `#nba*` routes at 390/1200 (no overflow), publish, push.
- nba_data.js also carries NBA_PREV (last season's last 10 games + games vs tonight's opponent for tonight's players) and NBA_H2H (last season's team meetings) from player_box_2026 — fetch nba/player_box/parquet/player_box_2026.parquet too and convert it to /home/claude/nba/player_box_2026.json.
- Positions (PG/SG/SF/PF/C) come from data/nba_depth.txt (ESPN depth charts; WebSearch '2026-27 NBA Depth Chart ESPN <3 team names>' with allowed_domains espn.com — the search snippets contain the full tables). Refresh it about once a week or after big trades. Players not listed fall back from G/F/C (G→SG, F→SF).
- Teammate with/without filter uses NBA_ROS (tonight's rosters) and teammate indices stored on last-season rows (index 19); generated automatically.
- Leans: model edge ≥3 on spread / ≥4 on total, and suppressed when a regular (24+ min) is newly Out. Never invent odds.
- Injury-only refresh (every 2 hours): just step 3 + step 5.

### NBA Plays of the day / Best props (automatic)
`nbaBest()` in nba.js ranks every posted line (over and under) by a hit score = 45% last-10 + 35% season + 20% vs tonight's opponent, ±5 for the position matchup, minus what the odds need (implied probability). `nbaPlays()` picks the top 2–3 (max one per game first, one per player) that also pass: 7+ of last 10, season hit rate ≥60% over 3+ games, edge ≥12 points, odds between −200 and +150, no injury tag. Nothing to hand-edit — refreshing nba_props.txt and nba_data.js updates them every day. Prop cards and best rows open the player's page (#nba-player-<name>) with his lines table at the top.

### NBA Plays of the day record (locked log)
- `data/nba_plays.txt` (`date|player|market|side|line|odds|book|team|opp`) is the permanent record. NEVER edit past days.
- The 11:47 AM props task locks the day's plays AFTER regenerating nba_data.js: `node tools/nbaplays.mjs` (it replaces only today's rows and refuses once the first game has tipped). Then rerun `node tools/nbagen.mjs ... > nba_data.js` so NBA_PLAYLOG includes them, and publish `src/data/nba_plays.txt` with the other files.
- Grading is automatic in the page (nbaGradeOne): box score from NBA_LOGS on that date; no box score + team game final = void (DNP); otherwise pending. 1 unit per play.
### NBA line movement / splits
- Movement compares the open columns in nba_lines.txt (ESPN's opening line) with the current numbers — always keep the open columns when refreshing.
- Player splits (home/away, rest, starter/bench, team won/lost) are computed from NBA_LOGS + NBA_RES; nothing to maintain.

### NFL best props + player lines (automatic)
- Props page opens on "🔥 Best this week": `nflBest()` in ui.js ranks every REAL_PROPS line, both sides (TD = yes only): hit score = 45% last 5 + 35% season + 20% vs this opponent, ±5 for the defense's rank vs his position (top 8 / bottom 8), minus what the listed odds need (−110 break-even 52% when the price isn't listed — labelled "odds not listed").
- Player page shows "His lines this week": every real line with his last 6 games (green over / red under). Nothing to maintain beyond REAL_PROPS and the logs.

### Props close at tip-off / kickoff
- nbaStarted(g) / nflStarted(g) (live.js): true when the live feed says in-progress/final, otherwise when Eastern time passes the scheduled start (NBA: NBA_SLATE_DATE + g.t; NFL: date and time parsed from g.when "Sun Nov 1 · 1:00 PM"). Started games' props are hidden from All props, Best props and player-page lines (with a 🔒 note). Plays of the day / Plays of the Week stay visible so they can be tracked and graded.

### New shared pages and features (Nov 1)
- `#record` (📒 Record, both navs): combined NFL Plays of the Week + NBA Plays of the day record, by sport, by bet type, every play. Built from PLAY_ARCHIVE/PLAYS (plays.js) and NBA_PLAYLOG — nothing to maintain beyond those.
- `#guide` (Betting 101, both navs): static beginner guide + responsible-gambling numbers + install-the-app help.
- `#calc`, `#record`, `#guide` are shared: they keep whichever sport menu was last used.
- Share images: "📤 Share" buttons on NBA Plays of the day, NFL Plays of the Week and the record page draw a 1080×1350 PNG (extras.js shareImage) and open the phone share sheet (or download). Do NOT use the attribute `data-share` for new buttons — bets.js captures every [data-share] click.
- NBA game pages: "By quarter & first half" card from NBA_QTR (nbagen builds it from play-by-play end-of-quarter scores).
- NFL game pages: "Biggest edges" (nflEdges: offense vs defense rank gaps of 10+, plus run-game spots) and rank bars in Offense vs defense.
- Live: NFL Plays of the Week show live progress (ESPN NFL summary box score) on #plays.
- Install as app (PWA): the GitHub repo holds manifest.webmanifest, sw.js and icons/ next to index.html. The service worker registers only on *.github.io and is network-first (never caches ESPN). Keep those files when updating the repo — only index.html changes day to day.
- build.sh order: … nba.js live.js extras.js ui.js (ui.js must stay last; it closes the <script>).

### More info pages (Nov 1, late)
NBA (all built by tools/nbagen.mjs — nothing to hand-edit):
- `#nba-teams` = Standings (East/West, GB, L10, streak, home/road, net rating; playoff line after 6th, play-in after 10th). `#nba-team-<ABBR>` = team page (record, ratings, next 7 days, last 5, roster, injuries).
- NBA_SPOT (schedule spots for tonight: 3-in-4, 4-in-6, road-trip game N, home after N-game trip) → tags on game cards and game pages.
- NBA_NEXT (every team's next 7 days) → team pages, player pages.
- NBA_PADV (usage %, true shooting %, +/- per game, per-36, ranks among 15+ mpg players) → "Advanced" card on player pages.
- LINE SHOPPING: nba_props.txt rows may carry 4 extra columns: `player|market|line|over|under|book|bestOver|bestOverBook|bestUnder|bestUnderBook` = the best price at the SAME line across all books on the covers page (only when better than the main book's). The ranking uses the best price; cards show "🛒 Best price". Leave the extra columns off when only one book is listed.
NFL (built by tools/nflgen.py from nflverse → nfl_extra.js; run on both NFL scheduled runs):
- `bash tools/nflfetch.sh` (downloads games.csv, stats_player_week_<Y>.csv, snap_counts_<Y>.csv, play_by_play_<Y>.csv.gz to /home/claude/nflv) then `python3 tools/nflgen.py /home/claude/nflv > nfl_extra.js`. Publish src/nfl_extra.js.
- NFL_STAND/NFL_SEEDS → `#standings` (divisions + playoff picture, simplified tiebreakers). NFL_NEXT → "next games" on game and player pages. NFL_SHARE → "Target & snap share" on game pages. NFL_PRESS → "Pass rush vs offensive line" on game pages (sack and QB-hit rates per dropback, ranks).
- build.sh order: … nba.js nfl_extra.js nflx.js live.js extras.js ui.js

### App shell (app.js) — Nov 1
- `#today` is the home page (no hash = Today): live games, NBA Plays of the day, NFL Plays of the Week, ⭐ favorites, top props both sports, tonight's NBA games, upcoming NFL games, record, "updated" strip. Everything is computed from existing data.
- Phones (≤700px): bottom tab bar (Today · Games · Props · Record · More); the long top menus are hidden and live in the More sheet (which also holds the odds-format switch). Desktop keeps the top menus (with 🏠 Today first).
- One search box finds NBA players/teams and NFL players/teams (appSearchSetup replaces adv.js searchSetup).
- Favorites: ☆ Save on NBA player/team pages and NFL player pages; stored in localStorage key ge_favs; shown on Today.
- Updated strip: NBA_GEN (nbagen writes the generation time, ET) + NFL MARKET_ASOF/USAGE_ASOF/NFL_XWEEK. Keep MARKET_ASOF current on NFL runs.
- Age check on first visit (21+; 18+/19+ Canada) stored in ge_age_ok; skipped automatically for automated browsers (navigator.webdriver), so Playwright tests are unaffected.
- Link previews: Open Graph/Twitter tags in shell_head.html point to og.png in the GitHub repo root (1200×630). Keep og.png in the repo.
- build.sh order: … nba.js nfl_extra.js nflx.js live.js extras.js app.js ui.js

### Bets, parlays, roles, profit chart, analytics (Nov 2)
- Every bet button (NBA odds buttons on prop cards, player lines, Best props "＋", Plays "＋"; NFL "＋ My Bets") uses `data-act` and opens a small menu: Track in My Bets / Add to parlay (app.js). Don't use data-bet/data-share for new buttons.
- My Bets (#bets, shared by both sports) grades NBA props (k:"nbaprop", from NBA_LOGS by date) and parlays (k:"parlay": loss if any leg loses, win when all live legs win; pushes/voids drop out).
- Parlay slip: floating "🎟 Parlay" button; legs saved in ge_slip; shows combined odds, book's implied chance and our estimate (product of hit scores).
- Role changes (nbaRole): minutes up/down 5+ over the last 3 games vs before, moved into/out of the starting lineup — card on NBA Games and Today, tags on prop cards and player pages.
- Record page has a cumulative-units chart (NFL weeks plotted on that week's Sunday).
- Visitor stats: set ANALYTICS_CODE in app.js to the GoatCounter site code (e.g. "rlasharp") to switch on counting on github.io only.
- Speed: pLogs() is memoised and nflBest() cached; keep heavy loops out of render paths.

### Simpler pages (Nov 2)
- Verdict box on every prop (app.js nbaVerdict / nflVerdict): picks the side with the higher hit score and lists ✅/⚠️ reasons (hit rates, matchup, minutes/role, back-to-back, star teammate out, injury tag, price vs hit score). Strength: Strong = hit score ≥75% and edge ≥12 pts; Medium ≥62%/≥5; Weak otherwise; "No clear lean" when the edge is ≤0 or hit score <55%. Player-page line rows show the same as a small pill.
- Filters: NBA Best props (game, market, overs/unders, minimum hit score — NB.bf) and NFL Best this week (game, market, position, side — NFL_BF).
- NFL menu: Predictions and Team Trends tabs removed (routes still work). Projections live on every Games card; the ATS/over-under trends table is now inside Standings (#stTrends).
- Collapsible drawers (app.js drawerize + DZ_RULES): on NBA game/player pages and NFL game/player pages the deeper sections fold into tap-to-open drawers by heading text; opened drawers are remembered (ge_dzOpen). If you add a new section, add its heading regex to DZ_RULES to fold it.
- 📸 Snapshot buttons on prop cards make a shareable image with the RLA Sharp logo (app.js snapImage). Don't use data-share for new buttons.

## Favorites page, snapshot charts, ⓘ glossary (Nov 2)
- `#favs` route (app.js `favListHtml(full)` / `viewFavs`), section `v-favs`, links in both desktop navs and the More sheet. Today shows favorites at the top when any are saved.
- Prop snapshots (`snapImage`) take `o.tiles` (hit-rate tiles `[label, overs, games]`) and `o.bars` (`{line, cap, vals:[{v,lab}]}`): last-10 bar chart, green over / red under, dashed gold line at the prop line.
- Glossary: `GLOSS` list in app.js (`[term, one-liner, caseInsensitive]`). `glDecorate` wraps up to 2 occurrences per term per page in `.gl` (skips links, buttons, summaries, h1); tap shows `#glpop`. Betting 101 gets a full `#glossary` card. Add `class="noglo"` to opt an element out.
- Old tests tq/tg/t3 screenshot cards that now live in closed drawers — open the drawer first.
- Game pages have a **Game | 🎯 Player props** switch. NBA: `#nba-game-ID-props` (`nbaGameProps`, `nbaLineRow` shared with the player page, filters `NB.gpt` team / `NB.gpm` market). NFL: `#game-ID-props` (`nflGameProps`, uses `nflLinesBlock(pl, head)`). Game cards show "🎯 N player props →" (`nbaGamePropCount` / `nflGamePropCount`). Props still close at start.

## Tomorrow / Next week, same-game check, speed (Nov 2)
- NBA `#nba-tomorrow`, `#nba-tomorrow-2`, `#nba-tomorrow-3` (`nbaUpcoming`, games from `NBA_NEXT` home rows; `nbaDayTabs` on the Games page). Shows times, records, back-to-back tags, today's Out list and "our early number" from `nbaModel` (clearly labelled as not a sportsbook line).
- NFL `#nextweek` (`viewNextWeek` in nflx.js, section `v-nextweek`, from `NFL_NEXT` rows with week = PLAYS_WEEK+1; byes listed). `nfWeekTabs` sits on the Games page.
- Parlay slip **same-game check** (app.js `sgpSame/sgpLog/sgpPair/sgpHtml`): for legs from the same game, counts shared past games (NBA by date, NFL by season-week) where both legs hit vs. what independence predicts. Tags: 🤝 hit together / ⚔️ work against (needs 8+ shared games, z≥1.6, lift ≥1.25 or ≤0.75, gap ≥1.5 games). The estimate is adjusted only for tagged pairs, shrunk by sample size. NFL "His lines" rows now have Over/Under (Yes for TD) buttons → Track / Add to parlay.
- **Speed**: Chart.js is no longer a render-blocking `<script>`; `loadChart()` in engine.js loads it after page load (or on the first `mk()` call, which is queued in `CH_Q`). Google Fonts load non-blocking. `build.sh` runs `tools/jsonify.py` (safe no-op for lines that aren't pure JSON) to turn big one-line data literals into `JSON.parse('…')`. `etNow()` and NBA date labels reuse cached `Intl.DateTimeFormat` objects. Long lists use CSS `content-visibility:auto`.
- Scheduled tasks: download `src/tools/jsonify.py.txt` → `tools/jsonify.py` (other `src/tools/*.py.txt` → `tools/*.py` already covers it). If it's missing, build.sh just skips it.

## ⚡ Live odds (PropLine, Nov 2)
- GitHub repo only (not in the artifact): `.github/workflows/odds.yml` runs `tools/fetch_odds.py` every 30 min (~8 AM–midnight ET) with the `PROPLINE_API_KEY` repo secret and commits `data/live_odds.json` when it changes. NBA every run (games in the next 30 h); NFL at most every 3 h (next 8 days). Free plan = 1,000 requests/day; the script stops at 900 (`budget` in the JSON).
- Real sportsbooks only (DFS apps / prediction markets / Pinnacle dropped). Main line = first of DraftKings, FanDuel, BetMGM, Caesars, Fanatics, ESPN BET, BetRivers… with both sides at one line; best over/under at that same line → line-shopping columns. `open` keeps the first-seen line of the day per prop.
- Site: `liveodds.js` (in build.sh after live.js) fetches `data/live_odds.json` on load + every 5 min (public site only; skipped on file:// and missing file). Rows for today's NBA slate (event `date` = NBA_SLATE_DATE) replace/add NBA_PROPS rows; NFL rows replace REAL_PROPS for this week's teams (player must be in PINFO with game logs). `loMoveTag` shows ▲/▼ "from X" next to the line. Later refreshes show a "🔄 New odds — tap to update" pill instead of re-rendering under the reader.
- The daily scheduled prop tasks stay as the backup and still write data/nba_props.txt / REAL_PROPS.

## Nov 2 afternoon: opponent tiles, line charts, Scores weeks, live-props merge
- **Live props into the static files**: `python3 tools/liveprops.py <repo>/data/live_odds.json <YYYY-MM-DD>` merges the PropLine feed (GitHub repo `data/live_odds.json`, refreshed every 30 min by the GitHub Action) into `data/nba_props.txt`, mapping accented / Jr. / III names to NBA_LOGS names. Get the feed with `git clone --depth 1 https://github.com/rlasharp/rla-sharp` (after add_repo). Use this instead of page-by-page covers/FanDuel scraping whenever the feed is from today. Then rerun nbagen.
- **tools/nbaplays.mjs** now stubs `startedKey/nbaStarted/nflStarted/etNow` (they live in live.js) — before this fix it crashed and no plays were locked.
- **Opponent allows** (`nbaOppAllows(opp,k)` in nba.js, from NBA_TADV `d`): paint pts, 3-pt pts (tpa×3P%×3), free-throw pts (fta×FT%), rebounds, fast-break pts, each with "Nth most of 30" (green = gives up a lot, red = stingy, ★ = matters for this market). Shown on every NBA prop card, the player page "His lines tonight", and the game Props tab (one block per team).
- **Line charts**: `nbaMiniBars(vals,line,labels)` SVG — last 10 games vs the line (gold dashed) in every NBA line row and NFL "His lines this week" row, with "Last 10: x/10 over · avg".
- **Scores page (#weeks)**: the current week is PLAYS_WEEK (not the last week with finals); this week's SLATE games show only under the current week; unplayed games of an older week (e.g. Monday night) come from NFL_NEXT.
- **NFL target map & matchup** (`nfMatrixCard` in nflx.js, on the NFL player page for WR/TE/RB): data file `nfl_tgt.js` from `python3 tools/nfltgt.py /home/claude/nflv > nfl_tgt.js` (needs pbp.csv.gz + pstats.csv + ftn.csv from `bash tools/nflfetch.sh`). NFL_TGT (per receiver: targets by zone Deep/Intermediate/Short/Behind × Left/Middle/Right, rec, yds, yac, first downs, air yards, contested targets/catches), NFL_DEFTGT (same, allowed per defense per position), NFL_LGTGT (league per position), NFL_BLITZ (FTN blitz % of dropbacks). Coverage bar = DEF_COV (Sharp Football). Player-vs-man/zone splits are NOT public data — don't invent them. Regenerate on the Sunday-night and Saturday runs (build.sh includes nfl_tgt.js).
- **NBA shot matchup** (`nbaShotMatchup(nm,opp)`, player page "Where he scores vs where X allow"): NBA_DZONE / NBA_DZG from nbagen (shots by zone against each defense, games). Toggle His shots / X allow (court), callouts where he takes 10%+ of shots and the defense allows ±3 pts vs NBA FG%, plus a zone table.
- **Line moves** (`loMovesCard(sp,n)` in liveodds.js): biggest moves since the feed's first line of the day, on Today and the NBA Games page (public site only).
- **Closing line value** (`clvCardHtml` in extras.js, Record page): reads `data/close/<ET date>.json` in the GitHub repo, written by `tools/fetch_odds.py` (`save_close`) every run with the latest pregame line per prop → the last write before tip = the close. NBA plays use the locked line/odds; NFL prop plays need `line` stored in PLAY_ARCHIVE entries (store pl.line + pl.odds when archiving).
- **Leftover games (Monday night)**: when the week rolls over before Monday night, keep that game in SLATE with `wk:<old week>` (e.g. `{id:"mnf8",away:"CHI",home:"SEA",when:"Mon Nov 2 · 8:15 PM",tv:"MNF",wk:8}`) plus its LINES entry. `nflDone(g)` (engine.js) treats it as done once ESPN live says final or the date has passed, so `oppOf()` then moves those teams to the new week; the Scores page keeps "(now)" on the old week until then; live NFL props only apply to each player's current game. The next NFL run adds its final to RESULTS and removes the entry.
- **Alt lines & matchup splits** (propx.js, on NBA + NFL player pages): alt-line ladder (line ±3 steps; NFL yards step 5), NBA blowout risk (tonight's spread from NBA_LINES, his games split by final margin from NBA_RES), vs soft/middle/tough defenses (NBA: NBA_TADV d-stats rank per market; NFL: dvpFor rank 1–10 / 11–22 / 23–32), NBA vs fast/slow pace (NBA_TADV pace), NFL game script (NFL_SPR = each team's closing spread + final margin per week, written by tools/nfltgt.py from nflverse games.csv — so the Sunday-night nfltgt run keeps it current).
- **Filter his games (spread / total / minutes sliders)** in propx.js (`pxFilterBlock`, `pxFilterWire`). NBA spreads+totals = NBA_SPR (nba_spr.js), built by build.sh from /home/claude/rla-sharp/data/nba_spreads.json — written nightly (~4:23 AM ET) by the repo's `spreads.yml` Action (tools/fetch_spreads.py, ESPN closing lines). So **git pull the repo before building** to pick up last night's games. NFL spreads+totals = NFL_SPR [teamSpread, margin, total] from tools/nfltgt.py (games.csv).
- **Situation filters** (Venue / Rest / Role on NBA via NB.gf.ven/rest/role in nbaInR; Venue / Rest on NFL via PXS[key].ven/rest). NFL rest = NFL_RST (week|team → rest days from nflverse games.csv, written by tools/nfltgt.py): ≤5 short week, ≥12 after bye. The old Splits cards were removed (the filters replace them).
- **NBA filters (Nov 2 eve):** FGA slider (x[11]), implied team-total slider (tot/2 − sp/2), multi-teammate With/Without (NB.tmf[nm] = {name:"w"|"o"}), filters reset when you open a different player. "Team without player" cards removed. NFL: Targets slider (USAGE_RAW wk[1]); NFL player page = header line, defense tiles, one prop card + filters, extras as tabs (nflExtrasCard); All props tab uses rows (propRowLite).
