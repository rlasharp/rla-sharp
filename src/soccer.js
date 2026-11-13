/* ================= ⚽ Soccer section =================
   Data: soccer_data.js (fixtures, results, team numbers, standings, odds, referees, weather, estimates — tools/soccerfetch.py)
         soccer_players.js (player game logs), both loaded the first time they're needed.
   Routes: #soccer (matches) · #soccer-game-<id> · #soccer-props · #soccer-table · #soccer-player-<espn id>
   Focus markets: match result, goals over/under, both teams to score, corners, cards. Player: shots, shots on target,
   goals, goal or assist, fouls committed, fouls won. Real data only — where no US book posts a line we say so. */
const SC={lgs:(()=>{try{return JSON.parse(localStorage.getItem("ge_soclgs")||"[]").slice(0,1)}catch(e){return []}})(),cc:"cor",lg:"all",day:"",tab:"game",pmk:"all",plg:"all",tlg:"epl"};
let SOC_READY=false,SOC_WAIT=[],SOCP_READY=false,SOCP_WAIT=[];
function socLoad(file,okVar,W,done,cb){if(window[okVar]){done();cb&&cb();return}if(W.fail&&Date.now()-W.fail<60000){cb&&cb();return}if(cb)W.push(cb);if(W.loading)return;W.loading=1;
  const sc=document.createElement("script");sc.src=file+"?v="+(typeof BUILD_AT!=="undefined"&&BUILD_AT?BUILD_AT.replace(/\D/g,""):Math.floor(Date.now()/600000));
  sc.onload=()=>{done();W.loading=0;try{if(typeof SRCH!=="undefined")SRCH=null;const i=document.getElementById("plSearch");if(i&&document.activeElement===i&&i.value.trim().length>=2)setTimeout(()=>i.dispatchEvent(new Event("input")),0)}catch(e){}W.splice(0).forEach(f=>{try{f()}catch(e){console.error(e)}})};
  sc.onerror=()=>{W.loading=0;W.fail=Date.now();W.splice(0).forEach(f=>{try{f()}catch(e){}})};document.head.appendChild(sc)}
function socEnsure(cb){socLoad("soccer_data.js","SOC_OK",SOC_WAIT,()=>{SOC_READY=true;try{if(typeof SOCL!=="undefined"&&SOCL.loPend){const d=SOCL.loPend;SOCL.loPend=null;socLoApply(d)}}catch(e){}},cb)}
/* player logs come in one small file per league (soccer_p_<league>.js) + soccer_old.js for older head-to-head matches;
   pages ask only for the teams they show. Older builds had a single soccer_players.js — still supported. */
var SOC_P=window.SOC_P||{},SOC_OLDP=window.SOC_OLDP||{};const SOCPL={have:{},busy:{},old:0};
function SOC_PADD(k,o){SOC_USUAL=null;Object.assign(SOC_P,o);SOCPL.have[k]=1;window.SOC_P_OK=1}
function SOC_OLDADD(o){Object.assign(SOC_OLDP,o);SOCPL.old=1;SOC_USUAL=null}
function socPKeys(tids){const all=Object.keys(window.SOC_PFILES||{});if(!tids)return all;return [...new Set(tids.map(t=>((SOC_TM[t]||[])[4]||[]).find(x=>!["ucl","uel","uecl"].includes(x))||"cups"))].filter(k=>all.includes(k))}
function socScript(file){return new Promise(res=>{const sc=document.createElement("script");sc.src=file+"?v="+(typeof BUILD_AT!=="undefined"&&BUILD_AT?BUILD_AT.replace(/\D/g,""):Math.floor(Date.now()/600000));sc.onload=()=>res(1);sc.onerror=()=>res(0);document.head.appendChild(sc)})}
function socPEnsure(cb,tids,old){socEnsure(async()=>{try{
    if(!window.SOC_PFILES){if(!SOCPL.legacy)SOCPL.legacy=socScript("soccer_players.js").then(()=>{window.SOC_P_OK=1;Object.assign(SOCPL.have,{all:1})});await SOCPL.legacy}
    else{const need=socPKeys(tids).filter(k=>!SOCPL.have[k]),P=need.map(k=>SOCPL.busy[k]||(SOCPL.busy[k]=socScript("soccer_p_"+k+".js")));
      if(old&&!SOCPL.old)P.push(SOCPL.busyOld||(SOCPL.busyOld=socScript("soccer_old.js")));await Promise.all(P)}
    try{if(typeof SRCH!=="undefined")SRCH=null}catch(e){}}catch(e){}cb&&cb()})}
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
function socStarted(f){const L=typeof SOCL!=="undefined"&&SOCL.m[f.id];if(L)return L.st!=="pre";return f.state==="in"||f.state==="post"||Date.parse(f.t)<Date.now()-60000}
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
function socWx(f,long){const w=f.wx;if(!w)return "";const [t,pp,pr,ws,wc,wg,sn]=w,snow=wc>=71&&wc<=86;
  const s=`${SOC_WX[wc]||"🌡️"} · ${Math.round(t)}°C · 💨 ${Math.round(ws)} km/h${wg&&wg>=ws+12?` (gusts ${Math.round(wg)})`:""}${pp!=null&&pp>=20?` · ${snow?"snow":"rain"} ${pp}%`:""}${sn?` · ${sn} cm snow`:""}`;
  if(long==="head"){const hi=ws>=35||(wg||0)>=55||(pr||0)>=2||(sn||0)>=1;return `<div class="wxhead${hi?" hi":""}" title="Kickoff-hour forecast at ${socE(f.city||"")} (Open-Meteo)">${s}${hi?" · <b>Weather could matter</b>":""}</div>`}
  if(!long)return `<span class="scwx" title="Kickoff-hour forecast (Open-Meteo)">${s}</span>`;
  const notes=[];if((wg||0)>=55&&ws<35)notes.push("Strong gusts — the ball can hold up or run away on long passes");if(sn>=1)notes.push("Snow on the pitch — expect a slower, scrappier game");if(ws>=35)notes.push("Strong wind — long balls and crosses get harder; it can slow scoring");else if(ws>=25)notes.push("Breezy — worth a small note for long-range shooting and crosses");
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
  const r=socResIdx()[b.match];if(!r){const L=SOCL.m[b.match];if(L&&L.st!=="pre"){const S=SOCL.sum[b.match],f=socFx(b.match),T=S&&f&&[S.ts[f.h],S.ts[f.a]];
      const cor=T&&T[0]&&T[1]?(T[0][2]||0)+(T[1][2]||0):null,crd=T&&T[0]&&T[1]?(T[0][4]||0)+(T[0][5]||0)+(T[1][4]||0)+(T[1][5]||0):null;
      return {r:"pending",why:`${L.st==="post"?"Full time":"Live "+(L.clock||"")} ${L.hs}-${L.as}${cor!=null?` · ${cor} corners · ${crd} cards`:""}`}}return {r:"pending"}}const why=`Final: ${socTm(r[3])} ${r[5]}-${r[6]} ${socTm(r[4])}`;
  if(b.kind==="ml"){const w=r[5]>r[6]?"h":r[5]<r[6]?"a":"d";return {r:w===b.side?"win":"loss",why}}
  const ou=(v,u)=>v==null?{r:"pending"}:{r:v===b.line?"push":((b.side==="o")===(v>b.line))?"win":"loss",why:`${why} · ${v} ${u}`};
  if(b.kind==="tot")return ou(r[5]+r[6],"goals");if(b.kind==="cor")return ou(socMatchVal(r,"cor"),"corners");if(b.kind==="card")return ou(socMatchVal(r,"card"),"cards");
  if(b.kind==="btts")return {r:((r[5]>0&&r[6]>0)===(b.side==="y"))?"win":"loss",why};
  if(b.kind==="tt")return ou(b.team==="h"?r[5]:r[6],"goals");
  if(b.kind==="h1tot"||b.kind==="h1ml"){const ev=(r[9]||[]).filter(x=>"gpo".includes(x[0]));if(ev.length!==r[5]+r[6]||ev.some(x=>x[1]==null))return {r:"pending",why:"Half-time score not in our data yet"};
    const fh=ev.filter(x=>x[1]<=45);if(b.kind==="h1ml"&&fh.some(x=>x[0]==="o"))return {r:"pending",why:"Own goal before half-time — check the result yourself"};const hh=fh.filter(x=>x[2]===r[3]).length,aa=fh.length-hh;if(b.kind==="h1tot")return ou(fh.length,"first-half goals");const w=hh>aa?"h":hh<aa?"a":"d";return {r:w===b.side?"win":"loss",why:`Half-time ${hh}-${aa}`}}
  if(b.kind==="prop"){if(!window.SOC_P_OK){socPEnsure();return {r:"pending"}}const P=SOC_P[b.pid];const g=P&&P[3].find(x=>x[0]===b.match);if(!g)return {r:"void",why:"Did not play — no action"};
    const v=socVal(g,b.mk);return {r:v===b.line?"push":((b.side==="o")===(v>b.line))?"win":"loss",why:`Final: ${v} ${(SOC_MK[b.mk]||[])[2]||""}`}}
  return {r:"pending"}}

/* ---------- player numbers ---------- */
function socVal(g,mk){const m=SOC_MK[mk];if(!m)return null;if(mk==="sga")return g[5]+g[6];return g[m[3]]}
function socPlayerGames(aid){const P=window.SOC_P&&SOC_P[aid];return P?P[3].filter(g=>socRowOk(aid,g)):[]}
/* ---------- 🎚 soccer player filters (player page only): started / off the bench, minutes, opponent's place in the table, venue ---------- */
function socPF(aid){if(!SC.pf||SC.pfId!==aid){SC.pf={role:"",min:"",tbl:"",ven:""};if(SC.pfId!==aid)SC.pfOpen=false;SC.pfId=aid}return SC.pf}
function socTblTier(lg,team){const S=typeof SOC_ST!=="undefined"&&SOC_ST[lg];if(!S)return null;const r=S.find(x=>String(x[0])===String(team));if(!r)return null;const n=S.length;return r[1]<=Math.ceil(n/3)?"top":r[1]>n-Math.ceil(n/3)?"bot":"mid"}
function socRowOk(aid,g){const f=SC.pfId===aid&&location.hash==="#soccer-player-"+aid?SC.pf:null;if(!f)return true;const P=SOC_P[aid],tid=P&&P[1],r=socResIdx()[g[0]];
  if(f.role&&(f.role==="st"?!g[1]:g[1]))return false;
  if(f.min){const [a,b]=f.min.split("-").map(Number);if(g[2]<a||g[2]>b)return false}
  if(f.ven){if(!r)return false;if((r[3]===tid?"H":"A")!==f.ven)return false}
  if(f.tbl){if(!r)return false;const opp=r[3]===tid?r[4]:r[3];if(socTblTier(r[2],opp)!==f.tbl)return false}
  return true}
