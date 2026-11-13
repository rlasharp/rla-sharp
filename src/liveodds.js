/* ---------- ⚡ Live odds from data/live_odds.json (GitHub Action + PropLine, every ~30 min) ----------
   Merges real sportsbook lines into NBA_PROPS / REAL_PROPS, keeps the open line to show ▲▼ moves.
   The bundled daily data stays as the fallback when the file is missing (e.g. the private copy). */
const LO={data:null,move:{},alt:{},pick:{},openAlt:null,applied:0,nba:0,nfl:0};
function loNorm(s){return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g,"").replace(/[^a-z]/g,"")}
let LO_IDX=null;
function loIdx(){if(LO_IDX)return LO_IDX;const nba={},nfl={};
  if(typeof NBA_LOGS!=="undefined")for(const nm in NBA_LOGS)nba[loNorm(nm)]=nm;
  if(typeof PINFO!=="undefined")for(const nm in PINFO)nfl[loNorm(nm)]=nm;
  return LO_IDX={nba,nfl}}
function loMoveTag(nm,k,line){if(LO.pick[nm+"|"+k]!=null)return loAltChip(nm,k);const m=LO.move[nm+"|"+k];if(!m)return "";
  if(m.l!=null&&m.l!==line)return `<span class="lmv ${line>m.l?"up":"dn"}" title="Opened at ${m.l} today">${line>m.l?"▲":"▼"} from ${m.l}</span>`;
  if(m.o!=null&&m.oNow!=null&&Math.abs(m.oNow-m.o)>=10)return `<span class="lmv fl" title="Over price opened ${m.o>0?"+":""}${m.o}">price ${m.oNow>m.o?"↑":"↓"} ${m.o>0?"+":""}${m.o}→${m.oNow>0?"+":""}${m.oNow}</span>`;
  return ""}
function loApply(d){const n_=loApply0(d);loDropOut();return n_}
function loApply0(d){
  const I=loIdx();let nNba=0,nNfl=0;LO.move={};LO.alt={};
  const nb=d.nba||{},nf=d.nfl||{};
  if(typeof NBA_PROPS!=="undefined"&&nb.props&&typeof NBA_SLATE_DATE!=="undefined"){
    const today=new Set((nb.events||[]).filter(e=>e.date===NBA_SLATE_DATE).map(e=>String(e.id)));
    const pos={};NBA_PROPS.forEach((r,i)=>pos[r[0]+"|"+r[1]]=i);
    for(const r of nb.props){if(!today.has(String(r[13])))continue;const nm=I.nba[loNorm(r[0])];if(!nm||!NBA_MK[r[1]])continue;
      const row=[nm,r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9]];while(row.length&&row[row.length-1]==null&&row.length>6)row.pop();
      const k=nm+"|"+r[1];if(k in pos)NBA_PROPS[pos[k]]=row;else{pos[k]=NBA_PROPS.length;NBA_PROPS.push(row)}
      LO.move[k]={l:r[10],o:r[11],u:r[12],oNow:r[3],uNow:r[4],now:r[2],sp:"nba",nm,k:r[1]};if(Array.isArray(r[14])&&r[14].length)LO.alt[k]=r[14];nNba++}
    if(typeof NB!=="undefined"){NB._best=null}
  }
  if(typeof REAL_PROPS!=="undefined"&&nf.props&&typeof SLATE!=="undefined"){
    const teams=new Set(SLATE.filter(g=>!g.final).flatMap(g=>[g.away,g.home]));
    /* only use each player's line for his CURRENT game (e.g. tonight's Monday night game, not next week's) */
    const full=t=>(TEAMS[t]&&TEAMS[t][0]||"").toLowerCase(),evOK={};
    for(const e of nf.events||[])evOK[String(e.id)]=[String(e.home||"").toLowerCase(),String(e.away||"").toLowerCase()];
    const curEv=nm=>{const P=PINFO[nm],o=P&&typeof oppOf!=="undefined"&&oppOf(P.team);return o?[full(o.g.home),full(o.g.away)]:null};
    for(const r of nf.props){const nm=I.nfl[loNorm(r[0])];if(!nm||!MARKETS[r[1]])continue;const P=PINFO[nm];if(!P||!teams.has(P.team))continue;
      const ev=evOK[String(r[13])],ce=curEv(nm);if(ev&&ce&&!(ev[0]===ce[0]&&ev[1]===ce[1]))continue;
      if(typeof pLogs!=="undefined"&&!pLogs(nm).length)continue;
      REAL_PROPS[nm+"|"+r[1]]=[r[2],r[3],r[4],r[5]];LO.move[nm+"|"+r[1]]={l:r[10],o:r[11],u:r[12],oNow:r[3],uNow:r[4],now:r[2],sp:"nfl",nm,k:r[1]};if(Array.isArray(r[14])&&r[14].length)LO.alt[nm+"|"+r[1]]=r[14];nNfl++}
    if(typeof NFL_BEST_C!=="undefined")NFL_BEST_C=null;
  }
  let nNhl=0;const nh=d.nhl||{};
  if(typeof NHL_PROPS!=="undefined"&&nh.props&&typeof NHL_DATE!=="undefined"&&NHL_DATE){
    const days=new Set([NHL_DATE,NHL_TOM]),evd={};for(const e of nh.events||[])evd[String(e.id)]=e.date;
    const idx={};for(const nm of [...Object.keys(NHL_P),...Object.keys(NHL_G)])idx[loNorm(nm)]=nm;
    const pos={};NHL_PROPS.forEach((r,i)=>pos[r[0]+"|"+r[1]]=i);
    for(const r of nh.props){if(!days.has(evd[String(r[13])]))continue;const nm=idx[loNorm(r[0])];if(!nm)continue;
      const row=[nm,r[1],r[2],r[3],r[4],r[5]],k=nm+"|"+r[1];if(k in pos)NHL_PROPS[pos[k]]=row;else{pos[k]=NHL_PROPS.length;NHL_PROPS.push(row)}
      LO.move[k]={l:r[10],o:r[11],u:r[12],oNow:r[3],uNow:r[4],now:r[2],sp:"nhl",nm,k:r[1]};if(Array.isArray(r[14])&&r[14].length)LO.alt[k]=r[14];nNhl++}
    const full={};for(const [a,t] of Object.entries(NHL_TEAM))full[t.n]=a;
    for(const e of nh.events||[]){const a=full[e.away],h=full[e.home];const g=[...NHL_SLATE,...NHL_NEXT].find(x=>x.a===a&&x.h===h&&x.d===e.date);if(g)for(const k of ["ml","tot","pl"])if(e[k])g[k]=e[k]}
  }
  const nSoc=typeof socLoApply!=="undefined"?socLoApply(d):0;
  LO.nba=nNba;LO.nfl=nNfl;LO.nhl=nNhl;LO.soc=nSoc;return nNba+nNfl+nNhl+nSoc}
