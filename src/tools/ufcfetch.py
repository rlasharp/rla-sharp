#!/usr/bin/env python3
"""🥊 UFC data for the site — ESPN's public MMA feeds (no key).
usage: python3 tools/ufcfetch.py <repo root> > ufc_data.js
  · upcoming cards (next ~5 events) and recent results (last ~10 events) from the UFC scoreboard
  · every fighter on those cards: bio (age, height, reach, stance), record, wins / losses by KO, submission, decision
  · each fighter's last 10 fights, with the result, method, round and time, and his strike / takedown numbers in it
Finished fights never change, so they are cached for good in data/ufc_cache.json; fighter bios are refreshed every 3 days.
Odds come separately from the PropLine feed (tools/fetch_odds.py → data/live_odds.json, "ufc")."""
import json, os, sys, time, datetime as dt, urllib.request
from concurrent.futures import ThreadPoolExecutor

R = sys.argv[1]
NOW = dt.datetime.now(dt.timezone.utc)
SITE = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/"
CORE = "https://sports.core.api.espn.com/v2/sports/mma/"
NREQ = [0]
def log(*a): print(*a, file=sys.stderr)
def get(u, tries=3):
    u = u.replace("http://sports.core.api.espn.pvt", "https://sports.core.api.espn.com").replace("http://", "https://")
    for i in range(tries):
        try:
            NREQ[0] += 1
            with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(1 + i)
        except Exception: time.sleep(1 + i)
    return None
CF = os.path.join(R, "data/ufc_cache.json")
try: C = json.load(open(CF))
except Exception: C = {}
C.setdefault("fights", {}); C.setdefault("ath", {}); C.setdefault("log", {})

# ---------------- events from the scoreboard calendar ----------------
sb = get(SITE + "scoreboard") or {}
cal = [x for x in ((sb.get("leagues") or [{}])[0].get("calendar") or []) if isinstance(x, dict) and x.get("startDate")]
def ts(s): return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
past = [x for x in cal if ts(x["startDate"]) < NOW - dt.timedelta(hours=10)][-10:]
nxt = [x for x in cal if ts(x["startDate"]) >= NOW - dt.timedelta(hours=10)][:5]
EV = []
def num(x):
    try: return float(x)
    except Exception: return None
def card(x):
    d0 = ts(x["startDate"]) - dt.timedelta(days=1); d1 = ts(x["startDate"]) + dt.timedelta(days=1)
    s = get(SITE + f"scoreboard?dates={d0:%Y%m%d}-{d1:%Y%m%d}") or {}
    for e in s.get("events") or []:
        if e.get("name") == x.get("label") or abs((ts(e["date"]) - ts(x["startDate"])).total_seconds()) < 36 * 3600: return e
    return None
with ThreadPoolExecutor(6) as ex: cards = list(ex.map(card, past + nxt))
for x, e in zip(past + nxt, cards):
    if not e: continue
    v = ((e.get("competitions") or [{}])[0].get("venue") or {})
    ev = {"id": e["id"], "n": e.get("name") or x.get("label"), "d": e.get("date"), "ven": v.get("fullName"), "city": ", ".join(filter(None, [(v.get("address") or {}).get("city"), (v.get("address") or {}).get("state") or (v.get("address") or {}).get("country")])), "f": []}
    comps = e.get("competitions") or []
    for i, c in enumerate(comps):
        st = (c.get("status") or {}).get("type") or {}
        F = {"id": c["id"], "wc": ((c.get("type") or {}).get("abbreviation") or ""), "rd": ((c.get("format") or {}).get("regulation") or {}).get("periods") or 3,
             "t": c.get("date") or e.get("date"), "o": i, "st": st.get("state") or "pre", "c": []}
        for p in sorted(c.get("competitors") or [], key=lambda p: p.get("order", 9)):
            a = p.get("athlete") or {}
            F["c"].append([str(p.get("id")), a.get("displayName") or a.get("fullName") or "?", ((p.get("records") or [{}])[0].get("summary") or ""), 1 if p.get("winner") else 0, ((a.get("flag") or {}).get("alt") or "")])
        ev["f"].append(F)
    ev["f"].reverse()   # ESPN lists the prelims first: main event first for the site
    EV.append(ev)
