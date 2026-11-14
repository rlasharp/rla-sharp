/* ---------- 🚑 Injury-adjusted predictions (all sports) ----------
   Our game numbers (NBA margin/total, NHL expected goals, NFL projected score, soccer expected goals) are built from team
   results that INCLUDE the players who are now hurt. This layer takes out what each missing player usually brings:
     team scoring −= replacement loss × his production per team game × share of the team's games he played × chance he sits
   · production: NBA points per game · NHL points per game · NFL scrimmage (+ passing) yards ÷ 15 ≈ points · soccer goals + ½ assists
   · replacement loss (the part a backup doesn't make up): NBA 0.4 · NHL 0.22 · NFL 0.35 for a QB, 0.25 otherwise · soccer 0.4
   · chance he sits: Out / IR / suspended 1 · Doubtful 0.75 · Questionable 0.4 (NFL 0.25) · Day-to-day 0.25 ·
     confirmed starter (NBA.com lineups, soccer team sheets) 0 — so a questionable player who is confirmed playing moves nothing.
   · share of games played: a player who has been out for weeks is already missing from the team's recent results, so he
     moves the numbers much less than a starter who got hurt yesterday.
   Recomputed whenever the injury report changes (the page re-reads ESPN's report every 10 min before games). */
const IA={v:0,memo:new Map(),log:[]};
function iaBump(){IA.v++;IA.memo.clear()}
function iaW(st,sp){const s=String(st||"").toLowerCase().trim();if(!s)return 0;
  if(/^(out|suspen|injured reserve|ir\b|ir-|ltir|long|pup|nfi|reserve)/.test(s))return 1;if(/doubt/.test(s))return .75;
  if(/quest|game.?time/.test(s))return sp==="nfl"?.25:.4;if(/day/.test(s))return .15;return 0}
function iaWord(w){return w>=1?"out":w>=.75?"doubtful":w>=.4?"questionable":w>0?"day-to-day":"playing"}
function iaMemo(k,fn){const key=k+"|"+IA.v;if(IA.memo.has(key))return IA.memo.get(key);let r=null;try{r=fn()}catch(e){r=null}IA.memo.set(key,r);return r}
const iaN=s=>typeof loNorm!=="undefined"?loNorm(s):String(s||"").toLowerCase();
/* NBA.com lineups: confirmed starter → playing; listed out → out */
function iaNbaLu(nm,tm){const L=typeof NBA_LU!=="undefined"&&NBA_LU&&NBA_LU.g;if(!L)return null;const n=iaN(nm);
  for(const g of Object.values(L))for(const s of [g.a,g.h]){if(!s||s.t!==tm)continue;
    const st=(s.st||[]).find(x=>iaN(x[0])===n);if(st&&/confirm/i.test(st[2]||""))return 0;if((s.out||[]).some(x=>iaN(Array.isArray(x)?x[0]:x)===n))return 1}
  return null}