function loAgo(){if(!LO.data)return "";const m=Math.max(0,Math.round((Date.now()-Date.parse(LO.data.updated))/60000));return m<1?"just now":m<60?m+" min ago":Math.round(m/60)+" h ago"}
function loBadge(){return LO.data&&(LO.nba||LO.nfl)?`<div class="upd lo">⚡ Live sportsbook odds · updated <b>${loAgo()}</b> · ${LO.nba?LO.nba+" NBA":""}${LO.nba&&LO.nfl?" + ":""}${LO.nfl?LO.nfl+" NFL":""} lines</div>`:""}
/* full redraw; with an alt key, keep that prop's − / + exactly where it was on screen so the page doesn't jump */
function loRerender(key){const y=scrollY,fb=key?[...document.querySelectorAll(".alsb")].find(b=>b.dataset.altkey===key&&b.offsetParent):null,top=fb?fb.getBoundingClientRect().top:null;
  if(typeof route==="function")route();scrollTo(0,y);
  if(fb){const nb=[...document.querySelectorAll(".alsb")].find(b=>b.dataset.altkey===key&&b.offsetParent);if(nb)scrollBy(0,nb.getBoundingClientRect().top-top)}}
async function loFetch(first){
  if(location.protocol==="file:")return;
  try{const r=await fetch("data/live_odds.json",{cache:"no-store"});if(!r.ok)return;const d=await r.json();if(!d||!d.updated)return;
    if(LO.data&&LO.data.updated===d.updated)return;
    LO.data=d;const n=loApply(d);if(!n)return;
    if(first||!LO.applied){LO.applied=1;loRerender();return}
    let b=document.getElementById("loPill");if(!b){b=document.createElement("button");b.id="loPill";document.body.appendChild(b);b.onclick=()=>{b.remove();loRerender()}}
    b.textContent="🔄 New odds — tap to update";
  }catch(e){}}
window.addEventListener("load",()=>{setTimeout(()=>loFetch(true),300);setInterval(()=>loFetch(false),5*60*1000)});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loFetch(false)});

/* ---------- 🪜 Alternate lines (other lines books post for the same prop; best price per line across books) ----------
   vals = his recent results for this stat (oldest→newest) so each rung shows how often it would have hit. */
/* picked alt line (tap a row): the charts, hit rates and odds on that prop switch to it; tap main to go back */
function loAltOdds(nm,k){const key=nm+"|"+k,p=LO.pick[key];if(p==null)return null;const r=(LO.alt[key]||[]).find(x=>x[0]===p);
  return r?{line:p,o:r[1],ob:r[2],u:r[3],ub:r[4]}:{line:p,o:null,ob:null,u:null,ub:null}}
