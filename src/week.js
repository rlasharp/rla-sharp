/* ---------- 📅 Week ahead: every game in the next 7 days, all sports, one list ----------
   For each game: the line where books have posted one (otherwise our own estimate, labelled as ours) and the most
   striking fun fact. Filter by sport. Plan before the lines move; tap a game for its full page. */
let WK_SP=(typeof LS!=="undefined"&&LS.get("wkSp"))||"all";
function wkET(iso){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto"}).format(new Date(iso))}
function wkDays(){const t=typeof etNow!=="undefined"?etNow().d:wkET(Date.now());const out=[];for(let i=0;i<7;i++){const d=new Date(t+"T12:00:00");d.setDate(d.getDate()+i);out.push(d.toISOString().slice(0,10))}return out}
function wkFact(F){const f=(F||[])[0];return f?`${f.icon} ${f.txt}`:""}
function wkGames(){const D=new Set(wkDays()),G=[];
  /* NBA: schedule for every day (NBA_NEXT); lines today, our model otherwise */
  try{for(const d of D){const L=typeof nbaGamesOn!=="undefined"?nbaGamesOn(d):[];const n=Math.round((Date.parse(d)-Date.parse(NBA_SLATE_DATE))/864e5);if(n<0)continue;
    for(const g of L){const full=d===NBA_SLATE_DATE?NBA_SLATE.find(x=>x.a===g.a&&x.h===g.h):null;if(full&&nbaStarted(full))continue;const Ln=d===NBA_SLATE_DATE&&NBA_LINES[g.a+"@"+g.h],M=nbaModel(g.a,g.h);
      const line=Ln?`${(Ln.sp<=0?g.h:g.a)} −${Math.abs(Ln.sp)} · O/U ${Ln.tot}`:M?`our estimate: ${(M.m>=0?g.h:g.a)} by ${Math.abs(M.m).toFixed(1)}`:"";
      G.push({sp:"nba",d,t:g.t||"",a:g.a,h:g.h,badge:nbaBadge,name:nbaShort,href:full?`#nba-game-${full.id}`:n===0?"#nba":`#nba-tomorrow${n>1?"-"+n:""}`,line,fact:wkFact(typeof fxNba!=="undefined"?fxNba(full||g):[])})}}}catch(e){}
  /* NHL: today + the next 3 days in the data */
  try{if(typeof NHL_DATE!=="undefined"&&NHL_DATE)for(const g of nhAllGames()){if(!D.has(g.d)||nhStarted(g))continue;
    const fav=g.ml?(g.ml[0]<g.ml[1]?g.a:g.h):null;const line=g.ml?`${fav} ${nhOdds(Math.min(g.ml[0],g.ml[1]))}${g.tot?" · O/U "+g.tot[0]:""}`:"";
    G.push({sp:"nhl",d:g.d,t:g.t||"",a:g.a,h:g.h,badge:nhBadge,name:nhTm,href:`#nhl-game-${g.id}`,line,fact:wkFact(typeof fxNhl!=="undefined"?fxNhl(g):[])})}}catch(e){}
  /* NFL: this week's games still to play, plus next week's schedule */
  try{for(const g of (typeof SLATE!=="undefined"?SLATE:[])){if(g.final||nflStarted(g))continue;const d=nflDate(g);if(!d||!D.has(d))continue;const L=LINES[g.id];
      G.push({sp:"nfl",d,t:String(g.when||"").split("·").pop().trim(),a:g.away,h:g.home,badge,name:short,href:`#game-${g.id}`,line:L?`${L.sp<=0?g.home:g.away} −${Math.abs(L.sp)} · O/U ${L.tot}`:"",fact:wkFact(typeof fxNfl!=="undefined"?fxNfl(g):[])})}
    if(typeof nfWeekGames!=="undefined"&&typeof PLAYS_WEEK!=="undefined")for(const x of nfWeekGames(PLAYS_WEEK+1)){if(!D.has(x.d))continue;if(G.some(y=>y.sp==="nfl"&&y.a===x.away&&y.h===x.home))continue;
      const tm=String(x.tm||"");const [hh,mm]=tm.split(":").map(Number),t=isFinite(hh)?`${(hh%12)||12}:${String(mm||0).padStart(2,"0")} ${hh>=12?"PM":"AM"}`:"";
      G.push({sp:"nfl",d:x.d,t,a:x.away,h:x.home,badge,name:short,href:"#nextweek",line:"",fact:wkFact(typeof fxNfl!=="undefined"?fxNfl({away:x.away,home:x.home,id:null}):[])})}}catch(e){}
  /* Soccer: matches in the next 7 days (our leagues) */
  try{if(window.SOC_OK)for(const f of SOC_FX||[]){if(socStarted(f))continue;const d=wkET(f.t);if(!D.has(d))continue;const O=f.odds||{},P=f.proj;
    const line=O.ml?`${socTm(f.h)} ${oddsFmt(O.ml.h)} · draw ${oddsFmt(O.ml.d)} · ${socTm(f.a)} ${oddsFmt(O.ml.a)}`:P&&P.p?`our estimate: ${socTm(f.h)} ${Math.round(P.p[0]*100)}% · draw ${Math.round(P.p[1]*100)}% · ${socTm(f.a)} ${Math.round(P.p[2]*100)}%`:"";
    G.push({sp:"soc",d,t:new Date(f.t).toLocaleTimeString("en-US",{timeZone:"America/Toronto",hour:"numeric",minute:"2-digit"}),a:f.a,h:f.h,badge:id=>socBadge(id),name:socTm,href:`#soccer-game-${f.id}`,line,fact:wkFact(typeof fxSoc!=="undefined"?fxSoc(f):[]),lg:f.c})}}catch(e){}
  const tv=t=>{const m=String(t).match(/(\d+):(\d+)\s*(AM|PM)/i);return m?((+m[1]%12)+(m[3].toUpperCase()==="PM"?12:0))*60+(+m[2]):9999};
  return G.sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:tv(x.t)-tv(y.t))}
