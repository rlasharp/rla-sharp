#!/usr/bin/env python3
"""College football (FBS) and men's college basketball (D-I) from ESPN's public JSON:
teams + rankings, the games in the next few days (lines from ESPN's sportsbook partner via the game summary, CFB matchup
predictor), every window team's results this season, and player game logs from each finished game's box score
(cached for good in data/<sport>_box.json, so each game is downloaded once).
Output (stdout) -> <sport>_data.js (loaded on demand by the site). Also writes data/<sport>_focus.json: the ESPN ids of the
window games, best first (ranked / power conference), which the odds job uses to decide whose player props to fetch.
Real data only. usage: python3 tools/collegefetch.py <repo root> cfb|cbb > cfb_data.js"""
import json, os, sys, time, datetime as dt, urllib.request
from concurrent.futures import ThreadPoolExecutor
R, SP = sys.argv[1], sys.argv[2]
CFG = {"cfb": {"path": "football/college-football", "grp": 80, "days": 7, "back": 0, "sd": 15.5},
       "cbb": {"path": "basketball/mens-college-basketball", "grp": 50, "days": 2, "back": 0, "sd": 11.0}}[SP]
SITE = f"https://site.api.espn.com/apis/site/v2/sports/{CFG['path']}/"
NOW = dt.datetime.now(dt.timezone.utc); ET = dt.timezone(dt.timedelta(hours=-5))
NREQ = [0]
def log(*a): print(*a, file=sys.stderr)
def get(u, tries=3):
    for i in range(tries):
        try:
            NREQ[0] += 1
            with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(1 + i)
        except Exception: time.sleep(1 + i)
    return None
def num(x):
    try: return float(str(x).replace("+", ""))
    except Exception: return None
CF = os.path.join(R, f"data/{SP}_box.json")
try: BOX = json.load(open(CF))
except Exception: BOX = {}
POWER = {"SEC", "Big Ten", "Big 12", "ACC", "Pac-12", "Big East"}

# ---------- teams (with conference) + rankings ----------
TM = {}
tj = get(SITE + f"teams?groups={CFG['grp']}&limit=500") or {}
for t in (((tj.get("sports") or [{}])[0].get("leagues") or [{}])[0].get("teams") or []):
    t = t.get("team") or {}
    TM[str(t["id"])] = {"a": t.get("abbreviation") or "", "n": t.get("displayName") or "", "s": t.get("shortDisplayName") or t.get("location") or "",
                        "c": ("#" + t["color"]) if t.get("color") else "", "cf": "", "rk": None}
DIV = set(TM)   # this division only (FBS / Division I); opponents from lower divisions are added to TM later
RANK = []
rk = get(SITE + "rankings") or {}
for L in (rk.get("rankings") or [])[:2]:
    rows = [[x.get("current"), str((x.get("team") or {}).get("id")), x.get("recordSummary") or "", x.get("trend") or ""] for x in (L.get("ranks") or [])]
    RANK.append({"n": L.get("name") or "", "r": rows})
if RANK:
    for r in RANK[0]["r"]:
        if r[1] in TM: TM[r[1]]["rk"] = r[0]

# ---------- window games ----------
d0 = NOW.astimezone(ET).date()
dates = f"{d0:%Y%m%d}-{(d0 + dt.timedelta(days=CFG['days'])):%Y%m%d}"
def day_sb(i):
    d = d0 + dt.timedelta(days=i)
    return (get(SITE + f"scoreboard?groups={CFG['grp']}&limit=400&dates={d:%Y%m%d}") or {}).get("events") or []
with ThreadPoolExecutor(8) as ex: EVS = [e for L in ex.map(day_sb, range(CFG["days"] + 1)) for e in L]
seen_ = set(); EVS = [e for e in EVS if not (e["id"] in seen_ or seen_.add(e["id"]))]
G = []
for e in EVS:
    c = (e.get("competitions") or [{}])[0]
    st = ((c.get("status") or {}).get("type") or {})
    cs = sorted(c.get("competitors") or [], key=lambda x: 0 if x.get("homeAway") == "away" else 1)
    if len(cs) != 2: continue
    side = []
    for x in cs:
        t = x.get("team") or {}; tid = str(t.get("id"))
        if tid not in TM: TM[tid] = {"a": t.get("abbreviation") or "", "n": t.get("displayName") or "", "s": t.get("shortDisplayName") or "", "c": ("#" + t["color"]) if t.get("color") else "", "cf": "", "rk": None}
        rec = ((x.get("records") or [{}])[0].get("summary") or "")
        rnk = (x.get("curatedRank") or {}).get("current")
        side.append([tid, rec, rnk if rnk and rnk <= 25 else None, x.get("score")])
    conf = (c.get("groups") or {}).get("shortName") or ""
    G.append({"id": e["id"], "t": e.get("date"), "st": st.get("state") or "pre", "det": st.get("shortDetail") or "", "a": side[0], "h": side[1],
              "neu": 1 if c.get("neutralSite") else 0, "ven": (c.get("venue") or {}).get("fullName") or "", "conf": conf,
              "tv": ", ".join(n for b in (c.get("broadcasts") or []) for n in (b.get("names") or []))[:40],
              "nt": next((n.get("headline") for n in (c.get("notes") or []) if n.get("headline")), "") or "",
              "ind": 1 if (c.get("venue") or {}).get("indoor") else 0,
              "loc": [((c.get("venue") or {}).get("address") or {}).get("city") or "", ((c.get("venue") or {}).get("address") or {}).get("state") or ""]})
