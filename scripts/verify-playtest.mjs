import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {existsSync} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';

const url=process.env.LANTERN_PLAYTEST_URL??'http://127.0.0.1:8090/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const report={target:url,artifact:JSON.parse(await readFile('docs/evidence/build-manifest.json','utf8')).archive_sha256,publicDeployment:false,checks:[],audits:[]};
try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('[data-command=begin]').tap();
  await expect(page.locator('#panel')).not.toBeVisible();report.checks.push('Packaged build starts into the exploration scene.');
  for(const lang of ['en','zh-TW']){
    if(lang==='zh-TW')await page.locator('#language').tap();
    const audit=await new AxeBuilder({page}).analyze();
    report.audits.push({state:'exploration',lang,violations:audit.violations,incomplete:audit.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),passes:audit.passes.length});
    expect(audit.violations).toEqual([]);
  }
  await page.locator('#language').tap();
  await page.setViewportSize({width:844,height:390});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'docs/evidence/phone-landscape.png',fullPage:true});
  report.checks.push('844×390 landscape has no horizontal overflow; the page scrolls vertically to controls. Portrait remains recommended for this candidate.');
  await page.setViewportSize({width:390,height:844});
  async function visit(id){await page.locator('#explore').tap();await page.locator(`[data-destination="${id}"]`).tap();}
  await visit('meadow');await expect(page.locator('html')).toHaveAttribute('data-scene','meadow',{timeout:30000});
  await visit('clearing');await expect(page.locator('#panel')).toHaveClass('panel-battle',{timeout:30000});
  for(const lang of ['en','zh-TW']){
    if(lang==='zh-TW'){
      await page.locator('[data-command=pause-battle]').tap();await page.locator('[data-command=language]').tap();await page.locator('[data-command=close]').tap();
    }
    const audit=await new AxeBuilder({page}).analyze();
    report.audits.push({state:'battle',lang,violations:audit.violations,incomplete:audit.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),passes:audit.passes.length});
    expect(audit.violations).toEqual([]);
  }
  await page.locator('[data-action=attack]').tap();await expect.poll(async()=>page.evaluate(()=>window.__lantern().busy)).toBe(false);
  const current=await page.evaluate(()=>window.__lantern());
  expect(current.battle.enemyHp).toBeLessThan(34);expect(current.battle.hp).toBeLessThan(36);
  expect(current.battle.logs.some(l=>l.key==='strike')).toBe(true);expect(current.battle.logs.some(l=>l.key==='enemyHit')).toBe(true);
  report.checks.push('Touch navigation reaches the contact encounter, live language switching preserves battle, and Attack resolves both sides with domain logs.');
  expect(errors).toEqual([]);report.checks.push('No page exceptions.');
  await context.close();
  await writeFile('docs/evidence/playtest-verification.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({checks:report.checks,audits:report.audits.map(a=>({state:a.state,lang:a.lang,violations:a.violations.length,incomplete:a.incomplete.map(i=>i.id)}))},null,2));
}finally{await browser.close();}
