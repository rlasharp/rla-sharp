/* ---------- 🧹 Simpler, cleaner pages (Nov 2026 redesign) ----------
   · Every game page (NBA / NHL / NFL / soccer) has the same tabs in the same order: Overview · Matchup · Trends · H2H · Props.
   · Overview opens with "The short version" (our pick, the top 2 props, the 3 things that matter most); everything else
     is folded to its title and opens on tap (what you open is remembered).
   · Overlapping cards are merged: Key takeaways + Game factors + Fun facts -> "What matters"; injury lists + key players
     out + with/without -> "Injuries".
   · Heavy cards (charts, heat maps, schedules) are built only when you open them -> faster pages on phones.
   · Long card intros are cut to one line with an ⓘ to read the rest; card titles lose their leading emoji;
     prop cards show the line, odds, hit rates and chart, with the deeper splits under "More detail". */
function gpE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
/* one tab bar for every sport: items [[key,label,href,extra attrs]] */
function gpTabs(cur,items){return `<div class="gtabs gptabs">${items.map(([k,l,h,a])=>`<a href="${h||"#"}" ${a||""} class="${k===cur?"on":""}">${l}</a>`).join("")}</div>`}
/* "The short version" */
function gpSummary(o){const R=[];
  if(o.pick)R.push(`<div class="gpsr"><span class="gpsl">Our pick</span><div>${o.pick}</div></div>`);
  if(o.props&&o.props.length)R.push(`<div class="gpsr"><span class="gpsl">Top props</span><div>${o.props.map(p=>`<div class="gpsp">${p}</div>`).join("")}</div></div>`);
  if(o.sp&&o.teams)try{const W=gpWatch(o.sp,o.teams);if(W.inj)R.push(`<div class="gpsr"><span class="gpsl">🚑 Key absence</span><div>${W.inj}</div></div>`);if(W.mv)R.push(`<div class="gpsr"><span class="gpsl">📈 Line move</span><div>${W.mv}</div></div>`)}catch(e){}
  R.push(`<div class="gpsr"><span class="gpsl">What matters</span><div class="gptop" data-gptop><span class="small">—</span></div></div>`);
  return `<div class="card gpsum"><h2>The short version</h2>${R.join("")}<div class="small gpfoot">Tap any section below to open it.</div></div>`}
function gpPropLine(nm,side,line,mk,odds,ch,href){return `<a href="${href||"#"}"><b>${gpE(nm)}</b> ${side} ${line} ${gpE(mk)}</a> <span class="small">${typeof oddsFmt!=="undefined"?oddsFmt(odds):odds}${ch!=null?` · our chance ${Math.round(ch*100)}%`:""}</span>`}
/* merged cards (the parts keep their own content; their own card frame is flattened by CSS) */
function gpMerge(title,cls,parts,sub){parts=parts.filter(x=>x&&String(x).trim());if(!parts.length)return "";
  return `<div class="card xacard gpm ${cls}"><h2>${title}</h2>${sub?`<div class="xasub">${sub}</div>`:""}${parts.join("")}</div>`}
/* lazy cards: the content is built the first time the card is opened */
const GP_LZ={};let GP_LZN=0;
function gpLazy(title,fn){const id="lz"+(++GP_LZN);GP_LZ[id]=fn;return `<div class="card xacard gplazy" data-lz="${id}"><h2>${title}</h2><div class="gplzb small">Loading…</div></div>`}
function gpFill(c){const fn=GP_LZ[c.dataset.lz];if(!fn)return;delete GP_LZ[c.dataset.lz];let h="";try{h=fn()||""}catch(e){}
  const b=c.querySelector(".gplzb");if(!h){b.textContent="Nothing to show for this game yet.";return}
  const t=document.createElement("div");t.innerHTML=h;const inner=t.firstElementChild;
  /* keep our folded frame + title; take the built card's body */
  b.className="gplzin";b.innerHTML=h}   /* the built card stays whole (its buttons keep working); CSS flattens its frame and hides its title */
document.addEventListener("click",e=>{const h=e.target.closest&&e.target.closest(".gplazy > h2");if(h){const c=h.parentElement;if(GP_LZ[c.dataset.lz])gpFill(c)}},true);

/* ---------- after every render: fill the summary, fold, shorten, tidy ---------- */
const GP_EMO=/^\s*(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u{1F3FB}-\u{1F3FF}‍️])+\s*/u;
function gpPost(){const root=document.querySelector("main>section:not(.hide)");if(!root)return;
  /* summary: the first 3 lines of "What matters" */
  root.querySelectorAll("[data-gptop]").forEach(box=>{if(box.dataset.done)return;const W=root.querySelector(".gpwm");if(!W)return;
    const L=[...W.querySelectorAll(".nhq, .xfr")].slice(0,3).map(x=>{const t=(x.matches(".xfr")?[x.querySelector("b"),x.querySelector(".small")].filter(Boolean).map(e=>e.textContent.trim()).join(" — "):[...x.children].map(c=>c.textContent.trim().replace(GP_EMO,"")).filter(Boolean).join(" ")).replace(GP_EMO,"").replace(/\s+/g," ").trim();return t.length>150?t.slice(0,147)+"…":t}).filter(Boolean);
    if(L.length){box.innerHTML=L.map(t=>`<div class="gpsp">• ${gpE(t)}</div>`).join("");box.dataset.done=1}});
  /* lazy cards that were remembered open */
  root.querySelectorAll(".gplazy.open").forEach(c=>{if(GP_LZ[c.dataset.lz])gpFill(c)});
  /* long intros -> first sentence + ⓘ */
  root.querySelectorAll(".card .xasub, .card > h2 + p.small, .card > h2 + .small:not(.gptop)").forEach(el=>{if(el.dataset.gpi)return;el.dataset.gpi=1;const t=el.textContent.replace(/\s+/g," ").trim();if(t.length<=110)return;
    let cut=-1;const m=t.slice(40).search(/(\. |; | — )/);if(m>=0)cut=40+m+1;if(cut<0||cut>130)cut=t.lastIndexOf(" ",100);if(cut<30)return;
    const full=el.innerHTML;el.innerHTML=`${gpE(t.slice(0,cut).replace(/[;—\s]+$/,""))} <button class="gpi" aria-label="More about this">ⓘ</button>`;el.querySelector(".gpi").onclick=ev=>{ev.preventDefault();ev.stopPropagation();el.innerHTML=full}});
  /* card titles: drop the leading emoji (keeps team logos and text) */
  root.querySelectorAll(".card > h2, details.drawer > summary > span").forEach(h=>{if(h.dataset.gpe)return;h.dataset.gpe=1;const f=[...h.childNodes].find(x=>!(x.nodeType===3&&!x.textContent.trim()));if(f&&f.nodeType===3)f.textContent=f.textContent.replace(GP_EMO,"")});
  /* prop cards: keep the top (line, odds, hit rates, chart); deeper splits go under "More detail" */
  root.querySelectorAll(".card.prop").forEach(c=>{if(c.dataset.gpc)return;c.dataset.gpc=1;const ch=c.querySelector(".nbchw,.pchart,.chartw,.nhch,.pxchw");if(!ch)return;
    const rest=[];let n=ch.nextElementSibling;while(n){const nx=n.nextElementSibling;if(!n.matches(".pxbet,.betrow,.prop-actions,[data-keep]"))rest.push(n);n=nx}
    if(rest.length<1)return;const d=document.createElement("details");d.className="gpmore";d.innerHTML="<summary>More detail</summary>";rest.forEach(x=>d.appendChild(x));c.appendChild(d)});
  root.querySelectorAll(".bfil").forEach(gpQuick);
  try{plTimelinePost(root)}catch(e){}
  if(typeof uxFoldCards!=="undefined")uxFoldCards()}