function socFiltUI(aid){const f=socPF(aid),P=SOC_P[aid],[,tid,,G]=P,fx=(SOC_FX||[]).find(x=>(x.h===tid||x.a===tid)&&!socStarted(x)),opp=fx?(fx.h===tid?fx.a:fx.h):null;
  const st=G.filter(g=>g[1]),um=st.length?Math.round(st.reduce((a,g)=>a+g[2],0)/st.length):null,tn={ven:fx?(fx.h===tid?"H":"A"):"",tbl:opp&&fx?socTblTier(fx.c,opp):"",role:G.length?(st.length*2>=G.length?"st":"sub"):""};
  const R=[["ven","Venue",[["H","Home"],["A","Away"]]],["role","Role",[["st","Started"],["sub","Off the bench"]]],["min","Minutes",[["0-45","Under 45"],["45-74","45–74"],["75-120","75+"]].concat(um?[[`${Math.max(0,um-10)}-${um+10}`,`His usual (${um}±10)`]]:[])],
    ["tbl","Opp in the table",[["top","Top third"],["mid","Middle third"],["bot","Bottom third"]]]];
  const lk=k=>k==="tbl"&&opp&&tn.tbl?(()=>{const S=SOC_ST[fx.c],r=S&&S.find(x=>String(x[0])===String(opp));return `<button data-scf="tbl|${tn.tbl}" class="pxlk${f.tbl===tn.tbl?" on":""}">🎯 Like ${socE(socTm(opp))} <small>${r?socOrd(r[1]):""}</small></button>`})():"";
  const on=R.filter(([k])=>f[k]).map(([k,l,o])=>(k==="tbl"?"Opp: ":"")+((o.find(x=>x[0]===f[k])||[])[1]||f[k]));
  return `<div class="card scfc pxf"><details class="pxfd"${SC.pfOpen?" open":""}><summary class="pxfs"><span class="pxft">🎚 <b>Filters</b></span><span class="pxfc noglo">${on.length?on.map(x=>`<span class="fchip">${socE(x)}</span>`).join("")+`<span class="fchip frst" data-scfr="1">↺ Reset</span>`:`<span class="fany">No filters — all games</span>`}</span><span class="pxchev">›</span></summary>
   <div class="pxfr">${R.map(([k,l,o])=>`<div class="sitr"><span>${l}</span><div class="pxpre">${[["","Any"],...o].map(([v,t],i)=>`${i===1?lk(k):""}<button data-scf="${k}|${v}" class="${(f[k]||"")===v?"on":""}">${t}${tn[k]&&tn[k]===v?" •":""}</button>`).join("")}</div></div>`).join("")}</div>
   <div class="small">Applies to the hit rates, per-90 numbers and game log on this page. Table place is today's league table; cup games have no table, so they drop out when that filter is on.</div></details></div>`}