log(f"UFC: {len(EV)} cards ({len(past)} past, {len(nxt)} upcoming), {sum(len(e['f']) for e in EV)} fights")

# ---------------- one finished fight: result + both fighters' numbers (cached for good) ----------------
STAT = {"knockDowns": "kd", "sigStrikesLanded": "sl", "sigStrikesAttempted": "sa", "totalStrikesLanded": "tl", "totalStrikesAttempted": "ta",
        "takedownsLanded": "tdl", "takedownsAttempted": "tda", "submissionsAttempted": "suba", "timeInControl": "ctrl", "controlTime": "ctrl",
        "sigHeadStrikesLanded": "hl", "sigBodyStrikesLanded": "bl", "sigLegStrikesLanded": "ll", "sigDistanceStrikesLanded": "dl", "sigClinchStrikesLanded": "cl", "sigGroundStrikesLanded": "gl"}
def fight(evid, cid):
    k = str(cid)
    if k in C["fights"] and C["fights"][k].get("done"): return C["fights"][k]
    base = CORE + f"leagues/ufc/events/{evid}/competitions/{cid}"
    comp = get(base)
    if not comp: return None
    stt = get(base + "/status") or {}
    ty = (stt.get("type") or {}); res = stt.get("result") or {}
    out = {"ev": str(evid), "d": comp.get("date"), "wc": ((comp.get("type") or {}).get("abbreviation") or (comp.get("type") or {}).get("text") or ""),
           "rds": comp.get("description") or "", "done": bool(ty.get("completed")), "m": res.get("displayName") or res.get("shortDisplayName") or "", "md": res.get("description") or "",
           "r": stt.get("period"), "clk": stt.get("displayClock"), "c": {}}
    for p in comp.get("competitors") or []:
        aid = str(p.get("id")); s = get(base + f"/competitors/{aid}/statistics") or {}
        S = {}
        for cat in ((s.get("splits") or {}).get("categories") or []):
            for x in cat.get("stats") or []:
                if x.get("name") and x.get("value") is not None: S[x["name"]] = round(float(x["value"]), 1)
        out["c"][aid] = {"w": 1 if p.get("winner") else 0, "s": S}
    if out["done"]: C["fights"][k] = out
    return out

# ---------------- fighters: bio + record split + last 10 fights ----------------
def athlete(aid):
    A = C["ath"].get(aid)
    if A and (NOW - ts(A["at"])).days < 3: return A
    a = get(CORE + f"athletes/{aid}") or {}
    if not a: return A
    rec = get(CORE + f"athletes/{aid}/records") or {}
    R0 = {}
    for it in rec.get("items") or []:
        if it.get("type") == "total" or it.get("name") == "overall":
            R0["rec"] = it.get("summary") or it.get("displayValue")
            for x in it.get("stats") or []: R0[x.get("name")] = int(x.get("value") or 0)
    pos = a.get("weightClass") or {}
    A = {"at": NOW.isoformat(timespec="seconds"), "n": a.get("displayName") or a.get("fullName"), "nick": a.get("nickname") or "", "age": a.get("age"),
         "ht": a.get("displayHeight") or "", "hti": a.get("height"), "wt": a.get("displayWeight") or "", "reach": a.get("displayReach") or (f"{a['reach']:.0f}\"" if isinstance(a.get("reach"), (int, float)) else ""),
         "rch": a.get("reach") if isinstance(a.get("reach"), (int, float)) else None, "stance": ((a.get("stance") or {}).get("text") if isinstance(a.get("stance"), dict) else a.get("stance")) or "",
         "ctry": ((a.get("citizenshipCountry") or {}).get("abbreviation") if isinstance(a.get("citizenshipCountry"), dict) else "") or a.get("citizenship") or "",
         "wc": pos.get("text") if isinstance(pos, dict) else "", "team": ((a.get("association") or {}).get("name") if isinstance(a.get("association"), dict) else "") or "", "R": R0}
    C["ath"][aid] = A; return A