/* ---------- Props pages: quick chips on top of the filter dropdowns (dropdowns move under "More filters") ---------- */
const GP_QM=["pts","reb","ast","3pm","pra","hpts","hsog","hanyG","hsaves","passYds","rushYds","recYds","rec","anyTD","sgoal","ssot"];
function gpQuick(box){if(box.dataset.gpq)return;box.dataset.gpq=1;const sel=k=>box.querySelector(`select[data-bf="${k}"],select[data-nhbf="${k}"],select[data-nbf="${k}"]`);
  const M=sel("m"),Sd=sel("s"),Mn=sel("min");if(!M&&!Sd)return;
  const mk=M?[...M.options].filter(o=>o.value).sort((a,b)=>{const i=GP_QM.indexOf(a.value),j=GP_QM.indexOf(b.value);return (i<0?99:i)-(j<0?99:j)}).slice(0,5):[];
  const chips=[["all","All",!(M&&M.value)&&!(Sd&&Sd.value)&&!(Mn&&Mn.value)],...mk.map(o=>["m|"+o.value,o.textContent.replace(/^3-Pointers made$/,"3s").replace(/^Points \+ Rebounds \+ Assists$/,"PRA").replace(/ yards$/," yds"),M.value===o.value]),...(Sd?[["s|o","Overs",Sd.value==="o"],["s|u","Unders",Sd.value==="u"]]:[]),...(Mn?[["min|60","60%+",Mn.value==="60"]]:[])];
  const bar=document.createElement("div");bar.className="gpchips";bar.innerHTML=chips.map(([k,l,on])=>`<button type="button" class="${on?"on":""}" data-gpqc="${gpE(k)}">${gpE(l)}</button>`).join("");
  const det=document.createElement("details");det.className="gpmf";det.innerHTML="<summary>More filters</summary>";box.parentNode.insertBefore(bar,box);box.parentNode.insertBefore(det,box);det.appendChild(box);
  bar.onclick=e=>{const b=e.target.closest("[data-gpqc]");if(!b)return;const k=b.dataset.gpqc,set=(s,v)=>{if(s){s.value=v;s.dispatchEvent(new Event("change",{bubbles:true}))}};
    if(k==="all"){[M,Sd,Mn].forEach(s=>set(s,""));return}const [f,v]=k.split("|"),s=sel(f);set(s,s&&s.value===v?"":v)}}
