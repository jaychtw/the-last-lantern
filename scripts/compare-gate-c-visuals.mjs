import {chromiumOptions} from './chromium-options.mjs';
// Deterministic clock, validated presentation checkpoints, actual runtime canvas.
// This is visual integration evidence, not a narrative playthrough.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
let domain;try{domain=await vite.ssrLoadModule('/src/domain.ts');}finally{await vite.close();}
const browser=await chromium.launch(chromiumOptions);
const report={method:'Identical validated checkpoints, viewport/DPR, normal motion setting and virtual time; Canvas2D captures from actual baseline ZIP and candidate runtime. No screenshot substituted for game assets.',samples:[]};
const output=process.env.LANTERN_VISUAL_DIR??'docs/evidence/gate-c';
if(process.env.LANTERN_VISUAL_VARIANT){try{report.samples=JSON.parse(await readFile(`${output}/visual-captures.json`,'utf8')).samples.filter(s=>s.variant!==process.env.LANTERN_VISUAL_VARIANT);}catch{}}
const builds=new Map();
await mkdir(output,{recursive:true});
try{
 for(const variant of (process.env.LANTERN_VISUAL_VARIANT?[process.env.LANTERN_VISUAL_VARIANT]:['before','after']))for(const width of [1440,390])for(const scene of ['town','meadow','interior','shrine','forest','cavern','quarry','tower','sanctum']){
  const g=domain.fresh();g.scene=scene;g.x=scene==='interior'?500:625;g.y=scene==='interior'?610:640;g.xp=1347;
  Object.assign(g.flags,{talked:true,won:true,lit:true,thorn:true,root:true,caveRunes:true,woodlandLit:true,towerRunes:true});Object.assign(g.inventory,{sunseed:1,mossSeal:1,towerKey:1});g.cleared=['clearing','thorn','root'];const st=domain.stats(g);g.hp=st.hp;g.mp=st.mp;if(!domain.validGame(g))throw Error('Invalid visual checkpoint');
  const context=await browser.newContext({viewport:{width,height:width<600?844:1000},deviceScaleFactor:width<600?2:1,hasTouch:width<600,isMobile:width<600});const page=await context.newPage();
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  await page.addInitScript(({g,lang})=>{localStorage.setItem('lantern-v2-auto',JSON.stringify(g));localStorage.setItem('lantern-preferences',JSON.stringify({lang,reduced:false}));},{g,lang:width<600?'zh-TW':'en'});
  await page.goto(variant==='before'?(process.env.LANTERN_VISUAL_REFERENCE??'http://127.0.0.1:8091/'):(process.env.LANTERN_VISUAL_CANDIDATE??'http://127.0.0.1:8092/'));await page.locator('[data-command=continue]').click();await expect(page.locator('#panel')).not.toBeVisible();await expect(page.locator('#scene-loading')).not.toBeVisible();await page.clock.runFor(2000);
  if(!builds.has(variant)){const src=await page.locator('script[type=module]').getAttribute('src'),url=new URL(src,page.url()).href,data=await(await fetch(url)).arrayBuffer();builds.set(variant,{file:src,sha256:createHash('sha256').update(Buffer.from(data)).digest('hex')});}
  const name=`visual-${variant}-${scene}-${width}`;await page.locator('#world').screenshot({path:`${output}/${name}.png`});if(scene==='town'||scene==='cavern')await page.screenshot({path:`${output}/${name}-full.png`,fullPage:true});
  report.samples.push({variant,width,scene,build:builds.get(variant),metrics:await page.evaluate(()=>window.__lantern().metrics)});await context.close();console.log(name);
 }
 await writeFile(`${output}/visual-captures.json`,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
