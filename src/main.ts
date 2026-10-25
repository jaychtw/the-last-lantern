import '@fontsource-variable/fraunces';
import '@fontsource-variable/dm-sans';
import './style.css';
import {fresh,places,move,route,distance,beginBattle,resolve,settle,ignite,load,save,stats,level,enemies,encounters,items,shopStock,spells,buy,sell,equip,useItem,rune,rest,travel,talkMira,activeEncounters,encounterAvailable,objectiveKey,claimChest,canStand,
  type Game,type Point,type Lang,type Place,type Battle,type Action,type Scene,type ItemId,type Spell} from './domain';
import {translate} from './i18n';
import {World} from './renderer';
import {Sound} from './audio';

type Panel=null|'start'|'journal'|'settings'|'explore'|'dialogue'|'battle'|'result'|'complete'|'confirm'|'equipment'|'shop'|'puzzle'|'credits';
type Preferences={lang:Lang;reduced:boolean;large:boolean;fast:boolean;volume:number;sound:boolean};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let prefs:Preferences={lang:'en',reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,large:false,fast:false,volume:.3,sound:false};
try{
  const p=JSON.parse(localStorage.getItem('lantern-preferences')??'null');
  if(p&&['en','zh-TW'].includes(p.lang))prefs.lang=p.lang;
  if(p)for(const k of ['reduced','large','fast','sound'] as const)if(typeof p[k]==='boolean')prefs[k]=p[k];
  if(p&&typeof p.volume==='number'&&p.volume>=0&&p.volume<=1)prefs.volume=p.volume;
}catch{/* Use safe defaults; save errors are disclosed once the journey begins. */}
const t=(key:string,n?:number)=>translate(prefs.lang,key,n);
let game=fresh(),panel:Panel='start',battle:Battle|null=null,busy=false,magic=false;
let dialogue:string[]=[],line=0,speaker='mira',nearest:Place|undefined,path:Point[]=[],pendingPlace:Place|undefined;
let toastTimer:ReturnType<typeof setTimeout>|undefined,held=new Set<string>(),touchDirection:Point={x:0,y:0};
let autosaveProtected=false,confirmation:()=>void=()=>{},confirmText='',confirmReturn:Panel='settings';
let completionKind='beacon',transitioning=false;
let elapsedSave=0,lastFocus:HTMLElement|null=null;
const sound=new Sound();
const app=document.querySelector<HTMLDivElement>('#app')!;
const lanternIcon='<svg viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M14 13V8a6 6 0 0 1 12 0v5M11 15h18l3 23H8l3-23Z" stroke="currentColor" stroke-width="2"/><path d="M8 39h24M13 44h14M20 16v20" stroke="currentColor" stroke-width="2"/><path d="M20 33c-8-3-4-9 1-14-1 5 7 10-1 14Z" fill="currentColor"/></svg>';
const icons={journal:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4Zm8 2v15M7 8h2M7 12h2M15 8h2M15 12h2"/></svg>',explore:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m16 8-3 6-5 2 3-6 5-2Z"/></svg>',settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></svg>',sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-5v16l-5-5H4V9Zm13-2q6 5 0 10M16 10q2 2 0 4"/></svg>'};
app.innerHTML=`<header class="site-header"><a class="brand" href="#" id="brand">${lanternIcon}<span id="brand-title"></span></a><span class="header-note" id="review-label"></span><div class="header-actions"><button id="sound" class="icon-button">${icons.sound}</button><button id="language" class="language-button"></button><button id="settings-top" class="icon-button">${icons.settings}</button></div></header>
<main><section class="chapter-heading"><div><p class="eyebrow"><span id="chapter-label"></span><i></i><span id="chapter-name"></span></p><h1 id="location"></h1><p class="location-sub" id="location-sub"></p></div><div class="heading-ornament" aria-hidden="true">✧<span></span></div></section>
<section class="game-frame" aria-label="The Last Lantern"><div id="world" role="img" tabindex="0"></div><div class="vignette" aria-hidden="true"></div><div id="place-markers"></div>
<div class="scene-top"><div class="area-badge"><span class="sun-symbol" aria-hidden="true">☼</span><div><span class="tiny" id="area-label"></span><strong id="area-name"></strong></div></div><button id="quest" class="quest-card"><span class="quest-glyph" aria-hidden="true">◇</span><span><span class="tiny" id="objective-label"></span><span id="objective-text"></span></span><span class="quest-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></span></button></div>
<div class="scene-bottom"><div class="hero-card"><div class="hero-portrait"><img src="${import.meta.env.BASE_URL}art3d/rowan-portrait.webp" alt=""/></div><div class="hero-stats"><div class="hero-name"><strong id="hero-name"></strong><span id="level"></span></div><div class="stat-line"><span>HP</span><div class="stat-track"><i id="hp-bar"></i></div><b id="hp-value"></b></div><div class="stat-line mana"><span>MP</span><div class="stat-track"><i id="mp-bar"></i></div><b id="mp-value"></b></div></div></div><div id="interact-wrap"><span class="interact-name" id="interact-name"></span><button id="interact" class="interact-button"><kbd>E</kbd><span></span></button></div></div>
<div id="toast" role="status" aria-live="polite"></div><div id="loading" role="status"></div></section>
<div class="under-game"><div class="keyboard-hints"><span id="keys"></span><span id="keys2"></span></div><nav class="game-nav"><button id="explore">${icons.explore}<span></span></button><button id="journal">${icons.journal}<span></span></button><button id="equipment">${icons.journal}<span></span></button><button id="settings">${icons.settings}<span></span></button></nav></div>
<div class="touch-controls"><div class="dpad"><button data-dir="up">↑</button><button data-dir="left">←</button><span aria-hidden="true">✧</span><button data-dir="right">→</button><button data-dir="down">↓</button></div><p id="tap-hint"></p><button id="touch-interact" class="touch-action">${lanternIcon}<span></span></button></div>
</main><footer><span id="footer-text"></span><span class="footer-mark">✧</span><span id="gate-label"></span></footer>
<dialog id="panel" aria-labelledby="dialog-title"></dialog><div id="announcer" class="sr-only" aria-live="polite"></div>`;
app.insertAdjacentHTML('beforeend','<div id="scene-loading" hidden role="status"></div>');
const dialog=document.querySelector<HTMLDialogElement>('#panel')!;
const worldHost=document.querySelector<HTMLElement>('#world')!;
const setText=(selector:string,text:string)=>{const el=document.querySelector(selector);if(el)el.textContent=text;};
const art=(name:string)=>`${import.meta.env.BASE_URL}art3d/${({lamplighter:'mira-portrait','hero-head':'rowan-portrait','hand-lantern':'beacon'} as Record<string,string>)[name]??name}.webp`;
const storage={getItem:(key:string)=>localStorage.getItem(key),setItem:(key:string,value:string)=>localStorage.setItem(key,value)};
function preferences(){
  sound.enabled=prefs.sound;sound.volume=prefs.volume;
  document.documentElement.lang=prefs.lang;document.documentElement.dataset.motion=prefs.reduced?'reduced':'full';
  document.documentElement.dataset.text=prefs.large?'large':'normal';
  world.reduced=prefs.reduced;sound.sync(game.scene,panel!==null&&panel!=='battle',panel==='battle');
  try{localStorage.setItem('lantern-preferences',JSON.stringify(prefs));}catch{toast('storageBlocked');}
}
function objective(){return objectiveKey(game);}
function visiblePlaces(){return places[game.scene].filter(p=>p.kind!=='encounter'||encounterAvailable(game,p.id));}
function render(){
  document.documentElement.lang=prefs.lang;
  sound.sync(game.scene,panel!==null&&panel!=='battle',panel==='battle');
  document.querySelector('.game-frame')!.setAttribute('aria-label',t('title'));
  setText('#brand-title',t('title'));setText('#review-label',t('review'));
  setText('#chapter-label',t(game.flags.woodlandLit?'chapter3':game.flags.lit?'chapter2':'chapter'));setText('#chapter-name',t(game.flags.woodlandLit?'chapter3Name':game.flags.lit?'chapter2Name':'chapterName'));
  setText('#location',t(game.scene));setText('#location-sub',t(game.scene+'Sub'));
  setText('#area-label',t('location'));setText('#area-name',t(game.scene));
  setText('#objective-label',t('objective'));setText('#objective-text',t(objective()));
  const st=stats(game);setText('#hero-name',game.name);setText('#level',`${t('levelLabel')} ${st.level}`);
  const hp=battle&&battle.outcome==='active'?battle.hp:game.hp,mp=battle&&battle.outcome==='active'?battle.mp:game.mp;
  setText('#hp-value',`${hp}/${st.hp}`);setText('#mp-value',`${mp}/${st.mp}`);
  document.querySelector<HTMLElement>('#hp-bar')!.style.width=`${hp/st.hp*100}%`;
  document.querySelector<HTMLElement>('#mp-bar')!.style.width=`${mp/st.mp*100}%`;
  setText('#keys',t('keys'));setText('#keys2',t('keys2'));setText('#tap-hint',t('tap'));
  setText('#footer-text',t('footer'));setText('#gate-label',t('gate'));setText('#loading',t('loading'));
  setText('#language',prefs.lang==='en'?'繁體中文':'English');document.querySelector('#language')!.setAttribute('aria-label',t('language'));
  document.querySelector('#sound')!.setAttribute('aria-label',t(prefs.sound?'mute':'unmute'));
  document.querySelector('#sound')!.setAttribute('aria-pressed',String(prefs.sound));
  document.querySelector('#settings-top')!.setAttribute('aria-label',t('settings'));
  worldHost.setAttribute('aria-label',t('canvas'));
  for(const key of ['explore','journal','equipment','settings'])setText(`#${key} span`,t(key));
  for(const key of ['up','left','right','down'])document.querySelector(`[data-dir=${key}]`)!.setAttribute('aria-label',t('walk'+key[0].toUpperCase()+key.slice(1)));
  renderMarkers();renderInteract();renderPanel();
  // Read-only diagnostics for QA; consequential state can only change through game inputs.
  document.documentElement.dataset.scene=game.scene;
  document.documentElement.dataset.progress=game.flags.clear?'clear':game.flags.lit?'complete':game.flags.won?'won':game.flags.talked?'talked':'new';
}
function placeGlyph(p:Place){
  const path=p.kind==='encounter'?'m6 4 14 16M18 4 4 18M3 15l6 6M15 3l6 6':p.kind==='exit'?'M4 12h15m-6-6 6 6-6 6':p.kind==='shop'?'m5 20 9-10M10 4l7 7 4-4-7-7-4 4':p.kind==='door'?'m3 11 9-8 9 8M6 9v12h12V9':p.kind==='beacon'?'M12 3v18M3 12h18m-15-6 12 12M6 18 18 6':p.kind==='chest'?'M4 7h16v14H4V7Zm0 5h16M10 10h4v5h-4z':p.kind==='puzzle'?'m12 3 8 9-8 9-8-9 8-9Z':'M4 6h16v12H4V6Zm4 6h1m3 0h1m3 0h1';
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
}
function renderMarkers(){
  const holder=document.querySelector('#place-markers')!;
  holder.innerHTML=visiblePlaces().filter(p=>p.id!=='chest'||!game.flags.chest).map(p=>`<button class="place-marker" data-place="${p.id}" aria-label="${esc(t(p.label))}"><span aria-hidden="true">${placeGlyph(p)}</span><b>${esc(t(p.label))}</b></button>`).join('');
  updateMarkers();
}
function updateMarkers(){
  for(const p of world.placePositions()){
    const el=document.querySelector<HTMLElement>(`[data-place="${p.id}"]`);if(!el)continue;
    el.style.left=`${p.x}px`;el.style.top=`${p.y+17}px`;
    const visible=p.x>45&&p.x<worldHost.clientWidth-45&&p.y>100&&p.y<worldHost.clientHeight-130;
    el.hidden=!visible;el.tabIndex=visible&&panel===null?0:-1;
  }
}
function renderInteract(){
  const key=nearest?({talk:'talk',chest:'open',door:'enter',exit:'travel',beacon:'light',rest:'rest',encounter:'interact',shop:'shop',puzzle:'puzzle',inn:'rest'}[nearest.kind]):'interact';
  setText('#interact span',t(key));setText('#touch-interact span',t(key));
  setText('#interact-name',nearest?t(nearest.label):'');
  (document.querySelector('#interact') as HTMLButtonElement).disabled=!nearest;
  (document.querySelector('#touch-interact') as HTMLButtonElement).disabled=!nearest;
  document.querySelector('#interact-wrap')!.classList.toggle('available',!!nearest);
}
function toast(key:string){
  setText('#toast',t(key));document.querySelector('#toast')!.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>document.querySelector('#toast')!.classList.remove('visible'),4500);
}
function autoSave(){
  if(autosaveProtected)return;
  if(!save(storage,'auto',game))toast('storageBlocked');
}
function openPanel(next:Panel){
  held.clear();touchDirection={x:0,y:0};
  if(panel===null)lastFocus=document.activeElement as HTMLElement;
  panel=next;renderPanel();
}
function closePanel(){
  if(busy)return;
  if(battle&&battle.outcome==='active'){panel='battle';renderPanel();return;}
  panel=null;dialog.close();world.app.start();lastFocus?.focus();worldHost.focus({preventScroll:true});
}
function modalHeader(title:string,eyebrow='',closable=true){return `<div class="modal-tools"><button data-command="language" class="language-button" aria-label="${esc(t('language'))}">${prefs.lang==='en'?'繁體中文':'English'}</button>${closable?`<button data-command="close" class="icon-button" aria-label="${t('close')}">×</button>`:''}</div>${eyebrow?`<p class="eyebrow">${esc(eyebrow)}</p>`:''}<h2 id="dialog-title">${esc(title)}</h2>`;}
function action(command:string,label:string,cls='primary'){return `<button data-command="${command}" class="${cls}">${esc(label)}</button>`;}
function renderPanel(){
  world.stopBattle();sound.sync(game.scene,panel!==null&&panel!=='battle',panel==='battle');
  if(!panel){if(dialog.open)dialog.close();world.app.start();return;}
  world.app.stop();world.render();const st=stats(game);
  const focused=(document.activeElement as HTMLElement)?.dataset.command;
  let html='';dialog.className=`panel-${panel}`;
  if(panel==='start'){
    const saved=load(storage,'auto');
    html=modalHeader(t('title'),t('gate'),false)+`<div class="welcome-lantern"><img src="${art('rowan-idle')}" alt=""/></div><p class="welcome-tagline">${t('subtitle')}</p><p>${t('startText')}</p><label class="name-label" for="hero-input">${t('name')}</label><input id="hero-input" maxlength="24" autocomplete="off" value="${esc(t('defaultName'))}"/><div class="stack">${saved.kind==='ok'?action('continue',t('continue')):''}${action('begin',t(saved.kind==='ok'?'newJourney':'begin'),saved.kind==='ok'?'secondary':'primary')}</div><p class="fine">${t('startNote')}</p>${saved.kind==='corrupt'?`<p class="warning">${t('storageCorrupt')}</p>`:''}`;
  }else if(panel==='dialogue'){
    html=modalHeader(t(speaker),'',false)+`<div class="dialogue-body"><img src="${art(speaker==='mira'?(line===0?'lamplighter':'mira-thoughtful'):speaker==='guardian'?'enemy-guardian':speaker==='chest'?'chest-open':speaker==='rest'?'hearth':'hand-lantern')}" alt=""/><p>${esc(t(dialogue[line]))}</p></div><div class="dialogue-foot"><span aria-hidden="true">${'●'.repeat(line+1)}${'○'.repeat(dialogue.length-line-1)}</span>${action('next-line',t(line<dialogue.length-1?'next':'done'))}</div>`;
  }else if(panel==='journal'){
    html=modalHeader(t('journalTitle'),t('journal'))+`<div class="journal-intro">${lanternIcon}<div><h3>${t('journalIntro')}</h3><p>${t('journalBody')}</p></div></div><ol class="quest-list">${(['talked','chest','won','lit','thorn','root','caveRunes','woodlandLit','towerRunes','guardian','towerLit'] as const).map((flag,i)=>`<li class="${game.flags[flag]?'done':''}"><span role="img" aria-label="${t(game.flags[flag]?'completeStatus':'notComplete')}">${game.flags[flag]?'✓':i+1}</span>${t(['stepTalk','stepChest','stepBattle','stepLantern','questShrine','questRoot','item_mossSeal','questWoodland','item_towerKey','questGuardian','questFinal'][i])}</li>`).join('')}</ol><div class="satchel"><span>${t('coins')} <b>${game.coins}</b></span><span>${t('tonics')} <b>${game.tonics}</b></span><span>${t('xp')} <b>${game.xp}</b></span></div><p class="fine">${t('sliceNote')}</p>${game.flags.clear?action('credits',t('credits')):''}`;
  }else if(panel==='explore'){
    html=modalHeader(t('nearby'),t(game.scene))+`<p>${t('routeHint')}</p><div class="destination-list">${visiblePlaces().map(p=>`<button data-destination="${p.id}"><span>${placeGlyph(p)}</span><strong>${t(p.label)}</strong><span aria-hidden="true">›</span></button>`).join('')}</div>`;
  }else if(panel==='settings'){
    html=modalHeader(t('preferences'),t('settings'))+`<p>${t('paused')}</p><div class="settings-list">${(['reduced','large','fast','sound'] as const).map(k=>`<label><span>${t(k==='fast'?'speed':k)}</span><input type="checkbox" data-pref="${k}" ${prefs[k]?'checked':''}/></label>`).join('')}<label><span>${t('volume')}</span><input type="range" min="0" max="1" step=".05" value="${prefs.volume}" data-pref="volume"/></label></div>${!battle?`<h3>${t('saves')}</h3><div class="save-slots">${[1,2,3].map(n=>{
      const slot=load(storage,String(n));return `<div><strong>${n}</strong><span>${slot.kind==='ok'?`${esc(slot.game.name)} · ${t(slot.game.scene)}`:slot.kind==='empty'?t('empty'):t('storageCorrupt')}</span><button data-save="${n}" aria-label="${t('saveSlot',n)}">↓</button><button data-load="${n}" ${slot.kind!=='ok'?'disabled':''} aria-label="${t('loadSlot',n)}">↑</button></div>`;}).join('')}</div><p class="fine">${t('savedNote')}</p>${action('restart',t('restart'),'text-button')}`:''}`;
  }else if(panel==='confirm'){
    html=modalHeader(t(confirmText),'',false)+`<div class="confirmation-actions">${action('cancel-confirm',t('cancel'),'secondary')}${action('confirm',t(confirmText==='innConfirm'?'rest':confirmText==='sellQuestion'?'sell':confirmText==='restartQuestion'?'restartConfirm':confirmText==='loadConfirm'?'loadJourney':confirmText==='newQuestion'?'startFresh':'replace'))}</div>`;
  }else if(panel==='battle'&&battle){
    const b=battle,e=enemies[b.enemy];
    const commandButton=(a:Action,title:string,desc:string,icon:string,disabled=false)=>`<button data-action="${a}" ${busy||disabled?'disabled':''}><span class="command-symbol" aria-hidden="true">${icon}</span><span><strong>${t(title)}</strong><small>${t(desc)}</small></span><b aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></b></button>`;
    html=`<div class="battle-top"><div><p class="eyebrow">${t('encounter')}</p><h2 id="dialog-title">${t('enemy_'+b.enemy)}</h2></div><button data-command="pause-battle" class="icon-button" aria-label="${t('settings')}">${icons.settings}</button></div><div class="battle-stage ${busy?'is-resolving':''}" data-attack="${dialog.dataset.attack??''}" data-phase="${dialog.dataset.phase??'player'}"><div class="battle-atmosphere"></div><div class="enemy-card"><span class="tiny">${t(e.boss?'boss':'ordinary')}</span><div class="enemy-track"><i style="width:${b.enemyHp/e.hp*100}%"></i></div><small>${b.enemyHp} / ${e.hp} HP</small><small class="element-line">${t('ember')} ×${e.fire} · ${t('gleam')} ×${e.light}</small><small class="element-line">${t(e.speed>b.speed?'foeFirst':'heroFirst')}</small></div><span class="battle-impact" aria-hidden="true">${dialog.dataset.damage??''}</span><div class="battle-hero-status"><strong>${esc(game.name)}</strong><span>HP ${b.hp}/${b.maxHp} · MP ${b.mp}/${b.maxMp}</span></div></div><div class="turn-status ${b.charged?'charged':''}" role="status">${busy?t('resolving'):b.charged?t(b.enemy==='dewdrop'?'charged':'heavyNotice'):t('yourTurn')}<span>${t('round')} ${b.round}${b.ward?` · ${t('wardStatus')} ${b.ward}`:''}${b.focus?` · ${t('focusStatus')}`:''}</span></div><div class="battle-commands ${magic?'magic-menu':''}">${magic?`${(Object.keys(spells) as Spell[]).filter(id=>st.level>=spells[id].level).map(id=>commandButton(id,id,id+'Sub','✧',b.mp<spells[id].cost)).join('')}${action('magic-back',t('back'),'magic-back')}`:`${commandButton('attack','attack','attackSub','⟋')}<button data-command="magic" ${busy?'disabled':''}><span class="command-symbol">✧</span><span><strong>${t('magic')}</strong><small>${t('magicSub')}</small></span></button>${commandButton('tonic','item','itemSub','♧',b.tonics===0)}${commandButton('guard','guard','guardSub','⬡')}${commandButton('ether','ether','etherSub','✧',b.ethers===0)}${commandButton('flee','flee','fleeSub','↝',e.boss)}` }</div><details class="battle-log"><summary>${t('round')} ${b.round} · ${t('journal')}</summary><div role="log">${b.logs.map(l=>`<p>${t(l.key,l.n)}</p>`).join('')}</div></details><p id="battle-live" class="sr-only" aria-live="polite">${b.logs.slice(-2).map(l=>t(l.key,l.n)).join(' ')}</p>`;
  }else if(panel==='result'&&battle){
    const won=battle.outcome==='victory',lost=battle.outcome==='defeat';
    html=modalHeader(t(won?'victory':lost?'defeat':'escapedTitle'),t(won?'victoryLog':lost?'defeatLog':'escaped'),false)+`<div class="result-emblem">${won?'✧':lost?'⌂':'↝'}</div><p>${t(won?'victoryDetail':lost?'defeatDetail':'escapedDetail')}</p>${won?`<p class="reward-line">+${enemies[battle.enemy].xp} ${t('xp')} · +${enemies[battle.enemy].coins} ${t('coins')}</p>${stats(game).level>battle.heroLevel?`<p>${t('levelUp',stats(game).level)}</p>`:''}`:''}${action('battle-done',t(lost?'returnHome':'keepGoing'))}`;
  }else if(panel==='equipment'){
    html=modalHeader(t('inventoryTitle'),t('equipment'))+`<div class="equipment-summary"><img src="${art('rowan-idle')}" alt=""/><div><h3>${esc(game.name)} · ${t('levelLabel')} ${st.level}</h3><p>HP ${game.hp}/${st.hp} · MP ${game.mp}/${st.mp}</p><p>${t('attackStat')} ${st.attack} · ${t('defenseStat')} ${st.defense} · ${t('speedStat')} ${st.speed}</p>${Object.entries(game.equipment).map(([slot,id])=>`<p>${t(slot)}: <strong>${id?t('item_'+id):t('none')}</strong></p>`).join('')}</div></div><p class="fine">${t('inventoryNote')}</p><div class="gear-list">${Object.entries(game.inventory).map(([id,count])=>{const item=items[id as ItemId],on=Object.values(game.equipment).includes(id as ItemId);return `<div class="gear-row"><img src="${art(item.art)}" alt=""/><div><strong>${t('item_'+id)} ×${count}</strong><small>${item.quest?t('journal'):`${t('attackStat')} +${item.attack} · ${t('defenseStat')} +${item.defense}`}</small></div>${item.slot?`<button aria-label="${t('equip')} ${t('item_'+id)}" data-equip="${id}" ${on?'disabled':''}>${t(on?'equipped':'equip')}</button>`:''}</div>`;}).join('')}${(['tonic','ether'] as const).map(id=>`<div class="gear-row"><div><strong>${t('item_'+id)} ×${id==='tonic'?game.tonics:game.ethers}</strong><small>${t(id==='tonic'?'itemSub':'etherSub')}</small></div><button aria-label="${t('use')} ${t('item_'+id)}" data-use="${id}">${t('use')}</button></div>`).join('')}</div><h3>${t('spellsTitle')}</h3><div class="spell-list">${Object.entries(spells).map(([id,v])=>`<p>${t(id)} · ${st.level>=v.level?t(id+'Sub'):`${t('learnAt')} ${v.level}`}</p>`).join('')}</div>`;
  }else if(panel==='shop'){
    html=modalHeader(t('shop'),t('smith'))+`<p>${t('smithLine')}</p><p class="shop-coins">${t('coins')}: <strong>${game.coins}</strong></p><p class="fine">${t('shopNote')}</p><div class="gear-list">${shopStock.map(id=>{const item=items[id];return `<div class="gear-row"><img src="${art(item.art)}" alt=""/><div><strong>${t('item_'+id)}</strong><small>${item.slot?`${t('attackStat')} +${item.attack} · ${t('defenseStat')} +${item.defense}`:t(id==='tonic'?'itemSub':'etherSub')}</small></div><button aria-label="${t('buy')} ${t('item_'+id)} · ${item.price} ${t('coins')}" data-buy="${id}" ${game.coins<item.price?'disabled':''}>${t('buy')} · ${item.price}</button></div>`;}).join('')}</div><h3>${t('sell')}</h3><div class="gear-list">${Object.entries(game.inventory).filter(([id])=>items[id as ItemId].price>0&&!items[id as ItemId].quest).map(([id,count])=>`<div class="gear-row"><div>${t('item_'+id)} ×${count}</div><button aria-label="${t('sell')} ${t('item_'+id)}" data-sell="${id}" ${Object.values(game.equipment).includes(id as ItemId)?'disabled':''}>${t('sell')} · ${Math.floor(items[id as ItemId].price/2)}</button></div>`).join('')}</div>`;
  }else if(panel==='puzzle'){
    html=modalHeader(t('puzzle'),t(game.scene))+`<p>${t('runeHint')}</p><p role="status">${t('runeProgress')}: ${game.runes.length}/3</p><div class="rune-buttons">${['runeSun','runeLeaf','runeMoon'].map((key,i)=>`<button data-rune="${i}">${t(key)}</button>`).join('')}</div>`;
  }else if(panel==='credits'){
    html=modalHeader(t('credits'))+`<p>${t('creditsText')}</p><p>${t('clearSaved')}</p>`;
  }else if(panel==='complete'){
    const final=completionKind==='towerBeacon',woodland=completionKind==='woodlandBeacon';
    html=modalHeader(t(final?'ending':woodland?'woodlandComplete':'completed'),t(final?'towerBeacon':woodland?'woodlandBeacon':'completeBadge'),false)+`<div class="completed-art"><img src="${art('beacon')}" alt=""/></div><p>${t(final?'endingText':woodland?'woodlandText':'completeText')}</p><p class="fine">${t(final?'clearSaved':'completeNote')}</p>${final?action('credits',t('credits')):''}${action('complete-done',t('keepGoing'))}`;

  }
  dialog.innerHTML=html;
  if(!dialog.open)dialog.showModal();
  if(panel==='battle')world.mountBattle(dialog.querySelector<HTMLElement>('.battle-stage')!,dialog.dataset.attack??'',dialog.dataset.phase??'player',busy,battle!.enemy,game.scene,prefs.fast);
  if(focused)dialog.querySelector<HTMLButtonElement>(`[data-command="${focused}"]`)?.focus({preventScroll:true});
}
function switchLanguage(){prefs.lang=prefs.lang==='en'?'zh-TW':'en';preferences();render();}
function say(lines:string[],who='mira'){
  path=[];pendingPlace=undefined;dialogue=lines;line=0;speaker=who;sound.cue('open');openPanel('dialogue');
}
async function restoreGame(next:Game,saveAfter=true){
  if(transitioning)return;transitioning=true;held.clear();touchDirection={x:0,y:0};world.app.stop();
  const curtain=document.querySelector<HTMLElement>('#scene-loading')!;curtain.textContent=t('loading');curtain.hidden=false;worldHost.setAttribute('aria-busy','true');
  try{await world.prepare(next);game=next;path=[];pendingPlace=undefined;nearest=undefined;world.build(game);if(saveAfter)autoSave();panel=null;render();worldHost.focus({preventScroll:true});}
  catch(error){console.error('Scene load failed',error);render();toast('loadError');}
  finally{transitioning=false;curtain.hidden=true;worldHost.removeAttribute('aria-busy');}
}
function transition(scene:Scene,x?:number,y?:number){
  const next=structuredClone(game),error=travel(next,scene);if(error){toast(error);return;}if(x!==undefined&&y!==undefined){next.x=x;next.y=y;}
  void restoreGame(next);
}
function interact(p=nearest){
  if(!p||panel||busy||transitioning||distance(game,p)>100)return;
  if(p.id==='mira'){say(talkMira(game));autoSave();render();}
  else if(p.id==='smith')openPanel('shop');
  else if(p.kind==='inn'){confirmText='innConfirm';confirmReturn=null;confirmation=()=>{const error=rest(game,true);if(error){panel=null;render();toast(error);}else{panel=null;say(['rested'],'rest');autoSave();render();}};openPanel('confirm');}
  else if(p.kind==='puzzle'){
    if(game.flags[p.id==='cave-runes'?'caveRunes':'towerRunes'])say(['runeSolved'],'beacon');else openPanel('puzzle');
  }else if(p.kind==='chest'){
    say([claimChest(game,p.id)],'chest');autoSave();world.build(game);render();
  }else if(p.target){if(p.id==='outside')transition('town',350,460);else transition(p.target);}
  else if(p.id==='rest'){rest(game);say(['rested'],'rest');autoSave();render();}
  else if(p.id==='notes')say(['notesLine','miraRoads'],'notes');
  else if(p.id==='guardianStory'){game.flags.guardianHeard=true;say([game.flags.guardian?'guardianAfter':'guardianStory'],'guardian');autoSave();}
  else if(p.kind==='encounter'&&encounterAvailable(game,p.id))startBattle(p.id);
  else if(p.kind==='beacon'){
    const lit=p.id==='beacon'?game.flags.lit:p.id==='woodlandBeacon'?game.flags.woodlandLit:game.flags.towerLit;
    if(lit){say([p.id==='towerBeacon'?'endingText':p.id==='woodlandBeacon'?'woodlandText':'completeText'],'beacon');return;}
    if(!ignite(game,p.id)){say([p.id==='beacon'?'lockedBeacon':p.id==='woodlandBeacon'?'lockedWoodland':'lockedTower'],'beacon');return;}
    completionKind=p.id;world.build(game);sound.cue('light');autoSave();openPanel('complete');render();
  }
}
function walkTo(p:Point,place?:Place){
  if(panel||busy||transitioning)return;
  const d=distance(game,p);
  if(place&&place.kind!=='encounter'&&d<82){interact(place);return;}
  const avoid=activeEncounters(game).filter(e=>!(place?.kind==='encounter'&&e.id===place.id));
  const candidates=place&&place.kind!=='encounter'?Array.from({length:12},(_,i)=>{const angle=Math.atan2(game.y-p.y,game.x-p.x)+i*Math.PI/6;return {x:p.x+Math.cos(angle)*72,y:p.y+Math.sin(angle)*72};}).concat([p]):[p];
  let next:Point[]=[];
  for(const target of candidates){if(!canStand(game.scene,target.x,target.y)||avoid.some(e=>distance(e,target)<85))continue;next=route(game.scene,game,target,avoid);if(next.length)break;}
  if(!next.length){toast('noRoute');return;}
  path=next;pendingPlace=place;
}
function startBattle(id='clearing'){
  path=[];pendingPlace=undefined;held.clear();touchDirection={x:0,y:0};
  if(id==='guardian'&&!game.flags.guardianHeard){game.flags.guardianHeard=true;say(['guardianStory'],'guardian');autoSave();return;}autoSave();battle=beginBattle(game,id);magic=false;openPanel('battle');sound.cue('open');render();
}
async function battleAction(action:Action){
  if(!battle||busy)return;
  const result=resolve(battle,action);if(result.error){toast(result.error);return;}
  busy=true;magic=false;dialog.dataset.attack=action;
  const logs=result.battle.logs.slice(battle.logs.length),counter=logs.find(l=>l.key==='enemyHit'||l.key==='heavyHit'),hit=logs.find(l=>['strike','critical','emberHit','gleamHit'].includes(l.key));
  const enemyFirst=enemies[battle.enemy].speed>battle.speed;
  const phases=counter?(enemyFirst?['enemy','player']:['player','enemy']):['player'];
  for(const phase of phases){
    if(phase==='player'&&result.battle.outcome==='defeat'&&!hit)continue;
    dialog.dataset.phase=phase;dialog.dataset.damage=String((phase==='enemy'?counter:hit)?.n??'');renderPanel();
    sound.cue(phase==='player'&&action in spells?'magic':'attack');
    await new Promise(r=>setTimeout(r,prefs.reduced?60:prefs.fast?240:phase==='enemy'?550:850));
  }
  battle=result.battle;busy=false;dialog.dataset.damage='';
  if(battle.outcome!=='active'){
    game=settle(game,battle);panel='result';await world.prepare(game);world.build(game);autoSave();
    if(battle.outcome==='victory')sound.cue('win');
  }
  render();
  if(panel==='battle')dialog.querySelector<HTMLButtonElement>('[data-action="attack"]')?.focus({preventScroll:true});
}
const world=new World(worldHost,dt=>{
  if(!panel&&!transitioning&&!document.hidden){
    game.playtime+=dt;elapsedSave+=dt;
    let dx=touchDirection.x,dy=touchDirection.y;
    if(held.has('arrowleft')||held.has('a'))dx--;
    if(held.has('arrowright')||held.has('d'))dx++;
    if(held.has('arrowup')||held.has('w'))dy--;
    if(held.has('arrowdown')||held.has('s'))dy++;
    if(dx||dy){path=[];pendingPlace=undefined;}
    else if(path.length){
      const p=path[0],d=distance(game,p);
      if(d<5){path.shift();if(!path.length&&pendingPlace){const place=pendingPlace;pendingPlace=undefined;interact(place);}}
      else{dx=(p.x-game.x)/d;dy=(p.y-game.y)/d;}
    }
    const length=Math.hypot(dx,dy);if(length>0)move(game,dx/length*175*dt,dy/length*175*dt);
    world.update(game,dt,length>0,dx,dy);
    const p=visiblePlaces().filter(p=>distance(game,p)<90).sort((a,b)=>distance(game,a)-distance(game,b))[0];
    if(p?.id!==nearest?.id){nearest=p;renderInteract();}
    const contact=activeEncounters(game).find(e=>distance(game,e)<60);if(contact)startBattle(contact.id);
    if(elapsedSave>20){elapsedSave=0;autoSave();}
  }else world.update(game,0,false);
  updateMarkers();
},p=>{
  if(panel||transitioning)return;
  const enemy=activeEncounters(game).find(e=>distance(p,e)<65);walkTo(enemy??p,enemy?places[game.scene].find(q=>q.id===enemy.id):undefined);
});

