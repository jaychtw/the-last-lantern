import {readFile,writeFile} from 'node:fs/promises';
const root='docs/evidence/gate-c/';
const before=JSON.parse(await readFile(root+'benchmark-before.json','utf8')),after=JSON.parse(await readFile(root+'benchmark-after.json','utf8'));
const q=(s,p)=>s[Math.min(s.length-1,Math.floor(s.length*p))];
function group(report,id){
 const runs=report.samples.filter(s=>s.id===id);if(runs.length!==3||runs.some(s=>!s.cpuCounterWindowMs))throw Error('Use the three matched final runs with explicit CPU windows, not exploratory reports.');
 const t=runs.flatMap(s=>s.frameIntervalsMs).sort((a,b)=>a-b),mean=t.reduce((a,b)=>a+b,0)/t.length,tail=t.slice(-Math.ceil(t.length*.01));
 return {meanFPS:1000/mean,meanMs:mean,p95Ms:q(t,.95),p99Ms:q(t,.99),maxMs:t.at(-1),low1FPS:1000/(tail.reduce((a,b)=>a+b,0)/tail.length),frames:t.length,over50Ms:t.filter(v=>v>50.5).length,over100Ms:t.filter(v=>v>100).length,missed60HzSlots:runs.reduce((n,s)=>n+s.missed60HzSlots,0),runFPS:runs.map(s=>s.meanFPS),taskSeconds:runs.reduce((n,s)=>n+s.cpu.TaskDuration,0),cpuWindowSeconds:runs.reduce((n,s)=>n+s.cpuCounterWindowMs/1000,0),heapPeakSampled:Math.max(...runs.map(s=>s.memory.heapPeakSampled)),heapAfterGC:runs.map(s=>s.memory.heapEndAfterGC),coldStartDialogMs:runs.map(s=>s.cold.startDialogMs),coldContinueReadyMs:runs.map(s=>s.cold.beginContinueReadyMs)};
}
const comparison={method:'Pooled interval distribution across all three matched repetitions, not an arithmetic mean of FPS. CPU windows use CDP timestamps. All runs/tails retained.',browserBefore:before.browser,browserAfter:after.browser,scenarios:[]};
for(const id of [...new Set(before.samples.map(s=>s.id))])comparison.scenarios.push({id,before:group(before,id),after:group(after,id)});
let markdown='| Scenario | FPS before → after | p95 ms | p99 ms | 1% low FPS | >50.5 ms intervals |\n| --- | ---: | ---: | ---: | ---: | ---: |\n';
for(const row of comparison.scenarios){const arrow=key=>`${row.before[key].toFixed(1)} → ${row.after[key].toFixed(1)}`;markdown+=`| ${row.id} | ${arrow('meanFPS')} | ${arrow('p95Ms')} | ${arrow('p99Ms')} | ${arrow('low1FPS')} | ${row.before.over50Ms} → ${row.after.over50Ms} |\n`;}
markdown+='\nEach row pools three twelve-second active samples. Desktop is 1440×1000/DPR 1; phone is 390×844/DPR 2 with the unchanged renderer cap of 1.5. These are cloud software Chromium results, not physical-device acceptance.\n';
markdown+='\n| Scenario | Main-thread task seconds before → after | Sampled peak V8 heap MiB before → after |\n| --- | ---: | ---: |\n';
for(const row of comparison.scenarios)markdown+=`| ${row.id} | ${row.before.taskSeconds.toFixed(2)} → ${row.after.taskSeconds.toFixed(2)} | ${(row.before.heapPeakSampled/1048576).toFixed(2)} → ${(row.after.heapPeakSampled/1048576).toFixed(2)} |\n`;
markdown+='\nTask time is summed over the three CDP counter windows, approximately 36 seconds per row; raw windows and per-run ranges are retained in [the comparison JSON](comparison.json). V8 heap excludes native image/canvas/compositor resources.\n';
await writeFile(root+'comparison.json',JSON.stringify(comparison,null,2)+'\n');await writeFile(root+'comparison-table.md',markdown);console.log(markdown);
