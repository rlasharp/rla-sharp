
/* ---------- Plays of the Week (Week 9) ----------
   Matchup-based leans built from this site's own data (game logs, defense vs position,
   score model). Numbers in each card are computed live from the loaded data. */
const PLAYS_WEEK=10, PLAYS_ASOF="Wed Nov 11";
const PLAYS=[
];

/* ---------- automatic Plays of the Week: picked from the site's own numbers, locked once per week by tools/track.js (TRACK.potw) ----------
   2 player props (best edge vs the price, odds −200…+150, our chance 55%+), then the spread, moneyline and total where our game model
   is furthest from the line — each from a different game that hasn't kicked off. */
function potwAuto(){try{const imp_=o=>o<0?-o/(-o+100):100/(o+100);
  const open=SLATE.filter(g=>LINES[g.id]&&!g.final&&!(typeof nflStarted!=="undefined"&&nflStarted(g))&&!RESULTS.some(r=>r[0]===PLAYS_WEEK&&r[1]===g.away&&r[3]===g.home));if(open.length<3)return [];
  const ids=new Set(open.map(g=>g.id)),used=new Set(),out=[];
  const P=(typeof nflBest!=="undefined"?nflBest():[]).filter(b=>b.k!=="anyTD"&&b.odds!=null&&b.odds>=-200&&b.odds<=150&&b.sc>=.55&&b.edge>0&&b.g&&ids.has(b.g.id)).sort((a,c)=>c.edge-a.edge);
  for(const b of P){if(out.length>=2)break;if(used.has(b.g.id))continue;used.add(b.g.id);out.push({type:"prop",player:b.name,market:b.k,side:b.side==="o"?"over":"under",line:b.line,odds:b.odds,book:b.book||"",team:b.pl.team,ch:Math.round(b.sc*100)})}
  const G=open.map(g=>{const x=projScore(g),L=LINES[g.id],M=x.P;let me=null;if(L.ml&&L.ml[0]!=null&&L.ml[1]!=null){const a=imp_(L.ml[0]),h=imp_(L.ml[1]);me=M.modelHomeWp-h/(a+h)}return {g,L,se:M.spread+L.sp,te:M.total-L.tot,me}});
  const pick=f=>G.filter(x=>!used.has(x.g.id)&&f(x)!=null).sort((a,c)=>Math.abs(f(c))-Math.abs(f(a)))[0];
  const base=x=>({game:x.g.id,away:x.g.away,home:x.g.home,L:{sp:x.L.sp,tot:x.L.tot,ml:x.L.ml||null}});
  let x=pick(z=>z.se);if(x){used.add(x.g.id);out.push(Object.assign({type:"spread",team:x.se>0?x.g.home:x.g.away,edge:Math.round(Math.abs(x.se)*10)/10},base(x)))}
  x=pick(z=>z.me);if(x){used.add(x.g.id);const t=x.me>0?x.g.home:x.g.away;out.push(Object.assign({type:"ml",team:t,odds:t===x.g.home?x.L.ml[1]:x.L.ml[0],edge:Math.round(Math.abs(x.me)*1000)/10},base(x)))}
  x=pick(z=>z.te);if(x){used.add(x.g.id);out.push(Object.assign({type:"total",side:x.te>0?"over":"under",edge:Math.round(Math.abs(x.te)*10)/10},base(x)))}
  return out}catch(e){return []}}
function potwWhy(pl,d){try{if(pl.type==="prop")return `${esc(pl.player)} went ${pl.side} ${d.line} in <b>${d.ov} of ${d.n}</b> games this season (average ${d.avg}).${d.o&&Number.isFinite(d.dv.rank)?` ${esc(short(d.o.opp))} allow the ${d.rankTxt} ${MARKETS[pl.market].n.toLowerCase()} to ${esc(d.P.pos)}s.`:""}${pl.ch?` Our chance: <b>${pl.ch}%</b> vs ${impl(d.odds!=null?d.odds:pl.odds)}% the price needs.`:""}`;
  const g=d.g,x=d.x;return `Our model: <b>${esc(short(g.away))} ${x.a} – ${esc(short(g.home))} ${x.h}</b> (${esc(short(x.win))} ${x.winP}% to win, total ${x.total}).${pl.type==="spread"?` That's ${pl.edge} points off the spread — the biggest gap on the slate.`:pl.type==="total"?` That's ${pl.edge} points ${pl.side==="over"?"over":"under"} the posted ${d.L.tot} — the biggest total gap this week.`:` We give ${esc(short(pl.team))} ${pl.edge} percentage points more than the moneyline (margin removed).`}`}catch(e){return ""}}
