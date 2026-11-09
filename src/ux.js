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
const UX_TOUR=[["🎯","How to read a prop","Every prop shows the <b>line</b> (Over 19.5 points), the <b>odds</b> (−128), and how often he'd have hit it — <b>“Hit 9 of last 10”</b>. The bar fills with his hit rate. Tap any prop for charts, game logs and alt lines."],
 ["📈","Our chance vs. the odds","<b>Our chance</b> is our estimate that the bet wins. <b>Odds need</b> is the chance the price implies (−128 needs 56%). When our chance beats what the odds need, that gap is the <b>edge</b> — bigger is better. Leans, not guarantees."],
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
