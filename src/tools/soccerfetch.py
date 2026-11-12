#!/usr/bin/env python3
"""⚽ Soccer data for RLA Sharp -> soccer_data.js (games, standings, estimates) + soccer_players.js (player game logs).
8 competitions: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Conference League.
Sources (real data only):
  ESPN JSON  — fixtures, results, every match's box score (team: shots, on target, corners, fouls, cards, possession;
               player: shots, on target, goals, assists, fouls committed / won, cards, subs), standings, lineups
  PropLine   — odds, player props, referee card averages + assignments (data/live_odds.json "soc", tools/soccer_odds.py)
  Open-Meteo — kickoff-hour weather at the stadium's city (free, no key)
Box scores are cached in data/soccer_box.json (each finished match is downloaded once).
usage: python3 tools/soccerfetch.py <repo root>   (writes soccer_data.js + soccer_players.js in the current dir)"""
import json, os, re, sys, math, time, unicodedata, urllib.request, urllib.parse, datetime as dt
from concurrent.futures import ThreadPoolExecutor
from zoneinfo import ZoneInfo
R = sys.argv[1]
NOW = dt.datetime.now(dt.timezone.utc)
COMPS = [("epl", "eng.1", "Premier League", "EPL", "#3d195b"), ("laliga", "esp.1", "La Liga", "LaLiga", "#ee8707"),
         ("seriea", "ita.1", "Serie A", "Serie A", "#008fd7"), ("bund", "ger.1", "Bundesliga", "Bundesliga", "#d20515"),
         ("ligue1", "fra.1", "Ligue 1", "Ligue 1", "#091c3e"), ("ucl", "uefa.champions", "Champions League", "UCL", "#0e1e5b"),
         ("uel", "uefa.europa", "Europa League", "UEL", "#f68e00"), ("uecl", "uefa.europa.conf", "Conference League", "UECL", "#19b25b"),
         ("champ", "eng.2", "Championship", "Champ", "#1f3f8f"), ("ered", "ned.1", "Eredivisie", "Eredivisie", "#e4012b"),
         ("port", "por.1", "Primeira Liga", "Portugal", "#00843d"), ("mls", "usa.1", "MLS", "MLS", "#0a2240")]
CUPS = ("ucl", "uel", "uecl")
S = "https://site.api.espn.com/apis/site/v2/sports/soccer/"
SEASON0 = dt.datetime(NOW.year if NOW.month >= 7 else NOW.year - 1, 7, 1, tzinfo=dt.timezone.utc)
START = {"usa.1": dt.datetime(NOW.year, 1, 1, tzinfo=dt.timezone.utc)}   # MLS: calendar-year season
def start_of(slug): return START.get(slug, SEASON0)
LOG = []
def log(*a): LOG.append(" ".join(str(x) for x in a)); print(*a, file=sys.stderr)
def get(u, tries=3):
    for i in range(tries):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30))
        except Exception as e:
            if i == tries - 1: log("GET failed", u[-90:], e); return None
            time.sleep(1.5 * (i + 1))
def ts(s): return dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))
def norm(s): return re.sub(r"[^a-z ]", "", unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()).strip()
def num(x):
    try: return float(x)
    except Exception: return None
def jload(p, d):
    try: return json.load(open(p))
    except Exception: return d

# ---------------- fixtures + results (scoreboard by month) ----------------
end = (NOW + dt.timedelta(days=17)).date()
def months_for(slug):
    st = start_of(slug); m = dt.date(st.year, max(st.month, 8) if st == SEASON0 else st.month, 1); out = []
    while m <= end:
        out.append(m.strftime("%Y%m")); m = dt.date(m.year + (m.month == 12), m.month % 12 + 1, 1)
    return out
TEAM, EV = {}, {}
def sb_job(args):
    comp, slug, mo = args; return comp, slug, get(f"{S}{slug}/scoreboard?dates={mo}&limit=200")
with ThreadPoolExecutor(8) as ex:
    for comp, slug, sb in ex.map(sb_job, [(c[0], c[1], mo) for c in COMPS for mo in months_for(c[1])]):
        for e in (sb or {}).get("events", []):
            try:
                t = ts(e["date"])
                if t < start_of(slug): continue
                c = e["competitions"][0]; H = next(x for x in c["competitors"] if x["homeAway"] == "home"); A = next(x for x in c["competitors"] if x["homeAway"] == "away")
                for x in (H, A):
                    tm = x["team"]; T = TEAM.setdefault(tm["id"], {"n": tm.get("displayName"), "s": tm.get("shortDisplayName") or tm.get("displayName"),
                                                                  "ab": tm.get("abbreviation"), "col": "#" + (tm.get("color") or "555555"), "c": []})
                    if comp not in T["c"]: T["c"].append(comp)
                st = e["status"]["type"]; v = c.get("venue") or {}
                EV[e["id"]] = {"id": e["id"], "t": e["date"], "c": comp, "slug": slug, "h": H["team"]["id"], "a": A["team"]["id"],
                               "hs": int(H["score"]) if st.get("completed") and H.get("score") not in (None, "") else None,
                               "as": int(A["score"]) if st.get("completed") and A.get("score") not in (None, "") else None,
                               "done": bool(st.get("completed")), "state": st.get("state"), "detail": st.get("shortDetail") or st.get("detail"),
                               "ven": v.get("fullName"), "city": (v.get("address") or {}).get("city"), "ctry": (v.get("address") or {}).get("country")}
            except Exception as ex_: log("event parse", e.get("id"), ex_)
log(f"soccer: {len(EV)} matches this season across {len(COMPS)} competitions ({sum(1 for e in EV.values() if e['done'])} finished), {len(TEAM)} teams")

