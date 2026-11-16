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

/* ---------- 📒 Team betting record (all sports with closing lines): against the spread, over/under, home/road,
   favourite/underdog, last 10 games with cover and over chips. rows: {d, opp, home, sp (team spread, − = favoured), tot, pf, pa} ---------- */
function xBetRec(rows,o){o=o||{};rows=(rows||[]).filter(r=>r.sp!=null&&r.tot!=null&&r.pf!=null&&r.pa!=null);if(!rows.length)return "";
  const z=()=>[0,0,0],A=z(),O=z(),H=z(),R=z(),F=z(),D=z(),add=(T,v)=>T[v>0?0:v<0?1:2]++;
  /* home / road / favourite / underdog splits: straight-up record, against the spread, over/under */
  const SP={all:[z(),z(),z()],home:[z(),z(),z()],road:[z(),z(),z()],fav:[z(),z(),z()],dog:[z(),z(),z()]};
  for(const r of rows){const c=r.pf-r.pa+r.sp,t=r.pf+r.pa-r.tot;add(A,c);add(O,t);add(r.home?H:R,c);if(r.sp<0)add(F,c);else if(r.sp>0)add(D,c);
    for(const k of ["all",r.home?"home":"road",...(r.sp<0?["fav"]:r.sp>0?["dog"]:[])]){const X=SP[k];add(X[0],r.pf-r.pa);add(X[1],c);add(X[2],t)}}
  const rec=T=>`${T[0]}-${T[1]}${T[2]?"-"+T[2]:""}`,pc=T=>T[0]+T[1]?Math.round(T[0]/(T[0]+T[1])*100)+"%":"–",u=o.unit||"pts";
  const L=rows.slice(-10).reverse();
  return `<div class="card"><h2>📒 Betting record <span class="small">· ${rows.length} games with closing lines${o.src?" · "+o.src:""}</span></h2>
   <div class="xstrip"><div><b>${rec(A)}</b><span>${o.ats||"vs spread"}</span><small>${pc(A)} covered</small></div><div><b>${rec(O)}</b><span>Over / under</span><small>${pc(O)} overs</small></div>
    <div><b>${rec(H)}</b><span>Home ${o.ats?"":"ATS"}</span></div><div><b>${rec(R)}</b><span>Road ${o.ats?"":"ATS"}</span></div>${F[0]+F[1]+F[2]?`<div><b>${rec(F)}</b><span>As favourite</span></div>`:""}${D[0]+D[1]+D[2]?`<div><b>${rec(D)}</b><span>As underdog</span></div>`:""}</div>
   <div class="nbatbl" style="margin-top:8px"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>Record</th><th>${o.ats||"Vs spread"}</th><th>Over / under</th></tr></thead><tbody>
    ${[["all","All games"],["home","Home"],["road","Road"],["fav","As favourite"],["dog","As underdog"]].filter(([k])=>SP[k][0].some(x=>x)).map(([k,l])=>`<tr><td><b>${l}</b></td><td>${rec(SP[k][0])}</td><td>${rec(SP[k][1])} <span class="small">${pc(SP[k][1])}</span></td><td>${rec(SP[k][2])} <span class="small">${pc(SP[k][2])} over</span></td></tr>`).join("")}</tbody></table></div>
   <div class="nbatbl" style="margin-top:8px"><table class="bxt" style="min-width:0"><thead><tr><th>Game</th><th>Score</th><th>Line</th><th>Cover</th><th>Total</th></tr></thead><tbody>
    ${L.map(r=>{const c=r.pf-r.pa+r.sp,t=r.pf+r.pa-r.tot;return `<tr><td>${gpE(r.d)} ${r.home?"vs":"@"} ${gpE(r.opp)}</td><td>${r.pf>r.pa?"W":r.pf<r.pa?"L":"T"} ${r.pf}-${r.pa}</td><td>${r.sp>0?"+":""}${r.sp}</td><td><span class="ufr ${c>0?"W":c<0?"L":"NC"}">${c>0?"✓":c<0?"✗":"P"}</span></td><td>${r.tot} <span class="ufr ${t>0?"W":t<0?"L":"NC"}">${t>0?"O":t<0?"U":"P"}</span></td></tr>`}).join("")}</tbody></table></div>
   <div class="small">Cover = won by more than the spread (or lost by less). Closing lines${o.src?" from "+o.src:""}. ${u==="goals"?"Puck line ±1.5.":""}</div></div>`}