function loLine(nm,k,line){const a=loAltOdds(nm,k);return a?a.line:line}
/* − / + stepper: walks the real alt ladder when books post one, otherwise moves the line by 1 (5 for yards; no odds for those) */
function loStep(nm,k,main){if(main==null||!Number.isFinite(+main))return "";const key=esc(nm+"|"+k),cur=loLine(nm,k,main);
  const b=(d,t)=>`<button class="alsb" data-altkey="${key}" data-main="${main}" onclick="event.stopPropagation();loAltStep(this.dataset.altkey,${d},+this.dataset.main,this)" title="${t}" aria-label="${t}">${d<0?"−":"+"}</button>`;
  return `<span class="alst">${b(-1,"Lower the line")}${b(1,"Raise the line")}</span>`}
function loAltStep(key,d,main,btn){const cur=LO.pick[key]!=null?LO.pick[key]:main,k=key.split("|").pop();d=d*(/Yds$|^rushRec$/.test(k)?5:1);
  const L=[...new Set([main,...(LO.alt[key]||[]).map(r=>r[0])])].sort((a,b)=>a-b);let nx;
  if(L.length>1){const i=L.findIndex(x=>x===cur);nx=i<0?(d>0?L.find(x=>x>cur):[...L].reverse().find(x=>x<cur)):L[i+Math.sign(d)];
    if(nx==null)nx=cur+d}
  else nx=cur+d;
  nx=Math.round(nx*2)/2;if(nx<0)return;
  /* rebuilding the whole page costs ~200 ms on a phone, so quick taps lagged: show the new number right away (odds/hit rates dim)
     and rebuild once, when the taps stop */
  if(nx===main)delete LO.pick[key];else LO.pick[key]=nx;
  if(btn){const st=btn.closest(".alst"),box=st&&st.parentElement,card=btn.closest(".card,.pl")||box;
    const v=box&&box.classList.contains("pcv")?[...box.childNodes].find(n=>n.nodeType===3):st&&st.previousElementSibling&&st.previousElementSibling.classList.contains("plv")?st.previousElementSibling:null;
    if(v)v.textContent=String(nx);if(card)card.classList.add("lopend")}
  clearTimeout(LO.stepT);LO.stepT=setTimeout(()=>{if(!loSwapCards(key))loRerender(key)},btn?250:0)}
/* redraw only the card(s) for this prop (NBA prop cards) instead of the whole page: no lag, and nothing else moves */
/* redraw only what shows this prop — the NBA prop cards and the one-line rows on game / player pages (NBA, NHL, NFL) —
   instead of the whole page: no lag, nothing else moves. Falls back to the full redraw for anything else. */
function loSwapCards(key){try{
  const B=[...document.querySelectorAll(".alsb")].filter(b=>b.dataset.altkey===key);if(!B.length)return false;
  const H=new Set();for(const b of B){const h=b.closest('.card.prop[id^="pc_"],.pl[data-lrow]');if(!h)return false;H.add(h)}
  const i=key.lastIndexOf("|"),nm=key.slice(0,i),k=key.slice(i+1),plan=[];
  for(const h of H){let html=null,wire=null;
    if(h.classList.contains("prop")){if(typeof nbaPropCard==="undefined")return false;const r=NBA_PROPS.find(x=>x[0]===nm&&x[1]===k);if(!r)return false;
      html=nbaPropCard(r,/_p$/.test(h.id)?100:0);wire=n=>{if(typeof nbaWireCharts!=="undefined")nbaWireCharts(n,()=>loRerender(key));if(typeof nbaWireBest!=="undefined")nbaWireBest(n)}}
    else{const sp=h.dataset.lrow.split("|")[0];
      /* rows whose inner parts were wired one by one (not by the page-wide click handler) need the page's own wiring */
      if([...h.querySelectorAll("*")].some(e=>e.onclick&&!e.hasAttribute("onclick")))return false;
      if(sp==="nba"&&typeof nbaLineRow!=="undefined"){const r=NBA_PROPS.find(x=>x[0]===nm&&x[1]===k);if(!r)return false;html=nbaLineRow(nm,r)}
      else if(sp==="nhl"&&typeof nhLineRow!=="undefined"&&typeof NHL_PROPS!=="undefined"){const r=NHL_PROPS.find(x=>x[0]===nm&&x[1]===k);if(!r)return false;html=nhLineRow(nm,r)}
      else if(sp==="nfl"&&typeof nflLineRow!=="undefined"&&typeof PINFO!=="undefined"&&PINFO[nm]){html=nflLineRow(PINFO[nm],k)}
      else return false;
      const oc=h.onclick,jump=h.hasAttribute("data-jump");wire=n=>{if(oc)n.onclick=oc;if(!jump)n.removeAttribute("data-jump")}}
    plan.push([h,html,wire])}
  for(const [h,html,wire] of plan){const w=document.createElement("div");w.innerHTML=html;const n=w.firstElementChild;if(!n)return false;h.replaceWith(n);wire(n)}
  return true}catch(e){return false}}
