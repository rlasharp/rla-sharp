
/* ---------- Odds calculator ---------- */
function oddsToDec(o){o=+o;if(!Number.isFinite(o)||o===0||(o>-100&&o<100))return NaN;return o>0?1+o/100:1+100/(-o)}
function decToAm(d){if(!(d>1))return NaN;return d>=2?Math.round((d-1)*100):Math.round(-100/(d-1))}
const cMoney=v=>Number.isFinite(v)?"$"+v.toFixed(2):"—",cPct=v=>Number.isFinite(v)?(v*100).toFixed(1)+"%":"—",cAm=v=>Number.isFinite(v)?oddsFmt(v):"—";
/* inputs are shown/typed in the chosen format; stored internally as American */
const cIn=a=>ODDS_FMT==="dec"?(Number.isFinite(oddsToDec(a))?oddsToDec(a).toFixed(2):""):a;
const cFrom=v=>ODDS_FMT==="dec"?(v>1?(v>=2?(v-1)*100:-100/(v-1)):NaN):v;
if(!window.CALC)window.CALC={odds:-110,stake:10,legs:[-110,-110],pstake:10,a:-110,b:-110};
function viewCalc(){const C=window.CALC;
  const d=oddsToDec(C.odds),pay=C.stake*d,prof=pay-C.stake;
  const ld=C.legs.map(oddsToDec),pd=ld.every(Number.isFinite)?ld.reduce((a,b)=>a*b,1):NaN,ppay=C.pstake*pd;
  const da=oddsToDec(C.a),db=oddsToDec(C.b),ia=1/da,ib=1/db,over=ia+ib,fa=ia/over,fb=ib/over;
  const inp=(id,v,step)=>`<input type="number" inputmode="decimal" id="${id}" value="${v}" step="${step||1}" style="width:100%;margin-top:4px">`,oin=(id,a)=>inp(id,cIn(a),ODDS_FMT==="dec"?"0.01":1),DEC=ODDS_FMT==="dec";
  $("#v-calc").innerHTML=`<h1>Odds Calculator</h1><p class="sub">Turn any odds into a win percentage and a payout, build a parlay, or see how much "juice" a sportsbook is charging. ${DEC?"Type decimal odds like 1.91 or 2.50.":"Type American odds like −110 or +150."} Switch formats with the American / Decimal button at the top.</p>
  <div class="grid g3">
   <div class="card"><h2>Single bet</h2>
    <label class="small">Odds${oin("cOdds",C.odds)}</label><label class="small" style="display:block;margin-top:8px">Stake ($)${inp("cStake",C.stake,"0.01")}</label>
    <div class="pgrid" style="margin-top:12px"><div><small>Implied win chance</small><b>${cPct(1/d)}</b><small>break-even rate</small></div><div><small>Payout</small><b>${cMoney(pay)}</b><small>profit ${cMoney(prof)}</small></div></div>
    <p class="small" style="margin:10px 0 0">${DEC?`American odds ${Number.isFinite(d)?(decToAm(d)>0?"+":"")+decToAm(d):"—"}`:`Decimal odds ${Number.isFinite(d)?d.toFixed(3):"—"}`}. To profit long-term you need to win more often than ${cPct(1/d)}.</p></div>
   <div class="card"><h2>Parlay</h2>
    ${C.legs.map((o,i)=>`<div class="row" style="gap:6px;align-items:end;margin-top:${i?6:0}px"><label class="small" style="flex:1">Leg ${i+1}${oin("cLeg"+i,o)}</label>${C.legs.length>2?`<button class="btn" data-rm="${i}" title="Remove leg">✕</button>`:""}</div>`).join("")}
    <div class="row" style="gap:8px;margin-top:8px">${C.legs.length<10?'<button class="btn" id="cAdd">+ Add leg</button>':""}</div>
    <label class="small" style="display:block;margin-top:8px">Stake ($)${inp("cPStake",C.pstake,"0.01")}</label>
    <div class="pgrid" style="margin-top:12px"><div><small>Parlay odds</small><b>${cAm(decToAm(pd))}</b><small>${cPct(1/pd)} implied</small></div><div><small>Payout</small><b>${cMoney(ppay)}</b><small>profit ${cMoney(ppay-C.pstake)}</small></div></div>
    <p class="small" style="margin:10px 0 0">All ${C.legs.length} legs must win. Each leg you add makes the bet harder to hit.</p></div>
   <div class="card"><h2>Remove the juice</h2>
    <label class="small">Side A odds${oin("cA",C.a)}</label><label class="small" style="display:block;margin-top:8px">Side B odds${oin("cB",C.b)}</label>
    <div class="pgrid" style="margin-top:12px"><div><small>Book's margin (vig)</small><b>${cPct(over-1)}</b><small>built into the prices</small></div><div><small>Fair odds</small><b>${cAm(decToAm(1/fa))} / ${cAm(decToAm(1/fb))}</b><small>${cPct(fa)} / ${cPct(fb)}</small></div></div>
    <p class="small" style="margin:10px 0 0">Enter both sides of a market (e.g. over ${cAm(-115)} / under ${cAm(-105)}) to see the true probability with the sportsbook's cut removed.</p></div>
  </div>
  <div class="card" style="margin-top:14px;padding:14px 18px"><p class="note" style="margin:0"><b>Quick guide:</b> ${DEC?"Decimal odds are the total you get back per $1 staked: 1.91 returns $1.91 (52.4% to break even); 2.50 returns $2.50 (40% to break even).":"−110 means bet $110 to win $100 (52.4% to break even). +150 means bet $100 to win $150 (40% to break even)."} Same prices: −110 = 1.91, +150 = 2.50. A bet is only good value if you think it wins more often than its implied chance.</p></div>`;
  const bind=(id,f)=>{const e=$("#"+id);if(e)e.onchange=()=>{f(+e.value);viewCalc()}};
  bind("cOdds",v=>C.odds=cFrom(v));bind("cStake",v=>C.stake=v);bind("cPStake",v=>C.pstake=v);bind("cA",v=>C.a=cFrom(v));bind("cB",v=>C.b=cFrom(v));
  C.legs.forEach((_,i)=>bind("cLeg"+i,v=>C.legs[i]=cFrom(v)));
  const add=$("#cAdd");if(add)add.onclick=()=>{C.legs.push(-110);viewCalc()};
  document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{C.legs.splice(+b.dataset.rm,1);viewCalc()});
}