def history(aid, n=10):
    L = C["log"].get(aid)
    if L and (NOW - ts(L["at"])).days < 1 and L.get("items"): items = L["items"]
    else:
        lg = get(CORE + f"athletes/{aid}/eventlog") or {}
        items = []
        for it in ((lg.get("events") or {}).get("items") or []):
            r = ((it.get("competition") or {}).get("$ref") or "")
            try: ev_ = r.split("/events/")[1].split("/")[0]; cid = r.split("/competitions/")[1].split("?")[0].split("/")[0]
            except Exception: continue
            if it.get("played") is False: continue
            items.append([ev_, cid])
        C["log"][aid] = {"at": NOW.isoformat(timespec="seconds"), "items": items}
    return items[:n]

ids = []
for e in EV:
    for F in e["f"]:
        for c_ in F["c"]: ids.append(c_[0])
ids = list(dict.fromkeys(ids))
with ThreadPoolExecutor(12) as ex: list(ex.map(athlete, ids))
H = {}
with ThreadPoolExecutor(12) as ex:
    for aid, items in zip(ids, ex.map(history, ids)): H[aid] = items
todo = list(dict.fromkeys((ev_, cid) for items in H.values() for ev_, cid in items))
with ThreadPoolExecutor(12) as ex: FX = dict(zip([c for _, c in todo], ex.map(lambda x: fight(*x), todo)))
opp_ids = set()
for aid, items in H.items():
    for _, cid in items:
        f = FX.get(cid)
        if f:
            for o in f["c"]:
                if o != aid: opp_ids.add(o)
need = [o for o in opp_ids if o not in C["ath"]]
def light(aid):   # opponents: name (and record) only, kept long
    a = get(CORE + f"athletes/{aid}") or {}
    if a: C["ath"][aid] = {"at": NOW.isoformat(timespec="seconds"), "n": a.get("displayName") or a.get("fullName"), "lite": 1}
with ThreadPoolExecutor(12) as ex: list(ex.map(light, need))

# ---------------- output ----------------
def mshort(m, md):
    m = (m or "").lower()
    if "ko" in m: return "KO"
    if "sub" in m: return "SUB"
    if "dec" in m: return "DEC"
    if "draw" in m: return "DRAW"
    if "contest" in m or "nc" == m: return "NC"
    if "dq" in m or "disq" in m: return "DQ"
    return (md or m or "").upper()[:6]
import re
PICK = {"sl": r"^sigStrikesLanded$", "sa": r"^sigStrikesAttempted$", "tl": r"^totalStrikesLanded$", "ta": r"^totalStrikesAttempted$", "kd": r"^knockDowns$",
        "tdl": r"^take[dD]owns?Landed$|^takedownsLanded$|^takeDownsLanded$", "tda": r"^take[dD]owns?Attempted$|^takeDownsAttempted$", "ctrl": r"control|Control",
        "suba": r"^submissions$"}
def stx(raw):
    out = {}
    for k, rx in PICK.items():
        hit = next((v for n, v in raw.items() if re.search(rx, n)), None)
        if hit is not None: out[k] = hit
    # where the significant strikes landed (head / body / leg) and from where (distance / clinch / ground): ESPN splits them both ways
    def sm(pos, tgt):
        v = [raw.get(f"sig{p_}{t_}StrikesLanded") for p_ in pos for t_ in tgt]; v = [x for x in v if x is not None]
        return sum(v) if v else None
    P_, T_ = ("Distance", "Clinch", "Ground"), ("Head", "Body", "Leg")
    for k, a, b in (("hl", P_, ("Head",)), ("bl", P_, ("Body",)), ("ll", P_, ("Leg",)), ("dl", ("Distance",), T_), ("cl", ("Clinch",), T_), ("gl", ("Ground",), T_)):
        v = sm(a, b)
        if v is not None: out[k] = v
    return out
