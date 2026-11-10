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
while d <= today + dt.timedelta(days=3):
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
# play-by-play pass (box scores lack these): faceoffs won/lost, shot attempts (SAT = goals + shots on goal + missed + blocked),
# goals by period, who scored first, and high-danger attempts (unblocked attempts from within 20 ft of the net)
PBP_V = 4   # 4: + power-play / short-handed points, empty-net goals, penalties taken, faceoff matchups
nfo = 0
for gid, rec in sorted(C["games"].items()):
    if rec.get("xv") == PBP_V: continue
    if nfo >= 450: break  # spread a big backfill over runs
    try: pbp = get(f"https://api-web.nhle.com/v1/gamecenter/{gid}/play-by-play")
    except Exception as e: log("play-by-play failed", gid, e); continue
    team_of = {r[0]: r[1] for r in rec["p"]}; team_of.update({r[0]: r[1] for r in rec["gl"]})
    tid = {}
    for side in ("awayTeam", "homeTeam"):
        t = pbp.get(side) or {}
        if t.get("id") is not None: tid[str(t["id"])] = t.get("abbrev")
    fo, sat, sz = {}, {}, {}   # sz: player -> 4 zones x [unblocked attempts, shots on goal incl. goals, goals]
    tm = {rec["a"]: [0, 0, 0, 0, 0, 0], rec["h"]: [0, 0, 0, 0, 0, 0]}   # [SAT, HD attempts, goals P1, P2, P3, scored first]
    first = None
    ppp, x4, fom = {}, {rec["a"]: [0, 0, 0], rec["h"]: [0, 0, 0]}, {}   # ppp: pid -> [PP goals, PP assists, SH points]; x4: team -> [empty-net goals, penalties taken, penalties drawn]
    for pl in pbp.get("plays") or []:
        k = pl.get("typeDescKey"); dd = pl.get("details") or {}
        if k == "faceoff":
            w, l_ = dd.get("winningPlayerId"), dd.get("losingPlayerId")
            if w: fo.setdefault(str(w), [0, 0])[0] += 1
            if l_: fo.setdefault(str(l_), [0, 0])[1] += 1
            if w and l_: fom[f"{w}|{l_}"] = fom.get(f"{w}|{l_}", 0) + 1
            continue
        if k == "penalty":
            pt = tid.get(str(dd.get("eventOwnerTeamId")))
            if pt in x4 and str(dd.get("typeCode", "")).upper() in ("MIN", "MAJ", "BEN"):
                x4[pt][1] += 1; x4[rec["h"] if pt == rec["a"] else rec["a"]][2] += 1
            continue
        if k == "goal":
            sc = str(pl.get("situationCode") or ""); gt = tid.get(str(dd.get("eventOwnerTeamId")))
            if len(sc) == 4 and gt in x4:
                home = gt == rec["h"]; my_g, my_s = (sc[3], int(sc[2])) if home else (sc[0], int(sc[1])); op_g, op_s = (sc[0], int(sc[1])) if home else (sc[3], int(sc[2]))
                if op_g == "0": x4[gt][0] += 1
                pp_, sh_ = my_g == "1" and op_g == "1" and my_s > op_s, my_s < op_s
                for j, who in enumerate((dd.get("scoringPlayerId"), dd.get("assist1PlayerId"), dd.get("assist2PlayerId"))):
                    if not who: continue
                    a = ppp.setdefault(str(who), [0, 0, 0])
                    if pp_: a[0 if j == 0 else 1] += 1
                    elif sh_: a[2] += 1
        if k not in ("goal", "shot-on-goal", "missed-shot", "blocked-shot"): continue
        shooter = dd.get("scoringPlayerId") if k == "goal" else dd.get("shootingPlayerId")
        t = team_of.get(str(shooter)) if shooter else None
        if not t and k != "blocked-shot": t = tid.get(str(dd.get("eventOwnerTeamId")))
        if t not in tm: continue
        if shooter: sat[str(shooter)] = sat.get(str(shooter), 0) + 1
        tm[t][0] += 1
        x, y = dd.get("xCoord"), dd.get("yCoord")
        if k != "blocked-shot" and x is not None and y is not None:
            dist = ((89 - abs(x)) ** 2 + y ** 2) ** .5
            if dist <= 20: tm[t][1] += 1
            if shooter:
                z = 0 if dist <= 20 else 1 if dist <= 35 and abs(y) <= 12 else 2 if dist <= 45 else 3   # slot, high slot, wide / circles, long range
                Z = sz.setdefault(str(shooter), [[0, 0, 0] for _ in range(4)])[z]
                Z[0] += 1
                if k in ("goal", "shot-on-goal"): Z[1] += 1
                if k == "goal": Z[2] += 1
        if k == "goal":
            per = ((pl.get("periodDescriptor") or {}).get("number")) or 0
            if 1 <= per <= 3: tm[t][1 + per] += 1
            if first is None: first = t; tm[t][5] = 1
    rec["fo"] = fo; rec["sat"] = sat; rec["tm"] = tm; rec["sz"] = sz; rec["ppp"] = ppp; rec["x4"] = x4; rec["fom"] = fom; rec["xv"] = PBP_V; nfo += 1
log(f"NHL: {new} new box scores, {nfo} play-by-play logs, {len(C['games'])} cached, {NREQ[0]} requests so far")
# ---------- last season (2025-26) box scores, cached once in src/data/nhl_prev.json: longer player histories + H2H ----------
PREV_F = os.path.join(ROOT, "src", "data", "nhl_prev.json")
try:
    with open(PREV_F) as f: PV = json.load(f)
except Exception:
    PV = {}
PV.setdefault("games", {}); PV.setdefault("sched", {})
if not PV.get("scanned"):
    d = dt.date(2025, 10, 1)
    while d <= dt.date(2026, 4, 20):
        try: w = get(f"https://api-web.nhle.com/v1/schedule/{d.isoformat()}")
        except Exception as e: log("prev schedule failed", d, e); break
        for day in w.get("gameWeek") or []:
            for g in day.get("games") or []:
                if g.get("gameType") == 2: PV["sched"][str(g["id"])] = day.get("date")
        nxt = w.get("nextStartDate"); nd = dt.date.fromisoformat(nxt) if nxt else None
        if not nd or nd <= d: PV["scanned"] = True; break
        d = nd
    else:
        PV["scanned"] = True
