/* Over/Under view for prop charts + hit counts (shared by NBA and NFL; remembered on this device) */
let PXSIDE=(typeof LS!=="undefined"&&LS.get("pxside","o"))==="u"?"u":"o";
function pxHit(v,l){return PXSIDE==="u"?v<l:v>l}
function pxSW(){return PXSIDE==="u"?"under":"over"}
function pxSideTg(){return `<div class="sidetg noglo"><span>Show hits for</span><button data-side="o" class="${PXSIDE==="o"?"on o":""}">Over</button><button data-side="u" class="${PXSIDE==="u"?"on u":""}">Under</button></div>`}
if(typeof document!=="undefined"&&document.addEventListener)document.addEventListener("click",e=>{const r=e.target.closest&&e.target.closest("[data-frst]");if(!r)return;e.preventDefault();e.stopPropagation();
  const f=r.closest("[data-pxf]");
  if(f&&typeof PXS!=="undefined"){const key=f.dataset.pxf.replace(/&amp;/g,"&").replace(/&quot;/g,'"'),S0=PXS[key]||{},D=typeof PXG!=="undefined"&&PXG[key];PXS[key]={lo:-15,hi:15,mlo:0,mhi:D&&D.MN?D.MN.max:100,set:S0.set,open:S0.open}}
  else if(r.closest(".nbmin")){const box=r.closest(".nbmin"),nm=box.dataset.nm?nbaUnesc(box.dataset.nm):null;NB.gf=Object.assign(NB.gf,{lo:-15,hi:15,tlo:195,thi:255,ilo:95,ihi:135,flo:0,fhi:35,plo:0,phi:20,ven:"",rest:"",role:"",opp:"",pace:""});NB.mlo=0;NB.mhi=48;if(nm)delete NB.tmf[nm];NB._best=null;try{LS.set("nbaGF",NB.gf);LS.set("nbaMin",[0,48])}catch(x){}}
  else return;const y=window.scrollY;if(typeof route!=="undefined")route();window.scrollTo(0,y)},true);
if(typeof document!=="undefined"&&document.addEventListener)document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-side]");if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.side===PXSIDE)return;PXSIDE=b.dataset.side;try{LS.set("pxside",PXSIDE)}catch(x){}const y=window.scrollY;if(typeof route!=="undefined")route();window.scrollTo(0,y)},true);
/* ESPN finals + box scores fill in games hoopR hasn't posted yet (nba_espn.js, refreshed every 2 h) */
(function(){if(typeof NBA_ESPN==="undefined")return;const have=new Set(NBA_RES.map(r=>r[0]));NBA_ESPN.added=new Set();
  for(const g of NBA_ESPN.games||[]){if(have.has(g[0]))continue;NBA_RES.push(g.slice(0,6));NBA_ESPN.added.add(g[0])}
  NBA_RES.sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:a[0]-b[0]);
  for(const [nm,tm,pos,row] of NBA_ESPN.logs||[]){if(!NBA_ESPN.added.has(row[0]))continue;const p=NBA_LOGS[nm]||(NBA_LOGS[nm]={tm,pos,id:0,g:[]});
    if(p.g.some(x=>x[0]===row[0]))continue;p.g.push(row);p.g.sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:0)}
  NBA_ESPN.ls={};for(const g of NBA_ESPN.games||[])NBA_ESPN.ls[g[0]]=[g[6]||[],g[7]||[]];})();
/* Records + standings always follow NBA_RES (hoopR + ESPN finals), so every final counts within ~2 hours */
(function(){if(typeof NBA_TEAM==="undefined")return;const S={};
  for(const [id,d,a,h,as,hs] of NBA_RES)for(const [t,me,op,ha] of [[a,as,hs,"A"],[h,hs,as,"H"]]){const x=S[t]||(S[t]={m:[],ha:[],pf:0,pa:0});x.m.push(me-op);x.ha.push(ha);x.pf+=me;x.pa+=op}
  for(const [t,x] of Object.entries(S)){const T=NBA_TEAM[t];if(!T)continue;const g=x.m.length,l5=x.m.slice(-5),hm=x.m.filter((_,i)=>x.ha[i]==="H"),aw=x.m.filter((_,i)=>x.ha[i]==="A");
    Object.assign(T,{w:x.m.filter(v=>v>0).length,l:x.m.filter(v=>v<0).length,g,ppg:+(x.pf/g).toFixed(1),opp:+(x.pa/g).toFixed(1),mar:+((x.pf-x.pa)/g).toFixed(1),
      l5:l5.map(v=>v>0?"W":"L").join(""),l5m:+(l5.reduce((a,b)=>a+b,0)/l5.length).toFixed(1),
      hm:hm.filter(v=>v>0).length+"-"+hm.filter(v=>v<0).length,aw:aw.filter(v=>v>0).length+"-"+aw.filter(v=>v<0).length})}
  const rk=(k,desc)=>Object.keys(NBA_TEAM).sort((x,y)=>desc?NBA_TEAM[y][k]-NBA_TEAM[x][k]:NBA_TEAM[x][k]-NBA_TEAM[y][k]).forEach((t,i)=>NBA_TEAM[t][k+"R"]=i+1);
  rk("ppg",true);rk("opp",false);rk("mar",true);
  window.NBA_THRU=NBA_RES.length?NBA_RES[NBA_RES.length-1][1]:NBA_ASOF;})();
function nbaFinalHtml(g){const r=NBA_RES.find(z=>z[0]===g.id||(z[1]===NBA_SLATE_DATE&&z[2]===g.a&&z[3]===g.h));if(!r)return "";
  const L=nbaL(g),as=r[4],hs=r[5],W=as>hs?g.a:g.h;let sp="",tot="";
  if(L&&L.sp!=null){const m=hs-as+L.sp,fav=L.sp<=0?g.h:g.a;sp=m===0?"Spread: push":`Spread: <b>${nbaShort(m>0?g.h:g.a)}</b> covered (${nbaShort(fav)} ${-Math.abs(L.sp)})`}
  if(L&&L.tot!=null){const t=as+hs;tot=t===L.tot?"Total: push":`Total: <b>${t>L.tot?"Over":"Under"}</b> ${L.tot} (${t})`}
  return `<div class="nbfin"><div class="nbfs"><span class="rsfin">FINAL</span><span class="${as>hs?"w":""}">${nbaBadge(g.a)} <b>${as}</b></span><span class="small">–</span><span class="${hs>as?"w":""}"><b>${hs}</b> ${nbaBadge(g.h)}</span><span class="rsm" style="--cw:${nbaCol(W)}">${nbaShort(W)} by ${Math.abs(as-hs)}</span></div>${sp||tot?`<div class="small">${[sp,tot].filter(Boolean).join(" · ")}</div>`:""}</div>`}

/* ---------- NBA section (separate from NFL; all globals prefixed nba / NB) ---------- */
const NB={date:null,sel:null,team:"tonight",q:"",sort:"pts",ij:"tonight"};
(()=>{const m=(typeof LS!=="undefined"&&LS.get("nbaMin"))||null;NB.mlo=m?m[0]:0;NB.mhi=m?m[1]:48;
  const f=(typeof LS!=="undefined"&&LS.get("nbaGF"))||null;NB.gf=Object.assign({lo:-15,hi:15,tlo:195,thi:255,ilo:95,ihi:135,flo:0,fhi:35,plo:0,phi:20,ven:"",rest:"",role:"",opp:"",pace:""},f&&f.length===4?{lo:f[0],hi:f[1],tlo:f[2],thi:f[3]}:(f&&typeof f==="object"&&!Array.isArray(f)?f:{}))})();
/* game filters for every prop chart: minutes, his team's spread (− = favored) and the game total — closing lines from NBA_SPR */
function nbaGameLine(x){const S=typeof NBA_SPR!=="undefined"?NBA_SPR:null,s=S&&S[x[0]];if(!s)return null;return {sp:x[3]==="H"?s[3]:-s[3],tot:s[4]}}
function nbaSpOn(){return NB.gf.lo>-15||NB.gf.hi<15}
function nbaTtOn(){return NB.gf.tlo>195||NB.gf.thi<255}
let NBA_RESTM=null;
function nbaRestOf(x){if(!NBA_RESTM){NBA_RESTM={};const byT={};for(const r of NBA_RES){(byT[r[2]]=byT[r[2]]||[]).push([r[1],r[0]]);(byT[r[3]]=byT[r[3]]||[]).push([r[1],r[0]])}
    for(const t in byT){const a=byT[t].sort((p,q)=>p[0]<q[0]?-1:1);a.forEach(([d,id],i)=>{NBA_RESTM[id+"|"+t]=i?Math.round((new Date(d)-new Date(a[i-1][0]))/864e5)-1:null})}}
  const r=NBA_RES.find(z=>z[0]===x[0]);if(!r)return null;const t=x[3]==="H"?r[3]:r[2];return NBA_RESTM[x[0]+"|"+t]}
function nbaSitOn(){return !!(NB.gf.ven||NB.gf.rest||NB.gf.role||NB.gf.opp||NB.gf.pace)}
function nbaInR(x){if(x[4]<NB.mlo||(NB.mhi<48&&x[4]>NB.mhi))return false;
  const f0=NB.gf;if(f0.ven&&x[3]!==f0.ven)return false;if(f0.role&&((f0.role==="st")!==(x[9]===1||x[9]===true)))return false;
  if(f0.rest){const rd=nbaRestOf(x);if(rd==null)return false;if(f0.rest==="b2b"?rd!==0:f0.rest==="r1"?rd!==1:f0.rest==="r2"?rd<2:rd<1)return false}
  if(f0.opp&&nbaOppTier(x[2],"opp")!==f0.opp)return false;if(f0.pace&&nbaOppTier(x[2],"pace")!==f0.pace)return false;
  {const f=NB.gf;if((f.flo>0&&(x[11]||0)<f.flo)||(f.fhi<35&&(x[11]||0)>f.fhi))return false;if(((f.plo||0)>0&&(x[15]||0)<f.plo)||((f.phi??20)<20&&(x[15]||0)>f.phi))return false;
   if(f.ilo>95||f.ihi<135){const L=nbaGameLine(x);if(!L||L.tot==null)return false;const it=L.tot/2-L.sp/2;if((f.ilo>95&&it<f.ilo)||(f.ihi<135&&it>f.ihi))return false}}
  if(nbaSpOn()||nbaTtOn()){const L=nbaGameLine(x);if(!L)return false;const f=NB.gf;
    if(nbaSpOn()&&((f.lo>-15&&L.sp<f.lo)||(f.hi<15&&L.sp>f.hi)))return false;
    if(nbaTtOn()&&(L.tot==null||(f.tlo>195&&L.tot<f.tlo)||(f.thi<255&&L.tot>f.thi)))return false}
  return true}
function nbaMinOn(){const f=NB.gf;return NB.mlo>0||NB.mhi<48||nbaSpOn()||nbaTtOn()||nbaSitOn()||f.flo>0||f.fhi<35||(f.plo||0)>0||(f.phi??20)<20||f.ilo>95||f.ihi<135}
function nbaFiltTxt(){const a=[];if(NB.mlo>0||NB.mhi<48)a.push(`${NB.mlo}–${NB.mhi} minutes`);const f=NB.gf;if(nbaSpOn())a.push(pxSpRange(f.lo,f.hi));if(nbaTtOn())a.push(`total ${f.tlo}–${f.thi}`);for(const g in NBA_SIT)if(f[g]&&NBA_SIT[g][1][f[g]])a.push(NBA_SIT[g][1][f[g]]);return a.join(" · ")}
const NBA_SIT={ven:["Venue",{H:"Home",A:"Away"}],rest:["Rest",{b2b:"Back-to-back",r1:"1 day off",r2:"2+ days off"}],role:["Role",{st:"Starter",bn:"Bench"}],
  opp:["Opp defense",{top:"Top 10",mid:"Middle",bot:"Bottom 10"}],pace:["Opp pace",{fast:"Fast",mid:"Middle",slow:"Slow"}]};
/* opponent tiers from this season's ranks (defensive rating; possessions a game) */
function nbaOppTier(t,k){const T=typeof NBA_TADV!=="undefined"&&NBA_TADV[t];if(!T)return null;const n=Object.keys(NBA_TADV).length,r=k==="opp"?(T.dR&&T.dR.rtg):T.paceR;if(r==null)return null;
  return k==="opp"?(r<=10?"top":r>n-10?"bot":"mid"):(r<=10?"fast":r>n-10?"slow":"mid")}
function nbaMinUI(id,tn){
  const f=NB.gf,spPre=[[-15,-7,"Fav 7+"],[-15,-.5,"Favored"],[.5,15,"Underdog"],[7,15,"Dog 7+"]].concat(tn&&tn.sp!=null?[[Math.max(-15,tn.sp-3),Math.min(15,tn.sp+3),"Near tonight"]]:[]).concat([[-15,15,"Any"]]);
  const ttPre=[[195,255,"Any"]].concat(tn&&tn.tot!=null?[[Math.max(195,tn.tot-5),Math.min(255,tn.tot+5),`Near tonight (${tn.tot})`]]:[]).concat([[195,225,"Low (225 or less)"],[225,255,"High (225+)"]]);
  const mnPre=[[0,48,"Any"],[10,48,"10+"],[20,48,"20+"],[25,48,"25+"],[30,48,"30+"]].concat(tn&&tn.min!=null?[[Math.max(0,tn.min-4),Math.min(48,tn.min+4),`His usual (${tn.min}±4)`]]:[]);
  return `<div class="card nbmin pxf" id="${id}"${tn&&tn.nm?` data-nm="${nbaEsc(tn.nm)}"`:""}${tn&&tn.ha?` data-tn='${JSON.stringify({ven:tn.ha,rest:tn.rest,role:tn.role,opp:tn.opp,pace:tn.pace})}'`:""}><details class="pxfd"${NB.fOpen?" open":""}><summary class="pxfs"><span class="pxft">🎚 <b>Filters</b></span><span class="pxfc noglo" data-fsum></span><span class="pxchev">›</span></summary><div class="pxrw"><button type="button" class="pxrst" data-frst>↺ Reset all filters</button></div>
   ${tn&&tn.sp!=null?`<div style="margin:8px 0 2px"><span class="pxtn noglo">Tonight: ${pxSpTxt(tn.sp)}${tn.tot!=null?" · O/U "+tn.tot:""}</span></div>`:""}
   <div class="pxfr"><div class="pxfl"><span>Situation</span>${tn&&tn.ha?`<button class="likeT" data-like="1">🎯 Like tonight</button>`:""}</div>
    ${Object.entries(NBA_SIT).map(([g,[lab,o]])=>{const lk=tn&&tn.oppT&&tn[g]&&(g==="opp"||g==="pace")?(()=>{const T=NBA_TADV[tn.oppT]||{},r=g==="opp"?(T.dR&&T.dR.rtg):T.paceR;return `<button data-sit="${g}|${tn[g]}" class="pxlk${(f[g]||"")===tn[g]?" on":""}">🎯 Like ${nbaEsc(tn.oppT)} <small>${o[tn[g]]}${r?" · "+nbaOrd(r):""}</small></button>`})():"";
     return `<div class="sitr"><span>${lab}</span><div class="pxpre">${[["","Any"],...Object.entries(o)].map(([v,l],i)=>`${i===1?lk:""}<button data-sit="${g}|${v}" class="${(f[g]||"")===v?"on":""}">${l}${tn&&tn[g]===v&&v?" •":""}</button>`).join("")}</div></div>`}).join("")}</div>
   ${pxDual("sp","Team's spread",-15,15,.5,f.lo,f.hi,["Favored","PK","Underdog"],spPre)}
   ${pxDual("tt","Game total (O/U)",195,255,.5,f.tlo,f.thi,["195","225","255"],ttPre)}
   ${pxDual("it","Team total (implied points)",95,135,.5,f.ilo,f.ihi,["95","115","135"],[[95,135,"Any"]].concat(tn&&tn.it!=null?[[Math.max(95,tn.it-4),Math.min(135,tn.it+4),`Near tonight (${tn.it})`]]:[]).concat([[95,112,"112 or less"],[118,135,"118+"]]))}
   ${pxDual("mn","Minutes played",0,48,1,NB.mlo,NB.mhi,["0","24","48"],mnPre)}
   ${pxDual("fa","Field-goal attempts",0,35,1,f.flo,f.fhi,["0","17","35"],[[0,35,"Any"],[10,35,"10+"],[15,35,"15+"],[20,35,"20+"]].concat(tn&&tn.fga!=null?[[Math.max(0,tn.fga-3),Math.min(35,tn.fga+3),`His usual (${tn.fga}±3)`]]:[]))}
   ${pxDual("pa","3-point attempts",0,20,1,f.plo??0,f.phi??20,["0","10","20"],[[0,20,"Any"],[3,20,"3+"],[5,20,"5+"],[8,20,"8+"]].concat(tn&&tn.tpa!=null?[[Math.max(0,tn.tpa-2),Math.min(20,tn.tpa+2),`His usual (${tn.tpa}±2)`]]:[]))}
   ${tn&&tn.nm?`<div class="pxfr"><div class="pxfl"><span>Teammates</span><span class="small">pick as many as you want</span></div>${nbaMateMulti(tn.nm)}</div>`:""}
   <div class="small">Applies to every chart and hit rate (L5, L10, Season, H2H). Spreads and totals are DraftKings closing lines; older games have none, so they drop out when those filters are on.</div></details></div>`;
}
function nbaWireMin(root,redraw){
  const box=root.querySelector(".nbmin");if(!box)return;
  const st={sp:[NB.gf.lo,NB.gf.hi],tt:[NB.gf.tlo,NB.gf.thi],it:[NB.gf.ilo,NB.gf.ihi],mn:[NB.mlo,NB.mhi],fa:[NB.gf.flo,NB.gf.fhi],pa:[NB.gf.plo??0,NB.gf.phi??20]},R={sp:[-15,15],tt:[195,255],it:[95,135],mn:[0,48],fa:[0,35],pa:[0,20]};
  const txt={sp:pxSpRange,tt:(x,y)=>x<=195&&y>=255?"Any total":x<=195?`${y} or less`:y>=255?`${x} or more`:`${x} to ${y}`,mn:(x,y)=>x<=0&&y>=48?"Any minutes":`${x} to ${y} min`,it:(x,y)=>x<=95&&y>=135?"Any team total":x<=95?`Team total ≤${y}`:y>=135?`Team total ${x}+`:`Team total ${x}–${y}`,fa:(x,y)=>x<=0&&y>=35?"Any FGA":y>=35?`${x}+ FGA`:`${x}–${y} FGA`,pa:(x,y)=>x<=0&&y>=20?"Any 3PA":y>=20?`${x}+ 3PA`:`${x}–${y} 3PA`};
  const paint=()=>{for(const nm in st){const [a,b]=st[nm],x=Math.min(a,b),y=Math.max(a,b),[mn,mx]=R[nm];if(!box.querySelector(`[data-out="${nm}"]`))continue;
    box.querySelector(`[data-out="${nm}"]`).textContent=txt[nm](x,y);const fl=box.querySelector(`[data-fill="${nm}"]`);fl.style.left=(x-mn)/(mx-mn)*100+"%";fl.style.right=(100-(y-mn)/(mx-mn)*100)+"%";
    box.querySelector(`[data-r="${nm}|lo"]`).value=a;box.querySelector(`[data-r="${nm}|hi"]`).value=b;
    box.querySelectorAll(`[data-pre^="${nm}|"]`).forEach(p=>{const [,pa,pb]=p.dataset.pre.split("|");p.classList.toggle("on",+pa===x&&+pb===y)})}
    const on=[];for(const nm in st){const x=Math.min(...st[nm]),y=Math.max(...st[nm]);if(x>R[nm][0]||y<R[nm][1])on.push(`<span class="fchip" data-fclr="${nm}">${txt[nm](x,y)} ✕</span>`)}
    for(const g in NBA_SIT)if(NB.gf[g]&&NBA_SIT[g][1][NB.gf[g]])on.push(`<span class="fchip" data-fclr="sit|${g}">${g==="opp"||g==="pace"?NBA_SIT[g][0]+": ":""}${NBA_SIT[g][1][NB.gf[g]]} ✕</span>`);
    const mnm=box.dataset.nm?nbaUnesc(box.dataset.nm):null,mv=mnm&&NB.tmf[mnm];if(mv&&typeof mv==="object")for(const [who,w] of Object.entries(mv))on.push(`<span class="fchip" data-fclr="mate|${nbaEsc(who)}">${w==="w"?"With":"Without"} ${nbaEsc(pxLast(who))} ✕</span>`);
    const fs=box.querySelector("[data-fsum]");if(fs)fs.innerHTML=on.length?on.join("")+`<span class="fchip frst" data-frst>↺ Reset</span>`:`<span class="fany">No filters — all games${mnm?" · all teammates":""}</span>`;
    box.querySelectorAll("[data-fclr]").forEach(c=>c.onclick=e=>{e.preventDefault();e.stopPropagation();if(c.dataset.fclr.startsWith("mate|")){const who=nbaUnesc(c.dataset.fclr.slice(5));if(NB.tmf[mnm]&&typeof NB.tmf[mnm]==="object"){delete NB.tmf[mnm][who];if(!Object.keys(NB.tmf[mnm]).length)delete NB.tmf[mnm]}apply();return}if(c.dataset.fclr.startsWith("sit|")){NB.gf[c.dataset.fclr.slice(4)]="";apply();return}st[c.dataset.fclr]=[...R[c.dataset.fclr]];paint();apply()})};
  const dd=box.querySelector("details");if(dd)dd.ontoggle=()=>{NB.fOpen=dd.open};
  const apply=()=>{const o=(nm)=>[Math.min(...st[nm]),Math.max(...st[nm])];[NB.gf.lo,NB.gf.hi]=o("sp");[NB.gf.tlo,NB.gf.thi]=o("tt");[NB.mlo,NB.mhi]=o("mn");[NB.gf.ilo,NB.gf.ihi]=o("it");[NB.gf.flo,NB.gf.fhi]=o("fa");[NB.gf.plo,NB.gf.phi]=o("pa");
    try{LS.set("nbaMin",[NB.mlo,NB.mhi]);LS.set("nbaGF",NB.gf)}catch(e){}NB._best=null;const y=window.scrollY;redraw();window.scrollTo(0,y)};
  box.querySelectorAll("input[data-r]").forEach(inp=>{const [nm,w]=inp.dataset.r.split("|");inp.oninput=()=>{st[nm][w==="lo"?0:1]=+inp.value;paint()};inp.onchange=apply});
  box.querySelectorAll("[data-pre]").forEach(b=>b.onclick=()=>{const [nm,a,c]=b.dataset.pre.split("|");st[nm]=[+a,+c];paint();apply()});
  box.querySelectorAll("[data-sit]").forEach(b=>b.onclick=()=>{const [g,v]=b.dataset.sit.split("|");NB.gf[g]=v;apply()});
  box.querySelectorAll("[data-mt]").forEach(b=>b.onclick=()=>{const nm=nbaUnesc(box.dataset.nm),[who,v]=nbaUnesc(b.dataset.mt).split("|");let m=NB.tmf[nm];if(!m||typeof m!=="object")m=NB.tmf[nm]={};if(v)m[who]=v;else delete m[who];if(!Object.keys(m).length)delete NB.tmf[nm];apply()});
  const lk=box.querySelector("[data-like]");if(lk)lk.onclick=()=>{const t=JSON.parse(box.dataset.tn||"{}");for(const g of ["ven","rest","role"])NB.gf[g]=t[g]||"";apply()};
  paint();
}
const NBA_MK={pts:[5,"Points","PTS"],reb:[6,"Rebounds","REB"],ast:[7,"Assists","AST"],"3pm":[8,"3-Pointers made","3PM"],"3pa":[15,"3-Pointers attempted","3PA"],
  pa:[[5,7],"Points + Assists","P+A"],pra:[[5,6,7],"Points + Rebounds + Assists","PRA"],pr:[[5,6],"Points + Rebounds","P+R"],ra:[[6,7],"Rebounds + Assists","R+A"],blk:[13,"Blocks","BLK"],stl:[12,"Steals","STL"],sb:[[12,13],"Steals + Blocks","S+B"]};
const NBA_HCA=2.0;
function nbaEsc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function nbaTm(a){return NBA_TEAMS[a]||a}
function nbaShort(a){const n=nbaTm(a);return n.replace(/^(Los Angeles|LA|Golden State|New York|New Orleans|Oklahoma City|San Antonio|Portland Trail)\s/,"").split(" ").slice(-1)[0]}
function nbaRec(a){const t=NBA_TEAM[a];return t?`${t.w}-${t.l}`:"0-0"}
function nbaSg(x){return x>0?"+"+x:x<0?"−"+Math.abs(x):"PK"}
function nbaVal(g,k){const i=NBA_MK[k][0];return Array.isArray(i)?i.reduce((s,j)=>s+g[j],0):(g[i]||0)}
function nbaAvg(p,k,n){const g=n?p.g.slice(-n):p.g;if(!g.length)return 0;return g.reduce((s,x)=>s+(k==="min"?x[4]:nbaVal(x,k)),0)/g.length}
function nbaF(x){return (Math.round(x*10)/10).toFixed(1)}
function nbaLink(n){return `<a href="#nba-player-${encodeURIComponent(n)}" style="color:inherit">${nbaEsc(n)}</a>`}
function nbaGameOf(tm){return NBA_SLATE.find(g=>g.a===tm||g.h===tm)}
function nbaInjOf(n){for(const t in NBA_INJ)for(const r of NBA_INJ[t])if(r[0]===n)return r;return null}
function nbaInjCol(s){return /out/i.test(s)?"#ff9a9d":/day/i.test(s)?"#f3c75a":"#b9bdc4"}
function nbaInjChip(r){return r?` <span class="tag" style="background:#2a1a1b;color:${nbaInjCol(r[2])}">${/day/i.test(r[2])?"GTD":nbaEsc(r[2])}</span>`:""}
function nbaOutNames(tm){return (NBA_INJ[tm]||[]).filter(r=>/out/i.test(r[2])).map(r=>r[0])}
const NBA_DF=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"short",day:"numeric"}),NBA_DFS=new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric"});
function nbaDay(d){return NBA_DF.format(new Date(d+"T12:00:00"))}
function nbaDayS(d){return NBA_DFS.format(new Date(d+"T12:00:00"))}

