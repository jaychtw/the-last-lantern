import {chromiumOptions} from './chromium-options.mjs';
import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const report={method:'Actual trusted d-pad taps in a fresh game, event dispatch to the next rAF after observed movement; upper-bound presentation opportunity, not hardware input-to-photon. Eight alternating safe left/right taps per build. Real time; no canvas wrappers.',viewport:{width:390,height:844},devicePixelRatio:2,touchEmulation:true,headless:chromiumOptions.headless,samples:[]};
for(const variant of ['before','after']){
 const browser=await chromium.launch(chromiumOptions);
 try{
  const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:2,hasTouch:true,isMobile:true}),page=await context.newPage();await page.goto(variant==='before'?'http://127.0.0.1:8091/':'http://127.0.0.1:8092/');await page.locator('[data-command=begin]').tap();await expect(page.locator('#panel')).not.toBeVisible();await page.waitForTimeout(2000);
  const timings=[];for(let i=0;i<8;i++){
   await page.evaluate(()=>{window.__touchProbe=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No movement after trusted tap')),3000);document.addEventListener('pointerdown',()=>{const start=performance.now(),origin=window.__lantern().game;const check=()=>{const g=window.__lantern().game;if(g.x!==origin.x||g.y!==origin.y)requestAnimationFrame(()=>{clearTimeout(timer);resolve(performance.now()-start);});else requestAnimationFrame(check);};requestAnimationFrame(check);},{once:true,capture:true});});});
   await page.locator(`[data-dir=${i%2?'left':'right'}]`).tap();timings.push(await page.evaluate(()=>window.__touchProbe));
  }
  const sorted=[...timings].sort((a,b)=>a-b);report.samples.push({variant,browser:browser.version(),renderResolution:(await page.evaluate(()=>window.__lantern())).metrics.resolution,intervalsMs:timings,meanMs:timings.reduce((a,b)=>a+b)/timings.length,p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1)});await context.close();
 }finally{await browser.close();}
}
await writeFile('docs/evidence/gate-c/touch-response.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
