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
     ${(()=>{const A=vxE(nbaShort(att)),Dn=vxE(nbaShort(def)),cls=(v,l,n,min)=>v==null||l==null||n<min?"":v-l>=3?"g":v-l<=-3?"r":"";
       return `<h3 style="margin:12px 0 6px">Zone by zone</h3><table class="mxt shz"><thead><tr><th>Zone</th><th>${A} shots</th><th>${A} FG%</th><th>${Dn} allow FG%</th><th>NBA FG%</th></tr></thead><tbody>${NBA_ZONES.map((zn,i)=>{const sh=O[i][0]/Math.max(1,oT)*100,op=pc(O[i]),dp=pc(D[i]),lp=pc(NBA_LGZ[i]);
        return `<tr><td>${zn}</td><td>${Math.round(sh)}%</td><td class="${cls(op,lp,O[i][0],15)}">${op==null?"–":Math.round(op)+"%"}</td><td class="${cls(dp,lp,D[i][0],15)}">${dp==null?"–":Math.round(dp)+"%"}</td><td>${lp==null?"–":Math.round(lp)+"%"}</td></tr>`}).join("")}</tbody></table>
       <div class="small" style="margin-top:6px"><span class="up">Green</span> = above the NBA average (good for the shooting team), <span class="dn">red</span> = below. "${Dn} allow" = what every opponent shot against them this season.</div>`})()}
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
  return `<div class="qfw">${vxRzFieldDef(D)}</div><div class="qrzd">🛡️ <b>${vxE(short(o))} in their red zone:</b> ${D.ru[0]} carries → <b>${D.ru[1]}</b> rush TD (${pct(D.ru[1],D.ru[0])}%, NFL ${pct(LG.ru[1],LG.ru[0])}%) · ${D.pa[0]} targets → <b>${D.pa[2]}</b> pass TD (${pct(D.pa[2],D.pa[0])}%, NFL ${pct(LG.pa[2],LG.pa[0])}%)
</div>`}
function vxRzTd(nm,opp){try{if(typeof NFL_RZP==="undefined")return "";const r=NFL_RZP[nm];if(!r)return opp?vxCard("Red-zone & end-zone chances","No red-zone carries or targets for him yet this season.",vxRzDef(opp),""):"";
  const T=Object.values(NFL_RZP).filter(x=>x.tm===r.tm),tc=T.reduce((a,x)=>a+x.c20[0],0),tt=T.reduce((a,x)=>a+x.t20[0],0),t5=T.reduce((a,x)=>a+x.c5[0],0),pc=(a,b)=>b?Math.round(a/b*100):0;
  const share=[r.c20[0]?`<b>${pc(r.c20[0],tc)}%</b> of his team's red-zone carries`:"",r.c5[0]?`<b>${pc(r.c5[0],t5)}%</b> of carries inside the 5`:"",r.t20[0]?`<b>${pc(r.t20[0],tt)}%</b> of red-zone targets`:""].filter(Boolean).join(" · ");
  const tds=r.c20[1]+r.t20[2];
  return vxCard("Red-zone & end-zone chances",`His chances inside the 20 this season, by distance — ${tds} red-zone TD${tds===1?"":"s"}.`,`<div class="qfw">${vxRzFieldPlayer(r)}</div><div class="small qfk"><span style="color:#15803d">■</span> carries · <span style="color:#2563eb">■</span> targets (inside-10 targets include the 5) · <span style="color:#f97316">■</span> throws into the end zone</div>`+(share?`<div class="qsay">He gets ${share}.</div>`:"")+(opp?`<h3 style="margin:12px 0 4px">This week's defense</h3>${vxRzDef(opp)}`:""),"nflverse play-by-play, regular season. Touchdowns follow chances: a big share of his team's goal-line work is the best sign for an anytime TD.")}catch(e){return ""}}
/* ===== red zone drawn on a football field: end zone at the top (left · middle · right), then the 5, 10 and 20-yard lines =====
   r = NFL_RZP row (player) or null; ez = end-zone [targets, catches, TD] by side; bands = carries / targets by distance */
function vxField(o){const W=340,EZ=62,Y5=EZ+52,Y10=Y5+52,Y20=Y10+92,H=Y20+18,c=[W/6,W/2,W*5/6];
  const green="#2f7d46",line="rgba(255,255,255,.75)";
  let s=`<svg viewBox="0 0 ${W} ${H}" class="qfield" role="img" aria-label="${vxE(o.label||"Red zone field")}">
   <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="${green}"/>
   <rect x="0" y="0" width="${W}" height="${EZ}" rx="10" fill="#235f35"/><rect x="0" y="${EZ-10}" width="${W}" height="10" fill="#235f35"/>
   <text x="${W/2}" y="13" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" fill-opacity=".55" letter-spacing="3">END ZONE</text>
   <line x1="${W/3}" y1="0" x2="${W/3}" y2="${EZ}" stroke="${line}" stroke-opacity=".35" stroke-dasharray="3 3"/><line x1="${W*2/3}" y1="0" x2="${W*2/3}" y2="${EZ}" stroke="${line}" stroke-opacity=".35" stroke-dasharray="3 3"/>
   <line x1="0" y1="${EZ}" x2="${W}" y2="${EZ}" stroke="#fff" stroke-width="3"/>
   ${[[Y5,"5"],[Y10,"10"],[Y20,"20"]].map(([y,l])=>`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${line}" stroke-width="1.5"/><text x="8" y="${y-4}" font-size="11" font-weight="800" fill="#fff" fill-opacity=".8">${l}</text><text x="${W-8}" y="${y-4}" text-anchor="end" font-size="11" font-weight="800" fill="#fff" fill-opacity=".8">${l}</text>`).join("")}
   <text x="${W/2}" y="${EZ+12}" text-anchor="middle" font-size="8.5" font-weight="800" fill="#fff" fill-opacity=".6">GOAL LINE</text>`;
  /* end zone: targets thrown there by side */
  if(o.ez){const mx=Math.max(1,...["L","M","R"].map(k=>o.ez[k][0]));["L","M","R"].forEach((k,i)=>{const v=o.ez[k];
    s+=`<rect x="${i*W/3+6}" y="18" width="${W/3-12}" height="${EZ-24}" rx="7" fill="#f97316" fill-opacity="${v[0]?(.25+v[0]/mx*.6).toFixed(2):0}"/>
     <text x="${c[i]}" y="37" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">${v[0]}</text><text x="${c[i]}" y="50" text-anchor="middle" font-size="9.5" fill="#fff">${v[0]===1?"target":"targets"} · ${v[2]} TD</text>`});
    s+=`<text x="8" y="${EZ-4}" font-size="8" fill="#fff" fill-opacity=".6">LEFT</text><text x="${W-8}" y="${EZ-4}" text-anchor="end" font-size="8" fill="#fff" fill-opacity=".6">RIGHT</text>`}
  /* chips inside each band: [y-top, y-bottom, [{n, td, lab, col}]] */
  for(const [y0,y1,L] of o.bands||[]){const it=L.filter(x=>x&&x.n);if(!it.length)continue;const w=Math.min(150,(W-40)/it.length-8);
    it.forEach((x,i)=>{const cx=W/2+(i-(it.length-1)/2)*(w+10),cy=(y0+y1)/2;
      s+=`<g><rect x="${(cx-w/2).toFixed(1)}" y="${(cy-17).toFixed(1)}" width="${w.toFixed(1)}" height="34" rx="8" fill="${x.col}" fill-opacity=".92"/>
       <text x="${cx.toFixed(1)}" y="${(cy-2).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">${x.n} ${vxE(x.lab)}</text>
       <text x="${cx.toFixed(1)}" y="${(cy+11).toFixed(1)}" text-anchor="middle" font-size="10" fill="#fff">${x.td} TD${x.n?` · ${Math.round(x.td/x.n*100)}%`:""}</text></g>`})}
  return s+`</svg>`}
function vxRzFieldPlayer(r){const EZ=62,Y5=EZ+52,Y10=Y5+52,Y20=Y10+92,C="#15803d",T="#2563eb";
  const car=(n,td)=>({n,td,lab:n===1?"carry":"carries",col:C}),tg=(n,td)=>({n,td,lab:n===1?"target":"targets",col:T});
  return vxField({label:"His red-zone chances",ez:r.ez,bands:[[EZ,Y5,[car(r.c5[0],r.c5[1])]],[Y5,Y10,[car(r.c10[0]-r.c5[0],r.c10[1]-r.c5[1]),tg(r.t10[0],r.t10[2])]],[Y10,Y20,[car(r.c20[0]-r.c10[0],r.c20[1]-r.c10[1]),tg(r.t20[0]-r.t10[0],r.t20[2]-r.t10[2])]]]})}
function vxRzFieldDef(D){const EZ=62,Y5=EZ+52,Y10=Y5+52,Y20=Y10+92;
  return vxField({label:"Red zone allowed",ez:D.ez,bands:[[EZ,Y20,[{n:D.ru[0],td:D.ru[1],lab:"carries allowed",col:"#b45309"},{n:D.pa[0],td:D.pa[2],lab:"targets allowed",col:"#7c3aed"}]]]})}
/* ===== NBA: minutes by quarter (rebuilt from ESPN substitutions) — all games, close games, blowouts ===== */
function vxQMin(nm){try{const Q=typeof NBA_QMIN!=="undefined"&&NBA_QMIN[nm];if(!Q||Q.length<3)return "";
  const av=(G,i)=>G.length?G.reduce((a,x)=>a+x[i],0)/G.length:0,cl=Q.filter(x=>x[6]!=null&&Math.abs(x[6])<=10),bl=Q.filter(x=>x[6]!=null&&Math.abs(x[6])>=15);
  const sets=[["All games",Q],["Close (10 or less)",cl],["Blowouts (15+)",bl]].filter(s=>s[1].length);const mx=12;
  const row=([lab,G])=>`<div class="qmr"><div class="qml"><b>${lab}</b><span class="small">${G.length} g · ${(av(G,1)+av(G,2)+av(G,3)+av(G,4)+av(G,5)).toFixed(1)} min</span></div><div class="qmb">${[1,2,3,4].map(i=>{const v=av(G,i);return `<div><i style="height:${Math.max(2,v/mx*100).toFixed(0)}%"></i><b>${v.toFixed(1)}</b><span>Q${i}</span></div>`}).join("")}</div></div>`;
  const q4c=av(cl,4),q4b=av(bl,4),say=cl.length>=2&&bl.length>=2&&q4c-q4b>=2?`He loses about <b>${(q4c-q4b).toFixed(1)} fourth-quarter minutes</b> in blowouts — a big risk for overs if tonight gets lopsided.`:cl.length>=2&&bl.length>=2?`His fourth-quarter minutes barely change in blowouts.`:"";
  return `<div class="card vx2" style="margin-top:12px"><h2 style="margin-bottom:2px">Minutes by quarter</h2><div class="small" style="margin-bottom:8px">Average minutes in each quarter, last ${Q.length} games. Close vs blowout = his team's final margin.</div>${sets.map(row).join("")}${say?`<div class="qsay">${say}</div>`:""}<div class="small" style="margin-top:6px">Rebuilt from ESPN play-by-play substitutions (games where it matched the box score within 4 minutes).</div></div>`}catch(e){return ""}}