# summaries for the window games: ESPN's line (DraftKings) + CFB predictor + conference of each team
def summ(g):
    s = get(SITE + f"summary?event={g['id']}") or {}
    pc = (s.get("pickcenter") or [])
    if pc:
        p = pc[0]
        g["ln"] = {"sp": num(p.get("spread")), "tot": num(p.get("overUnder")), "ml": [num((p.get("awayTeamOdds") or {}).get("moneyLine")), num((p.get("homeTeamOdds") or {}).get("moneyLine"))],
                   "spx": [num((p.get("awayTeamOdds") or {}).get("spreadOdds")), num((p.get("homeTeamOdds") or {}).get("spreadOdds"))], "ox": [num(p.get("overOdds")), num(p.get("underOdds"))],
                   "bk": (p.get("provider") or {}).get("name") or ""}
    pr = s.get("predictor") or {}
    if pr.get("homeTeam"):
        try: g["pred"] = [num(pr["awayTeam"].get("gameProjection")), num(pr["homeTeam"].get("gameProjection"))]
        except Exception: pass
    for grp in ((s.get("header") or {}).get("competitions") or [{}])[0].get("competitors") or []:
        pass
    for x in ((s.get("standings") or {}).get("groups") or []):
        cf = x.get("header") or ""
        for ent in ((x.get("standings") or {}).get("entries") or []):
            tid = str(ent.get("id") or "")
            if tid in TM and not TM[tid]["cf"]: TM[tid]["cf"] = cf.replace(" Standings", "")
with ThreadPoolExecutor(12) as ex: list(ex.map(summ, G))
log(f"{SP}: {len(TM)} teams, {len(G)} games in the window ({dates}), {sum(1 for g in G if g.get('ln'))} with lines")

# ---------- results this season for every window team (team schedule) ----------
wt = sorted({g["a"][0] for g in G} | {g["h"][0] for g in G})
RES = {}
def sched(tid):
    s = get(SITE + f"teams/{tid}/schedule") or {}
    out = []
    for e in s.get("events") or []:
        c = (e.get("competitions") or [{}])[0]
        if not ((c.get("status") or {}).get("type") or {}).get("completed"): continue
        me = next((x for x in c.get("competitors") or [] if str((x.get("team") or {}).get("id")) == tid), None)
        op = next((x for x in c.get("competitors") or [] if str((x.get("team") or {}).get("id")) != tid), None)
        if not me or not op: continue
        sc = lambda x: num((x.get("score") or {}).get("value") if isinstance(x.get("score"), dict) else x.get("score"))
        ot = op.get("team") or {}
        out.append([e.get("date", "")[:10], str(ot.get("id")), ot.get("abbreviation") or "", "H" if me.get("homeAway") == "home" else "A", sc(me), sc(op), e["id"], 1 if c.get("neutralSite") else 0])
    RES[tid] = out
# every team (not just this week's): strength of schedule, rankings of team stats and leaderboards need the whole division
ALLT = sorted(set(TM) | set(wt))
with ThreadPoolExecutor(14) as ex: list(ex.map(sched, ALLT))

# ---------- box scores (cached): player stats per finished game ----------
# CFB: [athleteId, name, pos, pass yds, comp, att, pass td, int, rush att, rush yds, rush td, rec, rec yds, rec td, targets?]
# CBB: [athleteId, name, pos, min, pts, fgm, fga, 3pm, 3pa, ftm, fta, reb, ast, to, stl, blk]
TKEEP = {"cfb": ["firstDowns", "thirdDownEff", "totalYards", "netPassingYards", "completionAttempts", "rushingYards", "rushingAttempts", "turnovers", "interceptions", "fumblesLost", "totalPenaltiesYards", "possessionTime"],
         "cbb": ["fieldGoalsMade-fieldGoalsAttempted", "threePointFieldGoalsMade-threePointFieldGoalsAttempted", "freeThrowsMade-freeThrowsAttempted", "totalRebounds", "offensiveRebounds", "assists", "steals", "blocks", "totalTurnovers", "fouls", "pointsInPaint", "fastBreakPoints", "turnoverPoints"]}[SP]