function nbaBetRows(t){if(typeof NBA_SPR==="undefined")return [];return Object.values(NBA_SPR).filter(s=>s[1]===t||s[2]===t).sort((a,b)=>a[0]<b[0]?-1:1).map(s=>{const h=s[2]===t;return {d:s[0].slice(5),opp:h?s[1]:s[2],home:h,sp:h?s[3]:-s[3],tot:s[4],pf:h?s[6]:s[5],pa:h?s[5]:s[6]}})}
function nflBetRows(t){const A=(typeof NFL_ATS!=="undefined"&&NFL_ATS[t])||[];return A.map(r=>({d:"Wk "+r[0],opp:r[1],home:!!r[2],sp:r[3],tot:r[4],pf:r[5],pa:r[6]}))}
function nhlBetCard(t){const T=(typeof NHL_TEAM!=="undefined"&&NHL_TEAM[t])||{};if(!T.ats&&!T.ou)return "";const rec=r=>r?`${r[0]}-${r[1]}${r[2]?"-"+r[2]:""}`:"–",pc=r=>r&&r[0]+r[1]?Math.round(r[0]/(r[0]+r[1])*100)+"%":"";
  const wl=r=>r?`${r[0]}-${r[1]}${r[2]?"-"+r[2]:""}`:"–";
  return `<div class="card"><h2>📒 Betting record</h2><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>Record</th><th>Puck line</th><th>Over / under</th></tr></thead><tbody>
   <tr><td><b>All games</b></td><td>${T.w!=null?`${T.w}-${T.l}-${T.otl}`:"–"}</td><td>${rec(T.ats)} <span class="small">${pc(T.ats)}</span></td><td>${rec(T.ou)} <span class="small">${pc(T.ou)} over</span></td></tr>
   <tr><td><b>Home</b></td><td>${wl(T.home)}</td><td>${rec(T.atsH)} <span class="small">${pc(T.atsH)}</span></td><td>${rec(T.ouH)} <span class="small">${pc(T.ouH)} over</span></td></tr>
   <tr><td><b>Road</b></td><td>${wl(T.road)}</td><td>${rec(T.atsR)} <span class="small">${pc(T.atsR)}</span></td><td>${rec(T.ouR)} <span class="small">${pc(T.ouR)} over</span></td></tr></tbody></table></div>
   <div class="small">Against the closing puck line and total (licensed US books).</div></div>`}

/* ---------- ⚙️ Settings (this device): start page, sports you follow, odds format, times, theme, view, text size,
   colour-blind friendly colours, default stake ---------- */
const XSET_DEF={start:"today",hide:[],tz:"et",text:"m",cb:0};
function xSet(){let o={};try{o=JSON.parse(localStorage.getItem("rla_set")||"{}")||{}}catch(e){}return Object.assign({},XSET_DEF,o)}
function xSetSave(k,v){const o=xSet();o[k]=v;try{localStorage.setItem("rla_set",JSON.stringify(o))}catch(e){}xSetApply()}
function xFollow(sp){return !xSet().hide.includes(sp==="soccer"?"soc":sp)}
function xSetApply(){const o=xSet(),B=document.body;if(!B)return;["nfl","nba","nhl","soc","ufc","cfb","cbb"].forEach(sp=>B.classList.toggle("hide-"+sp,o.hide.includes(sp)));
  B.classList.toggle("cbsafe",!!o.cb);B.classList.toggle("txt-l",o.text==="l");B.classList.toggle("txt-xl",o.text==="xl");if(o.tz==="local")xTzSoon()}
/* game times: the site writes "7:00 PM ET"; with "my time zone" on, every such time on the page is shown in yours */
const XTZ_RE=/\b(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*ET\b/g;
function xEtOffsetMin(){try{const d=new Date(),et=new Date(d.toLocaleString("en-US",{timeZone:"America/New_York"})),loc=new Date(d.toLocaleString("en-US"));return Math.round((loc-et)/6e4)}catch(e){return 0}}
function xTzConv(h,m,ap){let H=(+h%12)+(/p/i.test(ap)?12:0);let t=H*60+(+m)+xEtOffsetMin();t=((t%1440)+1440)%1440;const d=new Date();d.setHours(Math.floor(t/60),t%60,0,0);
  let z="";try{z=d.toLocaleTimeString("en-US",{timeZoneName:"short"}).split(" ").pop()}catch(e){}return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})+(z?" "+z:"")}
