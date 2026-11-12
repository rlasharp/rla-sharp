/* ---------- 📊 More visuals: team shot zones (NBA), team shot map (NHL), pace vs scoring (NBA, NFL), every-team strength
   scatter (all sports), soccer chances vs goals, NFL "where the QB throws / where the defense gives up catches",
   NFL red-zone and end-zone chances. Real data only: each card hides itself when its data isn't there. ---------- */
const VX_R={},VX_S={};
/* a box that re-draws itself when one of its tabs is tapped (state kept per box id) */
function vxBox(id,render){VX_R[id]=render;let h="";try{h=render()}catch(e){h=""}return h?`<div class="vxbox" data-vxid="${vxE(id)}">${h}</div>`:""}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-vxs]");if(!b)return;const box=b.closest(".vxbox");if(!box||!VX_R[box.dataset.vxid])return;
  e.preventDefault();VX_S[box.dataset.vxid]=b.dataset.vxs;try{box.innerHTML=VX_R[box.dataset.vxid]()}catch(err){}});
function vxTabs(id,opts,def){const cur=VX_S[id]||def;return `<div class="vxtabs">${opts.map(([v,l])=>`<button data-vxs="${vxE(v)}" class="${v===cur?"on":""}">${l}</button>`).join("")}</div>`}
const VX_CA="#3b82f6",VX_CH="#f97316";
const vxF1=v=>v==null||!isFinite(v)?"–":(+v).toFixed(1);

/* ===== scatter of every team, tonight's two highlighted =====
   P = [{t, lab, x, y, hl: 0 | "a" | "h"}]; o = {xl, yl, invY (lower = better, drawn at the top), xf, yf, q: [top-left, top-right, bottom-left, bottom-right]} */
function vxScat(P,o){P=P.filter(p=>p.x!=null&&p.y!=null&&isFinite(p.x)&&isFinite(p.y));if(P.length<6)return "";
  const W=340,H=250,L=42,R=10,T=14,B=34,xs=P.map(p=>p.x),ys=P.map(p=>p.y);
  let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);const px=(x1-x0||1)*.08,py=(y1-y0||1)*.1;x0-=px;x1+=px;y0-=py;y1+=py;
  const X=v=>L+(v-x0)/(x1-x0)*(W-L-R),Y=v=>o.invY?T+(v-y0)/(y1-y0)*(H-T-B):H-B-(v-y0)/(y1-y0)*(H-T-B);
  const mx=xs.reduce((a,b)=>a+b,0)/xs.length,my=ys.reduce((a,b)=>a+b,0)/ys.length,xf=o.xf||vxF1,yf=o.yf||vxF1;
  const q=o.q||[];
  let s=`<svg viewBox="0 0 ${W} ${H}" class="qsc" role="img" aria-label="${vxE(o.yl)} against ${vxE(o.xl)}, every team">
   <line x1="${X(mx)}" y1="${T}" x2="${X(mx)}" y2="${H-B}" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="3 3"/>
   <line x1="${L}" y1="${Y(my)}" x2="${W-R}" y2="${Y(my)}" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="3 3"/>
   <rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="none" stroke="currentColor" stroke-opacity=".25"/>
   ${q[0]?`<text x="${L+4}" y="${T+11}" font-size="9" fill="currentColor" fill-opacity=".7">${vxE(q[0])}</text>`:""}${q[1]?`<text x="${W-R-4}" y="${T+11}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity=".7">${vxE(q[1])}</text>`:""}
   ${q[2]?`<text x="${L+4}" y="${H-B-5}" font-size="9" fill="currentColor" fill-opacity=".7">${vxE(q[2])}</text>`:""}${q[3]?`<text x="${W-R-4}" y="${H-B-5}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity=".7">${vxE(q[3])}</text>`:""}
   <text x="${L}" y="${H-B+13}" font-size="9" fill="currentColor" fill-opacity=".75">${xf(x0+px)}</text><text x="${W-R}" y="${H-B+13}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity=".75">${xf(x1-px)}</text>
   <text x="${(L+W-R)/2}" y="${H-6}" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">${vxE(o.xl)} →</text>
   <text x="${L-4}" y="${o.invY?H-B:T+8}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity=".75">${yf(o.invY?y1-py:y1-py)}</text><text x="${L-4}" y="${o.invY?T+8:H-B}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity=".75">${yf(y0+py)}</text>
   <text transform="translate(11 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">${vxE(o.yl)} ${o.invY?"(better ↑)":"→"}</text>`;
  for(const p of P.filter(p=>!p.hl))s+=`<g><circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3" fill="currentColor" fill-opacity=".3"/><text x="${(X(p.x)+4).toFixed(1)}" y="${(Y(p.y)+3).toFixed(1)}" font-size="7" fill="currentColor" fill-opacity=".6">${vxE(p.lab)}</text><title>${vxE(p.lab)}: ${xf(p.x)} · ${yf(p.y)}</title></g>`;
  for(const p of P.filter(p=>p.hl)){const c=p.hl==="a"?VX_CA:VX_CH;s+=`<g><circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="7" fill="${c}" stroke="#fff" stroke-width="1.5"/><text x="${(X(p.x)+10).toFixed(1)}" y="${(Y(p.y)+4).toFixed(1)}" font-size="11" font-weight="800" fill="currentColor">${vxE(p.lab)}</text><title>${vxE(p.lab)}: ${xf(p.x)} · ${yf(p.y)}</title></g>`}
  return s+`</svg>`}