def box(eid):
    if eid in BOX and "_t" in BOX[eid] and "_l" in BOX[eid]: return
    s = get(SITE + f"summary?event={eid}") or {}
    out = {"_t": {}}
    # the closing line ESPN shows for the game (its partner book): home spread, total, home team id
    pc = (s.get("pickcenter") or [{}])[0] if s.get("pickcenter") else {}
    hid = next((str((c.get("team") or {}).get("id")) for c in (((s.get("header") or {}).get("competitions") or [{}])[0].get("competitors") or []) if c.get("homeAway") == "home"), "")
    out["_l"] = [num(pc.get("spread")), num(pc.get("overUnder")), hid] if pc else [None, None, hid]
    for tb in ((s.get("boxscore") or {}).get("teams") or []):
        tid = str((tb.get("team") or {}).get("id")); out["_t"][tid] = {x.get("name"): x.get("displayValue") for x in (tb.get("statistics") or []) if x.get("name") in TKEEP}
    for tb in ((s.get("boxscore") or {}).get("players") or []):
        tid = str((tb.get("team") or {}).get("id")); P = {}
        for cat in tb.get("statistics") or []:
            lab = cat.get("labels") or []; nm = (cat.get("name") or "").lower()
            for a in cat.get("athletes") or []:
                at = a.get("athlete") or {}; aid = str(at.get("id")); st = a.get("stats") or []
                if not st: continue
                d = P.setdefault(aid, {"n": at.get("displayName") or "", "p": (at.get("position") or {}).get("abbreviation") or ""})
                for l, v in zip(lab, st): d[(nm + ":" if SP == "cfb" else "") + l] = v
        rows = []
        for aid, d in P.items():
            def f(k):
                v = d.get(k)
                try: return float(str(v).split("/")[0].split("-")[0]) if v not in (None, "", "--") else None
                except Exception: return None
            def pair(k, i):
                v = d.get(k)
                try: return float(str(v).replace("/", "-").split("-")[i])
                except Exception: return None
            if SP == "cfb":
                r = [aid, d["n"], d["p"], f("passing:YDS"), pair("passing:C/ATT", 0), pair("passing:C/ATT", 1), f("passing:TD"), f("passing:INT"),
                     f("rushing:CAR"), f("rushing:YDS"), f("rushing:TD"), f("receiving:REC"), f("receiving:YDS"), f("receiving:TD"), f("receiving:LONG"), f("rushing:LONG")]
                if all(x in (None, 0) for x in r[3:]): continue
            else:
                if d.get("MIN") in (None, "", "--", "0"): continue
                r = [aid, d["n"], d["p"], f("MIN"), f("PTS"), pair("FG", 0), pair("FG", 1), pair("3PT", 0), pair("3PT", 1), pair("FT", 0), pair("FT", 1),
                     f("REB"), f("AST"), f("TO"), f("STL"), f("BLK")]
            rows.append([x if not isinstance(x, float) or x != int(x) else int(x) for x in r])
        out[tid] = rows
    if len(out) > 1 or out["_t"]: BOX[eid] = out
need = sorted(e for e in {r[6] for L in RES.values() for r in L} if e not in BOX or "_t" not in BOX[e] or "_l" not in BOX[e])
with ThreadPoolExecutor(14) as ex: list(ex.map(box, need))
log(f"{SP}: {len(need)} new box scores downloaded ({len(BOX)} cached)")

# ---------- player logs for the window teams ----------
PL = {}
for tid in wt:
    for r in RES.get(tid, []):
        b = BOX.get(r[6]) or {}
        for row in (b.get(tid) or []):
            aid, nm, pos = row[0], row[1], row[2]
            p = PL.setdefault(aid, {"n": nm, "t": tid, "p": pos, "g": []})
            p["t"] = tid
            p["g"].append([r[0], r[2], r[3]] + row[3:])
for p in PL.values(): p["g"].sort(key=lambda x: x[0])
# only players who matter (CFB: real offensive role; CBB: 10+ minutes a game)
def keep(p):
    G_ = p["g"]
    if SP == "cfb": return any((x[3] or 0) >= 40 or (x[9] or 0) >= 15 or (x[12] or 0) >= 15 for x in G_)
    return len(G_) >= 1 and sum((x[3] or 0) for x in G_) / len(G_) >= 10
PL = {aid: p for aid, p in PL.items() if keep(p)}
# team season numbers from results
TS = {}
for tid, L in RES.items():
    if not L: continue
    pf = [r[4] for r in L if r[4] is not None]; pa = [r[5] for r in L if r[5] is not None]
    TS[tid] = {"g": len(L), "w": sum(1 for r in L if (r[4] or 0) > (r[5] or 0)), "pf": round(sum(pf) / len(pf), 1) if pf else None, "pa": round(sum(pa) / len(pa), 1) if pa else None,
               "pf5": round(sum(pf[-5:]) / len(pf[-5:]), 1) if pf else None, "pa5": round(sum(pa[-5:]) / len(pa[-5:]), 1) if pa else None}
# ---------- team stats per game (and what each team allows), from the box scores ----------
def nums(v):
    v = str(v or "")
    try:
        if ":" in v: m, s_ = v.split(":"); return [int(m) + int(s_) / 60]
        return [float(x) for x in v.replace("/", "-").split("-") if x != ""]
    except Exception: return []
def tline(tb):
    o = {}
    for k, v in (tb or {}).items():
        n = nums(v)
        if not n: continue
        if SP == "cfb":
            if k == "completionAttempts" and len(n) == 2: o["comp"], o["patt"] = n
            elif k == "thirdDownEff" and len(n) == 2: o["3dc"], o["3da"] = n
            elif k == "totalPenaltiesYards" and len(n) == 2: o["pen"], o["peny"] = n
            elif k == "possessionTime": o["top"] = n[0]
            else: o[k] = n[0]
        else:
            if "-" in k and len(n) == 2: o[k.split("Made")[0] + "M"], o[k.split("Made")[0] + "A"] = n
            else: o[k] = n[0]
    return o