npv = 0
for gid, day in sorted(PV["sched"].items()):
    if gid in PV["games"]: continue
    if npv >= 330: break
    try: b = get(f"https://api-web.nhle.com/v1/gamecenter/{gid}/boxscore")
    except Exception as e: log("prev boxscore failed", gid, e); continue
    if "playerByGameStats" not in b: PV["games"][gid] = None; continue
    A, H = b["awayTeam"], b["homeTeam"]; pd = (b.get("periodDescriptor") or {})
    rec = {"d": day, "a": A["abbrev"], "h": H["abbrev"], "as": A.get("score"), "hs": H.get("score"), "ot": 2 if pd.get("periodType") == "SO" else 1 if (pd.get("number") or 3) > 3 else 0, "p": [], "gl": []}
    for side, tm in (("awayTeam", A["abbrev"]), ("homeTeam", H["abbrev"])):
        P_ = b["playerByGameStats"].get(side) or {}
        for grp in ("forwards", "defense"):
            for x in P_.get(grp) or []:
                pid = str(x["playerId"]); C["names"].setdefault(pid, dflt(x.get("name"))); C["pos"].setdefault(pid, x.get("position"))
                rec["p"].append([pid, tm, x.get("goals", 0), x.get("assists", 0), x.get("points", 0), x.get("sog", 0), x.get("blockedShots", 0), x.get("hits", 0), x.get("pim", 0), secs(x.get("toi")), x.get("powerPlayGoals", 0), x.get("plusMinus", 0)])
        for x in P_.get("goalies") or []:
            t_ = secs(x.get("toi"))
            if t_ > 0: rec["gl"].append([str(x["playerId"]), tm, x.get("shotsAgainst", 0), x.get("saves", 0), x.get("goalsAgainst", 0), t_])
    PV["games"][gid] = rec; npv += 1
with open(PREV_F, "w") as f: json.dump(PV, f, separators=(",", ":"), ensure_ascii=False)
log(f"NHL last season: {sum(1 for v in PV['games'].values() if v)} of {len(PV['sched'])} games cached ({npv} new)")
PREV = sorted([(k, v) for k, v in PV["games"].items() if v], key=lambda kv: (kv[1]["d"], kv[0]))

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
LATER = [g for k in (2, 3) for g in slate_for((today + dt.timedelta(days=k)).isoformat())]
for g in SLATE + NEXT + LATER:  # finals / scores for today's games
    r = C["games"].get(str(g["id"]))
    if r: g["as"], g["hs"], g["ot"] = r["as"], r["hs"], r["ot"]
teams = {g[k] for g in SLATE + NEXT for k in ("a", "h")}
# + teams that played in the last 2 days: their players' last games must stay in the data so yesterday's tracked picks
#   (graded after the late games end, when the slate has already moved to the next day) and My Bets can be graded
RECENT = [g for k in (1, 2) for g in slate_for((today - dt.timedelta(days=k)).isoformat())]
teams |= {g[k] for g in RECENT for k in ("a", "h")}
teams4 = teams | {g[k] for g in LATER for k in ("a", "h")}  # goalies for the next 3 days too

# ---------- full names + positions from current rosters (teams playing today/tomorrow) ----------
ROSTER = {}
for t in sorted(teams4):
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
                        "sf": round(x.get("shotsForPerGame") or 0, 1), "sa": round(x.get("shotsAgainstPerGame") or 0, 1),
                        "fo": round((x.get("faceoffWinPct") or 0) * 100, 1) if x.get("faceoffWinPct") is not None else None})
except Exception as e:
    log("team summary failed", e)
# league ranks (1 = best) for the comparison table
def rank(key, high_good=True):
    v = [(a, t[key]) for a, t in TEAM.items() if t.get(key) is not None]
    v.sort(key=lambda z: -z[1] if high_good else z[1])
    for i, (a, _) in enumerate(v): TEAM[a][key + "R"] = i + 1
for k, hg in (("gf", True), ("ga", False), ("pp", True), ("pk", True), ("sf", True), ("sa", False), ("fo", True)): rank(k, hg)

# ---------- closing lines of finished games (ESPN scoreboard odds) -> puck line (ATS) + over/under records ----------
C.setdefault("glines", {}); C.setdefault("gl_days", [])
def num(x):
    try: return float(x)
    except Exception: return None
def espn_odds(c):
    o = (c.get("odds") or [None])[0]
    if not o: return None
    ps, tt, ml = o.get("pointSpread") or {}, o.get("total") or {}, o.get("moneyline") or {}
    cl = lambda side, k: num((((side or {}).get("close") or {}).get(k)))
    hs = cl(ps.get("home"), "line")
    tot = num(o.get("overUnder")) if o.get("overUnder") is not None else cl(tt.get("over"), "line")
    if hs is None:
        dd = (o.get("details") or "").split()
        if len(dd) == 2 and num(dd[1]) is not None:
            home = [x for x in c["competitors"] if x.get("homeAway") == "home"][0]
            hs = num(dd[1]) if home["team"].get("abbreviation") == dd[0] else -num(dd[1])
    if hs is not None and abs(hs) != 1.5: hs = 1.5 if hs > 0 else -1.5 if hs < 0 else None   # NHL puck line is always ±1.5
    return [hs, tot, cl(ml.get("away"), "odds"), cl(ml.get("home"), "odds")]
byn0 = {}
try:
    st0 = get("https://api-web.nhle.com/v1/standings/now")
    for x in st0.get("standings") or []: byn0[norm(dflt(x.get("teamName")))] = dflt(x.get("teamAbbrev"))
