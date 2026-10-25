// Counterbalance the source order within each scenario/repetition. Each active
// window gets a fresh browser, with identical setup and no concurrent workloads.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,openSync,closeSync} from 'node:fs';
const root='docs/evidence/gate-c/';
const scenarios=['town-desktop','town-phone','overworld-desktop','overworld-phone','dungeon-desktop','dungeon-phone','combat-desktop','combat-phone'];
const reports={before:[],after:[]},schedule=[];
function run(env,log){
 const fd=openSync(log,'w');let result;try{result=spawnSync(process.execPath,['scripts/benchmark-gate-c.mjs'],{env:{...process.env,...env},stdio:['ignore',fd,fd]});}finally{closeSync(fd);}
 if(result.status!==0)throw Error(`Benchmark failed; inspect ${log}`);
}
for(let repeat=0;repeat<3;repeat++)for(const [index,scenario] of scenarios.entries()){
 const order=(repeat+index)%2?['after','before']:['before','after'];
 for(const variant of order){
  const label=`paired-${variant}-${repeat}-${scenario}`,url=`http://127.0.0.1:${variant==='before'?8091:8092}/`,log=`/tmp/lantern-${label}.log`;
  run({LANTERN_BENCH_URL:url,LANTERN_BENCH_LABEL:label,LANTERN_BENCH_REFERENCE:variant==='before'?'1':'0',LANTERN_BENCH_SCENARIOS:scenario,LANTERN_BENCH_REPEATS:'1',LANTERN_BENCH_INTERFACES:'0',LANTERN_BENCH_INTERFACES_ONLY:'0'},log);
  const file=`benchmark-${label}.json`,report=JSON.parse(readFileSync(root+file,'utf8'));if(report.samples.length!==1)throw Error(file);const sample=report.samples[0];sample.repeat=repeat;sample.rawReport=file;sample.chronologicalOrder=schedule.length;
  reports[variant].push(report);schedule.push({variant,repeat,scenario,file,recordedAt:report.recordedAt});console.log(`${schedule.length}/48 ${variant} ${scenario} ${sample.meanFPS.toFixed(1)} FPS p99 ${sample.p99Ms.toFixed(1)} ms`);
 }
}
for(const variant of ['before','after']){
 const pieces=reports[variant],combined={...pieces[0],label:variant,recordedAt:pieces[0].recordedAt,method:{...pieces[0].method,repetitions:3,ordering:'Counterbalanced per scenario and repetition; fresh browser per active window. Individual raw reports and chronology retained.'},samples:pieces.flatMap(p=>p.samples),interfaces:[]};
 writeFileSync(root+`benchmark-${variant}.json`,JSON.stringify(combined,null,2)+'\n');
 run({LANTERN_BENCH_URL:`http://127.0.0.1:${variant==='before'?8091:8092}/`,LANTERN_BENCH_LABEL:variant,LANTERN_BENCH_REFERENCE:variant==='before'?'1':'0',LANTERN_BENCH_REPEATS:'3',LANTERN_BENCH_SCENARIOS:'',LANTERN_BENCH_INTERFACES:'1',LANTERN_BENCH_INTERFACES_ONLY:'1'},`/tmp/lantern-paired-interfaces-${variant}.log`);
}
writeFileSync(root+'benchmark-schedule.json',JSON.stringify({method:'Source order alternates across scenarios and reverses across repetitions. One browser at a time; not simultaneous benchmarking.',schedule},null,2)+'\n');