TSX = {}
for tid, L in RES.items():
    off, dfn, n = {}, {}, 0
    for r in L:
        b = BOX.get(r[6]) or {}; T = b.get("_t") or {}
        if tid not in T or r[1] not in T: continue
        a_, d_ = tline(T[tid]), tline(T[r[1]]); n += 1
        for k, v in a_.items(): off[k] = off.get(k, 0) + v
        for k, v in d_.items(): dfn[k] = dfn.get(k, 0) + v
    if n: TSX[tid] = {"n": n, "o": {k: round(v / n, 2) for k, v in off.items()}, "d": {k: round(v / n, 2) for k, v in dfn.items()}}
# ---------- strength of schedule: offense / defense ratings adjusted for every opponent (division games only) ----------
# expected points for t vs o = lg + O[t] + D[o] (+/- home edge); solved by iteration; margins capped so blowouts don't run away
HFA = 2.5 if SP == "cfb" else 3.0; CAP = 28 if SP == "cfb" else 22
# the division = every team in ESPN's conference standings (the teams listing can miss some)
def _ids(node, out):
    for ch in node.get("children") or []:
        for e in ((ch.get("standings") or {}).get("entries") or []): out.add(str((e.get("team") or {}).get("id")))
        _ids(ch, out)
    return out
_D = _ids(get(f"https://site.api.espn.com/apis/v2/sports/{CFG['path']}/standings?group={CFG['grp']}") or {}, set())
if len(_D) > 100: DIV = _D
log(f"{SP}: division = {len(DIV)} teams")
GM = []
for tid, L in RES.items():
    for r in L:
        if tid in DIV and r[1] in DIV and r[1] in RES and r[4] is not None and r[5] is not None:
            h = 0 if r[7] else (HFA / 2 if r[3] == "H" else -HFA / 2)
            m = r[4] - r[5]; adj = (max(-CAP, min(CAP, m)) - m) / 2
            GM.append((tid, r[1], r[4] + adj - h, r[5] - adj + h))
lg = sum(x[2] for x in GM) / len(GM) if GM else 0
O = {t: 0.0 for t in RES}; D = {t: 0.0 for t in RES}
for _ in range(40):
    sO = {t: [] for t in RES}; sD = {t: [] for t in RES}
    for t, o, pf, pa in GM: sO[t].append(pf - lg - D[o]); sD[t].append(pa - lg - O[o])
    O = {t: (sum(v) / (len(v) + 1.5) if v else 0.0) for t, v in sO.items()}   # +1.5: shrink small samples toward average
    D = {t: (sum(v) / (len(v) + 1.5) if v else 0.0) for t, v in sD.items()}
TR = {t: {"o": round(O[t], 2), "d": round(D[t], 2), "r": round(O[t] - D[t], 2), "g": sum(1 for x in GM if x[0] == t)} for t in RES if any(x[0] == t for x in GM)}
for i, (t, v) in enumerate(sorted(TR.items(), key=lambda kv: -kv[1]["r"])): v["rk"] = i + 1
# each team's own home edge: how much better it does at home than on the road against what its ratings expect (shrunk to the default)
for t, v in TR.items():
    hm, rd = [], []
    for r in RES.get(t, []):
        if r[7] or r[1] not in TR or r[4] is None or r[5] is None: continue
        m = max(-CAP, min(CAP, r[4] - r[5])); res = m - (v["r"] - TR[r[1]]["r"])
        (hm if r[3] == "H" else rd).append(res)
    if hm and rd:
        est = (sum(hm) / len(hm) - sum(rd) / len(rd)) / 2; n = len(hm) * len(rd) / (len(hm) + len(rd)); K = 8
        v["h"] = round((n * est + K * HFA) / (n + K), 2); v["hn"] = [len(hm), len(rd)]
# ---------- pace + efficiency (CFB: plays; CBB: possessions), adjusted for the opponent ----------
# points per 100 plays/possessions on offense and allowed, and how many plays/possessions a team's games have
def units(T):
    if SP == "cfb":
        ra = nums(T.get("rushingAttempts")); ca = nums(T.get("completionAttempts"))
        return (ra[0] if ra else 0) + (ca[1] if len(ca) > 1 else 0) or None
    fg = nums(T.get("fieldGoalsMade-fieldGoalsAttempted")); ft = nums(T.get("freeThrowsMade-freeThrowsAttempted")); orb = nums(T.get("offensiveRebounds")); to = nums(T.get("totalTurnovers"))
    if len(fg) < 2 or len(ft) < 2: return None
    return fg[1] - (orb[0] if orb else 0) + (to[0] if to else 0) + 0.475 * ft[1]
