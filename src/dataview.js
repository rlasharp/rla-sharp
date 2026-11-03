/* ---------- Data ---------- */
const PCOLS=["player","team","pos","season","week","opp","home",...STAT_COLS];
const TCOLS=["team","season","week","opp","home","pf","pa"];
function parseCSV(txt,cols){const lines=txt.trim().split(/\r?\n/);const head=lines.shift().split(",").map(s=>s.trim());
  const miss=cols.filter(c=>!head.includes(c)&&!STAT_COLS.includes(c));if(miss.length)throw new Error("Missing columns: "+miss.join(", "));
  return lines.filter(l=>l.trim()).map(l=>{const v=l.split(",");const o={};head.forEach((h,i)=>{const x=(v[i]||"").trim();o[h]=["player","team","pos","opp"].includes(h)?x:(+x||0)});
    o.team=(o.team||"").toUpperCase();if(o.opp)o.opp=o.opp.toUpperCase();if(o.pos)o.pos=o.pos.toUpperCase();return o})}
function toast(m){const d=document.createElement("div");d.className="toast";d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
function viewData(){
  $("#v-data").innerHTML=`<h1>Data</h1><p class="sub">The page can't reach outside stats sites, so real logs come in here. Paste CSV (from a spreadsheet, Pro-Football-Reference, nflverse, etc.) and every chart, hit rate and projection recalculates. Imports stay in this browser.</p>
   <div class="grid g2">
    <div class="card"><div class="row"><h2 style="margin:0">Player game logs</h2><span class="sp"></span>${srcTag("player")}</div>
     <p class="note">One row per player per game. Columns: <span class="mono">${PCOLS.join(",")}</span>. pos = QB/RB/WR/TE, home = 1 or 0, team/opp use the abbreviations on the slate (JAX, LAR, LV…).</p>
     <textarea id="pTxt" placeholder="${PCOLS.join(",")}"></textarea>
     <div class="row" style="margin-top:8px"><button class="btn pri" id="pImp">Import player logs</button><button class="btn" id="pTpl">Copy template</button><button class="btn" id="pRes">Back to CBS data</button></div></div>
    <div class="card"><div class="row"><h2 style="margin:0">Team game logs</h2><span class="sp"></span>${srcTag("team")}</div>
     <p class="note">One row per team per game (both teams of every game). Columns: <span class="mono">${TCOLS.join(",")}</span>. Include past seasons for head-to-head history.</p>
     <textarea id="tTxt" placeholder="${TCOLS.join(",")}"></textarea>
     <div class="row" style="margin-top:8px"><button class="btn pri" id="tImp">Import team logs</button><button class="btn" id="tTpl">Copy template</button><button class="btn" id="tRes">Back to CBS data</button></div></div>
   </div>
   <div class="card" style="margin-top:14px"><h2>What's real right now</h2>
    <p>${realTag} Week 9 schedule, kickoff times, team records and the latest final scores — nflverse schedules data and ESPN, Nov 2, 2026. Spreads, moneylines and totals (best available odds on <a href="${SRC_LINKS.splits}" target="_blank" rel="noopener">ScoresAndOdds</a>, Oct 31); team passing, rushing and scoring from ESPN and NFL.com; player prop lines where a public source had them.</p><p>${realTag} Score predictions: our model (team scoring this season and last 5 games, home field, blended 50/50 with the betting line). An estimate, not a sure thing.</p>
    <p>${realTag} Every 2026 score and team result (weeks 1–8) — <a href="${CBS_SRC.results}" target="_blank" rel="noopener">CBS Sports</a>.</p><p>${realTag} Defense vs position (QB/RB/WR/TE totals and per-game averages, through Week 7) — <a href="${PFR_SRC.QB}" target="_blank" rel="noopener">Pro-Football-Reference</a>, built from official NFL box scores.</p>
    <p>${realTag} Full 2026 game logs from CBS Sports for: ${[...new Set(REAL_LOGS.map(l=>l.player))].join(", ")}. Other players show their real book line and matchup, without hit-rate history — paste more CBS game logs above to add them.</p>
    <p class="note">Sportsbook odds, lines and totals are whatever you type in; they're saved in this browser. <button class="btn" id="clrUser">Clear my lines &amp; odds</button></p></div>`;
  const copy=t=>{navigator.clipboard.writeText(t).then(()=>toast("Copied"),()=>toast("Copy blocked — select the header text instead"))};
  $("#pTpl").onclick=()=>copy(PCOLS.join(",")+"\nJosh Allen,BUF,QB,2026,7,LV,0,268,22,2,0,6,41,1,0,0,0");
  $("#tTpl").onclick=()=>copy(TCOLS.join(",")+"\nBUF,2026,7,LV,0,33,30\nLV,2026,7,BUF,1,30,33");
  $("#pImp").onclick=()=>{try{const r=parseCSV($("#pTxt").value,PCOLS);if(!r.length)throw new Error("No rows");S.playerLogs=r;S.src.player="imp";LS.set("playerLogs",r);for(const k in dvpCache)delete dvpCache[k];S.prop={};toast(r.length+" player rows imported");banner();viewData()}catch(e){toast(e.message)}};
  $("#tImp").onclick=()=>{try{const r=parseCSV($("#tTxt").value,TCOLS);if(!r.length)throw new Error("No rows");S.teamLogs=r;S.src.team="imp";LS.set("teamLogs",r);toast(r.length+" team rows imported");banner();viewData()}catch(e){toast(e.message)}};
  $("#pRes").onclick=()=>{S.playerLogs=DEMO.playerLogs;S.src.player="demo";LS.set("playerLogs",null);for(const k in dvpCache)delete dvpCache[k];banner();viewData()};
  $("#tRes").onclick=()=>{S.teamLogs=DEMO.teamLogs;S.src.team="demo";LS.set("teamLogs",null);banner();viewData()};
  $("#clrUser").onclick=()=>{S.lines={};S.odds={};S.probs={};S.totals={};saveUser();toast("Cleared")};
}