function socLam(aid,mk,f){const G=socPlayerGames(aid).filter(g=>g[2]>=15).slice(-10);if(G.length<3)return null;
  const mins=G.reduce((a,g)=>a+g[2],0),tot=G.reduce((a,g)=>a+(socVal(g,mk)||0),0),r90=tot/mins*90;
  const st=G.slice(-5),em=f&&f.lu?((socLuNames(f).includes(SOC_P[aid][0]))?Math.max(70,st.filter(g=>g[1]).reduce((a,g)=>a+g[2],0)/Math.max(1,st.filter(g=>g[1]).length)):20):st.reduce((a,g)=>a+g[2],0)/st.length;
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
   <div class="row" style="align-items:center;gap:6px">${socLgChip(f.c)}<span class="small">${fin?"<b>FINAL</b>":st?"<b class='up'>LIVE</b>":socTime(f.t)+" "+socTZ()}</span>${socCountdown(f)}<span class="sp"></span><span data-sclive="${f.id}">${typeof socLiveChip!=="undefined"?socLiveChip(f):""}</span></div>${!fin&&!st&&f.wx?`<div class="small" style="margin-top:3px">${socWx(f)}</div>`:""}
   <div class="scteams"><div>${socBadge(f.h)} <b>${socE(socTm(f.h))}</b>${rh?` <span class="small">${socOrd(rh)}</span>`:""}<span class="scfm">${socForm(f.h)}</span></div>
     <div>${socBadge(f.a)} <b>${socE(socTm(f.a))}</b>${ra?` <span class="small">${socOrd(ra)}</span>`:""}<span class="scfm">${socForm(f.a)}</span></div></div>
   ${O.ml||P?`<div class="scodds">${cell("1",O.ml&&O.ml.h,P&&P.p[0])}${cell("X",O.ml&&O.ml.d,P&&P.p[1])}${cell("2",O.ml&&O.ml.a,P&&P.p[2])}
     ${cell("O "+mt,O.tot&&O.tot[mt]&&O.tot[mt][0],P&&P.o[mt])}${cell("BTTS",O.btts&&O.btts.y,P&&P.btts)}</div>`:""}
   <div class="small scsum">${P&&P.cor?`🚩 Corners: we expect <b>${P.cor.t.toFixed(1)}</b>${mc?` (line ${mc})`:""}`:""}${P&&P.card?` · 🟨 Cards: <b>${P.card.t.toFixed(1)}</b>${f.ref?` · ref ${socE(f.ref)}`:""}`:""}</div>
   ${st?"":socPredShort(f)+socVerdictHtml(f)}${st?"":`<div style="margin-top:4px">${socMoveChip(f)}</div>`}
   ${O.ml||P?`<div class="small scpct">Odds = best US book · % = our estimate</div>`:`<div class="small">No odds yet — books usually post 2–3 days before kickoff.</div>`}</a>`}
function socLgFilter(){return `<div class="seg sclgf"><button class="btn${SC.lgs.length?"":" on"}" data-sclg="all">All</button>${Object.entries(SOC_LG).map(([k,v])=>`<button class="btn${SC.lgs.includes(k)?" on":""}" data-sclg="${k}">${socE(v.sh)}</button>`).join("")}</div><div class="small" style="margin:-2px 0 6px">${SC.lgs.length?`⭐ Showing ${socE((SOC_LG[SC.lgs[0]]||{}).n||"")} only — remembered on this device. Tap another league to switch, or All.`:"Tap a league to show only that one — your choice is remembered."}</div>`}
function socLgWire(el,redraw){el.querySelectorAll("[data-sclg]").forEach(b=>b.onclick=()=>{const k=b.dataset.sclg;SC.lgs=k==="all"||(SC.lgs.length===1&&SC.lgs[0]===k)?[]:[k];socLgSave();redraw()})}
function socDays(){const d0=socToday();return [...new Set((SOC_FX||[]).filter(f=>socLgOk(f.c)).map(f=>socDay(f.t)).filter(d=>d>=d0))].sort().slice(0,7)}
function socDayTabs(D,cur){const d0=socToday();return `<div class="gtabs scdays">${D.map(d=>{const c=(SOC_FX||[]).filter(f=>socDay(f.t)===d&&socLgOk(f.c)).length,n=Math.round((Date.parse(d)-Date.parse(d0))/864e5);
  return `<a href="#" data-scday="${d}" class="${d===cur?"on":""}">${n===0?"Today":n===1?"Tomorrow":new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{timeZone:"UTC",weekday:"short",day:"numeric"})}<small>${c}</small></a>`}).join("")}</div>`}
function socMatches(el){const D=socDays();if(!D.includes(SC.day))SC.day=D[0]||socToday();const d=SC.day,F=socFxOn(d);
  const byLg={};F.forEach(f=>(byLg[f.c]=byLg[f.c]||[]).push(f));
  const gap=D.length&&D[0]>socAddDays(socToday(),1)?`<div class="card small" style="margin:8px 0">No matches in the next couple of days (international break) — the next ones are below.</div>`:"";
  el.innerHTML=`<h1>⚽ Soccer · ${socE(socDayS(d))}</h1>${socPlaysCard()}${typeof prlSportHtml!=="undefined"?prlSportHtml("soc"):""}${socDayTabs(D,d)}${socLgFilter()}${gap}${socMovesCard()}
  <p class="sub">Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Championship, Eredivisie, Portugal, MLS and the three European cups. Every match shows the best US odds and <b>our estimate</b> — tap one for corners, cards, referee, weather and player props.</p>
  ${F.length?Object.entries(byLg).map(([c,L])=>`<h2 class="tsh">${socLgChip(c)} ${socE((SOC_LG[c]||{}).n||c)}</h2><div class="grid g2">${L.map(socCard).join("")}</div>`).join(""):`<div class="card"><p>No upcoming matches${SC.lgs.length?" in your leagues":""} in the next 2 weeks.</p></div>`}
  ${socFoot()}`;
  el.querySelectorAll("[data-scday]").forEach(a=>a.onclick=e=>{e.preventDefault();SC.day=a.dataset.scday;socMatches(el)});
  socLgWire(el,()=>socMatches(el))}
function socFoot(){return `<p class="small" style="margin-top:14px">Stats: ESPN box scores of every match this season (all 8 competitions). Odds: licensed US books via PropLine${typeof SOC_ODDS_AT!=="undefined"&&SOC_ODDS_AT?` (read ${typeof freshAge!=="undefined"?freshAge(SOC_ODDS_AT):SOC_ODDS_AT})`:""}. Referee card numbers: PropLine. Weather: Open-Meteo. Data updated ${socE(SOC_GEN||"")}. Estimates are leans from past numbers, not guarantees.</p>`}

/* ---------- game page ---------- */
function socHero(f){const st=socStarted(f),fin=f.state==="post";
  return `<div class="card nhhero"><div class="small">${socLgChip(f.c)} ${socE(socDayS(socDay(f.t)))} · ${socTime(f.t)} ${socTZ()}${f.ven?" · "+socE(f.ven):""} ${socCountdown(f)}</div>${fin?"":socWx(f,"head")}
  <div class="nhht" style="margin-top:10px"><div class="ght">${socBadge(f.h,1)}${socTL(f.h,`<b>${socE(socTmFull(f.h))}</b>`)}<span class="small">${socRank(f.c,f.h)?socOrd(socRank(f.c,f.h))+" · ":""}home</span><span class="scfm">${socForm(f.h,6)}</span></div>
   <div class="ght"><b style="font-size:22px">${fin||st?`${f.hs??""} – ${f.as??""}`:"v"}</b><span class="small">${fin?"Final":st?socE(f.detail||"Live"):""}</span></div>
   <div class="ght">${socBadge(f.a,1)}${socTL(f.a,`<b>${socE(socTmFull(f.a))}</b>`)}<span class="small">${socRank(f.c,f.a)?socOrd(socRank(f.c,f.a))+" · ":""}away</span><span class="scfm">${socForm(f.a,6)}</span></div></div>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><span data-sclive="${f.id}">${typeof socLiveChip!=="undefined"?socLiveChip(f):""}</span>${f.ref?`<span class="pill">🧑‍⚖️ Ref: ${socE(f.ref)}</span>`:""}${f.lu?`<span class="pill">📋 Lineups confirmed</span>`:""}</div></div>`}
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
function socOpt(lab,our,o,ob,spec){const im=socImp(o),e=our!=null&&im!=null?our-im:null;
  return `<div class="scop ${e!=null&&e>=.05?"good":e!=null&&e<=-.05?"bad":""}" title="${socE(ob?"Best price: "+ob:"No US book line")}${im!=null?" · needs "+socPct(im):""}"><span class="l">${lab}</span><b>${socPct(our)}</b><span class="o">${o!=null?socO(o):"–"}</span>${e!=null?`<span class="e">${e>0?"+":""}${Math.round(e*100)}</span>`:""}${spec&&o!=null?socBetBtn(spec):""}</div>`}
function socEstTable(f){const P=f.proj,O=f.odds||{};if(!P&&!f.odds)return "";const M=[];let extra=0;
  const mk=(main,ic,t,opts)=>{if(!opts.length)return;if(!main)extra++;M.push(`<div class="scmk${main?"":" scx"}"><div class="scmkh">${ic} ${t}</div><div class="scmko n${opts.length}">${opts.join("")}</div></div>`)};
  const sp=(...a)=>socSpec(f,...a);
  mk(1,"🏆","Match result",[["h",0,socTm(f.h)],["d",1,"Draw"],["a",2,socTm(f.a)]].map(([k,i,l])=>socOpt(socE(l),P&&P.p[i],O.ml&&O.ml[k],O.ml&&O.ml[k+"b"],sp("ml",k,null,O.ml&&O.ml[k],O.ml&&O.ml[k+"b"]))));
  const mt=O.main_tot||"2.5";for(const ln of ["2.5","1.5","3.5"]){const T=O.tot&&O.tot[ln];mk(ln===mt,"⚽",`Goals ${ln}`,[socOpt("Over",P&&P.o[ln],T&&T[0],T&&T[1],sp("tot","o",+ln,T&&T[0],T&&T[1])),socOpt("Under",P&&P.o[ln]!=null?1-P.o[ln]:null,T&&T[2],T&&T[3],sp("tot","u",+ln,T&&T[2],T&&T[3]))])}
  mk(1,"🤝","Both teams to score",[socOpt("Yes",P&&P.btts,O.btts&&O.btts.y,O.btts&&O.btts.yb,sp("btts","y",null,O.btts&&O.btts.y,O.btts&&O.btts.yb)),socOpt("No",P&&P.btts!=null?1-P.btts:null,O.btts&&O.btts.n,O.btts&&O.btts.nb,sp("btts","n",null,O.btts&&O.btts.n,O.btts&&O.btts.nb))]);
  if(P&&P.cor||O.cor){const lines=[...new Set([...(O.cor?Object.keys(O.cor):[]),"8.5","9.5","10.5","11.5"])].filter(l=>P&&P.cor&&P.cor.o[l]!=null||O.cor&&O.cor[l]).sort((a,b)=>a-b).slice(0,5),mc=O.main_cor||(P&&P.cor&&socNear(P.cor,lines));
    for(const ln of [mc,...lines.filter(l=>l!==mc)]){if(!ln)continue;const T=O.cor&&O.cor[ln],p=P&&P.cor&&P.cor.o[ln];mk(ln===mc,"🚩",`Corners ${ln}`,[socOpt("Over",p,T&&T[0],T&&T[1],sp("cor","o",+ln,T&&T[0],T&&T[1])),socOpt("Under",p!=null?1-p:null,T&&T[2],T&&T[3],sp("cor","u",+ln,T&&T[2],T&&T[3]))])}}
  if(P&&P.card){const X=O.extra&&Object.entries(O.extra).find(([k])=>/card|booking/i.test(k)),mc=socNear(P.card,["2.5","3.5","4.5","5.5"]);
    for(const ln of [mc,...["2.5","3.5","4.5","5.5"].filter(l=>l!==mc)]){const T=X&&X[1][ln],p=P.card.o[ln];mk(ln===mc,"🟨",`Cards ${ln}`,[socOpt("Over",p,T&&T[0],T&&T[1],sp("card","o",+ln,T&&T[0],T&&T[1])),socOpt("Under",p!=null?1-p:null,T&&T[2],T&&T[3],sp("card","u",+ln,T&&T[2],T&&T[3]))])}}
  if(P&&P.tt){const TT=O.ttot||{};for(const ln of ["1.5","0.5","2.5"])mk(0,"🎯",`Team goals over ${ln}`,[["h",f.h,"home"],["a",f.a,"away"]].map(([sd,tid,hk])=>{const T=(TT[hk]||{})[ln];return socOpt(socE(socTm(tid)),P.tt[sd][ln],T&&T[0],T&&T[1],sp("tt","o",+ln,T&&T[0],T&&T[1],{team:sd,title:`${socTm(tid)} over ${ln} goals`}))}))}
  if(P&&P.h1){const H=O.h1||{};mk(0,"⏱","Half-time result",[["h",0,socTm(f.h)],["d",1,"Level"],["a",2,socTm(f.a)]].map(([k,i,l])=>socOpt(socE(l),P.h1.p[i],H.ml&&H.ml[k],H.ml&&H.ml[k+"b"],sp("h1ml",k,null,H.ml&&H.ml[k],H.ml&&H.ml[k+"b"],{title:`${l} at half-time`}))));
    for(const ln of ["0.5","1.5"]){const T=H.tot&&H.tot[ln],p=P.h1.o[ln];mk(0,"⏱",`1st-half goals ${ln}`,[socOpt("Over",p,T&&T[0],T&&T[1],sp("h1tot","o",+ln,T&&T[0],T&&T[1],{title:`${socTm(f.h)} v ${socTm(f.a)} 1st half over ${ln} goals`})),socOpt("Under",1-p,T&&T[2],T&&T[3],sp("h1tot","u",+ln,T&&T[2],T&&T[3],{title:`${socTm(f.h)} v ${socTm(f.a)} 1st half under ${ln} goals`}))])}}
  if(P&&P.cor&&P.cor.more){mk(0,"🚩","Most corners",[socOpt(socE(socTm(f.h)),P.cor.more[0]),socOpt("Level",P.cor.more[1]),socOpt(socE(socTm(f.a)),P.cor.more[2])]);
    for(const ln of ["4.5","3.5","5.5"])mk(0,"🚩",`Team corners over ${ln}`,[socOpt(socE(socTm(f.h)),P.cor.ho[ln]),socOpt(socE(socTm(f.a)),P.cor.ao[ln])])}
  if(P&&P.card&&P.card.ho){for(const ln of ["1.5","0.5","2.5"])mk(0,"🟨",`Team cards over ${ln}`,[socOpt(socE(socTm(f.h)),P.card.ho[ln]),socOpt(socE(socTm(f.a)),P.card.ao[ln])]);
    if(P.card.h1)mk(0,"🟨","1st-half cards",["0.5","1.5"].map(ln=>socOpt(`Over ${ln}`,P.card.h1.o[ln])))}
  const mv=O.open&&O.ml&&O.open.ml?((a,b)=>a!=null&&b!=null&&a!==b?`<div class="small" style="margin-top:6px">📈 Opened ${socTm(f.h)} ${socO(O.open.ml[0])} · draw ${socO(O.open.ml[1])} · ${socTm(f.a)} ${socO(O.open.ml[2])} → now ${socO(O.ml.h)} / ${socO(O.ml.d)} / ${socO(O.ml.a)}</div>`:"")(O.open.ml[0],O.ml.h):"";
  return `<div class="card scest"><h2>💰 Our estimate vs the books</h2><div class="xasub">Each tile: <b>our chance</b> · best US odds · edge in points (green = we beat the price by 5+). “–” = no US line yet. Tap ＋ to save a bet.</div>
   <div class="scmks">${M.join("")}</div>
   ${extra?`<button class="btn" data-scx="1" style="margin-top:8px;width:100%">See all lines (${extra} more)</button>`:""}${mv}
   <details class="xadeep" style="margin-top:6px"><summary class="small">How we estimate</summary><div class="small" style="margin-top:4px">${P?`Each team's goals and shots on target for/against this season in ${socE((SOC_LG[f.c]||{}).n||"")}, home advantage, and a standard goals model. Corners and cards: each team's for/against averages, the referee when he's known, and how spread out those counts really are in this league. First half: this league's share of goals and cards before the break.`:`Not enough matches yet (we need 3+ per team in this competition).`}</div></details></div>`}
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
  const side=tid=>`<div><h3 style="margin:0 0 6px">${socBadge(tid)} ${socE(socTm(tid))}</h3>${(M[tid]||[]).map(x=>`<div class="small">${x[1]==="red"?"🟥":"🚑"} <b>${socE(x[0])}</b> — ${socE(x[2])}</div>`).join("")||`<div class="small">No regular starters missing.</div>`}</div>`;
  return `<div class="card"><h2>🚑 Team news &amp; lineups</h2><div class="xasub">${L?"Confirmed lineups":"Lineups appear about an hour before kickoff"} · ESPN has no soccer injury list, so we flag regular starters who missed the last 2 matches and red-card bans</div><div class="sc2">${side(f.h)}${side(f.a)}</div></div>`}
function socGame(el,id){const f=socFx(id);if(!f){el.innerHTML=`<p><a href="#soccer">← All matches</a></p><div class="card">This match isn't in our list any more (finished matches move to the results). <a href="#soccer">See today's matches</a>.</div>`;return}
  const tab=({game:"ov"}[SC.tab]||SC.tab||"ov"),np=(SOC_PROPS||[]).filter(r=>r[5]===f.id).length;
  const T=[["ov","Overview"],["mu","Matchup"],["tr","Trends"],["h2h","H2H"],["props",`Props${np?` <small>${np}</small>`:""}`]];
  el.innerHTML=`<p><a href="#soccer">← All matches</a></p>${socHero(f)}${gpTabs(tab,T.map(([k,l])=>[k,l,"#",`data-sctab="${k}"`]))}<div id="scBody"></div>`;
  const body=el.querySelector("#scBody"),LZ=(t,fn)=>typeof gpLazy!=="undefined"?gpLazy(t,fn):fn();
  const summary=()=>{let pick="",props=[];try{const x=socPred(f);if(x)pick=`<b>${socE(socTm(f.h))} ${x.score[0]}–${x.score[1]} ${socE(socTm(f.a))}</b> <span class="small">${socE(x.res)}</span>`}catch(e){}
    try{props=socBestProps().filter(x=>x.f&&x.f.id===f.id&&x.our>=.45).slice(0,2).map(x=>`<b>${socE(x.nm)}</b> ${socE((SOC_MK[x.mk]||[])[1]||x.mk)}${x.line!=null?" "+x.line:""} <span class="small">${x.price!=null?oddsFmt(x.price):""}${x.our!=null?` · our chance ${Math.round(x.our*100)}%`:""}</span>`)}catch(e){}
    return gpSummary({pick,props})};
  const draw=()=>{const t=({game:"ov"}[SC.tab]||SC.tab||"ov");
    if(t==="props"){body.innerHTML=`<div class="small">Loading players…</div>`;socPEnsure(()=>{body.innerHTML=(typeof socParlayCard!=="undefined"?socParlayCard(f):"")+socGameProps(f);socWire(body)},[f.h,f.a]);return}
    if(t==="ov")body.innerHTML=`${summary()}<div id="scLiveBox" data-id="${f.id}">${socLiveStats(f)}</div>${socVerdictHtml(f,1)}${socPredCard(f)}`
      +gpMerge("What matters","gpwm",[(typeof xQuickHtml!=="undefined"?xQuickHtml(socQuick(f),"Automatic notes from this season's numbers — reasons to look closer, not picks."):""),(typeof xfSoc!=="undefined"?xfSoc(f):""),(typeof fxSoc!=="undefined"?fxCard(fxSoc(f),"Past meetings in our data and this season's results."):"")])
      +gpMerge("Injuries &amp; lineups","gpinj",[socMissCard(f),`<div id="scXIbox">${window.SOC_P_OK||socLuOf(f)?socXICard(f):""}</div>`])
      +(f.wx?socFold("🌦️ Weather at kickoff",socWx(f,1)):"")+socFoot();
    if(t==="mu")body.innerHTML=`${socEstTable(f)}${socCornerCard(f)}${socCardCard(f)}${socFold("📊 Team numbers",socTeamCmp(f))}<div id="scGKf">${socFold("🧤 Goalkeepers",socGKCard(f))}</div>`+LZ("Where the goals come from",()=>typeof vxSocPos!=="undefined"?vxSocPos(f):"")+(()=>{const h=typeof vxSocMissImpact!=="undefined"?vxSocMissImpact(f):"";return h?LZ("If the missing players sit",()=>h):""})()+LZ("Chances vs goals",()=>typeof vxSocChance!=="undefined"?vxSocChance(f):"")+LZ("Attack vs defense — the league",()=>typeof vxStrength!=="undefined"?vxStrength("soc",f):"")+socFoot();
    if(t==="tr")body.innerHTML=`${socFold("📅 Recent form",socFormCard(f))}`+LZ("Upcoming schedule",()=>typeof vxSched!=="undefined"?vxSched("soc",f.h,f.a,socTm,f.c,new Date(Date.parse(f.t)-5*36e5).toISOString().slice(0,10)):"")+socFoot();
    if(t==="h2h")body.innerHTML=socH2HCard(f)+socFoot();
    socWire(body);if(!(window.SOC_P_OK&&socPKeys([f.h,f.a]).every(k=>SOCPL.have[k]||SOCPL.have.all)))socPEnsure(()=>{const g=body.querySelector("#scGKf");if(g)g.innerHTML=socFold("🧤 Goalkeepers",socGKCard(f));const x=body.querySelector("#scXIbox");if(x)x.innerHTML=socXICard(f)},[f.h,f.a])};
  el.querySelectorAll("[data-sctab]").forEach(b=>b.onclick=e=>{e.preventDefault();SC.tab=b.dataset.sctab;el.querySelectorAll("[data-sctab]").forEach(x=>x.classList.toggle("on",x===b));const y=scrollY;draw();scrollTo(0,y)});draw()}
function socWire(el){el.querySelectorAll("[data-scx]").forEach(b=>b.onclick=()=>{const c=b.closest(".scest");b.dataset.t0=b.dataset.t0||b.textContent;const on=c.classList.toggle("open");b.textContent=on?"Show main lines only":b.dataset.t0})}

/* ---------- player props ---------- */
function socLuStatus(f,nm){const L=socLuOf(f);if(!L)return null;const n=String(nm||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();const eq=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()===n;
  for(const v of Object.values(L)){const xi=Array.isArray(v)?v:(v.xi||[]).map(x=>x[0]);if(xi.some(eq))return "xi";if(!Array.isArray(v)&&(v.sub||[]).some(eq))return "bench"}return "out"}
/* team news: "red" = banned (red card), "miss" = a regular who missed the last 2 matches (usually injured) — by name */
function socMissOf(f,nm){if(!f||!f.miss)return null;const n=typeof loNorm!=="undefined"?loNorm(nm):nm;for(const L of Object.values(f.miss))for(const x of L)if((typeof loNorm!=="undefined"?loNorm(x[0]):x[0])===n)return x[1];return null}
function socPropEval(r,f){const [nm,mk,line,price,book,,under,aid]=r;let lu=socLuStatus(f,nm);const ms=socMissOf(f,nm);if(ms==="red"&&lu!=="xi"&&lu!=="bench")lu="out";const L=aid&&lu!=="out"&&socLam(aid,mk,f);const our=L?socPover(L.lam,line):null;const im=socImp(price);
  const [h,n]=aid?socHitP(aid,mk,line,10):[0,0];return {nm,mk,line,price,book,under,aid,our,im,edge:our!=null&&im!=null?our-im:null,h,n,L,lu,ms}}
function socPropLab(mk,line){const m=SOC_MK[mk]||[mk,mk];if(mk==="sgoal")return "Anytime goal";if(mk==="sast")return "To assist";if(mk==="sga")return "Goal or assist";if(mk==="s2g")return "2+ goals";if(mk==="scard")return "To be booked";return `${line+.5}+ ${m[1].toLowerCase()}`}
function socPropRow(x,f){const sp=f&&socSpec(f,"prop","o",x.line,x.price,x.book,{pid:x.aid,mk:x.mk,player:x.nm,title:`${x.nm} ${socPropLab(x.mk,x.line)}`});
  const luc=x.lu==="xi"?`<span class="pll o" title="In the confirmed starting XI">✅ starting</span>`:x.lu==="bench"?`<span class="pll n" title="On the bench — our chance assumes about 20 minutes">🪑 bench</span>`:x.lu==="out"?`<span class="pll u" title="${x.ms==="red"?"Banned (red card)":"Not in the confirmed squad"}">❌ ${x.ms==="red"?"suspended":"not in squad"}</span>`:x.ms==="miss"?`<span class="pll n" title="A regular who missed his team's last 2 matches — check the team news">🚑 missed last 2</span>`:"";
  return `<div class="scpr"><div><a href="${x.aid?"#soccer-player-"+x.aid:"#"}"><b>${socE(x.nm)}</b></a> ${luc} <span class="small">${socE(socPropLab(x.mk,x.line))}</span>${x.n?`<div class="small">Hit in <b>${x.h} of last ${x.n}</b> games${x.L?` · ${x.L.r90.toFixed(2)} per 90 · ~${Math.round(x.L.em)} min`:""}</div>`:`<div class="small">Not enough games in our data</div>`}</div>
   <div class="scprr"><b>${socO(x.price)}</b><span class="small">${socE(x.book||"")}</span>${x.our!=null?`<em class="${socEdgeCls(x.edge)}">our ${socPct(x.our)} · needs ${socPct(x.im)}</em>`:""}</div>${sp&&x.price!=null?socBetBtn(sp):""}</div>`}
/* stat-only markets (no US book line yet): shots, fouls committed, fouls won for the likely starters */
function socStatOnly(f){const T={};for(const [aid,P] of Object.entries(window.SOC_P||{})){if(P[1]!==f.h&&P[1]!==f.a)continue;const G=P[3].slice(-5);if(f.lu?!socLuNames(f).includes(P[0]):(G.filter(g=>g[1]).length<3||socMissOf(f,P[0])))continue;(T[P[1]]=T[P[1]]||[]).push(aid)}
  const cell=(aid,mk,line)=>{const L=socLam(aid,mk,f),p=L&&socPover(L.lam,line),[h,n]=socHitP(aid,mk,line,10);return `<td>${n?`<b>${h}/${n}</b> <span class="small">${socPct(p)}</span>`:"–"}</td>`};
  const side=tid=>{const A=(T[tid]||[]).map(a=>[a,socLam(a,"sshot",f)]).sort((a,b)=>((b[1]&&b[1].lam)||0)-((a[1]&&a[1].lam)||0)).slice(0,9);if(!A.length)return "";
    return `<h3 style="margin:10px 0 6px">${socBadge(tid)} ${socE(socTm(tid))}</h3><div class="alw"><table class="altt sctbl"><thead><tr><th>Player</th><th>1+ shots</th><th>2+ shots</th><th>1+ on target</th><th>1+ fouls</th><th>2+ fouls</th><th>Fouled 1+</th><th>Fouled 2+</th></tr></thead><tbody>
    ${A.map(([a])=>`<tr><td><a href="#soccer-player-${a}">${socE(SOC_P[a][0])}</a> <span class="small">${socE(SOC_P[a][2]||"")}</span></td>${cell(a,"sshot",.5)}${cell(a,"sshot",1.5)}${cell(a,"ssot",.5)}${cell(a,"sfoul",.5)}${cell(a,"sfoul",1.5)}${cell(a,"sfwon",.5)}${cell(a,"sfwon",1.5)}</tr>`).join("")}</tbody></table></div>`};
  return `<div class="card"><h2>👟 Shots &amp; fouls</h2><div class="xasub">Hit in last 10 games · % = our chance (his rate per 90 × expected minutes × this opponent). ${f.lu?"Confirmed starters.":"Likely starters (3+ starts in the last 5)."} US books in our feed don't post shots or fouls lines yet.</div>${side(f.h)}${side(f.a)}</div>`}
function socGameProps(f){const R=(SOC_PROPS||[]).filter(r=>r[5]===f.id).map(r=>socPropEval(r,f));
  const groups={};R.forEach(x=>(groups[x.mk]=groups[x.mk]||[]).push(x));const order=["sgoal","sga","ssot","sast","s2g","sshot","sfoul","sfwon","scard"];
  return `${R.length?order.filter(k=>groups[k]).map(k=>`<div class="card"><h2>${socE(SOC_MK[k][1])}</h2>${groups[k].sort((a,b)=>(b.edge??-9)-(a.edge??-9)).map(x=>socPropRow(x,f)).join("")}</div>`).join(""):`<div class="card small">No player props posted yet for this match — books add them 1–2 days before kickoff.</div>`}${socStatOnly(f)}${socFoot()}`}
function socBestProps(){const out=[];for(const r of SOC_PROPS||[]){const f=socFx(r[5]);if(!f||socStarted(f))continue;const x=socPropEval(r,f);if(x.edge!=null&&x.n>=5&&x.lu!=="out"&&!x.ms)out.push(Object.assign(x,{f}))}return out.sort((a,b)=>b.edge-a.edge)}
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
  const [nm,tid,pos,G0]=P,G=G0.filter(g=>socRowOk(aid,g)),RI=socResIdx(),last=G.slice(-15).reverse(),fx=(SOC_FX||[]).find(f=>(f.h===tid||f.a===tid)&&!socStarted(f));
  const tot=k=>G.reduce((a,g)=>a+(socVal(g,k)||0),0),mins=G.reduce((a,g)=>a+g[2],0),p90=k=>mins?(tot(k)/mins*90).toFixed(2):"–";
  const props=fx?(SOC_PROPS||[]).filter(r=>r[5]===fx.id&&r[7]===aid).map(r=>socPropEval(r,fx)):[];
  const hr=(mk,line)=>{const [h,n]=socHitP(aid,mk,line,10);return n?`<b>${h}/${n}</b>`:"–"};
  el.innerHTML=`<p><a href="#soccer">← Soccer</a></p><div class="phead"><div><h1>${socE(nm)}</h1><p class="sub">${socBadge(tid)} ${socE(socTmFull(tid))} · ${socE(pos||"")} · ${G.length} appearances (${G.filter(g=>g[1]).length} starts) · ${mins} minutes</p></div><div></div></div>
  ${fx?`<div class="card"><h2>Next: ${fx.h===tid?"vs":"@"} ${socE(socTm(fx.h===tid?fx.a:fx.h))} <span class="small">${socE(socDayS(socDay(fx.t)))} · <a href="#soccer-game-${fx.id}">match page →</a></span></h2>${props.map(x=>socPropRow(x,fx)).join("")||`<div class="small">No props posted for him yet.</div>`}</div>`:""}
  ${socFiltUI(aid)}
  ${(()=>{const K=socLineOf(pos)===0&&socGKSeason(aid);return K?`<div class="card"><h2>🧤 In goal this season <span class="small">${K.n} matches (45+ min)</span></h2><div class="pbio"><div><b>${(K.sv/K.n).toFixed(1)}</b>Saves / match</div><div><b>${K.sv}</b>Saves</div><div><b>${K.pct!=null?Math.round(K.pct*100)+"%":"–"}</b>Save %</div><div><b>${K.ga}</b>Conceded</div><div><b>${K.cs}</b>Clean sheets</div></div>
    <div class="small" style="margin-top:8px">Saves, last 10: ${socChips(K.G.slice(-10).map(x=>x[1]),2.5,"saves")}</div></div>`:""})()}
  <div class="card"><h2>Per 90 minutes</h2><div class="pbio"><div><b>${p90("sshot")}</b>Shots</div><div><b>${p90("ssot")}</b>On target</div><div><b>${p90("sgoal")}</b>Goals</div><div><b>${p90("sast")}</b>Assists</div><div><b>${p90("sfoul")}</b>Fouls</div><div><b>${p90("sfwon")}</b>Fouled</div></div>
   <div class="small" style="margin-top:8px">Last 10 games (15+ min): 1+ shots ${hr("sshot",.5)} · 2+ shots ${hr("sshot",1.5)} · 1+ on target ${hr("ssot",.5)} · goal ${hr("sgoal",.5)} · goal or assist ${hr("sga",.5)} · 1+ fouls ${hr("sfoul",.5)} · fouled 1+ ${hr("sfwon",.5)} · fouled 2+ ${hr("sfwon",1.5)}</div></div>
  <div class="card"><h2>Game log</h2><div class="alw"><table class="altt sctbl"><thead><tr><th>Date</th><th>Opp</th><th>Min</th><th>Sh</th><th>SOT</th><th>G</th><th>A</th><th>Fouls</th><th>Fouled</th><th>${socLineOf(pos)===0?"Saves":"🟨"}</th></tr></thead><tbody>
  ${last.map(g=>{const r=RI[g[0]];const opp=r?(r[3]===tid?r[4]:r[3]):null;return `<tr class="sclink" data-href="#soccer-match-${g[0]}"><td class="small"><a href="#soccer-match-${g[0]}">${r?r[1].slice(5,10):""}</a></td><td>${r?(r[3]===tid?"":"@")+socE(socTm(opp)):""} <span class="small">${r?socE((SOC_LG[r[2]]||{}).sh||""):""}</span></td><td>${g[2]}${g[1]?"":"*"}</td><td>${g[3]}</td><td>${g[4]}</td><td>${g[5]}</td><td>${g[6]}</td><td>${g[7]}</td><td>${g[8]}</td><td>${socLineOf(pos)===0?(g[11]||0):""}${g[9]?"🟨":""}${g[10]?"🟥":""}</td></tr>`}).join("")}</tbody></table></div><div class="small">* came off the bench (minutes estimated from the substitution time)</div></div>${socFoot()}`})}

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
function socMatchPlayers(id,tid){const out=[];if(window.SOC_P)for(const [aid,P] of Object.entries(SOC_P)){if(P[1]!==tid&&!P[3].some(g=>g[0]===id))continue;const g=P[3].find(g=>g[0]===id);if(g)out.push({aid,nm:P[0],pos:g[12]||P[2],g,tid:P[1]})}
  const O=window.SOC_OLDP&&SOC_OLDP[id];if(O&&!out.length)for(const r of O)out.push({aid:r[1],nm:r[2],pos:r[3],g:[id,r[4],r[5],...r.slice(6),r[3]],tid:r[0],old:1});
  return out}