function vxKey(a,h){return `<div class="small qkey"><span><i style="background:${VX_CA}"></i>${vxE(a)}</span><span><i style="background:${VX_CH}"></i>${vxE(h)}</span><span><i class="o"></i>other teams</span> · dashed lines = league average</div>`}
function vxCard(title,sub,body,foot){return `<div class="card vx2"><h2 style="margin-bottom:2px">${title}</h2>${sub?`<div class="small" style="margin-bottom:8px">${sub}</div>`:""}${body}${foot?`<div class="small" style="margin-top:6px">${foot}</div>`:""}</div>`}

/* ===== 11. Offense vs defense: every team in the league on one chart ===== */
function vxStrength(sp,g){try{let P=[],o={},a,h,an,hn,foot="";
  if(sp==="nba"){a=g.a;h=g.h;an=nbaShort(a);hn=nbaShort(h);
    P=Object.entries(NBA_TADV||{}).filter(([,x])=>x&&x.o&&x.d).map(([t,x])=>({t,lab:t,x:x.o.rtg,y:x.d.rtg}));
    o={xl:"Points scored per 100 possessions",yl:"Allowed per 100",invY:1,q:["Good defense, weak offense","Good at both","Weak at both","Good offense, weak defense"]};
    foot="Per 100 possessions so pace doesn't skew it. ESPN box scores, this season."}
  else if(sp==="nhl"){a=g.a;h=g.h;an=a;hn=h;P=Object.entries(NHL_TEAM||{}).map(([t,x])=>({t,lab:t,x:x.gf,y:x.ga}));
    o={xl:"Goals for per game",yl:"Goals against",invY:1,xf:v=>(+v).toFixed(2),yf:v=>(+v).toFixed(2),q:["Good defense, weak offense","Good at both","Weak at both","Good offense, weak defense"]};
    foot="Official NHL stats, this season."}
  else if(sp==="nfl"){a=g.away;h=g.home;an=short(a);hn=short(h);const u=units();P=Object.keys(u).map(t=>({t,lab:t,x:u[t].o.pts,y:u[t].d.pts}));
    o={xl:"Points scored per game",yl:"Points allowed",invY:1,q:["Good defense, weak offense","Good at both","Weak at both","Good offense, weak defense"]};
    foot="This season's games."}
  else if(sp==="soc"){a=g.a;h=g.h;an=socTm(a);hn=socTm(h);const S=typeof SOC_ST!=="undefined"&&SOC_ST[g.c];if(!S)return "";
    P=S.filter(r=>r[2]>0).map(r=>({t:String(r[0]),lab:(SOC_TM[r[0]]||[])[2]||"",x:r[6]/r[2],y:r[7]/r[2]}));
    if(!P.some(p=>p.t===String(a))||!P.some(p=>p.t===String(h)))return "";
    o={xl:"Goals scored per match",yl:"Goals conceded",invY:1,xf:v=>(+v).toFixed(2),yf:v=>(+v).toFixed(2),q:["Tight at the back","Strong at both","Struggling","Free-scoring, leaky"]};
    foot="League matches this season (ESPN table)."}
  for(const p of P)p.hl=String(p.t)===String(a)?"a":String(p.t)===String(h)?"h":0;
  const ch=vxScat(P,o);if(!ch)return "";
  return vxCard("Offense vs defense — every team","Right = scores more · higher = allows less. Top-right is where the best teams live.",ch+vxKey(an,hn),foot)}catch(e){return ""}}

