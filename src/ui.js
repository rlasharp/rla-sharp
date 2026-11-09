
/* ============================================================
   SIMPLE UI
   ============================================================ */
Object.assign(MARKETS.passYds,{n:"Passing yards",u:"pass yds"});Object.assign(MARKETS.passAtt,{n:"Pass attempts",u:"pass att"});Object.assign(MARKETS.comp,{n:"Completions",u:"completions"});
Object.assign(MARKETS.passTD,{n:"Passing TDs",u:"pass TDs"});Object.assign(MARKETS.int,{n:"Interceptions",u:"INTs"});
Object.assign(MARKETS.rushYds,{n:"Rushing yards",u:"rush yds"});Object.assign(MARKETS.rushAtt,{n:"Rushing attempts",u:"rush att"});
Object.assign(MARKETS.rec,{n:"Receptions",u:"receptions"});Object.assign(MARKETS.recYds,{n:"Receiving yards",u:"rec yds"});
Object.assign(MARKETS.rushRec,{n:"Rush + rec yards",u:"rush+rec yds"});Object.assign(MARKETS.anyTD,{n:"Anytime TD",u:"TDs"});
const POSNAME={QB:"quarterbacks",RB:"running backs",WR:"wide receivers",TE:"tight ends"};
const short=t=>TEAMS[t][0].split(" ").slice(-1)[0];
const badge=t=>`<span class="ab" style="background:${TEAMS[t][3]}">${t}</span>`;
const recTxt=t=>TEAMS[t][1]+"-"+TEAMS[t][2]+(TEAMS[t].ties?"-"+TEAMS[t].ties:"");
const ordinal=n=>{const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])};
const sideLine=v=>(v>0?"+":"")+v;
function confOf(p){return p>=.6?3:p>=.55?2:p>=.52?1:0}
function confLabel(c){return["Toss-up","Slight lean","Lean","Strong lean"][c]}
function dots(c){return `<span class="dots">${[1,2,3].map(i=>`<i class="${i<=c?"on":""}"></i>`).join("")}</span>`}

function banner(){const b=$("#banner");if(b)b.innerHTML=""}


/* ---------- picks ---------- */
function gamePicks(g){
  const p=projectGame(g),L=LINES[g.id],o=bookML(g),hw=homeWp(g);
  // moneyline: value vs book price
  const eA=(1-hw)-amToProb(o.a),eH=hw-amToProb(o.h);
  let ml;const fav=hw>=.5?g.home:g.away,favP=Math.max(hw,1-hw);
  if(Math.max(eA,eH)>=.025){const t=eH>eA?g.home:g.away,pp=eH>eA?hw:1-hw,e=Math.max(eA,eH);ml={pick:short(t)+" to win",fav,favP,team:t,c:e>=.06?3:e>=.04?2:1,why:`We give ${short(t)} a ${pct(pp)} chance to win; the ${amTxt(t===g.home?o.h:o.a)} price only needs ${pct(amToProb(t===g.home?o.h:o.a))}.`}}
  else ml={pick:"No value",fav,favP,team:null,c:0,why:`${short(fav)} should win about ${pct(favP)} of the time, and the price already reflects that.`};
  // spread
  const line=bookSpread(g),pH=1-normCdf((-line-p.spread)/13.5);
  const spT=pH>=.5?g.home:g.away,spL=pH>=.5?line:-line,spP=Math.max(pH,1-pH),c2=confOf(spP);
  const sp={pick:`${short(spT)} ${sideLine(spL)}`,team:spT,c:c2,p:spP,why:`We project ${p.spread>0?short(g.home):short(g.away)} by ${fmt(Math.abs(p.spread))}. The book line is ${spTxt(g)}.`};
  // total
  const tl=bookTotal(g),pO=1-normCdf((tl-p.total)/13),side=pO>=.5?"Over":"Under",tp=Math.max(pO,1-pO),c3=confOf(tp);
  const tot={pick:`${side} ${tl}`,side,c:c3,p:tp,why:`We project ${fmt(p.total)} total points vs a line of ${tl}.`};
  return{p,ml,sp,tot,hw};
}
function projScore(g){const P=projectGame(g);let a=Math.round(P.ap),h=Math.round(P.hp);
  if(a===h){if(P.hp>=P.ap)h++;else a++}
  const hw=h>a,wp=normCdf((P.hp-P.ap)/13.5);
  return{a,h,P,win:hw?g.home:g.away,lose:hw?g.away:g.home,winP:Math.round((hw?wp:1-wp)*100),total:a+h,margin:Math.abs(h-a)}}
function projBox(g,m){const x=projScore(g),L=LINES[g.id];
  if(m==="ml")return `<div class="pub"><div class="t">🔮 Projected winner: <b>${short(x.win)}</b></div>
   <div class="bar2"><div style="width:${x.win===g.away?x.winP:100-x.winP}%;background:var(--away)"></div><div style="width:${x.win===g.home?x.winP:100-x.winP}%;background:var(--home)"></div></div>
   <div class="winlab"><span>${short(g.away)} ${x.win===g.away?x.winP:100-x.winP}%</span><span>${short(g.home)} ${x.win===g.home?x.winP:100-x.winP}%</span></div></div>`;
  if(m==="sp")return `<div class="pub"><div class="t">🔮 Projected margin: <b>${short(x.win)} by ${x.margin}</b></div><div class="small" style="margin-top:4px">Line: ${short(L.sp<0?g.home:g.away)} −${Math.abs(L.sp)}</div></div>`;
  return `<div class="pub"><div class="t">🔮 Projected total: <b>${x.total} pts</b></div><div class="small" style="margin-top:4px">Line: ${L.tot} · projection is ${Math.abs(x.total-L.tot).toFixed(1)} ${x.total>=L.tot?"above":"below"}</div></div>`}
const PROJ_NOTE="How the projection works: each team's points scored and allowed this season (55%) and in their last 5 games (45%), adjusted for home field (+2.4), then averaged 50/50 with the score the betting line implies. Win chance comes from the projected margin. It's a model, not a guarantee.";

/* ---------- ATS & O/U records (REAL) ---------- */
// ATS and O/U: computed from final scores vs nflverse closing spread/total (schedules data), through Week 8 2026 (CHI-SEA Monday not yet included).
const ATS={DEN:"6-2",LV:"6-2",PIT:"6-2",BUF:"5-2",CHI:"5-2",NYG:"5-2",CLE:"5-3",GB:"4-3-1",JAX:"4-3",MIN:"4-3",NYJ:"4-3-1",SF:"4-3",WAS:"4-3",ARI:"4-4",IND:"4-4",LAR:"4-4",TEN:"4-4",CIN:"3-3-1",MIA:"3-3-1",CAR:"3-4",DAL:"3-4-1",KC:"3-4",NE:"3-4-1",NO:"3-4",TB:"3-4-1",ATL:"3-5",SEA:"2-3-2",DET:"2-4-1",BAL:"2-5-1",HOU:"2-5",PHI:"1-7",LAC:"0-6-1"};
const OU={DAL:"6-2",LV:"6-2",BUF:"5-2",CIN:"5-2",DET:"5-2",NYG:"5-2",ARI:"5-3",IND:"5-3",NE:"5-3",HOU:"4-3",MIA:"4-3",NO:"4-3",WAS:"4-3",ATL:"4-4",BAL:"4-4",CLE:"4-4",LAR:"4-4",NYJ:"4-4",PHI:"4-4",PIT:"4-4",TB:"4-4",TEN:"4-4",CAR:"3-4",CHI:"3-4",JAX:"3-4",KC:"3-4",SEA:"3-4",SF:"3-4",DEN:"3-5",GB:"2-6",LAC:"1-6",MIN:"1-6"};
const TR_SRC={ats:"https://github.com/nflverse/nflverse-data/releases/tag/schedules",ou:"https://github.com/nflverse/nflverse-data/releases/tag/schedules"};
function recPct(r){if(!r)return NaN;const[w,l]=r.split("-").map(Number);return w+l?w/(w+l):NaN}
function recCell(r,kind){if(!r)return '<span class="small">n/a</span>';const p=recPct(r),c=p>=.6?"#7fdc95":p<=.4?"#ff9a9d":"var(--text)";return `<b style="color:${c};display:inline-block;min-width:44px" class="num">${r}</b>`}
function trendsBox(g){
  const row=t=>`<tr><td>${badge(t)} ${short(t)}</td><td>${recCell(ATS[t])} <span class="small">${pct(recPct(ATS[t]))} covers</span></td><td>${recCell(OU[t])} <span class="small">${OU[t]?pct(recPct(OU[t]))+" overs":""}</span></td></tr>`;
  return `<div class="card"><div class="row"><h2 style="margin:0">Betting records this season</h2><span class="sp"></span><span class="tag real">Real</span></div>
   <table style="margin-top:8px"><thead><tr><th>Team</th><th>Against the spread</th><th>Over / under</th></tr></thead><tbody>${row(g.away)}${row(g.home)}</tbody></table>
   <p class="small" style="margin:8px 0 0">ATS = wins-losses-pushes covering the spread. O/U = overs-unders. Source: final scores vs closing lines from <a href="${TR_SRC.ats}" target="_blank" rel="noopener">nflverse</a>.</p></div>`}
let trSort={k:"ats",dir:"desc"};
function viewTrends(){
  const rows=TEAM_IDS.map(t=>({t,ats:recPct(ATS[t]),ou:recPct(OU[t]),su:(TEAMS[t][1]+.0)/Math.max(TEAMS[t][1]+TEAMS[t][2],1),o:oppOf(t)}));
  const d=trSort.dir==="desc"?-1:1;rows.sort((a,b)=>{const x=a[trSort.k],y=b[trSort.k];if(!Number.isFinite(x))return 1;if(!Number.isFinite(y))return -1;return (x-y)*d||a.t.localeCompare(b.t)});
  const seg=(key,opts,st)=>`<div class="seg">${opts.map(([v,n])=>`<button data-${key}="${v}" class="${st===v?"on":""}">${n}</button>`).join("")}</div>`;
  const bar=(p,col)=>Number.isFinite(p)?`<div class="bar2" style="width:120px;display:inline-flex;vertical-align:middle;margin-left:8px"><div style="width:${p*100}%;background:${col}"></div><div style="width:${100-p*100}%;background:#33373d"></div></div>`:"";
  const TT=(location.hash==="#standings"&&document.getElementById("stTrends"))||document.getElementById("v-trends");
  TT.innerHTML=`${TT.id==="stTrends"?"":"<h1>Team trends</h1>"}<p class="sub">How every team has done for bettors this season. Sort to find teams that keep covering the spread, or games that keep going over.</p>
   <div class="row" style="margin-bottom:14px"><span class="small">Sort by</span>${seg("trk",[["ats","Covers the spread"],["ou","Goes over"],["su","Wins"]],trSort.k)}${seg("trd",[["desc","High → Low"],["asc","Low → High"]],trSort.dir)}</div>
   <div class="card"><table><thead><tr><th>Team</th><th>Record</th><th>Against the spread</th><th>Over / under</th><th>This week</th></tr></thead><tbody>
   ${rows.map(r=>`<tr class="click" data-t="${r.t}"><td>${badge(r.t)} <b>${TEAMS[r.t][0]}</b></td><td class="num">${recTxt(r.t)}</td>
     <td>${recCell(ATS[r.t])}${bar(r.ats,"#22c55e")} <span class="small">${pct(r.ats)}</span></td>
     <td>${recCell(OU[r.t])}${bar(r.ou,"#fab219")} <span class="small">${Number.isFinite(r.ou)?pct(r.ou)+" over":""}</span></td>
     <td class="small">${r.o?(r.o.home?"vs ":"at ")+r.o.opp:"—"}</td></tr>`).join("")}</tbody></table>
   <p class="small" style="margin-top:10px">Against the spread and over/under: final scores vs closing spread and total from <a href="${TR_SRC.ats}" target="_blank" rel="noopener">nflverse</a> schedules data, through Week 8 (Sunday games).</p></div>`;
  TT.querySelectorAll("[data-trk]").forEach(b=>b.onclick=()=>{trSort.k=b.dataset.trk;viewTrends()});
  TT.querySelectorAll("[data-trd]").forEach(b=>b.onclick=()=>{trSort.dir=b.dataset.trd;viewTrends()});
  TT.querySelectorAll("tr[data-t]").forEach(tr=>tr.onclick=()=>{const o=oppOf(tr.dataset.t);if(o)location.hash="game-"+o.g.id});
}

/* ---------- Games list ---------- */
function lineRows(g){const o=bookML(g),sp=bookSpread(g),tl=bookTotal(g);
  return `<div class="lines3">
   <div><span class="small">Moneyline</span><b>${short(g.away)} ${amTxt(o.a)}</b><b>${short(g.home)} ${amTxt(o.h)}</b></div>
   <div><span class="small">Spread</span><b>${short(g.away)} ${sideLine(-sp)}</b><b>${short(g.home)} ${sideLine(sp)}</b></div>
   <div><span class="small">Total</span><b>Over ${tl}</b><b>Under ${tl}</b></div></div>`}
function nflGameCard(g,pj){
  const L=LINES[g.id],imp=o=>o==null?null:o>0?100/(o+100):-o/(-o+100),ia=L&&L.ml?imp(L.ml[0]):null,ih=L&&L.ml?imp(L.ml[1]):null,W=ia!=null&&ih!=null?{a:ia/(ia+ih),h:ih/(ia+ih)}:null;
  const col=t=>TEAMS[t][3],sg=x=>x==null?"":x===0?"PK":x>0?"+"+x:"−"+Math.abs(x);
  const row=(t,home)=>{const sp=L&&L.sp!=null?(home?L.sp:-L.sp):null,ml=L&&L.ml?(home?L.ml[1]:L.ml[0]):null,tt=sp!=null&&L.tot!=null?(L.tot/2-sp/2):null,fv=sp!=null&&sp<0;
    return `<tr><td><div class="ngn">${badge(t)}<div><b>${esc(short(t))}</b><small>${recTxt(t)}${home?" · home":""}</small></div></div></td><td class="${fv?"ngfv":""}">${sp!=null?sg(sp):"–"}</td><td>${ml!=null?amTxt(ml):"–"}</td><td>${tt!=null?(Math.round(tt*2)/2).toFixed(1):"–"}</td></tr>`};
  const fav=L&&L.sp!=null?(L.sp<=0?g.home:g.away):null,n=nflGamePropCount(g);
  const out=[...(INJ[g.away]||[]),...(INJ[g.home]||[])].filter(x=>x[2]==="Out"&&["QB","RB","WR","TE"].includes(x[1]));
  return `<div class="card nbag nbg2 game${g.wk&&g.wk!==PLAYS_WEEK?" wkold":""}" data-g="${g.id}">
   <div class="when"><span><b style="color:var(--text)">${esc(g.when)}</b>${g.tv?" · "+esc(g.tv):""}</span><span>${typeof cdChip!=="undefined"?cdChip("nfl",g):""}${g.wk&&g.wk!==PLAYS_WEEK?` <span class="tag real">Wk ${g.wk} finale</span>`:" Details →"}</span></div>
   ${n?`<a class="gpcnt" href="#game-${g.id}-props" onclick="event.stopPropagation()">🎯 ${n} player props →</a>`:""}
   <div class="ngt">${esc(short(g.away))} <span>@</span> ${esc(short(g.home))}</div>
   <table class="ngtab"><thead><tr><th></th><th>Spread</th><th>Win</th><th>Team pts</th></tr></thead><tbody>${row(g.away,false)}${row(g.home,true)}</tbody></table>
   ${W?`<div class="nbwp"><div style="width:${Math.round(W.a*100)}%;background:${col(g.away)}"></div><div style="width:${100-Math.round(W.a*100)}%;background:${col(g.home)}"></div></div>
   <div class="nbwpl"><span>${g.away} ${Math.round(W.a*100)}%</span><span class="small">chance to win (from the odds)</span><span>${g.home} ${Math.round(W.h*100)}%</span></div>`:""}
   ${nflStarted(g)&&!g.final?`<div class="nbsay noglo">${nflDone(g)?"🏁 Game over — the final score shows here as soon as it's in":"🔴 In progress — player props are closed"}</div>`:""}
   ${L?`<div class="nbsay">${fav?`${esc(short(fav))} favored by <b>${Math.abs(L.sp)}</b> · `:""}total points line <b>${L.tot}</b></div>`:`<div class="nbsay">Lines not posted yet</div>`}
   <div class="gchips"><span>🔮 Our pick: <b>${esc(short(pj.win))} ${Math.max(pj.a,pj.h)}–${Math.min(pj.a,pj.h)}</b></span><span>📈 ATS <b>${g.away} ${ATS[g.away]||"–"}</b> · <b>${g.home} ${ATS[g.home]||"–"}</b></span></div>
   ${typeof moveMini!=="undefined"?moveMini(g):""}${typeof restMini!=="undefined"?restMini(g):""}${wxMini(g)}
   ${out.length?`<div class="nbout">Out: <b>${out.map(x=>esc(x[0])+" ("+x[1]+")").join(", ")}</b></div>`:""}</div>`}
