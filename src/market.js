/* ---------- Line movement + best price by sportsbook ----------
   MOVE: DraftKings opening vs current line (ESPN odds page, Nov 2 evening). sp = home spread (negative = home favoured).
   BEST: best available price per side across DraftKings, FanDuel, BetMGM, Fanatics, Hard Rock Bet, BetRivers
         (WIN DAILY odds comparison — Week 9 page not posted yet on Nov 2; added when available). US books — availability varies; in Quebec the
         only provincially regulated sportsbook is Loto-Québec's Mise-o-jeu.
   PROP_MOVE: player-prop line moves where both the opening and current number were published. */
const MARKET_ASOF="Fri Nov 6, 8 PM ET";
const MOVE={
 1:{open:{sp:-4.5,tot:49.5},now:{sp:10,tot:39.5,ml:[-535,400]}},
 2:{open:{sp:4.5,tot:48.5},now:{sp:3,tot:52.5,ml:[-180,150]}},
 3:{open:{sp:-3.5,tot:41.5},now:{sp:-3.5,tot:42.5,ml:[142,-170]}},
 4:{open:{sp:1.5,tot:52.5},now:{sp:4.5,tot:51.5,ml:[-225,185]}},
 5:{open:{sp:3,tot:42.5},now:{sp:3,tot:44.5,ml:[-155,130]}},
 6:{open:{sp:6.5,tot:47.5},now:{sp:6.5,tot:49.5,ml:[-290,235]}},
 7:{open:{sp:4.5,tot:50.5},now:{sp:4.5,tot:47.5,ml:[-218,180]}},
 8:{open:{sp:-5.5,tot:44.5},now:{sp:3,tot:38.5,ml:[-155,130]}},
 9:{open:{sp:-9.5,tot:41.5},now:{sp:-9.5,tot:48.5,ml:[410,-550]}},
 10:{open:{sp:-1.5,tot:43.5},now:{sp:6,tot:40.5,ml:[-238,195]}},
 11:{open:{sp:-8.5,tot:46.5},now:{sp:-10,tot:51.5,ml:[370,-485]}},
 12:{open:{sp:-13.5,tot:45.5},now:{sp:-8.5,tot:39.5,ml:[360,-470]}},
 13:{open:{sp:-1.5,tot:46.5},now:{sp:-3,tot:44.5,ml:[142,-170]}},
 14:{open:{sp:-3.5,tot:48.5},now:{sp:-6,tot:47.5,ml:[225,-278]}},
 15:{open:{sp:3,tot:48.5},now:{sp:3,tot:43.5,ml:[-170,142]}}};
// [awayLine,price,book],[homeLine,price,book] · ml [price,book] x2 · tot [line,price,book] over/under
const BEST={};
const PROP_MOVE={};
const mkSpTxt=(g,sp)=>sp===0?"Pick'em":`${short(sp<0?g.home:g.away)} −${Math.abs(sp)}`;
const sgn=v=>(v>0?"+":v<0?"−":"")+Math.abs(v);
function moveMini(g){const m=MOVE[g.id];if(!m)return "";const b=[];
  if(m.open.sp!==m.now.sp)b.push(`spread ${mkSpTxt(g,m.open.sp)} → <b>${mkSpTxt(g,m.now.sp)}</b>`);
  if(m.open.tot!==m.now.tot)b.push(`total ${m.open.tot} → <b>${m.now.tot}</b>`);
  return b.length?`<div class="pubmini">📈 Line moved: ${b.join(" · ")}</div>`:""}
function marketSection(g){const m=MOVE[g.id],B=BEST[g.id];if(!m&&!B)return "";
  const big=m&&(Math.abs(m.now.sp-m.open.sp)>=3||Math.abs(m.now.tot-m.open.tot)>=3);
  const mv=m?`<div class="card"><h2>Line movement <span class="tag real">DraftKings</span></h2>
    <table><thead><tr><th></th><th class="r">Opened</th><th class="r">Now</th></tr></thead><tbody>
     <tr><td>Spread</td><td class="r">${mkSpTxt(g,m.open.sp)}</td><td class="r"><b>${mkSpTxt(g,m.now.sp)}</b></td></tr>
     <tr><td>Total</td><td class="r">${m.open.tot}</td><td class="r"><b>${m.now.tot}</b></td></tr>
     <tr><td>Moneyline</td><td class="r small">—</td><td class="r"><b>${short(g.away)} ${amTxt(m.now.ml[0])} / ${short(g.home)} ${amTxt(m.now.ml[1])}</b></td></tr></tbody></table>
    <p class="note" style="margin:8px 0 0">${big?"A move of 3+ points usually means injury news or heavy money from sharp bettors. ":""}"Opened" is the first line posted; "Now" is as of ${MARKET_ASOF} (ESPN odds page).</p></div>`:"";
  const cell=(lab,price,book)=>`<div class="bpc"><span>${lab}</span><b>${amTxt(price)}</b><small>${book}</small></div>`;
  const bp=B?`<div class="card"><h2>Best price</h2>
    <div class="bpl">Spread</div><div class="bpg">${cell(`${short(g.away)} ${sgn(B.sp[0][0])}`,B.sp[0][1],B.sp[0][2])}${cell(`${short(g.home)} ${sgn(B.sp[1][0])}`,B.sp[1][1],B.sp[1][2])}</div>
    <div class="bpl">Moneyline</div><div class="bpg">${cell(short(g.away),B.ml[0][0],B.ml[0][1])}${cell(short(g.home),B.ml[1][0],B.ml[1][1])}</div>
    <div class="bpl">Total</div><div class="bpg">${cell(`Over ${B.tot[0][0]}`,B.tot[0][1],B.tot[0][2])}${cell(`Under ${B.tot[1][0]}`,B.tot[1][1],B.tot[1][2])}</div></div>`:"";
  return `<div class="section"><h2>Line movement & best prices</h2><div class="grid g2">${mv}${bp}</div></div>`}
function propMoveTxt(name,k){const m=PROP_MOVE[name+"|"+k];if(!m)return "";
  return `<div class="small" style="margin-top:4px">📈 Line moved ${m.open} → <b>${m.now}</b> <span style="opacity:.7">(${esc(m.src)})</span></div>`}
