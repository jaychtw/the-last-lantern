// Extended native-memory / resource-lifetime controls; no production unloading changes.
import {chromium,expect} from '@playwright/test';
import {chromiumOptions} from './chromium-options.mjs';
import {createServer} from 'vite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const out='docs/evidence/gate-c-followup';await mkdir(out,{recursive:true});
const arms=(process.env.LANTERN_MEMORY_ARMS??'scene-fixed,scene-resize,town-fixed,decode-only').split(','),cycles=Number(process.env.LANTERN_MEMORY_CYCLES??12),label=process.env.LANTERN_MEMORY_LABEL??'controls',trace=process.env.LANTERN_MEMORY_TRACE==='1';
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});let d;try{d=await vite.ssrLoadModule('/src/domain.ts');}finally{await vite.close();}
const scenes=['town','meadow','interior','shrine','forest','cavern','quarry','tower','sanctum'];
const checkpoints=scenes.map(scene=>{const g=d.fresh();g.scene=scene;g.x=scene==='interior'?500:625;g.y=610;g.xp=1347;Object.assign(g.flags,{talked:true,won:true,lit:true,thorn:true,root:true,caveRunes:true,woodlandLit:true,towerRunes:true});Object.assign(g.inventory,{sunseed:1,mossSeal:1,towerKey:1});g.cleared=['clearing','thorn','root'];const st=d.stats(g);g.hp=st.hp;g.mp=st.mp;if(!d.validGame(g))throw Error(scene);return g;});
const report={recordedAt:new Date().toISOString(),method:`${arms.length} independent fresh-browser arms, ${cycles*9} loads each (${cycles} cycles of 9). Actual confirmed slot loads for game arms; validated checkpoints, not narrative playthrough. Fixed viewport vs original periodic 768/1440 resize vs same-town reload; decode-only native-image control uses the first arm live image sets with no game/canvas. No allocation/CPU profiler attached. Forced GC and live-object queries at checkpoints outside loading; whole-browser Linux PSS, not game-only RAM or a phone budget. 30 seconds natural idle precedes diagnostic critical pressure; forced reclamation is not acceptance. Detailed memory-infra tracing is opt-in and identified in configuration.`,viewport:{width:1440,height:1000},dpr:1,arms:[]};
const imageSets={};
report.configuration={arms,cycles,loadsPerCycle:9,trace,label};
for(const arm of arms){
 const browser=await chromium.launch(chromiumOptions);
 try{
  const system=await browser.newBrowserCDPSession();
  async function pss(){const processes=(await system.send('SystemInfo.getProcessInfo')).processInfo,rows=[];for(const p of processes){try{const s=await readFile(`/proc/${p.id}/smaps_rollup`,'utf8');rows.push({type:p.type,pssKiB:Number(s.match(/^Pss:\s+(\d+)/m)[1])});}catch{rows.push({type:p.type,unavailable:true});}}return {processes:rows,pssKiB:rows.reduce((n,p)=>n+(p.pssKiB??0),0)};}
  const record={arm,browser:browser.version(),empty:await pss(),cycles:[],loads:[]};
  if(trace){record.dumpRequests=[];await system.send('Tracing.start',{transferMode:'ReturnAsStream',traceConfig:{recordMode:'recordAsMuchAsPossible',includedCategories:['disabled-by-default-memory-infra'],memoryDumpConfig:{triggers:[]}}});}
  const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1}),page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');const errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function objects(prototype){
   const group='resource-counts';try{const {result:p}=await cdp.send('Runtime.evaluate',{expression:`${prototype}.prototype`,objectGroup:group});const {objects:o}=await cdp.send('Runtime.queryObjects',{prototypeObjectId:p.objectId,objectGroup:group});const {result:r}=await cdp.send('Runtime.callFunctionOn',{objectId:o.objectId,functionDeclaration:prototype==='HTMLImageElement'?'function(){return this.map(i=>({src:i.src,width:i.naturalWidth,height:i.naturalHeight,connected:i.isConnected}));}':'function(){return this.map(c=>({width:c.width,height:c.height,connected:c.isConnected}));}',returnByValue:true});return r.value;}finally{await cdp.send('Runtime.releaseObjectGroup',{objectGroup:group});}
  }
  async function snapshot(label){
   await cdp.send('HeapProfiler.collectGarbage');const images=await objects('HTMLImageElement'),canvases=await objects('HTMLCanvasElement');await cdp.send('HeapProfiler.collectGarbage');const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));return {label,atMs:performance.now(),...await pss(),heapUsed:m.JSHeapUsedSize,dom:await cdp.send('Memory.getDOMCounters'),images,canvases,game:await page.evaluate(()=>typeof window.__lantern==='function'?{scene:window.__lantern().game.scene,metrics:window.__lantern().metrics}:null)};
  }
  if(arm==='decode-only'){
   await page.route('**/control.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Decode-only allocation control</title>'}));await page.goto('http://127.0.0.1:8095/c/control.html');
  }else{
   await page.addInitScript(g=>localStorage.setItem('lantern-v2-auto',JSON.stringify(g)),checkpoints[0]);await page.goto('http://127.0.0.1:8095/c/');await page.locator('[data-command=continue]').click();await expect(page.locator('#panel')).not.toBeVisible();
   record.runtime=await page.locator('script[type=module]').getAttribute('src');record.sha256=createHash('sha256').update(Buffer.from(await(await fetch(new URL(record.runtime,page.url()))).arrayBuffer())).digest('hex');
  }
  record.start=await snapshot('start');if(trace)record.dumpRequests.push({label:'start',...await system.send('Tracing.requestMemoryDump',{levelOfDetail:'detailed'})});
  for(let cycle=0;cycle<cycles;cycle++){
   for(let index=0;index<9;index++){
    const g=checkpoints[arm==='town-fixed'?0:index],start=performance.now();
    if(arm==='decode-only'){
     const urls=imageSets[g.scene];if(!urls?.length)throw Error('Missing control resource set');await page.evaluate(async urls=>{const next=await Promise.all(urls.map(async src=>{const i=new Image();i.src=src;await i.decode();return i;}));window.__controlImages=next;},urls);
    }else{
     await page.evaluate(g=>localStorage.setItem('lantern-v2-1',JSON.stringify(g)),g);await page.locator('#settings').click();await page.locator('[data-load="1"]').click();await page.locator('[data-command=confirm]').click();await expect(page.locator('#panel')).not.toBeVisible();await expect(page.locator('#scene-loading')).not.toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-scene',g.scene);
     if(arm==='scene-resize'&&index%3===0){await page.setViewportSize({width:768,height:1000});await page.waitForTimeout(100);await page.setViewportSize(report.viewport);}
     if(arm==='scene-fixed'&&cycle===0){await cdp.send('HeapProfiler.collectGarbage');imageSets[g.scene]=[...new Set((await objects('HTMLImageElement')).map(i=>i.src).filter(s=>s.includes('/art3d/')))];}
    }
    record.loads.push({cycle,index,scene:g.scene,loadMs:performance.now()-start});await page.waitForTimeout(250);
   }
   const sample=await snapshot(`cycle-${cycle+1}`);record.cycles.push(sample);console.log(arm,cycle+1,(sample.pssKiB/1024).toFixed(1),'MiB',sample.images.length,'images',sample.canvases.length,'canvases');
  }
  record.end=await snapshot('end');if(trace)record.dumpRequests.push({label:'end',...await system.send('Tracing.requestMemoryDump',{levelOfDetail:'detailed'})});await page.waitForTimeout(30000);record.naturalIdle=await snapshot('natural-idle-30s');
  const state=arm==='decode-only'?null:await page.evaluate(()=>window.__lantern().game);
  await system.send('Memory.simulatePressureNotification',{level:'critical'});await page.waitForTimeout(2000);record.forcedPressure=await snapshot('diagnostic-critical-pressure');if(state)expect(await page.evaluate(()=>window.__lantern().game.scene)).toBe(state.scene);
  if(trace){record.dumpRequests.push({label:'pressure',...await system.send('Tracing.requestMemoryDump',{levelOfDetail:'detailed'})});const complete=new Promise(resolve=>system.once('Tracing.tracingComplete',resolve));await system.send('Tracing.end');const {stream}=await complete;let data='';for(;;){const chunk=await system.send('IO.read',{handle:stream});data+=chunk.data;if(chunk.eof)break;}await system.send('IO.close',{handle:stream});const compressed=gzipSync(data),rawPath=`/tmp/lantern-memory-${label}-${arm}.json.gz`;await writeFile(rawPath,compressed);record.fullTrace={sha256:createHash('sha256').update(compressed).digest('hex'),bytes:compressed.length,location:`Execution-only ${rawPath}; regenerate with the documented command.`};const events=JSON.parse(data).traceEvents;record.allocatorDumps=events.filter(e=>e.name==='periodic_interval'&&e.args?.dumps).map(e=>({pid:e.pid,id:e.id,ts:e.ts,dumps:Object.fromEntries(Object.entries(e.args.dumps).filter(([key])=>['allocators','level_of_detail','process_totals'].includes(key)))}));record.processNames=events.filter(e=>e.name==='process_name').map(e=>({pid:e.pid,name:e.args.name}));record.allocatorEvidenceNote='Original allocator values/process totals in chronological trace-id groups. Chrome normalizes request GUIDs in export; pair the three successful explicit requests with the three allocator groups by order. Hierarchical paths and shared-memory aliases must not be added together.';await writeFile(`${out}/native-allocator-events.json.gz`,gzipSync(JSON.stringify({requests:record.dumpRequests,processNames:record.processNames,allocatorEvents:record.allocatorDumps,note:record.allocatorEvidenceNote})));}
  expect(errors).toEqual([]);await context.close();await new Promise(r=>setTimeout(r,2000));record.contextClosed=await pss();report.arms.push(record);report.imageControlSets=imageSets;await writeFile(`${out}/memory-${label}.json`,JSON.stringify(report,null,2)+'\n');
 }finally{await browser.close();}
}
