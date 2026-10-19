import {chromium,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'pipe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4173')).ok)break}catch{}await wait(200)}
 for(const engine of [chromium,webkit]){
 browser=await engine.launch({headless:true});
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:width===390?3:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // External font servers are irrelevant to this image regression.
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  async function inspect(label){
   await page.locator('.tree-still').waitFor({timeout:12000});
   await page.waitForTimeout(400);
   assert.equal(await page.locator('#branch-shader canvas').count(),0,'settled tree releases GPU canvas');
   const png=await page.locator('.branch-photo').screenshot({path:`v3-tree-${engine.name()}-${width}-${label}.png`});
   const dark=await page.evaluate(async base64=>{
    const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,128,128);
    const data=ctx.getImageData(0,0,128,128).data;
    let count=0;for(let i=0;i<data.length;i+=4)if(data[i]<160&&data[i+3]>200)count++;
    return count/(128*128);
   },png.toString('base64'));
   console.log(engine.name(),width,label,'visible dark pixels',dark);
   assert.ok(dark>.05,'Tree must remain visibly rendered: '+label);
   assert.deepEqual(errors,[],'No runtime errors');
  }
  await page.goto('http://127.0.0.1:4173/career.html',{waitUntil:'domcontentloaded'});
  await inspect('first');
  await page.locator('nav a', {hasText:'Home'}).click();
  await page.locator('nav a', {hasText:'Career'}).click();
  await inspect('revisit');
  await page.locator('nav a', {hasText:'Research'}).click();
  await page.goBack({waitUntil:'domcontentloaded'});
  await inspect('back');
  await page.reload({waitUntil:'domcontentloaded'});
  await inspect('reload');
  await page.close();
 }
 // Reduced motion also takes the non-animated, repeat-visit path.
 const reduced=await browser.newPage({reducedMotion:'reduce'});
 await reduced.goto('http://127.0.0.1:4173/career.html',{waitUntil:'domcontentloaded'});
 await reduced.locator('.tree-still').waitFor();
 await reduced.close();
 // If the GPU is lost during the intro, the original picture must return.
 const loss=await browser.newPage();
 await loss.addInitScript(()=>{
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   const gl=getContext.call(this,type,...args);
   if(type==='webgl2'&&gl&&this.parentElement?.id==='branch-shader'){
    this.addEventListener('webglcontextlost',()=>{window.treeContextLost=true},{once:true});
    setTimeout(()=>gl.getExtension('WEBGL_lose_context').loseContext(),100);
   }
   return gl;
  };
 });
 await loss.goto('http://127.0.0.1:4173/career.html',{waitUntil:'domcontentloaded'});
 await loss.waitForFunction(()=>window.treeContextLost&&getComputedStyle(document.getElementById('branch-image')).opacity==='1');
 assert.equal(await loss.locator('#branch-shader.ready').count(),0);
 await loss.close();
 // Portrait context loss must reveal the source on both layouts.
 for(const width of [390,1440]){
 const portraitLoss=await browser.newPage({viewport:{width,height:900}});
 await portraitLoss.route('https://fonts.googleapis.com/**',r=>r.abort());
 await portraitLoss.addInitScript(()=>{
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   const gl=getContext.call(this,type,...args);
   if(type==='webgl2'&&gl&&this.parentElement?.id==='portrait-shader'){
    this.addEventListener('webglcontextlost',()=>{window.portraitContextLost=true},{once:true});
    setTimeout(()=>gl.getExtension('WEBGL_lose_context').loseContext(),100);
   }
   return gl;
  };
 });
 await portraitLoss.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
 await portraitLoss.waitForFunction(()=>window.portraitContextLost&&getComputedStyle(document.querySelector('.portrait-fallback')).opacity==='1');
 assert.equal(await portraitLoss.locator('#portrait.shader-ready').count(),0);
 assert.equal(await portraitLoss.locator('#portrait-shader canvas').count(),0);
 await portraitLoss.setViewportSize({width:width===390?1440:390,height:900});
 assert.equal(await portraitLoss.locator('.portrait-fallback').evaluate(el=>getComputedStyle(el).opacity),'1');
 await portraitLoss.close();
 }
 await browser.close();browser=null;
 }
 console.log('Tree navigation, reduced-motion, and context-loss regressions passed in Chromium and WebKit');
}finally{if(browser)await browser.close();server.kill('SIGTERM')}
