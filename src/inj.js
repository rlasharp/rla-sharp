/* ---------- Injuries: ESPN NFL injury report (espn.com/nfl/injuries + ESPN team injury pages) ----------
   Every player ESPN lists, incl. injured reserve / PUP / NFI. Regenerate with tools/injgen.py data/espn_inj.txt "<date>". */
const INJ_ASOF="Wed Nov 4";
const INJ={
  ARI:[["James Conner", "RB", "IR", "Foot", "Nov 15"], ["Jeremiyah Love", "RB", "IR", "Ankle", "Dec 6"], ["Kendrick Bourne", "WR", "IR", "Lower Leg", "Feb 15"], ["Walter Nolen III", "DT", "Questionable", "Ankle", "Nov 8"], ["Jon Gaines II", "G", "Questionable", "Ankle", "Nov 8"], ["Bam Knight", "RB", "Questionable", "Concussion", "Nov 8"], ["Michael Wilson", "WR", "Questionable", "Ribs", "Nov 8"], ["Jayden Williams", "OT", "Questionable", "Knee", "Nov 8"]],
  ATL:[["Yasir Abdullah", "LB", "IR", "Hamstring", "Nov 8"], ["Samson Ebukam", "DE", "IR", "Hamstring", "Dec 13"], ["Brian Robinson Jr.", "RB", "Questionable", "Hamstring", "Nov 8"], ["Divine Deablo", "LB", "Questionable", "Forearm", "Nov 8"], ["Billy Bowman Jr.", "CB", "Questionable", "Hamstring", "Nov 8"], ["Zachariah Branch", "WR", "Out", "Hamstring", "Nov 15"], ["Cameron Williams", "OL", "IR", "Ankle", "Nov 8"], ["Beaux Collins", "WR", "IR", "Hip", "Nov 8"], ["Anterio Thompson", "DT", "Out", "Undisclosed", "Feb 15"]],
  BAL:[["Tyler Loop", "PK", "IR", "Groin", "Dec 13"], ["Tyler Huntley", "QB", "Doubtful", "Toe", "Nov 5"], ["Jaylinn Hawkins", "S", "Questionable", "Knee", "Nov 5"], ["Roger Rosengarten", "OT", "Questionable", "Ankle", "Nov 5"], ["John Simpson", "G", "Questionable", "Back", "Nov 5"], ["John Jenkins", "DT", "Questionable", "Knee", "Nov 5"]],
  BUF:[["Greg Gaines", "DT", "Questionable", "Calf", "Nov 9"], ["Dee Alford", "CB", "Questionable", "Ankle", "Nov 9"], ["Spencer Brown", "OT", "Questionable", "Back", "Nov 9"], ["DJ Moore", "WR", "Questionable", "Knee", "Nov 9"], ["Joshua Palmer", "WR", "Questionable", "Hamstring", "Nov 9"]],
  CAR:[["Brady Christensen", "G", "IR", "Hamstring", "Nov 8"], ["Jonathon Brooks", "RB", "IR", "Abdomen", "Nov 8"], ["Torricelli Simpkins III", "G", "Questionable", "Ankle", "Nov 8"], ["Damien Lewis", "G", "Questionable", "Knee", "Nov 8"], ["Bobby Brown III", "DT", "Questionable", "Hand", "Nov 8"], ["Will Lee III", "CB", "Questionable", "Hamstring", "Nov 8"], ["Jaelan Phillips", "LB", "Questionable", "Hamstring", "Nov 8"], ["Xavier Legette", "WR", "IR", "Knee", "Nov 8"], ["Corey Bullock", "C", "Questionable", "Quadriceps", "Nov 8"], ["Akayleb Evans", "CB", "IR", "Triceps", "Nov 30"]],
  CHI:[["Kyle Monangai", "RB", "Questionable", "Toe", "Nov 8"], ["Kentavius Street", "DT", "Questionable", "Knee", "Nov 8"], ["Grady Jarrett", "DE", "Questionable", "Groin", "Nov 8"], ["Malik Muhammad II", "CB", "Questionable", "Toe", "Nov 8"], ["Coby Bryant", "S", "IR", "Knee", "Dec 19"]],
  CIN:[["Cashius Howell", "DE", "IR", "Wrist", "Dec 6"], ["Kyle Dugger", "S", "Questionable", "Quadriceps", "Nov 8"], ["DJ Turner II", "CB", "Questionable", "Ankle", "Nov 8"], ["Cedric Johnson", "DE", "Questionable", "Ankle", "Nov 8"], ["Andrei Iosivas", "WR", "IR", "Thumb", "Nov 8"], ["Erick All Jr.", "TE", "IR", "Knee - ACL", "Feb 15"]],
  CLE:[],
  DAL:[["Dee Winters", "LB", "Questionable", "Calf", "Nov 8"], ["Luke Schoonmaker", "TE", "Questionable", "Groin", "Nov 8"], ["KaVontae Turpin", "WR", "Questionable", "Ribs", "Nov 8"], ["P.J. Locke", "S", "Questionable", "Concussion", "Nov 8"], ["Caleb Downs", "S", "Questionable", "Concussion", "Nov 8"], ["Malachi Lawrence", "LB", "Questionable", "Ankle", "Nov 8"], ["Jake Ferguson", "TE", "Questionable", "Ankle", "Nov 8"], ["Jonathan Bullard", "DT", "IR", "Calf", "Nov 8"], ["Marist Liufau", "LB", "IR", "Forearm", "Nov 8"]],
  DEN:[["Talanoa Hufanga", "S", "Questionable", "Ankle", "Nov 8"], ["Brandon Jones", "S", "Questionable", "Hamstring", "Nov 8"], ["Kris Abrams-Draine", "CB", "Questionable", "Ankle", "Nov 8"], ["RJ Harvey", "RB", "IR", "Knee", "Dec 6"]],
  DET:[["Jimmy Rolder", "LB", "IR", "Hamstring", "Feb 15"], ["Kerby Joseph", "S", "Out", "Knee", "Nov 15"], ["D.J. Reed", "CB", "Questionable", "Hip", "Nov 8"], ["Jacob Saylors", "RB", "Questionable", "Neck", "Nov 8"], ["Cade Mays", "C", "Questionable", "Ankle", "Nov 8"], ["Jack Campbell", "LB", "Doubtful", "Neck", "Nov 8"], ["Brian Branch", "S", "Questionable", "Concussion", "Nov 8"], ["DJ Wonnum", "LB", "Questionable", "Concussion", "Nov 8"], ["Isiah Pacheco", "RB", "IR", "Back", "Dec 28"]],
  GB:[["Sean Rhyan", "G", "Questionable", "Ankle", "Nov 25"], ["Zaire Franklin", "LB", "Questionable", "Shin", "Nov 8"], ["Travis Glover", "OT", "Questionable", "Knee", "Nov 8"], ["Christian Watson", "WR", "Questionable", "Ribs", "Nov 8"], ["Micah Parsons", "DE", "Out", "Knee - ACL", "Nov 25"]],
  HOU:[["Reed Blankenship", "S", "Questionable", "Concussion", "Nov 8"], ["David Montgomery", "RB", "Questionable", "Groin", "Nov 8"], ["Jaylin Noel", "WR", "IR", "Toe", "Feb 15"], ["Jalen Pitre", "S", "Questionable", "Shoulder - AC Joint", "Nov 8"], ["Blake Fisher", "OT", "Questionable", "Thumb", "Nov 8"]],
  IND:[["Justin Walley", "CB", "Questionable", "Knee", "Nov 8"], ["Anthony Gould", "WR", "Questionable", "Concussion", "Nov 8"], ["Bryce Boettcher", "LB", "Questionable", "Groin", "Nov 8"]],
  JAX:[["Travon Walker", "DE", "Questionable", "Ribs", "Nov 5"], ["Eric Murray", "S", "IR", "Elbow", "Feb 15"], ["DaVon Hamilton", "DT", "IR", "Knee", "Feb 15"], ["Jakobi Meyers", "WR", "Questionable", "Hamstring", "Nov 5"], ["Chris Rodriguez Jr.", "RB", "Questionable", "Hand", "Nov 5"], ["Bhayshul Tuten", "RB", "Questionable", "Ankle", "Nov 5"], ["Antonio Johnson", "S", "Questionable", "Ankle", "Nov 5"], ["Branson Combs", "LB", "Questionable", "Shoulder", "Nov 5"], ["Jarrian Jones", "CB", "Questionable", "Ankle", "Nov 5"], ["Ezra Cleveland", "G", "Questionable", "Knee", "Nov 5"]],
  KC:[["Mansoor Delane", "CB", "Questionable", "Shoulder", "Nov 8"], ["Peter Woods", "DT", "Questionable", "Neck", "Nov 8"], ["L'Jarius Sneed", "CB", "IR", "Knee", "Nov 26"], ["Omarr Norman-Lott", "DT", "Out", "Knee - ACL", "Nov 8"]],
  LV:[["Darien Porter", "CB", "Questionable", "Groin", "Nov 8"], ["Patrick Johnson", "DE", "IR", "Neck", "Nov 29"], ["Carter Runyon", "TE", "IR", "Foot", "Nov 8"]],
  LAC:[["Rodney Shelley", "CB", "Questionable", "Hamstring", "Nov 8"], ["Donte Jackson", "CB", "Questionable", "Hamstring", "Nov 8"], ["Deane Leonard", "CB", "Questionable", "Concussion", "Nov 8"], ["Kayode Awosika", "G", "Questionable", "Lower Leg", "Nov 8"], ["Brenen Thompson", "WR", "Questionable", "Quadriceps", "Nov 8"], ["David Njoku", "TE", "IR", "Lower Leg", "Nov 8"], ["Derwin James Jr.", "S", "IR", "Hamstring", "Nov 29"], ["Denzel Perryman", "LB", "IR", "Undisclosed", "Nov 8"]],
  LAR:[["Dean Connors", "RB", "IR", "Hand", "Dec 13"], ["Colby Parkinson", "TE", "Questionable", "Ribs", "Nov 8"], ["Joe Cardona", "LS", "Questionable", "Ankle", "Nov 8"], ["Grant Stuard", "LB", "Questionable", "Hamstring", "Nov 8"], ["Matthew Stafford", "QB", "Questionable", "Arm", "Nov 8"], ["Terrance Ferguson", "TE", "IR", "Ankle", "Nov 8"], ["Myles Garrett", "DE", "IR", "Knee", "Nov 8"], ["Trent McDuffie", "CB", "Questionable", "Back", "Nov 8"], ["Jaylen Watson", "CB", "Questionable", "Shoulder", "Nov 8"], ["Davante Adams", "WR", "IR", "Hamstring", "Nov 25"]],
  MIA:[["Kadyn Proctor", "OT", "Questionable", "Concussion", "Nov 8"], ["Malik Herring", "DE", "Questionable", "Undisclosed", "Nov 8"]],
  MIN:[["Christian Darrisaw", "OT", "Questionable", "Shoulder", "Nov 9"], ["Kyler Murray", "QB", "Questionable", "Hamstring", "Nov 9"], ["Theo Jackson", "S", "Questionable", "Quadriceps", "Nov 9"]],
  NE:[["Hunter Henry", "TE", "Questionable", "Foot", "Nov 8"], ["TreVeyon Henderson", "RB", "Questionable", "Illness", "Nov 8"], ["Mack Hollins", "WR", "IR", "Calf", "Nov 8"], ["A.J. Brown", "WR", "Questionable", "Ankle", "Nov 8"], ["Gabe Jacas", "LB", "Questionable", "Knee", "Nov 8"]],
  NO:[["Travis Etienne Jr.", "RB", "IR", "Hamstring", "Nov 8"], ["Jordyn Tyson", "WR", "IR", "Hamstring", "Nov 8"], ["Cesar Ruiz", "G", "Questionable", "Knee", "Nov 8"], ["Nathan Shepherd", "DT", "Questionable", "Illness", "Nov 8"], ["Justin Reid", "S", "Questionable", "Concussion", "Nov 8"], ["CJ Donaldson", "RB", "Questionable", "Shoulder", "Nov 8"]],
  NYG:[["Greg Newsome II", "CB", "Questionable", "Concussion", "Nov 8"], ["Theo Johnson", "TE", "Questionable", "Neck", "Nov 8"], ["Cam Skattebo", "RB", "Questionable", "Hamstring", "Nov 8"], ["Tyrone Tracy Jr.", "RB", "IR", "Hamstring", "Dec 6"], ["Marcus Mbow", "OT", "Questionable", "Knee", "Nov 8"], ["Jevon Holland", "S", "Questionable", "Concussion", "Nov 8"], ["Tremaine Edmunds", "LB", "IR", "Chest", "Feb 15"]],
  NYJ:[["Max Mitchell", "OT", "IR", "Concussion", "Dec 13"], ["Joseph Ossai", "DE", "Questionable", "Ankle", "Nov 8"], ["David Bailey", "LB", "Questionable", "Groin", "Nov 8"], ["Breece Hall", "RB", "Questionable", "Quadriceps", "Nov 8"], ["T'Vondre Sweat", "DT", "IR", "Knee", "Nov 29"]],
  PHI:[["Dontayvion Wicks", "WR", "Questionable", "Ankle", "Nov 8"], ["DeVonta Smith", "WR", "Questionable", "Hamstring", "Nov 8"], ["Jonathan Jones", "CB", "Questionable", "Hamstring", "Nov 8"], ["Jihaad Campbell", "LB", "Questionable", "Hamstring", "Nov 8"], ["Britain Covey", "WR", "Questionable", "Knee", "Nov 8"], ["Michael Carter II", "CB", "Questionable", "Abdomen", "Nov 8"]],
  PIT:[["Doneiko Slaughter", "CB", "Out", "Hamstring", "Nov 8"], ["Ben Skowronek", "WR", "Out", "Calf", "Nov 8"], ["Brandin Echols", "CB", "Out", "Hamstring", "Nov 8"], ["Michael Pittman Jr.", "WR", "IR", "Foot", "Nov 15"], ["Sebastian Joseph-Day", "DT", "IR", "Triceps", "Nov 27"]],
  SF:[["De'Zhaun Stribling", "WR", "IR", "Ankle", "Dec 6"], ["Brandon Aiyuk", "WR", "Out", "Personal", "Feb 15"], ["Marques Sigle", "S", "Questionable", "Ankle", "Nov 8"], ["Garret Wallow", "LB", "Questionable", "Hamstring", "Nov 8"], ["Luke Gifford", "LB", "Questionable", "Groin", "Nov 8"], ["Upton Stout", "CB", "Questionable", "Shoulder - AC Joint", "Nov 8"], ["Nick Bosa", "DE", "Questionable", "Knee", "Nov 8"], ["Deebo Samuel Sr.", "WR", "Questionable", "Hamstring", "Nov 8"], ["Demarcus Robinson", "WR", "IR", "Ankle", "Nov 8"], ["Mike Evans", "WR", "Questionable", "Achilles", "Nov 8"], ["Christian McCaffrey", "RB", "Questionable", "Hamstring", "Nov 8"]],
  SEA:[["Rashid Shaheed", "WR", "Questionable", "Knee", "Nov 8"], ["Velus Jones Jr.", "RB", "Questionable", "Hamstring", "Nov 8"], ["Charles Cross", "OT", "Questionable", "Ankle", "Nov 8"], ["Leonard Williams", "DT", "Questionable", "Shoulder", "Nov 8"], ["Brandon Pili", "DT", "Questionable", "Back", "Nov 8"], ["Uchenna Nwosu", "LB", "Questionable", "Ankle", "Nov 8"], ["Drew Lock", "QB", "Questionable", "Elbow", "Nov 8"]],
  TB:[["Emeka Egbuka", "WR", "Questionable", "Foot", "Nov 8"], ["Yaya Diaby", "LB", "Out", "Knee - MCL", "Nov 22"], ["Josh Hayes", "CB", "IR", "Knee", "Nov 22"], ["Christian Rozeboom", "LB", "IR", "Finger", "Nov 30"]],
  TEN:[["Tommy Townsend", "P", "Out", "Knee", "Nov 15"], ["Tyjae Spears", "RB", "Out", "Knee", "Nov 15"], ["Carnell Tate", "WR", "Out", "Shoulder", "Nov 15"], ["Jaylon Jones", "CB", "Out", "Knee", "Nov 15"], ["Peter Skoronski", "G", "Questionable", "Hamstring", "Nov 15"], ["JC Latham", "OT", "Questionable", "Finger", "Nov 15"], ["James Williams Sr.", "LB", "Questionable", "Groin", "Nov 15"], ["Marcus Harris", "CB", "Questionable", "Ankle", "Nov 15"], ["Dorian Mausi", "LB", "IR", "Foot", "Nov 15"]],
  WAS:[["Daron Payne", "DT", "IR", "Foot", "Feb 15"], ["Javon Kinlaw", "DT", "IR", "Knee", "Dec 6"], ["Jeremy McNichols", "RB", "IR", "Foot", "Dec 6"], ["Jer'Zhan Newton", "DT", "IR", "Pectoral", "Nov 8"], ["Terry McLaurin", "WR", "IR", "Knee", "Feb 15"], ["Laremy Tunsil", "OT", "IR", "Triceps", "Dec 20"], ["Jaylin Lane", "WR", "IR", "Ankle", "Feb 15"]],
};
const INJ_P={};Object.entries(INJ).forEach(([t,a])=>a.forEach(([n,p,s,i,r])=>INJ_P[n]={team:t,pos:p,s,i,r}));
const INJ_LBL={IR:"Injured reserve","IR-R":"IR · designated to return","PUP-R":"PUP list","NFI-R":"Non-football injury list","Reserve-DNR":"Reserve · did not report","Reserve-CEL":"Reserve list"};
const INJ_ORD={Out:0,Doubtful:1,Questionable:2,"IR-R":3,IR:4,"PUP-R":5,"NFI-R":6,"Reserve-DNR":7,"Reserve-CEL":8};
const injGroup=s=>s==="Out"||s==="Doubtful"||s==="Questionable"?s:"Reserve";
const INJ_COL={Out:"#f05252",Doubtful:"#f97316",Questionable:"#fab219",Reserve:"#a78bfa"};
const injColor=s=>INJ_COL[injGroup(s)]||"#9aa";
const injLabel=s=>INJ_LBL[s]||s;
/* true when the player will not play this week (Out or any reserve list) */
const injSidelined=n=>{const x=INJ_P[n];return !!x&&x.s!=="Questionable"&&x.s!=="Doubtful"};
function injChip(s){const c=injColor(s);return `<span class="tag" style="background:${c}22;color:${c};white-space:nowrap">${esc(injGroup(s)==="Reserve"?s.replace("-R","").replace("Reserve-","Res-"):s)}</span>`}
function injTag(name){const x=INJ_P[name];if(!x)return "";const c=injColor(x.s);return `<span class="tag" style="background:${c}22;color:${c}">⚠ ${esc(injLabel(x.s))}${x.i?" · "+esc(x.i):""}${x.r?" · est. return "+esc(x.r):""}</span>`}
function injRows(a){return [...a].sort((x,y)=>(INJ_ORD[x[2]]??9)-(INJ_ORD[y[2]]??9)).map(([n,p,s,i,r])=>`<tr><td><b>${esc(n)}</b> <span class="small">${p}</span></td><td class="small">${esc(i).replace(/\//g,"/<wbr>")}${r?`<br><span style="opacity:.7;white-space:nowrap">ret. ${esc(r)}</span>`:""}</td><td class="r">${injChip(s)}</td></tr>`).join("")}
function injList(team){const a=INJ[team]||[];if(!a.length)return '<p class="small" style="margin:6px 0 0">ESPN lists no injured players.</p>';
  const act=a.filter(x=>injGroup(x[2])!=="Reserve"),res=a.filter(x=>injGroup(x[2])==="Reserve");
  return `${act.length?`<table style="margin-top:6px"><tbody>${injRows(act)}</tbody></table>`:'<p class="small" style="margin:6px 0 0">No game-status designations.</p>'}
   ${res.length?`<details style="margin-top:8px"><summary class="small" style="cursor:pointer">Injured reserve & other lists (${res.length})</summary><table style="margin-top:6px"><tbody>${injRows(res)}</tbody></table></details>`:""}`}