# ---------------- box scores (cached) ----------------
BOXF = os.path.join(R, "data/soccer_box.json"); BOX = jload(BOXF, {})
TS = ["totalShots", "shotsOnTarget", "wonCorners", "foulsCommitted", "yellowCards", "redCards", "possessionPct", "offsides", "saves"]
PS = ["totalShots", "shotsOnTarget", "totalGoals", "goalAssists", "foulsCommitted", "foulsSuffered", "yellowCards", "redCards", "saves"]
def minute(s):
    m_ = re.match(r"\s*(\d+)", str(s or "")); return int(m_.group(1)) if m_ else None
def parse_box(e):
    sm = get(f"{S}{e['slug']}/summary?event={e['id']}")
    if not sm: return None
    out = {"v": 3, "ts": {}, "p": [], "ev": []}
    for t in (sm.get("boxscore") or {}).get("teams", []):
        st = {s.get("name"): num(s.get("displayValue")) for s in t.get("statistics", [])}
        out["ts"][t["team"]["id"]] = [st.get(k) for k in TS]
    subs = {}
    for k in sm.get("keyEvents") or []:
        ty = ((k.get("type") or {}).get("text") or "").lower(); mn = minute((k.get("clock") or {}).get("displayValue"))
        names = [(p.get("athlete") or {}).get("displayName") for p in k.get("participants") or []]
        if "substitution" in ty:
            for n in names:
                if n: subs.setdefault(n, mn)
        elif ty in ("goal", "goal - header", "goal - free-kick", "penalty - scored", "own goal") or "goal" in ty and "disallowed" not in ty:
            out["ev"].append(["o" if "own" in ty else "p" if "penalty" in ty else "g", mn, ((k.get("team") or {}).get("id")), names[0] if names else None])
        elif "card" in ty:
            out["ev"].append(["r" if "red" in ty else "y", mn, ((k.get("team") or {}).get("id")), names[0] if names else None])
    for side in sm.get("rosters") or []:
        tid = (side.get("team") or {}).get("id")
        for p in side.get("roster") or []:
            a = p.get("athlete") or {}; st = {s.get("name"): s.get("value") for s in p.get("stats") or []}
            if not a.get("displayName"): continue
            starter = bool(p.get("starter")); sin, sout = bool(p.get("subbedIn")), bool(p.get("subbedOut"))
            if not starter and not sin: continue          # unused sub
            nm = a["displayName"]; mn_ = subs.get(nm)
            mins = (mn_ if (sout and mn_) else 90) if starter else (max(1, 90 - mn_) if mn_ is not None else 20)
            out["p"].append([tid, a.get("id"), nm, ((p.get("position") or {}).get("abbreviation") or ""), 1 if starter else 0, mins]
                            + [int(st.get(k) or 0) for k in PS])
    return out
need = [e for e in EV.values() if e["done"] and (BOX.get(e["id"]) or {}).get("v") != 3]
log(f"soccer: downloading {len(need)} new box scores")
with ThreadPoolExecutor(8) as ex:
    for e, b in zip(need, ex.map(parse_box, need)):
        if b and b["p"]: BOX[e["id"]] = b
json.dump(BOX, open(BOXF, "w"), separators=(",", ":"), ensure_ascii=False)

# ---------------- standings ----------------
ST = {}
for comp, slug, *_ in COMPS:
    s_ = get(f"https://site.api.espn.com/apis/v2/sports/soccer/{slug}/standings")
    rows = []
    for ch in (s_ or {}).get("children", []):
        for en in (ch.get("standings") or {}).get("entries", []):
            v = {x["name"]: x.get("value") for x in en.get("stats", [])}
            rows.append([en["team"]["id"], int(v.get("rank") or 0), int(v.get("gamesPlayed") or 0), int(v.get("wins") or 0), int(v.get("ties") or 0),
                         int(v.get("losses") or 0), int(v.get("pointsFor") or 0), int(v.get("pointsAgainst") or 0), int(v.get("points") or 0)])
            tm = en["team"]; TEAM.setdefault(tm["id"], {"n": tm.get("displayName"), "s": tm.get("shortDisplayName") or tm.get("displayName"), "ab": tm.get("abbreviation"), "col": "#555555", "c": [comp]})
    ST[comp] = sorted(rows, key=lambda r: r[1] or 99)

# ---------------- per-competition team numbers ----------------
DONE = sorted([e for e in EV.values() if e["done"] and e["id"] in BOX], key=lambda e: e["t"])
def tstat(e, tid, k): v = (BOX[e["id"]]["ts"].get(tid) or [None] * len(TS))[TS.index(k)]; return v
def cards(e, tid):
    y, r = tstat(e, tid, "yellowCards"), tstat(e, tid, "redCards"); return None if y is None else y + (r or 0)
