import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('npm',['run','dev','--','--port','4173','--strictPort'],{stdio:'pipe'});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--disable-gpu-sandbox']});
try{
 let ready=false;
 for(let i=0;i<45;i++){
  try{const r=await fetch('http://127.0.0.1:4173/');if(r.ok){ready=true;break}}catch{}
  await pause(400);
 }
 assert.ok(ready,'preview server must start');
 for(const size of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport:size});
  const problems=[];
  page.on('pageerror',error=>problems.push(error.message));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:20000});
  await page.locator('#portrait img').waitFor({state:'attached'});
  await page.waitForTimeout(850);
  assert.equal(await page.locator('h1').count(),1,'one primary heading');
  assert.equal(await page.locator('#portrait img').count(),1,'image fallback exists');
  assert.equal(await page.locator('.paper').count(),6,'research preserved');
  assert.equal(await page.locator('.career-entry').count(),5,'experience preserved');
  assert.equal(await page.locator('.hero-wash').count(),1,'readability wash present');
  assert.deepEqual(problems,[],'no JavaScript runtime errors');
  const width=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(width.document<=width.viewport+2,'no horizontal overflow');
  await page.screenshot({path:'site-'+size.width+'.png',fullPage:true,timeout:20000,animations:'disabled'});
  await page.close();
 }
 console.log('Desktop and mobile smoke tests passed');
}finally{await browser.close();server.kill('SIGTERM')}
