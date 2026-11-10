#!/usr/bin/env python3
"""Stale-data check: is any data source behind the latest results? Used by the game-day watchdog (quick_gate.py),
the weekly health report and auto_run.sh (to retry the nflverse refresh). Reads only files in the repo.
usage: python3 src/tools/staleness.py <repo root>   -> prints one line per stale source; exit 1 if any (2 if NFL weekly data is behind)"""
import os, re, sys, json, datetime as dt
from zoneinfo import ZoneInfo
R = sys.argv[1] if len(sys.argv) > 1 else "."
S = os.path.join(R, "src"); ET = ZoneInfo("America/Toronto"); now = dt.datetime.now(ET)
def rd(p):
    try: return open(os.path.join(S, p), encoding="utf8").read()
    except Exception: return ""
def week_of(txt):
    m = re.search(r"through Week (\d+)", txt); return int(m.group(1)) if m else None
out, nfl_behind = [], False
res = rd("real.js"); m = re.search(r"const RESULTS=\[(.*?)\];", res, re.S)
latest = max((int(x) for x in re.findall(r"\[(\d+),\"[A-Z]{2,3}\"", m.group(1))), default=0) if m else 0
# NFL weekly sources should catch up by Tuesday after a week's games; flag from Wednesday, or anytime when 2+ weeks behind
for name, f in (("NFL box scores / red zone (adv_data.js)", "adv_data.js"), ("NFL usage (usage_data.js)", "usage_data.js"), ("NFL defense vs position / QB1 / head to head (nfl_weekly.js)", "nfl_weekly.js"), ("NFL player game logs (nfl_logs.js)", "nfl_logs.js")):
    w = week_of(rd(f))
    if w is None: out.append(f"{name}: no data"); nfl_behind = True; continue
    lag = latest - w
    if lag >= 2 or (lag >= 1 and now.weekday() in (2, 3, 4, 5)):   # Wed-Sat
        out.append(f"{name}: through Week {w}, results are through Week {latest}"); nfl_behind = True
# daily sports: each generator stamps when it ran; flag when older than 12 hours while the site keeps rebuilding
def stamp(txt, pat):
    m = re.search(pat, txt)
    if not m: return None
    s_ = re.sub(r",", "", m.group(1)).replace(" ET", "").strip()
    for fmt in ("%Y %a %b %d %I:%M %p", "%Y %a %b %d %I %p"):
        try:
            t = dt.datetime.strptime(f"{now.year} {s_}", fmt).replace(tzinfo=ET)
            if t > now + dt.timedelta(days=1): t = t.replace(year=now.year - 1)
            return t
        except Exception: pass
    return None
for name, f, pat in (("NBA data", "nba_data.js", r'NBA_GEN="([^"]+)"'), ("NHL data", "nhl_data.js", r'NHL_GEN="([^"]+)"'), ("Soccer data", "soccer_data.js", r'SOC_GEN="([^"]+)"')):
    t = stamp(rd(f), pat)
    if t and (now - t).total_seconds() > 12 * 3600: out.append(f"{name}: last refreshed {t:%a %b %-d %-I:%M %p} ET ({(now - t).total_seconds() / 3600:.0f} h ago)")
# injury reports: ruled-out players' props are removed from the site using these, so they must stay fresh
for name, f, hrs in (("NBA injury report (data/nba_inj.txt)", "data/nba_inj.txt", 8), ("NFL injury report (data/espn_inj.txt)", "data/espn_inj.txt", 12)):
    m = re.search(r"(\d{4}-\d\d-\d\d \d\d:\d\d)Z", rd(f)[:200])
    if not m: out.append(f"{name}: no timestamp — file missing or broken"); continue
    t = dt.datetime.strptime(m.group(1), "%Y-%m-%d %H:%M").replace(tzinfo=dt.timezone.utc)
    age = (now - t).total_seconds() / 3600
    if age > hrs: out.append(f"{name}: last refreshed {t.astimezone(ET):%a %b %-d %-I:%M %p} ET ({age:.0f} h ago)")
nh = rd("nhl_data.js")
if nh and re.search(r"var NHL_INJ=\{\};", nh): out.append("NHL injury report: empty in the last NHL refresh (ESPN feed failed?)")
for l in out: print(l)
sys.exit(2 if nfl_behind else 1 if out else 0)