function socMatchPage(el,id){const r0=socMatchRow(id);socPEnsure(()=>{const r=socMatchRow(id);if(!r){el.innerHTML=`<p><a href="#soccer-results">← Results</a></p><div class="card">Match not found.</div>`;return}
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
  ${Ht&&At?`<div class="card"><h2>📊 Match stats</h2><div class="alw"><table class="altt sctbl"><thead><tr><th></th><th>${socBadge(h)}</th><th>${socBadge(a)}</th></tr></thead><tbody>${SOC_TSL.map(([l,i])=>`<tr><td>${l}</td><td><b>${Ht[i]??"–"}</b></td><td><b>${At[i]??"–"}</b></td></tr>`).join("")}<tr class="sctot"><td>Total corners <span class="small">(both teams)</span></td><td colspan="2" style="text-align:center"><b>${(Ht[2]??0)+(At[2]??0)}</b> <span class="small">= ${Ht[2]??0} + ${At[2]??0}</span></td></tr><tr class="sctot"><td>Total cards <span class="small">(both teams)</span></td><td colspan="2" style="text-align:center"><b>${(Ht[4]??0)+(Ht[5]??0)+(At[4]??0)+(At[5]??0)}</b> <span class="small">= ${(Ht[4]??0)+(Ht[5]??0)} + ${(At[4]??0)+(At[5]??0)}</span></td></tr></tbody></table></div></div>`:`<div class="card small">No team stats for this match.</div>`}
  ${socLineupCard(id,h,a,P)}
  <details class="card"><summary><b>👟 All player numbers (table)</b></summary><h3 style="margin:10px 0 6px">${socE(socTm(h))}</h3>${side(h)}<h3 style="margin:12px 0 6px">${socE(socTm(a))}</h3>${side(a)}<div class="small" style="margin-top:6px">* came off the bench</div></details>${socFoot()}`;socLineupWire(el)},r0?[r0[3],r0[4]]:null,!socResIdx()[id])}
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
    box.innerHTML=`<h2>👟 Players <span class="small">this season, all competitions</span></h2><div class="alw"><table class="altt sctbl"><thead><tr><th>Player</th><th>Apps</th><th>Min</th><th>G</th><th>A</th><th>Sh/90</th><th>SOT/90</th><th>Fouls/90</th><th>Fouled/90</th></tr></thead><tbody>${L.map(x=>{const p9=v=>x.m?(v/x.m*90).toFixed(2):"–";return `<tr><td><a href="#soccer-player-${x.aid}">${socE(x.P[0])}</a> <span class="small">${socE(x.P[2]||"")}</span></td><td>${x.n} <span class="small">(${x.st})</span></td><td>${x.m}</td><td>${x.g}</td><td>${x.a}</td><td>${p9(x.sh)}</td><td>${p9(x.sot)}</td><td>${p9(x.fc)}</td><td>${p9(x.fs)}</td></tr>`}).join("")}</tbody></table></div>`},[tid])}
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

/* ---------- 🟩 lineups: starting XI on a pitch by position, subs below; tap a player for his numbers in that match ---------- */
function socLineOf(pos){const p=String(pos||"").toUpperCase();if(p==="G"||p==="GK")return 0;if(/^(CD|LB|RB|LWB|RWB|D|SW|CB)/.test(p))return 1;if(/^DM/.test(p))return 2;if(/^AM/.test(p))return 4;if(/^(CF|F|ST|LW|RW|SS|W)/.test(p))return 5;if(/^(CM|LM|RM|M)/.test(p))return 3;return 3}
function socSideOf(pos){const p=String(pos||"").toUpperCase();if(/-L$/.test(p)||/^L/.test(p))return 0;if(/-R$/.test(p)||/^R/.test(p))return 2;return 1}
function socShort(n){const w=String(n||"").split(" ");return w.length>1?w.slice(1).join(" "):n}
/* ESPN sometimes lists a player in a slot he doesn't play (a left-back shown as a centre-back in a back three, etc.).
   If a player started 5+ matches we know of and 70%+ of them in one role, and this match's label puts him in a different line, show his usual role. */
var SOC_USUAL=null;function socUsualPos(aid){if(!aid)return null;if(!SOC_USUAL){SOC_USUAL={};const add=(a,p)=>{if(!a||!p||p==="SUB")return;const U=SOC_USUAL[a]||(SOC_USUAL[a]={});U[p]=(U[p]||0)+1};
    for(const [a,P] of Object.entries(window.SOC_P||{}))for(const g of P[3]||[])if(g[1])add(a,g[12]);
    for(const R of Object.values(window.SOC_OLDP||{}))for(const r of R)if(r[4])add(r[1],r[3])}
  const U=SOC_USUAL[aid];if(!U)return null;const n=Object.values(U).reduce((a,b)=>a+b,0);if(n<5)return null;
  const byLine={};for(const [p,c] of Object.entries(U)){const l=socLineOf(p);byLine[l]=(byLine[l]||0)+c}
  const [bl,bc]=Object.entries(byLine).sort((a,b)=>b[1]-a[1])[0];if(bc/n<.7)return null;
  return Object.entries(U).filter(([p])=>socLineOf(p)===+bl).sort((a,b)=>b[1]-a[1])[0][0]}
function socFixPos(x){const u=socUsualPos(x.aid);if(!u||!x.pos||socLineOf(x.pos)===0||socLineOf(u)===0)return x.pos;return socLineOf(u)!==socLineOf(x.pos)||(socSideOf(u)!==1&&socSideOf(x.pos)===1&&socLineOf(u)===1)?u:x.pos}
/* left-to-right spot from ESPN's slot label: LB/LM/LW 0 · CD-L/AM-L 1 · centre 2 · CD-R 3 · RB/RM/RW 4 */
function socXOf(pos){const p=String(pos||"").toUpperCase();if(/-L$/.test(p))return 1;if(/-R$/.test(p))return 3;if(/^L/.test(p))return 0;if(/^R/.test(p))return 4;return 2}
/* how deep a slot sits: line first, then (inside a line) centre-backs before full-backs, sided forwards behind a lone central one */
function socDepth(pos){const p=String(pos||"").toUpperCase(),l=socLineOf(p);let d=l*10;if(l===1&&/^(LB|RB)/.test(p))d+=3;if(l===1&&/WB/.test(p))d+=6;if(l===5&&socXOf(p)!==2)d-=2;return d}
/* ESPN's slot labels describe the formation slot, not the job (in a 4-2-3-1 the two holding midfielders are listed as "LM"/"RM").
   With the team's formation (e.g. 4-2-3-1) we sort the XI from deepest to most advanced and fill the formation's rows in order,
   so the picture always has the real shape; the role names come from the row each player lands in. */
function socFmRows(L,fm){const n=String(fm||"").split("-").map(Number);if(!n.length||n.some(x=>!x)||n.reduce((a,b)=>a+b,0)!==10||L.length!==11)return null;
  const gk=L.filter(x=>socLineOf(x.pos)===0);if(gk.length!==1)return null;const O=L.filter(x=>x!==gk[0]).sort((a,b)=>socDepth(a.pos)-socDepth(b.pos));
  const rows=[gk];let k=0;for(const c of n){rows.push(O.slice(k,k+c).sort((a,b)=>socXOf(a.pos)-socXOf(b.pos)));k+=c}
  const nr=n.length,back3=n[0]===3;gk[0].role="Goalkeeper";
  rows.slice(1).forEach((R,r)=>{const m=R.length;R.forEach((x,j)=>{const end=m>1&&(j===0||j===m-1),Ls=j===0?"Left":"Right";let t;
    if(r===0)t=m>=4?(end?(m===5?`${Ls} wing-back`:`${Ls}-back`):"Centre-back"):m===3?(end?`${Ls} centre-back`:"Centre-back"):"Centre-back";
    else if(r===nr-1)t=m===3?(end?`${Ls} winger`:"Striker"):"Striker";
    else{const first=r===1,last=r===nr-2,mids=nr-2;
      if(m>=4)t=end?(back3&&mids===1||back3&&first?`${Ls} wing-back`:`${Ls} midfielder`):"Central midfielder";
      else if(m===3)t=mids===1?"Central midfielder":last?(end?`${Ls} winger`:"Attacking midfielder"):"Central midfielder";
      else t=mids>1&&first?"Defensive midfielder":mids>1&&last?"Attacking midfielder":"Central midfielder"}
    x.role=t})});
  return rows}
function socPitch(L,key,fm){L.forEach((x,i)=>{const p=socFixPos(x);if(p!==x.pos){x.espnPos=x.pos;x.pos=p}x.i=i;x.role=null});
  let rows=socFmRows(L,fm);if(!rows){rows=[[],[],[],[],[],[]];L.forEach(x=>rows[socLineOf(x.pos)].push(x));rows.forEach(r=>r.sort((a,b)=>socXOf(a.pos)-socXOf(b.pos)))}
  const chip=x=>{const g=x.g||[];const b=!x.g?"":(g[5]?"⚽".repeat(Math.min(g[5],3)):"")+(g[6]?"🅰️":"")+(g[10]?"🟥":g[9]?"🟨":"")+(!g[1]?"":g[2]<85?"🔻":"");
    const gk=socLineOf(x.pos)===0;if(!x.g)return `<a class="scpl${gk?" gk":""}" ${x.aid?`href="#soccer-player-${x.aid}"`:""}><span class="scsh">${gk?"🧤":""}</span><i>${socE(socShort(x.nm))}</i></a>`;return `<button class="scpl${gk?" gk":""}" data-scpl="${key}|${x.i}"><span class="scsh">${gk?"🧤":""}</span><i>${socE(socShort(x.nm))}</i>${b?`<em>${b}</em>`:""}</button>`};
  return `<div class="scpitch"><div class="pm half"></div><div class="pm circ"></div><div class="pm box"></div><div class="pm six"></div><div class="pm arc"></div><div class="pm spot"></div><div class="pm goal"></div>
   <div class="scrows">${rows.slice().reverse().filter(r=>r.length).map(r=>`<div class="scrow">${r.map(chip).join("")}</div>`).join("")}</div></div>`}
/* the formation a team used in a finished match, or its most recent one (for a predicted XI) */
function socFmOf(id,tid){const F=window.SOC_FM||{};if(id&&F[id]&&F[id][tid])return F[id][tid];const R=(typeof socTeamRes==="function"?socTeamRes(tid):[]).slice().reverse();for(const r of R)if(F[r[0]]&&F[r[0]][tid])return F[r[0]][tid];return ""}
function socLineupCard(id,h,a,P){const all={};const mk=tid=>{const L=P.filter(x=>x.tid===tid);return {xi:L.filter(x=>x.g[1]),sub:L.filter(x=>!x.g[1]).sort((x,y)=>y.g[2]-x.g[2])}};
  const H=mk(h),A=mk(a);if(H.xi.length<7||A.xi.length<7)return "";all.h=[...H.xi,...H.sub];all.a=[...A.xi,...A.sub];window.SOC_LU_CUR={id,all};
  const side=(k,tid,T)=>`<div><h3 style="margin:0 0 6px">${socBadge(tid)} ${socTL(tid,socE(socTm(tid)))}${socFmOf(id,tid)?` <span class="small">${socE(socFmOf(id,tid))}</span>`:""}</h3>${socPitch(T.xi,k,socFmOf(id,tid))}
    <div class="scbench"><b>Subs used</b>${T.sub.map((x,j)=>`<button class="scpl sub" data-scpl="${k}|${T.xi.length+j}"><i>${socE(x.nm)}</i><em>${x.g[2]}′${x.g[5]?" ⚽":""}${x.g[6]?" 🅰️":""}${x.g[9]?" 🟨":""}</em></button>`).join("")||`<span class="small">none</span>`}</div></div>`;
  return `<div class="card"><h2>🟩 Lineups</h2><div class="xasub">Starting XI by position · ⚽ goal · 🅰️ assist · 🟨/🟥 card · 🔻 subbed off · tap a player for his match</div>
   <div class="sc2">${side("h",h,H)}${side("a",a,A)}</div><div id="scPlBox" class="scplbox" hidden></div></div>`}
function socLineupWire(el){el.querySelectorAll("[data-scpl]").forEach(b=>b.onclick=()=>{const [k,i]=b.dataset.scpl.split("|"),C=window.SOC_LU_CUR,x=C&&C.all[k][+i];if(!x)return;
  el.querySelectorAll(".scpl.on").forEach(z=>z.classList.remove("on"));b.classList.add("on");const g=x.g,box=el.querySelector("#scPlBox");
  box.hidden=false;box.innerHTML=`<div class="row" style="align-items:center;gap:8px"><b style="font-size:16px">${socE(x.nm)}</b><span class="small">${socE(x.role||x.pos||"")} · ${socE(socTm(x.tid))}</span><span class="sp"></span>${x.old?"":`<a class="small" href="#soccer-player-${x.aid}">Season page →</a>`}</div>
   <div class="pbio" style="margin-top:8px"><div><b>${g[2]}′</b>${g[1]?"Started":"Came on"}</div>${socLineOf(x.pos)===0?"":`<div><b>${g[5]}</b>Goals</div>`}<div><b>${g[6]}</b>Assists</div><div><b>${g[3]}</b>Shots</div><div><b>${g[4]}</b>On target</div><div><b>${g[7]}</b>Fouls</div><div><b>${g[8]}</b>Fouled</div><div><b>${g[9]?"🟨":g[10]?"🟥":"–"}</b>Card</div></div>${socLineOf(x.pos)===0?(()=>{const r=socMatchRow(C.id),ga=r?(x.tid===r[3]?r[6]:r[5]):null,sv=g[11]||0,pct=ga!=null&&sv+ga?Math.round(sv/(sv+ga)*100):null;
     return `<div class="pbio" style="margin-top:8px"><div><b>${sv}</b>🧤 Saves</div><div><b>${ga??"–"}</b>Goals conceded</div><div><b>${pct!=null?pct+"%":"–"}</b>Save %</div><div><b>${ga===0?"✅":"–"}</b>Clean sheet</div></div>`})():""}`;
  box.scrollIntoView({block:"nearest",behavior:"smooth"})})}

/* ---------- 📡 live: scores, minute and running team stats from ESPN, in the visitor's browser ----------
   Polls only while a match is on (or about to be), every 30 s; game pages also pull live corners / cards / shots.
   If the feed can't be reached (some hosts block outside requests) nothing changes. */
const SOCL={m:{},sum:{},lu:{},luAt:{},t:null,busy:0};
async function socLuTick(){if(location.protocol==="file:"||!window.SOC_OK)return;const h=decodeURIComponent((location.hash||"").slice(1));if(!h.startsWith("soccer-game-"))return;const f=socFx(h.slice(12).replace(/-props$/,""));if(!f)return;
  const m=(Date.parse(f.t)-Date.now())/60000;if(m>75||m<-5)return;try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${SOC_SLUG[f.c]}/summary?event=${f.id}`,{cache:"no-store"});if(!r.ok)return;const j=await r.json(),lu={};
    for(const sd of j.rosters||[]){const R=sd.roster||[],xi=R.filter(p=>p.starter).map(p=>[(p.athlete||{}).displayName,(p.position||{}).abbreviation||"",(p.athlete||{}).id]);if(xi.length>=11)lu[(sd.team||{}).id]={xi,fm:sd.formation||"",sub:R.filter(p=>!p.starter).map(p=>(p.athlete||{}).displayName)}}
    if(Object.keys(lu).length===2){SOCL.lu[f.id]=lu;SOCL.luAt[f.id]=Date.now();const x=document.getElementById("scXIbox");if(x)x.innerHTML=socXICard(f)}}catch(e){}}