FT = {}
for aid in ids:
    A = C["ath"].get(aid) or {}
    rows = []
    for ev_, cid in H.get(aid, []):
        f = FX.get(cid)
        if not f or not f.get("done") or aid not in f["c"]: continue
        me = f["c"][aid]; opp = [o for o in f["c"] if o != aid]; op = opp[0] if opp else ""; oth = f["c"].get(op, {})
        res = "W" if me["w"] else ("L" if oth.get("w") else ("NC" if "contest" in (f["m"] or "").lower() else "D"))
        s, so = stx(me.get("s", {})), stx(oth.get("s", {}))
        secs = None
        try:
            mm, ss = (f.get("clk") or "0:0").split(":"); secs = (int(f.get("r") or 1) - 1) * 300 + int(mm) * 60 + int(ss)
        except Exception: pass
        rows.append([(f.get("d") or "")[:10], op, (C["ath"].get(op) or {}).get("n") or "?", res, mshort(f.get("m"), f.get("md")), f.get("md") or "", f.get("r"), f.get("clk") or "", secs, f.get("wc") or "",
                     s.get("sl"), s.get("sa"), so.get("sl"), so.get("sa"), s.get("tdl"), s.get("tda"), so.get("tdl"), so.get("tda"), s.get("kd"), s.get("ctrl"), s.get("suba"),
                     [s.get("hl"), s.get("bl"), s.get("ll")], [s.get("dl"), s.get("cl"), s.get("gl")]])
    FT[aid] = {k: A.get(k) for k in ("n", "nick", "age", "ht", "hti", "wt", "reach", "rch", "stance", "ctry", "wc", "team")}
    FT[aid]["R"] = A.get("R") or {}
    FT[aid]["h"] = rows   # newest first
for e in EV:   # results on the cards (method, round, time) from the fight cache
    for F in e["f"]:
        x = C["fights"].get(str(F["id"])) or (fight(e["id"], F["id"]) if F["st"] == "post" else None)
        if x and x.get("done"): F["m"] = mshort(x.get("m"), x.get("md")); F["md"] = x.get("md") or ""; F["r"] = x.get("r"); F["clk"] = x.get("clk") or ""
json.dump(C, open(CF, "w"), separators=(",", ":"))
J = lambda o: json.dumps(o, separators=(",", ":"), ensure_ascii=False)
print("/* 🥊 UFC — tools/ufcfetch.py (ESPN MMA feeds: cards, results, fighter bios, fight-by-fight stats) */")
print(f'var UFC_GEN="{NOW.astimezone(dt.timezone(dt.timedelta(hours=-5))).strftime("%a %b %d %I:%M %p")} ET";')
print(f"var UFC_EV={J(EV)};  /* cards: fights main event first; c = [id, name, record, winner, country] */")
print(f"var UFC_F={J(FT)};  /* fighters: bio, record split (R), last 10 fights h = [date, oppId, opp, W/L/D/NC, method, detail, round, time, seconds, weight class, sig landed, sig att, sig absorbed, opp sig att, TD landed, TD att, opp TD landed, opp TD att, knockdowns, control sec, sub att, [head, body, leg], [distance, clinch, ground]] */")
print("var UFC_OK=1;")
_names = set()
for f in list(C["fights"].values())[:30]:
    for c_ in f.get("c", {}).values(): _names |= set(c_.get("s", {}).keys())
log("UFC stat names:", sorted(_names))
log(f"UFC: {len(FT)} fighters, {sum(len(v['h']) for v in FT.values())} past fights, {NREQ[0]} requests")