/* full ESPN report page */
window.INJV=window.INJV||{team:"ALL",f:"all",q:""};
function viewInjuries(){const V=window.INJV,el=document.getElementById("v-injuries");
  const teams=Object.keys(INJ).sort((a,b)=>TEAMS[a][0].localeCompare(TEAMS[b][0]));
  const wk=new Set(SLATE.filter(g=>!g.final).flatMap(g=>[g.away,g.home]));
  const all=Object.values(INJ).flat(),cnt=g=>all.filter(x=>injGroup(x[2])===g).length;
  const fil=x=>(V.f==="all"||V.f==="skill"||injGroup(x[2])===V.f)&&(!V.q||x[0].toLowerCase().includes(V.q.toLowerCase()))&&(V.f!=="skill"||["QB","RB","WR","TE"].includes(x[1]));
  const sel=V.team==="ALL"?teams:[V.team];
  const cards=sel.map(t=>{const a=INJ[t].filter(fil);if(!a.length)return "";
    return `<div class="card"><h2>${badge(t)} ${TEAMS[t][0]} <span class="small" style="font-weight:400">· ${a.length}${wk.has(t)?"":" · no game left this week"}</span></h2><table><tbody>${injRows(a)}</tbody></table></div>`}).join("");
  el.innerHTML=`<h1>NFL Injury Report</h1>
   <p class="small" style="margin-top:-4px">Every player on ESPN's NFL injury report — game statuses plus injured reserve, PUP and other lists. As of ${INJ_ASOF}. Source: ESPN.com/nfl/injuries.</p>
   <div class="grid g4" style="margin:10px 0">${["Out","Doubtful","Questionable","Reserve"].map(g=>`<div class="card" style="padding:10px"><small>${g==="Reserve"?"IR / PUP / NFI":g}</small><b style="font-size:22px;color:${INJ_COL[g]};display:block">${cnt(g)}</b></div>`).join("")}</div>
   <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px">
    <select id="injTeam" style="max-width:100%"><option value="ALL">All 32 teams</option>${teams.map(t=>`<option value="${t}"${V.team===t?" selected":""}>${TEAMS[t][0]}</option>`).join("")}</select>
    <select id="injF"><option value="all">All statuses</option><option value="Out">Out</option><option value="Doubtful">Doubtful</option><option value="Questionable">Questionable</option><option value="Reserve">IR / PUP / NFI</option><option value="skill">QB/RB/WR/TE only</option></select>
    <input id="injQ" placeholder="Search player" value="${esc(V.q)}" style="flex:1;min-width:140px">
   </div>
   <div class="grid g2">${cards||'<p class="small">No players match.</p>'}</div>`;
  el.querySelector("#injF").value=V.f;
  el.querySelector("#injTeam").onchange=e=>{V.team=e.target.value;viewInjuries()};
  el.querySelector("#injF").onchange=e=>{V.f=e.target.value;viewInjuries()};
  const q=el.querySelector("#injQ");q.oninput=e=>{V.q=e.target.value;clearTimeout(q._t);q._t=setTimeout(()=>{viewInjuries();const n=document.getElementById("injQ");n.focus();n.setSelectionRange(n.value.length,n.value.length)},250)};
}

