#!/usr/bin/env python3
"""Soccer odds + referees from PropLine (called by fetch_odds.py; shares its client and daily request budget).
8 competitions: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Conference League.

Budget-aware: every competition's event list is read at most every 2 hours; a match's odds are re-read
only when they are getting old for how close kickoff is (>24 h out: every 12 h · 6-24 h: every 4 h · <6 h: every 90 min).
Only licensed US books. Writes out["soc"] = {at, events:[...], props:[...], refs:{comp:[...]}, mk_extra:[...]}.

events[i]: {pid, comp, home, away, hid, aid (ESPN team ids), start, at (odds read time),
            ml:{h,d,a,hb,db,ab}, tot:{"2.5":[o,ob,u,ub],...}, main_tot, btts:{y,yb,n,nb}, ah:{line,h,hb,a,ab},
            cor:{"10.5":[o,ob,u,ub],...}, main_cor, ttot:{home:{"1.5":[...]}, away:{...}}, extra:{market:{...}}, ref?}
props[i]: [player, mk, line, price, book, eventPid, underPrice|None]   (mk: sgoal anytime goal · ssot shots on target ·
          sast assist · sga goal or assist · s2g 2+ goals · sshot shots · sfoul fouls committed · sfwon fouls won · scard to be booked)"""
import re, json, datetime as dt

COMPS = [("epl", "soccer_epl"), ("laliga", "soccer_la_liga"), ("seriea", "soccer_serie_a"), ("bund", "soccer_bundesliga"),
         ("ligue1", "soccer_ligue_1"), ("ucl", "soccer_uefa_champions_league"), ("uel", "soccer_uefa_europa_league"),
         ("uecl", "soccer_uefa_conference_league"), ("champ", "soccer_championship"), ("ered", "soccer_eredivisie"),
         ("port", "soccer_primeira_liga"), ("mls", "soccer_mls")]
BOOKS = {"draftkings": "DraftKings", "fanduel": "FanDuel", "betmgm": "BetMGM", "williamhill_us": "Caesars", "caesars": "Caesars",
         "fanatics": "Fanatics", "espnbet": "ESPN BET", "thescorebet": "theScore Bet", "betrivers": "BetRivers",
         "hardrock": "Hard Rock Bet", "hardrockbet": "Hard Rock Bet"}
GAME_MK = ["h2h", "totals", "both_teams_to_score", "spreads", "total_corners"]
PLAYER_MK = {"anytime_goal_scorer": "sgoal", "player_shots_on_target": "ssot", "player_assists": "sast",
             "goal_or_assist": "sga", "2plus_goals": "s2g"}
# markets we'd love but books don't post yet: picked up automatically the day they appear in get_markets
EXTRA_RX = re.compile(r"card|booking|foul|player_shots(?!_on)|^shots", re.I)
EXTRA_PLAYER = {"player_shots": "sshot", "player_fouls": "sfoul", "player_fouls_committed": "sfoul", "player_fouls_drawn": "sfwon",
                "player_fouls_won": "sfwon", "player_fouls_suffered": "sfwon", "player_cards": "scard", "player_to_be_booked": "scard",
                "player_booked": "scard"}

def g(o, k, d=None): return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)
def ts(s): return dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))
def fnum(x):
    try: return float(x)
    except Exception: return None
def esp_id(x):
    m = re.search(r"(\d+)$", str(x or "")); return m.group(1) if m else None

def due(ev_start, last, now):
    if not last: return True
    h = (ev_start - now).total_seconds() / 3600; age = (now - ts(last)).total_seconds() / 3600
    return age >= (12 if h > 24 else 4 if h > 6 else 1.5)

def side_of(desc, home, away):
    """'Home Team Over/Under 2.5 Goals - Man City' / 'Team Total 0.5 - Fulham' -> 'home' | 'away' | None"""
    d = desc.lower()
    if "home team" in d: return "home"
    if "away team" in d: return "away"
    tail = set(re.findall(r"[a-z]+", d.split(" - ")[-1])) - {"fc", "cf", "ac", "the", "team", "total"}
    sc = lambda n: len(tail & set(re.findall(r"[a-z]+", n.lower())))
    h, a = sc(home), sc(away)
    return "home" if h > a else "away" if a > h else None