/* no book price at this alt line: a fair price from how often he cleared it in his last 20 games (shrunk toward 50/50
   for small samples) — what the over / under "should" pay, to compare with your own book */
function loFair(nm,k,line){let V=[];
  try{if(typeof NBA_MK!=="undefined"&&NBA_MK[k]&&typeof nbaAllG!=="undefined")V=nbaAllG(nm).slice(-20).map(o=>nbaVal(o.x,k));
    else if(typeof NH_MK!=="undefined"&&NH_MK[k]&&typeof nhVals!=="undefined")V=nhVals(nm,k).slice(-20).map(o=>o.v);
    else if(typeof MARKETS!=="undefined"&&MARKETS[k]&&typeof pLogs!=="undefined")V=pLogs(nm).filter(l=>Number.isFinite(stat(l,k))).slice(-20).map(l=>stat(l,k))}catch(e){}
  V=V.filter(Number.isFinite);if(V.length<5||line==null)return null;const o=V.filter(v=>v>line).length,u=V.filter(v=>v<line).length,n=V.length;
  const po=(o+1)/(n+2),pu=(u+1)/(n+2),am=p=>p>=.5?-Math.round(p/(1-p)*100):Math.round((1-p)/p*100);
  return {o,u,n,po,pu,ao:am(po),au:am(pu)}}
function loFairTxt(nm,k,line){const F=loFair(nm,k,line);if(!F)return "";const f=x=>typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x;
  return `<span class="altfair" title="No book price at this line. Fair price = how often he went over / under it in his last ${F.n} games (${F.o} over, ${F.u} under), adjusted a little toward 50/50 for the small sample. A book paying better than this is value.">⚖️ Fair: O <b>${f(F.ao)}</b> · U <b>${f(F.au)}</b> <span class="small">(${F.o}/${F.n} over)</span></span>`}
function loAltChip(nm,k){const a=loAltOdds(nm,k);if(!a)return "";
  return `${a.o==null&&a.u==null?loFairTxt(nm,k,a.line):""}<span class="altc">🪜 Alt line${a.o==null&&a.u==null?" · no book odds":""}<button class="altx" data-altkey="${esc(nm+"|"+k)}" onclick="event.stopPropagation();loAltPick(this.dataset.altkey,null)" title="Back to the main line">✕ main</button></span>`}
function loAltPick(key,line,keepClosed){if(line==null)delete LO.pick[key];else LO.pick[key]=line;LO.openAlt=keepClosed?LO.openAlt:key;if(!loSwapCards(key))loRerender(key)}
/* every new page starts from the normal (main) line */
window.addEventListener("hashchange",()=>{clearTimeout(LO.stepT);LO.pick={};LO.openAlt=null});
function loAltClick(e){e.stopPropagation();const tr=e.target.closest("[data-alt]");if(!tr)return;
  const key=tr.dataset.alt,l=tr.dataset.l===""?null:+tr.dataset.l;loAltPick(key,LO.pick[key]===l?null:l)}
/* bet spec for one alt rung (track / parlay): the normal prop spec with the alt line, price and book */
function loAltSpec(nm,k,l,side,odds,book){if(odds==null)return null;let s=null;
  try{if(typeof NBA_MK!=="undefined"&&NBA_MK[k])s=nbaSpec(nm,k,side);else if(typeof NH_MK!=="undefined"&&NH_MK[k])s=nhlSpec(nm,k,side);else if(typeof MARKETS!=="undefined"&&MARKETS[k])s=specProp(nm,k,side)}catch(e){}
  return s?Object.assign({},s,{line:l,odds,book:book||s.book,alt:1}):null}
function loAltSp(k){return typeof NBA_MK!=="undefined"&&NBA_MK[k]?"nba":typeof NH_MK!=="undefined"&&NH_MK[k]?"nhl":"nfl"}
/* every game we have for this stat, oldest → newest, with a this-season flag (for the hit-rate heatmap) */
function loSeries(nm,k){let V=[];try{if(typeof NBA_MK!=="undefined"&&(NBA_MK[k]||k==="dd")&&typeof nbaAllG!=="undefined")V=nbaAllG(nm).map(o=>({v:nbaVal(o.x,k),c:!o.prev}));
    else if(typeof NH_MK!=="undefined"&&NH_MK[k]&&typeof nhVals!=="undefined")V=nhVals(nm,k).map(o=>({v:o.v,c:!o.prev}));
    else if(typeof MARKETS!=="undefined"&&MARKETS[k]&&typeof pLogs!=="undefined")V=pLogs(nm).filter(l=>Number.isFinite(stat(l,k))).map(l=>({v:stat(l,k),c:l.season===CUR}))}catch(e){}
  return V.filter(o=>Number.isFinite(o.v))}
