import sys
p='/home/claude/nfl-edge/plogs2.js';s=open(p).read()
s=s.replace("//@@MORE@@",sys.stdin.read().strip()+"\n//@@MORE@@");open(p,'w').write(s)
