import {test,expect,type Page,type Locator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile} from 'node:fs/promises';
import {items,spells,type Scene,stats} from '../../src/domain';
import {reviewAction} from '../helpers/battle-policy';
const state=(p:Page)=>p.evaluate(()=>window.__lantern());
for(const zh of [false,true])test(`complete Gate B campaign with ${zh?'Traditional Chinese touch':'English desktop'} inputs`,async({browser})=>{
  test.setTimeout(900000);
  const context=await browser.newContext({viewport:zh?{width:390,height:844}:{width:1440,height:1000},hasTouch:zh,isMobile:zh,recordVideo:{dir:'test-results/campaign-video',size:zh?{width:312,height:675}:{width:720,height:500}}});
  const p=await context.newPage();p.setDefaultTimeout(15000);const errors:string[]=[],failed:string[]=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  const press=async(l:Locator)=>{if(zh)await l.tap();else await l.click();};
  const command=async(k:string)=>press(p.locator(`[data-command="${k}"]`));
  const close=()=>command('close');
  const snap=async(name:string)=>{await p.waitForTimeout(400);await p.screenshot({path:`docs/evidence/campaign-${name}-${zh?'phone-zh-TW':'desktop-en'}.png`,fullPage:true});};
  async function visit(id:string){await press(p.locator('#explore'));await press(p.locator(`[data-destination="${id}"]`));}
  async function arrive(scene:Scene){await expect(p.locator('html')).toHaveAttribute('data-scene',scene,{timeout:40000});}
  async function dialogue(){await expect(p.locator('#panel')).toHaveClass('panel-dialogue',{timeout:30000});while(await p.locator('[data-command=next-line]').isVisible())await command('next-line');}
  async function battle(){
    await expect(p.locator('#panel')).toHaveClass('panel-battle',{timeout:30000});let turns=0;
    while((await state(p)).battle?.outcome==='active'&&turns++<100){
      const b=(await state(p)).battle!,action=reviewAction(b);
      if(action in spells)await command('magic');
      await press(p.locator(`[data-action="${action}"]`));await expect.poll(async()=>(await state(p)).busy,{timeout:10000}).toBe(false);
    }
    const b=(await state(p)).battle!;expect(b.outcome,`${b.encounter} failed after ${turns} turns`).toBe('victory');await command('battle-done');
  }
  async function fight(id:string){await visit(id);if(id==='guardian'&&(await state(p)).panel==='dialogue')await dialogue();await battle();}
  async function prepare(){
    await visit('cottage');await arrive('interior');await visit('rest');await dialogue();await visit('outside');await arrive('town');
    await visit('smith');await expect(p.locator('#panel')).toHaveClass('panel-shop',{timeout:30000});
    let g=(await state(p)).game;
    for(const slot of ['weapon','armour','accessory'] as const){
      const current=g.equipment[slot]?items[g.equipment[slot]!]:{attack:0,defense:0};
      const best=Object.entries(items).filter(([,v])=>v.slot===slot).sort(([,a],[,b])=>b.attack+b.defense-a.attack-a.defense).find(([,v])=>v.attack+v.defense>current.attack+current.defense&&v.price<=g.coins*.6);
      if(best){await press(p.locator(`[data-buy="${best[0]}"]`));await close();await press(p.locator('#equipment'));await press(p.locator(`[data-equip="${best[0]}"]`));await close();await visit('smith');await expect(p.locator('#panel')).toHaveClass('panel-shop',{timeout:30000});g=(await state(p)).game;}
    }
    while((await state(p)).game.tonics<3&&(await state(p)).game.coins>=8)await press(p.locator('[data-buy=tonic]'));
    while((await state(p)).game.ethers<2&&(await state(p)).game.coins>=18)await press(p.locator('[data-buy=ether]'));
    await close();
  }
  async function returnTown(){
    let scene=(await state(p)).game.scene;
    if(scene==='sanctum'){await visit('tower');await arrive('tower');scene='tower';}
    if(scene==='tower'){await visit('quarry');await arrive('quarry');scene='quarry';}
    if(scene==='quarry'){await visit('forest');await arrive('forest');scene='forest';}
    if(scene==='cavern'){await visit('forest');await arrive('forest');scene='forest';}
    if(scene==='shrine'){await visit('town');await arrive('town');return;}
    if(scene==='meadow'||scene==='forest'){await visit('town');await arrive('town');}
  }
  async function go(scene:Scene){
    await returnTown();
    if(scene==='meadow'||scene==='shrine'){await visit('meadow');await arrive('meadow');if(scene==='shrine'){await visit('shrine');await arrive('shrine');}return;}
    await visit('forest');await arrive('forest');if(scene==='forest')return;
    if(scene==='cavern'){await visit('cavern');await arrive('cavern');return;}
    await visit('quarry');await arrive('quarry');if(scene==='quarry')return;
    await visit('tower');await arrive('tower');if(scene==='sanctum'){await visit('sanctum');await arrive('sanctum');}
  }
  async function puzzle(id:string){await visit(id);await expect(p.locator('#panel')).toHaveClass('panel-puzzle',{timeout:30000});await snap('runes-'+id);
    await press(p.locator('[data-rune="1"]'));expect((await state(p)).game.runes).toEqual([]);
    for(const n of [0,1,2])await press(p.locator(`[data-rune="${n}"]`));await dialogue();
  }
  await p.goto('./');if(zh)await command('language');await command('begin');await expect(p.locator('#panel')).not.toBeVisible();
  await press(p.locator('#settings'));await p.locator('[data-pref=fast]').check();await close();
  await visit('mira');await dialogue();await visit('chest');await dialogue();await prepare();
  await go('meadow');await fight('clearing');await visit('beacon');await expect(p.locator('#panel')).toHaveClass('panel-complete',{timeout:30000});await command('complete-done');
  await fight('meadow-hopper');await visit('shrine');await arrive('shrine');await snap('shrine');await fight('shrine-hopper');await returnTown();await prepare();await go('shrine');await fight('thorn');
  await returnTown();await visit('mira');await dialogue();await prepare();await press(p.locator('#equipment'));await snap('equipment');await close();
  await go('forest');await snap('forest');await fight('forest-moth');await fight('forest-twig');await fight('forest-wisp');await visit('cavern');await arrive('cavern');await snap('cavern');await fight('cave-nibbler');await fight('cave-pebble');
  await returnTown();await prepare();await go('cavern');await puzzle('cave-runes');await visit('cave-cache');await dialogue();await fight('root');
  await visit('forest');await arrive('forest');await visit('woodlandBeacon');await expect(p.locator('#panel')).toHaveClass('panel-complete',{timeout:30000});await snap('woodland-light');await command('complete-done');
  await returnTown();await prepare();await go('quarry');await snap('quarry');await fight('quarry-pebble');await fight('quarry-ashling');await fight('quarry-eye');await puzzle('quarry-runes');await visit('quarry-cache');await dialogue();
  await returnTown();await prepare();await go('tower');await snap('tower');await fight('tower-hollow');await fight('tower-eye');await fight('tower-ashling');await visit('tower-cache');await dialogue();
  await returnTown();await prepare();await go('sanctum');await snap('sanctum');await visit('guardian');await dialogue();
  await expect(p.locator('#panel')).toHaveClass('panel-battle',{timeout:30000});await expect(p.locator('.battle-stage')).toHaveAttribute('data-ready','true');await snap('guardian');await battle();
  await visit('towerBeacon');await expect(p.locator('#panel')).toHaveClass('panel-complete',{timeout:30000});await snap('ending');expect((await state(p)).game.flags.clear).toBe(true);await command('credits');await snap('credits');await close();
  await press(p.locator('#settings'));await press(p.locator('[data-save="3"]'));const clear=(await state(p)).game;await close();await p.reload();await command('continue');await expect(p.locator('#panel')).not.toBeVisible();
  expect((await state(p)).game.flags).toEqual(clear.flags);expect((await state(p)).game.equipment).toEqual(clear.equipment);expect((await state(p)).game.inventory).toEqual(clear.inventory);expect((await state(p)).game.seed).toBe(clear.seed);
  await press(p.locator('#language'));expect((await state(p)).game.flags.clear).toBe(true);await press(p.locator('#equipment'));expect((await state(p)).game.hp).toBeLessThanOrEqual(stats((await state(p)).game).hp);
  const audit=await new AxeBuilder({page:p}).analyze();expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  await writeFile(`docs/evidence/campaign-axe-${zh?'phone':'desktop'}.json`,JSON.stringify({violations:audit.violations,incomplete:audit.incomplete.map(v=>({id:v.id,impact:v.impact})),passes:audit.passes.length},null,2)+'\n');
  expect(errors).toEqual([]);expect(failed).toEqual([]);await context.close();await p.video()!.saveAs(`docs/evidence/campaign-${zh?'phone-zh-TW':'desktop-en'}.webm`);
});

test('Gate A save migration is non-destructive in the actual browser',async({page:p})=>{
  const old={version:1,name:'Old Rowan',scene:'meadow',x:420,y:640,hp:17,mp:5,xp:18,coins:26,tonics:3,seed:123456,playtime:42,flags:{talked:true,chest:true,won:true,lit:true}};const bytes=JSON.stringify(old);
  await p.addInitScript(value=>localStorage.setItem('lantern-v1-auto',value),bytes);await p.goto('./');await p.locator('[data-command=continue]').click();await expect(p.locator('#panel')).not.toBeVisible();
  expect((await state(p)).game.name).toBe('Old Rowan');expect((await state(p)).game.hp).toBe(17);expect((await state(p)).game.flags.lit).toBe(true);
  await p.locator('#settings').click();await p.locator('[data-save="1"]').click();expect(await p.evaluate(()=>localStorage.getItem('lantern-v1-auto'))).toBe(bytes);expect(await p.evaluate(()=>JSON.parse(localStorage.getItem('lantern-v2-1')!).version)).toBe(2);
});