LG, TN = {}, {}
for comp, *_ in COMPS:
    M = [e for e in DONE if e["c"] == comp]
    if not M: continue
    def avg(f):
        v = [x for x in (f(e) for e in M) if x is not None]; return sum(v) / len(v) if v else None
    def tot(f):
        v = [x for x in (f(e) for e in M) if x is not None]; return v
    hg, ag = avg(lambda e: e["hs"]), avg(lambda e: e["as"])
    sot = avg(lambda e: (tstat(e, e["h"], "shotsOnTarget") or 0) + (tstat(e, e["a"], "shotsOnTarget") or 0))
    hc, ac = avg(lambda e: tstat(e, e["h"], "wonCorners")), avg(lambda e: tstat(e, e["a"], "wonCorners"))
    hk, ak = avg(lambda e: cards(e, e["h"])), avg(lambda e: cards(e, e["a"]))
    def disp(vals):
        if len(vals) < 15: return None
        mu = sum(vals) / len(vals); var = sum((x - mu) ** 2 for x in vals) / (len(vals) - 1); return round(var / mu, 3) if mu else None
    def evok(e):
        ev = BOX[e["id"]].get("ev") or []; return sum(1 for x in ev if x[0] in ("g", "p", "o")) == e["hs"] + e["as"] and all(x[1] is not None for x in ev)
    MT = [e for e in M if evok(e)]
    g1 = sum(1 for e in MT for x in BOX[e["id"]]["ev"] if x[0] in ("g", "p", "o") and x[1] <= 45); gA = sum(e["hs"] + e["as"] for e in MT)
    k1 = sum(1 for e in MT for x in BOX[e["id"]]["ev"] if x[0] in ("y", "r") and x[1] <= 45); kA = sum(1 for e in MT for x in BOX[e["id"]]["ev"] if x[0] in ("y", "r"))
    LG_H1 = {"h1g": round(g1 / gA, 3) if gA >= 50 else None, "h1k": round(k1 / kA, 3) if kA >= 50 else None, "h1n": len(MT),
             "h1o05": round(sum(1 for e in MT if any(x[0] in ("g", "p", "o") and x[1] <= 45 for x in BOX[e["id"]]["ev"])) / len(MT), 3) if MT else None}
    LG[comp] = {**LG_H1, "m": len(M), "hg": hg, "ag": ag, "conv": ((hg or 0) + (ag or 0)) / sot if sot else None, "hc": hc, "ac": ac, "hk": hk, "ak": ak,
                "cdisp": disp(tot(lambda e: None if tstat(e, e["h"], "wonCorners") is None else tstat(e, e["h"], "wonCorners") + (tstat(e, e["a"], "wonCorners") or 0))),
                "kdisp": disp(tot(lambda e: None if cards(e, e["h"]) is None else cards(e, e["h"]) + (cards(e, e["a"]) or 0))),
                "o25": sum(1 for e in M if e["hs"] + e["as"] > 2.5) / len(M), "btts": sum(1 for e in M if e["hs"] and e["as"]) / len(M),
                "draw": sum(1 for e in M if e["hs"] == e["as"]) / len(M), "hw": sum(1 for e in M if e["hs"] > e["as"]) / len(M)}
    for e in M:
        for tid, opp, gf, ga, home in ((e["h"], e["a"], e["hs"], e["as"], 1), (e["a"], e["h"], e["as"], e["hs"], 0)):
            T = TN.setdefault((comp, tid), {"n": 0, "gf": 0, "ga": 0, "sot": 0, "sota": 0, "sh": 0, "sha": 0, "cf": 0, "ca": 0, "kf": 0, "ka": 0,
                                            "fo": 0, "foa": 0, "nc": 0, "nk": 0, "nf": 0, "ns": 0, "cs": 0, "btts": 0, "o25": 0, "pos": 0, "np": 0, "last": [],
                                            "h1g": 0, "h1all": 0, "h1n": 0, "h1o05": 0})
            T["n"] += 1; T["gf"] += gf; T["ga"] += ga; T["cs"] += ga == 0; T["btts"] += bool(gf and ga); T["o25"] += gf + ga > 2.5
            a1, b1 = tstat(e, tid, "shotsOnTarget"), tstat(e, opp, "shotsOnTarget")
            if a1 is not None and b1 is not None: T["sot"] += a1; T["sota"] += b1; T["ns"] += 1; T["sh"] += tstat(e, tid, "totalShots") or 0; T["sha"] += tstat(e, opp, "totalShots") or 0
            c1, c2 = tstat(e, tid, "wonCorners"), tstat(e, opp, "wonCorners")
            if c1 is not None and c2 is not None: T["cf"] += c1; T["ca"] += c2; T["nc"] += 1
            k1, k2 = cards(e, tid), cards(e, opp)
            if k1 is not None and k2 is not None: T["kf"] += k1; T["ka"] += k2; T["nk"] += 1
            f1, f2 = tstat(e, tid, "foulsCommitted"), tstat(e, opp, "foulsCommitted")
            if f1 is not None and f2 is not None: T["fo"] += f1; T["foa"] += f2; T["nf"] += 1
            p_ = tstat(e, tid, "possessionPct")
            if p_ is not None: T["pos"] += p_; T["np"] += 1
            T["last"].append(e["id"])
            ev = BOX[e["id"]].get("ev") or []
            if sum(1 for x in ev if x[0] in ("g", "p", "o")) == e["hs"] + e["as"] and all(x[1] is not None for x in ev):
                n1 = sum(1 for x in ev if x[0] in ("g", "p", "o") and x[1] <= 45); T["h1g"] += n1; T["h1all"] += e["hs"] + e["as"]; T["h1n"] += 1; T["h1o05"] += n1 > 0

# ---------------- referees (from the odds feed) ----------------
LO = jload(os.path.join(R, "data/live_odds.json"), {}).get("soc") or {}
REFS = LO.get("refs") or {}
REFAVG = {}
for comp, L in REFS.items():
    w = [(x[1] or 0, x[4]) for x in L if x[4] is not None and (x[1] or 0) > 0]
    REFAVG[comp] = sum(a * b for a, b in w) / sum(a for a, b in w) if w else None
def ref_of(comp, name):
    for x in REFS.get(comp) or []:
        if x[0] and name and norm(x[0]) == norm(name): return x
    return None

# ---------------- estimates ----------------
def pois(k, l): return math.exp(-l) * l ** k / math.factorial(k)
def nb_cdf_over(line, mu, disp):
    """P(X > line) for counts with mean mu; Poisson when disp<=1.05 else negative binomial with var = disp*mu"""
    k = int(math.floor(line));
    if mu is None or mu <= 0: return None
    if not disp or disp <= 1.05:
        return 1 - sum(pois(i, mu) for i in range(k + 1))
    r = mu / (disp - 1); p = r / (r + mu); c, pr = 0.0, p ** r
    for i in range(k + 1):
        c += pr; pr *= (i + r) / (i + 1) * (1 - p)
    return 1 - c
