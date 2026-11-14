# dry-run the UFC generator on a runner and show a sample
import subprocess, os, sys, json, re
os.makedirs("data", exist_ok=True)
r = subprocess.run([sys.executable, "src/tools/ufcfetch.py", os.getcwd()], capture_output=True, text=True, timeout=1500)
print(r.stderr[-4000:])
out = r.stdout; print("OUT bytes", len(out))
m = re.search(r"var UFC_EV=(.*?);  ", out); EV = json.loads(m.group(1)) if m else []
print(json.dumps([{k: e[k] for k in ("n", "d", "ven", "city")} | {"fights": len(e["f"]), "f0": e["f"][0] if e["f"] else None} for e in EV], ensure_ascii=False)[:3000])
m = re.search(r"var UFC_F=(.*?);  ", out); F = json.loads(m.group(1)) if m else {}
for k in list(F)[:2]: print(json.dumps(F[k], ensure_ascii=False)[:2000])
