#!/usr/bin/env python3
"""RLA Sharp — NHL data (GitHub Actions). Official public NHL API (api-web.nhle.com, api.nhle.com/stats).
Writes the site's src/nhl_data.js to stdout. Box scores of finished games are cached in
src/data/nhl_box.json so each run only downloads new games. Real data only: a failed request keeps
what we had (the cache and the last nhl_data.js stay as they are).

usage: python3 tools/nhlfetch.py <repo root> <today ET YYYY-MM-DD>  > nhl_data.js
"""
import json, os, re, sys, time, unicodedata, datetime as dt, urllib.request
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/Toronto")
ROOT, TODAY = sys.argv[1], sys.argv[2]
CACHE = os.path.join(ROOT, "src", "data", "nhl_box.json")
LIVE = os.path.join(ROOT, "data", "live_odds.json")
UA = {"User-Agent": "rla-sharp/1.0 (+https://rlasharp.github.io/rla-sharp/)", "Accept": "application/json"}
SEASON_START = "2026-10-01"
NREQ = [0]

def get(url, tries=3):
    last = None
    for i in range(tries):
        try:
            NREQ[0] += 1
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                d = json.load(r)
            time.sleep(0.15)
            return d
        except Exception as e:
            last = e; time.sleep(2 * (i + 1))
    raise RuntimeError(f"{url}: {last}")

def log(*a): print(*a, file=sys.stderr)
def dflt(o): return (o or {}).get("default") if isinstance(o, dict) else o
def secs(t):
    try: m, s = str(t).split(":"); return int(m) * 60 + int(s)
    except Exception: return 0
def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")); s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"\b(jr|sr|ii|iii|iv)\b\.?", "", s); return re.sub(r"[^a-z]", "", s)
def et_dt(iso):
    return dt.datetime.fromisoformat(str(iso).replace("Z", "+00:00")).astimezone(ET)

# ---------- cache ----------
try:
    with open(CACHE) as f: C = json.load(f)
except Exception:
    C = {}
C.setdefault("games", {}); C.setdefault("names", {}); C.setdefault("pos", {})

# ---------- schedule: walk the season week by week (cheap), find finished games we don't have ----------
d0 = dt.date.fromisoformat(C.get("scan_from") or SEASON_START); today = dt.date.fromisoformat(TODAY)
SCHED = {}  # gid -> schedule game
d = d0
while d <= today + dt.timedelta(days=1):
    try:
        w = get(f"https://api-web.nhle.com/v1/schedule/{d.isoformat()}")
    except Exception as e:
        log("schedule failed", d, e); break
    for day in w.get("gameWeek") or []:
        for g in day.get("games") or []:
            if g.get("gameType") not in (2, 3): continue
            g["_day"] = day.get("date"); SCHED[str(g["id"])] = g
    nxt = w.get("nextStartDate")
    if not nxt: break
    nd = dt.date.fromisoformat(nxt)
    if nd <= d: break
    d = nd