def who(n, home, away):
    """outcome name -> 'h' | 'a' | 'd' | None; tolerant of case / short names ('UNION BERLIN' vs 'Union Berlin')"""
    n = str(n or "")
    if n == home: return "h"
    if n == away: return "a"
    if n.lower() in ("draw", "tie", "x"): return "d"
    if n.lower() == str(home).lower(): return "h"
    if n.lower() == str(away).lower(): return "a"
    stop = {"fc", "cf", "ac", "sc", "afc", "the", "de", "club", "cd", "ud", "fk", "sv", "rc", "us", "as"}
    t = set(re.findall(r"[a-z]+", n.lower())) - stop
    h, a = len(t & set(re.findall(r"[a-z]+", str(home).lower()))), len(t & set(re.findall(r"[a-z]+", str(away).lower())))
    return "h" if h > a else "a" if a > h else None

def imp(p):
    return None if p is None else (100 / (p + 100) if p > 0 else -p / (-p + 100))

def clean_ladders(raw, log=None, tag=""):
    """raw[book][line] = {"o": price, "u": price} -> same, minus quotes that can't be right for the full match:
    a book whose over prices don't rise with the line is dropped whole; a quote that is far from the other books
    (15+ points of implied probability off the median, or over + the others' under not ~100-140%) is dropped (Nov 22: one book's goal ladder at
    O2.5 +800 / O3.5 +2200 for Man City-Fulham was a different market under the full-match key)."""
    ok = {}
    for B, L in raw.items():
        ov = [(float(ln), s["o"]) for ln, s in L.items() if s.get("o") is not None]
        ov.sort()
        if any(imp(b) > imp(a) + 0.02 for (_, a), (_, b) in zip(ov, ov[1:])):
            if log: log(f"soccer {tag}: dropped {B}'s goal ladder (over prices not in line order)")
            continue
        ok[B] = L
    def med(v): v = sorted(v); n = len(v); return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2
    out = {}
    for B, L in ok.items():
        for ln, s in L.items():
            for side, pr in s.items():
                opp = "u" if side == "o" else "o"
                same = [imp(ok[b][ln][side]) for b in ok if ln in ok[b] and ok[b][ln].get(side) is not None]
                if len(same) >= 3 and abs(imp(pr) - med(same)) > 0.15: continue          # far from the other books
                vs = [imp(ok[b][ln][opp]) for b in ok if b != B and ln in ok[b] and ok[b][ln].get(opp) is not None]
                if vs and not 0.93 <= imp(pr) + med(vs) <= 1.4: continue                 # can't pair with the other books' opposite side
                out.setdefault(B, {}).setdefault(ln, {})[side] = pr
    return out

def best_into(d, key, price, book):
    if price is None: return
    if key not in d or price > d[key][0]: d[key] = (price, book)

