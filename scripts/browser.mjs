import { chromium } from 'playwright';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const server=spawn('npm',['run','dev','--','--port','4173','--strictPort'],{stdio:'pipe'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
 let ready=false;for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:4173/');if(r.ok){ready=true;break}}catch{}await wait(250)}
 assert.ok(ready,'Vite did not start');
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 for(const route of ['','research.html','career.html']){
 const page=await browser.newPage({viewport});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/'+route,{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForTimeout(400);
 assert.equal(await page.locator('h1').count(),1,'one page heading');
 assert.deepEqual(errors,[],'page runtime errors');
 const w=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:innerWidth}));
 assert.ok(w.scroll<=w.view+2,'horizontal overflow '+route+' '+viewport.width+': '+JSON.stringify(w));
 if(route==='research.html')assert.equal(await page.locator('.publication-row').count(),5);
 if(route==='career.html')assert.ok(await page.locator('#botanical-tree path').count()>100);
 await page.screenshot({path:'v3-'+(route||'home').replace('.html','')+'-'+viewport.width+'.png',fullPage:true,animations:'disabled',timeout:20000});
 await page.close();
 }}
 console.log('All six browser routes passed');
}finally{if(browser)await browser.close();server.kill('SIGTERM')}
