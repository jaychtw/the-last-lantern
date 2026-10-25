"""Assemble the review document from verified final-run evidence, not estimates."""
from pathlib import Path
import json, statistics, re

root = Path(__file__).resolve().parents[1]
folder = root / 'docs/evidence/gate-c'
read = lambda name: json.loads((folder/name).read_text())
before, after = read('benchmark-before.json'), read('benchmark-after.json')
comparison, memory = read('comparison.json'), read('memory-stress.json')
summary, visual = read('browser-summary.json'), read('visual-comparison.json')
media, verified = read('recordings.json'), read('verified-build.json')
manifest = json.loads((root/'docs/evidence/build-manifest.json').read_text())
integrity = json.loads((root/'docs/evidence/artifact-integrity.json').read_text())
assert after['artifact']['sha256'] == manifest['archive_sha256'] == integrity['archiveSha256']
assert before['artifact']['sha256'] == '056c2af3cd77229eed62343dfa7883af868015019ca5ba76a89812e32dc7390e'
assert summary['latestPassed'] == 22 and summary['unresolvedFailures'] == 0
assert integrity['allHTTPHashesMatch'] and visual['pairs'] == 30

def interface(report, width, kind):
    return next(s for s in report['interfaces'] if s['width'] == width and s['kind'] == kind)

def arrow(a, b, precision=1):
    return f'{a:.{precision}f} → {b:.{precision}f}'

rows = {r['id']: r for r in comparison['scenarios']}
text = (root/'docs/GATE-C-REVIEW.md').read_text()
table = (folder/'comparison-table.md').read_text().replace('(comparison.json)', '(evidence/gate-c/comparison.json)')
table += '\nThe final comparison uses [the counterbalanced chronology](evidence/gate-c/benchmark-schedule.json) and all 48 active windows. No bad run is removed. Desktop town/forest remain below 60 FPS; no representative-hardware target is marked passed.\n'
town = rows['town-desktop']
a, b = town['before'], town['after']
if b['meanFPS'] < a['meanFPS']:
    table += f"\n**Town non-regression is not established:** {a['meanFPS']:.1f} → {b['meanFPS']:.1f} FPS. Unchanged exploration source does not prove cause or dismiss the result as environmental. This remains a production-acceptance blocker.\n"
table += '\n[Before raw samples/environment](evidence/gate-c/benchmark-before.json) · [after](evidence/gate-c/benchmark-after.json).\n'
for key, title in [('combat-desktop', 'Desktop combat'), ('combat-phone', 'Emulated-phone combat')]:
    row = rows[key]
    reduction = (1-row['after']['taskSeconds']/row['before']['taskSeconds'])*100
    change = f'{reduction:.1f}% less' if reduction >= 0 else f'{-reduction:.1f}% more'
    table += f'\n{title}: main-thread task time changes by **{change}** over the matched windows. This is work/headroom evidence, not proof of a universal frame-rate gain.\n'
text = text.replace('FINAL_BENCHMARK_TABLE', table)

mem = 'The same-context desktop load stress measured whole-browser PSS, including browser, renderer and GPU/utility processes—not game-only memory:\n\n| Build | Empty browser | Initial town | After 9 loads | After 18 loads | Explicit pressure control |\n| --- | ---: | ---: | ---: | ---: | ---: |\n'
for record in memory['variants']:
    points = [record['emptyBrowser'], record['start'], record['loads'][8], record['end'], record['pressureControl']['after']]
    mem += '| '+record['variant']+' | '+' | '.join(f"{p['totalPssKiB']/1024:.1f} MiB" for p in points)+' |\n'
heaps = [r['end']['heapUsed']/1048576 for r in memory['variants']]
mem += f'\nPost-GC V8 used heap at the end of the load cycles is **{min(heaps):.2f}–{max(heaps):.2f} MiB**. Native resource/cache growth is substantial in both builds and continues into the second cycle. Explicit diagnostic pressure reclaims much of it while the battle-state assertion passes. This demonstrates reclaimability, **not** a safe normal budget, proof of no leak, or immunity to stutter/tab termination. The pressure control is excluded from ordinary acceptance. Physical-phone memory remains a material release risk. [PSS/load/allocation report](evidence/gate-c/memory-stress.json) · [reference allocation samples](evidence/gate-c/allocations-before.json) · [candidate samples](evidence/gate-c/allocations-after.json).\n'
mem += '\n| Existing reduced-motion idle control | Main-thread task seconds before → after (8 s) |\n| --- | ---: |\n'
for width in [1440, 390]:
    a, b = interface(before, width, 'reduced-motion-idle'), interface(after, width, 'reduced-motion-idle')
    assert a['unchangedCanvas'] and b['unchangedCanvas']
    mem += f"| {width} CSS px | {arrow(a['taskSeconds'], b['taskSeconds'], 3)} |\n"
