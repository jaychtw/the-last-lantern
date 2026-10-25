import {chromiumOptions} from './chromium-options.mjs';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});let d;try{d=await vite.ssrLoadModule('/src/domain.ts');}finally{await vite.close();}
const result={method:'Same browser/context, 18 real confirmed slot loads cycling all nine validated scene checkpoints; resize and actual touch/mouse input. Synthetic load stress, not narrative gameplay. Forced-GC heap separates retained state from allocation; Linux per-process PSS includes native images/canvases/software graphics but is not a physical-device RAM budget.',variants:[]};
for(const variant of ['before','after']){
 const browser=await chromium.launch(chromiumOptions);
 try{
  const system=await browser.newBrowserCDPSession();const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1}),page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const checkpoints=['town','meadow','interior','shrine','forest','cavern','quarry','tower','sanctum'].map(scene=>{const g=d.fresh();g.scene=scene;g.x=scene==='interior'?500:625;g.y=610;g.xp=1347;Object.assign(g.flags,{talked:true,won:true,lit:true,thorn:true,root:true,caveRunes:true,woodlandLit:true,towerRunes:true});Object.assign(g.inventory,{sunseed:1,mossSeal:1,towerKey:1});g.cleared=['clearing','thorn','root'];const st=d.stats(g);g.hp=st.hp;g.mp=st.mp;if(!d.validGame(g))throw Error(scene);return g;});
  const emptyBrowser=await memory();
  await page.addInitScript(g=>localStorage.setItem('lantern-v2-auto',JSON.stringify(g)),checkpoints[0]);await page.goto(variant==='before'?'http://127.0.0.1:8091/':'http://127.0.0.1:8092/');await page.locator('[data-command=continue]').click();await expect(page.locator('#panel')).not.toBeVisible();
  async function memory(){
   await cdp.send('HeapProfiler.collectGarbage');const m=(await cdp.send('Performance.getMetrics')).metrics,processes=(await system.send('SystemInfo.getProcessInfo')).processInfo,pss=[];
   for(const p of processes){try{const text=await readFile(`/proc/${p.id}/smaps_rollup`,'utf8');pss.push({id:p.id,type:p.type,pssKiB:Number(text.match(/^Pss:\s+(\d+)/m)[1]),rssKiB:Number(text.match(/^Rss:\s+(\d+)/m)[1])});}catch(e){pss.push({id:p.id,type:p.type,unavailable:e.code});}}
   return {heapUsed:m.find(x=>x.name==='JSHeapUsedSize').value,nodes:m.find(x=>x.name==='Nodes').value,processes:pss,totalPssKiB:pss.reduce((a,b)=>a+(b.pssKiB??0),0),metrics:await page.evaluate(()=>typeof window.__lantern==='function'?window.__lantern().metrics:null)};
  }
  await cdp.send('HeapProfiler.startSampling',{samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
  const record={variant,emptyBrowser,start:await memory(),loads:[]};
  for(let i=0;i<18;i++){
   const g=checkpoints[i%checkpoints.length];await page.evaluate(g=>localStorage.setItem('lantern-v2-1',JSON.stringify(g)),g);await page.locator('#settings').click();await page.locator('[data-load="1"]').click();const start=Date.now();await page.locator('[data-command=confirm]').click();await expect(page.locator('#panel')).not.toBeVisible();await expect(page.locator('#scene-loading')).not.toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-scene',g.scene);const loadMs=Date.now()-start;
   if(i%3===0){await page.setViewportSize({width:768,height:1000});await page.waitForTimeout(100);await page.setViewportSize({width:1440,height:1000});}
   await page.waitForTimeout(250);record.loads.push({scene:g.scene,cycle:Math.floor(i/9),loadMs,...await memory()});
  }
  record.end=await memory();
  await page.locator('#explore').click();await page.locator('[data-destination=guardian]').click();await page.locator('[data-command=next-line]').waitFor({timeout:30000});await page.locator('[data-command=next-line]').click();await page.locator('.battle-stage[data-ready=true]').waitFor();record.battleBefore=await memory();
  await page.locator('[data-action=guard]').click();await page.waitForFunction(()=>!window.__lantern().busy);record.battleAfter=await memory();
  const battleBeforePressure=await page.evaluate(()=>window.__lantern().battle);
  try{await system.send('Memory.simulatePressureNotification',{level:'critical'});await page.waitForTimeout(1000);record.pressureControl={note:'Explicit diagnostic pressure, not ordinary gameplay or an FPS/memory-budget acceptance sample.',after:await memory()};}catch(error){record.pressureControl={unavailable:String(error)};}
  if(record.pressureControl.after)expect(await page.evaluate(()=>window.__lantern().battle)).toEqual(battleBeforePressure);
  const {profile}=await cdp.send('HeapProfiler.stopSampling');await writeFile(`docs/evidence/gate-c/allocations-${variant}.json`,JSON.stringify(profile)+'\n');
  const allocations=[];function visit(node){if(node.selfSize)allocations.push({function:node.callFrame.functionName,url:node.callFrame.url,line:node.callFrame.lineNumber,estimatedBytes:node.selfSize});for(const child of node.children??[])visit(child);}visit(profile.head);record.allocations={method:'CDP statistical allocation sampling at 32 KiB; includes allocations collected by GC. This is diagnostic load stress, not an FPS run. Sizes are estimates, not live heap peaks.',estimatedAllocatedBytes:allocations.reduce((a,b)=>a+b.estimatedBytes,0),top:allocations.sort((a,b)=>b.estimatedBytes-a.estimatedBytes).slice(0,20)};
  expect(errors).toEqual([]);result.variants.push(record);await context.close();console.log(variant,record.start.totalPssKiB,record.end.totalPssKiB);
 }finally{await browser.close();}
}
await writeFile('docs/evidence/gate-c/memory-stress.json',JSON.stringify(result,null,2)+'\n');
