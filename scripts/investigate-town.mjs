// Controlled follow-up: immutable B/C artifacts, plus an identical C replica.
// Start the reference server as documented in GATE-C-FOLLOWUP.md first.
import {chromium} from '@playwright/test';
import {chromiumOptions} from './chromium-options.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
const out='docs/evidence/gate-c-followup';await mkdir(out,{recursive:true});
const report={method:'Counterbalanced repetitions per source/mode; exact count/duration in configuration. B = accepted Gate B; C and replica = byte-identical b763562 Gate C. Same loopback origin, fresh browser per window, 2-second warmup, original 600ms/second WASD schedule or animated idle. Independent rAF and CDP counters, no canvas instrumentation; no other QA/encoding/browser workload. Identical mode uses exactly the same C URL for both labels.',environment:{os:`${os.platform()} ${os.release()} ${os.arch()}`,cpu:os.cpus()[0]?.model,logicalCPUs:os.cpus().length,cpuMax:await readFile('/sys/fs/cgroup/cpu.max','utf8'),headless:chromiumOptions.headless,flags:chromiumOptions.args,physicalHardwareVerified:false},samples:[]};
const hash=b=>createHash('sha256').update(b).digest('hex');
const sources=['b','c','replica'];
const sameURL=process.env.LANTERN_TOWN_IDENTICAL==='1',duration=Number(process.env.LANTERN_TOWN_DURATION??12000),repeats=Number(process.env.LANTERN_TOWN_REPEATS??4);
const candidate=process.env.LANTERN_TOWN_CANDIDATE,diagnosticControl=process.env.LANTERN_TOWN_DIAGNOSTICS==='1';
report.configuration={sameURL,duration,repeats,candidate:candidate??null,diagnosticControl};if(sameURL)sources.shift();
if(diagnosticControl)report.method='Current verified candidate, diagnostics disabled (c) versus enabled and recording (replica). Counterbalanced 30-second traversal windows, fresh browser, 2-second warmup, identical main JS and viewport/DPR. Original 600ms/second keyboard schedule and independent rAF/CDP sampler. A small cloud overhead control, not physical-device validation or a precise zero-overhead claim.';
for(const mode of (process.env.LANTERN_TOWN_MODES??'traversal,animated-idle').split(','))for(let repeat=0;repeat<repeats;repeat++){
 const order=repeat%2?[...sources].reverse():sources;
 for(const source of order){
  const browser=await chromium.launch(chromiumOptions);
  try{
   const system=await browser.newBrowserCDPSession(),gpu=(await system.send('SystemInfo.getInfo')).gpu;
   const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1}),page=await context.newPage(),cdp=await context.newCDPSession(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{window.__timing={active:false,frames:[],longTasks:[]};let last;new PerformanceObserver(list=>{if(window.__timing.active)window.__timing.longTasks.push(...list.getEntries().map(e=>({at:e.startTime,ms:e.duration})));}).observe({type:'longtask'});requestAnimationFrame(function loop(now){if(window.__timing.active&&last!==undefined)window.__timing.frames.push(now-last);last=now;requestAnimationFrame(loop);});});
   const diagnosticEnabled=diagnosticControl&&source==='replica',url=(candidate??`http://127.0.0.1:8095/${sameURL?'c':source}/`)+(diagnosticEnabled?'?diagnostics=1':'');await page.goto(url);await page.locator('[data-command=begin]').click();await page.locator('#panel').waitFor({state:'hidden'});if(diagnosticEnabled){await page.locator('#diagnostic-launch').click();await page.locator('[data-diagnostic=start]').click();}await page.waitForTimeout(2000);await page.locator('#world').focus();
   const script=await page.locator('script[type=module]').getAttribute('src'),scriptBytes=Buffer.from(await(await fetch(new URL(script,url))).arrayBuffer());
   await cdp.send('Performance.enable');await cdp.send('HeapProfiler.collectGarbage');const values=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));const first=await values(),cgroupBefore=await readFile('/sys/fs/cgroup/cpu.stat','utf8');
   await page.evaluate(()=>{window.__timing.frames=[];window.__timing.longTasks=[];window.__timing.active=true;});const start=performance.now(),path=[];
   for(let second=0;second<duration/1000;second++){
    if(mode==='traversal'){const key=['d','s','a','w'][second%4];await page.locator('#world').focus();await page.keyboard.down(key);await page.waitForTimeout(600);await page.keyboard.up(key);}
    await page.waitForTimeout(Math.max(0,start+(second+1)*1000-performance.now()));
    path.push(await page.evaluate(()=>{const s=window.__lantern();return {x:s.game.x,y:s.game.y,viewport:s.metrics.viewport,resolution:s.metrics.resolution};}));
   }
   const elapsedMs=performance.now()-start,raw=await page.evaluate(()=>{window.__timing.active=false;return window.__timing;}),last=await values(),frames=raw.frames,sorted=[...frames].sort((a,b)=>a-b),tail=sorted.slice(-Math.ceil(sorted.length*.01));
   if(errors.length)throw Error(errors.join('\n'));
   const sample={source,repeat,mode,diagnosticEnabled,browser:browser.version(),url,script,sha256:hash(scriptBytes),recordedAt:new Date().toISOString(),elapsedMs,meanFPS:1000*frames.length/frames.reduce((a,b)=>a+b,0),p95Ms:sorted[Math.floor(sorted.length*.95)],p99Ms:sorted[Math.floor(sorted.length*.99)],maxMs:sorted.at(-1),low1FPS:1000*tail.length/tail.reduce((a,b)=>a+b,0),over50_5Ms:frames.filter(x=>x>50.5).length,frameIntervalsMs:frames,longTasks:raw.longTasks,path,cpuWindowMs:1000*(last.Timestamp-first.Timestamp),cpu:Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','ThreadTime','ProcessTime'].map(k=>[k,last[k]-first[k]])),cgroupBefore,cgroupAfter:await readFile('/sys/fs/cgroup/cpu.stat','utf8'),graphics:{devices:gpu.devices,featureStatus:gpu.featureStatus,auxAttributes:{glRenderer:gpu.auxAttributes.glRenderer,hardwareSupportsVulkan:gpu.auxAttributes.hardwareSupportsVulkan}},viewport:{width:1440,height:1000},dpr:1};
   report.samples.push(sample);await writeFile(`${out}/town-${process.env.LANTERN_TOWN_LABEL??'controls'}.json`,JSON.stringify(report,null,2)+'\n');console.log(report.samples.length,mode,source,repeat,sample.meanFPS.toFixed(1),sample.p99Ms.toFixed(1));await context.close();
  }finally{await browser.close();}
 }
}
for(const mode of (process.env.LANTERN_TOWN_MODES??'traversal,animated-idle').split(',')){
 const a=report.samples.filter(s=>s.mode===mode&&s.source==='c'),b=report.samples.filter(s=>s.mode===mode&&s.source==='replica');if(a.some(s=>s.sha256!==b[0].sha256))throw Error('Replica identity failed');
}