function viewGames(){
  const wk0=typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:0,cur=SLATE.filter(g=>!(g.final&&g.wk&&g.wk<wk0)); /* last week's leftover game drops off once it's final */
  const order=[...cur.filter(g=>!g.final),...cur.filter(g=>g.final)];
  const cards=order.map(g=>{
    if(g.final)return `<div class="card nbag nbg2 game" data-g="${g.id}"><div class="when"><span><b style="color:var(--text)">${esc(g.when)}</b></span><span>Box score →</span></div>${nflFinalBlock(g,g.final[0],g.final[1])}</div>`;
    const pj=projScore(g);return nflGameCard(g,pj)}).join("");
  const wk=typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:"";
  $("#v-games").innerHTML=`<h1>NFL · Week ${wk}</h1>${typeof pxRecentHtml!=="undefined"?pxRecentHtml("nfl",4):""}${typeof nfWeekTabs!=="undefined"?nfWeekTabs("games"):""}<p class="sub">${cur.filter(g=>!g.final).length} games to play${cur.some(g=>g.final)?`, ${cur.filter(g=>g.final).length} final`:""}. Tap a game for matchups, injuries and weather, or <b>🎯 player props</b> for every prop in that game.</p>
   <div class="games">${cards}</div>
   ${typeof xInsights!=="undefined"?xInsights("nfl","🧠 This week's insights",[["edges","💰 Odds gaps",xEdgesCard("nfl")],["moves","📈 Line moves",typeof loMovesCard!=="undefined"?loMovesCard("nfl",8):""]]):""}
   <details class="adv" style="margin-top:14px"><summary><b>How to read this</b></summary>
   <p class="small" style="margin:8px 0 0"><b>Moneyline</b>: bet on who wins. <b>Spread</b>: the favorite must win by more than the number. <b>Total</b>: will both teams' points add up to more or less than the line? <b>🔮 Prediction</b>: our model's projected score and win chance — an estimate, not a sure thing. New to betting? See <a href="#guide" style="color:inherit">Betting 101</a>.</p></details>
   <p class="note" style="margin-top:12px">Lines: DraftKings via ESPN, Nov 2. Lines move until kickoff.</p>`;
  document.querySelectorAll(".game").forEach(el=>el.onclick=()=>location.hash="game-"+el.dataset.g);
}

/* ---------- Single game ---------- */
function h2hGames(g){return S.teamLogs.filter(l=>l.team===g.away&&l.opp===g.home).sort((a,b)=>sortKey(b)-sortKey(a))}
function lineCard(title,m,g){return `<div class="card take"><div class="lbl">${title}</div>${betOdds(title,g)}${projBox(g,m)}</div>`}
function betOdds(title,g){const o=bookML(g),sp=bookSpread(g),tl=bookTotal(g);
  const rows=title==="Moneyline"?[[short(g.away),amTxt(o.a),specGame(g,"ml",g.away)],[short(g.home),amTxt(o.h),specGame(g,"ml",g.home)]]:title==="Spread"?[[`${short(g.away)} ${sideLine(-sp)}`,amTxt(-110),specGame(g,"spread",g.away)],[`${short(g.home)} ${sideLine(sp)}`,amTxt(-110),specGame(g,"spread",g.home)]]:[[`Over ${tl}`,amTxt(-110),specGame(g,"total","over")],[`Under ${tl}`,amTxt(-110),specGame(g,"total","under")]];
  return `<div class="odds2">${rows.map(([a,b,sp])=>`<div><span>${a}</span><b>${b}</b>${g.final?"":`<button class="betplus" data-bet='${esc(JSON.stringify(sp))}' title="Add to My Bets" aria-label="Add ${esc(a)} to My Bets">＋</button>`}</div>`).join("")}<span class="small">${title==="Moneyline"?"Best available odds":`Best available line · standard ${amTxt(-110)} price (the book's exact price wasn't published)`}</span></div>`}
function viewGame(id){
  const tabP=/-props$/.test(String(id));id=String(id).replace(/-props$/,"");
  const g=SLATE.find(x=>x.id==id);if(!g){location.hash="games";return}
  const head=`<a class="btn" href="#games">← All games</a>
   <div class="card section" style="margin-top:14px"><div class="small" style="text-align:center">${g.when}${g.tv?" · "+g.tv:""} ${typeof cdChip!=="undefined"?cdChip("nfl",g):""}</div>`;
  if(g.final){$("#v-game").innerHTML=head+`<div class="scoreboard"><div class="sbteam">${badge(g.away)}<div class="nm">${TEAMS[g.away][0]}</div></div><div class="sbscore">${g.final[0]}</div><div class="sbmid">FINAL</div><div class="sbscore">${g.final[1]}</div><div class="sbteam">${badge(g.home)}<div class="nm">${TEAMS[g.home][0]}</div></div></div></div>`;return}
  $("#v-game").innerHTML=head+`
    <div class="scoreboard">
      <div class="sbteam">${badge(g.away)}<div class="nm">${TEAMS[g.away][0]}</div><div class="rec">${recTxt(g.away)}</div></div>
      <div class="sbmid" style="font-size:22px">@</div>
      <div class="sbteam">${badge(g.home)}<div class="nm">${TEAMS[g.home][0]}</div><div class="rec">${recTxt(g.home)}</div></div>
    </div></div>
   ${nflGameTabs(g,tabP)}
   ${tabP?`<div id="gpBody">${nflGameProps(g)}</div>`:`
   ${typeof nflQuick!=="undefined"?nflQuick(g):""}
   <div class="section"><h2>The lines</h2><div class="grid g3">${lineCard("Moneyline","ml",g)}${lineCard("Spread","sp",g)}${lineCard("Total","tot",g)}</div>
    <p class="note" style="margin-top:8px">${PROJ_NOTE} ${splitsSrc(g)}</p>${typeof xaPmLine!=="undefined"?xaPmLine("nfl",g.away,g.home):""}</div>
   ${nflEdgesCard(g)}
   ${(()=>{const T=S.gtab||"mu",tabs=[["mu","📊 Matchup"],["tr","📈 Trends"],["inj","🩹 Injuries & weather"]];
    const nav=`<div class="gtabs nhtabs" style="margin-top:12px">${tabs.map(([k,l])=>`<a href="#" data-nfgt="${k}" class="${k===T?"on":""}">${l}</a>`).join("")}<a href="#game-${g.id}-props">🎯 Props</a></div>`;
    if(T==="tr")return nav+`   <div class="section">${nflGsHtml(g)}</div>
   ${paceRestSection(g)}${marketSection(g)}
   <div class="section">${trendsBox(g)}</div>
   ${typeof xaNflQtrCard!=="undefined"?xaNflQtrCard(g):""}
   <div class="section grid g2">
    <div class="card"><h2>Recent form</h2><p class="small" style="margin-top:-6px">Every 2026 game, newest first. Green = won, red = lost. The bar shows how much they won or lost by. Source: CBS Sports scores.</p>${formHtml(g.away)}${formHtml(g.home)}</div>
    <div class="card"><h2>Head-to-head</h2>${h2hHtml(g)}</div></div>
   ${nfNextCard(g)}
   `;
    if(T==="inj")return nav+`<div class="section">${injWxSection(g)}</div>`;
    return nav+`   <div class="section"><h2>Offense vs defense</h2><p class="small" style="margin-top:-6px">Per-game averages this season. Rank 1st = best in the NFL (most gained for offenses, least allowed for defenses). <span class="tag real">Real</span> Offense from ESPN, yards allowed from NFL.com, points allowed from CBS scores.</p>
    <div class="grid g2">${ovdHtml(g.away,g.home)}${ovdHtml(g.home,g.away)}</div></div>
   ${nfPressCard(g)}${nfShareCard(g)}${typeof xaKeyOutCard!=="undefined"?`<div class="section">${xaKeyOutCard("nfl",g.away,g.home)}${xaDefTrendCard("nfl",g.away,g.home)}${xaTdCard(g)}${xaProeCard(g)}${xaDivCard(g)}${xaKickCard(g)}</div>`:""}
   <div class="section"><h2>Run game: yards per rushing attempt</h2><p class="small" style="margin-top:-6px">How well each offense runs the ball against how well the other defense stops it. <span class="tag real">Real</span> <a href="${RUN_SRC.att}" target="_blank" rel="noopener">StatRankings</a> rushing attempts and YPC allowed (2026, through Oct 27) with ESPN rushing yards.</p>
    <div class="grid g2">${runGameHtml(g.away,g.home)}${runGameHtml(g.home,g.away)}</div></div>
   <div class="section"><h2>Coverage: man vs zone</h2><p class="small" style="margin-top:-6px"><b>Man</b> = each defender follows one receiver. <b>Zone</b> = defenders guard areas of the field. Some offenses and receivers are much better against one than the other.</p>
    <div class="grid g2">${covGameHtml(g.away,g.home)}${covGameHtml(g.home,g.away)}</div>
    <p class="note" style="margin-top:8px">Defense coverage rates: <a href="${COV_SRC}" target="_blank" rel="noopener">Sharp Football Analysis</a>, updated Oct 27, 2026.</p></div>
`})()}
   <a class="btn" href="#game-${g.id}-props" style="display:block;text-align:center;margin-top:14px">🎯 See every player prop in this game →</a>`}`;
  if(tabP)nflWireGameProps(g);else nflGsWire(g);
  document.querySelectorAll("#v-game [data-nfgt]").forEach(a=>a.onclick=e=>{e.preventDefault();const y=scrollY;S.gtab=a.dataset.nfgt;viewGame(id);scrollTo(0,y)});
  window.scrollTo(0,0);
}
function nflGsHtml(g){const L=LINES[g.id];return gsCard("nfl|"+g.id,"nfl",[g.away,g.home],gsRowsNfl,t=>gsH2hNfl(g,t),{sp:L?L.sp:null,tot:L?L.tot:null},[35,57,3])}
function nflGsWire(g){const el=$("#v-game");if(!el)return;gsWire(el,()=>{const c=el.querySelector(".gsc");if(!c)return;const y=scrollY;c.outerHTML=nflGsHtml(g);nflGsWire(g);scrollTo(0,y)})}
function nflGamePlayers(g){const tms=[g.away,g.home];
  return Object.values(PINFO).filter(p=>tms.includes(p.team)&&marketsFor(p.pos).some(m=>realProp(p.name,m)))
   .sort((a,b)=>tms.indexOf(a.team)-tms.indexOf(b.team)||POS.indexOf(a.pos)-POS.indexOf(b.pos)||a.name.localeCompare(b.name))}
function nflGamePropCount(g){if(g.final||nflStarted(g))return 0;return nflGamePlayers(g).reduce((n,p)=>n+marketsFor(p.pos).filter(m=>realProp(p.name,m)).length,0)}
function nflGameTabs(g,tabP){if(g.final)return "";const n=nflGamePropCount(g);
  return `<div class="gtabs" style="margin-top:12px"><a href="#game-${g.id}" class="${tabP?"":"on"}">📊 Game</a><a href="#game-${g.id}-props" class="${tabP?"on":""}">🎯 Player props${n?` <small>${n}</small>`:""}</a></div>`}
