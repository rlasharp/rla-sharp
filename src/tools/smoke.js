// Usage: node tools/smoke.js /abs/path/index.html  — fails on page errors / mobile overflow
const {chromium}=require('playwright');const f=process.argv[2];(async()=>{const b=await chromium.launch();const errs=[];
for(const vw of [1200,390]){const p=await b.newPage({viewport:{width:vw,height:900}});p.on('pageerror',e=>errs.push(e.message));
await p.route('**/chart.umd.min.js',r=>r.fulfill({body:"window.Chart=class{constructor(){}destroy(){}};Chart.defaults={font:{},borderColor:''};",contentType:'text/javascript'}));
await p.route('**fonts.g**',r=>r.abort());
for(const h of ['games','plays','props','weeks','public','trends','calc','injuries']){await p.goto('file://'+f+'#'+h);await p.waitForTimeout(250);
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>vw+1)errs.push(`overflow ${h} @${vw}: ${w}`)}
const id=await p.evaluate(()=>SLATE.find(g=>!g.final)?.id);if(id){await p.goto('file://'+f+'#game-'+id);await p.waitForTimeout(250)}
console.log(vw,"record:",await p.evaluate(()=>{try{const r=playRecord();return JSON.stringify(r.c)+" units "+r.u.toFixed(2)}catch(e){return "n/a"}}));
console.log(vw,"no-log starters:",await p.evaluate(()=>{const has=new Set(S.playerLogs.filter(l=>l.season===CUR).map(l=>l.player));return Object.values(STARTERS).flat().filter(n=>!has.has(n)).join(", ")||"none"}));
await p.close()}
console.log(errs.length?"ERRORS:\n"+errs.join("\n"):"OK - no errors");await b.close();process.exit(errs.length?1:0)})();
