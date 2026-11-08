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
# faceoffs won / lost per player (box scores only carry a win %; the play-by-play has every faceoff)
nfo = 0
for gid, rec in sorted(C["games"].items()):
    if "fo" in rec: continue
    if nfo >= 400: break  # spread a big backfill over runs
    try: pbp = get(f"https://api-web.nhle.com/v1/gamecenter/{gid}/play-by-play")
    except Exception as e: log("play-by-play failed", gid, e); continue
    fo = {}
    for pl in pbp.get("plays") or []:
        if pl.get("typeDescKey") != "faceoff": continue
        dd = pl.get("details") or {}
        w, l_ = dd.get("winningPlayerId"), dd.get("losingPlayerId")
        if w: fo.setdefault(str(w), [0, 0])[0] += 1
        if l_: fo.setdefault(str(l_), [0, 0])[1] += 1
    if fo: rec["fo"] = fo; nfo += 1
log(f"NHL: {new} new box scores, {nfo} faceoff logs, {len(C['games'])} cached, {NREQ[0]} requests so far")
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
done_days = set(C["gl_days"]); gdays = sorted({g["d"] for g in C["games"].values()}); nl = 0
for day in gdays:
    if day in done_days or day >= TODAY: continue
    try:
        req = urllib.request.Request("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=" + day.replace("-", ""), headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r: sb = json.load(r)
        time.sleep(0.15)
    except Exception as e:
        log("ESPN scoreboard failed", day, e); continue
    ok = True
    for e in sb.get("events") or []:
        c = (e.get("competitions") or [{}])[0]; tm = {x.get("homeAway"): x for x in c.get("competitors") or []}
        if "home" not in tm or "away" not in tm: continue
        if not ((c.get("status") or {}).get("type") or {}).get("completed"): ok = False; continue
        a, h = byn0.get(norm(tm["away"]["team"].get("displayName"))), byn0.get(norm(tm["home"]["team"].get("displayName")))
        o = espn_odds(c)
        if a and h and o and (o[0] is not None or o[1] is not None): C["glines"][f"{day}|{a}|{h}"] = o; nl += 1
    if ok: C["gl_days"].append(day)
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
# ranks: FOR — more is better (fewer for PIM); AGAINST — less is better (more for PIM = opponent penalties drawn)
for k in ["g", "sog", "ppg", "sh", "blk", "hit", "pim", "pp", "fo"]:
    for side in (0, 1):
        v = [(t, TEAM[t]["fa"][k][side]) for t in TEAM if TEAM[t].get("fa") and TEAM[t]["fa"][k][side] is not None]
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
SK, GO = {}, {}
for gid, g in games:
    for r in g["p"]:
        pid, tm = r[0], r[1]; opp = g["h"] if tm == g["a"] else g["a"]; ha = "A" if tm == g["a"] else "H"
        # [date, opp, H/A, goals, assists, points, sog, blocked, hits, pim, toiSec, ppg, +/-, faceoffs won, faceoffs lost]
        fo = (g.get("fo") or {}).get(pid) or ([None, None] if "fo" not in g else [0, 0])
        SK.setdefault(pid, []).append([g["d"], opp, ha] + r[2:] + fo)
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
    P[nm] = {"id": int(pid), "tm": tm, "pos": C["pos"].get(pid) or "", "gp": n,
             "s": [n, tot[0], tot[1], tot[2], tot[3], tot[4], tot[5], tot[8], round(tot[7] / n / 60, 1), fw, fl],  # gp,g,a,pts,sog,blk,hits,ppg,toi min,fow,fol
             "g": L[-25:]}
for pid, L in GO.items():
    tm = cur_team(pid, L)
    if tm not in teams4: continue
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
for g in SLATE + NEXT + LATER:
    L = LINES.get(f"{g['a']}@{g['h']}|{g['d']}")
    if L: g.update(L)

now = dt.datetime.now(ET)
J = lambda o: json.dumps(o, separators=(",", ":"), ensure_ascii=False)
print(f"/* NHL data — official NHL API (api-web.nhle.com) + PropLine sportsbook feed. Generated {now:%Y-%m-%d %H:%M} ET by tools/nhlfetch.py */")
print(f'const NHL_GEN="{now:%a %b %-d %-I:%M %p} ET";')
print(f'const NHL_DATE="{TODAY}",NHL_TOM="{tom}";')
print(f"const NHL_SLATE={J(SLATE)};")
print(f"const NHL_NEXT={J(NEXT)};")
print(f"const NHL_LATER={J(LATER)}; /* games 2 and 3 days out */")
print(f"const NHL_TEAM={J(TEAM)};")
print(f"const NHL_RES={J(RES)}; /* [date, away, aGoals, home, hGoals, 0 reg / 1 OT / 2 SO, aSOG, hSOG, home puck line (close), total (close)] */")
print(f"const NHL_P={J(P)}; /* skaters on teams playing today/tomorrow. g: [date, opp, H/A, G, A, PTS, SOG, BLK, HIT, PIM, TOIsec, PPG, +/-, FOW, FOL] */")
print(f"const NHL_G={J(G)}; /* goalies. g: [date, opp, H/A, SA, SV, GA, TOIsec, started, teamWon] */")
print(f"const NHL_INJ={J(INJ)}; /* ESPN injury report: team -> [name, pos, status, injury, est. return] */")
print(f"const NHL_PROPS={J(PROPS)}; /* [name, market, line, over, under, book] */")
log(f"NHL data: {len(SLATE)} games today, {len(NEXT)} tomorrow, {len(TEAM)} teams, {len(P)} skaters, {len(G)} goalies, {len(PROPS)} props, {len(RES)} finals, {NREQ[0]} requests")