function loHeatCell(V,l){if(!V.length)return `<td class="hm na">–</td>`;const h=V.filter(v=>v>l).length/V.length;return `<td class="hm" style="background:hsl(${Math.round(h*120)},62%,${40+(1-Math.abs(h-.5)*2)*8}%)" title="${V.filter(v=>v>l).length}/${V.length} over">${Math.round(h*100)}</td>`}
function loAltHtml(nm,k,line,vals){
  const key=nm+"|"+k,A=LO.alt[key];if(!A||!A.length)return "";
  const pr=x=>x==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x);
  const AB={DraftKings:"DK",FanDuel:"FD",BetMGM:"MGM",Caesars:"CZR",Fanatics:"FAN","ESPN BET":"ESPN",BetRivers:"BR","Hard Rock Bet":"HR",Unibet:"UNI"};
  const bk=b=>b?`<span class="alb" title="${esc(b)}">${esc(AB[b]||b)}</span>`:"",mv=LO.move[key]||{},main=mv.now!=null?mv.now:line,pick=LO.pick[key];
  const V=(vals||[]).filter(Number.isFinite),R=[...A,[main,mv.oNow,null,mv.uNow,null,1]].sort((a,b)=>a[0]-b[0]);
  const SR=loSeries(nm,k),SZ=SR.filter(o=>o.c),HV=[["L5",SR.slice(-5),1],["L10",SR.slice(-10),SR.length>=8],["L20",SR.slice(-20),SR.length>=15],["Szn",SZ,SZ.length>=3]].filter(x=>x[2]).map(([l,a])=>[l,a.map(o=>o.v)]),heat=SR.length>=5;
  const hit=l=>{if(!V.length)return "";const o=V.filter(v=>v>l).length,p=o/V.length;return `<span class="${p>=.5?"up":"dn"}">${o}/${V.length}</span>`};
  const ak=esc(key),open=LO.openAlt===key,bestHtml=(()=>{if(V.length<5)return "";const imp=o=>o==null?null:o<0?-o/(-o+100):100/(o+100);let best=null;
      for(const r of R){for(const [i,side] of [[1,"o"],[3,"u"]]){const pr=r[i];if(pr==null)continue;const h=V.filter(v=>side==="o"?v>r[0]:v<r[0]).length/V.length,val=h-imp(pr);if(val>.06&&(!best||val>best.val))best={l:r[0],side,pr,val,h}}}
      if(best)R.forEach(r=>{if(r[0]===best.l)r.best=best});return best?`<div class="altbest">⭐ Best value: <b>${best.side==="o"?"Over":"Under"} ${best.l}</b> at ${pr(best.pr)} — hit ${Math.round(best.h*100)}% of his last ${V.length} vs ${Math.round(imp(best.pr)*100)}% the price needs.</div>`:""})();
  return `<details class="alt"${open?" open":""} onclick="loAltClick(event)"><summary>🪜 Alt lines (${A.length})${bestHtml?' <span class="altn">⭐ value</span>':""}${pick!=null?` · <span class="altn">showing ${pick}</span>`:""}</summary>
   <div class="small" style="margin:4px 0 2px">👆 Tap a line (or use − / + next to the line) to see it in the charts and hit rates. Leaving the page puts it back to the normal line.</div>
   ${bestHtml}<div class="alw"><table class="altt"><thead><tr><th>Line</th><th>Over</th><th>Under</th>${heat?HV.map(([l])=>`<th class="hmh" title="% of games over this line">${l}</th>`).join(""):V.length?`<th title="Last ${V.length} games over this line">L${V.length} over</th>`:""}<th title="Track it or add it to a parlay">＋</th></tr></thead><tbody>
   ${R.map(r=>{const isM=!!r[5],on=isM?pick==null:pick===r[0];
     return `<tr class="alr${isM?" alm":""}${on?" on":""}${r.best?" albest":""}" data-alt="${ak}" data-l="${isM?"":r[0]}"><td><b>${r[0]}</b>${isM?' <span class="small">main</span>':""}</td><td>${pr(r[1])}${bk(r[2])}</td><td>${pr(r[3])}${bk(r[4])}</td>${heat?HV.map(([,a])=>loHeatCell(a,r[0])).join(""):V.length?`<td>${hit(r[0])}</td>`:""}<td class="albt">${isM?"":`${typeof actBtn!=="undefined"?actBtn(loAltSpec(nm,k,r[0],"over",r[1],r[2]),"O","ov")+actBtn(loAltSpec(nm,k,r[0],"under",r[3],r[4]),"U","un"):""}`}</td></tr>`}).join("")}
   </tbody></table></div><div class="small" style="margin-top:4px">Lower and higher lines than the main one, best price per line across licensed US books. ${heat?"Coloured columns = % of games he went over each line (L5 / L10 / L20 / this season) — green often, red rarely. ":""}Longer odds = less likely — alt lines are fun but riskier; bet small. <b>＋ O / U</b> = track that alt line or add it to a parlay.</div>
   ${pick!=null&&loAltSp(k)!=="nhl"&&typeof snapBtn!=="undefined"?`<div style="margin-top:6px">${snapBtn(loAltSp(k),nm,k,`Snapshot ${pick}`)}</div>`:""}</details>`}

