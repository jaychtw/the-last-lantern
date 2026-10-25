import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';

const url=process.env.LANTERN_MEASURE_URL??'http://127.0.0.1:4173/the-last-lantern/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const report={recordedAt:new Date().toISOString(),url,browser:browser.version(),environment:'Cloud Linux; headless Chromium. Emulation is not physical-device certification.',samples:[]};
try{
  for(const width of [320,390,768,1440]){
    const context=await browser.newContext({viewport:{width,height:width<600?844:1000},hasTouch:width<600,isMobile:width<600,deviceScaleFactor:width<600?2:1});
    const page=await context.newPage();await page.goto(url);await page.locator('[data-command=begin]').click();await page.waitForTimeout(1000);
    const before=await page.evaluate(()=>window.__lantern().metrics);
    await page.locator('#world').focus();
    for(const key of ['d','s','a','w']){await page.keyboard.down(key);await page.waitForTimeout(1100);await page.keyboard.up(key);}
    const after=await page.evaluate(()=>window.__lantern().metrics);
    const timings=after.frameMs.slice(before.frameMs.length).sort((a,b)=>a-b);
    if(timings.length<10)throw Error(`Insufficient rendered samples at ${width}px`);
    const meanMs=timings.reduce((a,b)=>a+b,0)/timings.length;
    report.samples.push({width,deviceScaleFactor:width<600?2:1,renderer:after.renderer,gpu:after.gpu,renderResolution:after.resolution,
      frames:timings.length,meanMs,meanFPS:1000/meanMs,p95Ms:timings[Math.floor(timings.length*.95)],
      scene:'Hearthmere; keyboard movement with animated hero and environment',limitations:'Software GPU fallback; no CPU throttling or physical-device test. No video recording during measurement.'});
    await context.close();
  }
  await writeFile('docs/evidence/performance.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