/* how the 5 weekly plays compare with everything else we track for the NFL (best props, every week) */
function potwVs(){try{const {all}=playRecord(),g=all.filter(x=>x.r==="win"||x.r==="loss"),w=g.filter(x=>x.r==="win").length,u=all.reduce((a,x)=>a+unitsFor(x.r,x.odds),0);
  const B=typeof TRACK!=="undefined"&&TRACK&&TRACK.sum&&TRACK.sum.nfl&&TRACK.sum.nfl.best;if(!g.length||!B||!(B.w+B.l))return "";
  const pc=(a,b)=>a+b?Math.round(a/(a+b)*100)+"%":"–",r=(a,b,uu)=>`<b>${a}-${b}</b> (${pc(a,b)}, ${uu>0?"+":""}${(+uu).toFixed(2)}u)`;
  return `<div class="card" style="margin:-6px 0 16px"><h2>📊 Plays of the Week vs everything else</h2><div class="ufval"><span>⭐ Plays of the Week</span>${r(w,g.length-w,u)}</div><div class="ufval"><span>🎯 All NFL best props we track</span>${r(B.w,B.l,B.u)}</div>
   <div class="small">${g.length<20||B.w+B.l<20?"Small samples so far — this comparison means more after a few more weeks.":(w/g.length>B.w/(B.w+B.l)?"The weekly five are doing better than the full list.":"The weekly five aren't beating the full list yet.")}</div></div>`}catch(e){return ""}}
/* 🔀 teaser spots (6-point NFL teasers): favourites of −7.5 to −8.5 teased down through 7 and 3, underdogs of +1.5 to +2.5 teased up
   through 3 and 7 — the classic "crosses both key numbers" legs. Our chance per leg from the game model (margin sd ≈ 13.5). */
function teaserSpots(){try{const nc=typeof coNcdf!=="undefined"?coNcdf:(z=>.5*(1+Math.tanh(z*.7978845608*(1+.044715*z*z)))),out=[];
  for(const g of SLATE){if(g.final||(typeof nflStarted!=="undefined"&&nflStarted(g))||!LINES[g.id])continue;const L=LINES[g.id],M=projScore(g).P.spread;
    for(const [t,sp] of [[g.home,L.sp],[g.away,-L.sp]]){const ok=(sp<=-7.5&&sp>=-8.5)||(sp>=1.5&&sp<=2.5);if(!ok)continue;const ts=sp+6,m=t===g.home?M:-M,p=nc((m+ts)/13.5);out.push({g,t,sp,ts,p})}}
  return out.sort((a,b)=>b.p-a.p)}catch(e){return []}}
function teaserCard(){const L=teaserSpots();if(!L.length)return `<div class="card"><h2>🔀 Teaser spots</h2><div class="small">No game this week has a line in the classic teaser range (favourites −7.5 to −8.5, underdogs +1.5 to +2.5).</div></div>`;
  const sg=x=>(x>0?"+":"")+x;return `<div class="card"><h2>🔀 Teaser spots <span class="small">· 6-point NFL teasers</span></h2>
   ${L.map(x=>`<a class="ufval" href="#game-${x.g.id}"><span><b>${esc(TEAMS[x.t]?TEAMS[x.t][0]:x.t)}</b> <span class="small">${sg(x.sp)} → ${sg(x.ts)}</span></span><span class="small">${esc(short(x.g.away))} @ ${esc(short(x.g.home))}</span><b class="${x.p>=.739?"up":""}">${Math.round(x.p*100)}%</b></a>`).join("")}
   <div class="small" style="margin-top:6px">These legs move across both 3 and 7, the most common NFL margins. Our chance = how often our game model says the teased line covers. A 2-team, 6-point teaser at −120 needs each leg to cover about <b>74%</b> of the time; green = at or above that. Not every book offers 6 points at −120 — check the price.</div></div>`}
let POTW_ON=0,POTW_LIVE=0;const PLAYS_HAND=PLAYS.length;   /* hand-picked plays (if any) win over the automatic ones */
function potwInit(){if(POTW_ON)return;POTW_ON=1;if(PLAYS.length)return;const L=typeof TRACK!=="undefined"&&TRACK&&TRACK.potw&&TRACK.potw[PLAYS_WEEK];
  const src=L&&L.length?L:potwAuto();POTW_LIVE=!(L&&L.length);for(const x of src)PLAYS.push(Object.assign({},x,{why:d=>potwWhy(x,d)}))}