new = 0
for gid, g in sorted(SCHED.items()):
    if gid in C["games"] or g.get("gameState") not in ("OFF", "FINAL"): continue
    try:
        b = get(f"https://api-web.nhle.com/v1/gamecenter/{gid}/boxscore")
    except Exception as e:
        log("boxscore failed", gid, e); continue
    if b.get("gameState") not in ("OFF", "FINAL") or "playerByGameStats" not in b: continue
    A, H = b["awayTeam"], b["homeTeam"]; pd = (b.get("periodDescriptor") or {})
    rec = {"d": g["_day"], "a": A["abbrev"], "h": H["abbrev"], "as": A.get("score"), "hs": H.get("score"),
           "asog": A.get("sog"), "hsog": H.get("sog"), "ot": 2 if pd.get("periodType") == "SO" else 1 if (pd.get("number") or 3) > 3 else 0,
           "p": [], "gl": []}
    for side, tm in (("awayTeam", A["abbrev"]), ("homeTeam", H["abbrev"])):
        P = b["playerByGameStats"].get(side) or {}
        for grp in ("forwards", "defense"):
            for x in P.get(grp) or []:
                pid = str(x["playerId"]); C["pos"][pid] = x.get("position") or C["pos"].get(pid)
                C["names"].setdefault(pid, dflt(x.get("name")))
                # [pid, team, goals, assists, points, sog, blocked, hits, pim, toiSec, ppg, +/-]
                rec["p"].append([pid, tm, x.get("goals", 0), x.get("assists", 0), x.get("points", 0), x.get("sog", 0),
                                 x.get("blockedShots", 0), x.get("hits", 0), x.get("pim", 0), secs(x.get("toi")),
                                 x.get("powerPlayGoals", 0), x.get("plusMinus", 0)])
        for x in P.get("goalies") or []:
            pid = str(x["playerId"]); C["pos"][pid] = "G"; C["names"].setdefault(pid, dflt(x.get("name")))
            t = secs(x.get("toi"))
            if t <= 0: continue
            # [pid, team, shotsAgainst, saves, goalsAgainst, toiSec]
            rec["gl"].append([pid, tm, x.get("shotsAgainst", 0), x.get("saves", 0), x.get("goalsAgainst", 0), t])
    C["games"][gid] = rec; new += 1
log(f"NHL: {new} new box scores, {len(C['games'])} cached, {NREQ[0]} requests so far")
# next run: rescan from a week before today (late finals, postponements)
C["scan_from"] = max(SEASON_START, (today - dt.timedelta(days=7)).isoformat())

# ---------- today's + tomorrow's games ----------
tom = (today + dt.timedelta(days=1)).isoformat()
def slate_for(day):
    out = []
    for gid, g in sorted(SCHED.items(), key=lambda kv: kv[1].get("startTimeUTC", "")):
        if g.get("_day") != day: continue
        t = et_dt(g["startTimeUTC"])
        out.append({"id": int(gid), "d": day, "t": t.strftime("%-I:%M %p"), "iso": g["startTimeUTC"], "a": g["awayTeam"]["abbrev"],
                    "h": g["homeTeam"]["abbrev"], "st": g.get("gameState"), "an": dflt(g["awayTeam"].get("commonName")),
                    "hn": dflt(g["homeTeam"].get("commonName")), "tv": ", ".join(sorted({x.get("network") for x in g.get("tvBroadcasts") or [] if x.get("countryCode") in ("US", "CA")} - {None}))[:60]})
    return out
SLATE, NEXT = slate_for(TODAY), slate_for(tom)
for g in SLATE + NEXT:  # finals / scores for today's games
    r = C["games"].get(str(g["id"]))
    if r: g["as"], g["hs"], g["ot"] = r["as"], r["hs"], r["ot"]
teams = {g[k] for g in SLATE + NEXT for k in ("a", "h")}

# ---------- full names + positions from current rosters (teams playing today/tomorrow) ----------
ROSTER = {}
for t in sorted(teams):
    try: r = get(f"https://api-web.nhle.com/v1/roster/{t}/current")
    except Exception as e: log("roster failed", t, e); continue
    for grp in ("forwards", "defensemen", "goalies"):
        for x in r.get(grp) or []:
            pid = str(x["id"]); nm = f"{dflt(x.get('firstName'))} {dflt(x.get('lastName'))}".strip()
            C["names"][pid] = nm; C["pos"][pid] = x.get("positionCode"); ROSTER[pid] = t

with open(CACHE, "w") as f: json.dump(C, f, separators=(",", ":"), ensure_ascii=False)

