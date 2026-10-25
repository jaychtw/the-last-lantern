import {enemies,encounters,items,shopStock,spawns,spells,type Scene,type EnemyId,type ItemId,type Slot,type Spell} from './content';
export {enemies,encounters,items,shopStock,spells};
export type {Scene,EnemyId,ItemId,Slot,Spell};
export type Lang='en'|'zh-TW';
export type Point={x:number;y:number};
export type Rect={x:number;y:number;w:number;h:number};
export interface Flags {talked:boolean;chest:boolean;won:boolean;lit:boolean;thorn:boolean;root:boolean;guardian:boolean;woodlandLit:boolean;towerLit:boolean;caveRunes:boolean;towerRunes:boolean;travelGift:boolean;guardianHeard:boolean;clear:boolean;}
export interface Game extends Point {
  version:2;name:string;scene:Scene;hp:number;mp:number;xp:number;coins:number;tonics:number;ethers:number;seed:number;playtime:number;
  flags:Flags;inventory:Partial<Record<ItemId,number>>;equipment:Record<Slot,ItemId|null>;cleared:string[];chests:string[];runes:number[];serial:number;
}
export const MAX_HP=36,MAX_MP=12;
export const levels=[0,30,90,170,280,400,520,680,880,1120,1400,1750];
export function level(g:Pick<Game,'xp'>){return levels.filter(n=>g.xp>=n).length;}
export function stats(g:Pick<Game,'xp'|'equipment'>){
  const l=level(g),gear=Object.values(g.equipment).filter((x):x is ItemId=>x!==null).map(x=>items[x]);
  return {level:l,hp:36+(l-1)*8,mp:12+(l-1)*2,attack:10+(l-1)*2+gear.reduce((s,v)=>s+v.attack,0),defense:5+Math.floor((l-1)*1.5)+gear.reduce((s,v)=>s+v.defense,0),speed:9+l};
}
export function fresh(name='Rowan'):Game {
  return {version:2,name,scene:'town',x:625,y:650,hp:36,mp:12,xp:0,coins:12,tonics:1,ethers:1,seed:7711,playtime:0,
    flags:{talked:false,chest:false,won:false,lit:false,thorn:false,root:false,guardian:false,woodlandLit:false,towerLit:false,caveRunes:false,towerRunes:false,travelGift:false,guardianHeard:false,clear:false},inventory:{wayblade:1,tunic:1},equipment:{weapon:'wayblade',armour:'tunic',accessory:null},cleared:[],chests:[],runes:[],serial:0};
}
export interface Place extends Point {id:string;label:string;kind:'talk'|'chest'|'door'|'exit'|'beacon'|'rest'|'encounter'|'shop'|'puzzle'|'inn';target?:Scene;}
export const places:Record<Scene,Place[]>={
  town:[{id:'mira',label:'mira',kind:'talk',x:635,y:450},{id:'chest',label:'chest',kind:'chest',x:815,y:690},{id:'cottage',label:'cottage',kind:'door',x:350,y:447,target:'interior'},{id:'smith',label:'smith',kind:'shop',x:860,y:435},{id:'inn',label:'inn',kind:'inn',x:900,y:480},{id:'meadow',label:'meadow',kind:'exit',x:1260,y:610,target:'meadow'},{id:'forest',label:'forest',kind:'exit',x:1200,y:780,target:'forest'}],
  meadow:[{id:'town',label:'town',kind:'exit',x:120,y:610,target:'town'},{id:'beacon',label:'beacon',kind:'beacon',x:1140,y:435},{id:'shrine',label:'shrine',kind:'exit',x:1240,y:700,target:'shrine'}],
  interior:[{id:'outside',label:'outside',kind:'exit',x:500,y:700,target:'town'},{id:'rest',label:'rest',kind:'rest',x:670,y:460},{id:'notes',label:'notes',kind:'talk',x:330,y:405}],
  shrine:[{id:'meadow',label:'meadow',kind:'exit',x:120,y:610,target:'meadow'},{id:'town',label:'town',kind:'exit',x:250,y:770,target:'town'}],
  forest:[{id:'town',label:'town',kind:'exit',x:120,y:610,target:'town'},{id:'cavern',label:'cavern',kind:'door',x:1230,y:400,target:'cavern'},{id:'woodlandBeacon',label:'woodlandBeacon',kind:'beacon',x:730,y:360},{id:'quarry',label:'quarry',kind:'exit',x:1250,y:780,target:'quarry'}],
  cavern:[{id:'forest',label:'forest',kind:'exit',x:120,y:610,target:'forest'},{id:'cave-runes',label:'puzzle',kind:'puzzle',x:700,y:400},{id:'cave-cache',label:'caveCache',kind:'chest',x:650,y:760}],
  quarry:[{id:'forest',label:'forest',kind:'exit',x:120,y:610,target:'forest'},{id:'quarry-runes',label:'puzzle',kind:'puzzle',x:650,y:370},{id:'tower',label:'tower',kind:'door',x:1240,y:430,target:'tower'},{id:'quarry-cache',label:'quarryCache',kind:'chest',x:630,y:770}],
  tower:[{id:'quarry',label:'quarry',kind:'exit',x:120,y:610,target:'quarry'},{id:'sanctum',label:'sanctum',kind:'door',x:1240,y:390,target:'sanctum'},{id:'tower-cache',label:'towerCache',kind:'chest',x:650,y:770}],
  sanctum:[{id:'tower',label:'tower',kind:'exit',x:120,y:610,target:'tower'},{id:'guardianStory',label:'guardianTalk',kind:'talk',x:620,y:430},{id:'towerBeacon',label:'towerBeacon',kind:'beacon',x:1160,y:370}]
};
for(const e of encounters)places[e.scene].push({id:e.id,label:'enemy_'+e.enemy,kind:'encounter',x:e.x,y:e.y});
// Preserve the accepted introductory labels and contact encounter.
places.meadow.find(p=>p.id==='clearing')!.label='clearing';
export const trees:Partial<Record<Scene,Array<[number,number,number]>>>={
  town:[[130,320,1.3],[145,535,1.15],[210,785,1.4],[410,210,1.1],[580,215,1.3],[750,180,1.2],[980,300,1.3],[1210,350,1.3],[1310,500,1.25],[1260,850,1.5],[950,890,1.25],[710,950,1.3],[395,955,1.5]],
  meadow:[[130,260,1.4],[330,205,1.5],[560,200,1.2],[830,230,1.5],[1030,210,1.1],[1300,330,1.5],[1310,550,1.3],[1240,850,1.2],[950,955,1.5],[680,900,1.3],[240,940,1.5],[95,790,1.2]],
  shrine:[[320,240,1.5],[650,180,1.1],[1260,230,1.3],[1270,850,1.4],[310,910,1.2]],
  forest:[[190,250,1.7],[440,225,1.6],[680,190,1.8],[1010,230,1.6],[1320,260,1.8],[1310,520,1.3],[1280,900,1.5],[1000,940,1.6],[720,950,1.6],[400,930,1.7],[130,900,1.6],[80,420,1.4]]
};
export const obstacles:Record<Scene,Rect[]>={
  town:[{x:232,y:250,w:230,h:155},{x:716,y:190,w:230,h:155},{x:575,y:275,w:100,h:100},{x:455,y:740,w:180,h:65},{x:1010,y:40,w:80,h:495},{x:1010,y:665,w:80,h:300}],
  meadow:[{x:1100,y:300,w:85,h:90},{x:570,y:230,w:150,h:85},{x:340,y:750,w:160,h:80},{x:1000,y:720,w:160,h:100}],interior:[{x:210,y:260,w:230,h:85},{x:695,y:190,w:160,h:130}],
  shrine:[{x:520,y:270,w:95,h:85},{x:780,y:740,w:90,h:70}],forest:[{x:690,y:255,w:80,h:75},{x:520,y:730,w:110,h:70}],
  cavern:[{x:350,y:310,w:75,h:75},{x:800,y:310,w:75,h:75},{x:520,y:740,w:65,h:50}],quarry:[{x:330,y:290,w:130,h:85},{x:850,y:280,w:130,h:85},{x:940,y:770,w:130,h:60}],
  tower:[{x:350,y:310,w:70,h:65},{x:700,y:630,w:65,h:60},{x:980,y:310,w:70,h:65}],sanctum:[{x:350,y:310,w:70,h:65},{x:1050,y:700,w:70,h:65}]
};
for(const [scene,list] of Object.entries(trees))obstacles[scene as Scene].push(...list.map(([x,y,s])=>({x:x-10*s,y:y-31*s,w:20*s,h:15*s})));
export const limits=Object.fromEntries(Object.keys(places).map(s=>[s,s==='interior'?{x:115,y:175,w:770,h:550}:{x:85,y:180,w:1220,h:680}])) as Record<Scene,Rect>;
limits.town={x:110,y:190,w:1180,h:670};
export function canStand(scene: Scene, x:number,y:number):boolean {
  const b=limits[scene];
  return x>=b.x && y>=b.y && x<=b.x+b.w && y<=b.y+b.h &&
    !obstacles[scene].some(r=>x>r.x-14&&x<r.x+r.w+14&&y>r.y-10&&y<r.y+r.h+10);
}
export function move(g:Game,dx:number,dy:number):void {
  if(canStand(g.scene,g.x+dx,g.y))g.x+=dx;
  if(canStand(g.scene,g.x,g.y+dy))g.y+=dy;
}
export function distance(a:Point,b:Point):number {return Math.hypot(a.x-b.x,a.y-b.y);}
// Bounded A* on a 20px collision grid; mouse/touch navigation obeys the same geometry.
export function route(scene:Scene,start:Point,end:Point,avoid:Point[]=[]):Point[] {
  const step=20;
  const cell=(p:Point)=>({x:Math.round(p.x/step),y:Math.round(p.y/step)});
  const s=cell(start),goal=cell(end),key=(p:Point)=>`${p.x},${p.y}`;
  const waypoint=(x:number,y:number)=>canStand(scene,x,y)&&canStand(scene,x-1,y)&&canStand(scene,x+1,y)&&canStand(scene,x,y-1)&&canStand(scene,x,y+1);
  if(!waypoint(goal.x*step,goal.y*step)||avoid.some(a=>distance(a,{x:goal.x*step,y:goal.y*step})<80))return [];
  const open=[s],came=new Map<string,Point>(),scores=new Map([[key(s),0]]),closed=new Set<string>();
  let iterations=0;
  while(open.length&&iterations++<6000){
    open.sort((a,b)=>(scores.get(key(a))!+distance(a,goal))-(scores.get(key(b))!+distance(b,goal)));
    const p=open.shift()!,pk=key(p);
    if(pk===key(goal)){
      const path:Point[]=[end];let q=p;
      while(came.has(key(q))){path.unshift({x:q.x*step,y:q.y*step});q=came.get(key(q))!;}
      return path;
    }
    closed.add(pk);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const q={x:p.x+dx,y:p.y+dy},qk=key(q);
      if(closed.has(qk)||!waypoint(q.x*step,q.y*step)||avoid.some(a=>distance(a,{x:q.x*step,y:q.y*step})<80))continue;
      const score=scores.get(pk)!+1;
      if(score<(scores.get(qk)??Infinity)){
        came.set(qk,p);scores.set(qk,score);
        if(!open.some(n=>key(n)===qk))open.push(q);
      }
    }
  }
  return [];
}
export function canEnter(g:Game,scene:Scene):boolean {
  if(['town','meadow','interior','shrine'].includes(scene))return true;
  if(!g.flags.lit||!g.flags.thorn)return false;
  if(['forest','cavern'].includes(scene))return true;
  if(!g.flags.woodlandLit)return false;
  if(scene==='quarry')return true;
  return !!g.inventory.towerKey;
}
export function travel(g:Game,scene:Scene):string|undefined {
  if(!canEnter(g,scene))return 'lockedRoad';
  g.scene=scene;Object.assign(g,spawns[scene]);
  const respawn=encounters.filter(e=>e.scene===scene&&!e.once).map(e=>e.id);g.cleared=g.cleared.filter(id=>!respawn.includes(id));g.runes=[];
}
export function encounterAvailable(g:Game,id:string){const e=encounters.find(e=>e.id===id);return !!e&&!g.cleared.includes(id)&&!(id==='clearing'&&g.flags.won)&&!(id==='thorn'&&g.flags.thorn)&&!(id==='root'&&g.flags.root)&&!(id==='guardian'&&g.flags.guardian);}
export function activeEncounters(g:Game){return encounters.filter(e=>e.scene===g.scene&&encounterAvailable(g,e.id));}
export function buy(g:Game,id:ItemId):string|undefined {
  const item=items[id];if(!item||!shopStock.includes(id))return 'notOwned';if(g.coins<item.price)return 'notEnoughCoins';
  const count=id==='tonic'?g.tonics:id==='ether'?g.ethers:g.inventory[id]??0;if(count>=99)return 'inventoryFull';
  g.coins-=item.price;if(id==='tonic')g.tonics++;else if(id==='ether')g.ethers++;else g.inventory[id]=count+1;
}
export function equip(g:Game,id:ItemId):string|undefined {const item=items[id];if(!item?.slot||!g.inventory[id])return 'notOwned';g.equipment[item.slot]=id;}
export function sell(g:Game,id:ItemId):string|undefined {
  const item=items[id];if(!item||!g.inventory[id])return 'notOwned';if(item.quest||item.price===0||Object.values(g.equipment).includes(id))return 'cannotSell';
  g.inventory[id]!--;if(!g.inventory[id])delete g.inventory[id];g.coins=Math.min(100000,g.coins+Math.floor(item.price/2));
}
export function useItem(g:Game,id:'tonic'|'ether'):string|undefined {
  if(id==='tonic'){if(!g.tonics)return 'noTonic';if(g.hp===stats(g).hp)return 'fullAlready';g.tonics--;g.hp=Math.min(stats(g).hp,g.hp+24);}
  else{if(!g.ethers)return 'noEther';if(g.mp===stats(g).mp)return 'fullAlready';g.ethers--;g.mp=Math.min(stats(g).mp,g.mp+12);}
}
export function rune(g:Game,n:number):boolean {
  const flag=g.scene==='cavern'?'caveRunes':'towerRunes';if(!['cavern','quarry'].includes(g.scene)||g.flags[flag])return false;
  const order=[0,1,2];if(n!==order[g.runes.length]){g.runes=[];return false;}g.runes.push(n);
  if(g.runes.length===3){g.flags[flag]=true;g.inventory[g.scene==='cavern'?'mossSeal':'towerKey']=1;const before=level(g);g.xp=Math.min(100000,g.xp+(g.scene==='cavern'?50:75));if(level(g)>before){g.hp=stats(g).hp;g.mp=stats(g).mp;}g.runes=[];return true;}return false;
}
export function objectiveKey(g:Game):string {
  if(!g.flags.talked)return 'questTalk';if(!g.flags.won)return 'questClearing';if(!g.flags.lit)return 'questLight';if(!g.flags.thorn)return 'questShrine';
  if(!g.flags.root||!g.flags.caveRunes)return g.scene==='town'?'questForest':'questRoot';if(!g.flags.woodlandLit)return 'questWoodland';if(!g.flags.towerRunes)return 'questQuarry';
  if(!g.flags.guardian)return g.scene==='town'||g.scene==='quarry'?'questTower':'questGuardian';if(!g.flags.towerLit)return 'questFinal';return 'questClear';
}
export function ignite(g:Game,id='beacon'):boolean {
  if(id==='beacon'){if(!g.flags.won)return false;g.flags.lit=true;return true;}
  if(id==='woodlandBeacon'){if(!g.flags.root||!g.inventory.mossSeal)return false;g.flags.woodlandLit=true;return true;}
  if(!g.flags.guardian||!g.flags.lit||!g.flags.woodlandLit||!g.inventory.towerKey)return false;g.flags.towerLit=true;g.flags.clear=true;return true;
}
export function rest(g:Game,paid=false):string|undefined {if(paid&&g.coins<5)return 'notEnoughCoins';if(paid)g.coins-=5;g.hp=stats(g).hp;g.mp=stats(g).mp;g.cleared=g.cleared.filter(id=>encounters.find(e=>e.id===id)?.once);}
export function claimChest(g:Game,id:string):string {
  if(id==='chest'){if(g.flags.chest)return 'chestEmpty';g.flags.chest=true;g.tonics=Math.min(99,g.tonics+2);g.coins=Math.min(100000,g.coins+6);return 'chestLine';}
  if(!['cave-cache','quarry-cache','tower-cache'].includes(id))return 'notOwned';if(g.chests.includes(id))return 'cacheEmpty';g.chests.push(id);g.coins=Math.min(100000,g.coins+45);g.tonics=Math.min(99,g.tonics+1);g.ethers=Math.min(99,g.ethers+1);return 'cacheFound';
}
export function talkMira(g:Game):string[] {
  g.flags.talked=true;if(g.flags.clear)return ['miraEnd'];
  if(g.flags.lit&&!g.flags.travelGift){g.flags.travelGift=true;g.xp=Math.min(100000,g.xp+72);g.coins=Math.min(100000,g.coins+35);g.hp=stats(g).hp;g.mp=stats(g).mp;return ['miraGift','miraRoads'];}
  return g.flags.woodlandLit?['miraMiddle']:g.flags.lit?['miraRoads']:['miraLine1','miraLine2'];
}
export interface Log {key:string;n?:number;}
export type Action='attack'|'guard'|'tonic'|'ether'|'flee'|Spell;
export interface Battle {hp:number;mp:number;tonics:number;ethers:number;enemyHp:number;enemy:EnemyId;encounter:string;maxHp:number;maxMp:number;attack:number;defense:number;speed:number;heroLevel:number;round:number;seed:number;serial:number;outcome:'active'|'victory'|'defeat'|'fled';charged:boolean;ward:number;focus:boolean;phase2:boolean;drop:boolean;logs:Log[];}
export const ENEMY_HP=34;
export function beginBattle(g:Game,id='clearing'):Battle {
  const e=encounters.find(e=>e.id===id);if(!e||!canEnter(g,e.scene)||id==='thorn'&&!g.flags.lit||!encounterAvailable(g,id))throw Error('Encounter unavailable');
  const st=stats(g);return {hp:g.hp,mp:g.mp,tonics:g.tonics,ethers:g.ethers,enemyHp:enemies[e.enemy].hp,enemy:e.enemy,encounter:id,maxHp:st.hp,maxMp:st.mp,attack:st.attack,defense:st.defense,speed:st.speed,heroLevel:st.level,round:1,seed:g.seed,serial:g.serial,outcome:'active',charged:false,ward:0,focus:false,phase2:false,drop:false,logs:[{key:e.enemy==='dewdrop'?'appears':'enemyArrives'}]};
}
function rng(b:Battle){b.seed=(Math.imul(1664525,b.seed)+1013904223)>>>0;return b.seed/4294967296;}
export function physical(attack:number,defense:number,variance:number){return Math.max(1,attack-Math.floor(defense*.55)+Math.max(-2,Math.min(2,variance)));}
export function resolve(previous:Battle,action:Action):{battle:Battle;error?:string} {
  const b=structuredClone(previous),e=enemies[b.enemy],spell=spells[action as Spell];
  if(b.outcome!=='active')return {battle:b,error:'ended'};
  if(spell&&b.heroLevel<spell.level)return {battle:b,error:'notLearned'};
  if(spell&&b.mp<spell.cost)return {battle:b,error:'noMana'};
  if(action==='tonic'&&!b.tonics)return {battle:b,error:'noTonic'};if(action==='ether'&&!b.ethers)return {battle:b,error:'noEther'};
  if(action==='flee'&&e.boss)return {battle:b,error:'noFlee'};
  const n=()=>Math.floor(rng(b)*5)-2;
  if(action==='flee'){if(rng(b)<.75){b.outcome='fled';b.logs.push({key:'escaped'});return {battle:b};}b.logs.push({key:'escapeFail'});}
  const enemyTurn=()=>{
    let damage=physical((b.charged?Math.ceil(e.attack*1.7):e.attack)+(b.phase2?4:0),b.defense,n());
    if(b.ward>0)damage=Math.max(1,Math.floor(damage*.65));if(action==='guard')damage=Math.max(1,Math.floor(damage*.35));
    b.hp=Math.max(0,b.hp-damage);b.logs.push({key:b.charged?'heavyHit':'enemyHit',n:damage});b.charged=false;
    if(b.hp===0){b.outcome='defeat';b.logs.push({key:'defeatLog'});}
  };
  const first=e.speed>b.speed;if(first)enemyTurn();
  if(b.outcome==='active'){
    if(spell)b.mp-=spell.cost;
    if(action==='attack'||spell?.kind==='fire'||spell?.kind==='light'){
      const boosted=spell&&b.focus?1.6:1;let damage=action==='attack'?physical(b.attack,e.defense,n()):Math.max(1,Math.round((spell.power+n())*(spell.kind==='fire'?e.fire:e.light)*boosted));
      const critical=action==='attack'&&rng(b)<.05;if(critical)damage=Math.ceil(damage*1.5);b.enemyHp=Math.max(0,b.enemyHp-damage);b.logs.push({key:critical?'critical':action==='attack'?'strike':action==='ember'?'emberHit':'gleamHit',n:damage});if(spell)b.focus=false;
    }else if(spell?.kind==='heal'||action==='tonic'){
      const recovered=Math.min(b.maxHp-b.hp,action==='tonic'?24:spell!.power);b.hp+=recovered;if(action==='tonic')b.tonics--;b.logs.push({key:'healed',n:recovered});
    }else if(action==='ether'){const recovered=Math.min(b.maxMp-b.mp,12);b.mp+=recovered;b.ethers--;b.logs.push({key:'restoredMp',n:recovered});}
    else if(action==='ward'){b.ward=3;b.logs.push({key:'warded'});}else if(action==='focus'){b.focus=true;b.logs.push({key:'focused'});}else if(action==='guard'){b.mp=Math.min(b.maxMp,b.mp+1);b.logs.push({key:'guarded'});}
    if(b.enemyHp===0){b.outcome='victory';b.drop=!e.boss&&rng(b)<.2;b.logs.push({key:'victoryLog'});if(b.drop)b.logs.push({key:'drop'});return {battle:b};}
    if(!first)enemyTurn();
  }
  if(b.ward>0&&!(first&&action==='ward'))b.ward--;
  if(b.outcome==='active'){
    if(b.round%3===2){b.charged=true;b.logs.push({key:'telegraph'});}
    if(b.enemy==='guardian'&&!b.phase2&&b.enemyHp<=e.hp/2){b.phase2=true;b.charged=true;b.logs.push({key:'bossPhase'});}
    b.round++;
  }
  return {battle:b};
}
export function settle(g:Game,b:Battle):Game {
  const next=structuredClone(g);if(b.outcome==='active'||b.serial!==g.serial)return next;
  next.serial++;next.hp=b.hp;next.mp=b.mp;next.tonics=b.tonics;next.ethers=b.ethers;next.seed=b.seed;
  if(b.outcome==='victory'){
    const old=level(next),e=enemies[b.enemy];next.xp=Math.min(100000,next.xp+e.xp);next.coins=Math.min(100000,next.coins+e.coins);next.cleared=[...new Set([...next.cleared,b.encounter])];if(b.drop)next.tonics=Math.min(99,next.tonics+1);
    if(b.encounter==='clearing')next.flags.won=true;if(b.enemy==='thorn'){next.flags.thorn=true;next.inventory.sunseed=1;}if(b.enemy==='root')next.flags.root=true;if(b.enemy==='guardian')next.flags.guardian=true;
    if(level(next)>old){next.hp=stats(next).hp;next.mp=stats(next).mp;}
  }
  if(b.outcome==='defeat'){next.scene='interior';next.x=500;next.y=580;next.hp=stats(next).hp;next.mp=stats(next).mp;next.coins-=Math.floor(next.coins*.1);}
  if(b.outcome==='fled')Object.assign(next,spawns[g.scene]);return next;
}
const integer=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
function common(g:Record<string,unknown>){return typeof g.name==='string'&&g.name.length>0&&g.name.length<=24&&typeof g.scene==='string'&&Object.hasOwn(places,g.scene)&&typeof g.x==='number'&&typeof g.y==='number'&&Number.isFinite(g.x)&&Number.isFinite(g.y)&&canStand(g.scene as Scene,g.x,g.y)&&integer(g.xp,0,100000)&&integer(g.coins,0,100000)&&integer(g.tonics,0,99)&&integer(g.seed,0,4294967295)&&typeof g.playtime==='number'&&Number.isFinite(g.playtime)&&g.playtime>=0&&g.playtime<=1e9;}
export function validGame(value:unknown):value is Game {
  try{
    if(!value||typeof value!=='object')return false;const g=value as Game;if(g.version!==2||!common(g as unknown as Record<string,unknown>))return false;
    if(!g.flags||Object.keys(fresh().flags).some(k=>typeof g.flags[k as keyof Flags]!=='boolean')||!g.inventory||typeof g.inventory!=='object'||Array.isArray(g.inventory)||!g.equipment||Object.keys(g.equipment).sort().join(',')!=='accessory,armour,weapon')return false;
    if(!Object.entries(g.inventory).every(([id,n])=>Object.hasOwn(items,id)&&id!=='tonic'&&id!=='ether'&&integer(n,1,99)))return false;
    if(!(['weapon','armour','accessory'] as Slot[]).every(s=>g.equipment[s]===null||!!g.inventory[g.equipment[s]!]&&items[g.equipment[s]!]?.slot===s))return false;
    if(g.cleared.includes('clearing')&&!g.flags.won||g.cleared.includes('thorn')&&!g.flags.thorn||g.cleared.includes('root')&&!g.flags.root||g.cleared.includes('guardian')&&!g.flags.guardian)return false;
    const s=stats(g);if(!integer(g.hp,1,s.hp)||!integer(g.mp,0,s.mp)||!integer(g.ethers,0,99)||!integer(g.serial,0,1e9))return false;
    if(!Array.isArray(g.cleared)||!g.cleared.every(id=>encounters.some(e=>e.id===id))||new Set(g.cleared).size!==g.cleared.length||!Array.isArray(g.chests)||!g.chests.every(id=>['cave-cache','quarry-cache','tower-cache'].includes(id))||new Set(g.chests).size!==g.chests.length||!Array.isArray(g.runes)||g.runes.length>2||!g.runes.every((n,i)=>n===i))return false;
    if(g.flags.root&&(!g.flags.thorn||!g.flags.lit)||g.flags.guardian&&(!g.flags.woodlandLit||!g.inventory.towerKey)||g.flags.lit&&!g.flags.won||g.flags.thorn&&!g.inventory.sunseed||g.flags.caveRunes!==!!g.inventory.mossSeal||g.flags.towerRunes!==!!g.inventory.towerKey||g.flags.woodlandLit&&(!g.flags.root||!g.flags.caveRunes)||g.flags.towerLit&&(!g.flags.guardian||!g.flags.woodlandLit||!g.flags.lit)||g.flags.clear!==g.flags.towerLit)return false;
    return canEnter(g,g.scene);
  }catch{return false;}
}
function migrate(raw:unknown):Game|null {
  if(!raw||typeof raw!=='object')return null;const o=raw as Record<string,unknown>,f=o.flags as Record<string,unknown>;
  if(o.version!==1||!common(o)||!['town','meadow','interior'].includes(o.scene as string)||!integer(o.hp,1,36)||!integer(o.mp,0,12)||!f||!['talked','chest','won','lit'].every(k=>typeof f[k]==='boolean')||f.lit&&!f.won)return null;
  const g=fresh(o.name as string);for(const k of ['scene','x','y','hp','mp','xp','coins','tonics','seed','playtime'] as const)(g as unknown as Record<string,unknown>)[k]=o[k];
  for(const key of ['talked','chest','won','lit'] as const)g.flags[key]=f[key] as boolean;if(g.flags.won)g.cleared.push('clearing');return validGame(g)?g:null;
}
export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export type LoadResult={kind:'ok';game:Game;migrated?:boolean}|{kind:'empty'|'corrupt'|'blocked'};
export function load(storage:StorageLike,slot:string):LoadResult {
  try{
    const raw=storage.getItem(`lantern-v2-${slot}`);if(raw!==null){try{const g:unknown=JSON.parse(raw);return validGame(g)?{kind:'ok',game:g}:{kind:'corrupt'};}catch{return {kind:'corrupt'};}}
    const old=storage.getItem(`lantern-v1-${slot}`);if(old===null)return {kind:'empty'};try{const g=migrate(JSON.parse(old));return g?{kind:'ok',game:g,migrated:true}:{kind:'corrupt'};}catch{return {kind:'corrupt'};}
  }catch{return {kind:'blocked'};}
}
export function save(storage:StorageLike,slot:string,g:Game):boolean {if(!validGame(g))return false;try{storage.setItem(`lantern-v2-${slot}`,JSON.stringify(g));return true;}catch{return false;}}