function impl(o){return Math.round((o>0?100/(o+100):-o/(-o+100))*100)}
function teamRec(t){let w=0,l=0,pf=0,pa=0,n=0;RESULTS.forEach(([wk,a,ap,h,hp])=>{if(a!==t&&h!==t)return;n++;const me=a===t?ap:hp,op=a===t?hp:ap;pf+=me;pa+=op;if(me>op)w++;else if(me<op)l++});return{w,l,str:w+"–"+l,pf:(pf/n).toFixed(1),pa:(pa/n).toFixed(1)}}
function rankOf(stat,team,low){const arr=Object.entries(TEAM_STATS).sort((a,b)=>low?a[1][stat]-b[1][stat]:b[1][stat]-a[1][stat]);return arr.findIndex(e=>e[0]===team)+1}
function fmtOdds(o){return o==null?"":oddsFmt(o)}

/* this week's game for a team even after it is final (oppOf skips finished games) */
function oppAnyWk(team){const g=SLATE.find(g=>(g.home===team||g.away===team)&&!(g.wk&&g.wk<PLAYS_WEEK));return g?(g.home===team?{opp:g.away,home:1,g}:{opp:g.home,home:0,g}):null}
function playData(pl){
  if(pl.type==="prop"){const P=PINFO[pl.player];const rp=REAL_PROPS[pl.player+"|"+pl.market];if(!P||!rp)return null;
    const vals=pLogs(pl.player).filter(l=>l.season===CUR).map(l=>stat(l,pl.market)).filter(Number.isFinite);
    const line=rp[0],n=vals.length,ov=vals.filter(v=>pl.side==="over"?v>line:v<line).length;
    const avg=n?+(vals.reduce((a,b)=>a+b,0)/n).toFixed(1):0;const med=n?[...vals].sort((a,b)=>a-b)[Math.floor(n/2)]:0;
    const o=oppOf(P.team)||oppAnyWk(P.team);const dv=o?dvpFor(o.opp,P.pos,pl.market):{rank:NaN};
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
 9:[{"type": "prop", "title": "Bhayshul Tuten Over 63.5 rush yds", "odds": null, "player": "Bhayshul Tuten", "market": "rushYds", "side": "over", "line": 63.5, "book": "FanDuel (via Football Nation USA, Nov 2)"}, {"type": "prop", "title": "Zay Flowers Over 45.5 rec yds", "odds": null, "player": "Zay Flowers", "market": "recYds", "side": "over", "line": 45.5, "book": "Football Nation USA (Nov 2)"}, {"type": "spread", "game": 1, "away": "JAX", "home": "BAL", "L": {"sp": 10.0, "ml": [-535, 400], "tot": 39.5}, "team": "JAX", "title": "Jacksonville Jaguars -10", "odds": -110}, {"type": "ml", "game": 8, "away": "NYG", "home": "PHI", "L": {"sp": 3.0, "ml": [-162, 136], "tot": 38.5}, "team": "NYG", "title": "New York Giants moneyline", "odds": -162}, {"type": "total", "game": 11, "away": "LV", "home": "SF", "L": {"sp": -8.5, "ml": [340, -440], "tot": 51.5}, "side": "over", "title": "Raiders @ 49ers Over 51.5", "odds": -110}],
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
function playRecord(){potwInit();const all=[];
  const AW=(typeof TRACK!=="undefined"&&TRACK&&TRACK.potw)||{};for(const [wk,a] of Object.entries(AW))if(+wk!==PLAYS_WEEK&&!PLAY_ARCHIVE[wk])a.forEach(pl=>{const g=gradeOne(pl,+wk,null);all.push({wk:+wk,title:pl.title,odds:pl.odds,...g})});
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

function viewPlays(){potwInit();
  const TAG={prop:["Player prop","#2563eb"],spread:["Spread (ATS)","#7c3aed"],ml:["Moneyline","#059669"],total:["Over / Under","#d97706"]};
  const cards=PLAYS.map((pl,i)=>{const d=playData(pl);if(!d)return "";const [tn,tc]=TAG[pl.type];const g=d.game;
    const stats=pl.type==="prop"
      ?`<div class="pgrid" style="margin-top:10px"><div><small>Hit rate</small><b>${d.ov} of ${d.n}</b><small>games ${pl.side} ${d.line}</small></div><div><small>Season avg</small><b>${d.avg}</b><small>${d.unit} · median ${d.med}</small></div></div>
        <div class="small" style="margin-top:8px">Game log: ${d.vals.join(" · ")}</div>`
      :`<div class="pgrid" style="margin-top:10px"><div><small>Model score</small><b>${short(g.away)} ${d.x.a} – ${short(g.home)} ${d.x.h}</b><small>${short(d.x.win)} ${d.x.winP}% to win</small></div><div><small>Line</small><b>${short(d.L.sp<0?g.home:g.away)} −${Math.abs(d.L.sp)} · O/U ${d.L.tot}</b><small>ML ${short(g.away)} ${fmtOdds(d.L.ml[0])} / ${short(g.home)} ${fmtOdds(d.L.ml[1])}</small></div></div>`;
    return `<div class="card play">
      <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><span class="ptag" style="background:${tc}22;color:${tc}">${tn}</span>${(()=>{const gr=gradeOne(pl,PLAYS_WEEK,d);return `<span class="ptag" title="${esc(gr.why||"")}" style="background:${RES_COL[gr.r]}22;color:${RES_COL[gr.r]}">${RES_TXT[gr.r]}</span>`})()}<span class="small">#${i+1}${g?` · ${badge(g.away)} @ ${badge(g.home)} · ${esc(g.when)}`:""}</span></div>
      <h2 style="margin:10px 0 2px">${esc(d.title)}</h2>
      ${(()=>{const gr=gradeOne(pl,PLAYS_WEEK,d);return gr.why?`<div class="small" style="color:${RES_COL[gr.r]};font-weight:700">${esc(gr.why)}</div>`:""})()}
      <div class="small">${d.odds!=null?`Odds ${fmtOdds(d.odds)}`:"Odds not listed publicly"}${d.src?` · ${esc(d.src)}`:pl.type!=="prop"?" · consensus line":""}</div>
      ${stats}
      <p style="margin:12px 0 0;line-height:1.55">${pl.why(pl.type==="prop"?d:d)}</p>
      <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><a href="#" class="btn plink" data-i="${i}">${pl.type==="prop"?"Open player page →":"Open matchup →"}</a>${betBtn(specFromPlay(pl))}${shareBtn(specFromPlay(pl))}</div></div>`}).join("");
  $("#v-plays").innerHTML=`<h1>Plays of the Week</h1>
   <p class="sub">${PLAYS.length?`Week ${PLAYS_WEEK} · our ${PLAYS.length} favourite spots, picked automatically from the numbers on this site — the two player props furthest above their price, and the spread, moneyline and total where our game model is furthest from the line. ${POTW_LIVE?"Provisional: they lock at the next data update and are graded after that.":"Locked for the week and graded automatically."} Check your sportsbook before betting, prices move.`:`Week ${PLAYS_WEEK}: this week's Plays of the Week aren't posted yet. Last week's results are in the record below; the ${typeof prlSportHtml!=="undefined"?"parlay of the day and ":""}best props are on the Props page.`}</p>
   <div class="row" style="gap:8px;margin:-4px 0 10px;flex-wrap:wrap"><button class="btn" id="nflShare">📤 Share this week's plays</button><a class="btn" href="#record">📒 Full record</a></div>
   ${typeof prlSportHtml!=="undefined"?prlSportHtml("nfl"):""}
   ${recordPanel()}${potwVs()}${teaserCard()}
   <div class="grid g2">${cards}</div>
   <div class="card" style="margin-top:14px;padding:14px 18px"><p class="note" style="margin:0"><b>How these are chosen:</b> props need a strong season hit rate against the posted line plus a matchup that doesn't work against it (defense vs position rank). Game plays come from our score model disagreeing with the betting line by a meaningful margin. These are data-based leans, <b>not guarantees</b> — football is high-variance and even good plays lose often. Never bet more than you can afford to lose. Must be 21+ (18+ in some states). Gambling problem? Call or text 1-800-GAMBLER (24/7, free). In Canada: Quebec 18+, Jeu : aide et référence 1-800-461-0140 · Ontario 19+, ConnexOntario 1-866-531-2600.</p></div>`;
  if(document.getElementById("nflShare"))document.getElementById("nflShare").onclick=shareNflPlays;
  document.querySelectorAll(".plink").forEach(a=>a.onclick=e=>{e.preventDefault();const pl=PLAYS[+a.dataset.i];
    if(pl.type==="prop"){S.prop={player:pl.player,market:pl.market,open:true};location.hash="props"}else location.hash="game-"+pl.game});
}