/* simple model: shrunk scoring margin + home court; total from points for/against */
function nbaModel(a,h){
  const A=NBA_TEAM[a],H=NBA_TEAM[h];if(!A||!H)return null;
  const r=t=>t.mar*t.g/(t.g+5);
  const m=r(H)-r(A)+NBA_HCA;
  const tot=(H.ppg+A.opp)/2+(A.ppg+H.opp)/2;
  const z=m/12,p=1/(1+Math.exp(-1.702*z));
  return {m:Math.round(m*2)/2,tot:Math.round(tot*2)/2,p,g:Math.min(A.g,H.g)};
}
/* regulars (24+ min a game) listed Out who have played this season — the model's numbers include them */
function nbaKeyOut(tm){return nbaOutNames(tm).filter(n=>{const p=NBA_LOGS[n];return p&&p.tm===tm&&nbaAvg(p,"min")>=24})}
function nbaLean(g){
  const L=nbaL(g),M=nbaModel(g.a,g.h);if(!L||!M)return [];
  if(nbaKeyOut(g.a).length||nbaKeyOut(g.h).length)return [];
  const out=[];const e=M.m+L.sp;
  if(Math.abs(e)>=3){const home=e>0;out.push({k:"sp",txt:`${home?g.h:g.a} ${nbaSg(home?L.sp:-L.sp)}`,edge:Math.abs(e),px:home?L.spx:null})}
  const te=M.tot-L.tot;
  if(Math.abs(te)>=4)out.push({k:"tot",txt:`${te>0?"Over":"Under"} ${L.tot}`,edge:Math.abs(te),px:te>0?L.ox:L.ux});
  return out;
}
function nbaLinesHtml(g,full){
  const L=nbaL(g);if(!L)return `<div class="small">Lines not posted yet.</div>`;
  const mv=(L.open.sp!==L.sp?` <span class="small">(opened ${g.h} ${nbaSg(L.open.sp)})</span>`:"");
  const mt=(L.open.tot!==L.tot?` <span class="small">(opened ${L.open.tot})</span>`:"");
  return `<div class="nbarow"><div><b>Spread</b></div><div class="mk">${g.a} ${nbaSg(-L.sp)}</div><div class="mk">${g.h} ${nbaSg(L.sp)} ${L.spx?oddsFmt(L.spx):""}</div><div></div></div>
  ${full&&mv?`<div class="small" style="text-align:right">${mv}</div>`:""}
  <div class="nbarow"><div><b>Total</b></div><div class="mk">O ${L.tot} ${oddsFmt(L.ox)}</div><div class="mk">U ${L.tot} ${oddsFmt(L.ux)}</div><div></div></div>
  ${full&&mt?`<div class="small" style="text-align:right">${mt}</div>`:""}
  <div class="nbarow"><div><b>Moneyline</b></div><div class="mk">${g.a} ${oddsFmt(L.mla)}</div><div class="mk">${g.h} ${oddsFmt(L.mlh)}</div><div></div></div>`;
}

