import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'pipe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4173')).ok)break}catch{}await wait(200)}
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  async function inspect(label){
   await page.locator('#branch-shader.ready').waitFor();
   await page.waitForTimeout(4200);
   const stats=await page.locator('#branch-shader').evaluate(el=>{
    const m=el.paperShaderMount,g=m.gl;
    m.setUniforms({});
    const pixels=new Uint8Array(g.drawingBufferWidth*g.drawingBufferHeight*4);
    g.readPixels(0,0,g.drawingBufferWidth,g.drawingBufferHeight,g.RGBA,g.UNSIGNED_BYTE,pixels);
    let dark=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<160&&pixels[i+3]>200)dark++;
    return {dark:dark/(pixels.length/4),size:m.providedUniforms.u_size,width:g.drawingBufferWidth,height:g.drawingBufferHeight};
   });
   console.log(width,label,JSON.stringify(stats));
   await page.locator('.career-top').screenshot({path:`v3-tree-${width}-${label}.png`});
   return stats;
  }
  await page.goto('http://127.0.0.1:4173/career.html');
  const first=await inspect('first');
  await page.locator('nav a', {hasText:'Home'}).click();
  await page.locator('nav a', {hasText:'Career'}).click();
  const revisit=await inspect('revisit');
  assert.ok(first.dark>.02,`Tree visible at end of introduction: ${JSON.stringify(first)}`);
  assert.ok(revisit.dark>.02,`Tree visible on revisit: ${JSON.stringify(revisit)}`);
  await page.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM')}
