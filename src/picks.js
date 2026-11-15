/* ---------- 🧠 Our picks, honestly: why we like each play, what could make it lose (#8), whether our stated chances come
   true (calibration page, #9), and which kinds of picks are hot or cold lately (fade or follow, #11) ---------- */
function pkE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
function pkImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
/* calibration bucket for a stated chance: how our picks at that chance have really done */
function pkCalOf(sp,ch){try{const C=TRACK.sum[sp].cal.props,k=ch>=.8?"80%+":ch>=.7?"70–79%":ch>=.6?"60–69%":"50–59%",B=C&&C[k];return B&&B[0]>=8?{k,n:B[0],hit:B[1]/B[0],said:B[2]/B[0]}:null}catch(e){return null}}
/* the "what could go wrong" list for a player prop. o = {sp, nm, tm, opp, side ("o"/"u"), line, odds, ch, vals (his recent values, oldest first), spread (his team), b2b, mates: [[name, status, minutes or role]]} */
function pkRisks(o){const R=[],v=(o.vals||[]).filter(Number.isFinite),n=v.length,over=o.side==="o";
  if(n>=5){const L=v.slice(-10),mean=L.reduce((s,x)=>s+x,0)/L.length,sd=Math.sqrt(L.reduce((s,x)=>s+(x-mean)**2,0)/L.length),mn=Math.min(...L),mx=Math.max(...L);
    if(mean&&sd/mean>.45)R.push(`His numbers swing a lot: ${mn} to ${mx} over his last ${L.length}.`);
    const cush=over?mean-o.line:o.line-mean;if(Math.abs(cush)<Math.max(.6,o.line*.08))R.push(`Thin cushion: he averages ${mean.toFixed(1)} against a line of ${o.line}.`);
    const miss=L.filter(x=>over?x<=o.line:x>=o.line);if(miss.length){const w=over?Math.min(...miss):Math.max(...miss);R.push(`It has missed ${miss.length} of his last ${L.length}${miss.length<=3?` (worst: ${w})`:""}.`)}}
  else if(n)R.push(`Small sample: only ${n} games of his to go on.`);
  if(o.spread!=null&&Math.abs(o.spread)>=10)R.push(over?`Blowout risk: his team is ${o.spread<0?"favoured":"an underdog"} by ${Math.abs(o.spread)}, and starters sit late in lopsided games.`:`A blowout would help this under (spread ${o.spread>0?"+":""}${o.spread}) — a close game hurts it.`);
  if(o.b2b)R.push(`Second night of a back-to-back${over?" — legs and minutes can dip":""}.`);
  for(const [nm,st,role] of (o.mates||[]).slice(0,2))R.push(over?`If ${nm} (${st.toLowerCase()}) plays, there are fewer ${role||"touches"} to go around.`:`If ${nm} (${st.toLowerCase()}) sits, his role could grow.`);
  if(o.odds!=null&&o.odds<=-160)R.push(`Steep price: at ${typeof oddsFmt!=="undefined"?oddsFmt(o.odds):o.odds} it has to win ${Math.round(pkImp(o.odds)*100)}% just to break even.`);
  const C=o.sp&&o.ch!=null?pkCalOf(o.sp,o.ch):null;if(C&&C.hit<C.said-.08)R.push(`Our own track record: picks we rated ${C.k} have won ${Math.round(C.hit*100)}% so far (${C.n} graded), so read our chance as optimistic.`);
  return R}
function pkWhyBox(why,risks,form){if(!why&&!(risks||[]).length&&!form)return "";
  return `<details class="pkwhy"><summary>Why we like it · what could go wrong</summary>${why?`<div class="pkw"><b>Why:</b> ${why}</div>`:""}${(risks||[]).length?`<div class="pkr"><b>What could make it lose:</b><ul>${risks.map(r=>`<li>${r}</li>`).join("")}</ul></div>`:""}${form||""}</details>`}
