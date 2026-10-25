import {test,expect,type Page,type Locator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile} from 'node:fs/promises';

const state=(p:Page)=>p.evaluate(()=>window.__lantern());
async function activate(p:Page,locator:Locator){
  if(await p.evaluate(()=>navigator.maxTouchPoints>0))await locator.tap();else await locator.click();
}
async function begin(p:Page,zh=false){
  await p.goto('./');
  await p.getByRole('button',{name:'Begin your journey',exact:true}).waitFor();
  if(zh)await p.locator('#panel [data-command=language]').click();
  await p.locator('[data-command=begin]').click();
  await expect(p.locator('#panel')).not.toBeVisible();
  await p.waitForTimeout(450); // Capture after the real scene-entry fade completes.
}
async function visit(p:Page,id:string){
  await activate(p,p.locator('#explore'));
  await activate(p,p.locator(`[data-destination="${id}"]`));
}
async function endDialogue(p:Page){
  await expect(p.locator('#panel')).toHaveClass('panel-dialogue',{timeout:20000});
  while(await p.locator('[data-command=next-line]').isVisible()){
    await activate(p,p.locator('[data-command=next-line]'));
  }
}
async function winBattle(p:Page){
  await expect(p.locator('#panel')).toHaveClass('panel-battle',{timeout:30000});
  await p.locator('[data-command=pause-battle]').click();
  await p.locator('[data-command=close]').click();
  let rounds=0;
  while((await state(p)).battle?.outcome==='active'&&rounds++<20){
    const b=(await state(p)).battle!;
    if(b.hp<14&&b.mp>=4){await activate(p,p.locator('[data-command=magic]'));await activate(p,p.locator('[data-action=mend]'));}
    else if(b.charged)await activate(p,p.locator('[data-action=guard]'));
    else if(rounds===1)await activate(p,p.locator('[data-action=attack]'));
    else if(b.mp>=3){await activate(p,p.locator('[data-command=magic]'));await activate(p,p.locator('[data-action=ember]'));}
    else await activate(p,p.locator('[data-action=attack]'));
    await expect.poll(async()=>(await state(p)).busy).toBe(false);
  }
  await expect(p.locator('#panel')).toHaveClass('panel-result');
  expect((await state(p)).battle?.outcome).toBe('victory');
}

for(const zh of [false,true]){
  test(`complete Gate A via rendered ${zh?'Traditional Chinese touch':'English desktop'} interactions`,async({browser})=>{
    const context=await browser.newContext({viewport:zh?{width:390,height:844}:{width:1440,height:1000},hasTouch:zh,isMobile:zh,recordVideo:{dir:'test-results/videos',size:zh?{width:390,height:844}:{width:960,height:667}}});
    const p=await context.newPage(),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
    await begin(p,zh);
    await p.screenshot({path:`docs/evidence/gameplay-${zh?'390-zh-TW':'1440-en'}.png`,fullPage:true});
    // Actual input, not direct state injection. Touch walk buttons are held via pointer events.
    const before=(await state(p)).game;
    if(zh){
      const button=p.locator('[data-dir=right]'),box=(await button.boundingBox())!;
      await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    }else{await p.locator('#world').focus();await p.keyboard.down('d');await p.waitForTimeout(300);await p.keyboard.up('d');}
    expect((await state(p)).game.x).toBeGreaterThan(before.x);
    await visit(p,'mira');await expect(p.locator('#panel')).toHaveClass('panel-dialogue',{timeout:20000});
    await p.screenshot({path:`docs/evidence/dialogue-${zh?'390-zh-TW':'1440-en'}.png`,fullPage:true});
    await activate(p,p.locator('[data-command=next-line]'));
    await p.screenshot({path:`docs/evidence/dialogue-thoughtful-${zh?'390-zh-TW':'1440-en'}.png`,fullPage:true});
    await endDialogue(p);expect((await state(p)).game.flags.talked).toBe(true);
    await visit(p,'cottage');await expect(p.locator('html')).toHaveAttribute('data-scene','interior',{timeout:20000});
    await p.waitForTimeout(450);
    await p.screenshot({path:`docs/evidence/interior-${zh?'390-zh-TW':'1440-en'}.png`,fullPage:true});
    await visit(p,'notes');await endDialogue(p);await visit(p,'rest');await endDialogue(p);
    await visit(p,'outside');await expect(p.locator('html')).toHaveAttribute('data-scene','town',{timeout:20000});
    await visit(p,'chest');await endDialogue(p);expect((await state(p)).game.tonics).toBe(3);
    await visit(p,'meadow');await expect(p.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});
    // Accessible point-to-walk navigation follows the same collision geometry.
    await visit(p,'clearing');
    await expect(p.locator('#panel')).toHaveClass('panel-battle',{timeout:30000});
    await expect(p.locator('.battle-stage')).toHaveAttribute('data-ready','true');
    expect(Math.round((await p.locator('#panel').boundingBox())!.width)).toBe(p.viewportSize()!.width);
    await p.screenshot({path:`docs/evidence/battle-${zh?'390-zh-TW':'1440-en'}.png`,fullPage:true});
    await winBattle(p);await p.locator('[data-command=battle-done]').click();
    await visit(p,'beacon');await expect(p.locator('#panel')).toHaveClass('panel-complete',{timeout:20000});
    await p.screenshot({path:`docs/evidence/completed-${zh?'390-zh-TW':'1440-en'}.png`,fullPage:true});
    expect((await state(p)).game.flags.lit).toBe(true);
    await p.locator('[data-command=complete-done]').click();
    await p.locator('#settings').click();await p.locator('[data-save="1"]').click();
    const saved=(await state(p)).game;
    await p.locator('[data-command=close]').click();
    await p.reload();await p.locator('[data-command=continue]').click();await expect(p.locator('#panel')).not.toBeVisible();
    const reloaded=(await state(p)).game;
    expect(reloaded.flags).toEqual(saved.flags);expect(reloaded.seed).toBe(saved.seed);
    expect(reloaded.coins).toBe(saved.coins);expect(reloaded.tonics).toBe(saved.tonics);
    // Switching language mid-journey retains meaningful state.
    await p.locator('#language').click();expect((await state(p)).game.flags).toEqual(saved.flags);
    await p.locator('#journal').click();
    await expect(p.locator('.quest-list .done')).toHaveCount(4);
    const axe=await new AxeBuilder({page:p}).analyze();
    await writeFile(`docs/evidence/axe-${zh?'phone':'desktop'}.json`,JSON.stringify({violations:axe.violations,incomplete:axe.incomplete.map(x=>({id:x.id,impact:x.impact})),passes:axe.passes.length},null,2));
    expect(axe.violations).toEqual([]);expect(errors).toEqual([]);
    await context.close();
    await p.video()!.saveAs(`docs/evidence/playthrough-${zh?'phone-zh-TW':'desktop-en'}.webm`);
  });
}

