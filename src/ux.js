/* ---------- Ease of use: theme switch, remembered filters, first-visit tour, "show all stats" ---------- */

/* 🌓 theme: Auto (follows the phone) / Light / Dark — the switch itself lives in the <head> script (setTheme) */
function uxThemeSeg(){const t=typeof getTheme!=="undefined"?getTheme():"auto";
  return `<div class="seg" id="uxTheme">${[["auto","🌓 Auto"],["light","☀️ Light"],["dark","🌙 Dark"]].map(([k,l])=>`<button data-theme-set="${k}" class="${t===k?"on":""}">${l}</button>`).join("")}</div>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-theme-set]");if(!b||typeof setTheme==="undefined")return;
  setTheme(b.dataset.themeSet);document.querySelectorAll("[data-theme-set]").forEach(x=>x.classList.toggle("on",x.dataset.themeSet===b.dataset.themeSet));uxThemeBtn()});
function uxThemeBtn(){const b=document.getElementById("themeBtn");if(!b||typeof getTheme==="undefined")return;const t=getTheme();
  b.textContent=t==="light"?"☀️":t==="dark"?"🌙":"🌓";b.title=`Theme: ${t==="auto"?"Auto (follows your device)":t} — tap to change`}
function uxThemeCycle(){const t=getTheme(),n=t==="auto"?"light":t==="light"?"dark":"auto";setTheme(n);uxThemeBtn();if(typeof toast!=="undefined")toast(n==="auto"?"Theme: Auto (follows your device)":n==="light"?"Light theme":"Dark theme")}

/* 💾 remembered filters (best-props filters for each sport). The game filter is not kept — games change daily. */
const UXF={nba:()=>typeof NB!=="undefined"?(NB.bf||(NB.bf={})):null,nhl:()=>typeof NH!=="undefined"?(NH.bf||(NH.bf={})):null,nfl:()=>typeof NFL_BF!=="undefined"?NFL_BF:null};
function uxFiltLoad(){const S=(typeof LS!=="undefined"&&LS.get("filters",{}))||{};for(const sp in UXF){const o=UXF[sp]();if(!o||!S[sp])continue;for(const [k,v] of Object.entries(S[sp]))if(k!=="g")o[k]=v}}
function uxFiltSave(){const S={};for(const sp in UXF){const o=UXF[sp]();if(!o)continue;const c={};for(const [k,v] of Object.entries(o))if(k!=="g"&&v)c[k]=v;S[sp]=c}try{LS.set("filters",S)}catch(e){}}
function uxFiltOn(sp){const o=UXF[sp]&&UXF[sp]();return !!o&&Object.entries(o).some(([k,v])=>v&&v!=="")}
/* "✕ Reset filters" chip — put inside each filter bar */
function xResetChip(sp){return uxFiltOn(sp)?`<button class="btn xreset" data-freset="${sp}">✕ Reset filters</button>`:""}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-freset]");if(!b)return;e.preventDefault();const o=UXF[b.dataset.freset]&&UXF[b.dataset.freset]();
  if(o)for(const k of Object.keys(o))o[k]="";uxFiltSave();const y=scrollY;if(typeof route!=="undefined")route();scrollTo(0,y)});
document.addEventListener("change",e=>{if(e.target.closest&&e.target.closest("[data-bf],[data-nbf],[data-nhbf]"))setTimeout(uxFiltSave,0)},true);
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest(".bfil [data-hot],.bfil button"))setTimeout(uxFiltSave,0)},true);

/* 📊 player pages: the key numbers first, the deep stats behind one "Show all stats" button (remembered) */
const UX_DEEP=/where he (scores|shoots)|shot (map|types)|game log|bio\b/i;
function uxCollapse(){const h=(location.hash||"").slice(1);if(!/^(nba-player-|nhl-player-)/.test(h))return;
  const v=document.getElementById(h.startsWith("nba")?"v-nba":"v-nhl");if(!v||v.querySelector(".uxmore"))return;
  const deep=[...v.children].filter(c=>c.tagName!=="DETAILS"&&(c.classList.contains("pbio")||UX_DEEP.test(((c.querySelector("h2,h3")||{}).textContent||""))));
  if(!deep.length)return;const open=LS.get("allstats",false);
  const btn=document.createElement("button");btn.className="btn uxmore";
  const set=o=>{deep.forEach(c=>c.hidden=!o);btn.innerHTML=o?"▲ Show fewer stats":`📊 Show all stats <span class="small">(${deep.length} more section${deep.length>1?"s":""}: ${deep.map(c=>((c.querySelector("h2,h3")||{}).textContent||"Bio").replace(/^[^A-Za-z]+/,"").trim()).filter(Boolean).slice(0,3).join(", ")})</span>`};
  btn.onclick=()=>{const o=deep[0].hidden;LS.set("allstats",o);set(o);if(!o)btn.scrollIntoView({block:"center"})};
  deep[0].before(btn);set(open)}

/* 👋 first visit: three quick cards (after the age check). Betting 101 can show it again. */
const UX_TOUR=[["🎯","How to read a prop","Every prop shows the <b>line</b> (Over 19.5 points), the <b>odds</b> (−128), how often he'd have hit it — <b>“Hit 9 of last 10”</b> — and a one-line <b>verdict</b>: ✅ Leans over when most signals agree, ➖ Mixed when they don't."],
 ["📈","Our chance vs. the odds","<b>Our chance</b> (and the NBA <b>📐 projection</b>) is our estimate that the bet wins. <b>Odds need</b> is the chance the price implies (−128 needs 56%). When our chance beats it, that gap is the <b>edge</b>. Leans, not guarantees."],
 ["📐","Dig deeper when you want","Open <b>📐 Deeper splits</b> on any prop for tabs: Projection · Matchup · Role · History. Game pages start with <b>🔑 Key takeaways</b>, and long pages have a <b>☰ Jump to</b> button. Tap any chart bar to see that game."],
 ["🎟️","Track your bets","Tap <b>＋</b> on any prop or game line to save it to <b>My Bets</b>. Bets grade themselves after the game — usually within minutes of the final. Everything stays on this device."]];
function uxTour(force){if(!force&&(LS.get("tour_done",false)||navigator.webdriver))return;let i=0;
  const d=document.createElement("div");d.id="uxtour";document.body.appendChild(d);
  const draw=()=>{const [ic,t,x]=UX_TOUR[i];d.innerHTML=`<div class="uxtb"><div class="uxti">${ic}</div><h2>${t}</h2><p>${x}</p>
    <div class="uxdots">${UX_TOUR.map((_,j)=>`<i class="${j===i?"on":""}"></i>`).join("")}</div>
    <div class="uxbtns"><button class="btn" data-ux="skip">${i<UX_TOUR.length-1?"Skip":"Close"}</button><button class="btn pri" data-ux="next">${i<UX_TOUR.length-1?"Next →":"Got it"}</button></div></div>`};
  const done=()=>{LS.set("tour_done",true);d.remove()};
  d.onclick=e=>{const b=e.target.closest("[data-ux]");if(e.target===d)return done();if(!b)return;if(b.dataset.ux==="skip")return done();if(++i>=UX_TOUR.length)return done();draw()};draw()}
function uxTourWhenReady(){if(LS.get("tour_done",false)||navigator.webdriver)return;let n=0;const t=setInterval(()=>{if(++n>120)return clearInterval(t);if(!document.getElementById("agegate")&&LS.get("age_ok",false)){clearInterval(t);setTimeout(uxTour,500)}},1000)}

/* tab bar badge: open bets */
function uxBetsCount(){try{return betsLoad().filter(b=>gradeBet(b).r==="pending").length}catch(e){return 0}}

window.addEventListener("load",()=>{uxThemeBtn();const tb=document.getElementById("themeBtn");if(tb)tb.onclick=uxThemeCycle;uxTourWhenReady();
  const mt=document.querySelector('meta[name=theme-color]');if(mt&&document.documentElement.dataset.theme==="light")mt.content="#f6f7f9"});

/* ☰ Jump to: on long pages, a floating button listing the sections currently on screen */
function uxJumpList(){const v=[...document.querySelectorAll("main > section, .view")].find(x=>x.offsetParent)||document;
  return [...v.querySelectorAll(".card > h2, .section > h2, h2.tsh, details.drawer > summary")].filter(h=>h.offsetParent&&!h.closest("#moresheet,#uxjump,details.xa")&&h.textContent.trim().length>1)}
function uxJump(){let b=document.getElementById("uxjumpb");const n=uxJumpList().length;
  if(n<5){if(b)b.hidden=true;return}
  if(!b){b=document.createElement("button");b.id="uxjumpb";b.textContent="☰ Jump to";b.onclick=uxJumpOpen;document.body.appendChild(b)}b.hidden=false}
function uxJumpOpen(){const L=uxJumpList();let s=document.getElementById("uxjump");if(!s){s=document.createElement("div");s.id="uxjump";document.body.appendChild(s)}
  s.innerHTML=`<div class="ujback"></div><div class="ujpanel"><div class="msgrab"></div><h3>Jump to</h3>${L.map((h,i)=>`<button data-uj="${i}">${(h.textContent||"").replace(/[›ⓘ]/g,"").replace(/\s+/g," ").trim().slice(0,60)}</button>`).join("")}<button class="btn" data-ujx="1" style="width:100%;margin-top:10px">Close</button></div>`;
  s.className="open";const close=()=>{s.className=""};s.querySelector(".ujback").onclick=close;s.querySelector("[data-ujx]").onclick=close;
  s.querySelectorAll("[data-uj]").forEach(x=>x.onclick=()=>{const h=L[+x.dataset.uj];close();if(h){const y=h.getBoundingClientRect().top+scrollY-(innerWidth<700?150:90);scrollTo({top:y,behavior:"smooth"});if(h.tagName==="SUMMARY"&&!h.parentElement.open)h.parentElement.open=true}})}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-nhtab],[data-nbgt],[data-nfgt],[data-xinst],[data-tt]"))setTimeout(uxJump,80)},true);

/* 👁 Simple / Detailed view: Simple hides the deep-dive extras (they stay one tap away by switching back) */
function uxViewGet(){try{return LS.get("view","detailed")}catch(e){return "detailed"}}
function uxViewApply(){const v=uxViewGet();document.body.classList.toggle("simple",v==="simple");const b=document.getElementById("viewBtn");if(b){b.textContent=v==="simple"?"Simple":"Detailed";b.title=v==="simple"?"Simple view — tap for all the details":"Detailed view — tap for a simpler page"}
  document.querySelectorAll("[data-view-set]").forEach(x=>x.classList.toggle("on",x.dataset.viewSet===v))}
function uxViewSeg(){const v=uxViewGet();return `<div class="seg">${[["simple","✨ Simple"],["detailed","🔬 Detailed"]].map(([k,l])=>`<button data-view-set="${k}" class="${v===k?"on":""}">${l}</button>`).join("")}</div><div class="small" style="margin-top:4px">Simple shows the verdict, projection and odds; Detailed adds every split, chart and analysis card.</div>`}
function uxViewSet(v){try{LS.set("view",v)}catch(e){}uxViewApply();if(typeof toast!=="undefined")toast(v==="simple"?"Simple view — just the essentials":"Detailed view — everything");if(typeof uxJump!=="undefined")setTimeout(uxJump,50)}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-view-set]");if(b){uxViewSet(b.dataset.viewSet);return}if(e.target.closest&&e.target.closest("#viewBtn"))uxViewSet(uxViewGet()==="simple"?"detailed":"simple")});
uxViewApply();window.addEventListener("load",uxViewApply);

/* 💾 save a generated file. Inside the Claude viewer downloads go through its "downloads" capability (the viewer
   confirms); on the normal website it's a plain browser download. Returns "saved" | "declined" | "failed". */
const UX_DL=(()=>{try{return window.claude&&window.claude.use?window.claude.use("downloads").catch(()=>null):null}catch(e){return null}})();
async function uxSave(blob,name){
  const d=UX_DL?await UX_DL:null;
  if(d){try{await d.save({filename:name,data:blob});return "saved"}catch(e){if(e&&(e.code==="declined"||e.code==="rate_limited"))return "declined";if(typeof toast!=="undefined")toast("Saving isn't available here — press and hold the image instead");return "failed"}}
  try{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);return "saved"}catch(e){return "failed"}}
