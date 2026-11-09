// Full site check used before publishing: node tools/check.js /abs/path/index.html
// Fails (exit 1) on any page error, horizontal overflow at 390px/1200px, or empty key pages; plus (phone width) the
// update-banner logic, late-data note, Jump to open/close, Simple view, and light-theme overflow + text contrast (< 3:1).
const {chromium}=require('playwright');const f=process.argv[2];
(async()=>{const b=await chromium.launch();const errs=[];
for(const vw of [390,1200]){const p=await b.newPage({viewport:{width:vw,height:900}});p.on('pageerror',e=>errs.push(`@${vw} ${p.url().split('#')[1]}: ${e.message}`));
 await p.route(/espn|fonts\.g|cdnjs|jsdelivr/,r=>r.abort());
 await p.addInitScript(()=>{window.Chart=class{constructor(){}destroy(){}update(){}};window.Chart.defaults={font:{},borderColor:''}});
 await p.goto('file://'+f+'#today');await p.waitForTimeout(600);
 const ids=await p.evaluate(()=>({nfl:(SLATE.find(g=>!g.final)||SLATE[0]||{}).id,nba:(NBA_SLATE[0]||{}).id,nbaP:Object.keys(NBA_LOGS).sort((a,b)=>NBA_LOGS[b].g.length-NBA_LOGS[a].g.length)[0],nflP:Object.keys(PINFO)[0],nhl:typeof NHL_SLATE!=='undefined'?((NHL_SLATE[0]||NHL_NEXT[0]||{}).id):null,nhlP:typeof NHL_P!=='undefined'?Object.keys(NHL_P).sort((a,b)=>NHL_P[b].g.length-NHL_P[a].g.length)[0]:null,nhlG:typeof NHL_G!=='undefined'?Object.keys(NHL_G)[0]:null}));
 const H=['today','games','weeks','props','plays','injuries','record','nba','nba-best','nba-props','nba-players','nba-teams','nba-scores','nba-injuries','nhl','nhl-props','nhl-standings','nhl-tomorrow','nhl-tomorrow-2','nhl-tomorrow-3','nhl-injuries','nhl-team-TOR','nhl-scores'];
 if(ids.nfl!=null)H.push('game-'+ids.nfl,'game-'+ids.nfl+'-props');if(ids.nba!=null)H.push('nba-game-'+ids.nba,'nba-game-'+ids.nba+'-props');if(ids.nbaP)H.push('nba-player-'+encodeURIComponent(ids.nbaP));if(ids.nhl!=null)H.push('nhl-game-'+ids.nhl);if(ids.nhlP)H.push('nhl-player-'+encodeURIComponent(ids.nhlP));if(ids.nhlG)H.push('nhl-player-'+encodeURIComponent(ids.nhlG));
 for(const h of H){await p.goto('file://'+f+'#'+h);await p.waitForTimeout(350);
  const r=await p.evaluate(()=>({w:document.documentElement.scrollWidth,t:(document.querySelector('section:not([hidden]),main')||document.body).innerText.length}));
  if(r.w>vw+1)errs.push(`overflow #${h} @${vw}: ${r.w}`)}
 if(ids.nflP){await p.evaluate(n=>{S.prop={player:n,market:null,open:true};location.hash="props"},ids.nflP);await p.waitForTimeout(400);await p.evaluate(n=>{S.prop={player:n,market:null,open:true};viewPlayer()},ids.nflP);await p.waitForTimeout(300);
  const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>vw+1)errs.push(`overflow nfl player @${vw}: ${w}`)}
 await p.close()}
// ---- extra checks (phone width): update banner logic, late-data note, Jump to, Simple view, light theme, contrast ----
{const p=await b.newPage({viewport:{width:390,height:900}});p.on('pageerror',e=>errs.push(`@extra ${p.url().split('#')[1]}: ${e.message}`));
 await p.route(/espn|fonts\.g|cdnjs|jsdelivr/,r=>r.abort());
 await p.addInitScript(()=>{window.Chart=class{constructor(){}destroy(){}update(){}};window.Chart.defaults={font:{},borderColor:''}});
 await p.goto('file://'+f+'#today');await p.waitForTimeout(600);
 const fr=await p.evaluate(()=>{const o=[];if(typeof freshNew==='undefined')return ['fresh.js missing'];
   const at=FRESH.at,live=FRESH.live;FRESH.live='2999-01-01T00:00:00Z';sessionStorage.removeItem('freshTry');sessionStorage.removeItem('freshFrom');
   if(!freshNew())o.push('newer version not detected');
   sessionStorage.setItem('freshTry',FRESH.live);sessionStorage.setItem('freshFrom',FRESH.at);if(freshNew())o.push('update banner would loop after a reload that cannot get newer');
   FRESH.live=at;if(freshNew())o.push('same version reported as new');FRESH.live=live;sessionStorage.removeItem('freshTry');sessionStorage.removeItem('freshFrom');
   const y=new Date().getUTCFullYear(),t=freshParseET('Mon, Nov 9, 2:35 PM ET'),w=Date.UTC(y,10,9,19,35);if(t!==w&&t!==Date.UTC(y-1,10,9,19,35))o.push('ET time parse wrong');
   if(!isFinite(freshParseET(typeof NBA_GEN!=='undefined'?NBA_GEN:'Mon Nov 9 2 PM ET')))o.push('NBA_GEN not parseable');
   if(typeof freshLateHtml(['nfl','nba','nhl'])!=='string')o.push('late note failed');
   // search: exact, accent-free and one-typo versions of a real player name must all find him
   const nm=Object.keys(NBA_LOGS).find(n=>/^[A-Za-z]+ [A-Za-z]{6,}$/.test(n));if(nm&&typeof srchFind!=='undefined'){const last=nm.split(' ')[1].toLowerCase(),typo=last.slice(0,2)+last[3]+last[2]+last.slice(4);
     for(const q of [nm,last,typo])if(!srchFind(q).some(x=>x.l===nm))o.push('search cannot find '+nm+' via "'+q+'"')}
   // what changed: a snapshot with one prop removed and one final removed must report both
   if(typeof wnSnap!=='undefined'){const a=wnSnap(),b=JSON.parse(JSON.stringify(a));const k=Object.keys(b.p).find(x=>x[0]==='b');if(k){delete b.p[k];const t=wnText(wnDiff(b,a)).join(' ');if(!/1 new NBA prop/.test(t))o.push('what-changed note miscounts: '+t)}}
   return o});
 fr.forEach(x=>errs.push('fresh: '+x));
 const g=await p.evaluate(()=>(SLATE.find(g=>!g.final)||SLATE[0]||{}).id);
 if(g!=null){await p.goto('file://'+f+'#game-'+g);await p.waitForTimeout(700);
  if(await p.$('#uxjumpb:not([hidden])'))for(let i=0;i<2;i++){await p.click('#uxjumpb');await p.waitForTimeout(350);
    const op=await p.evaluate(()=>{const s=document.getElementById('uxjump');return s&&s.className==='open'&&getComputedStyle(s.querySelector('.ujpanel')).visibility==='visible'});if(!op){errs.push('jump-to did not open (try '+(i+1)+')');break}
    await p.click('#uxjump [data-ujx]');await p.waitForTimeout(450);
    const cl=await p.evaluate(()=>getComputedStyle(document.querySelector('#uxjump .ujpanel')).visibility);if(cl!=='hidden'){errs.push('jump-to panel stays visible after closing');break}}}
 const nb=await p.evaluate(()=>(NBA_SLATE[0]||{}).id);
 await p.evaluate(()=>uxViewSet('simple'));
 for(const h of [nb!=null?'nba-game-'+nb+'-props':'nba-props','props']){await p.goto('file://'+f+'#'+h);await p.waitForTimeout(900);
  const r=await p.evaluate(()=>({deep:[...document.querySelectorAll('.xadeep')].filter(e=>e.offsetParent).length,w:document.documentElement.scrollWidth,simple:document.body.classList.contains('simple')}));
  if(!r.simple)errs.push('simple view not applied #'+h);if(r.deep)errs.push(`simple view still shows ${r.deep} detail blocks #${h}`);if(r.w>391)errs.push(`overflow (simple) #${h}: ${r.w}`)}
 await p.evaluate(()=>uxViewSet('detailed'));
 await p.evaluate(()=>setTheme('light'));
 const CH=['today',nb!=null?'nba-game-'+nb:'nba',g!=null?'game-'+g:'games',nb!=null?'nba-game-'+nb+'-props':'nba-props'];
 for(const h of CH){await p.goto('file://'+f+'#'+h);await p.waitForTimeout(900);
  const r=await p.evaluate(()=>{const P=c=>(c.match(/[\d.]+/g)||[0,0,0]).map(Number);
   const lum=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
   const bgOf=el=>{const cols=[];for(let e=el;e;e=e.parentElement){const cs=getComputedStyle(e);if(cs.backgroundImage!=='none')return null;const c=P(cs.backgroundColor);const a=c.length>3?c[3]:1;if(a>0)cols.push([c[0],c[1],c[2],a]);if(a>=.95)break}
     let base=P(getComputedStyle(document.body).backgroundColor).slice(0,3);for(const c of cols.reverse())base=base.map((v,i)=>v*(1-c[3])+c[i]*c[3]);return base};
   const bad=[];for(const el of document.querySelectorAll('body *')){if(!el.offsetParent||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1))continue;
     const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity<.5)continue;const bg=bgOf(el);if(!bg)continue;const fc=P(cs.color),a=fc.length>3?fc[3]:1,fg=fc.slice(0,3).map((v,i)=>v*a+bg[i]*(1-a));
     const L1=lum(fg),L2=lum(bg),cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);if(cr<3)bad.push(`${cr.toFixed(1)}:1 "${el.textContent.trim().slice(0,28)}"`)}
   return {bad:[...new Set(bad)],w:document.documentElement.scrollWidth}});
  if(r.w>391)errs.push(`overflow (light) #${h}: ${r.w}`);if(r.bad.length)errs.push(`hard-to-read text (light) #${h}: ${r.bad.slice(0,4).join(' · ')}`)}
 await p.close()}
console.log(errs.length?"CHECK FAILED:\n"+errs.join("\n"):"CHECK OK");await b.close();process.exit(errs.length?1:0)})();
