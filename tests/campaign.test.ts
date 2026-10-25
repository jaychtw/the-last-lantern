import {describe,it,expect} from 'vitest';
import {fresh,stats,level,buy,sell,equip,useItem,rest,claimChest,talkMira,travel,canEnter,rune,ignite,beginBattle,resolve,settle,validGame,load,save,route,places,canStand,move,distance,enemies,encounters,spells,items,type Game,type Action,type Scene,type StorageLike} from '../src/domain';
import {campaignText,spawns} from '../src/content';
import {reviewAction as policy} from './helpers/battle-policy';
const unlocked=()=>{const g=fresh();Object.assign(g.flags,{talked:true,won:true,lit:true,thorn:true,root:true,caveRunes:true,woodlandLit:true,towerRunes:true});Object.assign(g.inventory,{sunseed:1,mossSeal:1,towerKey:1});return g;};
function fight(g:Game,id:string){let b=beginBattle(g,id);for(let i=0;i<100&&b.outcome==='active';i++){const r=resolve(b,policy(b));if(r.error)throw Error(r.error);b=r.battle;}return {b,g:settle(g,b)};}

describe('Gate B economy, growth and persistent campaign',()=>{
  it('changes real combat stats with deterministic growth and equipment; refuses debt and quest sales',()=>{
    const g=fresh();expect(buy(g,'bronze')).toBe('notEnoughCoins');expect(g.coins).toBe(12);g.coins=100;
    expect(buy(g,'bronze')).toBeUndefined();expect(g.coins).toBe(80);expect(equip(g,'bronze')).toBeUndefined();expect(stats(g).attack).toBe(13);
    expect(sell(g,'bronze')).toBe('cannotSell');equip(g,'wayblade');expect(sell(g,'bronze')).toBeUndefined();expect(g.coins).toBe(90);
    g.inventory.sunseed=1;expect(sell(g,'sunseed')).toBe('cannotSell');g.xp=90;expect(level(g)).toBe(3);expect(stats(g).hp).toBe(52);
  });
  it('caps supplies, rejects using full-heal items and charges the inn exactly once',()=>{
    const g=fresh();expect(useItem(g,'tonic')).toBe('fullAlready');expect(g.tonics).toBe(1);g.hp=10;expect(useItem(g,'tonic')).toBeUndefined();expect(g.hp).toBe(34);
    g.tonics=99;g.coins=100;expect(buy(g,'tonic')).toBe('inventoryFull');expect(g.coins).toBe(100);
    expect(rest(g,true)).toBeUndefined();expect(g.coins).toBe(95);expect(g.hp).toBe(stats(g).hp);g.coins=0;expect(rest(g,true)).toBe('notEnoughCoins');expect(rest(g)).toBeUndefined();
  });
  it('grants one-time caches, Mira travel lessons and quest keys exactly once',()=>{
    const g=fresh();claimChest(g,'chest');const coins=g.coins;expect(claimChest(g,'chest')).toBe('chestEmpty');expect(g.coins).toBe(coins);
    claimChest(g,'cave-cache');const found=structuredClone(g);expect(claimChest(g,'cave-cache')).toBe('cacheEmpty');expect(g).toEqual(found);
    g.flags.won=true;ignite(g);talkMira(g);const xp=g.xp,c=g.coins;talkMira(g);expect(g.xp).toBe(xp);expect(g.coins).toBe(c);
  });
  it('gates roads, resolves resettable rune sequences, and requires all three lights for clear',()=>{
    const g=fresh();expect(travel(g,'forest')).toBe('lockedRoad');expect(g.scene).toBe('town');expect(ignite(g,'towerBeacon')).toBe(false);
    Object.assign(g.flags,{won:true,lit:true,thorn:true});g.inventory.sunseed=1;expect(travel(g,'cavern')).toBeUndefined();expect(rune(g,1)).toBe(false);expect(g.runes).toEqual([]);
    rune(g,0);rune(g,1);expect(rune(g,2)).toBe(true);expect(g.inventory.mossSeal).toBe(1);expect(ignite(g,'woodlandBeacon')).toBe(false);g.flags.root=true;expect(ignite(g,'woodlandBeacon')).toBe(true);
    travel(g,'quarry');rune(g,0);rune(g,1);rune(g,2);expect(canEnter(g,'tower')).toBe(true);g.flags.guardian=true;expect(ignite(g,'towerBeacon')).toBe(true);expect(g.flags.clear).toBe(true);expect(validGame(g)).toBe(true);
  });
  it('respawns ordinary encounters on reentry/rest while keeping bosses and discoveries cleared',()=>{
    const g=unlocked();g.cleared=['forest-moth','thorn','root'];travel(g,'forest');expect(g.cleared).toEqual(['thorn','root']);g.cleared.push('forest-moth');rest(g);expect(g.cleared).toEqual(['thorn','root']);expect(g.inventory.mossSeal).toBe(1);
  });
  it('migrates Gate A saves without overwriting source bytes, and v2 corrupt bytes take precedence',()=>{
    const data=new Map<string,string>(),storage:StorageLike={getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);}};
    const old={version:1,name:'小光',scene:'meadow',x:420,y:640,hp:17,mp:5,xp:18,coins:26,tonics:3,seed:123456,playtime:42,flags:{talked:true,chest:true,won:true,lit:true}};
    const bytes=JSON.stringify(old);data.set('lantern-v1-1',bytes);const result=load(storage,'1');expect(result.kind).toBe('ok');
    if(result.kind!=='ok')throw Error('Migration failed');expect(result.migrated).toBe(true);expect(result.game.flags.lit).toBe(true);expect(result.game.hp).toBe(17);expect(result.game.seed).toBe(123456);expect(result.game.name).toBe('小光');expect(save(storage,'1',result.game)).toBe(true);expect(data.get('lantern-v1-1')).toBe(bytes);
    data.set('lantern-v2-1','{bad');expect(load(storage,'1')).toEqual({kind:'corrupt'});expect(data.get('lantern-v2-1')).toBe('{bad');
  });
  it('roundtrips the full clear state and refuses fabricated gear or impossible progression',()=>{
    const g=unlocked();g.flags.guardian=true;ignite(g,'towerBeacon');g.xp=1800;g.hp=60;g.inventory.dawnblade=1;equip(g,'dawnblade');g.scene='sanctum';g.x=150;g.y=610;
    expect(validGame(g)).toBe(true);
    for(const bad of [{...g,ethers:-1},{...g,inventory:{...g.inventory,fakeSword:1}},{...g,equipment:{...g.equipment,armour:'dawnblade'}},{...g,flags:{...g.flags,root:false}},{...g,runes:[2]}])expect(validGame(bad)).toBe(false);
    const data=new Map<string,string>(),storage:StorageLike={getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);}};expect(save(storage,'3',g)).toBe(true);expect(load(storage,'3')).toEqual({kind:'ok',game:g});
  });
});
describe('campaign combat and traversability',()=>{
  it('covers every authored interaction with a legal route from its scene spawn',()=>{
    for(const scene of Object.keys(places) as Scene[])for(const p of places[scene]){
      const path=route(scene,spawns[scene],p);expect(path.length,scene+':'+p.id).toBeGreaterThan(0);for(const q of path)expect(canStand(scene,q.x,q.y)).toBe(true);
    }
  });
  it('keeps non-encounter routes outside every enemy contact zone, including the quarry exit',()=>{
    const foes=encounters.filter(e=>e.scene==='forest');const path=route('forest',spawns.forest,{x:1250,y:780},foes);expect(path.length).toBeGreaterThan(0);
    for(const point of path)for(const foe of foes)expect(Math.hypot(point.x-foe.x,point.y-foe.y)).toBeGreaterThanOrEqual(80);
    expect(route('forest',spawns.forest,{x:1180,y:760},foes)).toEqual([]);
  });
  it('actually follows a route around padded column corners without getting stuck',()=>{
    const g=unlocked();g.scene='tower';g.x=1038.5832603537115;g.y=651.0071413709334;const target={x:719,y:749},path=route(g.scene,g,target);expect(path.length).toBeGreaterThan(0);
    for(let i=0;i<2000&&path.length;i++){const next=path[0],d=distance(g,next);if(d<5)path.shift();else move(g,(next.x-g.x)/d*175/60,(next.y-g.y)/d*175/60);}
    expect(path).toEqual([]);expect(distance(g,target)).toBeLessThan(5);
  });
  it('resolves fast enemies first, prevents boss flight, and preserves RNG for invalid actions',()=>{
    const g=unlocked();g.xp=0;g.hp=1;const b=beginBattle(g,'cave-nibbler');const r=resolve(b,'mend');expect(r.battle.outcome).toBe('defeat');expect(r.battle.mp).toBe(b.mp);expect(r.battle.logs.at(-2)?.key).toBe('enemyHit');
    const boss=beginBattle(g,'guardian');expect(resolve(boss,'flee')).toEqual({battle:boss,error:'noFlee'});expect(resolve(boss,'gleam')).toEqual({battle:boss,error:'notLearned'});
  });
  it('implements Ward duration, Focus consumption, elemental modifiers and guardian phase telegraph',()=>{
    const g=unlocked();g.xp=1600;g.hp=stats(g).hp;g.mp=stats(g).mp;const b=beginBattle(g,'guardian');b.charged=false;
    const ward=resolve(b,'ward').battle;expect(ward.ward).toBe(2);expect(b.hp-ward.hp).toBeLessThan(b.hp-resolve(b,'focus').battle.hp);
    const focused=resolve(b,'focus').battle;const cast=resolve(focused,'gleam').battle;expect(cast.focus).toBe(false);expect(cast.logs.slice().reverse().find(l=>l.key==='gleamHit')!.n).toBeGreaterThan(resolve(b,'gleam').battle.logs.slice().reverse().find(l=>l.key==='gleamHit')!.n!);
    b.enemyHp=Math.ceil(enemies.guardian.hp/2)+1;const phase=resolve(b,'attack').battle;expect(phase.phase2).toBe(true);expect(phase.charged).toBe(true);expect(phase.logs.at(-1)?.key).toBe('bossPhase');
  });
  it('settles repeated encounters once per battle identity and preserves seeded drops/rewards',()=>{
    const g=fresh(),b=beginBattle(g);b.enemyHp=1;const r=resolve(b,'attack').battle;const first=settle(g,r);expect(settle(first,r)).toEqual(first);expect(first.serial).toBe(1);
    expect(resolve(b,'attack')).toEqual(resolve(b,'attack'));
  });
  it('wins a main-route campaign across 101 seeds with finite earned resources and no injected XP',()=>{
    const failures:Array<{seed:number;id:string;level:number;hp:number}> = [];
    for(const seed of [...Array.from({length:100},(_,i)=>i),7711]){
      let g=fresh();g.seed=seed;talkMira(g);claimChest(g,'chest');
      const ids=['clearing','meadow-hopper','shrine-hopper','thorn','forest-moth','forest-twig','forest-wisp','cave-nibbler','cave-pebble','root','quarry-pebble','quarry-ashling','quarry-eye','tower-hollow','tower-eye','tower-ashling','guardian'];
      for(const id of ids){
        // Preparation uses real shop transactions and a safe-town intermission.
        if(['clearing','thorn','forest-moth','root','quarry-pebble','tower-hollow','guardian'].includes(id)){
          travel(g,'town');rest(g);
          for(const slot of ['weapon','armour','accessory'] as const){
            const choices=Object.entries(items).filter(([,v])=>v.slot===slot).sort(([,a],[,b])=>b.attack+b.defense-a.attack-a.defense);
            const current=items[g.equipment[slot]!]??{attack:0,defense:0};const best=choices.find(([,v])=>v.attack+v.defense>current.attack+current.defense&&v.price<=g.coins*.6);
            if(best){buy(g,best[0] as keyof typeof items);equip(g,best[0] as keyof typeof items);}
          }
          while(g.tonics<3&&g.coins>=8)buy(g,'tonic');while(g.ethers<2&&g.coins>=18)buy(g,'ether');
        }
        const e=encounters.find(e=>e.id===id)!;const error=travel(g,e.scene);if(error)throw Error(id+':'+error);
        if(id==='root'){rune(g,0);rune(g,1);rune(g,2);claimChest(g,'cave-cache');}
        const result=fight(g,id);if(result.b.outcome!=='victory'){failures.push({seed,id,level:level(g),hp:result.b.hp});break;}g=result.g;
        if(id==='clearing')ignite(g);
        if(id==='thorn')talkMira(g);
        if(id==='root'){g.scene='cavern';rune(g,0);rune(g,1);rune(g,2);ignite(g,'woodlandBeacon');claimChest(g,'cave-cache');}
        if(id==='quarry-eye'){g.scene='quarry';rune(g,0);rune(g,1);rune(g,2);claimChest(g,'quarry-cache');}
        if(id==='tower-ashling')claimChest(g,'tower-cache');
        if(id==='guardian'){expect(ignite(g,'towerBeacon')).toBe(true);expect(g.flags.clear).toBe(true);expect(validGame(g)).toBe(true);}
      }
    }
    expect(failures.length,JSON.stringify(failures.slice(0,5))).toBe(0);
  });
  it('ships complete bilingual campaign content and the promised bounded catalogs',()=>{
    expect(Object.keys(enemies)).toHaveLength(13);expect(Object.values(enemies).filter(e=>e.boss)).toHaveLength(3);expect(Object.keys(items)).toHaveLength(20);expect(Object.keys(spells)).toHaveLength(6);
    for(const [id,pair] of Object.entries(campaignText)){expect(pair[0].trim(),id).not.toBe('');expect(pair[1].trim(),id).not.toBe('');}
    for(const id of Object.keys(enemies))expect(campaignText['enemy_'+id]).toBeDefined();for(const id of Object.keys(items))expect(campaignText['item_'+id]).toBeDefined();
  });
});