test('defeat returns home, keeps discoveries, and supports retry',async({page:p})=>{
  await begin(p);await p.locator('#settings').click();await p.locator('[data-pref=reduced]').check();await p.locator('[data-command=close]').click();
  await visit(p,'chest');await endDialogue(p);await visit(p,'meadow');
  await expect(p.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});
  await visit(p,'clearing');await expect(p.locator('#panel')).toHaveClass('panel-battle',{timeout:30000});
  for(let n=0;n<40&&(await state(p)).battle?.outcome==='active';n++){
    await p.locator('[data-action=guard]').click();await expect.poll(async()=>(await state(p)).busy).toBe(false);
  }
  expect((await state(p)).battle?.outcome).toBe('defeat');
  await p.locator('[data-command=battle-done]').click();
  const g=(await state(p)).game;expect(g.scene).toBe('interior');expect(g.hp).toBe(36);expect(g.flags.chest).toBe(true);expect(g.coins).toBe(17);
  await visit(p,'outside');await expect(p.locator('html')).toHaveAttribute('data-scene','town',{timeout:20000});
  await visit(p,'meadow');await expect(p.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});
  await visit(p,'clearing');await expect(p.locator('#panel')).toHaveClass('panel-battle',{timeout:30000});
  await winBattle(p);expect((await state(p)).game.flags.won).toBe(true);
});

for(const width of [320,390,768,1440])test(`responsive, bilingual, larger text and accessible settings at ${width}px`,async({page:p})=>{
  await p.setViewportSize({width,height:width<600?844:1000});await begin(p);
  for(const zh of [false,true]){
    if(zh)await p.locator('#language').click();
    await p.locator('#settings').click();await p.locator('[data-pref=large]').check();
    const axe=await new AxeBuilder({page:p}).analyze();
    expect(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const buttons=await p.locator('#panel button:visible').evaluateAll(list=>list.map(b=>{const r=b.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,right:r.right};}));
    expect(buttons.every(r=>r.width>=35&&r.height>=35&&r.x>=0&&r.right<=width)).toBe(true);
    await p.screenshot({path:`docs/evidence/settings-${width}-${zh?'zh-TW':'en'}.png`,fullPage:true});
    await p.locator('[data-command=close]').click();
    await p.screenshot({path:`docs/evidence/layout-${width}-${zh?'zh-TW':'en'}.png`,fullPage:true});
  }
});

test('corrupt autosave is kept intact; manual saving and reload recovery work',async({page:p})=>{
  await p.addInitScript(()=>localStorage.setItem('lantern-v2-auto','{broken save'));
  await p.goto('./');await expect(p.locator('.warning')).toBeVisible();await p.locator('[data-command=begin]').click();
  await p.locator('#settings').click();await p.locator('[data-save="1"]').click();
  expect(await p.evaluate(()=>localStorage.getItem('lantern-v2-auto'))).toBe('{broken save');
  expect(await p.evaluate(()=>JSON.parse(localStorage.getItem('lantern-v2-1')!).version)).toBe(2);
  await p.locator('[data-load="1"]').click();await p.locator('[data-command=confirm]').click();
  await expect(p.locator('#panel')).not.toBeVisible();expect((await state(p)).game.hp).toBe(36);
});

