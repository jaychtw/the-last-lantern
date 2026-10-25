import {chromiumOptions} from './chromium-options.mjs';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import os from 'node:os';
const url=process.env.LANTERN_BENCH_URL??'http://127.0.0.1:8091/';
const label=process.env.LANTERN_BENCH_LABEL??'before';
const interfacesOnly=process.env.LANTERN_BENCH_INTERFACES_ONLY==='1';
const repetitions=Number(process.env.LANTERN_BENCH_REPEATS??3),duration=12000;
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
let domain;try{domain=await vite.ssrLoadModule('/src/domain.ts');}finally{await vite.close();}
function checkpoint(scene){
 const g=domain.fresh();g.scene=scene;g.x=scene==='sanctum'?795:150;g.y=scene==='sanctum'?520:610;g.xp=1347;
 Object.assign(g.flags,{talked:true,won:true,lit:true,thorn:true});Object.assign(g.inventory,{sunseed:1,silver:1,chain:1,stoneRing:1});g.equipment={weapon:'silver',armour:'chain',accessory:'stoneRing'};g.cleared=['clearing','thorn'];
 if(['quarry','tower','sanctum'].includes(scene)){Object.assign(g.flags,{root:true,caveRunes:true,woodlandLit:true,towerRunes:true});Object.assign(g.inventory,{mossSeal:1,towerKey:1});g.cleared.push('root');}
 const s=domain.stats(g);g.hp=s.hp;g.mp=s.mp;if(!domain.validGame(g))throw Error('Invalid benchmark checkpoint');return g;
}
const scenarios=[{id:'town-desktop',scene:'town',width:1440},{id:'town-phone',scene:'town',width:390},{id:'overworld-desktop',scene:'forest',width:1440},{id:'overworld-phone',scene:'forest',width:390},{id:'dungeon-desktop',scene:'cavern',width:1440},{id:'dungeon-phone',scene:'cavern',width:390},{id:'combat-desktop',scene:'sanctum',width:1440,battle:true},{id:'combat-phone',scene:'sanctum',width:390,battle:true}].filter(s=>!process.env.LANTERN_BENCH_SCENARIOS||process.env.LANTERN_BENCH_SCENARIOS.split(',').includes(s.id));
const browser=await chromium.launch(chromiumOptions);
const artifactName=label==='before'||process.env.LANTERN_BENCH_REFERENCE==='1'?'the-last-lantern-gate-b.zip':'the-last-lantern-gate-c.zip';
const report={label,recordedAt:new Date().toISOString(),url,toolCheckoutBaseCommit:execFileSync('git',['rev-parse','HEAD']).toString().trim(),artifact:{name:artifactName,sha256:createHash('sha256').update(await readFile('playtest/'+artifactName)).digest('hex'),note:'Served JS/CSS hashes are recorded separately and cross-checked against the corresponding package.'},browser:browser.version(),environment:{os:`${os.platform()} ${os.release()} ${os.arch()}`,cpu:{model:os.cpus()[0]?.model,logicalCPUs:os.cpus().length},cgroupCpuMax:await readFile('/sys/fs/cgroup/cpu.max','utf8').catch(()=>null),flags:chromiumOptions.args,headless:chromiumOptions.headless,executablePath:chromiumOptions.executablePath??'Playwright bundled',note:'Recorded host only. Headless mode and touch/DPR emulation are not physical-device certification. No deliberate throttling or concurrent QA/encoding/rendering/trace analysis. Fresh browser contexts per sample.'},method:{durationMs:duration,repetitions,warmupMs:2000,frameSampler:'Independent rAF observer, including idle menus; all raw intervals retained. No renderer/canvas wrappers in timed samples.',tails:'p99 frame time is the equivalent tail metric; low1FPS = 1000 / mean slowest ceil(1% of intervals). Missed60HzSlots is an estimate from rounded intervals, not a compositor dropped-frame counter.',cpu:'CDP Performance task/script/layout/style counters; heap samples every second, forced-GC heap before/after retained separately from in-window allocation samples.',input:'Trusted keydown -> next rAF after observing changed domain position; an upper-bound presentation opportunity, not hardware input-to-photon.',cold:'New context (empty HTTP cache) navigation->start dialog and Begin/Continue->ready. OS/disk caches not flushed.'},samples:[],interfaces:[]};
const quantile=(s,p)=>s[Math.min(s.length-1,Math.floor(s.length*p))]??0;
function summarize(frames){const s=[...frames].sort((a,b)=>a-b),mean=frames.reduce((a,b)=>a+b,0)/frames.length,tail=s.slice(-Math.max(1,Math.ceil(s.length*.01)));return {frames:frames.length,meanMs:mean,meanFPS:1000/mean,p50Ms:quantile(s,.5),p95Ms:quantile(s,.95),p99Ms:quantile(s,.99),maxMs:s.at(-1),low1FPS:1000/(tail.reduce((a,b)=>a+b,0)/tail.length),over25Ms:s.filter(x=>x>25).length,over50Ms:s.filter(x=>x>50.5).length,over100Ms:s.filter(x=>x>100).length,missed60HzSlots:frames.reduce((n,v)=>n+Math.max(0,Math.round(v/(1000/60))-1),0)};}
async function open(s){
 const phone=s.width<600,context=await browser.newContext({viewport:{width:s.width,height:phone?844:1000},deviceScaleFactor:phone?2:1,hasTouch:phone,isMobile:phone});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(s.scene!=='town')await page.addInitScript(g=>localStorage.setItem('lantern-v2-auto',JSON.stringify(g)),checkpoint(s.scene));
 await page.addInitScript(()=>{window.__bench={frames:[],longTasks:[],active:false};try{new PerformanceObserver(list=>{if(window.__bench.active)window.__bench.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})));}).observe({type:'longtask',buffered:false});}catch{}let prev;const loop=now=>{if(window.__bench.active&&prev!==undefined)window.__bench.frames.push(now-prev);prev=now;requestAnimationFrame(loop);};requestAnimationFrame(loop);});
 const start=Date.now();await page.goto(url);await page.locator(`[data-command=${s.scene==='town'?'begin':'continue'}]`).waitFor();const startDialogMs=Date.now()-start,begin=Date.now();await page.locator(`[data-command=${s.scene==='town'?'begin':'continue'}]`).click();await expect(page.locator('#panel')).not.toBeVisible();await expect(page.locator('#scene-loading')).not.toBeVisible();const readyMs=Date.now()-begin;
 if(s.battle){await page.locator('#explore').click();await page.locator('[data-destination=guardian]').click();await page.locator('[data-command=next-line]').waitFor({timeout:30000});await page.locator('[data-command=next-line]').click();await page.locator('.battle-stage[data-ready=true]').waitFor();}
 await page.waitForTimeout(2000);return {context,page,errors,cold:{startDialogMs,beginContinueReadyMs:readyMs}};
}
try{
 const system=await browser.newBrowserCDPSession();report.environment.graphics=(await system.send('SystemInfo.getInfo')).gpu;
 const index=await (await fetch(url)).text();report.indexSha256=createHash('sha256').update(index).digest('hex');
 report.runtimeFiles=[];for(const match of index.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)){const data=Buffer.from(await(await fetch(new URL(match[1],url))).arrayBuffer());report.runtimeFiles.push({file:match[1],bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
 if(interfacesOnly){const previous=JSON.parse(await readFile(`docs/evidence/gate-c/benchmark-${label}.json`,'utf8'));Object.assign(report,previous);report.interfaces=[];report.interfaceRecordedAt=new Date().toISOString();}
 for(let repeat=0;repeat<(interfacesOnly?0:repetitions);repeat++)for(const s of scenarios){
  const {page,context,errors,cold}=await open(s),cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('HeapProfiler.collectGarbage');const initial=await cdp.send('Performance.getMetrics');
  const heaps=[],initialState=await page.evaluate(()=>window.__lantern());
  await page.evaluate(()=>{window.__bench.frames=[];window.__bench.longTasks=[];window.__bench.active=true;});
  const cgroupBefore=await readFile('/sys/fs/cgroup/cpu.stat','utf8').catch(()=>null),start=Date.now();
  for(let second=0;second<12;second++){
   if(!s.battle){const key=['d','s','a','w'][second%4];await page.locator('#world').focus();await page.keyboard.down(key);await page.waitForTimeout(600);await page.keyboard.up(key);await page.waitForTimeout(Math.max(0,start+(second+1)*1000-Date.now()));}
   else if([0,4,8].includes(second)){await page.locator(`[data-action=${second===4?'attack':'guard'}]`).click();await page.waitForTimeout(Math.max(0,start+(second+1)*1000-Date.now()));}else await page.waitForTimeout(Math.max(0,start+(second+1)*1000-Date.now()));
   const m=(await cdp.send('Performance.getMetrics')).metrics;heaps.push({elapsedMs:Date.now()-start,heap:m.find(x=>x.name==='JSHeapUsedSize').value,nodes:m.find(x=>x.name==='Nodes').value,position:await page.evaluate(()=>{const g=window.__lantern().game;return {x:g.x,y:g.y};})});
  }
  const elapsedMs=Date.now()-start,cgroupAfter=await readFile('/sys/fs/cgroup/cpu.stat','utf8').catch(()=>null),raw=await page.evaluate(()=>{window.__bench.active=false;return window.__bench;}),final=await cdp.send('Performance.getMetrics');await cdp.send('HeapProfiler.collectGarbage');const gc=await cdp.send('Performance.getMetrics');
  const values=x=>Object.fromEntries(x.metrics.map(m=>[m.name,m.value])),a=values(initial),b=values(final),c=values(gc),delta=Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount','ThreadTime','ProcessTime'].map(k=>[k,b[k]-a[k]]));
  const state=await page.evaluate(()=>window.__lantern());expect(errors).toEqual([]);expect(state.game.scene).toBe(s.scene);if(s.battle)expect(state.battle.enemyHp).toBeLessThan(initialState.battle.enemyHp);else expect(heaps.some(h=>Math.hypot(h.position.x-initialState.game.x,h.position.y-initialState.game.y)>20)).toBe(true);
  report.samples.push({...s,repeat,viewport:{width:s.width,height:s.width<600?844:1000},devicePixelRatio:s.width<600?2:1,renderResolution:state.metrics.resolution,cold,elapsedMs,...summarize(raw.frames),cpu:delta,cpuCounterWindowMs:(b.Timestamp-a.Timestamp)*1000,mainThreadBusyFraction:delta.TaskDuration/(b.Timestamp-a.Timestamp),cgroup:{before:cgroupBefore,after:cgroupAfter,note:'Whole container counters, including browser and orchestration; not attributable solely to the renderer.'},memory:{heapStartAfterGC:a.JSHeapUsedSize,heapEndBeforeGC:b.JSHeapUsedSize,heapEndAfterGC:c.JSHeapUsedSize,heapPeakSampled:Math.max(...heaps.map(h=>h.heap)),heapRangeSampled:Math.max(...heaps.map(h=>h.heap))-Math.min(...heaps.map(h=>h.heap)),samples:heaps,note:'V8 heap is not total browser/decoded image memory; pixel references and canvas surfaces reported separately.'},textures:state.metrics,frameIntervalsMs:raw.frames,longTasks:raw.longTasks,fixture:s.scene==='town'?'Fresh game':'Validated synthetic render checkpoint loaded through Continue; not a complete campaign claim'});
  console.log(`${label} ${repeat+1}/${repetitions} ${s.id} ${report.samples.at(-1).meanFPS.toFixed(1)} FPS p99 ${report.samples.at(-1).p99Ms.toFixed(1)} ms`);await context.close();
 }
 // Static interfaces intentionally stop the world renderer. Observe browser rAF
 // pacing and actual response rather than calling a paused canvas "0 FPS".
 for(const width of (process.env.LANTERN_BENCH_INTERFACES==='0'?[]:[1440,390])){
  const {page,context,errors}=await open({scene:'town',width});const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  for(const kind of ['settings','dialogue']){
   if(kind==='settings')await page.locator('#settings').click();
   else{await page.locator('#explore').click();await page.locator('[data-destination=mira]').click();await page.locator('[data-command=next-line]').waitFor({timeout:30000});}
   const before=await cdp.send('Performance.getMetrics');await page.evaluate(()=>{window.__bench.frames=[];window.__bench.longTasks=[];window.__bench.active=true;});await page.waitForTimeout(4000);
   const raw=await page.evaluate(()=>{window.__bench.active=false;return window.__bench;}),after=await cdp.send('Performance.getMetrics');
   report.interfaces.push({width,kind,durationMs:4000,...summarize(raw.frames),longTasks:raw.longTasks,taskSeconds:after.metrics.find(m=>m.name==='TaskDuration').value-before.metrics.find(m=>m.name==='TaskDuration').value,note:'Browser rAF observer while world is deliberately paused, not newly drawn gameplay frames.'});
   const start=Date.now();if(kind==='settings')await page.locator('[data-command=close]').click();else while(await page.locator('[data-command=next-line]').isVisible())await page.locator('[data-command=next-line]').click();report.interfaces.at(-1).closeOrFinishMs=Date.now()-start;
  }
  await page.locator('#world').focus();
  const input=[];for(let n=0;n<8;n++){
   await page.evaluate(()=>{window.__input=new Promise(resolve=>{document.addEventListener('keydown',()=>{const start=performance.now(),origin=window.__lantern().game;const check=()=>{const g=window.__lantern().game;if(g.x!==origin.x||g.y!==origin.y)requestAnimationFrame(()=>resolve(performance.now()-start));else requestAnimationFrame(check);};requestAnimationFrame(check);},{once:true});});});
   const key=n%2?'a':'d';await page.keyboard.down(key);input.push(await page.evaluate(()=>window.__input));await page.keyboard.up(key);
  }
  report.interfaces.push({width,kind:'input-response',samplesMs:input,meanMs:input.reduce((a,b)=>a+b)/input.length,maxMs:Math.max(...input),note:'Trusted key event to next rAF after changed domain position, an upper-bound presentation opportunity; not physical input-to-photon.'});
  await page.evaluate(()=>{window.__transitions=[];let start;new MutationObserver(()=>{const busy=document.querySelector('#world').hasAttribute('aria-busy');if(busy&&start===undefined)start=performance.now();else if(!busy&&start!==undefined){window.__transitions.push({scene:document.documentElement.dataset.scene,durationMs:performance.now()-start,at:performance.now()});start=undefined;}}).observe(document.querySelector('#world'),{attributes:true,attributeFilter:['aria-busy']});});
  await page.locator('#explore').click();await page.locator('[data-destination=meadow]').click();await expect(page.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});await expect(page.locator('#scene-loading')).not.toBeVisible();
  report.interfaces.push({width,kind:'cold-scene-transition',transitions:await page.evaluate(()=>window.__transitions),resources:await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('art3d/')).map(e=>({file:e.name.split('/').at(-1),duration:e.duration,transferSize:e.transferSize,decodedBodySize:e.decodedBodySize}))),metrics:await page.evaluate(()=>window.__lantern().metrics)});
  await page.locator('#explore').click();await page.locator('[data-destination=town]').click();await expect(page.locator('html')).toHaveAttribute('data-scene','town',{timeout:30000});await page.locator('#explore').click();await page.locator('[data-destination=meadow]').click();await expect(page.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});
  report.interfaces.push({width,kind:'warm-scene-transitions',transitions:await page.evaluate(()=>window.__transitions),metrics:await page.evaluate(()=>window.__lantern().metrics)});
  await page.locator('#settings').click();await page.locator('[data-pref=reduced]').check();await page.locator('[data-command=close]').click();await page.waitForTimeout(500);
  const canvasBefore=await page.locator('#world canvas').evaluate(c=>c.toDataURL()),stillBefore=await cdp.send('Performance.getMetrics'),drawsBefore=(await page.evaluate(()=>window.__lantern())).metrics.renderedFrames??null;
  await page.evaluate(()=>{window.__bench.frames=[];window.__bench.longTasks=[];window.__bench.active=true;});await page.waitForTimeout(8000);
  const stillAfter=await cdp.send('Performance.getMetrics'),stillFrames=await page.evaluate(()=>{window.__bench.active=false;return window.__bench;}),drawsAfter=(await page.evaluate(()=>window.__lantern())).metrics.renderedFrames??null,canvasAfter=await page.locator('#world canvas').evaluate(c=>c.toDataURL());expect(canvasAfter).toBe(canvasBefore);
  report.interfaces.push({width,kind:'reduced-motion-idle',scene:'meadow',durationMs:8000,taskSeconds:stillAfter.metrics.find(m=>m.name==='TaskDuration').value-stillBefore.metrics.find(m=>m.name==='TaskDuration').value,worldRedraws:drawsBefore===null?null:drawsAfter-drawsBefore,unchangedCanvas:true,...summarize(stillFrames.frames),longTasks:stillFrames.longTasks,note:'rAF/simulation pacing, not newly drawn FPS. Unchanged-pixel control for the existing reduced-motion preference; this is not a claim of skipped renders. Same user-visible reduced-motion preference in both.'});
  expect(errors).toEqual([]);await context.close();
 }
 await writeFile(`docs/evidence/gate-c/benchmark-${label}.json`,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
