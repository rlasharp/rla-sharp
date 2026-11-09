/* ---------- 🔄 Fresh data: "updated X ago" chip + automatic refresh when a newer site update is out ----------
   Every site update writes version.json next to index.html. While the page is open we check it every 3 minutes
   (and whenever you come back to the tab). If a newer update is out we reload quietly when you're not using the
   page, otherwise a "tap to update" button appears. You stay on the same page and scroll spot. */
const FRESH={at:typeof BUILD_AT!=="undefined"?BUILD_AT:"",live:"",last:Date.now()};
function freshAge(iso){const m=Math.max(0,Math.round((Date.now()-Date.parse(iso))/60000));return m<1?"just now":m<60?m+" min ago":m<1440?Math.floor(m/60)+" h ago":Math.floor(m/1440)+" d ago"}
/* already reloaded for this version and the page is still older → the server copy can't get newer right now; don't nag again */
function freshStuck(){try{return !!FRESH.live&&sessionStorage.getItem("freshTry")===FRESH.live&&sessionStorage.getItem("freshFrom")===FRESH.at}catch(e){return false}}
function freshNew(){return !!(FRESH.live&&FRESH.at&&FRESH.live>FRESH.at)&&!freshStuck()}
function freshPaint(){const el=document.getElementById("fresh");if(!el||!FRESH.at)return;const m=(Date.now()-Date.parse(FRESH.at))/60000;
  const cls=freshNew()?"new":m<150?"ok":m<360?"old":"bad";
  for(const e of [el,document.getElementById("freshM")]){if(!e)continue;e.className=(e===el?"fresh ":"fresh freshm ")+cls;e.hidden=false;
    e.innerHTML=`<span class="fdot"></span><span class="ftx">${freshNew()?"New data — tap to update":`<span class="fpre">Updated </span>`+freshAge(FRESH.at)}</span>`}
  document.querySelectorAll(".freshtx").forEach(t=>{t.className="freshtx "+cls;t.textContent=freshNew()?"🔄 Newer data is out — tap to update":`Updated ${freshAge(FRESH.at)}`;t.onclick=freshNew()?freshGo:null});
  el.title=freshNew()?"A newer update is out — tap to load it":`Stats & results updated ${freshAge(FRESH.at)}${cls==="bad"?" — the automatic update may be stuck":""}. Live scores and odds refresh on their own.`}
function freshIdle(){return document.hidden||Date.now()-FRESH.last>90000}
["pointerdown","keydown","touchstart","wheel"].forEach(ev=>addEventListener(ev,()=>{FRESH.last=Date.now()},{passive:true}));
async function freshGo(){try{sessionStorage.setItem("freshY",JSON.stringify({h:location.hash,y:scrollY}));sessionStorage.setItem("freshTry",FRESH.live);sessionStorage.setItem("freshFrom",FRESH.at)}catch(e){}
  try{await fetch(location.pathname,{cache:"reload"})}catch(e){}   /* refresh the browser's saved copy, then reload */
  location.reload()}
async function freshCheck(){if(location.protocol==="file:"||!FRESH.at)return;
  try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(r.ok){const j=await r.json();if(j&&j.at)FRESH.live=j.at}}catch(e){}
  freshPaint();if(!freshNew()){const b=document.getElementById("freshPill");if(b)b.remove();return}
  let tried="";try{tried=sessionStorage.getItem("freshTry")||""}catch(e){}
  const busy=document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||document.getElementById("agegate");
  if(tried!==FRESH.live&&freshIdle()&&!busy){freshGo();return}
  const lo=document.getElementById("loPill");if(lo)lo.remove();
  let b=document.getElementById("freshPill");if(!b){b=document.createElement("button");b.id="freshPill";b.onclick=()=>{b.textContent="Updating…";freshGo()};document.body.appendChild(b)}
  b.textContent="🔄 New results & stats — tap to update"}
