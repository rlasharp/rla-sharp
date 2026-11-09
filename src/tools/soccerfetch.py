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
         ("uel", "uefa.europa", "Europa League", "UEL", "#f68e00"), ("uecl", "uefa.europa.conf", "Conference League", "UECL", "#19b25b")]
S = "https://site.api.espn.com/apis/site/v2/sports/soccer/"
SEASON0 = dt.datetime(NOW.year if NOW.month >= 7 else NOW.year - 1, 7, 1, tzinfo=dt.timezone.utc)
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
months, m = [], dt.date(SEASON0.year, 8 if SEASON0.month <= 8 else SEASON0.month, 1)
end = (NOW + dt.timedelta(days=17)).date()
while m <= end:
    months.append(m.strftime("%Y%m")); m = dt.date(m.year + (m.month == 12), m.month % 12 + 1, 1)
TEAM, EV = {}, {}
def sb_job(args):
    comp, slug, mo = args; return comp, slug, get(f"{S}{slug}/scoreboard?dates={mo}&limit=200")
with ThreadPoolExecutor(8) as ex:
    for comp, slug, sb in ex.map(sb_job, [(c[0], c[1], mo) for c in COMPS for mo in months]):
        for e in (sb or {}).get("events", []):
            try:
                t = ts(e["date"])
                if t < SEASON0: continue
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
    out = {"v": 2, "ts": {}, "p": [], "ev": []}
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
            out["ev"].append(["g", mn, ((k.get("team") or {}).get("id"))])
        elif "card" in ty:
            out["ev"].append(["r" if "red" in ty else "y", mn, ((k.get("team") or {}).get("id"))])
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
need = [e for e in EV.values() if e["done"] and (BOX.get(e["id"]) or {}).get("v") != 2]
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
    LG[comp] = {"n": len(M), "hg": hg, "ag": ag, "conv": ((hg or 0) + (ag or 0)) / sot if sot else None, "hc": hc, "ac": ac, "hk": hk, "ak": ak,
                "cdisp": disp(tot(lambda e: None if tstat(e, e["h"], "wonCorners") is None else tstat(e, e["h"], "wonCorners") + (tstat(e, e["a"], "wonCorners") or 0))),
                "kdisp": disp(tot(lambda e: None if cards(e, e["h"]) is None else cards(e, e["h"]) + (cards(e, e["a"]) or 0))),
                "o25": sum(1 for e in M if e["hs"] + e["as"] > 2.5) / len(M), "btts": sum(1 for e in M if e["hs"] and e["as"]) / len(M),
                "draw": sum(1 for e in M if e["hs"] == e["as"]) / len(M), "hw": sum(1 for e in M if e["hs"] > e["as"]) / len(M)}
    for e in M:
        for tid, opp, gf, ga, home in ((e["h"], e["a"], e["hs"], e["as"], 1), (e["a"], e["h"], e["as"], e["hs"], 0)):
            T = TN.setdefault((comp, tid), {"n": 0, "gf": 0, "ga": 0, "sot": 0, "sota": 0, "sh": 0, "sha": 0, "cf": 0, "ca": 0, "kf": 0, "ka": 0,
                                            "fo": 0, "foa": 0, "nc": 0, "nk": 0, "nf": 0, "ns": 0, "cs": 0, "btts": 0, "o25": 0, "pos": 0, "np": 0, "last": []})
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
def project(f):
    c = f["c"]; L = LG.get(c); A, B = TN.get((c, f["h"])), TN.get((c, f["a"]))
    if not L or not A or not B or A["n"] < 3 or B["n"] < 3 or L["n"] < 12: return None
    lgpg = (L["hg"] + L["ag"]) / 2; conv = L["conv"] or 0.3
    def att(T): return shrink((0.5 * T["gf"] + 0.5 * (T["sot"] * conv if T["ns"] else T["gf"])) / T["n"] / lgpg, T["n"])
    def dfn(T): return shrink((0.5 * T["ga"] + 0.5 * (T["sota"] * conv if T["ns"] else T["ga"])) / T["n"] / lgpg, T["n"])
    lh, la = L["hg"] * att(A) * dfn(B), L["ag"] * att(B) * dfn(A)
    P = [[pois(i, lh) * pois(j, la) for j in range(11)] for i in range(11)]
    p1 = sum(P[i][j] for i in range(11) for j in range(11) if i > j); px = sum(P[i][i] for i in range(11)); p2 = 1 - p1 - px
    ov = {str(x): 1 - sum(P[i][j] for i in range(11) for j in range(11) if i + j <= x - 0.5) for x in (1.5, 2.5, 3.5, 4.5)}
    btts = (1 - pois(0, lh)) * (1 - pois(0, la))
    out = {"lh": round(lh, 2), "la": round(la, 2), "p": [round(p1, 3), round(px, 3), round(p2, 3)], "o": {k: round(v, 3) for k, v in ov.items()}, "btts": round(btts, 3),
           "att": [round(att(A), 2), round(att(B), 2)], "def": [round(dfn(A), 2), round(dfn(B), 2)], "n": [A["n"], B["n"]]}
    # corners
    if A["nc"] >= 3 and B["nc"] >= 3 and L["hc"] and L["ac"]:
        lc = (L["hc"] + L["ac"]) / 2
        ch = L["hc"] * shrink(A["cf"] / A["nc"] / lc, A["nc"]) * shrink(B["ca"] / B["nc"] / lc, B["nc"])
        ca = L["ac"] * shrink(B["cf"] / B["nc"] / lc, B["nc"]) * shrink(A["ca"] / A["nc"] / lc, A["nc"])
        out["cor"] = {"h": round(ch, 2), "a": round(ca, 2), "t": round(ch + ca, 2), "disp": L["cdisp"],
                      "o": {str(x): round(nb_cdf_over(x, ch + ca, L["cdisp"]), 3) for x in (7.5, 8.5, 9.5, 10.5, 11.5, 12.5)}}
    # cards (yellow + red), adjusted for the referee when he's known
    if A["nk"] >= 3 and B["nk"] >= 3 and L["hk"] and L["ak"]:
        lk = (L["hk"] + L["ak"]) / 2
        kh = L["hk"] * shrink(A["kf"] / A["nk"] / lk, A["nk"]) * shrink(B["ka"] / B["nk"] / lk, B["nk"])
        ka = L["ak"] * shrink(B["kf"] / B["nk"] / lk, B["nk"]) * shrink(A["ka"] / A["nk"] / lk, A["nk"])
        rf, rx = 1.0, ref_of(c, f.get("ref"))
        if rx and rx[4] and REFAVG.get(c): rf = ((rx[1] or 0) * rx[4] / REFAVG[c] + 8) / ((rx[1] or 0) + 8)
        t = (kh + ka) * rf
        out["card"] = {"h": round(kh * rf, 2), "a": round(ka * rf, 2), "t": round(t, 2), "rf": round(rf, 3), "disp": L["kdisp"],
                       "o": {str(x): round(nb_cdf_over(x, t, L["kdisp"]), 3) for x in (2.5, 3.5, 4.5, 5.5, 6.5)}}
    return out