/* ---------- 📈 Biggest line moves today (open = first line the feed saw today) ---------- */
function loMoves(sp,n){
  const out=[];for(const m of Object.values(LO.move)){if(m.sp!==sp||m.l==null||m.now==null)continue;
    if(sp==="nba"){const p=NBA_LOGS[m.nm],g=p&&nbaGameOf(p.tm);if(!g||nbaStarted(g))continue}
    else if(sp==="nhl"){const w=typeof nhWho!=="undefined"&&nhWho(m.nm),g=w&&nhGameOf(w.tm);if(!g||nhStarted(g))continue}
    else{const P=PINFO[m.nm],o=P&&oppOf(P.team);if(!o||nflStarted(o.g))continue}
    const dl=m.now-m.l,dp=m.oNow!=null&&m.o!=null?m.oNow-m.o:0;if(!dl&&Math.abs(dp)<20)continue;
    out.push({...m,dl,dp,score:Math.abs(dl)/Math.max(4,Math.abs(m.l))*100+(dl?10:0)+Math.abs(dp)/10})}
  return out.sort((a,b)=>b.score-a.score).slice(0,n)}
function loMovesCard(sp,n){
  if(!LO.data)return "";const L=loMoves(sp,n||8);if(!L.length)return "";
  const mk=m=>sp==="nba"?(NBA_MK[m.k]?NBA_MK[m.k][1]:m.k):sp==="nhl"?(NH_MK[m.k]?NH_MK[m.k][1]:m.k):(MARKETS[m.k]?MARKETS[m.k].n:m.k);
  const pr=x=>x==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x);
  const row=m=>{const href=sp==="nba"?`#nba-player-${encodeURIComponent(m.nm)}~${m.k}`:sp==="nhl"?`#nhl-player-${encodeURIComponent(m.nm)}~${m.k}`:"#props";
    const what=m.dl?`<b>${m.l} → ${m.now}</b> <span class="lmv ${m.dl>0?"up":"dn"}">${m.dl>0?"▲":"▼"} ${Math.abs(m.dl)}</span>`:`<b>${m.now}</b> <span class="lmv fl">over ${pr(m.o)} → ${pr(m.oNow)}</span>`;
    const why=m.dl>0?"books moved it up — money on the over":m.dl<0?"books moved it down — money on the under":m.dp<0?"over getting pricier":"under getting pricier";
    return `<a class="lmr" href="${href}" ${sp==="nfl"?`data-nflfav="${esc(m.nm)}"`:""}><span><b>${esc(m.nm)}</b> <span class="small">${esc(mk(m))}</span></span><span>${what}</span><span class="small">${why}</span></a>`};
  return `<div class="card lmc"><h2 style="margin-bottom:2px">📈 Biggest ${sp.toUpperCase()} line moves today</h2><div class="small" style="margin-bottom:8px">Since the first line we saw this morning · live sportsbook odds, updated ${loAgo()}. Big moves often follow injury news or sharp money.</div>${L.map(row).join("")}</div>`}

/* 🚑 players ruled out (injury report: Out / IR / suspended) have their props removed everywhere — prop lists, best plays,
   player pages, line moves. Questionable / doubtful / day-to-day players keep theirs (with their injury tag). Runs at load,
   after every live-odds refresh and when the NHL data arrives. OUT_DROP = names removed, for the "ruled out" note. */
var OUT_DROP={nba:new Set(),nhl:new Set(),nfl:new Set()};
function loOutSet(sp){const S=new Set(),add=(L,re)=>{for(const r of L||[])if(re.test(String(r[2]||"").trim()))S.add(loNorm(r[0]))};
  if(sp==="nba"&&typeof NBA_INJ!=="undefined")for(const L of Object.values(NBA_INJ))add(L,/^(out|suspen)/i);
  if(sp==="nhl"&&typeof NHL_INJ!=="undefined")for(const L of Object.values(NHL_INJ))add(L,/^(out|injured reserve|ir\b|ltir|long[- ]term|suspen)/i);
  if(sp==="nfl"&&typeof INJ!=="undefined")for(const L of Object.values(INJ))add(L,/^(out|ir\b|ir-|pup|nfi|suspen)/i);
  return S}
