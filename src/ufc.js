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
  const side=(c,i)=>`<div class="ufside${won(i)?" won":""}"><a href="#ufc-fighter-${c[0]}" onclick="event.stopPropagation()"><b>${ufE(c[1])}</b></a><span class="small">${ufE(c[2])}${c[4]?" · "+ufE(c[4]):""}</span>${M?`<span class="ufml">${ufAm(M.ml[i][0])} <small>${ufPct(M.p[i])}</small></span>`:""}</div>`;
  return `<div class="card ufrow" data-ufgo="#ufc-fight-${f.id}" role="link" tabindex="0"><div class="small ufwc">${ufE(f.wc)}${f.rd===5?" · 5 rounds":""}${f.st==="post"&&f.m?` · <b>${ufE(f.m)}</b> R${f.r} ${ufE(f.clk||"")}`:f.st==="in"?" · <b class='dn'>LIVE</b>":""}</div>
   <div class="ufpair">${side(a,0)}<span class="ufvs">vs</span>${b?side(b,1):""}</div>${M?`<div class="nbwp" style="margin-top:6px"><div style="width:${Math.round(M.p[0]*100)}%;background:#d33f49"></div><div style="width:${100-Math.round(M.p[0]*100)}%;background:#3987e5"></div></div>`:""}<div class="small ufmore">Odds, tale of the tape &amp; our estimates →</div></div>`}