mem += '\nThe existing preference remains functional, but idle-frame reuse was rejected and is not shipped. rAF pacing in a static/paused scene is not evidence of newly rendered FPS.\n'
mem += '\n| Cold start / scene loading | Desktop before → after | Phone emulation before → after |\n| --- | ---: | ---: |\n'
values = []
for width, key in [(1440, 'town-desktop'), (390, 'town-phone')]:
    row = rows[key]
    values.append(arrow(statistics.median(row['before']['coldStartDialogMs']), statistics.median(row['after']['coldStartDialogMs']), 0)+' ms')
mem += '| Fresh-context navigation → start dialog, median of 3 | '+' | '.join(values)+' |\n'
for kind, label, index in [('cold-scene-transition', 'First Meadow loading curtain', 0), ('warm-scene-transitions', 'Warm return to town', 1), ('warm-scene-transitions', 'Warm return to Meadow', 2)]:
    values = []
    for width in [1440, 390]:
        a, b = interface(before, width, kind), interface(after, width, kind)
        values.append(arrow(a['transitions'][index]['durationMs'], b['transitions'][index]['durationMs'])+' ms')
    mem += '| '+label+' | '+' | '.join(values)+' |\n'
mem += '\nCold means a fresh browser/context; OS/disk caches are not flushed. Curtain timing excludes walking to the exit and includes preparation/build/UI work. Warm/cold curtain controls are one observation per width, not a network benchmark. Resource Timing `decodedBodySize` means HTTP content-decoding, not RGBA texture memory.\n'
mem += '\n| Input response control | Mean event → presentation-opportunity ms before → after | Worst observed ms before → after |\n| --- | ---: | ---: |\n'
for width in [1440, 390]:
    a, b = interface(before, width, 'input-response'), interface(after, width, 'input-response')
    mem += f"| Keyboard, {width} CSS px, 8 events/build | {arrow(a['meanMs'], b['meanMs'])} | {arrow(a['maxMs'], b['maxMs'])} |\n"
touch = read('touch-response.json')['samples']
a, b = (next(s for s in touch if s['variant'] == v) for v in ['before', 'after'])
mem += f"| Trusted d-pad touch, 390 CSS px, 8 taps/build | {arrow(a['meanMs'], b['meanMs'])} | {arrow(a['maxMs'], b['maxMs'])} |\n"
mem += '\nThese are the next rAF after observed movement, an upper-bound presentation opportunity rather than physical input-to-photon. [Touch probe](evidence/gate-c/touch-response.json). Traversal timing windows use held keyboard input in both viewports; touch response and the complete touch campaign are separate checks.\n'
mem += '\n| Paused interface, single 4 s window | Main-thread task seconds before → after | Observed browser rAF FPS before → after |\n| --- | ---: | ---: |\n'
for width in [1440, 390]:
    for kind in ['settings', 'dialogue']:
        a, b = interface(before, width, kind), interface(after, width, kind)
        mem += f"| {kind}, {width} CSS px | {arrow(a['taskSeconds'], b['taskSeconds'], 3)} | {arrow(a['meanFPS'], b['meanFPS'])} |\n"
mem += '\nThe world is deliberately paused behind these interfaces; the rAF observer does not imply 60 newly drawn gameplay frames. Exact interface, cold-ready, long-task and input samples remain in the raw reports.\n'
text = text.replace('FINAL_MEMORY_AND_LOADING', mem)