EG = []
for tid, L in RES.items():
    for r in L:
        if tid not in DIV or r[1] not in DIV or r[4] is None or r[5] is None: continue
        T = (BOX.get(r[6]) or {}).get("_t") or {}
        if tid not in T or r[1] not in T: continue
        u1, u2 = units(T[tid]), units(T[r[1]])
        if not u1 or not u2: continue
        tempo = (u1 + u2) / 2 if SP == "cbb" else (u1 + u2) / 2
        h = 0 if r[7] else (1 if r[3] == "H" else -1)
        EG.append((tid, r[1], 100 * r[4] / (u1 if SP == "cfb" else tempo), 100 * r[5] / (u2 if SP == "cfb" else tempo), tempo, h))
EFF = {}; EFFLG = None
if EG:
    lgE = sum(x[2] for x in EG) / len(EG); lgT = sum(x[4] for x in EG) / len(EG)
    hE = (HFA / 2) / lgT * 100   # the usual home edge, in points per 100 (raw home margins are skewed by early-season "buy" games)
    tm_ = {x[0] for x in EG}; EO = {t: 0.0 for t in tm_}; ED = {t: 0.0 for t in tm_}; ET_ = {t: 0.0 for t in tm_}
    for _ in range(40):
        sO = {t: [] for t in tm_}; sD = {t: [] for t in tm_}; sT = {t: [] for t in tm_}
        for t, o, ef, ea, tp, h in EG:
            sO[t].append(ef - h * hE - lgE - ED.get(o, 0)); sD[t].append(ea + h * hE - lgE - EO.get(o, 0)); sT[t].append(tp - lgT - ET_.get(o, 0))
        EO = {t: sum(v) / (len(v) + 1.5) for t, v in sO.items()}; ED = {t: sum(v) / (len(v) + 1.5) for t, v in sD.items()}; ET_ = {t: sum(v) / (len(v) + 1.5) for t, v in sT.items()}
    EFF = {t: {"o": round(EO[t], 2), "d": round(ED[t], 2), "t": round(ET_[t], 2), "g": len(sO[t])} for t in tm_}
    for i, (t, v) in enumerate(sorted(EFF.items(), key=lambda kv: -(kv[1]["o"] - kv[1]["d"]))): v["rk"] = i + 1
    EFFLG = [round(lgE, 2), round(lgT, 2), round(hE, 2)]
# ---------- against the spread / over-under this season (closing lines from ESPN's game page) ----------
TATS = {}
for tid in wt:
    rows = []
    for r in RES.get(tid, []):
        l = (BOX.get(r[6]) or {}).get("_l") or [None, None, ""]
        if l[0] is None or r[4] is None: continue
        hsp = l[0]; home_is_me = (l[2] == tid) if l[2] else (r[3] == "H")
        rows.append([r[0], r[2], r[3], r[4], r[5], hsp if home_is_me else -hsp, l[1], r[6]])
    if rows: TATS[tid] = rows
# ---------- leaderboards across the whole division (every box score this season) ----------
AGG = {}
for tid, L in RES.items():
    for r in L:
        for row in ((BOX.get(r[6]) or {}).get(tid) or []):
            a = AGG.setdefault(row[0], {"n": row[1], "t": tid, "p": row[2], "g": 0, "s": [0] * (len(row) - 3)}); a["g"] += 1; a["t"] = tid
            for i, v in enumerate(row[3:]): a["s"][i] += (v or 0)
LEAD = {}
if SP == "cfb":
    cats = [("Passing yards", 0, 6), ("Rushing yards", 6, 4), ("Receiving yards", 9, 4), ("Touchdowns", None, 4)]
    for nm, i, mn in cats:
        L_ = []
        for aid, a in AGG.items():
            if a["g"] < 3: continue
            v = (a["s"][3] + a["s"][7] + a["s"][10]) if i is None else a["s"][i]
            L_.append([aid, a["n"], a["t"], a["p"], round(v / a["g"], 1), v, a["g"]])
        LEAD[nm] = sorted(L_, key=lambda x: -x[5])[:25]
else:
    for nm, i in (("Points", 1), ("Rebounds", 8), ("Assists", 9), ("3-pointers", 4), ("Steals", 11), ("Blocks", 12)):
        L_ = [[aid, a["n"], a["t"], a["p"], round(a["s"][i] / a["g"], 1), a["s"][i], a["g"]] for aid, a in AGG.items() if a["g"] >= 3]
        LEAD[nm] = sorted(L_, key=lambda x: -x[4])[:25]
# ---------- conference standings ----------
STAND = []
st_ = get(f"https://site.api.espn.com/apis/v2/sports/{CFG['path']}/standings?group={CFG['grp']}") or {}
def walk(node):
    for ch in node.get("children") or []:
        if (ch.get("standings") or {}).get("entries"):
            rows = []
            for e in ch["standings"]["entries"]:
                tid = str((e.get("team") or {}).get("id")); S_ = {x.get("name") or x.get("type"): x for x in e.get("stats") or []}
                def sv(*ks):
                    for k in ks:
                        if k in S_: return S_[k].get("displayValue") or S_[k].get("summary") or S_[k].get("value")
                    return ""
                rows.append([tid, sv("vs. Conf.", "vsconf", "conferenceRecord", "Conference"), sv("overall", "total", "Overall"), sv("streak")])
            STAND.append({"n": ch.get("name") or ch.get("abbreviation") or "", "r": rows})
        walk(ch)
