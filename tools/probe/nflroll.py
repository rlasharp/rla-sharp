import subprocess, os
os.chdir("src")
r = subprocess.run(["python3", "tools/auto_espn.py", "nfl-roll"], capture_output=True, text=True)
print("RC", r.returncode); print(r.stdout[-3000:]); print(r.stderr[-3000:])