# ---------- standings + team stats ----------
TEAM = {}
try:
    st = get("https://api-web.nhle.com/v1/standings/now")
    for x in st.get("standings") or []:
        a = dflt(x.get("teamAbbrev")); gp = x.get("gamesPlayed") or 0
        TEAM[a] = {"n": dflt(x.get("teamName")), "cn": dflt(x.get("teamCommonName")), "conf": x.get("conferenceAbbrev"), "div": x.get("divisionName"),
                   "gp": gp, "w": x.get("wins"), "l": x.get("losses"), "otl": x.get("otLosses"), "pts": x.get("points"),
                   "gf": round((x.get("goalFor") or 0) / gp, 2) if gp else None, "ga": round((x.get("goalAgainst") or 0) / gp, 2) if gp else None,
                   "home": [x.get("homeWins"), x.get("homeLosses"), x.get("homeOtLosses")], "road": [x.get("roadWins"), x.get("roadLosses"), x.get("roadOtLosses")],
                   "l10": [x.get("l10Wins"), x.get("l10Losses"), x.get("l10OtLosses")], "stk": f"{x.get('streakCode') or ''}{x.get('streakCount') or ''}",
                   "rk": x.get("leagueSequence"), "drk": x.get("divisionSequence")}
except Exception as e:
    log("standings failed", e)
try:
    y = int(TODAY[:4]) if int(TODAY[5:7]) >= 9 else int(TODAY[:4]) - 1
    ts = get(f"https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId={y}{y + 1}%20and%20gameTypeId=2")
    byname = {v["n"]: k for k, v in TEAM.items()}
    for x in ts.get("data") or []:
        a = byname.get(x.get("teamFullName"))
        if not a: continue
        TEAM[a].update({"pp": round((x.get("powerPlayPct") or 0) * 100, 1), "pk": round((x.get("penaltyKillPct") or 0) * 100, 1),
                        "sf": round(x.get("shotsForPerGame") or 0, 1), "sa": round(x.get("shotsAgainstPerGame") or 0, 1)})
except Exception as e:
    log("team summary failed", e)
# league ranks (1 = best) for the comparison table
def rank(key, high_good=True):
    v = [(a, t[key]) for a, t in TEAM.items() if t.get(key) is not None]
    v.sort(key=lambda z: -z[1] if high_good else z[1])
    for i, (a, _) in enumerate(v): TEAM[a][key + "R"] = i + 1
for k, hg in (("gf", True), ("ga", False), ("pp", True), ("pk", True), ("sf", True), ("sa", False)): rank(k, hg)

# ---------- per-player logs from the cached box scores ----------
games = sorted(C["games"].items(), key=lambda kv: (kv[1]["d"], kv[0]))
RES = [[g["d"], g["a"], g["as"], g["h"], g["hs"], g["ot"], g.get("asog"), g.get("hsog")] for _, g in games]
SK, GO = {}, {}
for gid, g in games:
    for r in g["p"]:
        pid, tm = r[0], r[1]; opp = g["h"] if tm == g["a"] else g["a"]; ha = "A" if tm == g["a"] else "H"
        # [date, opp, H/A, goals, assists, points, sog, blocked, hits, pim, toiSec, ppg, +/-]
        SK.setdefault(pid, []).append([g["d"], opp, ha] + r[2:])
    starters = {}
    for r in g["gl"]:
        if r[5] > starters.get(r[1], (0, None))[0]: starters[r[1]] = (r[5], r[0])
    for r in g["gl"]:
        pid, tm = r[0], r[1]; opp = g["h"] if tm == g["a"] else g["a"]; ha = "A" if tm == g["a"] else "H"
        won = (g["as"] > g["hs"]) == (tm == g["a"])
        # [date, opp, H/A, shotsAgainst, saves, goalsAgainst, toiSec, started 1/0, team won 1/0]
        GO.setdefault(pid, []).append([g["d"], opp, ha, r[2], r[3], r[4], r[5], 1 if starters.get(tm, (0, None))[1] == pid else 0, 1 if won else 0])

def cur_team(pid, logs):
    if pid in ROSTER: return ROSTER[pid]
    return None