def shrink(v, n, k=5): return (v * n + k) / (n + k)
def raw_att(c, T, L):
    lgpg = (L["hg"] + L["ag"]) / 2; conv = L["conv"] or 0.3
    return (0.5 * T["gf"] + 0.5 * (T["sot"] * conv if T["ns"] else T["gf"])) / T["n"] / lgpg
def raw_def(c, T, L):
    lgpg = (L["hg"] + L["ag"]) / 2; conv = L["conv"] or 0.3
    return (0.5 * T["ga"] + 0.5 * (T["sota"] * conv if T["ns"] else T["ga"])) / T["n"] / lgpg
def dom_of(tid):
    for c in (TEAM.get(tid) or {}).get("c") or []:
        if c not in CUPS and (c, tid) in TN and TN[(c, tid)]["n"] >= 5 and c in LG: return c
    return None
# how each domestic league's teams have done in each European cup, relative to their domestic numbers (shrunk to 1)
STR = {}
for cup in CUPS:
    if cup not in LG: continue
    acc = {}
    for (c, tid), T in TN.items():
        if c != cup or T["n"] < 2: continue
        d = dom_of(tid)
        if not d: continue
        D = TN[(d, tid)]; a = acc.setdefault(d, [0, 0, 0, 0])
        a[0] += raw_att(cup, T, LG[cup]) * T["n"]; a[1] += raw_att(d, D, LG[d]) * T["n"]; a[2] += raw_def(cup, T, LG[cup]) * T["n"]; a[3] += raw_def(d, D, LG[d]) * T["n"]
        acc[d + "#n"] = acc.get(d + "#n", 0) + T["n"]
    for d in [k for k in acc if not k.endswith("#n")]:
        a, n = acc[d], acc[d + "#n"]
        STR[(cup, d)] = ((a[0] / a[1]) * n + 10) / (n + 10) if a[1] else 1, ((a[2] / a[3]) * n + 10) / (n + 10) if a[3] else 1
def lams(c, h, a):
    L = LG.get(c); A, B = TN.get((c, h)), TN.get((c, a))
    if not L or L["m"] < 12: return None
    def rating(tid, T, kind):
        raw = raw_att if kind == "a" else raw_def; n = T["n"] if T else 0; v = raw(c, T, L) if T else None
        if c in CUPS:
            d = dom_of(tid)
            if d:   # blend in domestic form, scaled by how that league's teams do in this cup
                s_ = (STR.get((c, d)) or (1, 1))[0 if kind == "a" else 1]; dv = raw(d, TN[(d, tid)], LG[d]) * s_; K = 6
                v = ((v * n if v is not None else 0) + dv * K) / (n + K); n = n + K
        if v is None or n < 3: return None
        return shrink(v, n)
    ah, dh, aa, da = rating(h, A, "a"), rating(h, A, "d"), rating(a, B, "a"), rating(a, B, "d")
    if None in (ah, dh, aa, da): return None
    return L["hg"] * ah * da, L["ag"] * aa * dh, ah, aa, dh, da
# draw correction (Dixon-Coles): low scores (0-0, 1-1, 1-0, 0-1) happen at different rates than independent Poisson says;
# rho fitted on this season's real results across all competitions
def tau(x, y, lh, la, rho):
    if x == 0 and y == 0: return 1 - lh * la * rho
    if x == 0 and y == 1: return 1 + lh * rho
    if x == 1 and y == 0: return 1 + la * rho
    if x == 1 and y == 1: return 1 - rho
    return 1
FIT = [(e["hs"], e["as"], *lams(e["c"], e["h"], e["a"])[:2]) for e in DONE if lams(e["c"], e["h"], e["a"])]
RHO = 0.0
if len(FIT) >= 200:
    best = None
    for k in range(-30, 11):
        r_ = k / 100; ll = sum(math.log(max(1e-9, tau(x, y, lh_, la_, r_))) for x, y, lh_, la_ in FIT)
        if best is None or ll > best[0]: best = (ll, r_)
    RHO = best[1]
