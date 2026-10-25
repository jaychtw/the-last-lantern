import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile} from 'node:fs/promises';
test('narrow battle keeps larger-text commands below status in both languages',async({page:p})=>{
  test.setTimeout(120000);await p.setViewportSize({width:320,height:844});await p.goto('./');await p.locator('[data-command=begin]').click();await expect(p.locator('#panel')).not.toBeVisible();
  await p.setViewportSize({width:568,height:320});await p.waitForTimeout(200);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const hero=(await p.evaluate(()=>window.__lantern().metrics)).heroScreen,card=(await p.locator('.hero-card').boundingBox())!;expect(hero.x<card.x||hero.x>card.x+card.width).toBe(true);
  await p.screenshot({path:'docs/evidence/phone-compact-landscape.png',fullPage:true});await p.setViewportSize({width:320,height:844});
  await p.locator('#settings').click();await p.locator('[data-pref=large]').check();await p.locator('[data-command=close]').click();
  const visit=async(id:string)=>{await p.locator('#explore').click();await p.locator(`[data-destination="${id}"]`).click();};
  await visit('meadow');await expect(p.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});await visit('clearing');await expect(p.locator('#panel')).toHaveClass('panel-battle',{timeout:30000});
  const audits=[];
  for(const zh of [false,true]){
    if(zh){await p.locator('[data-command=pause-battle]').click();await p.locator('[data-command=language]').click();await p.locator('[data-command=close]').click();}
    const status=(await p.locator('.turn-status').boundingBox())!,commands=(await p.locator('.battle-commands').boundingBox())!;
    expect(commands.y).toBeGreaterThanOrEqual(status.y+status.height+2);
    const actions=p.locator('.battle-commands>button');await expect(actions).toHaveCount(6);
    for(const button of await actions.all()){await expect(button).toBeInViewport({ratio:.9});const r=(await button.boundingBox())!;expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);expect(r.x+r.width).toBeLessThanOrEqual(320);}
    expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await p.screenshot({path:`docs/evidence/battle-320-large-${zh?'zh-TW':'en'}.png`,fullPage:true});const audit=await new AxeBuilder({page:p}).analyze();expect(audit.violations).toEqual([]);audits.push({lang:zh?'zh-TW':'en',violations:audit.violations,incomplete:audit.incomplete.map(v=>v.id),passes:audit.passes.length});
  }
  await p.setViewportSize({width:568,height:320});await p.waitForTimeout(200);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const button of await p.locator('.battle-commands>button').all()){await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport({ratio:.9});}
  await p.screenshot({path:'docs/evidence/battle-compact-landscape.png',fullPage:true});
  await writeFile('docs/evidence/battle-narrow-axe.json',JSON.stringify(audits,null,2)+'\n');
});
