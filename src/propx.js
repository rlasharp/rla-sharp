/* ---------- Player props extras: alt-line ladder, vs good/bad defenses, vs fast/slow teams (NBA),
   blowout risk (NBA) and game script (NFL). All from real game logs; samples are small early in the season. ---------- */
function pxFair(p){if(!(p>0&&p<1))return "—";return p>=.5?"−"+Math.round(p/(1-p)*100):"+"+Math.round((1-p)/p*100)}
function pxStep(line){return line>=20?5:line>=8?1:1}
/* ladder rows from line−3 steps to line+3 steps; vals = his recent games */
function pxLadder(vals,line,step,note){
  if(!vals.length||!Number.isFinite(line))return "";step=step||pxStep(line);
  const rows=[];for(let i=-3;i<=3;i++){const l=Math.round((line+i*step)*2)/2;if(l>0)rows.push(l)}
  const N=vals.length;
  return `<div class="pxl"><div class="pxh"><span>Line</span><span>Over</span><span>Under</span><span>Fair over</span></div>
   ${rows.map(l=>{const o=vals.filter(v=>v>l).length,u=vals.filter(v=>v<l).length,cur=l===line;
     return `<div class="pxr${cur?" cur":""}"><b>${l}${cur?' <span class="pll o">book</span>':""}</b>
      <span class="pxb"><i class="o" style="width:${o/N*100}%"></i><em>${o}/${N}</em></span>
      <span class="pxb"><i class="u" style="width:${u/N*100}%"></i><em>${u}/${N}</em></span>
      <span class="num">${N>=5?pxFair(o/N):"—"}</span></div>`}).join("")}</div>
   <div class="small" style="margin-top:6px">${note} <b>Fair over</b> = the price that matches how often he cleared it; an alt line is only worth it if the book pays better than that. Alt lines further from the main line usually carry worse odds.</div>`}
/* split table: rows [label, games[], tonight?] → G, avg, over-line count */
function pxTable(rows,val,line,dec,minCol,hdr){
  const R=rows.filter(r=>r[1].length);if(!R.length)return `<div class="small">Not enough games yet.</div>`;
  const av=(a,f)=>a.reduce((s,x)=>s+f(x),0)/a.length;
  return `<div class="nbatbl"><table class="bxt spl pxt" style="min-width:0"><thead><tr><th></th><th>G</th>${minCol?"<th>MIN</th>":""}<th>Avg</th><th>${hdr||"Over "+line}</th></tr></thead><tbody>
   ${R.map(([lab,a,tn,sub])=>{const vs=a.map(val),o=vs.filter(v=>v>line).length;
     return `<tr${tn?' class="tn"':""}><td>${lab}${tn?' <span class="pll o">tonight</span>':""}${sub?`<div class="small">${sub}</div>`:""}</td><td>${a.length}</td>${minCol?`<td>${nbaF(av(a,minCol))}</td>`:""}<td><b>${fmt(av(vs,v=>v),dec)}</b></td><td class="${o/a.length>=.6?"up":o/a.length<=.4?"dn":""}">${o}/${a.length}</td></tr>`}).join("")}</tbody></table></div>`}

/* ===== NBA ===== */
const PX_DEF={pts:d=>d.pts,reb:d=>d.reb,ast:d=>d.ast,"3pm":d=>d.tpa*d.tp/100,"3pa":d=>d.tpa,pa:d=>d.pts+d.ast,pr:d=>d.pts+d.reb,ra:d=>d.reb+d.ast,pra:d=>d.pts+d.reb+d.ast};
function pxNbaRank(k){
  const T=Object.entries(NBA_TADV||{}).filter(([,x])=>x&&x.d&&x.o);const n=T.length;
  const f=PX_DEF[k]?([,x])=>PX_DEF[k](x.d):k==="stl"?([,x])=>x.o.tov:k==="blk"?([,x])=>x.o.paint:null;if(!f)return {};
  const out={};T.map(e=>[e[0],f(e)]).sort((a,b)=>b[1]-a[1]).forEach(([t],i)=>out[t]=[i+1,n]);return out}