log(f"soccer: draw correction rho = {RHO} (fitted on {len(FIT)} matches)")
def project(f):
    c = f["c"]; L = LG.get(c); A, B = TN.get((c, f["h"])), TN.get((c, f["a"]))
    X = lams(c, f["h"], f["a"])
    if not X or not A or not B: return None
    lh, la, ah, aa, dh, da = X
    att = lambda T: ah if T is A else aa
    dfn = lambda T: dh if T is A else da
    P = [[pois(i, lh) * pois(j, la) * tau(i, j, lh, la, RHO) for j in range(11)] for i in range(11)]
    tot_ = sum(map(sum, P)); P = [[q / tot_ for q in row] for row in P]
    p1 = sum(P[i][j] for i in range(11) for j in range(11) if i > j); px = sum(P[i][i] for i in range(11)); p2 = 1 - p1 - px
    ov = {str(x): 1 - sum(P[i][j] for i in range(11) for j in range(11) if i + j <= x - 0.5) for x in (1.5, 2.5, 3.5, 4.5)}
    btts = 1 - sum(P[0][j] for j in range(11)) - sum(P[i][0] for i in range(11)) + P[0][0]
    out = {"rho": RHO, "blend": c in CUPS, "lh": round(lh, 2), "la": round(la, 2), "p": [round(p1, 3), round(px, 3), round(p2, 3)], "o": {k: round(v, 3) for k, v in ov.items()}, "btts": round(btts, 3),
           "att": [round(att(A), 2), round(att(B), 2)], "def": [round(dfn(A), 2), round(dfn(B), 2)], "n": [A["n"], B["n"]]}
    # first half: the league's share of goals before half-time, nudged by these two teams' own share (shrunk hard)
    if L.get("h1g"):
        def sh1(T): return ((T["h1g"] / T["h1all"]) * T["h1all"] + L["h1g"] * 12) / (T["h1all"] + 12) if T["h1all"] else L["h1g"]
        s1 = (sh1(A) + sh1(B)) / 2; l1h, l1a = lh * s1, la * s1
        Q = [[pois(i, l1h) * pois(j, l1a) for j in range(8)] for i in range(8)]
        out["h1"] = {"lh": round(l1h, 2), "la": round(l1a, 2), "share": round(s1, 3),
                     "p": [round(sum(Q[i][j] for i in range(8) for j in range(8) if i > j), 3), round(sum(Q[i][i] for i in range(8)), 3), round(sum(Q[i][j] for i in range(8) for j in range(8) if i < j), 3)],
                     "o": {str(x): round(1 - sum(Q[i][j] for i in range(8) for j in range(8) if i + j <= x - 0.5), 3) for x in (0.5, 1.5, 2.5)},
                     "btts": round((1 - pois(0, l1h)) * (1 - pois(0, l1a)), 3)}
    out["tt"] = {"h": {str(x): round(1 - sum(pois(i, lh) for i in range(int(x) + 1)), 3) for x in (0.5, 1.5, 2.5, 3.5)},
                 "a": {str(x): round(1 - sum(pois(i, la) for i in range(int(x) + 1)), 3) for x in (0.5, 1.5, 2.5, 3.5)}}
    # corners
    if A["nc"] >= 3 and B["nc"] >= 3 and L["hc"] and L["ac"]:
        lc = (L["hc"] + L["ac"]) / 2
        ch = L["hc"] * shrink(A["cf"] / A["nc"] / lc, A["nc"]) * shrink(B["ca"] / B["nc"] / lc, B["nc"])
        ca = L["ac"] * shrink(B["cf"] / B["nc"] / lc, B["nc"]) * shrink(A["ca"] / A["nc"] / lc, A["nc"])
        out["cor"] = {"h": round(ch, 2), "a": round(ca, 2), "t": round(ch + ca, 2), "disp": L["cdisp"],
                      "o": {str(x): round(nb_cdf_over(x, ch + ca, L["cdisp"]), 3) for x in (7.5, 8.5, 9.5, 10.5, 11.5, 12.5)},
                      "ho": {str(x): round(nb_cdf_over(x, ch, L["cdisp"]), 3) for x in (2.5, 3.5, 4.5, 5.5, 6.5)},
                      "ao": {str(x): round(nb_cdf_over(x, ca, L["cdisp"]), 3) for x in (2.5, 3.5, 4.5, 5.5, 6.5)},
                      "more": [round(sum(pois(i, ch) * pois(j, ca) for i in range(25) for j in range(25) if i > j), 3), round(sum(pois(i, ch) * pois(i, ca) for i in range(25)), 3), round(sum(pois(i, ch) * pois(j, ca) for i in range(25) for j in range(25) if i < j), 3)]}
    # cards (yellow + red), adjusted for the referee when he's known
    if A["nk"] >= 3 and B["nk"] >= 3 and L["hk"] and L["ak"]:
        lk = (L["hk"] + L["ak"]) / 2
        kh = L["hk"] * shrink(A["kf"] / A["nk"] / lk, A["nk"]) * shrink(B["ka"] / B["nk"] / lk, B["nk"])
        ka = L["ak"] * shrink(B["kf"] / B["nk"] / lk, B["nk"]) * shrink(A["ka"] / A["nk"] / lk, A["nk"])
        rf, rx = 1.0, ref_of(c, f.get("ref"))
        if rx and rx[4] and REFAVG.get(c): rf = ((rx[1] or 0) * rx[4] / REFAVG[c] + 8) / ((rx[1] or 0) + 8)
        t = (kh + ka) * rf
        out["card"] = {"h": round(kh * rf, 2), "a": round(ka * rf, 2), "t": round(t, 2), "rf": round(rf, 3), "disp": L["kdisp"],
                       "o": {str(x): round(nb_cdf_over(x, t, L["kdisp"]), 3) for x in (2.5, 3.5, 4.5, 5.5, 6.5)},
                       "ho": {str(x): round(nb_cdf_over(x, kh * rf, None), 3) for x in (0.5, 1.5, 2.5, 3.5)},
                       "ao": {str(x): round(nb_cdf_over(x, ka * rf, None), 3) for x in (0.5, 1.5, 2.5, 3.5)}}
        if L.get("h1k"): t1 = t * L["h1k"]; out["card"]["h1"] = {"t": round(t1, 2), "share": L["h1k"], "o": {str(x): round(nb_cdf_over(x, t1, None), 3) for x in (0.5, 1.5, 2.5)}}
    return out

# ---------------- upcoming fixtures: odds join, weather, lineups, missing players ----------------
FX = sorted([e for e in EV.values() if not e["done"] and ts(e["t"]) > NOW - dt.timedelta(hours=3) and ts(e["t"]) < NOW + dt.timedelta(days=16)], key=lambda e: e["t"])
# playoff slots whose teams aren't decided yet (ESPN names them "TBD Home" / "TBD Away"): no real matchup, so no estimate
TBD = {k for k, T in TEAM.items() if str((T or {}).get("n", "")).upper().startswith("TBD")}
FX = [f for f in FX if f["h"] not in TBD and f["a"] not in TBD and not str(f.get("hn", "")).upper().startswith("TBD") and not str(f.get("an", "")).upper().startswith("TBD")]
OD = LO.get("events") or []
for f in FX:
    m_ = [o for o in OD if o.get("hid") == f["h"] and o.get("aid") == f["a"] and abs((ts(o["start"]) - ts(f["t"])).total_seconds()) < 6 * 3600]
    if m_:
        o = m_[0]; f["pid"] = o["pid"]
        f["odds"] = {k: o[k] for k in ("ml", "tot", "main_tot", "btts", "ah", "cor", "main_cor", "ttot", "extra", "open", "at", "h1") if k in o}
        if o.get("ref"): f["ref"] = o["ref"]