var OUT_STASH={nba:[],nhl:[],nfl:{}};   /* removed rows, put back if the player comes off the report */
function loDropOut(){let changed=0;try{
  const drop=(sp,A)=>{if(!A)return;const O=loOutSet(sp),keep=[];
    for(const r of OUT_STASH[sp])if(O.has(loNorm(r[0])))keep.push(r);else if(!A.some(x=>x[0]===r[0]&&x[1]===r[1])){A.push(r);OUT_DROP[sp].delete(r[0]);changed=1}
    OUT_STASH[sp]=keep;for(let i=A.length-1;i>=0;i--)if(O.has(loNorm(A[i][0]))){OUT_DROP[sp].add(A[i][0]);OUT_STASH[sp].push(A[i]);A.splice(i,1);changed=1}};
  if(typeof NBA_PROPS!=="undefined")drop("nba",NBA_PROPS);
  if(typeof NHL_PROPS!=="undefined")drop("nhl",NHL_PROPS);
  if(typeof REAL_PROPS!=="undefined"){const O=loOutSet("nfl");
    for(const [k,v] of Object.entries(OUT_STASH.nfl)){const n=k.slice(0,k.lastIndexOf("|"));if(!O.has(loNorm(n))){if(!REAL_PROPS[k])REAL_PROPS[k]=v;delete OUT_STASH.nfl[k];OUT_DROP.nfl.delete(n);changed=1}}
    for(const k of Object.keys(REAL_PROPS)){const n=k.slice(0,k.lastIndexOf("|"));if(O.has(loNorm(n))){OUT_DROP.nfl.add(n);OUT_STASH.nfl[k]=REAL_PROPS[k];delete REAL_PROPS[k];changed=1}}}
  if(typeof LO!=="undefined"&&LO.move)for(const k of Object.keys(LO.move)){const m=LO.move[k];if(m&&OUT_DROP[m.sp]&&OUT_DROP[m.sp].has(m.nm)){delete LO.move[k];delete LO.alt[k]}}
  if(changed&&typeof NB!=="undefined")NB._best=null}catch(e){}return changed}
loDropOut();

/* 🚑 late scratches: NBA teams rule players out in the last hour or two. While any of today's NBA games hasn't started,
   the page re-reads ESPN's injury report every 10 minutes (and when you come back to the tab); anyone newly ruled out has
   his props removed right away and the page tells you. Fails quietly — the site's own refresh (every ~20 min before
   tip-off) does the same thing. */
var LO_INJ={nba:{t:0},nhl:{t:0},nfl:{t:0},busy:0};
/* per sport: ESPN feed, the site's injury table, how a team name maps to our abbreviation, and when to check */
const LO_INJ_CFG={
  nba:{url:"basketball/nba/injuries",min:20,tbl:()=>typeof NBA_INJ!=="undefined"?NBA_INJ:null,open:()=>typeof NBA_SLATE!=="undefined"&&NBA_SLATE.some(g=>!nbaStarted(g)),
    team:()=>{const m={};if(typeof NBA_TEAMS!=="undefined")for(const [a,n] of Object.entries(NBA_TEAMS))m[loNorm(n)]=a;return m},st:s=>/^(Out|Day-To-Day|Doubtful|Questionable|Suspension)$/i.test(s)?s:null},
  nhl:{url:"hockey/nhl/injuries",min:15,tbl:()=>typeof NHL_INJ!=="undefined"&&NHL_DATE?NHL_INJ:null,open:()=>typeof NHL_SLATE!=="undefined"&&NHL_SLATE.some(g=>!nhStarted(g)),
    team:()=>{const m={};for(const [a,t] of Object.entries(typeof NHL_TEAM!=="undefined"?NHL_TEAM:{}))if(t.n)m[loNorm(t.n)]=a;return m},st:s=>s||null},
  nfl:{url:"football/nfl/injuries",min:100,tbl:()=>typeof INJ!=="undefined"?INJ:null,open:()=>typeof SLATE!=="undefined"&&SLATE.some(g=>!g.final&&!nflStarted(g)),
    team:()=>{const m={};for(const [a,t] of Object.entries(typeof TEAMS!=="undefined"?TEAMS:{}))m[loNorm(t[0])]=a;return m},st:s=>({"Out":"Out","Doubtful":"Doubtful","Questionable":"Questionable","Injured Reserve":"IR"})[s]||null}};
