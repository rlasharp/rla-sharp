#!/bin/bash
# Downloads the nflverse files tools/nflgen.py needs into /home/claude/nflv
set -e; Y=${1:-2026}; W="${WORK:-/home/claude}"; mkdir -p "$W/nflv"; cd "$W/nflv"
B=https://github.com/nflverse/nflverse-data/releases/download
curl -sfL -m 180 -o games.csv  $B/schedules/games.csv
curl -sfL -m 180 -o pstats.csv $B/stats_player/stats_player_week_$Y.csv
curl -sfL -m 180 -o snaps.csv  $B/snap_counts/snap_counts_$Y.csv
curl -sfL -m 300 -o pbp.csv.gz $B/pbp/play_by_play_$Y.csv.gz
curl -sfL -m 180 -o ftn.csv $B/ftn_charting/ftn_charting_$Y.csv || echo "no FTN charting file (contested/blitz will be blank)"
ls -la; echo "nflfetch done"