/* one team's adjustment: {d: points (goals) taken off its scoring, L: [{nm, st, w, d}]} */
function iaTeam(sp,tm,f){return iaMemo(sp+"|"+tm+(f?"|"+f.id:""),()=>{const L=[];let d=0;
  if(sp==="nba"&&typeof NBA_INJ!=="undefined"){const T=(typeof NBA_TEAM!=="undefined"&&NBA_TEAM[tm])||{},tg=T.g||0;
    for(const r of NBA_INJ[tm]||[]){let w=iaW(r[2],sp);const lu=iaNbaLu(r[0],tm);if(lu!=null)w=lu;if(!w)continue;const p=typeof NBA_LOGS!=="undefined"&&NBA_LOGS[r[0]];if(!p||p.tm!==tm||!p.g.length||!tg)continue;
      const sh=Math.min(1,p.g.length/tg),x=.4*nbaAvg(p,"pts")*sh*w;if(x<.3)continue;d+=x;L.push({nm:r[0],st:r[2],w,d:x})}
    d=Math.min(d,10)}
  if(sp==="nhl"&&typeof NHL_INJ!=="undefined"){const T=(typeof NHL_TEAM!=="undefined"&&NHL_TEAM[tm])||{},tg=T.gp||0;
    for(const r of NHL_INJ[tm]||[]){const w=iaW(r[2],sp);if(!w)continue;const p=typeof NHL_P!=="undefined"&&NHL_P[r[0]];if(!p||p.tm!==tm||!p.s||!p.s[0]||!tg)continue;
      const sh=Math.min(1,p.s[0]/tg),x=.22*(p.s[3]/p.s[0])*sh*w;if(x<.02)continue;d+=x;L.push({nm:r[0],st:r[2],w,d:x})}
    d=Math.min(d,.7)}
  if(sp==="nfl"&&typeof INJ!=="undefined"&&typeof pLogs!=="undefined"){const tg=typeof teamGames!=="undefined"?teamGames(tm).length:0;const seen=new Set();
    const rows=[...(INJ[tm]||[]).map(r=>[r[0],r[2],r[1]]),...Object.keys(typeof OUT!=="undefined"?OUT:{}).filter(n=>(PINFO[n]||{}).team===tm).map(n=>[n,"Out",(PINFO[n]||{}).pos])];
    for(const [nm,st,pos0] of rows){if(seen.has(nm))continue;seen.add(nm);const w=iaW(st,sp);if(!w||!tg)continue;const cur=pLogs(nm).filter(l=>l.season===CUR);if(!cur.length)continue;
      const pos=(PINFO[nm]||{}).pos||pos0||cur[cur.length-1].pos,qb=pos==="QB",y=cur.reduce((s,l)=>s+(+l.rushYds||0)+(+l.recYds||0)+(qb?(+l.passYds||0):0),0)/cur.length;
      const sh=Math.min(1,cur.length/tg),x=(qb?.35:.25)*(y/15)*sh*w;if(x<.3)continue;d+=x;L.push({nm,st,w,d:x})}
    d=Math.min(d,9)}
  if(sp==="soc"&&f&&window.SOC_P){const tid=tm,res=typeof socTeamRes!=="undefined"?socTeamRes(tid).length:0;if(!res)return {d:0,L:[]};
    const lu=typeof socLuOf!=="undefined"?socLuOf(f):null,by=new Map();
    for(const [aid,P] of Object.entries(SOC_P))if(P&&P[1]===tid)by.set(iaN(P[0]),aid);
    const cand=new Map();for(const x of ((f.miss||{})[tid]||[]))cand.set(iaN(x[0]),[x[0],x[1]==="red"?"Suspended (red card)":"Missed the last 2 matches"]);
    if(lu){/* team sheet is out: regulars (started 4+ of the team's last 6 matches) who aren't in the XI */
      const last=socTeamRes(tid).slice(-6).map(r=>String(r[0]));
      for(const [n,aid] of by){const P=SOC_P[aid];const st=P[3].filter(g=>last.includes(String(g[0]))&&g[1]===1).length;if(st>=4&&!cand.has(n))cand.set(n,[P[0],"Not in the starting XI"])}}
    for(const [n,[nm,why]] of cand){const aid=by.get(n);if(!aid)continue;let w=1;
      if(lu){const s=socLuStatus(f,nm);if(s==="xi")continue;if(s==="bench")w=.6}
      const G=SOC_P[aid][3],ga=G.reduce((s,g)=>s+(+g[5]||0)+.5*(+g[6]||0),0),mins=G.reduce((s,g)=>s+(+g[2]||0),0);if(mins<270)continue;
      const x=.4*(ga/res)*w;if(x<.02)continue;d+=x;L.push({nm,st:w<1?"On the bench":why,w,d:x})}
    d=Math.min(d,.6)}
  return {d,L:L.sort((a,b)=>b.d-a.d)}})}
/* short text for the game page: "BOS −3.2 pts: Tatum out (−2.8), Brown questionable (−0.4)" */
function iaNote(sp,teams,f,names){const u=sp==="nba"||sp==="nfl"?"pts":"goals",dp=sp==="nba"||sp==="nfl"?1:2;const parts=[];
  teams.forEach((t,i)=>{const A=iaTeam(sp,t,f);if(!A||!A.L.length||A.d<(sp==="nba"||sp==="nfl"?.5:.03))return;
    parts.push(`<b>${gpE((names&&names[i])||t)} −${A.d.toFixed(dp)} ${u}</b> <span class="small">${A.L.slice(0,3).map(x=>`${gpE(x.nm)} ${iaWord(x.w)}`).join(", ")}${A.L.length>3?` +${A.L.length-3}`:""}</span>`)});
  return parts.length?parts.join("<br>")+`<div class="small">Our numbers above already take this off each team's scoring.</div>`:""}