walk(st_)
# ---------- injuries (ESPN; college reports are thin, and basketball often has none) ----------
INJ = {}
ij = get(SITE + "injuries") or {}
for T in ij.get("injuries") or []:
    tid = str(T.get("id"))
    for x in T.get("injuries") or []:
        a = x.get("athlete") or {}
        INJ.setdefault(tid, []).append([a.get("displayName") or "", ((a.get("position") or {}).get("abbreviation") or ""), x.get("status") or (x.get("type") or {}).get("description") or "",
                                        x.get("shortComment") or "", (x.get("date") or "")[:10]])
# ---------- head to head: this season + the last 4 seasons (past seasons cached for good) ----------
SEAS = int(next((e.get("season") or {}).get("year") for e in EVS if (e.get("season") or {}).get("year")) if any((e.get("season") or {}).get("year") for e in EVS) else (NOW.year if SP == "cfb" else NOW.year + 1))
def past(tid, yr):
    k = f"sch2|{tid}|{yr}"
    if k in BOX: return BOX[k]
    s = get(SITE + f"teams/{tid}/schedule?season={yr}") or {}
    out = []
    for e in s.get("events") or []:
        c = (e.get("competitions") or [{}])[0]
        if not ((c.get("status") or {}).get("type") or {}).get("completed"): continue
        me = next((x for x in c.get("competitors") or [] if str((x.get("team") or {}).get("id")) == tid), None)
        op = next((x for x in c.get("competitors") or [] if str((x.get("team") or {}).get("id")) != tid), None)
        if not me or not op: continue
        sc = lambda x: num((x.get("score") or {}).get("value") if isinstance(x.get("score"), dict) else x.get("score"))
        out.append([e.get("date", "")[:10], str((op.get("team") or {}).get("id")), "H" if me.get("homeAway") == "home" else "A", sc(me), sc(op), 1 if c.get("neutralSite") else 0, e.get("id")])
    BOX[k] = out; return out
for k in [k for k in BOX if k.startswith("sch|")]: del BOX[k]   # old cache without event ids
# ---------- rivalries and conference title games ----------
RIV = {"cfb": [("Iron Bowl", "Alabama Crimson Tide", "Auburn Tigers"), ("The Game", "Michigan Wolverines", "Ohio State Buckeyes"),
               ("Red River Rivalry", "Texas Longhorns", "Oklahoma Sooners"), ("Egg Bowl", "Ole Miss Rebels", "Mississippi State Bulldogs"),
               ("Apple Cup", "Washington Huskies", "Washington State Cougars"), ("Bedlam", "Oklahoma Sooners", "Oklahoma State Cowboys"),
               ("Clean, Old-Fashioned Hate", "Georgia Bulldogs", "Georgia Tech Yellow Jackets"), ("Palmetto Bowl", "Clemson Tigers", "South Carolina Gamecocks"),
               ("Florida vs Florida State", "Florida Gators", "Florida State Seminoles"), ("Holy War", "BYU Cougars", "Utah Utes"),
               ("Territorial Cup", "Arizona Wildcats", "Arizona State Sun Devils"), ("Lone Star Showdown", "Texas Longhorns", "Texas A&M Aggies"),
               ("Crosstown Showdown", "USC Trojans", "UCLA Bruins"), ("Jeweled Shillelagh", "Notre Dame Fighting Irish", "USC Trojans"),
               ("Army-Navy", "Army Black Knights", "Navy Midshipmen"), ("Backyard Brawl", "Pittsburgh Panthers", "West Virginia Mountaineers"),
               ("Old Oaken Bucket", "Indiana Hoosiers", "Purdue Boilermakers"), ("Paul Bunyan's Axe", "Minnesota Golden Gophers", "Wisconsin Badgers"),
               ("Paul Bunyan Trophy", "Michigan Wolverines", "Michigan State Spartans"), ("Florida-Georgia", "Florida Gators", "Georgia Bulldogs"),
               ("Third Saturday in October", "Alabama Crimson Tide", "Tennessee Volunteers"), ("Governor's Cup", "Kentucky Wildcats", "Louisville Cardinals"),
               ("Commonwealth Cup", "Virginia Cavaliers", "Virginia Tech Hokies"), ("Victory Bell", "Duke Blue Devils", "North Carolina Tar Heels"),
               ("Big Game", "California Golden Bears", "Stanford Cardinal"), ("Cy-Hawk", "Iowa Hawkeyes", "Iowa State Cyclones"),
               ("Sunflower Showdown", "Kansas Jayhawks", "Kansas State Wildcats"), ("Battle for the Golden Boot", "Arkansas Razorbacks", "LSU Tigers"),
               ("Civil War", "Oregon Ducks", "Oregon State Beavers"), ("Border War", "Kansas Jayhawks", "Missouri Tigers")],
       "cbb": [("Tobacco Road", "Duke Blue Devils", "North Carolina Tar Heels"), ("Battle of the Bluegrass", "Kentucky Wildcats", "Louisville Cardinals"),
               ("Indiana vs Purdue", "Indiana Hoosiers", "Purdue Boilermakers"), ("Michigan vs Michigan State", "Michigan Wolverines", "Michigan State Spartans"),
               ("Sunflower Showdown", "Kansas Jayhawks", "Kansas State Wildcats"), ("Border War", "Kansas Jayhawks", "Missouri Tigers"),
               ("Crosstown Shootout", "Cincinnati Bearcats", "Xavier Musketeers"), ("Syracuse vs Georgetown", "Syracuse Orange", "Georgetown Hoyas"),
               ("UCLA vs USC", "UCLA Bruins", "USC Trojans"), ("Territorial Cup", "Arizona Wildcats", "Arizona State Sun Devils"),
               ("Gonzaga vs Saint Mary's", "Gonzaga Bulldogs", "Saint Mary's Gaels"), ("Big Four", "Villanova Wildcats", "Saint Joseph's Hawks"),
               ("Cy-Hawk", "Iowa Hawkeyes", "Iowa State Cyclones"), ("Holy War", "BYU Cougars", "Utah Utes"), ("Egg Bowl", "Ole Miss Rebels", "Mississippi State Bulldogs")]}[SP]
