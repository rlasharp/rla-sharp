/* ---------- Usage display (data in usage_data.js) ---------- */
const USAGE=typeof USAGE_RAW!=="undefined"?USAGE_RAW:{};
function usageTrend(s,l,f){if(s==null||l==null)return "";const d=l-s,arr=Math.abs(d)<(f==="n"?0.5:2)?'<span style="color:#9aa3b2">→</span>':d>0?'<span style="color:#22c55e">▲</span>':'<span style="color:#f05252">▼</span>';
  return `<div class="small" style="margin-top:2px">Last 3: <b>${f==="n"?l:f==="s"?l+"%":pctTxt(l)}</b> ${arr}</div>`}
const pctTxt=v=>v==null?"—":(Math.round(v*10)/10).toString().replace(/\.0$/,"")+"%";
function usageLine(name){const u=USAGE[name];if(!u||u.pos==="QB")return "";const s=u.s,l=u.l3;
  const bits=[s.snap!=null?`Snaps <b>${s.snap}%</b>`:""];
  if(u.pos==="RB")bits.push(`Carry share <b>${pctTxt(s.csh)}</b>`);
  bits.push(`Target share <b>${pctTxt(s.tsh)}</b>${l.tsh!=null&&s.tsh!=null&&Math.abs(l.tsh-s.tsh)>=2?(l.tsh>s.tsh?' <span style="color:#22c55e">▲</span>':' <span style="color:#f05252">▼</span>'):""}`);
  return `<div class="small usage-line">${bits.filter(Boolean).join(" · ")}</div>`}
function usageCard(pl){const u=USAGE[pl.name];if(!u)return "";const s=u.s,l=u.l3,qb=u.pos==="QB";
  const box=(lab,a,b,sub)=>`<div class="stat"><div class="l">${lab}</div><div class="v">${a}</div><div class="s">${sub||""} ${b||""}</div></div>`;
  const tiles=qb?[box("Snap share",s.snap!=null?s.snap+"%":"—",usageTrend(s.snap,l.snap,"s"),"season"),box("Carries per game",s.cpg,usageTrend(s.cpg,l.cpg,"n"),"season")]
   :[box("Snap share",s.snap!=null?s.snap+"%":"—",usageTrend(s.snap,l.snap,"s"),"of team plays"),
     box("Target share",pctTxt(s.tsh),usageTrend(s.tsh,l.tsh),"of team targets"),
     box("Targets per game",s.tpg,usageTrend(s.tpg,l.tpg,"n"),"season"),
     u.pos==="RB"?box("Carry share",pctTxt(s.csh),usageTrend(s.csh,l.csh),`of team carries · ${s.cpg}/game`):box("Air-yards share",pctTxt(s.ays),usageTrend(s.ays,l.ays),"of team air yards")];
  const wks=Object.keys(u.wk).map(Number).sort((a,b)=>a-b);
  const rows=wks.map(w=>{const [sp,tg,ca]=u.wk[w];return `<tr><td>Wk ${w}</td><td class="r num">${sp==null?"—":sp+"%"}</td>${qb?"":`<td class="r num">${tg}</td>`}<td class="r num">${ca}</td></tr>`}).join("");
  return `<div class="card"><div class="row" style="align-items:center"><h2 style="margin:0">Usage: how much he's on the field and gets the ball</h2><span class="sp"></span><span class="tag real">nflverse</span></div>
   <div class="stats3 usage-tiles" style="margin-top:12px">${tiles.join("")}</div>
   <details style="margin-top:10px"><summary class="small" style="cursor:pointer">Week by week</summary>
    <table style="margin-top:6px"><thead><tr><th>Week</th><th class="r">Snaps</th>${qb?"":'<th class="r">Targets</th>'}<th class="r">Carries</th></tr></thead><tbody>${rows}</tbody></table></details>
   <p class="note" style="margin:8px 0 0">Season ${USAGE_ASOF}, counting only the ${u.g} games he played. "Last 3" is his last three games — a rising share often shows up before the box score does. Snap share = share of his team's offensive plays he was on the field for.</p></div>`}
