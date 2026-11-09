"""One-off PropLine capability check (run by probe.yml). Prints signatures and a small sample of the
referee / context / history endpoints. Delete after use."""
import os, json, inspect
from propline import PropLine
c = PropLine(os.environ["PROPLINE_API_KEY"])
def sig(n):
    try: print(f"{n}{inspect.signature(getattr(c, n))}")
    except Exception as e: print(n, "sig err", e)
def show(lab, f):
    try:
        r = f(); s = json.dumps(r, default=lambda o: getattr(o, "__dict__", str(o)))
        print(f"\n## {lab}: {len(s)} bytes\n{s[:1500]}")
    except Exception as e: print(f"\n## {lab}: ERR {type(e).__name__}: {str(e)[:300]}")
for n in ["get_referees", "get_referee_matches", "get_context", "get_player_history", "get_odds_history", "get_player_trends",
          "get_movement", "get_injuries", "get_events", "get_odds", "get_markets", "get_history_coverage", "get_player_games", "get_stats"]: sig(n)
SP = os.environ.get("SP", "basketball_nba")
ev = c.get_events(SP); ev = ev if isinstance(ev, list) else (ev.get("events") or ev.get("data") or [])
eid = (ev[0].get("id") if isinstance(ev[0], dict) else getattr(ev[0], "id", None)) if ev else None
print("\nfirst event:", json.dumps(ev[0], default=str)[:400] if ev else None)
show("get_referees", lambda: c.get_referees(SP))
show("get_referee_matches", lambda: c.get_referee_matches(SP))
show("get_context", lambda: c.get_context(SP, event_id=eid))
show("get_markets", lambda: c.get_markets(SP, event_id=eid) if eid else c.get_markets(SP))
show("get_history_coverage", lambda: c.get_history_coverage(SP))