# weather (Open-Meteo), fixtures in the next 7 days, one forecast per city
GEOF = os.path.join(R, "data/soccer_geo.json"); GEO = jload(GEOF, {})
CC = {"England": "GB", "Scotland": "GB", "Wales": "GB", "Spain": "ES", "Italy": "IT", "Germany": "DE", "France": "FR", "Netherlands": "NL",
      "Portugal": "PT", "Belgium": "BE", "Turkey": "TR", "Türkiye": "TR", "Greece": "GR", "Austria": "AT", "Switzerland": "CH", "Denmark": "DK",
      "Norway": "NO", "Sweden": "SE", "Poland": "PL", "Czechia": "CZ", "Czech Republic": "CZ", "Croatia": "HR", "Serbia": "RS", "Scotland ": "GB",
      "Ukraine": "UA", "Cyprus": "CY", "Israel": "IL", "Hungary": "HU", "Romania": "RO", "Bulgaria": "BG", "Slovakia": "SK", "Slovenia": "SI",
      "Ireland": "IE", "Northern Ireland": "GB", "USA": "US", "United States": "US", "Canada": "CA", "Kazakhstan": "KZ", "Azerbaijan": "AZ", "Finland": "FI", "Iceland": "IS", "Moldova": "MD", "Armenia": "AM"}
WX = {}
for f in FX:
    if not f.get("city") or ts(f["t"]) > NOW + dt.timedelta(days=15): continue   # Open-Meteo forecasts reach 16 days
    key = f"{f['city']}|{f.get('ctry') or ''}"
    if key not in GEO:
        nm, _, hint = f["city"].partition(",")   # ESPN gives "Orlando, Florida" / "London, England": search the town, use the rest as a hint
        r_ = get("https://geocoding-api.open-meteo.com/v1/search?count=10&name=" + urllib.parse.quote(nm.strip()))
        res = (r_ or {}).get("results") or []; hint = hint.strip(); cc = CC.get(f.get("ctry") or "") or CC.get(hint)
        pick = next((x for x in res if hint and hint in (x.get("admin1"), x.get("country"))), None) or next((x for x in res if cc and x.get("country_code") == cc), None) or (res[0] if res else None)
        GEO[key] = [pick["latitude"], pick["longitude"]] if pick else None
    if not GEO.get(key): continue
    if key not in WX:
        la, lo = GEO[key]
        WX[key] = get(f"https://api.open-meteo.com/v1/forecast?latitude={la}&longitude={lo}&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code,wind_gusts_10m,snowfall&forecast_days=16&timezone=UTC") or {}
    h = WX[key].get("hourly") or {}; tt = ts(f["t"]).replace(minute=0, second=0); k = tt.strftime("%Y-%m-%dT%H:%M")
    if k in (h.get("time") or []):
        i = h["time"].index(k)
        f["wx"] = [h["temperature_2m"][i], h["precipitation_probability"][i], h["precipitation"][i], h["wind_speed_10m"][i], h["weather_code"][i],
                   max([x for x in (h.get("wind_gusts_10m") or [])[i:i + 2] if x is not None] or [0]), round(sum(x for x in (h.get("snowfall") or [])[i:i + 2] if x is not None), 1)]   # + gusts, snow (cm) over the 2 match hours
json.dump(GEO, open(GEOF, "w"), separators=(",", ":"), ensure_ascii=False)
# confirmed lineups (posted ~1 hour before kickoff) for matches in the next 3 hours — the game-day check re-runs this
# ~60 and ~10-45 minutes before kickoff, so late changes (warm-up injuries) are picked up
for f in FX:
    if ts(f["t"]) - NOW > dt.timedelta(hours=3): continue
    sm = get(f"{S}{f['slug']}/summary?event={f['id']}")
    lu = {}
    for side in (sm or {}).get("rosters") or []:
        tid = (side.get("team") or {}).get("id"); R_ = side.get("roster") or []
        xi = [[(p.get("athlete") or {}).get("displayName"), (p.get("position") or {}).get("abbreviation") or "", (p.get("athlete") or {}).get("id")] for p in R_ if p.get("starter")]
        sub = [(p.get("athlete") or {}).get("displayName") for p in R_ if not p.get("starter")]
        if len(xi) >= 11: lu[tid] = {"xi": xi, "sub": sub}
    if len(lu) == 2: f["lu"] = lu
# player logs
PL = {}
for e in DONE:
    for row in BOX[e["id"]]["p"]:
        tid, aid, nm, pos, stt, mins = row[:6]; v = row[6:]
        P = PL.setdefault(aid, {"n": nm, "t": tid, "pos": "" if pos == "SUB" else pos, "g": []})
        P["t"] = tid; P["pos"] = pos if pos and pos != "SUB" else P["pos"]
        P["g"].append([e["id"], stt, mins] + v + [pos or ""])   # last field: his position in that match (for the lineup view)
# missing regulars / red-card bans for each fixture team
def team_players(tid):
    return {aid: P for aid, P in PL.items() if P["t"] == tid}
for f in FX:
    miss = {}
    for tid in (f["h"], f["a"]):
        Ls = [e for e in DONE if tid in (e["h"], e["a"])][-7:]
        if len(Ls) < 4: continue
        last = Ls[-1]; last2 = Ls[-2:]; prior = Ls[:-2]
        in2 = {r[1] for e in last2 for r in BOX[e["id"]]["p"] if r[0] == tid}
        pids = {e["id"] for e in prior}
        out = []
        for aid, P in team_players(tid).items():
            starts = sum(1 for g_ in P["g"] if g_[0] in pids and g_[1] == 1)
            lg_ = next((g_ for g_ in P["g"] if g_[0] == last["id"]), None)
            if lg_ and lg_[10] > 0: out.append([P["n"], "red", "Sent off last match — likely suspended"])
            elif starts >= max(3, len(prior) - 1) and aid not in in2: out.append([P["n"], "miss", f"Started {starts} of {len(prior)} before, missed the last 2 matches"])
        if out: miss[tid] = out
    if miss: f["miss"] = miss