/* ===== NHL: ice time by game ===== */
function vxToi(nm){try{const w=NHL_P[nm];if(!w)return "";const G=w.g.filter(x=>x[16]!==1&&x[10]).slice(-15);if(G.length<3)return "";
  const m=G.map(x=>x[10]/60),avg=m.reduce((a,b)=>a+b,0)/m.length,mx=Math.max(...m,avg)*1.12,H=120;
  return `<div class="card vx2" style="margin-top:12px"><h2 style="margin-bottom:2px">Ice time by game</h2><div class="small" style="margin-bottom:8px">Minutes on the ice, last ${G.length} games. Gold = he scored a point. Dashed line = his average (${avg.toFixed(1)} min).</div>
   <div class="nbch" style="height:${H+34}px"><div class="nbln" style="bottom:${Math.round(avg/mx*H)+20}px;border-color:#8cc0ff"><span style="color:#8cc0ff;left:0;right:auto">avg ${avg.toFixed(1)}</span></div>
   ${G.map((x,i)=>`<div class="nbbar" title="${x[0]} ${x[2]==="H"?"vs":"@"} ${x[1]}: ${m[i].toFixed(1)} min, ${x[5]} pts, ${x[6]} SOG"><span class="v">${m[i].toFixed(0)}</span><i style="height:${Math.max(3,Math.round(m[i]/mx*H))}px;background:${x[5]>0?"#e9b949":"#3987e5aa"}"></i><span class="o">${x[2]==="H"?"":"@"}${x[1]}</span></div>`).join("")}</div>
   <div class="small" style="margin-top:4px">${(()=>{const hi=G.filter((x,i)=>m[i]>=avg+1.5),lo=G.filter((x,i)=>m[i]<=avg-1.5),pr=a=>a.length?(a.reduce((s,x)=>s+x[5],0)/a.length).toFixed(2):"–",sg=a=>a.length?(a.reduce((s,x)=>s+x[6],0)/a.length).toFixed(1):"–";return hi.length&&lo.length?`More ice time (${hi.length} g): <b>${pr(hi)}</b> pts, <b>${sg(hi)}</b> shots a game · less (${lo.length} g): <b>${pr(lo)}</b> pts, <b>${sg(lo)}</b> shots.`:""})()}</div></div>`}catch(e){return ""}}
/* ===== NFL: snap share and touches by week ===== */
function vxSnaps(nm){try{const U=typeof USAGE_RAW!=="undefined"&&USAGE_RAW[nm];if(!U||!U.wk)return "";const W=Object.entries(U.wk).map(([w,a])=>[+w,a]).sort((a,b)=>a[0]-b[0]);if(W.length<2)return "";
  const H=110,qb=U.pos==="QB";
  return `<div class="vx2s"><h3 style="margin:12px 0 4px">Snaps by week</h3><div class="small" style="margin-bottom:6px">Bar = share of his team's offensive snaps.${qb?" Number under = his runs.":" Numbers under = targets · carries."}</div>
   <div class="nbch" style="height:${H+44}px">${W.map(([w,a])=>`<div class="nbbar" title="Week ${w}: ${a[0]}% snaps, ${a[1]} targets, ${a[2]||0} carries"><span class="v">${a[0]}%</span><i style="height:${Math.max(3,Math.round(a[0]/100*H))}px;background:${a[0]>=70?"#22c55e":a[0]>=45?"#3987e5":"#8a8f98"}"></i><span class="o">W${w}<br>${qb?(a[2]||0):`${a[1]}·${a[2]||0}`}</span></div>`).join("")}</div>
   <div class="small">Green = 70%+ of snaps (every-down role), blue = 45–69%, grey = part-time. Route counts aren't in the free play-by-play, so snaps stand in for them.</div></div>`}catch(e){return ""}}
/* ===== NHL: centre vs centre faceoffs ===== */
function vxFaceoffs(g){try{if(typeof NHL_FOM==="undefined")return "";const C=t=>Object.entries(NHL_P).filter(([,p])=>p.tm===t&&p.s&&p.s[0]&&(p.s[9]+p.s[10])/p.s[0]>=5).sort((a,b)=>(b[1].s[9]+b[1].s[10])-(a[1].s[9]+a[1].s[10])).slice(0,4);
  const A=C(g.a),Hh=C(g.h);if(!A.length||!Hh.length)return "";const pc=(w,l)=>w+l?Math.round(w/(w+l)*100):null;
  const cell=(a,h)=>{const r=NHL_FOM[a]&&NHL_FOM[a][h];if(!r||!(r[0]+r[1]))return `<td class="small">–</td>`;const p=pc(r[0],r[1]);return `<td style="background:${vxEdgeBg(p-50,30)}"><b>${r[0]}-${r[1]}</b></td>`};
  const last=n=>n.split(" ").slice(-1)[0];
  return vxCard("Faceoffs: centre vs centre",`Each cell = ${vxE(g.a)} centre's wins-losses against that ${vxE(g.h)} centre this season (green = ${vxE(g.a)} centre wins more).`,
   `<div class="alw"><table class="altt fom"><thead><tr><th></th>${Hh.map(([n,p])=>`<th>${vxE(last(n))}<br><span class="small">${pc(p.s[9],p.s[10])}%</span></th>`).join("")}</tr></thead><tbody>${A.map(([n,p])=>`<tr><td style="text-align:left"><b>${vxE(last(n))}</b> <span class="small">${pc(p.s[9],p.s[10])}%</span></td>${Hh.map(([m])=>cell(n,m)).join("")}</tr>`).join("")}</tbody></table></div>`,
   "Rows: "+vxE(g.a)+" centres · columns: "+vxE(g.h)+" centres, with season faceoff win %. From the official NHL play-by-play.")}catch(e){return ""}}
/* ===== how he did against his own closing lines (LINE_HIST, saved since Nov 2) — filled in after the line history loads ===== */
function vxLnRec(sp,nm,k){return `<div class="small lnrec" data-lnrec="${vxE(JSON.stringify([sp,nm,k]))}"></div>`}
function vxLnRecFill(){const E=[...document.querySelectorAll("[data-lnrec]:not([data-done])")];if(!E.length||typeof xaHistEnsure==="undefined")return;
  xaHistEnsure(()=>{for(const el of E){el.dataset.done=1;let a;try{a=JSON.parse(el.dataset.lnrec)}catch(e){continue}const [sp,nm,k]=a,H=(XA.hist||{})[sp+"|"+nm+"|"+k];if(!H||!H.length)continue;
    const G=typeof xaGames!=="undefined"?xaGames(sp,nm,k):[];let o=0,u=0,p=0;for(const [d,ln] of H){const g=G.find(x=>x.d===d);if(!g||g.v==null)continue;if(g.v>ln)o++;else if(g.v<ln)u++;else p++}
    const n=o+u+p;if(!n)continue;el.innerHTML=`📏 Vs his own closing lines (since Nov 2): <b class="${o>u?"up":u>o?"dn":""}">Over ${o} · Under ${u}${p?` · Push ${p}`:""}</b> in ${n} game${n>1?"s":""}.`}})}
new MutationObserver(()=>{if(window._lnrT)return;window._lnrT=setTimeout(()=>{window._lnrT=0;vxLnRecFill()},150)}).observe(document.documentElement,{childList:true,subtree:true});
/* ===== NHL referees tonight: penalties and goals in the games they've worked ===== */
function vxNhlRefs(g){try{const R=typeof NHL_REFS!=="undefined"&&NHL_REFS;if(!R||!R.today)return "";const C=R.today[String(g.id)];if(!C||!C.length)return "";const L=R.lg||[null,null];
  const rows=C.map(n=>{const r=R.ref[n];return `<tr><td style="text-align:left"><b>${vxE(n)}</b></td><td>${r?r[0]:"–"}</td><td class="${r&&L[0]?(r[1]>=L[0]+.8?"up":r[1]<=L[0]-.8?"dn":""):""}">${r?r[1].toFixed(1):"–"}</td><td>${r?r[2].toFixed(1):"–"}</td></tr>`}).join("");
  const W=C.map(n=>R.ref[n]).filter(r=>r&&r[0]>=3),pen=W.length?W.reduce((a,r)=>a+r[1],0)/W.length:null,gl=W.length?W.reduce((a,r)=>a+r[2],0)/W.length:null;
  const say=pen!=null&&L[0]?`Tonight's referees average <b>${pen.toFixed(1)}</b> penalties a game (NHL ${L[0].toFixed(1)})${pen>=L[0]+.8?" — more power plays, good for PP points and shots":pen<=L[0]-.8?" — they let more go, fewer power plays":""}; <b>${gl.toFixed(1)}</b> goals a game (NHL ${L[1].toFixed(1)}).`:"";
  return vxCard("Referees tonight","Penalties called and goals scored in the games they've worked this season.",`<table class="altt"><thead><tr><th>Referee</th><th>Games</th><th>Penalties/g</th><th>Goals/g</th></tr></thead><tbody>${rows}</tbody></table>${say?`<div class="qsay">${say}</div>`:""}`,"From the NHL's game info. Penalties = minors, majors and bench minors called on both teams.")}catch(e){return ""}}
/* ===== NHL faceoffs won: no book lines in our feed, so show every centre playing today with his numbers at common lines ===== */
function vxFowCard(){try{const out=[];for(const [n,p] of Object.entries(NHL_P)){if(!p.s||!p.s[0]||(p.s[9]+p.s[10])/p.s[0]<8)continue;const g=nhGameOf(p.tm);if(!g||nhStarted(g))continue;
    const V=nhVals(n,"hfow").filter(o=>!o.prev).map(o=>o.v);if(V.length<5)continue;const avg=V.reduce((a,b)=>a+b,0)/V.length,ln=Math.floor(avg)+.5,L10=V.slice(-10),h=L10.filter(v=>v>ln).length;
    const opp=g.a===p.tm?g.h:g.a,oc=Object.values(NHL_P).filter(q=>q.tm===opp&&q.s&&q.s[0]&&(q.s[9]+q.s[10])/q.s[0]>=8),ofo=oc.length?oc.reduce((a,q)=>a+q.s[9],0)/Math.max(1,oc.reduce((a,q)=>a+q.s[9]+q.s[10],0))*100:null;
    out.push({n,p,g,opp,avg,ln,h,N:L10.length,fo:p.s[9]/(p.s[9]+p.s[10])*100,ofo,dr:(p.s[9]+p.s[10])/p.s[0]})}
  if(!out.length)return "";out.sort((a,b)=>b.dr-a.dr);
  return vxCard("Faceoffs won","Our sportsbook feed doesn't carry faceoff props, so here's every regular centre playing today: his faceoffs won per game and how often he cleared the nearest half-line. Check your book's line against it.",
   `<div class="alw"><table class="altt"><thead><tr><th style="text-align:left">Centre</th><th>Won/g</th><th>Win %</th><th>L10 over</th><th>Opp</th></tr></thead><tbody>${out.slice(0,24).map(x=>`<tr><td style="text-align:left"><a href="#nhl-player-${encodeURIComponent(x.n)}">${vxE(x.n)}</a> <span class="small">${x.g.a===x.p.tm?"@":"vs"} ${vxE(x.opp)}</span></td><td><b>${x.avg.toFixed(1)}</b></td><td>${x.fo.toFixed(0)}%</td><td>${x.h}/${x.N} <span class="small">o${x.ln}</span></td><td class="${x.ofo!=null?(x.ofo<=47?"up":x.ofo>=53?"dn":""):""}">${x.ofo!=null?x.ofo.toFixed(0)+"%":"–"}</td></tr>`).join("")}</tbody></table></div>`,
   "Opp = the other team's centres' faceoff win % (green = weak on the dot, good for him). Tap a centre for his full faceoff chart — the Faceoffs tab lets you set your book's line.")}catch(e){return ""}}
/* ===== NHL: shot attempts by game — on goal vs missed/blocked ===== */
function vxShotAtt(nm){try{const w=NHL_P[nm];if(!w)return "";const G=w.g.filter(x=>x[16]!==1&&x[15]!=null).slice(-15);if(G.length<3)return "";
  const H=110,mx=Math.max(...G.map(x=>Math.max(x[15],x[6])),1)*1.1,ta=G.reduce((a,x)=>a+x[15],0),ts=G.reduce((a,x)=>a+x[6],0),r=ta?ts/ta:0;
  const L=Object.values(NHL_P).map(p=>p.g.filter(x=>x[16]!==1&&x[15]!=null)).flat(),la=L.reduce((a,x)=>a+x[15],0),ls=L.reduce((a,x)=>a+x[6],0),lr=la?ls/la:null;
  const say=lr==null?"":r<=lr-.07?`Only <b>${Math.round(r*100)}%</b> of his attempts reach the net (NHL ${Math.round(lr*100)}%) — lots of blocked and missed shots, so his shots-on-goal can lag his effort. If he starts hitting the net, overs come quickly.`:r>=lr+.07?`<b>${Math.round(r*100)}%</b> of his attempts reach the net (NHL ${Math.round(lr*100)}%) — he rarely wastes shots, so his shots-on-goal count is steady.`:`<b>${Math.round(r*100)}%</b> of his attempts reach the net — about the NHL average (${Math.round(lr*100)}%).`;
  return `<div class="card vx2" style="margin-top:12px"><h2 style="margin-bottom:2px">Shot attempts by game</h2><div class="small" style="margin-bottom:8px">Full bar = every shot he tried (on goal + missed + blocked). Blue = on goal. Last ${G.length} games: <b>${(ta/G.length).toFixed(1)}</b> attempts, <b>${(ts/G.length).toFixed(1)}</b> on goal a game.</div>
   <div class="nbch" style="height:${H+34}px">${G.map(x=>`<div class="nbbar" title="${x[0]} ${x[2]==="H"?"vs":"@"} ${x[1]}: ${x[15]} attempts, ${x[6]} on goal"><span class="v">${x[6]}/${x[15]}</span><i style="height:${Math.max(3,Math.round(x[15]/mx*H))}px;background:linear-gradient(to top,#3987e5 ${x[15]?Math.round(x[6]/x[15]*100):0}%,#8a8f9866 ${x[15]?Math.round(x[6]/x[15]*100):0}%)"></i><span class="o">${x[2]==="H"?"":"@"}${x[1]}</span></div>`).join("")}</div>
   ${say?`<div class="qsay">${say}</div>`:""}</div>`}catch(e){return ""}}
/* ===== NHL: hot or cold shooting — goals vs what his shots should produce ===== */
function vxHotCold(nm){try{const w=NHL_P[nm];if(!w)return "";const X=typeof xaXG!=="undefined"?xaXG(nm):null,S=typeof xaShPct!=="undefined"?xaShPct(nm):null;if(!X&&!(S&&S.cur))return "";
  const L=Object.values(NHL_P).map(p=>p.g.filter(x=>x[16]!==1)).flat(),lg=L.reduce((a,x)=>a+x[3],0)/Math.max(1,L.reduce((a,x)=>a+x[6],0))*100;
  const bar=(lab,v,max,col,txt)=>`<div class="hcr"><span>${lab}</span><div class="hcb"><i style="width:${Math.min(100,v/max*100).toFixed(0)}%;background:${col}"></i></div><b>${txt}</b></div>`;
  const cur=S&&S.cur,prev=S&&S.prev,mx=Math.max(25,cur?cur.p:0,prev?prev.p:0,lg)*1.1;
  let tag="",say="";if(X){const d=X.g-X.xg;tag=d>=2?["🔥 Running hot","r"]:d<=-2?["🧊 Running cold","b"]:["Shooting about as expected",""];
    say=d>=2?`He has <b>${X.g}</b> goals but his shots would usually produce about <b>${X.xg.toFixed(1)}</b> — likely to cool off. Careful with goal overs; shots-on-goal props aren't affected.`:d<=-2?`He has only <b>${X.g}</b> goals from shots worth about <b>${X.xg.toFixed(1)}</b> — goals are likely to come. Anytime-goal prices may be too long.`:`<b>${X.g}</b> goals from shots worth about <b>${X.xg.toFixed(1)}</b> — right where he should be.`}
  return `<div class="card vx2" style="margin-top:12px"><h2 style="margin-bottom:2px">Hot or cold shooting ${tag[0]?`<span class="pll ${tag[1]==="r"?"o":tag[1]==="b"?"u":"n"}">${tag[0]}</span>`:""}</h2><div class="small" style="margin-bottom:8px">Shooting % (goals ÷ shots on goal) against the league, and goals against what his shot locations usually produce.</div>
   ${cur&&cur.s>=10?bar("This season",cur.p,mx,cur.p>=lg+3?"#e5484d":cur.p<=lg-3?"#3b82f6":"#8a8f98",`${cur.p.toFixed(1)}% <span class="small">${cur.g}/${cur.s}</span>`):""}
   ${prev&&prev.s>=20?bar("Last season",prev.p,mx,"#8a8f98",`${prev.p.toFixed(1)}% <span class="small">${prev.g}/${prev.s}</span>`):""}
   ${bar("NHL average",lg,mx,"#8a8f9888",`${lg.toFixed(1)}%`)}
   ${X?`<div class="hcx"><div><span class="small">Goals</span><b>${X.g}</b></div><div><span class="small">Expected from his shots</span><b>${X.xg.toFixed(1)}</b></div><div><span class="small">Attempts</span><b>${X.att}</b></div></div>`:""}
   ${say?`<div class="qsay">${say}</div>`:""}<div class="small" style="margin-top:6px">"Expected" = his unblocked attempts from each area × how often NHL shots from that area score (official play-by-play locations). Last season = the games from last season we have on file for him.</div></div>`}catch(e){return ""}}
/* ===== NHL props page: who's due — biggest gaps between goals and expected goals among players in today's games ===== */
function vxDueBoard(){try{if(typeof xaXG==="undefined")return "";const L=[];for(const [n,p] of Object.entries(NHL_P)){const g=nhGameOf(p.tm);if(!g||nhStarted(g))continue;const X=xaXG(n);if(!X||X.att<25)continue;L.push({n,p,g,X,d:X.g-X.xg})}
  if(L.length<4)return "";const hot=L.filter(x=>x.d>=2).sort((a,b)=>b.d-a.d).slice(0,6),cold=L.filter(x=>x.d<=-2).sort((a,b)=>a.d-b.d).slice(0,6);if(!hot.length&&!cold.length)return "";
  const row=x=>`<a class="nher" href="#nhl-player-${encodeURIComponent(x.n)}~hanyG"><span><b>${vxE(x.n)}</b> <span class="small">${vxE(x.p.tm)}</span></span><span class="small"><b>${x.X.g}</b> goal${x.X.g===1?"":"s"} · expected ${x.X.xg.toFixed(1)}</span></a>`;
  return vxCard("Hot & cold shooters today","Players in today's games scoring well above or below what their shots usually produce.",`<div class="sc2">${cold.length?`<div><h3 style="margin:4px 0">🧊 Due for goals</h3>${cold.map(row).join("")}</div>`:""}${hot.length?`<div><h3 style="margin:4px 0">🔥 Running hot (likely to cool)</h3>${hot.map(row).join("")}</div>`:""}</div>`,"Expected goals from official NHL shot locations, this season.")}catch(e){return ""}}
/* ===== filters, easier to read: every filter gets a plain-English hint, and the panel is split into labelled groups
   (When & where · Opponent · Betting lines · His role). Works on the NBA, NFL, NHL and soccer filter panels without changing how they filter. ===== */
const FX_HINT={"Venue":"Home or away games","Rest":"Days off before the game","Role":"Started or came off the bench","Opp defense":"Opponent's defense rank this season — Top 10 = hardest to score on",
  "Opp pace":"How fast the opponent plays — Fast = more chances for stats","Opp vs his position":"What the opponent gives up to players at his position","Weather":"Conditions at kickoff in that game",
  "QB":"Who threw him the ball in that game","Opp shots allowed":"How many shots the opponent gives up — Many = more chances","Opp goalie":"The goalie he faced, by that goalie's season save %",
  "Ice time":"His minutes on the ice in that game","Linemates":"Games with or without each player on his line","Power play":"Which power-play unit he was on that day","Minutes":"Minutes he played in that match","Opp in the table":"Where the opponent sits in today's league table",
  "Team's spread":"His team's point spread for that game — minus = favored","Game total (O/U)":"The over/under points line for that game","Team total (implied points)":"Points the books expected his team to score",
  "Minutes played":"Minutes he played in that game","Field-goal attempts":"Shots he took in that game","3-point attempts":"Threes he took in that game","Snap share":"Share of his team's offensive plays he was on the field for","Targets":"Passes thrown his way in that game"};
const FX_GRP={opp:["Opp defense","Opp pace","Opp vs his position","Opp shots allowed","Opp goalie","Opp in the table"],lines:["Team's spread"],role:["Minutes played","Snap share","Ice time","Minutes"]};
function fxDecorate(){for(const d of document.querySelectorAll("details.pxfd:not([data-fx])")){d.dataset.fx=1;
  const H=(t,before)=>{if(!before||before.previousElementSibling&&before.previousElementSibling.classList.contains("fgh"))return;const h=document.createElement("div");h.className="fgh";h.textContent=t;before.parentNode.insertBefore(h,before)};
  for(const s of d.querySelectorAll(".sitr>span:first-child")){const t=s.textContent.trim();if(FX_HINT[t]&&!s.querySelector("small")){const m=document.createElement("small");m.textContent=FX_HINT[t];s.appendChild(m)}}
  for(const s of d.querySelectorAll(".pxfr[data-dr] .pxfl>span:first-child")){const t=s.textContent.trim();if(FX_HINT[t]&&!s.querySelector("small")){const m=document.createElement("small");m.textContent=FX_HINT[t];s.appendChild(m)}}
  for(const s of d.querySelectorAll(".pxfl>span")){if(s.textContent.trim()==="Situation"){s.textContent="📍 When & where";if(d.textContent.includes(" •")){const m=document.createElement("small");m.textContent="• = tonight's game. Tap one choice per row; Any = no filter.";s.appendChild(m)}}}
  const sit=[...d.querySelectorAll(".sitr")],opp=sit.find(r=>FX_GRP.opp.includes((r.firstElementChild||{}).firstChild&&r.firstElementChild.firstChild.textContent.trim()));if(opp)H("🆚 Opponent",opp);
  const rows=[...d.querySelectorAll(".pxfr[data-dr]")],nm=r=>{const s=r.querySelector(".pxfl>span");return s&&s.firstChild?s.firstChild.textContent.trim():""};
  const ln=rows.find(r=>FX_GRP.lines.includes(nm(r)));if(ln)H("📈 Betting lines in each game",ln);
  const rl=rows.find(r=>FX_GRP.role.includes(nm(r)));if(rl)H("⏱ His role",rl);
  const toi=sit.find(r=>{const t=r.firstElementChild&&r.firstElementChild.firstChild&&r.firstElementChild.firstChild.textContent.trim();return t==="Ice time"||t==="Minutes"});if(toi)H("⏱ His role",toi)}}
new MutationObserver(()=>{if(window._fxT)return;window._fxT=setTimeout(()=>{window._fxT=0;fxDecorate()},60)}).observe(document.documentElement,{childList:true,subtree:true});
/* ===== box scores: on phones, a team switch (one team at a time); on wide screens, the two teams side by side ===== */
function bxPairs(){for(const sel of [".bxcard",".bxteam"])for(const a of document.querySelectorAll(sel+":not([data-bxp])")){const b=a.nextElementSibling;a.dataset.bxp=1;if(!b||!b.matches(sel))continue;b.dataset.bxp=1;
  const lab=el=>{const h=el.querySelector("h2,h3");if(!h)return "Team";const bd=h.querySelector(".nbbdg,.badge,[class*=badge],[class*=bdg]"),wl=h.querySelector(".bxwl");return ((bd&&bd.textContent.trim())||h.textContent.replace(/\s+/g," ").trim().replace(/\s[WL]\s\d+$/,""))+(wl?" · "+wl.textContent.trim():"")};
  const w=document.createElement("div");w.className="bxsw";a.parentNode.insertBefore(w,a);const t=document.createElement("div");t.className="bxtabs";
  [a,b].forEach((el,i)=>{const btn=document.createElement("button");btn.type="button";btn.textContent=lab(el);if(!i)btn.className="on";btn.onclick=()=>{[a,b].forEach((x,j)=>x.classList.toggle("bxon",j===i));t.querySelectorAll("button").forEach((x,j)=>x.classList.toggle("on",j===i))};t.appendChild(btn)});
  w.append(t,a,b);a.classList.add("bxon")}}
new MutationObserver(()=>{if(window._bxT)return;window._bxT=setTimeout(()=>{window._bxT=0;bxPairs()},60)}).observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-bxt]");if(!b)return;const w=b.closest(".bxsw");if(!w)return;const i=+b.dataset.bxt,C=[...w.querySelectorAll(":scope>.bxcard,:scope>.bxteam")];
  C.forEach((x,j)=>x.classList.toggle("bxon",j===i));w.querySelectorAll(".bxtabs button").forEach((x,j)=>x.classList.toggle("on",j===i))});
