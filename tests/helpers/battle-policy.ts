/** Transparent review policy, not a gameplay feature or a first-time-player model. */
import {enemies,type Battle,type Action} from '../../src/domain';
export function reviewAction(b:Battle):Action {
  const e=enemies[b.enemy],heal=b.heroLevel>=7?'greaterMend':'mend',cost=b.heroLevel>=7?8:4;
  const expected=Math.max(1,e.attack+(b.phase2?4:0)-Math.floor(b.defense*.55)+2);
  const guardedHeavy=Math.max(1,Math.floor((Math.ceil(e.attack*1.7)+(b.phase2?4:0)-Math.floor(b.defense*.55)+2)*.35));
  if(b.charged&&b.hp>guardedHeavy+1)return 'guard';
  if(b.hp<b.maxHp*.58){
    if(b.mp>=cost)return heal;
    if(b.ethers>0&&b.hp>expected+2)return 'ether';
    if(b.tonics>0)return 'tonic';
  }
  if(b.mp<cost&&b.ethers>0&&b.hp>expected+3)return 'ether';
  if(e.boss&&b.heroLevel>=3&&b.ward===0&&b.mp>=cost+4&&b.hp>b.maxHp*.7)return 'ward';
  return 'attack';
}