NM2 = {v["n"]: k for k, v in TM.items()}
RIVP = {}
for nm, x, y in RIV:
    if x in NM2 and y in NM2: RIVP[frozenset((NM2[x], NM2[y]))] = nm
for g in G:
    r_ = RIVP.get(frozenset((g["a"][0], g["h"][0])))
    if r_: g["riv"] = r_
    if "championship" in (g.get("nt") or "").lower(): g["ttl"] = g["nt"]
jobs = [(g["h"][0], y) for g in G for y in range(SEAS - 4, SEAS)]
with ThreadPoolExecutor(12) as ex: list(ex.map(lambda x: past(*x), jobs))
H2H = {}
for g in G:
    h, a = g["h"][0], g["a"][0]; rows = []
    for y in range(SEAS - 4, SEAS):
        for r in BOX.get(f"sch2|{h}|{y}") or []:
            if r[1] == a: rows.append([r[0], r[2], r[3], r[4], r[5], r[6] if len(r) > 6 else None])
    for r in RES.get(h, []):
        if r[1] == a: rows.append([r[0], r[3], r[4], r[5], r[7], r[6]])
    if rows and (g.get("riv") or g.get("ttl")):
        with ThreadPoolExecutor(6) as ex: list(ex.map(box, [x[5] for x in rows if x[5]]))
        for x in rows:
            l = (BOX.get(x[5]) or {}).get("_l") if x[5] else None
            if l and l[0] is not None: x += [l[0] if (l[2] == h or (not l[2] and x[1] == "H")) else -l[0], l[1]]   # spread for this game's home team, total
    if rows: H2H[g["id"]] = sorted(rows, reverse=True)
# ---------- weather at kickoff for outdoor football games (Open-Meteo forecast; place from ESPN's venue address) ----------
WX = {}
if SP == "cfb":
    ST_ = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming","DC":"District of Columbia"}
    GF = os.path.join(R, "data/geo.json")
    try: GEO = json.load(open(GF))
    except Exception: GEO = {}
    def wx(g):
        try:
            if g["st"] != "pre" or g.get("ind") or not g.get("loc") or not g["loc"][0]: return
            t = dt.datetime.fromisoformat(g["t"].replace("Z", "+00:00"))
            if t - NOW > dt.timedelta(days=9): return
            city, stt = g["loc"]; key = f"{city}|{stt}"
            if key not in GEO:
                q = get("https://geocoding-api.open-meteo.com/v1/search?count=10&language=en&format=json&name=" + urllib.parse.quote(city)) or {}
                full = ST_.get(stt, stt)
                hit = next((x for x in q.get("results") or [] if x.get("admin1") == full), None) or next((x for x in q.get("results") or [] if x.get("country_code") == "US"), None)
                GEO[key] = [hit["latitude"], hit["longitude"]] if hit else None
            ll = GEO.get(key)
            if not ll: return
            f = get(f"https://api.open-meteo.com/v1/forecast?latitude={ll[0]}&longitude={ll[1]}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=UTC&forecast_days=10") or {}
            H = f.get("hourly") or {}; tt = H.get("time") or []
            if not tt: return
            want = t.strftime("%Y-%m-%dT%H:00"); i = tt.index(want) if want in tt else None
            if i is None: return
            pick = lambda k: (H.get(k) or [None] * len(tt))[i]
            WX[g["id"]] = [pick("temperature_2m"), pick("wind_speed_10m"), pick("wind_gusts_10m"), pick("precipitation_probability"), pick("weather_code")]
        except Exception as e: log("weather:", e)
    import urllib.parse
    with ThreadPoolExecutor(6) as ex: list(ex.map(wx, G))
    json.dump(GEO, open(GF, "w"), separators=(",", ":"))
    log(f"{SP}: weather for {len(WX)} outdoor games")
# focus list for the odds job: ranked teams first, then power conferences, then the rest; soonest first within each
def pri(g):
    rk = min([x for x in (g["a"][2], g["h"][2]) if x] or [99])
    pw = any(TM.get(t, {}).get("cf", "") and any(p in TM[t]["cf"] for p in POWER) for t in (g["a"][0], g["h"][0]))
    return (0 if rk < 99 else 1 if pw else 2, g["t"])