js = next(name for name in verified['productionFiles'] if name.endswith('.js'))
campaigns = [c for c in summary['checks'] if 'complete Gate B campaign with' in c['title']]
result = f"Frozen install, strict TypeScript/Vite build and **31 domain tests pass**. The complete final browser suite passes **22/22**, with zero failed, skipped or flaky checks, using {summary['workers']} workers after withdrawing both marker batching and idle-frame reuse. "
result += ' '.join(f"{'English desktop' if 'English desktop' in c['title'] else 'Traditional Chinese touch'} complete campaign: **{c['durationMs']/1000:.1f} s**." for c in campaigns)
result += f" Both traverse all three lanterns/bosses, ending/credits and meaningful clear-save reload. The two new renderer regressions are included in those 22, not added again. Final JS is `{Path(js).name}` ({verified['productionFiles'][js]['bytes']/1000:.2f} kB); CSS and all 79 runtime art/manifest files are unchanged. The 250 introductory and 101 finite-resource campaign policies remain in the domain suite; they are not independent human balance review.\n\n"
result += '[Browser results](evidence/gate-c/browser-results.json) · [summary](evidence/gate-c/browser-summary.json) · [domain log](evidence/gate-c/domain-tests.txt) · [build log](evidence/gate-c/build.txt) · [unchanged authority/art/game files](evidence/gate-c/unchanged-baseline.json).\n\n'
battle = [s for s in visual['samples'] if '-combat-' in s['after']]
assert len(battle) == 12 and all(s['meanAbsoluteChannelError'] == 0 for s in battle)
result += f"All **30 image pairs** meet the original numerical threshold; all **12 battle pairs are pixel-identical** after input/RAF alignment. Worst mean channel error is **{visual['maxMeanAbsoluteChannelError']:.6f}/255**, with no pixel over 16 levels. [Comparison data](evidence/gate-c/visual-comparison.json). Tiny exploration differences match per-page clock origin/subpixel animation variation. No experimental downgrade is shipped.\n\n"
result += '[Town before](evidence/gate-c/visual-before-town-1440-full.png) / [after](evidence/gate-c/visual-after-town-1440-full.png) · [phone before](evidence/gate-c/visual-before-town-390-full.png) / [after](evidence/gate-c/visual-after-town-390-full.png) · [cavern before](evidence/gate-c/visual-before-cavern-1440-full.png) / [after](evidence/gate-c/visual-after-cavern-1440-full.png) · [battle before](evidence/gate-c/visual-before-combat-sanctum-1440-player-full.png) / [after](evidence/gate-c/visual-after-combat-sanctum-1440-player-full.png).\n\n'
result += '[63-second gameplay recording](evidence/gate-c/gameplay.mp4) · [complete English recording](evidence/campaign-desktop-en.mp4) · [complete Traditional Chinese recording](evidence/campaign-phone-zh-TW.mp4) · [formats, hashes and cuts](evidence/gate-c/recordings.json). These are real-time browser captures, silently recorded at 25 FPS/reduced resolution and H.264-transcoded for size. They are not quantitative performance/physical-device/audio evidence. No interpolation, speed changes or synthetic gameplay frames are used.\n\n'
result += 'The full suite covers 320/390/768/1440 layouts, EN/zh-TW, large text, compact landscape, actual keyboard/mouse/touch movement, failure/retry, storage corruption/blocking, confirmations, migration, exact meaningful reload, routes, atlas consistency, phase feedback and live language switching. Tested axe states report zero violations; manual imagery contrast and assistive-technology checks remain open. [Desktop audit](evidence/campaign-axe-desktop.json) / [phone audit](evidence/campaign-axe-phone.json).'
text = text.replace('FINAL_VERIFICATION', result)
size = (root/'playtest/the-last-lantern-gate-c.zip').stat().st_size
artifact = f"Version **0.4.0-gate-c**, **{size:,} bytes**, SHA-256 `{manifest['archive_sha256']}`. All 92 extracted hashes and all 87 HTTP-served game files match. The package matches the production files used by the complete final browser suite. [Manifest](evidence/build-manifest.json) · [integrity](evidence/artifact-integrity.json) · [packaged gameplay](evidence/playtest-verification.json) · [verified build identity](evidence/gate-c/verified-build.json). The accepted Gate B ZIP remains unchanged."
text = text.replace('FINAL_ARTIFACT', artifact)
assert 'FINAL_' not in text
(root/'docs/GATE-C-REVIEW.md').write_text(text)
p = root/'playtest/README.md'
s = p.read_text()
s = re.sub(r'— \*\*[\d,]+ bytes\*\*', f'— **{size:,} bytes**', s)
s = re.sub(r'(```text\n)[0-9a-f]{64}(\n```)', lambda m: m[1]+manifest['archive_sha256']+m[2], s)
p.write_text(s)
print('Gate C report assembled from the final artifact and counterbalanced results.')