test('blocked storage allows a session and explains that saving is unavailable',async({page:p})=>{
  await p.addInitScript(()=>{
    Storage.prototype.getItem=()=>{throw new DOMException('Storage blocked','SecurityError');};
    Storage.prototype.setItem=()=>{throw new DOMException('Storage blocked','SecurityError');};
  });
  await begin(p);await expect(p.locator('#toast')).toContainText('Saving is unavailable');
  await visit(p,'mira');await endDialogue(p);expect((await state(p)).game.flags.talked).toBe(true);
});

test('keyboard focus, pause and project-subpath assets remain usable',async({page:p})=>{
  const failed:string[]=[];p.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
  await begin(p);await p.locator('#world').focus();await p.keyboard.press('Escape');
  await expect(p.locator('#panel')).toHaveClass('panel-settings');
  const before=(await state(p)).game;await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);
  expect((await state(p)).game.x).toBe(before.x);
  await p.keyboard.press('Tab');expect(await p.locator('#panel').evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await p.keyboard.press('Escape');await expect(p.locator('#panel')).not.toBeVisible();
  expect(failed).toEqual([]);
});

test('save/load, overwrite cancellation and new-journey confirmation preserve progress',async({page:p})=>{
  await begin(p);await p.locator('#settings').click();await p.locator('[data-save="2"]').click();
  const saved=await p.evaluate(()=>localStorage.getItem('lantern-v2-2'));
  await p.locator('[data-command=close]').click();await p.locator('#world').focus();
  await p.keyboard.down('d');await p.waitForTimeout(500);await p.keyboard.up('d');
  await p.locator('#settings').click();await p.locator('[data-save="2"]').click();
  await expect(p.locator('#panel')).toHaveClass('panel-confirm');await p.locator('[data-command=cancel-confirm]').click();
  expect(await p.evaluate(()=>localStorage.getItem('lantern-v2-2'))).toBe(saved);
  await p.locator('[data-load="2"]').click();await p.locator('[data-command=confirm]').click();await expect(p.locator('#panel')).not.toBeVisible();
  expect((await state(p)).game.x).toBe(JSON.parse(saved!).x);
  await p.reload();await p.locator('[data-command=begin]').click();
  await expect(p.locator('#panel')).toHaveClass('panel-confirm');
  const auto=await p.evaluate(()=>localStorage.getItem('lantern-v2-auto'));
  await p.locator('[data-command=cancel-confirm]').click();
  await expect(p.locator('#panel')).toHaveClass('panel-start');
  expect(await p.evaluate(()=>localStorage.getItem('lantern-v2-auto'))).toBe(auto);
  expect(await p.evaluate(()=>localStorage.getItem('lantern-v2-2'))).toBe(saved);
});

test('production character atlas contains distinct articulated frames in all eight directions',async({page:p})=>{
  await begin(p);
  const result=await p.evaluate(async()=>{
    const m=await (await fetch('./art3d/runtime.json')).json();
    const image=new Image();image.src='./art3d/rowan-walk.webp';await image.decode();
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d')!;
    const directions=Object.values(m.walk) as Array<Array<{x:number;y:number;w:number;h:number}>>;
    return {directions:directions.length,unique:directions.map(frames=>{
      const hashes=frames.map(f=>{ctx.clearRect(0,0,256,256);ctx.drawImage(image,f.x,f.y,f.w,f.h,0,0,256,256);
        const pixels=ctx.getImageData(0,0,256,256).data;let hash=2166136261,opaque=0;
        for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i]>100)opaque++;}
        if(opaque<1000)throw Error('Empty character frame');return hash;});return new Set(hashes).size;
    }),poseLengths:Object.fromEntries(Object.entries(m.poses).map(([name,pose])=>[name,(pose as {frames:unknown[]}).frames.length]))};
  });
  expect(result.directions).toBe(8);expect(result.unique.every(n=>n>=7)).toBe(true);
  expect(result.poseLengths).toEqual({attack:8,cast:8,guard:1,hurt:1,victory:1});
});

for(const touch of [false,true])test(`inverse scene projection supports ${touch?'touch':'mouse'} ground traversal`,async({browser})=>{
  const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1440,height:1000},hasTouch:touch,isMobile:touch});
  const p=await context.newPage();await begin(p);const before=await state(p),foot=before.metrics.heroScreen;
  if(touch)await p.touchscreen.tap(foot.x+60,foot.y+20);else await p.mouse.click(foot.x+60,foot.y+20);
  await expect.poll(async()=>(await state(p)).game.x,{timeout:10000}).toBeGreaterThan(before.game.x+30);
  expect((await state(p)).game.y).toBeGreaterThan(before.game.y);expect((await state(p)).panel).toBe(null);
  await context.close();
});
