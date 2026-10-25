// Actual optional-tool UI / export demonstration, not physical-device FPS evidence.
import {chromium,expect} from '@playwright/test';
import {chromiumOptions} from './chromium-options.mjs';
import {writeFile} from 'node:fs/promises';
const target=process.env.LANTERN_DIAGNOSTIC_URL??'http://127.0.0.1:8096/',out='docs/evidence/gate-c-followup';
const browser=await chromium.launch(chromiumOptions);
try{
 for(const phone of [false,true]){
  const context=await browser.newContext({viewport:{width:phone?390:1440,height:phone?844:1000},deviceScaleFactor:phone?2:1,hasTouch:phone,isMobile:phone}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(target+'?diagnostics=1');await page.locator('[data-command=begin]').click();await expect(page.locator('#panel')).not.toBeVisible();if(phone)await page.locator('#language').tap();
  await page.locator('#diagnostic-launch').click();await page.locator('[data-diagnostic=device]').selectOption('emulated');await page.locator('[data-diagnostic=notes]').fill(phone?'自動化雲端版面與匯出示範，並非實體手機效能驗證。':'Automated cloud UI/export demonstration, not physical-device validation.');await page.locator('[data-diagnostic=start]').click();
  if(phone){for(const dir of ['right','left','right','left']){await page.locator(`[data-dir=${dir}]`).tap();await page.waitForTimeout(250);}}
  else{await page.locator('#world').focus();await page.keyboard.down('d');await page.waitForTimeout(600);await page.keyboard.up('d');}
  await page.waitForTimeout(1500);const label=phone?'phone-zh-TW':'desktop-en';await page.screenshot({path:`${out}/diagnostic-live-${label}.png`,fullPage:true});
  await page.locator('#diagnostic-launch').click();await page.locator('[data-diagnostic=probe]').click();await page.locator('[data-diagnostic=copy]').click();const raw=await page.locator('[data-diagnostic=output]').inputValue();const data=JSON.parse(raw);expect(data.ownerReport.device).toBe('emulated');expect(data.environment.physicalHardwareVerifiedByAutomation).toBe(false);expect(data.environment.runtimeFile).toBeTruthy();await writeFile(`${out}/diagnostic-demo-${label}.json`,raw+'\n');
  await page.locator('#diagnostic-panel').evaluate(d=>{d.scrollTop=0;});await page.screenshot({path:`${out}/diagnostic-panel-${label}.png`,fullPage:true});await page.locator('[data-diagnostic=context]').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/diagnostic-results-${label}.png`,fullPage:true});expect(errors).toEqual([]);await context.close();
 }
}finally{await browser.close();}
