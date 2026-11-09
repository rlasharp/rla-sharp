/* ================= ⚽ Soccer section =================
   Data: soccer_data.js (fixtures, results, team numbers, standings, odds, referees, weather, estimates — tools/soccerfetch.py)
         soccer_players.js (player game logs), both loaded the first time they're needed.
   Routes: #soccer (matches) · #soccer-game-<id> · #soccer-props · #soccer-table · #soccer-player-<espn id>
   Focus markets: match result, goals over/under, both teams to score, corners, cards. Player: shots, shots on target,
   goals, goal or assist, fouls committed, fouls won. Real data only — where no US book posts a line we say so. */
const SC={lgs:(()=>{try{return JSON.parse(localStorage.getItem("ge_soclgs")||"[]")}catch(e){return []}})(),cc:"cor",lg:"all",day:"",tab:"game",pmk:"all",plg:"all",tlg:"epl"};
let SOC_READY=false,SOC_WAIT=[],SOCP_READY=false,SOCP_WAIT=[];
function socLoad(file,okVar,W,done,cb){if(window[okVar]){done();cb&&cb();return}if(W.fail&&Date.now()-W.fail<60000){cb&&cb();return}if(cb)W.push(cb);if(W.loading)return;W.loading=1;
  const sc=document.createElement("script");sc.src=file+"?v="+(typeof BUILD_AT!=="undefined"&&BUILD_AT?BUILD_AT.replace(/\D/g,""):Math.floor(Date.now()/600000));
  sc.onload=()=>{done();W.loading=0;try{if(typeof SRCH!=="undefined")SRCH=null}catch(e){}W.splice(0).forEach(f=>{try{f()}catch(e){console.error(e)}})};
  sc.onerror=()=>{W.loading=0;W.fail=Date.now();W.splice(0).forEach(f=>{try{f()}catch(e){}})};document.head.appendChild(sc)}
function socEnsure(cb){socLoad("soccer_data.js","SOC_OK",SOC_WAIT,()=>{SOC_READY=true},cb)}
function socPEnsure(cb){socLoad("soccer_players.js","SOC_P_OK",SOCP_WAIT,()=>{SOCP_READY=true},cb)}
const socE=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const socO=x=>x==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x);
const socImp=o=>o==null?null:o<0?-o/(-o+100):100/(o+100);
const socPct=p=>p==null?"–":Math.round(p*100)+"%";
const SOC_TSI={sh:0,sot:1,cor:2,fo:3,yc:4,rc:5,pos:6};
const SOC_MK={sgoal:["Goal","Anytime goal","goals",5],s2g:["2+ G","2+ goals","goals",5],ssot:["SOT","Shots on target","shots on target",4],sshot:["Shots","Shots","shots",3],
  sast:["Assist","To assist","assists",6],sga:["G or A","Goal or assist","goals + assists",-1],sfoul:["Fouls","Fouls committed","fouls",7],sfwon:["Fouled","Fouls won","fouls won",8],scard:["Card","To be booked","cards",9]};
function socTm(id){const t=typeof SOC_TM!=="undefined"&&SOC_TM[id];return t?t[1]||t[0]:"Team"}
function socTmFull(id){const t=SOC_TM[id];return t?t[0]:"Team"}
function socBadge(id,big){const t=SOC_TM[id]||["","","?","#555"],c=t[3]||"#555",k=typeof xInkOn!=="undefined"?xInkOn(c):"#fff";
  return `<span class="nbbdg${big?" scbig":""}" style="background:${c};color:${k}${k==="#111"?";text-shadow:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)":""}">${socE(t[2]||"?")}</span>`}
function socLgChip(c){const L=SOC_LG[c]||{};return `<span class="sclg" style="--lc:${L.col||"#555"}">${socE(L.sh||c)}</span>`}
/* times and days in the viewer's own time zone */
function socDay(iso){return new Date(iso).toLocaleDateString("en-CA")}
function socTime(iso){return new Date(iso).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}
function socTZ(){try{return new Date().toLocaleTimeString(undefined,{timeZoneName:"short"}).split(" ").pop()}catch(e){return ""}}
function socCountdown(f){const m=(Date.parse(f.t)-Date.now())/60000;if(m<=0||m>180)return "";const h=Math.floor(m/60),mm=Math.round(m%60);return `<span class="cdc">⏱ ${h?h+"h ":""}${mm}m</span>`}
function socToday(){return socDay(new Date().toISOString())}
function socAddDays(d,n){const x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
function socDayS(d){return new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{timeZone:"UTC",weekday:"long",month:"short",day:"numeric"})}
function socFx(id){return (SOC_FX||[]).find(f=>String(f.id)===String(id))}
let SOC_RIDX=null;function socResIdx(){if(!SOC_RIDX){SOC_RIDX={};for(const r of SOC_RES||[])SOC_RIDX[r[0]]=r}return SOC_RIDX}
function socStarted(f){return f.state==="in"||f.state==="post"||Date.parse(f.t)<Date.now()-60000}
/* team's matches (all competitions), newest last */
function socTeamRes(tid,comp){return (SOC_RES||[]).filter(r=>(r[3]===tid||r[4]===tid)&&(!comp||r[2]===comp))}
function socWDL(r,tid){const me=r[3]===tid?r[5]:r[6],op=r[3]===tid?r[6]:r[5];return me>op?"W":me<op?"L":"D"}
function socForm(tid,n){return socTeamRes(tid).slice(-(n||5)).map(r=>{const x=socWDL(r,tid),op=r[3]===tid?r[4]:r[3];
  return `<i class="scf ${x}" title="${socE((r[3]===tid?"vs ":"@ ")+socTm(op)+" "+r[5]+"-"+r[6]+" · "+(SOC_LG[r[2]]||{}).sh)}">${x}</i>`}).join("")}