window.addEventListener("load",()=>{
  try{const s=JSON.parse(sessionStorage.getItem("freshY")||"null");sessionStorage.removeItem("freshY");if(s&&s.h===location.hash&&s.y)setTimeout(()=>scrollTo(0,s.y),700)}catch(e){}
  for(const el of [document.getElementById("fresh"),document.getElementById("freshM")])if(el)el.onclick=e=>{e.preventDefault();if(freshNew())freshGo();else{el.classList.add("spin");freshCheck().finally(()=>setTimeout(()=>el.classList.remove("spin"),400))}};
  freshPaint();setTimeout(freshCheck,4000)});
setInterval(()=>{if(!document.hidden)freshCheck();else freshPaint()},180000);
setInterval(freshPaint,60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)freshCheck()});

/* ⚠️ per-sport "data is late": every automatic run rebuilds the whole site, but each sport's data step can fail on its
   own (the old data is then kept). If the site was rebuilt well after a sport's last good data, that sport's step is
   failing — say so on that sport's pages. Uses only the timestamps the data files carry. */
function freshParseET(s){const m=String(s||"").match(/([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/);if(!m)return NaN;
  const mo="JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m[1])/3;if(mo<0)return NaN;let h=+m[3]%12+(m[5]==="PM"?12:0);
  const off=mo>=3&&mo<=9?4:mo===2||mo===10?(+m[2]>=8?(mo===2?4:5):(mo===2?5:4)):5;   /* ET: EDT mid-Mar..early Nov */
  const y=new Date().getUTCFullYear();let t=Date.UTC(y,mo,+m[2],h+off,+(m[4]||0));if(t>Date.now()+864e5)t=Date.UTC(y-1,mo,+m[2],h+off,+(m[4]||0));return t}
const FRESH_SP={nba:["NBA",()=>typeof NBA_GEN!=="undefined"?NBA_GEN:"",6],nhl:["NHL",()=>typeof NHL_GEN!=="undefined"?NHL_GEN:"",6],
  nfl:["NFL",()=>typeof MARKET_ASOF!=="undefined"?MARKET_ASOF:"",12],soc:["Soccer",()=>typeof SOC_GEN!=="undefined"?SOC_GEN:"",8]};
function freshLate(sp){const d=FRESH_SP[sp];if(!d||!FRESH.at)return null;const s=d[1]();if(!s)return null;const t=freshParseET(s),b=Date.parse(FRESH.at);
  if(!isFinite(t)||!isFinite(b))return null;const behind=(b-t)/36e5,age=(Date.now()-t)/36e5;return behind>=3&&age>=d[2]?{lab:d[0],s,age}:null}
function freshLateHtml(sps){const L=sps.map(freshLate).filter(Boolean);if(!L.length)return "";
  return `<div class="latenote">⚠️ ${L.map(x=>`<b>${x.lab}</b> data hasn't refreshed since ${x.s.replace(/^[A-Z][a-z]{2},?\s+/,"")}`).join(" · ")} — the automatic update for ${L.length>1?"these sports":"it"} is having trouble. Lines, live scores and other sports are still current; stats and props here may be a few hours old.</div>`}
function freshLateInject(){document.querySelectorAll(".latenote").forEach(e=>e.remove());const h=(location.hash||"#today").slice(1);
  const sps=h==="today"||h===""?["nfl","nba","nhl"]:/^nba/.test(h)?["nba"]:/^nhl/.test(h)?["nhl"]:/^soccer/.test(h)?["soc"]:/^(games|game-|props|plays|injuries|weeks)/.test(h)?["nfl"]:[];
  if(!sps.length)return;const html=freshLateHtml(sps);if(!html)return;
  const v=[...document.querySelectorAll("main > section, .view")].find(x=>x.offsetParent);const h1=v&&v.querySelector("h1");
  if(h1)h1.insertAdjacentHTML("afterend",html);else if(v)v.insertAdjacentHTML("afterbegin",html)}

/* 🆕 "What changed": the first time you open a newer version of the site, one line says what's new since the version you
   last saw — new props, lines that moved, injury status changes, new final scores. Counted by comparing this page's
   data with a small snapshot saved on this device (nothing is sent anywhere). */
function wnSnap(){const S={p:{},i:{},f:[]};
  try{if(typeof NBA_PROPS!=="undefined")for(const r of NBA_PROPS)S.p["b|"+r[0]+"|"+r[1]]=r[2]}catch(e){}
  try{if(typeof REAL_PROPS!=="undefined")for(const [k,v] of Object.entries(REAL_PROPS))if(v&&v[0]!=null)S.p["f|"+k]=v[0]}catch(e){}
  try{if(typeof NBA_INJ!=="undefined")for(const [t,a] of Object.entries(NBA_INJ))if(Array.isArray(a))for(const r of a)S.i["b|"+r[0]]=r[2]}catch(e){}
  try{if(typeof INJ!=="undefined")for(const a of Object.values(INJ))for(const r of a)S.i["f|"+r[0]]=r[2]}catch(e){}
  try{if(typeof NBA_RES!=="undefined")for(const r of NBA_RES)S.f.push("b"+r[0])}catch(e){}
  try{if(typeof SLATE!=="undefined")for(const g of SLATE)if(g.final)S.f.push("f"+g.away+g.home+(g.wk||""))}catch(e){}
  return S}
function wnDiff(o,n){const sp=k=>k[0]==="b"?"NBA":"NFL",c={};const add=(k,x)=>{(c[k]||(c[k]={NBA:0,NFL:0}))[x]++};
  const has=(m,s)=>Object.keys(m).some(k=>k[0]===s);
  for(const [k,v] of Object.entries(n.p)){if(!has(o.p,k[0]))continue;if(!(k in o.p))add("props",sp(k));else if(o.p[k]!==v)add("moves",sp(k))}
  for(const [k,v] of Object.entries(n.i)){if(!has(o.i,k[0]))continue;if(o.i[k]!==v)add("inj",sp(k))}
  for(const [k,v] of Object.entries(o.i))if(has(n.i,k[0])&&!(k in n.i))add("inj",sp(k));
  const of=new Set(o.f);for(const k of n.f)if(!of.has(k)&&o.f.some(x=>x[0]===k[0]))add("finals",k[0]==="b"?"NBA":"NFL");return c}
function wnText(c){const part=(k,one,many)=>{const v=c[k];if(!v)return [];return ["NBA","NFL"].filter(s=>v[s]).map(s=>`${v[s]} ${(v[s]===1?one:many).replace("@",s)}`)};
  return [...part("finals","@ final score","@ final scores"),...part("props","new @ prop","new @ props"),...part("moves","@ line moved","@ lines moved"),...part("inj","@ injury update","@ injury updates")]}
function wnRun(){if(!FRESH.at)return;let old=null;try{old=JSON.parse(localStorage.getItem("ge_wn")||"null")}catch(e){}
  const cur=wnSnap();if(old&&old.at===FRESH.at)return;
  try{localStorage.setItem("ge_wn",JSON.stringify({at:FRESH.at,...cur}))}catch(e){}
  if(!old||!old.p)return;const T=wnText(wnDiff(old,cur));if(!T.length)return;
  let b=document.getElementById("wnBar");if(!b){b=document.createElement("div");b.id="wnBar";document.body.appendChild(b)}
  b.innerHTML=`<span>🆕 <b>Since you last looked:</b> ${T.slice(0,5).join(" · ")}</span><button aria-label="Close">✕</button>`;
  const close=()=>{b.classList.remove("on");setTimeout(()=>b.remove(),300)};b.querySelector("button").onclick=close;b.onclick=e=>{if(e.target===b||e.target.closest("span"))close()};
  requestAnimationFrame(()=>b.classList.add("on"));setTimeout(close,15000)}
window.addEventListener("load",()=>setTimeout(()=>{if(!navigator.webdriver||window.WN_TEST)wnRun()},1500));
