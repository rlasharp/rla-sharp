#!/usr/bin/env python3
"""NBA starting lineups for a day from NBA.com (the "Starting Lineups" page data: each starter marked Confirmed or
Expected, plus players listed inactive) -> nba_lu.js (var NBA_LU). Runs in every NBA site update, so in the last 2 hours
before tip-off (updates every ~20 min) the site shows the confirmed fives. Real data only; keeps the old file on failure.
usage: python3 tools/nbalineups.py YYYY-MM-DD > nba_lu.js"""
import json, sys, urllib.request, datetime as dt
day = sys.argv[1] if len(sys.argv) > 1 else dt.date.today().isoformat()
TRI = {"NYK": "NY", "SAS": "SA", "GSW": "GS", "NOP": "NO", "UTA": "UTAH", "WAS": "WSH", "BRK": "BKN", "PHO": "PHX"}
req = urllib.request.Request(f"https://stats.nba.com/js/data/leaders/00_daily_lineups_{day.replace('-', '')}.json",
                             headers={"User-Agent": "Mozilla/5.0 (rla-sharp research site)", "Referer": "https://www.nba.com/", "Origin": "https://www.nba.com"})
try:
    with urllib.request.urlopen(req, timeout=30) as r: J = json.load(r)
except Exception as e: sys.exit(f"nbalineups: NBA.com hasn't posted {day}'s lineups yet" if "404" in str(e) else f"nbalineups: {e} — keeping the old file")
G = {}; nconf = nexp = 0
for g in J.get("games") or []:
    sides = {}
    for side in ("awayTeam", "homeTeam"):
        T = g.get(side) or {}; ab = TRI.get(T.get("teamAbbreviation"), T.get("teamAbbreviation"))
        st, out = [], []
        for p in T.get("players") or []:
            nm = p.get("playerName") or f"{p.get('firstName', '')} {p.get('lastName', '')}".strip()
            if (p.get("lineupStatus") or "") in ("Confirmed", "Expected") and p.get("position"):
                st.append([nm, p.get("position") or "", p.get("lineupStatus")]); nconf += p.get("lineupStatus") == "Confirmed"; nexp += p.get("lineupStatus") == "Expected"
            elif (p.get("rosterStatus") or "") == "Inactive": out.append(nm)
        sides[side[:4]] = {"t": ab, "st": st, "out": out}
    a, h = sides.get("away"), sides.get("home")
    if a and h and a["t"] and h["t"]: G[f"{a['t']}@{h['t']}"] = {"a": a, "h": h, "s": g.get("gameStatusText") or ""}
print(f"/* NBA starting lineups — NBA.com (tools/nbalineups.py), {day}, fetched {dt.datetime.now(dt.timezone.utc):%Y-%m-%d %H:%MZ} */")
print("var NBA_LU=" + json.dumps({"d": day, "at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"), "g": G}, separators=(",", ":"), ensure_ascii=False) + ";")
print(f"nbalineups: {len(G)} games, {nconf} confirmed / {nexp} expected starters", file=sys.stderr)
