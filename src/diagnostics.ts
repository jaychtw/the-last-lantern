import './diagnostics.css';
import {frameSummary} from './diagnostic-stats';
import {diagnosticCopy} from './diagnostic-copy';

type Heap={usedJSHeapSize:number;totalJSHeapSize:number;jsHeapSizeLimit:number};
type Sample={startedAt:string;start:number;durationLimitMs:number;durationMs:number;reason:string;frames:number[];buckets:Record<string,number[]>;boundaries:{from:string;to:string;ms:number}[];memory:ReturnType<typeof memory>[];longTasks:{atMs:number;durationMs:number}[];longTaskOverflow:number;environment:ReturnType<typeof environment>;observations:{device:string;canvasAcceleration:string;notes:string}};
const maxFrames=72000,maxSamples=12;
function environment(){return {userAgent:navigator.userAgent,platform:navigator.platform,logicalCPUs:navigator.hardwareConcurrency??null,approximateDeviceRAMGiB:(navigator as Navigator&{deviceMemory?:number}).deviceMemory??null,viewport:{width:innerWidth,height:innerHeight},dpr:devicePixelRatio,screen:{width:screen.width,height:screen.height},secureContext:isSecureContext,crossOriginIsolated,canvas2DBackend:'Unavailable to standard page APIs',physicalHardwareVerifiedByAutomation:false,runtimeFile:document.querySelector<HTMLScriptElement>('script[type=module]')?.src.split('/').at(-1)??null};}
function memory(){
  const heap=(performance as Performance&{memory?:Heap}).memory;
  const m=typeof window.__lantern==='function'?window.__lantern().metrics:null;
  return {atMs:performance.now(),jsHeap:heap?{usedBytes:heap.usedJSHeapSize,totalBytes:heap.totalJSHeapSize,limitBytes:heap.jsHeapSizeLimit,note:'Browser-specific/coarse JS heap only, not native images, canvas, process RAM or device memory.'}:null,
    logicalTextures:m?{count:m.textures,rgbaPixelBytes:m.decodedTextureBytes,battleBackgroundPixelBytes:m.battleBackgroundBytes,renderDPR:m.resolution}:null,
    totalNativeOrProcessMemoryBytes:null,note:'Logical texture pixels are not measured RAM. Native/process memory is unavailable through this portable diagnostic.'};
}
export function enableDiagnostics(clearInput:()=>void){
  const lang=()=>document.documentElement.lang==='zh-TW'?'zh-TW':'en';
  const t=(key:keyof typeof diagnosticCopy.en)=>diagnosticCopy[lang()][key];
  const launch=document.createElement('button');launch.id='diagnostic-launch';launch.type='button';
  const dialog=document.createElement('dialog');dialog.id='diagnostic-panel';dialog.setAttribute('aria-labelledby','diagnostic-title');
  dialog.innerHTML=`<h2 id="diagnostic-title" data-copy="title"></h2><p data-copy="intro"></p><p data-copy="limits"></p>
    <label><span data-copy="hardware"></span><select data-diagnostic="device">${['unknown','desktop','android','ios','emulated'].map(k=>`<option value="${k}" data-copy="${k}"></option>`).join('')}</select></label>
    <label><span data-copy="acceleration"></span><select data-diagnostic="acceleration">${['unknown','accelerated','software'].map(k=>`<option value="${k}" data-copy="${k}"></option>`).join('')}</select></label><p data-copy="gpuHint"></p>
    <label><span data-copy="notes"></span><textarea data-diagnostic="notes" maxlength="400"></textarea></label>
    <div class="diagnostic-actions">${['start','long','probe','download','copy','clear','close'].map(k=>`<button type="button" data-diagnostic="${k}" data-copy="${k}"></button>`).join('')}</div>
    <p data-diagnostic="status" role="status"></p><pre data-diagnostic="context"></pre><pre data-diagnostic="summary"></pre><p data-copy="sampling"></p><p data-copy="memory"></p>
    <label><span data-copy="output"></span><textarea data-diagnostic="output" readonly spellcheck="false"></textarea></label><p data-copy="disabledHint"></p>`;
  document.body.append(launch,dialog);
  // Reuse the touch hint's space; never cover the d-pad or game menu buttons.
  const hint=document.querySelector<HTMLElement>('#tap-hint')!;
  function mountLaunch(){const embedded=innerWidth<=1000;hint.hidden=embedded;launch.classList.toggle('diagnostic-embedded',embedded);if(embedded){if(launch.parentElement!==hint.parentElement)hint.after(launch);}else if(launch.parentElement!==document.body)document.body.append(launch);}
  mountLaunch();window.addEventListener('resize',mountLaunch);
  const get=<T extends HTMLElement>(name:string)=>dialog.querySelector<T>(`[data-diagnostic="${name}"]`)!;
  let active:Sample|null=null,last:number|undefined,lastKey='',timer:ReturnType<typeof setTimeout>|undefined,raf=0,discardedSamples=0,webgl:unknown=null;
  const samples:Sample[]=[];const summaries=new WeakMap<Sample,ReturnType<typeof frameSummary>>();
  const observations=()=>({device:get<HTMLSelectElement>('device').value,canvasAcceleration:get<HTMLSelectElement>('acceleration').value,notes:get<HTMLTextAreaElement>('notes').value});
  let statusKey:keyof typeof diagnosticCopy.en='ready';
  const status=(key:keyof typeof diagnosticCopy.en)=>{statusKey=key;get('status').textContent=t(key);};
  const root=document.documentElement,world=document.querySelector('#world')!,gameDialog=document.querySelector<HTMLDialogElement>('#panel')!;
  function mode(){return JSON.stringify({scene:root.dataset.scene??'loading',mode:world.getAttribute('aria-busy')==='true'?'transition':gameDialog.open?gameDialog.className==='panel-battle'?'battle':gameDialog.className:'exploration',width:innerWidth,height:innerHeight,dpr:devicePixelRatio,motion:root.dataset.motion,lang:root.lang});}
  let modeKey=mode();const updateMode=()=>{modeKey=mode();};
  const stateObserver=new MutationObserver(updateMode);stateObserver.observe(root,{attributes:true,attributeFilter:['data-scene','data-motion','lang']});stateObserver.observe(world,{attributes:true,attributeFilter:['aria-busy']});stateObserver.observe(gameDialog,{attributes:true,attributeFilter:['open','class']});window.addEventListener('resize',updateMode);
  function payload(){return {schema:'last-lantern-diagnostics-v1',exportedAt:new Date().toISOString(),method:'Visible-page browser rAF intervals. Paused menus, loading, viewport changes and reduced motion are tagged; not a physical presentation or input-to-photon counter. 60 Hz missed slots are estimates, not compositor drops. Diagnostic overhead is not zero. No saves, hero names, URL origin or automatic upload.',limits:{maxFramesPerSample:maxFrames,maxStoredSamples:maxSamples,discardedSamples,longTasksSupported:PerformanceObserver.supportedEntryTypes?.includes('longtask')??false,memory:'JS heap may be absent/coarse. Texture pixel estimates exclude native caches. Total native memory unavailable.',hardware:'Device/Canvas acceleration fields are owner reports, not automatic verification. WebGL cannot establish the Canvas2D backend.'},environment:environment(),webgl,ownerReport:observations(),samples:samples.map(s=>({...s,start:undefined,summary:frameSummary(s.frames),buckets:Object.entries(s.buckets).map(([key,frames])=>({state:JSON.parse(key),summary:frameSummary(frames),frameIntervalsMs:frames})),frameIntervalsMs:s.frames,frames:undefined}))};}
  function localize(){
    for(const el of dialog.querySelectorAll<HTMLElement>('[data-copy]'))el.textContent=t(el.dataset.copy as keyof typeof diagnosticCopy.en);
    for(const b of document.querySelectorAll<HTMLButtonElement>('.diagnostic-modal-launch')){b.textContent=t(b.dataset.battleDiagnostic==='true'?'fps':'open');b.setAttribute('aria-label',t('open'));}
    get('status').textContent=t(statusKey);
  }
  function refresh(){
    const summary=active?frameSummary(active.frames.slice(-300)):null;
    launch.textContent=active?`${t('recording')} · ${Math.max(0,Math.ceil((active.durationLimitMs-(performance.now()-active.start))/1000))}s${summary?` · ${summary.meanFPS.toFixed(0)} FPS`:''}`:t('ready');
    launch.setAttribute('aria-label',active?t('stop'):t('open'));
    if(!dialog.open)return;
    const mem=memory();
    get('context').textContent=`${t('context')}: ${document.querySelector('#location')?.textContent??'—'} · ${innerWidth}×${innerHeight} · DPR ${devicePixelRatio}\n${t('jsHeap')}: ${mem.jsHeap?(mem.jsHeap.usedBytes/1048576).toFixed(1)+' MiB':t('unknown')}\n${t('textures')}: ${mem.logicalTextures?(mem.logicalTextures.rgbaPixelBytes/1048576).toFixed(1)+' MiB':t('unknown')}\n${t('nativeMemory')}: ${t('unknown')}${webgl?'\nWebGL: '+JSON.stringify(webgl):''}`;
    get('summary').textContent=samples.length?`${t('summary')}: ${samples.length}\n`+samples.map(s=>{const m=summaries.get(s);return `${s.startedAt} · ${(s.durationMs/1000).toFixed(1)}s · ${m?`${m.meanFPS.toFixed(1)} rAF FPS · p95 ${m.p95Ms.toFixed(1)}ms · p99 ${m.p99Ms.toFixed(1)}ms · >50.5ms ${m.over50_5Ms}`:'—'}`;}).join('\n'):t('empty');
  }
  function finish(reason:string){if(!active)return;active.durationMs=performance.now()-active.start;active.reason=reason;active.memory.push(memory());summaries.set(active,frameSummary(active.frames));samples.push(active);if(samples.length>maxSamples){samples.shift();discardedSamples++;}active=null;last=undefined;clearTimeout(timer);cancelAnimationFrame(raf);status('done');refresh();}
  function open(){finish('review-opened');clearInput();dialog.showModal();refresh();}
  function close(){dialog.close();document.querySelector<HTMLElement>('#world')?.focus({preventScroll:true});}
  function start(duration:number){finish('replaced');const now=performance.now();active={startedAt:new Date().toISOString(),start:now,durationLimitMs:duration,durationMs:0,reason:'recording',frames:[],buckets:{},boundaries:[],memory:[memory()],longTasks:[],longTaskOverflow:0,environment:environment(),observations:observations()};last=undefined;lastKey='';close();timer=setTimeout(()=>finish('duration-completed'),duration);refresh();raf=requestAnimationFrame(frame);}
  function frame(now:number){
    if(active&&!document.hidden){const key=modeKey;if(last!==undefined&&now>last){const dt=now-last;active.frames.push(dt);if(key===lastKey)(active.buckets[key]??=[]).push(dt);else active.boundaries.push({from:lastKey,to:key,ms:dt});if(active.frames.length>=maxFrames)finish('frame-limit');}if(active){last=now;lastKey=key;}}
    if(active)raf=requestAnimationFrame(frame);
  }
  const heartbeat=setInterval(()=>{if(active){active.memory.push(memory());refresh();}},1000);
  let observer:PerformanceObserver|undefined;
  if(PerformanceObserver.supportedEntryTypes?.includes('longtask')){observer=new PerformanceObserver(list=>{if(active)for(const e of list.getEntries()){if(e.startTime<active.start)continue;if(active.longTasks.length<2000)active.longTasks.push({atMs:e.startTime-active.start,durationMs:e.duration});else active.longTaskOverflow++;}});observer.observe({type:'longtask',buffered:false});}
  const onVisibility=()=>{if(document.hidden)finish('page-hidden');last=undefined;};document.addEventListener('visibilitychange',onVisibility);
  const onModal=()=>{const tools=gameDialog.querySelector('.modal-tools, .battle-top');if(tools&&!tools.querySelector('.diagnostic-modal-launch')){const button=document.createElement('button');button.type='button';button.className='diagnostic-modal-launch';button.dataset.battleDiagnostic=String(tools.classList.contains('battle-top'));button.textContent=t(button.dataset.battleDiagnostic==='true'?'fps':'open');button.setAttribute('aria-label',t('open'));button.addEventListener('click',e=>{e.stopPropagation();open();});tools.append(button);}};
  const modalObserver=new MutationObserver(onModal);modalObserver.observe(document.querySelector('#panel')!,{childList:true,subtree:true});onModal();
  const languageObserver=new MutationObserver(()=>{localize();refresh();});languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  launch.addEventListener('click',open);dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('cancel',()=>{setTimeout(()=>document.querySelector<HTMLElement>('#world')?.focus({preventScroll:true}),0);});
  dialog.addEventListener('click',async e=>{
    e.stopPropagation();const action=(e.target as HTMLElement).closest<HTMLElement>('[data-diagnostic]')?.dataset.diagnostic;
    if(action==='start'||action==='long')start(action==='start'?60000:180000);
    else if(action==='close')close();
    else if(action==='clear'){finish('cleared');samples.length=0;discardedSamples=0;get<HTMLTextAreaElement>('output').value='';refresh();}
    else if(action==='probe'){
      const c=document.createElement('canvas');const gl=c.getContext('webgl');if(gl){const ext=gl.getExtension('WEBGL_debug_renderer_info');webgl={vendor:gl.getParameter(ext?.UNMASKED_VENDOR_WEBGL??gl.VENDOR),renderer:gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL??gl.RENDERER),canvas2DBackend:'Unknown; separate context, not proof of Canvas2D acceleration.'};gl.getExtension('WEBGL_lose_context')?.loseContext();}else webgl={available:false,canvas2DBackend:'Unknown'};c.width=0;c.height=0;status('probeDone');
    }else if(action==='download'||action==='copy'){
      finish('exported');const data=JSON.stringify(payload(),null,2);get<HTMLTextAreaElement>('output').value=data;
      if(action==='copy'){try{await navigator.clipboard.writeText(data);status('copied');}catch{get<HTMLTextAreaElement>('output').focus();get<HTMLTextAreaElement>('output').select();status('fallback');}}
      else{const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='last-lantern-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('downloaded');}
    }
  });
  window.addEventListener('pagehide',e=>{if(e.persisted)return;clearInterval(heartbeat);clearTimeout(timer);cancelAnimationFrame(raf);observer?.disconnect();modalObserver.disconnect();languageObserver.disconnect();stateObserver.disconnect();window.removeEventListener('resize',updateMode);window.removeEventListener('resize',mountLaunch);},{once:true});
  localize();refresh();
}