function viewWeek(){const el=document.getElementById("v-week");if(!el)return;
  /* NHL and soccer data load on demand: draw now, redraw when they arrive */
  if(typeof nhlEnsure!=="undefined"&&!(typeof NHL_DATE!=="undefined"&&NHL_DATE))nhlEnsure(()=>{if(location.hash==="#week")viewWeek()});
  if(typeof socEnsure!=="undefined"&&!window.SOC_OK)socEnsure(()=>{if(location.hash==="#week")viewWeek()});
  const all=wkGames(),G=all.filter(g=>WK_SP==="all"||g.sp===WK_SP),ic={nba:"🏀",nhl:"🏒",nfl:"🏈",soc:"⚽"},cnt=sp=>all.filter(g=>g.sp===sp).length;
  const days=[...new Set(G.map(g=>g.d))];
  el.innerHTML=`<h1>📅 Week ahead</h1><p class="sub">Every game in the next 7 days. Lines where books have posted them, otherwise our own estimate (labelled). The top fun fact for each game — tap a game for everything else.</p>
   <div class="seg ttabs" style="margin-bottom:12px">${[["all","All "+all.length],["nba","🏀 NBA "+cnt("nba")],["nhl","🏒 NHL "+cnt("nhl")],["nfl","🏈 NFL "+cnt("nfl")],["soc","⚽ Soccer "+cnt("soc")]].map(([k,l])=>`<button class="btn${WK_SP===k?" on":""}" data-wk="${k}">${l}</button>`).join("")}</div>
   ${days.map(d=>`<h2 class="wkd">${new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} <span class="small">${G.filter(g=>g.d===d).length} games</span></h2>
     <div class="card" style="padding:4px 14px">${G.filter(g=>g.d===d).map(g=>`<a class="wkr" href="${g.href}"><div class="wkt"><span>${ic[g.sp]}</span><span class="small">${(g.t||"").replace(/ ET$/,"")}</span></div>
       <div class="wkm"><div class="wkteams">${g.badge(g.a)} <span class="small">@</span> ${g.badge(g.h)} <b>${typeof esc!=="undefined"?esc(g.name(g.a)):g.name(g.a)} @ ${typeof esc!=="undefined"?esc(g.name(g.h)):g.name(g.h)}</b></div>
       ${g.line?`<div class="small">${g.line}</div>`:""}${g.fact?`<div class="small wkf">${g.fact}</div>`:""}</div></a>`).join("")}</div>`).join("")||`<div class="card small">No games in the next 7 days in our data.</div>`}
   <div class="small" style="margin-top:8px">NBA lines post the day of the game, NHL a day or two before, NFL during the week, soccer 1–2 days before — until then you'll see our estimate.</div>`;
  el.querySelectorAll("[data-wk]").forEach(b=>b.onclick=()=>{WK_SP=b.dataset.wk;try{LS.set("wkSp",WK_SP)}catch(e){}const y=scrollY;viewWeek();scrollTo(0,y)})}