function socRank(c,tid){const L=(SOC_ST||{})[c]||[];const r=L.find(x=>x[0]===tid);return r?r[1]:null}
function socTN(c,tid){return (SOC_TN||{})[c+"|"+tid]||null}
/* TN: [n, gf, ga, shots, on target, shots against, on target against, corners for, corners against, cards for, cards against, fouls, fouls against, clean sheets, btts, over 2.5, possession] */
function socLgAvg(c,i){const v=Object.entries(SOC_TN||{}).filter(([k])=>k.startsWith(c+"|")).map(([,t])=>t[i]).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
function socRankOf(c,i,tid,asc){const L=Object.entries(SOC_TN||{}).filter(([k,t])=>k.startsWith(c+"|")&&t[i]!=null&&t[0]>=3).map(([k,t])=>[k.split("|")[1],t[i]]).sort((a,b)=>asc?a[1]-b[1]:b[1]-a[1]);
  const i2=L.findIndex(x=>x[0]===tid);return i2<0?null:[i2+1,L.length]}
const socOrd=n=>n==null?"–":n+(n%100>=11&&n%100<=13?"th":["th","st","nd","rd"][n%10]||"th");
/* per-match team totals from results: k = cor | card | goals */
function socMatchVal(r,k){const h=r[7]||[],a=r[8]||[];if(k==="goals")return r[5]+r[6];
  if(k==="cor")return h[2]==null||a[2]==null?null:h[2]+a[2];if(k==="card")return h[4]==null||a[4]==null?null:h[4]+(h[5]||0)+a[4]+(a[5]||0);
  if(k==="fouls")return h[3]==null||a[3]==null?null:h[3]+a[3];return null}
function socHit(tid,k,line,n){const R=socTeamRes(tid).slice(-(n||10)).map(r=>socMatchVal(r,k)).filter(v=>v!=null);return [R.filter(v=>v>line).length,R.length,R]}
function socEdgeCls(e){return e==null?"":e>=.05?"up":e<=-.05?"dn":""}
function socRefRow(c,name){if(!name)return null;const L=(SOC_REF||{})[c]||[];return L.find(x=>x[0]&&x[0].toLowerCase()===name.toLowerCase())||null}
function socRefAvg(c){const L=((SOC_REF||{})[c]||[]).filter(x=>x[1]&&x[4]!=null);const m=L.reduce((a,x)=>a+x[1],0);return m?L.reduce((a,x)=>a+x[1]*x[4],0)/m:null}
const SOC_WX={0:"☀️ Clear",1:"🌤️ Mostly clear",2:"⛅ Partly cloudy",3:"☁️ Cloudy",45:"🌫️ Fog",48:"🌫️ Fog",51:"🌦️ Light drizzle",53:"🌦️ Drizzle",55:"🌧️ Heavy drizzle",56:"🌧️ Freezing drizzle",57:"🌧️ Freezing drizzle",
  61:"🌧️ Light rain",63:"🌧️ Rain",65:"🌧️ Heavy rain",66:"🌧️ Freezing rain",67:"🌧️ Freezing rain",71:"🌨️ Light snow",73:"🌨️ Snow",75:"❄️ Heavy snow",77:"🌨️ Snow grains",80:"🌦️ Showers",81:"🌧️ Showers",82:"⛈️ Heavy showers",85:"🌨️ Snow showers",86:"❄️ Snow showers",95:"⛈️ Thunderstorm",96:"⛈️ Thunderstorm, hail",99:"⛈️ Thunderstorm, hail"};
function socWx(f,long){const w=f.wx;if(!w)return "";const [t,pp,pr,ws,wc]=w;const s=`${SOC_WX[wc]||"🌡️"} · ${Math.round(t)}°C${pp!=null?` · ${pp}% rain`:""} · wind ${Math.round(ws)} km/h`;
  if(!long)return `<span class="scwx" title="Kickoff-hour forecast (Open-Meteo)">${s}</span>`;
  const notes=[];if(ws>=35)notes.push("Strong wind — long balls and crosses get harder; it can slow scoring");else if(ws>=25)notes.push("Breezy — worth a small note for long-range shooting and crosses");
  if((pr||0)>=2||(pp||0)>=70&&[63,65,81,82].includes(wc))notes.push("Wet pitch likely — the ball skids; slips and fouls can go up");if(t<=2)notes.push("Near freezing — a heavy, slower pitch is possible");if(t>=28)notes.push("Hot — teams tend to slow the tempo late on");
  return `<div class="card xacard"><h2>🌦️ Weather at kickoff</h2><div class="xasub">${socE(f.city||"")} · forecast for the kickoff hour (Open-Meteo)</div><div style="font-size:15px;margin-top:6px">${s}${pr?` · ${pr} mm`:""}</div>${notes.length?`<ul class="small" style="margin:8px 0 0 18px">${notes.map(n=>`<li>${n}</li>`).join("")}</ul>`:`<div class="small" style="margin-top:6px">No weather worries for this one.</div>`}</div>`}

/* ---------- bets ---------- */
function socSpec(f,kind,side,line,odds,book,extra){const title=kind==="ml"?(side==="d"?`${socTm(f.h)} v ${socTm(f.a)} — Draw`:`${socTm(side==="h"?f.h:f.a)} to win`)
  :kind==="tot"?`${socTm(f.h)} v ${socTm(f.a)} ${side==="o"?"Over":"Under"} ${line} goals`:kind==="btts"?`${socTm(f.h)} v ${socTm(f.a)} — both teams to score: ${side==="y"?"Yes":"No"}`
  :kind==="cor"?`${socTm(f.h)} v ${socTm(f.a)} ${side==="o"?"Over":"Under"} ${line} corners`:kind==="card"?`${socTm(f.h)} v ${socTm(f.a)} ${side==="o"?"Over":"Under"} ${line} cards`:(extra&&extra.title)||"Soccer bet";
  return Object.assign({k:"soc",kind,side,line,match:f.id,home:f.h,away:f.a,comp:f.c,date:socDay(f.t),odds,book,title},extra||{})}
function socBetBtn(spec){return `<button class="betplus" data-bet='${socE(JSON.stringify(spec))}' title="Add to My Bets" aria-label="Add to My Bets">＋</button>`}
/* grading (My Bets): needs soccer_data.js (+ soccer_players.js for player bets); pending until loaded */
function socGrade(b){if(typeof SOC_RES==="undefined"||!window.SOC_OK){socEnsure();return {r:"pending"}}
  const r=socResIdx()[b.match];if(!r)return {r:"pending"};const why=`Final: ${socTm(r[3])} ${r[5]}-${r[6]} ${socTm(r[4])}`;
  if(b.kind==="ml"){const w=r[5]>r[6]?"h":r[5]<r[6]?"a":"d";return {r:w===b.side?"win":"loss",why}}
  const ou=(v,u)=>v==null?{r:"pending"}:{r:v===b.line?"push":((b.side==="o")===(v>b.line))?"win":"loss",why:`${why} · ${v} ${u}`};
  if(b.kind==="tot")return ou(r[5]+r[6],"goals");if(b.kind==="cor")return ou(socMatchVal(r,"cor"),"corners");if(b.kind==="card")return ou(socMatchVal(r,"card"),"cards");
  if(b.kind==="btts")return {r:((r[5]>0&&r[6]>0)===(b.side==="y"))?"win":"loss",why};
  if(b.kind==="prop"){if(!window.SOC_P_OK){socPEnsure();return {r:"pending"}}const P=SOC_P[b.pid];const g=P&&P[3].find(x=>x[0]===b.match);if(!g)return {r:"void",why:"Did not play — no action"};
    const v=socVal(g,b.mk);return {r:v===b.line?"push":((b.side==="o")===(v>b.line))?"win":"loss",why:`Final: ${v} ${(SOC_MK[b.mk]||[])[2]||""}`}}
  return {r:"pending"}}

/* ---------- player numbers ---------- */
function socVal(g,mk){const m=SOC_MK[mk];if(!m)return null;if(mk==="sga")return g[5]+g[6];return g[m[3]]}
function socPlayerGames(aid){const P=window.SOC_P&&SOC_P[aid];return P?P[3]:[]}
function socLam(aid,mk,f){const G=socPlayerGames(aid).filter(g=>g[2]>=15).slice(-10);if(G.length<3)return null;
  const mins=G.reduce((a,g)=>a+g[2],0),tot=G.reduce((a,g)=>a+(socVal(g,mk)||0),0),r90=tot/mins*90;
  const st=G.slice(-5),em=f&&f.lu?((Object.values(f.lu).some(L=>L.includes(SOC_P[aid][0])))?Math.max(70,st.filter(g=>g[1]).reduce((a,g)=>a+g[2],0)/Math.max(1,st.filter(g=>g[1]).length)):20):st.reduce((a,g)=>a+g[2],0)/st.length;
  let adj=1;if(f){const me=SOC_P[aid][1],opp=me===f.h?f.a:f.h,T=socTN(f.c,opp),lg=i=>socLgAvg(f.c,i);
    const sh=(v,n)=>(v*n+5)/(n+5);
    if(T){if(["sgoal","s2g","ssot","sshot","sga","sast"].includes(mk)){const i=mk==="sshot"?5:6;const a=lg(i);if(a&&T[i]!=null)adj=sh(T[i]/a,T[0])}
      else if(mk==="sfoul"){const a=lg(12);if(a&&T[12]!=null)adj=sh(T[12]/a,T[0])}else if(mk==="sfwon"){const a=lg(11);if(a&&T[11]!=null)adj=sh(T[11]/a,T[0])}}}
  return {lam:r90*em/90*adj,r90,em,adj,n:G.length}}
function socPover(lam,line){if(lam==null)return null;const k=Math.floor(line);let c=0,p=Math.exp(-lam);for(let i=0;i<=k;i++){c+=p;p*=lam/(i+1)}return 1-c}
function socHitP(aid,mk,line,n){const G=socPlayerGames(aid).filter(g=>g[2]>=15).slice(-(n||10));const V=G.map(g=>socVal(g,mk));return [V.filter(v=>v>line).length,V.length,G]}

/* ---------- match card ---------- */
function socLgOk(c){return !SC.lgs.length||SC.lgs.includes(c)}
function socLgSave(){try{localStorage.setItem("ge_soclgs",JSON.stringify(SC.lgs))}catch(e){}}
function socFxOn(d){return (SOC_FX||[]).filter(f=>socDay(f.t)===d&&socLgOk(f.c))}
function socEdges(f){const O=f.odds||{},P=f.proj;if(!P)return [];const C=[],add=(e,t,o,kind,side,line,book)=>{if(e!=null&&o!=null)C.push({e,t,o,spec:socSpec(f,kind,side,line,o,book)})};
  if(O.ml)[["h",0],["d",1],["a",2]].forEach(([k,i])=>add(P.p[i]-socImp(O.ml[k]),k==="d"?"Draw":socTm(k==="h"?f.h:f.a)+" to win",O.ml[k],"ml",k,null,O.ml[k+"b"]));
  const mt=O.main_tot;if(mt&&O.tot&&O.tot[mt]&&P.o[mt]!=null){const [o,ob,u,ub]=O.tot[mt];if(o!=null)add(P.o[mt]-socImp(o),`Over ${mt} goals`,o,"tot","o",+mt,ob);if(u!=null)add(1-P.o[mt]-socImp(u),`Under ${mt} goals`,u,"tot","u",+mt,ub)}
  if(O.btts&&P.btts!=null){if(O.btts.y!=null)add(P.btts-socImp(O.btts.y),"Both teams to score",O.btts.y,"btts","y",null,O.btts.yb);if(O.btts.n!=null)add(1-P.btts-socImp(O.btts.n),"BTTS: No",O.btts.n,"btts","n",null,O.btts.nb)}
  const mc=O.main_cor;if(mc&&O.cor&&O.cor[mc]&&P.cor&&P.cor.o[mc]!=null){const [o,ob,u,ub]=O.cor[mc];if(o!=null)add(P.cor.o[mc]-socImp(o),`Over ${mc} corners`,o,"cor","o",+mc,ob);if(u!=null)add(1-P.cor.o[mc]-socImp(u),`Under ${mc} corners`,u,"cor","u",+mc,ub)}
  return C.sort((a,b)=>b.e-a.e)}
function socBestEdge(f){return socEdges(f)[0]||null}
/* ⭐ soccer plays of the day (picked + locked by tools/track.js, graded there) */
function socPickPlays(d){const F=(SOC_FX||[]).filter(f=>socDay(f.t)===d&&!socStarted(f)&&f.odds),P=[];
  const G=F.map(f=>({f,b:socEdges(f).find(x=>x.e>=.05&&x.o>=-200&&x.o<=250)})).filter(x=>x.b).sort((a,b)=>b.b.e-a.b.e).slice(0,2);
  for(const x of G)P.push(Object.assign({},x.b.spec,{type:"game",why:`our ${Math.round((x.b.e+socImp(x.b.o))*100)}% vs ${Math.round(socImp(x.b.o)*100)}% the price needs`}));
  if(window.SOC_P_OK){const used=new Set(G.map(x=>x.f.id));for(const x of socBestProps().filter(x=>socDay(x.f.t)===d&&x.edge>=.05&&x.n>=8&&x.h/x.n>=.6&&x.price>=-200&&x.price<=300)){if(P.length>=3)break;
    P.push(Object.assign(socSpec(x.f,"prop","o",x.line,x.price,x.book,{pid:x.aid,mk:x.mk,player:x.nm,title:`${x.nm} ${socPropLab(x.mk,x.line)}`}),{type:"prop",why:`hit ${x.h}/${x.n} last 10 · our ${Math.round(x.our*100)}% vs ${Math.round(x.im*100)}% needed`}))}}
  return P}
function socPlaysCard(){const T=typeof TRACK!=="undefined"&&TRACK&&TRACK.today&&TRACK.today.soc||[],S=typeof TRACK!=="undefined"&&TRACK&&TRACK.sum&&TRACK.sum.soc&&TRACK.sum.soc.plays;
  const D=T.find(x=>x.plays&&x.plays.length);if(!D)return "";const rec=S&&(S.w+S.l)?`${S.w}-${S.l}${S.p?"-"+S.p:""} · ${S.u>0?"+":""}${S.u}u`:"tracking just started";
  return `<div class="card potd" style="margin-bottom:12px"><h2 style="margin-bottom:2px">⭐ Soccer plays of the day</h2><div class="small" style="margin-bottom:6px">Locked before kickoff · counted in our record (${rec})</div>
   ${D.plays.map((x,i)=>{const g=window.SOC_OK?socGrade(x):{r:x.r||"pending"},r=x.r||g.r;return `<div class="pod"><div class="podn">${i+1}</div><div style="min-width:0;flex:1"><a href="#soccer-${r!=="pending"?"match-":"game-"}${x.match}"><b>${socE(x.title)}</b></a><div class="small">${socO(x.odds)}${x.book?" · "+socE(x.book):""} · ${socE(x.why||"")}</div></div><div class="small">${r==="win"?"✅ Win":r==="loss"?"❌ Loss":r==="push"?"↩️ Push":r==="void"?"Void":"⏳"}</div></div>`}).join("")}</div>`}
function socCard(f){const O=f.odds||{},P=f.proj,st=socStarted(f),fin=f.state==="post",rh=socRank(f.c,f.h),ra=socRank(f.c,f.a);
  const cell=(lab,o,p)=>`<div class="scod"><span>${lab}</span><b>${socO(o)}</b>${p!=null?`<em class="${o!=null&&p-socImp(o)>=.05?"up":""}">${socPct(p)}</em>`:""}</div>`;
  const mt=O.main_tot||"2.5",mc=O.main_cor,be=!st&&socBestEdge(f);
  return `<a class="card sccard" href="#soccer-game-${f.id}">
   <div class="row" style="align-items:center;gap:6px">${socLgChip(f.c)}<span class="small">${fin?"<b>FINAL</b>":st?"<b class='up'>LIVE</b>":socTime(f.t)+" "+socTZ()}</span>${socCountdown(f)}<span class="sp"></span>${socWx(f)}</div>
   <div class="scteams"><div>${socBadge(f.h)} <b>${socE(socTm(f.h))}</b>${rh?` <span class="small">${socOrd(rh)}</span>`:""}<span class="scfm">${socForm(f.h)}</span></div>
     <div>${socBadge(f.a)} <b>${socE(socTm(f.a))}</b>${ra?` <span class="small">${socOrd(ra)}</span>`:""}<span class="scfm">${socForm(f.a)}</span></div></div>
   ${O.ml||P?`<div class="scodds">${cell("1",O.ml&&O.ml.h,P&&P.p[0])}${cell("X",O.ml&&O.ml.d,P&&P.p[1])}${cell("2",O.ml&&O.ml.a,P&&P.p[2])}
     ${cell("O "+mt,O.tot&&O.tot[mt]&&O.tot[mt][0],P&&P.o[mt])}${cell("BTTS",O.btts&&O.btts.y,P&&P.btts)}</div>`:""}
   <div class="small scsum">${P&&P.cor?`🚩 Corners: we expect <b>${P.cor.t.toFixed(1)}</b>${mc?` (line ${mc})`:""}`:""}${P&&P.card?` · 🟨 Cards: <b>${P.card.t.toFixed(1)}</b>${f.ref?` · ref ${socE(f.ref)}`:""}`:""}</div>
   ${st?"":socVerdictHtml(f)}
   ${O.ml||P?`<div class="small scpct">Odds = best US book · % = our estimate</div>`:`<div class="small">No odds yet — books usually post 2–3 days before kickoff.</div>`}</a>`}
function socLgFilter(){return `<div class="seg sclgf"><button class="btn${SC.lgs.length?"":" on"}" data-sclg="all">All</button>${Object.entries(SOC_LG).map(([k,v])=>`<button class="btn${SC.lgs.includes(k)?" on":""}" data-sclg="${k}">${socE(v.sh)}</button>`).join("")}</div><div class="small" style="margin:-2px 0 6px">${SC.lgs.length?"⭐ Showing your leagues — remembered on this device. Tap a league to add or remove it.":"Tap leagues to show only those — your choice is remembered."}</div>`}
function socLgWire(el,redraw){el.querySelectorAll("[data-sclg]").forEach(b=>b.onclick=()=>{const k=b.dataset.sclg;if(k==="all")SC.lgs=[];else SC.lgs=SC.lgs.includes(k)?SC.lgs.filter(x=>x!==k):[...SC.lgs,k];socLgSave();redraw()})}
function socDays(){const d0=socToday();return [...new Set((SOC_FX||[]).filter(f=>socLgOk(f.c)).map(f=>socDay(f.t)).filter(d=>d>=d0))].sort().slice(0,7)}
function socDayTabs(D,cur){const d0=socToday();return `<div class="gtabs scdays">${D.map(d=>{const c=(SOC_FX||[]).filter(f=>socDay(f.t)===d&&socLgOk(f.c)).length,n=Math.round((Date.parse(d)-Date.parse(d0))/864e5);
  return `<a href="#" data-scday="${d}" class="${d===cur?"on":""}">${n===0?"Today":n===1?"Tomorrow":new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{timeZone:"UTC",weekday:"short",day:"numeric"})}<small>${c}</small></a>`}).join("")}</div>`}
