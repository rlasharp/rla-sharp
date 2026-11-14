/* ================= 🥊 UFC section =================
   Data: ufc_data.js (cards, results, fighter bios and last-10-fight stats — tools/ufcfetch.py, ESPN), loaded on demand.
   Odds: the PropLine feed in data/live_odds.json ("ufc": moneyline, method, distance, rounds, finish / KO / submission,
   significant strikes, takedowns), refreshed through the day.
   Routes: #ufc (next card) · #ufc-event-<id> · #ufc-fight-<id> · #ufc-fighter-<id> · #ufc-props · #ufc-results */
const UFC_WAIT=[];var UFC_READY=false;
function ufcEnsure(cb){if(typeof socLoad!=="undefined")socLoad("ufc_data.js","UFC_OK",UFC_WAIT,()=>{UFC_READY=true},cb);else cb&&cb()}
function ufE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
const UFC={ev:null};
function ufDate(t){try{return new Date(t).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",timeZone:"America/Toronto"})}catch(e){return (t||"").slice(0,10)}}
function ufTime(t){try{return new Date(t).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"America/Toronto"})+" ET"}catch(e){return ""}}
function ufLast(n){const w=String(n||"").split(" ");return w.length>1?w.slice(-1)[0]:n}
function ufFights(){const o=[];for(const e of (window.UFC_EV||[]))for(const f of e.f)o.push(Object.assign({ev:e},f));return o}
function ufFight(id){return ufFights().find(f=>String(f.id)===String(id))}
function ufUpcoming(){const now=Date.now();return (window.UFC_EV||[]).filter(e=>e.f.some(f=>f.st!=="post")&&Date.parse(e.d)>now-30*3600e3).sort((a,b)=>Date.parse(a.d)-Date.parse(b.d))}
function ufPast(){return (window.UFC_EV||[]).filter(e=>e.f.length&&e.f.every(f=>f.st==="post")).sort((a,b)=>Date.parse(b.d)-Date.parse(a.d))}
function ufAm(o){return typeof oddsFmt!=="undefined"?oddsFmt(o):(o>0?"+":"")+o}
function ufImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
function ufPct(p){return p==null?"–":Math.round(p*100)+"%"}

/* ---------- fighter numbers from his last 10 fights ---------- */
function ufStats(aid){const F=(window.UFC_F||{})[aid];if(!F)return null;const H=F.h||[];const done=H.filter(r=>r[3]==="W"||r[3]==="L"||r[3]==="D");
  const S=H.filter(r=>r[8]&&r[10]!=null);const mins=S.reduce((s,r)=>s+r[8],0)/60,sum=i=>S.reduce((s,r)=>s+(+r[i]||0),0);
  const W=done.filter(r=>r[3]==="W"),L=done.filter(r=>r[3]==="L"),by=(A,m)=>A.filter(r=>r[4]===m).length;
  const ctrl=S.filter(r=>r[19]!=null);
  return {n:H.length,w:W.length,l:L.length,wKO:by(W,"KO"),wSUB:by(W,"SUB"),wDEC:by(W,"DEC"),lKO:by(L,"KO"),lSUB:by(L,"SUB"),lDEC:by(L,"DEC"),
    slpm:mins?sum(10)/mins:null,sapm:mins?sum(12)/mins:null,acc:sum(11)?sum(10)/sum(11):null,def:sum(13)?1-sum(12)/sum(13):null,
    td15:mins?sum(14)/mins*15:null,tdacc:sum(15)?sum(14)/sum(15):null,tddef:sum(17)?1-sum(16)/sum(17):null,kd15:mins?sum(18)/mins*15:null,sub15:mins?sum(20)/mins*15:null,
    ctrl:ctrl.length?ctrl.reduce((s,r)=>s+r[19],0)/ctrl.length:null,
    avgT:H.filter(r=>r[8]).length?H.filter(r=>r[8]).reduce((s,r)=>s+r[8],0)/H.filter(r=>r[8]).length:null,
    dist:H.length?H.filter(r=>r[4]==="DEC").length/H.length:null,fin:W.length?(by(W,"KO")+by(W,"SUB"))/W.length:null,
    form:H.slice(0,5).map(r=>r[3]),statN:S.length,secs:H.map(r=>r[8]).filter(Boolean),
    /* whole career (ESPN record: KO/TKO and submission wins and losses; the rest are decisions) */
    C:(()=>{const r=F.R||{};if(r.wins==null)return null;const w=r.wins||0,l=r.losses||0,ko=r.tkos||0,sb=r.submissions||0,lko=r.tkoLosses||0,lsb=r.submissionLosses||0;
      return {w,l,KO:ko,SUB:sb,DEC:Math.max(0,w-ko-sb),lKO:lko,lSUB:lsb,lDEC:Math.max(0,l-lko-lsb)}})()}}
function ufTime2(s){if(!s)return "–";const r=Math.floor((s-1)/300)+1,x=s-(r-1)*300;return `R${r} ${Math.floor(x/60)}:${String(Math.round(x%60)).padStart(2,"0")}`}

/* ---------- odds: match the PropLine fight to the ESPN fight by fighter names ---------- */
function ufNorm(s){return typeof loNorm!=="undefined"?loNorm(s):String(s||"").toLowerCase().replace(/[^a-z]/g,"")}
function ufOddsOf(f){const D=typeof LO!=="undefined"&&LO.data&&LO.data.ufc;if(!D||!D.fights)return null;const a=ufNorm(f.c[0][1]),b=ufNorm(f.c[1]&&f.c[1][1]),la=ufNorm(ufLast(f.c[0][1])),lb=ufNorm(ufLast(f.c[1]&&f.c[1][1]));
  return D.fights.find(x=>{const A=ufNorm(x.a),B=ufNorm(x.h);return (A===a&&B===b)||(A===b&&B===a)||((A.endsWith(la)||B.endsWith(la))&&(A.endsWith(lb)||B.endsWith(lb)))})||null}
/* which fighter an outcome is about: "Evan Elder", "Evan Elder by KO/TKO", "Elder to Win in Round 1" (books spell names differently) */
function ufWho(f,name){const n=ufNorm(String(name||"").replace(/\s+(by|to|in|wins?)\b.*$/i,"")),full=ufNorm(name);if(!n)return -1;
  let i=f.c.findIndex(c=>{const c1=ufNorm(c[1]);return c1===n||c1.endsWith(n)||n.endsWith(c1)});if(i>=0)return i;
  i=f.c.findIndex(c=>{const l=ufNorm(ufLast(c[1]));return l.length>=3&&(n.endsWith(l)||full.includes(ufNorm(c[1])))});return i}
function ufML(f){const O=ufOddsOf(f);if(!O)return null;const ml=[null,null];for(const [k,n,,,p,bk] of O.o)if(k==="h2h"){const i=ufWho(f,n);if(i>=0)ml[i]=[p,bk]}
  if(!ml[0]||!ml[1])return null;const ia=ufImp(ml[0][0]),ib=ufImp(ml[1][0]);return {ml,p:[ia/(ia+ib),ib/(ia+ib)],vig:ia+ib-1}}

/* ---------- our estimates: the market's win chance × how each fighter wins / loses (last 10 fights, smoothed) ---------- */
let UF_K0=null;function ufKo0(){if(UF_K0)return UF_K0;let k=0,t=0;for(const F of Object.values(window.UFC_F||{})){const r=F.R||{};k+=r.tkos||0;t+=(r.tkos||0)+(r.submissions||0)}UF_K0=t>50?k/t:.6;return UF_K0}
function ufEst(f){const M=ufML(f);if(!M)return null;const A=ufStats(f.c[0][0]),B=ufStats(f.c[1][0]);if(!A||!B)return null;
  /* career numbers (ESPN record: KO/TKO and submission wins and losses, the rest decisions); last-10 fights when there is no career split */
  const car=X=>X.C?X.C:{w:X.w,l:X.l,KO:X.wKO,SUB:X.wSUB,DEC:X.wDEC,lKO:X.lKO,lSUB:X.lSUB,lDEC:X.lDEC};const a=car(A),b=car(B);
  const lg=p=>Math.log(p/(1-p)),sg=x=>1/(1+Math.exp(-x)),mix=(p,q)=>sg((lg(p)+lg(q))/2);   /* average on the log-odds scale: one fighter who never goes the distance pulls hard */
  /* 1) does it go the distance? each fighter's share of fights that went to the judges, combined */
  const dr=X=>(X.DEC+X.lDEC+1)/(X.w+X.l+2),dist=mix(dr(a),dr(b));
  /* 2) if a fighter finishes it, KO or submission: how he finishes people, combined with how the other one gets finished */
  /* small records lean on the KO share of finishes across every fighter we have (ESPN careers), not on 50/50 */
  const k0=ufKo0(),ko=(X,Y)=>mix((X.KO+4*k0)/(X.KO+X.SUB+4),(Y.lKO+4*k0)/(Y.lKO+Y.lSUB+4));
  const p=M.p,est={win:p,dist,by:[0,1].map(i=>{const pd=dist*p[i],pf=Math.max(0,p[i]-pd),k=i?ko(b,a):ko(a,b);return {DEC:pd,KO:pf*k,SUB:pf*(1-k)}})};
  est.n=Math.min(A.n,B.n);
  /* 3) fight length: a steady finishing rate, set so the chance of reaching the final bell equals the distance estimate */
  const rd=f.rd||3,T=rd*300,lam=-Math.log(Math.max(.02,Math.min(.98,est.dist)))/T;
  est.after=x=>x*300>=T?0:Math.exp(-lam*x*300);
  const fa=est.by[0].KO+est.by[0].SUB,fb=est.by[1].KO+est.by[1].SUB,fs=fa+fb||1;
  est.inRound=(who,r)=>{if(r<1||r>rd)return null;const pr=Math.exp(-lam*(r-1)*300)-Math.exp(-lam*r*300);return pr*((who?fb:fa)/fs)};return est}