/* NBA: everything we need for a play's risks */
function pkNbaRisks(b){try{const p=b.p||NBA_LOGS[b.nm],tm=p.tm,g=b.g||nbaGameOf(tm),L=typeof nbaLine!=="undefined"&&g?null:null;
  const sp=g&&typeof nbaL!=="undefined"&&nbaL(g)?(g.h===tm?nbaL(g).sp:-nbaL(g).sp):null,R=typeof NBA_REST!=="undefined"&&NBA_REST[tm];
  const mates=(NBA_INJ[tm]||[]).filter(r=>/quest|doubt|day/i.test(r[2])&&r[0]!==b.nm&&NBA_LOGS[r[0]]&&nbaAvg(NBA_LOGS[r[0]],"min")>=20).map(r=>[r[0],r[2],b.k==="ast"?"assists":b.k==="reb"?"rebounds":"shots"]);
  return pkRisks({sp:"nba",nm:b.nm,tm,side:b.side,line:b.line,odds:b.odds,ch:b.sc,vals:p.g.map(x=>nbaVal(x,b.k)),spread:sp,b2b:R&&R.rest===0,mates})}catch(e){return []}}
/* NHL: values from his game log */
function pkNhlRisks(x){try{if(x.type!=="prop")return [];const vals=(typeof nhVals!=="undefined"?nhVals(x.nm,x.k):[]).map(o=>o.v!=null?o.v:o).filter(Number.isFinite);
  const mates=(NHL_INJ[x.tm]||[]).filter(r=>/day|quest/i.test(r[2])&&r[0]!==x.nm&&NHL_P[r[0]]).slice(0,1).map(r=>[r[0],r[2],"ice time and shots"]);
  return pkRisks({sp:"nhl",nm:x.nm,side:x.side,line:x.line,odds:x.odds,vals,mates})}catch(e){return []}}

/* ===== #11 fade or follow: how each kind of pick has done in the last 14 days ===== */
function pkSide(label){return /\bover\b/i.test(label)?"overs":/\bunder\b/i.test(label)?"unders":""}
function pkForm(){if(window.PK_FORM)return PK_FORM;const out={};if(typeof recAll==="undefined")return out;
  const cut=new Date(Date.now()-14*864e5).toISOString().slice(0,10);
  for(const r of recAll()){if(!r.date||r.date<cut||(r.st!=="win"&&r.st!=="loss"))continue;const k=r.sport+"|"+r.type+"|"+pkSide(r.label);const g=out[k]||(out[k]={sp:r.sport,type:r.type,side:pkSide(r.label),w:0,l:0,u:0});
    if(r.st==="win")g.w++;else g.l++;g.u+=r.u||0}
  for(const g of Object.values(out)){const n=g.w+g.l;g.n=n;g.pct=n?g.w/n:0;g.tag=n>=8&&g.pct>=.6?"follow":n>=8&&g.pct<=.4?"fade":""}
  return window.PK_FORM=out}
function pkFormTag(sport,type,side){const g=pkForm()[sport+"|"+type+"|"+side];if(!g||!g.tag)return "";
  return `<span class="pkft ${g.tag}" title="${pkE(sport)} ${pkE(type.toLowerCase())} ${pkE(side)}: ${g.w}-${g.l} in the last 14 days">${g.tag==="follow"?"🔥 Hot":"🧊 Cold"}: ${pkE(sport)} ${pkE(side||type.toLowerCase())} ${g.w}-${g.l} last 2 wks</span>`}
function pkFormCard(){const G=Object.values(pkForm()).filter(g=>g.n>=6).sort((a,b)=>Math.abs(b.pct-.5)*Math.sqrt(b.n)-Math.abs(a.pct-.5)*Math.sqrt(a.n));if(!G.length)return "";
  return `<div class="card"><h2>🔥🧊 Fade or follow <span class="small">· last 14 days of our graded picks</span></h2>${G.slice(0,8).map(g=>`<div class="ufval"><b>${pkE(g.sp)} ${pkE(g.type.toLowerCase())}${g.side?" · "+g.side:""}</b><span>${g.w}-${g.l} <span class="small">(${Math.round(g.pct*100)}%)</span></span><span class="${g.u>0?"up":g.u<0?"dn":""}">${g.u>0?"+":""}${g.u.toFixed(2)}u</span>${g.tag?`<span class="pkft ${g.tag}">${g.tag==="follow"?"🔥 follow":"🧊 fade"}</span>`:`<span class="small">no streak</span>`}</div>`).join("")}
   <div class="small">"Follow" = 60%+ over 8+ picks, "fade" = 40% or less. Two weeks is a short window: hot and cold runs often even out.</div></div>`}