focus = [g["id"] for g in sorted([g for g in G if g["st"] == "pre"], key=pri)]
os.makedirs(os.path.join(R, "data"), exist_ok=True)
json.dump({"at": NOW.isoformat(timespec="seconds"), "ids": focus, "top": [g["id"] for g in G if g["st"] == "pre" and (g["a"][2] or g["h"][2])]}, open(os.path.join(R, f"data/{SP}_focus.json"), "w"))
# keep the box cache to this season's games only
json.dump(BOX, open(CF, "w"), separators=(",", ":"))
J = lambda o: json.dumps(o, separators=(",", ":"), ensure_ascii=False)
U = SP.upper()
print(f"/* {'🏈 College football (FBS)' if SP == 'cfb' else '🏀 College basketball (D-I men)'} — tools/collegefetch.py (ESPN: teams, rankings, games, lines, box scores) */")
print(f'var {U}_GEN="{NOW.astimezone(ET).strftime("%a %b %d %I:%M %p")} ET";')
print(f"var {U}_TM={J(TM)};  /* id -> a: abbr, n: name, s: short name, c: colour, cf: conference, rk: AP rank */")
print(f"var {U}_RANK={J(RANK)};")
print(f"var {U}_G={J(G)};  /* window games: a/h = [team id, record, rank, score]; ln = ESPN line (sp = home spread), pred = CFB predictor win % [away, home] */")
print(f"var {U}_RES={J({t: RES[t] for t in wt if t in RES})};  /* team id -> [[date, opp id, opp abbr, H/A, pts for, pts against, event id, neutral], ...] */")
print(f"var {U}_TS={J(TS)};")
print(f"var {U}_P={J(PL)};  /* athlete id -> n, t (team id), p (pos), g: [[date, opp, H/A, " + ("pass yds, comp, att, pass td, int, rush att, rush yds, rush td, rec, rec yds, rec td, rec long, rush long" if SP == "cfb" else "min, pts, fgm, fga, 3pm, 3pa, ftm, fta, reb, ast, to, stl, blk") + "], ...] */")
print(f"var {U}_TSX={J(TSX)};  /* team id -> n games, o: per-game stats, d: what opponents did against them (box scores) */")
print(f"var {U}_TR={J(TR)};  /* strength-of-schedule ratings: o = points above average on offense, d = points allowed above average (lower = better), r = o - d, rk; lg below */")
print(f"var {U}_LG={round(lg, 2)};")
print(f"var {U}_EFF={J(EFF)};  /* pace + efficiency, opponent-adjusted: o / d = points per 100 {'plays' if SP == 'cfb' else 'possessions'} above average (d: allowed, lower = better), t = {'plays' if SP == 'cfb' else 'possessions'} per game above average, rk */")
print(f"var {U}_EFFLG={J(EFFLG)};  /* [league points per 100, league {'plays' if SP == 'cfb' else 'possessions'} per game, home edge per 100] */")
print(f"var {U}_WX={J(WX)};  /* game id -> [temp F, wind mph, gusts mph, rain chance %, WMO weather code] at kickoff */")
print(f"var {U}_ATS={J(TATS)};  /* team id -> [[date, opp, H/A, pts for, pts against, team spread (- = favoured), total, event id], ...] */")
print(f"var {U}_LEAD={J(LEAD)};  /* category -> [[athlete id, name, team id, pos, per game, total, games], ...] */")
print(f"var {U}_STAND={J(STAND)};  /* conference standings: [{{n, r: [[team id, conference record, overall, streak], ...]}}] */")
print(f"var {U}_INJ={J(INJ)};  /* team id -> [[name, pos, status, note, date], ...] (ESPN) */")
print(f"var {U}_H2H={J(H2H)};  /* window game id -> meetings [[date, home team's H/A, home pts, away pts, neutral], ...] newest first (home = this game's home team) */")
print(f"var {U}_OK=1;")
# box scores of every window team's games this season -> a separate file the site loads only when a box score is opened
BX = {}
for tid in wt:
    for r in RES.get(tid, [])[-8:]:
        b = BOX.get(r[6])
        if not b or r[6] in BX: continue
        hm = tid if r[3] == "H" else r[1]; aw = r[1] if r[3] == "H" else tid
        sh, sa = (r[4], r[5]) if r[3] == "H" else (r[5], r[4])
        BX[r[6]] = {"d": r[0], "h": [hm, sh], "a": [aw, sa], "n": r[7], "t": b.get("_t") or {}, "p": {k: [x[1:] for x in v] for k, v in b.items() if not k.startswith("_")}}
open(os.path.join(R, f"src/{SP}_box.js"), "w").write(f"/* {SP.upper()} box scores (window teams, last 8 games each) — tools/collegefetch.py */\nvar {U}_BX={J(BX)};\nvar {U}_BX_OK=1;\n")
log(f"{SP}: {len(PL)} players with logs, {len(focus)} focus games, {NREQ[0]} requests")