/* ===== box scores by quarter / period (NBA, NHL): built in the browser from ESPN's play-by-play for that game ===== */
const QB_S={},QB_ORIG=new WeakMap(),QB_PATH={nba:"basketball/nba",nhl:"hockey/nhl"};
async function qbSummary(sp,id){const k=sp+"|"+id;if(QB_S[k])return QB_S[k];const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${QB_PATH[sp]}/summary?event=${id}`,{cache:"force-cache"});if(!r.ok)throw new Error("HTTP "+r.status);return QB_S[k]=await r.json()}
function qbCompute(sp,S){const out={per:{},name:{},team:{},teams:[]};const comp=((S.header||{}).competitions||[])[0]||{};
  for(const c of comp.competitors||[])out.teams.push({id:String(c.team.id),ab:c.team.abbreviation,nm:c.team.displayName||c.team.abbreviation,side:c.homeAway,score:c.score,win:c.winner});
  out.teams.sort((a,b)=>a.side==="away"?-1:1);
  for(const T of ((S.boxscore||{}).players)||[])for(const g of T.statistics||[])for(const x of g.athletes||[]){const a=x.athlete||{};if(!a.id)continue;out.name[a.id]=a.shortName||a.displayName;out.team[a.id]=String(T.team.id)}
  const A=(q,id)=>{const P=out.per[q]||(out.per[q]={});return P[id]||(P[id]=sp==="nba"?[0,0,0,0,0,0,0,0,0]:[0,0,0,0,0,0])};
  for(const p of S.plays||[]){const q=(p.period||{}).number;if(!q)continue;const P=(p.participants||[]).map(x=>({id:x.athlete&&String(x.athlete.id),t:x.type||""})).filter(x=>x.id),t=(p.type||{}).text||"",ab=(p.type||{}).abbreviation||"";
    if(sp==="nba"){const a0=P[0]&&P[0].id;if(!a0)continue;
      if(/Rebound/.test(t)){A(q,a0)[1]++;continue}
      if(/^Free Throw/.test(t)){const s=A(q,a0);s[8]++;if(p.scoringPlay){s[7]++;s[0]+=p.scoreValue||1}continue}
      if(p.shootingPlay){const s=A(q,a0),m=/(\d+)-foot/.exec(p.text||""),d=m?+m[1]:0,three=p.scoreValue===3||/three point/i.test(p.text||"")||(d>=22&&!/two point/i.test(p.text||""));
        s[4]++;if(three)s[6]++;if(p.scoringPlay){s[3]++;s[0]+=p.scoreValue||2;if(three)s[5]++;if(P[1])A(q,P[1].id)[2]++}}}
    else{ /* NHL: [G, A, SOG, HIT, BLK, PIM] */
      if(ab==="goal"){P.forEach((x,i)=>{if(x.t==="scorer"||(!x.t&&i===0)){const s=A(q,x.id);s[0]++;s[2]++}else if(/assist/.test(x.t)||(!x.t&&i>0&&i<3))A(q,x.id)[1]++})}
      else if(ab==="shot-on-goal"&&P[0])A(q,P[0].id)[2]++;
      else if(ab==="hit"&&P[0])A(q,P[0].id)[3]++;
      else if(ab==="shot-blocked"&&P[1])A(q,P[1].id)[4]++;
      else if((p.type||{}).penaltyMinutes&&P[0])A(q,P[0].id)[5]+=+(p.type.penaltyMinutes)||0}}
  return out}
function qbTables(sp,S,q){const D=qbCompute(sp,S),P=D.per[q]||{};
  const H=sp==="nba"?["PTS","REB","AST","FG","3PT","FT"]:["G","A","PTS","SOG","HIT","BLK","PIM"];
  const row=s=>sp==="nba"?[s[0],s[1],s[2],s[3]+"-"+s[4],s[5]+"-"+s[6],s[7]+"-"+s[8]]:[s[0],s[1],s[0]+s[1],s[2],s[3],s[4],s[5]];
  const card=(T,i)=>{const R=Object.entries(P).filter(([id])=>D.team[id]===T.id).sort((a,b)=>sp==="nba"?b[1][0]-a[1][0]||b[1][1]-a[1][1]:(b[1][0]+b[1][1])-(a[1][0]+a[1][1])||b[1][2]-a[1][2]);
    const tot=R.reduce((t,[,s])=>t.map((v,j)=>v+s[j]),sp==="nba"?[0,0,0,0,0,0,0,0,0]:[0,0,0,0,0,0]);
    return `<div data-bxp="1" class="card bxcard${i?"":" bxon"}" style="margin-top:12px"><h2 class="bxh">${vxE(T.nm)}</h2><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Player</th>${H.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>
     ${R.map(([id,s])=>`<tr><td>${vxE(D.name[id]||id)}</td>${row(s).map((v,j)=>`<td>${j===0?`<b>${v}</b>`:v}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${H.length+1}" class="small">No stats this ${sp==="nhl"?"period":"quarter"}.</td></tr>`}
     ${R.length?`<tr class="bxtot"><td>Team</td>${row(tot).map(v=>`<td>${v}</td>`).join("")}</tr>`:""}</tbody></table></div></div>`};
  const lab=sp==="nhl"?(q<=3?["1st","2nd","3rd"][q-1]+" period":"Overtime"):(q<=4?"Quarter "+q:"Overtime");
  return `<div class="small" style="margin-top:8px">${lab} only · counted from ESPN's play-by-play (minutes aren't split by ${sp==="nhl"?"period":"quarter"}).</div><div class="bxsw"><div class="bxtabs">${D.teams.map((T,i)=>`<button type="button" data-bxt="${i}" class="${i?"":"on"}">${vxE(T.ab)}</button>`).join("")}</div>${D.teams.map(card).join("")}</div>`}
function qbTabs(sp,id,n){const L=sp==="nhl"?["1st","2nd","3rd","OT"]:["Q1","Q2","Q3","Q4","OT"],k=Math.max(sp==="nhl"?3:4,Math.min(n||0,L.length));
  return `<div class="bxqt" data-qb="${sp}|${id}"><button type="button" data-qbq="" class="on">Game</button>${L.slice(0,k).map((l,i)=>`<button type="button" data-qbq="${i+1}">${l}</button>`).join("")}</div>`}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-qbq]");if(!b)return;const bar=b.closest("[data-qb]"),area=bar&&bar.nextElementSibling;if(!area||!area.classList.contains("qbarea"))return;
  e.preventDefault();const [sp,id]=bar.dataset.qb.split("|"),q=b.dataset.qbq;bar.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));
  if(!QB_ORIG.has(area))QB_ORIG.set(area,area.innerHTML);if(!q){area.innerHTML=QB_ORIG.get(area);return}
  area.innerHTML=`<div class="small" style="padding:10px 0">Loading…</div>`;try{const S=await qbSummary(sp,id);area.innerHTML=qbTables(sp,S,+q)}catch(err){area.innerHTML=`<div class="small" style="padding:10px 0">Couldn't load the play-by-play from ESPN — try again in a moment.</div>`}});
/* ===== NBA: foul trouble — how he plays when he picks up early fouls (ESPN play-by-play) ===== */
function vxFouls(nm){try{const F=typeof NBA_FOULQ!=="undefined"&&NBA_FOULQ[nm],p=NBA_LOGS[nm];if(!F||!p)return "";const by={};for(const r of F)by[r[0]]=r;
  const G=p.g.filter(x=>by[x[0]]&&x[4]>0);if(G.length<5)return "";const early=x=>{const f=by[x[0]];return f[1]>=2||f[2]>=3};
  const E=G.filter(early),C=G.filter(x=>!early(x));const av=(a,f)=>a.length?a.reduce((s,x)=>s+f(x),0)/a.length:null,f1=v=>v==null?"–":v.toFixed(1);
  const row=(lab,a)=>`<tr><td style="text-align:left">${lab}</td><td>${a.length}</td><td><b>${f1(av(a,x=>x[4]))}</b></td><td>${f1(av(a,x=>nbaVal(x,"pts")))}</td><td>${f1(av(a,x=>nbaVal(x,"reb")))}</td><td>${f1(av(a,x=>nbaVal(x,"ast")))}</td></tr>`;
  const fpg=av(G,x=>by[x[0]][3]),dm=E.length&&C.length?av(E,x=>x[4])-av(C,x=>x[4]):null;
  const say=!E.length?`He hasn't had early foul trouble in ${G.length} games — averages <b>${f1(fpg)}</b> fouls a game.`:`Early foul trouble in <b>${E.length} of ${G.length}</b> games (${Math.round(E.length/G.length*100)}%). ${dm!=null&&dm<=-3?`He loses about <b>${Math.abs(dm).toFixed(1)} minutes</b> when it happens — a real risk for overs.`:dm!=null?`His minutes barely change when it happens.`:""}`;
  return `<div class="card vx2" style="margin-top:12px"><h2 style="margin-bottom:2px">Foul trouble</h2><div class="small" style="margin-bottom:8px">Early foul trouble = 2+ fouls in the 1st quarter or 3+ by halftime. ${f1(fpg)} fouls a game this season.</div>
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th style="text-align:left">Games</th><th>G</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead><tbody>${row("Early foul trouble",E)}${row("Clean start",C)}</tbody></table></div>
   <div class="qsay">${say}</div><div class="small" style="margin-top:6px">Fouls counted from ESPN play-by-play (technicals not included).</div></div>`}catch(e){return ""}}
/* ===== NFL: what each defense has allowed by position over its last 4 games vs the season (weekly player logs) ===== */
const VX_NDP=[["QB","QBs","passYds","pass yds"],["RB","RBs","rushRec","rush + rec yds"],["WR","WRs","recYds","rec yds"],["TE","TEs","recYds","rec yds"]];
function vxNflDefPos(def){const L=(S.playerLogs||[]).filter(l=>l.season===CUR&&l.opp===def);const wks=[...new Set(L.map(l=>+l.week))].sort((a,b)=>a-b);if(wks.length<4)return null;const last=wks.slice(-4);
  const out={};for(const [pos,,k] of VX_NDP){const per=w=>L.filter(l=>+l.week===w&&l.pos===pos).reduce((s,l)=>s+(Number.isFinite(stat(l,k))?stat(l,k):0),0);
    const sea=wks.reduce((s,w)=>s+per(w),0)/wks.length,l4=last.reduce((s,w)=>s+per(w),0)/last.length;out[pos]={sea,l4,n:wks.length}}return out}
let VX_NDR=null;function vxNflDefRanks(){if(VX_NDR)return VX_NDR;const R={};try{for(const t of Object.keys(TEAMS)){const x=vxNflDefPos(t);if(x)R[t]=x}}catch(e){}
  for(const [pos] of VX_NDP)for(const w of ["sea","l4"]){const L=Object.entries(R).filter(([,x])=>x[pos]).sort((a,b)=>b[1][pos][w]-a[1][pos][w]);L.forEach(([t],i)=>R[t][pos][w+"R"]=i+1)}return VX_NDR=R}
function vxNflDefTrend(g){try{const R=vxNflDefRanks();const side=(def,off)=>{const x=R[def];if(!x)return "";
   return `<h3 style="margin:10px 0 4px">${vxE(short(def))} defense <span class="small">— what ${vxE(short(off))} face</span></h3><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th style="text-align:left">vs</th><th>Last 4</th><th>Season</th><th>Trend</th></tr></thead><tbody>
   ${VX_NDP.map(([pos,lab,,u])=>{const y=x[pos];if(!y)return "";const d=y.l4-y.sea,pct=y.sea?d/y.sea:0,cls=pct>=.12?"up":pct<=-.12?"dn":"";
     return `<tr><td style="text-align:left"><b>${lab}</b> <span class="small">${u}</span></td><td><b>${y.l4.toFixed(0)}</b> <span class="small">${vxOrd(y.l4R)}</span></td><td>${y.sea.toFixed(0)} <span class="small">${vxOrd(y.seaR)}</span></td><td class="${cls}">${cls==="up"?"▲ giving up more":cls==="dn"?"▼ tighter":"steady"}</td></tr>`}).join("")}</tbody></table></div>`};
  const x=side(g.home,g.away)+side(g.away,g.home);if(!x)return "";
  return vxCard("Defense by position: last 4 games","Yards a game each defense gave up to each position over its last 4 games, against its season average. Rank 1st = gives up the most.",x,"From weekly player stats (nflverse). ▲ = allowing 12%+ more lately — good for overs at that position.")}catch(e){return ""}}
/* ===== NFL: kicker props this week — every posted kicker line with his record and this week's weather ===== */
function vxKickSlot(){setTimeout(vxKickFill,300);return `<div id="kickProps"></div>`}
function vxKickFill(n){const el=document.getElementById("kickProps");if(!el)return;const h=vxKickProps();if(h){el.innerHTML=h;return}if((n||0)<20)setTimeout(()=>vxKickFill((n||0)+1),1500)}
function vxKickProps(){try{if(typeof NFL_K==="undefined"||typeof LO==="undefined"||!LO.data||!LO.data.nfl)return "";const D=LO.data.nfl.props||[];const KN={};for(const n in NFL_K)KN[loNorm(n)]=n;
  const by={};for(const r of D){if(!["fgm","kpts","xpm"].includes(r[1]))continue;const n=KN[loNorm(r[0])];if(!n)continue;(by[n]=by[n]||{})[r[1]]=r}
  const L=Object.entries(by);if(!L.length)return "";const i={fgm:1,kpts:4,xpm:3},lab={fgm:"FG made",kpts:"Kicking pts",xpm:"Extra pts"};
  const rows=L.map(([n,M])=>{const K=NFL_K[n],G=K.g,o=typeof oppOf!=="undefined"?oppOf(K.tm):null,x=o&&typeof WX!=="undefined"?WX[o.g.id]:null;
    const wx=x?(x.dome?"🏟️ indoors":typeof wxMini!=="undefined"?wxMini(o.g):""):"";
    return `<tr><td style="text-align:left"><b>${vxE(n)}</b> <span class="small">${vxE(K.tm)}${o?` ${o.home?"vs":"@"} ${vxE(o.opp)}`:""}</span><div class="small">${wx}</div></td>${["fgm","kpts","xpm"].map(k=>{const r=M[k];if(!r)return `<td class="small">–</td>`;const v=G.map(z=>z[i[k]]),h=v.filter(z=>z>r[2]).length,l5=v.slice(-5).filter(z=>z>r[2]).length;
      return `<td><b>${r[2]}</b> <span class="small">o ${typeof oddsFmt!=="undefined"?oddsFmt(r[3]):r[3]}</span><div class="small ${h/Math.max(1,v.length)>=.6?"up":h/Math.max(1,v.length)<=.4?"dn":""}">over ${h}/${v.length} · L5 ${l5}/5</div></td>`}).join("")}</tr>`}).join("");
  return vxCard("🦵 Kicker props this week","Every kicker line we found, how often he cleared it this season and in his last 5, and this week's conditions.",`<div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th style="text-align:left">Kicker</th><th>FG made</th><th>Kicking pts</th><th>Extra pts</th></tr></thead><tbody>${rows}</tbody></table></div>`,"Season logs from nflverse; lines from the books we track. Wind of 15+ mph and cold cut long field goals; open each game's Matchup tab for his wind/cold splits.")}catch(e){return ""}}
/* ===== Soccer: what happens to the team without the players who are missing (matches he started vs ones he didn't, this season) ===== */
function vxSocMissImpact(f){try{if(!window.SOC_P||!f.miss)return "";const R=SOC_RES||[];const out=[];
  for(const [tid,L] of Object.entries(f.miss))for(const [nm] of L){const aid=Object.keys(SOC_P).find(a=>SOC_P[a][1]===tid&&SOC_P[a][0]===nm);if(!aid)continue;
    const st=new Set(SOC_P[aid][3].filter(g=>g[1]).map(g=>g[0]));const M=R.filter(r=>r[3]===tid||r[4]===tid).map(r=>{const h=r[3]===tid,me=h?r[7]:r[8],op=h?r[8]:r[7];return {id:r[0],gf:h?r[5]:r[6],ga:h?r[6]:r[5],sh:me&&me[0],sot:me&&me[1],w:(h?r[5]>r[6]:r[6]>r[5])?1:0}});
    const W=M.filter(m=>st.has(m.id)),O=M.filter(m=>!st.has(m.id));if(W.length<3||O.length<2)continue;
    const av=(a,k)=>a.filter(m=>m[k]!=null).reduce((s,m)=>s+m[k],0)/Math.max(1,a.filter(m=>m[k]!=null).length);out.push({tid,nm,W,O,av})}
  if(!out.length)return "";
  const row=x=>{const d=x.av(x.O,"gf")-x.av(x.W,"gf");return `<div class="qrzd" style="margin-top:8px"><b>${vxE(x.nm)}</b> <span class="small">${vxE(socTm(x.tid))} · likely out</span>
    <div class="nbatbl"><table class="bxt" style="min-width:0;margin-top:4px"><thead><tr><th style="text-align:left"></th><th>Games</th><th>Goals</th><th>Conceded</th><th>Shots</th><th>On target</th><th>Won</th></tr></thead><tbody>
    ${[["He started",x.W],["Without him",x.O]].map(([l,a])=>`<tr><td style="text-align:left">${l}</td><td>${a.length}</td><td><b>${x.av(a,"gf").toFixed(2)}</b></td><td>${x.av(a,"ga").toFixed(2)}</td><td>${x.av(a,"sh").toFixed(1)}</td><td>${x.av(a,"sot").toFixed(1)}</td><td>${Math.round(a.reduce((s,m)=>s+m.w,0)/a.length*100)}%</td></tr>`).join("")}</tbody></table></div>
    <div class="small">${Math.abs(d)>=.3?`${vxE(socTm(x.tid))} score <b>${Math.abs(d).toFixed(2)} ${d<0?"fewer":"more"}</b> goals a game without him.`:"Not much change in goals without him."}</div></div>`};
  return vxCard("If the missing players sit","How each team has done this season in matches the missing player started vs matches he didn't — every competition.",out.map(row).join(""),"Small samples — a few matches can swing these numbers. Missing = didn't feature in the last 2 matches after starting regularly, or sent off last time.")}catch(e){return ""}}

/* box scores: side by side only when the box itself is wide enough (not the window) — inside a narrow panel it keeps the team switch */
const BX_RO=typeof ResizeObserver!=="undefined"?new ResizeObserver(E=>{for(const e of E)e.target.classList.toggle("wide",e.contentRect.width>=820)}):null;
function bxWatch(){for(const w of document.querySelectorAll(".bxsw:not([data-ro])")){w.dataset.ro=1;if(BX_RO)BX_RO.observe(w);else w.classList.toggle("wide",w.clientWidth>=820)}}
new MutationObserver(()=>{if(window._bxwT)return;window._bxwT=setTimeout(()=>{window._bxwT=0;bxWatch()},50)}).observe(document.documentElement,{childList:true,subtree:true});

/* ===== NFL longest catch / run / completion each game (NFL_LONG from play-by-play) → onto the game logs, for the "longest" props.
   Weeks without play-by-play (earlier seasons) stay empty so they never count as 0. ===== */
(function(){try{if(typeof NFL_LONG==="undefined"||typeof REAL_LOGS==="undefined")return;let mx=0;for(const v of Object.values(NFL_LONG))for(const w in v)mx=Math.max(mx,+w);
  for(const l of REAL_LOGS){const ok=l.season===CUR&&l.week<=mx,L=ok&&NFL_LONG[l.player]&&NFL_LONG[l.player][l.week];
    const played=ok&&((l.rec||0)+(l.rushAtt||0)+(l.comp||0)+(l.passAtt||0)>0||l.recYds!=null||l.rushYds!=null);
    l.recLong=L?L[0]:played?0:null;l.rushLong=L?L[1]:played?0:null;l.passLong=L?L[2]:played?0:null}}catch(e){}})();
/* ===== NFL: role trend — snaps, target share and carries week by week (USAGE_RAW, nflverse snap counts + player stats) ===== */
function vxRoleTrend(nm){try{const U=typeof USAGE_RAW!=="undefined"&&USAGE_RAW[nm];if(!U||!U.wk||U.pos==="QB")return "";
  const tt={};for(const v of Object.values(USAGE_RAW))if(v.tm===U.tm&&v.wk)for(const [w,a] of Object.entries(v.wk))tt[w]=(tt[w]||0)+(a[1]||0);
  const W=Object.entries(U.wk).map(([w,a])=>({w:+w,sn:a[0],tg:a[1]||0,ca:a[2]||0,ts:tt[w]?(a[1]||0)/tt[w]*100:null})).sort((a,b)=>a.w-b.w).slice(-6);if(W.length<3)return "";
  const av=(a,k)=>{const x=a.map(o=>o[k]).filter(v=>v!=null);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null};
  const rec=W.slice(-2),old=W.slice(0,-2),rb=U.pos==="RB",key=rb?"ca":"ts";
  const d=(av(rec,key)??0)-(av(old,key)??0),ds=(av(rec,"sn")??0)-(av(old,"sn")??0);
  const say=(rb?Math.abs(d)>=3:Math.abs(d)>=5)||Math.abs(ds)>=10?(d+ds/(rb?5:2)>0?["📈 Role growing","up"]:["📉 Role shrinking","dn"]):["➖ Steady role",""];
  const H=90,bar=o=>`<div class="nbbar" title="Week ${o.w}: ${o.sn}% snaps · ${o.tg} targets${o.ts!=null?` (${Math.round(o.ts)}% of team)`:""} · ${o.ca} carries"><span class="v">${o.sn}%</span><i style="height:${Math.max(3,Math.round(o.sn/100*H))}px;background:${o.sn>=70?"#22c55e":o.sn>=45?"#3987e5":"#8a94a3"}"></i><span class="small">W${o.w}</span><span class="small">${rb?`${o.ca} car`:o.ts!=null?Math.round(o.ts)+"% tgt":o.tg+" tgt"}</span></div>`;
  return `<div class="vx2s"><h3 style="margin:4px 0 4px">Role trend <b class="${say[1]}" style="font-size:13px;margin-left:6px">${say[0]}</b></h3>
   <div class="small" style="margin-bottom:6px">Last ${W.length} games: bar = share of team snaps; under it ${rb?"carries":"his share of the team's targets"}. Last 2 games: <b>${Math.round(av(rec,"sn"))}%</b> snaps${rb?` · <b>${av(rec,"ca").toFixed(1)}</b> carries`:av(rec,"ts")!=null?` · <b>${Math.round(av(rec,"ts"))}%</b> target share`:""} vs <b>${old.length?Math.round(av(old,"sn")):"–"}%</b>${rb?` · ${old.length?av(old,"ca").toFixed(1):"–"}`:av(old,"ts")!=null?` · ${Math.round(av(old,"ts"))}%`:""} before.</div>
   <div class="nbch" style="height:${H+58}px">${W.map(bar).join("")}</div>
   <div class="small">Route counts aren't in the free play-by-play, so snaps and targets stand in for them.</div></div>`}catch(e){return ""}}
/* ===== NFL: how weather moved this stat — his games (and every player at his position) indoors / calm / windy / cold, this season ===== */
function vxWxSplit(pl,k,line){try{if(typeof NFL_GWX==="undefined"||typeof REAL_LOGS==="undefined")return "";
  const cond=l=>{const w=NFL_GWX[l.week+"|"+(l.team||pl.team)];if(!w)return null;if(/dome|closed/i.test(w[0]))return "in";if(w[2]!=null&&w[2]>=10)return "wind";if(w[1]!=null&&w[1]<=50)return "cold";return "calm"};
  const mine=pLogs(pl.name).filter(l=>l.season===CUR&&Number.isFinite(stat(l,k))),G={};for(const l of mine){const c=cond(l);if(c)(G[c]=G[c]||[]).push(stat(l,k))}
  const LG={};for(const l of REAL_LOGS){if(l.season!==CUR||l.pos!==pl.pos)continue;const v=stat(l,k);if(!Number.isFinite(v)||(k!=="passLong"&&k!=="comp"&&k!=="passYds"&&k!=="passAtt"&&v===0))continue;const c=cond(l);if(c)(LG[c]=LG[c]||[]).push(v)}
  const av=a=>a&&a.length?a.reduce((s,v)=>s+v,0)/a.length:null,lgAll=av(Object.values(LG).flat());if(!mine.length&&lgAll==null)return "";
  const lab={in:"🏟️ Indoors",calm:"🌤️ Outdoors, calm",wind:"🌬️ Wind 10+ mph",cold:"🥶 50°F or colder"};
  const o=typeof oppOf!=="undefined"?oppOf(pl.team):null,x=o&&typeof WX!=="undefined"?WX[o.g.id]:null;
  const now=x?(x.dome?"in":x.ws!=null&&x.ws>=10?"wind":x.t!=null&&x.t<=50?"cold":"calm"):null;
  const rows=Object.keys(lab).filter(c=>G[c]||LG[c]).map(c=>{const a=G[c]||[],h=line!=null?a.filter(v=>v>line).length:null,l=av(LG[c]),dl=l!=null&&lgAll?(l/lgAll-1)*100:null;
    return `<tr${c===now?' class="qhl"':""}><td>${lab[c]}</td><td>${a.length?`<b>${av(a).toFixed(1)}</b> <span class="small">${h!=null?`over ${h}/${a.length}`:`${a.length} g`}</span>`:"–"}</td><td>${l!=null?`${l.toFixed(1)} <span class="small ${dl>=4?"up":dl<=-4?"dn":""}">${dl>=0?"+":""}${Math.round(dl)}%</span>`:"–"}</td></tr>`}).join("");
  return `<div class="vx2s"><h3 style="margin:4px 0 4px">Weather</h3>${x&&typeof wxLine!=="undefined"?`<div class="small" style="margin-bottom:6px">This game: <b>${wxLine(x,o.g)}</b>${now?` → <b>${lab[now]}</b>${G[now]||LG[now]?" (highlighted)":" — no games like this yet this season"}`:""}.</div>`:""}
   <div class="nbatbl"><table class="bxt xat"><thead><tr><th>Conditions</th><th>${xaEsc((pl.name||"").split(" ").slice(-1)[0])}${line!=null?` <span class="small">(line ${line})</span>`:""}</th><th>All ${pl.pos}s</th></tr></thead><tbody>${rows}</tbody></table></div>
   <div class="small" style="margin-top:4px">Each game's actual kickoff weather (nflverse) this season. "All ${pl.pos}s" = average for every ${pl.pos} in those conditions, and how far it is from their overall average.</div></div>`}catch(e){return ""}}
/* ===== Soccer: formation matchup — how each side did this season against a back three/five vs a back four (SOC_FM = ESPN team formations) ===== */
function vxSocFmMatch(f){try{if(typeof SOC_FM==="undefined"||typeof SOC_RES==="undefined")return "";
  const back=fm=>{const d=+String(fm||"").split("-")[0];return d===4?"4":d===3||d===5?"3":null},bl={"4":"a back four","3":"a back three / five"};
  const usual=t=>{const C={};SOC_RES.filter(r=>r[3]===t||r[4]===t).slice(-8).forEach(r=>{const x=(SOC_FM[r[0]]||{})[t];if(x)C[x]=(C[x]||0)+1});const e=Object.entries(C).sort((a,b)=>b[1]-a[1])[0];return e?e[0]:null};
  const side=(t,opp)=>{const S={"4":[],"3":[]};for(const r of SOC_RES){if(r[3]!==t&&r[4]!==t)continue;const F=SOC_FM[r[0]];if(!F)continue;const home=r[3]===t,o=home?r[4]:r[3],b=back(F[o]);if(!b)continue;
      const me=home?r[7]:r[8],op=home?r[8]:r[7];S[b].push({gf:home?r[5]:r[6],ga:home?r[6]:r[5],cor:me&&me[2],ocor:op&&op[2],sh:me&&me[1]})}
    const ob=back(usual(opp));if(!S["4"].length&&!S["3"].length)return "";
    const row=b=>{const L=S[b];if(!L.length)return `<tr><td>vs ${bl[b]}</td><td colspan="4" class="small">no games yet</td></tr>`;const n=L.length,w=L.filter(x=>x.gf>x.ga).length,d=L.filter(x=>x.gf===x.ga).length,a=k=>{const v=L.map(x=>x[k]).filter(v=>v!=null);return v.length?(v.reduce((s,x)=>s+x,0)/v.length).toFixed(1):"–"};
      return `<tr${b===ob?' class="qhl"':""}><td>vs ${bl[b]}${b===ob?" ◀":""}</td><td>${w}-${d}-${n-w-d} <span class="small">(${n})</span></td><td>${a("gf")} – ${a("ga")}</td><td>${a("sh")}</td><td>${a("cor")}</td></tr>`};
    return `<h3 style="margin:10px 0 4px">${socBadge(t)} ${socE(socTm(t))} <span class="small">usually ${socE(usual(t)||"?")}</span></h3><div class="nbatbl"><table class="bxt xat"><thead><tr><th></th><th>W-D-L</th><th>Goals for – against</th><th>On target</th><th>Corners</th></tr></thead><tbody>${row("4")}${row("3")}</tbody></table></div>`};
  const x=side(f.h,f.a)+side(f.a,f.h);if(!x)return "";const uh=usual(f.h),ua=usual(f.a);
  return vxCard("Formation matchup",`${socE(socTm(f.h))} ${uh?`usually play ${socE(uh)}`:""}${uh&&ua?" · ":""}${ua?`${socE(socTm(f.a))} usually ${socE(ua)}`:""}. ◀ = the shape they face in this match.`,x,"Per game, this season, every competition. Formations are what ESPN lists at kickoff for each match; a back five counts with the back threes (same three centre-backs).")}catch(e){return ""}}
/* ===== NBA: every shot as a dot (NBA_SHOTD from play-by-play coordinates) — filled = make, hollow = miss ===== */
const SD_A="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
function vxShotDots(nm){try{if(typeof NBA_SHOTD==="undefined"||!NBA_SHOTD[nm])return "";const [xy,mb,per]=NBA_SHOTD[nm],id="sd"+nm.replace(/\W/g,"");
  const all=[];for(let i=0;i<mb.length;i++)all.push([SD_A.indexOf(xy[2*i])-6,SD_A.indexOf(xy[2*i+1])-5,mb[i]==="1"]);
  return vxBox(id,()=>{const n=+(VX_S[id]||per.length),take=per.slice(-n).reduce((s,v)=>s+v,0),S=all.slice(-take);
    const sc=8,X=x=>x*sc,Y=y=>(y+4.5)*sc,L='stroke="rgba(120,80,30,.55)" stroke-width="1.6" fill="none"',rimY=Y(.75),r3=23.75*sc,ang=Math.asin(22/23.75),ax1=X(25)-r3*Math.sin(ang),ay=rimY+r3*Math.cos(ang),ax2=X(25)+r3*Math.sin(ang);
    const mk=S.filter(s=>s[2]).length,th=S.filter(s=>Math.hypot(s[0]-25,s[1]-.75)>=22),thm=th.filter(s=>s[2]).length;
    const dots=S.map(([x,y,m])=>m?`<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="4.2" fill="#16a34a" stroke="#fff" stroke-width=".8"/>`:`<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="3.8" fill="none" stroke="#dc2626" stroke-width="1.6" opacity=".8"/>`).join("");
    return `${per.length>5?vxTabs(id,[["5","Last 5"],[String(per.length),`Last ${per.length}`]],String(per.length)):""}
     <svg viewBox="0 0 400 284" class="court sdc" role="img" aria-label="Shot chart"><rect x="0" y="0" width="400" height="284" fill="#f1dfbd"/>
     <rect x="${X(17)}" y="0" width="${16*sc}" height="${Y(14.5)}" ${L}/><circle cx="${X(25)}" cy="${Y(14.5)}" r="${6*sc}" ${L}/><circle cx="${X(25)}" cy="${rimY}" r="${.75*sc}" stroke="#e05a2b" stroke-width="2" fill="none"/>
     <line x1="${X(22)}" y1="${Y(-.5)}" x2="${X(28)}" y2="${Y(-.5)}" stroke="rgba(120,80,30,.8)" stroke-width="2"/><line x1="${X(3)}" y1="0" x2="${X(3)}" y2="${Y(9)}" ${L}/><line x1="${X(47)}" y1="0" x2="${X(47)}" y2="${Y(9)}" ${L}/>
     <path d="M ${X(3)} ${Y(9)} L ${ax1} ${ay} A ${r3} ${r3} 0 0 0 ${ax2} ${ay} L ${X(47)} ${Y(9)}" ${L}/>${dots}</svg>
     <div class="small" style="margin-top:4px"><b>${mk}/${S.length}</b> made (${S.length?Math.round(mk/S.length*100):0}%) · 3-pointers <b>${thm}/${th.length}</b> · <span style="color:#16a34a">●</span> make <span style="color:#dc2626">○</span> miss · free throws not shown.</div>`})}catch(e){return ""}}
/* ===== NHL goalie: save % by where the shots come from (NHL_G[nm].gz: slot, high slot, circles, long range) vs every goalie ===== */
function vxGoalieZones(nm){try{const G=NHL_G[nm];if(!G||!G.gz)return "";const lg=[0,1,2,3].map(i=>{let s=0,g=0;for(const v of Object.values(NHL_G))if(v.gz){s+=v.gz[i][0];g+=v.gz[i][1]}return s?1-g/s:null});
  const Z=G.gz.map(([s,g],i)=>({s,g,sv:s?1-g/s:null,lg:lg[i]})),f=v=>v==null?"–":v.toFixed(3).slice(1),col=z=>z.sv==null||z.s<8?"#cbd5e1":typeof vxEdgeBg!=="undefined"?vxEdgeBg((z.sv-z.lg)*100,4):"#94a3b8";
  const W=400,H=250,cx=200,cy=232,s=4;const lab=(x,y,t,z)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="700" fill="#0b0d10">${t}</text><text x="${x}" y="${y+15}" text-anchor="middle" font-size="12" fill="#0b0d10">${f(z.sv)} <tspan font-size="10">(${z.s})</tspan></text>`;
  return `<div class="card vx2"><h2 style="margin-bottom:2px">Where he gets beaten</h2><div class="small" style="margin-bottom:8px">Save % on shots from each area this season (shots faced in brackets). Green = better than the league's goalies from there, red = worse.</div>
   <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:420px;display:block;margin:auto" role="img" aria-label="Save % by shot area"><rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="${col(Z[3])}"/>
   <path d="M ${cx-45*s} ${cy} A ${45*s} ${45*s} 0 0 1 ${cx+45*s} ${cy} Z" fill="${col(Z[2])}" stroke="#fff" stroke-width="2"/>
   <rect x="${cx-12*s}" y="${cy-35*s}" width="${24*s}" height="${15*s}" fill="${col(Z[1])}" stroke="#fff" stroke-width="2"/>
   <path d="M ${cx-20*s} ${cy} A ${20*s} ${20*s} 0 0 1 ${cx+20*s} ${cy} Z" fill="${col(Z[0])}" stroke="#fff" stroke-width="2"/>
   <rect x="${cx-12}" y="${cy}" width="24" height="10" fill="none" stroke="#dc2626" stroke-width="2"/><line x1="0" x2="${W}" y1="${cy}" y2="${cy}" stroke="#dc2626" stroke-width="2"/>
   ${lab(cx,cy-38,"Slot",Z[0])}${lab(cx,cy-30*s+2,"High slot",Z[1])}${lab(cx-32*s,cy-58,"Circles",Z[2])}${lab(60,34,"Long range",Z[3])}</svg>
   <div class="small" style="margin-top:6px">League: slot ${f(lg[0])} · high slot ${f(lg[1])} · circles ${f(lg[2])} · long range ${f(lg[3])}.</div></div>`}catch(e){return ""}}
/* ===== Game flow for finished games, from ESPN's game summary (loaded in the visitor's browser when the card scrolls into view):
   NBA / NFL win probability through the game, NFL drive chart, soccer shots by 15-minute block ===== */
const GF_PATH={nba:"basketball/nba",nfl:"football/nfl"},GF_C={};
function vxFlowSlot(sp,key,title){return `<div class="card vx2 gflow" data-gflow="${vxE(sp+"|"+key)}"><h2 style="margin-bottom:2px">${title||"Game flow"}</h2><div class="small gfb">Loading from ESPN…</div></div>`}
async function gfSummary(sp,key){if(GF_C[sp+key])return GF_C[sp+key];let id=key,path=GF_PATH[sp];
  if(sp==="nfl"){const [wk,a,h]=key.split("|"),E={WAS:"WSH",LAR:"LA"},ab=x=>E[x]||x;const sb=await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${wk}&dates=${CUR}`,{cache:"force-cache"})).json();
    const ev=(sb.events||[]).find(e=>{const c=e.competitions[0].competitors,A=c.find(x=>x.homeAway==="away").team.abbreviation,H=c.find(x=>x.homeAway==="home").team.abbreviation;return [a,ab(a)].includes(A)&&[h,ab(h)].includes(H)});if(!ev)throw new Error("no game");id=ev.id}
  if(sp.startsWith("soc:")){path="soccer/"+sp.slice(4)}
  const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${id}`,{cache:"force-cache"});if(!r.ok)throw new Error("HTTP "+r.status);return GF_C[sp+key]=await r.json()}
function gfTeams(S){const c=(((S.header||{}).competitions||[])[0]||{}).competitors||[];const A=c.find(x=>x.homeAway==="away")||{},H=c.find(x=>x.homeAway==="home")||{};return {a:(A.team||{}),h:(H.team||{})}}
function gfWinProb(S,sp){const W=S.winprobability||[];if(W.length<10)return "";const T=gfTeams(S),per={};
  if(sp==="nba")for(const p of S.plays||[])per[p.id]=(p.period||{}).number;else for(const d of ((S.drives||{}).previous||[]))for(const p of d.plays||[])per[p.id]=(p.period||{}).number;
  const Wd=380,H=140,x=i=>i/(W.length-1)*Wd,y=v=>8+(1-v)*(H-16);let cuts="",last=null;W.forEach((w,i)=>{const q=per[w.playId];if(q&&last&&q!==last)cuts+=`<line x1="${x(i)}" x2="${x(i)}" y1="4" y2="${H-4}" stroke="var(--line)"/><text x="${x(i)+3}" y="${H-6}" font-size="10" fill="var(--text2)">${sp==="nba"?(q>4?"OT":"Q"+q):(q>4?"OT":"Q"+q)}</text>`;if(q)last=q});
  const pts=W.map((w,i)=>`${x(i).toFixed(1)},${y(w.homeWinPercentage).toFixed(1)}`).join(" "),hc="#"+(T.h.color||"3987e5"),ac="#"+(T.a.color||"e5484d");
  const swing=W.reduce((m,w,i)=>i&&Math.abs(w.homeWinPercentage-W[i-1].homeWinPercentage)>m.d?{d:Math.abs(w.homeWinPercentage-W[i-1].homeWinPercentage),i}:m,{d:0,i:0});
  const lo=Math.min(...W.map(w=>w.homeWinPercentage)),hi=Math.max(...W.map(w=>w.homeWinPercentage));
  return `<h3 style="margin:8px 0 4px">Win probability</h3><svg viewBox="0 0 ${Wd} ${H}" width="100%"><rect x="0" y="0" width="${Wd}" height="${H/2}" fill="${hc}" opacity=".07"/><rect x="0" y="${H/2}" width="${Wd}" height="${H/2}" fill="${ac}" opacity=".07"/>${cuts}<line x1="0" x2="${Wd}" y1="${y(.5)}" y2="${y(.5)}" stroke="var(--text2)" stroke-dasharray="4 3" opacity=".6"/>
   <polyline fill="none" stroke="var(--text)" stroke-width="2.2" points="${pts}"/><circle cx="${x(swing.i)}" cy="${y(W[swing.i].homeWinPercentage)}" r="5" fill="none" stroke="#f5b301" stroke-width="2.5"/>
   <text x="4" y="16" font-size="11" font-weight="700" fill="${hc}">${vxE(T.h.abbreviation||"Home")}</text><text x="4" y="${H-18}" font-size="11" font-weight="700" fill="${ac}">${vxE(T.a.abbreviation||"Away")}</text></svg>
   <div class="small">Line above the middle = ${vxE(T.h.abbreviation||"home")} favoured. ${vxE(T.h.abbreviation||"Home")} ranged from ${Math.round(lo*100)}% to ${Math.round(hi*100)}% to win; ◯ = the biggest single swing (${Math.round(swing.d*100)} points). ESPN's win probability.</div>`}
function gfDrives(S){const D=((S.drives||{}).previous||[]).filter(d=>d.start&&d.end&&d.team);if(D.length<4)return "";
  const pos=(t,ab)=>{const m=/([A-Z]{2,3})?\s*(\d+)/.exec(t||"");if(!m)return null;const n=+m[2];return n===50||!m[1]?n:(m[1]===ab?n:100-n)};
  const kind=d=>{const r=String(d.displayResult||d.result||"");return /touchdown/i.test(r)?["TD","#16a34a"]:/field goal/i.test(r)&&!/miss|block/i.test(r)?["FG","#d4a017"]:/punt/i.test(r)?["Punt","#94a3b8"]:/interception/i.test(r)?["INT","#dc2626"]:/fumble/i.test(r)?["Fumble","#dc2626"]:/downs/i.test(r)?["Downs","#dc2626"]:/missed|blocked/i.test(r)?["Miss FG","#dc2626"]:/safety/i.test(r)?["Safety","#dc2626"]:/half/i.test(r)?["Half","#cbd5e1"]:["End","#cbd5e1"]};
  const Wd=380,rh=15,H=D.length*rh+22,x=v=>30+v/100*(Wd-84);
  const rows=D.map((d,i)=>{const ab=d.team.abbreviation,s=pos(d.start.text,ab),e=pos(d.end.text,ab),[k,c]=kind(d);if(s==null)return "";const e2=k==="TD"?100:(e==null?s:e),y0=18+i*rh;
    return `<text x="0" y="${y0+4}" font-size="9" font-weight="700" fill="var(--text2)">${vxE(ab)}</text><line x1="${x(s)}" x2="${x(Math.max(s+.6,e2))}" y1="${y0}" y2="${y0}" stroke="${c}" stroke-width="8" stroke-linecap="round"/><text x="${x(Math.max(s,e2))+7}" y="${y0+4}" font-size="9.5" font-weight="700" fill="var(--text)">${vxE(k)}</text>`}).join("");
  const yl=[0,10,20,30,40,50,60,70,80,90,100].map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="8" y2="${H}" stroke="#fff" opacity="${v===50?.6:.25}"/>`).join("");
  return `<h3 style="margin:12px 0 4px">Drive chart</h3><svg viewBox="0 0 ${Wd} ${H}" width="100%"><rect x="${x(0)}" y="6" width="${x(100)-x(0)}" height="${H-6}" fill="#2f7d3b" rx="4"/><rect x="${x(100)}" y="6" width="10" height="${H-6}" fill="#25632f"/>${yl}<text x="${x(0)}" y="5" font-size="8" fill="var(--text2)">own goal</text><text x="${x(100)}" y="5" font-size="8" fill="var(--text2)" text-anchor="end">end zone</text>${rows}</svg>
   <div class="small">Every drive in order, drawn from where it started to where it ended (both teams moving left → right). Green TD · gold FG · grey punt · red turnover.</div>`}
function gfSocMomentum(S){const C=S.commentary||[],T=gfTeams(S);if(C.length<5)return "";const B=[0,1,2,3,4,5].map(()=>({h:0,a:0,gh:0,ga:0}));let n=0;
  for(const c of C){const p=c.play||{},ty=((p.type||{}).text||"")+"";if(!/shot|attempt|goal/i.test(ty)||/goal kick|disallowed|own goal/i.test(ty))continue;const tn=(p.team||{}).displayName,side=tn===T.h.displayName?"h":tn===T.a.displayName?"a":null;if(!side)continue;
    const m=((c.time||{}).value||0)/60,b=Math.min(5,Math.floor(m/15));B[b][side]++;n++}
  for(const k of S.keyEvents||[]){const ty=((k.type||{}).text||"")+"";if(!/goal/i.test(ty)||/disallowed|kick/i.test(ty))continue;const tn=(k.team||{}).displayName,own=/own/i.test(ty);let side=tn===T.h.displayName?"h":tn===T.a.displayName?"a":null;if(!side)continue;
    const b=Math.min(5,Math.floor((((k.clock||{}).value)||0)/60/15));B[b]["g"+side]++;if(!own)B[b][side]++}
  if(n<4)return "";const mx=Math.max(1,...B.map(b=>Math.max(b.h,b.a))),Wd=380,H=170,mid=H/2,bw=Wd/6,hc="#"+(T.h.color||"3987e5"),ac="#"+(T.a.color||"e5484d");
  const bars=B.map((b,i)=>`<rect x="${i*bw+8}" y="${mid-b.h/mx*(mid-24)}" width="${bw-16}" height="${b.h/mx*(mid-24)}" fill="${hc}" rx="3"/><rect x="${i*bw+8}" y="${mid}" width="${bw-16}" height="${b.a/mx*(mid-24)}" fill="${ac}" rx="3"/>${b.h?`<text x="${i*bw+bw/2}" y="${mid-b.h/mx*(mid-24)-3}" font-size="10" text-anchor="middle" fill="var(--text)">${b.h}${b.gh?" ⚽".repeat(Math.min(b.gh,2)):""}</text>`:""}${b.a?`<text x="${i*bw+bw/2}" y="${mid+b.a/mx*(mid-24)+11}" font-size="10" text-anchor="middle" fill="var(--text)">${b.a}${b.ga?" ⚽".repeat(Math.min(b.ga,2)):""}</text>`:""}<text x="${i*bw+bw/2}" y="${H+12}" font-size="9" text-anchor="middle" fill="var(--text2)">${i*15}–${i===5?"90+":(i+1)*15}'</text>`).join("");
  return `<svg viewBox="0 0 ${Wd} ${H+16}" width="100%"><line x1="0" x2="${Wd}" y1="${mid}" y2="${mid}" stroke="var(--text2)"/>${bars}<text x="${Wd-2}" y="10" text-anchor="end" font-size="11" font-weight="700" fill="${hc}">▲ ${vxE(T.h.shortDisplayName||T.h.displayName||"Home")}</text><text x="${Wd-2}" y="${H-2}" text-anchor="end" font-size="11" font-weight="700" fill="${ac}">▼ ${vxE(T.a.shortDisplayName||T.a.displayName||"Away")}</text></svg>
   <div class="small">Shots (all attempts) by each team in every 15-minute block — who was pushing when. ⚽ = goal in that block. From ESPN's match commentary.</div>`}
const GF_IO=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){GF_IO.unobserve(e.target);gfFill(e.target)}},{rootMargin:"300px"}):null;
async function gfFill(c){const [sp,...rest]=c.dataset.gflow.split("|"),key=rest.join("|"),b=c.querySelector(".gfb");
  try{const S=await gfSummary(sp,key);const h=sp==="nba"?gfWinProb(S,"nba"):sp==="nfl"?gfWinProb(S,"nfl")+gfDrives(S):gfSocMomentum(S);if(!h){c.remove();return}b.className="";b.innerHTML=h}catch(e){c.remove()}}