# ---------------- upcoming fixtures: odds join, weather, lineups, missing players ----------------
FX = sorted([e for e in EV.values() if not e["done"] and ts(e["t"]) > NOW - dt.timedelta(hours=3) and ts(e["t"]) < NOW + dt.timedelta(days=16)], key=lambda e: e["t"])
OD = LO.get("events") or []
for f in FX:
    m_ = [o for o in OD if o.get("hid") == f["h"] and o.get("aid") == f["a"] and abs((ts(o["start"]) - ts(f["t"])).total_seconds()) < 6 * 3600]
    if m_:
        o = m_[0]; f["pid"] = o["pid"]
        f["odds"] = {k: o[k] for k in ("ml", "tot", "main_tot", "btts", "ah", "cor", "main_cor", "ttot", "extra", "open", "at") if k in o}
        if o.get("ref"): f["ref"] = o["ref"]
# weather (Open-Meteo), fixtures in the next 7 days, one forecast per city
GEOF = os.path.join(R, "data/soccer_geo.json"); GEO = jload(GEOF, {})
CC = {"England": "GB", "Scotland": "GB", "Wales": "GB", "Spain": "ES", "Italy": "IT", "Germany": "DE", "France": "FR", "Netherlands": "NL",
      "Portugal": "PT", "Belgium": "BE", "Turkey": "TR", "Türkiye": "TR", "Greece": "GR", "Austria": "AT", "Switzerland": "CH", "Denmark": "DK",
      "Norway": "NO", "Sweden": "SE", "Poland": "PL", "Czechia": "CZ", "Czech Republic": "CZ", "Croatia": "HR", "Serbia": "RS", "Scotland ": "GB",
      "Ukraine": "UA", "Cyprus": "CY", "Israel": "IL", "Hungary": "HU", "Romania": "RO", "Bulgaria": "BG", "Slovakia": "SK", "Slovenia": "SI",
      "Ireland": "IE", "Northern Ireland": "GB", "Kazakhstan": "KZ", "Azerbaijan": "AZ", "Finland": "FI", "Iceland": "IS", "Moldova": "MD", "Armenia": "AM"}
