#!/bin/bash
# Fetch hoopR NBA data (sparse clone) and convert parquet -> JSON in /home/claude/nba. pip/npm are blocked; uses hyparquet from GitHub + Node zstd.
set -e
T="$(cd "$(dirname "$0")" && pwd)"; W="${WORK:-/home/claude}"; mkdir -p "$W"; cd "$W"
mkdir -p nba pq
[ -d pq/hyparquet ] || git clone --depth 1 https://github.com/hyparam/hyparquet pq/hyparquet
cp "$T/read_parquet.mjs" pq/read.mjs
[ -d hoopr ] || git clone --depth 1 --filter=blob:none --no-checkout https://github.com/sportsdataverse/hoopr-nba-data hoopr
cd hoopr && timeout 120 git fetch --depth 1 origin && git log -1 --format='hoopR data commit: %cd' FETCH_HEAD
F="nba/player_box/parquet/player_box_2027.parquet nba/player_box/parquet/player_box_2026.parquet nba/schedules/parquet/nba_schedule_2027.parquet nba/team_box/parquet/team_box_2027.parquet nba/rosters/parquet/rosters_2027.parquet nba/pbp/parquet/play_by_play_2027.parquet"
timeout 300 git checkout FETCH_HEAD -- $F
cd "$W/pq"
node read.mjs ../hoopr/nba/player_box/parquet/player_box_2027.parquet ../nba/player_box_2027.json | cut -c1-80
node read.mjs ../hoopr/nba/player_box/parquet/player_box_2026.parquet ../nba/player_box_2026.json | cut -c1-80
node read.mjs ../hoopr/nba/schedules/parquet/nba_schedule_2027.parquet ../nba/nba_schedule_2027.json | cut -c1-80
node read.mjs ../hoopr/nba/team_box/parquet/team_box_2027.parquet ../nba/team_box_2027.json | cut -c1-80
node read.mjs ../hoopr/nba/rosters/parquet/rosters_2027.parquet ../nba/rosters_2027.json | cut -c1-80
node --max-old-space-size=4096 read.mjs ../hoopr/nba/pbp/parquet/play_by_play_2027.parquet ../nba/pbp_2027.json | cut -c1-80
echo "nbafetch done"
