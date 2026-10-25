import {chromiumOptions} from './chromium-options.mjs';
// Intrusive diagnostic pass, separate from the uninstrumented benchmarks.
import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const url=process.env.LANTERN_PROFILE_URL??'http://127.0.0.1:8091/';
const label=process.env.LANTERN_PROFILE_LABEL??'before';
await mkdir('docs/evidence/gate-c',{recursive:true});
const browser=await chromium.launch({...chromiumOptions,args:[...chromiumOptions.args,...(process.env.LANTERN_PROFILE_GPU?['--enable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']:[])]});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 await page.addInitScript(({omit,context})=>{
  if(context){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,options?.alpha===false?{...options,...context}:options);};}
  const d={calls:{},ms:{},raf:[],running:false,flushByImage:{}};window.__profile=d;let lastImage='none';
  for(const name of ['drawImage','fillRect','save','restore','rotate']){
   const original=CanvasRenderingContext2D.prototype[name];
   CanvasRenderingContext2D.prototype[name]=function(...args){
    if(name==='drawImage'&&omit&&args[0]?.src?.endsWith('/'+omit+'.webp')){d.omitted=(d.omitted??0)+1;return;}
    if(!d.running)return original.apply(this,args);
    const start=performance.now();try{return original.apply(this,args);}finally{const elapsed=performance.now()-start;d.calls[name]=(d.calls[name]??0)+1;d.ms[name]=(d.ms[name]??0)+elapsed;if(name==='save')d.flushByImage[lastImage]=(d.flushByImage[lastImage]??0)+elapsed;if(name==='drawImage')lastImage=args[0]?.src?.split('/').at(-1)??'canvas/bitmap';}
   };
  }
  const raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=fn=>raf(now=>{const start=performance.now();fn(now);if(d.running)d.raf.push(performance.now()-start);});
 },{omit:process.env.LANTERN_PROFILE_OMIT??'',context:process.env.LANTERN_PROFILE_CONTEXT?JSON.parse(process.env.LANTERN_PROFILE_CONTEXT):null});
 await page.goto(url);await page.locator('[data-command=begin]').click();await page.waitForTimeout(2000);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});
 if(process.env.LANTERN_PROFILE_TRACE)await cdp.send('Tracing.start',{categories:'toplevel,devtools.timeline,disabled-by-default-devtools.timeline,blink,cc,skia',transferMode:'ReturnAsStream'});
 await cdp.send('Profiler.start');await page.evaluate(()=>window.__profile.running=true);
 const before=await cdp.send('Performance.getMetrics');
 await page.locator('#world').focus();
 for(const key of ['d','s','a','w']){await page.keyboard.down(key);await page.waitForTimeout(2000);await page.keyboard.up(key);}
 const after=await cdp.send('Performance.getMetrics'),{profile}=await cdp.send('Profiler.stop');
 const instrumented=await page.evaluate(()=>{window.__profile.running=false;return window.__profile;});
 const nodes=new Map(profile.nodes.map(n=>[n.id,n]));const samples={};for(let i=0;i<(profile.samples?.length??0);i++){const f=nodes.get(profile.samples[i]).callFrame,key=`${f.functionName||'(anonymous)'} ${f.url?.split('/').at(-1)??''}:${f.lineNumber}`;samples[key]=(samples[key]??0)+(profile.timeDeltas[i]??0);}
 const delta={};for(const m of after.metrics){const b=before.metrics.find(x=>x.name===m.name);delta[m.name]=m.value-(b?.value??0);}
 const gpu=await browser.newBrowserCDPSession();const system=await gpu.send('SystemInfo.getInfo');
 await writeFile(`docs/evidence/gate-c/profile-${label}.json`,JSON.stringify({url,browser:browser.version(),instrumentation:'Canvas method timing and rAF callback wrappers plus CDP CPU sampling, 8 seconds movement; intrusive, not acceptance FPS.',system:system.gpu,delta,instrumented,cpuTopSelfMicroseconds:Object.entries(samples).sort((a,b)=>b[1]-a[1]).slice(0,30)},null,2)+'\n');
 await writeFile(`docs/evidence/gate-c/cpu-${label}.cpuprofile`,JSON.stringify(profile));
 if(process.env.LANTERN_PROFILE_TRACE){
  const done=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const {stream}=await done;let data='';for(;;){const part=await cdp.send('IO.read',{handle:stream});data+=part.data;if(part.eof)break;}await cdp.send('IO.close',{handle:stream});
  await writeFile(`docs/evidence/gate-c/trace-${label}.json.gz`,gzipSync(data));const trace=JSON.parse(data),summary={};for(const e of trace.traceEvents)if(e.ph==='X'&&e.dur){const k=e.name;summary[k]??={count:0,totalInclusiveMs:0,maxMs:0};summary[k].count++;summary[k].totalInclusiveMs+=e.dur/1000;summary[k].maxMs=Math.max(summary[k].maxMs,e.dur/1000);}
  await writeFile(`docs/evidence/gate-c/trace-${label}-summary.json`,JSON.stringify({note:'Trace durations are inclusive and nested; do not sum categories as total CPU. Diagnostic instrumentation, not acceptance timing.',events:Object.entries(summary).sort((a,b)=>b[1].totalInclusiveMs-a[1].totalInclusiveMs)},null,2)+'\n');
 }
 console.log(JSON.stringify({delta,calls:instrumented.calls,ms:instrumented.ms,cpuTop:Object.entries(samples).sort((a,b)=>b[1]-a[1]).slice(0,12)},null,2));
}finally{await browser.close();}