/* NHL: expected goals with skaters out + a live goalie switch (ESPN's listed starter ≠ the one the numbers used) */
function iaNhlGk(nm){const G=typeof NHL_G!=="undefined"&&NHL_G[nm];if(!G||G.svp==null)return null;const gp=G.gp||0;return ((G.svp/100)*gp+.9*10)/(gp+10)}
function iaNhlProj(g,q){if(!q)return q;const A=iaTeam("nhl",g.a),H=iaTeam("nhl",g.h);let la=q.la,lh=q.lh;
  if(A&&A.d)la=Math.max(.5,la-A.d);if(H&&H.d)lh=Math.max(.5,lh-H.d);
  let gk=null;if(typeof NH_GKLIVE!=="undefined"){for(const [side,tm] of [["a",g.a],["h",g.h]]){const L=NH_GKLIVE[g.d+"|"+tm];const old=side==="a"?q.ga:q.gh;if(!L||!old||L.nm===old)continue;
    const s0=iaNhlGk(old),s1=iaNhlGk(L.nm);if(s0==null||s1==null)continue;const r=Math.max(.75,Math.min(1.33,(1-s1)/(1-s0)));if(side==="a")lh*=r;else la*=r;gk=(gk||[]).concat([[tm,old,L.nm,r]])}}
  if(la===q.la&&lh===q.lh)return q;const ra=la/q.la,rh=lh/q.lh;
  return Object.assign({},q,{la,lh,l1a:q.l1a!=null?q.l1a*ra:q.l1a,l1h:q.l1h!=null?q.l1h*rh:q.l1h,ga:gk&&gk.find(x=>x[0]===g.a)?gk.find(x=>x[0]===g.a)[2]:q.ga,gh:gk&&gk.find(x=>x[0]===g.h)?gk.find(x=>x[0]===g.h)[2]:q.gh,ia:{a:q.la-la,h:q.lh-lh,gk}})}

/* soccer: recompute the match numbers (1X2, totals, both teams to score, team totals) from adjusted expected goals */
function iaPoisGrid(lh,la,rho){const pz=(k,l)=>{let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p};rho=rho||0;
  const tau=(i,j)=>i===0&&j===0?1-lh*la*rho:i===0&&j===1?1+lh*rho:i===1&&j===0?1+la*rho:i===1&&j===1?1-rho:1;const M=[];let t=0;
  for(let i=0;i<=10;i++){M[i]=[];for(let j=0;j<=10;j++){const q=Math.max(0,pz(i,lh)*pz(j,la)*tau(i,j));M[i][j]=q;t+=q}}
  for(let i=0;i<=10;i++)for(let j=0;j<=10;j++)M[i][j]/=t;return M}
function iaSocProj(P,lh,la){const M=iaPoisGrid(lh,la,P.rho);let h=0,dr=0,a=0,bt=0;const o={},th={},ta={};
  for(let i=0;i<=10;i++)for(let j=0;j<=10;j++){const q=M[i][j];if(i>j)h+=q;else if(i===j)dr+=q;else a+=q;if(i&&j)bt+=q;
    for(const k of Object.keys(P.o||{}))if(i+j>+k)o[k]=(o[k]||0)+q;for(const k of Object.keys((P.tt||{}).h||{}))if(i>+k)th[k]=(th[k]||0)+q;for(const k of Object.keys((P.tt||{}).a||{}))if(j>+k)ta[k]=(ta[k]||0)+q}
  const r=x=>Math.round(x*1000)/1000,ro=O=>Object.fromEntries(Object.entries(O).map(([k,v])=>[k,r(v)]));
  const out=Object.assign({},P,{lh:Math.round(lh*100)/100,la:Math.round(la*100)/100,p:[r(h),r(dr),r(a)],o:ro(o),btts:r(bt)});
  if(P.tt)out.tt={h:ro(th),a:ro(ta)};
  if(P.h1&&P.h1.lh!=null){const s=P.h1.share||.45,M1=iaPoisGrid(lh*s,la*s,0);let h1=0,d1=0,a1=0;const o1={};for(let i=0;i<=10;i++)for(let j=0;j<=10;j++){const q=M1[i][j];if(i>j)h1+=q;else if(i===j)d1+=q;else a1+=q;for(const k of Object.keys(P.h1.o||{}))if(i+j>+k)o1[k]=(o1[k]||0)+q}
    out.h1=Object.assign({},P.h1,{lh:r(lh*s),la:r(la*s),p:[r(h1),r(d1),r(a1)],o:ro(o1)})}
  return out}
