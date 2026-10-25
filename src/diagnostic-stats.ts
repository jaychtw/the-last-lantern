/** Browser callback timing only; no claim about physical frame presentation. */
export function frameSummary(frames:readonly number[]){
  if(!frames.length)return null;
  const sorted=[...frames].sort((a,b)=>a-b),sum=frames.reduce((a,b)=>a+b,0),tail=sorted.slice(-Math.ceil(sorted.length*.01));
  return {frames:frames.length,observedMs:sum,meanFPS:1000*frames.length/sum,meanMs:sum/frames.length,
    p50Ms:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],p99Ms:sorted[Math.floor(sorted.length*.99)],maxMs:sorted.at(-1)!,
    low1FPS:1000*tail.length/tail.reduce((a,b)=>a+b,0),over50_5Ms:frames.filter(x=>x>50.5).length,over100Ms:frames.filter(x=>x>100).length,
    estimatedMissed60HzSlots:frames.reduce((n,v)=>n+Math.max(0,Math.round(v/(1000/60))-1),0)};
}