/* ---------- Games ---------- */
function nbaCol(t){const c=(typeof NBA_TCOL!=="undefined"&&NBA_TCOL[t])||"3a3f47";return "#"+c.replace("#","")}
/* white text on dark team colours, near-black on pale ones (GS gold, MEM light blue…) so the badge stays readable */
function xInkOn(c){const m=String(c||"").match(/^#?([0-9a-f]{6})$/i);if(!m)return "#fff";const n=parseInt(m[1],16),L=[n>>16,n>>8&255,n&255].map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});
  const Y=.2126*L[0]+.7152*L[1]+.0722*L[2];return (Y+.05)/.05>1.05/(Y+.05)?"#111":"#fff"}
function nbaBadge(t){const c=nbaCol(t),k=xInkOn(c);return `<span class="nbbdg" style="background:${c};color:${k}${k==="#111"?";text-shadow:none":""}">${t}</span>`}
function nbaImpl(ml){return ml<0?-ml/(-ml+100):100/(ml+100)}
function nbaWinPct(L){if(!L||!L.mla||!L.mlh)return null;const a=nbaImpl(L.mla),h=nbaImpl(L.mlh);return {a:a/(a+h),h:h/(a+h)}}
function nbaPills(g){
  const L=nbaL(g);if(!L)return `<div class="nbl"><span>Lines not posted yet</span></div>`;
  const fav=L.sp<=0?g.h:g.a;
  return `<div class="nbl"><span>Spread <b>${fav} ${nbaSg(-Math.abs(L.sp))}</b></span><span>Total <b>${L.tot}</b></span><span>Win <b>${g.a} ${oddsFmt(L.mla)}</b> / <b>${g.h} ${oddsFmt(L.mlh)}</b></span></div>`;
}
function nbaKeyOutAll(g){return [...nbaKeyOut(g.a),...nbaKeyOut(g.h)]}
/* every game gets our pick — moneyline, spread or over/under, whichever our model likes most against the posted price.
   Chances from the model's margin/total with the usual spread of results (sd ≈ 12 pts margin, 17 pts total; logistic approx). */
function nbaGamePick(g){const L=nbaL(g),M=nbaModel(g.a,g.h);if(!L||!M)return null;
  const P=z=>1/(1+Math.exp(-1.702*z)),C=[];
  if(L.sp!=null){const ph=P((M.m+L.sp)/12),home=ph>=.5,pr=home?(L.spx||-110):-110;C.push({k:"Spread",txt:`${home?g.h:g.a} ${nbaSg(home?L.sp:-L.sp)}`,ch:home?ph:1-ph,odds:pr})}
  if(L.tot!=null){const po=P((M.tot-L.tot)/17),ov=po>=.5;C.push({k:"Total",txt:`${ov?"Over":"Under"} ${L.tot}`,ch:ov?po:1-po,odds:(ov?L.ox:L.ux)||-110})}
  if(L.mla&&L.mlh){const home=M.p-nbaImpl(L.mlh)>=(1-M.p)-nbaImpl(L.mla);C.push({k:"Moneyline",txt:`${home?g.h:g.a} to win`,ch:home?M.p:1-M.p,odds:home?L.mlh:L.mla})}
  for(const c of C){c.need=nbaImpl(c.odds);c.edge=c.ch-c.need}
  const le=nbaLean(g);let best=C.sort((x,y)=>y.edge-x.edge)[0];
  if(le.length){const k=le[0].k==="sp"?"Spread":"Total";best=C.find(c=>c.k===k)||best;best.strong=1}
  return best?Object.assign(best,{ko:nbaKeyOut(g.a).length+nbaKeyOut(g.h).length,M}):null}
function nbaPickTxt(g){const x=nbaGamePick(g);
  if(!x){const M=nbaModel(g.a,g.h);return M?`<div class="nbpick est">🔮 Our estimate: ${nbaEsc(M.m>=0?g.h:g.a)} by ${Math.max(.5,Math.abs(M.m))} · total ${M.tot}<span class="small"> · our pick posts with the lines</span></div>`:""}
  return `<div class="nbpick${x.strong?"":" est"}">${x.strong?"⭐":"🔮"} Our pick: <b>${nbaEsc(x.txt)}</b> <span class="small">${x.k.toLowerCase()} · ${oddsFmt(x.odds)} · our chance ${Math.round(x.ch*100)}%${x.strong?" · strong lean":x.edge>0?"":" · small lean"}${x.ko?" · key player out, bet light":""}</span></div>`}
/* line movement: ESPN opening number vs now (home spread stored) */
function nbaMove(g){
  const L=nbaL(g);if(!L||!L.open)return null;
  const ds=L.sp-L.open.sp,dt=L.tot-L.open.tot;
  const fav=t=>t===g.h?L.sp:-L.sp,ofav=t=>t===g.h?L.open.sp:-L.open.sp;
  const towards=ds<0?g.h:g.a; /* home spread going more negative = money on home */
  return {ds,dt,L,sp:ds?`${nbaShort(towards)} ${nbaSg(ofav(towards))} → ${nbaSg(fav(towards))}`:"",towards,
    tot:dt?`Total ${L.open.tot} → ${L.tot}`:""};
}
function nbaMoveHtml(g,big){
  const m=nbaMove(g);if(!m)return "";
  if(!m.ds&&!m.dt)return big?`<div class="mvl"><span class="small">📈 Line movement: none yet — same as the opening line (spread ${nbaSg(m.L.open.sp)} home, total ${m.L.open.tot}).</span></div>`:"";
  const parts=[];
  if(m.ds)parts.push(`<div>${Math.abs(m.ds)>=1.5?"🔥":"📈"} Spread moved: <b>${m.sp}</b> <span class="mvt">money on ${nbaShort(m.towards)}</span></div>`);
  if(m.dt)parts.push(`<div>${Math.abs(m.dt)>=3?"🔥":"📈"} ${m.tot.replace("Total","Total moved:")} <span class="mvt">${m.dt>0?"▲ bettors on the over":"▼ bettors on the under"}</span></div>`);
  return `<div class="mvl">${parts.join("")}${big?`<div class="small" style="margin-top:4px">Moves of 1.5+ points on a spread or 3+ on a total usually mean injury news or sharp (professional) money. 🔥 = big move.</div>`:""}</div>`;
}
function nbaGameCard(g){
  const L=nbaL(g),W=nbaWinPct(L),k=nbaKeyOutAll(g);
  const row=(t,isHome)=>{const ml=L?(isHome?L.mlh:L.mla):null,sp=L?(isHome?L.sp:-L.sp):null,fav=W&&(isHome?W.h>W.a:W.a>W.h);
    return `<div class="nbtr"><div class="nbtn">${nbaBadge(t)}<div><b style="${fav?"":"font-weight:600"}">${nbaShort(t)}</b> <span class="small">${nbaRec(t)}</span></div></div>
      <div class="nbtl">${sp!=null?`<span class="small">Spread</span> <b>${nbaSg(sp)}</b>`:""}</div>
      <div class="nbtl">${ml!=null?`<span class="small">Win</span> <b>${oddsFmt(ml)}</b>`:""}</div>
      <div class="nbtl">${sp!=null&&L.tot!=null?`<span class="small">Team total</span> <b>${(Math.round((L.tot/2-sp/2)*2)/2).toFixed(1)}</b>`:""}</div></div>`};
  const fav=L?(L.sp<=0?g.h:g.a):null;
  return `<div class="card nbag nbg2" data-ng="${g.id}">
    <div class="when"><span><b style="color:var(--text)">${g.t}</b> ET</span><span>${typeof cdChip!=="undefined"?cdChip("nba",g):""} Details →</span></div>
    ${nbaFinalHtml(g)}
    ${(()=>{const n=nbaGamePropCount(g);return n?`<a class="gpcnt" href="#nba-game-${g.id}-props" onclick="event.stopPropagation()">🎯 ${n} player props →</a>`:""})()}
    ${row(g.a,false)}${row(g.h,true)}
    ${W?`<div class="nbwp"><div style="width:${Math.round(W.a*100)}%;background:${nbaCol(g.a)}"></div><div style="width:${100-Math.round(W.a*100)}%;background:${nbaCol(g.h)}"></div></div>
    <div class="nbwpl"><span>${g.a} ${Math.round(W.a*100)}%</span><span class="small">chance to win (from the odds)</span><span>${g.h} ${Math.round(W.h*100)}%</span></div>`:""}
    ${L?`<div class="nbsay">${nbaShort(fav)} favored by <b>${Math.abs(L.sp)}</b> · total points line <b>${L.tot}</b></div>`:`<div class="nbsay">Lines not posted yet</div>`}
    ${nbaMoveHtml(g,0)}
    ${(()=>{const a=nbaSpotTags(g.a),h=nbaSpotTags(g.h);const f=T=>T.filter(x=>x[1]==="r"||/Home after/.test(x[0]));const A=f(a),H=f(h);return A.length||H.length?`<div class="spotl">${A.length?`<span><b>${g.a}</b> ${A.map(x=>x[0]).join(" · ")}</span>`:""}${H.length?`<span><b>${g.h}</b> ${H.map(x=>x[0]).join(" · ")}</span>`:""}</div>`:""})()}
    ${nbaPickTxt(g)}
    ${k.length?`<div class="nbout">Missing: <b>${k.map(nbaEsc).join(", ")}</b></div>`:""}
  </div>`;
}
function nbaGames(el){
  el.innerHTML=`<h1>NBA · ${nbaDay(NBA_SLATE_DATE)}</h1>${typeof pxRecentHtml!=="undefined"?pxRecentHtml("nba",4):""}${nbaDayTabs("nba")}${typeof potdTeaser!=="undefined"?potdTeaser("nba"):""}
  <p class="sub">${NBA_SLATE.length} game${NBA_SLATE.length===1?"":"s"} today${(()=>{const f=NBA_SLATE.filter(g=>nbaFinalHtml(g)).length;return f?`, ${f} final`:""})()}. Tap a game for the matchup, or <b>🎯 player props</b> to see every prop from that game.</p>
  <div class="grid g2">${[...NBA_SLATE.filter(g=>!nbaFinalHtml(g)),...NBA_SLATE.filter(g=>nbaFinalHtml(g))].map(nbaGameCard).join("")||`<div class="card">No NBA games today.</div>`}</div>
  ${typeof xInsights!=="undefined"?xInsights("nba","🧠 Tonight's insights",[["edges","💰 Odds gaps",xEdgesCard("nba")],["ang","🧭 Player angles",typeof nbaAnglesCard!=="undefined"?nbaAnglesCard():""],["moves","📈 Line moves",typeof loMovesCard!=="undefined"?loMovesCard("nba",8):""],["min","⏱️ Minutes",typeof xaTrendCard!=="undefined"?`<div class="card">${xaTrendCard("nba")}</div>`:""]]):""}
  <div style="margin-top:14px">${nbaPlaysCard()}</div>${typeof prlSportHtml!=="undefined"?prlSportHtml("nba"):""}
  ${typeof loMovesCard!=="undefined"&&loMovesCard("nba",8)?`<div style="margin-top:14px">${loMovesCard("nba",8)}</div>`:""}
  <div style="margin-top:14px">${nbaRecordCard(0)}</div>
  ${typeof nbaRoleCard!=="undefined"&&NBA_SLATE.some(g=>!nbaStarted(g))?`<div style="margin-top:14px">${nbaRoleCard(8)}</div>`:""}
  <a href="#nba-best" class="btn" style="display:block;text-align:center;margin-top:10px">🔥 See every prop ranked →</a>
  <details class="adv" style="margin-top:14px"><summary><b>How to read this</b></summary>
  <p class="small" style="margin:8px 0 0"><b>Spread</b>: the favorite (minus number) has to win by more than that many points; the underdog (plus number) can lose by less. <b>Win</b>: moneyline odds to win the game outright. <b>Total</b>: bet whether both teams together score over or under that number. "Missing" lists regulars who are out. Lines from DraftKings. Research, not a guarantee.</p></details>`;
  el.querySelectorAll("[data-ng]").forEach(c=>c.onclick=()=>location.hash="nba-game-"+c.dataset.ng);
  nbaWireBest(el);
}

/* ---------- Game page ---------- */
function nbaTopPlayers(tm,n){
  const out=new Set(nbaOutNames(tm));
  return Object.entries(NBA_LOGS).filter(([nm,p])=>p.tm===tm&&!out.has(nm)&&p.g.length).map(([nm,p])=>[nm,p,nbaAvg(p,"min",10)]).sort((a,b)=>b[2]-a[2]).slice(0,n);
}
function nbaPlayerTable(list,opts){
  opts=opts||{};
  return `<div class="nbatbl"><table style="min-width:0"><thead><tr><th>Player</th><th>PTS</th><th>REB</th><th>AST</th>${opts.no3?"":"<th>3PM</th>"}</tr></thead><tbody>${list.map(([nm,p])=>{
    const s=nbaAvg(p,"pts"),l5=nbaAvg(p,"pts",5),d=l5-s;
    return `<tr><td>${nbaLink(nm)}${opts.tm?` <span class="small">${p.tm}</span>`:""}${nbaInjChip(nbaInjOf(nm))}</td><td><b>${nbaF(s)}</b>${Math.abs(d)>=3?` <span class="${d>0?"up":"dn"}" title="last 5: ${nbaF(l5)}">${d>0?"▲":"▼"}</span>`:""}</td><td>${nbaF(nbaAvg(p,"reb"))}</td><td>${nbaF(nbaAvg(p,"ast"))}</td>${opts.no3?"":`<td>${nbaF(nbaAvg(p,"3pm"))}</td>`}</tr>`}).join("")}</tbody></table></div>
  ${opts.nonote?"":`<p class="note" style="margin:6px 0 0">Per-game averages this season. ▲▼ = much hotter or colder over the last 5 games.</p>`}`;
}
function nbaInjTable(tm,onlyOut){
  const rows=(NBA_INJ[tm]||[]).filter(r=>!onlyOut||NBA_LOGS[r[0]]);
  if(!rows.length)return `<div class="small">Nobody listed.</div>`;
  return rows.map(r=>`<div class="nbarow" style="grid-template-columns:minmax(0,1fr) auto"><div>${NBA_LOGS[r[0]]?nbaLink(r[0]):nbaEsc(r[0])} <span class="small">${nbaEsc(r[3])}</span></div><div style="color:${nbaInjCol(r[2])};font-weight:600;font-size:13px">${nbaEsc(r[2])}</div></div>`).join("");
}
function nbaOrd(n){return n+(n%100>=11&&n%100<=13?"th":n%10===1?"st":n%10===2?"nd":n%10===3?"rd":"th")}
function nbaRkCls(r){return r<=8?"rkg":r>=23?"rkb":"rkm"}
/* one matchup row: offense stat (rank) vs defense allowed (rank) */
function nbaMURow(lbl,ov,orr,dv,dr,unit,lowGood){
  // edge: offense strength vs defense weakness (ranks 1 = best for that side)
  const edge=(31-orr)-(31-dr);// >0 offense better ranked than defense
  const cls=orr<=10&&dr>=21?"edge-o":dr<=10&&orr>=21?"edge-d":"";
  const pct=v=>Math.max(4,Math.min(100,v));
  return `<div class="mu ${cls}"><div class="mul">${lbl}</div>
    <div class="mub"><div class="muo"><i style="width:${pct((31-orr)/30*100)}%"></i><span>${ov}${unit||""} <em class="${nbaRkCls(orr)}">${nbaOrd(orr)}</em></span></div>
    <div class="mud"><i style="width:${pct((31-dr)/30*100)}%"></i><span>${dv}${unit||""} <em class="${nbaRkCls(dr)}">${nbaOrd(dr)}</em></span></div></div></div>`;
}
const NBA_MU=[["pts","Points per game",""],["rtg","Points per 100 possessions",""],["fg","Field goal %","%"],["tp","3-point %","%"],["tpa","3-point attempts",""],["paint","Points in the paint",""],["fta","Free throw attempts",""],["oreb","Offensive rebounds",""],["tov","Turnovers",""],["fb","Fast-break points",""]];
/* shot types by team (NBA_TSTYPE from ESPN play-by-play): catch & shoot and pull-up jumpers — taken per game + FG%, and allowed */
const NBA_STK=[["csA","Catch & shoot attempts",""],["csP","Catch & shoot FG%","%"],["puA","Pull-up attempts",""],["puP","Pull-up FG%","%"]];
let NBA_TSTC=null;function nbaTst(){if(NBA_TSTC)return NBA_TSTC;const T=typeof NBA_TSTYPE!=="undefined"&&NBA_TSTYPE,G=typeof NBA_DZG!=="undefined"&&NBA_DZG;if(!T||!G)return null;
  const V={};for(const [t,x] of Object.entries(T)){const g=G[t];if(!g)continue;const f=a=>({csA:+(a[0][0]/g).toFixed(1),csP:a[0][0]?+(a[0][1]/a[0][0]*100).toFixed(1):0,puA:+(a[1][0]/g).toFixed(1),puP:a[1][0]?+(a[1][1]/a[1][0]*100).toFixed(1):0});V[t]={o:f(x.o),d:f(x.d)}}
  const rk=(side,k,hi)=>{const L=Object.entries(V).sort((a,b)=>hi?b[1][side][k]-a[1][side][k]:a[1][side][k]-b[1][side][k]);const m={};L.forEach(([t],i)=>m[t]=i+1);return m};
  for(const [k] of NBA_STK){const ro=rk("o",k,true),rd=rk("d",k,false);for(const t in V){(V[t].oR=V[t].oR||{})[k]=ro[t];(V[t].dR=V[t].dR||{})[k]=rd[t]}}
  return NBA_TSTC=V}
function nbaMatchup(off,def){
  const O=NBA_TADV[off],D=NBA_TADV[def];if(!O||!D)return `<div class="small">Not enough games yet.</div>`;
  const S=nbaTst(),so=S&&S[off],sd=S&&S[def];
  return `<div class="muhead"><span>${nbaBadge(off)} ${nbaShort(off)} offense</span><span>${nbaShort(def)} defense allows ${nbaBadge(def)}</span></div>`+
    NBA_MU.map(([k,l,u])=>nbaMURow(l,O.o[k],O.oR[k],D.d[k],D.dR[k],u)).join("")+
    (so&&sd?`<div class="small mush">Jump shots by type</div>`+NBA_STK.map(([k,l,u])=>nbaMURow(l,so.o[k],so.oR[k],sd.d[k],sd.dR[k],u)).join(""):"");
}
function nbaEdges(g){
  const out=[];
  for(const [off,def] of [[g.a,g.h],[g.h,g.a]]){
    const O=NBA_TADV[off],D=NBA_TADV[def];if(!O||!D)continue;
    for(const [k,l,u] of NBA_MU){if(k==="pts"||k==="rtg")continue;
      const s=(31-O.oR[k])-(31-D.dR[k]);
      if(O.oR[k]<=10&&D.dR[k]>=21)out.push({s:s,t:`<b>${nbaShort(off)}</b> rank ${nbaOrd(O.oR[k])} in ${l.toLowerCase()} (${O.o[k]}${u}) and ${nbaShort(def)} rank ${nbaOrd(D.dR[k])} at stopping it (${D.d[k]}${u} allowed).`,c:"up"});
      else if(D.dR[k]<=10&&O.oR[k]>=21)out.push({s:-s,t:`<b>${nbaShort(def)}</b>${/s$/.test(nbaShort(def))?"'":"'s"} defense is ${nbaOrd(D.dR[k])} in ${l.toLowerCase()} allowed (${D.d[k]}${u}) — tough spot for ${nbaShort(off)} (${nbaOrd(O.oR[k])}).`,c:"dn"});
    }
  }
  const S=nbaTst();if(S)for(const [off,def] of [[g.a,g.h],[g.h,g.a]]){const O=S[off],D=S[def];if(!O||!D)continue;
    for(const [k,l,u] of NBA_STK){const s=(31-O.oR[k])-(31-D.dR[k]);
      if(O.oR[k]<=8&&D.dR[k]>=23)out.push({s,t:`<b>${nbaShort(off)}</b> rank ${nbaOrd(O.oR[k])} in ${l.toLowerCase()} (${O.o[k]}${u}) and ${nbaShort(def)} allow the ${nbaOrd(31-D.dR[k])} most (${D.d[k]}${u}).`,c:"up"});
      else if(D.dR[k]<=8&&O.oR[k]>=23)out.push({s:-s,t:`<b>${nbaShort(def)}</b> take away ${l.toLowerCase().replace(/ attempts| fg%/,"")} shots (${nbaOrd(D.dR[k])}, ${D.d[k]}${u} allowed) — ${nbaShort(off)} rely on them less anyway (${nbaOrd(O.oR[k])}).`,c:"dn"})}}
  return out.sort((a,b)=>b.s-a.s).slice(0,5);
}
function nbaLast5(t){
  const gs=NBA_RES.filter(r=>r[2]===t||r[3]===t).slice(-5).reverse();
  return gs.map(r=>{const home=r[3]===t,us=home?r[5]:r[4],them=home?r[4]:r[5],opp=home?r[2]:r[3],w=us>them;
    return `<div class="l5r"><span class="chip ${w?"w":"l"}">${w?"W":"L"}</span><span>${home?"vs":"@"} ${opp}</span><span class="small">${nbaDayS(r[1])}</span><b>${us}-${them}</b></div>`}).join("")||`<div class="small">No games yet.</div>`;
}
function nbaGame(el,id){
  const tabP=/-props$/.test(id);id=String(id).replace(/-props$/,"");
  const g=NBA_SLATE.find(x=>String(x.id)===String(id))||nbaFutGame(id);
  if(!g){location.hash="nba";return}
  const fut=!!g.fut;
  const A=NBA_TADV[g.a],H=NBA_TADV[g.h],M=nbaModel(g.a,g.h),k=nbaKeyOutAll(g),L=nbaL(g),W=nbaWinPct(L);
  const ra=(typeof NBA_REST!=="undefined"&&NBA_REST)||{};
  const restTxt=t=>{const r=ra[t];if(!r)return "–";return `${r.rest===0?"Back-to-back (played yesterday)":r.rest+" day"+(r.rest===1?"":"s")+" of rest"}${r.b2bNext?" · plays again tomorrow":""}`};
  let say="";
  if(M){const fav=M.m>=0?g.h:g.a;say=`Our numbers: <b>${nbaShort(fav)} by ${Math.abs(M.m)||"a hair"}</b>, about <b>${M.tot}</b> total points.`;
    say+=nbaLean(g).length?"":k.length?` No pick — ${k.map(nbaEsc).join(", ")} ${k.length>1?"are":"is"} out, so these numbers are off.`:" Close to the line, so no pick.";}
  const pace=A&&H?(A.pace+H.pace)/2:null;
  const tile=(l,v,s)=>`<div class="stat"><div class="l">${l}</div><div style="font-size:20px;font-weight:800">${v}</div><div class="small">${s||""}</div></div>`;
  const edges=nbaEdges(g);
  el.innerHTML=`<a href="#nba" class="small" style="color:var(--text2)">← All games</a>
  <div class="gh">
    <div class="ght">${nbaBadge(g.a)}<b>${nbaTeamLink(g.a,nbaEsc(nbaShort(g.a)))}</b><span class="small">${nbaRec(g.a)}</span></div>
    <div class="ghm"><b>${g.t}</b><span class="small">ET · ${nbaDayS(g.d||NBA_SLATE_DATE)}</span>${typeof cdChip!=="undefined"&&!fut?cdChip("nba",g):""}</div>
    <div class="ght">${nbaBadge(g.h)}<b>${nbaTeamLink(g.h,nbaEsc(nbaShort(g.h)))}</b><span class="small">${nbaRec(g.h)}</span></div>
  </div>
  ${nbaGameTabs(g,tabP)}
  ${tabP?`<div id="gpBody">${nbaGameProps(g)}</div>`:`
  ${(()=>{const T=({inj:"ov"}[NB.gtab]||NB.gtab||"ov"),nav="";
    if(T==="ov"){const pk=typeof nbaGamePick!=="undefined"?nbaGamePick(g):null,bp=(typeof nbaBest!=="undefined"?nbaBest():[]).filter(b=>b.g&&String(b.g.id)===String(g.id)&&b.sc>=.45).slice(0,2);
      if(fut&&!L){const M2=M;return gpSummary({pick:M2?`Our early number: <b>${nbaEsc(nbaShort(M2.m>=0?g.h:g.a))} by ${Math.max(.5,Math.abs(M2.m))}</b>, about ${M2.tot} total points <span class="small">(${Math.round((M2.m>=0?M2.p:1-M2.p)*100)}% to win · lines not posted yet)</span>`:"",props:[]})+`<div class="card gplines small">Sportsbook lines aren't posted yet — spreads and totals usually come out the night before, player props the morning of the game. Everything below uses this season's numbers and today's injury report.</div>`
        +gpMerge("What matters","gpwm",[(typeof nbaQuick!=="undefined"?nbaQuick(g):""),(typeof xfNba!=="undefined"?xfNba(g):"")])
        +gpMerge("Injuries","gpinj",[`<div class="grid g2"><div><h3 class="nhh3">${nbaShort(g.a)}</h3>${nbaInjTable(g.a)}</div><div><h3 class="nhh3">${nbaShort(g.h)}</h3>${nbaInjTable(g.h)}</div></div>`,(typeof woCard!=="undefined"?woCard("nba",g.a,g.h,nbaShort):"")])}
      return gpSummary({pick:pk?`<b>${nbaEsc(pk.txt)}</b> <span class="small">${pk.k.toLowerCase()} · ${oddsFmt(pk.odds)} · our chance ${Math.round(pk.ch*100)}%${pk.strong?" · strong lean":""}</span>`:(M?`Our estimate: <b>${nbaEsc(nbaShort(M.m>=0?g.h:g.a))} by ${Math.max(.5,Math.abs(M.m))}</b>, total ${M.tot} <span class="small">(lines not posted yet)</span>`:""),
        props:bp.map(b=>gpPropLine(b.nm,b.side==="o"?"Over":"Under",b.line,NBA_MK[b.k][1],b.odds,b.sc,"#nba-player-"+encodeURIComponent(b.nm)+"~"+b.k))})
      +(!L&&fut?`<div class="card gplines small">Sportsbook lines aren't posted yet.</div>`:"")+(!L&&fut?"":`<div class="card gplines">    ${L?`<div class="nbl" style="justify-content:center"><span>Spread <b>${L.sp<=0?g.h:g.a} ${nbaSg(-Math.abs(L.sp))}</b></span><span>Total <b>${L.tot}</b></span><span>Win <b>${g.a} ${oddsFmt(L.mla)}</b> / <b>${g.h} ${oddsFmt(L.mlh)}</b></span></div>`:`<div class="small">Lines not posted yet.</div>`}
    ${W?`<div class="nbwp"><div style="width:${Math.round(W.a*100)}%;background:${nbaCol(g.a)}"></div><div style="width:${100-Math.round(W.a*100)}%;background:${nbaCol(g.h)}"></div></div>
    <div class="nbwpl"><span>${g.a} ${Math.round(W.a*100)}%</span><span class="small">chance to win (from the odds)</span><span>${g.h} ${Math.round(W.h*100)}%</span></div>`:""}
    ${typeof xaPmLine!=="undefined"?xaPmLine("nba",g.a,g.h,W&&W.a,W&&W.h):""}
    ${nbaMoveHtml(g,1)}
  ${fut&&L&&L.at?`<div class="small" style="margin-top:6px">Lines posted early (ESPN / DraftKings, checked ${nbaEsc(L.at.slice(11,16))} UTC) — they can still move; player props come the morning of the game.</div>`:""}</div>`)
      +gpMerge("What matters","gpwm",[(typeof nbaQuick!=="undefined"?nbaQuick(g):""),(typeof xfNba!=="undefined"?xfNba(g):""),`${typeof fxNba!=="undefined"?fxCard(fxNba(g),"Meetings last season and this season, and this season's results."):""}`])
      +gpMerge("Injuries","gpinj",[`<div class="grid g2"><div><h3 class="nhh3">${nbaShort(g.a)}</h3>${nbaInjTable(g.a)}</div><div><h3 class="nhh3">${nbaShort(g.h)}</h3>${nbaInjTable(g.h)}</div></div>`,(typeof xaKeyOutCard!=="undefined"?xaKeyOutCard("nba",g.a,g.h):""),(typeof woCard!=="undefined"?woCard("nba",g.a,g.h,nbaShort):"")])
      +gpMerge("Starting lineups","gpone",[nbaLuCard(g)])+gpMerge("Latest news","gpone",[typeof newsCard!=="undefined"?newsCard("nba",{teams:[g.a,g.h]},"Latest news: "+nbaShort(g.a)+" & "+nbaShort(g.h)):""])}
    if(T==="tr")return nav+`  <div style="margin-top:14px">${nbaGsHtml(g)}</div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h2>${nbaShort(g.a)} last 5</h2>${nbaLast5(g.a)}<div class="small" style="margin-top:8px">${restTxt(g.a)}</div>${nbaSpotHtml(g.a)}</div>
    <div class="card"><h2>${nbaShort(g.h)} last 5</h2>${nbaLast5(g.h)}<div class="small" style="margin-top:8px">${restTxt(g.h)}</div>${nbaSpotHtml(g.h)}</div>
  </div>
  ${nbaQtrCard(g)}${typeof gpLazy!=="undefined"?gpLazy("Upcoming schedule",()=>vxSched("nba",g.a,g.h,nbaShort,null,NBA_SLATE_DATE)):""}

`;
    if(T==="h2h")return nav+`<div class="nodz">${nbaH2HCard(g)}</div>`;
    if(T==="inj")return nav+`  <div class="grid g2" style="margin-top:8px">
    <div class="card"><h2>${nbaShort(g.a)} injuries</h2>${nbaInjTable(g.a)}</div>
    <div class="card"><h2>${nbaShort(g.h)} injuries</h2>${nbaInjTable(g.h)}</div></div>`;
    return nav+`  ${A&&H?`<div class="grid g4" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-top:14px">
    ${tile("Expected pace",nbaF(pace),"possessions per team · "+(pace>=102?"fast game":pace<=98?"slow game":"average speed"))}
    ${tile(nbaShort(g.a)+" offense",nbaF(A.o.rtg),nbaOrd(A.oR.rtg)+" of 30 · pts/100 poss")}
    ${tile(nbaShort(g.h)+" offense",nbaF(H.o.rtg),nbaOrd(H.oR.rtg)+" of 30 · pts/100 poss")}
    ${tile(nbaShort(g.a)+" defense",nbaF(A.d.rtg),nbaOrd(A.dR.rtg)+" of 30 · allowed/100")}
    ${tile(nbaShort(g.h)+" defense",nbaF(H.d.rtg),nbaOrd(H.dR.rtg)+" of 30 · allowed/100")}
  </div>`:""}
  ${typeof nbaKeyMu!=="undefined"?nbaKeyMu(g):""}${typeof xaRefCard!=="undefined"?xaRefCard(g):""}${typeof xaKeyOutCard!=="undefined"?xaDefTrendCard("nba",g.a,g.h)+xaGainCard(g)+xaBenchCard(g)+xaYesCard(g):""}
  <div class="card" style="margin-top:14px"><h2>When the ${nbaShort(g.a)} have the ball</h2>${nbaMatchup(g.a,g.h)}</div>
  <div class="card" style="margin-top:14px"><h2>When the ${nbaShort(g.h)} have the ball</h2>${nbaMatchup(g.h,g.a)}</div>${typeof gpLazy!=="undefined"?gpLazy("Matchup heat map",()=>vxHeat("nba",g.a,g.h,nbaShort))+gpLazy("Defense vs position",()=>vxDvp(g))+gpLazy("Team shot zones",()=>typeof vxNbaZones!=="undefined"?vxNbaZones(g):"")+gpLazy("Pace vs scoring",()=>typeof vxPace!=="undefined"?vxPace("nba",g):"")+gpLazy("Offense vs defense — every team",()=>typeof vxStrength!=="undefined"?vxStrength("nba",g):""):""}
  <p class="note" style="margin-top:6px">Longer bar = better rank (1st of 30). <span class="rkg">Green</span> = top 8, <span class="rkb">red</span> = bottom 8. Highlighted rows are mismatches. Season to date.</p>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h2>${nbaShort(g.a)} players</h2>${nbaPlayerTable(nbaTopPlayers(g.a,7),{no3:1,nonote:1})}</div>
    <div class="card"><h2>${nbaShort(g.h)} players</h2>${nbaPlayerTable(nbaTopPlayers(g.h,7),{no3:1,nonote:1})}</div>
  </div><p class="note" style="margin-top:8px">Per-game averages this season. ▲▼ = much hotter or colder over the last 5 games.</p>
`})()}`}`;
  if(tabP)nbaWireGameProps(el,g);else nbaGsWire(el,g);
  el.querySelectorAll("[data-nbgt]").forEach(a=>a.onclick=e=>{e.preventDefault();NB.gtab=a.dataset.nbgt;if(tabP){location.hash="nba-game-"+id;return}const y=scrollY;nbaGame(el,id);scrollTo(0,y)});
}
function nbaGsHtml(g){const L=nbaL(g);return gsCard("nba|"+g.id,"nba",[g.a,g.h],gsRowsNba,t=>gsRowsNba(t).filter(r=>r.opp===(t===g.a?g.h:g.a)),{sp:L?L.sp:null,tot:L?L.tot:null},[195,255,5])}
function nbaGsWire(el,g){gsWire(el,()=>{const c=el.querySelector(".gsc");if(!c)return;const y=scrollY;c.outerHTML=nbaGsHtml(g);nbaGsWire(el,g);scrollTo(0,y)})}
/* a game's lines: today's from NBA_LINES, upcoming games from NBA_LINES_NEXT (posted as soon as ESPN's feed has them) */
function nbaL(g){if(!g)return null;if(g.fut)return (typeof NBA_LINES_NEXT!=="undefined"&&NBA_LINES_NEXT[g.d+"|"+g.a+"@"+g.h])||null;return NBA_LINES[g.a+"@"+g.h]}
/* upcoming games (next 4 days, from NBA_NEXT) get their own page: id "f<YYYYMMDD>-<away>-<home>" */
function nbaFutId(d,a,h){return `f${d.replace(/-/g,"")}-${a}-${h}`}
function nbaFutGame(id){const m=String(id).match(/^f(\d{4})(\d{2})(\d{2})-([A-Z]+)-([A-Z]+)$/);if(!m)return null;const d=`${m[1]}-${m[2]}-${m[3]}`;
  const x=(typeof nbaGamesOn!=="undefined"?nbaGamesOn(d):[]).find(z=>z.a===m[4]&&z.h===m[5]);return x?{id,a:x.a,h:x.h,t:x.t||"TBD",d,fut:true}:null}
function nbaGameTabs(g,tabP){if(g.fut){const h=`#nba-game-${g.id}`,T=({inj:"ov"}[NB.gtab]||NB.gtab||"ov");return gpTabs(T,[["ov","Overview",h,'data-nbgt="ov"'],["mu","Matchup",h,'data-nbgt="mu"'],["tr","Trends",h,'data-nbgt="tr"'],["h2h","H2H",h,'data-nbgt="h2h"'],["props",`<span class="small">Props on game day</span>`,"#nba-best"]])}
  const n=nbaGamePropCount(g),T=tabP?"props":({inj:"ov"}[NB.gtab]||NB.gtab||"ov"),h=`#nba-game-${g.id}`;
  return gpTabs(T,[["ov","Overview",h,'data-nbgt="ov"'],["mu","Matchup",h,'data-nbgt="mu"'],["tr","Trends",h,'data-nbgt="tr"'],["h2h","H2H",h,'data-nbgt="h2h"'],["props",`Props${n?` <small>${n}</small>`:""}`,h+"-props"]])}
function nbaWireGameProps(el,g){
  const redraw=()=>{const y=scrollY;const b=document.getElementById("gpBody");if(b){b.innerHTML=nbaGameProps(g);nbaWireGameProps(el,g)}scrollTo(0,y)};
  el.querySelectorAll("[data-gpt]").forEach(b=>b.onclick=()=>{NB.gpt=b.dataset.gpt;redraw()});
  const s=document.getElementById("gpMk");if(s)s.onchange=()=>{NB.gpm=s.value;redraw()};
  el.querySelectorAll("#gpBody [data-jump]").forEach(r=>{r.removeAttribute("data-jump")});
  nbaWireBest(el);
}

/* ---------- By quarter / first half (from play-by-play) ---------- */
function nbaQtrStats(t){
  const G=(typeof NBA_QTR!=="undefined"&&NBA_QTR[t])||[];if(!G.length)return null;
  const av=(f)=>G.reduce((s,x)=>s+f(x),0)/G.length,o={n:G.length,f:[],a:[]};
  for(let q=0;q<4;q++){o.f.push(av(x=>x[4][q]));o.a.push(av(x=>x[5][q]))}
  o.f1h=o.f[0]+o.f[1];o.a1h=o.a[0]+o.a[1];
  o.q1w=G.filter(x=>x[4][0]>x[5][0]).length;o.h1w=G.filter(x=>x[4][0]+x[4][1]>x[5][0]+x[5][1]).length;
  return o;
}
function nbaQtrCard(g){
  const A=nbaQtrStats(g.a),H=nbaQtrStats(g.h);if(!A||!H)return "";
  const pj=(fa,ah,fh,aa)=>(fa+ah)/2+(fh+aa)/2;
  const q1=pj(A.f[0],H.a[0],H.f[0],A.a[0]),h1=pj(A.f1h,H.a1h,H.f1h,A.a1h);
  const q1m=((A.f[0]+H.a[0])/2)-((H.f[0]+A.a[0])/2),h1m=((A.f1h+H.a1h)/2)-((H.f1h+A.a1h)/2);
  const row=(l,i)=>{const fa=i==="h"?A.f1h:A.f[i],aa=i==="h"?A.a1h:A.a[i],fh=i==="h"?H.f1h:H.f[i],ah=i==="h"?H.a1h:H.a[i];
    return `<tr${i==="h"?' class="tn"':""}><td><b>${l}</b></td><td class="${fa>aa?"up":"dn"}">${nbaF(fa)}</td><td>${nbaF(aa)}</td><td class="${fh>ah?"up":"dn"}">${nbaF(fh)}</td><td>${nbaF(ah)}</td></tr>`};
  const lead=(m,lab)=>Math.abs(m)<.5?`${lab}: about even`:`${lab}: <b>${nbaShort(m>0?g.a:g.h)} by ${nbaF(Math.abs(m))}</b>`;
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">By quarter & first half</h2>
  <div class="small" style="margin-bottom:8px">Points scored (<b>For</b>) and allowed (<b>Agst</b>) per quarter this season. Useful for 1st-quarter and 1st-half bets.</div>
  <div class="nbatbl"><table class="bxt spl" style="min-width:0"><thead><tr><th></th><th>${g.a} For</th><th>Agst</th><th>${g.h} For</th><th>Agst</th></tr></thead><tbody>
  ${row("Q1",0)}${row("Q2",1)}${row("1st half","h")}${row("Q3",2)}${row("Q4",3)}</tbody></table></div>
  <div class="grid g2" style="margin-top:10px;gap:8px">
    <div class="stat"><div class="l">Projected 1st quarter</div><div style="font-size:20px;font-weight:800">${nbaF(q1)} pts</div><div class="small">${lead(q1m,"Edge")}</div></div>
    <div class="stat"><div class="l">Projected 1st half</div><div style="font-size:20px;font-weight:800">${nbaF(h1)} pts</div><div class="small">${lead(h1m,"Edge")}</div></div>
  </div>
  <div class="small" style="margin-top:8px">${nbaShort(g.a)} won the 1st quarter in ${A.q1w} of ${A.n} games and led at half in ${A.h1w}. ${nbaShort(g.h)}: ${H.q1w} of ${H.n} and ${H.h1w}. Projection = each offense averaged with the other defense. A guide, not a guarantee.</div></div>`;
}
function nbaH2HCard(g){
  const prev=((typeof NBA_H2H!=="undefined"&&NBA_H2H[g.a+"@"+g.h])||[]).map(r=>({d:r[0],a:r[1],h:r[2],as:r[3],hs:r[4],t:r[5],s:"2025-26"}));
  const cur=NBA_RES.filter(r=>(r[2]===g.a&&r[3]===g.h)||(r[2]===g.h&&r[3]===g.a)).map(r=>({d:r[1],a:r[2],h:r[3],as:r[4],hs:r[5],t:"RS",s:"2026-27"}));
  const all=[...prev,...cur].sort((x,y)=>x.d<y.d?1:-1);
  if(!all.length)return `<div class="card" style="margin-top:14px"><h2>Head to head</h2><div class="small">No meetings last season or this season.</div></div>`;
  const win=t=>all.filter(m=>(m.a===t&&m.as>m.hs)||(m.h===t&&m.hs>m.as)).length;
  const avgT=all.reduce((s,m)=>s+m.as+m.hs,0)/all.length;
  const L=nbaL(g);
  const ov=L?all.filter(m=>m.as+m.hs>L.tot).length:null;
  return `<div class="card" style="margin-top:14px"><h2>Head to head</h2>
  <div class="hr3"><div><b>${win(g.a)}-${win(g.h)}</b>${nbaShort(g.a)} record</div><div><b>${nbaF(avgT)}</b>Avg total</div><div><b>${ov!=null?ov+"/"+all.length:"–"}</b>${L?"Over "+L.tot:"Over"}</div></div>
  ${all.map((m,i)=>{const aw=m.as>m.hs;return `<div class="nbarow" data-bxrow style="grid-template-columns:minmax(0,1fr) auto"><div><span class="small">${nbaDayS(m.d)}${m.t==="PO"?" · playoffs":m.t==="PI"?" · play-in":""}</span><br>
    <span style="${aw?"font-weight:700":""}">${nbaShort(m.a)} ${m.as}</span> @ <span style="${!aw?"font-weight:700":""}">${nbaShort(m.h)} ${m.hs}</span></div><div class="small" style="text-align:right">Total ${m.as+m.hs}${i<5&&typeof bxBtn!=="undefined"?"<br>"+bxBtn("nba",m.d,m.a,m.h):""}</div></div>`}).join("")}
  <p class="note" style="margin:8px 0 0">Last season and this season, newest first. Tap 📋 Box score on any of the last 5 for the full stats.</p></div>`;
}

/* ---------- Props ---------- */
function nbaHit(p,k,line,n){const f=p.g.filter(nbaInR);const g=n?f.slice(-n):f;const o=g.filter(x=>pxHit(nbaVal(x,k),line)).length;return [o,g.length]}
function nbaPosRank(oppTm,pos){const t=NBA_TEAM[oppTm];if(!t||!pos)return null;const k={G:"pG",F:"pF",C:"pC"}[pos];return k?[t[k],t[k+"R"]]:null}
/* defense vs position: what a team allowed to each position, game by game */
let NBA_DVP_IDX=null;
function nbaDvpIdx(){
  if(NBA_DVP_IDX)return NBA_DVP_IDX;
  const idx={};
  for(const [nm,p] of Object.entries(NBA_LOGS)){const ps=p.p5;if(!ps)continue;for(const x of p.g){if(x[9]!==1)continue;const key=x[0]+"|"+x[2];const o=idx[key]||(idx[key]={PG:[],SG:[],SF:[],PF:[],C:[]});if(o[ps])o[ps].push({nm,x})}}
  return NBA_DVP_IDX=idx;
}
function nbaDvp(team,pos,k,n){
  const idx=nbaDvpIdx();
  const games=NBA_RES.filter(r=>r[2]===team||r[3]===team).slice(-(n||5));
  const rows=games.map(r=>{const vs=r[2]===team?r[3]:r[2];const xs=(idx[r[0]+"|"+team]||{})[pos]||[];const who=xs.map(o=>({nm:o.nm,v:nbaVal(o.x,k)})).sort((a,b)=>b.v-a.v);return {d:r[1],vs,ha:r[3]===team?"H":"A",v:who.reduce((s,o)=>s+o.v,0),who}});
  let tot=0,cnt=0;for(const key in idx){const xs=idx[key][pos]||[];if(!xs.length)continue;tot+=xs.reduce((s,o)=>s+nbaVal(o.x,k),0);cnt++}
  return {rows,lg:cnt?tot/cnt:0};
}
function nbaPosWord(p){return ({PG:"point guards",SG:"shooting guards",SF:"small forwards",PF:"power forwards",C:"centers",G:"guards",F:"forwards"})[p]||p}
function nbaDvpChart(team,pos,k){
  const {rows,lg}=nbaDvp(team,pos,k,5);
  if(!rows.length)return `<div class="small" style="padding:18px 0;text-align:center">No games yet.</div>`;
  const vals=rows.map(r=>r.v),mx=Math.max(lg*1.3,...vals,1),H=120,ly=Math.round(lg/mx*H);
  const avg=vals.reduce((a,b)=>a+b,0)/vals.length,more=avg>lg;
  return `<div class="nbsum" style="margin:0 0 6px">${NBA_MK[k][1]} ${team} allowed to <b>starting ${nbaPosWord(pos)}</b>, last ${rows.length} games</div>
  <div class="nbch" style="height:${H+34}px">
    <div class="nbln" style="bottom:${ly+20}px;border-color:#8cc0ff"><span style="color:#8cc0ff;left:0;right:auto">NBA avg ${nbaF(lg)}</span></div>
    ${rows.map(r=>`<div class="nbbar" title="${nbaEsc(r.d)} ${r.ha==="H"?"vs":"@"} ${r.vs}: ${r.v}"><span class="v">${r.v}</span><i style="height:${Math.max(3,Math.round(r.v/mx*H))}px;background:${r.v>lg?"#3fb26b":"#e5534b"}"></i><span class="o">${r.ha==="H"?"vs ":"@"}${r.vs}</span></div>`).join("")}
  </div>
  <div class="nbsum"><b class="${more?"up":"dn"}">${nbaF(avg)} a game</b> vs NBA avg ${nbaF(lg)} — ${more?"an easier":"a tougher"} matchup for starting ${nbaPosWord(pos)}</div>
  <div class="dvpwho"><div class="small" style="margin:8px 0 4px;font-weight:700">Starting ${pos} vs ${team}, newest first</div>
  ${rows.slice().reverse().map(r=>`<div class="dwr"><span class="dwg">${nbaDayS(r.d).replace(/^\w+, /,"")} ${r.ha==="H"?"vs":"@"} ${r.vs}<b>${r.v}</b></span><span class="dwn">${r.who.length?r.who.map(o=>`<span style="white-space:nowrap"><a href="#nba-player-${encodeURIComponent(o.nm)}">${nbaEsc(o.nm)}</a> <b>${o.v}</b></span>`).join('<span class="small"> · </span>'):`<span class="small">no starter listed at ${pos}</span>`}</span></div>`).join("")}
  <div class="small" style="margin-top:4px">Starters only, by each player's listed position. Tap a name for his page.</div></div>`;
}

/* teammate filter: NB.tmf[player] = "w|Name" (with) or "o|Name" (without) */
NB.tmf=NB.tmf||{};
function nbaMatePlayed(mate,o,tm){
  if(o.prev){const ros=(typeof NBA_ROS!=="undefined"&&NBA_ROS[tm])||[];const i=ros.indexOf(mate);return i>=0&&(o.x[19]||[]).includes(i)}
  const p=NBA_LOGS[mate];return !!(p&&p.g.some(y=>y[0]===o.x[0]));
}
function nbaMateOK(nm,o){
  const f=NB.tmf[nm];if(!f)return true;if(typeof f==="object"){for(const [mate,m] of Object.entries(f)){const pl=nbaMatePlayed(mate,o,NBA_LOGS[nm].tm);if(m==="w"?!pl:pl)return false}return true}
  const [m,mate]=[f[0],f.slice(2)];
  const played=nbaMatePlayed(mate,o,NBA_LOGS[nm].tm);return m==="w"?played:!played;
}
function nbaMateMulti(nm){const tm=NBA_LOGS[nm].tm,ros=((typeof NBA_ROS!=="undefined"&&NBA_ROS[tm])||Object.keys(NBA_LOGS).filter(x=>NBA_LOGS[x].tm===tm)).filter(x=>x!==nm&&NBA_LOGS[x]).sort((a,b)=>nbaAvg(NBA_LOGS[b],"min")-nbaAvg(NBA_LOGS[a],"min")).slice(0,9);
  const cur=(NB.tmf[nm]&&typeof NB.tmf[nm]==="object")?NB.tmf[nm]:{};const inj=x=>{const i=nbaInjOf(x);return i&&/out/i.test(i[2])?' <span class="small" style="color:#ff9a9d">out tonight</span>':""};
  return `<div class="mtl">${ros.map(x=>`<div class="sitr mtr"><span title="${nbaEsc(x)}">${nbaEsc(pxLast(x))}${inj(x)}</span><div class="pxpre">${[["","Any"],["w","With"],["o","Without"]].map(([v,l])=>`<button data-mt="${nbaEsc(x)}|${v}" class="${(cur[x]||"")===v?"on":""}">${l}</button>`).join("")}</div></div>`).join("")}</div>`}
function nbaMateSel(nm){
  const tm=NBA_LOGS[nm].tm,ros=((typeof NBA_ROS!=="undefined"&&NBA_ROS[tm])||Object.keys(NBA_LOGS).filter(x=>NBA_LOGS[x].tm===tm)).filter(x=>x!==nm).slice(0,8);
  const cur=NB.tmf[nm]||"";
  return `<select class="nbmate" data-mate="${nbaEsc(nm)}"><option value="">Teammates: all games</option>${ros.map(m=>`<option value="w|${nbaEsc(m)}"${cur==="w|"+m?" selected":""}>With ${nbaEsc(m)}</option><option value="o|${nbaEsc(m)}"${cur==="o|"+m?" selected":""}>Without ${nbaEsc(m)}</option>`).join("")}</select>`;
}

/* game sets for a player: this season, last 10 (fills from last season if needed), H2H vs tonight's opponent */
function nbaSets(nm,opp){
  const p=NBA_LOGS[nm],prev=(typeof NBA_PREV!=="undefined"&&NBA_PREV[nm])||[];
  const cur=p.g.filter(nbaInR).map(x=>({x,prev:0})).filter(o=>nbaMateOK(nm,o)),pv=prev.filter(nbaInR).map(x=>({x,prev:1})).filter(o=>nbaMateOK(nm,o));
  const all=[...pv,...cur];
  return {
    l5:all.slice(-5),
    l10:all.slice(-10),
    season:cur,
    h2h:opp?all.filter(o=>o.x[2]===opp):[]
  };
}
const NBA_CMB={5:["PTS","#3987e5"],6:["REB","#16a34a"],7:["AST","#d97706"]};
function nbaChart(items,k,line,id){
  if(!items.length)return `<div class="small" style="padding:18px 0;text-align:center">No games to show.</div>`;
  const vals=items.map(o=>nbaVal(o.x,k)),mx=Math.max(line*1.35,...vals,1),H=150;
  const ly=Math.round(line/mx*H);
  const over=vals.filter(v=>pxHit(v,line)).length,avg=vals.reduce((a,b)=>a+b,0)/vals.length;
  return `<div class="nbch" style="height:${H+34}px">
    <div class="nbln" style="bottom:${ly+20}px"></div>
    ${items.map((o,i)=>{const v=vals[i],x=o.x,ok=pxHit(v,line),psh=v===line,hh=Math.max(3,Math.round(v/mx*H)),C=Array.isArray(NBA_MK[k]&&NBA_MK[k][0])?NBA_MK[k][0]:null;
      const parts=C?C.map(j=>[NBA_CMB[j][0],+x[j]||0,NBA_CMB[j][1]]):null;return `<div class="nbbar${o.prev?" pv":""}" title="${nbaEsc(x[1])} ${x[3]==="H"?"vs":"@"} ${x[2]}: ${v}${parts?" = "+parts.map(q=>q[1]+" "+q[0]).join(" + "):""}">
      <span class="v ${psh?"":ok?"h":"m"}">${v}</span>${parts?`<i class="stk ${psh?"p":ok?"h":"m"}" style="height:${hh}px">${parts.map(q=>{const sh=v?q[1]/v*hh:0;return `<em style="height:${(v?q[1]/v*100:0).toFixed(1)}%" title="${q[1]} ${q[0]}">${sh>=13?q[1]:""}</em>`}).join("")}</i>`:`<i class="${psh?"p":ok?"h":"m"}" style="height:${hh}px"></i>`}
      <span class="o">${x[3]==="H"?"":"@"}${x[2]}</span></div>`}).join("")}
  </div>
  ${Array.isArray(NBA_MK[k]&&NBA_MK[k][0])?`<div class="stkk">${NBA_MK[k][0].map(j=>`<span>${NBA_CMB[j][0]} <b>${nbaF(vals.length?items.reduce((a,o)=>a+(+o.x[j]||0),0)/items.length:0)}</b></span>`).join("")}<span class="small">average · each bar is split ${NBA_MK[k][0].map(j=>NBA_CMB[j][0]).join(" / ")} from the bottom up</span></div>`:""}
  <div class="nbsum"><b class="${over/vals.length>=.5?"up":"dn"}">${over}/${vals.length} ${pxSW()}</b> <span style="color:#f3c75a">${line}</span> · avg ${nbaF(avg)}${items.some(o=>o.prev)?` · <span class="small">faded = last season</span>`:""}</div>`;
}

/* ---------- What the opponent's defense allows (per game, ranked) — for player props ---------- */
let NBA_ALLOW=null;
function nbaAllowIdx(){
  if(NBA_ALLOW)return NBA_ALLOW;const T=Object.entries(NBA_TADV||{}).filter(([,x])=>x&&x.d);
  const val={paint:d=>d.paint,tp:d=>d.tpa*d.tp/100*3,ft:d=>d.fta*d.ft/100,reb:d=>d.reb,fb:d=>d.fb};
  const out={};for(const k in val){const L=T.map(([t,x])=>[t,val[k](x.d)]).sort((a,b)=>b[1]-a[1]);L.forEach(([t,v],i)=>{(out[t]=out[t]||{})[k]=[v,i+1,L.length]})}
  for(const [t,x] of T){out[t].tpm=x.d.tpa*x.d.tp/100;out[t].fta=x.d.fta}
  return NBA_ALLOW=out;
}
const NBA_ALLOW_REL={pts:["paint","tp","ft","fb"],pr:["paint","tp","ft","reb"],pa:["paint","tp","ft","fb"],pra:["paint","tp","ft","reb","fb"],reb:["reb"],ra:["reb"],"3pm":["tp"],"3pa":["tp"],ast:[],stl:[],blk:[]};
function nbaOppAllows(opp,k,title){
  const A=nbaAllowIdx()[opp];if(!A)return "";const rel=k?(NBA_ALLOW_REL[k]||[]):null;
  const tile=(key,lab,sub)=>{const [v,r,n]=A[key];const c=r<=8?"g":r>=n-7?"r":"";
    return `<div class="oat ${c}${rel&&rel.includes(key)?" rel":""}"><span class="l">${lab}</span><b>${nbaF(v)}</b><span class="r">${nbaOrd(r)} most${sub?` · ${sub}`:""}</span></div>`};
  return `<div class="oa"><div class="oah">${title||`What ${nbaEsc(nbaShort(opp))}${/s$/.test(nbaShort(opp))?"'":"'s"} defense allows`} <span class="small">per game · of 30 teams</span></div>
   <div class="oag">${tile("paint","Paint pts")}${tile("tp","3-pt pts",nbaF(A.tpm)+" made")}${tile("ft","Free-throw pts",nbaF(A.fta)+" FTA")}${tile("reb","Rebounds")}${tile("fb","Fast-break pts")}</div>
   <div class="small oan"><span class="lg g"></span> gives up a lot (good for overs) · <span class="lg r"></span> stingy${rel&&rel.length?" · ★ = matters most for this prop":""}</div></div>`;
}
function nbaPropCard(r,idx){
  let [nm,k,line,op,up,book]=r;const p=NBA_LOGS[nm];if(!p)return "";const main=line,alt=typeof loAltOdds!=="undefined"?loAltOdds(nm,k):null;
  if(alt){line=alt.line;op=alt.o;up=alt.u;book=alt.ob||alt.ub||""}
  const g=nbaGameOf(p.tm),opp=g?(g.a===p.tm?g.h:g.a):"";
  const S=nbaSets(nm,opp),inj=nbaInjOf(nm),pr=nbaPosRank(opp,p.pos);
  const id="pc_"+nm.replace(/[^A-Za-z0-9]/g,"")+"_"+k+((idx||0)>=100?"_p":"");
  const tab=(t,l,n)=>{const c=typeof n==="string"&&n.includes("/")?(()=>{const [a,b]=n.split("/").map(Number);return a/b>=.6?"up":a/b<=.4?"dn":""})():"";return `<button data-pct="${id}|${t}" class="${t==="l10"?"on":""}">${l}${n!=null?`<small class="${c}">${n}</small>`:""}</button>`};
  const rate=a=>{if(!a.length)return "–";const o=a.filter(z=>pxHit(nbaVal(z.x,k),line)).length;return `${o}/${a.length}`};
  return `<div class="card prop" id="${id}" data-k="${k}" data-nm="${nbaEsc(nm)}" data-line="${line}" data-opp="${opp}" data-pos="${p.p5||""}">
  <div class="pcw"><span class="pcb" style="background:${nbaCol(p.tm)};color:${xInkOn(nbaCol(p.tm))}">${p.tm}</span><div style="min-width:0"><b class="pcn"><a href="#nba-player-${encodeURIComponent(nm)}~${k}" style="color:inherit">${nbaEsc(nm)}</a></b>${nbaInjChip(inj)}${typeof newsFlag!=="undefined"?newsFlag("nba",nm):""}
    <div class="small">${p.p5||p.pos} · ${opp?(g.a===p.tm?"@ ":"vs ")+nbaEsc(nbaShort(opp)):"no game"} · ${nbaF(nbaAvg(p,"min"))} min/game</div></div></div>
  <div class="pcl noglo"><div class="pcv">${line}<small>${NBA_MK[k]?NBA_MK[k][2]:""}</small>${typeof loStep!=="undefined"?loStep(nm,k,main):""}</div>
    <div class="pcm"><b>${NBA_MK[k]?NBA_MK[k][1]:nbaEsc(k)}</b>${alt&&typeof loAltChip!=="undefined"?loAltChip(nm,k):""}<div class="pco">${op!=null?`<span class="o">Over ${oddsFmt(op)}</span>`:""}${up!=null?`<span class="u">Under ${oddsFmt(up)}</span>`:""}${book?`<span class="bk">${nbaEsc(book)}</span>`:""}</div></div></div>
  ${alt?"":nbaShopHtml(r)}${typeof loAltHtml!=="undefined"?loAltHtml(nm,k,main,nbaAllG(nm).slice(-10).map(o=>nbaVal(o.x,k))):""}
  ${nbaChanceHtml(nm,k)}
  ${alt?"":`${typeof nbaVerdict!=="undefined"?nbaVerdict(nm,k):""}${typeof nbaOddsBtns!=="undefined"?nbaOddsBtns(nm,k):""}`}${opp&&(idx||0)<100?nbaOppAllows(opp,k):""}${(idx||0)<100?nbaMateSel(nm):""}
  ${pxSideTg()}<div class="nbtabs hrt">${tab("l5","L5",rate(S.l5))}${tab("l10","L10",rate(S.l10))}${tab("season","Season",rate(S.season))}${tab("h2h","H2H",rate(S.h2h))}${opp&&p.p5?tab("dvp","vs "+p.p5):""}</div>
  <div class="nbchw">${nbaChart(S.l10,k,line)}</div>
  ${typeof xaVerdictHtml!=="undefined"?xaVerdictHtml("nba",nm,k,line):""}${typeof xaProjLine!=="undefined"?xaProjLine(nm,k,line):""}${typeof xaSitChips!=="undefined"?xaSitChips(nm,k,line):""}
  ${(idx||0)<100?`<a href="#nba-player-${encodeURIComponent(nm)}" class="gopl" data-gopl="${nbaEsc(nm)}|${k}">📊 ${nbaEsc(nm.split(" ").filter(w=>!/^(Jr\.?|Sr\.?|II|III|IV)$/.test(w)).slice(-1)[0])}'s stats &amp; all his lines →</a>`:""}
  <div class="xadeep">${opp&&p.p5?(()=>{const d=nbaDvp(opp,p.p5,k,5);if(!d.rows.length)return "";const av=d.rows.reduce((s,r)=>s+r.v,0)/d.rows.length;return `<div class="small" style="margin-top:6px">${opp} last 5: allowed ${nbaF(av)} ${NBA_MK[k][2]} a game to ${nbaPosWord(p.p5)} (NBA avg ${nbaF(d.lg)}) — <b class="${av>d.lg?"up":"dn"}">${av>d.lg?"easier":"tougher"}</b></div>`})():""}</div>
  ${typeof xaPanel!=="undefined"?xaPanel("nba",nm,k,line,PXSIDE):""}
  </div>`;
}
function nbaWireCharts(root,redraw){
  root.querySelectorAll(".nbmate").forEach(s=>s.onchange=()=>{const nm=s.dataset.mate.replace(/&amp;/g,"&").replace(/&quot;/g,'"');if(s.value)NB.tmf[nm]=s.value;else delete NB.tmf[nm];const y=window.scrollY;if(redraw)redraw();window.scrollTo(0,y)});
  root.querySelectorAll("[data-pct]").forEach(b=>b.onclick=()=>{
    const [id,t]=b.dataset.pct.split("|"),c=document.getElementById(id);if(!c)return;
    const S=nbaSets(c.dataset.nm.replace(/&amp;/g,"&").replace(/&quot;/g,'"'),c.dataset.opp);
    c.querySelector(".nbchw").innerHTML=t==="dvp"?nbaDvpChart(c.dataset.opp,c.dataset.pos,c.dataset.k):nbaChart(S[t],c.dataset.k,+c.dataset.line);
    c.querySelectorAll("[data-pct]").forEach(x=>x.classList.toggle("on",x===b));
  });
}
/* ---------- "When a star sits": teammates' numbers with vs without an Out regular ---------- */
function nbaAllG(nm){
  const p=NBA_LOGS[nm],prev=((typeof NBA_PREV!=="undefined"&&NBA_PREV[nm])||[]).filter(x=>(x[19]||[]).length);
  return [...prev.map(x=>({x,prev:1})),...(p?p.g.map(x=>({x,prev:0})):[])];
}
function nbaStarsOut(tm){
  const ros=(typeof NBA_ROS!=="undefined"&&NBA_ROS[tm])||[];
  return nbaOutNames(tm).filter(n=>{const p=NBA_LOGS[n];if(!p||p.tm!==tm||!ros.includes(n))return false;
    const g=nbaAllG(n);return g.length>=3&&g.reduce((s,o)=>s+o.x[4],0)/g.length>=22});
}
const NBA_BK=[["min",4],["pts",5],["reb",6],["ast",7],["3pm",8]];
function nbaSplit(nm,star,tm){
  const ros=(typeof NBA_ROS!=="undefined"&&NBA_ROS[tm])||[],mi=ros.indexOf(nm);
  /* last-season games only count if the two were teammates then */
  const mates=((typeof NBA_PREV!=="undefined"&&NBA_PREV[star])||[]).some(x=>(x[19]||[]).includes(mi));
  const all=nbaAllG(nm).filter(g=>!g.prev||mates),w=[],o=[];
  for(const g of all)(nbaMatePlayed(star,g,tm)?w:o).push(g.x);
  const av=a=>{const r={n:a.length};for(const [k,i] of NBA_BK)r[k]=a.length?a.reduce((s,x)=>s+(x[i]||0),0)/a.length:0;r.fn=k=>a.length?a.reduce((s,x)=>s+nbaVal(x,k),0)/a.length:0;return r};
  return {w:av(w),o:av(o)};
}
function nbaBoost(star,tm){
  const ros=((typeof NBA_ROS!=="undefined"&&NBA_ROS[tm])||[]).filter(n=>n!==star&&NBA_LOGS[n]&&NBA_LOGS[n].tm===tm&&!/out/i.test((nbaInjOf(n)||[])[2]||""));
  return ros.map(nm=>({nm,...nbaSplit(nm,star,tm)})).filter(r=>r.w.n>=2&&r.o.n>=2&&(r.w.min>=10||r.o.min>=10))
    .map(r=>({...r,d:(r.o.pts+r.o.reb+r.o.ast)-(r.w.pts+r.w.reb+r.w.ast)})).sort((a,b)=>b.d-a.d);
}
function nbaDl(a,b){const d=b-a;return Math.abs(d)<.5?`<span class="small">${nbaF(b)}</span>`:`<b class="${d>0?"up":"dn"}">${nbaF(b)}</b><span class="small"> ${d>0?"+":"−"}${nbaF(Math.abs(d))}</span>`}
function nbaBoostCard(tm,max){
  const stars=nbaStarsOut(tm);if(!stars.length)return "";
  return stars.map(s=>{
    const rows=nbaBoost(s,tm).slice(0,max||5);
    const head=`<h2 style="margin-bottom:4px">${nbaShort(tm)} without ${nbaEsc(s)}</h2><div class="small" style="margin-bottom:8px">${nbaEsc(s)} is <b style="color:#ff9a9d">out</b> tonight. How teammates did in games he missed vs games he played (this season, plus last season if they were teammates).</div>`;
    if(!rows.length)return `<div class="card bst">${head}<div class="small">Not enough games without him yet to compare.</div></div>`;
    return `<div class="card bst">${head}<div class="nbatbl"><table style="min-width:0" class="bxt"><thead><tr><th>Player</th><th>Min</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead><tbody>${rows.map(r=>
      `<tr><td>${nbaLink(r.nm)}<div class="small">${r.o.n} game${r.o.n===1?"":"s"} without${r.o.n<5?" · small sample":""}</div></td><td>${nbaDl(r.w.min,r.o.min)}</td><td>${nbaDl(r.w.pts,r.o.pts)}</td><td>${nbaDl(r.w.reb,r.o.reb)}</td><td>${nbaDl(r.w.ast,r.o.ast)}</td></tr>`).join("")}</tbody></table></div>
      <div class="small" style="margin-top:6px">Big number = average <b>without</b> him; small number = change vs games <b>with</b> him.</div></div>`}).join("");
}
/* one-line note on a prop card when a teammate star is out tonight */
function nbaBoostNote(nm,k){
  const p=NBA_LOGS[nm];if(!p)return "";
  return nbaStarsOut(p.tm).map(s=>{const r=nbaSplit(nm,s,p.tm);if(r.o.n<2||r.w.n<2)return "";
    const a=r.w.fn(k),b=r.o.fn(k),d=b-a;
    return `<div class="bstn">⚡ <b>${nbaEsc(s)} is out.</b> Without him: <b class="${d>=0?"up":"dn"}">${nbaF(b)}</b> ${NBA_MK[k][2]} in ${r.o.n} game${r.o.n===1?"":"s"} vs ${nbaF(a)} with him${r.o.n<5?" (small sample)":""}.</div>`}).join("");
}

/* ---------- Best props tonight: every posted line, both sides, ranked ---------- */
/* score one side of one line (shared by the ranking and the locked plays) */
function nbaLastNm(n){const w=String(n).split(" ");return /^(Jr\.?|Sr\.?|II|III|IV|V)$/i.test(w[w.length-1])&&w.length>1?w[w.length-2]:w[w.length-1]}
/* share of this season's games with a similar closing spread (±2) that were decided by 15+ points (needs 15+ games) */
let NBA_BLOWC={};function nbaBlowP(spA){const key=Math.round(spA);if(key in NBA_BLOWC)return NBA_BLOWC[key];const S=typeof NBA_SPR!=="undefined"?Object.values(NBA_SPR):[];
  const L=S.filter(x=>x[3]!=null&&x[5]!=null&&Math.abs(Math.abs(x[3])-spA)<=2);return NBA_BLOWC[key]=L.length>=15?L.filter(x=>Math.abs(x[5]-x[6])>=15).length/L.length:null}
/* his minutes in blowouts (decided by 15+) vs other games this season — needs 2+ blowouts and 3+ others */
function nbaBlowMin(p){const M={};for(const r of NBA_RES)M[r[0]]=Math.abs(r[4]-r[5]);const b=p.g.filter(x=>M[x[0]]>=15),c=p.g.filter(x=>M[x[0]]!=null&&M[x[0]]<15);if(b.length<2||c.length<3)return null;
  const a=z=>z.reduce((t,x)=>t+x[4],0)/z.length;return Math.max(.5,Math.min(1.1,a(b)/a(c)))}
function nbaEval(nm,k,line,side,odds,book,oppIn){
  const p=NBA_LOGS[nm];if(!p||!NBA_MK[k]||odds==null)return null;
  const g=nbaGameOf(p.tm),opp=oppIn||(g?(g.a===p.tm?g.h:g.a):"");
  const all=nbaAllG(nm),l10=all.slice(-10),l5=all.slice(-5),ss=all.filter(o=>!o.prev),h2=all.filter(o=>o.x[2]===opp);
  if(!l10.length)return null;
  let dv=null;if(p.p5&&opp){const d=nbaDvp(opp,p.p5,k,5);if(d.rows.length>=3&&d.lg>0)dv=(d.rows.reduce((s,x)=>s+x.v,0)/d.rows.length)/d.lg-1}
  const hit=a=>a.filter(o=>side==="o"?nbaVal(o.x,k)>line:nbaVal(o.x,k)<line).length;
  const r10=hit(l10)/l10.length,rS=ss.length>=3?hit(ss)/ss.length:r10,rH=h2.length>=2?hit(h2)/h2.length:r10;
  const raw=.45*r10+.35*rS+.2*rH;
  const dvOk=dv==null?null:(side==="o"?dv>.08:dv<-.08)?1:(side==="o"?dv<-.08:dv>.08)?-1:0;
  const be=nbaImpl(odds);
  /* calibrated chance (Nov 2026): raw hit rates were far too confident (top props "92%" won 4 of 10) because the books
     already price streaks in. Start from the market's fair chance (vig removed, both sides of the same line) and move
     toward the player's hit rates only part of the way — more with more games behind them. */
  const row=NBA_PROPS.find(r=>r[0]===nm&&r[1]===k&&r[2]===line&&r[3]!=null&&r[4]!=null);
  let fair=row?(()=>{const io=nbaImpl(row[3]),iu=nbaImpl(row[4]);return side==="o"?io/(io+iu):iu/(io+iu)})():be/1.045;
  const nEff=Math.min(25,l10.length+.5*ss.length),w=.4*nEff/(nEff+10)*(typeof xCalK!=="undefined"?xCalK("nba"):1);   /* × what the record says (xsport.js) */
  let sc=fair+w*(raw-fair)+(dvOk?.02*dvOk:0);
  /* usage bump (Nov 2026): key teammates out tonight -> his hit rate in this season's games without them, blended in by sample size */
  let bump=null;try{const so=nbaStarsOut(p.tm).filter(n=>n!==nm);if(so.length){const outIds=so.map(n=>new Set((NBA_LOGS[n]||{g:[]}).g.map(x=>x[0]))),TG=new Set(NBA_RES.filter(r=>r[2]===p.tm||r[3]===p.tm).map(r=>r[0]));
    const wo=p.g.filter(x=>TG.has(x[0])&&outIds.every(S=>!S.has(x[0])));if(wo.length>=3){const rW=hit(wo.map(x=>({x})))/wo.length,ww=.35*wo.length/(wo.length+5);sc+=Math.max(-.06,Math.min(.06,ww*(rW-r10)));
      bump={who:so,n:wo.length,rW,avg:wo.reduce((t,x)=>t+nbaVal(x,k),0)/wo.length,base:p.g.reduce((t,x)=>t+nbaVal(x,k),0)/p.g.length}}}}catch(e){}
  /* blowout risk (Nov 2026): big spread -> chance the game is decided by 15+ (this season's games with a similar closing spread)
     × how much his minutes drop in blowouts (his own games) -> his last 10 re-scored at the reduced minutes */
  let blow=null;try{const Lg=g&&nbaL(g),spA=Lg?Math.abs(Lg.sp):0,mn=nbaAvg(p,"min");
    if(spA>=9&&mn>=24&&NBA_MK[k]&&!["stl","blk"].includes(k)){const pB=nbaBlowP(spA),r=nbaBlowMin(p);
      if(pB!=null&&r!=null&&r<.97){const f=pB*(1-r),r10s=l10.filter(o=>{const v=nbaVal(o.x,k)*(1-f);return side==="o"?v>line:v<line}).length/l10.length,d=Math.max(-.06,Math.min(.06,.4*(r10s-r10)));sc+=d;blow={pB,r,f,d}}}}catch(e){}
  sc=Math.max(.03,Math.min(.9,sc));
  return {nm,k,line,side,odds,book,p,opp,g,sc,raw,fair,be,edge:sc-be,dvOk,n10:l10.length,bump,blow,
    c3:[hit(l10.slice(-3)),l10.slice(-3).length],c5:[hit(l5),l5.length],c10:[hit(l10),l10.length],cS:[hit(ss),ss.length],cH:[hit(h2),h2.length],
    id:"pc_"+nm.replace(/[^A-Za-z0-9]/g,"")+"_"+k};
}
/* line shopping: best price at the same line across books (extra columns in nba_props.txt) */
function nbaBestPrice(r,side){const o=side==="o"?r[6]:r[8],b=side==="o"?r[7]:r[9],main=side==="o"?r[3]:r[4];if(o==null)return null;if(main!=null&&(o<=main||b===r[5]))return null;return [o,b]}
function nbaPayout(o){return o==null?0:o>0?o/100:100/-o}
function nbaShopHtml(r){
  const bo=nbaBestPrice(r,"o"),bu=nbaBestPrice(r,"u");if(!bo&&!bu)return "";
  const save=(best,main)=>main==null?"":` <span class="up">+${Math.round((nbaPayout(best)-nbaPayout(main))*100)}¢ per $1</span>`;
  return `<div class="shop">🛒 <b>Best price</b> ${bo?`<b>O ${oddsFmt(bo[0])}</b> ${nbaEsc(bo[1])}${save(bo[0],r[3])}`:""}${bo&&bu?" · ":""}${bu?`<b>U ${oddsFmt(bu[0])}</b> ${nbaEsc(bu[1])}${save(bu[0],r[4])}`:""}</div>`;
}
/* Nov 12 2026 review of our tracked record: steals/blocks (0-4), lines of 2.5 or less (4-10), long shots and picks under
   a 52% chance lost almost all the money — those aren't ranked any more (they still show in the full props list) */
function nbaQualOk(e){return !["stl","blk"].includes(e.k)&&e.line>2.5&&e.odds<=150&&e.sc>=.52}
function nbaBest(){
  const ck=NB.mlo+"|"+NB.mhi+"|"+JSON.stringify(NB.gf)+"|"+startedKey();if(NB._best&&NB._best.v===ck)return NB._best.L;
  const out=[];
  for(const r of NBA_PROPS){
    const [nm,k,line,op,up,book]=r,p=NBA_LOGS[nm];if(!p||!NBA_MK[k])continue;
    const g=nbaGameOf(p.tm);if(!g||nbaStarted(g)||/out/i.test((nbaInjOf(nm)||[])[2]||""))continue;
    for(const side of ["o","u"]){const bs=nbaBestPrice(r,side),e=nbaEval(nm,k,line,side,bs?bs[0]:(side==="o"?op:up),bs?bs[1]:book);if(e&&e.n10>=5&&nbaQualOk(e))out.push(e)}
  }
  const seen=new Set(),per={},top=[],rest=[];
  for(const x of out.sort((a,b)=>b.edge-a.edge)){const key=x.nm+"|"+x.k;if(seen.has(key)||x.edge<=0)continue;seen.add(key);per[x.nm]=(per[x.nm]||0)+1;(per[x.nm]<=2?top:rest).push(x)}
  const L=top.concat(rest);NB._best={v:ck,L};return L;
}
function nbaBestRow(b,i){const mk=NBA_MK[b.k][1];
  return xPropRow({i,attrs:`data-bp="${b.k}|${b.id}" data-nm="${nbaEsc(b.nm)}"`,badge:nbaBadge(b.p.tm),name:nbaEsc(b.nm),sub:`${b.g.a===b.p.tm?"@":"vs"} ${b.opp}`,
    chips:nbaInjChip(nbaInjOf(b.nm))+(typeof newsFlag!=="undefined"?newsFlag("nba",b.nm):"")+(b.c5[1]>=5&&b.c5[0]>=4?`<span class="bfire">🔥 ${b.c5[0]}/${b.c5[1]}</span>`:"")+(typeof xaChips!=="undefined"?xaChips("nba",b.nm,b.k,b.side):"")+(b.bump?`<span class="pll o" title="This season without ${nbaEsc(b.bump.who.join(", "))}: ${b.bump.avg.toFixed(1)} a game in ${b.bump.n} games (season ${b.bump.base.toFixed(1)})">📈 without ${nbaEsc(b.bump.who.map(nbaLastNm).join(", "))}</span>`:"")+(b.blow?`<span class="pll u" title="${Math.round(b.blow.pB*100)}% of games with this spread were blowouts; his minutes drop to ${Math.round(b.blow.r*100)}% in those">📉 blowout risk</span>`:""),
    pick:`${b.side==="o"?"Over":"Under"} ${b.line} ${mk}`,odds:oddsFmt(b.odds),book:b.book?nbaEsc(b.book):"",l10:b.c10[1]?b.c10:b.c5,
    hits:[b.cS[1]>=3&&[b.cS[0],b.cS[1],"this season"],b.cH[1]&&[b.cH[0],b.cH[1],"vs "+b.opp]],why:b.dvOk===1?"matchup helps":b.dvOk===-1?"tough matchup":"",
    chance:Math.round(b.sc*100),need:Math.round(b.be*100),act:typeof actBtn!=="undefined"?actBtn(nbaSpec(b.nm,b.k,b.side==="o"?"over":"under"),"＋","plus"):""})}
function nbaBestCard(n,more){
  const L=nbaBest(),top=L.slice(0,n);
  if(!NBA_PROPS.length||!top.length)return "";
  return `<div class="card bpc"><h2 style="margin-bottom:2px">🔥 Best props tonight</h2>
  <div class="small" style="margin-bottom:8px">Every posted line, over and under, ranked by how often it would have hit vs what the odds need. Tap one for charts.</div>
  ${top.map(nbaBestRow).join("")}
  ${more&&L.length>n?`<a href="#nba-props" class="small" style="display:block;text-align:center;margin-top:8px;color:var(--text2)">See all ${L.length} →</a>`:""}
  <div class="small" style="margin-top:8px">Hit score blends last 10 (45%), this season (35%) and vs tonight's opponent (20%), ±5 for the position matchup. A lean, not a guarantee.</div></div>`;
}
/* clicking a best prop / play / card button opens the player's page, scrolled to that line */
function nbaUnesc(s){return s.replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}
function nbaGoPlayer(nm,k){NB.pmk=k;NB.goto="pc_"+nm.replace(/[^A-Za-z0-9]/g,"")+"_"+k+"_p";NB.from=location.hash.replace("#","")||"nba";location.hash="nba-player-"+encodeURIComponent(nm)}
function nbaWireBest(root){
  root.querySelectorAll("[data-shimg=nba]").forEach(b=>b.onclick=e=>{e.stopPropagation();shareNbaPlays()});
  root.querySelectorAll("[data-bp]").forEach(b=>b.onclick=()=>nbaGoPlayer(nbaUnesc(b.dataset.nm),b.dataset.bp.split("|")[0]));
  root.querySelectorAll("[data-gopl]").forEach(b=>b.onclick=e=>{e.preventDefault();const v=nbaUnesc(b.dataset.gopl),i=v.lastIndexOf("|");nbaGoPlayer(v.slice(0,i),v.slice(i+1))});
}
/* plays of the day: the 2-3 strongest leans from the ranking, with stricter rules */
function nbaPlays(){
  const out=[],games=new Set(),used=new Set();
  const ok=b=>b.c10[0]>=7&&b.edge>=.07&&b.odds>=-200&&b.odds<=150&&!/day|quest|doubt|out/i.test((nbaInjOf(b.nm)||[])[2]||"")&&b.cS[1]>=3&&b.cS[0]/b.cS[1]>=.6;
  /* second tier (Nov 11 2026) so a full slate always has a play of the day: 6+ of the last 10, 55%+ this season, a 4-point edge */
  const ok2=b=>b.c10[0]>=6&&b.edge>=.04&&b.odds>=-200&&b.odds<=150&&!/day|quest|doubt|out/i.test((nbaInjOf(b.nm)||[])[2]||"")&&b.cS[1]>=3&&b.cS[0]/b.cS[1]>=.55;
  const B=nbaBest();let L=B.filter(ok);if(!L.length)L=B.filter(ok2);
  for(const pass of [0,1])for(const b of L){if(out.length>=3)break;if(used.has(b.nm))continue;if(!pass&&games.has(b.g.id))continue;out.push(b);used.add(b.nm);games.add(b.g.id)}
  return out;
}
const NBA_PL=(typeof NBA_PLAYLOG!=="undefined"&&NBA_PLAYLOG)||[];
/* today's plays: the locked list if it exists (what the record counts), else the live pick */
function nbaTodayPlays(){
  const lk=NBA_PL.filter(r=>r[0]===NBA_SLATE_DATE);
  if(!lk.length)return {P:nbaPlays(),locked:false};
  return {locked:true,P:lk.map(r=>nbaEval(r[1],r[2],r[4],r[3],r[5],r[6],r[8])).filter(Boolean)};
}
function nbaGradeOne(r){
  const [d,nm,k,side,line,odds,book,tm,opp]=r,p=NBA_LOGS[nm];
  const x=p&&p.g.find(y=>y[1]===d&&(!opp||y[2]===opp));
  if(!x){const done=NBA_RES.some(z=>z[1]===d&&(z[2]===tm||z[3]===tm));return {st:done?"void":"pending"}}
  const v=nbaVal(x,k),st=v===line?"push":(side==="o"?v>line:v<line)?"win":"loss";
  const u=st==="win"?(odds>0?odds/100:100/-odds):st==="loss"?-1:0;
  return {st,v,u};
}
function nbaRecord(){
  const rows=NBA_PL.map(r=>({r,...nbaGradeOne(r)}));
  const t={win:0,loss:0,push:0,void:0,pending:0,u:0};for(const x of rows){t[x.st]++;t.u+=x.u||0}
  return {rows,t};
}
function nbaRecordCard(full){
  const {rows,t}=nbaRecord(),g=t.win+t.loss;
  const done=rows.filter(x=>x.st!=="pending").reverse(),pend=rows.filter(x=>x.st==="pending");
  const chip={win:["W","o"],loss:["L","u"],push:["P","p"],void:["Void","p"],pending:["Live","p"]};
  const row=x=>{const [d,nm,k,side,line,odds,book]=x.r;return `<div class="rcr"><span class="lc ${chip[x.st][1]} rcc">${chip[x.st][0]}</span><div style="flex:1;min-width:0"><b>${nbaEsc(nm)}</b> ${side==="o"?"Over":"Under"} ${line} ${NBA_MK[k]?NBA_MK[k][2]:k} <span class="small">${oddsFmt(odds)}</span><div class="small">${nbaDayS(d)}${x.v!=null?` · finished with <b>${x.v}</b>`:x.st==="void"?" · did not play (bet voided)":""}</div></div><span class="${(x.u||0)>0?"up":(x.u||0)<0?"dn":"small"}">${x.st==="pending"?"":(x.u>0?"+":"")+(x.u||0).toFixed(2)+"u"}</span></div>`};
  return `<div class="card rec"><h2 style="margin-bottom:4px">📒 Plays of the day record</h2>
  <div class="recs"><div><b>${t.win}-${t.loss}${t.push?"-"+t.push:""}</b>Record</div><div><b class="${t.u>0?"up":t.u<0?"dn":""}">${t.u>0?"+":""}${t.u.toFixed(2)}u</b>Units (1u a play)</div><div><b>${g?Math.round(t.win/g*100)+"%":"–"}</b>Hit rate</div></div>
  ${!done.length?`<div class="small" style="margin-top:8px">Tracking started ${NBA_PL.length?nbaDayS(NBA_PL[0][0]):"today"}. ${pend.length?`${pend.length} play${pend.length>1?"s":""} pending — results post the morning after the games.`:""}</div>`:""}
  ${(full?done:done.slice(0,6)).map(row).join("")}
  <a href="#record" class="small" style="display:block;text-align:center;margin-top:8px;color:var(--text2)">📒 Full record (NFL + NBA) →</a>
  <div class="small" style="margin-top:8px">Every play is locked before tip-off and graded from the official box score. Wins pay the posted odds; losses cost 1 unit. A player who doesn't play = void.</div></div>`;
}
function nbaPlaysCard(){
  const TP=nbaTodayPlays(),P=TP.P;
  if(!NBA_PROPS.length)return `<div class="card potd"><h2>⭐ Plays of the day</h2><div class="small">Posted once sportsbooks put up today's player lines (usually by late morning ET).</div></div>`;
  if(!P.length)return `<div class="card potd"><h2>⭐ Plays of the day</h2><div class="small">No line passes our filters today — sometimes the best play is no play.</div></div>`;
  return `<div class="card potd"><h2 style="margin-bottom:2px">⭐ Plays of the day</h2><div class="small" style="margin-bottom:6px">Our ${P.length} strongest leans for ${nbaDayS(NBA_SLATE_DATE)}${TP.locked?" · 🔒 locked, counted in the record":""}. Tap one for his full stats.</div>
  ${P.map((b,i)=>{
    const why=`${b.side==="o"?"Over":"Under"} in ${b.c10[0]} of his last ${b.c10[1]}`+(b.cS[1]?`, ${b.cS[0]}/${b.cS[1]} this season`:"")+(b.cH[1]?`, ${b.cH[0]}/${b.cH[1]} vs ${b.opp}`:"")+(b.dvOk===1?`; the matchup at his position helps`:"")+".";
    return `<div class="pod" data-bp="${b.k}|${b.id}" data-nm="${nbaEsc(b.nm)}"><div class="podn">${i+1}</div><div style="min-width:0;flex:1">
      <div><b>${nbaEsc(b.nm)}</b> <span class="small">${b.p.tm} ${b.g.a===b.p.tm?"@":"vs"} ${b.opp} · ${b.g.t} ET</span></div>
      <div class="bpl"><b class="xpk">${b.side==="o"?"Over":"Under"} ${b.line}</b> ${NBA_MK[b.k][1]} <span class="small">${oddsFmt(b.odds)}${b.book?" · "+nbaEsc(b.book):""}</span></div>
      <div class="small">${why}</div></div><div class="bps"><b>${Math.round(b.sc*100)}%</b><span>our chance</span>${typeof actBtn!=="undefined"?actBtn(nbaSpec(b.nm,b.k,b.side==="o"?"over":"under"),"＋","plus"):""}</div></div>`}).join("")}
  <button class="btn shbtn" data-shimg="nba">📤 Share today's plays</button>
  <div class="small" style="margin-top:8px">Picked automatically from real posted lines: 7+ of last 10, a winning record this season, a clear edge over what the odds need, no injury tag, odds no worse than −200. Leans, not guarantees — bet small.</div></div>`;
}
function nbaPropTabs(on){return `<div class="seg ptabs"><a class="${on==="best"?"on":""}" href="#nba-best">🔥 Best tonight</a><a class="${on==="all"?"on":""}" href="#nba-props">All props</a></div>`}
function nbaBestFilter(L){const f=NB.bf||{};return L.filter(b=>(!f.g||String(b.g.id)===f.g)&&(!f.m||b.k===f.m)&&(!f.s||b.side===f.s)&&(!f.min||b.sc>=f.min/100)&&nbaHotOk(b,f.hot))}
/* hot streak: hit this side in X of his last 5 / 10 */
/* shared by NBA / NFL / NHL best-props filters: b.c3 / c5 / c10 = [hits, games] */
const HOT_OPTS=[["3/3","🔥 Hit 3 of last 3"],["4/5","🔥 Hit 4+ of last 5"],["5/5","🔥 Hit 5 of last 5"],["7/10","🔥 Hit 7+ of last 10"],["8/10","🔥 Hit 8+ of last 10"],["10/10","🔥 Hit 10 of last 10"],["c0/3","🧊 Missed last 3"],["c1/5","🧊 Hit 1 or 0 of last 5"]];
function hotOk(b,h){if(!h)return true;const cold=h[0]==="c",[n,of]=h.replace("c","").split('/').map(Number),c=b["c"+of];if(!c||c[1]<of)return false;return cold?c[0]<=n:c[0]>=n}
function hotSelect(attr,cur){return `<select ${attr}><option value="">Any streak</option>${HOT_OPTS.map(([v,n])=>`<option value="${v}"${cur===v?" selected":""}>${n}</option>`).join("")}</select>`}
function nbaHotOk(b,h){return hotOk(b,h)}
function nbaBestFilterUI(L0){const f=NB.bf||(NB.bf={});const games=NBA_SLATE.filter(g=>!nbaStarted(g));const mks=[...new Set(L0.map(b=>b.k))];
  return `<div class="bfil"><select data-bf="g"><option value="">All games</option>${games.map(g=>`<option value="${g.id}"${f.g==String(g.id)?" selected":""}>${g.a} @ ${g.h}</option>`).join("")}</select>
   <select data-bf="m"><option value="">All markets</option>${mks.map(m=>`<option value="${m}"${f.m===m?" selected":""}>${NBA_MK[m][1]}</option>`).join("")}</select>
   <select data-bf="s"><option value="">Overs & unders</option><option value="o"${f.s==="o"?" selected":""}>Overs only</option><option value="u"${f.s==="u"?" selected":""}>Unders only</option></select>
   <select data-bf="min"><option value="">Any chance</option>${[60,70,80].map(v=>`<option value="${v}"${f.min==v?" selected":""}>${v}%+ our chance</option>`).join("")}</select>
   ${hotSelect('data-bf="hot"',f.hot)}${typeof xResetChip!=="undefined"?xResetChip("nba"):""}</div>`}
function nbaBestPage(el){
  const L0=nbaBest(),L=nbaBestFilter(L0);
  el.innerHTML=`<h1>NBA Best Props · ${nbaDayS(NBA_SLATE_DATE)}</h1>${nbaPropTabs("best")}
  ${L0.length?`<div class="card bpc" style="margin-top:14px"><h2 style="margin-bottom:2px">🔥 Every line, ranked</h2>
    <div class="small" style="margin-bottom:8px">Not ranked (they lost money in our tracking): steals, blocks, lines of 2.5 or less, long shots over +150.</div><div class="small" style="margin-bottom:8px">${L.length} of ${L0.length} posted lines with an edge, over or under, ranked by how often they would have hit vs what the odds need. Tap one for the player's stats and charts.</div>
    ${nbaBestFilterUI(L0)}${L.length?"":`<div class="small" style="padding:8px 0">Nothing matches these filters.</div>`}
    ${L.map(nbaBestRow).join("")}
    <div class="small" style="margin-top:8px">Hit score blends last 10 (45%), this season (35%) and vs tonight's opponent (20%), ±5 for the position matchup. A lean, not a guarantee.</div></div>`
   :`<div class="card" style="margin-top:14px">${NBA_PROPS.length&&NBA_SLATE.length&&NBA_SLATE.every(nbaStarted)?"🔒 Every game today has started — pregame lines are closed. New lines come out tomorrow morning.":NBA_PROPS.length?"No open line shows an edge right now.":"Today's prop lines aren't out yet — books post them in the morning."}</div>`}`;
  el.insertAdjacentHTML("beforeend",`<details class="tmore" style="margin-top:12px"><summary>Plays of the day &amp; our record</summary>${nbaPlaysCard()}<div style="margin-top:12px">${nbaRecordCard(1)}</div></details>`);
  if(typeof xaYesCard!=="undefined"){const h=xaYesCard(null);if(h)el.insertAdjacentHTML("beforeend",h)}
  nbaWireBest(el);
  el.querySelectorAll("[data-bf]").forEach(s=>s.onchange=()=>{NB.bf[s.dataset.bf]=s.value;const y=window.scrollY;nbaBestPage(el);window.scrollTo(0,y)});
}

function nbaProps(el){
  const k=NB.mk||(NB.mk="pts");
  const tonight=NBA_SLATE.flatMap(g=>[g.a,g.h]);
  const openP=r=>{const p=NBA_LOGS[r[0]],g=p&&nbaGameOf(p.tm);return g&&!nbaStarted(g)};
  const hidden=NBA_PROPS.filter(r=>{const p=NBA_LOGS[r[0]],g=p&&nbaGameOf(p.tm);return g&&nbaStarted(g)}).length;
  const props=NBA_PROPS.filter(r=>r[1]===k&&NBA_LOGS[r[0]]&&openP(r));
  if(!NB.ps){const v=(typeof LS!=="undefined"&&LS.get("nbaPS"))||["hi","l10"];NB.ps=v[0];NB.pb=v[1]}
  const rt=r=>{const p=NBA_LOGS[r[0]],g=nbaGameOf(p.tm),opp=g?(g.a===p.tm?g.h:g.a):"",a=nbaSets(r[0],opp)[NB.pb]||[];return a.length?a.filter(z=>nbaVal(z.x,r[1])>r[2]).length/a.length:-1};
  props.forEach(r=>r._rt=rt(r));
  props.sort((a,b)=>(a._rt<0)-(b._rt<0)||(NB.ps==="lo"?a._rt-b._rt:b._rt-a._rt));
  const cnt=m=>NBA_PROPS.filter(r=>r[1]===m&&NBA_LOGS[r[0]]&&openP(r)).length;
  const list=Object.entries(NBA_LOGS).filter(([nm,p])=>tonight.includes(p.tm)&&nbaAvg(p,"min",5)>=18&&!/out/i.test((nbaInjOf(nm)||[])[2]||"")).sort((a,b)=>nbaAvg(b[1],k)-nbaAvg(a[1],k));
  const lbl=NBA_MK[k][1];
  el.innerHTML=`<h1>NBA Props · ${nbaDayS(NBA_SLATE_DATE)}</h1>
  ${nbaPropTabs("all")}
  ${hidden?`<div class="info"><span>🔒 ${hidden} line${hidden>1?"s":""} hidden — ${hidden>1?"those games have":"that game has"} started, so pregame lines are closed.</span></div>`:""}
  <select id="nbaMk" style="width:100%;max-width:340px;font-size:16px;padding:10px 12px;margin-bottom:10px">${Object.entries(NBA_MK).map(([m,v])=>`<option value="${m}">${v[1]}${cnt(m)?` (${cnt(m)} lines)`:""}</option>`).join("")}</select>
  ${nbaMinUI("nbaMinP")}
  ${props.length?`<div class="nbsort"><span class="small">Sort by over hit rate</span>
    <div class="seg">${[["hi","High → low"],["lo","Low → high"]].map(([v,l])=>`<button class="btn${NB.ps===v?" on":""}" data-ps="${v}">${l}</button>`).join("")}</div>
    <select id="nbaPB">${[["l5","Last 5"],["l10","Last 10"],["season","This season"],["h2h","vs opponent"]].map(([v,l])=>`<option value="${v}"${NB.pb===v?" selected":""}>${l}</option>`).join("")}</select></div>
  <p class="sub">How often each player went over today's line. ${NB.ps==="lo"?"Lowest over rates first — those lean under.":"Highest over rates first."}</p><div class="grid g2" id="nbaPGrid">${props.slice(0,typeof uxMoreN!=="undefined"?uxMoreN("nbap|"+k,props.length,20):props.length).map((r,i)=>nbaPropCard(r,i)).join("")}</div>`
   :`<p class="sub">${NBA_PROPS.length&&NBA_SLATE.length&&NBA_SLATE.every(nbaStarted)?"Every game today has started — pregame lines are closed. New lines come out tomorrow morning.":NBA_PROPS.length?`No ${lbl.toLowerCase()} lines open right now.`:"Today's prop lines aren't out yet — books post them in the morning."} Here's how tonight's players have been doing.</p>`}

  <div class="card" style="margin-top:14px"><h2>${lbl} · playing tonight</h2>${nbaMinOn()?`<div class="small" style="margin:-6px 0 8px">Filtered: ${nbaFiltTxt()}.</div>`:""}
  <div class="nbatbl"><table style="min-width:0"><thead><tr><th>Player</th><th>Min</th><th>Season</th><th>Last 5</th><th>Best</th></tr></thead><tbody>${list.map(([nm,p])=>{
    const q={g:p.g.filter(nbaInR)};if(!q.g.length)return "";const s=nbaAvg(q,k),l5=nbaAvg(q,k,5),d=l5-s,hi=Math.max(...q.g.map(x=>nbaVal(x,k)));
    return `<tr><td>${nbaLink(nm)} <span class="small">${p.tm}</span>${nbaInjChip(nbaInjOf(nm))}</td><td>${nbaF(nbaAvg(p,"min"))}</td><td><b>${nbaF(s)}</b></td><td class="${Math.abs(d)<Math.max(1,s*.15)?"":d>0?"up":"dn"}">${nbaF(l5)}</td><td>${hi}</td></tr>`}).join("")}</tbody></table></div></div>`;
  const sel=document.getElementById("nbaMk");sel.value=k;sel.onchange=()=>{NB.mk=sel.value;nbaProps(el)};nbaWireCharts(el,()=>nbaProps(el));nbaWireMin(el,()=>nbaProps(el));
  nbaWireBest(el);
  if(typeof uxMoreAttach!=="undefined")uxMoreAttach(document.getElementById("nbaPGrid"),props,uxMoreN("nbap|"+k,props.length,20),(r,i)=>nbaPropCard(r,i),w=>{nbaWireCharts(w,()=>nbaProps(el));nbaWireBest(w)},"nbap|"+k,20);
  const saveS=()=>{try{LS.set("nbaPS",[NB.ps,NB.pb])}catch(e){}const y=window.scrollY;nbaProps(el);window.scrollTo(0,y)};
  el.querySelectorAll("[data-ps]").forEach(b=>b.onclick=()=>{NB.ps=b.dataset.ps;saveS()});
  const pb=document.getElementById("nbaPB");if(pb)pb.onchange=()=>{NB.pb=pb.value;saveS()};
}

/* ---------- Player stats list ---------- */
function nbaPlayers(el){
  const teams=Object.keys(NBA_TEAMS).sort();
  const tonight=NBA_SLATE.flatMap(g=>[g.a,g.h]);
  const draw=()=>{
    const q=NB.q.toLowerCase();
    let list=Object.entries(NBA_LOGS).filter(([nm,p])=>(NB.team==="all"||(NB.team==="tonight"?tonight.includes(p.tm):p.tm===NB.team))&&(!q||nm.toLowerCase().includes(q)));
    if(!q&&NB.team!=="all"&&NB.team!=="tonight")list=list.filter(([,p])=>p.g.length);
    if(NB.team==="all"&&!q)list=list.filter(([,p])=>nbaAvg(p,"min")>=15);
    list.sort((a,b)=>NB.sort==="min"?nbaAvg(b[1],"min")-nbaAvg(a[1],"min"):nbaAvg(b[1],NB.sort)-nbaAvg(a[1],NB.sort));
    const sk=NB.sort,lbl={pts:"Points",reb:"Rebounds",ast:"Assists","3pm":"3-pointers made",min:"Minutes"}[sk];
    const top=list.filter(([nm,p])=>p.g.length>=2&&!(NB.team==="tonight"&&/out/i.test((nbaInjOf(nm)||[])[2]||""))).slice(0,8),mx=Math.max(1,...top.map(([,p])=>nbaAvg(p,sk)));
    document.getElementById("nbaTop").innerHTML=top.length?`<h2>Leaders · ${lbl} per game</h2>${top.map(([nm,p])=>{const v=nbaAvg(p,sk);return `<a class="hbar" href="#nba-player-${encodeURIComponent(nm)}"><span class="hbn">${nbaBadge(p.tm)} ${nbaEsc(nm)}</span><span class="hbt"><i style="width:${Math.round(v/mx*100)}%;background:${nbaCol(p.tm)}"></i></span><b>${nbaF(v)}</b></a>`}).join("")}`:"";
    document.getElementById("nbaPl").innerHTML=list.length?nbaPlayerTable(list.slice(0,150),{tm:true}):`<div class="small">No players found.</div>`;
  };
  el.innerHTML=`<h1>NBA Players</h1><p class="sub">Search any player, tap a name to see every game.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
    <input id="nbaQ" type="search" placeholder="Search player" value="${nbaEsc(NB.q)}" style="flex:1;min-width:160px">
    <select id="nbaT"><option value="tonight">Playing today</option><option value="all">All teams</option>${teams.map(t=>`<option value="${t}">${nbaTm(t)}</option>`).join("")}</select>
    <select id="nbaS">${[["pts","Sort: Points"],["reb","Rebounds"],["ast","Assists"],["3pm","3-Pointers"],["min","Minutes"]].map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select>
  </div><div class="card" id="nbaTop" style="margin-bottom:14px"></div><div class="card" id="nbaPl"></div>`;
  const T=document.getElementById("nbaT"),S=document.getElementById("nbaS"),Q=document.getElementById("nbaQ");
  T.value=NB.team;S.value=NB.sort;
  T.onchange=()=>{NB.team=T.value;draw()};S.onchange=()=>{NB.sort=S.value;draw()};Q.oninput=()=>{NB.q=Q.value;if(NB.q)NB.team="all",T.value="all";draw()};
  draw();
}

/* ---------- Player page ---------- */
/* ---------- Shot zone court (hot / cold vs NBA average) ---------- */
let NBA_ZGRID=null;
function nbaZoneOf(x,y){ // same zones as tools/nbagen.mjs; x 0-50, y feet from rim line (rim ≈ y 0.75)
  const dx=x-25,dy=y-0.75,d=Math.sqrt(dx*dx+dy*dy);
  const three=(y<9&&Math.abs(dx)>=22)||(y>=9&&d>=23.75);
  if(three){if(y<9)return dx<0?5:6;const a=Math.atan2(dx,dy)*180/Math.PI;return a<-22?7:a>22?9:8}
  if(d<4)return 0;if(Math.abs(dx)<8&&y<14.5)return 1;
  const a=Math.atan2(dx,dy)*180/Math.PI;return a<-30?2:a>30?4:3;
}
function nbaZoneGrid(){
  if(NBA_ZGRID)return NBA_ZGRID;const cells=[],st=.25;
  // rows of 0.25 ft, merged into runs of the same zone -> [x, y, width, zone]
  for(let gy=-4.5;gy<42;gy+=st){let x0=0,z0=nbaZoneOf(st/2,gy+st/2);
    for(let gx=st;gx<=50;gx+=st){const z=gx<50?nbaZoneOf(gx+st/2,gy+st/2):-1;if(z!==z0){cells.push([x0,gy,gx-x0,z0]);x0=gx;z0=z}}}
  return NBA_ZGRID={cells,st};
}
/* the 10 shot zones drawn as smooth vector shapes (same boundaries as nbaZoneOf): painted back to front — 3-point wedges, corners,
   then the inside-the-arc area (mid-range wedges), the paint and the restricted area */
function nbaZoneShapes(X,Y,sc,col){const cx=25,cy=.75,R=90,P=(x,y)=>`${X(x).toFixed(1)},${Y(y).toFixed(1)}`;
  const wedge=(a1,a2)=>{const pts=[P(cx,cy)];for(let a=a1;;a=Math.min(a2,a+5)){const r=a*Math.PI/180;pts.push(P(cx+R*Math.sin(r),cy+R*Math.cos(r)));if(a>=a2)break}return pts.join(" ")};
  const r3=23.75,ang=Math.asin(22/r3),yA=cy+r3*Math.cos(ang);
  const arc=`M ${P(3,-4.5)} L ${P(3,yA)} A ${(r3*sc).toFixed(1)} ${(r3*sc).toFixed(1)} 0 0 0 ${P(47,yA)} L ${P(47,-4.5)} Z`;
  return `<defs><clipPath id="nbcrt"><rect x="0" y="0" width="${X(50)}" height="${Y(31)}"/></clipPath><clipPath id="nbin2"><path d="${arc}"/></clipPath></defs>
   <g clip-path="url(#nbcrt)"><polygon points="${wedge(-180,-22)}" fill="${col(7)}" stroke="${col(7)}" stroke-width=".8"/><polygon points="${wedge(-22,22)}" fill="${col(8)}" stroke="${col(8)}" stroke-width=".8"/><polygon points="${wedge(22,180)}" fill="${col(9)}" stroke="${col(9)}" stroke-width=".8"/>
   <rect x="0" y="0" width="${X(3)}" height="${Y(9)}" fill="${col(5)}"/><rect x="${X(47)}" y="0" width="${X(50)-X(47)}" height="${Y(9)}" fill="${col(6)}"/>
   <g clip-path="url(#nbin2)"><polygon points="${wedge(-180,-30)}" fill="${col(2)}" stroke="${col(2)}" stroke-width=".8"/><polygon points="${wedge(-30,30)}" fill="${col(3)}" stroke="${col(3)}" stroke-width=".8"/><polygon points="${wedge(30,180)}" fill="${col(4)}" stroke="${col(4)}" stroke-width=".8"/>
    <rect x="${X(17)}" y="0" width="${X(33)-X(17)}" height="${Y(14.5)}" fill="${col(1)}"/><circle cx="${X(cx)}" cy="${Y(cy)}" r="${4*sc}" fill="${col(0)}"/></g>
   <g fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.2"><path d="${arc}"/><rect x="${X(17)}" y="0" width="${X(33)-X(17)}" height="${Y(14.5)}"/><circle cx="${X(cx)}" cy="${Y(cy)}" r="${4*sc}"/></g></g>`}
function nbaHeat(diff,att){if(att<3)return "#2a2d32";if(diff>=8)return "#d9483b";if(diff>=3)return "#e8894a";if(diff<=-8)return "#2f6fb5";if(diff<=-3)return "#5b9bd5";return "#6b7078"}
function nbaCourt(nm){return nbaCourtFor((typeof NBA_SHOT!=="undefined"&&NBA_SHOT[nm]),"this season")}
function nbaCourtFor(S,when,who){
  if(!S||typeof NBA_LGZ==="undefined"||!NBA_LGZ)return `<div class="small">No shot locations yet.</div>`;
  const sc=8,X=x=>x*sc,Y=y=>(y+4.5)*sc;
  const zinfo=S.map((z,i)=>{const lg=NBA_LGZ[i][1]/Math.max(1,NBA_LGZ[i][0])*100,pc=z[0]?z[1]/z[0]*100:0;return {att:z[0],made:z[1],pc,lg,diff:pc-lg}});
  const tot=S.reduce((s,z)=>s+z[0],0);
  // fixed label spots (feet) so numbers stay readable
  const LBL=[[25,2.5],[25,10],[8,8],[25,18],[42,8],[1.6,2],[48.4,2],[6,25],[25,27.5],[44,25]];
  let svg=`<svg viewBox="0 0 400 284" class="court" role="img" aria-label="Shot zones">`;
  svg+=nbaZoneShapes(X,Y,sc,i=>nbaHeat(zinfo[i].diff,zinfo[i].att));
  const L='stroke="rgba(255,255,255,.8)" stroke-width="1.6" fill="none"';
  const rimY=Y(.75),r3=23.75*sc;
  svg+=`<rect x="0" y="0" width="400" height="284" ${L}/>`+
    `<rect x="${X(17)}" y="0" width="${16*sc}" height="${Y(14.5)}" ${L}/>`+
    `<circle cx="${X(25)}" cy="${Y(14.5)}" r="${6*sc}" ${L}/>`+
    `<path d="M ${X(21)} ${rimY} A ${4*sc} ${4*sc} 0 0 0 ${X(29)} ${rimY}" ${L}/>`+
    `<circle cx="${X(25)}" cy="${rimY}" r="${.75*sc}" stroke="#f3a14b" stroke-width="2" fill="none"/>`+
    `<line x1="${X(22)}" y1="${Y(-.5)}" x2="${X(28)}" y2="${Y(-.5)}" stroke="rgba(255,255,255,.8)" stroke-width="2"/>`+
    `<line x1="${X(3)}" y1="0" x2="${X(3)}" y2="${Y(9)}" ${L}/><line x1="${X(47)}" y1="0" x2="${X(47)}" y2="${Y(9)}" ${L}/>`;
  const ang=Math.asin(22/23.75);const ax1=X(25)-r3*Math.sin(ang),ay=rimY+r3*Math.cos(ang),ax2=X(25)+r3*Math.sin(ang);
  svg+=`<path d="M ${X(3)} ${Y(9)} L ${ax1} ${ay} A ${r3} ${r3} 0 0 0 ${ax2} ${ay} L ${X(47)} ${Y(9)}" ${L}/>`;
  svg+=LBL.map(([lx,ly],i)=>{const z=zinfo[i];if(!z.att)return "";return `<g><rect x="${X(lx)-21}" y="${Y(ly)-13}" width="42" height="26" rx="6" fill="rgba(0,0,0,.55)"/><text x="${X(lx)}" y="${Y(ly)-1}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${Math.round(z.pc)}%</text><text x="${X(lx)}" y="${Y(ly)+10}" text-anchor="middle" font-size="9" fill="#ddd">${z.made}/${z.att}</text></g>`}).join("");
  svg+=`</svg>`;
  const hot=zinfo.map((z,i)=>({...z,i})).filter(z=>z.att>=3).sort((a,b)=>b.diff-a.diff);
  const best=hot.filter(z=>z.diff>=3).slice(0,2),worst=hot.filter(z=>z.diff<=-3).slice(-2).reverse();
  const fav=zinfo.map((z,i)=>({...z,i})).sort((a,b)=>b.att-a.att)[0];
  return `${svg}
  <div class="heatkey"><span style="background:#d9483b"></span>Hot <span style="background:#e8894a"></span>Warm <span style="background:#6b7078"></span>Average <span style="background:#5b9bd5"></span>Cool <span style="background:#2f6fb5"></span>Cold <span style="background:#2a2d32"></span>Few shots</div>
  <div class="small" style="margin-top:8px">${who?`${who} · `:""}FG% compared with the NBA average in each zone · ${tot} shots ${when||"this season"}.${fav?` Most shots from the <b>${NBA_ZONES[fav.i].toLowerCase()}</b> (${Math.round(fav.att/tot*100)}%).`:""}</div>
  ${best.length?`<div class="small" style="margin-top:4px"><b class="up">Hot:</b> ${best.map(z=>`${NBA_ZONES[z.i]} ${Math.round(z.pc)}% (NBA ${Math.round(z.lg)}%)`).join(" · ")}</div>`:""}
  ${worst.length?`<div class="small" style="margin-top:2px"><b style="color:#8cc0ff">Cold:</b> ${worst.map(z=>`${NBA_ZONES[z.i]} ${Math.round(z.pc)}% (NBA ${Math.round(z.lg)}%)`).join(" · ")}</div>`:""}`;
}

/* ---------- Rebound chances / assist chances per game (rebuilt from ESPN play-by-play lineups, NBA_CHANCE) ---------- */
function nbaChanceHtml(nm,k){
  if(typeof NBA_CHANCE==="undefined"||!NBA_CHANCE[nm])return "";const C=NBA_CHANCE[nm],rb=["reb","ra","pr","pra"].includes(k),as=["ast","ra","pa","pra"].includes(k);if(!rb&&!as)return "";
  const pg=(a,i)=>a[0]?a[i]/a[0]:0,f=v=>v.toFixed(1),pc=(a,b)=>b?Math.round(a/b*100):0,p=NBA_LOGS[nm];
  const opp=d=>{const g=p&&p.g.find(x=>x[1]===d);return g?(g[3]==="H"?"":"@")+g[2]:d.slice(5)};
  const per=[["s","Season"],["l10","L10"],["l5","L5"]].filter(([w],i)=>i===0||C[w][0]<C.s[0]||w==="l5");
  const trend=(i,j)=>{const s=pg(C.s,i)+(j?pg(C.s,j):0),l=pg(C.l5,i)+(j?pg(C.l5,j):0);return C.l5[0]<C.s[0]&&s?(l>=s*1.06?` <span class="up">▲ more lately</span>`:l<=s*.94?` <span class="dn">▼ fewer lately</span>`:""):""};
  const L=C.last||[];let h="";
  if(rb)h+=`<div class="chb"><div class="chh">🏀 <b>Rebound chances</b> <span class="small">per game · missed shots while he's on the floor</span>${trend(1,2)}</div>
    <div class="chg">${per.map(([w,l])=>{const a=C[w];return `<div><span class="small">${l}${w!=="s"?"":` (${a[0]} g)`}</span><b>${f(pg(a,1)+pg(a,2))}</b><span class="small">${f(pg(a,3)+pg(a,4))} reb · ${pc(a[3]+a[4],a[1]+a[2])}%</span></div>`}).join("")}</div>
    <div class="small">His team's misses ${f(pg(C.s,1))} (he gets ${pc(C.s[3],C.s[1])}% → ${f(pg(C.s,3))} off. reb) · opponent misses ${f(pg(C.s,2))} (he gets ${pc(C.s[4],C.s[2])}% → ${f(pg(C.s,4))} def. reb)</div>
    ${L.length?`<div class="chl">${L.slice().reverse().map(r=>`<div title="${nbaEsc(r[0])} · ${r[5]} min"><b>${r[1]}</b><span>${r[2]} reb</span><em>${opp(r[0])}</em></div>`).join("")}</div>`:""}</div>`;
  if(as)h+=`<div class="chb"><div class="chh">🎯 <b>Assist chances</b> <span class="small">per game · baskets his teammates made while he was on the floor</span>${trend(5)}</div>
    <div class="chg">${per.map(([w,l])=>{const a=C[w];return `<div><span class="small">${l}${w!=="s"?"":` (${a[0]} g)`}</span><b>${f(pg(a,5))}</b><span class="small">${f(pg(a,6))} ast · ${pc(a[6],a[5])}%</span></div>`}).join("")}</div>
    <div class="small">He assisted ${pc(C.s[6],C.s[5])}% of his teammates' baskets while he played (assist rate).</div>
    ${L.length?`<div class="chl">${L.slice().reverse().map(r=>`<div title="${nbaEsc(r[0])} · ${r[5]} min"><b>${r[3]}</b><span>${r[4]} ast</span><em>${opp(r[0])}</em></div>`).join("")}</div>`:""}</div>`;
  return `<div class="chw">${h}<div class="small" style="margin-top:4px">Last ${L.length} games, newest first. Our count from ESPN play-by-play (who was on the floor for each shot) — not NBA.com's player-tracking "chances".</div></div>`}
/* ---------- Shot types this season: catch & shoot / pull-up / under 10 ft / other (ESPN play-by-play) ---------- */
function nbaShotTypes(nm){
  if(typeof NBA_STYPE==="undefined"||!NBA_STYPE[nm])return "";const T=NBA_STYPE[nm],L=NBA_LGST,tot=T.reduce((a,r)=>a+r[0],0);if(tot<10)return "";
  const lt=L?L.reduce((a,r)=>a+r[0],0):0,pc=(m,a)=>a?Math.round(m/a*1000)/10:null,f=v=>v==null?"–":v.toFixed(1)+"%";
  const N=[["🎯","Catch & shoot","Jumper from 10+ ft with no dribble move in the play-by-play"],["⛹️","Pull-up","Off-the-dribble jumper (pull-ups and step-backs)"],["🏀","Under 10 ft","Layups, dunks, floaters, hooks and tip-ins inside 10 feet"],["🌀","Other jumpers","10+ ft fadeaways, turnarounds, runners and floaters"]];
  const rows=T.map((r,i)=>{const sh=r[0]/tot*100,lsh=lt?L[i][0]/lt*100:null,fg=pc(r[1],r[0]),lfg=L?pc(L[i][1],L[i][0]):null,tp=pc(r[3],r[2]),ltp=L?pc(L[i][3],L[i][2]):null;
    const c=(v,a,n)=>v==null||a==null||n<8?"":v>=a+3?"up":v<=a-3?"dn":"";
    return `<div class="stp"><div class="stph"><span title="${N[i][2]}">${N[i][0]} <b>${N[i][1]}</b></span><span><b>${sh.toFixed(0)}%</b> <span class="small">of his shots${lsh!=null?` · NBA ${lsh.toFixed(0)}%`:""}</span></span></div>
     <div class="stpb"><i style="width:${Math.min(100,sh).toFixed(1)}%"></i>${lsh!=null?`<em style="left:${Math.min(100,lsh).toFixed(1)}%" title="NBA average share"></em>`:""}</div>
     <div class="small stpf">FG <b class="${c(fg,lfg,r[0])}">${f(fg)}</b> (${r[1]}/${r[0]})${lfg!=null?` vs NBA ${f(lfg)}`:""}${r[2]?` · 3PT <b class="${c(tp,ltp,r[2])}">${f(tp)}</b> (${r[3]}/${r[2]})${ltp!=null&&i<2?` vs NBA ${f(ltp)}`:""}`:""}</div></div>`}).join("");
  return `<div class="card"><h2 style="margin-bottom:2px">How he shoots · this season</h2><div class="small" style="margin-bottom:8px">${tot} field-goal attempts. Bar = share of his shots; the tick = NBA average share. <span class="up">Green</span> / <span class="dn">red</span> FG% = 3+ points above / below the NBA average.</div>
   ${rows}<div class="small" style="margin-top:6px">From ESPN play-by-play shot descriptions — "catch &amp; shoot" is our estimate (a plain jump shot with no dribble move), not NBA.com tracking data.</div></div>`}
/* ---------- Shot matchup: where he shoots vs where tonight's opponent allows shots (NBA_DZONE) ---------- */
function nbaShotMatchup(nm,opp){
  const S=typeof NBA_SHOT!=="undefined"&&NBA_SHOT[nm],D=opp&&typeof NBA_DZONE!=="undefined"&&NBA_DZONE[opp];
  if(!S||!D)return nbaCourt(nm);
  const v=NB.shv||"him",tot=S.reduce((a,z)=>a+z[0],0),dt=D.reduce((a,z)=>a+z[0],0),g=(typeof NBA_DZG!=="undefined"&&NBA_DZG[opp])||1;
  const lgT=NBA_LGZ.reduce((a,z)=>a+z[0],0),pc=z=>z[0]?z[1]/z[0]*100:null,f=x=>x==null?"–":Math.round(x)+"%";
  const rows=NBA_ZONES.map((zn,i)=>{const hs=S[i][0]/Math.max(1,tot)*100,hp=pc(S[i]),ds=D[i][0]/Math.max(1,dt)*100,dp=pc(D[i]),lp=pc(NBA_LGZ[i]),ls=NBA_LGZ[i][0]/lgT*100;
    const edge=hs>=10&&D[i][0]>=15&&dp!=null&&lp!=null?(dp-lp>=3?"g":dp-lp<=-3?"r":""):"";
    return {zn,hs,hp,ds,dp,lp,ls,edge,att:S[i][0],dat:D[i][0]}});
  const big=rows.filter(r=>r.edge).sort((a,b)=>b.hs-a.hs).slice(0,3);
  return `<div class="gtabs" style="margin:0 0 10px"><a href="#" data-shv="him" class="${v==="him"?"on":""}">His shots</a><a href="#" data-shv="opp" class="${v==="opp"?"on":""}">${nbaEsc(nbaShort(opp))} allow</a></div>
   ${v==="opp"?nbaCourtFor(D,`against ${nbaEsc(nbaShort(opp))} in ${g} games`,`What ${nbaEsc(nbaShort(opp))} allow`):nbaCourt(nm)}
   ${big.length?`<div class="shx">${big.map(r=>`<div class="${r.edge}"><b>${r.edge==="g"?"✅":"⚠️"} ${r.zn}</b> — ${Math.round(r.hs)}% of his shots; ${nbaEsc(nbaShort(opp))} allow <b>${f(r.dp)}</b> there (NBA ${f(r.lp)}).</div>`).join("")}</div>`:""}
   <h3 style="margin:12px 0 6px">Zone by zone</h3>
   <table class="mxt shz"><thead><tr><th>Zone</th><th>His shots</th><th>His FG%</th><th>${nbaEsc(nbaShort(opp))} allow FG%</th><th>NBA FG%</th></tr></thead><tbody>
   ${rows.map(r=>`<tr><td>${r.zn}</td><td>${Math.round(r.hs)}%</td><td class="${r.hp!=null&&r.lp!=null&&r.att>=5?(r.hp-r.lp>=3?"g":r.hp-r.lp<=-3?"r":""):""}">${f(r.hp)}</td><td class="${r.dp!=null&&r.lp!=null&&r.dat>=15?(r.dp-r.lp>=3?"g":r.dp-r.lp<=-3?"r":""):""}">${f(r.dp)}</td><td>${f(r.lp)}</td></tr>`).join("")}</tbody></table>
   <div class="small" style="margin-top:6px"><span class="up">Green</span> = above the NBA average (good for the shooter), <span class="dn">red</span> = below. "${nbaEsc(nbaShort(opp))} allow" = what every opponent shot against them this season.</div>`;
}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-shv]");if(!b)return;e.preventDefault();NB.shv=b.dataset.shv;const c=b.closest(".card");const h=decodeURIComponent((location.hash||"").slice(1));if(c&&h.startsWith("nba-player-")){const nm=h.slice(11),p=NBA_LOGS[nm],g=p&&nbaGameOf(p.tm),opp=g?(g.a===p.tm?g.h:g.a):"";const t=c.querySelector("h2");c.innerHTML=(t?t.outerHTML:"")+nbaShotMatchup(nm,opp)}});
/* trend chart with stat tabs */
function nbaTrend(p,k){
  const last=p.g.slice(-10),vals=last.map(x=>k==="min"?x[4]:nbaVal(x,k)),avg=vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length);
  const mx=Math.max(1,...vals,avg)*1.15,H=130,ly=Math.round(avg/mx*H);
  return `<div class="nbch" style="height:${H+34}px"><div class="nbln" style="bottom:${ly+20}px;border-color:#8cc0ff"><span style="color:#8cc0ff;left:0;right:auto">avg ${nbaF(avg)}</span></div>
    ${last.map((x,i)=>{const v=vals[i];return `<div class="nbbar" title="${x[1]} ${x[3]==="H"?"vs":"@"} ${x[2]}: ${v}"><span class="v">${v}</span><i style="height:${Math.max(3,Math.round(v/mx*H))}px;background:${v>=avg?"#3987e5":"#3987e599"}"></i><span class="o">${x[3]==="H"?"":"@"}${x[2]}</span></div>`}).join("")}</div>`;
}
/* player splits, this season */
function nbaSplitsCard(nm){
  const p=NBA_LOGS[nm];if(!p||p.g.length<2)return "";
  const res={};for(const r of NBA_RES)res[r[0]]=r;
  const tg=NBA_RES.filter(r=>r[2]===p.tm||r[3]===p.tm).map(r=>r[1]).sort();
  const restOf=x=>{const i=tg.indexOf(x[1]);if(i<=0)return null;return Math.round((new Date(x[1])-new Date(tg[i-1]))/864e5)-1};
  const won=x=>{const r=res[x[0]];if(!r)return null;const home=r[3]===p.tm;return home?r[5]>r[4]:r[4]>r[5]};
  const R=NBA_REST&&NBA_REST[p.tm],g=nbaGameOf(p.tm),tonightH=g?(g.h===p.tm):null;
  const sets=[["Home",x=>x[3]==="H",tonightH===true],["Away",x=>x[3]==="A",tonightH===false],
    ["Rested (1+ day off)",x=>{const r=restOf(x);return r!=null&&r>=1},g&&R&&R.rest>=1],["Back-to-back",x=>restOf(x)===0,g&&R&&R.rest===0],
    ["Starter",x=>!!x[9],null],["Off the bench",x=>!x[9],null],["Team won",x=>won(x)===true,null],["Team lost",x=>won(x)===false,null]];
  const cols=[["min","MIN"],["pts","PTS"],["reb","REB"],["ast","AST"],["3pm","3PM"]];
  const avg=(a,k)=>a.reduce((s,x)=>s+(k==="min"?x[4]:nbaVal(x,k)),0)/a.length;
  const all={};for(const [k] of cols)all[k]=avg(p.g,k);
  const rows=sets.map(([l,f,tn])=>{const a=p.g.filter(f);if(!a.length)return "";
    return `<tr${tn?' class="tn"':""}><td>${l}${tn?' <span class="pll o">tonight</span>':""}<div class="small">${a.length} game${a.length>1?"s":""}</div></td>${cols.map(([k])=>{const v=avg(a,k),d=all[k]?v/all[k]-1:0;return `<td class="${a.length>=2&&Math.abs(d)>=.12&&all[k]>=1?(d>0?"up":"dn"):""}">${nbaF(v)}</td>`}).join("")}</tr>`}).join("");
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">Splits</h2><div class="small" style="margin-bottom:6px">This season's averages in each situation. <b class="up">Green</b>/<b class="dn">red</b> = 12%+ above/below his season average. Rows tagged <span class="pll o">tonight</span> match tonight's game.</div>
  <div class="nbatbl"><table class="bxt spl" style="min-width:0"><thead><tr><th></th>${cols.map(c=>`<th>${c[1]}</th>`).join("")}</tr></thead><tbody>
  <tr><td><b>Season</b><div class="small">${p.g.length} games</div></td>${cols.map(([k])=>`<td><b>${nbaF(all[k])}</b></td>`).join("")}</tr>${rows}</tbody></table></div></div>`;
}
function nbaMiniBars(vals,line,labs){
  /* HTML bars (not a stretched SVG) so numbers and labels stay crisp at any width; bars keep a slim fixed width */
  if(!vals.length)return "";const top=Math.max(line,...vals),mx=(top>0?top:1)*1.12,pct=v=>v<=0?0:Math.max(4,v/mx*100);
  const ln=(line/mx*100).toFixed(1),grid=[.25,.5,.75,1].map(f=>`<div class="mbg" style="bottom:${f*100}%"></div>`).join("");
  return `<div class="mb${vals.length<=6?" few":""}" role="img" aria-label="Last ${vals.length} games vs line ${line}"><div class="mbp">${grid}<div class="mbline" style="bottom:${ln}%"><span class="mbll">${line}</span></div>
   ${vals.map((v,i)=>{const c=v===line?"p":pxHit(v,line)?"o":"u";return `<div class="mbc" title="${labs&&labs[i]!=null?String(labs[i]).replace(/<[^>]+>/g,"").replace(/"/g,"")+": ":""}${v} (line ${line})"><span class="mbv ${c}">${v}</span><i class="${c}${v<=0?" z":""}" style="height:${pct(v).toFixed(1)}%"></i></div>`}).join("")}</div>
   ${labs?`<div class="mbx">${labs.map(l=>`<span>${l}</span>`).join("")}</div>`:""}</div>`;
}
function nbaLineRow(nm,r){
      let [,k,line,op,up,book]=r;const main=line,alt=typeof loAltOdds!=="undefined"?loAltOdds(nm,k):null;if(alt){line=alt.line;op=alt.o;up=alt.u;book=alt.ob||alt.ub||""}
      const l6=nbaAllG(nm).slice(-6),vals=l6.map(o=>nbaVal(o.x,k)),ov=vals.filter(v=>v>line).length;
      const V0=typeof xaVerdict!=="undefined"?xaVerdict("nba",nm,k,line):null;const lean=V0?(V0.v==="o"?["o","Leans over"]:V0.v==="u"?["u","Leans under"]:["n","Mixed"]):l6.length?(ov/l6.length>=.67?["o","Leans over"]:ov/l6.length<=.33?["u","Leans under"]:["n","Split"]):["n",""];
      return `<div class="pl" data-jump="pc_${nm.replace(/[^A-Za-z0-9]/g,"")}_${k}_p" data-lrow="nba|${nbaEsc(nm+"|"+k)}">
        <div class="plh"><div><b>${NBA_MK[k]?NBA_MK[k][1]:k}</b> <span class="plv">${line}</span>${typeof loStep!=="undefined"?loStep(nm,k,main):""}${typeof loMoveTag!=="undefined"?loMoveTag(nm,k,line):""}</div>
          <div class="small">O ${op!=null?oddsFmt(op):"–"} · U ${up!=null?oddsFmt(up):"–"}${book?" · "+nbaEsc(book):""}</div>${alt&&op==null&&up==null&&typeof loFairTxt!=="undefined"?`<div class="small">${loFairTxt(nm,k,line)}</div>`:""}</div>${alt?"":(typeof nbaVerdict!=="undefined"?nbaVerdict(nm,k,1):"")+nbaShopHtml(r)}
        ${(()=>{const L10=nbaAllG(nm).slice(-10),v10=L10.map(o=>nbaVal(o.x,k)),o10=v10.filter(v=>pxHit(v,line)).length;return L10.length?`<div class="mbw">${nbaMiniBars(v10,line,L10.map(o=>(o.x[3]==="H"?"":"@")+o.x[2]))}<div class="small mbs">Last ${L10.length}: <b class="${o10/L10.length>=.5?"up":"dn"}">${o10}/${L10.length} ${pxSW()}</b> · avg <b>${nbaF(v10.reduce((a,b)=>a+b,0)/v10.length)}</b> vs line ${line}</div></div>`:""})()}
        ${typeof loAltHtml!=="undefined"?loAltHtml(nm,k,main,nbaAllG(nm).slice(-10).map(o=>nbaVal(o.x,k))):""}
        ${nbaChanceHtml(nm,k)}
        <div class="plg">${l6.map((o,i)=>{const v=vals[i],c=v===line?"p":pxHit(v,line)?"o":"u";return `<div class="lc ${c}${o.prev?" pv":""}" title="${nbaEsc(o.x[1])} ${o.x[3]==="H"?"vs":"@"} ${o.x[2]}"><b>${v}</b><span>${o.x[3]==="H"?"":"@"}${o.x[2]}</span></div>`}).join("")}</div>
        <div class="plf">${(()=>{const h=vals.filter(v=>pxHit(v,line)).length;return `<b class="${h/Math.max(1,l6.length)>=.5?"up":"dn"}">${h}/${l6.length} ${pxSW()}</b>`})()}${lean[1]?` <span class="pll ${lean[0]}">${lean[1]}</span>`:""}</div>
        ${!alt&&typeof nbaOddsBtns!=="undefined"?nbaOddsBtns(nm,k):""}
      </div>`}

/* ---------- Game page: every player prop from this game ---------- */
function nbaGameProps(g){return (nbaStarted(g)||typeof xParlayCard==="undefined"?"":xParlayCard(nbaParlayLegs(g))+(typeof prlGameHtml!=="undefined"?prlGameHtml("nba",g.id):""))+nbaGameProps0(g)}
function nbaGameProps0(g){
  if(nbaStarted(g))return `<div class="info"><span>🔒 This game has started — pregame player props are closed.</span></div>`;
  const tms=[g.a,g.h],all=NBA_PROPS.filter(r=>{const p=NBA_LOGS[r[0]];return p&&tms.includes(p.tm)&&NBA_MK[r[1]]});
  if(!all.length)return `<div class="card"><h2>No player props yet</h2><p class="small" style="margin:0">Sportsbooks usually post NBA player props the morning of the game. We add them by about noon ET — check back then.</p></div>`;
  const tf=NB.gpt&&tms.includes(NB.gpt)?NB.gpt:"all",mf=NB.gpm&&all.some(r=>r[1]===NB.gpm)?NB.gpm:"all";
  const best=nbaBest().filter(b=>{const p=NBA_LOGS[b.nm];return p&&tms.includes(p.tm)}).slice(0,5);
  const mks=[...new Set(all.map(r=>r[1]))].sort((x,y)=>Object.keys(NBA_MK).indexOf(x)-Object.keys(NBA_MK).indexOf(y));
  const byP={};all.filter(r=>(tf==="all"||NBA_LOGS[r[0]].tm===tf)&&(mf==="all"||r[1]===mf)).forEach(r=>(byP[r[0]]=byP[r[0]]||[]).push(r));
  const order=Object.keys(byP).sort((x,y)=>(NBA_LOGS[x].tm===g.a?0:1)-(NBA_LOGS[y].tm===g.a?0:1)||nbaAvg(NBA_LOGS[y],"min")-nbaAvg(NBA_LOGS[x],"min"));
  const chip=(attr,v,l,on)=>`<button class="btn${on?" on":""}" data-${attr}="${v}">${l}</button>`;
  return `${best.length?`<div class="card"><h2 style="margin-bottom:2px">🔥 Best props in this game</h2><div class="small" style="margin-bottom:8px">Ranked by how far our chance of winning beats the chance the odds imply.</div><div class="bpc">${best.map(nbaBestRow).join("")}</div></div>`:""}
  <div class="info" style="margin-top:10px"><span>🔗 <b>Building a same-game parlay?</b> Tap a price → <b>Add to parlay</b>. Your parlay slip checks past games to show which legs tend to hit together and which work against each other.</span></div>
  <div class="grid g2" style="margin-top:10px;gap:10px">${(tf==="all"?tms:[tf]).map(t=>`<div class="card" style="padding:12px">${nbaOppAllows(t===g.a?g.h:g.a,mf==="all"?null:mf,`For ${nbaEsc(nbaShort(t))} players: what ${nbaEsc(nbaShort(t===g.a?g.h:g.a))} allows`)}</div>`).join("")}</div>
  <div class="gpf"><div class="seg">${chip("gpt","all",`Both teams`,tf==="all")}${tms.map(t=>chip("gpt",t,`${nbaBadge(t)} ${nbaShort(t)}`,tf===t)).join("")}</div>
  <select id="gpMk"><option value="all">All markets (${all.length})</option>${mks.map(m=>`<option value="${m}"${mf===m?" selected":""}>${NBA_MK[m][1]} (${all.filter(r=>r[1]===m).length})</option>`).join("")}</select></div>
  ${order.map(nm=>{const p=NBA_LOGS[nm];return `<div class="card plines gpp" style="margin-top:12px">
    <div class="gph">${nbaBadge(p.tm)}<div style="min-width:0"><a href="#nba-player-${encodeURIComponent(nm)}"><b>${nbaEsc(nm)}</b></a>${nbaInjChip(nbaInjOf(nm))}<div class="small">${p.tm} · ${p.p5||p.pos||""} · ${nbaF(nbaAvg(p,"min"))} min/game · ${byP[nm].length} line${byP[nm].length>1?"s":""}</div></div></div>
    ${byP[nm].map(r=>nbaLineRow(nm,r)).join("")}</div>`}).join("")||`<div class="small" style="margin-top:10px">No lines match these filters.</div>`}
  <p class="note" style="margin-top:8px">Boxes = his last 6 games, newest on the right: <span class="lc o">green</span> over, <span class="lc u">red</span> under. Lines close when the game starts.</p>`;
}
function nbaGamePropCount(g){if(nbaStarted(g))return 0;return NBA_PROPS.filter(r=>{const p=NBA_LOGS[r[0]];return p&&(p.tm===g.a||p.tm===g.h)&&NBA_MK[r[1]]}).length}
function nbaPlayer(el,nm){nm=(typeof xMkFromHash!=="undefined"?xMkFromHash(nm,k=>{NB.pmk=k;NB.goto=null}):nm);
  if(NB.lastPl!==nm){{NB.gf=Object.assign(NB.gf,{lo:-15,hi:15,tlo:195,thi:255,ilo:95,ihi:135,flo:0,fhi:35,plo:0,phi:20,ven:"",rest:"",role:"",opp:"",pace:""});NB.mlo=0;NB.mhi=48;NB.tmf={};NB._best=null;NB.fOpen=false;try{LS.set("nbaGF",NB.gf);LS.set("nbaMin",[0,48])}catch(e){}}NB.lastPl=nm}   /* new player: filters reset, and the filter panel starts closed */
  const p=NBA_LOGS[nm];
  if(!p){el.innerHTML=`<a href="#nba-players" class="small" style="color:var(--text2)">← Players</a><h1>${nbaEsc(nm)}</h1><p class="sub">No games played yet this season.</p>`;return}
  const g=nbaGameOf(p.tm),opp=g?(g.a===p.tm?g.h:g.a):"",inj=nbaInjOf(nm);
  const gStarted=nbaStarted(nbaGameOf(p.tm)),props=gStarted?[]:NBA_PROPS.filter(r=>r[0]===nm),hadProps=NBA_PROPS.some(r=>r[0]===nm);
  const bio=(typeof NBA_BIO!=="undefined"&&NBA_BIO[nm])||null;
  const posName={PG:"Point guard",SG:"Shooting guard",SF:"Small forward",PF:"Power forward",C:"Center",G:"Guard",F:"Forward"}[p.p5||p.pos]||"";
  const tile=(k,l)=>`<div class="stat"><div class="l">${l}</div><div style="font-size:22px;font-weight:800">${nbaF(nbaAvg(p,k))}</div><div class="small">L5 ${nbaF(nbaAvg(p,k,5))} · L10 ${nbaF(nbaAvg(p,k,10))}</div></div>`;
  const tot=(i)=>p.g.reduce((s,x)=>s+(x[i]||0),0),pct=(m,a)=>a?(m/a*100).toFixed(1)+"%":"–";
  const tk=NB.ptk||"pts";
  const dvp=opp&&p.p5?nbaDvp(opp,p.p5,"pts",5):null,dvpAvg=dvp&&dvp.rows.length?dvp.rows.reduce((s,r)=>s+r.v,0)/dvp.rows.length:null;
  const back=NB.from&&/^nba-(props|best)$|^nba$/.test(NB.from)?NB.from:"nba-players",backL={"nba-props":"Props","nba-best":"Best props","nba":"Games"}[back]||"Players";
  const linesTbl=props.length?`${opp?`<div class="card" style="margin-top:12px;padding:12px">${nbaOppAllows(opp,null)}</div>`:""}<h2 class="noglo" style="margin:16px 0 10px">Prop charts · tonight</h2>${(()=>{const mk=props.map(r=>r[1]),ord=["pts","reb","ast","pra","pr","pa","ra","3pm","3pa","stl","blk","sb"],P=[...props].sort((x,y)=>ord.indexOf(x[1])-ord.indexOf(y[1]));const sel=NB.pmk&&mk.includes(NB.pmk)?NB.pmk:P[0][1];
    return `<div class="nbtabs pmk">${P.map(r=>`<button data-pmk="${r[1]}" class="${r[1]===sel?"on":""}">${NBA_MK[r[1]]?NBA_MK[r[1]][2]:r[1]} <small>${r[2]}</small></button>`).join("")}</div><div class="small swh">👆 Swipe the chart left or right for the next prop</div>
${nbaMinUI("nbaMinPl",(()=>{const sp=typeof pxNbaSpread!=="undefined"?pxNbaSpread(p.tm):null,t=typeof pxNbaTot!=="undefined"?pxNbaTot(p.tm):null;const g0=nbaGameOf(p.tm),R0=NBA_REST&&NBA_REST[p.tm],st0=p.g.filter(x=>x[9]===1||x[9]===true).length;const fg0=p.g.length?Math.round(p.g.reduce((q,x)=>q+(x[11]||0),0)/p.g.length):null,mn0=p.g.length?Math.round(p.g.reduce((q,x)=>q+(x[4]||0),0)/p.g.length):null,tp0=p.g.length?Math.round(p.g.reduce((q,x)=>q+(x[15]||0),0)/p.g.length):null;return {fga:fg0,min:mn0,tpa:tp0>0?tp0:null,it:sp!=null&&t!=null?Math.round((t/2-sp/2)*2)/2:null,sp:sp!=null?Math.round(sp*2)/2:null,tot:t,nm,ha:g0?(g0.h===p.tm?"H":"A"):null,rest:R0?(R0.rest===0?"b2b":R0.rest===1?"r1":"r2"):"",oppT:g0?(g0.h===p.tm?g0.a:g0.h):"",opp:g0?nbaOppTier(g0.h===p.tm?g0.a:g0.h,"opp"):"",pace:g0?nbaOppTier(g0.h===p.tm?g0.a:g0.h,"pace"):"",role:p.g.length?(st0*2>=p.g.length?"st":"bn"):"",ven:g0?(g0.h===p.tm?"H":"A"):null}})())}
    <div class="pmkw">${P.map((r,i)=>`<div class="pmkc" data-pmkc="${r[1]}"${r[1]===sel?"":" hidden"}>${nbaPropCard(r,100+i)}${typeof vxScatter!=="undefined"?vxScatter(nm,r[1],r[2]):""}${typeof vxLnRec!=="undefined"?vxLnRec("nba",nm,r[1]):""}</div>`).join("")}</div>`})()}`:(g?`<div class="info"><span>${gStarted&&hadProps?"🔒 His game has started — tonight's pregame lines are closed.":(typeof OUT_DROP!=="undefined"&&OUT_DROP.nba.has(nm)?"🚑 He's ruled out — his props are removed.":"No prop lines posted for him today.")}</span></div>`:"");
  el.innerHTML=`<a href="#${back}" class="small" style="color:var(--text2)">← ${backL}</a>
  <div class="phead">
    <div class="pnum" style="background:${nbaCol(p.tm)}">${bio&&bio[3]?"#"+nbaEsc(bio[3]):p.tm}</div>
    <div style="min-width:0"><h1 style="margin:0">${nbaEsc(nm)}${nbaInjChip(inj)}</h1>
    <div class="sub" style="margin:4px 0 0">${posName?posName+" · ":""}${nbaTm(p.tm)}</div></div>
  </div>
  <div class="pline">${[bio&&bio[0]?nbaEsc(bio[0]):"",bio&&bio[1]?nbaEsc(String(bio[1]).replace(" lbs",""))+" lbs":"",bio&&bio[2]?nbaEsc(bio[2])+" yrs":"",bio&&bio[4]!==""&&bio[4]!=null?nbaEsc(bio[4])+" NBA seasons":"",p.g.length+" games",nbaF(nbaAvg(p,"min"))+" min/game"].filter(Boolean).map(x=>`<span>${x}</span>`).join("")}</div>
  ${g?`<div class="info"><span>Today ${g.a===p.tm?"@":"vs"} <b>${nbaTm(opp)}</b>, ${g.t} ET${dvpAvg!=null?`. ${opp} has allowed ${nbaF(dvpAvg)} points a game to ${nbaPosWord(p.p5)} over its last 5 (NBA average ${nbaF(dvp.lg)}).`:""}</span></div>`:""}
  ${typeof nbaRoleTag!=="undefined"?nbaRoleTag(nm):""}
  ${typeof newsCard!=="undefined"?newsCard("nba",{player:nm,hrs:72},"News about "+nbaEsc(nm)):""}
  ${linesTbl}
  ${inj?`<div class="info">Injury report: <b style="color:${nbaInjCol(inj[2])}">${nbaEsc(inj[2])}</b> — ${nbaEsc(inj[3])}${inj[4]?", est. return "+nbaEsc(inj[4]):""}</div>`:""}
  <div class="grid g4" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">${tile("pts","Points")}${tile("reb","Rebounds")}${tile("ast","Assists")}${tile("3pm","3-Pointers")}</div>
  ${(()=>{const X=(typeof NBA_PADV!=="undefined"&&NBA_PADV[nm])||null;if(!X)return "";const rk=(k,good)=>X[k+"R"]?`<small class="${X[k+"R"]<=Math.round(X.N*.2)?"up":X[k+"R"]>=Math.round(X.N*.8)?"dn":""}">${nbaOrd(X[k+"R"])} of ${X.N}</small>`:"";
    return `<div class="card adv" style="margin-top:12px"><h2 style="margin-bottom:6px">Advanced</h2><div class="pbio" style="margin:0">
      <div><b>${X.usg}%</b>Usage ${rk("usg")}</div><div><b>${X.ts}%</b>True shooting ${rk("ts")}</div><div><b class="${X.pm>0?"up":X.pm<0?"dn":""}">${nbaSg(X.pm)}</b>+/- per game ${rk("pm")}</div>
      <div><b>${X.p36[0]}</b>Pts per 36</div><div><b>${X.p36[1]}</b>Reb per 36</div><div><b>${X.p36[2]}</b>Ast per 36</div></div>
      <div class="small" style="margin-top:6px"><b>Usage</b> = share of his team's plays he finishes (shot, free throws or turnover) while on the floor — 20% is average, 30%+ is a star's load. <b>True shooting</b> counts 3s and free throws (league average ≈ 57–58%). Ranks among players averaging 15+ minutes.</div></div>`})()}
  <div class="pbio" style="margin-top:10px"><div><b>${pct(tot(10),tot(11))}</b>Field goal %</div><div><b>${pct(tot(8),tot(15))}</b>3-point %</div><div><b>${pct(tot(16),tot(17))}</b>Free throw %</div><div><b>${nbaF(nbaAvg(p,"stl"))}</b>Steals</div><div><b>${nbaF(nbaAvg(p,"blk"))}</b>Blocks</div></div>
  ${typeof xaTrendsCard!=="undefined"?xaTrendsCard("nba",nm):""}
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h2>${opp?`Where he scores vs where ${nbaEsc(nbaShort(opp))} allow`:"Where he scores"}</h2>${opp?nbaShotMatchup(nm,opp):nbaCourt(nm)}</div>
    ${nbaShotTypes(nm)}
    ${typeof vxQMin!=="undefined"?vxQMin(nm):""}
    <div class="card"><h2>Last ${Math.min(10,p.g.length)} games</h2>
      <div class="nbtabs">${[["pts","PTS"],["reb","REB"],["ast","AST"],["3pm","3PM"],["min","MIN"]].map(([k,l])=>`<button data-ptk="${k}" class="${k===tk?"on":""}">${l}</button>`).join("")}</div>
      <div id="ptrend">${nbaTrend(p,tk)}</div>
      <div class="small" style="margin-top:6px">Bright bars = at or above his average.</div></div>
  </div>
  ${typeof nbaPropXCard!=="undefined"?nbaPropXCard(nm):""}
  <div class="card" style="margin-top:14px"><h2>${nbaShort(p.tm)} schedule · next 7 days</h2>${nbaNextHtml(p.tm)}</div>
  <div class="card" style="margin-top:14px"><h2>Game log</h2><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Date</th><th>Opp</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>FG</th><th>3PT</th><th>FT</th></tr></thead><tbody>
  ${p.g.slice().reverse().map(x=>`<tr><td style="min-width:0">${+x[1].slice(5,7)}/${+x[1].slice(8)}</td><td>${x[3]==="H"?"":"@"}${x[2]}</td><td>${x[4]}</td><td><b>${x[5]}</b></td><td>${x[6]}</td><td>${x[7]}</td><td>${x[10]}-${x[11]}</td><td>${x[8]}-${x[15]??"?"}</td><td>${x[16]??"?"}-${x[17]??"?"}</td></tr>`).join("")}
  </tbody></table></div></div>`;
  el.querySelectorAll("[data-ptk]").forEach(b=>b.onclick=()=>{NB.ptk=b.dataset.ptk;document.getElementById("ptrend").innerHTML=nbaTrend(p,NB.ptk);el.querySelectorAll("[data-ptk]").forEach(x=>x.classList.toggle("on",x===b))});
  nbaWireMin(el,()=>nbaPlayer(el,nm));
  if(typeof nbaWirePx!=="undefined")nbaWirePx(el,nm);
  if(typeof pxSwipe!=="undefined")pxSwipe(el.querySelector(".pmkw"),"#v-nba [data-pmk]");
  if(typeof pxRecentAdd!=="undefined")pxRecentAdd("nba",nm,NB.pmk);
  el.querySelectorAll("[data-pmk]").forEach(b=>b.onclick=()=>{NB.pmk=b.dataset.pmk;NB.fOpen=false;{const d=el.querySelector("details.pxfd[open]");if(d)d.open=false}el.querySelectorAll("[data-pmk]").forEach(x=>x.classList.toggle("on",x===b));el.querySelectorAll("[data-pmkc]").forEach(c=>c.hidden=c.dataset.pmkc!==NB.pmk)});
  nbaWireCharts(el,()=>nbaPlayer(el,nm));
  el.querySelectorAll("[data-jump]").forEach(r=>r.onclick=()=>nbaFlash(r.dataset.jump));
  if(NB.goto){const id=NB.goto;NB.goto=null;setTimeout(()=>nbaFlash(id),60)}
  NB.from=null;
}
function nbaFlash(id){const c=document.getElementById(id);if(!c)return;const dz=c.closest("details");if(dz)dz.open=true;c.scrollIntoView({block:"start"});c.classList.add("flash");setTimeout(()=>c.classList.remove("flash"),1800)}

/* ---------- Scores + box scores ---------- */
function nbaBox(id){
  const rows={};for(const [nm,p] of Object.entries(NBA_LOGS))for(const x of p.g)if(x[0]===id){(rows[x[3]]=rows[x[3]]||[]).push([nm,x])}
  const r=NBA_RES.find(z=>z[0]===id);if(!r)return "";
  const tags=x=>{const n=[x[5],x[6],x[7],x[12],x[13]].filter(v=>v>=10).length;return n>=3?`<span class="bxtag td">TRIPLE-DBL</span>`:n===2?`<span class="bxtag dd">DOUBLE-DBL</span>`:""};
  const ptc=v=>v>=40?"bx40":v>=30?"bx30":v>=20?"bx20":"";
  const tbl=(ha,tm)=>{const R=(rows[ha]||[]).sort((a,b)=>b[1][9]-a[1][9]||b[1][4]-a[1][4]),win=ha==="A"?r[4]>r[5]:r[5]>r[4];
    return `<div class="card bxcard" style="margin-top:12px;--tc:${nbaCol(tm)}"><h2 class="bxh">${nbaBadge(tm)} ${nbaTm(tm)} <span class="bxwl ${win?"w":"l"}">${win?"W":"L"} ${ha==="A"?r[4]:r[5]}</span></h2><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Player</th><th>PTS</th><th>REB</th><th>AST</th><th>FG</th><th>3PT</th><th>FT</th></tr></thead><tbody>${R.map(([nm,x],i)=>`${i&&x[9]!==R[i-1][1][9]?`<tr class="bxsep"><td colspan="7">Bench</td></tr>`:""}<tr><td>${nbaLink(nm)} <span class='small'>${x[4]}m</span>${tags(x)}</td><td><b class="${ptc(x[5])}">${x[5]}</b></td><td class="${x[6]>=10?"bxhi":""}">${x[6]}</td><td class="${x[7]>=10?"bxhi":""}">${x[7]}</td><td>${x[10]}-${x[11]}</td><td>${x[8]}-${x[15]??"?"}</td><td>${x[16]??"?"}-${x[17]??"?"}</td></tr>`).join("")}</tbody></table></div></div>`};
  const LS=typeof NBA_ESPN!=="undefined"&&NBA_ESPN.ls&&NBA_ESPN.ls[id];
  const q=(i,side)=>{const a=LS[0][i],h=LS[1][i],me=side?h:a,op=side?a:h;return `<td class="${me>op?"qw":""}">${me??""}</td>`};
  const lsT=LS&&LS[0].length?`<div class="card" style="margin-top:12px"><div class="nbatbl"><table class="bxt lst" style="min-width:0"><thead><tr><th></th>${LS[0].map((_,i)=>`<th>${i<4?"Q"+(i+1):i===4?"OT":"OT"+(i-3)}</th>`).join("")}<th>T</th></tr></thead><tbody>
    ${[0,1].map(sd=>`<tr><td>${nbaBadge(r[2+sd])} <b>${nbaShort(r[2+sd])}</b></td>${LS[0].map((_,i)=>q(i,sd)).join("")}<td><b class="${(sd?r[5]>r[4]:r[4]>r[5])?"qwT":""}">${r[4+sd]}</b></td></tr>`).join("")}</tbody></table></div><div class="small" style="margin-top:4px">Green = won the quarter.</div></div>`:"";
  const tb=(ha,tm,on)=>tbl(ha,tm).replace('<div class="card bxcard"',`<div data-bxp="1" class="card bxcard${on?" bxon":""}"`);
  return `<h2 style="margin:18px 0 0">${nbaShort(r[2])} ${r[4]} – ${nbaShort(r[3])} ${r[5]} · box score</h2>${lsT}${typeof qbTabs!=="undefined"?qbTabs("nba",id,LS&&LS[0]?LS[0].length:4):""}<div class="qbarea"><div class="bxsw"><div class="bxtabs">${[["A",r[2],r[4]],["H",r[3],r[5]]].map(([ha,tm,pts],i)=>`<button type="button" data-bxt="${i}" class="${i?"":"on"}">${nbaShort(tm)} · ${(ha==="A"?r[4]>r[5]:r[5]>r[4])?"W":"L"} ${pts}</button>`).join("")}</div>${tb("A",r[2],1)}${tb("H",r[3],0)}</div></div>`;
}
function nbaScores(el){
  const today=(typeof etNow!=="undefined"?etNow().d:NBA_SLATE_DATE),lo=new Date(new Date(today+"T12:00:00")-8*864e5).toISOString().slice(0,10);
  let dates=[...new Set(NBA_RES.map(r=>r[1]))].filter(d=>d<today&&d>=lo).sort().reverse();
  if(!dates.length)dates=[...new Set(NBA_RES.map(r=>r[1]))].sort().reverse().slice(0,8);
  if(!NB.date||!dates.includes(NB.date))NB.date=dates[0];
  const games=NBA_RES.filter(r=>r[1]===NB.date);
  el.innerHTML=`<h1>NBA Scores</h1>
  <div id="liveTodayHost">${typeof nbaTodayHtml!=="undefined"?nbaTodayHtml():""}</div>
  <h2 style="margin:18px 0 4px">Results</h2><p class="sub" style="margin-top:0">Tap a final score to see the full box score.</p>
  <div class="nbadates">${dates.map(d=>`<button class="btn${d===NB.date?" pri":""}" data-nd="${d}">${nbaDayS(d)}</button>`).join("")}</div>
  <div class="grid g2">${games.map(r=>{const aw=r[4]>r[5],W=aw?r[2]:r[3],m=Math.abs(r[4]-r[5]),LS=typeof NBA_ESPN!=="undefined"&&NBA_ESPN.ls&&NBA_ESPN.ls[r[0]],ot=LS&&LS[0].length>4?(LS[0].length===5?"OT":(LS[0].length-4)+"OT"):"";
    let top=null;for(const [nm,p] of Object.entries(NBA_LOGS))for(const x of p.g)if(x[0]===r[0]&&(!top||x[5]>top[1]))top=[nm,x[5]];
    const row=(t,sc,w)=>`<div class="rsr${w?" w":""}"><span class="rsn">${nbaBadge(t)}<b>${nbaEsc(nbaShort(t))}</b><span class="small">${nbaRec(t)}</span></span>${w?`<span class="rsw">W</span>`:""}<span class="rss">${sc}</span></div>`;
    return `<div class="card sbox click rsc${NB.sel===r[0]?" sel":""}" data-nbx="${r[0]}" style="cursor:pointer;--ca:${nbaCol(r[2])};--ch:${nbaCol(r[3])};--cw:${nbaCol(W)}">
    ${row(r[2],r[4],aw)}${row(r[3],r[5],!aw)}
    <div class="rsf"><span class="rsfin">FINAL${ot?"/"+ot:""}</span><span class="rsm">${nbaEsc(nbaShort(W))} by ${m}</span>${top?`<span class="small">🔥 ${nbaEsc(pxLast?pxLast(top[0]):top[0])} ${top[1]}</span>`:""}<span class="rsbx">${NB.sel===r[0]?"Hide box ▴":"Box score ▾"}</span></div></div>`}).join("")}</div>
  <div id="nbaBoxOut">${NB.sel?nbaBox(NB.sel):""}</div>`;
  el.querySelectorAll("[data-nd]").forEach(b=>b.onclick=()=>{NB.date=b.dataset.nd;NB.sel=null;nbaScores(el)});
  el.querySelectorAll("[data-nbx]").forEach(b=>b.onclick=()=>{const id=+b.dataset.nbx;NB.sel=NB.sel===id?null:id;nbaScores(el);if(NB.sel)document.getElementById("nbaBoxOut").scrollIntoView({behavior:"smooth",block:"start"})});
}

/* ---------- Team stats ---------- */
/* ---------- Standings + team pages ---------- */
const NBA_CONF={East:["ATL","BOS","BKN","CHA","CHI","CLE","DET","IND","MIA","MIL","NY","ORL","PHI","TOR","WSH"],West:["DAL","DEN","GS","HOU","LAC","LAL","MEM","MIN","NO","OKC","PHX","POR","SA","SAC","UTAH"]};
function nbaTeamLink(t,txt){return `<a href="#nba-team-${t}" class="tlink">${txt||nbaEsc(nbaTm(t))}</a>`}
function nbaForm(t){
  const G=NBA_RES.filter(r=>r[2]===t||r[3]===t).map(r=>{const h=r[3]===t;return (h?r[5]>r[4]:r[4]>r[5])?"W":"L"});
  const l10=G.slice(-10),w=l10.filter(x=>x==="W").length;let st=0,c=G[G.length-1];for(let i=G.length-1;i>=0&&G[i]===c;i--)st++;
  return {l10:`${w}-${l10.length-w}`,streak:c?c+st:"–"};
}
function nbaStandRows(conf){
  const T=NBA_CONF[conf].filter(t=>NBA_TEAM[t]).map(t=>({t,...NBA_TEAM[t],pct:NBA_TEAM[t].g?NBA_TEAM[t].w/NBA_TEAM[t].g:0}))
    .sort((a,b)=>b.pct-a.pct||b.w-a.w||b.mar-a.mar);
  const lead=T[0];return T.map((x,i)=>({...x,rk:i+1,gb:lead?((lead.w-x.w)+(x.l-lead.l))/2:0,...nbaForm(x.t)}));
}
function nbaTeams(el){
  const tbl=conf=>`<div class="card"><h2 style="margin-bottom:6px">${conf}ern Conference</h2><div class="nbatbl"><table class="bxt stand" style="min-width:0"><thead><tr><th>#</th><th>Team</th><th>W-L</th><th>GB</th><th>L10</th><th>Strk</th><th>Home</th><th>Road</th><th>Net</th></tr></thead><tbody>
    ${nbaStandRows(conf).map(x=>{const A=NBA_TADV[x.t],net=A?A.o.rtg-A.d.rtg:x.mar;return `<tr class="${x.rk===6?"cut6":x.rk===10?"cut10":""}"><td>${x.rk}</td><td>${nbaBadge(x.t)} ${nbaTeamLink(x.t,nbaEsc(nbaShort(x.t)))}</td><td><b>${x.w}-${x.l}</b></td><td>${x.gb?x.gb.toFixed(1).replace(".0",""):"–"}</td><td>${x.l10}</td><td class="${/^W/.test(x.streak)?"up":"dn"}">${x.streak}</td><td>${x.hm}</td><td>${x.aw}</td><td class="${net>0?"up":net<0?"dn":""}">${nbaSg(+net.toFixed(1))}</td></tr>`}).join("")}</tbody></table></div>
    <div class="small" style="margin-top:6px">Top 6 make the playoffs; 7–10 go to the play-in. Net = points per 100 possessions scored minus allowed.</div></div>`;
  el.innerHTML=`<h1>NBA Standings</h1><p class="sub">Through ${nbaDayS(window.NBA_THRU||NBA_ASOF)} · updates after every night of games. Tap a team for its schedule, roster, ratings and injuries.</p>
  <div class="grid g2">${tbl("East")}${tbl("West")}</div>`;
}
function nbaSpotTags(t){
  const s=(typeof NBA_SPOT!=="undefined"&&NBA_SPOT[t])||null,R=NBA_REST&&NBA_REST[t];if(!s&&!R)return [];
  const out=[];
  if(R&&R.rest===0)out.push(["😴 Back-to-back","r"]);
  if(s&&s.g6>=4)out.push(["4 games in 6 nights","r"]);else if(s&&s.g4>=3)out.push(["3 games in 4 nights","r"]);
  if(s&&s.trip>=3)out.push([`Road trip game ${s.trip}`,"r"]);
  if(s&&s.home>=3)out.push([`🏠 Home after ${s.home}-game road trip`,"g"]);
  if(R&&R.rest>=2)out.push([`${R.rest} days of rest`,"g"]);
  if(R&&R.b2bNext)out.push(["Plays again tomorrow","n"]);
  return out;
}
function nbaSpotHtml(t){const T=nbaSpotTags(t);return T.length?`<span class="spots">${T.map(([x,c])=>`<span class="pll ${c==="r"?"u":c==="g"?"o":""}">${x}</span>`).join("")}</span>`:""}
function nbaNextHtml(t){
  const N=(typeof NBA_NEXT!=="undefined"&&NBA_NEXT[t])||[],g=nbaGameOf(t);
  const rows=[...(g?[[NBA_SLATE_DATE,g.a===t?g.h:g.a,g.a===t?"A":"H",g.t,1]]:[]),...N];
  if(!rows.length)return `<div class="small">No games in the next 7 days.</div>`;
  return rows.map(r=>`<div class="l5r"><span class="chip ${r[4]?"w":""}" style="${r[4]?"":"background:var(--card2);color:var(--text2)"}">${r[4]?"Today":nbaDayS(r[0]).split(",")[0]}</span><span>${r[2]==="H"?"vs":"@"} ${nbaTeamLink(r[1],nbaEsc(nbaShort(r[1])))}</span><span class="small">${nbaDayS(r[0])}</span><b class="small">${r[3]} ET</b></div>`).join("");
}
function nbaTeamPage(el,t){
  if(!NBA_TEAM[t]){location.hash="nba-teams";return}
  const x=NBA_TEAM[t],A=NBA_TADV[t],f=nbaForm(t),conf=NBA_CONF.East.includes(t)?"East":"West",rk=nbaStandRows(conf).find(r=>r.t===t);
  const tile=(l,v,sub)=>`<div class="stat"><div class="l">${l}</div><div style="font-size:20px;font-weight:800">${v}</div><div class="small">${sub||""}</div></div>`;
  el.innerHTML=`<a href="#nba-teams" class="small" style="color:var(--text2)">← Standings</a>
  <div class="phead"><div class="pnum" style="background:${nbaCol(t)}">${t}</div><div><h1 style="margin:0">${nbaEsc(nbaTm(t))}</h1><div class="sub" style="margin:4px 0 0">${x.w}-${x.l} · ${rk?nbaOrd(rk.rk)+" in the "+conf:""} · ${f.streak} streak</div></div></div>
  <div class="grid g4" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">
    ${tile("Last 10",f.l10)}${tile("Home",x.hm)}${tile("Road",x.aw)}${tile("Points",nbaF(x.ppg),"allowed "+nbaF(x.opp))}
    ${A?tile("Offense rating",nbaF(A.o.rtg),nbaOrd(A.oR.rtg)+" of 30"):""}${A?tile("Defense rating",nbaF(A.d.rtg),nbaOrd(A.dR.rtg)+" of 30"):""}${A?tile("Pace",nbaF(A.pace),nbaOrd(A.paceR)+" fastest"):""}${A?tile("Net rating",nbaSg(+(A.o.rtg-A.d.rtg).toFixed(1)),"per 100 possessions"):""}
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h2>Next 7 days</h2>${nbaNextHtml(t)}</div>
    <div class="card"><h2>Last 5</h2>${nbaLast5(t)}</div>
  </div>
  <div class="card" style="margin-top:14px"><h2>Roster</h2>${nbaPlayerTable(nbaTopPlayers(t,13),{no3:1,nonote:1})}</div>
  <div class="card" style="margin-top:14px"><h2>Injuries</h2>${nbaInjTable(t)}</div>`;
}

/* ---------- Injuries ---------- */
function nbaInjuries(el){
  const tonight=NBA_SLATE.flatMap(g=>[g.a,g.h]);
  const draw=()=>{
    const teams=Object.keys(NBA_TEAMS).filter(t=>NB.ij==="all"||tonight.includes(t)).sort((a,b)=>nbaTm(a)<nbaTm(b)?-1:1);
    document.getElementById("nbaIj").innerHTML=teams.map(t=>`<div class="card"><h2>${nbaTm(t)}${tonight.includes(t)?` <span class="tag imp">plays today</span>`:""}</h2>${nbaInjTable(t)}</div>`).join("");
  };
  el.innerHTML=`<h1>NBA Injuries</h1><p class="sub">From ESPN. <span style="color:#ff9a9d">Out</span> = won't play · <span style="color:#f3c75a">Day-To-Day</span> = might play.</p>
  <div class="seg" style="margin-bottom:12px"><button class="btn" data-ij="tonight">Playing today</button><button class="btn" data-ij="all">All teams</button></div>
  <div class="grid g2" id="nbaIj"></div>`;
  const sync=()=>el.querySelectorAll("[data-ij]").forEach(b=>b.classList.toggle("pri",b.dataset.ij===NB.ij));
  el.querySelectorAll("[data-ij]").forEach(b=>b.onclick=()=>{NB.ij=b.dataset.ij;sync();draw()});
  sync();draw();
}

/* detail data (chances, shot zones, shot types) loads on demand from nba_detail.js — keeps the first page load lighter */
let NBA_DET={ok:typeof NBA_DETAIL_OK!=="undefined",cb:[],busy:0,fail:0};
function nbaDetailEnsure(cb){if(NBA_DET.ok||(NBA_DET.fail&&Date.now()-NBA_DET.fail<60000)){cb&&cb();return}if(cb)NBA_DET.cb.push(cb);if(NBA_DET.busy)return;NBA_DET.busy=1;
  const sc=document.createElement("script");sc.src="nba_detail.js?v="+(typeof BUILD_AT!=="undefined"?BUILD_AT.replace(/\D/g,""):Date.now());
  const done=ok=>{NBA_DET.busy=0;if(ok)NBA_DET.ok=true;else NBA_DET.fail=Date.now();NBA_DET.cb.splice(0).forEach(f=>{try{f()}catch(e){console.error(e)}})};
  sc.onload=()=>done(true);sc.onerror=()=>done(false);document.head.appendChild(sc)}
if(typeof window!=="undefined"&&typeof window.addEventListener==="function")window.addEventListener("load",()=>setTimeout(()=>nbaDetailEnsure(),1200));
function nbaRoute(h){
  const el=document.getElementById("v-nba");
  if(!NBA_DET.ok&&!/^(nba|nba-best|nba-scores|nba-teams|nba-injuries|nba-tomorrow.*)$/.test(h)){const y=scrollY;el.innerHTML=`<div class="small" style="padding:30px 0;text-align:center">Loading…</div>`;return nbaDetailEnsure(()=>{if(!NBA_DET.ok){el.innerHTML=`<div class="small" style="padding:30px 0;text-align:center">Couldn't load NBA details — check your connection and refresh.</div>`;return}const now=(location.hash||"").slice(1);let dn=now;try{dn=decodeURIComponent(now)}catch(e){}if(now===h||dn===h){if(typeof route!=="undefined")route();else nbaRoute(h);scrollTo(0,y)}})}
  if(h.startsWith("nba-game-"))return nbaGame(el,h.slice(9));
  if(h.startsWith("nba-player-"))return nbaPlayer(el,h.slice(11));
  if(h.startsWith("nba-team-"))return nbaTeamPage(el,h.slice(9));
  if(h.startsWith("nba-tomorrow"))return nbaUpcoming(el,h);
  ({"nba-props":nbaProps,"nba-best":nbaBestPage,"nba-players":nbaPlayers,"nba-scores":nbaScores,"nba-teams":nbaTeams,"nba-injuries":nbaInjuries}[h]||nbaGames)(el);
}

