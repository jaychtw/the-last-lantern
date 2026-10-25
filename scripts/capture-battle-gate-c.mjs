import {chromiumOptions} from './chromium-options.mjs';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});let d;try{d=await vite.ssrLoadModule('/src/domain.ts');}finally{await vite.close();}
const browser=await chromium.launch(chromiumOptions);
const report={method:'Actual battle canvases and trusted Attack input, identical validated presentation checkpoints and virtual time. Not a complete campaign claim.',captures:[]};
try{
 for(const variant of ['before','after'])for(const width of [1440,390])for(const scene of ['meadow','sanctum']){
  const foe=d.encounters.find(e=>e.id===(scene==='meadow'?'clearing':'guardian'));const g=d.fresh();g.scene=scene;g.x=foe.x-30;g.y=foe.y;
  if(scene==='sanctum'){g.xp=1347;Object.assign(g.flags,{talked:true,won:true,lit:true,thorn:true,root:true,caveRunes:true,woodlandLit:true,towerRunes:true,guardianHeard:true});Object.assign(g.inventory,{sunseed:1,mossSeal:1,towerKey:1});g.cleared=['clearing','thorn','root'];const st=d.stats(g);g.hp=st.hp;g.mp=st.mp;}
  if(!d.validGame(g))throw Error('Invalid battle visual checkpoint');const context=await browser.newContext({viewport:{width,height:width<600?844:1000},deviceScaleFactor:width<600?2:1,hasTouch:width<600,isMobile:width<600}),page=await context.newPage();
  await page.clock.install({time:0});await page.clock.pauseAt(1000);await page.addInitScript(({g,lang})=>{
   localStorage.setItem('lantern-v2-auto',JSON.stringify(g));localStorage.setItem('lantern-preferences',JSON.stringify({lang,reduced:false}));
   const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>raf(now=>{window.__lastVisualRAF=now;fn(now);});
   window.__visualClicks=[];document.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action)window.__visualClicks.push({action,now:performance.now()});},true);
  },{g,lang:width<600?'zh-TW':'en'});
  await page.goto(variant==='before'?'http://127.0.0.1:8091/':'http://127.0.0.1:8092/');await page.locator('[data-command=continue]').click();await expect(page.locator('#scene-loading')).not.toBeVisible();await page.clock.runFor(2000);await expect(page.locator('.battle-stage')).toHaveAttribute('data-ready','true');
  for(const phase of ['idle','player','enemy']){
   if(phase==='player'){
    // Clock installation can leave a 1 ms per-page origin offset. Align the
    // trusted event to the shared virtual RAF grid before comparing motion.
    const now=await page.evaluate(()=>performance.now());await page.clock.runFor((16-now%16)%16);
    await page.locator('[data-action=attack]').click();await page.clock.runFor(200);
   }if(phase==='enemy')await page.clock.runFor(900);
   const name=`visual-${variant}-combat-${scene}-${width}-${phase}`,data=await page.locator('.battle-canvas').evaluate(c=>c.toDataURL());await writeFile(`docs/evidence/gate-c/${name}.png`,Buffer.from(data.split(',')[1],'base64'));
   report.captures.push({variant,width,scene,phase,file:name+'.png',build:await page.locator('script[type=module]').getAttribute('src'),timing:await page.evaluate(()=>({now:performance.now(),raf:window.__lastVisualRAF,clicks:window.__visualClicks,phase:document.querySelector('#panel').dataset.phase}))});
   if(phase==='player')await page.screenshot({path:`docs/evidence/gate-c/${name}-full.png`,fullPage:true});
  }
  await context.close();console.log(variant,width,scene);
 }
 await writeFile('docs/evidence/gate-c/battle-visual-captures.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