new MutationObserver(()=>{for(const c of document.querySelectorAll("[data-gflow]:not([data-gfo])")){c.dataset.gfo=1;if(GF_IO)GF_IO.observe(c);else gfFill(c)}}).observe(document.documentElement,{childList:true,subtree:true});
/* ===== NBA: with vs without each teammate — his average and hit rate on this line in games the teammate played vs sat (this season) ===== */
function vxMateSplit(nm,k,line){try{const p=NBA_LOGS[nm];if(!p)return "";const tm=p.tm,G=p.g.filter(x=>x[4]>0);if(G.length<6)return "";
  const mates=Object.keys(NBA_LOGS).filter(m=>m!==nm&&NBA_LOGS[m].tm===tm).map(m=>({m,L:NBA_LOGS[m].g,min:NBA_LOGS[m].g.reduce((s,x)=>s+(x[4]||0),0)})).sort((a,b)=>b.min-a.min).slice(0,7);
  const rows=[];for(const T of mates){const ids=new Set(T.L.filter(x=>x[4]>0).map(x=>x[0])),W=G.filter(x=>ids.has(x[0])),O=G.filter(x=>!ids.has(x[0]));if(O.length<2||W.length<2)continue;
    const av=a=>a.reduce((s,x)=>s+nbaVal(x,k),0)/a.length,hr=a=>a.filter(x=>pxHit(nbaVal(x,k),line)).length,inj=typeof nbaInjOf!=="undefined"?nbaInjOf(T.m):null,out=inj&&/out|doubtful/i.test(inj[2]||"");
    rows.push({m:T.m,w:av(W),o:av(O),wn:W.length,on:O.length,wh:hr(W),oh:hr(O),out,st:inj&&inj[2]})}
  if(!rows.length)return "";rows.sort((a,b)=>(b.out-a.out)||Math.abs(b.o-b.w)-Math.abs(a.o-a.w));const mx=Math.max(line,...rows.flatMap(r=>[r.w,r.o]))*1.1;
  const bar=(v,c)=>`<i style="width:${Math.max(3,v/mx*100)}%;background:${c}"></i>`;
  return `<div class="vxms"><h4 style="margin:10px 0 4px">👥 With vs without teammates <span class="small">· ${NBA_MK[k]?NBA_MK[k][2]:k} ${line}</span></h4>${rows.slice(0,5).map(r=>`<div class="msr${r.out?" out":""}"><div class="small"><b>${nbaEsc(r.m)}</b>${r.out?` <span class="dn">· ${nbaEsc(r.st)} tonight</span>`:""}</div>
     <div class="msb"><span class="small">with</span><div class="msbar">${bar(r.w,"#94a3b8")}<b>${r.w.toFixed(1)}</b></div><span class="small">${r.wh}/${r.wn} over</span></div>
     <div class="msb"><span class="small">without</span><div class="msbar">${bar(r.o,r.o>r.w?"#16a34a":"#dc2626")}<b>${r.o.toFixed(1)}</b></div><span class="small">${r.oh}/${r.on} over</span></div></div>`).join("")}
   <div class="small">Games this season he played with each teammate vs games that teammate missed. Small samples swing a lot.</div></div>`}catch(e){return ""}}