/* parse one PropLine outcome into something we can estimate + grade */
function ufParse(f,o){const [k,n,d,pt]=o,txt=(n+" "+d).toLowerCase();const who=ufWho(f,d||n)>=0?ufWho(f,d||n):ufWho(f,n);
  const m=/ko|tko|knockout/.test(txt)?"KO":/sub/.test(txt)?"SUB":/decision|points/.test(txt)?"DEC":null;
  if(k==="h2h")return who>=0?{t:"ml",who}:null;
  if(k==="fight_outcome"||k==="player_knockout_win"||k==="player_submission_win"||k==="player_finish"){const mm=k==="player_knockout_win"?"KO":k==="player_submission_win"?"SUB":k==="player_finish"?"FIN":m;
    if(who>=0&&mm&&!/^no\b|not\b/.test(n.toLowerCase()))return {t:"meth",who,m:mm};if(/draw/.test(txt))return {t:"draw"};return null}
  if(k==="fight_distance"){if(/yes|goes|distance/.test(n.toLowerCase())&&!/no|not|doesn/.test(n.toLowerCase()))return {t:"dist",y:1};if(/no|not|doesn|inside/.test(n.toLowerCase()))return {t:"dist",y:0};return null}
  if(k==="total_rounds"&&pt!=null){return {t:"rds",over:/over/i.test(n),x:+pt}}
  if(k==="round_betting"){if(who<0)return null;const r=/round\s*(\d)/i.exec(n);if(r)return {t:"rnd",who,r:+r[1]};if(m==="DEC")return {t:"meth",who,m:"DEC"};return null}
  return null}
function ufEstOf(f,P,E){if(!P||!E)return null;if(P.t==="ml")return E.win[P.who];if(P.t==="meth"){const b=E.by[P.who];return P.m==="FIN"?b.KO+b.SUB:b[P.m]}
  if(P.t==="dist")return P.y?E.dist:1-E.dist;if(P.t==="rnd")return E.inRound(P.who,P.r);if(P.t==="rds"){const a=E.after(P.x);return a==null?null:P.over?a:1-a}return null}
const UF_MK={h2h:"Moneyline",fight_outcome:"Method of victory",fight_distance:"Goes the distance",total_rounds:"Total rounds",round_betting:"Round betting",player_finish:"Wins inside the distance",
  player_knockout_win:"Wins by KO/TKO",player_submission_win:"Wins by submission",player_significant_strikes:"Significant strikes",player_takedowns:"Takedowns",fight_time_minutes:"Fight time (minutes)"};
function ufOLabel(f,o){const [k,n,d,pt]=o;const nm=d&&!/^(over|under|yes|no)$/i.test(d)?d:"";return `${ufE(n)}${nm&&nm!==n?` <span class="small">${ufE(nm)}</span>`:""}${pt!=null&&!String(n).includes(String(pt))?" "+pt:""}`}
function ufSpec(f,o){const [k,n,d,pt,pr,bk]=o,P=ufParse(f,o);return {k:"ufc",fid:String(f.id),ev:f.ev.id,market:k,sel:[n,d,pt],label:`${n}${d&&!/^(over|under|yes|no)$/i.test(d)&&d!==n?" ("+d+")":""}${pt!=null&&!String(n).includes(String(pt))?" "+pt:""} · ${ufLast(f.c[0][1])} vs ${ufLast(f.c[1][1])}`,odds:pr,book:bk,date:(f.t||f.ev.d||"").slice(0,10),p:P}}
/* value list across a card: our estimate vs the price */
function ufValues(fights){const out=[];for(const f of fights){if(f.st==="post")continue;const O=ufOddsOf(f),E=ufEst(f);if(!O||!E)continue;
    for(const o of O.o){const P=ufParse(f,o),e=ufEstOf(f,P,E);if(e==null)continue;const need=ufImp(o[4]);if(need==null||need<.08)continue;out.push({f,o,e,need,edge:e-need})}}
  return out.sort((a,b)=>b.edge-a.edge)}

/* ---------- pages ---------- */
function ufHead(sub){return `<h1>🥊 UFC</h1>${sub?`<p class="sub">${sub}</p>`:""}`}
function ufBadge(aid,big){const F=(window.UFC_F||{})[aid]||{};return `<span class="ufbd${big?" big":""}">${ufE((F.n||"?").split(" ").map(w=>w[0]).slice(0,2).join(""))}</span>`}
function ufFightRow(f){const M=ufML(f),[a,b]=f.c,won=i=>f.st==="post"&&f.c[i]&&f.c[i][3];
  const side=(c,i)=>`<div class="ufside${won(i)?" won":""}"><a href="#ufc-fighter-${c[0]}" onclick="event.stopPropagation()"><b>${ufE(c[1])}</b></a><span class="small">${ufE(c[2])}${c[4]?" · "+ufE(c[4]):""}</span>${ufRankHtml(c[0])}${M?`<span class="ufml">${ufAm(M.ml[i][0])} <small>${ufPct(M.p[i])}</small></span>`:""}</div>`;
  return `<div class="card ufrow" data-ufgo="#ufc-fight-${f.id}" role="link" tabindex="0"><div class="small ufwc">${f.ti?`<span class="uftitle">🏆 Title</span> `:""}${(()=>{const U=ufUpset(f);return U?`<span class="ufup">🐶 Upset watch: ${ufE(ufLast(f.c[U.who][1]))}</span> `:""})()}${ufE(f.wc)}${f.rd===5?" · 5 rounds":""}${f.st==="post"&&f.m?` · <b>${ufE(f.m)}</b> R${f.r} ${ufE(f.clk||"")}`:f.st==="in"?" · <b class='dn'>LIVE</b>":""}</div>
   <div class="ufpair">${side(a,0)}<span class="ufvs">vs</span>${b?side(b,1):""}</div>${M?`<div class="nbwp" style="margin-top:6px"><div style="width:${Math.round(M.p[0]*100)}%;background:#d33f49"></div><div style="width:${100-Math.round(M.p[0]*100)}%;background:#3987e5"></div></div>`:""}<div class="small ufmore">Odds, tale of the tape &amp; our estimates →</div></div>`}