setInterval(()=>{if(!document.hidden)socLuTick()},120000);window.addEventListener("hashchange",()=>setTimeout(socLuTick,1500));
const SOC_SLUG={epl:"eng.1",laliga:"esp.1",seriea:"ita.1",bund:"ger.1",ligue1:"fra.1",ucl:"uefa.champions",uel:"uefa.europa",uecl:"uefa.europa.conf",champ:"eng.2",ered:"ned.1",port:"por.1",mls:"usa.1"};
function socLiveWindow(){if(!window.SOC_OK)return [];const now=Date.now();return (SOC_FX||[]).filter(f=>{const t=Date.parse(f.t);return t-now<15*60000&&now-t<150*60000})}
async function socLiveTick(){if(SOCL.busy||location.protocol==="file:"||!window.SOC_OK)return;const W=socLiveWindow();if(!W.length)return;SOCL.busy=1;
  try{const comps=[...new Set(W.map(f=>f.c))],day=new Date().toISOString().slice(0,10).replace(/-/g,"");
    await Promise.all(comps.map(async c=>{try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${SOC_SLUG[c]}/scoreboard?dates=${day}`,{cache:"no-store"});if(!r.ok)return;const j=await r.json();
      for(const e of j.events||[]){const co=e.competitions[0],H=co.competitors.find(x=>x.homeAway==="home"),A=co.competitors.find(x=>x.homeAway==="away"),st=e.status.type;
        SOCL.m[e.id]={st:st.state,clock:e.status.displayClock,det:st.shortDetail||st.detail,hs:+H.score||0,as:+A.score||0,at:Date.now()}}}catch(e){}}));
    const h=decodeURIComponent((location.hash||"").slice(1)),gid=h.startsWith("soccer-game-")?h.slice(12).replace(/-props$/,""):null;
    const want=new Set(W.filter(f=>(SOCL.m[f.id]||{}).st==="in"&&(f.id===gid||socBetMatches().has(f.id))).map(f=>f.id));
    await Promise.all([...want].map(async id=>{const f=socFx(id);try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${SOC_SLUG[f.c]}/summary?event=${id}`,{cache:"no-store"});if(!r.ok)return;const j=await r.json();
      const ts={};for(const t of (j.boxscore||{}).teams||[]){const m={};for(const x of t.statistics||[])m[x.name]=+x.displayValue;ts[t.team.id]=[m.totalShots,m.shotsOnTarget,m.wonCorners,m.foulsCommitted,m.yellowCards,m.redCards,m.possessionPct]}SOCL.sum[id]={ts,at:Date.now()}}catch(e){}}));
    socLivePaint()}finally{SOCL.busy=0}}