for f in FX: f["proj"] = project(f)

# ---------------- head to head: this season + the last 3 seasons (team schedules, cached for good) ----------------
SCHF = os.path.join(R, "data/soccer_sched.json"); SCH = jload(SCHF, {})
SLUG = {c[0]: c[1] for c in COMPS}; COMP_OF = {c[1]: c[0] for c in COMPS}
def sched(slug, tid, yr):
    k = f"{slug}|{tid}|{yr}"
    if k in SCH: return SCH[k]
    j = get(f"{S}{slug}/teams/{tid}/schedule?season={yr}")
    rows = []
    for e in (j or {}).get("events", []):
        try:
            c = e["competitions"][0]
            if not ((c.get("status") or e.get("status") or {}).get("type") or {}).get("completed"): continue
            H = next(x for x in c["competitors"] if x["homeAway"] == "home"); A = next(x for x in c["competitors"] if x["homeAway"] == "away")
            sc = lambda x: int((x.get("score") or {}).get("value") if isinstance(x.get("score"), dict) else x.get("score"))
            rows.append([e["id"], e["date"][:16], H["team"]["id"], A["team"]["id"], sc(H), sc(A),
                         [H["team"].get("displayName"), H["team"].get("abbreviation"), H["team"].get("color")], [A["team"].get("displayName"), A["team"].get("abbreviation"), A["team"].get("color")]])
        except Exception: pass
    if j is not None and yr < SEASON0.year: SCH[k] = rows    # finished seasons never change: keep for good
    return rows
H2H, OLD_IDS = {}, {}
for f in FX:
    if f["c"] in ("ucl", "uel", "uecl"): slugs = [SLUG[f["c"]]]
    else: slugs = [SLUG[f["c"]]]
    meet = [[e["id"], e["t"][:16], e["h"], e["a"], e["hs"], e["as"], e["c"]] for e in DONE if {e["h"], e["a"]} == {f["h"], f["a"]}]
    for slug in slugs:
        for yr in (SEASON0.year - 1, SEASON0.year - 2, SEASON0.year - 3):
            for r in sched(slug, f["h"], yr):
                if {r[2], r[3]} == {f["h"], f["a"]} and r[0] not in {m[0] for m in meet}: meet.append(r[:6] + [COMP_OF.get(slug, f["c"])])
                for tid, nm in ((r[2], r[6] if len(r) > 6 else None), (r[3], r[7] if len(r) > 7 else None)):
                    if nm and tid not in TEAM: TEAM[tid] = {"n": nm[0], "s": nm[0], "ab": nm[1] or "?", "col": "#" + (nm[2] or "555555"), "c": []}
    meet.sort(key=lambda r: r[1], reverse=True)
    if meet:
        H2H[f["id"]] = [m[0] for m in meet[:8]]
        for m in meet[:6]:
            if m[0] not in EV: OLD_IDS[m[0]] = m
json.dump(SCH, open(SCHF, "w"), separators=(",", ":"), ensure_ascii=False)
# ---------------- each team's next league fixtures (for the "upcoming schedule" strip); cached 12 h per team ----------------
NXF = os.path.join(R, "data/soccer_next.json"); NX = jload(NXF, {}); NEXT = {}; nreq = 0
for f in FX:
    for tid in (f["h"], f["a"]):
        k = f'{f["c"]}|{tid}'
        if k in NEXT: continue
        c0 = NX.get(k)
        if c0 and not c0.get("v2"): c0 = None
        if not c0 or (NOW - dt.datetime.fromisoformat(c0["at"])).total_seconds() > 12 * 3600:
            if nreq >= 80: 
                if c0: NEXT[k] = c0["g"]
                continue
            j = get(f"{S}{SLUG[f['c']]}/teams/{tid}/schedule?fixture=true"); nreq += 1; rows = []
            for e in (j or {}).get("events", []):
                try:
                    c = e["competitions"][0]
                    if ((c.get("status") or e.get("status") or {}).get("type") or {}).get("completed"): continue
                    H = next(x for x in c["competitors"] if x["homeAway"] == "home"); A = next(x for x in c["competitors"] if x["homeAway"] == "away")
                    rows.append([e["id"], e["date"][:16], H["team"]["id"], A["team"]["id"]])
                except Exception: pass
            if j is not None: NX[k] = c0 = {"at": NOW.isoformat(), "g": rows[:8], "v2": 1}
        if c0: NEXT[k] = c0["g"]
json.dump(NX, open(NXF, "w"), separators=(",", ":"), ensure_ascii=False)

# box scores for the older meetings (downloaded once, cached with the rest)
oneed = [m for m in OLD_IDS.values() if (BOX.get(m[0]) or {}).get("v") != 3]
def old_box(m):
    return parse_box({"id": m[0], "slug": SLUG.get(m[6], "eng.1")})
with ThreadPoolExecutor(8) as ex:
    for m, b in zip(oneed, ex.map(old_box, oneed)):
        if b: b["old"] = 1; BOX[m[0]] = b
json.dump(BOX, open(BOXF, "w"), separators=(",", ":"), ensure_ascii=False)
OLD = [[m[0], m[1], m[6], m[2], m[3], m[4], m[5], (BOX.get(m[0]) or {}).get("ts", {}).get(m[2]), (BOX.get(m[0]) or {}).get("ts", {}).get(m[3]), (BOX.get(m[0]) or {}).get("ev", [])] for m in OLD_IDS.values()]
for m in OLD_IDS.values():
    for tid in (m[2], m[3]):
        if tid not in TEAM: TEAM[tid] = {"n": tid, "s": tid, "ab": "?", "col": "#555555", "c": []}
log(f"soccer: head to head for {len(H2H)} fixtures, {len(OLD)} older meetings ({len(oneed)} new box scores)")