/* ---------- Week 9 game-time weather ----------
   Forecasts are added on the Saturday run. Roofs/domes listed now. */
const WX={
  3:{dome:"Dome (Caesars Superdome)"},
  4:{dome:"Retractable roof (Lucas Oil Stadium)"},
  10:{dome:"Covered (SoFi Stadium)"},
  15:{dome:"Dome (U.S. Bank Stadium)"},
};
const WX_LVL=["Low impact","Minor impact","Moderate impact","High impact"],WX_COL=["#22c55e","#a3e635","#fab219","#f05252"];
function wxMini(g){const x=WX[g.id];if(!x)return "";if(x.dome)return `<div class="pubmini">🏟️ ${x.dome} — weather not a factor</div>`;
  const ic=x.lvl>=3?"⛈️":x.rain&&/[1-9]/.test(x.rain)&&x.lvl>=1?"🌧️":x.lvl<0?"❔":"🌤️";
  return `<div class="pubmini">${ic} ${esc(x.w)} · ${esc(x.t)} · wind ${esc(x.wind)}${x.lvl>=0?` · <b style="color:${WX_COL[x.lvl]}">${WX_LVL[x.lvl]}</b>`:""}</div>`}
function wxCard(g){const x=WX[g.id];if(!x)return "";
  if(x.dome)return `<div class="card"><h2>Weather</h2><p style="margin:0">🏟️ ${x.dome} — played indoors, weather is not a factor.</p></div>`;
  return `<div class="card"><h2>Weather at kickoff</h2>${x.lvl>=0?`<span class="tag" style="background:${WX_COL[x.lvl]}22;color:${WX_COL[x.lvl]}">${WX_LVL[x.lvl]}</span>`:""}
   <div class="pgrid" style="margin-top:10px"><div><small>Conditions</small><b>${esc(x.w)}</b><small>${esc(x.t)}</small></div><div><small>Wind · Rain chance</small><b>${esc(x.wind)}</b><small>rain ${esc(x.rain)}</small></div></div>
   <p class="small" style="margin:10px 0 0">${esc(x.note)} Forecasts change — recheck on game day.</p></div>`}
function injWxSection(g){return `<div class="section"><h2>Injuries & weather</h2><p class="small" style="margin-top:-6px">ESPN injury report as of ${INJ_ASOF} — every listed player; reserve lists are folded. <a href="#injuries">Full league report →</a></p>
  <div class="grid g3"><div class="card"><h2>${badge(g.away)} ${short(g.away)}</h2>${injList(g.away)}</div><div class="card"><h2>${badge(g.home)} ${short(g.home)}</h2>${injList(g.home)}</div>${wxCard(g)}</div></div>`}