let NFL_GPT="all";
function nflGameProps(g){
  if(nflStarted(g))return `<div class="info"><span>🔒 This game has kicked off — pregame player props are closed.</span></div>`;
  const tms=[g.away,g.home],P=nflGamePlayers(g);
  if(!P.length)return `<div class="card"><h2>No player props yet</h2><p class="small" style="margin:0">Sportsbooks post most NFL player props between Tuesday and Thursday. We add them as they come out — check back then.</p></div>`;
  const tf=tms.includes(NFL_GPT)?NFL_GPT:"all";
  const best=nflBest().filter(b=>tms.includes(b.pl.team)).slice(0,5);
  const list=P.filter(p=>tf==="all"||p.team===tf);
  return `${best.length?`<div class="card"><h2 style="margin-bottom:2px">🔥 Best props in this game</h2><div class="small" style="margin-bottom:8px">Ranked by how far our chance of winning beats the chance the odds imply.</div><div class="bpc">${best.map(nflBestRow).join("")}</div></div>`:""}
  <div class="info" style="margin-top:10px"><span>🔗 <b>Building a same-game parlay?</b> Tap a price → <b>Add to parlay</b>. Your parlay slip checks past games to show which legs tend to hit together and which work against each other.</span></div>
  <div class="gpf"><div class="seg"><button class="btn${tf==="all"?" on":""}" data-ngpt="all">Both teams</button>${tms.map(t=>`<button class="btn${tf===t?" on":""}" data-ngpt="${t}">${badge(t)} ${esc(short(t))}</button>`).join("")}</div></div>
  ${list.map(p=>nflLinesBlock(p,`<div class="gph">${badge(p.team)}<div style="min-width:0"><a href="#" data-gopl="${esc(p.name)}"><b>${esc(p.name)}</b></a><div class="small">${p.team} · ${p.pos} · ${marketsFor(p.pos).filter(m=>realProp(p.name,m)).length} line${marketsFor(p.pos).filter(m=>realProp(p.name,m)).length>1?"s":""}</div></div></div>`)).join("")}
  <p class="note" style="margin-top:8px">Boxes = his last 6 games this season, newest on the right: <span class="lc o">green</span> over, <span class="lc u">red</span> under. Lines close at kickoff.</p>`;
}
function nflWireGameProps(g){const b=document.getElementById("gpBody");if(!b)return;
  b.querySelectorAll("[data-ngpt]").forEach(x=>x.onclick=()=>{NFL_GPT=x.dataset.ngpt;const y=scrollY;b.innerHTML=nflGameProps(g);nflWireGameProps(g);scrollTo(0,y)});
  b.querySelectorAll("[data-gopl]").forEach(x=>x.onclick=e=>{e.preventDefault();goPlayer(x.dataset.gopl.replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"'))});
  b.querySelectorAll("[data-nflp]").forEach(el=>el.onclick=()=>{S.prop={player:el.dataset.nflp.replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"'),market:el.dataset.k,open:true};location.hash="props"});
  b.querySelectorAll(".pl[data-m]").forEach(el=>el.onclick=e=>{if(e.target.closest("button,a"))return;const nm=el.closest(".plines").querySelector("[data-gopl]");if(nm){S.prop={player:nm.dataset.gopl.replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"'),market:el.dataset.m,open:true};location.hash="props"}});
}
/* ---------- Coverage: man vs zone ---------- */
// REAL: defensive man/zone coverage rates, Sharp Football Analysis (updated Oct 27, 2026)
const DEF_COV={CLE:[42.4,54.0],NE:[30.8,63.8],CHI:[29.9,65.8],CIN:[26.6,65.3],IND:[26.2,66.5],NYG:[26.1,68.6],DEN:[24.5,70.3],NYJ:[23.8,66.6],
 LAR:[22.7,68.7],ATL:[21.9,70.3],LV:[21.4,70.0],DAL:[21.3,69.9],JAX:[21.0,73.4],DET:[18.2,76.4],MIA:[18.1,73.4],KC:[17.6,79.1],TB:[17.2,78.0],
 BUF:[16.8,74.9],TEN:[16.5,77.2],BAL:[15.9,78.6],HOU:[15.7,80.3],NO:[15.5,74.7],PHI:[15.1,72.8],GB:[13.8,77.6],WAS:[12.9,76.9],PIT:[12.6,82.2],
 SF:[11.8,82.1],CAR:[11.6,83.3],LAC:[10.6,58.0],ARI:[9.1,70.9],SEA:[5.4,90.0],MIN:[5.3,86.5]};
const COV_SRC="https://www.sharpfootballanalysis.com/stats-nfl/nfl-coverage-schemes/";
let COV_IMP=LS.get("covImp",null); // {off:{TEAM:[man,zone]}, pl:{name:[man,zone]}}
const manShare=t=>{const c=DEF_COV[t];return c[0]/(c[0]+c[1])};
const LG_MAN=avg(Object.keys(DEF_COV).map(manShare));
const manRank=t=>Object.keys(DEF_COV).sort((a,b)=>manShare(b)-manShare(a)).indexOf(t)+1;
function hashR(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return rng(h>>>0)}
// offense pass efficiency vs man / zone (yards per attempt). Demo unless imported.
function offCov(t){if(COV_IMP&&COV_IMP.off&&COV_IMP.off[t])return{m:COV_IMP.off[t][0],z:COV_IMP.off[t][1],imp:1};
  const r=hashR("off"+t),u=units()[t].o.pass;const base=5.6+(u-200)/60;return{m:+(base+(r()-.5)*2.2).toFixed(1),z:+(base+.3+(r()-.5)*1.6).toFixed(1)}}
// player vs man / zone: QB = passer rating, others = yards per route run. Demo unless imported.
function plCov(name,pos){if(COV_IMP&&COV_IMP.pl&&COV_IMP.pl[name])return{m:COV_IMP.pl[name][0],z:COV_IMP.pl[name][1],imp:1};
  const r=hashR("pl"+name);if(pos==="QB"){const b=88+(r()-.5)*20;return{m:+(b+(r()-.5)*24).toFixed(1),z:+(b+(r()-.5)*18).toFixed(1)}}
  const b=pos==="RB"?1.0:pos==="TE"?1.4:1.75;return{m:+(b+(r()-.5)*.9).toFixed(2),z:+(b+(r()-.5)*.7).toFixed(2)}}
// how well a split fits an opponent's coverage mix, relative to a league-average mix
function covFit(split,opp){const s=manShare(opp),e=s*split.m+(1-s)*split.z,b=LG_MAN*split.m+(1-LG_MAN)*split.z;return b?e/b-1:0}
function covWord(f){return f>=.03?["✅ Coverage fits him","g"]:f<=-.03?["⚠️ Coverage works against him","r"]:["Coverage: neutral","n"]}
const covTag=imp=>imp?'<span class="tag imp">Imported</span>':'<span class="tag demo">Sample</span>';
function covBar(t){const s=manShare(t)*100;return `<div class="bar2" style="height:10px"><div style="width:${s}%;background:#a78bfa"></div><div style="width:${100-s}%;background:#2dd4bf"></div></div>
  <div class="winlab"><span>Man ${DEF_COV[t][0]}%</span><span>Zone ${DEF_COV[t][1]}%</span></div>`}
function defYdsHtml(def){const d=COV_IMP&&COV_IMP.def&&COV_IMP.def[def];
  if(d)return `<p class="small" style="margin:12px 0 6px">${short(def)} yards per pass attempt allowed <span class="tag imp">Imported</span></p><div class="grid g2" style="gap:8px"><div class="stat" style="padding:10px"><div class="l">vs Man</div><div class="v" style="font-size:20px">${d[0]}</div></div><div class="stat" style="padding:10px"><div class="l">vs Zone</div><div class="v" style="font-size:20px">${d[1]}</div></div></div>`;
  return ""}
function covGameHtml(off,def){
  if(!(COV_IMP&&COV_IMP.off&&COV_IMP.off[off])){const mostly=manShare(def)>LG_MAN+.04?"man":manShare(def)<LG_MAN-.04?"zone":"mix";
    return `<div class="card"><h3>${badge(def)} ${short(def)} defense coverage</h3>
     <p class="small" style="margin:8px 0 6px">${mostly==="man"?`Plays <b>more man</b> than most teams (${ordinal(manRank(def))} most)`:mostly==="zone"?`Plays <b>more zone</b> than most teams`:"About a league-average mix"} — this is what ${short(off)+(/s$/.test(short(off))?"'":"'s")} passing game will face.</p>${covBar(def)}${defYdsHtml(def)}
     </div>`}
  const c=offCov(off),better=c.m>c.z?"man":"zone",mostly=manShare(def)>LG_MAN+.04?"man":manShare(def)<LG_MAN-.04?"zone":"mix";
  const f=covFit(c,def),w=f>=.03?[`✅ Good matchup for ${short(off)} passing`,"#7fdc95"]:f<=-.03?[`⚠️ Tough matchup for ${short(off)} passing`,"#ff9a9d"]:["Neutral matchup","#b9bdc4"];
  return `<div class="card"><h3>${badge(def)} ${short(def)} defense <span class="small">vs</span> ${badge(off)} ${short(off)} passing</h3>
   <p class="small" style="margin:8px 0 6px">${short(def)} coverage <span class="tag real">Real</span> — ${mostly==="man"?`plays <b>more man</b> than most teams (${ordinal(manRank(def))} most)`:mostly==="zone"?`plays <b>more zone</b> than most teams`:"about a league-average mix"}</p>${covBar(def)}${defYdsHtml(def)}
   <p class="small" style="margin:14px 0 6px">${short(off)} passing, yards per attempt ${covTag(c.imp)}</p>
   <div class="grid g2" style="gap:8px"><div class="stat" style="padding:10px"><div class="l">vs Man</div><div class="v" style="font-size:20px">${c.m}</div></div><div class="stat" style="padding:10px"><div class="l">vs Zone</div><div class="v" style="font-size:20px">${c.z}</div></div></div>
   <p style="margin:10px 0 0;font-size:14px">${short(off)} average more yards per attempt against <b>${better}</b>.</p></div>`;
}

/* ---------- Run game: yards per rushing attempt ---------- */
// REAL 2026 (StatRankings, through Oct 27): offense rushing attempts per game, and defense yards per rushing attempt allowed. Offense YPC = ESPN rush yds/game ÷ attempts/game.
const RUSH_ATT={CHI:35.1,BAL:30.3,MIN:30.2,TB:30.0,ATL:29.4,SEA:29.4,BUF:29.3,NE:29.1,NYG:28.7,IND:28.6,MIA:28.5,LAC:28.2,JAX:27.8,WAS:27.5,SF:27.3,DET:27.2,KC:26.8,LAR:26.6,CLE:26.3,ARI:25.9,NYJ:25.6,LV:24.9,DEN:24.7,NO:24.4,CAR:24.3,HOU:23.9,TEN:23.0,DAL:22.9,PIT:22.9,PHI:22.7,CIN:22.3,GB:20.6};
const OPP_YPC={JAX:3.3,SF:3.5,SEA:3.5,KC:3.6,TB:3.6,PIT:3.7,MIA:3.8,BAL:3.8,BUF:3.9,NE:3.9,ATL:3.9,HOU:3.9,GB:4.0,WAS:4.0,LAC:4.0,DET:4.1,MIN:4.1,TEN:4.2,NYJ:4.2,LAR:4.2,PHI:4.2,CLE:4.4,CHI:4.5,DEN:4.6,DAL:4.7,CIN:4.7,ARI:4.7,NO:4.8,NYG:4.8,IND:4.8,LV:5.0,CAR:5.2};
const RUN_SRC={att:"https://statrankings.com/nfl/teams/rushing-offense/rushing-attempts-per-game",def:"https://statrankings.com/nfl/teams/rushing-defense/opponent-yards-per-rush-attempt"};
let RUN_IMP=LS.get("runImp",null); // {off:{TEAM:[iz,oz,power]}, def:{TEAM:[iz,oz,power]}}
const offYPC=t=>TEAM_STATS[t]&&RUSH_ATT[t]?TEAM_STATS[t].rush/RUSH_ATT[t]:NaN;
const ypcRank=(t,side)=>{const f=side==="o"?offYPC:x=>OPP_YPC[x];const ok=TEAM_IDS.filter(x=>Number.isFinite(f(x)));const v=f(t);return Number.isFinite(v)?(side==="o"?ok.filter(x=>f(x)>v).length:ok.filter(x=>f(x)<v).length)+1:NaN};
function runGameHtml(off,def){
  const oy=offYPC(off),dy=OPP_YPC[def],oR=ypcRank(off,"o"),dR=ypcRank(def,"d");
  const RO=RUN_IMP&&RUN_IMP.off&&RUN_IMP.off[off],RD=RUN_IMP&&RUN_IMP.def&&RUN_IMP.def[def];
  const f=v=>Number.isFinite(v)?v.toFixed(1):"—";
  const types=["Inside zone","Outside zone","Power / gap"];
  return `<div class="card"><h3>${badge(off)} ${short(off)} run game <span class="small">vs</span> ${badge(def)} ${short(def)} run defense</h3>
   <div class="grid g2" style="gap:8px;margin-top:10px">
    <div class="stat" style="padding:10px"><div class="l">${short(off)} yards per rushing attempt</div><div class="v" style="font-size:22px">${f(oy)}</div><div class="s">${Number.isFinite(oR)?ordinal(oR)+" in NFL":""} · ${RUSH_ATT[off]||"—"} carries/game</div></div>
    <div class="stat" style="padding:10px"><div class="l">${short(def)} YPC allowed</div><div class="v" style="font-size:22px">${f(dy)}</div><div class="s">${Number.isFinite(dR)?ordinal(dR)+" fewest allowed":""}</div></div></div>
   ${RO||RD?`<p class="small" style="margin:14px 0 6px">Yards per rushing attempt by run type</p><table><thead><tr><th>Run type</th><th class="r">${short(off)} offense</th><th class="r">${short(def)} allow</th></tr></thead><tbody>${types.map((n,i)=>`<tr><td>${n}</td><td class="r num"><b>${RO?RO[i]:"—"}</b></td><td class="r num"><b>${RD?RD[i]:"—"}</b></td></tr>`).join("")}</tbody></table>`:""}</div>`}
function runImportUI(){
  const d=document.createElement("div");d.className="card";d.style.marginTop="14px";
  d.innerHTML=`<div class="row"><h2 style="margin:0">Run type splits (yards per rushing attempt)</h2><span class="sp"></span>${RUN_IMP?'<span class="tag imp">Imported</span>':'<span class="tag">Not loaded</span>'}</div>
   <p class="note">Paste yards per rushing attempt by run type (e.g. from PFF, FTN or StatRankings+). Columns: <span style="font-family:monospace">type,team,inside_zone,outside_zone,power</span>. type = <b>offense</b> (team's YPC) or <b>defense</b> (YPC allowed). Team = code like BUF.</p>
   <textarea id="rTxt" placeholder="type,team,inside_zone,outside_zone,power\noffense,BAL,5.1,5.4,4.6\ndefense,BUF,4.0,3.8,4.4"></textarea>
   <div class="row" style="margin-top:8px"><button class="btn pri" id="rImp">Import run splits</button><button class="btn" id="rRes">Clear</button></div>`;
  $("#v-data").appendChild(d);
  $("#rImp").onclick=()=>{try{const L=$("#rTxt").value.trim().split(/\r?\n/);if(/^type/i.test(L[0]))L.shift();const o={off:{},def:{}};
    L.forEach(l=>{const [t,n,a,b,c]=l.split(",").map(x=>x.trim());if(!n)return;(t.toLowerCase().startsWith("def")?o.def:o.off)[n.toUpperCase()]=[+a,+b,+c]});
    RUN_IMP=o;LS.set("runImp",o);toast(Object.keys(o.off).length+" offenses, "+Object.keys(o.def).length+" defenses imported");route()}catch(e){toast("Couldn't read that: "+e.message)}};
  $("#rRes").onclick=()=>{RUN_IMP=null;LS.set("runImp",null);route()};
}

/* ---------- Offense vs defense ---------- */
let unitCache=null;
function units(){
  if(unitCache)return unitCache;const u={};
  TEAM_IDS.forEach(t=>{const s=TEAM_STATS[t];u[t]={o:{pts:s.ppg,pass:s.pass_,rush:s.rush,tot:+(s.pass_+s.rush).toFixed(1)},d:{pts:+avg(teamGames(t).map(x=>x.pa)).toFixed(1),pass:s.dpass,rush:s.drush,tot:+(s.dpass+s.drush).toFixed(1)}}});
  ["pts","pass","rush","tot"].forEach(k=>{
    [...TEAM_IDS].sort((a,b)=>u[b].o[k]-u[a].o[k]).forEach((t,i)=>u[t].o[k+"R"]=i+1);
    [...TEAM_IDS].sort((a,b)=>u[a].d[k]-u[b].d[k]).forEach((t,i)=>u[t].d[k+"R"]=i+1)});
    return unitCache=u;
}
function rankPill(r){const c=r<=10?"#11301d;color:#7fdc95":r>=23?"#3a1618;color:#ff9a9d":"#24272c;color:#b9bdc4";return `<span style="background:${c};font-size:11.5px;font-weight:700;padding:2px 7px;border-radius:6px">${ordinal(r)}</span>`}
/* ---------- NFL biggest edges: where an offense's rank and the other defense's rank are far apart ---------- */
function nflEdges(g){
  const u=units(),out=[],ps=t=>{const n=short(t);return n.endsWith("s")?n+"'":n+"'s"};if(!u[g.away]||!u[g.home])return out;
  const lab={pts:["scoring","points"],pass:["passing game","passing yards"],rush:["running game","rushing yards"],tot:["offense","total yards"]};
  for(const [off,def] of [[g.away,g.home],[g.home,g.away]])for(const k of ["pts","pass","rush","tot"]){
    const oR=u[off].o[k+"R"],dR=u[def].d[k+"R"];if(!Number.isFinite(oR)||!Number.isFinite(dR))continue;
    const edge=dR-oR;if(Math.abs(edge)<10)continue;
    out.push({e:edge,off,def,k,t:edge>0?`<b>${ps(off)} ${lab[k][0]}</b> (${ordinal(oR)} in the NFL) faces a ${short(def)} defense that ranks ${ordinal(dR)} at stopping ${lab[k][1]} — <b class="up">edge ${short(off)}</b>.`
      :`<b>${ps(def)} defense</b> (${ordinal(dR)} vs ${lab[k][1]}) should slow ${ps(off)} ${lab[k][0]} (${ordinal(oR)}) — <b class="dn">edge ${short(def)} defense</b>.`});
  }
  if(typeof OPP_YPC!=="undefined"&&typeof RUSH_ATT!=="undefined")for(const [off,def] of [[g.away,g.home],[g.home,g.away]]){
    const y=OPP_YPC[def];if(y==null)continue;
    if(y>=4.8&&RUSH_ATT[off]>=28)out.push({e:12,t:`<b>${short(off)} run a lot</b> (${RUSH_ATT[off]} carries a game) and ${short(def)} allow <b>${y} yards per carry</b> (one of the worst) — good spot for ${ps(off)} running backs.`});
    if(y<=3.6&&RUSH_ATT[off]>=28)out.push({e:-12,t:`<b>${short(off)} lean on the run</b> (${RUSH_ATT[off]} carries a game) but ${short(def)} allow only <b>${y} yards per carry</b> — tough day on the ground likely.`});
  }
  return out.sort((a,b)=>Math.abs(b.e)-Math.abs(a.e)).slice(0,5);
}
function nflEdgesCard(g){const E=nflEdges(g);if(!E.length)return "";
  return `<div class="section"><div class="card"><h2>Biggest edges</h2><p class="small" style="margin-top:-6px">Where one team's strength meets the other team's weakness (10+ spots apart in the NFL rankings). Season to date.</p>
  ${E.map(e=>`<div class="edgel"><span class="${e.e>0?"up":"dn"}">${e.e>0?"▲":"▼"}</span><div>${e.t}</div></div>`).join("")}</div></div>`}
function rkBar(r){const w=Math.max(4,Math.round((33-r)/32*100));return `<div class="rkbar"><i style="width:${w}%;background:${r<=10?"#3fb26b":r>=23?"#e5534b":"#8a8f98"}"></i></div>`}
function ovdHtml(off,def){
  const u=units(),O=u[off].o,D=u[def].d;
  const row=(k,lab,unit,dec)=>{const oR=O[k+"R"],dR=D[k+"R"],edge=dR-oR; // positive => offense better ranked than defense
    const w=Math.abs(edge)<6?["Even matchup","ovw0"]:edge>0?[`Edge: ${short(off)} offense`,"ovw1"]:[`Edge: ${short(def)} defense`,"ovw2"];
    return `<div class="ovd"><div class="ovl">${lab}</div>
      <div><div class="num"><b>${fmt(O[k],dec)}</b> <span class="small">${unit}/game</span></div>${rankPill(oR)}${rkBar(oR)}</div>
      <div><div class="num"><b>${fmt(D[k],dec)}</b> <span class="small">${unit} allowed</span></div>${rankPill(dR)}${rkBar(dR)}</div>
      <div class="ovw ${w[1]}">${w[0]}</div></div>`};
  return `<div class="card"><div class="row"><h3 style="margin:0">${badge(off)} ${short(off)} offense <span class="small">vs</span> ${badge(def)} ${short(def)} defense</h3></div>
    <div class="ovd head"><div></div><div>${short(off)} offense</div><div>${short(def)} defense</div><div>Who wins it</div></div>
    ${row("pts","Points","pts",1)}${row("pass","Passing","yds",1)}${row("rush","Rushing","yds",1)}${row("tot","Total","yds",1)}</div>`;
}
function chips(t){return teamGames(t).map(x=>`<span class="chip ${x.pf>x.pa?"w":"l"}" title="vs ${x.opp} ${x.pf}-${x.pa}">${x.pf>x.pa?"W":"L"}</span>`).join("")}
function formHtml(t){const G=[...teamGames(t)].reverse(),w=G.filter(x=>x.pf>x.pa).length,mx=Math.max(14,...G.map(x=>Math.abs(x.pf-x.pa)));
  return `<div style="margin:10px 0 14px"><div class="row" style="margin-bottom:6px">${badge(t)}<b>${TEAMS[t][0]}</b><span class="small">${w}-${G.length-w} this season</span></div>
   ${G.map(x=>{const m=x.pf-x.pa,win=m>0;return `<div class="frow"><span class="small" style="width:42px">Wk ${x.week}</span><span style="width:58px">${x.home?"vs":"@"} <b>${x.opp}</b></span>
     <span class="wl ${win?"w":"l"}">${win?"W":"L"}</span><span class="num" style="width:52px">${x.pf}-${x.pa}</span>
     <span class="mbar"><i style="width:${Math.abs(m)/mx*100}%;background:${win?"#22c55e":"#f05252"}"></i></span><span class="small" style="width:70px;text-align:right">${win?"won by "+m:"lost by "+(-m)}</span></div>`}).join("")}</div>`}
function h2hHtml(g){const R=(typeof H2H_RAW!=="undefined"&&H2H_RAW[g.id])||[];if(!R.length)return '<p class="note">No meetings found.</p>';
  const tl=bookTotal(g),G=R.map(([d,a,ap,h,hp,po])=>({d,a,ap,h,hp,po,win:ap>hp?a:h,tot:ap+hp}));
  const aw=G.filter(x=>x.win===g.away).length,hw=G.length-aw,ov=G.filter(x=>x.tot>tl).length,avgT=avg(G.map(x=>x.tot));
  const lead=aw>hw?`${short(g.away)} lead ${aw}-${hw}`:hw>aw?`${short(g.home)} lead ${hw}-${aw}`:`Tied ${aw}-${hw}`;
  const yr=d=>d.slice(0,4),fmtD=d=>new Date(d+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  return `<p class="small" style="margin-top:-6px">Last ${G.length} meetings (regular season + playoffs), newest first. <span class="tag real">nflverse</span></p>
   <div class="grid g3" style="margin-bottom:12px;gap:8px"><div class="stat" style="padding:10px"><div class="l">Series</div><div class="v" style="font-size:19px">${lead}</div></div>
   <div class="stat" style="padding:10px"><div class="l">Avg total pts</div><div class="v" style="font-size:19px">${fmt(avgT,1)}</div></div>
   <div class="stat" style="padding:10px"><div class="l">Over ${tl}</div><div class="v" style="font-size:19px">${ov} of ${G.length}</div></div></div>
   <table><tbody>${G.map(x=>`<tr><td class="small">${fmtD(x.d)}${x.po?' <span class="tag">Playoff</span>':""}</td>
     <td>${x.win===x.a?"<b>":""}${short(x.a)} ${x.ap}${x.win===x.a?"</b>":""} <span class="small">@</span> ${x.win===x.h?"<b>":""}${short(x.h)} ${x.hp}${x.win===x.h?"</b>":""}</td>
     <td class="r">${badge(x.win)}</td><td class="r small">${x.tot} pts ${x.tot>tl?'<span class="ou o">O</span>':x.tot<tl?'<span class="ou u">U</span>':""}</td></tr>`).join("")}</tbody></table>
   <p class="note" style="margin-top:8px">O/U compares each final total with this week's total (${tl}).</p>`}

/* ---------- Props ---------- */
function propRows(players,opp){
  const out=[];players.forEach(pl=>marketsFor(pl.pos).forEach(k=>{
    if(typeof OUT!=="undefined"&&OUT[pl.name])return;if(typeof injSidelined!=="undefined"&&injSidelined(pl.name))return;if(!realProp(pl.name,k)&&!S.lines[pl.name+"|"+k])return;
    const line=lineFor(pl.name,k);if(!Number.isFinite(line))return;const L=pLogs(pl.name);
    const curv=L.filter(l=>l.season===CUR).map(l=>stat(l,k)).filter(Number.isFinite);
    const l3=hitRate(curv.slice(-3),line),l5=hitRate(curv.slice(-5),line),ssn=hitRate(curv,line);
    const dvp=opp?dvpFor(opp,pl.pos,k):{rank:NaN};
    out.push({pl,k,line,opp,dv:dvp.rank,l3,l5,ssn,avg:curv.length?avg(curv):NaN,gi:SLATE.findIndex(g=>g.away===pl.team||g.home===pl.team)})}));
  return out;
}
function defRankTxt(r,opp,pos){return Number.isFinite(r)?`${short(opp)} allow the ${ordinal(r)} most to ${POSNAME[pos]}`:""}
function hrBox(lab,h){const v=h.o,c=!Number.isFinite(v)?"":v>=.6?"g":v<=.4?"r":"";return `<div class="hrb ${c}"><span>${lab}</span><b>${h.n?h.oc+"/"+h.n:"—"}</b><i style="width:${(v||0)*100}%"></i></div>`}
function trackRow(r){const td=r.k==="anyTD";return `<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${betBtn(specProp(r.pl.name,r.k,"over"),td?"Yes":"Over")}${td?"":betBtn(specProp(r.pl.name,r.k,"under"),"Under")}${realProp(r.pl.name,r.k)&&typeof snapBtn!=="undefined"?snapBtn("nfl",r.pl.name,r.k):shareBtn(specProp(r.pl.name,r.k,"over"))}</div>`}
function oddsRow(r){const p=realProp(r.pl.name,r.k),td=r.k==="anyTD";const ov=p&&p[1]!=null?p[1]:null,un=p&&p[2]!=null?p[2]:null;
  return `<div class="odds">${ov==null&&un==null?`<span class="small">Odds: not listed publicly (usually ${amTxt(-110)})</span>`:`<span>Odds: ${ov!=null?`<b>${td?"Yes":"Over"} ${amTxt(ov)}</b>`:""}${ov!=null&&un!=null?" · ":""}${un!=null?`<b>Under ${amTxt(un)}</b>`:""}</span>`}</div>`}
function lineTag(r){const p=realProp(r.pl.name,r.k);if(S.lines[r.pl.name+"|"+r.k])return '<span class="small">Your line</span>';
  if(!p)return '<span class="small">No public book line found — showing his season average</span>';
  return `<span class="small"><span class="tag ${p[3]==="bet365"?"real":"imp"}">${p[3]==="bet365"?"bet365":"Real line"}</span> ${p[3]==="bet365"?"":p[3]}</span>`}
function propRowLite(r){const td=r.k==="anyTD",rp=realProp(r.pl.name,r.k),hr=(h,l)=>h.n?`<span class="${h.o>=.6?"g":h.o<=.4?"r":""}"><b>${h.oc}/${h.n}</b> ${l}</span>`:"";
  return `<div class="bp" data-p="${esc(r.pl.name)}" data-k="${r.k}"><div class="bpm"><div class="bpw">${badge(r.pl.team)}<b>${esc(r.pl.name)}</b> <span class="small">${r.pl.pos} · vs ${r.opp}</span>${r.l5.n>=5&&r.l5.oc>=4?`<span class="bfire">🔥 ${r.l5.oc}/5</span>`:""}</div>
   <div class="bpl"><span class="bln">${td?"TD":r.line}</span> <b>${td?"Anytime TD":MARKETS[r.k].n}</b> <span class="small">${rp&&rp[1]!=null?(td?"Yes ":"O ")+amTxt(rp[1]):""}${rp&&rp[2]!=null?" · U "+amTxt(rp[2]):""}${rp&&rp[3]?" · "+esc(rp[3]):""}${rp?"":"season avg line"}</span></div>
   <div class="bph">${hr(r.l3,"L3")}${hr(r.l5,"L5")}${hr(r.ssn,"season")}${Number.isFinite(r.dv)?`<span class="${r.dv<=8?"g":r.dv>=25?"r":""}">${r.opp} ${ordinal(r.dv)} most allowed</span>`:""}</div></div>
   <div class="bps"><b>${r.ssn.n?Math.round(r.ssn.o*100)+"%":"—"}</b><span>${td?"scored":"over"} this season</span></div></div>`}
function propCard(r){const td=r.k==="anyTD";
  return `<div class="card prop" data-p="${esc(r.pl.name)}" data-k="${r.k}">
   <div class="who">${badge(r.pl.team)}<span>${esc(r.pl.name)} <small>${r.pl.pos} · vs ${r.opp}</small>${typeof INJ_P!=="undefined"&&INJ_P[r.pl.name]?` <small style="color:${injColor(INJ_P[r.pl.name].s)}">⚠ ${INJ_P[r.pl.name].s}</small>`:""}</span></div>
   <div class="bet n">${td?"Anytime TD":MARKETS[r.k].n+" "+r.line}</div>${typeof nflVerdict!=="undefined"&&realProp(r.pl.name,r.k)?nflVerdict(r.pl.name,r.k):""}
   ${lineTag(r)}${oddsRow(r)}${propMoveTxt(r.pl.name,r.k)}${trackRow(r)}
   ${usageLine(r.pl.name)}${r.k==="anyTD"?rzLine(r.pl.name):""}<div class="facts">${Number.isFinite(r.avg)?`<span>Season average: <b>${fmt(r.avg,MARKETS[r.k].cnt?1:0)}</b></span>`:""}<span class="small">${defRankTxt(r.dv,r.opp,r.pl.pos)}</span></div>
   ${r.ssn.n?`<div class="small" style="margin-bottom:-4px">${td?"Scored a TD":"Went over "+r.line} (${CUR}):</div><div class="hr">${hrBox("L3",r.l3)}${hrBox("L5",r.l5)}${hrBox("Season",r.ssn)}</div>`:`<div class="small" style="background:var(--card2);border-radius:8px;padding:8px">No games logged yet this season.</div>`}${typeof xaPanel!=="undefined"?xaPanel("nfl",r.pl.name,r.k,r.k==="anyTD"?.5:r.line,"o"):""}</div>`}
function bindProps(scope){scope.querySelectorAll("[data-p]").forEach(el=>el.onclick=()=>{S.prop={player:el.dataset.p,market:el.dataset.k,open:true};if(location.hash==="#props")viewProps();else location.hash="props"})}
/* ---------- NFL best props: every real line, both sides, ranked (same method as NBA) ---------- */
const NFL_BE=0.524; /* break-even at the standard -110 when a book's price isn't listed */
function nflImpl(o){return o==null?null:o>0?100/(o+100):-o/(-o+100)}
function nflEval(name,k,side){
  const pl=(typeof PINFO!=="undefined"&&PINFO[name])||allPlayers().find(p=>p.name===name);if(!pl||!MARKETS[k])return null;
  const o=oppOf(pl.team);if(!o||nflStarted(o.g))return null;
  if(typeof OUT!=="undefined"&&OUT[name])return null;if(typeof injSidelined!=="undefined"&&injSidelined(name))return null;
  const rp=realProp(name,k);if(!rp)return null;const line=rp[0],odds=side==="o"?rp[1]:rp[2];
  if(k==="anyTD"&&side==="u")return null;
  const L=pLogs(name),cur=L.filter(l=>l.season===CUR).filter(l=>Number.isFinite(stat(l,k))),vs=L.filter(l=>l.opp===o.opp&&Number.isFinite(stat(l,k)));
  if(cur.length<3)return null;
  const hit=a=>a.filter(l=>side==="o"?stat(l,k)>line:stat(l,k)<line).length;
  const l5=cur.slice(-5),r5=hit(l5)/l5.length,rS=hit(cur)/cur.length,rH=vs.length>=2?hit(vs)/vs.length:rS;
  let sc=.45*r5+.35*rS+.2*rH;
  const dv=dvpFor(o.opp,pl.pos,k).rank;let dvOk=null;
  if(Number.isFinite(dv)){const easy=dv<=8,hard=dv>=25;dvOk=side==="o"?(easy?1:hard?-1:0):(hard?1:easy?-1:0);sc+=.05*dvOk}
  sc=Math.max(0,Math.min(.97,sc));
  const be=odds!=null?nflImpl(odds):NFL_BE;
  return {name,k,side,line,odds,book:rp[3],pl,opp:o.opp,home:o.home,g:o.g,sc,be,edge:sc-be,dvOk,dv,
    c3:[hit(cur.slice(-3)),cur.slice(-3).length],c5:[hit(l5),l5.length],c10:(()=>{const a=L.filter(l=>Number.isFinite(stat(l,k))).slice(-10);return [hit(a),a.length]})(),cS:[hit(cur),cur.length],cH:[hit(vs),vs.length]};
}
let NFL_BEST_C=null;
function nflBest(){
  const ck=(typeof startedKey!=="undefined"?startedKey():"")+"|"+Object.keys(REAL_PROPS).length;if(NFL_BEST_C&&NFL_BEST_C.k===ck)return NFL_BEST_C.L;
  const out=[];
  for(const key of Object.keys(REAL_PROPS)){const [name,k]=key.split("|");for(const side of ["o","u"]){const e=nflEval(name,k,side);if(e&&e.edge>0)out.push(e)}}
  const seen=new Set(),per={},top=[],rest=[];
  for(const x of out.sort((a,b)=>b.edge-a.edge)){const key=x.name+"|"+x.k;if(seen.has(key))continue;seen.add(key);per[x.name]=(per[x.name]||0)+1;(per[x.name]<=2?top:rest).push(x)}
  const L=top.concat(rest);NFL_BEST_C={k:ck,L};return L;
}
function nflBestRow(b,i){const td=b.k==="anyTD";
  return xPropRow({i,attrs:`data-nflp="${esc(b.name)}" data-k="${b.k}"`,badge:badge(b.pl.team),name:esc(b.name),sub:`${b.pl.pos} · ${b.home?"vs":"@"} ${b.opp}`,
    chips:(b.c5[1]>=5&&b.c5[0]>=4?`<span class="bfire">🔥 ${b.c5[0]}/${b.c5[1]}</span>`:"")+(typeof xaChips!=="undefined"?xaChips("nfl",b.name,b.k,b.side):""),pick:td?"Anytime TD":`${b.side==="o"?"Over":"Under"} ${b.line} ${MARKETS[b.k].n}`,
    odds:b.odds!=null?amTxt(b.odds):"odds not listed",book:b.book?esc(b.book):"",l10:b.c10&&b.c10[1]?b.c10:b.c5,
    hits:[[b.cS[0],b.cS[1],"this season"],b.cH[1]&&[b.cH[0],b.cH[1],"vs "+b.opp]],why:b.dvOk===1?"matchup helps":b.dvOk===-1?"tough matchup":"",
    chance:Math.round(b.sc*100),need:Math.round(b.be*100)})}
let NFL_BF={g:"",m:"",s:"",pos:"",min:"",hot:""};
function nflTopHtml(){
  const L0=nflBest(),f=NFL_BF,L=L0.filter(b=>(!f.g||String(b.g.id)===f.g)&&(!f.m||b.k===f.m)&&(!f.s||b.side===f.s)&&(!f.pos||b.pl.pos===f.pos)&&(!f.min||b.sc>=f.min/100)&&(typeof hotOk==="undefined"||hotOk(b,f.hot)));
  const games=[...new Map(L0.map(b=>[b.g.id,b.g])).values()],mks=[...new Set(L0.map(b=>b.k))];
  const fil=`<div class="bfil"><select data-nbf="g"><option value="">All games</option>${games.map(g=>`<option value="${g.id}"${f.g==String(g.id)?" selected":""}>${g.away} @ ${g.home}</option>`).join("")}</select>
   <select data-nbf="m"><option value="">All markets</option>${mks.map(m=>`<option value="${m}"${f.m===m?" selected":""}>${MARKETS[m].n}</option>`).join("")}</select>
   <select data-nbf="pos"><option value="">All positions</option>${["QB","RB","WR","TE"].map(p=>`<option${f.pos===p?" selected":""}>${p}</option>`).join("")}</select>
   <select data-nbf="s"><option value="">Overs & unders</option><option value="o"${f.s==="o"?" selected":""}>Overs only</option><option value="u"${f.s==="u"?" selected":""}>Unders only</option></select>
   <select data-nbf="min"><option value="">Any chance</option>${[60,70,80].map(v=>`<option value="${v}"${f.min==v?" selected":""}>${v}%+ our chance</option>`).join("")}</select>
   ${typeof hotSelect!=="undefined"?hotSelect('data-nbf="hot"',f.hot):""}${typeof xResetChip!=="undefined"?xResetChip("nfl"):""}</div>`;
  const closed=SLATE.filter(g=>!g.final&&nflStarted(g)).length;
  return `<div class="card bpc"><h2 style="margin-bottom:2px">🔥 Best props this week</h2>${closed?`<div class="small" style="margin-bottom:4px">🔒 ${closed} game${closed>1?"s have":" has"} kicked off — those props are hidden.</div>`:""}
   <div class="small" style="margin-bottom:8px">Every real book line we found, over and under, ranked by how often it would have hit (last 5 games 45%, ${CUR} season 35%, vs this opponent 20%, ±5 for the defense's rank vs his position) compared with what the odds need. Where a book's price isn't listed we compare to the standard −110 break-even (52%). Tap one for his full page.</div>
   ${fil}${L.length?L.map(nflBestRow).join(""):`<div class="small">${L0.length?"Nothing matches these filters.":"No line shows an edge right now."}</div>`}
   <div class="small" style="margin-top:8px">Leans from past results, not guarantees. NFL samples are small (one game a week) — bet small.</div></div>`;
}
/* player page: every real line for him with his last 6 games, green = over, red = under */
function nflLinesBlock(pl,head){
  const o=oppOf(pl.team);if(o&&nflStarted(o.g))return `<div class="info" style="margin:12px 0"><span>🔒 His game has kicked off — this week's pregame lines are closed.</span></div>`;
  const MK=marketsFor(pl.pos).filter(m=>realProp(pl.name,m));if(!MK.length)return "";
  const L=pLogs(pl.name).filter(l=>l.season===CUR);
  return `<div class="card plines" style="margin:12px 0">${head||`<h2 style="margin-bottom:2px">His lines this week</h2>
   <div class="small" style="margin-bottom:8px">Last 6 games, newest on the right: <span class="lc o">green</span> = went over, <span class="lc u">red</span> = went under. Tap a line for its full chart.</div>`}
   ${MK.map(m=>{let rp=realProp(pl.name,m);const main=rp[0],td=m==="anyTD",alt=!td&&typeof loAltOdds!=="undefined"?loAltOdds(pl.name,m):null;if(alt)rp=[alt.line,alt.o,alt.u,alt.ob||alt.ub||""];const line=rp[0];const G=L.filter(l=>Number.isFinite(stat(l,m))).slice(-6),vals=G.map(l=>stat(l,m)),ov=vals.filter(v=>v>line).length;
     const lean=G.length?(ov/G.length>=.67?["o",td?"Scores often":"Leans over"]:ov/G.length<=.33?["u",td?"Rarely scores":"Leans under"]:["n","Split"]):["n",""];
     return `<div class="pl" data-m="${m}"><div class="plh"><div><b>${MARKETS[m].n}</b> ${td?"":`<span class="plv">${line}</span>${typeof loStep!=="undefined"?loStep(pl.name,m,main):""}`}${typeof loMoveTag!=="undefined"?loMoveTag(pl.name,m,line):""}</div>
       <div class="small">${rp[1]!=null?(td?"Yes ":"O ")+amTxt(rp[1]):""}${rp[2]!=null?" · U "+amTxt(rp[2]):""}${rp[1]==null&&rp[2]==null?"odds not listed":""}${rp[3]?" · "+esc(rp[3]):""}</div></div>${!alt&&typeof nflVerdict!=="undefined"?nflVerdict(pl.name,m,1):""} ${!alt&&typeof actBtn!=="undefined"?(()=>{const o=specProp(pl.name,m,"over"),u=specProp(pl.name,m,"under");return `<div class="obrow">${o.odds!=null?actBtn(o,`${td?"Yes":"Over "+line} <b>${oddsFmt(o.odds)}</b>`,"ov"):""}${!td&&u.odds!=null?actBtn(u,`Under ${line} <b>${oddsFmt(u.odds)}</b>`,"un"):""}${snapBtn("nfl",pl.name,m)}</div>`})():""}
       ${(()=>{const A=pLogs(pl.name).filter(l=>Number.isFinite(stat(l,m))).slice(-10);if(!A.length||!Number.isFinite(line)||typeof nbaMiniBars==="undefined")return "";const v=A.map(l=>stat(l,m)),o=v.filter(x=>pxHit(x,line)).length;return `<div class="mbw">${nbaMiniBars(v,line,A.map(l=>(l.season!==CUR?"'"+String(l.season).slice(2):"")+(l.home?"":"@")+l.opp))}<div class="small mbs">Last ${A.length}: <b class="${o/A.length>=.5?"up":"dn"}">${o}/${A.length} ${td?(PXSIDE==="u"?"without a TD":"with a TD"):pxSW()}</b> · avg <b>${(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)}</b>${td?"":` vs line ${line}`}</div></div>`})()}
       ${!td&&typeof loAltHtml!=="undefined"?loAltHtml(pl.name,m,main,pLogs(pl.name).filter(l=>Number.isFinite(stat(l,m))).slice(-10).map(l=>stat(l,m))):""}
       ${G.length?`<div class="plg">${G.map((l,i)=>{const v=vals[i],c=v>line?"o":v<line?"u":"p";return `<div class="lc ${c}" title="Week ${l.week} ${l.home?"vs":"@"} ${l.opp}"><b>${v}</b><span>${l.home?"":"@"}${l.opp}</span></div>`}).join("")}</div>
       <div class="plf"><b class="${ov/G.length>=.5?"up":"dn"}">${ov}/${G.length} ${td?"with a TD":"over"}</b>${lean[1]?` <span class="pll ${lean[0]}">${lean[1]}</span>`:""}</div>`:`<div class="small" style="margin-top:6px">No ${CUR} games logged yet.</div>`}</div>`}).join("")}</div>`;
}
let propFilter={pos:"all",tab:"top",sort:"game",dir:"asc",n:30};
function viewProps(){
  if(S.prop&&S.prop.open)return viewPlayer();
  const closed=SLATE.filter(g=>!g.final&&nflStarted(g));
  const all=[];SLATE.filter(g=>!g.final&&!nflStarted(g)).forEach(g=>all.push(...propRows(playersOf(g.away),g.home),...propRows(playersOf(g.home),g.away)));
  const seg=(key,opts)=>`<div class="seg">${opts.map(([v,n])=>`<button data-f="${key}" data-v="${v}" class="${propFilter[key]===v?"on":""}">${n}</button>`).join("")}</div>`;
  let body;
  if(propFilter.tab==="best"){
    const rows=all.filter(r=>propFilter.pos==="all"||r.pl.pos===propFilter.pos);
    const key={game:r=>r.gi*1000+POS.indexOf(r.pl.pos)*100+(r.k==="anyTD"?50:0),name:r=>r.pl.name,ssn:r=>r.ssn.o,l5:r=>r.l5.o,l3:r=>r.l3.o,line:r=>r.line}[propFilter.sort];
    const d=propFilter.dir==="desc"?-1:1;const sorted=rows.sort((a,b)=>{const x=key(a),y=key(b);if(typeof x==="string")return x.localeCompare(y)*d;if(!Number.isFinite(x))return 1;if(!Number.isFinite(y))return -1;return (x-y)*d});
    body=`<div class="row" style="margin-bottom:12px">${seg("pos",[["all","All"],["QB","QB"],["RB","RB"],["WR","WR"],["TE","TE"]])}</div>
    <div class="row" style="margin-bottom:16px"><label class="f" style="flex-direction:row;align-items:center;gap:8px">Sort by <select id="sortBy">${[["game","Game"],["name","Player name"],["ssn","Season hit rate"],["l5","L5 hit rate"],["l3","L3 hit rate"],["line","Line"]].map(([v,n])=>`<option value="${v}" ${propFilter.sort===v?"selected":""}>${n}</option>`).join("")}</select></label>
     ${seg("dir",[["asc","Low → High"],["desc","High → Low"]])}<span class="sp"></span>${closed.length?`<div class="small" style="width:100%">🔒 Props hidden for ${closed.length} game${closed.length>1?"s":""} that already kicked off — pregame lines are closed.</div>`:""}<span class="small">${sorted.length} props with a public book line · hit rate = how often he went <b>over</b> the line</span></div>
    <div class="card bpc" style="padding:6px 12px">${sorted.slice(0,propFilter.n).map(propRowLite).join("")}</div>
    ${sorted.length>propFilter.n?`<div style="text-align:center;margin-top:16px"><button class="btn" id="more">Show more</button></div>`:""}`;
  }else if(propFilter.tab==="top")body=nflTopHtml();
  else body=defenseHtml();
  const P=allPlayers().sort((a,b)=>a.team.localeCompare(b.team)||POS.indexOf(a.pos)-POS.indexOf(b.pos));
  $("#v-props").innerHTML=`<h1>Player props</h1><p class="sub">Every player prop line we found for this week, with each player's recent games and how the defense handles his position. We don't make picks. ${srcTag("player")}</p>
   <div class="row" style="margin-bottom:18px">${seg("tab",[["top","🔥 Best this week"],["best","All props"],["def","Defense rankings"]])}<span class="sp"></span>
    <select id="find"><option value="">Find a player…</option>${P.map(p=>`<option value="${esc(p.name)}">${p.team} · ${esc(p.name)}</option>`).join("")}</select></div>${body}`;
  document.querySelectorAll("#v-props .seg button").forEach(b=>b.onclick=()=>{propFilter[b.dataset.f]=b.dataset.v;if(b.dataset.f!=="dir")propFilter.n=30;viewProps()});
  if($("#sortBy"))$("#sortBy").onchange=e=>{propFilter.sort=e.target.value;propFilter.dir=["ssn","l5","l3"].includes(e.target.value)?"desc":"asc";propFilter.n=30;viewProps()};
  if($("#more"))$("#more").onclick=()=>{propFilter.n+=30;viewProps()};
  $("#find").onchange=e=>{if(!e.target.value)return;const p=P.find(x=>x.name===e.target.value);S.prop={player:p.name,market:null,open:true};viewPlayer()};
  bindProps($("#v-props"));
  document.querySelectorAll("#v-props [data-nbf]").forEach(s=>s.onchange=()=>{NFL_BF[s.dataset.nbf]=s.value;const y=window.scrollY;viewProps();window.scrollTo(0,y)});
  document.querySelectorAll("#v-props [data-nflp]").forEach(el=>el.onclick=()=>{S.prop={player:el.dataset.nflp.replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"'),market:el.dataset.k,open:true};viewPlayer();const t=document.querySelector("#v-props .pmk");if(t)setTimeout(()=>t.scrollIntoView({block:"start"}),30)});
  if(propFilter.tab==="def")drawDefense();
}
let defSel={pos:"WR",k:"recYds"};
let defOnlyWeek=false;
function defenseHtml(){
  const ms=marketsFor(defSel.pos).filter(m=>m!=="rushRec"&&dvpTable(defSel.pos,m).rows.some(r=>Number.isFinite(r.avg)));if(!ms.includes(defSel.k))defSel.k=ms[0];
  const {rows,lg}=dvpTable(defSel.pos,defSel.k);const dec=MARKETS[defSel.k].cnt?1:0,unit=MARKETS[defSel.k].u;
  let s=[...rows].filter(r=>Number.isFinite(r.avg)).sort((a,b)=>a.rank-b.rank);
  if(defOnlyWeek)s=s.filter(r=>oppOf(r.team));
  const mx=Math.max(...rows.filter(r=>Number.isFinite(r.avg)).map(r=>r.avg))*1.05||1,lgPct=lg/mx*100;
  const row=r=>{const o=oppOf(r.team),d=r.avg-lg,above=d>=0,w=r.avg/mx*100;
    return `<div class="dvr">
      <div class="dvk">${r.rank}</div>
      <div class="dvt">${badge(r.team)}<div><b>${short(r.team)}</b><small>${o?`plays ${o.home?"vs":"at"} ${o.opp}`:"no game this week"}</small></div></div>
      <div class="dvb"><div class="dvtrack"><i class="${above?"up":"dn"}" style="width:${w}%"></i><span class="dvlg" style="left:${lgPct}%"></span></div></div>
      <div class="dvn"><b>${fmt(r.avg,dec)}</b><small class="${above?"up":"dn"}">${above?"+":"−"}${fmt(Math.abs(d),dec)} vs avg</small></div></div>`};
  return `<div class="card"><h2>What each defense gives up</h2>
   <p class="small" style="margin-top:-4px">Average <b>${MARKETS[defSel.k].n.toLowerCase()}</b> each defense allows to <b>${POSNAME[defSel.pos]}</b> per game this season. <b>Rank 1 = gives up the most.</b> <span class="tag real">Pro-Football-Reference</span> <span class="small">official NFL stats, through Week 7</span></p>
   <div class="row" style="margin:10px 0 8px"><div class="seg">${POS.map(p=>`<button data-dp="${p}" class="${defSel.pos===p?"on":""}">${p}</button>`).join("")}</div>
   <div class="seg">${ms.map(m=>`<button data-dk="${m}" class="${defSel.k===m?"on":""}">${MARKETS[m].n}</button>`).join("")}</div>
   <span class="sp"></span><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="dvWeek" ${defOnlyWeek?"checked":""}> Only teams playing this week</label></div>
   <div class="dvlegend"><span><i class="up"></i>Gives up more than average</span><span><i class="dn"></i>Gives up less than average</span><span><i class="lgk"></i>League average: <b>${fmt(lg,dec)} ${unit}</b></span></div>
   <div class="dvhead"><span>#</span><span>Defense</span><span>Allowed per game</span><span style="text-align:right">Avg</span></div>
   <div class="dvlist">${s.map(row).join("")}</div></div>`}
function drawDefense(){
  document.querySelectorAll("[data-dp]").forEach(b=>b.onclick=()=>{defSel.pos=b.dataset.dp;viewProps()});
  document.querySelectorAll("[data-dk]").forEach(b=>b.onclick=()=>{defSel.k=b.dataset.dk;viewProps()});
  const w=$("#dvWeek");if(w)w.onchange=()=>{defOnlyWeek=w.checked;viewProps()};
}
function playerCovHtml(pl,opp,k){
  if(!(COV_IMP&&COV_IMP.pl&&COV_IMP.pl[pl.name]))return `<div class="section card"><div class="row"><h2 style="margin:0">Man vs zone</h2><span class="sp"></span><span class="tag real">Real</span></div>
    <p class="small" style="margin:8px 0">${TEAMS[opp][0]} coverage this season:</p>${covBar(opp)}
    </div>`;
  const c=plCov(pl.name,pl.pos),qb=pl.pos==="QB",unit=qb?"passer rating":"yards per route",better=c.m>c.z?"man":"zone",f=covFit(c,opp),w=covWord(f);
  const mostly=manShare(opp)>LG_MAN+.04?"man":manShare(opp)<LG_MAN-.04?"zone":"mix";
  const runOnly=k==="rushYds"||k==="rushAtt";
  return `<div class="section card"><div class="row"><h2 style="margin:0">Man vs zone</h2><span class="sp"></span>${covTag(c.imp)}</div>
   <div class="grid g3" style="margin-top:12px">
    <div><p class="small" style="margin:0 0 6px">${short(opp)} defense plays <span class="tag real">Real</span></p>${covBar(opp)}</div>
    <div class="stat"><div class="l">${esc(pl.name)} vs man</div><div class="v">${c.m}</div><div class="s">${unit}</div></div>
    <div class="stat"><div class="l">${esc(pl.name)} vs zone</div><div class="v">${c.z}</div><div class="s">${unit}</div></div></div>
   <p style="margin:12px 0 4px">He's better against <b>${better}</b>${mostly==="mix"?`, and ${short(opp)} play a league-average mix.`:mostly===better?` — and ${short(opp)} play more ${mostly} than most teams.`:` — but ${short(opp)} play more ${mostly} than most teams.`}</p>
   <div class="covv ${w[1]}">${w[0]}${runOnly?' <span class="small">(matters less for running stats)</span>':""}</div></div>`}
function dvpSummary(t,pos){const D=DVP_RAW[pos];if(!D||!D.rows[t])return'<p class="note">Not available.</p>';
  const lab={att:"Pass att",comp:"Completions",passYds:"Pass yds",passTD:"Pass TD",int:"INT",rate:"Passer rating",rushAtt:"Rushing att",rushYds:"Rush yds",rushTD:"Rush TD",tgt:"Targets",rec:"Receptions",recYds:"Rec yds",recTD:"Rec TD"};
  return `<table><tbody>${D.cols.map((c,i)=>`<tr><td>${lab[c]||c}</td><td class="r num"><b>${D.rows[t][i]}</b></td><td class="r small">${ordinal([...Object.values(D.rows)].map(r=>r[i]).sort((a,b)=>b-a).indexOf(D.rows[t][i])+1)} most</td></tr>`).join("")}</tbody></table>`}
const STAT_LAB={passYds:"pass yds",comp:"comp",passTD:"pass TD",rushYds:"rush yds",rushAtt:"rush att",rec:"rec",recYds:"rec yds",rushRec:"rush+rec yds",anyTD:"TD"};
function lineStr(s,pos){const p=[];if(pos==="QB"){if(s.passYds!=null)p.push(`${s.comp!=null?s.comp+" cmp, ":""}${s.passYds} pass yds, ${s.passTD||0} TD`);if(s.rushYds!=null)p.push(`${s.rushYds} rush yds`)}
  else{if(s.rushAtt)p.push(`${s.rushAtt}-${s.rushYds} rush${s.rushTD?", "+s.rushTD+" TD":""}`);if(s.rec!=null)p.push(`${s.rec}-${s.recYds} rec${s.recTD?", "+s.recTD+" TD":""}`)}return p.join(" · ")}
function vsCard(pl,opp,k,line,unit){if(!opp)return "";const V=(typeof VS_LOGS!=="undefined"&&VS_LOGS[pl.name])||[];
  const ouTag=v=>!Number.isFinite(v)?'<span class="small">—</span>':v>line?'<span class="ou o">OVER</span>':v<line?'<span class="ou u">UNDER</span>':'<span class="ou p">PUSH</span>';
  if(!V.length)return `<div class="card"><h2>His career games vs ${short(opp)}</h2><p class="note">No past games found for ${esc(pl.name)} against ${TEAMS[opp][0]} this season or in past seasons on file.</p></div>`;
  const vals=V.map(([,,s])=>stat(Object.assign({passYds:null,comp:null,passTD:null,rushYds:null,rushAtt:null,rec:null,recYds:null},s),k)).filter(Number.isFinite),o=vals.filter(v=>v>line).length;
  return `<div class="card"><h2>His career games vs ${short(opp)}</h2>
   <p class="small" style="margin-top:-6px">${vals.length?`Went over ${line} in <b>${o} of ${vals.length}</b> · average <b>${fmt(avg(vals),MARKETS[k].cnt?1:0)}</b> ${unit}`:"This stat isn't in his logs vs this team."}</p>
   <table><tbody>${V.map(([d,h,s,po])=>{const v=stat(Object.assign({passYds:null,comp:null,passTD:null,rushYds:null,rushAtt:null,rec:null,recYds:null},s),k);return `<tr><td class="small">${d.slice(0,4)}${po?' <span class="tag">PO</span>':""}</td><td class="small">${h?"vs":"@"} ${opp}</td><td class="r num"><b>${Number.isFinite(v)?v:"—"}</b></td><td class="r">${ouTag(v)}</td></tr>`}).join("")}</tbody></table></div>`}
const fmtD=d=>{const [y,m,dd]=d.split("-");return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]+" "+(+dd)};
function posgHtml(opp,pos,k){const G=((typeof POSG!=="undefined"&&POSG[opp]&&POSG[opp][pos])||[]).map(([w,t,s])=>({lab:"Wk "+w,t,s,old:0}))
   .concat(((typeof POSG25!=="undefined"&&POSG25[opp]&&POSG25[opp][pos])||[]).map(([d,t,s])=>({lab:fmtD(d),t,s,old:1})));if(!G.length)return "";
  const pw={QB:"quarterbacks",RB:"running backs",WR:"wide receivers",TE:"tight ends"}[pos];let sep=false;
  return `<h3 style="margin-top:16px">All ${pw} combined, each game</h3><div style="max-height:300px;overflow:auto"><table><tbody>${G.map(r=>{const h=r.old&&!sep?(sep=true,`<tr><td colspan="3" class="small" style="padding-top:10px"><b>2025 season</b></td></tr>`):"";return h+`<tr><td class="small">${r.lab}</td><td>${badge(r.t)} ${short(r.t)}</td><td class="small">${lineStr(r.s,pos)}</td></tr>`}).join("")}</tbody></table></div>`}
function pfrStrip(t,pos){const D=typeof PFR_DVP!=="undefined"&&PFR_DVP[pos];if(!D||!D.rows[t])return "";const r=D.rows[t],g=r[D.cols.indexOf("G")];
  const v=c=>r[D.cols.indexOf(c)];const rk=c=>{const i=D.cols.indexOf(c);const pg=x=>x[i]/x[0];return ordinal(Object.values(D.rows).map(pg).sort((a,b)=>b-a).indexOf(r[i]/g)+1)};
  const items=pos==="QB"?[["Pass yds","passYds"],["Pass TD","passTD"],["INT","int"],["QB rush yds","rushYds"]]:pos==="RB"?[["Rush yds","rushYds"],["Rush TD","rushTD"],["Receptions","rec"],["Rec yds","recYds"]]:[["Targets","tgt"],["Receptions","rec"],["Rec yds","recYds"],["Rec TD","recTD"]];
  return `<div class="small" style="margin:-4px 0 6px"><b>Season totals allowed to ${POSNAME[pos]}</b> · ${g} games · <span class="tag real">Pro-Football-Reference</span></div>
  <div class="statgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">${items.map(([l,c])=>`<div class="stat"><div class="small">${l}</div><div class="num" style="font-size:1.25em"><b>${v(c)}</b></div><div class="small">${(v(c)/g).toFixed(1)} per game · ${rk(c)} most</div></div>`).join("")}</div>`}
function posvRows(opp,pos){const out=[],seen=new Set();
  ((typeof POSV!=="undefined"&&POSV[opp]&&POSV[opp][pos])||[]).forEach(([w,t,n,s])=>{seen.add(n+"|"+w);out.push({w,t,n,s})});
  S.playerLogs.filter(l=>l.opp===opp&&l.pos===pos&&l.season===CUR).forEach(l=>{if(seen.has(l.player+"|"+l.week))return;seen.add(l.player+"|"+l.week);out.push({w:l.week,t:l.team,n:l.player,s:l,src:"log"})});
  const tot=s=>(s.recYds||0)+(s.rushYds||0)+(s.passYds||0);
  return out.sort((a,b)=>b.w-a.w||tot(b.s)-tot(a.s))}
function posvCard(pl,opp,k,line,unit){if(!opp)return "";const R=posvRows(opp,pl.pos);
  const pw={QB:"quarterbacks",RB:"running backs",WR:"wide receivers",TE:"tight ends"}[pl.pos];const nm=short(opp)+(/s$/.test(short(opp))?"'":"'s");
  if(!R.length)return `<div class="card"><h2>${nm} games vs ${pw} (${CUR})</h2>${pfrStrip(opp,pl.pos)}<p class="note" style="margin-top:10px">No player-by-player lines vs ${TEAMS[opp][0]} loaded yet — the per-game averages above show what they allow to ${POSNAME[pl.pos]}.</p></div>`;
  const val=s=>stat(Object.assign({passYds:0,comp:0,passTD:0,rushYds:0,rushAtt:0,rushTD:0,rec:0,recYds:0,recTD:0},s),k);
  return `<div class="card"><h2>${nm} games vs ${pw} (${CUR})</h2>
   ${pfrStrip(opp,pl.pos)}<p class="small" style="margin-top:10px">Every ${pl.pos} who played ${TEAMS[opp][0]} this season, newest first.</p>
   <div style="max-height:440px;overflow:auto"><table><thead><tr><th>Week</th><th>Player</th><th>Stat line</th><th class="r">${MARKETS[k].n}</th></tr></thead><tbody>${R.map(r=>{const v=val(r.s);return `<tr><td class="small">Wk ${r.w}</td><td>${badge(r.t)} ${esc(r.n)}</td><td class="small">${lineStr(r.s,pl.pos)}</td><td class="r num"><b>${Number.isFinite(v)?v:"—"}</b></td></tr>`}).join("")}</tbody></table></div>
   <p class="note" style="margin-top:8px">Season totals: <a href="${PFR_SRC[pl.pos]}" target="_blank" rel="noopener">Pro-Football-Reference</a> (official NFL box scores, through Week 8). Game-by-game lines: StatMuse${R.some(r=>r.src==="log")?" plus ESPN/CBS player logs":""}. Some recent weeks may not be loaded yet.</p></div>`}
function qbShort(n){const w=n.split(" ").filter(x=>!/^(Jr|Sr|II|III)\.?$/.test(x));return w[w.length-1]}
function qbSplitCard(pl,k,line,CLall,QS,QM,qmode){
  const dec=MARKETS[k].cnt?1:0,unit=MARKETS[k].u;
  const part=f=>{const v=CLall.filter(f).map(l=>stat(l,k)).filter(Number.isFinite);return {n:v.length,a:v.length?fmt(avg(v),k==="anyTD"?2:dec):"—",o:v.filter(x=>x>line).length}};
  const W=part(l=>!QM.includes(l.week)),O=part(l=>QM.includes(l.week));
  const wk=a=>a.length?"Week"+(a.length>1?"s ":" ")+a.join(", "):"";
  const lbl=k==="anyTD"?"scored a TD":"went over "+line;
  return `<div class="card" style="margin-top:12px;padding:14px 18px">
   <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center"><b>🏈 Starting QB filter</b><span class="small">${esc(QS.qb)} (${pl.team} QB1)</span><span class="sp"></span>
    <div class="seg" style="margin:0">${[["all","All games"],["with","With "+qbShort(QS.qb)],["without","Without "+qbShort(QS.qb)]].map(([v,t])=>`<button data-qb="${v}" class="${qmode===v?"on":""}">${t}</button>`).join("")}</div></div>
   <div class="pgrid" style="margin-top:10px"><div><small>With ${esc(QS.qb)}</small><b>${W.a}${k==="anyTD"?"":" "+unit}</b><small>${W.n} games · ${W.o} of ${W.n} ${lbl}</small></div>
    <div><small>Without ${esc(QS.qb)}</small><b>${O.a}${k==="anyTD"?"":" "+unit}</b><small>${O.n?O.n+" games · "+O.o+" of "+O.n+" "+lbl:"no games in his log yet"}</small></div></div>
   <p class="note" style="margin:8px 0 0">${esc(QS.qb)} missed ${wk(QS.out)}${QS.sub?" ("+esc(QS.sub)+" started)":""}${QS.left&&QS.left.length?`; he left ${wk(QS.left)} early, so ${QS.left.length>1?"those count":"that counts"} as without him`:""}. <b>Week 8 status:</b> ${esc(QS.now)}.${k==="anyTD"?" Averages here are TDs per game.":""} Filter changes the averages, chart and hit rate below.</p></div>`}
function allGameRows(pl,CL,CLall,qmode,QM,k,ouTag,QA){
  const have=new Set(CLall.map(l=>l.week));const notes=(typeof LOG_NOTES!=="undefined"&&LOG_NOTES[pl.name])||{};
  const miss=teamWeeks(pl.team).filter(g=>!have.has(g.w)).filter(g=>qmode==="all"||(qmode==="with"?!QM.includes(g.w):QM.includes(g.w)));
  const rows=[...CL.map(l=>({w:l.week,l})),...miss.map(g=>({w:g.w,g}))].sort((a,b)=>b.w-a.w);
  return rows.map(r=>r.l?`<tr><td class="small">Week ${r.w}</td><td>${r.l.home?"vs":"at"} ${r.l.opp}${QA&&QM.includes(r.w)?' <span class="tag" style="background:#3a2a10;color:#fab219">no QB1</span>':""}</td><td class="r num"><b>${stat(r.l,k)}</b></td><td class="r">${ouTag(stat(r.l,k))}</td></tr>`
   :`<tr style="opacity:.6"><td class="small">Week ${r.w}</td><td>${r.g.home?"vs":"at"} ${r.g.opp}</td><td class="r small" colspan="2">${notes[r.w]?esc(notes[r.w]):"Did not play"}</td></tr>`).join("")}
function viewPlayer(){
  if(S.prop&&S._lastPl!==S.prop.player){if(typeof PXS!=="undefined")for(const key in PXS)delete PXS[key];S.prop.xt=null;S._lastPl=S.prop.player}
  const P=allPlayers();const pl=P.find(p=>p.name===S.prop.player);if(!pl){S.prop={};try{history.replaceState(null,"","#props")}catch(e){}return viewProps()}
  try{const want="#props/"+encodeURIComponent(pl.name)+(S.prop.market?"/"+S.prop.market:"");if(location.hash!==want)history.replaceState(null,"",want)}catch(e){} /* refresh keeps the player page */
  const L0=pLogs(pl.name);const MK=marketsFor(pl.pos).filter(m=>realProp(pl.name,m)||L0.length);
  if(!S.prop.market||!MK.includes(S.prop.market))S.prop.market=nflDefMk(pl,MK);
  const k=S.prop.market,o=oppOf(pl.team),opp=o?o.opp:null,L=pLogs(pl.name),main=lineFor(pl.name,k),line=typeof loLine!=="undefined"?loLine(pl.name,k,main):main,dv=opp?dvpFor(opp,pl.pos,k):{rank:NaN,avg:NaN};
  const CLall=L.filter(l=>l.season===CUR);const QA=qb1Applies(pl,k),QS=QA?QB1_STATUS[pl.team]:null,QM=QA?qb1Miss(pl.team):[];
  const qmode=QA?(S.prop.qb||"all"):"all";
  const CL=qmode==="with"?CLall.filter(l=>!QM.includes(l.week)):qmode==="without"?CLall.filter(l=>QM.includes(l.week)):CLall,l10=CL.slice(-10).filter(l=>Number.isFinite(stat(l,k))),v10=l10.map(l=>stat(l,k)),ov=v10.filter(v=>v>line).length;
  const sv=CL.map(l=>stat(l,k)).filter(Number.isFinite);
  const H=opp?L.filter(l=>l.opp===opp):[];const unit=MARKETS[k].u;const dec=MARKETS[k].cnt?1:0;
  const lgv=k==="rushRec"?dvpTable(pl.pos,"rushYds").lg+dvpTable(pl.pos,"recYds").lg:dvpTable(pl.pos,k).lg;
  const defWord=!Number.isFinite(dv.rank)?"":`the ${ordinal(dv.rank)} most in the NFL`;
  const sim=opp?S.playerLogs.filter(l=>l.opp===opp&&l.pos===pl.pos&&l.season===CUR).sort((a,b)=>b.week-a.week).slice(0,8):[];
  const ouTag=v=>v>line?'<span class="ou o">OVER</span>':v<line?'<span class="ou u">UNDER</span>':'<span class="ou p">PUSH</span>';
  $("#v-props").innerHTML=`<a class="btn" href="#props" id="back">← All props</a>
   <div class="row" style="margin:16px 0 6px">${badge(pl.team)}<h1 style="margin:0">${esc(pl.name)}</h1>${typeof INJ_P!=="undefined"&&INJ_P[pl.name]?injTag(pl.name):(typeof QUESTIONABLE!=="undefined"&&QUESTIONABLE[pl.name]?`<span class="tag" style="background:#3a2a10;color:#fab219">⚠ ${QUESTIONABLE[pl.name]}</span>`:"")}</div>
   <div class="pline">${(()=>{const U=(typeof USAGE_RAW!=="undefined"&&USAGE_RAW[pl.name])||null,su=U&&U.s;return [pl.pos+" · "+short(pl.team),o?`${o.home?"vs":"@"} ${short(opp)} · ${o.g.when}`:"No game this week",su&&su.snap!=null?su.snap+"% snaps":"",su&&su.tpg?fmt(su.tpg,1)+" targets/game":"",su&&su.cpg&&pl.pos!=="WR"&&pl.pos!=="TE"?fmt(su.cpg,1)+" carries/game":""].filter(Boolean).map(x=>`<span>${x}</span>`).join("")})()}</div>
   <div class="qbrow">${typeof nflQbChip!=="undefined"?nflQbChip(pl)+nflWxChip(pl)+(typeof nfRushChip!=="undefined"?nfRushChip(pl):""):""}</div>${typeof nflUseBars!=="undefined"?nflUseBars(pl):""}
   ${o&&nflStarted(o.g)?`<div class="info" style="margin:12px 0"><span>🔒 His game has kicked off — this week's pregame lines are closed.</span></div>`:""}
   ${opp?`<div class="card" style="margin-top:12px;padding:12px">${nflAllowTiles(opp,pl.pos,k)}</div>`:""}
   <h2 class="noglo" style="margin:16px 0 10px">Prop charts · this week</h2>
   <div class="nbtabs pmk">${[...MK].sort((a,b)=>(realProp(pl.name,b)?1:0)-(realProp(pl.name,a)?1:0)).map(m=>{const rl=realProp(pl.name,m);return `<button data-m="${m}" class="${m===k?"on":""}">${({passYds:"Pass yds",comp:"Comp",passTD:"Pass TD",int:"INT",passAtt:"Pass att",rushYds:"Rush yds",rushAtt:"Rush att",rec:"Rec",recYds:"Rec yds",rushRec:"Rush+Rec",anyTD:"TD"})[m]||MARKETS[m].n}<small>${m==="anyTD"?(rl?amTxt(rl[1]):"—"):rl?rl[0]:"avg "+fmt(lineFor(pl.name,m),0)}</small></button>`}).join("")}</div>
   <div class="small swh">👆 Swipe the chart left or right for the next prop</div>
   ${(()=>{const rp=realProp(pl.name,k);return rp&&k!=="anyTD"&&typeof loAltHtml!=="undefined"&&!(o&&nflStarted(o.g))?loAltHtml(pl.name,k,rp[0],CL.filter(l=>Number.isFinite(stat(l,k))).slice(-10).map(l=>stat(l,k))):""})()}
   <div class="section">${typeof nflPropFilterCard!=="undefined"?nflPropFilterCard(pl,k,line,CL):""}</div>
   ${QA?qbSplitCard(pl,k,line,CLall,QS,QM,qmode):""}
   <div class="section">
    ${v10.length?"":`<div class="card"><h2>Game log</h2><p class="note">No game log loaded for ${esc(pl.name)} yet.</p></div>`}</div>
   ${nflExtrasCard(pl,k,line,CL,CLall,opp,unit,qmode,QM,ouTag,QA)}
   ${typeof xaTrendsCard!=="undefined"?xaTrendsCard("nfl",pl.name):""}`;
  $("#back").onclick=e=>{e.preventDefault();S.prop.open=false;try{history.replaceState(null,"","#props")}catch(x){}viewProps()};
  {const px=$("#pxNfl");if(px&&typeof pxFilterWire!=="undefined")pxFilterWire(px)}
  if(typeof pxSwipe!=="undefined")pxSwipe($("#pxNfl"),"#v-props [data-m]");
  if(typeof pxRecentAdd!=="undefined")pxRecentAdd("nfl",pl.name,k);
  document.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{const y=window.scrollY;S.prop.market=b.dataset.m;viewPlayer();window.scrollTo(0,y)});
  document.querySelectorAll("[data-qb]").forEach(b=>b.onclick=()=>{S.prop.qb=b.dataset.qb;viewPlayer()});
  $("#lineIn").onchange=e=>{S.lines[pl.name+"|"+k]=e.target.value;saveUser();viewPlayer()};
  const labels=l10.map(l=>"Wk "+l.week+" "+(l.home?"vs ":"@")+l.opp);if(!v10.length){window.scrollTo(0,0);return}
  if($("#cLog"))mk("cLog",{type:"bar",data:{labels,datasets:[
    {type:"line",label:"Line",data:labels.map(()=>line),borderColor:"#fab219",borderWidth:2,borderDash:[6,4],pointRadius:0},
    {label:MARKETS[k].n,data:v10,backgroundColor:v10.map(v=>v>line?"#22c55e":v<line?"#f05252":"#5b6170"),borderRadius:4,maxBarThickness:36}]},options:baseOpts()});
  window.scrollTo(0,0);
}

/* ---------- Predictions ---------- */
function viewPublic(){
  const G=SLATE.filter(g=>!g.final);
  const row=g=>{const x=projScore(g),L=LINES[g.id];const fav=L.sp<0?g.home:g.away;
    const aw=x.win===g.away?x.winP:100-x.winP;
    return `<div class="card prow" data-g="${g.id}" style="cursor:pointer">
     <div class="when"><span>${g.when}${g.tv?" · "+g.tv:""}</span></div>
     <div class="pscore"><div class="pt ${x.win===g.away?"w":""}">${badge(g.away)}<span class="pn">${short(g.away)}</span><b>${x.a}</b></div><span class="small">@</span><div class="pt ${x.win===g.home?"w":""}"><b>${x.h}</b><span class="pn">${short(g.home)}</span>${badge(g.home)}</div></div>
     <div class="bar2" style="margin-top:10px"><div style="width:${aw}%;background:var(--away)"></div><div style="width:${100-aw}%;background:var(--home)"></div></div>
     <div class="winlab"><span>${short(g.away)} ${aw}% to win</span><span>${short(g.home)} ${100-aw}%</span></div>
     <div class="pgrid"><div><small>Projected margin</small><b>${short(x.win)} by ${x.margin}</b><small>Line: ${short(fav)} −${Math.abs(L.sp)}</small></div><div><small>Projected total</small><b>${x.total}</b><small>Line: ${L.tot}</small></div></div></div>`};
  $("#v-public").innerHTML=`<h1>Predictions</h1><p class="sub">Projected final score for every Week ${PLAYS_WEEK} game. Tap a game for the full matchup.</p>
   <div class="grid g2">${G.map(row).join("")}</div>
   <p class="note" style="margin-top:12px">${PROJ_NOTE}</p>`;
  document.querySelectorAll(".prow").forEach(r=>r.onclick=()=>location.hash="game-"+r.dataset.g);
}

/* ---------- Coverage import ---------- */
function covImportUI(){
  const d=document.createElement("div");d.className="card";d.style.marginTop="14px";
  d.innerHTML=`<div class="row"><h2 style="margin:0">Man vs zone splits</h2><span class="sp"></span>${COV_IMP?'<span class="tag imp">Imported</span>':'<span class="tag real">Defense rates real</span>'}</div>
   <p class="note">Defense coverage rates are already real. Paste offense and player splits here (e.g. from PFF, FTN or Fantasy Points). Columns: <span style="font-family:monospace">type,name,vs_man,vs_zone</span>. type = <b>team</b> (name = team code, offense yards per pass attempt), <b>defense</b> (team code, yards per attempt allowed) or <b>player</b> (name exactly as in your player logs; QB = passer rating, others = yards per route run).</p>
   <textarea id="cTxt" placeholder="type,name,vs_man,vs_zone\nteam,BUF,6.1,7.4\ndefense,CHI,6.8,6.2\nplayer,DJ Moore,2.3,1.6"></textarea>
   <div class="row" style="margin-top:8px"><button class="btn pri" id="cImp">Import splits</button><button class="btn" id="cRes">Back to sample</button></div>`;
  $("#v-data").appendChild(d);
  $("#cImp").onclick=()=>{try{const L=$("#cTxt").value.trim().split(/\r?\n/);L.shift();const o={off:{},pl:{},def:{}};
    L.forEach(l=>{const [t,n,m,z]=l.split(",").map(x=>x.trim());if(!n)return;if(t==="team")o.off[n.toUpperCase()]=[+m,+z];else if(t==="defense")o.def[n.toUpperCase()]=[+m,+z];else o.pl[n]=[+m,+z]});
    COV_IMP=o;LS.set("covImp",o);toast(Object.keys(o.off).length+" teams, "+Object.keys(o.pl).length+" players imported");route()}catch(e){toast("Couldn't read that: "+e.message)}};
  $("#cRes").onclick=()=>{COV_IMP=null;LS.set("covImp",null);route()};
}


/* ---------- Scores ---------- */
function viewWeeks(){
  const lastFinal=Math.max(...RESULTS.map(r=>r[0])),wkNow=(typeof PLAYS_WEEK!=="undefined"&&PLAYS_WEEK)||lastFinal;
  /* "(now)" stays on the older week while one of its games (Monday night) is still to be played */
  const pend=typeof SLATE!=="undefined"?SLATE.filter(g=>g.wk&&g.wk<wkNow&&!nflDone(g)).map(g=>g.wk):[];
  const cur=pend.length?Math.min(...pend):wkNow,maxW=Math.max(lastFinal,wkNow);
  if(!S.wk)S.wk={w:cur};
  const W=S.wk,w=W.w;
  const G=RESULTS.filter(r=>r[0]===w).map(([wk,a,ap,h,hp])=>({a,ap,h,hp,final:true}));
  const has=(a,h)=>G.some(x=>x.a===a&&x.h===h);
  /* this week's slate belongs to the current week only (it used to be glued onto the last week with finals) */
  if(typeof SLATE!=="undefined")SLATE.filter(g=>!g.final&&(g.wk||wkNow)===w&&!has(g.away,g.home)).forEach(g=>G.push({a:g.away,h:g.home,when:g.when,final:false}));
  /* games of week w not played yet (e.g. last week's Monday night game) from the schedule */
  if(typeof NFL_NEXT!=="undefined")for(const [t,L] of Object.entries(NFL_NEXT))for(const [wk,d,op,ha,tm] of L)if(wk===w&&ha==="H"&&!has(op,t)){
    let ts="";if(tm){let [hh,mm]=tm.split(":").map(Number);const ap=hh>=12?"PM":"AM";hh=hh%12||12;ts=` · ${hh}:${String(mm).padStart(2,"0")} ${ap}`}
    G.push({a:op,h:t,when:new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+ts,final:false})}
  const playing=new Set(G.flatMap(g=>[g.a,g.h]));const bye=Object.keys(TEAMS).filter(t=>!playing.has(t)).sort();
  const box=g=>{const aw=g.final&&g.ap>g.hp,hw=g.final&&g.hp>g.ap,key=g.a+"|"+g.h;
    return `<div class="sbox ${g.final?"click":""} ${W.sel===key?"sel":""}" ${g.final?`data-bx="${key}"`:""}><div class="st">${g.final?"Final":esc(g.when||"Upcoming")}</div>
     <div class="tr ${g.final&&!aw?"l":""}">${badge(g.a)}<span>${short(g.a)}</span><b>${g.final?g.ap:""}</b></div>
     <div class="tr ${g.final&&!hw?"l":""}">${badge(g.h)}<span>${short(g.h)}</span><b>${g.final?g.hp:""}</b></div></div>`};
  $("#v-weeks").innerHTML=`<h1>Scores</h1><p class="sub">Pick a week to see every final score from Week 1 until now.</p>
   <div class="wkbar">${Array.from({length:maxW},(_,i)=>i+1).map(i=>`<button data-w="${i}" class="${i===w?"on":""}">Week ${i}${i===cur?" (now)":i===wkNow&&cur!==wkNow?" (next)":""}</button>`).join("")}</div>
   <h2 style="margin:0 0 8px">Week ${w} ${G.some(g=>g.final)?(G.every(g=>g.final)?"scores":"scores & games left"):"games"}</h2>
   <div class="sgrid">${G.map(box).join("")}</div>
   <p class="note" style="margin-top:8px">${bye.length?`Bye: ${bye.join(", ")}. `:""}Tap a final score to see the full box score.</p>
   <div id="boxOut">${W.sel?(()=>{const [a,h]=W.sel.split("|");const gg=G.find(x=>x.a===a&&x.h===h);return gg?`<h2 style="margin:18px 0 8px">${short(a)} ${gg.ap} – ${short(h)} ${gg.hp} · Week ${w} box score</h2>`+boxScoreHtml(w,a,h):""})():""}</div>`;
  document.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{W.w=+b.dataset.w;W.sel=null;viewWeeks()});
  document.querySelectorAll("[data-bx]").forEach(b=>b.onclick=()=>{W.sel=W.sel===b.dataset.bx?null:b.dataset.bx;viewWeeks();if(W.sel){const o=document.getElementById("boxOut");if(o)o.scrollIntoView({behavior:"smooth",block:"start"})}});
}
/* ---------- Router ---------- */
function route(){
  const h=decodeURIComponent((location.hash||"#today").slice(1))||"today";
  const SHARED=["calc","record","guide","today","bets","favs"],isSoc=h.startsWith("soccer")||(SHARED.includes(h)&&LS.get("sport")==="soc"),isNhl=!isSoc&&(h.startsWith("nhl")||(SHARED.includes(h)&&LS.get("sport")==="nhl")),isNba=!isSoc&&!isNhl&&(h.startsWith("nba")||(SHARED.includes(h)&&LS.get("sport")==="nba"));
  if(h.startsWith("nba"))LS.set("sport","nba");else if(h.startsWith("nhl"))LS.set("sport","nhl");else if(h.startsWith("soccer"))LS.set("sport","soc");else if(!SHARED.includes(h))LS.set("sport","nfl");
  document.getElementById("nav").hidden=isNba||isNhl||isSoc;document.getElementById("nbaNav").hidden=!isNba;const nhN=document.getElementById("nhlNav");if(nhN)nhN.hidden=!isNhl;const scN=document.getElementById("socNav");if(scN)scN.hidden=!isSoc;
  document.querySelectorAll("#sport a").forEach(a=>a.classList.toggle("on",a.dataset.s===(isSoc?"soc":isNhl?"nhl":isNba?"nba":"nfl")));
  if(h.startsWith("soccer")&&typeof soccerRoute!=="undefined"){
    document.querySelectorAll("main>section").forEach(s=>s.classList.toggle("hide",s.id!=="v-soccer"));
    const nv=["soccer-props","soccer-table","soccer-results","soccer-cc"].find(x=>h.startsWith(x))||(h.startsWith("soccer-match")?"soccer-results":"soccer");
    document.querySelectorAll("#socNav a").forEach(a=>a.classList.toggle("on",a.dataset.v===nv));
    document.getElementById("banner").innerHTML="";soccerRoute(h);window.scrollTo(0,0);return;
  }
  if(h.startsWith("nhl")&&typeof nhlRoute!=="undefined"){
    document.querySelectorAll("main>section").forEach(s=>s.classList.toggle("hide",s.id!=="v-nhl"));
    const nv=h.startsWith("nhl-props")?"nhl-props":h.startsWith("nhl-standings")?"nhl-standings":h.startsWith("nhl-injuries")?"nhl-injuries":h.startsWith("nhl-scores")?"nhl-scores":"nhl";
    document.querySelectorAll("#nhlNav a").forEach(a=>a.classList.toggle("on",a.dataset.v===nv));
    document.getElementById("banner").innerHTML="";nhlRoute(h);window.scrollTo(0,0);return;
  }
  if(h.startsWith("nba")&&typeof nbaRoute!=="undefined"){
    document.querySelectorAll("main>section").forEach(s=>s.classList.toggle("hide",s.id!=="v-nba"));
    const nv=h.split("-").slice(0,2).join("-");
    document.querySelectorAll("#nbaNav a").forEach(a=>a.classList.toggle("on",a.dataset.v===nv||((nv==="nba-game"||nv==="nba-tomorrow")&&a.dataset.v==="nba")||(nv==="nba-player"&&a.dataset.v==="nba-players")||(nv==="nba-best"&&a.dataset.v==="nba-props")||(nv==="nba-team"&&a.dataset.v==="nba-teams")));
    document.getElementById("banner").innerHTML="";
    nbaRoute(h);window.scrollTo(0,0);return;
  }
  document.querySelectorAll("#nbaNav a").forEach(a=>a.classList.toggle("on",a.dataset.v===h));
  if(h.startsWith("props/")){const [,nm,mk]=h.split("/");if(nm&&(!S.prop||S.prop.player!==nm||!S.prop.open))S.prop={player:nm,market:mk||null,open:true};else if(S.prop&&mk)S.prop.market=mk}
  let v=h.startsWith("game-")?"game":h.startsWith("props/")?"props":h.startsWith("team-")?"nflteam":h;
  if(v==="slate")v="games";
  if(!["games","game","plays","props","public","weeks","trends","calc","injuries","bets","record","guide","standings","today","favs","nextweek","nflteam"].includes(v))v="today";
  if(v!=="props"&&S.prop)S.prop.open=false;
  document.querySelectorAll("main>section").forEach(s=>s.classList.toggle("hide",s.id!=="v-"+v));
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.v===v||((v==="game"||v==="nextweek")&&a.dataset.v==="games")||(v==="nflteam"&&a.dataset.v==="standings")));
  banner();if(typeof updateBetsBadge!=="undefined")updateBetsBadge();
  ({nflteam:()=>typeof viewNflTeam!=="undefined"&&viewNflTeam(h.slice(5)),games:viewGames,game:()=>viewGame(h.slice(5)),props:viewProps,public:viewPublic,weeks:viewWeeks,plays:viewPlays,calc:viewCalc,injuries:viewInjuries,bets:viewBets,trends:viewTrends,record:viewRecord,guide:viewGuide,standings:viewStandings,today:viewToday,favs:viewFavs,nextweek:viewNextWeek,data:()=>{viewData();covImportUI();runImportUI()}})[v]();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",route);
document.querySelectorAll("#oddsFmt button").forEach(b=>b.onclick=()=>{setOddsFmt(b.dataset.f);syncOddsBtns();route()});
function syncOddsBtns(){document.querySelectorAll("#oddsFmt button").forEach(b=>b.classList.toggle("on",b.dataset.f===ODDS_FMT))}
syncOddsBtns();if(typeof appSearchSetup!=="undefined")appSearchSetup();else if(typeof searchSetup!=="undefined")searchSetup();if(typeof uxFiltLoad!=="undefined")uxFiltLoad();route();
/* ---------- NFL: what this week's defense allows to his position, as tiles (★ = matters for this prop) ---------- */
function nflAllowTiles(t,pos,k){const D=DVP_RAW[pos];if(!D||!D.rows[t])return "";
  const lab={att:"Pass att",comp:"Completions",passYds:"Pass yds",passTD:"Pass TD",int:"INT",rate:"Passer rating",rushAtt:"Rush att",rushYds:"Rush yds",rushTD:"Rush TD",tgt:"Targets",rec:"Receptions",recYds:"Rec yds",recTD:"Rec TD"};
  const rel={passYds:["passYds","att"],comp:["comp","att"],passTD:["passTD"],int:["int"],rushYds:["rushYds"],rushAtt:["rushAtt"],rec:["rec","tgt"],recYds:["recYds"],rushRec:["rushYds","recYds"],anyTD:["rushTD","recTD"]}[k]||[];
  const N=Object.keys(D.rows).length,good=c=>c!=="int"&&c!=="rate"||c==="rate";
  const tiles=D.cols.map((c,i)=>{const v=D.rows[t][i],r=[...Object.values(D.rows)].map(x=>x[i]).sort((a,b)=>b-a).indexOf(v)+1,cl=r<=8?"g":r>=N-7?"r":"";
    return `<div class="oat ${cl}${rel.includes(c)?" rel":""}"><span class="l">${lab[c]||c}</span><b>${typeof v==="number"&&v%1?v.toFixed(1):v}</b><span class="r">${ordinal(r)} most</span></div>`}).join("");
  return `<div class="oa"><div class="oah">What ${esc(short(t))} allow to ${POSNAME[pos]} <span class="small">per game · of ${N} teams</span></div><div class="oag">${tiles}</div>
   <div class="small oan"><span class="lg g"></span> gives up a lot (good for overs) · <span class="lg r"></span> stingy${rel.length?" · ★ = matters most for this prop":""} · <span class="tag real">Pro-Football-Reference</span></div></div>`}
/* ---------- NFL: every extra in one tabbed card ---------- */
function nflExtrasCard(pl,k,line,CL,CLall,opp,unit,qmode,QM,ouTag,QA){
  const X=(typeof nflPropXCard!=="undefined"&&nflPropXCard(pl,k,line,CL))||{};
  const T=[["alt","Alt lines",X.alt],["gs","Game script",X.gs],["def","Vs defenses",X.def],
    ["tgt","Targets",typeof nfMatrixCard!=="undefined"?nfMatrixCard(pl,opp):""],["use","Usage",usageCard(pl)],["rz","Red zone",rzCard(pl)],
    ["vs",opp?"Vs "+short(opp):"",opp?posvCard(pl,opp,k,line,unit)+vsCard(pl,opp,k,line,unit):""],
    ["all","All games",`<div style="max-height:380px;overflow:auto"><table><tbody>${allGameRows(pl,CL,CLall,qmode,QM,k,ouTag,QA)}</tbody></table></div><p class="note" style="margin:8px 0 0">"Did not play" weeks (injury / inactive) aren't counted in averages or hit rates.</p>`],
    ["sch","Schedule",typeof NFL_NEXT!=="undefined"&&NFL_NEXT[pl.team]?nfNextHtml(pl.team):""]].filter(t=>t[1]&&t[2]);
  if(!T.length)return "";const cur=T.some(t=>t[0]===S.prop.xt)?S.prop.xt:T[0][0];
  return `<div class="section"><div class="card xtc nodz"><div class="nbtabs pmk xtt">${T.map(([id,l])=>`<button data-xt="${id}" class="${id===cur?"on":""}">${l}</button>`).join("")}</div>
   ${T.map(([id,,h])=>`<div class="xtp" data-xtp="${id}"${id===cur?"":" hidden"}>${h}</div>`).join("")}</div></div>`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-xt]");if(!b)return;S.prop.xt=b.dataset.xt;const c=b.closest(".xtc");c.querySelectorAll("[data-xt]").forEach(x=>x.classList.toggle("on",x===b));c.querySelectorAll("[data-xtp]").forEach(p=>p.hidden=p.dataset.xtp!==b.dataset.xt)});
</script>
</body>
</html>