function socBetMatches(){try{return new Set(betsLoad().filter(b=>b.k==="soc").map(b=>String(b.match)))}catch(e){return new Set()}}
function socLiveOf(f){return f&&SOCL.m[f.id]||null}
function socLiveChip(f){const L=socLiveOf(f);if(!L||L.st==="pre")return "";return L.st==="post"?`<span class="sclv post">FT ${L.hs}-${L.as}</span>`:`<span class="sclv"><b>LIVE</b> ${socE(L.clock||"")} · ${L.hs}-${L.as}</span>`}
function socLiveStats(f){const L=socLiveOf(f),S=SOCL.sum[f.id];if(!L||L.st==="pre")return "";const T=S&&S.ts,a=T&&T[f.h],b=T&&T[f.a];
  return `<div class="card sclivecard"><h2>📡 ${L.st==="post"?"Full time":"Live"} · ${socE(socTm(f.h))} ${L.hs}–${L.as} ${socE(socTm(f.a))} <span class="small">${socE(L.det||L.clock||"")}</span></h2>
   ${a&&b?`<div class="alw"><table class="altt sctbl"><thead><tr><th></th><th>${socBadge(f.h)}</th><th>${socBadge(f.a)}</th><th>Total</th></tr></thead><tbody>${[["Corners",2],["Yellow cards",4],["Red cards",5],["Shots",0],["On target",1],["Fouls",3],["Possession %",6]].map(([l,i])=>`<tr><td>${l}</td><td><b>${a[i]??"–"}</b></td><td><b>${b[i]??"–"}</b></td><td>${i===6?"":(a[i]??0)+(b[i]??0)}</td></tr>`).join("")}</tbody></table></div>`:`<div class="small">Live team stats load on this page while the match is on.</div>`}
   <div class="small" style="margin-top:6px">Updates every 30 seconds from ESPN while you're on the page. Final stats and grading follow after full time.</div></div>`}