# ---------------- props join ----------------
def find_player(name, tids):
    n = norm(name); c = [(aid, P) for aid, P in PL.items() if P["t"] in tids]
    for aid, P in c:
        if norm(P["n"]) == n: return aid
    last = n.split()[-1] if n else ""
    c2 = [aid for aid, P in c if norm(P["n"]).split()[-1:] == [last] and norm(P["n"])[:1] == n[:1]]
    return c2[0] if len(c2) == 1 else None
PROPS = []
byp = {f.get("pid"): f for f in FX if f.get("pid")}
for r in LO.get("props") or []:
    f = byp.get(r[5])
    if not f: continue
    aid = find_player(r[0], (f["h"], f["a"]))
    PROPS.append([r[0], r[1], r[2], r[3], r[4], f["id"], r[6], aid])

# ---------------- output ----------------
def tnum(c, tid):
    T = TN.get((c, tid))
    if not T: return None
    d = lambda a, b: round(a / b, 2) if b else None
    return [T["n"], T["gf"], T["ga"], d(T["sh"], T["ns"]), d(T["sot"], T["ns"]), d(T["sha"], T["ns"]), d(T["sota"], T["ns"]), d(T["cf"], T["nc"]), d(T["ca"], T["nc"]),
            d(T["kf"], T["nk"]), d(T["ka"], T["nk"]), d(T["fo"], T["nf"]), d(T["foa"], T["nf"]), T["cs"], T["btts"], T["o25"], d(T["pos"], T["np"]),
            d(T["h1g"], T["h1n"]), T["h1o05"], T["h1n"]]
used = {f["h"] for f in FX} | {f["a"] for f in FX} | {r[0] for L in ST.values() for r in L} | {t for m in OLD_IDS.values() for t in (m[2], m[3])}
RES = [[e["id"], e["t"][:16], e["c"], e["h"], e["a"], e["hs"], e["as"], BOX[e["id"]]["ts"].get(e["h"]), BOX[e["id"]]["ts"].get(e["a"]),
        BOX[e["id"]].get("ev", [])] for e in DONE]
# player logs are split by each team's domestic league (cup-only teams together) so a page loads only what it shows
def pkey(tid):
    for c in (TEAM.get(tid) or {}).get("c") or []:
        if c not in CUPS: return c
    return "cups"
PFILES = {}
for aid, P in PL.items(): PFILES.setdefault(pkey(P["t"]), {})[aid] = [P["n"], P["t"], P["pos"], P["g"]]
out = {
  "SOC_GEN": NOW.astimezone(ZoneInfo("America/Toronto")).strftime("%a %b %-d %-I:%M %p ET"),
  "SOC_LG": {c[0]: {"n": c[2], "sh": c[3], "col": c[4], **({k: (round(v, 3) if isinstance(v, float) else v) for k, v in LG[c[0]].items()} if c[0] in LG else {})} for c in COMPS},
  "SOC_TM": {tid: [T["n"], T["s"], T["ab"], T["col"], T["c"]] for tid, T in TEAM.items() if tid in used or any(tid in (e["h"], e["a"]) for e in DONE)},
  "SOC_TN": {f"{c}|{tid}": tnum(c, tid) for (c, tid) in TN},
  "SOC_RES": RES,
  "SOC_FX": [{k: f[k] for k in ("id", "t", "c", "h", "a", "ven", "city", "state", "detail", "pid", "odds", "ref", "wx", "lu", "miss", "proj", "hs", "as") if f.get(k) is not None} for f in FX],
  "SOC_ST": ST,
  "SOC_REF": {c: [x[:5] for x in L] for c, L in REFS.items()},
  "SOC_PROPS": PROPS,
  "SOC_H2H": H2H,
  "SOC_OLD": OLD,
  "SOC_ODDS_AT": LO.get("at"),
  "SOC_PFILES": {k: len(v) for k, v in sorted(PFILES.items())},
}
print("/* ⚽ Soccer — tools/soccerfetch.py (ESPN results + box scores, PropLine odds + referees, Open-Meteo weather) */")
for k, v in out.items(): print(f"var {k}=" + json.dumps(v, separators=(",", ":"), ensure_ascii=False) + ";")
print("var SOC_OK=1;")
print("var SOC_NEXT=" + json.dumps(NEXT, separators=(",", ":"), ensure_ascii=False) + ";  /* league|team -> next league fixtures [id, date, home id, away id] */")
import glob
for old in glob.glob("soccer_p_*.js"): os.remove(old)
for k, D in PFILES.items():
    with open(f"soccer_p_{k}.js", "w", encoding="utf8") as fh:
        fh.write(f"/* ⚽ {k} player game logs — tools/soccerfetch.py. g: [match id, started, minutes, shots, on target, goals, assists, fouls committed, fouls won, yellow, red, saves, position] */\n")
        fh.write(f"SOC_PADD({json.dumps(k)}," + json.dumps(D, separators=(",", ":"), ensure_ascii=False) + ");\n")
with open("soccer_old.js", "w", encoding="utf8") as fh:
    fh.write("/* players in older head-to-head matches: match id -> [team, espn id, name, pos, started, minutes, shots, on target, goals, assists, fouls, fouled, yellow, red, saves] */\n")
    fh.write("SOC_OLDADD(" + json.dumps({m[0]: (BOX.get(m[0]) or {}).get("p", []) for m in OLD_IDS.values()}, separators=(",", ":"), ensure_ascii=False) + ");\n")
if os.path.exists("soccer_players.js"): os.remove("soccer_players.js")
log(f"soccer: {len(FX)} upcoming matches ({sum(1 for f in FX if f.get('odds'))} with odds, {sum(1 for f in FX if f.get('proj'))} with estimates, "
    f"{sum(1 for f in FX if f.get('wx'))} with weather, {sum(1 for f in FX if f.get('ref'))} with referee), {len(PROPS)} player props, {len(PL)} players")
