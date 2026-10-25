import {readFile,writeFile} from 'node:fs/promises';
const folder='docs/evidence/gate-c-followup/',read=async name=>JSON.parse(await readFile(folder+name,'utf8'));
function summary(frames){const sorted=[...frames].sort((a,b)=>a-b),tail=sorted.slice(-Math.ceil(sorted.length*.01));return {frames:frames.length,meanFPS:1000*frames.length/frames.reduce((a,b)=>a+b,0),p95Ms:sorted[Math.floor(sorted.length*.95)],p99Ms:sorted[Math.floor(sorted.length*.99)],maxMs:sorted.at(-1),low1FPS:1000*tail.length/tail.reduce((a,b)=>a+b,0),over50_5Ms:frames.filter(x=>x>50.5).length,over100Ms:frames.filter(x=>x>100).length};}
const result={method:'Pooled raw interval distributions; all recorded runs included. Memory is whole-browser PSS except explicitly named native allocator accounting. Allocator hierarchy/aliases are not additive.',town:[],memory:[],nativeCache:[]};
for(const name of ['controls','identical-url','long-window']){
 const report=await read(`town-${name}.json`);
 if(name==='identical-url'||name==='long-window'){if(new Set(report.samples.map(s=>s.url)).size!==1||new Set(report.samples.map(s=>s.sha256)).size!==1)throw Error('Identical-URL control mismatch');}
 for(const mode of [...new Set(report.samples.map(s=>s.mode))])for(const source of [...new Set(report.samples.map(s=>s.source))]){
  const rows=report.samples.filter(s=>s.mode===mode&&s.source===source);if(!rows.length)continue;
  result.town.push({experiment:name,mode,source,runs:rows.length,runFPS:rows.map(s=>s.meanFPS),...summary(rows.flatMap(s=>s.frameIntervalsMs)),taskSeconds:rows.reduce((a,b)=>a+b.cpu.TaskDuration,0),threadCPUSeconds:rows.reduce((a,b)=>a+b.cpu.ThreadTime,0),processCPUSeconds:rows.reduce((a,b)=>a+b.cpu.ProcessTime,0),counterWindowSeconds:rows.reduce((a,b)=>a+b.cpuWindowMs/1000,0)});
 }
}
for(const a of (await read('memory-controls.json')).arms){
 const signatures=a.cycles.map(c=>JSON.stringify(c.images.map(i=>[i.src,i.width,i.height]).sort()));
 result.memory.push({arm:a.arm,loads:a.loads.length,startMiB:a.start.pssKiB/1024,after18MiB:a.cycles[1].pssKiB/1024,after54MiB:a.cycles[5].pssKiB/1024,after108MiB:a.cycles.at(-1).pssKiB/1024,endMiB:a.end.pssKiB/1024,idleMiB:a.naturalIdle.pssKiB/1024,pressureMiB:a.forcedPressure.pssKiB/1024,contextClosedMiB:a.contextClosed.pssKiB/1024,heapEndMiB:a.end.heapUsed/1048576,images:a.end.images.length,canvases:a.end.canvases.length,sameImageSetEveryCycle:new Set(signatures).size===1,domByCycle:a.cycles.map(c=>c.dom),pssMiBByCycle:a.cycles.map(c=>c.pssKiB/1024)});
}
const native=(await read('memory-native-dumps.json')).arms[0],ids=[...new Set(native.allocatorDumps.filter(e=>e.dumps.allocators).sort((a,b)=>a.ts-b.ts).map(e=>e.id))];
if(ids.length!==3||!native.dumpRequests.every(r=>r.success))throw Error('Expected three explicit native dump groups');
for(const [index,id] of ids.entries()){
 const rows=native.allocatorDumps.filter(e=>e.id===id&&e.dumps.allocators?.['cc/image_memory']);const active=rows.sort((a,b)=>parseInt(b.dumps.allocators['cc/image_memory'].attrs.size.value,16)-parseInt(a.dumps.allocators['cc/image_memory'].attrs.size.value,16))[0];
 const alloc=active.dumps.allocators,bytes=key=>alloc[key]?.attrs?.size?.value?parseInt(alloc[key].attrs.size.value,16):null;
 result.nativeCache.push({label:native.dumpRequests[index].label,normalizedTraceId:id,rendererPid:active.pid,imageCacheBytes:bytes('cc/image_memory'),discardableBytes:bytes('discardable'),mallocBytes:bytes('malloc'),note:'Reported allocator accounting, not PSS; related fields may alias and must not be summed.'});
}
await writeFile(folder+'investigation-summary.json',JSON.stringify(result,null,2)+'\n');
let text='| Control | Source | Runs | FPS | p95 ms | p99 ms | 1% low | >50.5 ms |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |\n';
for(const r of result.town)text+=`| ${r.experiment} / ${r.mode} | ${r.source} | ${r.runs} | ${r.meanFPS.toFixed(1)} | ${r.p95Ms.toFixed(1)} | ${r.p99Ms.toFixed(1)} | ${r.low1FPS.toFixed(1)} | ${r.over50_5Ms} |\n`;
text+='\n| Memory control (108 loads) | Start MiB | 18 loads | 54 loads | 108 loads | 30 s idle | Diagnostic pressure | Images / canvases |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n';
for(const r of result.memory)text+=`| ${r.arm} | ${r.startMiB.toFixed(1)} | ${r.after18MiB.toFixed(1)} | ${r.after54MiB.toFixed(1)} | ${r.after108MiB.toFixed(1)} | ${r.idleMiB.toFixed(1)} | ${r.pressureMiB.toFixed(1)} | ${r.images} / ${r.canvases} |\n`;
text+='\n| Detailed native dump | cc/image_memory accounting MiB | Renderer malloc accounting MiB |\n| --- | ---: | ---: |\n';for(const r of result.nativeCache)text+=`| ${r.label} | ${(r.imageCacheBytes/1048576).toFixed(2)} | ${(r.mallocBytes/1048576).toFixed(2)} |\n`;
await writeFile(folder+'investigation-tables.md',text);console.log(text);
