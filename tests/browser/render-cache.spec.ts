import {test,expect} from '@playwright/test';

test('reduced-motion pixels remain stable while input, resize and language stay live',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');await page.locator('[data-command=begin]').click();await expect(page.locator('#panel')).not.toBeVisible();await page.waitForTimeout(150);
  const start=await page.evaluate(()=>window.__lantern()),still=await page.locator('#world canvas').evaluate(c=>(c as HTMLCanvasElement).toDataURL());await page.waitForTimeout(1000);const idle=await page.evaluate(()=>window.__lantern());
  expect(await page.locator('#world canvas').evaluate(c=>(c as HTMLCanvasElement).toDataURL())).toBe(still);expect(idle.game.playtime).toBeGreaterThan(start.game.playtime+.7);
  await page.locator('#world').focus();await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');await page.waitForTimeout(100);
  const moved=await page.evaluate(()=>window.__lantern());expect(moved.game.x).toBeGreaterThan(start.game.x);
  const before=await page.locator('#world canvas').evaluate(c=>(c as HTMLCanvasElement).toDataURL());await page.locator('#settings').click();await page.locator('[data-command=language]').click();await page.locator('[data-command=close]').click();await page.waitForTimeout(100);expect(await page.locator('#world canvas').evaluate(c=>(c as HTMLCanvasElement).toDataURL())).toBe(before);
  await page.setViewportSize({width:768,height:1000});await expect.poll(()=>page.evaluate(()=>window.__lantern().metrics.viewport.width)).toBe(768);
});

test('battle backdrop survives action phases and refreshes on resize',async({page})=>{
  await page.goto('./');await page.locator('[data-command=begin]').click();await page.locator('#explore').click();await page.locator('[data-destination=meadow]').click();await expect(page.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});
  await page.locator('#explore').click();await page.locator('[data-destination=clearing]').click();await expect(page.locator('.battle-stage')).toHaveAttribute('data-ready','true',{timeout:30000});
  const first=await page.evaluate(()=>window.__lantern());expect(first.metrics.battleBackgroundBytes).toBeGreaterThan(0);
  await page.locator('[data-action=attack]').click();await expect.poll(()=>page.evaluate(()=>window.__lantern().busy)).toBe(false);
  const after=await page.evaluate(()=>window.__lantern());expect(after.metrics.battleBackgroundBuilds).toBe(first.metrics.battleBackgroundBuilds);expect(after.battle!.enemyHp).toBeLessThan(first.battle!.enemyHp);
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>window.__lantern().metrics.battleBackgroundBuilds)).toBeGreaterThan(first.metrics.battleBackgroundBuilds);expect((await page.evaluate(()=>window.__lantern())).metrics.battleBackgroundBytes).toBeLessThan(first.metrics.battleBackgroundBytes);
});
