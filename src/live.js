/* ---------- Live scores (NFL + NBA) from ESPN's public scoreboard feed ----------
   Runs in the visitor's browser, refreshes every 30 s while games are on. If the feed can't be
   reached (some hosts block outside requests), everything fails silently and the site shows its
   normal daily data. Nothing here changes picks, records or stats. */
/* ---------- Has a game started? (pregame props close at tip-off / kickoff) ----------
   Uses the live feed when available, otherwise the scheduled start time in Eastern time. */
const ET_FMT=new Intl.DateTimeFormat("en-US",{timeZone:"America/Toronto",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});let ET_C=null;
function etNow(){const now=Date.now(),k=Math.floor(now/5000);if(ET_C&&ET_C.k===k)return ET_C.v;const p={};for(const x of ET_FMT.formatToParts(new Date(now)))p[x.type]=x.value;
  const v={d:`${p.year}-${p.month}-${p.day}`,m:(+p.hour%24)*60+ +p.minute};ET_C={k,v};return v}
function tipMin(t){const m=/(\d+):(\d+)\s*(AM|PM)/i.exec(t||"");return m?((+m[1]%12)+(/pm/i.test(m[3])?12:0))*60+ +m[2]:null}
function startedAt(d,t){const n=etNow(),tm=tipMin(t);if(!d)return false;if(n.d>d)return true;if(n.d<d)return false;return tm!=null&&n.m>=tm}
const MON={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function nflDate(g){const m=/([A-Z][a-z]{2})\s+(\d+)/.exec(String(g.when||"").replace(/^[A-Z][a-z]{2}\s+/,""));if(!m||!MON[m[1]])return null;
  const mo=MON[m[1]],y=(typeof CUR!=="undefined"?CUR:2026)+(mo<=7?1:0);return `${y}-${String(mo).padStart(2,"0")}-${String(+m[2]).padStart(2,"0")}`}
function nbaStarted(g){if(!g)return false;const L=typeof LIVE!=="undefined"&&LIVE.nba&&(LIVE.nba[String(g.id)]||LIVE.nba[g.a+"@"+g.h]);if(L&&L.st!=="pre")return true;return startedAt(NBA_SLATE_DATE,g.t)}
function nflStarted(g){if(!g)return false;if(g.final)return true;const L=typeof LIVE!=="undefined"&&LIVE.nfl&&LIVE.nfl[g.away+"@"+g.home];if(L&&L.st!=="pre")return true;return startedAt(nflDate(g),String(g.when||"").split("·")[1])}
function startedKey(){try{return (typeof NBA_SLATE!=="undefined"?NBA_SLATE.filter(nbaStarted).map(g=>g.id).join(","):"")+"|"+(typeof SLATE!=="undefined"?SLATE.filter(nflStarted).map(g=>g.id).join(","):"")}catch(e){return ""}}
const LIVE={nba:{},nfl:{},nhl:{},ok:{nba:0,nfl:0,nhl:0},box:{},timer:null,busy:0};
const LIVE_URL={nba:"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  nfl:"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  nhl:"https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard"};
const LIVE_SUM="https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=";
const LIVE_FIX={nfl:{WSH:"WAS"},nba:{},nhl:{TB:"TBL",NJ:"NJD",SJ:"SJS",LA:"LAK",UTAH:"UTA",LV:"VGK",MON:"MTL",WAS:"WSH"}};
function liveTeam(sp,ab){return (LIVE_FIX[sp]||{})[ab]||ab}
async function liveFetch(sp){
  try{
    const r=await fetch(LIVE_URL[sp],{cache:"no-store"});if(!r.ok)throw new Error(r.status);
    const j=await r.json(),m={};
    for(const e of j.events||[]){
      const c=(e.competitions||[])[0];if(!c)continue;
      const t=((c.status||e.status||{}).type)||{};let home=null,away=null;
      for(const x of c.competitors||[]){const o={ab:liveTeam(sp,(x.team&&x.team.abbreviation)||""),sc:+x.score||0,id:x.team&&x.team.id,
          rec:((x.records||[])[0]||{}).summary||"",ls:(x.linescores||[]).map(l=>+l.value||0)};
        const pl=(x.leaders||[]).find(l=>/^points/i.test(l.name||""));const ld=pl&&(pl.leaders||[])[0];
        if(ld&&ld.athlete)o.ldr=[ld.athlete.shortName||ld.athlete.displayName||"",ld.displayValue||String(ld.value||"")];
        if(x.homeAway==="home")home=o;else away=o}
      if(!home||!away)continue;
      const sit=c.situation||{};let poss=null;
      if(sit.possession)poss=[home,away].find(o=>String(o.id)===String(sit.possession));
      const g={id:String(e.id),a:away.ab,h:home.ab,as:away.sc,hs:home.sc,st:t.state||"pre",det:t.shortDetail||t.detail||"",
        poss:poss?poss.ab:null,dd:sit.shortDownDistanceText||"",rz:!!sit.isRedZone,date:e.date||"",
        ar:away.rec,hr:home.rec,als:away.ls,hls:home.ls,ald:away.ldr||null,hld:home.ldr||null,tv:((c.broadcasts||[])[0]||{}).names?.[0]||""};
      m[g.id]=g;m[g.a+"@"+g.h]=g;
    }
    LIVE[sp]=m;LIVE.ok[sp]=1;
  }catch(e){LIVE.ok[sp]=0}
}
function liveGet(sp,a,h,id){const m=LIVE[sp]||{};return (id!=null&&m[String(id)])||m[a+"@"+h]||null}
function liveBar(sp,g){
  if(!g||g.st==="pre")return "";
  const lead=g.as===g.hs?"":g.as>g.hs?g.a:g.h;
  const tm=(ab,sc)=>`<span class="lvt${lead===ab?" lead":""}">${g.poss===ab?"🏈 ":""}${ab} <b>${sc}</b></span>`;
  return `<div class="livebar ${g.st==="in"?"on":"fin"}">${g.st==="in"?`<span class="lvdot"></span><b class="lvl">LIVE</b>`:`<b class="lvl">FINAL</b>`}
    ${tm(g.a,g.as)}<span class="small">–</span>${tm(g.h,g.hs)}<span class="lvd">${g.st==="in"?esc(g.det):""}${g.st==="in"&&g.dd?" · "+esc(g.dd)+(g.rz?" 🔴 red zone":""):""}</span></div>`;
}
function livePut(host,html,before){
  if(!host)return;let el=host.querySelector(":scope > .livebar");
  if(!html){if(el)el.remove();return}
  const tmp=document.createElement("div");tmp.innerHTML=html.trim();const nb=tmp.firstElementChild;
  if(el)el.replaceWith(nb);else if(before)host.insertBefore(nb,before);else host.prepend(nb);
}
/* NBA live stat line for a player: value of a market so far */
const LIVE_LAB={pts:["PTS"],reb:["REB"],ast:["AST"],"3pm":["3PT",0],"3pa":["3PT",1],blk:["BLK"],stl:["STL"],pa:["PTS","AST"],pr:["PTS","REB"],ra:["REB","AST"],pra:["PTS","REB","AST"]};
async function liveBox(id){
  const b=LIVE.box[id];if(b&&Date.now()-b.t<25000)return b.p;
  try{const r=await fetch(LIVE_SUM+id,{cache:"no-store"});if(!r.ok)throw 0;const j=await r.json(),p={};
    for(const tm of ((j.boxscore||{}).players||[]))for(const st of tm.statistics||[]){const lab=st.labels||st.names||[];
      for(const a of st.athletes||[]){const nm=a.athlete&&a.athlete.displayName;if(!nm||!a.stats||!a.stats.length)continue;const o={};lab.forEach((l,i)=>o[l]=a.stats[i]);p[nm]=o}}
    LIVE.box[id]={t:Date.now(),p};return p}catch(e){return b?b.p:null}
}
function liveVal(o,k){
  const L=LIVE_LAB[k];if(!o||!L)return null;
  if(k==="3pm"||k==="3pa"){const v=String(o["3PT"]||"").split("-");return v.length===2?+v[L[1]]:null}
  let s=0;for(const l of L){const v=+o[l];if(!Number.isFinite(v))return null;s+=v}return s;
}
/* NFL live box score (ESPN summary) -> {player: {passYds,...}} */
const LIVE_NFL_SUM="https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=";
async function liveNflBox(id){
  const b=LIVE.box["nfl"+id];if(b&&Date.now()-b.t<25000)return b.p;
  try{const r=await fetch(LIVE_NFL_SUM+id,{cache:"no-store"});if(!r.ok)throw 0;const j=await r.json(),p={};
    for(const tm of ((j.boxscore||{}).players||[]))for(const cat of tm.statistics||[]){
      const keys=cat.keys||[],labs=cat.labels||[],nm=String(cat.name||"").toLowerCase();
      for(const a of cat.athletes||[]){const n=a.athlete&&a.athlete.displayName;if(!n||!a.stats)continue;const o=p[n]||(p[n]={});
        const get=(k,l)=>{let i=keys.indexOf(k);if(i<0)i=labs.indexOf(l);return i<0?null:a.stats[i]};
        if(nm==="passing"){const ca=String(get("completions/passingAttempts","C/ATT")||"").split("/");o.comp=+ca[0]||0;o.passYds=+get("passingYards","YDS")||0;o.passTD=+get("passingTouchdowns","TD")||0}
        if(nm==="rushing"){o.rushAtt=+get("rushingAttempts","CAR")||0;o.rushYds=+get("rushingYards","YDS")||0;o.rushTD=+get("rushingTouchdowns","TD")||0}
        if(nm==="receiving"){o.rec=+get("receptions","REC")||0;o.recYds=+get("receivingYards","YDS")||0;o.recTD=+get("receivingTouchdowns","TD")||0}}}
    LIVE.box["nfl"+id]={t:Date.now(),p};return p}catch(e){return b?b.p:null}
}
function liveNflVal(o,k){if(!o)return null;
  if(k==="rushRec")return (o.rushYds||0)+(o.recYds||0);if(k==="anyTD")return (o.rushTD||0)+(o.recTD||0);
  return o[k]!=null?o[k]:0}
/* the live ESPN game for team t's CURRENT game only (same two teams) — ESPN's scoreboard can still show last week */
function liveNflGame(t){const o=typeof oppOf!=="undefined"?oppOf(t):null;if(!o)return null;const a=o.g.away,h=o.g.home;
  return Object.entries(LIVE.nfl||{}).filter(([k])=>!k.includes("@")).map(([,g])=>g).find(g=>g.a===a&&g.h===h)||null}
async function liveDecorate(){
  const h=decodeURIComponent((location.hash||"#games").slice(1));
  /* NHL game cards + game page */
  if(h.startsWith("nhl")&&typeof nhGame!=="undefined"){
    document.querySelectorAll("#v-nhl [data-nhg]").forEach(c=>{const g=nhGame(c.dataset.nhg);if(!g)return;livePut(c,liveBar("nhl",liveGet("nhl",g.a,g.h)),c.querySelector(".nhgh")&&c.querySelector(".nhgh").nextSibling)});
    const hero=document.querySelector("#v-nhl .nhhero");if(hero&&h.startsWith("nhl-game-")){const g=nhGame(h.slice(9).split("-")[0]);if(g)livePut(hero,liveBar("nhl",liveGet("nhl",g.a,g.h)),hero.querySelector(".nhht"))}}
  /* NBA game cards + game page */
  document.querySelectorAll("#v-nba [data-ng]").forEach(c=>{const g=NBA_SLATE.find(x=>String(x.id)===c.dataset.ng);if(!g)return;
    livePut(c,liveBar("nba",liveGet("nba",g.a,g.h,g.id)),c.querySelector(".when")&&c.querySelector(".when").nextSibling)});
  if(h.startsWith("nba-game-")){const g=NBA_SLATE.find(x=>String(x.id)===h.slice(9)),gh=document.querySelector("#v-nba .gh");
    if(g&&gh){const host=gh.parentElement,html=liveBar("nba",liveGet("nba",g.a,g.h,g.id));let el=host.querySelector(":scope > .livebar");
      if(!html){if(el)el.remove()}else if(el)el.outerHTML=html;else gh.insertAdjacentHTML("afterend",html)}}
  /* NBA scores tab: Today / live board */
  if(h==="nba-scores"){const host=document.getElementById("liveTodayHost");if(host&&typeof nbaTodayHtml!=="undefined"){const html=nbaTodayHtml();if(host.dataset.h!==html){host.innerHTML=html;host.dataset.h=html}}}
  /* NBA plays of the day: live progress vs the line */
  const pods=[...document.querySelectorAll("#v-nba .pod[data-nm]")];
  for(const pd of pods){
    const nm=nbaUnesc(pd.dataset.nm),k=pd.dataset.bp.split("|")[0],p=NBA_LOGS[nm];if(!p)continue;
    const gg=nbaGameOf(p.tm),lg=gg&&liveGet("nba",gg.a,gg.h,gg.id);let el=pd.querySelector(".lvp");
    if(!lg||lg.st==="pre"){if(el)el.remove();continue}
    const bx=await liveBox(lg.id);const v=bx&&liveVal(bx[nm],k);if(v==null){if(el)el.remove();continue}
    const m=/(Over|Under)\s+([\d.]+)/.exec(pd.querySelector(".bpl").innerText);if(!m)continue;
    const line=+m[2],over=m[1]==="Over",hit=over?v>line:v<line,fin=lg.st==="post";
    const txt=fin?(hit?`✅ Hit — finished with <b>${v}</b>`:`❌ Missed — finished with <b>${v}</b>`):`<span class="lvdot"></span>&nbsp; So far: <b>${v}</b> ${NBA_MK[k][2]} (line ${line}) · ${esc(lg.det)}${over?(v>line?" · already over ✅":` · needs ${Math.floor(line-v)+1} more`):(v>line?" · already over ❌":"")}`;
    const html=`<div class="lvp ${fin?(hit?"w":"l"):"on"}">${txt}</div>`;el=pd.querySelector(".lvp");
    if(el)el.outerHTML=html;else pd.children[1].insertAdjacentHTML("beforeend",html);
  }
  /* NFL Plays of the Week: live progress */
  if(h==="plays"&&typeof PLAYS!=="undefined"){
    for(const a of document.querySelectorAll("#v-plays .plink")){
      const pl=PLAYS[+a.dataset.i],card=a.closest(".play");if(!pl||!card)continue;let el=card.querySelector(".lvp");
      let html="";
      if(pl.type==="prop"){const P=PINFO[pl.player],rp=REAL_PROPS[pl.player+"|"+pl.market];const lg=P&&liveNflGame(P.team);
        if(lg&&lg.st!=="pre"&&rp){const bx=await liveNflBox(lg.id);const v=bx&&liveNflVal(bx[pl.player]||{},pl.market),line=rp[0],over=pl.side==="over",fin=lg.st==="post";
          if(v!=null){const hit=over?v>line:v<line,u=MARKETS[pl.market]?MARKETS[pl.market].n:pl.market;
            html=fin?`<div class="lvp ${hit?"w":"l"}">${hit?"✅ Hit":"❌ Missed"} — finished with <b>${v}</b> ${esc(u)}</div>`
              :`<div class="lvp on"><span class="lvdot"></span>&nbsp; So far: <b>${v}</b> ${esc(u)} (line ${line}) · ${esc(lg.det)}${over?(v>line?" · already over ✅":` · needs ${+(line-v+0.5).toFixed(1)} more`):(v>line?" · already over ❌":"")}</div>`}}}
      else{const g=SLATE.find(x=>x.id==pl.game),lg=g&&liveGet("nfl",g.away,g.home);const L=g&&LINES[g.id];
        if(lg&&lg.st!=="pre"&&L){const fin=lg.st==="post",tot=lg.as+lg.hs;let txt="";
          if(pl.type==="total"){txt=`<b>${tot}</b> points${fin?"":" so far"} (line ${L.tot}, ${pl.side})`}
          else{const t=pl.team,me=t===g.away?lg.as:lg.hs,op=t===g.away?lg.hs:lg.as,spT=t===g.home?L.sp:-L.sp;txt=`${esc(t)} ${me>op?"lead":me<op?"trail":"tied"} ${me}–${op} (${esc(t)} ${spT>0?"+":""}${spT})`}
          html=`<div class="lvp ${fin?"fin":"on"}">${fin?"FINAL · ":`<span class="lvdot"></span>&nbsp; ${esc(lg.det)} · `}${txt}</div>`}}
      el=card.querySelector(".lvp"); /* re-check after the awaits: two overlapping refreshes used to add it twice */
      if(!html){if(el)el.remove();continue}
      if(el)el.outerHTML=html;else{const h2=card.querySelector("h2");(h2||card.firstElementChild).insertAdjacentHTML("afterend",html)}
    }
  }
  /* NFL game cards + game page */
  if(typeof SLATE!=="undefined"){
    document.querySelectorAll("#v-games .game[data-g]").forEach(c=>{const g=SLATE.find(x=>String(x.id)===c.dataset.g);if(!g||g.final)return;const lg=liveGet("nfl",g.away,g.home);
      if(lg&&lg.st==="post"&&typeof nflFinalBlock!=="undefined"){livePut(c,"");let f=c.querySelector(":scope > .nfin");const html=nflFinalBlock(g,lg.as,lg.hs);if(f)f.outerHTML=html;else c.querySelector(".when").insertAdjacentHTML("afterend",html);c.classList.add("isfin");return}
      livePut(c,liveBar("nfl",lg),c.querySelector(".when")&&c.querySelector(".when").nextSibling)});
    if(h.startsWith("game-")){const g=SLATE.find(x=>String(x.id)===h.slice(5)),sb=document.querySelector("#v-game .scoreboard");
      if(g&&!g.final&&sb){const host=sb.parentElement,html=liveBar("nfl",liveGet("nfl",g.away,g.home));let el=host.querySelector(":scope > .livebar");
        if(!html){if(el)el.remove()}else if(el)el.outerHTML=html;else sb.insertAdjacentHTML("beforebegin",html)}}
  }
}
async function liveTick(){
  if(LIVE.busy)return;LIVE.busy=1;
  try{
    const h=(location.hash||"#today").slice(1)||"today",nba=h.startsWith("nba");
    if(h==="today"){await Promise.all([liveFetch("nba"),liveFetch("nfl"),liveFetch("nhl")]);const el=document.getElementById("todayLive");if(el&&typeof todayLive!=="undefined")el.innerHTML=todayLive()}
    else await liveFetch(nba?"nba":h.startsWith("nhl")?"nhl":"nfl");
    const sk=startedKey();if(LIVE.sk!=null&&sk!==LIVE.sk&&/^(props|nba-props|nba-best|nba-player-|nba$)/.test(h)&&typeof route!=="undefined"){LIVE.sk=sk;if(typeof NB!=="undefined")NB._best=null;route();await liveDecorate();return}
    LIVE.sk=sk;
    await liveDecorate();
  }finally{LIVE.busy=0}
  const hh=(location.hash||"#today").slice(1)||"today",sp=hh.startsWith("nba")?"nba":hh.startsWith("nhl")?"nhl":"nfl";
  const any=(hh==="today"?[...Object.values(LIVE.nba),...Object.values(LIVE.nfl),...Object.values(LIVE.nhl)]:Object.values(LIVE[sp])).some(g=>g.st==="in");
  clearTimeout(LIVE.timer);
  if(LIVE.ok[sp]||!LIVE.fails)LIVE.timer=setTimeout(liveTick,document.hidden?120000:any?30000:120000);
  if(!LIVE.ok[sp])LIVE.fails=(LIVE.fails||0)+1;
}
window.addEventListener("hashchange",()=>setTimeout(()=>{liveDecorate();liveTick()},60));
document.addEventListener("visibilitychange",()=>{if(!document.hidden)liveTick()});
setTimeout(liveTick,300);

/* ---------- NBA "Today" board (Scores tab): live first, then upcoming, then finals ---------- */
function nbaTodayHtml(){
  const L=LIVE.nba||{},seen=new Set(),G=[];
  const etD=d=>{try{return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto"}).format(new Date(d))}catch(e){return ""}};
  const today=etNow().d;
  Object.entries(L).filter(([k])=>!k.includes("@")).forEach(([,g])=>{if(g.date&&etD(g.date)!==today&&g.st!=="in")return;seen.add(g.a+"@"+g.h);G.push({...g,sl:NBA_SLATE.find(x=>x.a===g.a&&x.h===g.h)})});
  if(etNow().d===NBA_SLATE_DATE)NBA_SLATE.forEach(sl=>{if(!seen.has(sl.a+"@"+sl.h))G.push({id:sl.id,a:sl.a,h:sl.h,as:0,hs:0,st:nbaStarted(sl)?"in":"pre",det:"",sl,noLive:1})});
  if(!G.length)return `<div class="card tdyw"><div class="tdyt"><h2 style="margin:0">Today</h2></div><div class="small" style="margin-top:6px">No NBA games today. Recent finals are below.</div></div>`;
  const ord={in:0,pre:1,post:2};G.sort((x,y)=>ord[x.st]-ord[y.st]||(tipMin(x.sl&&x.sl.t)||0)-(tipMin(y.sl&&y.sl.t)||0));
  const n={in:0,pre:0,post:0};G.forEach(g=>n[g.st]++);
  const pills=[n.in?`<span class="tdyp on"><span class="lvdot"></span> ${n.in} live</span>`:"",n.pre?`<span class="tdyp">${n.pre} upcoming</span>`:"",n.post?`<span class="tdyp">${n.post} final</span>`:""].join("");
  const card=g=>{const st=g.st,lead=st==="pre"||g.as===g.hs?"":g.as>g.hs?"a":"h";
    const q=Math.max((g.als||[]).length,(g.hls||[]).length,st==="pre"?0:4),qs=[...Array(q)].map((_,i)=>i<4?"Q"+(i+1):(i===4?"OT":"OT"+(i-3)));
    const cells=(ls)=>qs.map((_,i)=>`<span class="tdq">${ls&&ls[i]!=null?ls[i]:"–"}</span>`).join("");
    const rec=t=>(t==="a"?g.ar:g.hr)||(typeof nbaRec!=="undefined"?nbaRec(t==="a"?g.a:g.h):"");
    const row=t=>{const ab=t==="a"?g.a:g.h,sc=t==="a"?g.as:g.hs;return `<div class="tdr${lead===t?" lead":lead?" lose":""}">
      <span class="tdn">${nbaBadge(ab)}<b>${esc(nbaShort(ab))}</b><span class="small">${esc(rec(t))}</span></span>
      ${st==="pre"?"":cells(t==="a"?g.als:g.hls)}<span class="tds">${st==="pre"?"":sc}</span></div>`};
    const head=st==="in"?`<span class="tdst on"><span class="lvdot"></span> LIVE · ${esc(g.det||"In progress")}</span>`
      :st==="post"?`<span class="tdst">${/OT/.test(g.det||"")?esc(g.det).toUpperCase():"FINAL"}</span>`
      :`<span class="tdst pre">${g.sl?esc(g.sl.t)+" ET":esc(g.det||"")}</span>${g.sl&&typeof cdChip!=="undefined"?cdChip("nba",g.sl):""}`;
    const qh=st==="pre"?"":`<div class="tdr tdhd"><span class="tdn"></span>${qs.map(x=>`<span class="tdq">${x}</span>`).join("")}<span class="tds">T</span></div>`;
    const Ln=NBA_LINES[g.a+"@"+g.h];
    const foot=st==="pre"?(Ln?`<div class="tdf">Spread: <b>${esc(nbaShort(Ln.sp<=0?g.h:g.a))} ${Ln.sp<=0?Ln.sp:-Ln.sp}</b> · Total <b>${Ln.tot}</b>${g.sl?` · <span class="tdlk">Props & matchup ›</span>`:""}</div>`:"")
      :(g.ald||g.hld)?`<div class="tdf">🔥 Top scorers: ${[g.ald&&`${esc(g.ald[0])} <b>${esc(g.ald[1])}</b>`,g.hld&&`${esc(g.hld[0])} <b>${esc(g.hld[1])}</b>`].filter(Boolean).join(" · ")}</div>`:"";
    const tag=g.sl?"a":"div";
    return `<${tag} class="card tdy ${st}"${g.sl?` href="#nba-game-${g.sl.id}"`:""}><div class="tdyh">${head}${g.tv?`<span class="small">📺 ${esc(g.tv)}</span>`:""}</div>${qh}${row("a")}${row("h")}${foot}</${tag}>`};
  return `<div class="tdyw"><div class="tdyt"><h2 style="margin:0">Today</h2><span class="small">${typeof nbaDayS!=="undefined"?nbaDayS(today):today}</span><span style="flex:1"></span>${pills}</div>
   <div class="grid g2">${G.map(card).join("")}</div>
   <div class="small" style="margin-top:6px">${LIVE.ok.nba?"Live scores from ESPN · updates every 30 seconds.":"Live scores load when ESPN can be reached."} Full box scores appear below after the morning update.</div></div>`;
}
