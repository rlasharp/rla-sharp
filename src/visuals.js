/* ---------- 📊 Visuals: matchup heat map, minutes-vs-stat scatter, defense vs position, injury impact meter,
   goalie save % chart, NFL red zone, soccer goals by position, schedule strip. All drawn from this site's own data. ---------- */
function vxE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
function vxOrd(n){const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
/* colour for an edge: + = the attacking side has it (green), − = the defense has it (red) */
function vxEdgeBg(e,max){const a=Math.min(1,Math.abs(e)/max)*.55;return e>0?`rgba(34,197,94,${a})`:`rgba(229,72,77,${a})`}

/* ===== 26. Matchup heat map: each stat, both directions, coloured by who has the edge ===== */
function vxRankOf(vals,t,hi){const L=Object.entries(vals).filter(([,v])=>v!=null&&isFinite(v)).sort((a,b)=>hi?b[1]-a[1]:a[1]-b[1]);return L.findIndex(x=>x[0]===t)+1}
function vxHeatRows(sp){
  if(sp==="nba")return (typeof NBA_MU!=="undefined"?NBA_MU:[]).map(([k,l,u])=>({l,o:t=>{const O=NBA_TADV[t];return O?[O.o[k],O.oR[k]]:null},d:t=>{const D=NBA_TADV[t];return D?[D.d[k],D.dR[k]]:null},u,n:30}));
  if(sp==="nhl"){const T=NHL_TEAM,N=Object.keys(T).length,r=(f,hi)=>t=>{const V={};for(const x in T)V[x]=typeof f==="function"?f(T[x]):T[x][f];return [V[t],vxRankOf(V,t,hi)]};
    return [{l:"Goals per game",o:r("gf",1),d:r("ga",0),n:N},{l:"Shots per game",o:r("sf",1),d:r("sa",0),n:N},{l:"High-danger chances",o:r(x=>x.fa&&x.fa.hd&&x.fa.hd[0],1),d:r(x=>x.fa&&x.fa.hd&&x.fa.hd[1],0),n:N},
      {l:"Power play % vs penalty kill %",o:r("pp",1),d:r("pk",1),u:"%",n:N},{l:"Shot attempts share (5v5)",o:r(x=>x.fa&&x.fa.cf&&x.fa.cf[0],1),d:r(x=>x.fa&&x.fa.cf&&x.fa.cf[1],0),u:"%",n:N}]}
  if(sp==="nfl"){const T=TEAM_STATS,N=Object.keys(T).length,r=(k,hi)=>t=>{const V={};for(const x in T)V[x]=T[x][k];return [V[t],vxRankOf(V,t,hi)]};
    const pa={};try{for(const x in T)pa[x]=+teamRec(x).pa}catch(e){}
    return [{l:"Points per game",o:r("ppg",1),d:t=>[pa[t],vxRankOf(pa,t,false)],n:N},{l:"Passing yards",o:r("pass_",1),d:r("dpass",0),n:N},{l:"Rushing yards",o:r("rush",1),d:r("drush",0),n:N}]}
  return []}
function vxHeat(sp,a,h,name){try{const R=vxHeatRows(sp);if(!R.length)return "";
  const cell=(row,off,def)=>{const O=row.o(off),D=row.d(def);if(!O||!D||!O[1]||!D[1])return `<td class="vxhc">–</td>`;const n=row.n,e=(n+1-O[1])-(n+1-D[1]);
    return `<td class="vxhc" style="background:${vxEdgeBg(e,n*.75)}"><b>${vxOrd(O[1])}</b> <span class="small">vs</span> <b>${vxOrd(D[1])}</b><div class="small">${(+O[0]).toFixed(1)}${row.u||""} · ${(+D[0]).toFixed(1)}${row.u||""}</div></td>`};
  const col=(row,off,def)=>{const O=row.o(off),D=row.d(def);if(!O||!D||!O[1]||!D[1])return `<div class="vxhc vxna">–</div>`;const n=row.n,e=(n+1-O[1])-(n+1-D[1]);
    return `<div class="vxhc" style="background:${vxEdgeBg(e,n*.75)}"><b>${vxOrd(O[1])}</b> <span class="small">vs</span> <b>${vxOrd(D[1])}</b><span class="small vxhv">${(+O[0]).toFixed(1)}${row.u||""} · ${(+D[0]).toFixed(1)}${row.u||""}</span></div>`};
  return `<div class="card xacard vxheat" style="margin-top:12px"><h2>🌡️ Matchup heat map</h2><div class="xasub">Each cell: the attack's rank vs the defense's rank (1st = best). <span style="color:#16a34a">Green</span> = the attack has the edge, <span style="color:#e5484d">red</span> = the defense does. Darker = bigger gap.</div>
   <div class="vxhg vxhh"><div>${vxE(name(a))} attack <span class="small">vs ${vxE(name(h))} D</span></div><div>${vxE(name(h))} attack <span class="small">vs ${vxE(name(a))} D</span></div></div>
   ${R.map(row=>`<div class="vxhl">${vxE(row.l)}</div><div class="vxhg">${col(row,a,h)}${col(row,h,a)}</div>`).join("")}</div>`}catch(e){return ""}}

/* ===== 28. Minutes vs stat (NBA player, per prop market): a clean dot chart — green zone above the line, red below,
   his last 5 games ringed, and the one number that matters: how often he clears it when he plays his usual minutes ===== */
function vxScatter(nm,k,line){try{const p=NBA_LOGS[nm];if(!p||!NBA_MK[k]||line==null)return "";const G=p.g.map((x,i)=>({m:x[4],v:nbaVal(x,k),d:x[1],o:x[2],r:i>=p.g.length-5})).filter(x=>x.m>0);if(G.length<5)return "";
  const W=340,H=150,pl=26,pr=34,pt=10,pb=20,m0=Math.max(0,Math.floor((Math.min(...G.map(x=>x.m))-4)/2)*2),m1=Math.min(48,Math.ceil((Math.max(...G.map(x=>x.m))+4)/2)*2),ymax=Math.max(line*1.35,...G.map(x=>x.v))*1.08;
  const X=v=>pl+(v-m0)/(m1-m0)*(W-pl-pr),Y=v=>H-pb-v/ymax*(H-pb-pt),yl=Y(line);
  const avg=G.reduce((s,x)=>s+x.m,0)/G.length,cut=Math.round(avg-3),hi=G.filter(x=>x.m>=cut),lo=G.filter(x=>x.m<cut),hit=a=>a.filter(x=>x.v>line).length;
  const ticks=[];for(let v=Math.ceil(m0/6)*6;v<=m1;v+=6)ticks.push(v);const yt=[0,Math.round(ymax/2)];
  const chip=(a,lab)=>a.length?`<span class="vxchip ${hit(a)/a.length>=.6?"g":hit(a)/a.length<=.4?"r":""}">${lab}: <b>${hit(a)}/${a.length}</b> over</span>`:"";
  return `<div class="vxsc"><div class="vxsch"><b>⏱️ Minutes vs ${vxE(NBA_MK[k][2]||NBA_MK[k][1])}</b><span class="small">${G.length} games · line ${line}</span></div>
   <svg viewBox="0 0 ${W} ${H}" class="vxsvg" role="img" aria-label="Minutes played vs ${vxE(NBA_MK[k][1])}, each game this season">
    <rect x="${pl}" y="${pt}" width="${W-pl-pr}" height="${(yl-pt).toFixed(1)}" class="vxzg"/><rect x="${pl}" y="${yl.toFixed(1)}" width="${W-pl-pr}" height="${(H-pb-yl).toFixed(1)}" class="vxzr"/>
    ${yt.map(v=>`<text x="${pl-5}" y="${(Y(v)+3).toFixed(1)}" class="vxax" text-anchor="end">${v}</text>`).join("")}
    ${ticks.map(v=>`<line x1="${X(v).toFixed(1)}" x2="${X(v).toFixed(1)}" y1="${pt}" y2="${H-pb}" class="vxgrid"/><text x="${X(v).toFixed(1)}" y="${H-6}" class="vxax" text-anchor="middle">${v}</text>`).join("")}
    <line x1="${X(cut).toFixed(1)}" x2="${X(cut).toFixed(1)}" y1="${pt}" y2="${H-pb}" class="vxcut"/>
    <line x1="${pl}" x2="${W-pr}" y1="${yl.toFixed(1)}" y2="${yl.toFixed(1)}" class="vxline2"/><rect x="${W-pr+3}" y="${(yl-8).toFixed(1)}" width="${pr-5}" height="16" rx="8" class="vxlpill"/><text x="${(W-pr/2+1).toFixed(1)}" y="${(yl+3.5).toFixed(1)}" class="vxlpt" text-anchor="middle">${line}</text>
    ${G.map(x=>`<circle cx="${X(x.m).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="${x.r?5.5:4.5}" class="${x.v>line?"vxdg":x.v<line?"vxdr":"vxdn"}${x.r?" vxlast":""}"><title>${vxE(x.d)} vs ${vxE(x.o)}: ${x.v} in ${x.m} min</title></circle>`).join("")}
   </svg>
   <div class="vxchips">${chip(hi,`${cut}+ min`)}${chip(lo,`under ${cut} min`)}<span class="small">minutes played → · ◯ last 5 games · ┆ his usual minutes</span></div></div>`}catch(e){return ""}}

/* ===== 29. Defense vs position: what tonight's defense allows to each starting position vs the league ===== */
const VX_POS=["PG","SG","SF","PF","C"];
function vxDvpInner(def,k){const rows=VX_POS.map(ps=>{const d=nbaDvp(def,ps,k,10),v=d.rows.length?d.rows.reduce((s,r)=>s+r.v,0)/d.rows.length:null;return {ps,v,lg:d.lg,n:d.rows.length}}).filter(r=>r.v!=null&&r.lg>0);
  if(!rows.length)return `<div class="small">Not enough games yet.</div>`;const mx=Math.max(...rows.map(r=>Math.abs(r.v/r.lg-1)),.15);
  return rows.map(r=>{const d=r.v/r.lg-1,w=Math.min(50,Math.abs(d)/mx*50);return `<div class="vxdv"><span class="vxdvp">${r.ps}</span><div class="vxdvb"><i style="${d>=0?`left:50%;width:${w}%`:`right:50%;width:${w}%`};background:${d>=0?"#16a34a":"#e5484d"}"></i><em></em></div><span class="vxdvv"><b>${r.v.toFixed(1)}</b> <span class="small">${d>=0?"+":""}${Math.round(d*100)}%</span></span></div>`}).join("")}
function vxDvp(g){try{const k=(window.VX_DK)||"pts",tab=`<div class="vxtabs">${[["pts","PTS"],["reb","REB"],["ast","AST"],["3pm","3PM"]].map(([x,l])=>`<button data-vxdk="${x}" class="${x===k?"on":""}">${l}</button>`).join("")}</div>`;
  const side=def=>`<div><div class="small" style="margin:6px 0 4px"><b>${vxE(nbaShort(def))} defense</b> — what starters at each position scored against them (last 10 games) vs the league average</div>${vxDvpInner(def,k)}</div>`;
  return `<div class="card xacard vxdvc" style="margin-top:12px" data-vxg="${g.a}|${g.h}"><h2>🛡️ Defense vs position</h2><div class="xasub">Bars right (green) = they allow more than average to that position — good for those players' overs. Left (red) = they shut it down.</div>${tab}<div class="grid g2 vxdvbody">${side(g.h)}${side(g.a)}</div></div>`}catch(e){return ""}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-vxdk]");if(!b)return;e.preventDefault();e.stopPropagation();window.VX_DK=b.dataset.vxdk;const c=b.closest(".vxdvc"),[a,h]=c.dataset.vxg.split("|"),n=document.createElement("div");n.innerHTML=vxDvp({a,h});const nc=n.firstElementChild;const inLazy=c.parentElement&&c.parentElement.classList.contains("gplzin");if(!inLazy&&c.classList.contains("open"))nc.classList.add("open","xfold");c.replaceWith(nc);if(!inLazy&&typeof uxFoldCards!=="undefined")uxFoldCards()});

/* ===== 30. Injury impact meter: team margin with vs without each key player listed out ===== */
function vxMeter(sp,t,k,s){const f=v=>v.toFixed(sp==="nhl"?2:1),mw=s.w.me-s.w.op,mo=s.wo.me-s.wo.op,d=mo-mw,rng=sp==="nhl"?2:sp==="nfl"?14:15,w=Math.min(50,Math.abs(d)/rng*50);
  return `<div class="vxim"><div class="small"><b>${vxE(k.n)}</b> out — margin <b>${mw>=0?"+":""}${f(mw)}</b> with him (${s.w.n} g) → <b>${mo>=0?"+":""}${f(mo)}</b> without (${s.wo.n} g)</div>
   <div class="vximb"><i style="${d>=0?`left:50%;width:${w}%;background:#16a34a`:`right:50%;width:${w}%;background:#e5484d`}"></i><em></em><span class="vximl">${d>=0?"+":""}${f(d)} ${sp==="nhl"?"goals":"pts"} a game without him${s.wo.n<3?" · tiny sample":""}</span></div></div>`}

/* ===== 33. Goalie save % by game (NHL) ===== */
function vxGoalie(g){try{const lsv=typeof NH_LGSV!=="undefined"?NH_LGSV():.9;
  const one=t=>{const p=nhProbable(t);if(!p||!NHL_G[p.nm])return "";const S=NHL_G[p.nm].g.filter(x=>x[7]&&x[3]>0).slice(-15);if(S.length<2)return "";
    const W=320,H=130,pb=18,pt=8,lo=.8,hi=1,Y=v=>H-pb-(Math.max(lo,Math.min(hi,v))-lo)/(hi-lo)*(H-pb-pt),bw=(W-30)/S.length;
    return `<div><div class="small" style="margin:6px 0 2px"><b>${vxE(p.nm)}</b> — save % in his last ${S.length} starts (dashed = league ${lsv.toFixed(3).slice(1)})</div>
     <svg viewBox="0 0 ${W} ${H}" class="vxsvg" role="img" aria-label="${vxE(p.nm)} save percentage by game">
      ${[.85,.9,.95,1].map(v=>`<line x1="28" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" class="vxgrid"/><text x="25" y="${Y(v)+3}" class="vxax" text-anchor="end">${v>=1?"1.00":v.toFixed(2).slice(1)}</text>`).join("")}
      ${S.map((x,i)=>{const v=x[4]/x[3];return `<rect x="${(30+i*bw+1).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${(bw-2).toFixed(1)}" height="${(H-pb-Y(v)).toFixed(1)}" rx="2" fill="${v>=lsv?"#16a34a":"#e5484d"}" opacity=".85"><title>${vxE(x[0])} ${x[2]==="H"?"vs":"@"} ${vxE(x[1])}: ${x[4]}/${x[3]} (${v.toFixed(3).slice(1)})</title></rect>`}).join("")}
      <line x1="28" x2="${W}" y1="${Y(lsv)}" y2="${Y(lsv)}" class="vxline"/>
      <text x="30" y="${H-4}" class="vxax">${vxE(S[0][0].slice(5))}</text><text x="${W}" y="${H-4}" class="vxax" text-anchor="end">${vxE(S[S.length-1][0].slice(5))}</text>
     </svg></div>`};
  const a=one(g.a),h=one(g.h);return a||h?`<div class="card" style="margin-top:12px"><h2>📈 Goalie form</h2><div class="grid g2">${a}${h}</div><div class="small" style="margin-top:4px">Green = above the league save %, red = below. Hover or tap a bar for the game.</div></div>`:""}catch(e){return ""}}

/* ===== 34. NFL red zone: TD rate on red-zone trips (offense) vs allowed (defense), drawn on a mini field ===== */
function vxRz(g){try{const R=typeof NFL_REFS!=="undefined"&&NFL_REFS&&NFL_REFS.sk;if(!R)return "";const T=Object.keys(R).filter(t=>R[t].ora>=5),rt=(t,k)=>R[t]&&R[t][k+"ra"]?R[t][k+"rt"]/R[t][k+"ra"]:null;if(!T.length)return "";
  const lg=T.reduce((s,t)=>s+R[t].ort,0)/T.reduce((s,t)=>s+R[t].ora,0),rk=(t,k,hi)=>T.map(x=>[x,rt(x,k)]).filter(x=>x[1]!=null).sort((a,b)=>hi?b[1]-a[1]:a[1]-b[1]).findIndex(x=>x[0]===t)+1;
  const side=(o,d)=>{const a=rt(o,"o"),b=rt(d,"d");if(a==null||b==null)return "";const pg=x=>(R[x].ora/(R[x].ora?Math.max(1,teamRec(x).w+teamRec(x).l):1)).toFixed(1);
    const bar=(v,c)=>`<div class="vxrzb"><i style="width:${Math.round(v*100)}%;background:${c}"></i><em style="left:${Math.round(lg*100)}%"></em></div>`;
    return `<div class="vxrz"><div class="vxfield"><span class="vxez">END ZONE</span><span class="vx20">20</span><span class="vxtag">${vxE(short(o))} ball</span></div>
     <div class="small" style="margin-top:6px"><b>${vxE(short(o))} offense</b>: TD on <b>${Math.round(a*100)}%</b> of red-zone trips (${R[o].ort}/${R[o].ora}, ${vxOrd(rk(o,"o",true))})</div>${bar(a,a>=lg?"#16a34a":"#e5484d")}
     <div class="small" style="margin-top:6px"><b>${vxE(short(d))} defense</b> allows a TD on <b>${Math.round(b*100)}%</b> (${R[d].drt}/${R[d].dra}, ${vxOrd(rk(d,"d",false))} stingiest)</div>${bar(b,b<=lg?"#16a34a":"#e5484d")}</div>`};
  return `<div class="card xacard" style="margin-top:12px"><h2>🏈 Red zone</h2><div class="xasub">Touchdowns per trip inside the 20 this season (ESPN box scores). The tick on each bar = league average (${Math.round(lg*100)}%). Field goals instead of TDs keep totals down.</div><div class="grid g2">${side(g.away,g.home)}${side(g.home,g.away)}</div></div>`}catch(e){return ""}}

/* ===== 35. Soccer: where goals and shots come from (by position) — this league season, from player match logs ===== */
/* ESPN position codes: G = keeper; CD, CD-L, CD-R, LB, RB, SW = defence; LM, RM, CM-x, AM-x, DM = midfield; F, CF-x, LF, RF, RCF = attack; SUB = use his usual position */
function vxPosGrp(p){p=String(p||"").toUpperCase();return !p||p==="SUB"||/^G/.test(p)?null:/^(CD|LB|RB|SW|LWB|RWB)/.test(p)?"D":/M/.test(p)?"M":/F/.test(p)?"F":null}
function vxSocPos(f){try{if(typeof SOC_P==="undefined")return "";const s=typeof xfSeasonStart!=="undefined"?xfSeasonStart(f.c):"2026-07-01",M={};for(const r of SOC_RES||[])M[r[0]]=r;
  const team=t=>{const A={D:[0,0],M:[0,0],F:[0,0]};for(const p of Object.values(SOC_P)){if(!p||String(p[1])!==String(t))continue;for(const x of p[3]||[]){const r=M[x[0]];if(!r||r[2]!==f.c||r[1]<s)continue;const gp=vxPosGrp(x[12]&&x[12]!=="SUB"?x[12]:p[2]);if(!gp)continue;A[gp][0]+=x[5]||0;A[gp][1]+=x[3]||0}}return A};
  const bar=(A,i,lab)=>{const tot=A.D[i]+A.M[i]+A.F[i];if(!tot)return "";const seg=(k,c,nm)=>A[k][i]?`<i style="width:${A[k][i]/tot*100}%;background:${c}" title="${nm}: ${A[k][i]}">${A[k][i]/tot>=.12?Math.round(A[k][i]/tot*100)+"%":""}</i>`:"";
    return `<div class="small" style="margin-top:4px">${lab} (${tot})</div><div class="vxstack">${seg("D","#60a5fa","Defenders")}${seg("M","#a78bfa","Midfielders")}${seg("F","#f97316","Forwards")}</div>`};
  const side=t=>{const A=team(t);const b=bar(A,0,"Goals")+bar(A,1,"Shots");return b?`<div><div class="small"><b>${vxE(socTm(t))}</b></div>${b}</div>`:""};
  const x=side(f.h)+side(f.a);if(!x){if(typeof socPEnsure!=="undefined"&&!vxSocPos.w){vxSocPos.w=1;socPEnsure(()=>{const el=document.getElementById("vxSocPos");if(el)el.outerHTML=vxSocPos(f)},[f.h,f.a])}return `<div id="vxSocPos"></div>`}
  return `<div class="card" id="vxSocPos" style="margin-top:12px"><h2>🎯 Where the goals come from</h2><div class="xasub">Share of goals and shots by position this league season: <span style="color:#60a5fa">■</span> defenders · <span style="color:#a78bfa">■</span> midfielders · <span style="color:#f97316">■</span> forwards. Teams that rely on one player or line are easier to shut down.</div><div class="grid g2">${x}</div></div>`}catch(e){return ""}}

/* ===== 36. Schedule strip: each team's next games as tiles (home/away, opponent strength, rest days) ===== */
function vxStrip(sp,t,name,cur,d0){const L=[];try{
  if(sp==="nba")for(const [d,o,ha] of ((typeof NBA_NEXT!=="undefined"&&NBA_NEXT[t])||[]))L.push({d,o,h:ha==="H",s:(NBA_TEAM[o]||{}).marR,n:30});
  if(sp==="nhl")for(const g of nhAllGames())if((g.a===t||g.h===t)&&!nhStarted(g))L.push({d:g.d,o:g.a===t?g.h:g.a,h:g.h===t,s:(NHL_TEAM[g.a===t?g.h:g.a]||{}).rk,n:32});
  if(sp==="nfl"){const rec=x=>{try{const r=teamRec(x);return r.w/Math.max(1,r.w+r.l)}catch(e){return .5}},all=Object.keys(TEAMS).map(x=>[x,rec(x)]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
    for(const [w,d,o,ha] of ((typeof NFL_NEXT!=="undefined"&&NFL_NEXT[t])||[]))L.push({d,o,h:ha==="H",s:all.indexOf(o)+1,n:32,w})}
  if(sp==="soc"){const S=xfSched()[t]||[],now=Date.now()-3*36e5;for(const x of S)if(x.ts>now)L.push({d:new Date(x.ts).toISOString().slice(0,10),o:x.opp,h:!!x.home,s:typeof socRank!=="undefined"?socRank(cur||x.c,x.opp):null,n:((SOC_ST||{})[cur||x.c]||[]).length||20,c:x.c})}}catch(e){}
  const G=L.filter(x=>!d0||x.d>d0).sort((a,b)=>a.d<b.d?-1:1).slice(0,10);if(!G.length)return "";
  const col=(s,n)=>!s?"var(--line)":s<=n/3?"#e5484d":s<=2*n/3?"#d97706":"#16a34a";
  return `<div class="vxstrip"><div class="small" style="margin:6px 0 4px"><b>${vxE(name(t))}</b> — next ${G.length} after this one</div><div class="vxtiles">${G.map((x,i)=>{const rest=i?Math.round((Date.parse(x.d)-Date.parse(G[i-1].d))/864e5)-1:null;
    return `${rest!=null?`<span class="vxrest${rest===0?" b2b":""}" title="days off">${rest===0?"B2B":rest+"d"}</span>`:""}<span class="vxtile" style="border-color:${col(x.s,x.n)}" title="${vxE(x.d)} ${x.h?"vs":"at"} ${vxE(name(x.o))}${x.s?` (${vxOrd(x.s)})`:""}"><b>${x.h?"":"@"}${vxE(sp==="soc"?((SOC_TM[x.o]||[])[2]||name(x.o)):x.o)}</b><span>${vxE(x.d.slice(5).replace("-","/"))}</span></span>`}).join("")}</div></div>`}
function vxSched(sp,a,h,name,cur,d0){const x=vxStrip(sp,a,name,cur,d0)+vxStrip(sp,h,name,cur,d0);if(!x)return "";
  return `<div class="card xacard" style="margin-top:12px"><h2>🗓️ Upcoming schedule</h2><div class="xasub">Tile border = opponent strength: <span style="color:#e5484d">red</span> top third, <span style="color:#d97706">amber</span> middle, <span style="color:#16a34a">green</span> bottom third. Between tiles: days off (B2B = back-to-back). @ = away.</div>${x}</div>`}