function ufCard(el,ev){const up=ufUpcoming(),e=ev||up[0];if(!e){el.innerHTML=ufHead("No upcoming UFC cards in the feed yet.")+`<a class="btn" href="#ufc-results">📅 Recent results</a>`;return}
  const FF=e.f.map(f=>Object.assign({ev:e},f)),V=ufValues(FF).filter(x=>x.edge>=.05&&ufEst(x.f).n>=4).slice(0,5);
  el.innerHTML=`${ufHead(`${ufE(e.n)} · ${ufDate(e.d)} · ${ufTime(e.d)}${e.ven?" · "+ufE(e.ven):""}${e.city?", "+ufE(e.city):""}`)}
   ${up.length>1?`<div class="ufevs">${up.map(x=>`<a class="fxp${x.id===e.id?" on":""}" href="#ufc-event-${x.id}">${ufE(x.n.replace(/^UFC Fight Night:?\s*/,"FN: ").replace(/^Dana White's Contender Series:?\s*/,"DWCS "))} · ${ufDate(x.d).replace(/^\w+, /,"")}</a>`).join("")}</div>`:""}
   ${V.length?`<div class="card"><h2>⭐ Best value on this card</h2><div class="small" style="margin-bottom:6px">Where our estimate (the moneyline's win chance × how each fighter wins, loses and how often his fights go the distance, over his career) beats the price by 5+ points.</div>${V.map(ufValRow).join("")}</div>`:""}
   ${Math.abs(Date.parse(e.d)-Date.now())<30*3600e3?`<a class="btn" href="#ufc-live" style="margin:6px 0">🔴 Fight night live — results + your bets</a>`:""}
   ${(()=>{const U=FF.map(f=>[f,ufUpset(f)]).filter(x=>x[1]);return U.length?`<div class="card"><h2>🐶 Upset watch</h2><div class="small" style="margin-bottom:6px">Underdogs who are better on at least 4 of 6 key numbers (strikes landed and absorbed, accuracy, defense, takedowns, takedown defense).</div>${U.map(([f,u])=>`<div class="ufval"><a href="#ufc-fight-${f.id}"><b>${ufE(f.c[u.who][1])}</b> ${ufAm(u.ml)}</a><span class="small">vs ${ufE(f.c[1-u.who][1])} · better on ${u.n}/${u.of}</span><span class="small">${ufPct(u.p)} to win from the odds</span></div>`).join("")}</div>`:""})()}
   <h2 style="margin:14px 0 8px">Fight card <span class="small">· main event first · ${e.f.length} fights</span></h2>${FF.map(ufFightRow).join("")}
   <p class="note">Records and fight stats: ESPN. Odds: licensed US sportsbooks (best price across books). Lines, picks and estimates are research from past numbers — not guarantees. 21+.</p>`}
function ufValRow(x){const s=ufSpec(x.f,x.o);return `<div class="ufval"><a href="#ufc-fight-${x.f.id}"><b>${ufOLabel(x.f,x.o)}</b></a><span class="small">${ufE(UF_MK[x.o[0]]||x.o[0])} · ${ufE(ufLast(x.f.c[0][1]))} vs ${ufE(ufLast(x.f.c[1][1]))}</span>
  <span><b>${ufAm(x.o[4])}</b> <span class="small">${ufE(x.o[5])}</span> · ours <b class="up">${ufPct(x.e)}</b> vs needs ${ufPct(x.need)}</span>${typeof actBtn!=="undefined"?actBtn(s,"＋","ov"):""}</div>`}
function ufTape(f){const [a,b]=f.c,A=(window.UFC_F||{})[a[0]]||{},B=(window.UFC_F||{})[b[0]]||{},SA=ufStats(a[0])||{},SB=ufStats(b[0])||{};
  const row=(l,x,y,better)=>{const nx=parseFloat(x),ny=parseFloat(y),w=better&&isFinite(nx)&&isFinite(ny)&&nx!==ny?(better>0?(nx>ny?0:1):(nx<ny?0:1)):-1;return `<tr><td class="${w===0?"ufbt":""}">${x??"–"}</td><th>${l}</th><td class="${w===1?"ufbt":""}">${y??"–"}</td></tr>`};
  const f1=v=>v==null?"–":v.toFixed(1),f2=v=>v==null?"–":v.toFixed(2),pc=v=>v==null?"–":Math.round(v*100)+"%",ct=v=>v==null?"–":`${Math.floor(v/60)}:${String(Math.round(v%60)).padStart(2,"0")}`;
  const form=S=>(S.form||[]).map(r=>`<span class="ufr ${r}">${r}</span>`).join("")||"–";
  return `<div class="card"><h2>Tale of the tape</h2><div class="nbatbl"><table class="uftape"><thead><tr><th>${ufE(ufLast(a[1]))}</th><th></th><th>${ufE(ufLast(b[1]))}</th></tr></thead><tbody>
   ${row("Record",ufE(a[2]),ufE(b[2]))}${row("Last 5",form(SA),form(SB))}${row("Age",A.age,B.age,-1)}${row("Height",ufE(A.ht||"–"),ufE(B.ht||"–"))}${row("Reach",ufE(A.reach||"–"),ufE(B.reach||"–"))}${row("Stance",ufE(A.stance||"–"),ufE(B.stance||"–"))}${A.team||B.team?row("Team",ufE(A.team||"–"),ufE(B.team||"–")):""}
   ${row("Sig. strikes landed / min",f2(SA.slpm),f2(SB.slpm),1)}${row("Sig. strikes absorbed / min",f2(SA.sapm),f2(SB.sapm),-1)}${row("Striking accuracy",pc(SA.acc),pc(SB.acc),1)}${row("Striking defense",pc(SA.def),pc(SB.def),1)}
   ${row("Takedowns / 15 min",f2(SA.td15),f2(SB.td15),1)}${row("Takedown accuracy",pc(SA.tdacc),pc(SB.tdacc),1)}${row("Takedown defense",pc(SA.tddef),pc(SB.tddef),1)}${row("Knockdowns / 15 min",f2(SA.kd15),f2(SB.kd15),1)}${row("Sub attempts / 15 min",f2(SA.sub15),f2(SB.sub15),1)}
   ${row("Control time / fight",ct(SA.ctrl),ct(SB.ctrl),1)}${row("Avg fight time",ct(SA.avgT),ct(SB.avgT))}${row("Finish rate (of wins)",pc(SA.fin),pc(SB.fin))}${row("Fights to decision",pc(SA.dist),pc(SB.dist))}
   </tbody></table></div><div class="small">Per-minute numbers from their last ${Math.min(SA.statN||0,10)} / ${Math.min(SB.statN||0,10)} fights with stats (ESPN). Bold = the better side.</div></div>`}
/* ESPN-style matchup: both fighters side by side, bars growing out from the middle (career record split) */
function ufMethods(f){const S=f.c.map(c=>ufStats(c[0])||{}),C=S.map(x=>x.C||{w:x.w||0,l:x.l||0,KO:x.wKO||0,SUB:x.wSUB||0,DEC:x.wDEC||0,lKO:x.lKO||0,lSUB:x.lSUB||0,lDEC:x.lDEC||0}),car=!!(S[0].C&&S[1].C);
  const row=(lab,k,tot)=>{const v=[C[0][k],C[1][k]],t=[C[0][tot],C[1][tot]],pc=v.map((x,i)=>t[i]?x/t[i]:0),mx=Math.max(.0001,...pc),bt=pc[0]===pc[1]?-1:pc[0]>pc[1]?0:1;
    return `<div class="ufmx"><div class="l"><span>${v[0]} <small>${Math.round(pc[0]*100)}%</small></span><i style="width:${pc[0]/mx*100}%" class="${bt===0?"on":""}"></i></div><b>${lab}</b><div class="r"><i style="width:${pc[1]/mx*100}%" class="${bt===1?"on":""}"></i><span>${v[1]} <small>${Math.round(pc[1]*100)}%</small></span></div></div>`};
  return `<div class="card"><h2>How they win and lose <span class="small">· ${car?"whole pro career":"last 10 fights"}</span></h2>
   <div class="ufmh"><span><b>${ufE(ufLast(f.c[0][1]))}</b><small>${C[0].w}-${C[0].l}</small></span><span></span><span><b>${ufE(ufLast(f.c[1][1]))}</b><small>${C[1].w}-${C[1].l}</small></span></div>
   <div class="ufms">Wins</div>${row("KO/TKO","KO","w")}${row("Submission","SUB","w")}${row("Decision","DEC","w")}
   <div class="ufms">Losses</div>${row("KO/TKO","lKO","l")}${row("Submission","lSUB","l")}${row("Decision","lDEC","l")}
   <div class="small" style="margin-top:6px">Count and share of each fighter's wins (or losses). The longer bar is highlighted.</div></div>`}
function ufLength(f){const S=f.c.map(c=>ufStats(c[0])||{secs:[]}),rd=f.rd||3,bins=x=>{const b=Array(rd+1).fill(0);for(const s of x){const r=Math.min(rd,Math.floor((s-1)/300)+1);if(s>=rd*300-1)b[rd]++;else b[r-1]++}return b};
  const B=f.c.map((c,i)=>bins(S[i].secs||[])),mx=Math.max(1,...B.flat());if(!B.some(b=>b.some(Boolean)))return "";
  return `<div class="card"><h2>When their fights end</h2>${f.c.map((c,i)=>`<div class="small" style="margin-top:8px"><b>${ufE(ufLast(c[1]))}</b> · last ${S[i].secs.length} fights</div><div class="ufrd">${B[i].map((v,j)=>`<div><i style="height:${Math.max(3,v/mx*60)}px"></i><b>${v}</b><span class="small">${j<rd?"R"+(j+1):"Dist."}</span></div>`).join("")}</div>`).join("")}
   <div class="small">Round each of their fights ended (a 3-round fight that went the full 15 minutes counts as "Dist.").</div></div>`}
function ufOddsBoard(f){const O=ufOddsOf(f);if(!O)return `<div class="card small">No sportsbook odds posted for this fight yet — books usually post a week out.</div>`;const E=ufEst(f);
  const cell=o=>{if(!o)return `<td class="small">–</td>`;const e=ufEstOf(f,ufParse(f,o),E),nd=ufImp(o[4]),ed=e!=null?e-nd:null,cl=ed!=null&&ed>=.05&&E&&E.n>=4?"up":ed!=null&&ed<=-.08?"dn":"";
    return `<td><b>${ufAm(o[4])}</b>${e!=null?`<div class="small ${cl}">ours ${ufPct(e)}</div>`:""}${typeof actBtn!=="undefined"?actBtn(ufSpec(f,o),"＋","ov"):""}</td>`};
  const find=(k,fn)=>O.o.find(o=>o[0]===k&&fn(ufParse(f,o)||{},o));
  /* method grid: fighter × KO / Sub / Decision */
  const meth=f.c.map((c,i)=>["KO","SUB","DEC"].map(m=>find("fight_outcome",P=>P.t==="meth"&&P.who===i&&P.m===m)||find("round_betting",P=>P.t==="meth"&&P.who===i&&P.m===m)));
  const ml=f.c.map((c,i)=>find("h2h",P=>P.t==="ml"&&P.who===i));
  const dist=[find("fight_distance",P=>P.t==="dist"&&P.y===1),find("fight_distance",P=>P.t==="dist"&&P.y===0)];
  /* total rounds: the line priced closest to even */
  const RL=[...new Set(O.o.filter(o=>o[0]==="total_rounds"&&o[3]!=null).map(o=>o[3]))].map(x=>{const ov=find("total_rounds",P=>P.t==="rds"&&P.over&&P.x===x),un=find("total_rounds",P=>P.t==="rds"&&!P.over&&P.x===x);return {x,ov,un,gap:ov&&un?Math.abs(ufImp(ov[4])-ufImp(un[4])):9}}).sort((a,b)=>a.gap-b.gap);
  const main=RL[0],rest=O.o.filter(o=>!["h2h","fight_outcome","fight_distance"].includes(o[0])&&!(o[0]==="total_rounds"&&main&&o[3]===main.x)&&!(o[0]==="round_betting"&&ufParse(f,o)&&ufParse(f,o).t==="meth"));
  const G={};for(const o of rest)(G[o[0]]=G[o[0]]||[]).push(o);
  return `<div class="card"><h2>Odds &amp; our estimates</h2><div class="small" style="margin-bottom:8px">Best price across licensed US books · <span class="up">green</span> = our estimate beats what the price needs by 5+ points · ＋ to track or add to a parlay.</div>
   <div class="nbatbl"><table class="bxt ufog"><thead><tr><th></th><th>Win</th><th>KO/TKO</th><th>Sub</th><th>Decision</th></tr></thead><tbody>${f.c.map((c,i)=>`<tr><th>${ufE(ufLast(c[1]))}</th>${cell(ml[i])}${meth[i].map(cell).join("")}</tr>`).join("")}</tbody></table></div>
   <div class="nbatbl"><table class="bxt ufog"><thead><tr><th></th><th>Yes</th><th>No</th></tr></thead><tbody><tr><th>Goes the distance</th>${cell(dist[0])}${cell(dist[1])}</tr>${main?`<tr><th>Rounds ${main.x}</th>${cell(main.ov)}${cell(main.un)}</tr>`:""}</tbody></table>${main?`<div class="small">Rounds row: <b>Yes</b> = over ${main.x}, <b>No</b> = under.</div>`:""}</div>
   ${Object.keys(G).length?`<details class="ufmore2"><summary>More markets (${rest.length}) — round betting, other round lines${G.player_significant_strikes||G.player_takedowns?", strikes, takedowns":""}</summary>
    ${Object.entries(G).map(([k,L])=>`<h3 style="margin:10px 0 4px">${ufE(UF_MK[k]||k)}</h3><div class="nbatbl"><table class="bxt ufot"><tbody>${L.map(o=>{const e=ufEstOf(f,ufParse(f,o),E),nd=ufImp(o[4]),ed=e!=null?e-nd:null;
      return `<tr><td>${ufOLabel(f,o)}</td><td><b>${ufAm(o[4])}</b> <span class="small">${ufE(o[5])}</span></td><td class="${ed!=null&&ed>=.05&&E&&E.n>=4?"up":ed!=null&&ed<=-.08?"dn":""}">${e!=null?"ours "+ufPct(e):""}</td><td>${typeof actBtn!=="undefined"?actBtn(ufSpec(f,o),"＋","ov"):""}</td></tr>`}).join("")}</tbody></table></div>`).join("")}</details>`:""}
   <div class="small" style="margin-top:6px">Ours = the odds' win chance × each fighter's career: how he wins, how he loses, and how often his fights go the distance. Odds updated ${ufE((LO.data.ufc.at||"").slice(11,16))} UTC.</div></div>`}
/* our prediction: winner, most likely way it ends, and the best-priced bet in this fight */
function ufPredict(f){if(f.st==="post")return "";const E=ufEst(f);if(!E)return "";const w=E.win[0]>=E.win[1]?0:1,b=E.by[w],m=["KO","SUB","DEC"].sort((x,y)=>b[y]-b[x])[0],ML={KO:"KO/TKO",SUB:"submission",DEC:"decision"};
  const rd=f.rd||3,rds=Array.from({length:rd},(_,r)=>[r+1,E.inRound(w,r+1)]).sort((x,y)=>y[1]-x[1]),fin=b.KO+b.SUB;
  const how=m==="DEC"?`by decision`:`by ${ML[m]}, most likely in round ${rds[0][0]}`;
  const V=ufValues([f]).filter(x=>x.edge>=.04&&x.need>=.2&&E.n>=4)[0],A=ufStats(f.c[0][0])||{},B=ufStats(f.c[1][0])||{};
  const keys=[];const cmp=(lab,x,y,dec,hi)=>{if(x==null||y==null)return;const d=x-y;if(Math.abs(d)<(dec||0))return;const bw=(hi?d>0:d<0)?0:1;keys.push(`${ufE(ufLast(f.c[bw][1]))} ${lab} (${(bw?y:x).toFixed(lab.includes("%")?0:1)} vs ${(bw?x:y).toFixed(lab.includes("%")?0:1)})`)};
  cmp("lands more significant strikes per minute",A.slpm,B.slpm,1,1);cmp("absorbs fewer strikes per minute",A.sapm,B.sapm,1,0);cmp("lands more takedowns per 15 min",A.td15,B.td15,.8,1);cmp("knocks people down more (per 15 min)",A.kd15,B.kd15,.3,1);
  const conf=Math.abs(E.win[0]-E.win[1]),cf=conf>=.4?"Strong":conf>=.2?"Medium":"Lean";
  return `<div class="card ufpred"><h2>🔮 Our prediction</h2><div class="ufpw"><b>${ufE(f.c[w][1])}</b> ${how}</div>
   <div class="ufpb"><div><span class="small">Win chance</span><b>${ufPct(E.win[w])}</b></div><div><span class="small">By ${ML[m]}</span><b>${ufPct(b[m])}</b></div><div><span class="small">Goes the distance</span><b>${ufPct(E.dist)}</b></div><div><span class="small">Confidence</span><b>${cf}</b></div></div>
   ${keys.length?`<ul class="small ufkeys">${keys.slice(0,3).map(k=>`<li>${k}</li>`).join("")}</ul>`:""}
   ${(()=>{const U=ufUpset(f);return U?`<div class="ufpv">🐶 <b>Upset watch:</b> ${ufE(ufLast(f.c[U.who][1]))} (${ufAm(U.ml)}) is better on ${U.n} of ${U.of} key numbers — ${U.what.join(", ")}.</div>`:""})()}
   ${V?`<div class="ufpv">⭐ Best value (no long shots): <b>${ufOLabel(f,V.o)}</b> ${ufAm(V.o[4])} <span class="small">(${ufE(UF_MK[V.o[0]]||V.o[0])}) · ours ${ufPct(V.e)} vs needs ${ufPct(V.need)}</span>${typeof actBtn!=="undefined"?actBtn(ufSpec(f,V.o),"＋","ov"):""}</div>`:""}
   <div class="small">From the odds' win chance and both fighters' careers (method of wins and losses, how often they go the distance). Research, not a guarantee.</div></div>`}
function ufFightPage(el,id){const f=ufFight(id);if(!f){el.innerHTML=ufHead("Fight not found.")+`<a href="#ufc">← UFC</a>`;return}const M=ufML(f),[a,b]=f.c;
  el.innerHTML=`<p><a href="#ufc-event-${f.ev.id}">← ${ufE(f.ev.n)}</a></p>
   <div class="card ufhero">${f.ti?`<div class="uftitle">🏆 ${ufE(f.ti)}</div>`:""}<div class="row" style="align-items:center;gap:6px"><span class="small">${ufE(f.wc)} · ${f.rd} rounds · ${ufDate(f.t||f.ev.d)}</span><span class="sp"></span><button class="obtn snapb" data-snap="ufc|${f.id}|">📸 Snapshot</button></div>
    <div class="ufpair big">${f.c.map((c,i)=>`<div class="ufside${f.st==="post"&&c[3]?" won":""}"><a href="#ufc-fighter-${c[0]}"><b>${ufE(c[1])}</b></a><span class="small">${ufE(((window.UFC_F||{})[c[0]]||{}).nick||"")}</span><span class="small">${ufE(c[2])}${c[4]?" · "+ufE(c[4]):""}</span>${ufRankHtml(c[0])}${M?`<span class="ufml">${ufAm(M.ml[i][0])} <small>${ufPct(M.p[i])} to win</small></span>`:""}${ufTagHtml(c[0])}</div>${i===0?`<span class="ufvs">vs</span>`:""}`).join("")}</div>
    ${f.st==="post"?`<div class="nbsay">🏁 ${ufE(f.c.find(c=>c[3])?f.c.find(c=>c[3])[1]+" wins":"Result")}${f.m?` · ${ufE(f.m)}${f.md?" ("+ufE(f.md)+")":""} · R${f.r} ${ufE(f.clk||"")}`:""}</div>`:M?`<div class="nbwp" style="margin-top:8px"><div style="width:${Math.round(M.p[0]*100)}%;background:#d33f49"></div><div style="width:${100-Math.round(M.p[0]*100)}%;background:#3987e5"></div></div><div class="small" style="text-align:center">win chance from the odds (vig removed)</div>`:""}</div>
   ${ufTape(f)}${ufFlags(f)}${ufPredict(f)}${ufMethods(f)}${ufStrikes(f)}${ufOddsBoard(f)}${ufCommon(f)}${ufLength(f)}${ufTrendCard(f)}
   <div class="grid g2">${f.c.map(c=>`<div class="card"><h2>${ufE(c[1])} · last fights</h2>${ufHist(c[0],5)}<a class="small" href="#ufc-fighter-${c[0]}">All his fights →</a></div>`).join("")}</div>`}
function ufHist(aid,n){const F=(window.UFC_F||{})[aid];if(!F||!F.h.length)return `<div class="small">No UFC fights on file.</div>`;
  return `<div class="nbatbl"><table class="bxt ufh"><thead><tr><th>Date</th><th>Opponent</th><th></th><th>Method</th><th>Time</th><th>Sig. str</th><th>TD</th><th>KD</th><th>Ctrl</th></tr></thead><tbody>${F.h.slice(0,n||10).map(r=>`<tr><td>${ufE((r[0]||"").slice(2).replace(/-/g,"/"))}</td><td><a href="#ufc-fighter-${r[1]}">${ufE(r[2])}</a></td><td><span class="ufr ${r[3]}">${r[3]}</span></td><td>${ufE(r[4])}<div class="small">${ufE(r[5]||"")}</div></td><td>R${r[6]||"?"} ${ufE(r[7])}</td><td>${r[10]!=null?`${r[10]}/${r[11]}`:"–"}<div class="small">${r[12]!=null?`took ${r[12]}`:""}</div></td><td>${r[14]!=null?`${r[14]}/${r[15]}`:"–"}</td><td>${r[18]!=null?r[18]:"–"}</td><td>${r[19]!=null?`${Math.floor(r[19]/60)}:${String(Math.round(r[19]%60)).padStart(2,"0")}`:"–"}</td></tr>`).join("")}</tbody></table></div>`}
function ufFighterPage(el,aid){const F=(window.UFC_F||{})[aid];if(!F){el.innerHTML=ufHead("Fighter not found.")+`<a href="#ufc">← UFC</a>`;return}const S=ufStats(aid)||{},R=F.R||{};
  const next=ufFights().find(f=>f.st!=="post"&&f.c.some(c=>c[0]===aid));
  const f2=v=>v==null?"–":v.toFixed(2),f1=v=>v==null?"–":v.toFixed(1),pc=v=>v==null?"–":Math.round(v*100)+"%",ct=v=>v==null?"–":`${Math.floor(v/60)}:${String(Math.round(v%60)).padStart(2,"0")}`;
  /* per-fight averages over his fights with stats (like an NBA player's points / rebounds a game) */
  const H=(F.h||[]).filter(r=>r[10]!=null),n=H.length,av=i=>n?H.reduce((s,r)=>s+(+r[i]||0),0)/n:null;
  const C=S.C||{w:S.w||0,l:S.l||0,KO:S.wKO||0,SUB:S.wSUB||0,DEC:S.wDEC||0,lKO:S.lKO||0,lSUB:S.lSUB||0,lDEC:S.lDEC||0};
  const bar=(lab,v,t,col)=>{const p=t?v/t:0;return `<div class="ufwl"><span>${lab}</span><div><i style="width:${Math.max(p*100,v?3:0)}%;background:${col}"></i></div><b>${v} <small>${t?Math.round(p*100)+"%":""}</small></b></div>`};
  el.innerHTML=`<p><a href="javascript:history.back()">← Back</a></p><div class="phead tch" style="--tc:#d33f49"><div><h1>${ufE(F.n)}</h1><p class="sub">${F.nick?`“${ufE(F.nick)}” · `:""}${ufE(R.rec||"")}${F.wc?" · "+ufE(F.wc):""}${F.ctry?" · "+ufE(F.ctry):""}</p>${ufRankHtml(aid)}${ufTagHtml(aid)}</div></div>
   <div class="pline">${[F.age?F.age+" yrs":"",F.ht,F.reach?F.reach+" reach":"",F.stance,F.team].filter(Boolean).map(x=>`<span>${ufE(x)}</span>`).join("")}</div>
   ${next?`<a class="card ufnext" style="display:block" href="#ufc-fight-${next.id}">🥊 Next: vs <b>${ufE(next.c.find(c=>c[0]!==aid)[1])}</b> · ${ufE(next.ev.n)} · ${ufDate(next.t||next.ev.d)} →</a>`:""}
   <div class="pbio ufpb2" style="margin-top:10px"><div><b>${ufE(R.rec||`${C.w}-${C.l}`)}</b>Pro record</div><div><b>${f1(av(10))}</b>Sig. strikes landed / fight</div><div><b>${f1(av(12))}</b>Sig. strikes absorbed / fight</div>
    <div><b>${f2(S.slpm)}</b>Landed / min</div><div><b>${f2(S.sapm)}</b>Absorbed / min</div><div><b>${pc(S.acc)}</b>Striking accuracy</div><div><b>${pc(S.def)}</b>Striking defense</div>
    <div><b>${f1(av(14))}</b>Takedowns / fight</div><div><b>${pc(S.tdacc)}</b>Takedown accuracy</div><div><b>${pc(S.tddef)}</b>Takedown defense</div><div><b>${f1(av(18))}</b>Knockdowns / fight</div>
    <div><b>${f1(av(20))}</b>Sub attempts / fight</div><div><b>${ct(S.ctrl)}</b>Control time / fight</div><div><b>${ct(S.avgT)}</b>Avg fight time</div></div>
   <div class="small" style="margin:4px 0 0">Averages over his last ${n} fights with stats (ESPN).</div>
   <div class="card" style="margin-top:12px"><h2>How he wins and loses <span class="small">· ${S.C?"whole pro career":"last 10 fights"}</span></h2>
    <div class="ufms" style="text-align:left">Wins · ${C.w}</div>${bar("KO/TKO",C.KO,C.w,"#3fb26b")}${bar("Submission",C.SUB,C.w,"#3fb26b")}${bar("Decision",C.DEC,C.w,"#3fb26b")}
    <div class="ufms" style="text-align:left">Losses · ${C.l}</div>${bar("KO/TKO",C.lKO,C.l,"#e5534b")}${bar("Submission",C.lSUB,C.l,"#e5534b")}${bar("Decision",C.lDEC,C.l,"#e5534b")}
    ${(()=>{const W=(F.h||[]).filter(r=>r[3]==="W"||r[3]==="L");if(!W.length)return "";const by=(x,m)=>W.filter(r=>r[3]===x&&r[4]===m);
      const rd=x=>{const a=W.filter(r=>r[3]===x&&r[4]!=="DEC"&&r[6]);return a.length?`, usually in round ${Math.round(a.reduce((s,r)=>s+(+r[6]),0)/a.length)}`:""};
      return `<div class="small" style="margin-top:6px">Last ${W.length} fights: won ${by("W","KO").length} by KO, ${by("W","SUB").length} by submission, ${by("W","DEC").length} on the cards${rd("W")}. Lost ${by("L","KO").length} by KO, ${by("L","SUB").length} by submission, ${by("L","DEC").length} on the cards.</div>`})()}</div>
   <div class="card"><h2>Form trend <span class="small">· sig. strikes per minute</span></h2>${ufTrend(aid)}</div>
   <div class="card"><h2>Where he lands and gets hit</h2><div class="ufb2">${(()=>{const X=ufSplit(aid)||{};return ufBody(X.land,"#d33f49","Lands")+ufBody(X.hit,"#8a8f98","Gets hit")})()}</div></div>
   <div class="card"><h2>Fight by fight</h2>${ufHist(aid,10)}</div>`}
function ufResults(el){const P=ufPast();el.innerHTML=ufHead("Recent cards and results")+(P.map(e=>`<h2 class="tsh">${ufE(e.n)} <span class="small">· ${ufDate(e.d)}</span></h2>${e.f.map(ufFightRow).join("")}`).join("")||`<div class="card small">No results yet.</div>`)}
function ufProps(el){const up=ufUpcoming(),fights=up.flatMap(e=>e.f.map(f=>Object.assign({ev:e},f)));const V=ufValues(fights);
  el.innerHTML=ufHead("Every priced bet on the upcoming cards, ranked by our estimate vs the price")+(V.length?`<div class="card">${V.slice(0,60).map(ufValRow).join("")}</div><p class="note">Estimates need both fighters to have 4+ UFC fights on file; fighters new to the UFC are left out of the top of this list.</p>`:`<div class="card small">No odds posted for the upcoming cards yet — books usually post about a week before.</div>`)}
function ufcRoute(h){const el=document.getElementById("v-ufc");if(!el)return;
  if(!(typeof LO!=="undefined"&&LO.data)&&!UFC.loWait){UFC.loWait=1;let n=0;const t=setInterval(()=>{n++;if(typeof LO!=="undefined"&&LO.data){clearInterval(t);const hh=(location.hash||"").slice(1);if(hh.startsWith("ufc")){const y=scrollY;ufcRoute(hh);scrollTo(0,y)}}else if(n>20)clearInterval(t)},500)}
  if(!window.UFC_OK){el.innerHTML=`<div class="small" style="padding:30px 0;text-align:center">Loading UFC…</div>`;ufcEnsure(()=>{if(!window.UFC_OK){el.innerHTML=`<div class="card">Couldn't load the UFC data — try again in a moment.</div>`;return}if((location.hash||"").slice(1).startsWith("ufc"))ufcRoute((location.hash||"").slice(1))});return}
  if(h.startsWith("ufc-fight-"))return ufFightPage(el,h.slice(10));if(h.startsWith("ufc-fighter-"))return ufFighterPage(el,h.slice(12));
  if(h.startsWith("ufc-event-"))return ufCard(el,(window.UFC_EV||[]).find(e=>e.id===h.slice(10)));if(h==="ufc-results")return ufResults(el);if(h==="ufc-live")return ufLive(el);if(h==="ufc-props")return ufProps(el);return ufCard(el)}
/* grading for My Bets (k:"ufc"): moneyline, method, inside the distance, distance yes/no, total rounds */
function ufGrade(b){if(!window.UFC_OK)return {r:"pending"};const f=ufFight(b.fid);if(!f||f.st!=="post")return {r:"pending"};const P=b.p,win=f.c.findIndex(c=>c[3]);if(!P)return {r:"pending",why:"Grade this one yourself"};
  const m=(f.m||"").toLowerCase(),M=/ko/.test(m)?"KO":/sub/.test(m)?"SUB":/dec/.test(m)?"DEC":/draw/.test(m)?"DRAW":/contest|nc/.test(m)?"NC":"";if(M==="NC")return {r:"void",why:"No contest"};
  const secs=(()=>{try{const [a,c]=(f.clk||"0:0").split(":");return ((+f.r||1)-1)*300+(+a)*60+(+c)}catch(e){return null}})();
  if(P.t==="ml")return win<0?{r:"push",why:"Draw"}:{r:win===P.who?"win":"loss",why:`${f.c[win][1]} won`};
  if(P.t==="meth")return {r:win===P.who&&(P.m==="FIN"?M==="KO"||M==="SUB":M===P.m)?"win":"loss",why:`${win>=0?f.c[win][1]:"Draw"} · ${f.m||""}`};
  if(P.t==="dist")return {r:(M==="DEC"||M==="DRAW")===!!P.y?"win":"loss",why:f.m||""};
  if(P.t==="rnd")return {r:win===P.who&&(M==="KO"||M==="SUB")&&+f.r===P.r?"win":"loss",why:`${win>=0?f.c[win][1]:"Draw"} · ${f.m||""} R${f.r}`};
  if(P.t==="rds"&&secs!=null){const t=P.x*300;return {r:secs===t?"push":(secs>t)===P.over?"win":"loss",why:`ended ${ufTime2(secs)}`}}
  return {r:"pending"}}

/* Today page: the next UFC card if it's within a week (main event + odds), loaded quietly */
function ufTodayCard(){const host=document.getElementById("ufcToday");if(!host)return;ufcEnsure(()=>{const e=ufUpcoming()[0];const h=document.getElementById("ufcToday");if(!h)return;
  if(!e||Date.parse(e.d)-Date.now()>7*864e5){h.innerHTML="";return}const FF=e.f.map(f=>Object.assign({ev:e},f)),main=FF[0],M=main&&ufML(main),V=ufValues(FF).filter(x=>x.edge>=.05&&ufEst(x.f).n>=4).slice(0,2);
  h.innerHTML=`<a class="card ufnext" href="#ufc-event-${e.id}" style="display:block"><div class="row" style="gap:8px;align-items:baseline"><b>🥊 ${ufE(e.n)}</b><span class="sp"></span><span class="small">${ufDate(e.d)} · ${ufTime(e.d)}</span></div>
   ${main?`<div class="small" style="margin-top:4px">Main event: <b>${ufE(main.c[0][1])}</b>${M?` ${ufAm(M.ml[0][0])}`:""} vs <b>${ufE(main.c[1][1])}</b>${M?` ${ufAm(M.ml[1][0])}`:""} · ${e.f.length} fights</div>`:""}
   ${V.length?`<div class="small" style="margin-top:4px">⭐ ${V.map(x=>`${ufOLabel(x.f,x.o)} ${ufAm(x.o[4])}`).join(" · ")}</div>`:""}</a>`})}
(function(){const go=()=>{if(((location.hash||"#today").slice(1)||"today")==="today")setTimeout(ufTodayCard,400)};window.addEventListener("hashchange",go);if(document.readyState!=="loading")go();else document.addEventListener("DOMContentLoaded",go)})();

document.addEventListener("click",e=>{const r=e.target.closest&&e.target.closest("[data-ufgo]");if(!r||e.target.closest("a,button"))return;location.hash=r.dataset.ufgo});

/* ================= UFC extras: strike map, positions, common opponents, style tags, form trend, watch-outs,
   upset watch, rankings / title fights, live fight night, snapshot ================= */
const UF_COL=["#d33f49","#3987e5"];
/* sums over his last 10 fights with stats: where he lands (head/body/leg, distance/clinch/ground) and where he gets hit */
function ufSplit(aid){const F=(window.UFC_F||{})[aid];if(!F)return null;const z=()=>[0,0,0],L=z(),A=z(),P=z(),Q=z();let n=0,na=0;
  for(const r of F.h||[]){const t=r[21],p=r[22];if(t&&t.some(v=>v!=null)){n++;t.forEach((v,i)=>L[i]+=+v||0);(p||[]).forEach((v,i)=>P[i]+=+v||0)}
    const ot=r[23],op=r[24];if(ot&&ot.some(v=>v!=null)){na++;ot.forEach((v,i)=>A[i]+=+v||0);(op||[]).forEach((v,i)=>Q[i]+=+v||0)}}
  const sh=a=>{const s=a[0]+a[1]+a[2];return s?a.map(v=>v/s):null};return {n,na,land:sh(L),hit:sh(A),pos:sh(P),posHit:sh(Q),landN:L,hitN:A}}
function ufBody(sh,col,lab){if(!sh)return `<div class="ufbody"><div class="small">${lab}</div><div class="small" style="padding:30px 0">No data</div></div>`;
  const mx=Math.max(...sh),f=v=>`fill:${col};fill-opacity:${(.15+.85*v/mx).toFixed(2)}`;
  return `<div class="ufbody"><div class="small"><b>${lab}</b></div><svg viewBox="0 0 120 170" role="img" aria-label="${lab}: head ${Math.round(sh[0]*100)}%, body ${Math.round(sh[1]*100)}%, legs ${Math.round(sh[2]*100)}%">
   <circle cx="40" cy="20" r="15" style="${f(sh[0])}"/><rect x="20" y="40" width="40" height="55" rx="9" style="${f(sh[1])}"/><rect x="8" y="42" width="9" height="48" rx="4" fill="#9aa3ae" fill-opacity=".25"/><rect x="63" y="42" width="9" height="48" rx="4" fill="#9aa3ae" fill-opacity=".25"/>
   <rect x="22" y="99" width="16" height="66" rx="6" style="${f(sh[2])}"/><rect x="42" y="99" width="16" height="66" rx="6" style="${f(sh[2])}"/>
   <g fill="currentColor" font-size="13" font-weight="700"><text x="80" y="25">${Math.round(sh[0]*100)}%</text><text x="80" y="72">${Math.round(sh[1]*100)}%</text><text x="80" y="135">${Math.round(sh[2]*100)}%</text></g>
   <g fill="currentColor" font-size="9" opacity=".7"><text x="80" y="37">head</text><text x="80" y="84">body</text><text x="80" y="147">legs</text></g></svg></div>`}
/* one ESPN-style mirrored row (bars grow out from the middle) */
function ufMir(lab,v,txt){const mx=Math.max(.0001,...v.map(x=>x||0)),bt=v[0]==null||v[1]==null||v[0]===v[1]?-1:v[0]>v[1]?0:1;
  return `<div class="ufmx"><div class="l"><span>${txt[0]}</span><i style="width:${(v[0]||0)/mx*100}%" class="${bt===0?"on":""}"></i></div><b>${lab}</b><div class="r"><i style="width:${(v[1]||0)/mx*100}%" class="${bt===1?"on":""}"></i><span>${txt[1]}</span></div></div>`}
function ufStrikes(f){const X=f.c.map(c=>ufSplit(c[0])||{}),S=f.c.map(c=>ufStats(c[0])||{}),nm=i=>ufE(ufLast(f.c[i][1]));if(!X[0].n&&!X[1].n)return "";
  const pc=v=>v==null?"–":Math.round(v*100)+"%",pos=i=>X[i].pos||[null,null,null];
  /* where it's likely to go */
  let say="";const td=S.map(s=>s.td15||0),tdd=S.map(s=>s.tddef);
  const w=td[0]>=td[1]?0:1,o=1-w;
  if(td[w]>=2&&(tdd[o]==null||tdd[o]<.7))say=`${nm(w)} should look to take it down: he lands ${td[w].toFixed(1)} takedowns per 15 min and ${nm(o)} stops ${pc(tdd[o])} of them.`;
  else if(td[0]<1&&td[1]<1)say=`Expect a stand-up fight: neither fighter wrestles much (${td[0].toFixed(1)} and ${td[1].toFixed(1)} takedowns per 15 min).`;
  else if(td[w]>=1)say=`${nm(w)} mixes in takedowns (${td[w].toFixed(1)} per 15 min); ${nm(o)} defends ${pc(tdd[o])}.`;
  return `<div class="card"><h2>Where they land and where they get hit</h2><div class="small" style="margin-bottom:6px">Significant strikes over their last ${X[0].n||0} / ${X[1].n||0} fights with stats (ESPN). Darker = more of his strikes.</div>
   <div class="ufbodies">${f.c.map((c,i)=>`<div><div class="ufbn" style="color:${UF_COL[i]}">${nm(i)}</div><div class="ufb2">${ufBody(X[i].land,UF_COL[i],"Lands")}${ufBody(X[i].hit,"#8a8f98","Gets hit")}</div></div>`).join("")}</div>
   <h3 style="margin:12px 0 4px">Where the fight happens <span class="small">· share of his landed strikes</span></h3>
   <div class="ufmh"><span><b>${nm(0)}</b></span><span></span><span><b>${nm(1)}</b></span></div>
   ${["Distance","Clinch","Ground"].map((l,k)=>ufMir(l,[pos(0)[k],pos(1)[k]],[pc(pos(0)[k]),pc(pos(1)[k])])).join("")}
   ${ufMir("Takedowns /15",[S[0].td15,S[1].td15],[S[0].td15!=null?S[0].td15.toFixed(1):"–",S[1].td15!=null?S[1].td15.toFixed(1):"–"])}
   ${ufMir("Control / fight",[S[0].ctrl,S[1].ctrl],[S[0].ctrl!=null?`${Math.floor(S[0].ctrl/60)}:${String(Math.round(S[0].ctrl%60)).padStart(2,"0")}`:"–",S[1].ctrl!=null?`${Math.floor(S[1].ctrl/60)}:${String(Math.round(S[1].ctrl%60)).padStart(2,"0")}`:"–"])}
   ${say?`<div class="nbsay" style="margin-top:8px">${say}</div>`:""}</div>`}
/* fighters both have faced (from each one's last 10 fights on file) */
function ufCommon(f){const H=f.c.map(c=>((window.UFC_F||{})[c[0]]||{}).h||[]);const ids=new Set(H[0].map(r=>r[1]));const com=[...new Set(H[1].map(r=>r[1]).filter(x=>x&&ids.has(x)))];
  const res=(i,o)=>H[i].filter(r=>r[1]===o).map(r=>`<span class="ufr ${r[3]}">${r[3]}</span> <span class="small">${ufE(r[4])}${r[6]?" R"+r[6]:""} · ${ufE((r[0]||"").slice(0,4))}</span>`).join("<br>");
  if(!com.length)return `<div class="card"><h2>Common opponents</h2><div class="small">None in their last ${Math.min(H[0].length,10)} / ${Math.min(H[1].length,10)} fights on file.</div></div>`;
  return `<div class="card"><h2>Common opponents <span class="small">· ${com.length}</span></h2><div class="nbatbl"><table class="bxt ufog"><thead><tr><th>Opponent</th><th>${ufE(ufLast(f.c[0][1]))}</th><th>${ufE(ufLast(f.c[1][1]))}</th></tr></thead><tbody>
   ${com.map(o=>`<tr><th><a href="#ufc-fighter-${o}">${ufE((H[0].find(r=>r[1]===o)||[])[2]||"?")}</a></th><td>${res(0,o)}</td><td>${res(1,o)}</td></tr>`).join("")}</tbody></table></div></div>`}
/* style tags from his numbers (green = strength, red = a hole to attack) */
function ufTags(aid){const S=ufStats(aid);if(!S||!S.n)return [];const C=S.C||{w:S.w,l:S.l,KO:S.wKO,SUB:S.wSUB,lKO:S.lKO},X=ufSplit(aid)||{},T=[],F=(window.UFC_F||{})[aid]||{};
  const oppTdA=(F.h||[]).reduce((s,r)=>s+(+r[17]||0),0);
  if(S.statN>=2){if(S.slpm>=5)T.push(["Volume striker",1]);else if(S.slpm>=3.5&&(S.td15||0)<1)T.push(["Striker",1]);
    if((S.td15||0)>=2.5)T.push(["Wrestler",1]);if(X.pos&&X.pos[2]>=.3)T.push(["Ground and pound",1]);
    if((S.kd15||0)>=.6||(C.w>=4&&C.KO/C.w>=.5))T.push(["KO power",1]);if((S.sub15||0)>=1||(C.w>=4&&C.SUB/C.w>=.35))T.push(["Submission threat",1]);
    if(S.sapm>=4.5)T.push(["Absorbs a lot",0]);if(S.tddef!=null&&S.tddef<.6&&oppTdA>=8)T.push(["Gets taken down",0])}
  if((F.h||[]).slice(0,3).some(r=>r[3]==="L"&&r[4]==="KO"))T.push(["KO'd recently",0]);
  if(C.w+C.l>=8&&C.l>=2&&C.lKO===0)T.push(["Never KO'd",1]);if(S.dist!=null&&S.n>=4&&S.dist>=.5)T.push(["Goes to decisions",2]);return T}
function ufTagHtml(aid){const T=ufTags(aid);return T.length?`<div class="uftags">${T.map(([t,g])=>`<span class="uftag ${g===1?"g":g===0?"b":""}">${ufE(t)}</span>`).join("")}</div>`:""}
/* form trend: strikes landed and absorbed per minute, fight by fight (oldest left) */
function ufTrend(aid,col){const F=(window.UFC_F||{})[aid];const R=((F&&F.h)||[]).filter(r=>r[8]>=30&&r[10]!=null&&r[12]!=null).slice(0,10).reverse();
  if(R.length<2)return `<div class="small">Not enough fights with stats yet.</div>`;
  const L=R.map(r=>r[10]/r[8]*60),A=R.map(r=>r[12]/r[8]*60),W=320,H=130,pl=26,pr=8,pt=10,pb=26,mx=Math.max(2,...L,...A)*1.1,X=i=>pl+(W-pl-pr)*(R.length===1?.5:i/(R.length-1)),Y=v=>pt+(H-pt-pb)*(1-v/mx);
  const ln=(a,c)=>`<polyline fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round" points="${a.map((v,i)=>X(i).toFixed(1)+","+Y(v).toFixed(1)).join(" ")}"/>${a.map((v,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.5" fill="${c}"><title>${v.toFixed(1)} per min · vs ${ufE(R[i][2])} (${R[i][0]})</title></circle>`).join("")}`;
  const g=[0,Math.round(mx/2),Math.floor(mx)].map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="currentColor" stroke-opacity=".12"/><text x="${pl-4}" y="${Y(v)+4}" font-size="10" text-anchor="end" fill="currentColor" opacity=".6">${v}</text>`).join("");
  const la=L.slice(-3).reduce((s,v)=>s+v,0)/Math.min(3,L.length),lb=L.slice(0,-3).length?L.slice(0,-3).reduce((s,v)=>s+v,0)/L.slice(0,-3).length:null;
  const aa=A.slice(-3).reduce((s,v)=>s+v,0)/Math.min(3,A.length),ab=A.slice(0,-3).length?A.slice(0,-3).reduce((s,v)=>s+v,0)/A.slice(0,-3).length:null;
  const note=lb==null?"":`Last 3 fights: lands ${la.toFixed(1)}/min (${la>=lb?"up":"down"} from ${lb.toFixed(1)}), absorbs ${aa.toFixed(1)}/min (${aa<=ab?"down":"up"} from ${ab.toFixed(1)}).`;
  return `<svg viewBox="0 0 ${W} ${H}" class="uftr" role="img" aria-label="Strikes landed and absorbed per minute, last ${R.length} fights">${g}${ln(A,"#e5534b")}${ln(L,"#3fb26b")}
   ${R.map((r,i)=>`<text x="${X(i).toFixed(1)}" y="${H-8}" font-size="10" text-anchor="middle" fill="currentColor" font-weight="700" opacity=".75">${r[3]}</text>`).join("")}</svg>
   <div class="small"><span style="color:#3fb26b">●</span> landed / min · <span style="color:#e5534b">●</span> absorbed / min · W/L under each fight${note?"<br>"+note:""}</div>`}