function socLivePaint(){document.querySelectorAll("[data-sclive]").forEach(el=>{const f=socFx(el.dataset.sclive);if(f)el.innerHTML=socLiveChip(f)});
  const box=document.getElementById("scLiveBox");if(box){const f=socFx(box.dataset.id);if(f)box.innerHTML=socLiveStats(f)}}
setInterval(()=>{if(!document.hidden)socLiveTick()},30000);window.addEventListener("load",()=>setTimeout(socLiveTick,3000));

/* ---------- 🧤 goalkeepers ---------- */
function socGKSeason(aid){const P=SOC_P[aid];if(!P)return null;const RI=socResIdx();let n=0,sv=0,ga=0,cs=0,min=0;const G=[];
  for(const g of P[3]){if(socLineOf(g[12]||P[2])!==0||g[2]<45)continue;const r=RI[g[0]];if(!r)continue;const home=r[3]===P[1]||(r[4]!==P[1]&&true),c=r[3]===P[1]?r[6]:r[4]===P[1]?r[5]:null;if(c==null)continue;
    n++;sv+=g[11]||0;ga+=c;cs+=c===0;min+=g[2];G.push([g[0],g[11]||0,c])}
  return n?{n,sv,ga,cs,min,G,pct:sv+ga?sv/(sv+ga):null}:null}
function socKeeperOf(tid){const L=Object.entries(SOC_P||{}).filter(([,P])=>P[1]===tid&&P[3].some(g=>socLineOf(g[12]||P[2])===0&&g[1]));if(!L.length)return null;
  const last=([,P])=>Math.max(...P[3].filter(g=>socLineOf(g[12]||P[2])===0&&g[1]).map(g=>Date.parse((socResIdx()[g[0]]||[0,"2000-01-01"])[1])));return L.sort((a,b)=>last(b)-last(a))[0][0]}
function socGKCard(f){if(!window.SOC_P_OK)return `<div class="card xacard" id="scGK"><h2>🧤 Goalkeepers</h2><div class="small">Loading…</div></div>`;
  const side=(tid,opp)=>{const aid=socKeeperOf(tid);if(!aid)return `<div class="small">No keeper data.</div>`;const K=socGKSeason(aid),A=socTN(f.c,opp),B=socTN(f.c,tid),lgS=socLgAvg(f.c,4);
    let es=null;if(A&&B&&lgS&&A[4]!=null&&B[6]!=null){const sot=A[4]*B[6]/lgS,P=f.proj,eg=P?(tid===f.h?P.la:P.lh):null;es=eg!=null?Math.max(0,sot-eg):null}
    return `<div><h3 style="margin:0 0 6px">${socBadge(tid)} <a href="#soccer-player-${aid}">${socE(SOC_P[aid][0])}</a></h3>${K?`<div style="font-size:13.5px"><b>${(K.sv/K.n).toFixed(1)}</b> saves a match · <b>${K.pct!=null?Math.round(K.pct*100)+"%":"–"}</b> save % · <b>${K.cs}/${K.n}</b> clean sheets · <b>${(K.ga/K.n).toFixed(2)}</b> conceded</div>
      <div class="small" style="margin-top:4px">Saves, last ${Math.min(10,K.G.length)}:</div>${socChips(K.G.slice(-10).map(x=>x[1]),2.5,"saves")}`:`<div class="small">No full matches in goal yet.</div>`}
      ${es!=null?`<div style="margin-top:6px">Expected saves vs ${socE(socTm(opp))}: <b>${es.toFixed(1)}</b> · 2+ ${socPct(socPover(es,1.5))} · 3+ ${socPct(socPover(es,2.5))} · 4+ ${socPct(socPover(es,3.5))}</div>`:""}</div>`};
  return `<div class="card xacard" id="scGK"><h2>🧤 Goalkeepers</h2><div class="xasub">Most recent starter in goal · this season, all competitions · expected saves = shots on target we expect him to face minus the goals we expect him to let in</div><div class="sc2">${side(f.h,f.a)}${side(f.a,f.h)}</div>
   <div class="small" style="margin-top:6px">US books in our feed don't post goalkeeper saves for soccer yet.</div></div>`}

function socLuOf(f){const L=(typeof SOCL!=="undefined"&&SOCL.lu[f.id])||f.lu;return L||null}
function socLuNames(f){const L=socLuOf(f);if(!L)return [];return Object.values(L).flatMap(v=>Array.isArray(v)?v:(v.xi||[]).map(x=>x[0]))}
/* 📋 predicted XI: the goalkeeper who started most recently + the 10 outfield players with the most starts in the team's
   last 5 matches (recent starts count more), leaving out anyone sent off last match or missing the last 2 */
function socPredXI(f,tid){if(!window.SOC_P_OK)return null;const Ls=socTeamRes(tid).slice(-5);if(Ls.length<3)return null;const ids=Ls.map(r=>r[0]),out=new Set(((f.miss||{})[tid]||[]).map(x=>x[0]));
  const C=[];for(const [aid,P] of Object.entries(SOC_P)){if(P[1]!==tid||out.has(P[0]))continue;let sc=0,gk=0,last=0,pos=P[2];P[3].forEach(g=>{const i=ids.indexOf(g[0]);if(i<0||!g[1])return;sc+=1+i*.35;last=Math.max(last,i);pos=g[12]||pos;if(socLineOf(g[12]||P[2])===0)gk++});if(sc>0)C.push({aid,nm:P[0],pos,sc,gk,last})}
  const gk=C.filter(x=>x.gk).sort((a,b)=>b.last-a.last||b.sc-a.sc)[0],of=C.filter(x=>!x.gk).sort((a,b)=>b.sc-a.sc).slice(0,10);if(!gk||of.length<10)return null;return [gk,...of]}