/* ===== NBA: what tonight's opponent allowed at his position, game by game (last 10), drawn like his own bars ===== */
function vxOppAllowBars(opp,pos,k,line){try{if(typeof nbaDvp==="undefined"||!opp||!pos)return "";const d=nbaDvp(opp,pos,k,10);if(!d||!d.rows||d.rows.length<3)return "";
  const R=d.rows.filter(r=>r.who&&r.who.length).slice(-10).map(r=>Object.assign({},r,{lab:(r.ha==="H"?"":"@")+r.vs})),mx=Math.max(line,...R.map(r=>r.v))*1.12,av=R.reduce((s,r)=>s+r.v,0)/R.length;
  return `<div class="vxms"><h4 style="margin:10px 0 4px">🛡️ ${nbaEsc(nbaShort(opp))} allowed to ${nbaPosWord?nbaPosWord(pos):pos} · last ${R.length}</h4>
   <div class="nbch" style="height:120px">${R.map(r=>`<div class="nbbar" title="${nbaEsc(r.lab||"")}"><span class="v">${typeof r.v==="number"&&r.v%1?r.v.toFixed(1):r.v}</span><i style="height:${Math.max(3,Math.round(r.v/mx*80))}px;background:${r.v>line?"#16a34a":"#dc2626"}"></i><span class="small">${nbaEsc(String(r.lab||"").slice(0,6))}</span></div>`).join("")}</div>
   <div class="small">Total ${NBA_MK[k]?NBA_MK[k][2]:k} they gave up to ${pos}s each game (all players at the position combined) · avg <b>${av.toFixed(1)}</b> vs NBA ${d.lg!=null?nbaF(d.lg):"–"}. Green = above his line.</div></div>`}catch(e){return ""}}
/* ===== NBA: minutes tonight — his usual minutes, how blowouts cut them, and tonight's blowout risk from the spread (real closing lines this season) ===== */
function vxMinProj(nm){try{const p=NBA_LOGS[nm];if(!p||typeof NBA_SPR==="undefined")return "";const G=p.g.filter(x=>x[4]>0);if(G.length<5)return "";
  const L=G.slice(-10),w=L.map((x,i)=>i>=L.length-5?2:1),base=L.reduce((s,x,i)=>s+x[4]*w[i],0)/w.reduce((a,b)=>a+b,0);
  const srt=G.slice(-15).map(x=>x[4]).sort((a,b)=>a-b),q=f=>srt[Math.min(srt.length-1,Math.max(0,Math.round(f*(srt.length-1))))];
  const mg=x=>{const s=NBA_SPR[x[0]];return s&&s[5]!=null?Math.abs(s[6]-s[5]):null},blow=G.filter(x=>(mg(x)??0)>=18),close=G.filter(x=>mg(x)!=null&&mg(x)<18);
  const avm=a=>a.length?a.reduce((s,x)=>s+x[4],0)/a.length:null,bm=avm(blow),cm=avm(close);
  const all=Object.values(NBA_SPR).filter(s=>s[3]!=null&&s[5]!=null),bucket=sp=>{const a=Math.abs(sp);return all.filter(s=>{const b=Math.abs(s[3]);return a<5?b<5:a<10?b>=5&&b<10:b>=10})},sp=typeof pxNbaSpread!=="undefined"?pxNbaSpread(p.tm):null;
  const B=sp!=null?bucket(sp):[],risk=B.length>=15?B.filter(s=>Math.abs(s[6]-s[5])>=18).length/B.length:null;
  const proj=bm!=null&&cm!=null&&risk!=null&&blow.length>=2?cm*(1-risk)+bm*risk:base;
  const mates=Object.keys(NBA_LOGS).filter(m=>m!==nm&&NBA_LOGS[m].tm===p.tm&&typeof nbaInjOf!=="undefined"&&(()=>{const i=nbaInjOf(m);return i&&/out/i.test(i[2]||"")})()&&NBA_LOGS[m].g.reduce((s,x)=>s+x[4],0)/Math.max(1,NBA_LOGS[m].g.length)>=20);
  const mateTxt=mates.map(m=>{const ids=new Set(NBA_LOGS[m].g.filter(x=>x[4]>0).map(x=>x[0])),O=G.filter(x=>!ids.has(x[0]));return O.length>=2?`${nbaEsc(m)} is out — in ${O.length} games without him he played <b>${avm(O).toFixed(1)}</b> min.`:""}).filter(Boolean);
  const lo=q(.2),hi=q(.8),W=300,x=v=>Math.max(0,Math.min(W,(v-Math.min(lo,proj)+4)/((Math.max(hi,proj)+4)-(Math.min(lo,proj)-4))*W));
  return `<div class="card vx2" style="margin-top:12px"><h2 style="margin-bottom:2px">⏱️ Minutes tonight</h2><div class="mprow"><b class="mpbig">~${Math.round(proj)}</b><span class="small">min expected · usual range <b>${lo}–${hi}</b> (middle 60% of his last ${srt.length})</span></div>
   <svg viewBox="0 0 ${W} 26" width="100%" style="max-width:340px"><rect x="${x(lo)}" y="8" width="${Math.max(4,x(hi)-x(lo))}" height="10" rx="5" fill="#3987e5" opacity=".3"/><line x1="${x(proj)}" x2="${x(proj)}" y1="2" y2="24" stroke="#3987e5" stroke-width="3"/></svg>
   <ul class="small mpl"><li>Last 10: <b>${avm(L).toFixed(1)}</b> min (last 5 count double → ${base.toFixed(1)}).</li>
   ${bm!=null&&cm!=null&&blow.length>=2?`<li>In blowouts (won or lost by 18+): <b>${bm.toFixed(1)}</b> min (${blow.length} g) vs <b>${cm.toFixed(1)}</b> in closer games.</li>`:""}
   ${risk!=null?`<li>Tonight's spread ${sp>0?"+":""}${sp}: games with spreads like this ended in an 18+ point blowout <b>${Math.round(risk*100)}%</b> of the time this season (${B.length} games).</li>`:""}
   ${mateTxt.map(t=>`<li>${t}</li>`).join("")}</ul></div>`}catch(e){return ""}}
