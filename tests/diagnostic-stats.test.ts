import {describe,it,expect} from 'vitest';
import {frameSummary} from '../src/diagnostic-stats';
describe('portable frame diagnostics',()=>{
  it('keeps missing measurements unavailable',()=>{expect(frameSummary([])).toBeNull();});
  it('retains a significant tail instead of hiding it in average FPS',()=>{const s=frameSummary([...Array(99).fill(16),200])!;expect(s.p95Ms).toBe(16);expect(s.p99Ms).toBe(200);expect(s.low1FPS).toBe(5);expect(s.over50_5Ms).toBe(1);expect(s.over100Ms).toBe(1);expect(s.meanFPS).toBeLessThan(60);});
  it('uses elapsed intervals and the slowest one percent, not mean instantaneous FPS',()=>{const s=frameSummary([10,30])!;expect(s.meanFPS).toBe(50);expect(s.low1FPS).toBeCloseTo(1000/30);});
  it('does not mistake high-refresh callbacks for dropped 60Hz frames',()=>{const s=frameSummary([8.3,8.3,8.4])!;expect(s.meanFPS).toBeCloseTo(120);expect(s.estimatedMissed60HzSlots).toBe(0);});
});
