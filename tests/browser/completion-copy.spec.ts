import {test,expect} from '@playwright/test';
import {fresh,stats,validGame} from '../../src/domain';
for(const zh of [false,true])test(`second-light confirmation follows the current journal in ${zh?'zh-TW':'English'}`,async({page:p})=>{
  // A valid stable checkpoint isolates this presentation check. Full campaign
  // playthrough evidence is supplied separately without progress injection.
  const g=fresh();Object.assign(g,{scene:'forest',x:730,y:420,xp:757,serial:10});Object.assign(g.flags,{talked:true,won:true,lit:true,thorn:true,root:true,caveRunes:true,travelGift:true});Object.assign(g.inventory,{sunseed:1,mossSeal:1});g.cleared=['clearing','thorn','root'];g.hp=stats(g).hp;g.mp=stats(g).mp;expect(validGame(g)).toBe(true);
  await p.addInitScript(({game,zh})=>{localStorage.setItem('lantern-v2-auto',JSON.stringify(game));if(zh)localStorage.setItem('lantern-preferences',JSON.stringify({lang:'zh-TW'}));},{game:g,zh});
  await p.setViewportSize(zh?{width:390,height:844}:{width:1440,height:1000});await p.goto('./');await p.locator('[data-command=continue]').click();await expect(p.locator('#panel')).not.toBeVisible();
  await p.locator('#explore').click();await p.locator('[data-destination=woodlandBeacon]').click();await expect(p.locator('#panel')).toHaveClass('panel-complete');
  await expect(p.locator('#panel .fine')).toContainText(zh?'手札':'journal');await expect(p.locator('#panel .fine')).not.toContainText(zh?'草甸聖壇':'Meadow Shrine');expect((await p.evaluate(()=>window.__lantern())).game.flags.woodlandLit).toBe(true);
  await p.screenshot({path:`docs/evidence/campaign-woodland-light-${zh?'phone-zh-TW':'desktop-en'}.png`,fullPage:true});
});
