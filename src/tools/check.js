// Full site check used before publishing: node tools/check.js /abs/path/index.html
// Fails (exit 1) on any page error, horizontal overflow at 390px/1200px, or empty key pages.
const {chromium}=require('playwright');const f=process.argv[2];
(async()=>{const b=await chromium.launch();const errs=[];
for(const vw of [390,1200]){const p=await b.newPage({viewport:{width:vw,height:900}});p.on('pageerror',e=>errs.push(`@${vw} ${p.url().split('#')[1]}: ${e.message}`));
 await p.route(/espn|fonts\.g|cdnjs|jsdelivr/,r=>r.abort());
 await p.addInitScript(()=>{window.Chart=class{constructor(){}destroy(){}update(){}};window.Chart.defaults={font:{},borderColor:''}});
 await p.goto('file://'+f+'#today');await p.waitForTimeout(600);
 const ids=await p.evaluate(()=>({nfl:(SLATE.find(g=>!g.final)||SLATE[0]||{}).id,nba:(NBA_SLATE[0]||{}).id,nbaP:Object.keys(NBA_LOGS).sort((a,b)=>NBA_LOGS[b].g.length-NBA_LOGS[a].g.length)[0],nflP:Object.keys(PINFO)[0],nhl:typeof NHL_SLATE!=='undefined'?((NHL_SLATE[0]||NHL_NEXT[0]||{}).id):null,nhlP:typeof NHL_P!=='undefined'?Object.keys(NHL_P).sort((a,b)=>NHL_P[b].g.length-NHL_P[a].g.length)[0]:null,nhlG:typeof NHL_G!=='undefined'?Object.keys(NHL_G)[0]:null}));
 const H=['today','games','weeks','props','plays','injuries','record','nba','nba-best','nba-props','nba-players','nba-teams','nba-scores','nba-injuries','nhl','nhl-props','nhl-standings','nhl-tomorrow','nhl-tomorrow-2','nhl-tomorrow-3','nhl-injuries','nhl-team-TOR'];
 if(ids.nfl!=null)H.push('game-'+ids.nfl,'game-'+ids.nfl+'-props');if(ids.nba!=null)H.push('nba-game-'+ids.nba,'nba-game-'+ids.nba+'-props');if(ids.nbaP)H.push('nba-player-'+encodeURIComponent(ids.nbaP));if(ids.nhl!=null)H.push('nhl-game-'+ids.nhl);if(ids.nhlP)H.push('nhl-player-'+encodeURIComponent(ids.nhlP));if(ids.nhlG)H.push('nhl-player-'+encodeURIComponent(ids.nhlG));
 for(const h of H){await p.goto('file://'+f+'#'+h);await p.waitForTimeout(350);
  const r=await p.evaluate(()=>({w:document.documentElement.scrollWidth,t:(document.querySelector('section:not([hidden]),main')||document.body).innerText.length}));
  if(r.w>vw+1)errs.push(`overflow #${h} @${vw}: ${r.w}`)}
 if(ids.nflP){await p.evaluate(n=>{S.prop={player:n,market:null,open:true};location.hash="props"},ids.nflP);await p.waitForTimeout(400);await p.evaluate(n=>{S.prop={player:n,market:null,open:true};viewPlayer()},ids.nflP);await p.waitForTimeout(300);
  const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>vw+1)errs.push(`overflow nfl player @${vw}: ${w}`)}
 await p.close()}
console.log(errs.length?"CHECK FAILED:\n"+errs.join("\n"):"CHECK OK");await b.close();process.exit(errs.length?1:0)})();