/* ---------- Tomorrow & the next few days (schedule from NBA_NEXT) ---------- */
function nbaAddDays(d,n){const x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
function nbaGamesOn(d){
  if(d===NBA_SLATE_DATE)return NBA_SLATE.map(g=>({a:g.a,h:g.h,t:g.t}));
  const out=[];if(typeof NBA_NEXT==="undefined")return out;
  for(const [t,L] of Object.entries(NBA_NEXT))for(const [dd,op,ha,tm] of L)if(dd===d&&ha==="H")out.push({a:op,h:t,t:tm||""});
  const mins=s=>{const m=/(\d+):(\d+)\s*(AM|PM)/.exec(s||"");return m?((+m[1]%12)+(m[3]==="PM"?12:0))*60+ +m[2]:9999};
  return out.sort((x,y)=>mins(x.t)-mins(y.t));
}
function nbaDayTabs(cur){
  const d1=nbaAddDays(NBA_SLATE_DATE,1),d2=nbaAddDays(NBA_SLATE_DATE,2),d3=nbaAddDays(NBA_SLATE_DATE,3);
  const T=[["nba","Today",NBA_SLATE_DATE],["nba-tomorrow","Tomorrow",d1],["nba-tomorrow-2",nbaDayS(d2).split(",")[0],d2],["nba-tomorrow-3",nbaDayS(d3).split(",")[0],d3]];
  return `<div class="gtabs">${T.map(([h,l,d])=>`<a href="#${h}" class="${h===cur?"on":""}">${l}<small>${nbaGamesOn(d).length}</small></a>`).join("")}</div>`;
}
function nbaUpcoming(el,h){
  const n=+(h.split("-")[2]||1),d=nbaAddDays(NBA_SLATE_DATE,n),G=nbaGamesOn(d),prev=nbaGamesOn(nbaAddDays(d,-1));
  const playedPrev=t=>prev.some(g=>g.a===t||g.h===t);
  const card=g=>{const M=nbaModel(g.a,g.h),outA=nbaOutNames(g.a),outH=nbaOutNames(g.h);
    const tag=t=>playedPrev(t)?`<span class="pll u">2nd night of back-to-back</span>`:"";
    const row=t=>`<div class="nbtr"><div class="nbtn">${nbaBadge(t)}<div><b>${nbaEsc(nbaShort(t))}</b> <span class="small">${nbaRec(t)}</span></div></div>${tag(t)}</div>`;
    return `<a class="card nbag" href="#nba-game-${nbaFutId(d,g.a,g.h)}" style="display:block;color:inherit;text-decoration:none"><div class="when"><span><b style="color:var(--text)">${nbaEsc(g.t||"TBD")}</b> ET</span><span class="small">${nbaDayS(d)} · Matchup →</span></div>
      ${row(g.a)}${row(g.h)}
      ${(()=>{const fg={...g,d,fut:true},L=nbaL(fg);if(!L)return M?`<div class="nbsay">Our early number: <b>${nbaShort(M.m>=0?g.h:g.a)} by ${Math.abs(M.m)||"a hair"}</b> · about <b>${M.tot}</b> total points <span class="small">(lines not posted yet)</span></div>`:"";
        const x=nbaGamePick(fg);return `<div class="nbl"><span>Spread <b>${L.sp<=0?g.h:g.a} ${nbaSg(-Math.abs(L.sp))}</b></span><span>Total <b>${L.tot}</b></span>${L.mla!=null?`<span>Win <b>${oddsFmt(L.mla)}</b> / <b>${oddsFmt(L.mlh)}</b></span>`:""}</div>${x?`<div class="nbpick${x.strong?"":" est"}">${x.strong?"⭐":"🔮"} Our pick: <b>${nbaEsc(x.txt)}</b> <span class="small">${x.k.toLowerCase()} · ${oddsFmt(x.odds)} · ${Math.round(x.ch*100)}%</span></div>`:""}`})()}
      ${outA.length||outH.length?`<div class="nbout">Out right now: ${[...outA.map(x=>`${nbaEsc(x)} (${g.a})`),...outH.map(x=>`${nbaEsc(x)} (${g.h})`)].join(", ")}</div>`:""}</a>`};
  el.innerHTML=`<h1>NBA · ${nbaDay(d)}</h1>${nbaDayTabs(h==="nba-tomorrow"?"nba-tomorrow":h)}
  <p class="sub">${G.length} game${G.length===1?"":"s"}. Sportsbook spreads and totals usually post the night before, and player props the morning of the game — they'll appear on the Today tab with every prop for each game.</p>
  <div class="grid g2">${G.map(card).join("")||`<div class="card">No NBA games scheduled.</div>`}</div>
  <p class="note" style="margin-top:8px">"Our early number" comes from each team's scoring margin this season plus home court. Injuries are today's report and can change.</p>`;
}

/* ---------- 🏀 Starting lineups (NBA.com, refreshed every ~20 min before tip-off): Confirmed / Expected starters,
   and a warning when a player who started most of the team's last 5 games isn't in tonight's five ---------- */
function nbaLuCard(g){const L=typeof NBA_LU!=="undefined"&&NBA_LU&&NBA_LU.g&&NBA_LU.g[g.a+"@"+g.h];if(!L||nbaStarted(g))return "";
  const usual=t=>{const S={};let n=0;const last=NBA_RES.filter(r=>r[2]===t||r[3]===t).sort((x,y)=>x[1]<y[1]?1:-1).slice(0,5).map(r=>r[1]);n=last.length;
    for(const [nm,p] of Object.entries(NBA_LOGS))if(p.tm===t)for(const x of p.g)if(last.includes(x[1])&&(x[9]===1||x[9]===true))S[nm]=(S[nm]||0)+1;return Object.keys(S).filter(k=>S[k]>=3&&n>=3)};
  const side=(t,X)=>{if(!X||!X.st.length)return `<div><h3 style="margin:0 0 6px">${nbaBadge(t)} ${nbaEsc(nbaShort(t))}</h3><div class="small">Not posted yet — teams announce about 30 minutes before tip-off.</div></div>`;
    const conf=X.st.every(p=>p[2]==="Confirmed"),inl=new Set(X.st.map(p=>typeof newsNorm!=="undefined"?newsNorm(p[0]):p[0])),miss=usual(t).filter(n=>!inl.has(typeof newsNorm!=="undefined"?newsNorm(n):n));
    return `<div><h3 style="margin:0 0 6px">${nbaBadge(t)} ${nbaEsc(nbaShort(t))} <span class="gkt ${conf?"c":"l"}">${conf?"✅ Confirmed":"🟡 Expected"}</span></h3>
      ${X.st.map(p=>`<div class="lur"><span class="small lup">${nbaEsc(p[1])}</span>${NBA_LOGS[p[0]]?nbaLink(p[0]):nbaEsc(p[0])}</div>`).join("")}
      ${X.st.length>=5&&miss.length?`<div class="small lumiss">⚠️ Not in the lineup: <b>${miss.map(nbaEsc).join(", ")}</b> (started most of the last 5)</div>`:""}
      ${X.out&&X.out.length?`<div class="small" style="margin-top:4px">Inactive: ${X.out.slice(0,8).map(nbaEsc).join(", ")}</div>`:""}</div>`};
  return `<div class="card" style="margin-top:12px"><h2 style="margin-bottom:6px">🏀 Starting lineups</h2><div class="grid g2">${side(g.a,L.a)}${side(g.h,L.h)}</div>
   <div class="small" style="margin-top:6px">From NBA.com · checked ${new Date(NBA_LU.at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})} · the site re-checks about every 20 minutes before tip-off.</div></div>`}
