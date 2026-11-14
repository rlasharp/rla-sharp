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
CFG = {"cfb": {"path": "football/college-football", "grp": 80, "days": 6, "back": 0, "sd": 15.5},
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
sb = get(SITE + f"scoreboard?groups={CFG['grp']}&limit=500&dates={dates}") or {}
G = []
for e in sb.get("events") or []:
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
              "tv": ", ".join(n for b in (c.get("broadcasts") or []) for n in (b.get("names") or []))[:40]})
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
with ThreadPoolExecutor(12) as ex: list(ex.map(sched, wt))

# ---------- box scores (cached): player stats per finished game ----------
# CFB: [athleteId, name, pos, pass yds, comp, att, pass td, int, rush att, rush yds, rush td, rec, rec yds, rec td, targets?]
# CBB: [athleteId, name, pos, min, pts, fgm, fga, 3pm, 3pa, ftm, fta, reb, ast, to, stl, blk]
def box(eid):
    if eid in BOX: return
    s = get(SITE + f"summary?event={eid}") or {}
    out = {}
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
    if out: BOX[eid] = out
need = sorted({r[6] for L in RES.values() for r in L} - set(BOX))
with ThreadPoolExecutor(14) as ex: list(ex.map(box, need))
log(f"{SP}: {len(need)} new box scores downloaded ({len(BOX)} cached)")

# ---------- player logs for the window teams ----------
PL = {}
for tid in wt:
    for r in RES.get(tid, []):
        b = BOX.get(r[6]) or {}
        for row in b.get(tid, []):
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
# focus list for the odds job: ranked teams first, then power conferences, then the rest; soonest first within each
def pri(g):
    rk = min([x for x in (g["a"][2], g["h"][2]) if x] or [99])
    pw = any(TM.get(t, {}).get("cf", "") and any(p in TM[t]["cf"] for p in POWER) for t in (g["a"][0], g["h"][0]))
    return (0 if rk < 99 else 1 if pw else 2, g["t"])
focus = [g["id"] for g in sorted([g for g in G if g["st"] == "pre"], key=pri)]
os.makedirs(os.path.join(R, "data"), exist_ok=True)
json.dump({"at": NOW.isoformat(timespec="seconds"), "ids": focus}, open(os.path.join(R, f"data/{SP}_focus.json"), "w"))
# keep the box cache to this season's games only
json.dump(BOX, open(CF, "w"), separators=(",", ":"))
J = lambda o: json.dumps(o, separators=(",", ":"), ensure_ascii=False)
U = SP.upper()
print(f"/* {'🏈 College football (FBS)' if SP == 'cfb' else '🏀 College basketball (D-I men)'} — tools/collegefetch.py (ESPN: teams, rankings, games, lines, box scores) */")
print(f'var {U}_GEN="{NOW.astimezone(ET).strftime("%a %b %d %I:%M %p")} ET";')
print(f"var {U}_TM={J(TM)};  /* id -> a: abbr, n: name, s: short name, c: colour, cf: conference, rk: AP rank */")
print(f"var {U}_RANK={J(RANK)};")
print(f"var {U}_G={J(G)};  /* window games: a/h = [team id, record, rank, score]; ln = ESPN line (sp = home spread), pred = CFB predictor win % [away, home] */")
print(f"var {U}_RES={J(RES)};  /* team id -> [[date, opp id, opp abbr, H/A, pts for, pts against, event id, neutral], ...] */")
print(f"var {U}_TS={J(TS)};")
print(f"var {U}_P={J(PL)};  /* athlete id -> n, t (team id), p (pos), g: [[date, opp, H/A, " + ("pass yds, comp, att, pass td, int, rush att, rush yds, rush td, rec, rec yds, rec td, rec long, rush long" if SP == "cfb" else "min, pts, fgm, fga, 3pm, 3pa, ftm, fta, reb, ast, to, stl, blk") + "], ...] */")
print(f"var {U}_OK=1;")
log(f"{SP}: {len(PL)} players with logs, {len(focus)} focus games, {NREQ[0]} requests")