function ufTrendCard(f){return `<div class="card"><h2>Form trend <span class="small">· sig. strikes per minute, oldest → newest</span></h2><div class="grid g2">${f.c.map((c,i)=>`<div><div class="ufbn" style="color:${UF_COL[i]}">${ufE(c[1])}</div>${ufTrend(c[0])}</div>`).join("")}</div></div>`}
/* watch-outs: age, layoff, short notice, changing weight class, no fights on file */
const UF_LBS={strawweight:115,flyweight:125,bantamweight:135,featherweight:145,lightweight:155,welterweight:170,middleweight:185,"light heavyweight":205,heavyweight:265};
function ufLbs(wc){const s=String(wc||"").toLowerCase().replace(/women'?s\s*|^w\s+/,"").trim();return UF_LBS[s]||null}
function ufFlags(f){const out=[];const day=Date.parse(f.t||f.ev.d);
  f.c.forEach((c,i)=>{const F=(window.UFC_F||{})[c[0]]||{},H=F.h||[],nm=ufE(ufLast(c[1])),L=[];
    if(!H.length)L.push(["No fights on file — debut or new to this data",0]);
    if(F.age>=35)L.push([`Age ${F.age}`,0]);
    if(H[0]&&H[0][0]){const d=Math.round((day-Date.parse(H[0][0]))/864e5);if(d>=365)L.push([`${Math.round(d/30.4)} months since his last fight`,0]);else if(d>0&&d<=50)L.push([`Quick turnaround: ${d} days since his last fight`,0])}
    const now=ufLbs(f.wc),last=H[0]&&ufLbs(H[0][9]);if(now&&last&&now!==last)L.push([`Moving ${now>last?"up":"down"}: last fight at ${ufE(H[0][9])}`,0]);
    if(H[0]&&H[0][3]==="L"&&H[1]&&H[1][3]==="L")L.push([`Lost his last ${H.findIndex(r=>r[3]!=="L")<0?H.length:H.findIndex(r=>r[3]!=="L")}`,0]);
    if(L.length)out.push(`<div><b style="color:${UF_COL[i]}">${nm}</b><ul class="small ufkeys">${L.map(x=>`<li>${x[0]}</li>`).join("")}</ul></div>`)});
  return out.length?`<div class="card ufwarn"><h2>⚠️ Watch-outs</h2><div class="grid g2">${out.join("")}</div></div>`:""}
/* upset watch: the underdog is better on most of the key numbers */
function ufUpset(f){const M=ufML(f);if(!M||f.st==="post")return null;const d=M.p[0]<M.p[1]?0:1;if(M.p[d]>.45)return null;const S=f.c.map(c=>ufStats(c[0])||{});if((S[0].statN||0)<3||(S[1].statN||0)<3)return null;
  const K=[["lands more strikes","slpm",1],["absorbs less","sapm",-1],["more accurate","acc",1],["better striking defense","def",1],["more takedowns","td15",1],["better takedown defense","tddef",1]];
  const won=K.filter(([,k,s])=>S[d][k]!=null&&S[1-d][k]!=null&&(s>0?S[d][k]>S[1-d][k]:S[d][k]<S[1-d][k]));if(won.length<4)return null;
  return {who:d,n:won.length,of:K.length,what:won.map(x=>x[0]),ml:M.ml[d][0],p:M.p[d]}}
/* ESPN rankings + title fights */
function ufRanks(aid){return ((window.UFC_RK||{})[aid]||[]).filter(r=>r[1]!=null)}
function ufRankHtml(aid){const R=ufRanks(aid);return R.length?`<span class="ufrk">${R.map(r=>/pound/i.test(r[0])?`P4P #${r[1]}`:`#${r[1]} ${ufE(r[0].replace(/^(Men's|UFC)\s*/,""))}`).join(" · ")}</span>`:""}
/* 📸 tale of the tape + our prediction as an image */
function ufSnap(id){const f=ufFight(id);if(!f||typeof snapImage==="undefined")return;const E=ufEst(f),M=ufML(f),SA=ufStats(f.c[0][0])||{},SB=ufStats(f.c[1][0])||{},A=(window.UFC_F||{})[f.c[0][0]]||{},B=(window.UFC_F||{})[f.c[1][0]]||{};
  let lean=null;if(E&&f.st!=="post"){const w=E.win[0]>=E.win[1]?0:1,b=E.by[w],m=["KO","SUB","DEC"].sort((x,y)=>b[y]-b[x])[0],conf=Math.abs(E.win[0]-E.win[1]);lean={txt:`${ufLast(f.c[w][1])} by ${{KO:"KO/TKO",SUB:"submission",DEC:"decision"}[m]} · ${Math.round(E.win[w]*100)}%`,st:conf>=.4?"Strong":conf>=.2?"Medium":"Weak"}}
  const f2=v=>v==null?"–":v.toFixed(2),pc=v=>v==null?"–":Math.round(v*100)+"%",la=ufLast(f.c[0][1]),lb=ufLast(f.c[1][1]);
  const rows=[["Record",f.c[0][2],f.c[1][2]],["Age · reach",`${A.age||"–"} · ${A.reach||"–"}`,`${B.age||"–"} · ${B.reach||"–"}`],["Sig. strikes landed / min",f2(SA.slpm),f2(SB.slpm)],["Absorbed / min",f2(SA.sapm),f2(SB.sapm)],["Takedowns / 15 min",f2(SA.td15),f2(SB.td15)]];
  snapImage({col:"#d33f49",kicker:`UFC · ${f.ev.n}`,title:`${la} vs ${lb}`,sub:`${f.ti||f.wc} · ${f.rd} rounds${M?` · ${la} ${ufAm(M.ml[0][0])} / ${lb} ${ufAm(M.ml[1][0])}`:""}`,lean,
    items:E&&f.st!=="post"?[[0,`Goes the distance: ${pc(E.dist)}`]]:[],rows:rows.map(r=>({a:r[0],b:`${la} ${r[1]}  ·  ${lb} ${r[2]}`})),file:`ufc-${la}-${lb}`.replace(/\W+/g,"-")})}
/* 🔴 fight night: live results from ESPN every 30 s, your bets on this card graded as each fight ends */
const UFL={t:null,at:null,err:0};
function ufLiveApply(sb){let n=0;for(const e of sb.events||[]){const E=(window.UFC_EV||[]).find(x=>x.id===e.id);if(!E)continue;
  for(const c of e.competitions||[]){const F=E.f.find(x=>String(x.id)===String(c.id));if(!F)continue;const st=((c.status||{}).type||{}).state;if(!st)continue;
    F.st=st;F.lr=(c.status||{}).period;F.lclk=(c.status||{}).displayClock;
    for(const p of c.competitors||[]){const k=F.c.find(x=>x[0]===String(p.id));if(k)k[3]=p.winner?1:0}
    if(st==="post"){F.r=F.r||(c.status||{}).period;F.clk=F.clk||(c.status||{}).displayClock;const R=(c.status||{}).result||{};if(!F.m&&(R.displayName||R.shortDisplayName)){const m=(R.displayName||R.shortDisplayName).toLowerCase();F.m=/ko/.test(m)?"KO":/sub/.test(m)?"SUB":/dec/.test(m)?"DEC":/draw/.test(m)?"DRAW":/contest/.test(m)?"NC":(R.displayName||"").toUpperCase().slice(0,6);F.md=R.description||F.md}}
    n++}}return n}
async function ufLiveMethods(e){/* finished fights without a method yet: ESPN's fight status has it */
  await Promise.all(e.f.filter(f=>f.st==="post"&&!f.m).slice(0,15).map(async f=>{try{const r=await fetch(`https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${e.id}/competitions/${f.id}/status`);if(!r.ok)return;const s=await r.json(),R=s.result||{},m=(R.displayName||"").toLowerCase();
    if(m){f.m=/ko/.test(m)?"KO":/sub/.test(m)?"SUB":/dec/.test(m)?"DEC":/draw/.test(m)?"DRAW":/contest/.test(m)?"NC":m.toUpperCase().slice(0,6);f.md=R.description||"";f.r=s.period||f.r;f.clk=s.displayClock||f.clk}}catch(x){}}))}
async function ufLivePull(){try{const r=await fetch("https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard",{cache:"no-store"});if(!r.ok)throw 0;const sb=await r.json();ufLiveApply(sb);
  const e=ufLiveEvent();if(e)await ufLiveMethods(e);UFL.at=new Date();UFL.err=0;if(typeof updateBetsBadge!=="undefined")updateBetsBadge()}catch(x){UFL.err++}}
function ufLiveEvent(){const now=Date.now();return (window.UFC_EV||[]).filter(e=>Math.abs(Date.parse(e.d)-now)<40*3600e3||e.f.some(f=>f.st==="in")).sort((a,b)=>Math.abs(Date.parse(a.d)-now)-Math.abs(Date.parse(b.d)-now))[0]||ufUpcoming()[0]||ufPast()[0]}
function ufLiveRender(el){const e=ufLiveEvent();if(!e){el.innerHTML=ufHead("No UFC card this week.");return}const FF=e.f.map(f=>Object.assign({ev:e},f));
  const done=FF.filter(f=>f.st==="post").length,live=FF.filter(f=>f.st==="in");
  const B=(typeof betsLoad!=="undefined"?betsLoad():[]).filter(b=>b.k==="ufc"&&(b.ev===e.id||FF.some(f=>String(f.id)===String(b.fid))));
  const T=(typeof TRACK!=="undefined"&&TRACK&&TRACK.sum&&TRACK.sum.ufc?TRACK.sum.ufc.recent||[]:[]).filter(x=>x.ev===e.id);
  const chip=r=>`<span class="ufr ${r==="win"?"W":r==="loss"?"L":"NC"}">${r==="win"?"W":r==="loss"?"L":r==="push"?"P":r==="void"?"Void":"…"}</span>`;
  const row=f=>{const w=f.c.findIndex(c=>c[3]),st=f.st==="post"?`<b>${w>=0?ufE(ufLast(f.c[w][1]))+" wins":"Final"}</b> · ${ufE(f.m||"")}${f.r?" R"+f.r:""} ${ufE(f.clk||"")}`:f.st==="in"?`<b class="dn">● LIVE</b> R${f.lr||"?"} ${ufE(f.lclk||"")}`:ufTime(f.t||e.d);
    return `<div class="ufliv${f.st==="in"?" on":""}" data-ufgo="#ufc-fight-${f.id}" role="link" tabindex="0"><div>${f.c.map((c,i)=>`<span class="${f.st==="post"?(c[3]?"won":"lost"):""}">${ufE(c[1])}</span>`).join(' <span class="small">vs</span> ')}${f.ti?' <span class="uftitle">🏆</span>':""}</div><div class="small">${st}</div></div>`};
  el.innerHTML=`${ufHead(`${ufE(e.n)} · ${ufDate(e.d)} · ${done}/${FF.length} fights done${live.length?" · 1 live now":""}`)}
   <div class="small" style="margin-bottom:8px">${UFL.at?`Updated ${UFL.at.toLocaleTimeString([],{hour:"numeric",minute:"2-digit",second:"2-digit"})} · refreshes every 30 s while this page is open`:"Loading live results…"}${UFL.err?" · ⚠️ couldn't reach ESPN, retrying":""}</div>
   ${B.length?`<div class="card"><h2>🎟️ Your bets on this card</h2>${B.map(b=>{const g=gradeBet(b);return `<div class="ufval">${chip(g.r)} <b>${ufE(b.label||"")}</b><span class="small">${ufE(g.why||"")}</span><span>${b.odds!=null?ufAm(b.odds):""}</span></div>`}).join("")}
     <div class="small">${(()=>{const G=B.map(b=>gradeBet(b).r);return `${G.filter(r=>r==="win").length}-${G.filter(r=>r==="loss").length} so far · ${G.filter(r=>r==="pending").length} still to go`})()}</div></div>`:""}
   ${T.length?`<div class="card"><h2>📒 Our picks on this card</h2>${T.map(x=>{const g=x.r&&x.r!=="pending"?{r:x.r}:ufGrade({fid:x.fid,p:x.p});return `<div class="ufval">${chip(g.r)} <b>${ufE(x.title)}</b><span class="small">${ufE(x.mk)}</span><span>${ufAm(x.odds)}</span></div>`}).join("")}</div>`:""}
   <div class="card">${FF.map(row).join("")}</div>
   <p class="note">Results: ESPN. Bets grade the moment ESPN posts the result.</p>`}
function ufLive(el){ufLiveRender(el);const tick=async()=>{if((location.hash||"").slice(1)!=="ufc-live")return;await ufLivePull();if((location.hash||"").slice(1)!=="ufc-live")return;const y=scrollY;ufLiveRender(el);scrollTo(0,y);clearTimeout(UFL.t);UFL.t=setTimeout(tick,30000)};clearTimeout(UFL.t);tick()}