/* ===== 9. Pace vs scoring (NBA, NFL): fast teams play higher-scoring games ===== */
function vxPace(sp,g){try{let P=[],o={},a,h,an,hn,tot=null,cmb={};
  if(sp==="nba"){a=g.a;h=g.h;an=nbaShort(a);hn=nbaShort(h);
    P=Object.entries(NBA_TADV||{}).filter(([t,x])=>x&&x.pace&&NBA_TEAM[t]).map(([t,x])=>{cmb[t]=NBA_TEAM[t].ppg+NBA_TEAM[t].opp;return {t,lab:t,x:x.pace,y:cmb[t]}});
    o={xl:"Pace (possessions a game)",yl:"Points in their games"};const L=nbaL(g);tot=L&&L.tot}
  else if(sp==="nfl"){a=g.away;h=g.home;an=short(a);hn=short(h);if(typeof PACE==="undefined")return "";const u=units();
    P=Object.keys(u).filter(t=>PACE[t]).map(t=>{cmb[t]=u[t].o.pts+u[t].d.pts;return {t,lab:t,x:PACE[t].ppg,y:cmb[t]}});
    o={xl:"Plays per game",yl:"Points in their games"};try{tot=bookTotal(g)}catch(e){}}
  else return "";
  for(const p of P)p.hl=p.t===a?"a":p.t===h?"h":0;
  o.q=["Slow but high-scoring","Fast & high-scoring","Slow & low-scoring","Fast but low-scoring"];
  const ch=vxScat(P,o);if(!ch)return "";
  const both=cmb[a]!=null&&cmb[h]!=null?(cmb[a]+cmb[h])/2:null;
  const txt=both!=null?`${vxE(an)} games average <b>${vxF1(cmb[a])}</b> total points, ${vxE(hn)} games <b>${vxF1(cmb[h])}</b> — together <b>${vxF1(both)}</b>${tot?` vs tonight's total of <b>${tot}</b> (${both>=tot+3?"leans over":both<=tot-3?"leans under":"close to the line"})`:""}.`:"";
  return vxCard("Pace vs scoring","Right = plays faster · higher = more points scored in their games (both teams).",ch+vxKey(an,hn)+(txt?`<div class="qsay">${txt}</div>`:""),"A rough guide only — our full projection on the Overview tab also counts defense, injuries and rest.")}catch(e){return ""}}

/* ===== 5. NBA team shot zones: where each team shoots, and where the other team gives up good looks ===== */
function vxNbaZones(g){if(typeof NBA_OZONE==="undefined"||typeof NBA_DZONE==="undefined"||typeof nbaCourtFor==="undefined")return "";
  const a=g.a,h=g.h;if(!NBA_OZONE[a]||!NBA_OZONE[h]||!NBA_DZONE[a]||!NBA_DZONE[h])return "";const id="nz"+a+h;
  return vxBox(id,()=>{const v=VX_S[id]||"ao",att=v[0]==="a"?a:h,def=att===a?h:a,side=v[1];const S=side==="o"?NBA_OZONE[att]:NBA_DZONE[def];
    const lgT=NBA_LGZ.reduce((s,z)=>s+z[0],0),O=NBA_OZONE[att],D=NBA_DZONE[def],oT=O.reduce((s,z)=>s+z[0],0),pc=z=>z[0]?z[1]/z[0]*100:null;
    const ed=NBA_ZONES.map((zn,i)=>{const sh=O[i][0]/Math.max(1,oT)*100,dp=pc(D[i]),lp=pc(NBA_LGZ[i]);return {zn,sh,dp,lp,e:D[i][0]>=25&&sh>=7&&dp!=null&&lp!=null?dp-lp:0}}).filter(x=>Math.abs(x.e)>=3).sort((x,y)=>y.sh-x.sh).slice(0,3);
    return `<div class="card vx2"><h2 style="margin-bottom:2px">Team shot zones</h2><div class="small" style="margin-bottom:8px">Pick a side: where one team takes its shots, or what the other team allows from each spot. Colours = FG% vs the NBA average.</div>
     ${vxTabs(id,[["ao",`${vxE(nbaShort(a))} shoot`],["hd",`${vxE(nbaShort(h))} allow`],["ho",`${vxE(nbaShort(h))} shoot`],["ad",`${vxE(nbaShort(a))} allow`]],"ao")}
     ${nbaCourtFor(S,side==="o"?"this season":`by opponents this season`,side==="o"?`${vxE(nbaShort(att))} shooting`:`What ${vxE(nbaShort(def))} allow`)}
     ${ed.length?`<div class="shx">${ed.map(r=>`<div class="${r.e>0?"g":"r"}"><b>${r.e>0?"✅":"⚠️"} ${r.zn}</b> — ${Math.round(r.sh)}% of ${vxE(nbaShort(att))} shots; ${vxE(nbaShort(def))} allow <b>${Math.round(r.dp)}%</b> there (NBA ${Math.round(r.lp)}%).</div>`).join("")}</div>`:""}
     <div class="small" style="margin-top:6px">From ESPN play-by-play shot locations, this season. ✅ / ⚠️ = a zone ${vxE(nbaShort(att))} use a lot where ${vxE(nbaShort(def))} are worse / better than average.</div></div>`})}