WX = {}
for f in FX:
    if not f.get("city") or ts(f["t"]) > NOW + dt.timedelta(days=7): continue
    key = f"{f['city']}|{f.get('ctry') or ''}"
    if key not in GEO:
        r_ = get("https://geocoding-api.open-meteo.com/v1/search?count=5&name=" + urllib.parse.quote(f["city"]))
        res = (r_ or {}).get("results") or []; cc = CC.get(f.get("ctry") or "")
        pick = next((x for x in res if cc and x.get("country_code") == cc), res[0] if res else None)
        GEO[key] = [pick["latitude"], pick["longitude"]] if pick else None
    if not GEO.get(key): continue
    if key not in WX:
        la, lo = GEO[key]
        WX[key] = get(f"https://api.open-meteo.com/v1/forecast?latitude={la}&longitude={lo}&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code&forecast_days=8&timezone=UTC") or {}
    h = WX[key].get("hourly") or {}; tt = ts(f["t"]).replace(minute=0, second=0); k = tt.strftime("%Y-%m-%dT%H:%M")
    if k in (h.get("time") or []):
        i = h["time"].index(k)
        f["wx"] = [h["temperature_2m"][i], h["precipitation_probability"][i], h["precipitation"][i], h["wind_speed_10m"][i], h["weather_code"][i]]
json.dump(GEO, open(GEOF, "w"), separators=(",", ":"), ensure_ascii=False)
# lineups (posted ~1 hour before kickoff) for matches in the next 3 hours
for f in FX:
    if ts(f["t"]) - NOW > dt.timedelta(hours=3): continue
    sm = get(f"{S}{f['slug']}/summary?event={f['id']}")
    lu = {}
    for side in (sm or {}).get("rosters") or []:
        tid = (side.get("team") or {}).get("id"); xi = [((p.get("athlete") or {}).get("displayName")) for p in side.get("roster") or [] if p.get("starter")]
        if len(xi) >= 11: lu[tid] = xi
    if len(lu) == 2: f["lu"] = lu
# player logs
PL = {}
for e in DONE:
    for row in BOX[e["id"]]["p"]:
        tid, aid, nm, pos, stt, mins = row[:6]; v = row[6:]
        P = PL.setdefault(aid, {"n": nm, "t": tid, "pos": pos, "g": []})
        P["t"] = tid; P["pos"] = pos or P["pos"]
        P["g"].append([e["id"], stt, mins] + v)
# missing regulars / red-card bans for each fixture team
def team_players(tid):
    return {aid: P for aid, P in PL.items() if P["t"] == tid}
for f in FX:
    miss = {}
    for tid in (f["h"], f["a"]):
        Ls = [e for e in DONE if tid in (e["h"], e["a"])][-6:]
        if len(Ls) < 3: continue
        last = Ls[-1]; inlast = {r[1] for r in BOX[last["id"]]["p"] if r[0] == tid}
        out = []
        for aid, P in team_players(tid).items():
            starts = sum(1 for g_ in P["g"] if g_[0] in {e["id"] for e in Ls[:-1]} and g_[1] == 1)
            lg_ = next((g_ for g_ in P["g"] if g_[0] == last["id"]), None)
            if lg_ and lg_[10] > 0: out.append([P["n"], "red", "Sent off last match — likely suspended"])
            elif starts >= 3 and aid not in inlast: out.append([P["n"], "miss", f"Started {starts} of the {len(Ls) - 1} matches before, not in the squad last match"])
        if out: miss[tid] = out
    if miss: f["miss"] = miss
for f in FX: f["proj"] = project(f)

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
            d(T["kf"], T["nk"]), d(T["ka"], T["nk"]), d(T["fo"], T["nf"]), d(T["foa"], T["nf"]), T["cs"], T["btts"], T["o25"], d(T["pos"], T["np"])]
used = {f["h"] for f in FX} | {f["a"] for f in FX} | {r[0] for L in ST.values() for r in L}
RES = [[e["id"], e["t"][:16], e["c"], e["h"], e["a"], e["hs"], e["as"], BOX[e["id"]]["ts"].get(e["h"]), BOX[e["id"]]["ts"].get(e["a"]),
        [x for x in BOX[e["id"]].get("ev", []) if x[0] in ("g",)]] for e in DONE]
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
  "SOC_ODDS_AT": LO.get("at"),
}
print("/* ⚽ Soccer — tools/soccerfetch.py (ESPN results + box scores, PropLine odds + referees, Open-Meteo weather) */")
for k, v in out.items(): print(f"var {k}=" + json.dumps(v, separators=(",", ":"), ensure_ascii=False) + ";")
print("var SOC_OK=1;")
with open("soccer_players.js", "w", encoding="utf8") as fh:
    fh.write("/* ⚽ Soccer player game logs — tools/soccerfetch.py. g: [match id, started, minutes, shots, on target, goals, assists, fouls committed, fouls won, yellow, red, saves] */\n")
    fh.write("var SOC_P=" + json.dumps({aid: [P["n"], P["t"], P["pos"], P["g"]] for aid, P in PL.items()}, separators=(",", ":"), ensure_ascii=False) + ";var SOC_P_OK=1;\n")
log(f"soccer: {len(FX)} upcoming matches ({sum(1 for f in FX if f.get('odds'))} with odds, {sum(1 for f in FX if f.get('proj'))} with estimates, "
    f"{sum(1 for f in FX if f.get('wx'))} with weather, {sum(1 for f in FX if f.get('ref'))} with referee), {len(PROPS)} player props, {len(PL)} players")