function socMatches(el){const D=socDays();if(!D.includes(SC.day))SC.day=D[0]||socToday();const d=SC.day,F=socFxOn(d);
  const byLg={};F.forEach(f=>(byLg[f.c]=byLg[f.c]||[]).push(f));
  const gap=D.length&&D[0]>socAddDays(socToday(),1)?`<div class="card small" style="margin:8px 0">No matches in the next couple of days (international break) — the next ones are below.</div>`:"";
  el.innerHTML=`<h1>⚽ Soccer · ${socE(socDayS(d))}</h1>${socPlaysCard()}${socDayTabs(D,d)}${socLgFilter()}${gap}
  <p class="sub">Premier League, La Liga, Serie A, Bundesliga, Ligue 1 and the three European cups. Every match shows the best US odds and <b>our estimate</b> — tap one for corners, cards, referee, weather and player props.</p>
  ${F.length?Object.entries(byLg).map(([c,L])=>`<h2 class="tsh">${socLgChip(c)} ${socE((SOC_LG[c]||{}).n||c)}</h2><div class="grid g2">${L.map(socCard).join("")}</div>`).join(""):`<div class="card"><p>No upcoming matches${SC.lgs.length?" in your leagues":""} in the next 2 weeks.</p></div>`}
  ${socFoot()}`;
  el.querySelectorAll("[data-scday]").forEach(a=>a.onclick=e=>{e.preventDefault();SC.day=a.dataset.scday;socMatches(el)});
  socLgWire(el,()=>socMatches(el))}
function socFoot(){return `<p class="small" style="margin-top:14px">Stats: ESPN box scores of every match this season (all 8 competitions). Odds: licensed US books via PropLine${typeof SOC_ODDS_AT!=="undefined"&&SOC_ODDS_AT?` (read ${typeof freshAge!=="undefined"?freshAge(SOC_ODDS_AT):SOC_ODDS_AT})`:""}. Referee card numbers: PropLine. Weather: Open-Meteo. Data updated ${socE(SOC_GEN||"")}. Estimates are leans from past numbers, not guarantees.</p>`}

/* ---------- game page ---------- */
function socHero(f){const st=socStarted(f),fin=f.state==="post";
  return `<div class="card nhhero"><div class="small">${socLgChip(f.c)} ${socE(socDayS(socDay(f.t)))} · ${socTime(f.t)} ${socTZ()}${f.ven?" · "+socE(f.ven):""} ${socCountdown(f)}</div>
  <div class="nhht" style="margin-top:10px"><div class="ght">${socBadge(f.h,1)}${socTL(f.h,`<b>${socE(socTmFull(f.h))}</b>`)}<span class="small">${socRank(f.c,f.h)?socOrd(socRank(f.c,f.h))+" · ":""}home</span><span class="scfm">${socForm(f.h,6)}</span></div>
   <div class="ght"><b style="font-size:22px">${fin||st?`${f.hs??""} – ${f.as??""}`:"v"}</b><span class="small">${fin?"Final":st?socE(f.detail||"Live"):""}</span></div>
   <div class="ght">${socBadge(f.a,1)}${socTL(f.a,`<b>${socE(socTmFull(f.a))}</b>`)}<span class="small">${socRank(f.c,f.a)?socOrd(socRank(f.c,f.a))+" · ":""}away</span><span class="scfm">${socForm(f.a,6)}</span></div></div>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">${socWx(f)}${f.ref?`<span class="pill">🧑‍⚖️ Ref: ${socE(f.ref)}</span>`:""}${f.lu?`<span class="pill">📋 Lineups confirmed</span>`:""}</div></div>`}
function socQuick(f){const out=[],S=(c,ic,t)=>out.push({c,ic,t}),P=f.proj,A=socTN(f.c,f.h),B=socTN(f.c,f.a),hN=socE(socTm(f.h)),aN=socE(socTm(f.a)),L=SOC_LG[f.c]||{};
  if(P){const fav=P.p[0]>P.p[2]?[hN,P.p[0]]:[aN,P.p[2]];S(fav[1]>=.55?"good":"",fav[1]>=.55?"✅":"⚖️",`We make <b>${fav[0]}</b> ${socPct(fav[1])} to win (draw ${socPct(P.p[1])}) — expected score ${P.lh.toFixed(1)}–${P.la.toFixed(1)}.`)}
  if(A&&B){const ov=(A[15]+B[15])/(A[0]+B[0]);S(ov>=.6?"good":ov<=.4?"bad":"","⚽",`Over 2.5 goals landed in <b>${A[15]}/${A[0]}</b> ${hN} games and <b>${B[15]}/${B[0]}</b> ${aN} games this season (${L.sh||""} average ${socPct(L.o25)}).`);
    S("","🤝",`Both teams scored in ${A[14]}/${A[0]} ${hN} and ${B[14]}/${B[0]} ${aN} games · clean sheets: ${A[13]} and ${B[13]}.`)}
  if(P&&P.cor){const [h1,n1]=socHit(f.h,"cor",9.5),[h2,n2]=socHit(f.a,"cor",9.5);S(P.cor.t>=10.5?"good":P.cor.t<=8.5?"bad":"","🚩",`Corners: we expect <b>${P.cor.t.toFixed(1)}</b> (${hN} ${P.cor.h.toFixed(1)}, ${aN} ${P.cor.a.toFixed(1)}). Over 9.5 hit in ${h1}/${n1} of ${hN}'s and ${h2}/${n2} of ${aN}'s last games.`)}
  if(P&&P.card){const r=socRefRow(f.c,f.ref),avg=socRefAvg(f.c);S(P.card.t>=5?"good":P.card.t<=3.5?"bad":"","🟨",`Cards: we expect <b>${P.card.t.toFixed(1)}</b>${r&&avg?` — referee <b>${socE(f.ref)}</b> averages ${r[4].toFixed(2)} a match (${(SOC_LG[f.c]||{}).sh} refs ${avg.toFixed(2)})`:f.ref?"":" — referee not announced yet"}.`)}
  if(f.miss)for(const [tid,L] of Object.entries(f.miss)){const red=L.filter(x=>x[1]==="red"),ms=L.filter(x=>x[1]==="miss");if(red.length)S("bad","🟥",`${socE(socTm(tid))}: ${red.map(x=>`<b>${socE(x[0])}</b>`).join(", ")} sent off last match — likely suspended.`);if(ms.length)S("bad","🚑",`${socE(socTm(tid))}: ${ms.slice(0,3).map(x=>`<b>${socE(x[0])}</b>`).join(", ")} missed the last 2 matches after starting regularly.`)}
  if(f.wx&&f.wx[3]>=30)S("bad","💨",`Windy at kickoff (${Math.round(f.wx[3])} km/h) — a small knock on goals and crossing.`);
  return out}