/* ===== 6. NHL team shot map: unblocked attempts by area, for and against, per game ===== */
function vxRinkTeam(g){try{const A=NHL_TEAM[g.a],Hm=NHL_TEAM[g.h];if(!A||!Hm||!A.zn||!Hm.zn)return "";const id="nr"+g.a+g.h;
  let LT=[0,0,0,0],LN=0;for(const t of Object.values(NHL_TEAM))if(t.zn){LN+=t.zn.n;t.zn.f.forEach((z,i)=>LT[i]+=z[0])}const lg=LT.map(v=>LN?v/LN:0);
  const N=["Slot (inside 20 ft)","High slot","Wide / circles","Long range"];
  return vxBox(id,()=>{const v=VX_S[id]||"af",tm=v[0]==="a"?g.a:g.h,T=NHL_TEAM[tm],side=v[1],Z=T.zn[side],n=T.zn.n,pg=Z.map(z=>z[0]/n);
    const col=i=>{const r=lg[i]?pg[i]/lg[i]:1;return side==="f"?(r>=1.12?"#d9483b":r>=1.04?"#e8894a":r<=.88?"#2f6fb5":r<=.96?"#5b9bd5":"#6b7078"):(r>=1.12?"#d9483b":r>=1.04?"#e8894a":r<=.88?"#2f6fb5":r<=.96?"#5b9bd5":"#6b7078")};
    const svg=`<svg viewBox="0 0 200 150" class="nhrink" role="img" aria-label="Team shot areas">
     <rect x="2" y="2" width="196" height="146" rx="28" fill="none" stroke="currentColor" stroke-opacity=".25"/>
     <rect x="4" y="108" width="192" height="38" rx="22" fill="${col(3)}" fill-opacity=".8"/>
     <rect x="4" y="22" width="58" height="86" fill="${col(2)}" fill-opacity=".8"/><rect x="138" y="22" width="58" height="86" fill="${col(2)}" fill-opacity=".8"/>
     <rect x="62" y="22" width="76" height="86" fill="${col(1)}" fill-opacity=".85"/>
     <path d="M55 22 A45 45 0 0 0 145 22 Z" fill="${col(0)}" stroke="#111" stroke-opacity=".35"/>
     <line x1="2" y1="22" x2="198" y2="22" stroke="#d9483b" stroke-opacity=".6"/><rect x="92" y="14" width="16" height="8" fill="none" stroke="currentColor" stroke-opacity=".7"/>
     ${[[100,44,0],[100,92,1],[33,70,2],[167,70,2],[100,133,3]].map(([x,y,i])=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">${pg[i].toFixed(1)}</text>`).join("")}</svg>`;
    const shp=z=>z[1]?(z[2]/z[1]*100).toFixed(1)+"%":"–";
    const opp=tm===g.a?g.h:g.a,oZ=NHL_TEAM[opp].zn[side==="f"?"a":"f"],on=NHL_TEAM[opp].zn.n;
    return `<div class="card vx2"><h2 style="margin-bottom:2px">Shot map</h2><div class="small" style="margin-bottom:8px">Unblocked shot attempts a game from each area. Red = more than the NHL average, blue = fewer.</div>
     ${vxTabs(id,[["af",`${vxE(g.a)} shoot`],["ha",`${vxE(g.h)} allow`],["hf",`${vxE(g.h)} shoot`],["aa",`${vxE(g.a)} allow`]],"af")}
     <div class="nhsm">${svg}<div class="alw"><table class="altt"><thead><tr><th>Area</th><th>${side==="f"?"Shots":"Allowed"}/g</th><th>NHL</th><th>${side==="f"?"Goals/SOG":"Goals/SOG against"}</th></tr></thead><tbody>
     ${Z.map((z,i)=>`<tr><td><span class="nhdot" style="background:${col(i)}"></span>${N[i]}</td><td><b>${pg[i].toFixed(1)}</b></td><td class="small">${lg[i].toFixed(1)}</td><td>${z[2]}/${z[1]} <span class="small">${shp(z)}</span></td></tr>`).join("")}</tbody></table></div></div>
     <div class="qsay">${side==="f"?`From the slot: ${vxE(tm)} get <b>${pg[0].toFixed(1)}</b> a game; ${vxE(opp)} allow <b>${(oZ[0][0]/on).toFixed(1)}</b> (NHL ${lg[0].toFixed(1)}).`:`From the slot: ${vxE(tm)} allow <b>${pg[0].toFixed(1)}</b> a game; ${vxE(opp)} get <b>${(oZ[0][0]/on).toFixed(1)}</b> (NHL ${lg[0].toFixed(1)}).`}</div><div class="small" style="margin-top:6px">${vxE(tm)} ${side==="f"?"shooting":"defending"} · ${n} games · from the official NHL play-by-play (shot locations). Slot chances turn into goals far more often — a team that gets lots of slot shots against a defense that allows them is a good sign for overs and shot props.</div></div>`})}catch(e){return ""}}

/* ===== 12. Soccer: chances (shots / on target) vs goals, last 6 matches each ===== */
function vxSocChance(f){try{if(typeof SOC_RES==="undefined")return "";
  const last=t=>SOC_RES.filter(r=>(r[3]===String(t)||r[4]===String(t))&&r[7]&&r[8]&&r[7][1]!=null&&r[8][1]!=null).sort((x,y)=>x[1]<y[1]?1:-1).slice(0,6).map(r=>{const home=r[3]===String(t);const me=home?r[7]:r[8],op=home?r[8]:r[7];
    return {d:r[1].slice(5,10),opp:home?r[4]:r[3],home,sh:me[0],sot:me[1],gf:home?r[5]:r[6],osh:op[0],osot:op[1],ga:home?r[6]:r[5]}});
  const block=t=>{const M=last(t);if(M.length<3)return "";const s=k=>M.reduce((a,m)=>a+(+m[k]||0),0);const n=M.length,conv=s("sot")?s("gf")/s("sot")*100:null,oconv=s("osot")?s("ga")/s("osot")*100:null;
    const mx=Math.max(1,...M.map(m=>Math.max(m.sot,m.osot,m.gf,m.ga)));
    const bar=(v,c)=>`<i style="width:${Math.max(2,v/mx*100)}%;background:${c}"></i>`;
    const say=conv==null?"":conv>=40?"scoring more than their chances suggest — that rarely lasts":conv<=20?"scoring fewer than their chances suggest — goals may come":"scoring about what their chances suggest";
    return `<div class="qsc2"><div class="qcxh"><b>${vxE(socTm(t))}</b><br><span class="small">last ${n} · ${vxF1(s("sot")/n)} on target a game → ${vxF1(s("gf")/n)} goals · ${vxF1(s("osot")/n)} on target against → ${vxF1(s("ga")/n)} conceded</span></div>
     ${M.map(m=>`<div class="qscr"><span class="small">${m.home?"vs":"@"} ${vxE((SOC_TM[m.opp]||[])[2]||socTm(m.opp))}</span><div class="qscb"><div>${bar(m.sot,"#22c55e")}<em>${m.sot} SoT</em></div><div>${bar(m.gf,"#15803d")}<em>${m.gf} G</em></div></div><div class="qscb"><div>${bar(m.osot,"#e5484d")}<em>${m.osot} SoT</em></div><div>${bar(m.ga,"#b91c1c")}<em>${m.ga} G</em></div></div></div>`).join("")}
     ${conv!=null?`<div class="small" style="margin-top:4px">They scored with <b>${Math.round(conv)}%</b> of shots on target (their keeper saved ${oconv!=null?`${Math.round(100-oconv)}% of shots on target faced`:"–"}) — ${say}.</div>`:""}</div>`};
  const x=block(f.a)+block(f.h);if(!x)return "";const hd=`<div class="qscr qcxh2"><span></span><span class="small"><b>Their attack</b></span><span class="small"><b>Against them</b></span></div>`;
  return vxCard("Chances vs goals — last 6 matches","SoT = shots on target · G = goals. Every competition.",hd+x,"ESPN doesn't publish expected goals (xG), so shots on target are the closest real measure of chance quality we have. Around 30% of shots on target become goals on average.")}catch(e){return ""}}

/* ===== NFL: where the QB throws vs where the defense gives up catches (12 areas: depth × side) ===== */
const VX_ZR=[["D","Deep","20+ yds"],["I","Medium","10–19"],["S","Short","0–9"],["B","Behind","screens"]],VX_ZC=[["L","Left"],["M","Middle"],["R","Right"]];
function vxQbOf(t){const Q=typeof QB1_STATUS!=="undefined"&&QB1_STATUS[t];let nm=Q?(/^(out|doubtful|injured reserve|ir)\b/i.test(Q.now||"")?Q.sub:Q.qb):null;
  if(nm&&NFL_QBZ[nm]&&NFL_QBZ[nm].tm===t)return [nm,NFL_QBZ[nm]];
  const L=Object.entries(NFL_QBZ).filter(([,v])=>v.tm===t).sort((x,y)=>y[1].att-x[1].att);return L.length?L[0]:null}
function vxPassMap(g,only){try{if(typeof NFL_TZONE==="undefined"||typeof NFL_QBZ==="undefined")return "";const id="pm"+g.away+g.home;
  if(!NFL_TZONE[g.away]||!NFL_TZONE[g.home])return "";const LG=NFL_LGZONE||{};
  const ypt=c=>c&&c[0]?c[2]/c[0]:null;
  return vxBox(id,()=>{const v=only?(only===g.away?"a":"h"):(VX_S[id]||"a"),off=v==="a"?g.away:g.home,def=off===g.away?g.home:g.away,Q=vxQbOf(off),Z=Q?Q[1].z:NFL_TZONE[off].o,D=NFL_TZONE[def].d;
    const tot=Object.values(Z).reduce((s,c)=>s+c[0],0),dtot=Object.values(D).reduce((s,c)=>s+c[0],0);if(!tot||!dtot)return "";const mx=Math.max(...Object.values(Z).map(c=>c[0]));
    const qcell=k=>{const c=Z[k];if(!c||!c[0])return `<div class="qpz none">–</div>`;const sh=c[0]/tot;return `<div class="qpz" style="background:rgba(59,130,246,${(.1+c[0]/mx*.6).toFixed(2)})"><b>${Math.round(sh*100)}%</b><span>${Math.round(c[1]/c[0]*100)}% caught</span></div>`};
    const dcell=k=>{const c=D[k],l=ypt(LG[k]);if(!c||c[0]<3)return `<div class="qpz none">${c?c[0]:0} tgt</div>`;const y=ypt(c),e=l!=null?y-l:0;
      return `<div class="qpz" style="background:${vxEdgeBg(e,4)}"><b>${y.toFixed(1)}</b><span>${l!=null?`NFL ${l.toFixed(1)}`:""}</span></div>`};
    const grid=(cell,head)=>`<div class="qpg"><div class="qpgh">${head}</div><div class="qpgc">${VX_ZC.map(([,l])=>`<span>${l}</span>`).join("")}</div>${VX_ZR.map(([r,l,s])=>`<div class="qpgr${r==="B"?" los":""}"><span class="qpgl"><b>${l}</b><br>${s}</span>${VX_ZC.map(([c])=>cell(r+c)).join("")}</div>`).join("")}</div>`;
    const who=Q?vxE(Q[0]):`${vxE(short(off))} QBs`,whos=Q?who+"'s":who+"'";
    const ed=[];for(const [r,rl] of VX_ZR)for(const [c,cl] of VX_ZC){const k=r+c,z=Z[k],d=D[k],l=ypt(LG[k]);if(!z||!d||d[0]<8||l==null)continue;const sh=z[0]/tot,e=ypt(d)-l;
      if(sh>=.08&&Math.abs(e)>=1)ed.push({k,sh,e,txt:`${rl.toLowerCase()} ${cl.toLowerCase()}`,y:ypt(d),l})}
    ed.sort((x,y)=>y.sh-x.sh);
    return `<div class="card vx2"><h2 style="margin-bottom:2px">Where the QB throws vs where the defense gives up catches</h2><div class="small" style="margin-bottom:8px">Field split into 12 areas by how far the ball travels in the air and which side. Blue = how often he throws there. Green / red = the defense gives up more / fewer yards per target there than the NFL average.</div>
     ${only?"":vxTabs(id,[["a",`${vxE(short(g.away))} pass vs ${vxE(short(g.home))} D`],["h",`${vxE(short(g.home))} pass vs ${vxE(short(g.away))} D`]],"a")}
     <div class="qpw">${grid(qcell,`🎯 ${who}<br><span class="small">share of ${Q?"his":"their"} ${tot} throws</span>`)}${grid(dcell,`🛡️ ${vxE(short(def))} defense<br><span class="small">yards per target allowed</span>`)}</div>
     ${ed.length?`<div class="shx">${ed.slice(0,3).map(x=>`<div class="${x.e>0?"g":"r"}"><b>${x.e>0?"✅":"⚠️"} ${x.txt[0].toUpperCase()+x.txt.slice(1)}</b> — ${Math.round(x.sh*100)}% of ${whos} throws; ${vxE(short(def))} allow <b>${x.y.toFixed(1)}</b> yards per target there (NFL ${x.l.toFixed(1)}).</div>`).join("")}</div>`:""}
     <div class="small" style="margin-top:6px">nflverse play-by-play, regular season${typeof NFL_TGT_WEEKS!=="undefined"&&NFL_TGT_WEEKS?` weeks ${NFL_TGT_WEEKS}`:""}. Sacks and throwaways without a target aren't counted.</div></div>`})}catch(e){return ""}}

/* ===== NFL red zone and end-zone chances: who gets the ball near the goal line, and what the defense allows ===== */
function vxEz(ez,small){const mx=Math.max(1,ez.L[0],ez.M[0],ez.R[0]);
  return `<div class="qez${small?" sm":""}" title="End-zone targets: left / middle / right">${["L","M","R"].map(k=>{const c=ez[k];return `<div style="background:rgba(249,115,22,${c[0]?(.15+c[0]/mx*.6).toFixed(2):0})"><b>${c[0]}</b><span>${c[2]} TD</span></div>`}).join("")}</div>`}
function vxRzRow(nm,r){const c=r.c20,c10=r.c10,c5=r.c5,t=r.t20,t10=r.t10,ezT=r.ez.L[0]+r.ez.M[0]+r.ez.R[0];
  const seg=(n,td,lab)=>`<div class="qrs${n?"":" none"}"><b>${n}</b><span>${lab}</span>${td?`<em>${td} TD</em>`:""}</div>`;
  return `<div class="qrz"><div class="qrzn"><b>${vxE(nm)}</b> <span class="small">${vxE(r.pos||"")}</span></div>
   <div class="qrzf"><div class="qrzl"><span>20</span><span>10</span><span>5</span><span>GL</span></div>
    ${c[0]?`<div class="qrzb">${seg(c[0]-c10[0],c[1]-c10[1],"carries 11–20")}${seg(c10[0]-c5[0],c10[1]-c5[1],"6–10")}${seg(c5[0],c5[1],"1–5")}</div>`:""}
    ${t[0]?`<div class="qrzb t">${seg(t[0]-t10[0],t[2]-t10[2],"targets 11–20")}${seg(t10[0],t10[2],"inside 10")}<div class="qrs ezs"><b>${ezT}</b><span>into end zone</span></div></div>`:""}</div>
   ${ezT?`<div class="small" style="margin-top:2px">End-zone targets · left · middle · right</div>${vxEz(r.ez,1)}`:""}</div>`}
function vxRzGame(g){try{if(typeof NFL_RZP==="undefined"||typeof NFL_RZD==="undefined")return "";
  const top=t=>Object.entries(NFL_RZP).filter(([,r])=>r.tm===t).sort((x,y)=>(y[1].c20[0]+y[1].t20[0]+y[1].c5[0])-(x[1].c20[0]+x[1].t20[0]+x[1].c5[0])).slice(0,4);
  const LG={ru:[0,0],pa:[0,0,0]};for(const d of Object.values(NFL_RZD)){LG.ru[0]+=d.ru[0];LG.ru[1]+=d.ru[1];LG.pa[0]+=d.pa[0];LG.pa[2]+=d.pa[2]}
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const side=(t,o)=>{const P=top(t),D=NFL_RZD[o];if(!P.length)return "";
    return `<div class="qrzt"><h3 style="margin:10px 0 4px">${vxE(short(t))} near the goal line</h3>${P.map(([n,r])=>vxRzRow(n,r)).join("")}
     ${D?`<div class="qrzd">🛡️ <b>${vxE(short(o))} in their red zone:</b> ${D.ru[0]} carries → <b>${D.ru[1]}</b> rush TD (${pct(D.ru[1],D.ru[0])}%, NFL ${pct(LG.ru[1],LG.ru[0])}%) · ${D.pa[0]} targets → <b>${D.pa[2]}</b> pass TD (${pct(D.pa[2],D.pa[0])}%, NFL ${pct(LG.pa[2],LG.pa[0])}%)
       <div style="margin-top:4px"><span class="small">End-zone throws against them (left · middle · right):</span>${vxEz(D.ez)}</div></div>`:""}</div>`};
  const x=side(g.away,g.home)+side(g.home,g.away);if(!x)return "";
  return vxCard("Red-zone & end-zone chances","Who gets the ball inside the 20 this season, split by distance, with touchdowns. Orange boxes = throws into the end zone (left · middle · right) and TDs from them.",x,"nflverse play-by-play, regular season. Touchdowns follow chances: a player who gets most of his team's goal-line work is the likeliest anytime scorer.")}catch(e){return ""}}
function vxRzPlayer(nm){try{if(typeof NFL_RZP==="undefined"||!NFL_RZP[nm])return "";const r=NFL_RZP[nm];
  return `<div class="card vx2" style="margin-top:12px"><h2 style="margin-bottom:2px">Goal-line map</h2><div class="small" style="margin-bottom:6px">His chances inside the 20, by distance, and his end-zone targets by side.</div>${vxRzRow(nm,r)}</div>`}catch(e){return ""}}
/* player-prop versions: QB props get his throw map vs this week's defense; anytime-TD props get his goal-line chances + the defense near its goal line */
function vxPassFor(team,opp){if(!team||!opp)return "";return vxPassMap({away:team,home:opp},team)}
function vxRzDef(o){if(typeof NFL_RZD==="undefined"||!NFL_RZD[o])return "";const D=NFL_RZD[o],LG={ru:[0,0],pa:[0,0,0]};for(const d of Object.values(NFL_RZD)){LG.ru[0]+=d.ru[0];LG.ru[1]+=d.ru[1];LG.pa[0]+=d.pa[0];LG.pa[2]+=d.pa[2]}
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  return `<div class="qrzd">🛡️ <b>${vxE(short(o))} in their red zone:</b> ${D.ru[0]} carries → <b>${D.ru[1]}</b> rush TD (${pct(D.ru[1],D.ru[0])}%, NFL ${pct(LG.ru[1],LG.ru[0])}%) · ${D.pa[0]} targets → <b>${D.pa[2]}</b> pass TD (${pct(D.pa[2],D.pa[0])}%, NFL ${pct(LG.pa[2],LG.pa[0])}%)
   <div style="margin-top:4px"><span class="small">End-zone throws against them (left · middle · right):</span>${vxEz(D.ez)}</div></div>`}
function vxRzTd(nm,opp){try{if(typeof NFL_RZP==="undefined")return "";const r=NFL_RZP[nm];if(!r)return opp?vxCard("Red-zone & end-zone chances","No red-zone carries or targets for him yet this season.",vxRzDef(opp),""):"";
  const T=Object.values(NFL_RZP).filter(x=>x.tm===r.tm),tc=T.reduce((a,x)=>a+x.c20[0],0),tt=T.reduce((a,x)=>a+x.t20[0],0),t5=T.reduce((a,x)=>a+x.c5[0],0),pc=(a,b)=>b?Math.round(a/b*100):0;
  const share=[r.c20[0]?`<b>${pc(r.c20[0],tc)}%</b> of his team's red-zone carries`:"",r.c5[0]?`<b>${pc(r.c5[0],t5)}%</b> of carries inside the 5`:"",r.t20[0]?`<b>${pc(r.t20[0],tt)}%</b> of red-zone targets`:""].filter(Boolean).join(" · ");
  const tds=r.c20[1]+r.t20[2];
  return vxCard("Red-zone & end-zone chances",`His chances inside the 20 this season, by distance — ${tds} red-zone TD${tds===1?"":"s"}.`,vxRzRow(nm,r)+(share?`<div class="qsay">He gets ${share}.</div>`:"")+(opp?`<h3 style="margin:12px 0 4px">This week's defense</h3>${vxRzDef(opp)}`:""),"nflverse play-by-play, regular season. Touchdowns follow chances: a big share of his team's goal-line work is the best sign for an anytime TD.")}catch(e){return ""}}