document.addEventListener('click',e=>{
  if(transitioning)return;
  const el=(e.target as HTMLElement).closest<HTMLElement>('button,a');if(!el)return;
  const id=el.id,command=el.dataset.command;
  if(id==='brand'){e.preventDefault();if(!panel)openPanel('journal');return;}
  if(id==='language'||command==='language'){switchLanguage();return;}
  if(id==='sound'){prefs.sound=!prefs.sound;preferences();sound.cue('open');render();return;}
  if(['settings','settings-top','journal','quest','explore','equipment'].includes(id)&&panel===null){openPanel(id==='settings-top'?'settings':id==='quest'?'journal':id as Panel);return;}
  if(id==='interact'||id==='touch-interact'){interact();return;}
  if(el.dataset.place&&!panel){const p=places[game.scene].find(p=>p.id===el.dataset.place)!;
    if(distance(game,p)<90)interact(p);else walkTo(p,p);return;}
  if(el.dataset.destination){const p=places[game.scene].find(p=>p.id===el.dataset.destination)!;
    closePanel();walkTo(p,p);return;}
  if(el.dataset.action){void battleAction(el.dataset.action as Action);return;}
  if(el.dataset.buy){const error=buy(game,el.dataset.buy as ItemId);autoSave();renderPanel();toast(error??'bought');return;}
  if(el.dataset.equip){const error=equip(game,el.dataset.equip as ItemId);autoSave();renderPanel();render();toast(error??'equipDone');return;}
  if(el.dataset.use){const error=useItem(game,el.dataset.use as 'tonic'|'ether');autoSave();render();toast(error??'supplyUsed');return;}
  if(el.dataset.sell){const id=el.dataset.sell as ItemId;confirmText='sellQuestion';confirmReturn='shop';confirmation=()=>{const error=sell(game,id);panel='shop';autoSave();renderPanel();toast(error??'sold');};openPanel('confirm');return;}
  if(el.dataset.rune){const before=game.runes.length,solved=rune(game,Number(el.dataset.rune));autoSave();if(solved){panel=null;say(['runeSolved'],'beacon');}else{renderPanel();if(before>0&&game.runes.length===0)toast('runeReset');}return;}
  if(el.dataset.save){
    const slot=el.dataset.save,existing=load(storage,slot);
    const execute=()=>{if(save(storage,slot,game))toast('saved');else toast('storageBlocked');panel='settings';renderPanel();};
    if(existing.kind==='empty')execute();else{confirmation=execute;confirmText='overwrite';confirmReturn='settings';openPanel('confirm');}return;
  }
  if(el.dataset.load){
    const slot=el.dataset.load;confirmation=()=>{const result=load(storage,slot);
      if(result.kind==='ok'){void restoreGame(result.game).then(()=>toast('loaded'));}
      else{panel='settings';renderPanel();toast(result.kind==='blocked'?'storageBlocked':'storageCorrupt');}};
    confirmText='loadConfirm';confirmReturn='settings';openPanel('confirm');return;
  }
  if(!command)return;
  if(command==='begin'){
    const input=document.querySelector<HTMLInputElement>('#hero-input');const name=input?.value.trim().slice(0,24)||t('defaultName');
    const current=load(storage,'auto');autosaveProtected=current.kind==='corrupt';
    const start=()=>{
      preferences();void restoreGame(fresh(name));
      if(autosaveProtected)toast('autoKept');else if(current.kind==='blocked')toast('storageBlocked');
    };
    if(current.kind==='ok'){confirmation=start;confirmText='newQuestion';confirmReturn='start';openPanel('confirm');}else start();
    return;
  }
  if(command==='continue'){
    const saved=load(storage,'auto');if(saved.kind==='ok'){preferences();void restoreGame(saved.game,false);}return;
  }
  if(command==='close'){closePanel();return;}
  if(command==='next-line'){if(line<dialogue.length-1){line++;renderPanel();}else{closePanel();render();}return;}
  if(command==='magic'){magic=true;renderPanel();return;}
  if(command==='magic-back'){magic=false;renderPanel();return;}
  if(command==='pause-battle'&&!busy){openPanel('settings');return;}
  if(command==='battle-done'){battle=null;closePanel();render();return;}
  if(command==='credits'){openPanel('credits');return;}
  if(command==='complete-done'){closePanel();render();return;}
  if(command==='restart'){
    confirmText='restartQuestion';confirmReturn='settings';confirmation=()=>{void restoreGame(fresh(t('defaultName')));};openPanel('confirm');return;
  }
  if(command==='confirm'){confirmation();return;}
  if(command==='cancel-confirm'){openPanel(confirmReturn);return;}
});
dialog.addEventListener('change',e=>{
  const input=e.target as HTMLInputElement,k=input.dataset.pref;
  if(k==='volume')prefs.volume=Number(input.value);
  else if(k&&['reduced','large','fast','sound'].includes(k))prefs[k as 'reduced'|'large'|'fast'|'sound']=input.checked;
  preferences();
});
dialog.addEventListener('cancel',e=>{e.preventDefault();if(panel==='battle'&&!busy)openPanel('settings');else if(panel!=='start'&&panel!=='result'&&panel!=='complete'&&panel!=='dialogue'&&panel!=='confirm')closePanel();});
document.addEventListener('keydown',e=>{
  if(panel||transitioning)return;
  const key=e.key.toLowerCase();
  if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key)){
    e.preventDefault();held.add(key);
  }else if((key==='e'||key==='enter'||key===' ')&&document.activeElement===worldHost){e.preventDefault();interact();}
  else if(key==='escape'){e.preventDefault();openPanel('settings');}
});
document.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{held.clear();touchDirection={x:0,y:0};});
document.addEventListener('visibilitychange',()=>{
  held.clear();touchDirection={x:0,y:0};if(document.hidden&&panel===null){autoSave();openPanel('settings');}
});
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-dir]')){
  button.addEventListener('pointerdown',e=>{
    if(panel||transitioning)return;e.preventDefault();button.setPointerCapture(e.pointerId);path=[];
    touchDirection=({up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}} as Record<string,Point>)[button.dataset.dir!];
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{touchDirection={x:0,y:0};});
  button.addEventListener('click',()=>{if(!panel&&!transitioning){const p=({up:{x:0,y:-35},down:{x:0,y:35},left:{x:-35,y:0},right:{x:35,y:0}} as Record<string,Point>)[button.dataset.dir!];move(game,p.x,p.y);}});
}
Object.defineProperty(window,'__lantern',{value:()=>({game:structuredClone(game),battle:battle?structuredClone(battle):null,panel,busy,metrics:world.metrics()}),writable:false});

setText('#loading',t('loading'));
world.init(game).then(()=>{
  document.querySelector('#loading')!.remove();preferences();render();
}).catch(error=>{
  console.error('Renderer startup failed',error);setText('#loading',t('loadError'));
});