function pxNbaPace(){const T=Object.entries(NBA_TADV||{}).filter(([,x])=>x&&x.pace);const out={};T.sort((a,b)=>b[1].pace-a[1].pace).forEach(([t,x],i)=>out[t]=[i+1,T.length,x.pace]);return out}
function pxNbaSpread(tm){const g=nbaGameOf(tm);if(!g||typeof NBA_LINES==="undefined")return null;const L=NBA_LINES[g.a+"@"+g.h];if(!L||L.sp==null)return null;return g.h===tm?L.sp:-L.sp}
function nbaPropXCard(nm){
  const p=NBA_LOGS[nm];if(!p||!p.g.length)return "";
  const props=NBA_PROPS.filter(r=>r[0]===nm&&NBA_MK[r[1]]);const mks=[...new Set(props.map(r=>r[1]))];
  const base=mks.length?mks:["pts","reb","ast","3pm","pra"];let k=NB.pxk&&base.includes(NB.pxk)?NB.pxk:base[0];
  const pr=props.find(r=>r[1]===k);const sAvg=nbaAvg(p,k);
  const line=pr?pr[2]:Math.max(.5,Math.floor(sAvg)+.5);
  const g=nbaGameOf(p.tm),opp=g?(g.a===p.tm?g.h:g.a):null,val=x=>nbaVal(x,k);
  /* ladder: last 10 games, topped up from last season like the bars above */
  const AG=nbaAllG(nm).slice(-10),lv=AG.map(o=>nbaVal(o.x,k)),hasPrev=AG.some(o=>o.prev);
  const ladder=pxLadder(lv,line,pxStep(line),`His last ${lv.length} games${hasPrev?" (some from last season)":""}${pr?"":` — no book line for him in this market, so it's centred on his average`}.`);
  /* vs good / bad defenses (current ranks, 1 = allows the most) */
  const RK=pxNbaRank(k),rk=t=>(RK[t]||[])[0],nT=Object.keys(RK).length||30,orr=opp?rk(opp):null;
  const grp=r=>r==null?null:r<=10?"s":r>nT-10?"t":"m",og=grp(orr);
  const G=p.g;
  const defRows=[["Vs soft defenses",G.filter(x=>grp(rk(x[2]))==="s"),og==="s","top 10 at allowing it"],["Vs middle defenses",G.filter(x=>grp(rk(x[2]))==="m"),og==="m","ranked 11–"+(nT-10)],["Vs tough defenses",G.filter(x=>grp(rk(x[2]))==="t"),og==="t","bottom 10"]];
  /* vs fast / slow teams */
  const PC=pxNbaPace(),pg=t=>{const r=(PC[t]||[])[0];return r==null?null:r<=10?"f":r>nT-10?"sl":"m"},op=opp?pg(opp):null;
  const paceRows=[["Vs fast teams",G.filter(x=>pg(x[2])==="f"),op==="f","top 10 in pace"],["Vs average pace",G.filter(x=>pg(x[2])==="m"),op==="m"],["Vs slow teams",G.filter(x=>pg(x[2])==="sl"),op==="sl","bottom 10 in pace"]];
  /* blowouts: final margin from results */
  const res={};for(const r of NBA_RES)res[r[0]]=r;const mar=x=>{const r=res[x[0]];return r?Math.abs(r[4]-r[5]):null};
  const blowRows=[["Close games",G.filter(x=>mar(x)!=null&&mar(x)<10),null,"decided by under 10"],["Middle",G.filter(x=>mar(x)!=null&&mar(x)>=10&&mar(x)<15),null,"10–14 points"],["Blowouts",G.filter(x=>mar(x)!=null&&mar(x)>=15),null,"decided by 15+"]];
  const sp=pxNbaSpread(p.tm),big=sp==null?null:Math.abs(sp);
  const risk=big==null?"":big>=10?["High","r"]:big>=6.5?["Moderate",""]:["Low","g"];
  const cl=blowRows[0][1],bl=blowRows[2][1],mAvg=a=>a.reduce((s,x)=>s+x[4],0)/a.length;
  const minTxt=cl.length&&bl.length?` In his blowouts he's averaged <b>${nbaF(mAvg(bl))}</b> minutes vs <b>${nbaF(mAvg(cl))}</b> in close games.`:"";
  const rkTxt=orr?`${nbaEsc(nbaShort(opp))} rank <b>${nbaOrd(orr)}</b> of ${nT} at allowing ${NBA_MK[k][1].toLowerCase()} (1st = gives up the most)`:"";
  const pcTxt=opp&&PC[opp]?`${nbaEsc(nbaShort(opp))} play at the <b>${nbaOrd(PC[opp][0])}</b>-fastest pace (${nbaF(PC[opp][2])} possessions a game)`:"";
  return `<div class="card pxc" id="pxCard" style="margin-top:14px"><h2 style="margin-bottom:6px">Alt lines & matchup splits</h2>
   <div class="nbtabs">${base.map(m=>{const r=props.find(z=>z[1]===m);return `<button data-pxk="${m}" class="${m===k?"on":""}">${NBA_MK[m][2]}${r?` <small style="opacity:.75">${r[2]}</small>`:""}</button>`}).join("")}</div>
   <h3>Alt-line ladder · ${NBA_MK[k][1]}</h3>${ladder}
   ${sp!=null?`<h3>Blowout risk tonight: <span class="${risk[1]==="r"?"dn":risk[1]==="g"?"up":""}">${risk[0]}</span></h3>
    <div class="small" style="margin-bottom:6px">${nbaEsc(nbaShort(p.tm))} are ${sp<0?`favored by <b>${-sp}</b>`:sp>0?`<b>${sp}</b>-point underdogs`:"a pick'em"}. Spreads of 10+ often end early, and starters sit the 4th quarter.${minTxt}</div>`:`<h3>Close games vs blowouts</h3>`}
   ${pxTable(blowRows,val,line,1,x=>x[4])}
   <h3>Vs good & bad defenses</h3>${rkTxt?`<div class="small" style="margin-bottom:6px">${rkTxt}.</div>`:""}${pxTable(defRows,val,line,1,x=>x[4])}
   <h3>Vs fast & slow teams</h3>${pcTxt?`<div class="small" style="margin-bottom:6px">${pcTxt}. Faster games mean more shots for everyone.</div>`:""}${pxTable(paceRows,val,line,1,x=>x[4])}
   <div class="small" style="margin-top:8px">This season's games only (${G.length}). Defense and pace groups use each team's current rank, so they shift as the season goes on. Small samples — read as leans, not guarantees.</div></div>`}
function nbaWirePx(el,nm){const re=()=>{const c=document.getElementById("pxCard");if(!c)return;c.outerHTML=nbaPropXCard(nm);nbaWirePx(el,nm)};el.querySelectorAll("[data-pxk]").forEach(b=>b.onclick=()=>{NB.pxk=b.dataset.pxk;const c=document.getElementById("pxCard");if(!c)return;c.outerHTML=nbaPropXCard(nm);nbaWirePx(el,nm)})}

/* ===== NFL ===== */
function pxNflSpread(t){const o=oppOf(t);if(!o||typeof LINES==="undefined")return null;const L=LINES[o.g.id];if(!L||L.sp==null)return null;return o.home?L.sp:-L.sp}
function nflPropXCard(pl,k,line,CL){
  const L=CL.filter(l=>Number.isFinite(stat(l,k)));if(!L.length||!Number.isFinite(line))return "";
  const val=l=>stat(l,k),dec=MARKETS[k].cnt?1:0,td=k==="anyTD",o=oppOf(pl.team),opp=o?o.opp:null;
  const ladder=td?"":pxLadder(L.slice(-10).map(val),line,line>=20?5:1,`His last ${Math.min(10,L.length)} games this season.`);
  const rk=t=>{const r=dvpFor(t,pl.pos,k).rank;return Number.isFinite(r)?r:null},grp=r=>r==null?null:r<=10?"s":r>=23?"t":"m",og=opp?grp(rk(opp)):null;
  const defRows=[["Vs soft defenses",L.filter(l=>grp(rk(l.opp))==="s"),og==="s","top 10 at allowing it"],["Vs middle defenses",L.filter(l=>grp(rk(l.opp))==="m"),og==="m","ranked 11–22"],["Vs tough defenses",L.filter(l=>grp(rk(l.opp))==="t"),og==="t","bottom 10"]];
  const SP=typeof NFL_SPR!=="undefined"?NFL_SPR:{},gs=l=>SP[l.week+"|"+(l.team||pl.team)];
  const sp=pxNflSpread(pl.team),fav=sp==null?null:sp<0?"f":sp>0?"d":null;
  const scr=[["Favored",L.filter(l=>gs(l)&&gs(l)[0]<0),fav==="f"],["Underdog",L.filter(l=>gs(l)&&gs(l)[0]>0),fav==="d"],
    ["Team won",L.filter(l=>gs(l)&&gs(l)[1]>0)],["Team lost",L.filter(l=>gs(l)&&gs(l)[1]<0)],
    ["Won by 14+",L.filter(l=>gs(l)&&gs(l)[1]>=14),null,"blowout win"],["Lost by 14+",L.filter(l=>gs(l)&&gs(l)[1]<=-14),null,"blowout loss"]];
  const tip={RB:"Running backs usually get more carries when their team is ahead and running out the clock.",WR:"Receivers usually see more targets when their team is behind and throwing to catch up.",TE:"Tight ends often see more targets when their team is behind.",QB:"Quarterbacks usually throw more when behind — but a team that's ahead early can still pile up yards."}[pl.pos]||"";
  const tl=td?"a TD":line;
  const note=`<div class="small" style="margin-top:8px">${CUR} games only (${L.length}). Spreads are nflverse closing lines; defense groups use each team's current rank. ${td?"For TDs, “Over” = games he scored. ":""}Small samples — leans, not guarantees.</div>`;
  return {alt:ladder?ladder:`<div class="small">No ladder for touchdowns — the line is “scores or not”.</div>`,
   gs:`<div class="small" style="margin-bottom:6px">${sp!=null?`${esc(short(pl.team))} are ${sp<0?`favored by <b>${-sp}</b>`:sp>0?`<b>${sp}</b>-point underdogs`:"a pick'em"} this week. `:""}${tip}</div>${pxTable(scr,td?(l=>val(l)>0?1:0):val,td?.5:line,td?1:dec,null,td?"Scored":null)}${note}`,
   def:`${opp&&rk(opp)?`<div class="small" style="margin-bottom:6px">${esc(short(opp))} rank <b>${ordinal(rk(opp))}</b> at allowing ${MARKETS[k].n.toLowerCase()} to ${POSNAME[pl.pos]} (1st = gives up the most).</div>`:""}${pxTable(defRows,td?(l=>val(l)>0?1:0):val,td?.5:line,td?1:dec,null,td?"Scored":null)}${note}`}}

/* ===== Game filter: his games by his team's spread (− = favored) and, for NBA, minutes played =====
   Two-handle sliders update the results in place (no page re-render) so dragging stays smooth. */
const PXS={},PXG={};
function pxSpTxt(x){return x<=-15?"Fav 15+":x>=15?"Dog 15+":x===0?"PK":(x>0?"+":"−")+Math.abs(x)}
function pxSpRange(x,y){if(x<=-15&&y>=15)return "Any spread";if(x<=-15)return y<=-.5&&y>-1?"Favored":y<0?`Fav by ${-y}+`:`${pxSpTxt(y)} or better`;if(y>=15)return x>=.5&&x<1?"Underdog":x>0?`Dog by ${x}+`:`${pxSpTxt(x)} or worse`;return `${pxSpTxt(x)} to ${pxSpTxt(y)}`}
function pxClamp(v,a,b){return Math.max(a,Math.min(b,v))}
function pxDual(name,lab,min,max,step,lo,hi,ends,pre){
  return `<div class="pxfr" data-dr="${name}"><div class="pxfl"><span>${lab}</span><b class="noglo" data-out="${name}"></b></div>
   <div class="dr"><div class="drt"><i data-fill="${name}"></i></div>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${lo}" data-r="${name}|lo" aria-label="${lab} from">
    <input type="range" min="${min}" max="${max}" step="${step}" value="${hi}" data-r="${name}|hi" aria-label="${lab} to"></div>
   <div class="dra">${ends.map(e=>`<span>${e}</span>`).join("")}</div>
   <div class="pxpre">${pre.map(p=>`<button data-pre="${name}|${p[0]}|${p[1]}">${p[2]}</button>`).join("")}</div></div>`}
/* G: [{sp, v, min?, lab}] oldest first */
function pxFilterBlock(key,SETS,line,tonight,unit,dec,isTD,minAvg,tonTot,TR,MN,P){const NT=key.startsWith("nfl")?"Near this game":"Near tonight";
  const G=SETS.ssn;
  MN=MN||{lab:"Minutes played",max:48,u:" min",pre:[20,30],w:4,any:"Any minutes"};const MX=MN.max;
  const hasMin=G.some(g=>g.min!=null),tn=tonight!=null?Math.round(tonight*2)/2:null;
  const S0=PXS[key]||(PXS[key]={lo:-15,hi:15,mlo:0,mhi:MX});
  const [t0,t1,tw]=TR,tt=tonTot!=null?Math.round(tonTot*2)/2:null,hasTot=G.some(g=>g.tot!=null);if(S0.tlo==null){S0.tlo=t0;S0.thi=t1}
  PXG[key]={SETS,line,unit,dec,isTD,TR,MN,TN:P&&P.tn};if(!S0.set)S0.set="ssn";
  const totPre=[[t0,t1,"Any"]].concat(tt!=null?[[pxClamp(tt-tw,t0,t1),pxClamp(tt+tw,t0,t1),`${NT} (${tt})`]]:[]).concat([[t0,(t0+t1)/2,`Low (${(t0+t1)/2} or less)`],[(t0+t1)/2,t1,`High (${(t0+t1)/2}+)`]]);
  const spPre=[[-15,-7,"Fav 7+"],[-15,-.5,"Favored"],[.5,15,"Underdog"],[7,15,"Dog 7+"]].concat(tn!=null?[[pxClamp(tn-3,-15,15),pxClamp(tn+3,-15,15),NT]]:[]).concat([[-15,15,"Any"]]);
  const ma=minAvg!=null?Math.round(minAvg):null;
  const mnPre=[[0,MX,"Any"]].concat(MN.pre.map(v=>[v,MX,v+(MN.u==="%"?"%+":"+")])).concat(ma!=null?[[pxClamp(ma-MN.w,0,MX),pxClamp(ma+MN.w,0,MX),`His usual (${ma}${MN.u==="%"?"%":""}±${MN.w})`]]:[]);
  return `<div class="pxf" data-pxf="${esc(key)}">
   ${P&&P.head?P.head:""}
   <details class="pxfd"${S0.open?" open":""}><summary class="pxfs"><span class="pxft">🎚 <b>Filters</b></span><span class="pxfc noglo" data-fsum></span><span class="pxchev">›</span></summary><div class="pxrw"><button type="button" class="pxrst" data-frst>↺ Reset all filters</button></div>
   ${tn!=null?`<div style="margin:8px 0 2px"><span class="pxtn noglo">${key.startsWith("nfl")?"This game"+(typeof pxGameDay!=="undefined"?pxGameDay(key):""):"Tonight"}: ${pxSpTxt(tn)}${tt!=null?" · O/U "+tt:""}</span></div>`:""}
   ${G.some(g=>g.ha)?`<div class="pxfr"><div class="pxfl"><span>Situation</span>${P&&P.tn?`<button class="likeT" data-like="1">🎯 Like this game</button>`:""}</div>
    ${Object.entries(PX_SIT).map(([g,[lab,o]])=>{if(g!=="ven"&&!G.some(x=>x[g]))return "";
      let opts=Object.entries(o);if(g==="qb"){const C={};for(const x of G)if(x.qb)C[x.qb]=(C[x.qb]||0)+1;const L=Object.entries(C).sort((a,b)=>b[1]-a[1]);if(L.length<2)return "";opts=L.map(([n,c],i)=>[n,`${i===0?"His usual · ":""}${esc(pxLast(n))} <small>${c}</small>`])}
      const T9=P&&P.tn,lk=T9&&T9.oppT&&T9[g]&&["opp","pace","dvp"].includes(g)?(()=>{const R=pxNflRanks(),r=g==="opp"?R.opp[T9.oppT]:g==="pace"?R.pace[T9.oppT]:(R.dvp[T9.pos]||{})[T9.oppT];return `<button data-sit="${g}|${T9[g]}" class="pxlk">🎯 Like ${esc(T9.oppT)} <small>${o[T9[g]]}${r?" · "+ordinal(r):""}</small></button>`})():"";
      return `<div class="sitr"><span>${lab}</span><div class="pxpre">${[["","Any"],...opts].map(([v,l],i)=>`${i===1?lk:""}<button data-sit="${g}|${esc(v)}">${l}${P&&P.tn&&P.tn[g]===v&&v?" •":""}</button>`).join("")}</div></div>`}).join("")}</div>`:""}
   ${pxDual("sp","Team's spread",-15,15,.5,S0.lo,S0.hi,["Favored","PK","Underdog"],spPre)}
   ${hasTot?pxDual("tt","Game total (O/U)",t0,t1,.5,S0.tlo,S0.thi,[String(t0),String((t0+t1)/2),String(t1)],totPre):""}
   ${hasMin?pxDual("mn",MN.lab,0,MX,1,S0.mlo,S0.mhi,MN.u==="%"?["0%","50%","100%"]:["0",String(MX/2),String(MX)],mnPre):""}
   ${key.startsWith("nfl")&&G.some(g=>g.tg>0)?(()=>{if(S0.glo==null){S0.glo=0;S0.ghi=15}const T=G.filter(g=>g.tg!=null),ta=Math.round(T.reduce((q,g)=>q+g.tg,0)/Math.max(1,T.length));return pxDual("tg","Targets",0,15,1,S0.glo,S0.ghi,["0","7","15"],[[0,15,"Any"],[5,15,"5+"],[8,15,"8+"],[10,15,"10+"],[Math.max(0,ta-2),Math.min(15,ta+2),`His usual (${ta}±2)`]])})():""}
   ${P&&P.mates?P.mates:""}
   ${P&&P.extra?P.extra:""}
   </details>
   ${P&&P.big?`<div class="pxprop noglo"><div class="pxpl">${P.big}</div><div class="pxpm"><b>${P.name}</b><span>${P.sub}</span></div></div>`:""}
   ${typeof pxSideTg!=="undefined"?pxSideTg():""}<div class="pxset">${[["l5","L5"],["l10","L10"],["ssn","Season"],["h2h","H2H"],["vp","Vs position"]].map(([v,l])=>`<button data-set="${v}"${SETS[v]&&SETS[v].length?"":" disabled"}>${l}<small>${SETS[v]?SETS[v].length:0}</small></button>`).join("")}</div>
   <div class="small pxsetn" data-setn></div>
   <div data-res></div>
   </div>`}
function pxPred(key){const S0=PXS[key],D=PXG[key],TR=D.TR;const tlo=Math.min(S0.tlo,S0.thi),thi=Math.max(S0.tlo,S0.thi),lo=Math.min(S0.lo,S0.hi),hi=Math.max(S0.lo,S0.hi),mlo=Math.min(S0.mlo,S0.mhi),mhi=Math.max(S0.mlo,S0.mhi);
  const spAny=lo<=-15&&hi>=15,ttAny=tlo<=TR[0]&&thi>=TR[1];
  return g=>(spAny||(g.sp!=null&&(lo<=-15||g.sp>=lo)&&(hi>=15||g.sp<=hi)))&&(g.min==null||(g.min>=mlo&&(mhi>=D.MN.max||g.min<=mhi)))&&(ttAny||g.tot!=null&&((tlo<=TR[0]||g.tot>=tlo)&&(thi>=TR[1]||g.tot<=thi)))&&Object.keys(PX_SIT).every(k=>!S0[k]||(k==="ven"?g.ha:g[k])===S0[k])&&(S0.glo==null||((S0.glo<=0||(g.tg!=null&&g.tg>=S0.glo))&&(S0.ghi>=15||(g.tg!=null&&g.tg<=S0.ghi))))&&(!S0.mates||Object.entries(S0.mates).every(([n,v])=>{if(g.wk==null)return false;const p=nflMatePlayed(n,g.wk);return p==null?false:(v==="w"?p:!p)}))}
function pxResHtml(key){
  const S0=PXS[key],D=PXG[key];if(!S0||!D)return "";const {SETS,line,unit,dec,isTD,TR}=D;const G=SETS[S0.set]||SETS.ssn;const tlo=Math.min(S0.tlo,S0.thi),thi=Math.max(S0.tlo,S0.thi);
  const lo=Math.min(S0.lo,S0.hi),hi=Math.max(S0.lo,S0.hi),mlo=Math.min(S0.mlo,S0.mhi),mhi=Math.max(S0.mlo,S0.mhi);
  const spAny=lo<=-15&&hi>=15,ttAny=tlo<=TR[0]&&thi>=TR[1];const inSp=g=>spAny||(g.sp!=null&&(lo<=-15||g.sp>=lo)&&(hi>=15||g.sp<=hi)),inMn=g=>g.min==null||(g.min>=mlo&&(mhi>=D.MN.max||g.min<=mhi)),inTt=g=>ttAny||g.tot!=null&&((tlo<=TR[0]||g.tot>=tlo)&&(thi>=TR[1]||g.tot<=thi));
  const W=G,noLn=(!spAny||!ttAny)?G.filter(g=>g.sp==null).length:0,M=W.filter(pxPred(key)),N=M.length;
  if(!W.length)return `<div class="small">No games in this sample.</div>`;
  const av=a=>a.length?fmt(a.reduce((s,g)=>s+g.v,0)/a.length,dec):"—",ov=a=>a.filter(g=>pxHit(g.v,isTD?.5:line)).length,r=N?ov(M)/N:null;
  return `${noLn?`<div class="small" style="margin-bottom:6px">${noLn} game${noLn>1?"s":""} in this sample have no spread/total on file (older games), so the line filters leave ${noLn>1?"them":"it"} out.</div>`:""}<div class="pxsum"><div><b>${N}<small>/${W.length}</small></b><span>games</span></div><div><b>${av(M)}</b><span>avg ${isTD?"TDs":unit} · unfiltered ${av(W)}</span></div><div><b class="${r!=null&&r>=.6?"up":r!=null&&r<=.4?"dn":""}">${N?ov(M)+"/"+N:"—"}</b><span>${isTD?(PXSIDE==="u"?"no TD":"scored"):pxSW()+" "+line}</span></div></div>
   ${N?(typeof nbaMiniBars!=="undefined"?nbaMiniBars(M.slice(-12).map(g=>g.v),isTD?.5:line,M.slice(-12).map(g=>`${g.who?esc(g.who):esc(g.lab)}<small>${g.sp==null?"":g.sp===0?"PK":(g.sp>0?"+":"−")+Math.abs(g.sp)}</small>`)):""):`<div class="small" style="padding:6px 0">No games in this range yet — widen the sliders.</div>`}`}
function pxPaint(f){const key=f.dataset.pxf.replace(/&amp;/g,"&").replace(/&quot;/g,'"'),S0=PXS[key];if(!S0)return;
  const set=(nm,a,b,mn,mx,txt)=>{const o=f.querySelector(`[data-out="${nm}"]`);if(!o)return;const x=Math.min(a,b),y=Math.max(a,b);o.textContent=txt(x,y);
    const fl=f.querySelector(`[data-fill="${nm}"]`);fl.style.left=(x-mn)/(mx-mn)*100+"%";fl.style.right=(100-(y-mn)/(mx-mn)*100)+"%";
    f.querySelector(`[data-r="${nm}|lo"]`).value=a;f.querySelector(`[data-r="${nm}|hi"]`).value=b;
    f.querySelectorAll(`[data-pre^="${nm}|"]`).forEach(p=>{const [,pa,pb]=p.dataset.pre.split("|");p.classList.toggle("on",+pa===x&&+pb===y)})};
  set("sp",S0.lo,S0.hi,-15,15,pxSpRange);
  const TR=PXG[key].TR;set("tt",S0.tlo,S0.thi,TR[0],TR[1],(x,y)=>x<=TR[0]&&y>=TR[1]?"Any total":x<=TR[0]?`${y} or less`:y>=TR[1]?`${x} or more`:`${x} to ${y}`);
  if(S0.glo!=null)set("tg",S0.glo,S0.ghi,0,15,(x,y)=>x<=0&&y>=15?"Any targets":y>=15?`${x}+ targets`:`${x}–${y} targets`);
  const MN=PXG[key].MN;set("mn",S0.mlo,S0.mhi,0,MN.max,(x,y)=>x<=0&&y>=MN.max?MN.any:MN.u==="%"?`${x}% to ${y}%`:`${x} to ${y} min`);
  {const TR2=PXG[key].TR,MN2=PXG[key].MN,on=[];const x=Math.min(S0.lo,S0.hi),y=Math.max(S0.lo,S0.hi);if(x>-15||y<15)on.push(["sp",pxSpRange(x,y)]);
   const a=Math.min(S0.tlo,S0.thi),b=Math.max(S0.tlo,S0.thi);if(f.querySelector('[data-dr="tt"]')&&(a>TR2[0]||b<TR2[1]))on.push(["tt",`O/U ${a<=TR2[0]?"≤"+b:b>=TR2[1]?a+"+":a+"–"+b}`]);
   const c=Math.min(S0.mlo,S0.mhi),d=Math.max(S0.mlo,S0.mhi);if(f.querySelector('[data-dr="mn"]')&&(c>0||d<MN2.max))on.push(["mn",MN2.u==="%"?`${c}–${d}% snaps`:`${c}–${d} min`]);
   for(const g in PX_SIT)if(S0[g])on.push(["sit|"+g,g==="qb"?"QB "+pxLast(S0[g]):PX_SIT[g][0].replace("Opp ","Opp ")+": "+PX_SIT[g][1][S0[g]]]);
   if(S0.mates)for(const [n,v] of Object.entries(S0.mates))on.push(["nmt|"+n,(v==="w"?"With ":"Without ")+pxLast(n)]);
   if(S0.glo!=null&&(S0.glo>0||S0.ghi<15))on.push(["tg",S0.ghi>=15?`${Math.min(S0.glo,S0.ghi)}+ targets`:`${Math.min(S0.glo,S0.ghi)}–${Math.max(S0.glo,S0.ghi)} targets`]);
   f.querySelectorAll("[data-sit]").forEach(b=>{const [g,v]=b.dataset.sit.split("|");b.classList.toggle("on",(S0[g]||"")===v)});
   const fs=f.querySelector("[data-fsum]");if(fs)fs.innerHTML=on.length?on.map(([n,t])=>`<span class="fchip" data-fclr="${esc(n)}">${esc(t)} ✕</span>`).join("")+`<span class="fchip frst" data-frst>↺ Reset</span>`:`<span class="fany">Any spread · total · ${MN2.u==="%"?"snaps":"minutes"}</span>`;
   f.querySelectorAll("[data-fclr]").forEach(ch=>ch.onclick=e=>{e.preventDefault();e.stopPropagation();const n=ch.dataset.fclr;if(n.startsWith("sit|")){S0[n.slice(4)]="";pxPaint(f);return}if(n.startsWith("nmt|")){delete S0.mates[n.slice(4)];if(!Object.keys(S0.mates).length)delete S0.mates;pxPaint(f);f.querySelectorAll("[data-nmt]").forEach(b=>{const [m,v]=b.dataset.nmt.split("|");b.classList.toggle("on",((S0.mates||{})[m]||"")===v)});return}if(n==="tg"){S0.glo=0;S0.ghi=15;pxPaint(f);return}if(n==="sp"){S0.lo=-15;S0.hi=15}else if(n==="tt"){S0.tlo=TR2[0];S0.thi=TR2[1]}else{S0.mlo=0;S0.mhi=MN2.max}pxPaint(f)})}
  {const D=PXG[key],pr=pxPred(key),ln=D.isTD?.5:D.line;f.querySelectorAll("[data-set]").forEach(b=>{const A=(D.SETS[b.dataset.set]||[]).filter(pr),o=A.filter(g=>pxHit(g.v,ln)).length,sm=b.querySelector("small");if(sm)sm.innerHTML=A.length?`<b class="${o/A.length>=.6?"up":o/A.length<=.4?"dn":""}">${o}/${A.length}</b>`:"–"})}
  f.querySelectorAll("[data-set]").forEach(b=>b.classList.toggle("on",b.dataset.set===S0.set));
  const sn=f.querySelector("[data-setn]");if(sn)sn.textContent={l5:"His last 5 games this season.",l10:"His last 10 games this season.",ssn:"All his games this season.",h2h:`His games vs ${pxOppW(key)} opponent — this season and last.`,vp:`Starters at his position vs ${pxOppW(key)} opponent this season — what they did against ${pxOppW(key)} line.`}[S0.set]||"";
  f.querySelector("[data-res]").innerHTML=pxResHtml(key)}
function pxFilterWire(root){
  root.querySelectorAll("[data-pxf]").forEach(f=>{const key=f.dataset.pxf.replace(/&amp;/g,"&").replace(/&quot;/g,'"');
    f.querySelectorAll("input[data-r]").forEach(inp=>inp.oninput=()=>{const [nm,w]=inp.dataset.r.split("|"),S0=PXS[key];S0[nm==="sp"?w:nm==="tt"?"t"+w:nm==="tg"?"g"+w:"m"+w]=+inp.value;pxPaint(f)});
    f.querySelectorAll("[data-nmt]").forEach(b=>b.onclick=e=>{e.stopPropagation();const [m,v]=b.dataset.nmt.replace(/&#39;/g,"'").replace(/&amp;/g,"&").split("|"),S1=PXS[key];S1.mates=S1.mates||{};if(v)S1.mates[m]=v;else delete S1.mates[m];if(!Object.keys(S1.mates).length)delete S1.mates;f.querySelectorAll("[data-nmt]").forEach(x=>{const [mm,vv]=x.dataset.nmt.replace(/&#39;/g,"'").replace(/&amp;/g,"&").split("|");x.classList.toggle("on",((S1.mates||{})[mm]||"")===vv)});pxPaint(f)});
    f.querySelectorAll("[data-sit]").forEach(b=>b.onclick=e=>{e.stopPropagation();const [g,v]=b.dataset.sit.split("|");PXS[key][g]=v;pxPaint(f)});
    {const lk=f.querySelector("[data-like]");if(lk)lk.onclick=e=>{e.stopPropagation();const t=PXG[key].TN||{};for(const g in PX_SIT)PXS[key][g]=(g==="ven"||g==="rest")?(t[g]||""):(PXS[key][g]||"");pxPaint(f)}}
    f.querySelectorAll("[data-set]").forEach(b=>b.onclick=e=>{e.stopPropagation();if(b.disabled)return;PXS[key].set=b.dataset.set;pxPaint(f)});
    f.querySelectorAll("[data-pre]").forEach(b=>b.onclick=e=>{e.stopPropagation();const [nm,a,c]=b.dataset.pre.split("|"),S0=PXS[key];if(nm==="sp"){S0.lo=+a;S0.hi=+c}else if(nm==="tt"){S0.tlo=+a;S0.thi=+c}else if(nm==="tg"){S0.glo=+a;S0.ghi=+c}else{S0.mlo=+a;S0.mhi=+c}pxPaint(f)});
    const dd=f.querySelector("details.pxfd");if(dd)dd.ontoggle=()=>{PXS[key].open=dd.open};
    pxPaint(f)})}
function nbaRowPx(x,k,who){const SPR=typeof NBA_SPR!=="undefined"?NBA_SPR:{},s=SPR[x[0]];const sp=s?(x[3]==="H"?s[3]:-s[3]):null;
  return {sp,tot:s?s[4]:null,v:nbaVal(x,k),min:x[4],lab:who?"":(x[3]==="H"?"":"@")+x[2],who}}
function pxNbaSets(nm,k,opp){const p=NBA_LOGS[nm],ssn=p.g.map(x=>nbaRowPx(x,k));
  const prev=((typeof NBA_PREV!=="undefined"&&NBA_PREV[nm])||[]).filter(x=>x[2]===opp).map(x=>Object.assign(nbaRowPx(x,k),{lab:(x[3]==="H"?"":"@")+x[2]+" ’"+x[1].slice(2,4)}));
  const h2h=opp?prev.concat(p.g.filter(x=>x[2]===opp).map(x=>nbaRowPx(x,k))):[];
  let vp=[];if(opp&&p.p5){const idx=nbaDvpIdx(),t=[];for(const key in idx){if(!key.endsWith("|"+opp))continue;for(const o of (idx[key][p.p5]||[]))if(o.nm!==nm)t.push([o.x[1],nbaRowPx(o.x,k,pxLast(o.nm))])}
    vp=t.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).map(a=>a[1])}
  return {l5:ssn.slice(-5),l10:ssn.slice(-10),ssn,h2h,vp}}
function pxNflSets(pl,k,CL){const SP=typeof NFL_SPR!=="undefined"?NFL_SPR:{},U=typeof USAGE_RAW!=="undefined"?USAGE_RAW:{},o=oppOf(pl.team),opp=o?o.opp:null;
  const row=(l,who)=>{const s=l.season===CUR?SP[l.week+"|"+(l.team||pl.team)]:null,u=U[l.player||pl.name],sn=l.season===CUR&&u&&u.wk&&u.wk[l.week]?u.wk[l.week][0]:null;
    const rs=l.season===CUR&&typeof NFL_RST!=="undefined"?NFL_RST[l.week+"|"+(l.team||pl.team)]:null,wk=l.season===CUR&&!who?l.week:null,tg=l.season===CUR&&u&&u.wk&&u.wk[l.week]?u.wk[l.week][1]:(l.tgt!=null?l.tgt:null);return {...(l.season===CUR?pxNflSit(l.opp,pl.pos,l.week,l.team||pl.team):{}),wk,tg,ha:+l.home?"H":"A",rest:rs==null?null:rs<=5?"short":rs>=12?"bye":"norm",sp:s?s[0]:null,tot:s&&s[2]!=null?s[2]:null,min:sn,v:k==="anyTD"?(stat(l,k)>0?1:0):stat(l,k),lab:who?"":(+l.home?"":"@")+l.opp+(l.season!==CUR?" ’"+String(l.season).slice(2):""),who}};
  const ok=l=>Number.isFinite(stat(l,k)),ssn=CL.filter(ok).map(l=>row(l));
  const h2h=opp?pLogs(pl.name).filter(l=>l.opp===opp&&ok(l)).map(l=>row(l)):[];
  const vp=opp?S.playerLogs.filter(l=>l.season===CUR&&l.opp===opp&&l.pos===pl.pos&&l.player!==pl.name&&ok(l)).filter(l=>{const u=U[l.player];const sn=u&&u.wk&&u.wk[l.week]?u.wk[l.week][0]:null;return sn==null?true:sn>=50})
    .sort((a,b)=>a.week-b.week).map(l=>row(l,pxLast(String(l.player)))):[];
  return {l5:ssn.slice(-5),l10:ssn.slice(-10),ssn,h2h,vp}}
function pxNbaTot(tm){const g=nbaGameOf(tm);if(!g||typeof NBA_LINES==="undefined")return null;const L=NBA_LINES[g.a+"@"+g.h];return L&&L.tot!=null?L.tot:null}
function pxNflTot(t){const o=oppOf(t);if(!o||typeof LINES==="undefined")return null;const L=LINES[o.g.id];return L&&L.tot!=null?L.tot:null}

function pxLast(n){const w=n.split(" ").filter(x=>!/^(Jr\.?|Sr\.?|II|III|IV|V)$/i.test(x));return w[w.length-1]||n}

/* NFL: one card per prop — sample tabs + spread / total / snap sliders + bar chart (replaces the old "last N games" chart) */
function nflPropHead(pl,k,line){const o0=oppOf(pl.team),closed=!!(o0&&nflStarted(o0.g)),td=k==="anyTD",alt=!td&&!closed&&typeof loAltOdds!=="undefined"?loAltOdds(pl.name,k):null,rp0=closed?null:realProp(pl.name,k),rp=alt?[alt.line,alt.o,alt.u,alt.ob||alt.ub||""]:rp0,main=lineFor(pl.name,k),u=({passYds:"PASS YDS",comp:"COMP",passTD:"PASS TD",int:"INT",rushYds:"RUSH YDS",rushAtt:"RUSH ATT",rec:"REC",recYds:"REC YDS",rushRec:"RUSH+REC",anyTD:"ANY TD"})[k]||"";
  const own=S.lines[pl.name+"|"+k];
  return `<div class="pcl noglo"><div class="pcv">${td?"TD":line}<small>${u}</small>${!td&&!closed&&typeof loStep!=="undefined"?loStep(pl.name,k,main):""}</div><div class="pcm"><b>${td?"Anytime touchdown":MARKETS[k].n}</b>${alt&&typeof loAltChip!=="undefined"?loAltChip(pl.name,k):""}<div class="pco">${rp?`${rp[1]!=null?`<span class="o">${td?"Yes":"Over"} ${amTxt(rp[1])}</span>`:""}${rp[2]!=null?`<span class="u">Under ${amTxt(rp[2])}</span>`:""}${rp[3]?`<span class="bk">${esc(rp[3])}</span>`:""}`:`<span class="bk">${closed?"🔒 Game started — pregame lines closed":own?"Your line":"No book line yet · his season average"}</span>`}</div></div></div>
   ${alt?"":`${rp&&typeof nflVerdict!=="undefined"?nflVerdict(pl.name,k):""}${rp?trackRow({pl,k}):""}`}`}
function nflPropFilterCard(pl,k,line,CL){const td=k==="anyTD",dec=MARKETS[k].cnt?1:0,sp=pxNflSpread(pl.team);
  const o9=oppOf(pl.team),rr=o9&&typeof NFL_RST!=="undefined"?NFL_RST[(o9.g.wk||PLAYS_WEEK)+"|"+pl.team]:null;
  const Q9=o9&&typeof QB1_STATUS!=="undefined"&&QB1_STATUS[pl.team],P={tn:o9?{...pxNflSit(o9.opp,pl.pos,null,null),oppT:o9.opp,pos:pl.pos,qb:Q9?(/^(out|doubtful|injured reserve|ir)\b/i.test(Q9.now||"")?Q9.sub:Q9.qb):"",ven:o9.home?"H":"A",rest:rr==null?"":rr<=5?"short":rr>=12?"bye":"norm"}:null,head:nflPropHead(pl,k,line),
    mates:nflMateHtml(pl,"nfl|"+pl.name),
    extra:`<div class="pxfr"><div class="pxfl"><span>✏️ Your sportsbook's line</span><input type="number" step=".5" id="lineIn" value="${line}" class="pxli"></div><div class="small">Different line at your book? Type it and every hit rate re-checks against it.</div></div>`};
  return `<div class="card" id="pxNfl" style="padding:10px">${pxFilterBlock("nfl|"+pl.name,pxNflSets(pl,k,CL),td?.5:line,sp,MARKETS[k].u,dec,td,(typeof USAGE_RAW!=="undefined"&&USAGE_RAW[pl.name]&&USAGE_RAW[pl.name].s)?USAGE_RAW[pl.name].s.snap:null,pxNflTot(pl.team),[35,57,3],{lab:"Snap share",max:100,u:"%",pre:[50,70],w:10,any:"Any snap share"},P)}</div>`}

/* ===== Swipe left/right on a prop chart to move to the next/previous prop ===== */
function pxSwipe(area,btnSel){
  if(!area||area._sw)return;area._sw=1;let x0=null,y0=null,t0=0;
  area.addEventListener("touchstart",e=>{const t=e.target;if(t.closest(".pxfd,input,select,textarea,.dr,.nbtabs,.pxset,button,a")){x0=null;return}const p=e.touches[0];x0=p.clientX;y0=p.clientY;t0=Date.now()},{passive:true});
  area.addEventListener("touchend",e=>{if(x0==null)return;const p=e.changedTouches[0],dx=p.clientX-x0,dy=p.clientY-y0;x0=null;
    if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.6||Date.now()-t0>800)return;
    const B=[...document.querySelectorAll(btnSel)];const i=B.findIndex(b=>b.classList.contains("on"));if(i<0)return;const n=B[i+(dx<0?1:-1)];if(!n)return;
    n.click();setTimeout(()=>{const on=document.querySelector(btnSel+".on");if(on&&on.scrollIntoView)on.scrollIntoView({inline:"center",block:"nearest"})},40)},{passive:true});
}
/* ===== Recently viewed players (this phone/browser only) ===== */
function pxRecentAdd(sp,nm,k){try{let R=LS.get("recentP",[])||[];R=R.filter(r=>!(r[0]===sp&&r[1]===nm));R.unshift([sp,nm,k||""]);LS.set("recentP",R.slice(0,8))}catch(e){}}
function pxRecentHtml(sp,n){let R=[];try{R=(LS.get("recentP",[])||[]).filter(r=>!sp||r[0]===sp)}catch(e){}
  R=R.filter(r=>r[0]==="nba"?(typeof NBA_LOGS!=="undefined"&&NBA_LOGS[r[1]]):(typeof PINFO!=="undefined"&&PINFO[r[1]])).slice(0,n||4);if(!R.length)return "";
  return `<div class="rcnt"><span class="rcnth">🕘 Recently viewed</span><div class="rcntl">${R.map(([s,nm,k])=>s==="nba"
    ?`<a class="rchip" href="#nba-player-${encodeURIComponent(nm)}">${nbaBadge(NBA_LOGS[nm].tm)}<span>${nbaEsc(nm)}</span></a>`
    :`<a class="rchip" href="#props" data-rnfl="${esc(nm)}|${k}">${badge(PINFO[nm].team)}<span>${esc(nm)}</span></a>`).join("")}</div></div>`}
document.addEventListener("click",e=>{const a=e.target.closest("[data-rnfl]");if(!a)return;e.preventDefault();const [nm,k]=a.dataset.rnfl.replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').split("|");
  S.prop={player:nm,market:k||null,open:true};if(location.hash!=="#props")location.hash="props";else viewProps()});

const PX_SIT={ven:["Venue",{H:"Home",A:"Away"}],rest:["Rest",{short:"Short week",norm:"Normal",bye:"After bye"}],
  opp:["Opp defense",{top:"Top 10",mid:"Middle",bot:"Bottom 10"}],pace:["Opp pace",{fast:"Fast",mid:"Middle",slow:"Slow"}],
  dvp:["Opp vs his position",{soft:"Gives up a lot",mid:"Middle",tough:"Stingy"}],
  wx:["Weather",{dome:"Dome / roof closed",fair:"Outdoors, fair",wind:"Windy (15+ mph)",cold:"Cold (≤40°F)"}],qb:["QB",{}]};
/* NFL filter tiers (this season's ranks): opponent defense by points allowed, pace by plays a game, what they allow to his position */
const pxTier3=(r,n,a,b,c)=>r==null?null:r<=10?a:r>n-10?c:b;
let PX_NRK=null;function pxNflRanks(){if(PX_NRK)return PX_NRK;const R={opp:{},pace:{},dvp:{}};try{const u=units(),T=Object.keys(u);R.n=T.length;for(const t of T)R.opp[t]=u[t].d.ptsR}catch(e){}
  try{if(typeof PACE!=="undefined")for(const t in PACE)R.pace[t]=PACE[t].ppgR}catch(e){}
  try{for(const pos of ["WR","TE","RB"]){const L=Object.entries(typeof NFL_DEFTGT!=="undefined"?NFL_DEFTGT:{}).filter(([,d])=>d[pos]&&d[pos].t>=15).map(([t,d])=>[t,d[pos].yds/d[pos].t]).sort((a,b)=>b[1]-a[1]);R.dvp[pos]={};L.forEach(([t],i)=>R.dvp[pos][t]=i+1);R.dvp[pos].n=L.length}
    const Q=Object.keys(TEAM_STATS||{}).sort((a,b)=>TEAM_STATS[b].dpass-TEAM_STATS[a].dpass);R.dvp.QB={n:Q.length};Q.forEach((t,i)=>R.dvp.QB[t]=i+1)}catch(e){}
  return PX_NRK=R}
function pxNflSit(opp,pos,wk,team){const R=pxNflRanks(),o={};if(!opp)return o;
  o.opp=pxTier3(R.opp[opp],R.n||32,"top","mid","bot");o.pace=pxTier3(R.pace[opp],32,"fast","mid","slow");
  const D=R.dvp[pos];o.dvp=D?pxTier3(D[opp],D.n,"soft","mid","tough"):null;
  if(wk!=null&&team){const w=typeof NFL_GWX!=="undefined"&&NFL_GWX[wk+"|"+team];if(w)o.wx=/dome|closed/i.test(w[0])?"dome":w[2]!=null&&w[2]>=15?"wind":w[1]!=null&&w[1]<=40?"cold":"fair";
    const q=typeof NFL_GQB!=="undefined"&&NFL_GQB[wk+"|"+team];if(q)o.qb=q}
  return o}

/* ===== Game pages: points scored & allowed (Season / L5 / H2H) with spread + total filters ===== */
const GS={};
function gsRowsNba(t){const S=typeof NBA_SPR!=="undefined"?NBA_SPR:{};
  return NBA_RES.filter(r=>r[2]===t||r[3]===t).sort((a,b)=>a[1]<b[1]?-1:1).map(r=>{const h=r[3]===t,s=S[r[0]];return {opp:h?r[2]:r[3],home:h,pf:h?r[5]:r[4],pa:h?r[4]:r[5],sp:s?(h?s[3]:-s[3]):null,tot:s?s[4]:null,d:r[1]}})}
function gsRowsNfl(t){const SP=typeof NFL_SPR!=="undefined"?NFL_SPR:{};
  return teamGames(t).map(x=>{const s=SP[x.week+"|"+t];return {opp:x.opp,home:!!x.home,pf:x.pf,pa:x.pa,sp:s?s[0]:null,tot:s&&s[2]!=null?s[2]:null,d:"Wk "+x.week}})}
function gsH2hNfl(g,t){const o=t===g.away?g.home:g.away,R=typeof nflH2hRows!=="undefined"?nflH2hRows(g):((typeof H2H_RAW!=="undefined"&&H2H_RAW[g.id])||[]);
  if(!R.length){const SP=typeof NFL_SPR!=="undefined"?NFL_SPR:{};return teamGames(t,null).filter(x=>x.opp===o).map(x=>{const s=x.season===CUR?SP[x.week+"|"+t]:null;return {opp:x.opp,home:!!x.home,pf:x.pf,pa:x.pa,sp:s?s[0]:null,tot:s&&s[2]!=null?s[2]:null,d:x.season===CUR?"Wk "+x.week:String(x.season)}})}
  return R.map(([d,a,ap,h,hp])=>({opp:a===t?h:a,home:h===t,pf:a===t?ap:hp,pa:a===t?hp:ap,sp:null,tot:null,d:d.slice(0,4)})).reverse()}
function gsCard(key,sport,teams,rowsFor,h2hFor,ton,TR){
  const S0=GS[key]||(GS[key]={t:0,set:"ssn",lo:-15,hi:15,tlo:TR[0],thi:TR[1],open:false});if(S0.tlo<TR[0]||S0.thi>TR[1]){S0.tlo=TR[0];S0.thi=TR[1]}
  const t=teams[S0.t],o=teams[1-S0.t],all=rowsFor(t),sets={l5:all.slice(-5),ssn:all,h2h:h2hFor(t)};
  const lo=Math.min(S0.lo,S0.hi),hi=Math.max(S0.lo,S0.hi),tlo=Math.min(S0.tlo,S0.thi),thi=Math.max(S0.tlo,S0.thi);
  const spAny=lo<=-15&&hi>=15,ttAny=tlo<=TR[0]&&thi>=TR[1];
  const ok=r=>(spAny||(r.sp!=null&&(lo<=-15||r.sp>=lo)&&(hi>=15||r.sp<=hi)))&&(ttAny||(r.tot!=null&&(tlo<=TR[0]||r.tot>=tlo)&&(thi>=TR[1]||r.tot<=thi)));
  const A=(sets[S0.set]||all),M=A.filter(ok),N=M.length;
  const tsp=ton.sp==null?null:(S0.t===1?ton.sp:-ton.sp),ttot=ton.tot,it=tsp!=null&&ttot!=null?ttot/2-tsp/2:null;
  const av=f=>N?(M.reduce((q,r)=>q+f(r),0)/N):null,f1=v=>v==null?"—":(Math.round(v*10)/10).toFixed(1);
  const ovr=ttot!=null&&N?M.filter(r=>r.pf+r.pa>ttot).length:null,cvM=M.filter(r=>r.sp!=null),cov=cvM.filter(r=>r.pf-r.pa+r.sp>0).length;
  const badgeF=sport==="nba"?nbaBadge:badge,shortF=sport==="nba"?nbaShort:short;
  const mx0=Math.max(1,...M.map(r=>Math.max(r.pf,r.pa)),it||0),mn0=Math.min(...M.map(r=>Math.min(r.pf,r.pa)),it||1e9),base=sport==='nba'&&M.length?Math.max(0,Math.floor((mn0-15)/10)*10):0,mx=mx0+(mx0-base)*.12,H=v=>((v-base)/(mx-base)*100).toFixed(1);
  const chips=[];if(!spAny)chips.push(["sp",pxSpRange(lo,hi)]);if(!ttAny)chips.push(["tt",`O/U ${tlo<=TR[0]?"≤"+thi:thi>=TR[1]?tlo+"+":tlo+"–"+thi}`]);
  const spPre=[[-15,-7,"Fav 7+"],[-15,-.5,"Favored"],[.5,15,"Underdog"],[7,15,"Dog 7+"]].concat(tsp!=null?[[pxClamp(tsp-3,-15,15),pxClamp(tsp+3,-15,15),sport==="nfl"?"Near this game":"Near tonight"]]:[]).concat([[-15,15,"Any"]]);
  const w=TR[2],totPre=[[TR[0],TR[1],"Any"]].concat(ttot!=null?[[pxClamp(ttot-w,TR[0],TR[1]),pxClamp(ttot+w,TR[0],TR[1]),`${sport==="nfl"?"Near this game":"Near tonight"} (${ttot})`]]:[]);
  return `<div class="card gsc" data-gs="${esc(key)}"><h2 class="noglo" style="margin-bottom:8px">Points scored & allowed</h2>
   <div class="gst">${teams.map((x,i)=>`<button data-gst="${i}" class="${i===S0.t?"on":""}">${badgeF(x)} ${esc(shortF(x))}</button>`).join("")}</div>
   <div class="pxset gss">${[["l5","L5"],["ssn","Season"],["h2h","H2H"]].map(([v,l])=>`<button data-gss="${v}" class="${v===S0.set?"on":""}"${sets[v].length?"":" disabled"}>${l}<small>${sets[v].length} games</small></button>`).join("")}</div>
   <details class="pxfd"${S0.open?" open":""}><summary class="pxfs"><span class="pxft">🎚 <b>Filters</b></span><span class="pxfc noglo">${chips.length?chips.map(([n,l])=>`<span class="fchip" data-gsc="${n}">${l} ✕</span>`).join(""):'<span class="fany">Any spread · Any total</span>'}</span><span class="pxchev">›</span></summary>
    ${tsp!=null?`<div style="margin:8px 0 2px"><span class="pxtn noglo">${sport==="nfl"?"This game":"Tonight"}: ${esc(shortF(t))} ${pxSpTxt(tsp)}${ttot!=null?" · O/U "+ttot:""}</span></div>`:""}
    ${pxDual("sp",`${esc(shortF(t))}${/s$/.test(shortF(t))?"'":"'s"} spread`,-15,15,.5,S0.lo,S0.hi,["Favored","PK","Underdog"],spPre)}
    ${pxDual("tt","Game total (O/U)",TR[0],TR[1],.5,S0.tlo,S0.thi,[String(TR[0]),String((TR[0]+TR[1])/2),String(TR[1])],totPre)}
    <div class="small">Closing lines (${sport==="nba"?"DraftKings via ESPN":"nflverse"}). Head-to-head games from earlier seasons have no lines, so the filters leave them out.</div></details>
   ${N?`<div class="pxsum gsum"><div><b class="up">${f1(av(r=>r.pf))}</b><span>scored / game</span></div><div><b class="dn">${f1(av(r=>r.pa))}</b><span>allowed / game</span></div><div><b>${f1(av(r=>r.pf+r.pa))}</b><span>game total</span></div></div>
    <div class="gsx">${ovr!=null?`<span>Over ${sport==='nfl'?'this game':'tonight'}'s ${ttot}: <b>${ovr}/${N}</b></span>`:""}${cvM.length?`<span>Covered the spread: <b>${cov}/${cvM.length}</b></span>`:""}${it!=null?`<span>${sport==='nfl'?'This week':'Tonight'}'s team total: <b>${f1(it)}</b></span>`:""}</div>
    <div class="gsb"><div class="gsbw">${it!=null?`<div class="gsl" style="bottom:${H(it)}%"></div>`:""}${M.slice(-12).map(r=>`<div class="gsbars"><i class="s" style="height:${H(r.pf)}%"><em>${r.pf}</em></i><i class="a" style="height:${H(r.pa)}%"><em>${r.pa}</em></i></div>`).join("")}</div>
     <div class="gslab">${M.slice(-12).map(r=>`<span>${r.home?"":"@"}${esc(r.opp)}${r.sp!=null?`<small>${r.sp===0?"PK":(r.sp>0?"+":"−")+Math.abs(r.sp)}</small>`:`<small>${esc(String(r.d).slice(0,4))}</small>`}</span>`).join("")}</div></div>
    <div class="gsk"><span><i class="s"></i>${esc(shortF(t))} scored</span><span><i class="a"></i>allowed</span>${it!=null?`<span><i class="l"></i>${sport==='nfl'?'this game':'tonight'}'s team total</span>`:""}${base?`<span>bars start at ${base}</span>`:""}</div>`
   :`<div class="small" style="padding:10px 0">No games match these filters — widen them.</div>`}</div>`}
function gsWire(root,rerender){
  root.querySelectorAll(".gsc").forEach(c=>{const key=c.dataset.gs.replace(/&amp;/g,"&"),S0=GS[key];if(!S0)return;
    const re=()=>rerender(key);
    c.querySelectorAll("[data-gst]").forEach(b=>b.onclick=()=>{S0.t=+b.dataset.gst;S0.lo=-15;S0.hi=15;re()});
    c.querySelectorAll("[data-gss]").forEach(b=>b.onclick=()=>{if(b.disabled)return;S0.set=b.dataset.gss;re()});
    const dd=c.querySelector("details");if(dd)dd.ontoggle=()=>{S0.open=dd.open};
    c.querySelectorAll("[data-gsc]").forEach(ch=>ch.onclick=e=>{e.preventDefault();e.stopPropagation();if(ch.dataset.gsc==="sp"){S0.lo=-15;S0.hi=15}else{S0.tlo=-1e9;S0.thi=1e9}re()});
    c.querySelectorAll("[data-pre]").forEach(b=>b.onclick=()=>{const [n,a,z]=b.dataset.pre.split("|");if(n==="sp"){S0.lo=+a;S0.hi=+z}else{S0.tlo=+a;S0.thi=+z}re()});
    const fill=(n,a,b,mn,mx,txt)=>{const x=Math.min(a,b),y=Math.max(a,b),fl=c.querySelector(`[data-fill="${n}"]`),o=c.querySelector(`[data-out="${n}"]`);if(!fl)return;fl.style.left=(x-mn)/(mx-mn)*100+"%";fl.style.right=(100-(y-mn)/(mx-mn)*100)+"%";o.textContent=txt(x,y);
      c.querySelectorAll(`[data-pre^="${n}|"]`).forEach(p=>{const [,pa,pb]=p.dataset.pre.split("|");p.classList.toggle("on",+pa===x&&+pb===y)})};
    const ti=c.querySelector('[data-r="tt|lo"]'),TR=[+ti.min,+ti.max];if(S0.tlo<TR[0]||S0.tlo===-1e9){S0.tlo=TR[0];S0.thi=TR[1]}
    const paint=()=>{fill("sp",S0.lo,S0.hi,-15,15,pxSpRange);fill("tt",S0.tlo,S0.thi,TR[0],TR[1],(x,y)=>x<=TR[0]&&y>=TR[1]?"Any total":x<=TR[0]?`${y} or less`:y>=TR[1]?`${x} or more`:`${x} to ${y}`)};
    c.querySelectorAll("input[data-r]").forEach(inp=>{const [n,w]=inp.dataset.r.split("|");inp.oninput=()=>{if(n==="sp")S0[w]=+inp.value;else S0["t"+w]=+inp.value;paint()};inp.onchange=re});
    paint()})}

/* ===== NFL helpers: default prop, teammates, QB chip, weather chip, usage bars ===== */
const NFL_MK_ORD={WR:["recYds","rec","anyTD","rushRec"],TE:["rec","recYds","anyTD"],RB:["rushYds","rushRec","rec","recYds","rushAtt","anyTD"],QB:["passYds","passTD","comp","rushYds","int"]};
function nflDefMk(pl,MK){const o=(NFL_MK_ORD[pl.pos]||[]).filter(m=>MK.includes(m));return o.find(m=>realProp(pl.name,m))||MK.find(m=>realProp(pl.name,m))||o[0]||MK[0]}
function nflMates(pl){const U=typeof USAGE_RAW!=="undefined"?USAGE_RAW:{};
  return Object.entries(U).filter(([n,u])=>n!==pl.name&&u.tm===pl.team&&["QB","RB","WR","TE"].includes(u.pos)&&u.g>=1)
   .sort((a,b)=>((b[1].s.tpg||0)+(b[1].s.cpg||0)+(b[1].pos==="QB"?20:0))-((a[1].s.tpg||0)+(a[1].s.cpg||0)+(a[1].pos==="QB"?20:0))).slice(0,8).map(([n,u])=>({n,pos:u.pos}))}
function nflMatePlayed(n,wk){const u=typeof USAGE_RAW!=="undefined"&&USAGE_RAW[n];if(!u||!u.wk)return null;const w=u.wk[wk];return !!(w&&w[0]>0)}
function nflMateHtml(pl,key){const S0=PXS[key]||{},cur=S0.mates||{},M=nflMates(pl);if(!M.length)return "";
  const st=n=>{const i=typeof INJ_P!=="undefined"&&INJ_P[n];return i&&/out|ir|reserve|doubt/i.test(i.s||"")?` <span class="small" style="color:#ff9a9d">${esc(i.s)}</span>`:""};
  return `<div class="pxfr"><div class="pxfl"><span>Teammates</span><span class="small">games he did / didn't play</span></div><div class="mtl">${M.map(m=>`<div class="sitr mtr"><span title="${esc(m.n)}">${esc(pxLast(m.n))} <small style="opacity:.6">${m.pos}</small>${st(m.n)}</span><div class="pxpre">${[["","Any"],["w","With"],["o","Without"]].map(([v,l])=>`<button data-nmt="${esc(m.n)}|${v}" class="${(cur[m.n]||"")===v?"on":""}">${l}</button>`).join("")}</div></div>`).join("")}</div></div>`}
function nflQbChip(pl){if(pl.pos==="QB")return "";const q=typeof QB1_STATUS!=="undefined"&&QB1_STATUS[pl.team];
  let qb=q?q.qb:null;if(!qb){const U=typeof USAGE_RAW!=="undefined"?USAGE_RAW:{};const c=Object.entries(U).filter(([,u])=>u.tm===pl.team&&u.pos==="QB").sort((a,b)=>(b[1].s.snap||0)*b[1].g-(a[1].s.snap||0)*a[1].g)[0];qb=c?c[0]:null}
  if(!qb)return "";const now=q?q.now:"",inj=typeof INJ_P!=="undefined"&&INJ_P[qb];
  const bad=/out|reserve|doubt/i.test(now)||(inj&&/out|reserve|doubt/i.test(inj.s||"")),mid=!bad&&(/quest/i.test(now)||(inj&&/quest/i.test(inj.s||"")));
  return `<span class="qbc ${bad?"r":mid?"y":"g"}" title="${esc(now||(inj?inj.s:"No injury listed"))}">QB: ${esc(pxLast(qb))} ${bad?"⚠️ out":mid?"❓ questionable":"✅"}</span>`}
function nflWxChip(pl){const o=oppOf(pl.team);if(!o||typeof WX==="undefined")return "";const x=WX[o.g.id];if(!x)return "";if(x.dome)return `<span class="qbc">🏟️ Indoors</span>`;
  const l=wxLvl(x);return `<span class="qbc ${l>=2?"r":l>=1?"y":""}">${wxLine(x,o.g)}</span>`}
function nflUseBars(pl){const u=typeof USAGE_RAW!=="undefined"&&USAGE_RAW[pl.name];if(!u||!u.wk)return "";const W=Object.keys(u.wk).map(Number).sort((a,b)=>a-b).slice(-4);if(!W.length)return "";
  const tg=pl.pos==="QB"?null:(pl.pos==="RB"?2:1),lab=pl.pos==="RB"?"car":"tgt";
  return `<div class="small" style="margin:0 0 4px">Snap share · his last ${W.length} games</div><div class="ubar" title="Snap share by week">${W.map(w=>{const r=u.wk[w];return `<div><i style="height:${Math.max(4,r[0])}%"></i><b>${r[0]}%</b><span>Wk ${w}${tg!=null?`<small>${r[tg]} ${lab}${pl.pos==="RB"&&r[1]?` · ${r[1]} tgt`:""}</small>`:""}</span></div>`}).join("")}</div>`}

/* ===== Countdown to tip / kickoff (cards refresh every minute) ===== */
function cdTxt(d,t,started,final){if(final)return "Final";if(started)return "🔴 Live · lines closed";
  const n=etNow(),tm=tipMin(t);if(!d||tm==null)return "";const days=Math.round((new Date(d+"T12:00")-new Date(n.d+"T12:00"))/864e5),mins=days*1440+tm-n.m;
  if(mins<=0)return "🔴 Live · lines closed";const D=Math.floor(mins/1440),H=Math.floor(mins%1440/60),M=mins%60;
  return "⏱ "+(D?`${D}d ${H}h`:H?`${H}h ${M}m`:`${M}m`)}
function cdChip(sp,g){if(sp==="nba")return `<span class="cdc" data-cd="nba|${g.id}">${cdTxt(NBA_SLATE_DATE,g.t,nbaStarted(g),typeof nbaFinalHtml!=="undefined"&&!!nbaFinalHtml(g))}</span>`;
  return `<span class="cdc" data-cd="nfl|${g.id}">${cdTxt(nflDate(g),String(g.when||"").split("·")[1],nflStarted(g)&&!g.final,!!g.final)}</span>`}
setInterval(()=>{document.querySelectorAll("[data-cd]").forEach(e=>{const [sp,id]=e.dataset.cd.split("|");if(sp==="nba"){const g=NBA_SLATE.find(x=>String(x.id)===id);if(g)e.textContent=cdTxt(NBA_SLATE_DATE,g.t,nbaStarted(g),typeof nbaFinalHtml!=="undefined"&&!!nbaFinalHtml(g))}else{const g=SLATE.find(x=>String(x.id)===id);if(g)e.textContent=cdTxt(nflDate(g),String(g.when||"").split("·")[1],nflStarted(g)&&!g.final,!!g.final)}})},60000);

/* ===== NBA game page: key matchups (offense strength vs the other defense) ===== */
function nbaKeyMu(g){const out=[],N=30;
  for(const [off,def] of [[g.a,g.h],[g.h,g.a]]){const O=NBA_TADV[off],D=NBA_TADV[def];if(!O||!D||!O.oR||!D.dR)continue;
    for(const [k,l,u] of NBA_MU){if(["pts","rtg","tov"].includes(k)||O.oR[k]==null||D.dR[k]==null)continue;const ro=O.oR[k],rd=D.dR[k];
      if(ro<=12&&rd>=19)out.push({s:(31-ro)+rd,c:"up",off,def,l,ro,rd,ov:O.o[k],dv:D.d[k],u});
      else if(ro>=19&&rd<=12)out.push({s:ro+(31-rd)-4,c:"dn",off,def,l,ro,rd,ov:O.o[k],dv:D.d[k],u})}}
  const T=out.sort((a,b)=>b.s-a.s).slice(0,3);if(!T.length)return "";
  const bar=r=>`<span class="kmb"><i style="width:${Math.round((31-r)/30*100)}%"></i></span>`;
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:4px">🔑 Key matchups</h2><div class="small" style="margin-bottom:8px">The biggest gaps between one team's offense and the other team's defense this season (rank of 30).</div>
   ${T.map(e=>`<div class="kmu ${e.c}"><div class="kmh">${e.c==="up"?"✅":"⚠️"} <b>${nbaEsc(nbaShort(e.off))} ${e.l.toLowerCase()}</b> vs ${nbaEsc(nbaShort(e.def))} defense</div>
    <div class="kmr"><span>${nbaBadge(e.off)} offense <b>${nbaOrd(e.ro)}</b> <small>${e.ov}${e.u}</small></span>${bar(e.ro)}</div>
    <div class="kmr"><span>${nbaBadge(e.def)} defense <b>${nbaOrd(e.rd)}</b> <small>${e.dv}${e.u} allowed</small></span>${bar(e.rd)}</div>
    <div class="kmv noglo">${e.c==="up"?`Edge <b>${nbaEsc(nbaShort(e.off))}</b> — strength meets a weak spot`:`Tough spot for <b>${nbaEsc(nbaShort(e.off))}</b> — weakness meets a strong defense`}</div></div>`).join("")}</div>`}

/* ===== NFL final score block (static finals + ESPN live finals) ===== */
function nflFinalBlock(g,as,hs){const L=typeof LINES!=="undefined"?LINES[g.id]:null,aw=as>hs,tie=as===hs,tot=as+hs;
  const row=(t,sc,win)=>`<tr class="${win?"w":""}"><td><div class="ngn">${badge(t)}<div><b>${esc(short(t))}</b><small>${recTxt(t)}</small></div></div></td><td class="fsc">${sc}${win?" ◂":""}</td></tr>`;
  const ch=[];if(L&&L.sp!=null){const m=hs-as+L.sp;ch.push(m===0?`Spread: push`:m>0?`✅ ${esc(short(g.home))} covered ${L.sp>0?"+":""}${L.sp}`:`✅ ${esc(short(g.away))} covered ${-L.sp>0?"+":""}${-L.sp}`)}
  if(L&&L.tot!=null)ch.push(tot>L.tot?`⬆️ Over ${L.tot} (${tot} pts)`:tot<L.tot?`⬇️ Under ${L.tot} (${tot} pts)`:`Total push (${tot})`);
  return `<div class="nfin"><div class="ngt">${esc(short(g.away))} <span>@</span> ${esc(short(g.home))} <span class="tag real">Final</span></div>
   <table class="ngtab fint"><tbody>${row(g.away,as,!tie&&aw)}${row(g.home,hs,!tie&&!aw)}</tbody></table>${ch.length?`<div class="gchips">${ch.map(x=>`<span>${x}</span>`).join("")}</div>`:""}</div>`}

/* wording: NBA games are today ("tonight"); NFL games can be days away, so say "this game" + its day */
function pxOppW(key){return String(key||"").startsWith("nfl")?"this game's":"tonight's"}
function pxGameDay(key){try{const nm=String(key).split(/[|~]/)[1];const P=typeof PINFO!=="undefined"&&PINFO[nm];const o=P&&oppOf(P.team);const d=o&&String(o.g.when||"").split(" ")[0];return d?` (${d})`:""}catch(e){return ""}}
