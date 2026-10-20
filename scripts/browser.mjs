import { chromium } from 'playwright';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'pipe'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
 let ready=false;for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:4173/');if(r.ok){ready=true;break}}catch{}await wait(250)}
 assert.ok(ready,'Vite did not start');
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 for(const viewport of [{width:1440,height:900},{width:1440,height:720},{width:768,height:1024},{width:980,height:900},{width:1040,height:900},{width:1041,height:900},{width:320,height:740},{width:390,height:844},{width:430,height:932},{width:640,height:900}]){
 for(const route of ['','research.html','career.html']){
 const page=await browser.newPage({viewport});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/'+route,{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForTimeout(700);
 assert.equal(await page.locator('h1').count(),1,'one page heading');
 assert.deepEqual(errors,[],'page runtime errors');
 const w=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:innerWidth}));
 assert.ok(w.scroll<=w.view+2,'horizontal overflow '+route+' '+viewport.width+': '+JSON.stringify(w));
 if(route===''&&viewport.width<=640){
   const portrait=await page.locator('#portrait').boundingBox();
   const heading=await page.locator('h1').boundingBox();
   const bio=await page.locator('.introduction').boundingBox();
   assert.ok(portrait.x>=0&&portrait.x+portrait.width<=viewport.width,'portrait fits screen');
   assert.ok(Math.abs(portrait.height-portrait.width)<1,'portrait preserves square source framing');
   assert.ok(heading.y+heading.height<=portrait.y,'name must precede portrait');
   assert.ok(portrait.y+portrait.height<=bio.y,'portrait must not overlap biography');
   assert.ok(heading.y+heading.height<=bio.y,'title must not overlap biography');
   assert.equal(await page.locator('#portrait').evaluate(el=>getComputedStyle(el).maskImage),'none');
   assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el,'::before').content),'none');
   assert.equal(await page.locator('.introduction p').first().evaluate(el=>getComputedStyle(el).textAlign),'justify');
   for(const link of await page.locator('.site-header nav a').all()){
     assert.ok((await link.boundingBox()).height>=44,'navigation touch target');
   }
 }
 if(route==='research.html'){
   const painting=page.locator('.artwork img');
   await painting.evaluate(img=>img.decode());
   assert.ok(await painting.evaluate(img=>img.complete&&img.naturalWidth>0&&/watzmann-(800|1600|2400)\.webp/.test(img.currentSrc)),'responsive painting must load');
   const art=await painting.boundingBox();
   const title=await page.locator('h1').boundingBox();
   assert.ok(art.x>=title.x+title.width-1||art.y>=title.y+title.height-1,'painting and heading must not overlap');
   assert.equal(await page.locator('.publication-row').count(),5);
   assert.equal(await page.locator('.publication-row a').count(),3,'one focus target per available paper');
   if(viewport.width>=981){
     const first=await page.locator('.publication-description h2').first().boundingBox();
     assert.ok(first.y+first.height<=viewport.height,'First paper title must be visible below the artwork without scrolling');
   }
 }
 assert.ok(await page.locator('[data-reveal]').evaluateAll(items=>items.every(el=>getComputedStyle(el).opacity==='1')),'content readable without scrolling');
 if(route==='career.html'){
   assert.equal(await page.locator('.career-entry h2').count(),6);
   assert.equal(await page.locator('#career-painting').count(),1);
   await page.locator('#career-painting').evaluate(img=>img.decode());
   const art=await page.locator('#career-painting').boundingBox();
   const title=await page.locator('h1').boundingBox();
   assert.ok(art.x>=title.x+title.width-1||art.y>=title.y+title.height-1,'Career heading and painting must not overlap');
   assert.equal(await page.locator('#career-painting').evaluate(img=>getComputedStyle(img).filter),'none','Preserve painting colors');
   assert.ok(await page.locator('#career-painting').evaluate(x=>x.complete&&x.naturalWidth>0),'career image must load');
   if(viewport.width>=981){
     const first=await page.locator('.career-entry--mit h2').boundingBox();
     assert.ok(first.y+first.height<=viewport.height,'First career heading must be visible below the artwork without scrolling');
   }
 }
 await page.screenshot({path:'v3-'+(route||'home').replace('.html','')+'-'+viewport.width+'x'+viewport.height+'.png',fullPage:true,animations:'disabled',timeout:25000});
 await page.close();
 }}
 console.log('All 30 responsive browser routes passed');
}finally{if(browser)await browser.close();server.kill('SIGTERM')}
