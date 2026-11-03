
/* ---------- Plays of the Week (Week 9) ----------
   Matchup-based leans built from this site's own data (game logs, defense vs position,
   score model). Numbers in each card are computed live from the loaded data. */
const PLAYS_WEEK=9, PLAYS_ASOF="Mon Nov 2 (evening)";
const PLAYS=[
  {type:"prop",player:"Bhayshul Tuten",market:"rushYds",side:"over",
   why:p=>{const u=typeof USAGE_RAW!=="undefined"&&USAGE_RAW["Bhayshul Tuten"];return `He's gone over ${p.line} in ${p.ov} of ${p.n} games (avg ${p.avg}, median ${p.med}), including ${p.last} last week.${u?` He handles about ${Math.round(u.s.csh)}% of Jacksonville's carries (${u.s.cpg} a game), so the volume is steady.`:""} Baltimore allows the ${p.rankTxt} rushing yards to running backs — a little better than average, but not a matchup that has slowed him so far.`}},
  {type:"prop",player:"Zay Flowers",market:"recYds",side:"over",
   why:p=>`${p.ov} of ${p.n} games over ${p.line} (avg ${p.avg}), and Jacksonville allows the ${p.rankTxt} receiving yards to wide receivers. In Tyler Huntley's three starts (Weeks 5–7) he had 53, 66 and 137 yards. Risk: Lamar Jackson is out after thumb surgery, Baltimore hasn't named a starter, and Flowers had 0 catches on 5 targets after Jackson got hurt last week.`},
  {type:"spread",game:1,team:"JAX",
   why:g=>`Jacksonville is ${g.rec.JAX}, scoring ${TEAM_STATS.JAX.ppg} points a game and allowing ${teamRec("JAX").pa}. Baltimore (${g.rec.BAL}) has lost three straight, scoring 10, 13 and 10 points, and now plays without Lamar Jackson. Our model has the Jaguars winning by ${g.x.margin}, ${(g.x.margin-g.L.sp).toFixed(1)} points more than the current ${g.L.sp}-point spread. Risk: the line has swung from Baltimore −4.5 at open to Jacksonville −${g.L.sp} since Jackson's injury, so much of the edge is already priced in — a Jaguars win by ${Math.ceil(g.L.sp)-1} or fewer points loses.`},
  {type:"ml",game:8,team:"NYG",
   why:g=>`The Giants are ${g.rec.NYG} (plus a tie) and allow just ${TEAM_STATS.NYG.dpass} passing yards a game, ${ordinal(rankOf("dpass","NYG",true))}-fewest in the NFL. Philadelphia is ${g.rec.PHI}, has lost three in a row and scores ${TEAM_STATS.PHI.ppg} points a game (${ordinal(rankOf("ppg","PHI"))}). Our model gives New York ${g.x.winP}% to win; the ${fmtOdds(g.L.ml[0])} price implies about ${impl(g.L.ml[0])}%. Both teams are without their starting quarterback (Dart and Hurts are on injured reserve).`},
  {type:"total",game:11,side:"over",
   why:g=>`Both offenses are top-6 in scoring: San Francisco ${TEAM_STATS.SF.ppg} points a game (${g.rec.SF}) and Las Vegas ${TEAM_STATS.LV.ppg}. The Raiders also allow ${teamRec("LV").pa} points a game. Our model projects ${g.x.total} total points, ${(g.x.total-g.L.tot).toFixed(1)} over the line. Risk: if the 49ers build a big lead they may run out the clock; the weather forecast is added Saturday.`},
];

function impl(o){return Math.round((o>0?100/(o+100):-o/(-o+100))*100)}
function teamRec(t){let w=0,l=0,pf=0,pa=0,n=0;RESULTS.forEach(([wk,a,ap,h,hp])=>{if(a!==t&&h!==t)return;n++;const me=a===t?ap:hp,op=a===t?hp:ap;pf+=me;pa+=op;if(me>op)w++;else if(me<op)l++});return{w,l,str:w+"–"+l,pf:(pf/n).toFixed(1),pa:(pa/n).toFixed(1)}}
function rankOf(stat,team,low){const arr=Object.entries(TEAM_STATS).sort((a,b)=>low?a[1][stat]-b[1][stat]:b[1][stat]-a[1][stat]);return arr.findIndex(e=>e[0]===team)+1}
function fmtOdds(o){return o==null?"":oddsFmt(o)}

function playData(pl){
  if(pl.type==="prop"){const P=PINFO[pl.player];const rp=REAL_PROPS[pl.player+"|"+pl.market];if(!P||!rp)return null;
    const vals=pLogs(pl.player).filter(l=>l.season===CUR).map(l=>stat(l,pl.market)).filter(Number.isFinite);
    const line=rp[0],n=vals.length,ov=vals.filter(v=>pl.side==="over"?v>line:v<line).length;
    const avg=n?+(vals.reduce((a,b)=>a+b,0)/n).toFixed(1):0;const med=n?[...vals].sort((a,b)=>a-b)[Math.floor(n/2)]:0;
    const o=oppOf(P.team);const dv=o?dvpFor(o.opp,P.pos,pl.market):{rank:NaN};
    const unit=MARKETS[pl.market].u;
    return {P,o,line,odds:pl.side==="over"?rp[1]:rp[2],src:rp[3],n,ov,avg,med,vals,last:vals[vals.length-1],
      rankTxt:Number.isFinite(dv.rank)?`${ordinal(dv.rank)} most`:"—",dv,unit,
      title:`${pl.player} ${pl.side==="over"?"Over":"Under"} ${line} ${MARKETS[pl.market].n.toLowerCase().replace(/\btds\b/,'TDs')}`,
      game:o?o.g:null}}
  const g=SLATE.find(x=>x.id===pl.game);if(!g)return null;const L=LINES[g.id],x=projScore(g);
  const rec={};[g.away,g.home].forEach(t=>rec[t]=teamRec(t).str);
  let title,odds;
  if(pl.type==="spread"){const sp=pl.team===g.home?L.sp:-L.sp;title=`${TEAMS[pl.team][0]} ${sp>0?"+":""}${sp}`;odds=-110}
  if(pl.type==="ml"){odds=pl.team===g.away?L.ml[0]:L.ml[1];title=`${TEAMS[pl.team][0]} moneyline (${fmtOdds(odds)})`}
  if(pl.type==="total"){title=`${short(g.away)} @ ${short(g.home)} ${pl.side==="over"?"Over":"Under"} ${L.tot}`;odds=-110}
  return {g,L,x,rec,title,odds,game:g}
}


/* ---------- Track record: auto-graded from final scores + game logs ---------- */
// Past weeks' plays are archived here when a new week is added: PLAY_ARCHIVE[week]=[{type,...,title,odds,line}]
const PLAY_ARCHIVE={
 8:[{"type": "prop", "title": "Jaxon Smith-Njigba Over 97.5 receiving yards", "odds": -112, "player": "Jaxon Smith-Njigba", "market": "recYds", "side": "over", "line": 97.5, "team": "SEA", "away": "CHI", "home": "SEA", "book": "DraftKings (via FTN)"}, {"type": "prop", "title": "Tee Higgins Over 68.5 receiving yards", "odds": -114, "player": "Tee Higgins", "market": "recYds", "side": "over", "line": 68.5, "team": "CIN", "away": "TEN", "home": "CIN", "book": "DraftKings (via FTN)"}, {"type": "prop", "title": "Kirk Cousins Over 1.5 passing TDs", "odds": -115, "player": "Kirk Cousins", "market": "passTD", "side": "over", "line": 1.5, "team": "LV", "away": "LV", "home": "NYJ", "book": "FOX Sports Radio NJ"}, {"type": "spread", "title": "Los Angeles Rams -6.5", "odds": -110, "game": 10, "team": "LAR", "away": "LAC", "home": "LAR", "L": {"sp": -6.5, "ml": [250, -278], "tot": 45.5}}, {"type": "spread", "title": "Minnesota Vikings +3", "odds": -110, "game": 5, "team": "MIN", "away": "MIN", "home": "DET", "L": {"sp": -3, "ml": [152, -170], "tot": 46.5}}, {"type": "total", "title": "Titans @ Bengals Under 46.5", "odds": -110, "game": 3, "side": "under", "away": "TEN", "home": "CIN", "L": {"sp": -12.5, "ml": [570, -675], "tot": 46.5}}]
};
function gradeOne(pl,wk,d){
  if(pl.type==="prop"){const P=PINFO[pl.player];if(!P)return {r:"pending"};
    const lg=pLogs(pl.player).find(l=>l.season===CUR&&l.week===wk);
    const played=RESULTS.some(r=>r[0]===wk&&(r[1]===P.team||r[3]===P.team));
    if(!lg)return played?{r:"void",why:"Did not play — no action"}:{r:"pending"};
    const v=stat(lg,pl.market),line=d?d.line:pl.line;if(!Number.isFinite(v))return {r:"pending"};
    const r=v===line?"push":((pl.side==="over")===(v>line))?"win":"loss";return {r,why:`Final: ${v} ${MARKETS[pl.market].u}`}}
  const g=SLATE.find(x=>x.id===pl.game);const away=pl.away||(g&&g.away),home=pl.home||(g&&g.home);
  const res=RESULTS.find(r=>r[0]===wk&&r[1]===away&&r[3]===home);if(!res)return {r:"pending"};
  const ap=res[2],hp=res[4];const L=pl.L||LINES[pl.game];const fin=`Final: ${short(away)} ${ap}, ${short(home)} ${hp}`;
  if(pl.type==="ml"){const w=ap>hp?away:hp>ap?home:null;return {r:w===null?"push":w===pl.team?"win":"loss",why:fin}}
  if(pl.type==="spread"){const sp=pl.team===home?L.sp:-L.sp;const m=(pl.team===home?hp-ap:ap-hp)+sp;return {r:m>0?"win":m<0?"loss":"push",why:fin}}
  if(pl.type==="total"){const t=ap+hp;return {r:t===L.tot?"push":((pl.side==="over")===(t>L.tot))?"win":"loss",why:fin+` (${t} total)`}}
  return {r:"pending"}}
function unitsFor(r,odds){if(r==="win")return odds==null?0.91:odds>0?odds/100:100/(-odds);if(r==="loss")return -1;return 0}
function playRecord(){const all=[];
  Object.entries(PLAY_ARCHIVE).forEach(([wk,a])=>a.forEach(pl=>{const g=gradeOne(pl,+wk,null);all.push({wk:+wk,title:pl.title,odds:pl.odds,...g})}));
  PLAYS.forEach(pl=>{const d=playData(pl);const g=gradeOne(pl,PLAYS_WEEK,d);all.push({wk:PLAYS_WEEK,title:d?d.title:"",odds:d?d.odds:null,...g})});
  const c={win:0,loss:0,push:0,void:0,pending:0};let u=0;all.forEach(x=>{c[x.r]++;u+=unitsFor(x.r,x.odds)});return {all,c,u}}
function recordPanel(){const {all,c,u}=playRecord();const graded=c.win+c.loss;
  const wk={};all.forEach(x=>{(wk[x.wk]=wk[x.wk]||{win:0,loss:0,push:0,pending:0,void:0})[x.r]++});
  return `<div class="card" style="margin:6px 0 16px;padding:14px 18px"><div class="row" style="gap:18px;flex-wrap:wrap;align-items:center">
   <div><div class="small">Season record</div><div style="font-size:26px;font-weight:800">${c.win}–${c.loss}${c.push?"–"+c.push:""}</div></div>
   <div><div class="small">Win rate</div><div style="font-size:26px;font-weight:800">${graded?Math.round(c.win/graded*100)+"%":"—"}</div></div>
   <div><div class="small">Profit (1 unit per play)</div><div style="font-size:26px;font-weight:800;color:${u>0?"#22c55e":u<0?"#f05252":"inherit"}">${graded?(u>0?"+":"")+u.toFixed(2)+"u":"—"}</div></div>
   <span class="sp"></span><div class="small" style="text-align:right">${Object.entries(wk).map(([w,x])=>`Week ${w}: ${x.win}–${x.loss}${x.push?"–"+x.push:""}${x.pending?` · ${x.pending} pending`:""}`).join("<br>")}</div></div>
   <p class="note" style="margin:8px 0 0">Every play is graded automatically from the final score or the player's official stat line — wins and losses both stay on the record. Pushes and "did not play" props are no action.</p></div>`}
const RES_COL={win:"#22c55e",loss:"#f05252",push:"#9aa3b2",void:"#9aa3b2",pending:"#fab219"},RES_TXT={win:"✓ Win",loss:"✗ Loss",push:"Push",void:"No action",pending:"Pending"};

function viewPlays(){
  const TAG={prop:["Player prop","#2563eb"],spread:["Spread (ATS)","#7c3aed"],ml:["Moneyline","#059669"],total:["Over / Under","#d97706"]};
  const cards=PLAYS.map((pl,i)=>{const d=playData(pl);if(!d)return "";const [tn,tc]=TAG[pl.type];const g=d.game;
    const stats=pl.type==="prop"
      ?`<div class="pgrid" style="margin-top:10px"><div><small>Hit rate</small><b>${d.ov} of ${d.n}</b><small>games ${pl.side} ${d.line}</small></div><div><small>Season avg</small><b>${d.avg}</b><small>${d.unit} · median ${d.med}</small></div></div>
        <div class="small" style="margin-top:8px">Game log: ${d.vals.join(" · ")}</div>`
      :`<div class="pgrid" style="margin-top:10px"><div><small>Model score</small><b>${short(g.away)} ${d.x.a} – ${short(g.home)} ${d.x.h}</b><small>${short(d.x.win)} ${d.x.winP}% to win</small></div><div><small>Line</small><b>${short(d.L.sp<0?g.home:g.away)} −${Math.abs(d.L.sp)} · O/U ${d.L.tot}</b><small>ML ${short(g.away)} ${fmtOdds(d.L.ml[0])} / ${short(g.home)} ${fmtOdds(d.L.ml[1])}</small></div></div>`;
    return `<div class="card play">
      <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><span class="ptag" style="background:${tc}22;color:${tc}">${tn}</span>${(()=>{const gr=gradeOne(pl,PLAYS_WEEK,d);return `<span class="ptag" title="${esc(gr.why||"")}" style="background:${RES_COL[gr.r]}22;color:${RES_COL[gr.r]}">${RES_TXT[gr.r]}</span>`})()}<span class="small">#${i+1} · ${badge(g.away)} @ ${badge(g.home)} · ${esc(g.when)}</span></div>
      <h2 style="margin:10px 0 2px">${esc(d.title)}</h2>
      ${(()=>{const gr=gradeOne(pl,PLAYS_WEEK,d);return gr.why?`<div class="small" style="color:${RES_COL[gr.r]};font-weight:700">${esc(gr.why)}</div>`:""})()}
      <div class="small">${d.odds!=null?`Odds ${fmtOdds(d.odds)}`:"Odds not listed publicly"}${d.src?` · ${esc(d.src)}`:pl.type!=="prop"?" · consensus line":""}</div>
      ${stats}
      <p style="margin:12px 0 0;line-height:1.55">${pl.why(pl.type==="prop"?d:d)}</p>
      <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><a href="#" class="btn plink" data-i="${i}">${pl.type==="prop"?"Open player page →":"Open matchup →"}</a>${betBtn(specFromPlay(pl))}${shareBtn(specFromPlay(pl))}</div></div>`}).join("");
  $("#v-plays").innerHTML=`<h1>Plays of the Week</h1>
   <p class="sub">Week ${PLAYS_WEEK} · our ${PLAYS.length} favourite spots based on the matchup data on this site — two player props, a spread, a moneyline and a total. Lines as of ${PLAYS_ASOF}; check your sportsbook before betting, prices move.</p>
   <div class="row" style="gap:8px;margin:-4px 0 10px;flex-wrap:wrap"><button class="btn" id="nflShare">📤 Share this week's plays</button><a class="btn" href="#record">📒 Full record</a></div>
   ${recordPanel()}
   <div class="grid g2">${cards}</div>
   <div class="card" style="margin-top:14px;padding:14px 18px"><p class="note" style="margin:0"><b>How these are chosen:</b> props need a strong season hit rate against the posted line plus a matchup that doesn't work against it (defense vs position rank). Game plays come from our score model disagreeing with the betting line by a meaningful margin. These are data-based leans, <b>not guarantees</b> — football is high-variance and even good plays lose often. Never bet more than you can afford to lose. Must be 21+ (18+ in some states). Gambling problem? Call or text 1-800-GAMBLER (24/7, free). In Canada: Quebec 18+, Jeu : aide et référence 1-800-461-0140 · Ontario 19+, ConnexOntario 1-866-531-2600.</p></div>`;
  if(document.getElementById("nflShare"))document.getElementById("nflShare").onclick=shareNflPlays;
  document.querySelectorAll(".plink").forEach(a=>a.onclick=e=>{e.preventDefault();const pl=PLAYS[+a.dataset.i];
    if(pl.type==="prop"){S.prop={player:pl.player,market:pl.market,open:true};location.hash="props"}else location.hash="game-"+pl.game});
}
