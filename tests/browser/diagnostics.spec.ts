import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
test.use({hasTouch:true});

test('normal gameplay does not load or mount optional diagnostics',async({page})=>{
  const requests:string[]=[];page.on('request',r=>requests.push(r.url()));await page.goto('./');await page.locator('[data-command=begin]').click();await expect(page.locator('#panel')).not.toBeVisible();
  expect(await page.locator('#diagnostic-launch').count()).toBe(0);expect(requests.some(s=>/\/diagnostics-[^/]+\.(js|css)/.test(s))).toBe(false);
});

test('diagnostics export on a narrow touch-emulated layout without leaking saves',async({page})=>{
  await page.setViewportSize({width:320,height:844});await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{get:()=>undefined}));
  await page.goto('./?diagnostics=1');await page.locator('#hero-input').fill('PRIVATE-COURIER');await page.locator('[data-command=begin]').click();await expect(page.locator('#panel')).not.toBeVisible();
  await page.locator('#diagnostic-launch').tap();await page.locator('[data-diagnostic=device]').selectOption('emulated');const typing=await page.evaluate(()=>window.__lantern().game);await page.locator('[data-diagnostic=notes]').press('ArrowRight',{delay:200});expect((await page.evaluate(()=>window.__lantern().game)).x).toBe(typing.x);await page.locator('[data-diagnostic=notes]').fill('wasd');
  const before=await page.evaluate(()=>window.__lantern().game);await page.locator('[data-diagnostic=start]').tap();await page.locator('#world').focus();await page.keyboard.down('d');await page.waitForTimeout(700);await page.keyboard.up('d');await page.waitForTimeout(400);
  await page.locator('#settings').click();await page.waitForTimeout(200);await page.locator('#panel [data-command=language]').click();await page.locator('#panel .diagnostic-modal-launch').click();
  await expect(page.locator('#diagnostic-title')).toHaveText('遊玩診斷');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const state=await page.evaluate(()=>window.__lantern().game);expect(state.x).toBeGreaterThan(before.x);expect(state.flags).toEqual(before.flags);expect(state.inventory).toEqual(before.inventory);
  await page.locator('[data-diagnostic=copy]').click();await expect(page.locator('[data-diagnostic=status]')).toHaveText('剪貼簿無法使用。請選取下方結果或下載 JSON。');
  const raw=await page.locator('[data-diagnostic=output]').inputValue(),data=JSON.parse(raw);expect(raw).not.toContain('PRIVATE-COURIER');expect(raw).not.toContain('lantern-v2');expect(data.ownerReport.device).toBe('emulated');expect(data.ownerReport.canvasAcceleration).toBe('unknown');expect(data.environment.physicalHardwareVerifiedByAutomation).toBe(false);expect(data.samples[0].summary.frames).toBeGreaterThan(0);expect(data.samples[0].buckets.some((b:{state:{mode:string}})=>b.state.mode==='panel-settings')).toBe(true);expect(data.samples[0].memory[0].totalNativeOrProcessMemoryBytes).toBeNull();
  const audit=await new AxeBuilder({page}).include('#diagnostic-panel').analyze();expect(audit.violations).toEqual([]);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-diagnostic=download]').click()]);const file=await download.path();expect(JSON.parse(await readFile(file!,'utf8')).schema).toBe('last-lantern-diagnostics-v1');
  await page.locator('[data-diagnostic=close]').click();await page.locator('#panel [data-command=close]').click();await page.locator('#world').focus();await page.keyboard.down('a');await page.waitForTimeout(250);await page.keyboard.up('a');expect((await page.evaluate(()=>window.__lantern().game)).x).toBeLessThan(state.x);
});

test('diagnostic capture finishes automatically and stays available over battle dialogs',async({page})=>{
  test.setTimeout(120000);await page.goto('./?diagnostics=1');await page.locator('[data-command=begin]').click();await page.locator('#explore').click();await page.locator('[data-destination=meadow]').click();await expect(page.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});await page.locator('#explore').click();await page.locator('[data-destination=clearing]').click();await expect(page.locator('.battle-stage')).toHaveAttribute('data-ready','true',{timeout:30000});
  await page.locator('#panel .diagnostic-modal-launch').click();await page.locator('[data-diagnostic=start]').click();await page.locator('[data-action=attack]').click();await page.waitForTimeout(61000);await page.locator('#panel .diagnostic-modal-launch').click();await page.locator('[data-diagnostic=copy]').click();
  const data=JSON.parse(await page.locator('[data-diagnostic=output]').inputValue());expect(data.samples[0].reason).toBe('duration-completed');expect(data.samples[0].durationMs).toBeGreaterThanOrEqual(60000);expect(data.samples[0].buckets.some((b:{state:{mode:string}})=>b.state.mode==='battle')).toBe(true);await page.locator('[data-diagnostic=close]').click();await expect(page.locator('[data-action=attack]')).toBeEnabled();
});