def parse_event(od, home, away, log=None):
    """-> game dict + player props {(player, mk): {line: {"o":(price,book), "u":(price,book)}}}"""
    ml, btts, tot, cor, ttot, ah_main, extra = {}, {}, {}, {}, {"home": {}, "away": {}}, {}, {}
    main_tot, main_cor, props, h1 = {}, {}, {}, {}
    raw_tot, raw_h1 = {}, {}   # per-book goal ladders, checked by clean_ladders before the best price is taken
    for bk in g(od, "bookmakers", []) or []:
        b = str(g(bk, "key", "")).lower()
        if b not in BOOKS: continue
        B = BOOKS[b]
        for m in g(bk, "markets", []) or []:
            k, lt, desc = g(m, "key"), str(g(m, "line_type", "main") or "main"), str(g(m, "description", "") or "")
            oc = g(m, "outcomes", []) or []
            per = str(g(m, "period") or "").lower()
            if per:
                if per in ("h1", "1h", "first_half", "1st_half", "half1", "p1") and k in ("h2h", "totals", "both_teams_to_score") and not re.search(r"team", desc, re.I):
                    for o in oc:
                        n, p_, pt = str(g(o, "name", "")), g(o, "price"), fnum(g(o, "point"))
                        if k == "h2h": best_into(h1.setdefault("ml", {}), who(n, home, away) or "?", p_, B)
                        elif k == "both_teams_to_score": best_into(h1.setdefault("btts", {}), "y" if n.lower() == "yes" else "n", p_, B)
                        elif pt is not None and n.lower() in ("over", "under") and p_ is not None: raw_h1.setdefault(B, {}).setdefault(str(pt), {})[n.lower()[0]] = p_
                continue
            if k == "h2h":
                for o in oc:
                    n, p = str(g(o, "name", "")), g(o, "price")
                    best_into(ml, who(n, home, away) or "?", p, B)
            elif k == "both_teams_to_score":
                for o in oc: best_into(btts, "y" if str(g(o, "name")).lower() == "yes" else "n", g(o, "price"), B)
            elif k in ("totals", "total_corners"):
                team = None
                if k == "totals" and re.search(r"team", desc, re.I):
                    team = side_of(desc, home, away)
                    if not team: continue
                tgt = ttot[team] if team else (tot if k == "totals" else cor)
                for o in oc:
                    pt, side = fnum(g(o, "point")), str(g(o, "name", "")).lower()
                    if pt is None or side not in ("over", "under"): continue
                    if tgt is tot:
                        if g(o, "price") is not None: raw_tot.setdefault(B, {}).setdefault(str(pt), {})[side[0]] = g(o, "price")
                    else: best_into(tgt.setdefault(str(pt), {}), side[0], g(o, "price"), B)
                    if lt == "main" and not team:
                        if k == "totals": main_tot.setdefault(B, set()).add(str(pt))
                        else: main_cor[str(pt)] = main_cor.get(str(pt), 0) + 1
            elif k == "spreads" and lt == "main":
                for o in oc:
                    n, p, pt = str(g(o, "name", "")), g(o, "price"), fnum(g(o, "point"))
                    if pt is None: continue
                    side = who(n, home, away); side = side if side in ("h", "a") else None
                    if side: ah_main.setdefault(str(pt if side == "h" else -pt), {}); best_into(ah_main[str(pt if side == "h" else -pt)], side, p, B)
            elif k in PLAYER_MK or k in EXTRA_PLAYER:
                mk = PLAYER_MK.get(k) or EXTRA_PLAYER.get(k)
                for o in oc:
                    pl = str(g(o, "description", "") or "").strip() or (str(g(o, "name", "")) if mk in ("sgoal", "scard") else "")
                    if not pl: continue
                    nm = str(g(o, "name", "")).lower(); pt = fnum(g(o, "point")); mm_ = re.match(r"^\s*(\d+)\s*\+", nm)
                    if mm_: pt, side = float(mm_.group(1)) - 0.5, "o"
                    elif nm in ("under", "no"): side = "u"
                    else: side = "o"
                    if pt is None: pt = 0.5
                    best_into(props.setdefault((pl, mk), {}).setdefault(pt, {}), side, g(o, "price"), B)
            elif EXTRA_RX.search(str(k)):
                # team / match cards or similar new markets: keep best over/under per line, shown as-is on the game page
                for o in oc:
                    pt, side = fnum(g(o, "point")), str(g(o, "name", "")).lower()
                    if side in ("over", "under", "yes", "no"):
                        best_into(extra.setdefault(k, {}).setdefault(str(pt) + ("|" + desc if "team" in desc.lower() else ""), {}), side[0], g(o, "price"), B)
    kept_tot = set()
    for src, dst in ((raw_tot, tot), (raw_h1, None)):
        cl = clean_ladders(src, log, f"{home}-{away}" + (" 1H" if dst is None else ""))
        if dst is not None: kept_tot = set(cl)
        for B, L in cl.items():
            for ln, sd in L.items():
                for side, pr in sd.items():
                    best_into((dst if dst is not None else h1.setdefault("tot", {})).setdefault(ln, {}), side, pr, B)
    mt_n = {}
    for B in kept_tot:
        for ln in main_tot.get(B, ()):
            if ln in tot: mt_n[ln] = mt_n.get(ln, 0) + 1
    def ladd(d): return {ln: [s.get("o", (None,))[0], s.get("o", (None, None))[1], s.get("u", (None,))[0], s.get("u", (None, None))[1]] for ln, s in sorted(d.items(), key=lambda x: float(x[0])) if "o" in s or "u" in s}
    out = {}
    if {"h", "d", "a"} <= set(ml): out["ml"] = {k: ml[k][0] for k in "hda"} | {k + "b": ml[k][1] for k in "hda"}
    if btts: out["btts"] = {"y": btts.get("y", (None,))[0], "yb": btts.get("y", (None, None))[1], "n": btts.get("n", (None,))[0], "nb": btts.get("n", (None, None))[1]}
    if tot:
        out["tot"] = ladd(tot)
        both = [ln for ln, s_ in tot.items() if "o" in s_ and "u" in s_]   # main line = the most even over/under after cleaning
        out["main_tot"] = max(mt_n, key=mt_n.get) if mt_n else min(both, key=lambda ln: abs(imp(tot[ln]["o"][0]) - imp(tot[ln]["u"][0]))) if both else ("2.5" if "2.5" in tot else None)
    if cor: out["cor"] = ladd(cor); out["main_cor"] = max(main_cor, key=main_cor.get) if main_cor else None
    if ttot["home"] or ttot["away"]: out["ttot"] = {s: ladd(v) for s, v in ttot.items() if v}
    if ah_main:
        ln = min(ah_main, key=lambda x: abs((ah_main[x].get("h", (0,))[0] or 0) - (ah_main[x].get("a", (0,))[0] or 0)) if "h" in ah_main[x] and "a" in ah_main[x] else 9e9)
        s = ah_main[ln]
        if "h" in s and "a" in s: out["ah"] = {"line": float(ln), "h": s["h"][0], "hb": s["h"][1], "a": s["a"][0], "ab": s["a"][1]}
    if extra: out["extra"] = {k: ladd(v) for k, v in extra.items()}
    if h1:
        o1 = {}
        if {"h", "d", "a"} <= set(h1.get("ml", {})): o1["ml"] = {k: h1["ml"][k][0] for k in "hda"} | {k + "b": h1["ml"][k][1] for k in "hda"}
        if h1.get("tot"): o1["tot"] = ladd(h1["tot"])
        if h1.get("btts"): o1["btts"] = {"y": h1["btts"].get("y", (None,))[0], "yb": h1["btts"].get("y", (None, None))[1], "n": h1["btts"].get("n", (None,))[0], "nb": h1["btts"].get("n", (None, None))[1]}
        if o1: out["h1"] = o1
    return out, props