function socRowEst(lab,our,o,ob,spec){const im=socImp(o),e=our!=null&&im!=null?our-im:null;
  return `<tr><td>${lab}</td><td><b>${socPct(our)}</b></td><td>${o!=null?`<div class="scob"><span><b>${socO(o)}</b><div class="small">${socE(ob||"")}</div></span>${spec?socBetBtn(spec):""}</div>`:`<span class="small">no US line</span>`}</td><td class="${socEdgeCls(e)}">${e!=null?`${e>0?"+":""}${Math.round(e*100)}%<div class="small">needs ${socPct(im)}</div>`:"–"}</td></tr>`}
/* 1) one-line verdict */
function socVerdict(f){const P=f.proj,O=f.odds;if(!P)return {c:"",t:"Not enough matches yet for our estimate."};
  if(O&&(O.ml||O.tot)){const b=socBestEdge(f);if(b&&b.e>=.04)return {c:"good",t:`✅ <b>Lean: ${socE(b.t)}</b> ${socO(b.o)} — our ${socPct(b.e+socImp(b.o))} vs ${socPct(socImp(b.o))} the price needs`};
    return {c:"",t:`➖ <b>No clear edge</b> — the prices are close to our numbers${b?` (closest: ${socE(b.t)} ${socO(b.o)})`:""}`}}
  const fav=P.p[0]>=P.p[2]?[f.h,P.p[0]]:[f.a,P.p[2]],ou=P.o["2.5"];
  return {c:"",t:`📊 <b>Our numbers:</b> ${socE(socTm(fav[0]))} ${socPct(fav[1])} to win · ${ou>=.5?"Over":"Under"} 2.5 goals ${socPct(ou>=.5?ou:1-ou)}${P.cor?` · ~${P.cor.t.toFixed(1)} corners`:""}${P.card?` · ~${P.card.t.toFixed(1)} cards`:""} <span class="small">(odds not posted yet)</span>`}}