function ufCard(el,ev){const up=ufUpcoming(),e=ev||up[0];if(!e){el.innerHTML=ufHead("No upcoming UFC cards in the feed yet.")+`<a class="btn" href="#ufc-results">📅 Recent results</a>`;return}
  const FF=e.f.map(f=>Object.assign({ev:e},f)),V=ufValues(FF).filter(x=>x.edge>=.05&&ufEst(x.f).n>=4).slice(0,5);
  el.innerHTML=`${ufHead(`${ufE(e.n)} · ${ufDate(e.d)} · ${ufTime(e.d)}${e.ven?" · "+ufE(e.ven):""}${e.city?", "+ufE(e.city):""}`)}
   ${up.length>1?`<div class="ufevs">${up.map(x=>`<a class="fxp${x.id===e.id?" on":""}" href="#ufc-event-${x.id}">${ufE(x.n.replace(/^UFC Fight Night:?\s*/,"FN: ").replace(/^Dana White's Contender Series:?\s*/,"DWCS "))} · ${ufDate(x.d).replace(/^\w+, /,"")}</a>`).join("")}</div>`:""}
   ${V.length?`<div class="card"><h2>⭐ Best value on this card</h2><div class="small" style="margin-bottom:6px">Where our estimate (the moneyline's win chance × how each fighter wins, loses and how often his fights go the distance, over his career) beats the price by 5+ points.</div>${V.map(ufValRow).join("")}</div>`:""}
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
   ${V?`<div class="ufpv">⭐ Best value (no long shots): <b>${ufOLabel(f,V.o)}</b> ${ufAm(V.o[4])} <span class="small">(${ufE(UF_MK[V.o[0]]||V.o[0])}) · ours ${ufPct(V.e)} vs needs ${ufPct(V.need)}</span>${typeof actBtn!=="undefined"?actBtn(ufSpec(f,V.o),"＋","ov"):""}</div>`:""}
   <div class="small">From the odds' win chance and both fighters' careers (method of wins and losses, how often they go the distance). Research, not a guarantee.</div></div>`}
function ufFightPage(el,id){const f=ufFight(id);if(!f){el.innerHTML=ufHead("Fight not found.")+`<a href="#ufc">← UFC</a>`;return}const M=ufML(f),[a,b]=f.c;
  el.innerHTML=`<p><a href="#ufc-event-${f.ev.id}">← ${ufE(f.ev.n)}</a></p>
   <div class="card ufhero"><div class="small">${ufE(f.wc)} · ${f.rd} rounds · ${ufDate(f.t||f.ev.d)}</div>
    <div class="ufpair big">${f.c.map((c,i)=>`<div class="ufside${f.st==="post"&&c[3]?" won":""}"><a href="#ufc-fighter-${c[0]}"><b>${ufE(c[1])}</b></a><span class="small">${ufE(((window.UFC_F||{})[c[0]]||{}).nick||"")}</span><span class="small">${ufE(c[2])}${c[4]?" · "+ufE(c[4]):""}</span>${M?`<span class="ufml">${ufAm(M.ml[i][0])} <small>${ufPct(M.p[i])} to win</small></span>`:""}</div>${i===0?`<span class="ufvs">vs</span>`:""}`).join("")}</div>
    ${f.st==="post"?`<div class="nbsay">🏁 ${ufE(f.c.find(c=>c[3])?f.c.find(c=>c[3])[1]+" wins":"Result")}${f.m?` · ${ufE(f.m)}${f.md?" ("+ufE(f.md)+")":""} · R${f.r} ${ufE(f.clk||"")}`:""}</div>`:M?`<div class="nbwp" style="margin-top:8px"><div style="width:${Math.round(M.p[0]*100)}%;background:#d33f49"></div><div style="width:${100-Math.round(M.p[0]*100)}%;background:#3987e5"></div></div><div class="small" style="text-align:center">win chance from the odds (vig removed)</div>`:""}</div>
   ${ufTape(f)}${ufPredict(f)}${ufMethods(f)}${ufOddsBoard(f)}${ufLength(f)}
   <div class="grid g2">${f.c.map(c=>`<div class="card"><h2>${ufE(c[1])} · last fights</h2>${ufHist(c[0],5)}<a class="small" href="#ufc-fighter-${c[0]}">All his fights →</a></div>`).join("")}</div>`}
function ufHist(aid,n){const F=(window.UFC_F||{})[aid];if(!F||!F.h.length)return `<div class="small">No UFC fights on file.</div>`;
  return `<div class="nbatbl"><table class="bxt ufh"><thead><tr><th>Date</th><th>Opponent</th><th></th><th>Method</th><th>Time</th><th>Sig. str</th><th>TD</th></tr></thead><tbody>${F.h.slice(0,n||10).map(r=>`<tr><td>${ufE((r[0]||"").slice(2).replace(/-/g,"/"))}</td><td><a href="#ufc-fighter-${r[1]}">${ufE(r[2])}</a></td><td><span class="ufr ${r[3]}">${r[3]}</span></td><td>${ufE(r[4])}<div class="small">${ufE(r[5]||"")}</div></td><td>R${r[6]||"?"} ${ufE(r[7])}</td><td>${r[10]!=null?`${r[10]}/${r[11]}`:"–"}<div class="small">${r[12]!=null?`took ${r[12]}`:""}</div></td><td>${r[14]!=null?`${r[14]}/${r[15]}`:"–"}</td></tr>`).join("")}</tbody></table></div>`}
function ufFighterPage(el,aid){const F=(window.UFC_F||{})[aid];if(!F){el.innerHTML=ufHead("Fighter not found.")+`<a href="#ufc">← UFC</a>`;return}const S=ufStats(aid)||{},R=F.R||{};
  const next=ufFights().find(f=>f.st!=="post"&&f.c.some(c=>c[0]===aid));
  el.innerHTML=`<p><a href="javascript:history.back()">← Back</a></p><div class="phead tch" style="--tc:#d33f49"><div><h1>${ufE(F.n)}</h1><p class="sub">${F.nick?`“${ufE(F.nick)}” · `:""}${ufE(R.rec||"")}${F.wc?" · "+ufE(F.wc):""}${F.ctry?" · "+ufE(F.ctry):""}</p></div></div>
   <div class="pline">${[F.age?F.age+" yrs":"",F.ht,F.reach?F.reach+" reach":"",F.stance,F.team].filter(Boolean).map(x=>`<span>${ufE(x)}</span>`).join("")}</div>
   ${next?`<a class="card ufnext" href="#ufc-fight-${next.id}">🥊 Next: vs <b>${ufE(next.c.find(c=>c[0]!==aid)[1])}</b> · ${ufE(next.ev.n)} · ${ufDate(next.t||next.ev.d)} →</a>`:""}
   <div class="pbio" style="margin-top:10px"><div><b>${S.w||0}-${S.l||0}</b>Last ${S.n||0}</div><div><b>${S.wKO||0}</b>Wins by KO</div><div><b>${S.wSUB||0}</b>Wins by sub</div><div><b>${S.wDEC||0}</b>Wins by decision</div><div><b>${S.slpm!=null?S.slpm.toFixed(2):"–"}</b>Sig. str / min</div><div><b>${S.td15!=null?S.td15.toFixed(2):"–"}</b>TD / 15 min</div></div>
   <div class="card" style="margin-top:12px"><h2>Fight history</h2>${ufHist(aid,10)}</div>`}
function ufResults(el){const P=ufPast();el.innerHTML=ufHead("Recent cards and results")+(P.map(e=>`<h2 class="tsh">${ufE(e.n)} <span class="small">· ${ufDate(e.d)}</span></h2>${e.f.map(ufFightRow).join("")}`).join("")||`<div class="card small">No results yet.</div>`)}
function ufProps(el){const up=ufUpcoming(),fights=up.flatMap(e=>e.f.map(f=>Object.assign({ev:e},f)));const V=ufValues(fights);
  el.innerHTML=ufHead("Every priced bet on the upcoming cards, ranked by our estimate vs the price")+(V.length?`<div class="card">${V.slice(0,60).map(ufValRow).join("")}</div><p class="note">Estimates need both fighters to have 4+ UFC fights on file; fighters new to the UFC are left out of the top of this list.</p>`:`<div class="card small">No odds posted for the upcoming cards yet — books usually post about a week before.</div>`)}
function ufcRoute(h){const el=document.getElementById("v-ufc");if(!el)return;
  if(!(typeof LO!=="undefined"&&LO.data)&&!UFC.loWait){UFC.loWait=1;let n=0;const t=setInterval(()=>{n++;if(typeof LO!=="undefined"&&LO.data){clearInterval(t);const hh=(location.hash||"").slice(1);if(hh.startsWith("ufc")){const y=scrollY;ufcRoute(hh);scrollTo(0,y)}}else if(n>20)clearInterval(t)},500)}
  if(!window.UFC_OK){el.innerHTML=`<div class="small" style="padding:30px 0;text-align:center">Loading UFC…</div>`;ufcEnsure(()=>{if(!window.UFC_OK){el.innerHTML=`<div class="card">Couldn't load the UFC data — try again in a moment.</div>`;return}if((location.hash||"").slice(1).startsWith("ufc"))ufcRoute((location.hash||"").slice(1))});return}
  if(h.startsWith("ufc-fight-"))return ufFightPage(el,h.slice(10));if(h.startsWith("ufc-fighter-"))return ufFighterPage(el,h.slice(12));
  if(h.startsWith("ufc-event-"))return ufCard(el,(window.UFC_EV||[]).find(e=>e.id===h.slice(10)));if(h==="ufc-results")return ufResults(el);if(h==="ufc-props")return ufProps(el);return ufCard(el)}
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
