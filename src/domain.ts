export type Scene = 'town' | 'meadow' | 'interior';
export type Lang = 'en' | 'zh-TW';
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export interface Game extends Point {
  version: 1; name: string; scene: Scene; hp: number; mp: number; xp: number;
  coins: number; tonics: number; seed: number; playtime: number;
  flags: { talked: boolean; chest: boolean; won: boolean; lit: boolean };
}
export const MAX_HP = 36, MAX_MP = 12;
export function fresh(name = 'Rowan'): Game {
  return { version: 1, name, scene: 'town', x: 625, y: 650, hp: MAX_HP, mp: MAX_MP,
    xp: 0, coins: 12, tonics: 1, seed: 7711, playtime: 0,
    flags: { talked: false, chest: false, won: false, lit: false } };
}
export interface Place extends Point { id: string; label: string; kind: 'talk'|'chest'|'door'|'exit'|'beacon'|'rest'|'encounter'; }
export const places: Record<Scene, Place[]> = {
  town: [
    {id:'mira', label:'mira', kind:'talk',x:635,y:450},
    {id:'chest',label:'chest',kind:'chest',x:815,y:690},
    {id:'cottage',label:'cottage',kind:'door',x:350,y:447},
    {id:'meadow',label:'meadow',kind:'exit',x:1260,y:610}
  ],
  meadow: [
    {id:'town',label:'town',kind:'exit',x:120,y:610},
    {id:'clearing',label:'clearing',kind:'encounter',x:770,y:570},
    {id:'beacon',label:'beacon',kind:'beacon',x:1140,y:435}
  ],
  interior: [
    {id:'outside',label:'outside',kind:'exit',x:500,y:700},
    {id:'rest',label:'rest',kind:'rest',x:670,y:460},
    {id:'notes',label:'notes',kind:'talk',x:330,y:405}
  ]
};
export const trees:Record<'town'|'meadow',Array<[number,number,number]>>={
  town:[[130,320,1.3],[145,535,1.15],[210,785,1.4],[410,210,1.1],[580,215,1.3],[750,180,1.2],[980,300,1.3],[1210,350,1.3],[1310,500,1.25],[1260,850,1.5],[950,890,1.25],[710,950,1.3],[395,955,1.5]],
  meadow:[[130,260,1.4],[330,205,1.5],[560,200,1.2],[830,230,1.5],[1030,210,1.1],[1300,330,1.5],[1310,550,1.3],[1240,850,1.2],[950,955,1.5],[680,900,1.3],[240,940,1.5],[95,790,1.2]]
};
export const obstacles: Record<Scene,Rect[]> = {
  town: [{x:232,y:250,w:230,h:155},{x:716,y:190,w:230,h:155},
    {x:575,y:275,w:100,h:100},{x:455,y:740,w:180,h:65},
    {x:1010,y:40,w:80,h:495},{x:1010,y:665,w:80,h:300}],
  meadow: [{x:1100,y:300,w:85,h:90},{x:570,y:230,w:150,h:85},
    {x:340,y:750,w:160,h:80},{x:1000,y:720,w:160,h:100}],
  interior: [{x:210,y:260,w:230,h:85},{x:695,y:190,w:160,h:130}]
};
// Crown canopies allow walking underneath; only the visible trunk footprint blocks.
for(const scene of ['town','meadow'] as const){
  obstacles[scene].push(...trees[scene].map(([x,y,s])=>({x:x-10*s,y:y-31*s,w:20*s,h:15*s})));
}
export const limits: Record<Scene,Rect> = {
  town:{x:110,y:190,w:1180,h:670}, meadow:{x:85,y:180,w:1220,h:680},
  interior:{x:115,y:175,w:770,h:550}
};
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
export function route(scene:Scene,start:Point,end:Point):Point[] {
  const step=20;
  const cell=(p:Point)=>({x:Math.round(p.x/step),y:Math.round(p.y/step)});
  const s=cell(start),goal=cell(end),key=(p:Point)=>`${p.x},${p.y}`;
  if(!canStand(scene,goal.x*step,goal.y*step))return [];
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
      if(closed.has(qk)||!canStand(scene,q.x*step,q.y*step))continue;
      const score=scores.get(pk)!+1;
      if(score<(scores.get(qk)??Infinity)){
        came.set(qk,p);scores.set(qk,score);
        if(!open.some(n=>key(n)===qk))open.push(q);
      }
    }
  }
  return [];
}
export interface Log {key:string; n?:number;}
export type Action='attack'|'ember'|'mend'|'guard'|'tonic'|'flee';
export interface Battle {
  hp:number;mp:number;tonics:number;enemyHp:number;round:number;seed:number;
  outcome:'active'|'victory'|'defeat'|'fled'; charged:boolean; logs:Log[];
}
export const ENEMY_HP=34;
export function beginBattle(g:Game):Battle {
  return {hp:g.hp,mp:g.mp,tonics:g.tonics,enemyHp:ENEMY_HP,round:1,seed:g.seed,
    outcome:'active',charged:false,logs:[{key:'appears'}]};
}
function rng(b:Battle):number {b.seed=(Math.imul(1664525,b.seed)+1013904223)>>>0;return b.seed/4294967296;}
export function physical(attack:number,defense:number,variance:number):number {
  return Math.max(1,attack-Math.floor(defense*.55)+Math.max(-2,Math.min(2,variance)));
}
export function resolve(previous:Battle,action:Action):{battle:Battle;error?:string} {
  const b=structuredClone(previous);
  if(b.outcome!=='active')return {battle:b,error:'ended'};
  if((action==='ember'&&b.mp<3)||(action==='mend'&&b.mp<4))return {battle:b,error:'noMana'};
  if(action==='tonic'&&b.tonics===0)return {battle:b,error:'noTonic'};
  const n=()=>Math.floor(rng(b)*5)-2;
  if(action==='flee'){
    if(rng(b)<.75){b.outcome='fled';b.logs.push({key:'escaped'});return {battle:b};}
    b.logs.push({key:'escapeFail'});
  }
  if(action==='attack'||action==='ember'){
    const damage=action==='attack'?physical(10,4,n()):14+n();
    if(action==='ember')b.mp-=3;
    b.enemyHp=Math.max(0,b.enemyHp-damage);b.logs.push({key:action==='attack'?'strike':'emberHit',n:damage});
  }else if(action==='mend'||action==='tonic'){
    const recovered=Math.min(MAX_HP-b.hp,action==='mend'?20:24);b.hp+=recovered;
    if(action==='mend')b.mp-=4;else b.tonics--;
    b.logs.push({key:'healed',n:recovered});
  }else if(action==='guard')b.logs.push({key:'guarded'});
  if(b.enemyHp===0){b.outcome='victory';b.logs.push({key:'victoryLog'});return {battle:b};}
  // Every third round is a signaled heavy hit. The prior round visibly telegraphs it.
  let damage=physical(b.charged?14:8,5,n());
  if(action==='guard')damage=Math.max(1,Math.floor(damage*.35));
  b.hp=Math.max(0,b.hp-damage);b.logs.push({key:b.charged?'heavyHit':'enemyHit',n:damage});
  b.charged=false;
  if(b.hp===0){b.outcome='defeat';b.logs.push({key:'defeatLog'});return {battle:b};}
  if(b.round%3===2){b.charged=true;b.logs.push({key:'telegraph'});}
  b.round++;return {battle:b};
}
export function settle(g:Game,b:Battle):Game {
  const next=structuredClone(g);
  next.hp=b.hp;next.mp=b.mp;next.tonics=b.tonics;next.seed=b.seed;
  if(b.outcome==='victory'&&!next.flags.won){next.flags.won=true;next.xp+=18;next.coins+=8;}
  if(b.outcome==='defeat'){
    next.scene='interior';next.x=500;next.y=580;next.hp=MAX_HP;next.mp=MAX_MP;
    next.coins-=Math.floor(next.coins*.1);
  }
  if(b.outcome==='fled'){next.x=420;next.y=640;}
  return next;
}
export function ignite(g:Game):boolean {
  if(!g.flags.won)return false;
  g.flags.lit=true;return true;
}
const integer=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
export function validGame(value:unknown):value is Game {
  if(!value||typeof value!=='object')return false;
  const g=value as Game;
  return g.version===1&&typeof g.name==='string'&&g.name.length>0&&g.name.length<=24&&
    ['town','meadow','interior'].includes(g.scene)&&Number.isFinite(g.x)&&Number.isFinite(g.y)&&
    canStand(g.scene,g.x,g.y)&&integer(g.hp,1,MAX_HP)&&integer(g.mp,0,MAX_MP)&&
    integer(g.coins,0,9999)&&integer(g.xp,0,9999)&&integer(g.tonics,0,99)&&integer(g.seed,0,4294967295)&&
    Number.isFinite(g.playtime)&&g.playtime>=0&&g.playtime<=1e9&&!!g.flags&&
    ['talked','chest','won','lit'].every(k=>typeof g.flags[k as keyof Game['flags']]==='boolean')&&
    (!g.flags.lit||g.flags.won);
}
export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export type LoadResult={kind:'ok';game:Game}|{kind:'empty'|'corrupt'|'blocked'};
export function load(storage:StorageLike,slot:string):LoadResult {
  try{
    const raw=storage.getItem(`lantern-v1-${slot}`);if(raw===null)return {kind:'empty'};
    try {const parsed:unknown=JSON.parse(raw);return validGame(parsed)?{kind:'ok',game:parsed}:{kind:'corrupt'};}
    catch{return {kind:'corrupt'};}
  }catch{return {kind:'blocked'};}
}
export function save(storage:StorageLike,slot:string,g:Game):boolean {
  if(!validGame(g))return false;
  try{storage.setItem(`lantern-v1-${slot}`,JSON.stringify(g));return true;}catch{return false;}
}
