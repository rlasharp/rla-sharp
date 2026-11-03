// Locks today's NBA "Plays of the day" into data/nba_plays.txt so the site can keep an honest record.
// Usage (after nba_data.js is regenerated): node tools/nbaplays.mjs [--force]
// Replaces today's (NBA_SLATE_DATE) entries. Refuses after the first game of the day has tipped unless --force.
import fs from "fs"; import path from "path"; import vm from "vm"; import { fileURLToPath } from "url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {}, document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } }, setInterval() {}, setTimeout() {}, LS: { get() { return null; }, set() {} }, oddsFmt: x => (x > 0 ? "+" + x : "" + x), console,
  /* helpers that live in live.js on the site; pregame lock = nothing has started */ startedKey: () => "", nbaStarted: () => false, nflStarted: () => false, etNow: () => ({ d: "", m: 0 }) };
vm.createContext(ctx);
const src = fs.readFileSync(path.join(root, "nba_data.js"), "utf8") + "\n" + fs.readFileSync(path.join(root, "nba.js"), "utf8")
  + "\n;globalThis.__out={date:NBA_SLATE_DATE,slate:NBA_SLATE,plays:nbaPlays().map(b=>[NBA_SLATE_DATE,b.nm,b.k,b.side,b.line,b.odds,b.book||'',b.p.tm,b.opp])};";
vm.runInContext(src.replace(/^(const|let) /gm, "var "), ctx);
const { date, slate, plays } = ctx.__out;
const force = process.argv.includes("--force");
// first tip in ET
const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Toronto" }));
const todayET = nowET.toISOString().slice(0, 10).replace(/T.*/, "");
const tipMin = Math.min(...slate.map(g => { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(g.t || ""); if (!m) return 9999; return ((+m[1] % 12) + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + +m[2]; }));
const ymd = `${nowET.getFullYear()}-${String(nowET.getMonth() + 1).padStart(2, "0")}-${String(nowET.getDate()).padStart(2, "0")}`;
const started = ymd > date || (ymd === date && nowET.getHours() * 60 + nowET.getMinutes() >= tipMin);
const f = path.join(root, "data", "nba_plays.txt");
const head = "# NBA Plays of the day, locked before tip-off: date|player|market|side(o/u)|line|odds|book|team|opp\n# Written by tools/nbaplays.mjs — the site grades these against box scores. Never edit past days.\n";
const old = fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(s => s && !s.startsWith("#")) : [];
const already = old.filter(s => s.startsWith(date + "|"));
if (started && !force) { console.error(`First game of ${date} has started — keeping ${already.length} locked plays (use --force to override).`); process.exit(0); }
// --window=N: only lock when the first tip is at most N minutes away (props are mostly posted by then)
const win = +((process.argv.find(a => a.startsWith("--window=")) || "").split("=")[1] || 0);
const toTip = ymd === date ? tipMin - (nowET.getHours() * 60 + nowET.getMinutes()) : 9999;
if (!force && win && toTip > win) { console.error(`First tip is ${toTip} min away — waiting to lock (window ${win} min).`); process.exit(0); }
if (!force && !plays.length) { console.error(`No plays qualify yet for ${date} — not locking.`); process.exit(0); }
const keep = old.filter(s => !s.startsWith(date + "|"));
fs.writeFileSync(f, head + [...keep, ...plays.map(p => p.join("|"))].join("\n") + "\n");
console.error(`Locked ${plays.length} plays for ${date}: ` + plays.map(p => `${p[1]} ${p[3] === "o" ? "O" : "U"}${p[4]} ${p[2]}`).join("; "));