function xTzWalk(root){if(xSet().tz!=="local"||!xEtOffsetMin())return;const W=document.createTreeWalker(root||document.querySelector("main")||document.body,NodeFilter.SHOW_TEXT);const L=[];let n;
  const A=[];while((n=W.nextNode()))A.push(n);
  A.forEach((t,i)=>{const v=t.nodeValue;if(XTZ_RE.test(v)){XTZ_RE.lastIndex=0;t.nodeValue=v.replace(XTZ_RE,(_,h,m,ap)=>xTzConv(h,m,ap));return}XTZ_RE.lastIndex=0;
    /* "7:00 PM" and " ET" in separate pieces of text */
    const m=/(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*$/.exec(v),nx=A[i+1];if(m&&nx&&/^\s*ET\b/.test(nx.nodeValue)){t.nodeValue=v.slice(0,m.index)+xTzConv(m[1],m[2],m[3]);nx.nodeValue=nx.nodeValue.replace(/^\s*ET\b/,"")}})}
let XTZ_T=0;function xTzSoon(){clearTimeout(XTZ_T);XTZ_T=setTimeout(()=>xTzWalk(),80)}
window.addEventListener("load",()=>{xSetApply();try{new MutationObserver(()=>{if(xSet().tz==="local")xTzSoon()}).observe(document.querySelector("main")||document.body,{childList:true,subtree:true})}catch(e){}
  const o=xSet();if((!location.hash||location.hash==="#"||location.hash==="#today")&&o.start&&o.start!=="today"&&!sessionStorage.getItem("rla_started")){try{sessionStorage.setItem("rla_started","1")}catch(e){}location.replace("#"+({nfl:"games",nba:"nba",nhl:"nhl",soc:"soccer",ufc:"ufc",cfb:"cfb",cbb:"cbb"}[o.start]||"today"))}
  try{sessionStorage.setItem("rla_started","1")}catch(e){}});
function viewSettings(){const el=document.getElementById("v-settings");if(!el)return;const o=xSet(),of=typeof ODDS_FMT!=="undefined"?ODDS_FMT:"am";
  const SP=[["nfl","🏈 NFL"],["nba","🏀 NBA"],["nhl","🏒 NHL"],["soc","⚽ Soccer"],["ufc","🥊 UFC"],["cfb","🏈 College football"],["cbb","🏀 College basketball"]];
  const seg=(k,opts,cur)=>`<div class="seg">${opts.map(([v,l])=>`<button data-xset="${k}" data-v="${v}" class="${cur===v?"on":""}">${l}</button>`).join("")}</div>`;
  el.innerHTML=`<h1>⚙️ Settings</h1><p class="sub">Saved on this device.</p>
   <div class="card"><h2>Open the site on</h2>${seg("start",[["today","🏠 Today"],...SP],o.start)}</div>
   <div class="card"><h2>Sports I follow</h2><div class="small" style="margin-bottom:6px">Hidden sports leave the sport bar, the Today page and the More menu (you can still open them from search).</div>
    <div class="xchk">${SP.map(([v,l])=>`<label><input type="checkbox" data-xhide="${v}" ${o.hide.includes(v)?"":"checked"}> ${l}</label>`).join("")}</div></div>
   <div class="card"><h2>Odds format</h2>${seg("odds",[["am","American (−110)"],["dec","Decimal (1.91)"]],of)}</div>
   <div class="card"><h2>Game times</h2>${seg("tz",[["et","Eastern (ET)"],["local","My time zone"]],o.tz)}<div class="small" style="margin-top:6px">${o.tz==="local"?`Times show in your zone (${(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){return "local"}})()}).`:"Times show as Eastern, like the sportsbooks."}</div></div>
   <div class="card"><h2>Theme</h2>${typeof uxThemeSeg!=="undefined"?uxThemeSeg():""}</div>
   <div class="card"><h2>Detail level</h2>${typeof uxViewSeg!=="undefined"?uxViewSeg():""}</div>
   <div class="card"><h2>Text size</h2>${seg("text",[["m","Normal"],["l","Large"],["xl","Extra large"]],o.text)}</div>
   <div class="card"><h2>Colours</h2>${seg("cb",[["0","Standard (green / red)"],["1","Colour-blind friendly (blue / orange)"]],String(o.cb||0))}</div>
   <div class="card"><h2>Default stake for tracked bets</h2><div class="row" style="gap:8px;align-items:center"><span>$</span><input type="number" min="1" step="1" inputmode="decimal" id="xStake" value="${typeof betStakeDefault!=="undefined"?betStakeDefault():10}" style="width:110px" aria-label="Default stake in dollars"></div></div>
   <div class="card"><h2>Reset</h2><button class="btn" id="xReset">Reset these settings</button></div>`;
  el.querySelectorAll("[data-xset]").forEach(b=>b.onclick=()=>{const k=b.dataset.xset,v=b.dataset.v;if(k==="odds"){if(typeof setOddsFmt!=="undefined")setOddsFmt(v);if(typeof syncOddsBtns!=="undefined")syncOddsBtns()}else xSetSave(k,k==="cb"?+v:v);
    if(k==="tz"&&v==="et")location.reload();viewSettings();if(typeof toast!=="undefined")toast("Saved")});
  el.querySelectorAll("[data-xhide]").forEach(c=>c.onchange=()=>{const o2=xSet(),sp=c.dataset.xhide;let H=o2.hide.filter(x=>x!==sp);if(!c.checked)H.push(sp);if(H.length>=7){c.checked=true;return}xSetSave("hide",H)});
  const st=el.querySelector("#xStake");st.onchange=()=>{const v=Math.max(1,+st.value||10);try{LS.set("betStake",v)}catch(e){}if(typeof toast!=="undefined")toast("Saved")};
  el.querySelector("#xReset").onclick=()=>{try{localStorage.removeItem("rla_set")}catch(e){}xSetApply();location.reload()}}