def run(client, prev, used, budget_cap, log=print):
    now = dt.datetime.now(dt.timezone.utc)
    P = prev.get("soc") or {}
    old_ev = {e["pid"]: e for e in P.get("events") or [] if ts(e["start"]) > now - dt.timedelta(hours=3)}
    old_pr = [r for r in P.get("props") or [] if r[5] in old_ev]
    seen_at = P.get("seen") or {}
    refs = P.get("refs") or {}
    mk_extra = set(P.get("mk_extra") or [])
    evs, props_out, n_odds = {}, {}, 0
    for comp, sk in COMPS:
        if used >= budget_cap: log("soccer: budget cap reached"); break
        last = seen_at.get(comp)
        if last and (now - ts(last)).total_seconds() < 2 * 3600:   # event list read recently: keep what we had for this comp
            for e in old_ev.values():
                if e["comp"] == comp: evs[e["pid"]] = e
            continue
        try: L = client.get_events(sk); used += 1; seen_at[comp] = now.isoformat(timespec="seconds")
        except Exception as ex: log(f"soccer {comp}: events failed: {ex}"); continue
        for ev in L or []:
            st = ts(g(ev, "commence_time"))
            if st < now or st - now > dt.timedelta(hours=72): continue
            pid = str(g(ev, "id")); o = old_ev.get(pid) or {}
            e = {"pid": pid, "comp": comp, "home": g(ev, "home_team"), "away": g(ev, "away_team"), "hid": esp_id(g(ev, "home_team_id")),
                 "aid": esp_id(g(ev, "away_team_id")), "start": g(ev, "commence_time")}
            for k in ("at", "ml", "btts", "tot", "main_tot", "cor", "main_cor", "ttot", "ah", "extra", "open", "h1"):
                if k in o: e[k] = o[k]
            evs[pid] = e
        # once a day per competition: look for new market types (cards / fouls / player shots) on the soonest match
        day = now.strftime("%Y-%m-%d")
        if (P.get("mk_day") or {}).get(comp) != day and L and used < budget_cap:
            try:
                first = sorted(L, key=lambda x: g(x, "commence_time"))[0]
                keys = [g(m, "key") for m in client.get_markets(sk, g(first, "id"))]; used += 1
                new = {k for k in keys if k and EXTRA_RX.search(k)}
                if new - mk_extra: log(f"soccer {comp}: NEW market types available: {sorted(new - mk_extra)}")
                mk_extra |= new
            except Exception as ex: log(f"soccer {comp}: markets list failed: {ex}")
            P.setdefault("mk_day", {})[comp] = day
    # odds for matches whose prices are getting old
    order = sorted(evs.values(), key=lambda e: e["start"])
    for e in order:
        if used >= budget_cap: break
        if not due(ts(e["start"]), e.get("at"), now):
            for r in old_pr:
                if r[5] == e["pid"]: props_out[(r[0], r[1], r[5])] = r
            continue
        sk = dict(COMPS)[e["comp"]]
        mks = GAME_MK + list(PLAYER_MK) + sorted(mk_extra)
        try:
            try: od = client.get_odds(sk, event_id=e["pid"], markets=mks, period="all")   # full match + first-half lines in one request
            except TypeError: od = client.get_odds(sk, event_id=e["pid"], markets=mks)
            used += 1; n_odds += 1
        except Exception as ex:
            used += 1; log(f"soccer {e['comp']} {e['pid']}: odds failed ({ex}) — retrying with the core list")
            try: od = client.get_odds(sk, event_id=e["pid"], markets=GAME_MK + list(PLAYER_MK)); used += 1
            except Exception as ex2: log(f"soccer {e['pid']}: odds failed: {ex2}"); continue
        game, props = parse_event(od, e["home"], e["away"], log)
        for k in ("ml", "btts", "tot", "main_tot", "cor", "main_cor", "ttot", "ah", "extra", "h1"): e.pop(k, None)
        e.update(game); e["at"] = now.isoformat(timespec="seconds")
        op = e.get("open") or {}
        if "ml" in game and "ml" not in op: op["ml"] = [game["ml"]["h"], game["ml"]["d"], game["ml"]["a"]]
        mt = game.get("main_tot")
        if mt and "tot" not in op and mt in game.get("tot", {}): op["tot"] = [float(mt)] + [game["tot"][mt][0], game["tot"][mt][2]]
        mc = game.get("main_cor")
        if mc and "cor" not in op and mc in game.get("cor", {}): op["cor"] = [float(mc)] + [game["cor"][mc][0], game["cor"][mc][2]]
        if op: e["open"] = op
        for (pl, mk), lines in props.items():
            for ln, s in lines.items():
                if "o" not in s: continue
                if mk in ("sgoal", "sast", "sga", "s2g", "scard") and ln != 0.5 and not (mk == "s2g" and ln == 1.5): continue
                r = [pl, mk, ln, s["o"][0], s["o"][1], e["pid"], s.get("u", (None,))[0]]
                props_out[(pl, mk + ("" if ln == 0.5 else str(ln)), e["pid"])] = r
    # referees: card averages per competition every 6 hours (free endpoint, 1 request each)
    if used < budget_cap and (now - ts(P.get("refs_at") or "2000-01-01T00:00:00+00:00")).total_seconds() > 6 * 3600:
        for comp, sk in COMPS:
            try:
                r = client.get_referees(sk); used += 1
                refs[comp] = [[x.get("referee"), x.get("matches"), x.get("yellow_cards_per_match"), x.get("red_cards_per_match"),
                               x.get("cards_per_match"), x.get("next_match"), x.get("last_match")] for x in (r or {}).get("referees", [])]
            except Exception as ex: log(f"soccer {comp}: referees failed: {ex}")
        P["refs_at"] = now.isoformat(timespec="seconds")
        # one match-context read per refresh, logged, so we can see whether get_context ever names the referee
        # (it never did Nov 20-23; it used to be called for every match in the next 48 h = ~70 requests every 6 h)
        for e in order:
            if used >= budget_cap or e.get("ref") or ts(e["start"]) - now > dt.timedelta(hours=48): continue
            try:
                c = client.get_context(dict(COMPS)[e["comp"]], e["pid"]); used += 1
                c = c if isinstance(c, dict) else getattr(c, "__dict__", {}) or {}
                rn = c.get("referee")
                if isinstance(rn, dict): rn = rn.get("name") or rn.get("referee")
                if not rn and isinstance(c.get("officials"), list) and c["officials"]:
                    o0 = c["officials"][0]; rn = o0.get("name") if isinstance(o0, dict) else o0
                log(f"soccer context sample {e['comp']} {e['pid']}: keys={sorted(c)[:20]} referee={rn!r}")
                if rn and isinstance(rn, str): e["ref"] = rn
            except Exception as ex: used += 1; log(f"soccer context failed: {ex}")
            break
    # referee assignments from each referee's next match (a dict {event_id, commence_time, home_team, away_team}):
    # PropLine event id = our pid. Runs every time (the referee list is kept between refreshes).
    try:
        by_ev = {}
        for comp, L in refs.items():
            for x in L:
                nm = x[5] if len(x) > 5 else None
                if isinstance(nm, dict) and nm.get("event_id") and x[0]: by_ev.setdefault(str(nm["event_id"]), set()).add(x[0])
                elif isinstance(nm, str) and x[0]:   # older format: kickoff time only -> unique referee + unique match in that slot
                    for e in order:
                        if e["comp"] == comp and not e.get("ref"):
                            try:
                                if abs((ts(nm) - ts(e["start"])).total_seconds()) < 600 and sum(1 for y in order if y["comp"] == comp and abs((ts(y["start"]) - ts(e["start"])).total_seconds()) < 600) == 1:
                                    by_ev.setdefault(e["pid"], set()).add(x[0])
                            except Exception: pass
        for e in order:
            if len(by_ev.get(str(e["pid"]), ())) == 1: e["ref"] = next(iter(by_ev[str(e["pid"])]))
    except Exception as ex: log(f"soccer referee assignment failed: {ex}")
    out = {"at": now.isoformat(timespec="seconds"), "events": order, "props": list(props_out.values()), "refs": refs,
           "seen": seen_at, "mk_extra": sorted(mk_extra), "mk_day": P.get("mk_day") or {}, "refs_at": P.get("refs_at")}
    log(f"soccer: {len(order)} matches in the next 72 h, odds read for {n_odds}, {len(out['props'])} player props, "
        f"referees for {len(refs)} competitions, {sum(1 for e in order if e.get('ref'))} referee assignments, extra markets: {sorted(mk_extra) or 'none'}")
    return out, used