/* ===== #9 calibration: when we say 70%, do we win 70%? ===== */
function viewCalib(){const el=document.getElementById("v-calib");if(!el)return;const S=(typeof TRACK!=="undefined"&&TRACK&&TRACK.sum)||{};
  const mid={"80%+":.85,"70–79%":.745,"60–69%":.645,"50–59%":.545,"10%+":.12,"7–9%":.08,"4–6%":.05};
  const chart=(C,ord)=>{const K=ord.filter(k=>C[k]&&C[k][0]);if(!K.length)return `<div class="small">Not enough graded picks yet.</div>`;
    return `<div class="pkcal">${K.map(k=>{const [n,w,said,u]=C[k],act=w/n,exp=said/n;return `<div class="pkcr"><span class="pkck">${k}</span><div class="pkcb"><i class="exp" style="width:${exp*100}%"></i><i class="act ${act>=exp-.05?"ok":"lo"}" style="width:${act*100}%"></i></div><span class="pkcv"><b>${Math.round(act*100)}%</b> <small>vs ${Math.round(exp*100)}% said · ${n} picks · ${u>0?"+":""}${(+u).toFixed(1)}u</small></span></div>`}).join("")}</div>`};
  const sec=[["nba","🏀 NBA"],["nhl","🏒 NHL"],["nfl","🏈 NFL"]].filter(([k])=>S[k]&&S[k].cal).map(([k,l])=>{const s=S[k],K=s.calk||{};
    const sum=K.n?`Across ${K.n} graded best props we said they'd hit ${Math.round(K.sc/K.n*100)}% of the time on average; they hit <b>${Math.round(K.hit/K.n*100)}%</b>. The prices (margin removed) said ${Math.round(K.imp/K.n*100)}%.`:"";
    const fm=typeof xCalM!=="undefined"?[xCalM(k,"o"),xCalM(k,"u")]:null,F=s.fit,fit=fm?`<div class="small" style="margin-top:6px">🎯 Trust we now give our own numbers (0% = the price, 100% = our hit rates as before): overs <b>${Math.round(fm[0]*100)}%</b>, unders <b>${Math.round(fm[1]*100)}%</b>${F&&F.all?` — fitted on ${F.all.n} graded picks, and moves as more come in`:""}.</div>`:"";
    const sp0=k,MR=s.mkrec||{},lab=m=>sp0==="nba"&&typeof NBA_MK!=="undefined"&&NBA_MK[m]?NBA_MK[m][1]:sp0==="nhl"&&typeof NH_MK!=="undefined"&&NH_MK[m]?NH_MK[m][1]:m;
    const mkt=Object.keys(MR).length?`<h3 style="margin:10px 0 4px">By market</h3><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Market</th><th>Record</th><th>Hit</th><th>Trust now</th></tr></thead><tbody>${Object.entries(MR).sort((a,b)=>(b[1][0]+b[1][1])-(a[1][0]+a[1][1])).map(([m,[w,l]])=>{const t=F&&F.mk&&F.mk[m]&&F.mk[m].n>=12?F.mk[m].m:null;return `<tr><td>${lab(m)}</td><td>${w}-${l}</td><td>${Math.round(w/(w+l)*100)}%</td><td>${t==null?`<span class="small">uses ${sp0==="nba"||sp0==="nhl"?"overall":"–"} (needs 12+)</span>`:`<b class="${t>=.5?"up":t<=.1?"dn":""}">${Math.round(t*100)}%</b>`}</td></tr>`}).join("")}</tbody></table></div><div class="small">Each market gets its own trust level once it has 12 graded picks; a market at 0% only shows picks the price itself favours, which in practice means almost none.</div>`:"";
    return `<div class="card"><h2>${l}</h2>${sum?`<div class="nbsay">${sum}${fit}</div>`:""}${mkt}<h3 style="margin:10px 0 4px">Best props, by the chance we gave them</h3>${chart(s.cal.props,["80%+","70–79%","60–69%","50–59%"])}
     ${Object.keys(s.cal.edges||{}).length?`<h3 style="margin:10px 0 4px">Game bets, by our edge over the price</h3>${chart(s.cal.edges,["10%+","7–9%","4–6%"])}<div class="small">For game bets the grey bar is our average chance; the coloured bar is how often they won.</div>`:""}</div>`}).join("");
  el.innerHTML=`<h1>🎯 Are our chances right?</h1><p class="sub">Every best prop and game edge we post is saved before the game and graded after. Grey = the chance we said · coloured = how often it really won (green = about right or better, red = we were too high).</p>
   ${sec||`<div class="card small">Calibration appears once enough picks are graded.</div>`}${pkFormCard()}
   <p class="note">Small samples swing a lot — 20 picks at 70% can easily land between 50% and 85%. This page will steady as more games are graded. <a href="#record">Full record →</a></p>`}