function iaSocApply(f){if(!f||(!f.proj&&!f.proj0))return;if(!f.proj0)f.proj0=f.proj;const P=f.proj0;if(P.lh==null||P.la==null)return;
  const H=iaTeam("soc",f.h,f),A=iaTeam("soc",f.a,f),dh=H?H.d:0,da=A?A.d:0;
  if(!dh&&!da){f.proj=P;return}f.proj=iaSocProj(P,Math.max(.2,P.lh-dh),Math.max(.2,P.la-da));f.proj.ia={h:dh,a:da}}
function iaSocAll(){if(typeof SOC_FX==="undefined"||!SOC_FX)return;for(const f of SOC_FX)if(typeof socStarted==="undefined"||!socStarted(f))try{iaSocApply(f)}catch(e){}}

/* live: what changed on the injury report since the last check (for the toast and the Today card) */
function iaSnap(sp){const T=sp==="nba"?(typeof NBA_INJ!=="undefined"?NBA_INJ:null):sp==="nhl"?(typeof NHL_INJ!=="undefined"?NHL_INJ:null):(typeof INJ!=="undefined"?INJ:null);const m=new Map();
  if(T)for(const [t,L] of Object.entries(T))for(const r of L||[])m.set(r[0],[t,r[2]]);return m}
function iaDiff(sp,before,after,teams){const ch=[],at=new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
  for(const [nm,[t,st]] of after){const b=before.get(nm);if(!b){if(iaW(st,sp)>=.4)ch.push({sp,nm,tm:t,from:"",to:st,at})}else if(b[1]!==st)ch.push({sp,nm,tm:t,from:b[1],to:st,at})}
  for(const [nm,[t,st]] of before)if(!after.has(nm)&&(!teams||teams.has(t)))ch.push({sp,nm,tm:t,from:st,to:"Playing",at});
  return ch.filter(c=>iaW(c.from,sp)!==iaW(c.to,sp))}
function iaLogCard(){const L=IA.log.slice(-8).reverse();if(!L.length)return "";
  return `<div class="card"><h2>🚑 Injury updates today <span class="small">· our numbers were updated</span></h2>${L.map(c=>`<div class="ufval"><b>${gpE(c.nm)}</b> <span class="small">${c.sp.toUpperCase()} · ${gpE(c.tm)}</span><span>${c.from?gpE(c.from)+" → ":""}<b class="${iaW(c.to,c.sp)>=.75?"dn":iaW(c.to,c.sp)===0?"up":""}">${gpE(c.to)}</b></span><span class="small">${c.at}</span></div>`).join("")}</div>`}

/* ---------- ← Back: go to the page you came from (falls back to the section's list when you landed here directly) ---------- */
var XNAV=0;window.addEventListener("hashchange",()=>{XNAV++});
function xBack(fb,label){return `<a href="${fb}" class="xback" data-xback="1">← ${label||"Back"}</a>`}
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("[data-xback]");if(!a)return;if(XNAV>0){e.preventDefault();e.stopImmediatePropagation();XNAV-=2;history.back()}},true);
/* ---------- season averages strip at the top of every player page (like an NBA player's points / rebounds a game) ---------- */
function xStrip(items,note){items=items.filter(x=>x&&x[1]!=null&&x[1]!=="");if(!items.length)return "";
  return `<div class="xstrip">${items.map(([l,v,s])=>`<div><b>${v}</b><span>${l}</span>${s?`<small>${s}</small>`:""}</div>`).join("")}</div>${note?`<div class="small xstn">${note}</div>`:""}`}
