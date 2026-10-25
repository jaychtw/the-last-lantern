import {describe,it,expect} from 'vitest';
import {fresh,beginBattle,resolve,settle,physical,canStand,move,route,places,load,save,validGame,ignite,MAX_HP,type Action,type StorageLike} from '../src/domain';
import {messages} from '../src/i18n';

describe('seeded battle and progression',()=>{
  it('implements the documented physical formula and bounded variance',()=>{
    expect(physical(10,4,0)).toBe(8);expect(physical(1,100,-2)).toBe(1);
    expect(physical(10,4,100)).toBe(10);
  });
  it('replays exact HP, MP, RNG, and logs for the same seed and actions',()=>{
    const actions:Action[]=['guard','ember','guard','mend','attack','ember'];
    const run=()=>actions.reduce((b,a)=>resolve(b,a).battle,beginBattle(fresh()));
    expect(run()).toEqual(run());expect(run().logs.some(l=>l.key==='telegraph')).toBe(true);
  });
  it('announces the heavy attack one turn before impact, and guarding reduces it',()=>{
    let b=beginBattle(fresh());b=resolve(b,'guard').battle;b=resolve(b,'guard').battle;
    expect(b.charged).toBe(true);expect(b.logs.at(-1)?.key).toBe('telegraph');
    const guarded=resolve(b,'guard').battle,unguarded=resolve(b,'attack').battle;
    expect(b.hp-guarded.hp).toBeLessThan(b.hp-unguarded.hp);
    expect(guarded.logs.at(-1)?.key).toBe('heavyHit');
  });
  it('does not consume turns or RNG when MP or inventory is insufficient',()=>{
    const b=beginBattle(fresh());b.mp=0;b.tonics=0;
    for(const a of ['ember','mend','tonic'] as Action[]){const result=resolve(b,a);expect(result.error).toBeTruthy();expect(result.battle).toEqual(b);}
  });
  it('caps healing and spends exactly one tonic',()=>{
    const b=beginBattle(fresh());b.hp=35;
    const next=resolve(b,'tonic').battle;
    expect(next.logs.find(l=>l.key==='healed')?.n).toBe(1);expect(next.tonics).toBe(0);
  });
  it('does not retaliate after a killing blow or duplicate progression rewards',()=>{
    const g=fresh(),b=beginBattle(g);b.enemyHp=1;
    const won=resolve(b,'attack').battle;
    expect(won.outcome).toBe('victory');expect(won.hp).toBe(MAX_HP);
    const first=settle(g,won),again=settle(first,won);
    expect(first.xp).toBe(18);expect(first.coins).toBe(20);expect(again).toEqual(first);
    expect(resolve(won,'attack').error).toBe('ended');
  });
  it('returns defeats safely home and preserves chest and quest discoveries',()=>{
    const g=fresh();g.flags.chest=true;g.flags.talked=true;g.coins=29;
    const b=beginBattle(g);b.hp=1;b.charged=true;
    const defeated=resolve(b,'guard').battle;expect(defeated.outcome).toBe('defeat');
    const next=settle(g,defeated);expect(next.hp).toBe(MAX_HP);expect(next.coins).toBe(27);
    expect(next.scene).toBe('interior');expect(next.flags).toEqual(g.flags);expect(validGame(next)).toBe(true);
  });
  it('requires an encounter victory before rekindling the beacon',()=>{
    const g=fresh();expect(ignite(g)).toBe(false);expect(g.flags.lit).toBe(false);
    g.flags.won=true;expect(ignite(g)).toBe(true);expect(validGame(g)).toBe(true);
  });
  it('wins the introductory battle without consumables across 250 seeds',()=>{
    let wins=0;
    for(let seed=0;seed<250;seed++){
      const g=fresh();g.seed=seed;g.tonics=0;let b=beginBattle(g),turns=0;
      while(b.outcome==='active'&&turns++<30){
        b=resolve(b,b.hp<14&&b.mp>=4?'mend':b.charged?'guard':b.mp>=3?'ember':'attack').battle;
      }
      if(b.outcome==='victory')wins++;
    }
    expect(wins).toBe(250);
  });
});

describe('world collision and navigation',()=>{
  it('prevents walking through buildings and world edges',()=>{
    const g=fresh();g.x=220;g.y=300;move(g,30,0);expect(g.x).toBe(220);
    expect(canStand('town',20,20)).toBe(false);expect(canStand('interior',330,300)).toBe(false);
    expect(canStand('town',210,750)).toBe(false); // foreground tree trunk
  });
  it('finds legal, bounded paths to every authored interaction from each scene spawn',()=>{
    for(const scene of ['town','meadow','interior'] as const){
      const start=scene==='town'?fresh():scene==='meadow'?{x:145,y:610}:{x:500,y:650};
      for(const place of places[scene]){
        const path=route(scene,start,place);expect(path.length,scene+':'+place.id).toBeGreaterThan(0);
        for(const p of path)expect(canStand(scene,p.x,p.y),JSON.stringify(p)).toBe(true);
      }
    }
  });
  it('rejects unreachable destinations rather than teleporting',()=>{
    expect(route('town',fresh(),{x:330,y:300})).toEqual([]);
    expect(route('town',fresh(),{x:-100,y:400})).toEqual([]);
  });
});

describe('versioned persistence and bilingual resources',()=>{
  const memory=()=>{const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};};
  it('restores exact state, including RNG, chest, settings-independent scene and hero name',()=>{
    const storage=memory(),g=fresh('小光');g.flags.chest=true;g.tonics=3;g.seed=23431;
    expect(save(storage,'1',g)).toBe(true);expect(load(storage,'1')).toEqual({kind:'ok',game:g});
    expect(load(storage,'2')).toEqual({kind:'empty'});
  });
  it('preserves unreadable bytes and distinguishes corrupt from blocked storage',()=>{
    const storage=memory();storage.setItem('lantern-v1-1','broken!');
    expect(load(storage,'1')).toEqual({kind:'corrupt'});expect(storage.getItem('lantern-v1-1')).toBe('broken!');
    const blocked:StorageLike={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
    expect(load(blocked,'1')).toEqual({kind:'blocked'});expect(save(blocked,'1',fresh())).toBe(false);
  });
  it('rejects invalid saves including unsupported versions, invalid locations and impossible quest states',()=>{
    for(const override of [{version:3},{hp:0},{x:NaN},{scene:'tower'},{coins:-1},{tonics:100},{flags:{talked:false,chest:false,won:false,lit:true}},{name:'a'.repeat(25)}]){
      expect(validGame({...fresh(),...override})).toBe(false);
    }
  });
  it('has matching nonempty English and Traditional Chinese keys',()=>{
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages['zh-TW']).sort());
    for(const value of Object.values(messages['zh-TW']))expect(value.trim().length).toBeGreaterThan(0);
  });
});