async function loInjSport(sp,force){const C=LO_INJ_CFG[sp],S=LO_INJ[sp],T0=C.tbl();if(!T0||!C.open()||S.busy||(!force&&Date.now()-S.t<9.5*60e3))return 0;S.busy=1;
  try{const r=await fetch("https://site.api.espn.com/apis/site/v2/sports/"+C.url,{cache:"no-store"});if(!r.ok)throw 0;const d=await r.json(),TM=C.team(),T={};let n=0;
    const pt=nm=>{try{nm=String(nm||"");if(sp==="nba")return (NBA_LOGS[nm]||{}).tm;if(sp==="nhl"){const w=nhWho(nm);return w&&w.tm}return (typeof PINFO!=="undefined"&&PINFO[nm]||{}).team}catch(e){return null}};
    for(const t of d.injuries||[]){let ab=TM[loNorm(t.displayName)];
      if(!ab){const c={};for(const i of t.injuries||[]){const x=pt((i.athlete||{}).displayName);if(x)c[x]=(c[x]||0)+1}ab=Object.keys(c).sort((x,y)=>c[y]-c[x])[0]}   /* team name spelled differently: go by its players */
      if(!ab)continue;T[ab]=[];
      for(const i of t.injuries||[]){const st=C.st(i.status||"");if(!st)continue;const a=i.athlete||{},det=i.details||{};
        T[ab].push([a.displayName||"",(a.position||{}).abbreviation||"",st,(((det.type||"")+" "+(det.detail||"")).trim()||"Undisclosed"),det.returnDate?new Date(det.returnDate).toLocaleDateString("en-US",{month:"short",day:"numeric"}):""]);n++}}
    if(n<C.min)throw 0;   /* feed looks wrong: keep what we have */
    for(const k of Object.keys(T))T0[k]=T[k];S.t=Date.now();return 1}
  catch(e){S.t=Date.now();return 0}finally{S.busy=0}}
/* 🥅 NHL starting goalies, live: ESPN's listed starters for today's games, re-read every 10 minutes before puck drop.
   If ESPN now lists someone other than the goalie the site shows (and the site's pick isn't confirmed), the page switches
   to ESPN's goalie and says so. */
var NH_GKLIVE={},LO_GK={t:0};
async function loNhlGoalies(force){if(typeof NHL_SLATE==="undefined"||!NHL_DATE||!NHL_SLATE.some(g=>!nhStarted(g))||(!force&&Date.now()-LO_GK.t<9.5*60e3))return 0;LO_GK.t=Date.now();
  try{const r=await fetch("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates="+NHL_DATE.replace(/-/g,""),{cache:"no-store"});if(!r.ok)return 0;const d=await r.json();
    const TM={};for(const [a,t] of Object.entries(NHL_TEAM||{}))if(t.n)TM[loNorm(t.n)]=a;let ch=0;const at=new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
    for(const e of d.events||[])for(const x of ((e.competitions||[{}])[0].competitors||[])){const tm=TM[loNorm((x.team||{}).displayName)];if(!tm)continue;
      const pr=(x.probables||[]).find(q=>/goalie/i.test(q.name||""));const nm=pr&&pr.athlete&&pr.athlete.displayName;if(!nm)continue;
      const k=Object.keys(NHL_G||{}).find(n=>loNorm(n)===loNorm(nm)&&NHL_G[n].tm===tm);if(!k)continue;
      const g=NHL_SLATE.find(z=>z.a===tm||z.h===tm);if(!g||nhStarted(g))continue;const shown=g.proj&&(g.a===tm?g.proj.ga:g.proj.gh);
      const key=g.d+"|"+tm,prev=NH_GKLIVE[key];if(k!==shown){if(!prev||prev.nm!==k){NH_GKLIVE[key]={nm:k,at};ch++}}else if(prev){delete NH_GKLIVE[key];ch++}}
    return ch}catch(e){return 0}}
async function loInjLive(force){if(location.protocol==="file:"||LO_INJ.busy)return;LO_INJ.busy=1;
  try{const before={nba:new Set(OUT_DROP.nba),nhl:new Set(OUT_DROP.nhl),nfl:new Set(OUT_DROP.nfl)};let got=0;
    for(const sp of ["nba","nhl","nfl"])got+=await loInjSport(sp,force);
    const gk=await loNhlGoalies(force);if(gk&&!got&&/^#nhl/.test(location.hash)&&typeof route==="function"){const y=scrollY;route();scrollTo(0,y);if(typeof toast!=="undefined")toast("🥅 Starting goalie updated from ESPN")}
    if(got&&loDropOut()){const nw=["nba","nhl","nfl"].flatMap(sp=>[...OUT_DROP[sp]].filter(x=>!before[sp].has(x)));
      if(typeof route==="function"){const y=scrollY;route();scrollTo(0,y)}
      if(nw.length&&typeof toast!=="undefined")toast(`🚑 Ruled out: ${nw.slice(0,3).join(", ")}${nw.length>3?` +${nw.length-3}`:""} — props removed`)}}
  finally{LO_INJ.busy=0}}
window.addEventListener("load",()=>{setTimeout(()=>loInjLive(1),4000);setInterval(()=>loInjLive(0),60e3)});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loInjLive(0)});