let GP_T=0;const gpSoon=()=>{clearTimeout(GP_T);GP_T=setTimeout(gpPost,60)};
window.addEventListener("load",()=>{gpSoon();try{new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))gpSoon()}).observe(document.querySelector("main")||document.body,{childList:true,subtree:true})}catch(e){}});
window.addEventListener("hashchange",gpSoon);

/* ---------- Today: one list of today's games, every sport, each with our pick ---------- */
function tdTv(t){const m=String(t||"").match(/(\d+):(\d+)\s*(AM|PM)/i);return m?((+m[1]%12)+(m[3].toUpperCase()==="PM"?12:0))*60+(+m[2]):9999}
function tdAllGames(){const R=[];const today=typeof etNow!=="undefined"?etNow().d:new Date().toISOString().slice(0,10);
  try{for(const g of (typeof NBA_SLATE!=="undefined"&&NBA_SLATE_DATE===today?NBA_SLATE:[])){if(nbaStarted(g))continue;const x=typeof nbaGamePick!=="undefined"?nbaGamePick(g):null,M=nbaModel(g.a,g.h);
    R.push({ic:"🏀",t:g.t,m:`${g.a} @ ${g.h}`,href:`#nba-game-${g.id}`,pick:x?`${x.txt} <span class="small">· ${Math.round(x.ch*100)}%</span>`:M?`${nbaShort(M.m>=0?g.h:g.a)} by ${Math.max(.5,Math.abs(M.m))} <span class="small">(estimate)</span>`:""})}}catch(e){}
  try{for(const g of (typeof NHL_SLATE!=="undefined"&&NHL_DATE===today?NHL_SLATE:[])){if(nhStarted(g))continue;const pr=nhProject(g);let pk="";
    if(pr){const hw=pr.hwin>=.5,w=hw?g.h:g.a;let [ws,ls]=nhPredScore(pr,hw,g);pk=`${nhTm(w)} ${ws}–${ls} <span class="small">· ${Math.round((hw?pr.hwin:1-pr.hwin)*100)}%</span>`}
    R.push({ic:"🏒",t:g.t+" ET",m:`${g.a} @ ${g.h}`,href:`#nhl-game-${g.id}`,pick:pk})}}catch(e){}
  try{for(const g of (typeof SLATE!=="undefined"?SLATE:[])){if(g.final||nflStarted(g)||nflDate(g)!==today)continue;const pj=projScore(g);
    R.push({ic:"🏈",t:String(g.when||"").split("·").pop().trim(),m:`${g.away} @ ${g.home}`,href:`#game-${g.id}`,pick:pj?`${short(pj.win)} ${Math.max(pj.a,pj.h)}–${Math.min(pj.a,pj.h)}`:""})}}catch(e){}
  try{if(window.SOC_OK)for(const f of SOC_FX||[]){if(socStarted(f)||socDay(f.t)!==today)continue;const x=socPred(f);
    R.push({ic:"⚽",t:new Date(f.t).toLocaleTimeString("en-US",{timeZone:"America/Toronto",hour:"numeric",minute:"2-digit"}),m:`${socTm(f.h)} v ${socTm(f.a)}`,href:`#soccer-game-${f.id}`,pick:x?`${socTm(f.h)} ${x.score[0]}–${x.score[1]} ${socTm(f.a)}`:""})}}catch(e){}
  return R.sort((a,b)=>tdTv(a.t)-tdTv(b.t))}