except Exception as e: log("standings (names) failed", e)
DBG = []
if not C["glines"]: C["gl_days"] = []   # earlier runs found no lines: rescan
done_days = set(C["gl_days"]); gdays = sorted({g["d"] for g in C["games"].values()}); nl = 0
for day in gdays:
    if day in done_days or day >= TODAY: continue
    try:
        req = urllib.request.Request("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=" + day.replace("-", ""), headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r: sb = json.load(r)
        time.sleep(0.15)
    except Exception as e:
        log("ESPN scoreboard failed", day, e); continue
    ok, got = True, 0
    for e in sb.get("events") or []:
        c = (e.get("competitions") or [{}])[0]; tm = {x.get("homeAway"): x for x in c.get("competitors") or []}
        if "home" not in tm or "away" not in tm: continue
        if not ((c.get("status") or {}).get("type") or {}).get("completed"): ok = False; continue
        a, h = byn0.get(norm(tm["away"]["team"].get("displayName"))), byn0.get(norm(tm["home"]["team"].get("displayName")))
        if not (a and h): log("ESPN team not matched", tm["away"]["team"].get("displayName"), tm["home"]["team"].get("displayName")); continue
        o = espn_odds(c)
        if not o or (o[0] is None and o[1] is None):
            # finished games often drop the odds from the scoreboard: the game summary keeps them (pickcenter)
            try:
                req = urllib.request.Request("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=" + str(e.get("id")), headers=UA)
                with urllib.request.urlopen(req, timeout=30) as r: sm = json.load(r)
                time.sleep(0.15)
                pc = sm.get("pickcenter") or []
                if not DBG and pc: log("ESPN pickcenter keys:", sorted(pc[0].keys())[:30]); DBG.append(1)
                o = espn_odds({"odds": pc[:1], "competitors": c.get("competitors")}) if pc else None
            except Exception as ex:
                log("ESPN summary failed", e.get("id"), ex); o = None
        if o and (o[0] is not None or o[1] is not None): C["glines"][f"{day}|{a}|{h}"] = o; nl += 1; got += 1
    if ok and got: C["gl_days"].append(day)
log(f"NHL closing lines: {nl} new games, {len(C['glines'])} total")
with open(CACHE, "w") as f: json.dump(C, f, separators=(",", ":"), ensure_ascii=False)

# ---------- injuries (ESPN public injury feed; the NHL API has none) ----------
INJ = {}
try:
    req = urllib.request.Request("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/injuries", headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r: ij = json.load(r)
    byn = {norm(v["n"]): k for k, v in TEAM.items()}
    def mday(s):
        try: return dt.date.fromisoformat(str(s)[:10]).strftime("%b %-d")
        except Exception: return ""
    for t in ij.get("injuries") or []:
        a = byn.get(norm(t.get("displayName")))
        if not a: log("NHL injuries: team not matched", t.get("displayName")); continue
        rows = []
        for i in t.get("injuries") or []:
            at = i.get("athlete") or {}; det = i.get("details") or {}
            inj = (det.get("type") or "").strip() or "Undisclosed"
            if det.get("detail") and det["detail"].lower() not in inj.lower(): inj += " " + det["detail"].lower()
            # [name, pos, status, injury, est. return]
            rows.append([at.get("displayName", ""), ((at.get("position") or {}).get("abbreviation")) or "", i.get("status", ""), inj, mday(det.get("returnDate"))])
        if rows: INJ[a] = rows
    log(f"NHL injuries: {sum(len(v) for v in INJ.values())} players on {len(INJ)} teams")
except Exception as e:
    log("NHL injuries failed (kept none):", e)

# ---------- power-play time on ice per game (NHL stats REST "timeonice" report) -> PP unit ----------
PPT = {}
try:
    y = int(TODAY[:4]) if int(TODAY[5:7]) >= 9 else int(TODAY[:4]) - 1
    tr = get(f"https://api.nhle.com/stats/rest/en/skater/timeonice?limit=-1&cayenneExp=seasonId={y}{y + 1}%20and%20gameTypeId=2")
    rows_ = tr.get("data") or []
    if rows_:
        ks = sorted(rows_[0].keys()); kp = next((k for k in ks if k.lower() in ("pptimeonicepergame", "pptimeonicepergamepergame")), None) or next((k for k in ks if k.lower().startswith("pptimeonice") and "game" in k.lower()), None)
        log("NHL timeonice keys:", [k for k in ks if "pp" in k.lower() or "game" in k.lower()][:12], "->", kp)
        if kp:
            for r in rows_:
                v = r.get(kp)
                if isinstance(v, str) and ":" in v: v = secs(v)
                if v is not None and r.get("playerId") is not None: PPT[str(r["playerId"])] = round(float(v))
except Exception as e:
    log("NHL PP time failed:", e)

# ---------- per-player logs from the cached box scores ----------
games = sorted(C["games"].items(), key=lambda kv: (kv[1]["d"], kv[0]))
RES = [[g["d"], g["a"], g["as"], g["h"], g["hs"], g["ot"], g.get("asog"), g.get("hsog")] + (C["glines"].get(f"{g['d']}|{g['a']}|{g['h']}") or [None, None])[:2] for _, g in games]
# ---------- FOR / AGAINST per game from our box scores + ranks (1 = best: most FOR, fewest AGAINST) ----------
FA_K = ["g", "sog", "ppg", "sh", "blk", "hit", "pim"]
acc = {}
for _, g in games:
    sides = {g["a"]: {"g": g["as"] or 0, "sog": g.get("asog") or 0}, g["h"]: {"g": g["hs"] or 0, "sog": g.get("hsog") or 0}}
    for t in sides:
        P_ = [r for r in g["p"] if r[1] == t]
        sides[t].update(ppg=sum(r[10] for r in P_), blk=sum(r[6] for r in P_), hit=sum(r[7] for r in P_), pim=sum(r[8] for r in P_))
    for t, o in ((g["a"], g["h"]), (g["h"], g["a"])):
        A_ = acc.setdefault(t, {"n": 0, **{k: [0, 0] for k in FA_K}}); A_["n"] += 1
        for k in ("g", "sog", "ppg", "blk", "hit", "pim"): A_[k][0] += sides[t][k]; A_[k][1] += sides[o][k]
for t, A_ in acc.items():
    if t not in TEAM or not A_["n"]: continue
    n = A_["n"]; fa = {k: [round(A_[k][0] / n, 2), round(A_[k][1] / n, 2)] for k in ("g", "sog", "ppg", "blk", "hit", "pim")}
    fa["sh"] = [round(A_["g"][0] / A_["sog"][0] * 100, 1) if A_["sog"][0] else None, round(A_["g"][1] / A_["sog"][1] * 100, 1) if A_["sog"][1] else None]
    fa["pp"] = [TEAM[t].get("pp"), round(100 - TEAM[t]["pk"], 1) if TEAM[t].get("pk") is not None else None]
    fa["fo"] = [TEAM[t].get("fo"), round(100 - TEAM[t]["fo"], 1) if TEAM[t].get("fo") is not None else None]
    TEAM[t]["fa"] = fa
# ---- from the play-by-play pass: shot attempts (SAT / CF%), high-danger attempts, period splits, scoring first ----
X = {}
for _, g in games:
    tmx = g.get("tm")
    if not tmx: continue
    for t, o in ((g["a"], g["h"]), (g["h"], g["a"])):
        if t not in tmx or o not in tmx: continue
        me, op = tmx[t], tmx[o]; gf = g["as"] if t == g["a"] else g["hs"]; ga = g["hs"] if t == g["a"] else g["as"]
        Z = X.setdefault(t, {"n": 0, "sat": [0, 0], "hd": [0, 0], "p": [[0, 0], [0, 0], [0, 0]], "p1o": [0, 0], "first": [0, 0, 0], "firstA": [0, 0, 0], "sf": 0})
        Z["n"] += 1; Z["sat"][0] += me[0]; Z["sat"][1] += op[0]; Z["hd"][0] += me[1]; Z["hd"][1] += op[1]
        for i in range(3): Z["p"][i][0] += me[2 + i]; Z["p"][i][1] += op[2 + i]
        Z["p1o"][0 if me[2] + op[2] > 1.5 else 1] += 1          # 1st period over/under 1.5
        res = 0 if gf > ga else (2 if g["ot"] else 1)            # 0 win, 1 reg loss, 2 OT/SO loss
        if me[5]: Z["sf"] += 1; Z["first"][res] += 1
        elif op[5]: Z["firstA"][res] += 1
        a2 = (me[2] + me[3]) - (op[2] + op[3]); Z.setdefault("a2", {"lead": [0, 0, 0], "tied": [0, 0, 0], "trail": [0, 0, 0]})["lead" if a2 > 0 else "tied" if a2 == 0 else "trail"][res] += 1
        x4 = g.get("x4") or {}
        if t in x4 and o in x4:
            Z.setdefault("x4n", 0); Z["x4n"] += 1; X4 = Z.setdefault("x4", [0, 0, 0, 0, 0])   # ENG for, ENG against, pen taken, pen drawn, games with an ENG
            X4[0] += x4[t][0]; X4[1] += x4[o][0]; X4[2] += x4[t][1]; X4[3] += x4[t][2]; X4[4] += 1 if x4[t][0] + x4[o][0] else 0
for t, Z in X.items():
    if t not in TEAM or not Z["n"]: continue
    n = Z["n"]; fa = TEAM[t].setdefault("fa", {})
    fa["sat"] = [round(Z["sat"][0] / n, 1), round(Z["sat"][1] / n, 1)]
    cf = Z["sat"][0] / (Z["sat"][0] + Z["sat"][1]) * 100 if Z["sat"][0] + Z["sat"][1] else None
    fa["cf"] = [round(cf, 1) if cf is not None else None, round(100 - cf, 1) if cf is not None else None]
    fa["hd"] = [round(Z["hd"][0] / n, 1), round(Z["hd"][1] / n, 1)]
    TEAM[t]["per"] = [[round(Z["p"][i][0] / n, 2), round(Z["p"][i][1] / n, 2)] for i in range(3)]   # goals for/against per game, P1..P3
    TEAM[t]["p1o"] = Z["p1o"]; TEAM[t]["sfp"] = round(Z["sf"] / n * 100); TEAM[t]["recF"] = Z["first"]; TEAM[t]["recFA"] = Z["firstA"]; TEAM[t]["pbpn"] = n
    if Z.get("a2"): TEAM[t]["a2"] = Z["a2"]
    if Z.get("x4n"):
        m_ = Z["x4n"]; X4 = Z["x4"]; TEAM[t]["eng"] = [round(X4[0] / m_, 2), round(X4[1] / m_, 2), X4[0], X4[1], round(X4[4] / m_ * 100)]
        TEAM[t]["pen"] = [round(X4[2] / m_, 2), round(X4[3] / m_, 2)]
# ---- close games: OT/SO rate, one-goal games, regulation record ----
for t in TEAM:
    R_ = [r for _, r in games if t in (r["a"], r["h"])]
    if not R_: continue
    ot = [r for r in R_ if r["ot"]]; one = [r for r in R_ if abs((r["as"] or 0) - (r["hs"] or 0)) == 1]
    won = lambda r: (r["as"] > r["hs"]) == (t == r["a"])
    reg = [r for r in R_ if not r["ot"]]
    TEAM[t]["otp"] = round(len(ot) / len(R_) * 100); TEAM[t]["otr"] = [sum(1 for r in ot if won(r)), sum(1 for r in ot if not won(r))]
    TEAM[t]["one"] = [sum(1 for r in one if won(r)), sum(1 for r in one if not won(r))]
    TEAM[t]["reg"] = [sum(1 for r in reg if won(r)), sum(1 for r in reg if not won(r))]
# ---- opponent vs position: what each team allows per opposing forward / defenseman game ----
VP_K = {"g": 2, "a": 3, "pts": 4, "sog": 5, "blk": 6, "hit": 7}
vp = {}
for _, g in games:
    for r in g["p"]:
        pos = "D" if (C["pos"].get(r[0]) or "") == "D" else "F"
        opp = g["h"] if r[1] == g["a"] else g["a"]
        Z = vp.setdefault(opp, {}).setdefault(pos, {"n": 0, **{k: 0 for k in VP_K}}); Z["n"] += 1
        for k, i in VP_K.items(): Z[k] += r[i]
for t, P_ in vp.items():
    if t in TEAM: TEAM[t]["vp"] = {pos: {k: round(Z[k] / Z["n"], 3) for k in VP_K} for pos, Z in P_.items() if Z["n"]}
for pos in ("F", "D"):
    for k in VP_K:
        v = sorted([(t, TEAM[t]["vp"][pos][k]) for t in TEAM if TEAM[t].get("vp", {}).get(pos)], key=lambda z: -z[1])
        for i, (t, _) in enumerate(v): TEAM[t].setdefault("vpr", {}).setdefault(pos, {})[k] = i + 1   # 1 = allows the most (best for overs)
# ranks: FOR — more is better (fewer for PIM); AGAINST — less is better (more for PIM = opponent penalties drawn)
for k in ["g", "sog", "ppg", "sh", "blk", "hit", "pim", "pp", "fo", "sat", "cf", "hd"]:
    for side in (0, 1):
        v = [(t, TEAM[t]["fa"][k][side]) for t in TEAM if TEAM[t].get("fa") and TEAM[t]["fa"].get(k) and TEAM[t]["fa"][k][side] is not None]
        hi = (side == 0) if k != "pim" else (side == 1)
        v.sort(key=lambda z: -z[1] if hi else z[1])
        for i, (t, _) in enumerate(v): TEAM[t].setdefault("far", {}).setdefault(k, [None, None])[side] = i + 1
# puck line (ATS) and over/under records, overall + home / road: ats [w, l], ou [over, under, push]
for a in TEAM:
    for k in ("ats", "atsH", "atsR"): TEAM[a][k] = [0, 0]
    for k in ("ou", "ouH", "ouR"): TEAM[a][k] = [0, 0, 0]
for r in RES:
    d_, A_, as_, H_, hs_, ot_, _, _, sp, tot = r
    if as_ is None or hs_ is None: continue
    for t, home in ((A_, False), (H_, True)):
        if t not in TEAM: continue
        if sp is not None:
            m = (hs_ - as_) + sp if home else (as_ - hs_) - sp
            i = 0 if m > 0 else 1
            TEAM[t]["ats"][i] += 1; TEAM[t]["atsH" if home else "atsR"][i] += 1
        if tot is not None:
            g_ = as_ + hs_; i = 0 if g_ > tot else 1 if g_ < tot else 2
            TEAM[t]["ou"][i] += 1; TEAM[t]["ouH" if home else "ouR"][i] += 1
SK, GO, SKP, GOP = {}, {}, {}, {}
for gid, g in PREV:   # last season: same row layout, faceoffs / attempts unknown (None), last field 1 = last season
    for r in g["p"]:
        pid, tm = r[0], r[1]; opp = g["h"] if tm == g["a"] else g["a"]
        SKP.setdefault(pid, []).append([g["d"], opp, "A" if tm == g["a"] else "H"] + r[2:] + [None, None, None, 1])
    st_ = {}
    for r in g["gl"]:
        if r[5] > st_.get(r[1], (0, None))[0]: st_[r[1]] = (r[5], r[0])
    for r in g["gl"]:
        pid, tm = r[0], r[1]; opp = g["h"] if tm == g["a"] else g["a"]; won = (g["as"] > g["hs"]) == (tm == g["a"])
        GOP.setdefault(pid, []).append([g["d"], opp, "A" if tm == g["a"] else "H", r[2], r[3], r[4], r[5], 1 if st_.get(tm, (0, None))[1] == pid else 0, 1 if won else 0, 1])
for gid, g in games:
    for r in g["p"]:
        pid, tm = r[0], r[1]; opp = g["h"] if tm == g["a"] else g["a"]; ha = "A" if tm == g["a"] else "H"
        # [date, opp, H/A, goals, assists, points, sog, blocked, hits, pim, toiSec, ppg, +/-, faceoffs won, faceoffs lost]
        fo = (g.get("fo") or {}).get(pid) or ([None, None] if "fo" not in g else [0, 0])
        sa_ = (g.get("sat") or {}).get(pid, 0) if "sat" in g else None
        SK.setdefault(pid, []).append([g["d"], opp, ha] + r[2:] + fo + [sa_])
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
    fw = sum(x[13] or 0 for x in L); fl = sum(x[14] or 0 for x in L)
    zs = [[0, 0, 0] for _ in range(4)]
    for _, g in games:
        for zi, zz in enumerate(((g.get("sz") or {}).get(pid)) or []):
            for j in range(3): zs[zi][j] += zz[j]
    LL = [x + [0] for x in L]   # last field 0 = this season
    P[nm] = {"id": int(pid), "tm": tm, "pos": C["pos"].get(pid) or "", "gp": n,
             "s": [n, tot[0], tot[1], tot[2], tot[3], tot[4], tot[5], tot[8], round(tot[7] / n / 60, 1), fw, fl],  # gp,g,a,pts,sog,blk,hits,ppg,toi min,fow,fol
             "g": (SKP.get(pid, []) + LL)[-30:], "ppt": PPT.get(pid), "sz": zs if any(z[0] for z in zs) else None}
    pp3 = [0, 0, 0]; npp = 0
    for _, g in games:
        if "ppp" not in g: continue
        if any(r[0] == pid for r in g["p"]): npp += 1
        for j, v in enumerate((g["ppp"].get(pid)) or [0, 0, 0]): pp3[j] += v
    if npp: P[nm]["ppp"] = pp3 + [npp]   # [PP goals, PP assists, SH points, games covered]
# PP unit: rank by PP time per game within each team (top 5 = PP1, next 5 = PP2)
by_t = {}
for nm, v in P.items():
    if v.get("ppt"): by_t.setdefault(v["tm"], []).append((v["ppt"], nm))
for t, L_ in by_t.items():
    for i, (_, nm) in enumerate(sorted(L_, reverse=True)): P[nm]["pu"] = 1 if i < 5 else 2 if i < 10 else 0
for pid, L in GO.items():
    tm = cur_team(pid, L)
    if tm not in teams4: continue
    nm = C["names"].get(pid) or pid; st = [x for x in L if x[7]]
    sa, sv, ga, toi = (sum(x[i] for x in L) for i in (3, 4, 5, 6))
    G[nm] = {"id": int(pid), "tm": tm, "gp": len(L), "gs": len(st), "w": sum(1 for x in st if x[8]),
             "svp": round(sv / sa * 100, 1) if sa else None, "gaa": round(ga * 3600 / toi, 2) if toi else None, "g": (GOP.get(pid, []) + [x + [0] for x in L])[-25:]}

# ---------- props + game lines from the PropLine feed (refreshed live on the public site too) ----------
PROPS, LINES = [], {}
try:
    with open(LIVE) as f: lo = (json.load(f).get("nhl") or {})
    idx = {norm(n): n for n in list(P) + list(G)}
    full = {v["n"]: k for k, v in TEAM.items()}
    evday = {str(e["id"]): e.get("date") for e in lo.get("events") or []}
    for e in lo.get("events") or []:
        a, h = full.get(e.get("away")), full.get(e.get("home"))
        if a and h: LINES[f"{a}@{h}|{e.get('date')}"] = {k: e[k] for k in ("ml", "tot", "pl", "open", "p1") if k in e}
    miss = set()
    for r in lo.get("props") or []:
        if evday.get(str(r[13])) not in (TODAY, tom): continue
        nm = idx.get(norm(r[0]))
        if not nm: miss.add(r[0]); continue
        PROPS.append([nm] + r[1:6])
    if miss: log(f"NHL props: {len(miss)} names not matched, e.g. {sorted(miss)[:6]}")
except Exception as e:
    log("NHL props: feed not read:", e)
for g in SLATE + NEXT + LATER:
    L = LINES.get(f"{g['a']}@{g['h']}|{g['d']}")
    if L: g.update(L)

# ======================= our game model (same numbers the site shows) =======================
import math
def pois(l, k): return math.exp(-l) * l ** k / math.factorial(k)
LG_GF = sum(t["gf"] for t in TEAM.values() if t.get("gf") is not None) / max(1, sum(1 for t in TEAM.values() if t.get("gf") is not None))
def lg_rate(f):
    v = [f(t) for t in TEAM.values()]; v = [x for x in v if x is not None]
    return sum(v) / len(v) if v else None
LHD = lg_rate(lambda t: (t.get("fa") or {}).get("hd", [None])[0]); LSF = lg_rate(lambda t: t.get("sf")); LPP = lg_rate(lambda t: t.get("pp")); LPK = lg_rate(lambda t: t.get("pk"))
_sa = _sv = 0
for gl_ in GO.values():
    for x in gl_:
        if x[7]: _sa += x[3]; _sv += x[4]
LSV = _sv / _sa if _sa else .9
def played_on(t, d): return any(r[0] == d and t in (r[1], r[3]) for r in RES) or any(g["d"] == d and t in (g["a"], g["h"]) for g in SLATE + NEXT + LATER)
def b2b(t, d): return played_on(t, (dt.date.fromisoformat(d) - dt.timedelta(days=1)).isoformat())
def out_inj(nm):
    for L_ in INJ.values():
        for r in L_:
            if norm(r[0]) == norm(nm) and re.search(r"out|reserve|\bir\b|suspen", r[2], re.I): return True
    return False
# ---- ESPN's listed starting goalies (scoreboard "probables"), today + tomorrow ----
EG = {}   # (day, team) -> goalie name as ESPN lists it
for day in sorted({g["d"] for g in SLATE + NEXT}):
    try:
        req = urllib.request.Request("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=" + day.replace("-", ""), headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r: sb = json.load(r)
        for e in sb.get("events") or []:
            for x in ((e.get("competitions") or [{}])[0].get("competitors") or []):
                ab = byn0.get(norm((x.get("team") or {}).get("displayName")))
                pr = next((q for q in x.get("probables") or [] if "goalie" in (q.get("name") or "").lower()), None)
                nm = ((pr or {}).get("athlete") or {}).get("displayName")
                if ab and nm: EG[(day, ab)] = nm
    except Exception as e: log("ESPN probable goalies failed", day, e)
log(f"ESPN listed starters: {len(EG)} teams")
def espn_goalie(t, d):
    nm = EG.get((d, t))
    if not nm: return None
    return next((k for k in G if norm(k) == norm(nm) and G[k]["tm"] == t), None) or next((k for k in G if norm(k) == norm(nm)), None)
for g in SLATE + NEXT:
    eg = [EG.get((g["d"], g["a"])), EG.get((g["d"], g["h"]))]
    if any(eg): g["eg"] = eg
def probable(t, d):
    L_ = [(nm, g_) for nm, g_ in G.items() if g_["tm"] == t and not out_inj(nm)]
    if not L_: return None
    eg = espn_goalie(t, d)
    if eg and not out_inj(eg): return eg, "ESPN lists him as the starter (teams confirm closer to puck drop)"
    lined = next((nm for nm, _ in L_ if any(r[0] == nm and r[1] == "hsaves" for r in PROPS)), None)
    st = sorted([(x[0], nm) for nm, g_ in L_ for x in g_["g"] if x[7] and x[9] != 1], reverse=True)[:5]
    cnt = {}
    for _, nm in st: cnt[nm] = cnt.get(nm, 0) + 1
    if lined: return lined, f"books posted a saves line for him · started {cnt.get(lined, 0)} of the team's last {len(st)}"
    best = sorted(L_, key=lambda z: (-cnt.get(z[0], 0), -(max([x[0] for x in z[1]["g"] if x[7] and x[9] != 1] or [""]) > "")))[0][0]
    if b2b(t, d):
        y = (dt.date.fromisoformat(d) - dt.timedelta(days=1)).isoformat()
        ys = next((nm for nm, g_ in L_ if any(x[0] == y and x[7] for x in g_["g"])), None)
        alt = next((nm for nm, g_ in L_ if nm != ys and g_["gs"] >= 2), None)
        if ys == best and alt: return alt, f"{best} started last night — teams usually start the other goalie on a back-to-back"
    last = st[0][1] if st else None
    return best, f"started {cnt.get(best, 0)} of the team's last {len(st)}" + (", including the last game" if last == best else (f" — {last} started the last game" if last else ""))
def project(g):
    A, H = TEAM.get(g["a"]), TEAM.get(g["h"])
    if not A or not H or A.get("gf") is None or H.get("gf") is None: return None
    lg = LG_GF or 3.0
    k = lambda T: min(.75, (T.get("gp") or 0) / 40 + .3); rg = lambda r, T: 1 + (r - 1) * k(T)
    hd = lambda T, i: ((T.get("fa") or {}).get("hd") or [None, None])[i]
    att = lambda T: rg(.5 * (T["gf"] / lg) + .3 * (hd(T, 0) / LHD if hd(T, 0) and LHD else T["gf"] / lg) + .2 * (T["sf"] / LSF if T.get("sf") and LSF else 1), T)
    dfn = lambda T: rg(.5 * (T["ga"] / lg) + .3 * (hd(T, 1) / LHD if hd(T, 1) and LHD else T["ga"] / lg) + .2 * (T["sa"] / LSF if T.get("sa") and LSF else 1), T)
    st_ = lambda O, D: 1 + .15 * ((O["pp"] / LPP) * ((100 - D["pk"]) / (100 - LPK)) - 1) if O.get("pp") and D.get("pk") and LPP and LPK else 1
    def gk(t):
        p_ = probable(t, g["d"])
        if not p_: return 1, None, None
        G_ = G[p_[0]]
        if not G_.get("svp") or G_["gs"] < 3: return 1, p_[0], p_[1]
        w = min(1, G_["gs"] / 20) * .3
        return 1 + ((1 - G_["svp"] / 100) / (1 - LSV) - 1) * w, p_[0], p_[1]
    gH, nH, wH = gk(g["h"]); gA, nA, wA = gk(g["a"])
    la = lg * att(A) * dfn(H) * st_(A, H) * .985 * gH; lh = lg * att(H) * dfn(A) * st_(H, A) * 1.015 * gA
    if b2b(g["a"], g["d"]): la *= .98; lh *= 1.02
    if b2b(g["h"], g["d"]): lh *= .98; la *= 1.02
    p1s = lambda T: max(.22, min(.42, T["per"][0][0] / max(.1, sum(x[0] for x in T["per"])))) if T.get("per") else .31
    f1 = (p1s(A) + p1s(H)) / 2
    return {"la": round(la, 3), "lh": round(lh, 3), "l1a": round(la * f1, 3), "l1h": round(lh * f1, 3), "ga": nA, "gh": nH, "wa": wA, "wh": wH,
            "fa": [round(att(A) * dfn(H), 3), round(att(H) * dfn(A), 3)]}
def probs(la, lh, line=None, l1=None):
    hw = dr = h2 = a2 = ov = 0.0
    for i in range(14):
        for j in range(14):
            p_ = pois(la, i) * pois(lh, j)
            if j > i: hw += p_
            elif i == j: dr += p_
            if j - i >= 2: h2 += p_
            if i - j >= 2: a2 += p_
            if line is not None and i + j > line: ov += p_
    return {"hwin": hw + dr * (lh / (la + lh)), "h2": h2, "a2": a2, "over": ov}
for g in SLATE + NEXT + LATER:
    pr_ = project(g)
    if pr_: g["proj"] = pr_
# ---- save each game's last pre-game numbers, grade them once final -> model scorecard ----
C.setdefault("pred", {})
for g in SLATE + NEXT:
    if g.get("proj") and g.get("st") in ("FUT", "PRE") and str(g["id"]) not in C["games"]:
        C["pred"][str(g["id"])] = {"d": g["d"], "a": g["a"], "h": g["h"], **{k: g["proj"][k] for k in ("la", "lh", "l1a", "l1h")},
                                   **{k: g[k] for k in ("ml", "tot", "pl") if k in g}, "p1tot": (g.get("p1") or {}).get("tot")}
def novig(a, b):
    ia = (-a / (-a + 100) if a < 0 else 100 / (a + 100)) if a is not None else None; ib = (-b / (-b + 100) if b < 0 else 100 / (b + 100)) if b is not None else None
    return (ia / (ia + ib), ib / (ia + ib)) if ia and ib else None
def pay(o): return o / 100 if o > 0 else 100 / -o
MODEL = {"n": 0, "win": [0, 0], "tot": [0, 0], "edge": {}, "recent": []}
for gid, pd_ in sorted(C["pred"].items(), key=lambda kv: kv[1]["d"]):
    r = C["games"].get(gid)
    if not r or r.get("as") is None: continue
    A_, H_ = r["as"], r["hs"]; MODEL["n"] += 1
    pr_ = probs(pd_["la"], pd_["lh"], (pd_.get("tot") or [None])[0])
    pick_h = pr_["hwin"] >= .5; won_h = H_ > A_
    MODEL["win"][0 if pick_h == won_h else 1] += 1
    res = {"d": pd_["d"], "a": pd_["a"], "h": pd_["h"], "as": A_, "hs": H_, "pick": pd_["h"] if pick_h else pd_["a"], "p": round(max(pr_["hwin"], 1 - pr_["hwin"]), 3), "ok": pick_h == won_h, "bets": []}
    if pd_.get("tot"):
        L_ = pd_["tot"][0]; tg = A_ + H_
        if tg != L_: MODEL["tot"][0 if (pr_["over"] >= .5) == (tg > L_) else 1] += 1
    bets = []
    if pd_.get("ml"):
        nv = novig(pd_["ml"][0], pd_["ml"][1])
        if nv: bets += [("Moneyline", pd_["h"], pd_["ml"][1], pr_["hwin"] - nv[1], won_h), ("Moneyline", pd_["a"], pd_["ml"][0], (1 - pr_["hwin"]) - nv[0], not won_h)]
    if pd_.get("pl"):
        hp = pd_["pl"][0]; nv = novig(pd_["pl"][2], pd_["pl"][1])
        if nv:
            hc = pr_["h2"] if hp < 0 else 1 - pr_["a2"]; cov = (H_ - A_) + hp > 0
            bets += [("Puck line", f"{pd_['h']} {hp:+g}", pd_["pl"][2], hc - nv[0], cov), ("Puck line", f"{pd_['a']} {-hp:+g}", pd_["pl"][1], (1 - hc) - nv[1], not cov)]
    if pd_.get("tot"):
        L_ = pd_["tot"][0]; nv = novig(pd_["tot"][1], pd_["tot"][2]); tg = A_ + H_
        if nv and tg != L_: bets += [("Total", f"Over {L_:g}", pd_["tot"][1], pr_["over"] - nv[0], tg > L_), ("Total", f"Under {L_:g}", pd_["tot"][2], (1 - pr_["over"]) - nv[1], tg < L_)]
    if pd_.get("p1tot") and r.get("tm"):
        L_ = pd_["p1tot"][0]; nv = novig(pd_["p1tot"][1], pd_["p1tot"][2]); g1 = r["tm"][pd_["a"]][2] + r["tm"][pd_["h"]][2]
        o1 = probs(pd_["l1a"], pd_["l1h"], L_)["over"]
        if nv and g1 != L_: bets += [("1st period total", f"Over {L_:g}", pd_["p1tot"][1], o1 - nv[0], g1 > L_), ("1st period total", f"Under {L_:g}", pd_["p1tot"][2], (1 - o1) - nv[1], g1 < L_)]
    for mk, pick, odds, edge, won in bets:
        if edge < .04 or edge > .2 or odds is None: continue
        E = MODEL["edge"].setdefault(mk, [0, 0, 0.0]); E[0 if won else 1] += 1; E[2] += pay(odds) if won else -1
        res["bets"].append([mk, pick, odds, round(edge, 3), 1 if won else 0])
    MODEL["recent"].append(res)
MODEL["recent"] = MODEL["recent"][-12:][::-1]
for E in MODEL["edge"].values(): E[2] = round(E[2], 2)

# ---------- yesterday's props graded (closing lines saved by the odds job) ----------
PRES, PRES_D = [], None
try:
    days_ = sorted({g["d"] for _, g in games if g["d"] < TODAY})
    for dd in reversed(days_[-3:]):
        fn = os.path.join(ROOT, "data", "close", f"{dd}.json")
        if not os.path.exists(fn): continue
        with open(fn) as f: cl = json.load(f)
        nm2pid = {norm(v): k for k, v in C["names"].items()}
        rows_ = {}
        for _, g in games:
            if g["d"] != dd: continue
            for r in g["p"]: rows_[r[0]] = ("s", r)
            for r in g["gl"]: rows_[r[0]] = ("g", r)
        idx = {"hpts": 4, "hgoals": 2, "hast": 3, "hsog": 5, "hblk": 6, "hhit": 7}
        for key, v in cl.items():
            sp_, nm, mk = key.split("|", 2)
            if sp_ != "nhl": continue
            pid = nm2pid.get(norm(nm)); hit = rows_.get(pid)
            if not hit: continue
            kind, r = hit
            if mk == "hsaves": val = r[3] if kind == "g" else None
            elif mk == "hanyG": val = r[2] if kind == "s" else None
            elif kind == "s" and mk in idx: val = r[idx[mk]]
            else: val = None
            if val is None: continue
            line = 0.5 if mk == "hanyG" else v[0]
            res_ = "push" if val == line else ("over" if val > line else "under")
            PRES.append([C["names"].get(pid, nm), r[1], mk, line, v[1], v[2], v[3], val, res_])
        if PRES: PRES_D = dd; break
except Exception as e:
    log("NHL prop results failed:", e)
RECENT = []
LAST_D = games[-1][1]["d"] if games else None
for gid, g in games[-40:]:
    if g["d"] != LAST_D and g["d"] != PRES_D: continue
    top = sorted(g["p"], key=lambda r: (-(r[4]), -r[2], -r[5]))[:3]
    gk_ = sorted(g["gl"], key=lambda r: -r[5])
    RECENT.append({"id": int(gid), "d": g["d"], "a": g["a"], "h": g["h"], "as": g["as"], "hs": g["hs"], "ot": g["ot"], "asog": g.get("asog"), "hsog": g.get("hsog"),
                   "stars": [[C["names"].get(r[0], r[0]), r[1], r[2], r[3], r[5]] for r in top],
                   "gk": [[C["names"].get(r[0], r[0]), r[1], r[3], r[2]] for r in gk_[:2]]})
with open(CACHE, "w") as f: json.dump(C, f, separators=(",", ":"), ensure_ascii=False)

now = dt.datetime.now(ET)
J = lambda o: json.dumps(o, separators=(",", ":"), ensure_ascii=False)
print(f"/* NHL data — official NHL API (api-web.nhle.com) + PropLine sportsbook feed. Generated {now:%Y-%m-%d %H:%M} ET by tools/nhlfetch.py */")
print(f'var NHL_GEN="{now:%a %b %-d %-I:%M %p} ET";')
print(f'var NHL_DATE="{TODAY}",NHL_TOM="{tom}";')
print(f"var NHL_SLATE={J(SLATE)};")
print(f"var NHL_NEXT={J(NEXT)};")
print(f"var NHL_LATER={J(LATER)}; /* games 2 and 3 days out */")
print(f"var NHL_TEAM={J(TEAM)};")
print(f"var NHL_RES={J(RES)}; /* [date, away, aGoals, home, hGoals, 0 reg / 1 OT / 2 SO, aSOG, hSOG, home puck line (close), total (close)] */")
print(f"var NHL_P={J(P)}; /* skaters on teams playing today/tomorrow. g: [date, opp, H/A, G, A, PTS, SOG, BLK, HIT, PIM, TOIsec, PPG, +/-, FOW, FOL, shot attempts] */")
print(f"var NHL_G={J(G)}; /* goalies. g: [date, opp, H/A, SA, SV, GA, TOIsec, started, teamWon] */")
print(f"var NHL_INJ={J(INJ)}; /* ESPN injury report: team -> [name, pos, status, injury, est. return] */")
H2HP = {}
for g in SLATE + NEXT + LATER:
    k_ = "|".join(sorted([g["a"], g["h"]]))
    H2HP[k_] = [[x["d"], x["a"], x["as"], x["h"], x["hs"], x["ot"]] for _, x in PREV if {x["a"], x["h"]} == {g["a"], g["h"]}]
print(f"var NHL_H2HP={J(H2HP)}; /* last season meetings for upcoming matchups */")
# league shot-zone averages (attempts share + shooting % per zone)
LZ = [[0, 0, 0] for _ in range(4)]
for _, g in games:
    for zl in (g.get("sz") or {}).values():
        for zi, zz in enumerate(zl):
            for j in range(3): LZ[zi][j] += zz[j]
print(f"var NHL_LZ={J(LZ)}; /* league shot zones [unblocked attempts, SOG, goals]: slot, high slot, wide, long */")
print(f"var NHL_MODEL={J(MODEL)}; /* our estimate graded vs finals: win pick, total pick, edges >= 4% by market [W, L, units] */")
print(f"var NHL_PRES={J(PRES)},NHL_PRES_D={J(PRES_D)}; /* props of {PRES_D} graded at the closing line: [name, team, mk, line, over, under, book, result value, over/under/push] */")
print(f"var NHL_RECENT={J(RECENT)};")
print(f"var NHL_PROPS={J(PROPS)}; /* [name, market, line, over, under, book] */")
# faceoff matchups for players on today's / tomorrow's teams: name -> {opponent name: [won, lost]} (3+ draws)
FOM = {}
pid_nm = {str(v["id"]): k for k, v in P.items()}
for _, g in games:
    for key, n_ in (g.get("fom") or {}).items():
        w, l_ = key.split("|")
        for me, op, i in ((w, l_, 0), (l_, w, 1)):
            if me in pid_nm:
                on = C["names"].get(op) or op; FOM.setdefault(pid_nm[me], {}).setdefault(on, [0, 0])[i] += n_
FOM = {k: {o: v for o, v in d.items() if v[0] + v[1] >= 3} for k, d in FOM.items()}
print(f"var NHL_FOM={J({k: v for k, v in FOM.items() if v})}; /* faceoff results vs each opposing player this season */")
log(f"NHL data: {len(SLATE)} games today, {len(NEXT)} tomorrow, {len(TEAM)} teams, {len(P)} skaters, {len(G)} goalies, {len(PROPS)} props, {len(RES)} finals, {NREQ[0]} requests")