function socXICard(f){const L=socLuOf(f),conf=!!L;const side=tid=>{let X;if(conf&&L[tid]){const v=L[tid];X=Array.isArray(v)?v.map(n=>({nm:n,pos:""})):v.xi.map(([nm,pos,aid])=>({nm,pos,aid}))}else X=socPredXI(f,tid);
    if(!X)return `<div><h3 style="margin:0 0 6px">${socBadge(tid)} ${socE(socTm(tid))}</h3><div class="small">Not enough recent matches to predict.</div></div>`;
    const W=X.map(x=>Object.assign({},x,{g:null}));const fm=conf&&L[tid]&&L[tid].fm||(conf?"":socFmOf(null,tid));const sub=conf&&L[tid]&&!Array.isArray(L[tid])?L[tid].sub||[]:[];
    return `<div><h3 style="margin:0 0 6px">${socBadge(tid)} ${socTL(tid,socE(socTm(tid)))}${fm?` <span class="small">${socE(fm)}${conf?"":" (last match)"}</span>`:""}</h3>${socPitch(W,"x"+tid,fm)}${sub.length?`<div class="scbench"><b>Bench</b>${sub.map(n=>`<span class="scpl sub"><i>${socE(n)}</i></span>`).join("")}</div>`:""}</div>`};
  const t=Date.parse(f.t),mins=Math.round((t-Date.now())/60000);
  return `<div class="card" id="scXI"><h2>${conf?"📋 Confirmed lineups":"🔮 Predicted lineups"}</h2><div class="xasub">${conf?`Official starting XIs${SOCL.lu[f.id]?" · checked "+(typeof freshAge!=="undefined"?freshAge(new Date(SOCL.luAt[f.id]).toISOString()):"just now"):""} — kept up to date until kickoff in case of warm-up changes`:`<b>Predicted, not official</b> — from each team's starts in its last 5 matches, minus players sent off or missing lately. The confirmed XIs replace this about an hour before kickoff${mins>0&&mins<180?` (in about ${mins>60?Math.round(mins/60)+" h":mins+" min"})`:""}.`}</div>
   <div class="sc2">${side(f.h)}${side(f.a)}</div></div>`}

/* 🔮 our prediction: most likely score + the side of each main market we favour (from the same estimates) */
/* predicted score: the single most likely exact score is almost always a 1-goal game (1-0, 2-1…) even when lots of goals
   are expected, and it often contradicted our own goals / both-teams-score picks. So the score shown is the most likely
   exact score that agrees with all three of our picks — result, over/under 2.5 and both teams to score
   (same Poisson + Dixon-Coles model as every other number on the page). */
function socPred(f){const P=f.proj;if(!P)return null;const pz=(k,l)=>Math.exp(-l)*Math.pow(l,k)/[1,1,2,6,24,120,720,5040,40320][k],rho=P.rho||0;
  const tau=(i,j)=>i===0&&j===0?1-P.lh*P.la*rho:i===0&&j===1?1+P.lh*rho:i===1&&j===0?1+P.la*rho:i===1&&j===1?1-rho:1;let top=[],tot=0;
  for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){const q=Math.max(0,pz(i,P.lh)*pz(j,P.la)*tau(i,j));top.push([i,j,q]);tot+=q}top.forEach(t=>t[2]/=tot);top.sort((a,b)=>b[2]-a[2]);
  const r=P.p.indexOf(Math.max(...P.p)),res=r===0?socTm(f.h)+" win":r===2?socTm(f.a)+" win":"Draw";
  const ou=P.o["2.5"]>=.5?["Over 2.5",P.o["2.5"]]:["Under 2.5",1-P.o["2.5"]],bt=P.btts>=.5?["Yes",P.btts]:["No",1-P.btts];
  const okR=t=>r===0?t[0]>t[1]:r===2?t[0]<t[1]:t[0]===t[1],okO=t=>(ou[0]==="Over 2.5")===(t[0]+t[1]>2.5),okB=t=>(bt[0]==="Yes")===(t[0]>0&&t[1]>0);
  const best=top.find(t=>okR(t)&&okO(t)&&okB(t))||top.find(t=>okR(t)&&okO(t))||top.find(okR)||top[0];
  return {score:best,top:top.slice(0,3),res,rp:P.p[r],ou,btts:bt,cor:P.cor&&P.cor.t,card:P.card&&P.card.t}}
function socPredShort(f){const x=socPred(f);return x?`<div class="small scpred1">🔮 Prediction: <b>${socE(socTm(f.h))} ${x.score[0]}–${x.score[1]} ${socE(socTm(f.a))}</b> · ${socE(x.res)} · xG ${f.proj.lh.toFixed(1)}–${f.proj.la.toFixed(1)}</div>`:""}
function socPredCard(f){const x=socPred(f);if(!x)return "";const c=(lab,v,p)=>`<div class="scpc"><span>${lab}</span><b>${v}</b>${p!=null?`<em>${socPct(p)}</em>`:""}</div>`;
  return `<div class="card scpredc"><h2>🔮 Our prediction</h2><div class="scpscore">${socBadge(f.h)} <b>${x.score[0]} – ${x.score[1]}</b> ${socBadge(f.a)}<span class="small">expected goals <span style="font-weight:700;color:var(--text)">${f.proj.lh.toFixed(1)} – ${f.proj.la.toFixed(1)}</span> · predicted score — fits our result, goals and both-teams-score picks (this exact score: ${socPct(x.score[2])}) · single most common scores: ${x.top.map(t=>`${t[0]}-${t[1]}`).join(", ")}</span></div>
   <div class="scpcs">${c("Result",socE(x.res),x.rp)}${c("Goals",x.ou[0],x.ou[1])}${c("Both score",x.btts[0],x.btts[1])}${x.cor!=null?c("Corners","~"+x.cor.toFixed(1)):""}${x.card!=null?c("Cards","~"+x.card.toFixed(1)):""}</div>
   <div class="small" style="margin-top:6px">Our numbers, not a bet tip — the verdict above says whether any price is worth it.</div></div>`}

/* ⚡ newer soccer odds from data/live_odds.json (refreshed every ~30 min by the odds job) — applied on top of the
   odds baked into soccer_data.js whenever they're newer, so prices stay current between site rebuilds */
function socLoApply(d){const S=d&&d.soc;if(!S||!S.events)return 0;if(!window.SOC_OK){SOCL.loPend=d;return 0}let n=0;
  const nameIdx={};if(window.SOC_P_OK)for(const [aid,P] of Object.entries(SOC_P))nameIdx[P[1]+"|"+loNorm(P[0])]=aid;
  for(const e of S.events){if(!e.at)continue;const f=(SOC_FX||[]).find(f=>f.h===e.hid&&f.a===e.aid&&Math.abs(Date.parse(f.t)-Date.parse(e.start))<6*3600e3);if(!f)continue;
    if(f.odds&&f.odds.at&&Date.parse(f.odds.at)>=Date.parse(e.at))continue;
    f.pid=e.pid;f.odds={};for(const k of ["ml","tot","main_tot","btts","ah","cor","main_cor","ttot","extra","open","at","h1"])if(e[k]!=null)f.odds[k]=e[k];if(e.ref&&!f.ref)f.ref=e.ref;
    const old={};for(const r of SOC_PROPS)if(r[5]===f.id)old[loNorm(r[0])]=r[7];
    SOC_PROPS=SOC_PROPS.filter(r=>r[5]!==f.id);
    for(const r of S.props||[])if(r[5]===e.pid){const k=loNorm(r[0]),aid=old[k]||nameIdx[f.h+"|"+k]||nameIdx[f.a+"|"+k]||null;SOC_PROPS.push([r[0],r[1],r[2],r[3],r[4],f.id,r[6],aid])}
    n++}
  if(n)SOC_ODDS_AT=S.at;return n}

/* 📈 line moves: opening price (first seen today by the odds job) vs now */
function socMoves(f){const O=f.odds||{},op=O.open||{},M=[];const pp=(a,b)=>a!=null&&b!=null?Math.round((socImp(b)-socImp(a))*100):0;
  if(op.ml&&O.ml){[["h",0,socTm(f.h)],["d",1,"Draw"],["a",2,socTm(f.a)]].forEach(([k,i,l])=>{const d=pp(op.ml[i],O.ml[k]);if(Math.abs(d)>=3)M.push({t:`${l}`,from:socO(op.ml[i]),to:socO(O.ml[k]),d})})}
  if(op.tot&&O.tot){const [ln,o]=op.tot,now=O.tot[String(ln)];if(now&&now[0]!=null){const d=pp(o,now[0]);if(Math.abs(d)>=3)M.push({t:`Over ${ln} goals`,from:socO(o),to:socO(now[0]),d})}
    if(O.main_tot&&+O.main_tot!==+ln)M.push({t:"Goals line",from:String(ln),to:O.main_tot,d:(+O.main_tot>+ln?5:-5),line:1})}
  if(op.cor&&O.cor){const [ln,o]=op.cor,now=O.cor[String(ln)];if(now&&now[0]!=null){const d=pp(o,now[0]);if(Math.abs(d)>=3)M.push({t:`Over ${ln} corners`,from:socO(o),to:socO(now[0]),d})}}
  return M.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d))}
function socMoveChip(f){const M=socMoves(f);if(!M.length)return "";const m=M[0];return `<span class="lmv ${m.d>0?"up":"dn"}" title="Since the first price we saw today">📈 ${socE(m.t)} ${m.from}→${m.to}</span>`}
function socMovesCard(){const L=[];for(const f of (SOC_FX||[]).filter(f=>!socStarted(f)&&socLgOk(f.c)))for(const m of socMoves(f))L.push({f,m});if(!L.length)return "";
  L.sort((a,b)=>Math.abs(b.m.d)-Math.abs(a.m.d));
  return `<details class="card scfold"><summary><b>📈 Biggest line moves</b> <span class="small">${L.length} since this morning's prices</span></summary>${L.slice(0,8).map(({f,m})=>`<a class="scfr scfrl" href="#soccer-game-${f.id}">${socLgChip(f.c)}<span>${socE(socTm(f.h))} v ${socE(socTm(f.a))}</span><span class="small">${socE(m.t)}: ${m.from} → <b class="${m.d>0?"up":"dn"}">${m.to}</b>${m.line?"":` (${m.d>0?"+":""}${m.d} pts)`}</span></a>`).join("")}
   <div class="small" style="margin-top:6px">Money coming in usually moves a price — a shorter price means the books now think it's more likely.</div></details>`}
/* 6) fold the less-used cards */
function socFold(title,html,open){return html?`<details class="card scfold"${open?" open":""}><summary><b>${title}</b> <span class="small">tap to ${open?"close":"open"}</span></summary><div class="scfoldb">${html.replace(/^<div class="card[^"]*"[^>]*>/,"<div>")}</div></details>`:""}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-scf],[data-scfr]");if(!b)return;const h=decodeURIComponent((location.hash||"").slice(1));if(!h.startsWith("soccer-player-"))return;
  e.preventDefault();e.stopPropagation();const aid=h.slice(14);if(b.dataset.scfr)SC.pf=null;else{const [k,v]=b.dataset.scf.split("|");socPF(aid)[k]=v}SC.pfOpen=!b.dataset.scfr||SC.pfOpen;const y=scrollY;soccerRoute(h);scrollTo(0,y)},true);
document.addEventListener("toggle",e=>{if(e.target.closest&&e.target.closest(".scfc"))SC.pfOpen=e.target.open},true);
