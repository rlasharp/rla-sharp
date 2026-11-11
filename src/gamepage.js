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
  if(inner&&inner.classList.contains("card")){const h2=inner.querySelector("h2");if(h2)h2.remove();b.className="gplzin";b.innerHTML=inner.innerHTML}else{b.className="gplzin";b.innerHTML=h}}
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
  if(typeof uxFoldCards!=="undefined")uxFoldCards()}
let GP_T=0;const gpSoon=()=>{clearTimeout(GP_T);GP_T=setTimeout(gpPost,60)};
window.addEventListener("load",()=>{gpSoon();try{new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))gpSoon()}).observe(document.querySelector("main")||document.body,{childList:true,subtree:true})}catch(e){}});
window.addEventListener("hashchange",gpSoon);

/* ---------- Today: one list of today's games, every sport, each with our pick ---------- */
function tdTv(t){const m=String(t||"").match(/(\d+):(\d+)\s*(AM|PM)/i);return m?((+m[1]%12)+(m[3].toUpperCase()==="PM"?12:0))*60+(+m[2]):9999}
function tdAllGames(){const R=[];const today=typeof etNow!=="undefined"?etNow().d:new Date().toISOString().slice(0,10);
  try{for(const g of (typeof NBA_SLATE!=="undefined"&&NBA_SLATE_DATE===today?NBA_SLATE:[])){if(nbaStarted(g))continue;const x=typeof nbaGamePick!=="undefined"?nbaGamePick(g):null,M=nbaModel(g.a,g.h);
    R.push({ic:"🏀",t:g.t,m:`${g.a} @ ${g.h}`,href:`#nba-game-${g.id}`,pick:x?`${x.txt} <span class="small">· ${Math.round(x.ch*100)}%</span>`:M?`${nbaShort(M.m>=0?g.h:g.a)} by ${Math.max(.5,Math.abs(M.m))} <span class="small">(estimate)</span>`:""})}}catch(e){}
  try{for(const g of (typeof NHL_SLATE!=="undefined"&&NHL_DATE===today?NHL_SLATE:[])){if(nhStarted(g))continue;const pr=nhProject(g);let pk="";
    if(pr){const hw=pr.hwin>=.5,w=hw?g.h:g.a;let ws=Math.round(hw?pr.lh:pr.la),ls=Math.round(hw?pr.la:pr.lh);if(ws<=ls)ws=ls+1;pk=`${nhTm(w)} ${ws}–${ls} <span class="small">· ${Math.round((hw?pr.hwin:1-pr.hwin)*100)}%</span>`}
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
