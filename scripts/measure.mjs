import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {existsSync} from 'node:fs';
import {writeFile,readFile} from 'node:fs/promises';

const url=process.env.LANTERN_MEASURE_URL??'http://127.0.0.1:4173/the-last-lantern/';
// Domain-validated checkpoints are only render-benchmark fixtures. Complete
// campaign acceptance evidence comes from separate interaction-only playthroughs.
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
let domain;try{domain=await vite.ssrLoadModule('/src/domain.ts');}finally{await vite.close();}
function checkpoint(scene){
  const g=domain.fresh();g.scene=scene;g.x=scene==='sanctum'?795:150;g.y=scene==='sanctum'?520:610;g.xp=1347;
  Object.assign(g.flags,{talked:true,won:true,lit:true,thorn:true});g.inventory.sunseed=1;g.cleared=['clearing','thorn'];
  Object.assign(g.inventory,{silver:1,chain:1,stoneRing:1});g.equipment={weapon:'silver',armour:'chain',accessory:'stoneRing'};
  if(['quarry','tower','sanctum'].includes(scene)){Object.assign(g.flags,{root:true,caveRunes:true,woodlandLit:true,towerRunes:true});g.inventory.mossSeal=1;g.inventory.towerKey=1;g.cleared.push('root');}
  const s=domain.stats(g);g.hp=s.hp;g.mp=s.mp;if(!domain.validGame(g))throw Error('Invalid benchmark checkpoint: '+scene);return g;
}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const build=JSON.parse(await readFile('docs/evidence/build-manifest.json','utf8'));
const report={recordedAt:new Date().toISOString(),url,artifact:build.archive_sha256,browser:browser.version(),environment:'Cloud Linux; headless Chromium. Emulation is not physical-device certification.',samples:[]};
const scenarios=[...[320,390,768,1440].map(width=>({width,scene:'town',battle:false})),...['forest','cavern'].map(scene=>({width:390,scene,battle:false})),{width:1440,scene:'tower',battle:false},{width:390,scene:'sanctum',battle:true}];
try{
  for(const scenario of scenarios){
    const {width,scene,battle}=scenario,context=await browser.newContext({viewport:{width,height:width<600?844:1000},hasTouch:width<600,isMobile:width<600,deviceScaleFactor:width<600?2:1});
    const page=await context.newPage();
    if(scene!=='town')await page.addInitScript(g=>localStorage.setItem('lantern-v2-auto',JSON.stringify(g)),checkpoint(scene));
    await page.goto(url);await page.locator(`[data-command=${scene==='town'?'begin':'continue'}]`).click();
    if(battle){
      await page.locator('#explore').click();await page.locator('[data-destination=guardian]').click();await page.locator('[data-command=next-line]').waitFor({timeout:30000});await page.locator('[data-command=next-line]').click();await page.locator('.battle-stage[data-ready=true]').waitFor({timeout:10000});
    }
    await page.waitForTimeout(1000);const before=await page.evaluate(()=>window.__lantern());
    if(battle){
      for(const action of ['attack','guard']){await page.locator(`[data-action=${action}]`).click();await page.waitForFunction(()=>!window.__lantern().busy);}
    }else{
      await page.locator('#world').focus();for(const key of ['d','s','a','w']){await page.keyboard.down(key);await page.waitForTimeout(1100);await page.keyboard.up(key);}
    }
    const after=await page.evaluate(()=>window.__lantern()),metrics=after.metrics;
    if(!battle&&before.game.x===after.game.x&&before.game.y===after.game.y&&metrics.frames===before.metrics.frames)throw Error('No active render samples');
    if(battle&&after.battle.enemyHp>=before.battle.enemyHp)throw Error('Battle did not resolve actual attack');
    if(metrics.frameMs.length===600&&before.metrics.frameMs.length>300)throw Error('Benchmark exceeds diagnostic frame window; shorten capture.');
    const timings=metrics.frameMs.slice(before.metrics.frameMs.length).sort((a,b)=>a-b);if(timings.length<10)throw Error(`Insufficient samples ${scene} ${width}`);
    const meanMs=timings.reduce((a,b)=>a+b,0)/timings.length;
    report.samples.push({width,scene,battle,deviceScaleFactor:width<600?2:1,renderer:metrics.renderer,gpu:metrics.gpu,renderResolution:metrics.resolution,textures:metrics.textures,decodedTextureBytes:metrics.decodedTextureBytes,frames:timings.length,meanMs,meanFPS:1000/meanMs,p95Ms:timings[Math.floor(timings.length*.95)],
      stateOrigin:scene==='town'?'Fresh game, actual movement':'Domain-validated benchmark checkpoint loaded through actual save/Continue UI; not a campaign playthrough claim',
      limitations:'Short cloud sample; no CPU throttling, physical device, thermal/long-session certification or concurrent Blender/video/browser QA workload. Decoded pixels are application texture references, not measured resident RAM.'});
    await context.close();
  }
  await writeFile('docs/evidence/performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