function tdGamesCard(){const R=tdAllGames();
  return `<div class="card tdall">${R.length?R.map(r=>`<a class="tdr" href="${r.href}"><span class="tdi">${r.ic}</span><span class="tdt">${gpE(String(r.t).replace(/ ET$/,""))}</span><span class="tdm"><b>${gpE(r.m)}</b>${r.pick?`<span class="small">Our pick: ${r.pick}</span>`:""}</span><span class="tdgo">›</span></a>`).join(""):`<div class="small">No more games today — see the <a href="#week">week ahead</a>.</div>`}</div>`}

/* ---------- menus: 5 main links per sport, the rest under "More" ---------- */
const GP_NAV={nav:["#today","#games","#props","#plays","#bets"],nbaNav:["#today","#nba","#nba-props","#potd","#bets"],nhlNav:["#today","#nhl","#nhl-props","#potd","#bets"],socNav:["#today","#soccer","#soccer-props","#potd","#bets"]};
function gpNav(){for(const [id,keep] of Object.entries(GP_NAV)){const n=document.getElementById(id);if(!n||n.dataset.gp)continue;n.dataset.gp=1;
  if(id==="socNav"&&!n.querySelector('a[href="#potd"]'))n.insertAdjacentHTML("beforeend",'<a href="#potd" data-v="potd" data-sp="soc">Picks</a>');
  const L=[...n.querySelectorAll("a")];
  for(const a of L){const h=a.getAttribute("href");if(keep.includes(h)){if(h==="#plays"||h==="#potd")a.textContent="Picks";if(h==="#bets")a.textContent="My Bets";if(h==="#today")a.textContent="Today";if(/^#(games|nba|nhl|soccer)$/.test(h))a.textContent="Games";if(/props$/.test(h))a.textContent="Props"}else a.classList.add("nvx")}
  /* order: Today · Games · Props · Picks · My Bets, then More */
  keep.forEach(h=>{const a=L.find(x=>x.getAttribute("href")===h);if(a)n.appendChild(a)});
  L.filter(a=>a.classList.contains("nvx")).forEach(a=>n.appendChild(a));
  const b=document.createElement("button");b.className="navmore";b.type="button";b.textContent="More ▾";b.onclick=e=>{e.preventDefault();const o=n.classList.toggle("open");b.textContent=o?"Less ▴":"More ▾"};
  n.insertBefore(b,n.querySelector(".nvx"));n.addEventListener("click",e=>{if(e.target.closest("a.nvx")){n.classList.remove("open");b.textContent="More ▾"}})}}
window.addEventListener("load",gpNav);
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[data-sp="soc"][href="#potd"]');if(a){try{POTD_SP="soc";LS.set("potdSp","soc")}catch(x){}}},true);

/* ---------- Filters as a slide-up panel on phones ---------- */
document.addEventListener("toggle",e=>{const d=e.target;if(!(d.matches&&d.matches("details.pxfd")))return;document.body.classList.toggle("gpsheet",d.open&&innerWidth<=760);
  if(d.open&&!d.querySelector(".gpdone")){const b=document.createElement("button");b.className="btn gpdone";b.type="button";b.textContent="Done";b.onclick=ev=>{ev.preventDefault();d.open=false};d.appendChild(b)}},true);
document.addEventListener("click",e=>{if(!document.body.classList.contains("gpsheet"))return;if(e.target.closest&&e.target.closest("details.pxfd"))return;const d=document.querySelector("details.pxfd[open]");if(d){e.preventDefault();e.stopPropagation();d.open=false}},true);
window.addEventListener("hashchange",()=>document.body.classList.remove("gpsheet"));

/* opening a game (from anywhere else) always starts on Overview; switching tabs inside the same game keeps your tab */
function gpGameKey(h){h=String(h||"").replace(/^.*#/,"");const m=h.match(/^(nba-game-|nhl-game-|game-|soccer-game-)([^-]+)/);return m?m[1]+m[2]:null}
window.addEventListener("hashchange",e=>{const n=gpGameKey(e.newURL),o=gpGameKey(e.oldURL);if(!n||n===o)return;
  try{if(typeof NB!=="undefined")NB.gtab="ov"}catch(x){}try{if(typeof NH!=="undefined")NH.tab="overview"}catch(x){}try{if(typeof S!=="undefined")S.gtab="ov"}catch(x){}try{if(typeof SC!=="undefined")SC.tab="ov"}catch(x){}});

/* ---------- confidence levels: Strong / Medium / Small, with how picks at that level have actually done (tracker) ---------- */
function confTier(sc,edge){return sc>=.62&&edge>=.07?"strong":sc>=.56&&edge>=.04?"medium":"small"}
function confChip(sp,sc,edge){const t=confTier(sc,edge),L={strong:"Strong",medium:"Medium",small:"Small"}[t];
  const R=sp&&typeof TRACK!=="undefined"&&TRACK&&TRACK.sum&&TRACK.sum[sp]&&TRACK.sum[sp].tier&&TRACK.sum[sp].tier[t],rec=R&&R[0]+R[1]>=5?`${R[0]}-${R[1]}`:"";
  return ` <span class="cfc ${t}" title="${L} pick${rec?` — our ${L.toLowerCase()} ${sp.toUpperCase()} picks have gone ${rec} so far`:""}">${L}${rec?` · ${rec}`:""}</span>`}

/* ---------- share a single pick or a parlay as an image (same card style as "Share today's plays") ---------- */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-shp],[data-prlsh]");if(!b||typeof shareImage==="undefined")return;e.preventDefault();e.stopPropagation();
  const day=new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
  if(b.dataset.shp){let x={};try{x=JSON.parse(b.dataset.shp)}catch(z){return}
    shareImage({title:"My pick",kicker:day,sub:`Our chance ${x.ch}% · the odds need ${x.nd}% — a lean, not a guarantee.`,file:"pick.png",rows:[{a:x.a,b:x.b,c:x.c,col:/^Under/.test(x.b)?"#ff9a9d":"#7ee2a0"}]});return}
  const P=(window.PRL_LAST||{})[b.dataset.prlsh];if(!P)return;
  shareImage({title:`${P.legs.length}-leg parlay`,kicker:day,sub:`Pays ${P.dec.toFixed(2)}× · our chance all hit ${Math.round(P.p*100)}% — bet small.`,file:"parlay.png",
    rows:P.legs.map(l=>({a:String(l.label).replace(/<[^>]+>/g,""),b:`our ${Math.round(l.p*100)}%`,c:typeof oddsFmt!=="undefined"?oddsFmt(l.odds):String(l.odds),col:"#8cc0ff"}))})},true);

/* ---------- player timeline: news, injury status, line changes and his last games, newest first ---------- */
function plTimeline(sp,nm){const ev=[],nn=x=>typeof newsNorm!=="undefined"?newsNorm(x):String(x).toLowerCase();
  try{if(typeof newsFor!=="undefined")for(const x of newsFor(sp,{player:nm,hrs:24*14}).slice(0,5))ev.push({t:Date.parse(x.at),ic:x.bad?"🚑":x.q?"⚠️":"📰",h:x.h,s:x.d?x.d.slice(0,120):"",url:x.url})}catch(e){}
  try{const inj=sp==="nba"?nbaInjOf(nm):sp==="nhl"?nhInjOf(nm):(()=>{for(const t in INJ){const r=INJ[t].find(z=>z[0]===nm);if(r)return [r[0],r[1],r[2],r[3],r[4]]}return null})();
    if(inj)ev.push({t:Date.now()+1,ic:"🩺",h:`Injury report: ${inj[2]||"listed"}`,s:[sp==="nhl"&&typeof nhInjTxt!=="undefined"?nhInjTxt(inj[3]):inj[3],inj[4]?"est. return "+inj[4]:""].filter(Boolean).join(" · ")})}catch(e){}
  try{const H=typeof LINE_HIST!=="undefined"?LINE_HIST:(typeof XA!=="undefined"&&XA.hist)||null;if(H){const pre=sp+"|"+nm+"|";for(const [k,L] of Object.entries(H)){if(!k.startsWith(pre))continue;const mk=k.slice(pre.length),lab=sp==="nba"&&typeof NBA_MK!=="undefined"&&NBA_MK[mk]?NBA_MK[mk][1]:sp==="nhl"&&typeof NH_MK!=="undefined"&&NH_MK[mk]?NH_MK[mk][1]:mk;
      for(let i=Math.max(1,L.length-6);i<L.length;i++)if(L[i][1]!==L[i-1][1])ev.push({d:L[i][0],t:Date.parse(L[i][0]+"T12:00:00Z"),ic:L[i][1]>L[i-1][1]?"📈":"📉",h:`${lab} line ${L[i-1][1]} → ${L[i][1]}`,s:"closing line, books"})}}}catch(e){}
  try{if(sp==="nba"&&NBA_LOGS[nm])for(const x of NBA_LOGS[nm].g.slice(-4))ev.push({d:x[1],t:Date.parse(x[1]+"T23:00:00Z"),ic:"🏀",h:`${x[3]==="H"?"vs":"@"} ${x[2]}: ${x[5]} pts, ${x[6]} reb, ${x[7]} ast`,s:`${x[4]} min${x[9]===1||x[9]===true?" · started":" · bench"}`});
    if(sp==="nhl"&&NHL_P[nm])for(const x of NHL_P[nm].g.filter(z=>z[16]!==1).slice(-4))ev.push({d:x[0],t:Date.parse(x[0]+"T23:00:00Z"),ic:"🏒",h:`${x[2]==="H"?"vs":"@"} ${x[1]}: ${x[3]} G, ${x[4]} A, ${x[6]} shots`,s:x[10]?`${Math.floor(x[10]/60)}:${String(x[10]%60).padStart(2,"0")} TOI`:""});
    if(sp==="nhl"&&NHL_G[nm])for(const x of NHL_G[nm].g.filter(z=>z[9]!==1&&z[7]).slice(-4))ev.push({d:x[0],t:Date.parse(x[0]+"T23:00:00Z"),ic:"🥅",h:`${x[2]==="H"?"vs":"@"} ${x[1]}: ${x[4]} saves on ${x[3]} shots`,s:x[3]?`${(x[4]/x[3]).toFixed(3).slice(1)} save %`:""})}catch(e){}
  if(!ev.length)return "";const now=Date.now();
  const td=typeof etNow!=="undefined"?etNow().d:new Date().toISOString().slice(0,10);
  const when=(t,d0)=>{if(d0){const n=Math.round((Date.parse(td)-Date.parse(d0))/864e5);return n<=0?"today":n===1?"yesterday":n+" days ago"}const d=(now-t)/864e5;return t>now?"now":d<1/24?"just now":d<1?Math.round(d*24)+" h ago":d<2?"yesterday":Math.round(d)+" days ago"};
  return `<div class="card xacard tlcard" style="margin-top:12px"><h2>🗞️ Timeline</h2><div class="xasub">News, injury status, line changes and his last games — newest first.</div>
   ${ev.sort((a,b)=>b.t-a.t).slice(0,12).map(x=>`<div class="tlr"><span class="tli">${x.ic}</span><div class="tlb"><div>${x.url?`<a href="${gpE(x.url)}" target="_blank" rel="noopener">${gpE(x.h)}</a>`:gpE(x.h)}</div>${x.s?`<div class="small">${gpE(x.s)}</div>`:""}</div><span class="small tlw">${when(x.t,x.d)}</span></div>`).join("")}</div>`}
function plTimelinePost(root){const h=decodeURIComponent((location.hash||"").slice(1));let sp=null,nm=null;
  if(h.startsWith("nba-player-")){sp="nba";nm=h.slice(11)}else if(h.startsWith("nhl-player-")){sp="nhl";nm=h.slice(11)}else if(h.startsWith("props/")){sp="nfl";nm=h.split("/")[1]}
  if(!sp||!nm||root.querySelector(".tlcard"))return;const put=()=>{if(root.querySelector(".tlcard"))return;const html=plTimeline(sp,nm);if(!html)return;const first=root.querySelector(".card");if(first)first.insertAdjacentHTML("afterend",html)};
  if(typeof LINE_HIST==="undefined"&&typeof xaHistEnsure!=="undefined")xaHistEnsure(put);else put();
  if(typeof newsLoad!=="undefined"&&NEWS&&!NEWS[sp])newsLoad(sp).then(()=>{const c=root.querySelector(".tlcard");if(c){c.remove();put()}})}

/* "what to watch" rows for the short version: the biggest name ruled out / doubtful, and the biggest prop line move today */
function gpWatch(sp,T){const out={},st=s=>/^(out|doubtful|injured reserve|ir\b)/i.test(s||"");let best=null;
  if(sp==="nba"&&typeof NBA_INJ!=="undefined")for(const t of T)for(const r of NBA_INJ[t]||[]){if(!st(r[2]))continue;const p=NBA_LOGS[r[0]];if(!p||!p.g.length)continue;const mn=nbaAvg(p,"min"),pt=nbaAvg(p,"pts");if(!best||mn>best.s)best={s:mn,t,txt:`<b>${gpE(r[0])}</b> (${gpE(t)}) — ${gpE(r[2])} · ${nbaF(mn)} min, ${nbaF(pt)} pts a game`}}
  if(sp==="nhl"&&typeof NHL_INJ!=="undefined")for(const t of T)for(const r of NHL_INJ[t]||[]){if(!st(r[2]))continue;const p=NHL_P[r[0]];if(!p||!p.s||!p.s[0])continue;const sc=p.s[3]/p.s[0];if(!best||sc>best.s)best={s:sc,t,txt:`<b>${gpE(r[0])}</b> (${gpE(t)}) — ${gpE(r[2])} · ${p.s[3]} pts in ${p.s[0]} games`}}
  if(sp==="nfl"&&typeof INJ!=="undefined"){const pr={QB:4,WR:3,RB:3,TE:2};for(const t of T)for(const r of INJ[t]||[]){if(!st(r[2]))continue;const sc=(pr[r[1]]||1)*10+((typeof USAGE_RAW!=="undefined"&&USAGE_RAW[r[0]]&&USAGE_RAW[r[0]].s&&USAGE_RAW[r[0]].s.snap)||0)/10;if(!best||sc>best.s)best={s:sc,t,txt:`<b>${gpE(r[0])}</b> (${gpE(t)} ${gpE(r[1])}) — ${gpE(r[2])}${r[3]?" · "+gpE(r[3]):""}`}}}
  if(best)out.inj=best.txt;
  if(typeof loMoves!=="undefined"){const tm=nm=>sp==="nba"?(NBA_LOGS[nm]||{}).tm:sp==="nhl"?((typeof nhWho!=="undefined"&&nhWho(nm))||{}).tm:(PINFO[nm]||{}).team;
    const m=loMoves(sp,60).find(x=>T.includes(tm(x.nm))&&x.dl);if(m){const lab=sp==="nba"?(NBA_MK[m.k]?NBA_MK[m.k][1]:m.k):sp==="nhl"?(NH_MK[m.k]?NH_MK[m.k][1]:m.k):(MARKETS[m.k]?MARKETS[m.k].n:m.k);
      out.mv=`<b>${gpE(m.nm)}</b> ${gpE(lab)}: ${m.l} → <b>${m.now}</b> <span class="small">${m.dl>0?"▲ books raised it — money / news on the over":"▼ books lowered it — money / news on the under"}</span>`}}
  return out}