function socVerdictHtml(f,big){const v=socVerdict(f);return `<div class="scverd ${v.c}${big?" big":""}">${v.t}</div>`}
/* 2) estimate table: main lines first, the rest one tap away */
function socNear(P,keys){let best=null;for(const k of keys){if(P.o[k]==null)continue;const d=Math.abs(P.o[k]-.5);if(!best||d<best[1])best=[k,d]}return best&&best[0]}
function socEstTable(f){const P=f.proj,O=f.odds||{};if(!P&&!f.odds)return "";const rows=[];let extra=0;
  const head=t=>rows.push(`<tr class="scth"><td colspan="4">${t}</td></tr>`);
  const add=(main,html)=>{if(!main){extra++;rows.push(html.replace("<tr>",'<tr class="scx">'))}else rows.push(html)};
  head("🏆 Match result");[["h",0,socTm(f.h)+" win"],["d",1,"Draw"],["a",2,socTm(f.a)+" win"]].forEach(([k,i,l])=>add(1,socRowEst(socE(l),P&&P.p[i],O.ml&&O.ml[k],O.ml&&O.ml[k+"b"],socSpec(f,"ml",k,null,O.ml&&O.ml[k],O.ml&&O.ml[k+"b"]))));
  const mt=O.main_tot||"2.5";head(`⚽ Total goals`);for(const ln of ["1.5","2.5","3.5"]){const T=O.tot&&O.tot[ln],m=ln===mt;
    add(m,socRowEst(`Over ${ln}`,P&&P.o[ln],T&&T[0],T&&T[1],socSpec(f,"tot","o",+ln,T&&T[0],T&&T[1])));add(m,socRowEst(`Under ${ln}`,P&&P.o[ln]!=null?1-P.o[ln]:null,T&&T[2],T&&T[3],socSpec(f,"tot","u",+ln,T&&T[2],T&&T[3])))}
  head("🤝 Both teams to score");add(1,socRowEst("Yes",P&&P.btts,O.btts&&O.btts.y,O.btts&&O.btts.yb,socSpec(f,"btts","y",null,O.btts&&O.btts.y,O.btts&&O.btts.yb)));add(1,socRowEst("No",P&&P.btts!=null?1-P.btts:null,O.btts&&O.btts.n,O.btts&&O.btts.nb,socSpec(f,"btts","n",null,O.btts&&O.btts.n,O.btts&&O.btts.nb)));
  if(P&&P.cor||O.cor){head("🚩 Total corners");const lines=[...new Set([...(O.cor?Object.keys(O.cor):[]),"8.5","9.5","10.5","11.5"])].filter(l=>P&&P.cor&&P.cor.o[l]!=null||O.cor&&O.cor[l]).sort((a,b)=>a-b).slice(0,5);
    const mc=O.main_cor||(P&&P.cor&&socNear(P.cor,lines));
    for(const ln of lines){const T=O.cor&&O.cor[ln],p=P&&P.cor&&P.cor.o[ln],m=ln===mc;add(m,socRowEst(`Over ${ln}`,p,T&&T[0],T&&T[1],socSpec(f,"cor","o",+ln,T&&T[0],T&&T[1])));add(m,socRowEst(`Under ${ln}`,p!=null?1-p:null,T&&T[2],T&&T[3],socSpec(f,"cor","u",+ln,T&&T[2],T&&T[3])))}}
  if(P&&P.card){head("🟨 Total cards (yellow + red)");const X=O.extra&&Object.entries(O.extra).find(([k])=>/card|booking/i.test(k)),mk=socNear(P.card,["2.5","3.5","4.5","5.5"]);
    for(const ln of ["2.5","3.5","4.5","5.5"]){const T=X&&X[1][ln],p=P.card.o[ln],m=ln===mk;add(m,socRowEst(`Over ${ln}`,p,T&&T[0],T&&T[1],socSpec(f,"card","o",+ln,T&&T[0],T&&T[1])));add(m,socRowEst(`Under ${ln}`,p!=null?1-p:null,T&&T[2],T&&T[3],socSpec(f,"card","u",+ln,T&&T[2],T&&T[3])))}}
  const mv=O.open&&O.ml&&O.open.ml?((a,b)=>a!=null&&b!=null&&a!==b?`<div class="small" style="margin-top:6px">📈 Opened ${socTm(f.h)} ${socO(O.open.ml[0])} · draw ${socO(O.open.ml[1])} · ${socTm(f.a)} ${socO(O.open.ml[2])} → now ${socO(O.ml.h)} / ${socO(O.ml.d)} / ${socO(O.ml.a)}</div>`:"")(O.open.ml[0],O.ml.h):"";
  return `<div class="card scest"><h2>💰 Our estimate vs the books</h2><div class="xasub">The main line of each market. “Needs” = the chance the price implies; green edge = we beat it by 5%+.</div>
   <div class="alw"><table class="altt sctbl est"><thead><tr><th>Bet</th><th>Ours</th><th>Best odds</th><th>Edge</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
   ${extra?`<button class="btn" data-scx="1" style="margin-top:8px;width:100%">See all lines (${extra} more)</button>`:""}${mv}
   <details class="xadeep" style="margin-top:6px"><summary class="small">How we estimate</summary><div class="small" style="margin-top:4px">${P?`Each team's goals and shots on target for/against this season in ${socE((SOC_LG[f.c]||{}).n||"")}, home advantage, and a standard goals model. Corners and cards: each team's for/against averages, the referee when he's known, and how spread out those counts really are in this league.`:`Not enough matches yet (we need 3+ per team in this competition).`}</div></details></div>`}
function socTeamCmp(f){const A=socTN(f.c,f.h),B=socTN(f.c,f.a);if(!A||!B)return "";const c=f.c,lg=i=>socLgAvg(c,i);
  const row=(lab,i,dec,asc,tip)=>{const ra=socRankOf(c,i,f.h,asc),rb=socRankOf(c,i,f.a,asc),fa=x=>x==null?"–":(+x).toFixed(dec);
    return `<tr><td>${lab}${tip?` <span class="small">${tip}</span>`:""}</td><td><b>${fa(A[i])}</b> <span class="small">${ra?socOrd(ra[0]):""}</span></td><td><b>${fa(B[i])}</b> <span class="small">${rb?socOrd(rb[0]):""}</span></td><td class="small">${fa(lg(i))}</td></tr>`};
  const g=(T,i)=>T[0]?(T[i]/T[0]).toFixed(2):"–";
  return `<div class="card"><h2>📊 Team numbers <span class="small">per match · rank in ${socE((SOC_LG[c]||{}).sh||"")}</span></h2><div class="alw"><table class="altt sctbl"><thead><tr><th></th><th>${socBadge(f.h)}</th><th>${socBadge(f.a)}</th><th>League</th></tr></thead><tbody>
   <tr><td>Goals scored</td><td><b>${g(A,1)}</b></td><td><b>${g(B,1)}</b></td><td class="small">${(((SOC_LG[c]||{}).hg||0)/2+((SOC_LG[c]||{}).ag||0)/2).toFixed(2)}</td></tr>
   <tr><td>Goals allowed</td><td><b>${g(A,2)}</b></td><td><b>${g(B,2)}</b></td><td></td></tr>
   ${row("Shots",3,1)}${row("Shots on target",4,1)}${row("Shots allowed",5,1,1)}${row("On target allowed",6,1,1)}${row("Corners won",7,1)}${row("Corners allowed",8,1,1)}${row("Cards",9,2)}${row("Opponent cards",10,2,0,"(they draw)")}${row("Fouls committed",11,1)}${row("Fouled",12,1)}${row("Possession %",16,0)}
  </tbody></table></div></div>`}
function socChips(R,line,lab){return `<div class="scchips">${R.map(v=>`<i class="${v>line?"y":"n"}" title="${v} ${lab}">${v}</i>`).join("")}</div>`}
function socCornerCard(f){const P=f.proj,O=f.odds||{},mc=O.main_cor||"9.5";const [h1,n1,R1]=socHit(f.h,"cor",+mc),[h2,n2,R2]=socHit(f.a,"cor",+mc);if(!n1&&!n2)return "";
  const A=socTN(f.c,f.h),B=socTN(f.c,f.a);
  return `<div class="card xacard"><h2>🚩 Corners</h2><div class="xasub">Total corners in each team's last 10 matches (all competitions) · line ${mc}</div>
   <div class="sc2"><div><b>${socE(socTm(f.h))}</b> — over ${mc} in <b>${h1}/${n1}</b>${socChips(R1,+mc,"corners")}${A?`<div class="small">Wins ${A[7]} a game, allows ${A[8]}</div>`:""}</div>
   <div><b>${socE(socTm(f.a))}</b> — over ${mc} in <b>${h2}/${n2}</b>${socChips(R2,+mc,"corners")}${B?`<div class="small">Wins ${B[7]} a game, allows ${B[8]}</div>`:""}</div></div>
   ${P&&P.cor?`<div style="margin-top:8px">Our expected corners: <b>${P.cor.t.toFixed(1)}</b> · ${socE(socTm(f.h))} ${P.cor.h.toFixed(1)} · ${socE(socTm(f.a))} ${P.cor.a.toFixed(1)}${P.cor.disp?` <span class="small">(corner counts in this league vary ${P.cor.disp>1.1?"more":"about as much"} than a simple model assumes — accounted for)</span>`:""}</div>`:""}
   ${O.cor?`<div class="small" style="margin-top:4px">Books: ${Object.entries(O.cor).slice(0,6).map(([l,v])=>`${l}: O ${socO(v[0])} / U ${socO(v[2])}`).join(" · ")}</div>`:`<div class="small" style="margin-top:4px">No corners line from US books yet.</div>`}</div>`}
function socCardCard(f){const P=f.proj,c=f.c,r=socRefRow(c,f.ref),avg=socRefAvg(c);const [h1,n1,R1]=socHit(f.h,"card",3.5),[h2,n2,R2]=socHit(f.a,"card",3.5);if(!n1&&!n2)return "";const A=socTN(c,f.h),B=socTN(c,f.a);
  const X=(f.odds||{}).extra&&Object.entries(f.odds.extra).find(([k])=>/card|booking/i.test(k));
  return `<div class="card xacard"><h2>🟨 Cards &amp; referee</h2><div class="xasub">Yellow + red cards in each team's last 10 matches · line 3.5</div>
   <div class="sc2"><div><b>${socE(socTm(f.h))}</b> — over 3.5 in <b>${h1}/${n1}</b>${socChips(R1,3.5,"cards")}${A?`<div class="small">Gets ${A[9]} cards a game · opponents get ${A[10]} · fouls ${A[11]}</div>`:""}</div>
   <div><b>${socE(socTm(f.a))}</b> — over 3.5 in <b>${h2}/${n2}</b>${socChips(R2,3.5,"cards")}${B?`<div class="small">Gets ${B[9]} cards a game · opponents get ${B[10]} · fouls ${B[11]}</div>`:""}</div></div>
   <div class="scref">${f.ref?(r?`🧑‍⚖️ <b>${socE(f.ref)}</b>: ${r[4].toFixed(2)} cards a match over ${r[1]} matches (${r[2].toFixed(2)} yellow, ${r[3].toFixed(2)} red)${avg?` · league refs average <b>${avg.toFixed(2)}</b> — he's ${r[4]>avg*1.08?"<b class='up'>stricter</b>":r[4]<avg*.92?"<b class='dn'>more lenient</b>":"about average"}`:""}`:`🧑‍⚖️ <b>${socE(f.ref)}</b> — no card history in our data`):`🧑‍⚖️ Referee not announced yet — usually 2–4 days before the match. ${avg?`League refs average ${avg.toFixed(2)} cards a match.`:""}`}</div>
   ${P&&P.card?`<div style="margin-top:8px">Our expected cards: <b>${P.card.t.toFixed(1)}</b> · ${socE(socTm(f.h))} ${P.card.h.toFixed(1)} · ${socE(socTm(f.a))} ${P.card.a.toFixed(1)}${P.card.rf&&P.card.rf!==1?` <span class="small">(referee adjustment ×${P.card.rf.toFixed(2)})</span>`:""}</div>`:""}
   <div class="small" style="margin-top:4px">${X?`Books: ${Object.entries(X[1]).slice(0,5).map(([l,v])=>`${l.split("|")[0]}: O ${socO(v[0])} / U ${socO(v[2])}`).join(" · ")}`:"US books in our feed don't post a cards line yet — use our estimate to judge one where you bet."}</div></div>`}
function socFormCard(f){const side=tid=>`<div><h3 style="margin:0 0 6px">${socBadge(tid)} ${socTL(tid,socE(socTm(tid)))}</h3>${socTeamRes(tid).slice(-6).reverse().map(r=>socResLine(r,tid)).join("")||`<div class="small">No matches yet</div>`}</div>`;
  return `<div class="card"><h2>📅 Recent form</h2><div class="xasub">Tap a match for its stats and every player's numbers</div><div class="sc2">${side(f.h)}${side(f.a)}</div></div>`}
function socMissCard(f){const L=f.lu,M=f.miss||{};if(!L&&!Object.keys(M).length)return `<div class="card xacard xadeep"><h2>🚑 Team news</h2><div class="small">Nobody who started regularly has missed the last 2 matches, and no one was sent off. Lineups appear here about an hour before kickoff. (ESPN publishes no injury list for soccer, so this is what the match data shows.)</div></div>`;
  const side=tid=>`<div><h3 style="margin:0 0 6px">${socBadge(tid)} ${socE(socTm(tid))}</h3>${(M[tid]||[]).map(x=>`<div class="small">${x[1]==="red"?"🟥":"🚑"} <b>${socE(x[0])}</b> — ${socE(x[2])}</div>`).join("")||`<div class="small">No regular starters missing.</div>`}${L&&L[tid]?`<div class="small" style="margin-top:6px"><b>Starting XI:</b> ${L[tid].map(socE).join(", ")}</div>`:""}</div>`;
  return `<div class="card"><h2>🚑 Team news &amp; lineups</h2><div class="xasub">${L?"Confirmed lineups":"Lineups appear about an hour before kickoff"} · ESPN has no soccer injury list, so we flag regular starters who missed the last 2 matches and red-card bans</div><div class="sc2">${side(f.h)}${side(f.a)}</div></div>`}
function socGame(el,id){const f=socFx(id);if(!f){el.innerHTML=`<p><a href="#soccer">← All matches</a></p><div class="card">This match isn't in our list any more (finished matches move to the results). <a href="#soccer">See today's matches</a>.</div>`;return}
  const tab=SC.tab==="props"?"props":"game",np=(SOC_PROPS||[]).filter(r=>r[5]===f.id).length;
  el.innerHTML=`<p><a href="#soccer">← All matches</a></p>${socHero(f)}
   <div class="seg nbgtabs" style="margin:12px 0"><button class="btn${tab==="game"?" on":""}" data-sctab="game">📊 Match</button><button class="btn${tab==="props"?" on":""}" data-sctab="props">🎯 Player props ${np?`<small class="pcnt">${np}</small>`:""}</button></div>
   <div id="scBody"></div>`;
  const body=el.querySelector("#scBody");
  const draw=()=>{if(SC.tab==="props"){body.innerHTML=`<div class="small">Loading players…</div>`;socPEnsure(()=>{body.innerHTML=socGameProps(f);socWire(body)})}
    else{body.innerHTML=`${socVerdictHtml(f,1)}${typeof xQuickHtml!=="undefined"?xQuickHtml(socQuick(f),"Automatic notes from this season's numbers — reasons to look closer, not picks."):""}${socEstTable(f)}${socCornerCard(f)}${socCardCard(f)}${socTeamCmp(f)}${socFormCard(f)}${socH2HCard(f)}${socMissCard(f)}${f.wx?socWx(f,1):""}${socFoot()}`;socWire(body)}};
  el.querySelectorAll("[data-sctab]").forEach(b=>b.onclick=()=>{SC.tab=b.dataset.sctab;el.querySelectorAll("[data-sctab]").forEach(x=>x.classList.toggle("on",x===b));draw()});draw()}
function socWire(el){el.querySelectorAll("[data-scx]").forEach(b=>b.onclick=()=>{const c=b.closest(".scest");b.dataset.t0=b.dataset.t0||b.textContent;const on=c.classList.toggle("open");b.textContent=on?"Show main lines only":b.dataset.t0})}

/* ---------- player props ---------- */
function socPropEval(r,f){const [nm,mk,line,price,book,,under,aid]=r;const L=aid&&socLam(aid,mk,f);const our=L?socPover(L.lam,line):null;const im=socImp(price);
  const [h,n]=aid?socHitP(aid,mk,line,10):[0,0];return {nm,mk,line,price,book,under,aid,our,im,edge:our!=null&&im!=null?our-im:null,h,n,L}}
function socPropLab(mk,line){const m=SOC_MK[mk]||[mk,mk];if(mk==="sgoal")return "Anytime goal";if(mk==="sast")return "To assist";if(mk==="sga")return "Goal or assist";if(mk==="s2g")return "2+ goals";if(mk==="scard")return "To be booked";return `${line+.5}+ ${m[1].toLowerCase()}`}
function socPropRow(x,f){const sp=f&&socSpec(f,"prop","o",x.line,x.price,x.book,{pid:x.aid,mk:x.mk,player:x.nm,title:`${x.nm} ${socPropLab(x.mk,x.line)}`});
  return `<div class="scpr"><div><a href="${x.aid?"#soccer-player-"+x.aid:"#"}"><b>${socE(x.nm)}</b></a> <span class="small">${socE(socPropLab(x.mk,x.line))}</span>${x.n?`<div class="small">Hit in <b>${x.h} of last ${x.n}</b> games${x.L?` · ${x.L.r90.toFixed(2)} per 90 · ~${Math.round(x.L.em)} min`:""}</div>`:`<div class="small">Not enough games in our data</div>`}</div>
   <div class="scprr"><b>${socO(x.price)}</b><span class="small">${socE(x.book||"")}</span>${x.our!=null?`<em class="${socEdgeCls(x.edge)}">our ${socPct(x.our)} · needs ${socPct(x.im)}</em>`:""}</div>${sp&&x.price!=null?socBetBtn(sp):""}</div>`}
/* stat-only markets (no US book line yet): shots, fouls committed, fouls won for the likely starters */
function socStatOnly(f){const T={};for(const [aid,P] of Object.entries(window.SOC_P||{})){if(P[1]!==f.h&&P[1]!==f.a)continue;const G=P[3].slice(-5);if(f.lu?!Object.values(f.lu).some(L=>L.includes(P[0])):G.filter(g=>g[1]).length<3)continue;(T[P[1]]=T[P[1]]||[]).push(aid)}
  const cell=(aid,mk,line)=>{const L=socLam(aid,mk,f),p=L&&socPover(L.lam,line),[h,n]=socHitP(aid,mk,line,10);return `<td>${n?`<b>${h}/${n}</b> <span class="small">${socPct(p)}</span>`:"–"}</td>`};
  const side=tid=>{const A=(T[tid]||[]).map(a=>[a,socLam(a,"sshot",f)]).sort((a,b)=>((b[1]&&b[1].lam)||0)-((a[1]&&a[1].lam)||0)).slice(0,9);if(!A.length)return "";
    return `<h3 style="margin:10px 0 6px">${socBadge(tid)} ${socE(socTm(tid))}</h3><div class="alw"><table class="altt sctbl"><thead><tr><th>Player</th><th>1+ shots</th><th>2+ shots</th><th>1+ on target</th><th>1+ fouls</th><th>2+ fouls</th><th>Fouled 1+</th><th>Fouled 2+</th></tr></thead><tbody>
    ${A.map(([a])=>`<tr><td><a href="#soccer-player-${a}">${socE(SOC_P[a][0])}</a> <span class="small">${socE(SOC_P[a][2]||"")}</span></td>${cell(a,"sshot",.5)}${cell(a,"sshot",1.5)}${cell(a,"ssot",.5)}${cell(a,"sfoul",.5)}${cell(a,"sfoul",1.5)}${cell(a,"sfwon",.5)}${cell(a,"sfwon",1.5)}</tr>`).join("")}</tbody></table></div>`};
  return `<div class="card"><h2>👟 Shots &amp; fouls</h2><div class="xasub">Hit in last 10 games · % = our chance (his rate per 90 × expected minutes × this opponent). ${f.lu?"Confirmed starters.":"Likely starters (3+ starts in the last 5)."} US books in our feed don't post shots or fouls lines yet.</div>${side(f.h)}${side(f.a)}</div>`}
function socGameProps(f){const R=(SOC_PROPS||[]).filter(r=>r[5]===f.id).map(r=>socPropEval(r,f));
  const groups={};R.forEach(x=>(groups[x.mk]=groups[x.mk]||[]).push(x));const order=["sgoal","sga","ssot","sast","s2g","sshot","sfoul","sfwon","scard"];
  return `${R.length?order.filter(k=>groups[k]).map(k=>`<div class="card"><h2>${socE(SOC_MK[k][1])}</h2>${groups[k].sort((a,b)=>(b.edge??-9)-(a.edge??-9)).map(x=>socPropRow(x,f)).join("")}</div>`).join(""):`<div class="card small">No player props posted yet for this match — books add them 1–2 days before kickoff.</div>`}${socStatOnly(f)}${socFoot()}`}
function socBestProps(){const out=[];for(const r of SOC_PROPS||[]){const f=socFx(r[5]);if(!f||socStarted(f))continue;const x=socPropEval(r,f);if(x.edge!=null&&x.n>=5)out.push(Object.assign(x,{f}))}return out.sort((a,b)=>b.edge-a.edge)}
function socProps(el){socPEnsure(()=>{const L0=socBestProps(),L=L0.filter(x=>(SC.pmk==="all"||x.mk===SC.pmk)&&(SC.plg==="all"||x.f.c===SC.plg));
  const mks=[...new Set(L0.map(x=>x.mk))],lgs=[...new Set(L0.map(x=>x.f.c))];
  el.innerHTML=`<h1>🎯 Soccer player props</h1><p class="sub">Every posted player prop for the next 3 days, best edge first: our chance (his rate per 90, expected minutes, the opponent) vs the chance the price needs.</p>
   <div class="seg">${[["all","All"],...mks.map(k=>[k,SOC_MK[k][1]])].map(([k,l])=>`<button class="btn${SC.pmk===k?" on":""}" data-scpm="${k}">${socE(l)}</button>`).join("")}</div>
   <div class="seg" style="margin-top:6px">${[["all","All leagues"],...lgs.map(k=>[k,(SOC_LG[k]||{}).sh])].map(([k,l])=>`<button class="btn${SC.plg===k?" on":""}" data-scpl="${k}">${socE(l)}</button>`).join("")}</div>
   <div class="card" style="margin-top:10px">${L.slice(0,60).map(x=>`<div class="small" style="margin-top:6px">${socLgChip(x.f.c)} <a href="#soccer-game-${x.f.id}">${socE(socTm(x.f.h))} v ${socE(socTm(x.f.a))}</a> · ${socE(socDayS(socDay(x.f.t)))}</div>${socPropRow(x,x.f)}`).join("")||`<p class="small">No player props posted right now — books add them 1–2 days before kickoff.</p>`}</div>${socFoot()}`;
  el.querySelectorAll("[data-scpm]").forEach(b=>b.onclick=()=>{SC.pmk=b.dataset.scpm;socProps(el)});el.querySelectorAll("[data-scpl]").forEach(b=>b.onclick=()=>{SC.plg=b.dataset.scpl;socProps(el)})})}

/* ---------- standings ---------- */
function socTable(el){const c=SC.tlg,L=(SOC_ST||{})[c]||[];
  el.innerHTML=`<h1>📊 Soccer standings</h1><div class="seg">${Object.entries(SOC_LG).map(([k,v])=>`<button class="btn${c===k?" on":""}" data-sctl="${k}">${socE(v.sh)}</button>`).join("")}</div>
  <div class="card" style="margin-top:10px"><h2>${socLgChip(c)} ${socE((SOC_LG[c]||{}).n||"")}</h2><div class="alw"><table class="altt sctbl"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W-D-L</th><th>GD</th><th>Pts</th><th>Form</th><th>🚩/g</th><th>🟨/g</th></tr></thead><tbody>
  ${L.map(r=>{const T=socTN(c,r[0]);return `<tr><td>${r[1]}</td><td>${socBadge(r[0])} ${socTL(r[0],socE(socTm(r[0])))}</td><td>${r[2]}</td><td>${r[3]}-${r[4]}-${r[5]}</td><td>${r[6]-r[7]>0?"+":""}${r[6]-r[7]}</td><td><b>${r[8]}</b></td><td class="scfm">${socForm(r[0])}</td><td>${T&&T[7]!=null?T[7].toFixed(1):"–"}</td><td>${T&&T[9]!=null?T[9].toFixed(1):"–"}</td></tr>`}).join("")||`<tr><td colspan="9" class="small">No table yet.</td></tr>`}</tbody></table></div>
  ${SOC_LG[c]&&SOC_LG[c].m?`<div class="small" style="margin-top:8px">League this season: ${SOC_LG[c].m} matches · home wins ${socPct(SOC_LG[c].hw)} · draws ${socPct(SOC_LG[c].draw)} · over 2.5 goals ${socPct(SOC_LG[c].o25)} · both teams scored ${socPct(SOC_LG[c].btts)}</div>`:""}</div>${socFoot()}`;
  el.querySelectorAll("[data-sctl]").forEach(b=>b.onclick=()=>{SC.tlg=b.dataset.sctl;socTable(el)})}

/* ---------- player page ---------- */
function socPlayer(el,aid){socPEnsure(()=>{const P=window.SOC_P&&SOC_P[aid];if(!P){el.innerHTML=`<p><a href="#soccer">← Soccer</a></p><div class="card">Player not found.</div>`;return}
  const [nm,tid,pos,G]=P,RI=socResIdx(),last=G.slice(-15).reverse(),fx=(SOC_FX||[]).find(f=>(f.h===tid||f.a===tid)&&!socStarted(f));
  const tot=k=>G.reduce((a,g)=>a+(socVal(g,k)||0),0),mins=G.reduce((a,g)=>a+g[2],0),p90=k=>mins?(tot(k)/mins*90).toFixed(2):"–";
  const props=fx?(SOC_PROPS||[]).filter(r=>r[5]===fx.id&&r[7]===aid).map(r=>socPropEval(r,fx)):[];
  const hr=(mk,line)=>{const [h,n]=socHitP(aid,mk,line,10);return n?`<b>${h}/${n}</b>`:"–"};
  el.innerHTML=`<p><a href="#soccer">← Soccer</a></p><div class="phead"><div><h1>${socE(nm)}</h1><p class="sub">${socBadge(tid)} ${socE(socTmFull(tid))} · ${socE(pos||"")} · ${G.length} appearances (${G.filter(g=>g[1]).length} starts) · ${mins} minutes</p></div><div></div></div>
  ${fx?`<div class="card"><h2>Next: ${fx.h===tid?"vs":"@"} ${socE(socTm(fx.h===tid?fx.a:fx.h))} <span class="small">${socE(socDayS(socDay(fx.t)))} · <a href="#soccer-game-${fx.id}">match page →</a></span></h2>${props.map(x=>socPropRow(x,fx)).join("")||`<div class="small">No props posted for him yet.</div>`}</div>`:""}
  <div class="card"><h2>Per 90 minutes</h2><div class="pbio"><div><b>${p90("sshot")}</b>Shots</div><div><b>${p90("ssot")}</b>On target</div><div><b>${p90("sgoal")}</b>Goals</div><div><b>${p90("sast")}</b>Assists</div><div><b>${p90("sfoul")}</b>Fouls</div><div><b>${p90("sfwon")}</b>Fouled</div></div>
   <div class="small" style="margin-top:8px">Last 10 games (15+ min): 1+ shots ${hr("sshot",.5)} · 2+ shots ${hr("sshot",1.5)} · 1+ on target ${hr("ssot",.5)} · goal ${hr("sgoal",.5)} · goal or assist ${hr("sga",.5)} · 1+ fouls ${hr("sfoul",.5)} · fouled 1+ ${hr("sfwon",.5)} · fouled 2+ ${hr("sfwon",1.5)}</div></div>
  <div class="card"><h2>Game log</h2><div class="alw"><table class="altt sctbl"><thead><tr><th>Date</th><th>Opp</th><th>Min</th><th>Sh</th><th>SOT</th><th>G</th><th>A</th><th>Fouls</th><th>Fouled</th><th>🟨</th></tr></thead><tbody>
  ${last.map(g=>{const r=RI[g[0]];const opp=r?(r[3]===tid?r[4]:r[3]):null;return `<tr class="sclink" data-href="#soccer-match-${g[0]}"><td class="small"><a href="#soccer-match-${g[0]}">${r?r[1].slice(5,10):""}</a></td><td>${r?(r[3]===tid?"":"@")+socE(socTm(opp)):""} <span class="small">${r?socE((SOC_LG[r[2]]||{}).sh||""):""}</span></td><td>${g[2]}${g[1]?"":"*"}</td><td>${g[3]}</td><td>${g[4]}</td><td>${g[5]}</td><td>${g[6]}</td><td>${g[7]}</td><td>${g[8]}</td><td>${g[9]?"🟨":""}${g[10]?"🟥":""}</td></tr>`}).join("")}</tbody></table></div><div class="small">* came off the bench (minutes estimated from the substitution time)</div></div>${socFoot()}`})}

/* ---------- router + Today ---------- */
function soccerRoute(h){const el=document.getElementById("v-soccer");if(!el)return;
  if(!window.SOC_OK){el.innerHTML=`<div class="small" style="padding:30px 0;text-align:center">Loading soccer…</div>`;socEnsure(()=>{if(!window.SOC_OK){el.innerHTML=`<div class="card">Couldn't load the soccer data. Check your connection and try again.</div>`;return}if((location.hash||"").slice(1).startsWith("soccer"))soccerRoute(decodeURIComponent((location.hash||"").slice(1)))});return}
  if(h.startsWith("soccer-game-")){SC.tab=h.endsWith("-props")?"props":SC.tab;return socGame(el,h.slice(12).replace(/-props$/,""))}
  if(h==="soccer-props")return socProps(el);if(h==="soccer-table")return socTable(el);if(h.startsWith("soccer-player-"))return socPlayer(el,h.slice(14));
  if(h.startsWith("soccer-match-"))return socMatchPage(el,h.slice(13));if(h.startsWith("soccer-team-"))return socTeam(el,h.slice(12));if(h==="soccer-results")return socResults(el);if(h==="soccer-cc")return socFinder(el);
  socMatches(el)}
function todayRowsSoc(){if(!window.SOC_OK){socEnsure(()=>{if(((location.hash||"#today").slice(1)||"today")==="today"&&typeof viewToday!=="undefined")viewToday()});return `<div class="small">Loading soccer…</div>`}
  const d=socToday();let F=(SOC_FX||[]).filter(f=>socDay(f.t)===d);let lab="";if(!F.length){const nx=(SOC_FX||[]).find(f=>socDay(f.t)>d);if(nx){F=(SOC_FX||[]).filter(f=>socDay(f.t)===socDay(nx.t));lab=`<div class="small" style="margin-bottom:6px">No matches today — next: ${socE(socDayS(socDay(nx.t)))}</div>`}}
  return lab+(F.slice(0,40).map(f=>{const O=f.odds||{};return `<a class="tgr" href="#soccer-game-${f.id}"><span class="tt">${socStarted(f)?(f.state==="post"?"FT":"<b class='up'>LIVE</b>"):socTime(f.t)}</span><span class="tm">${socBadge(f.h)} <span class="small">v</span> ${socBadge(f.a)}</span><span class="tl">${O.ml?`${socO(O.ml.h)} / ${socO(O.ml.d)} / ${socO(O.ml.a)}`:socE((SOC_LG[f.c]||{}).sh||"")}</span></a>`}).join("")||`<div class="small">No soccer matches in the next 10 days.</div>`)}
function socTodayCount(){return window.SOC_OK?(SOC_FX||[]).filter(f=>socDay(f.t)===socToday()).length:null}
/* best angles for the Today page "Best of tonight" (matches today + tomorrow, edge ≥ 4%) */
function socTonightItems(){if(!window.SOC_OK)return [];const d=socToday(),d1=socAddDays(d,1),L=[];
  for(const f of (SOC_FX||[]).filter(f=>[d,d1].includes(socDay(f.t))&&!socStarted(f))){const b=socBestEdge(f);if(b&&b.e>=.04)L.push({sp:"soc",e:b.e,href:`#soccer-game-${f.id}`,t:`${socE(b.t)} ${socO(b.o)} <span class="small">${socE(socTm(f.h))} v ${socE(socTm(f.a))}</span>`})}
  return L}

/* ================= finished matches, head to head, team pages, results, corners & cards finder ================= */
function socMatchRow(id){return socResIdx()[id]||(window.SOC_OLD||[]).find(r=>r[0]===id)||null}
function socTL(id,txt){return `<a href="#soccer-team-${id}" class="sctl">${txt}</a>`}
const SOC_TSL=[["Shots",0],["On target",1],["Corners",2],["Fouls",3],["Yellow cards",4],["Red cards",5],["Possession %",6],["Offsides",7],["Saves",8]];
function socMatchPlayers(id,tid){const out=[];if(window.SOC_P)for(const [aid,P] of Object.entries(SOC_P)){if(P[1]!==tid&&!P[3].some(g=>g[0]===id))continue;const g=P[3].find(g=>g[0]===id);if(g)out.push({aid,nm:P[0],pos:P[2],g,tid:P[1]})}
  const O=window.SOC_OLDP&&SOC_OLDP[id];if(O&&!out.length)for(const r of O)out.push({aid:r[1],nm:r[2],pos:r[3],g:[id,r[4],r[5],...r.slice(6)],tid:r[0],old:1});
  return out}
function socMatchPage(el,id){socPEnsure(()=>{const r=socMatchRow(id);if(!r){el.innerHTML=`<p><a href="#soccer-results">← Results</a></p><div class="card">Match not found.</div>`;return}
  const [,t,c,h,a,hs,as,Ht,At,ev]=r,old=!socResIdx()[id];
  const P=socMatchPlayers(id),side=tid=>{const L=P.filter(x=>x.old?x.tid===tid:(r[3]===tid?x.g&&x.tid===tid:x.tid===tid)).sort((x,y)=>y.g[1]-x.g[1]||y.g[2]-x.g[2]);
    return L.length?`<div class="alw"><table class="altt sctbl"><thead><tr><th>${socBadge(tid)} Player</th><th>Min</th><th>Sh</th><th>SOT</th><th>G</th><th>A</th><th>Fouls</th><th>Fouled</th><th></th></tr></thead><tbody>${L.map(x=>`<tr><td>${x.old?socE(x.nm):`<a href="#soccer-player-${x.aid}">${socE(x.nm)}</a>`} <span class="small">${socE(x.pos||"")}</span></td><td>${x.g[2]}${x.g[1]?"":"*"}</td><td>${x.g[3]}</td><td>${x.g[4]}</td><td>${x.g[5]||""}</td><td>${x.g[6]||""}</td><td>${x.g[7]}</td><td>${x.g[8]}</td><td>${x.g[9]?"🟨":""}${x.g[10]?"🟥":""}</td></tr>`).join("")}</tbody></table></div>`:`<div class="small">No player data for this match.</div>`};
  // players: in season matches SOC_P holds each player's current team, so split by who appears for which side via the old/new team id
  const evs=(ev||[]).filter(x=>x[1]!=null).sort((x,y)=>x[1]-y[1]);
  const ic={g:"⚽",p:"⚽ (pen)",o:"⚽ (own goal)",y:"🟨",r:"🟥"};
  el.innerHTML=`<p><a href="javascript:history.back()">← Back</a> · <a href="#soccer-results">All results</a></p>
  <div class="card nhhero"><div class="small">${socLgChip(c)} ${socE(socDayS(socDay(t+"Z")))}${old?" · earlier season":""}</div>
   <div class="nhht" style="margin-top:10px"><div class="ght">${socBadge(h,1)}${socTL(h,`<b>${socE(socTmFull(h))}</b>`)}</div><div class="ght"><b style="font-size:26px">${hs} – ${as}</b><span class="small">Full time</span></div><div class="ght">${socBadge(a,1)}${socTL(a,`<b>${socE(socTmFull(a))}</b>`)}</div></div></div>
  ${evs.length?`<div class="card"><h2>⏱ Goals &amp; cards</h2>${evs.map(x=>`<div class="scev ${x[2]===h?"h":"a"}"><b>${x[1]}'</b> ${ic[x[0]]||""} ${socE(x[3]||"")} <span class="small">${socE(socTm(x[2]))}</span></div>`).join("")}</div>`:""}
  ${Ht&&At?`<div class="card"><h2>📊 Match stats</h2><div class="alw"><table class="altt sctbl"><thead><tr><th></th><th>${socBadge(h)}</th><th>${socBadge(a)}</th></tr></thead><tbody>${SOC_TSL.map(([l,i])=>`<tr><td>${l}</td><td><b>${Ht[i]??"–"}</b></td><td><b>${At[i]??"–"}</b></td></tr>`).join("")}<tr><td>Total corners</td><td colspan="2"><b>${(Ht[2]??0)+(At[2]??0)}</b></td></tr><tr><td>Total cards</td><td colspan="2"><b>${(Ht[4]??0)+(Ht[5]??0)+(At[4]??0)+(At[5]??0)}</b></td></tr></tbody></table></div></div>`:`<div class="card small">No team stats for this match.</div>`}
  <div class="card"><h2>👟 Players</h2><h3 style="margin:6px 0">${socE(socTm(h))}</h3>${side(h)}<h3 style="margin:12px 0 6px">${socE(socTm(a))}</h3>${side(a)}<div class="small" style="margin-top:6px">* came off the bench</div></div>${socFoot()}`})}
/* a clickable result line (recent form, results, head to head, team page) */
function socResLine(r,tid){const me=tid&&r[3]===tid,op=tid?(me?r[4]:r[3]):null,x=tid?socWDL(r,tid):null;
  return `<a class="scfr scfrl" href="#soccer-match-${r[0]}">${x?`<i class="scf ${x}">${x}</i>`:""}<span>${tid?`${me?"vs":"@"} ${socE(socTm(op))}`:`${socE(socTm(r[3]))} v ${socE(socTm(r[4]))}`}</span><b>${r[5]}-${r[6]}</b><span class="small">${socE(r[1].slice(5,10))} · ${socE((SOC_LG[r[2]]||{}).sh||"")} · 🚩${socMatchVal(r,"cor")??"–"} · 🟨${socMatchVal(r,"card")??"–"}</span></a>`}
function socH2HCard(f){const ids=(window.SOC_H2H||{})[f.id]||[];const R=ids.map(socMatchRow).filter(Boolean);if(!R.length)return `<div class="card xacard"><h2>🆚 Head to head</h2><div class="small">These teams haven't met in the last 3 seasons in our data.</div></div>`;
  let w=0,d=0,l=0,g=0,o25=0,bt=0;for(const r of R){const x=socWDL(r,f.h);x==="W"?w++:x==="D"?d++:l++;g+=r[5]+r[6];o25+=r[5]+r[6]>2.5;bt+=r[5]>0&&r[6]>0}
  return `<div class="card xacard"><h2>🆚 Head to head</h2><div class="xasub">Last ${R.length} meeting${R.length>1?"s":""} (this season + the 3 before) · tap one for its stats</div>
   <div style="margin:6px 0 8px">${socE(socTm(f.h))} <b>${w}W ${d}D ${l}L</b> · ${(g/R.length).toFixed(1)} goals a game · over 2.5 in ${o25}/${R.length} · both scored in ${bt}/${R.length}</div>${R.map(r=>socResLine(r,f.h)).join("")}</div>`}
function socTeam(el,tid){const T=SOC_TM[tid];if(!T){el.innerHTML=`<div class="card">Team not found.</div>`;return}
  const comps=T[4]||[],R=socTeamRes(tid).slice().reverse(),next=(SOC_FX||[]).filter(f=>(f.h===tid||f.a===tid)&&!socStarted(f)).slice(0,3);
  const rate=(k,line)=>{const [h,n]=socHit(tid,k,line,10);return n?`<b>${h}/${n}</b>`:"–"};
  el.innerHTML=`<p><a href="javascript:history.back()">← Back</a></p><div class="phead"><div><h1>${socBadge(tid,1)} ${socE(T[0])}</h1><p class="sub">${comps.map(c=>socLgChip(c)).join(" ")} ${comps.map(c=>socRank(c,tid)?`${socOrd(socRank(c,tid))} in ${socE((SOC_LG[c]||{}).sh)}`:"").filter(Boolean).join(" · ")}</p></div><div></div></div>
  ${next.length?`<div class="card"><h2>Next</h2>${next.map(f=>`<a class="scfr scfrl" href="#soccer-game-${f.id}">${socLgChip(f.c)}<span>${f.h===tid?"vs":"@"} ${socE(socTm(f.h===tid?f.a:f.h))}</span><span class="small">${socE(socDayS(socDay(f.t)))} · ${socTime(f.t)}</span></a>`).join("")}</div>`:""}
  <div class="card"><h2>📈 Last 10 matches</h2><div class="pbio"><div><b>${rate("goals",2.5)}</b>Over 2.5 goals</div><div><b>${(()=>{const L=socTeamRes(tid).slice(-10);return L.length?L.filter(r=>r[5]&&r[6]).length+"/"+L.length:"–"})()}</b>Both scored</div><div><b>${rate("cor",9.5)}</b>Over 9.5 corners</div><div><b>${rate("card",3.5)}</b>Over 3.5 cards</div></div></div>
  ${comps.map(c=>{const N=socTN(c,tid);if(!N)return "";const f2=x=>x==null?"–":(+x).toFixed(1);const rk=(i,asc)=>{const r=socRankOf(c,i,tid,asc);return r?` <span class="small">${socOrd(r[0])}</span>`:""};
    return `<div class="card"><h2>${socLgChip(c)} Per match in ${socE((SOC_LG[c]||{}).n||c)} <span class="small">${N[0]} matches</span></h2><div class="alw"><table class="altt sctbl scwrap"><tbody>
    <tr><td>Goals for / against</td><td><b>${(N[1]/N[0]).toFixed(2)}</b> / ${(N[2]/N[0]).toFixed(2)}</td></tr><tr><td>Shots / on target</td><td><b>${f2(N[3])}</b>${rk(3)} / ${f2(N[4])}${rk(4)}</td></tr><tr><td>Shots allowed / on target</td><td>${f2(N[5])}${rk(5,1)} / ${f2(N[6])}${rk(6,1)}</td></tr>
    <tr><td>Corners won / allowed</td><td><b>${f2(N[7])}</b>${rk(7)} / ${f2(N[8])}${rk(8,1)}</td></tr><tr><td>Cards / opponents' cards</td><td><b>${N[9]==null?"–":N[9].toFixed(2)}</b>${rk(9)} / ${N[10]==null?"–":N[10].toFixed(2)}</td></tr><tr><td>Fouls / fouled</td><td>${f2(N[11])} / ${f2(N[12])}</td></tr>
    <tr><td>Clean sheets · both scored · over 2.5</td><td>${N[13]} · ${N[14]} · ${N[15]} of ${N[0]}</td></tr><tr><td>Possession</td><td>${f2(N[16])}%</td></tr></tbody></table></div></div>`}).join("")}
  <div class="card"><h2>📅 Results</h2>${R.map(r=>socResLine(r,tid)).join("")||`<div class="small">No matches yet.</div>`}</div>
  <div class="card" id="scTeamPl"><h2>👟 Players</h2><div class="small">Loading…</div></div>${socFoot()}`;
  socPEnsure(()=>{const box=el.querySelector("#scTeamPl");if(!box)return;const L=Object.entries(SOC_P).filter(([,P])=>P[1]===tid).map(([aid,P])=>{const G=P[3],m=G.reduce((s,g)=>s+g[2],0),sum=i=>G.reduce((s,g)=>s+g[i],0);return {aid,P,n:G.length,st:G.filter(g=>g[1]).length,m,g:sum(5),a:sum(6),sh:sum(3),sot:sum(4),fc:sum(7),fs:sum(8)}}).sort((x,y)=>y.m-x.m);
    box.innerHTML=`<h2>👟 Players <span class="small">this season, all competitions</span></h2><div class="alw"><table class="altt sctbl"><thead><tr><th>Player</th><th>Apps</th><th>Min</th><th>G</th><th>A</th><th>Sh/90</th><th>SOT/90</th><th>Fouls/90</th><th>Fouled/90</th></tr></thead><tbody>${L.map(x=>{const p9=v=>x.m?(v/x.m*90).toFixed(2):"–";return `<tr><td><a href="#soccer-player-${x.aid}">${socE(x.P[0])}</a> <span class="small">${socE(x.P[2]||"")}</span></td><td>${x.n} <span class="small">(${x.st})</span></td><td>${x.m}</td><td>${x.g}</td><td>${x.a}</td><td>${p9(x.sh)}</td><td>${p9(x.sot)}</td><td>${p9(x.fc)}</td><td>${p9(x.fs)}</td></tr>`}).join("")}</tbody></table></div>`})}
function socResults(el){const R=(SOC_RES||[]).filter(r=>socLgOk(r[2])).slice().reverse();const by={};for(const r of R.slice(0,400)){const d=socDay(r[1]+"Z");(by[d]=by[d]||[]).push(r)}
  el.innerHTML=`<h1>📅 Soccer results</h1>${socLgFilter()}<p class="sub">Every finished match this season — tap one for team stats, goal times and every player's numbers.</p>
  ${Object.entries(by).slice(0,21).map(([d,L])=>`<h2 class="tsh">${socE(socDayS(d))}</h2><div class="card">${L.map(r=>`<div class="scrr">${socLgChip(r[2])}${socResLine(r)}</div>`).join("")}</div>`).join("")||`<div class="card small">No results yet.</div>`}${socFoot()}`;
  socLgWire(el,()=>socResults(el))}
/* 3) corners & cards finder */
function socFinder(el){const k=SC.cc==="card"?"card":"cor",d0=(socDays()[0])||socToday(),F=(SOC_FX||[]).filter(f=>socLgOk(f.c)&&!socStarted(f)&&f.proj&&f.proj[k]&&socDay(f.t)<=socAddDays(d0,7)).sort((x,y)=>y.proj[k].t-x.proj[k].t);
  const row=f=>{const P=f.proj[k],O=f.odds||{};let line,bk;if(k==="cor"){line=O.main_cor||socNear(P,Object.keys(P.o));bk=O.cor&&O.cor[line]}else{line=socNear(P,["2.5","3.5","4.5","5.5"]);const X=O.extra&&Object.entries(O.extra).find(([x])=>/card|booking/i.test(x));bk=X&&X[1][line]}
    const po=P.o[line],r=k==="card"&&f.ref?socRefRow(f.c,f.ref):null,eo=bk&&bk[0]!=null&&po!=null?po-socImp(bk[0]):null,eu=bk&&bk[2]!=null&&po!=null?(1-po)-socImp(bk[2]):null;
    return `<a class="card sccard scfind" href="#soccer-game-${f.id}"><div class="row" style="gap:6px;align-items:center">${socLgChip(f.c)}<span class="small">${socE(socDayS(socDay(f.t)).split(",")[0])} · ${socTime(f.t)}</span></div>
     <div class="scfm2"><span>${socBadge(f.h)} ${socE(socTm(f.h))} <span class="small">v</span> ${socBadge(f.a)} ${socE(socTm(f.a))}</span><b class="scbig2">${P.t.toFixed(1)}</b></div>
     <div class="small">${socE(socTm(f.h))} ${P.h.toFixed(1)} · ${socE(socTm(f.a))} ${P.a.toFixed(1)} · line ${line}: over <b>${socPct(po)}</b>${bk?` · books O ${socO(bk[0])} / U ${socO(bk[2])}${eo!=null&&eo>=.05?` · <b class="up">over +${Math.round(eo*100)}%</b>`:""}${eu!=null&&eu>=.05?` · <b class="up">under +${Math.round(eu*100)}%</b>`:""}`:" · no US line yet"}</div>
     ${k==="card"?`<div class="small">${f.ref?`🧑‍⚖️ ${socE(f.ref)}${r?` · ${r[4].toFixed(2)} cards a match`:""}`:"🧑‍⚖️ referee not announced yet"}</div>`:""}</a>`};
  el.innerHTML=`<h1>🚩 Corners &amp; 🟨 cards finder</h1><div class="seg"><button class="btn${k==="cor"?" on":""}" data-scc="cor">🚩 Corners</button><button class="btn${k==="card"?" on":""}" data-scc="card">🟨 Cards</button></div>${socLgFilter()}
   <p class="sub">Every match over the next 7 days of games, highest expected ${k==="cor"?"corners":"cards"} first. Our number uses both teams' for/against averages${k==="card"?" and the referee when he's known":""}.</p>
   <div class="grid g2">${F.slice(0,SC.ccAll?999:24).map(row).join("")||`<div class="card small">No matches with estimates in the next 7 days.</div>`}</div>${F.length>24&&!SC.ccAll?`<button class="btn" data-ccall="1" style="width:100%;margin-top:8px">Show all ${F.length} matches</button>`:""}${socFoot()}`;
  const ca=el.querySelector("[data-ccall]");if(ca)ca.onclick=()=>{SC.ccAll=1;socFinder(el)};
  el.querySelectorAll("[data-scc]").forEach(b=>b.onclick=()=>{SC.cc=b.dataset.scc;socFinder(el)});socLgWire(el,()=>socFinder(el))}