P, G = {}, {}
for pid, L in SK.items():
    tm = cur_team(pid, L)
    if tm not in teams: continue
    nm = C["names"].get(pid) or pid; n = len(L)
    tot = [sum(x[i] for x in L) for i in range(3, 13)]
    P[nm] = {"id": int(pid), "tm": tm, "pos": C["pos"].get(pid) or "", "gp": n,
             "s": [n, tot[0], tot[1], tot[2], tot[3], tot[4], tot[5], tot[8], round(tot[7] / n / 60, 1)],  # gp,g,a,pts,sog,blk,hits,ppg,toi min
             "g": L[-25:]}
for pid, L in GO.items():
    tm = cur_team(pid, L)
    if tm not in teams: continue
    nm = C["names"].get(pid) or pid; st = [x for x in L if x[7]]
    sa, sv, ga, toi = (sum(x[i] for x in L) for i in (3, 4, 5, 6))
    G[nm] = {"id": int(pid), "tm": tm, "gp": len(L), "gs": len(st), "w": sum(1 for x in st if x[8]),
             "svp": round(sv / sa * 100, 1) if sa else None, "gaa": round(ga * 3600 / toi, 2) if toi else None, "g": L[-15:]}

# ---------- props + game lines from the PropLine feed (refreshed live on the public site too) ----------
PROPS, LINES = [], {}
try:
    with open(LIVE) as f: lo = (json.load(f).get("nhl") or {})
    idx = {norm(n): n for n in list(P) + list(G)}
    full = {v["n"]: k for k, v in TEAM.items()}
    evday = {str(e["id"]): e.get("date") for e in lo.get("events") or []}
    for e in lo.get("events") or []:
        a, h = full.get(e.get("away")), full.get(e.get("home"))
        if a and h: LINES[f"{a}@{h}|{e.get('date')}"] = {k: e[k] for k in ("ml", "tot", "pl") if k in e}
    miss = set()
    for r in lo.get("props") or []:
        if evday.get(str(r[13])) not in (TODAY, tom): continue
        nm = idx.get(norm(r[0]))
        if not nm: miss.add(r[0]); continue
        PROPS.append([nm] + r[1:6])
    if miss: log(f"NHL props: {len(miss)} names not matched, e.g. {sorted(miss)[:6]}")
except Exception as e:
    log("NHL props: feed not read:", e)
for g in SLATE + NEXT:
    L = LINES.get(f"{g['a']}@{g['h']}|{g['d']}")
    if L: g.update(L)

now = dt.datetime.now(ET)
J = lambda o: json.dumps(o, separators=(",", ":"), ensure_ascii=False)
print(f"/* NHL data — official NHL API (api-web.nhle.com) + PropLine sportsbook feed. Generated {now:%Y-%m-%d %H:%M} ET by tools/nhlfetch.py */")
print(f'const NHL_GEN="{now:%a %b %-d %-I:%M %p} ET";')
print(f'const NHL_DATE="{TODAY}",NHL_TOM="{tom}";')
print(f"const NHL_SLATE={J(SLATE)};")
print(f"const NHL_NEXT={J(NEXT)};")
print(f"const NHL_TEAM={J(TEAM)};")
print(f"const NHL_RES={J(RES)}; /* [date, away, aGoals, home, hGoals, 0 reg / 1 OT / 2 SO, aSOG, hSOG] */")
print(f"const NHL_P={J(P)}; /* skaters on teams playing today/tomorrow. g: [date, opp, H/A, G, A, PTS, SOG, BLK, HIT, PIM, TOIsec, PPG, +/-] */")
print(f"const NHL_G={J(G)}; /* goalies. g: [date, opp, H/A, SA, SV, GA, TOIsec, started, teamWon] */")
print(f"const NHL_PROPS={J(PROPS)}; /* [name, market, line, over, under, book] */")
log(f"NHL data: {len(SLATE)} games today, {len(NEXT)} tomorrow, {len(TEAM)} teams, {len(P)} skaters, {len(G)} goalies, {len(PROPS)} props, {len(RES)} finals, {NREQ[0]} requests")