/* ---------- ♿ Accessibility: names for icon-only buttons, bigger tap targets, visible keyboard focus, less motion ---------- */
const XA_NAMES={"＋":"Track this bet or add it to a parlay","+":"Add","📸":"Make a snapshot image","ⓘ":"More about this","×":"Close","✕":"Close","☆":"Save to favourites","★":"Remove from favourites","⋯":"More options","☰":"Menu"};
function xA11y(root){(root||document).querySelectorAll("button:not([aria-label]),a.btn:not([aria-label]),[role=button]:not([aria-label])").forEach(b=>{const t=(b.textContent||"").trim();
  if(!t||!/[A-Za-z0-9]/.test(t)){const k=Object.keys(XA_NAMES).find(x=>t.startsWith(x));const lab=b.getAttribute("title")||(k&&XA_NAMES[k]);if(lab)b.setAttribute("aria-label",lab)}});
  (root||document).querySelectorAll("svg:not([role]):not([aria-hidden])").forEach(s=>{if(!s.closest("button,a"))s.setAttribute("aria-hidden","true")})}
let XA_T=0;window.addEventListener("load",()=>{xA11y();try{new MutationObserver(()=>{clearTimeout(XA_T);XA_T=setTimeout(()=>xA11y(document.querySelector("main")),150)}).observe(document.querySelector("main")||document.body,{childList:true,subtree:true})}catch(e){}});

/* home / road splits for one team: straight-up, against the spread, over/under — from the same closing-line rows as xBetRec */
function xSplits(rows){const z=()=>[0,0,0],add=(T,v)=>T[v>0?0:v<0?1:2]++,S={all:[z(),z(),z()],home:[z(),z(),z()],road:[z(),z(),z()]};
  for(const r of (rows||[]).filter(r=>r.sp!=null&&r.tot!=null&&r.pf!=null&&r.pa!=null))for(const k of ["all",r.home?"home":"road"]){add(S[k][0],r.pf-r.pa);add(S[k][1],r.pf-r.pa+r.sp);add(S[k][2],r.pf+r.pa-r.tot)}return S}
function xRec(T){return `${T[0]}-${T[1]}${T[2]?"-"+T[2]:""}`}
