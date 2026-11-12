// Build nba_data.js from hoopR JSON (converted parquet) + hand-kept text files.
// Usage: node tools/nbagen.mjs <hoopr-json-dir> <slate date YYYY-MM-DD, Eastern> > nba_data.js
// Inputs in <dir>: player_box_2027.json, nba_schedule_2027.json
// Text inputs (repo data/): nba_lines.txt, nba_props.txt, nba_inj.txt
import fs from "fs";
import path from "path";
const [dir, slateDate] = process.argv.slice(2);
if (!dir || !slateDate) { console.error("usage: nbagen.mjs <dir> <YYYY-MM-DD>"); process.exit(1); }
const here = path.dirname(new URL(import.meta.url).pathname);
const dataDir = path.join(here, "..", "data");
const box = JSON.parse(fs.readFileSync(path.join(dir, "player_box_2027.json")));
const sched = JSON.parse(fs.readFileSync(path.join(dir, "nba_schedule_2027.json")));
const prevFile = path.join(dir, "player_box_2026.json");
const prevBox = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile)) : [];

// Eastern date of a UTC timestamp (EDT until Nov 1 2026 06:00Z, EST after)
function etDate(iso) {
  const d = new Date(iso);
  const off = d < new Date("2026-11-01T06:00:00Z") ? 4 : (d < new Date("2027-03-14T07:00:00Z") ? 5 : 4);
  return new Date(d.getTime() - off * 3600e3).toISOString();
}
const etDay = iso => etDate(iso).slice(0, 10);
const etTime = iso => { const t = etDate(iso).slice(11, 16); let [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")} ${ap}`; };

// Teams
const TEAMS = {}, TCOL = {};
for (const g of sched) {
  if (g.home_color) TCOL[g.home_abbreviation] = g.home_color;
  if (g.away_color) TCOL[g.away_abbreviation] = g.away_color;
  TEAMS[g.home_abbreviation] = g.home_display_name;
  TEAMS[g.away_abbreviation] = g.away_display_name;
}
const nameToAbbr = Object.fromEntries(Object.entries(TEAMS).map(([a, n]) => [n, a]));

// Results (regular season + cup, completed)
const done = sched.filter(g => g.status_type_completed && g.season_type === 2)
  .sort((a, b) => a.game_date_time < b.game_date_time ? -1 : 1);
const RES = done.map(g => [g.id, etDay(g.game_date_time), g.away_abbreviation, g.home_abbreviation, +g.away_score, +g.home_score]);
const resIds = new Set(RES.map(r => r[0]));

// Player logs
const LOGS = {};
const rows = box.filter(r => resIds.has(r.game_id) && !r.did_not_play && r.minutes > 0)
  .sort((a, b) => a.game_date_time < b.game_date_time ? -1 : 1);
for (const r of rows) {
  const n = r.athlete_display_name;
  const pos = r.athlete_position_abbreviation === "NA" ? "" : r.athlete_position_abbreviation;
  const p = LOGS[n] || (LOGS[n] = { tm: r.team_abbreviation, pos, id: r.athlete_id, g: [] });
  p.tm = r.team_abbreviation;
  if (pos) p.pos = pos;
  // [gameId, date, opp, H/A, min, pts, reb, ast, 3pm, starter, fgm, fga, stl, blk, tov, 3pa, ftm, fta]
  p.g.push([r.game_id, etDay(r.game_date_time), r.opponent_team_abbreviation, r.home_away === "home" ? "H" : "A",
    Math.round(r.minutes), r.points, r.rebounds, r.assists, r.three_point_field_goals_made, r.starter ? 1 : 0,
    r.field_goals_made, r.field_goals_attempted, r.steals, r.blocks, r.turnovers, r.three_point_field_goals_attempted, r.free_throws_made, r.free_throws_attempted, r.fouls == null ? null : +r.fouls]);
}

// 5-position map from ESPN depth charts (data/nba_depth.txt): best depth slot wins, ties go to the earlier row
const POS5 = {};
{
  const f = path.join(dataDir, "nba_depth.txt");
  const best = {};
  if (fs.existsSync(f)) for (const s of fs.readFileSync(f, "utf8").split("\n")) {
    const t = s.trim(); if (!t || t.startsWith("#")) continue;
    if (t.startsWith("=")) { const [n, p] = t.slice(1).split("|"); best[n.trim()] = [p.trim(), -1]; continue; }
    const [pos, ...names] = t.split("|");
    names.forEach((n, i) => { n = n.trim(); if (!n || n === "-") return; if (!(n in best) || (best[n][1] >= 0 && i < best[n][1])) best[n] = [pos, i]; });
  }
  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.']/g, "").toLowerCase().trim();
  const bn = {}; for (const n in best) bn[norm(n)] = best[n][0];
  const fb = { G: "SG", F: "SF", C: "C" };
  let hit = 0, miss = 0;
  for (const [n, p] of Object.entries(LOGS)) { const v = bn[norm(n)]; if (v) { POS5[n] = v; hit++; } else { POS5[n] = fb[p.pos] || ""; miss++; } p.p5 = POS5[n]; p.p5d = v ? 1 : 0; }
  console.error(`positions: ${hit} from depth charts, ${miss} fallback from G/F/C`);
}

// Team stats
const TS = {};
for (const a of Object.keys(TEAMS)) TS[a] = { w: 0, l: 0, pf: 0, pa: 0, g: 0, m: [], ha: [], pos: { G: 0, F: 0, C: 0 } };
for (const [id, d, A, H, as, hs] of RES) {
  for (const [t, f, ag, ha] of [[A, as, hs, "A"], [H, hs, as, "H"]]) {
    const s = TS[t]; if (!s) continue;
    s.g++; s.pf += f; s.pa += ag; f > ag ? s.w++ : s.l++; s.m.push(f - ag); s.ha.push(ha);
  }
}
// points allowed by position (opponent players' points)
for (const r of rows) {
  const pos = r.athlete_position_abbreviation;
  const s = TS[r.opponent_team_abbreviation];
  if (s && s.pos[pos] !== undefined) s.pos[pos] += r.points;
}
const TEAM = {};
for (const [a, s] of Object.entries(TS)) {
  if (!s.g) continue;
  const l5 = s.m.slice(-5);
  const home = s.m.filter((_, i) => s.ha[i] === "H"), away = s.m.filter((_, i) => s.ha[i] === "A");
  TEAM[a] = {
    w: s.w, l: s.l, g: s.g, ppg: +(s.pf / s.g).toFixed(1), opp: +(s.pa / s.g).toFixed(1),
    mar: +((s.pf - s.pa) / s.g).toFixed(1), l5: l5.map(x => x > 0 ? "W" : "L").join(""),
    l5m: +(l5.reduce((x, y) => x + y, 0) / l5.length).toFixed(1),
    hm: home.length ? home.filter(x => x > 0).length + "-" + home.filter(x => x < 0).length : "0-0",
    aw: away.length ? away.filter(x => x > 0).length + "-" + away.filter(x => x < 0).length : "0-0",
    pG: +(s.pos.G / s.g).toFixed(1), pF: +(s.pos.F / s.g).toFixed(1), pC: +(s.pos.C / s.g).toFixed(1)
  };
}
// ranks (1 = most allowed / best)
const rank = (k, desc) => { const arr = Object.keys(TEAM).sort((x, y) => desc ? TEAM[y][k] - TEAM[x][k] : TEAM[x][k] - TEAM[y][k]); arr.forEach((t, i) => TEAM[t][k + "R"] = i + 1); };
rank("ppg", true); rank("opp", false); rank("mar", true); rank("pG", true); rank("pF", true); rank("pC", true);

// Slate
const SLATE = sched.filter(g => etDay(g.game_date_time) === slateDate)
  .sort((a, b) => a.game_date_time < b.game_date_time ? -1 : 1)
  .map(g => ({ id: g.id, a: g.away_abbreviation, h: g.home_abbreviation, t: etTime(g.game_date_time), tv: g.broadcast_name || "" }));

// ---------- Team offense / defense from team box scores ----------
const tbFile = path.join(dir, "team_box_2027.json");
const TADV = {};
if (fs.existsSync(tbFile)) {
  const tb = JSON.parse(fs.readFileSync(tbFile)).filter(r => resIds.has(r.game_id));
  const byG = {}; for (const r of tb) (byG[r.game_id] = byG[r.game_id] || []).push(r);
  const acc = {};
  const num = v => +v || 0;
  for (const rows of Object.values(byG)) {
    if (rows.length !== 2) continue;
    for (const [me, op] of [[rows[0], rows[1]], [rows[1], rows[0]]]) {
      const t = me.team_abbreviation, a = acc[t] || (acc[t] = { g: 0, o: {}, d: {} });
      a.g++;
      for (const [side, r] of [["o", me], ["d", op]]) {
        const s = a[side];
        const add = (k, v) => s[k] = (s[k] || 0) + num(v);
        add("pts", r.team_score); add("fgm", r.field_goals_made); add("fga", r.field_goals_attempted);
        add("tpm", r.three_point_field_goals_made); add("tpa", r.three_point_field_goals_attempted);
        add("ftm", r.free_throws_made); add("fta", r.free_throws_attempted);
        add("oreb", r.offensive_rebounds); add("dreb", r.defensive_rebounds); add("reb", r.total_rebounds);
        add("ast", r.assists); add("tov", r.total_turnovers || r.turnovers); add("stl", r.steals); add("blk", r.blocks);
        add("paint", r.points_in_paint); add("fb", r.fast_break_points); add("tovpts", r.turnover_points);
      }
    }
  }
  for (const [t, a] of Object.entries(acc)) {
    const f = s => {
      const poss = s.fga - s.oreb + s.tov + 0.44 * s.fta;
      return { pts: s.pts / a.g, fg: s.fgm / s.fga * 100, tp: s.tpm / s.tpa * 100, tpa: s.tpa / a.g, ft: s.ftm / Math.max(1, s.fta) * 100, fta: s.fta / a.g,
        oreb: s.oreb / a.g, reb: s.reb / a.g, ast: s.ast / a.g, tov: s.tov / a.g, stl: s.stl / a.g, blk: s.blk / a.g,
        paint: s.paint / a.g, fb: s.fb / a.g, poss: poss / a.g, rtg: s.pts / poss * 100 };
    };
    const o = f(a.o), d = f(a.d);
    TADV[t] = { g: a.g, o, d, pace: (o.poss + d.poss) / 2 };
  }
  // ranks: offense higher better (tov lower better); defense lower allowed better (stl/blk/tov forced higher better)
  const keys = Object.keys(TADV);
  const rk = (side, k, higherBetter) => { const arr = keys.slice().sort((x, y) => higherBetter ? TADV[y][side][k] - TADV[x][side][k] : TADV[x][side][k] - TADV[y][side][k]); arr.forEach((t, i) => (TADV[t][side + "R"] = TADV[t][side + "R"] || {})[k] = i + 1); };
  for (const k of ["pts", "fg", "tp", "tpa", "ft", "fta", "oreb", "reb", "ast", "stl", "blk", "paint", "fb", "rtg"]) { rk("o", k, true); rk("d", k, false); }
  rk("o", "tov", false); rk("d", "tov", true); rk("d", "stl", true); rk("d", "blk", true);
  { const arr = keys.slice().sort((x, y) => TADV[y].pace - TADV[x].pace); arr.forEach((t, i) => TADV[t].paceR = i + 1); }
  for (const t of keys) { for (const s of ["o", "d"]) for (const k in TADV[t][s]) TADV[t][s][k] = +TADV[t][s][k].toFixed(1); TADV[t].pace = +TADV[t].pace.toFixed(1); }
}

// ---------- Rest / schedule context for tonight ----------
const REST = {};
for (const s of SLATE) for (const t of [s.a, s.h]) {
  const last = RES.filter(r => r[2] === t || r[3] === t).slice(-1)[0];
  if (!last) continue;
  const days = Math.round((new Date(slateDate + "T12:00:00Z") - new Date(last[1] + "T12:00:00Z")) / 864e5) - 1;
  const nextG = sched.filter(g => (g.home_abbreviation === t || g.away_abbreviation === t) && etDay(g.game_date_time) > slateDate).sort((a, b) => a.game_date_time < b.game_date_time ? -1 : 1)[0];
  const tomorrow = nextG && Math.round((new Date(etDay(nextG.game_date_time) + "T12:00:00Z") - new Date(slateDate + "T12:00:00Z")) / 864e5) === 1;
  REST[t] = { rest: days, last: last[1], b2bNext: !!tomorrow };
}

// ---------- Schedule spots (tonight) + next 7 days for every team ----------
const SPOT = {}, NEXT = {};
{
  const all = sched.filter(g => g.season_type === 2).map(g => ({ d: etDay(g.game_date_time), a: g.away_abbreviation, h: g.home_abbreviation, t: etTime(g.game_date_time), id: g.id }))
    .sort((x, y) => x.d < y.d ? -1 : x.d > y.d ? 1 : 0);
  const dd = (a, b) => Math.round((new Date(a + "T12:00:00Z") - new Date(b + "T12:00:00Z")) / 864e5);
  for (const s of SLATE) for (const t of [s.a, s.h]) {
    const mine = all.filter(g => (g.a === t || g.h === t) && g.d <= slateDate);
    const g4 = mine.filter(g => dd(slateDate, g.d) <= 3).length, g6 = mine.filter(g => dd(slateDate, g.d) <= 5).length;
    let trip = 0; for (let i = mine.length - 1; i >= 0 && mine[i].a === t; i--) trip++;
    let prevAway = 0; if (mine.length && mine[mine.length - 1].h === t) for (let i = mine.length - 2; i >= 0 && mine[i].a === t; i--) prevAway++;
    SPOT[t] = { g4, g6, trip, home: prevAway };
  }
  const end = new Date(slateDate + "T12:00:00Z"); end.setUTCDate(end.getUTCDate() + 7); const endD = end.toISOString().slice(0, 10);
  for (const t of Object.keys(TEAMS)) NEXT[t] = all.filter(g => (g.a === t || g.h === t) && g.d > slateDate && g.d <= endD).map(g => [g.d, g.a === t ? g.h : g.a, g.a === t ? "A" : "H", g.t]);
}

// ---------- Advanced player stats: usage %, true shooting %, per-36, plus/minus ----------
const FB = {}; const Q1 = {}; const GPACE = {};
const PADV = {};
if (fs.existsSync(tbFile)) {
  const tbAll = JSON.parse(fs.readFileSync(tbFile)).filter(r => resIds.has(r.game_id));
  const TT = {}; for (const r of tbAll) TT[r.game_id + "|" + r.team_abbreviation] = { fga: +r.field_goals_attempted || 0, fta: +r.free_throws_attempted || 0, tov: +(r.total_turnovers || r.turnovers) || 0 };
  { const pg = {}; for (const r of tbAll) { const p = (+r.field_goals_attempted || 0) - (+r.offensive_rebounds || 0) + (+(r.total_turnovers || r.turnovers) || 0) + 0.44 * (+r.free_throws_attempted || 0); (pg[r.game_id] || (pg[r.game_id] = [])).push(p); }
    for (const [gid, a] of Object.entries(pg)) if (a.length === 2) GPACE[gid] = +((a[0] + a[1]) / 2).toFixed(1); }
  const per = {}; const gmin = {};
  for (const r of rows) { const k = r.game_id + "|" + r.team_abbreviation; gmin[k] = (gmin[k] || 0) + (+r.minutes || 0); }
  for (const r of rows) {
    const k = r.game_id + "|" + r.team_abbreviation, T = TT[k]; if (!T) continue;
    const a = per[r.athlete_display_name] || (per[r.athlete_display_name] = { min: 0, fga: 0, fta: 0, tov: 0, pts: 0, reb: 0, ast: 0, pm: 0, g: 0, u1: 0, u2: 0 });
    const m = +r.minutes || 0, tm = Math.max(240, Math.round(gmin[k] / 5) * 5);
    a.min += m; a.fga += +r.field_goals_attempted || 0; a.fta += +r.free_throws_attempted || 0; a.tov += +r.turnovers || 0;
    a.pts += +r.points || 0; a.reb += +r.rebounds || 0; a.ast += +r.assists || 0; a.pm += +r.plus_minus || 0; a.g++;
    a.u1 += ((+r.field_goals_attempted || 0) + 0.44 * (+r.free_throws_attempted || 0) + (+r.turnovers || 0)) * (tm / 5);
    a.u2 += m * (T.fga + 0.44 * T.fta + T.tov);
  }
  for (const [n, a] of Object.entries(per)) {
    if (!LOGS[n] || a.min < 30) continue;
    const ts = a.fga + 0.44 * a.fta ? a.pts / (2 * (a.fga + 0.44 * a.fta)) * 100 : 0;
    PADV[n] = { usg: +(a.u2 ? a.u1 / a.u2 * 100 : 0).toFixed(1), ts: +ts.toFixed(1), pm: +(a.pm / a.g).toFixed(1), p36: [a.pts, a.reb, a.ast].map(v => +(v / a.min * 36).toFixed(1)), mpg: +(a.min / a.g).toFixed(1) };
  }
  const elig = Object.keys(PADV).filter(n => PADV[n].mpg >= 15);
  for (const k of ["usg", "ts", "pm"]) elig.slice().sort((x, y) => PADV[y][k] - PADV[x][k]).forEach((n, i) => PADV[n][k + "R"] = i + 1);
  for (const n of elig) PADV[n].N = elig.length;
}

// ---------- Shot zones from play-by-play ----------
const ZONES = ["Restricted area", "Paint", "Left mid-range", "Middle mid-range", "Right mid-range", "Left corner 3", "Right corner 3", "Left wing 3", "Top of the key 3", "Right wing 3"];
const zoneOf = (x, y, pts) => {
  // hoopR raw coords: x 0-50 across the court, y in feet from the rim line (rim ≈ (25, 0.75)); baseline ≈ y -4.5
  const dx = x - 25, dy = y - 0.75, d = Math.sqrt(dx * dx + dy * dy);
  if (pts === 3) { if (y < 9) return dx < 0 ? 5 : 6; const ang = Math.atan2(dx, dy) * 180 / Math.PI; return ang < -22 ? 7 : ang > 22 ? 9 : 8; }
  if (d < 4) return 0;
  if (Math.abs(dx) < 8 && y < 14.5) return 1;
  const ang = Math.atan2(dx, dy) * 180 / Math.PI; return ang < -30 ? 2 : ang > 30 ? 4 : 3;
};
const QMIN = {}; const FOULQ = {}; const SHOT = {}; let LGZ = null; const STYPE = {}; let LGST = null; const CHANCE = {}; const QTR = {}; const DZONE = {}; const OZONE = {}; const DZG = {}; const TST = {};
const pbpFile = path.join(dir, "pbp_2027.json");
if (fs.existsSync(pbpFile)) {
  const pbp = JSON.parse(fs.readFileSync(pbpFile));
  const idToName = {}; for (const [n, p] of Object.entries(LOGS)) idToName[p.id] = n;
  const lg = ZONES.map(() => [0, 0]);
  for (const r of pbp) {
    if (!r.shooting_play || !(r.points_attempted >= 2) || r.coordinate_x_raw == null || r.coordinate_y_raw == null) continue;
    const x = +r.coordinate_x_raw, y = +r.coordinate_y_raw; if (!(x >= 0 && x <= 50 && y >= -5 && y <= 47)) continue;
    const z = zoneOf(x, y, r.points_attempted), made = r.scoring_play ? 1 : 0;
    lg[z][0]++; lg[z][1] += made;
    // defense = the team that did NOT shoot; used for "what the opponent allows" shot maps
    const def = String(r.team_id) === String(r.home_team_id) ? r.away_team_abbrev : r.home_team_abbrev;
    if (def) { const dz = DZONE[def] || (DZONE[def] = ZONES.map(() => [0, 0])); dz[z][0]++; dz[z][1] += made; (DZG[def] || (DZG[def] = new Set())).add(r.game_id); }
    // shot type (ESPN play-by-play wording): 0 catch & shoot (plain "Jump Shot" from 10+ ft, no dribble move named),
    // 1 pull-up (Pullup / Step Back jumpers), 2 under 10 ft (any shot), 3 other jumpers 10+ ft (fadeaways, turnarounds, floaters, hooks, running)
    const fm = /(\d+)-foot/.exec(r.text || ""), dist = fm ? +fm[1] : Math.sqrt((x - 25) ** 2 + (y - 0.75) ** 2);
    const tt = String(r.type_text || ""), st = dist < 10 ? 2 : /Pullup|Step Back/i.test(tt) ? 1 : /^Jump Shot( Bank)?$/i.test(tt) ? 0 : 3, th = r.points_attempted === 3 ? 1 : 0;
    const LT = LGST || (LGST = [0, 1, 2, 3].map(() => [0, 0, 0, 0])); LT[st][0]++; LT[st][1] += made; LT[st][2] += th; LT[st][3] += th && made;
    // team shot types: what each offense takes and what each defense allows (catch & shoot, pull-up, ...)
    const off = String(r.team_id) === String(r.home_team_id) ? r.home_team_abbrev : r.away_team_abbrev;
    if (off) { const oz = OZONE[off] || (OZONE[off] = ZONES.map(() => [0, 0])); oz[z][0]++; oz[z][1] += made; }
    for (const [tm, side] of [[off, "o"], [def, "d"]]) { if (!tm) continue; const T = TST[tm] || (TST[tm] = { o: [0, 1, 2, 3].map(() => [0, 0, 0, 0]), d: [0, 1, 2, 3].map(() => [0, 0, 0, 0]) }); const q = T[side][st]; q[0]++; q[1] += made; q[2] += th; q[3] += th && made; }
    const n = idToName[r.athlete_id_1]; if (!n) continue;
    const s = SHOT[n] || (SHOT[n] = ZONES.map(() => [0, 0])); s[z][0]++; s[z][1] += made;
    const t = STYPE[n] || (STYPE[n] = [0, 1, 2, 3].map(() => [0, 0, 0, 0])); t[st][0]++; t[st][1] += made; t[st][2] += th; t[st][3] += th && made;
  }
  LGZ = lg;
  // ---------- Fouls by quarter (for "foul trouble" splits): player -> [[game id, Q1 fouls, 1st-half fouls, game fouls]] ----------
  { const FQ = {}; const idToName2 = {}; for (const [n, p] of Object.entries(LOGS)) idToName2[p.id] = n;
    for (const r of pbp) { const t = String(r.type_text || ""); if (!/Foul/i.test(t) || /Technical|Flagrant Foul Type 2|Too Many/i.test(t)) continue;
      const n = idToName2[r.athlete_id_1]; if (!n) continue; const q = +r.period_number;
      const G = FQ[n] || (FQ[n] = {}), g = G[r.game_id] || (G[r.game_id] = [0, 0, 0]); if (q === 1) g[0]++; if (q <= 2) g[1]++; g[2]++; }
    for (const [n, G] of Object.entries(FQ)) FOULQ[n] = Object.entries(G).map(([id, v]) => [id, ...v]); }
  // ---------- Quarter scoring: end-of-quarter score per game -> points by quarter ----------
  const endQ = {};
  for (const r of pbp) { const q = +r.period_number; if (!(q >= 1 && q <= 4)) continue; const e = endQ[r.game_id] || (endQ[r.game_id] = {}); const cur = e[q] || (e[q] = { a: 0, h: 0 });
    cur.a = Math.max(cur.a, +r.away_score || 0); cur.h = Math.max(cur.h, +r.home_score || 0); }
  for (const e of Object.values(endQ)) for (let q = 2; q <= 4; q++) if (e[q] && e[q - 1]) { e[q].a = Math.max(e[q].a, e[q - 1].a); e[q].h = Math.max(e[q].h, e[q - 1].h); }
  for (const g of RES) { const e = endQ[g[0]]; if (!e || ![1, 2, 3, 4].every(q => e[q])) continue;
    const qa = [1, 2, 3, 4].map(q => e[q].a - (q > 1 ? e[q - 1].a : 0)), qh = [1, 2, 3, 4].map(q => e[q].h - (q > 1 ? e[q - 1].h : 0));
    if (qa.some(v => v < 0 || v > 70) || qh.some(v => v < 0 || v > 70)) continue;
    (QTR[g[2]] = QTR[g[2]] || []).push([g[0], g[1], g[3], "A", qa, qh]);
    (QTR[g[3]] = QTR[g[3]] || []).push([g[0], g[1], g[2], "H", qh, qa]); }

  // ---------- Rebound + assist chances from on-court lineups (rebuilt from substitutions) ----------
  // per player per game: [date, ownMiss, oppMiss, oreb, dreb, teammateFGM, ast, min]
  // ownMiss/oppMiss = missed shots (and last missed free throws) by his team / the other team while he was on the floor;
  // teammateFGM = field goals his teammates made while he was on the floor (the shots he could have assisted).
  const byG = {}; for (const r of pbp) (byG[r.game_id] || (byG[r.game_id] = [])).push(r);
  const boxG = {}; for (const b of box) { if (b.did_not_play) continue; (boxG[b.game_id] || (boxG[b.game_id] = {}))[String(b.athlete_id)] = b; }
  const clk = r => { const m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(String(r.clock_display_value || "")); return m ? +m[1] * 60 + +m[2] : NaN; };
  const PG = {}; let chkN = 0, chkBad = 0;
  for (const [gid, ev0] of Object.entries(byG)) {
    const B = boxG[gid]; if (!B) continue; const ev = ev0.slice().sort((a, b) => (+a.sequence_number) - (+b.sequence_number));
    const teamOf = {}; for (const id in B) teamOf[id] = String(B[id].team_id);
    const acc = {}, A = id => acc[id] || (acc[id] = [0, 0, 0, 0]), accQ = {}, AQ = id => accQ[id] || (accQ[id] = [0, 0, 0, 0, 0]); let prevEnd = null;
    for (const q of [...new Set(ev.map(r => +r.period_number))].sort((a, b) => a - b)) {
      const E = ev.filter(r => +r.period_number === q), seenIn = new Set(), start = new Set();
      for (const r of E) {
        if (/Substitution/i.test(r.type_text)) { const i = String(r.athlete_id_1), o = String(r.athlete_id_2); if (!seenIn.has(o)) start.add(o); seenIn.add(i); continue; }
        if (/Technical|Ejection|Timeout/i.test(r.type_text)) continue;
        for (const id of [r.athlete_id_1, r.athlete_id_2, r.athlete_id_3]) { if (id == null) continue; const k = String(id); if (teamOf[k] && !seenIn.has(k)) start.add(k); }
      }
      if (q === 1) for (const id in B) if (B[id].starter) start.add(id);
      const on = {}; for (const k of start) { const t = teamOf[k]; if (t) (on[t] || (on[t] = new Set())).add(k); }
      for (const t of Object.keys(on)) if (on[t].size < 5 && prevEnd && prevEnd[t]) for (const k of prevEnd[t]) { if (on[t].size >= 5) break; on[t].add(k); }
      let last = q <= 4 ? 720 : 300;
      for (const r of E) {
        const sc = clk(r); if (Number.isFinite(sc) && sc < last) { const d = last - sc; for (const t in on) for (const k of on[t]) { A(k)[3] += d; AQ(k)[Math.min(q, 5) - 1] += d; } last = sc; }
        if (/Substitution/i.test(r.type_text)) { const i = String(r.athlete_id_1), o = String(r.athlete_id_2), t = teamOf[i] || teamOf[o]; if (t) { (on[t] || (on[t] = new Set())).delete(o); on[t].add(i); } continue; }
        const tm = String(r.team_id);
        const missFG = r.shooting_play && !r.scoring_play && r.points_attempted >= 2;
        const missFT = !r.scoring_play && /^Free Throw - (1 of 1|2 of 2|3 of 3)$/.test(String(r.type_text || ""));
        if (missFG || missFT) { let n = 0; for (const t in on) for (const k of on[t]) { n++; A(k)[t === tm ? 0 : 1]++; } chkN++; if (n !== 10) chkBad++; }
        if (r.shooting_play && r.scoring_play && r.points_attempted >= 2 && on[tm]) for (const k of on[tm]) if (k !== String(r.athlete_id_1)) A(k)[2]++;
      }
      if (last > 0) for (const t in on) for (const k of on[t]) { A(k)[3] += last; AQ(k)[Math.min(q, 5) - 1] += last; }
      prevEnd = on;
    }
    for (const id in acc) { const b = B[id], n = idToName[id]; if (!b || !n) continue;
      // skip games where the rebuilt minutes are far off the box score (lineup data incomplete)
      if (Math.abs(acc[id][3] / 60 - (+b.minutes || 0)) > 4) continue;
      { const rg = RES.find(x => String(x[0]) === String(gid)), my = String(b.team_id), q_ = (accQ[id] || [0, 0, 0, 0, 0]).map(v => Math.round(v / 6) / 10);
        let mg = null; if (rg) { const home = b.home_away ? b.home_away === "home" : b.team_abbreviation === rg[3]; mg = home ? rg[5] - rg[4] : rg[4] - rg[5]; }
        (QMIN[n] || (QMIN[n] = [])).push([String(b.game_date).slice(0, 10), ...q_, mg]); }
      (PG[n] || (PG[n] = [])).push([String(b.game_date).slice(0, 10), acc[id][0], acc[id][1], +b.offensive_rebounds || 0, +b.defensive_rebounds || 0, acc[id][2], +b.assists || 0, +b.minutes || 0]); }
  }
  // season / last 10 / last 5 sums: [games, ownMiss, oppMiss, oreb, dreb, teammateFGM, ast, min]
  const sum = a => a.reduce((s, r) => s.map((v, i) => v + r[i + 1]), [0, 0, 0, 0, 0, 0, 0]).map(v => +v.toFixed(0));
  for (const [n, g] of Object.entries(PG)) { g.sort((a, b) => a[0] < b[0] ? -1 : 1); CHANCE[n] = { s: [g.length, ...sum(g)], l10: [Math.min(10, g.length), ...sum(g.slice(-10))], l5: [Math.min(5, g.length), ...sum(g.slice(-5))], last: g.slice(-10).map(r => [r[0], r[1] + r[2], r[3] + r[4], r[5], r[6], r[7]]) }; }
  console.error(`chances: ${Object.keys(CHANCE).length} players, ${chkN} misses, ${(chkBad / Math.max(1, chkN) * 100).toFixed(1)}% without exactly 10 on court`);
  // ---------- First basket (first made field goal) + who won the opening possession; 1st-quarter player stats ----------
  const resById = {}; for (const g of RES) resById[g[0]] = g;
  for (const [gid, ev0] of Object.entries(byG)) {
    const g = resById[gid]; if (!g) continue; const ev = ev0.slice().sort((a, b) => (+a.sequence_number) - (+b.sequence_number));
    const ab = r => String(r.team_id) === String(r.home_team_id) ? r.home_team_abbrev : String(r.team_id) === String(r.away_team_id) ? r.away_team_abbrev : null;
    const fb = ev.find(r => +r.period_number === 1 && r.shooting_play && r.scoring_play && r.points_attempted >= 2);
    const poss = ev.find(r => +r.period_number === 1 && (r.shooting_play || /Turnover|Foul/i.test(String(r.type_text || ""))) && ab(r));
    let tip = null; if (poss) { tip = ab(poss); if (/Foul/i.test(String(poss.type_text)) && !poss.shooting_play) tip = tip === g[2] ? g[3] : g[2]; }   // a foul is usually by the defense
    if (fb) FB[gid] = [idToName[fb.athlete_id_1] || null, ab(fb), tip];
    const q = {};
    for (const r of ev) { if (+r.period_number !== 1) continue;
      const P = id => { const n = idToName[id]; return n ? (q[n] || (q[n] = [0, 0, 0])) : null; };
      if (r.scoring_play && r.athlete_id_1 != null) { const x = P(r.athlete_id_1); if (x) x[0] += +r.score_value || 0;
        if (r.points_attempted >= 2 && r.athlete_id_2 != null) { const y = P(r.athlete_id_2); if (y) y[2] += 1; } }
      if (/Rebound/i.test(String(r.type_text || "")) && !/Team/i.test(String(r.type_text || "")) && r.athlete_id_1 != null) { const x = P(r.athlete_id_1); if (x) x[1] += 1; } }
    const played = new Set(Object.keys(boxG[gid] || {}).map(id => idToName[id]).filter(Boolean));
    for (const n of played) { const b = Object.values(boxG[gid]).find(z => idToName[String(z.athlete_id)] === n); if (!b || !(+b.minutes > 0)) continue;
      (Q1[n] || (Q1[n] = [])).push([g[1], ...(q[n] || [0, 0, 0])]); }
  }
  for (const n in Q1) Q1[n] = Q1[n].sort((a, b) => a[0] < b[0] ? -1 : 1).slice(-25);
  console.error(`first basket: ${Object.keys(FB).length} games; 1st-quarter stats: ${Object.keys(Q1).length} players`);
}

// ---------- Height / weight / age from rosters ----------
const BIO = {};
const roFile = path.join(dir, "rosters_2027.json");
if (fs.existsSync(roFile)) {
  const ro = JSON.parse(fs.readFileSync(roFile));
  const byId = {}; for (const r of ro) byId[r.athlete_id] = r;
  for (const [n, p] of Object.entries(LOGS)) { const r = byId[p.id]; if (r) BIO[n] = [r.height || "", r.weight || "", r.age || "", r.jersey || "", r.experience_years || ""]; }
}

// Text inputs
// Last season (2025-26) context for tonight's teams: player tail + games vs tonight's opponent, and team head-to-head
const rowOf = r => [r.game_id, etDay(r.game_date_time), r.opponent_team_abbreviation, r.home_away === "home" ? "H" : "A",
  Math.round(r.minutes), r.points, r.rebounds, r.assists, r.three_point_field_goals_made, r.starter ? 1 : 0,
  r.field_goals_made, r.field_goals_attempted, r.steals, r.blocks, r.turnovers, r.three_point_field_goals_attempted,
  r.free_throws_made, r.free_throws_attempted, r.season_type === 3 ? 1 : 0];
const oppTonight = {};
for (const s of SLATE) { oppTonight[s.a] = s.h; oppTonight[s.h] = s.a; }
const PREV = {};
const prevPlayed = prevBox.filter(r => !r.did_not_play && r.minutes > 0 && (r.season_type === 2 || r.season_type === 3 || r.season_type === 5))
  .sort((a, b) => a.game_date_time < b.game_date_time ? -1 : 1);
const byId = {};
for (const r of prevPlayed) (byId[r.athlete_id] = byId[r.athlete_id] || []).push(r);
for (const [n, p] of Object.entries(LOGS)) {
  const opp = oppTonight[p.tm]; if (!opp) continue;
  const rs = byId[p.id] || []; if (!rs.length) continue;
  const tail = rs.slice(-10), vs = rs.filter(r => r.opponent_team_abbreviation === opp);
  const keep = [...new Map([...vs, ...tail].map(r => [r.game_id, r])).values()].sort((a, b) => a.game_date_time < b.game_date_time ? -1 : 1);
  PREV[n] = keep.map(rowOf);
}
// former teams (revenge games): every team a current player played for last season or earlier this season, other than his team now
const FORMER = {};
{ const T = {}; for (const r of [...prevPlayed, ...rows]) { const t = r.team_abbreviation; if (!t) continue; const m = T[r.athlete_id] || (T[r.athlete_id] = {}); const x = m[t] || (m[t] = [0, ""]); x[0]++; const d = etDay(r.game_date_time); if (d > x[1]) x[1] = d; }
  for (const [n, p] of Object.entries(LOGS)) { const m = T[p.id]; if (!m) continue; const f = Object.entries(m).filter(([t, x]) => t !== p.tm && x[0] >= 5).map(([t, x]) => [t, x[0], x[1]]); if (f.length) FORMER[n] = f; } }
// tonight's rosters (by minutes) + which of those teammates played alongside in each last-season game we keep
const ROS = {};
for (const t of Object.keys(oppTonight)) ROS[t] = Object.entries(LOGS).filter(([n, p]) => p.tm === t)
  .sort((a, b) => b[1].g.reduce((s, x) => s + x[4], 0) / b[1].g.length - a[1].g.reduce((s, x) => s + x[4], 0) / a[1].g.length).map(([n]) => n);
const prevByGame = {};
for (const r of prevPlayed) (prevByGame[r.game_id] = prevByGame[r.game_id] || []).push(r);
for (const [n, rows] of Object.entries(PREV)) {
  const tm = LOGS[n].tm, ros = ROS[tm] || [];
  const ids = new Set(ros.map(x => LOGS[x].id));
  for (const row of rows) {
    const me = (prevByGame[row[0]] || []).find(r => r.athlete_id === LOGS[n].id);
    const mates = (prevByGame[row[0]] || []).filter(r => me && r.team_abbreviation === me.team_abbreviation && ids.has(r.athlete_id) && r.athlete_id !== me.athlete_id);
    row.push(mates.map(r => ros.findIndex(x => LOGS[x].id === r.athlete_id)).filter(i => i >= 0));
  }
}

// team meetings last season (regular + playoffs) from player box team scores
const H2H = {};
const seen = new Set();
for (const s of SLATE) H2H[s.a + "@" + s.h] = [];
for (const r of prevBox) {
  if (seen.has(r.game_id) || r.home_away !== "home") continue;
  const h = r.team_abbreviation, a = r.opponent_team_abbreviation;
  for (const s of SLATE) if ((s.a === a && s.h === h) || (s.a === h && s.h === a)) {
    seen.add(r.game_id);
    H2H[s.a + "@" + s.h].push([etDay(r.game_date_time), a, h, +r.opponent_team_score, +r.team_score, r.season_type === 3 ? "PO" : r.season_type === 5 ? "PI" : "RS", "2025-26"]);
  }
}
for (const k in H2H) H2H[k].sort((x, y) => x[0] < y[0] ? -1 : 1);

const lines = f => fs.existsSync(path.join(dataDir, f)) ? fs.readFileSync(path.join(dataDir, f), "utf8").split("\n").map(s => s.trim()).filter(s => s && !s.startsWith("#") || s.startsWith("#") && !s.startsWith("# ")) : [];
const LINES = {};
let linesAsof = "";
for (const s of (fs.existsSync(path.join(dataDir, "nba_lines.txt")) ? fs.readFileSync(path.join(dataDir, "nba_lines.txt"), "utf8").split("\n") : [])) {
  const t = s.trim(); if (!t) continue;
  if (t.startsWith("# asof:")) { linesAsof = t.slice(7).trim(); continue; }
  if (t.startsWith("#")) continue;
  const [k, os, ot, sp, spx, tot, ox, ux, mla, mlh] = t.split("|");
  LINES[k] = { open: { sp: +os, tot: +ot }, sp: +sp, spx: +spx, tot: +tot, ox: +ox, ux: +ux, mla: +mla, mlh: +mlh };
}
const PROPS = [];
for (const s of (fs.existsSync(path.join(dataDir, "nba_props.txt")) ? fs.readFileSync(path.join(dataDir, "nba_props.txt"), "utf8").split("\n") : [])) {
  const t = s.trim(); if (!t || t.startsWith("#")) continue;
  // player|market|line|over|under|book[|best over|best-over book|best under|best-under book]  (best = best price at the SAME line across books)
  const [p, m, l, o, u, b, bo, bob, bu, bub] = t.split("|");
  if (!LOGS[p]) { console.error("prop player without logs, skipped:", p); continue; }
  const row = [p, m, +l, o ? +o : null, u ? +u : null, b || ""];
  if (bo || bu) row.push(bo ? +bo : null, bob || "", bu ? +bu : null, bub || "");
  PROPS.push(row);
}
const INJ = {};
let cur = null;
for (const s of (fs.existsSync(path.join(dataDir, "nba_inj.txt")) ? fs.readFileSync(path.join(dataDir, "nba_inj.txt"), "utf8").split("\n") : [])) {
  const t = s.trim(); if (!t) continue;
  if (t.startsWith("#")) { const nm = t.slice(1).trim(); cur = nameToAbbr[nm] || nm; INJ[cur] = []; continue; }
  if (cur) INJ[cur].push(t.split("|"));
}

// locked Plays of the day history (tools/nbaplays.mjs writes it): date|player|market|side|line|odds|book|team|opp
const PLAYLOG = lines("nba_plays.txt").filter(s => !s.startsWith("#")).map(s => { const a = s.split("|"); return [a[0], a[1], a[2], a[3], +a[4], +a[5], a[6] || "", a[7] || "", a[8] || ""]; });

const lastDay = RES.length ? RES[RES.length - 1][1] : "";
const out = `/* NBA data — box scores & schedule from hoopR / sportsdataverse (ESPN data); lines from ESPN (DraftKings); injuries from ESPN.
   Generated by tools/nbagen.mjs — do not hand-edit; edit data/nba_*.txt and rerun. */
const NBA_ASOF=${JSON.stringify(lastDay)};
const NBA_SLATE_DATE=${JSON.stringify(slateDate)};
const NBA_LINES_ASOF=${JSON.stringify(linesAsof)};
const NBA_TEAMS=${JSON.stringify(TEAMS)};
const NBA_TCOL=${JSON.stringify(TCOL)};
const NBA_TEAM=${JSON.stringify(TEAM)};
const NBA_RES=${JSON.stringify(RES)};
const NBA_SLATE=${JSON.stringify(SLATE)};
const NBA_LINES=${JSON.stringify(LINES)};
const NBA_PROPS=${JSON.stringify(PROPS)};
const NBA_INJ=${JSON.stringify(INJ)};
const NBA_LOGS=${JSON.stringify(LOGS)};
const NBA_PREV=${JSON.stringify(PREV)};
const NBA_FORMER=${JSON.stringify(FORMER)}; /* player -> [[former team, games for them, last game date]] (last season + earlier this season) */
const NBA_H2H=${JSON.stringify(H2H)};
const NBA_ROS=${JSON.stringify(ROS)};
const NBA_TADV=${JSON.stringify(TADV)};
const NBA_REST=${JSON.stringify(REST)};
const NBA_ZONES=${JSON.stringify(ZONES)};
const NBA_LGZ=${JSON.stringify(LGZ)};
const NBA_SHOT=${JSON.stringify(SHOT)};
const NBA_STYPE=${JSON.stringify(STYPE)}; /* [catch&shoot, pull-up, <10 ft, other 10+ ft] each [FGA, FGM, 3PA, 3PM], this season, ESPN play-by-play */
const NBA_LGST=${JSON.stringify(LGST)};
const NBA_FB=${JSON.stringify(FB)}; /* game id -> [first-basket scorer, his team, team that won the opening possession] */
const NBA_Q1=${JSON.stringify(Q1)}; /* player -> [[date, 1st-quarter pts, reb, ast], ...] last 25 games */
const NBA_GPACE=${JSON.stringify(GPACE)}; /* game id -> possessions per team */
const NBA_CHANCE=${JSON.stringify(CHANCE)};
const NBA_FOULQ=${JSON.stringify(FOULQ)}; /* player -> [[game id, 1st-quarter fouls, 1st-half fouls, game fouls]] (ESPN play-by-play) */
const NBA_QMIN=${JSON.stringify(Object.fromEntries(Object.entries(QMIN).map(([n, a]) => [n, a.sort((x, y) => x[0] < y[0] ? -1 : 1).slice(-25)])))}; /* minutes by quarter (rebuilt from substitutions): [date, Q1, Q2, Q3, Q4, OT, his team's final margin] */ /* rebound + assist chances rebuilt from ESPN play-by-play lineups: s/l10/l5 = [games, ownMiss, oppMiss, oreb, dreb, teammateFGM, ast, min] */
const NBA_TSTYPE=${JSON.stringify(TST)}; /* per team: o = shots taken, d = shots allowed; [catch&shoot, pull-up, <10 ft, other 10+ ft] each [FGA, FGM, 3PA, 3PM] */
const NBA_DZONE=${JSON.stringify(DZONE)};
const NBA_OZONE=${JSON.stringify(OZONE)}; /* per team: shots taken by zone [FGA, FGM], this season */
const NBA_DZG=${JSON.stringify(Object.fromEntries(Object.entries(DZG).map(([t, g]) => [t, g.size])))};
const NBA_BIO=${JSON.stringify(BIO)};
const NBA_PLAYLOG=${JSON.stringify(PLAYLOG)};
const NBA_GEN=${JSON.stringify(new Date().toLocaleString("en-US",{timeZone:"America/Toronto",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+" ET")};
const NBA_QTR=${JSON.stringify(QTR)};
const NBA_SPOT=${JSON.stringify(SPOT)};
const NBA_NEXT=${JSON.stringify(NEXT)};
const NBA_PADV=${JSON.stringify(PADV)};
`;
process.stdout.write(out);
console.error(`teams ${Object.keys(TEAM).length}, results ${RES.length} (through ${lastDay}), players ${Object.keys(LOGS).length}, slate ${SLATE.length}, lines ${Object.keys(LINES).length}, props ${PROPS.length}, inj teams ${Object.keys(INJ).length}, prev-season players ${Object.keys(PREV).length}, play log ${PLAYLOG.length}, adv ${Object.keys(PADV).length}, qtr games ${Object.values(QTR).reduce((a,b)=>a+b.length,0)/2}, h2h ${Object.values(H2H).map(x=>x.length).join('/')}`);
