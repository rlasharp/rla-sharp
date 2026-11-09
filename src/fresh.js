/* ---------- 🔄 Fresh data: "updated X ago" chip + automatic refresh when a newer site update is out ----------
   Every site update writes version.json next to index.html. While the page is open we check it every 3 minutes
   (and whenever you come back to the tab). If a newer update is out we reload quietly when you're not using the
   page, otherwise a "tap to update" button appears. You stay on the same page and scroll spot. */
const FRESH={at:typeof BUILD_AT!=="undefined"?BUILD_AT:"",live:"",last:Date.now()};
function freshAge(iso){const m=Math.max(0,Math.round((Date.now()-Date.parse(iso))/60000));return m<1?"just now":m<60?m+" min ago":m<1440?Math.floor(m/60)+" h ago":Math.floor(m/1440)+" d ago"}
function freshNew(){return FRESH.live&&FRESH.at&&FRESH.live>FRESH.at}
function freshPaint(){const el=document.getElementById("fresh");if(!el||!FRESH.at)return;const m=(Date.now()-Date.parse(FRESH.at))/60000;
  const cls=freshNew()?"new":m<150?"ok":m<360?"old":"bad";el.className="fresh "+cls;el.hidden=false;
  el.innerHTML=`<span class="fdot"></span><span class="ftx">${freshNew()?"New data":`<span class="fpre">Updated </span>`+freshAge(FRESH.at)}</span>`;
  document.querySelectorAll(".freshtx").forEach(t=>{t.className="freshtx "+cls;t.textContent=freshNew()?"🔄 Newer data is out — tap to update":`Updated ${freshAge(FRESH.at)}`;t.onclick=freshNew()?freshGo:null});
  el.title=freshNew()?"A newer update is out — tap to load it":`Stats & results updated ${freshAge(FRESH.at)}${cls==="bad"?" — the automatic update may be stuck":""}. Live scores and odds refresh on their own.`}
function freshIdle(){return document.hidden||Date.now()-FRESH.last>90000}
["pointerdown","keydown","touchstart","wheel"].forEach(ev=>addEventListener(ev,()=>{FRESH.last=Date.now()},{passive:true}));
async function freshGo(){try{sessionStorage.setItem("freshY",JSON.stringify({h:location.hash,y:scrollY}));sessionStorage.setItem("freshTry",FRESH.live)}catch(e){}
  try{await fetch(location.pathname,{cache:"reload"})}catch(e){}   /* refresh the browser's saved copy, then reload */
  location.reload()}
async function freshCheck(){if(location.protocol==="file:"||!FRESH.at)return;
  try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(r.ok){const j=await r.json();if(j&&j.at)FRESH.live=j.at}}catch(e){}
  freshPaint();if(!freshNew())return;
  let tried="";try{tried=sessionStorage.getItem("freshTry")||""}catch(e){}
  const busy=document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||document.getElementById("agegate");
  if(tried!==FRESH.live&&freshIdle()&&!busy){freshGo();return}
  const lo=document.getElementById("loPill");if(lo)lo.remove();
  let b=document.getElementById("freshPill");if(!b){b=document.createElement("button");b.id="freshPill";b.onclick=()=>{b.textContent="Updating…";freshGo()};document.body.appendChild(b)}
  b.textContent="🔄 New results & stats — tap to update"}
window.addEventListener("load",()=>{
  try{const s=JSON.parse(sessionStorage.getItem("freshY")||"null");sessionStorage.removeItem("freshY");if(s&&s.h===location.hash&&s.y)setTimeout(()=>scrollTo(0,s.y),700)}catch(e){}
  const el=document.getElementById("fresh");if(el)el.onclick=e=>{e.preventDefault();if(freshNew())freshGo();else{el.classList.add("spin");freshCheck().finally(()=>setTimeout(()=>el.classList.remove("spin"),400))}};
  freshPaint();setTimeout(freshCheck,4000)});
setInterval(()=>{if(!document.hidden)freshCheck();else freshPaint()},180000);
setInterval(freshPaint,60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)freshCheck()});