function nbaStrip(p){const f=v=>typeof nbaF!=="undefined"?nbaF(v):v.toFixed(1),A=k=>nbaAvg(p,k),L5=k=>nbaAvg(p,k,5),tot=i=>p.g.reduce((s,x)=>s+(+x[i]||0),0);
  return xStrip([["PTS",f(A("pts")),"L5 "+f(L5("pts"))],["REB",f(A("reb")),"L5 "+f(L5("reb"))],["AST",f(A("ast")),"L5 "+f(L5("ast"))],["3PM",f(A("3pm")),"L5 "+f(L5("3pm"))],["MIN",f(A("min")),"L5 "+f(L5("min"))],
    ["FG%",tot(11)?(tot(10)/tot(11)*100).toFixed(1):"–",""]],`Per game · ${p.g.length} games this season`)}
function nhlStrip(w,isG){if(isG)return xStrip([["GP",w.gp],["W",w.w],["SV%",w.svp!=null?(w.svp/100).toFixed(3).slice(1):"–"],["GAA",w.gaa??"–"],["Starts",w.gs]],"This season");
  const s=w.s||[],gp=s[0]||0,pg=i=>gp?(s[i]/gp).toFixed(1):"–";return xStrip([["G",s[1]],["A",s[2]],["PTS",s[3]],["SOG/g",pg(4)],["BLK/g",pg(5)],["Hits/g",pg(6)],["TOI",s[8]!=null?s[8]:"–"]],`${gp} games this season`)}
function nflStrip(name,pos){const L=pLogs(name).filter(l=>l.season===CUR);if(!L.length)return "";const a=k=>{const v=L.map(l=>stat(l,k)).filter(Number.isFinite);return v.length?(v.reduce((s,x)=>s+x,0)/v.length).toFixed(1):null},t=k=>L.reduce((s,l)=>s+(+l[k]||0),0);
  const I=pos==="QB"?[["Pass yds",a("passYds")],["Comp",a("comp")],["Att",a("passAtt")],["Pass TD",t("passTD")],["INT",t("int")],["Rush yds",a("rushYds")]]
    :pos==="RB"?[["Rush yds",a("rushYds")],["Carries",a("rushAtt")],["Rec",a("rec")],["Rec yds",a("recYds")],["TD",t("rushTD")+t("recTD")]]
    :[["Rec",a("rec")],["Rec yds",a("recYds")],["Long",a("recLong")],["TD",t("recTD")+t("rushTD")]];
  return xStrip(I.map(([l,v])=>[l,v,""]),`Per game (TDs and INTs are totals) · ${L.length} games this season`)}

/* ---------- 🖨️ Print / save as PDF: opens every folded card on the page, prints in light colours, then puts things back ---------- */
function xPrintBtn(){return `<button class="obtn xprint" data-xprint="1">🖨️ Print / PDF</button>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-xprint]");if(!b)return;e.preventDefault();e.stopPropagation();
  const root=document.querySelector("main>section:not(.hide)");if(!root)return;const opened=[],dets=[],H=document.documentElement,theme=H.getAttribute("data-theme");
  try{if(typeof gpFill!=="undefined")root.querySelectorAll(".gplazy").forEach(c=>{if(!c.classList.contains("open")){c.classList.add("open");opened.push(c)}gpFill(c)})}catch(x){}
  root.querySelectorAll(".xfold:not(.open)").forEach(c=>{c.classList.add("open");opened.push(c)});root.querySelectorAll("details:not([open])").forEach(d=>{d.open=true;dets.push(d)});
  H.setAttribute("data-theme","light");document.body.classList.add("printing");
  const done=()=>{opened.forEach(c=>c.classList.remove("open"));dets.forEach(d=>d.open=false);if(theme)H.setAttribute("data-theme",theme);else H.removeAttribute("data-theme");document.body.classList.remove("printing");window.removeEventListener("afterprint",done)};
  window.addEventListener("afterprint",done);setTimeout(()=>{try{window.print()}catch(x){}setTimeout(()=>{if(document.body.classList.contains("printing"))done()},1500)},250)},true);
