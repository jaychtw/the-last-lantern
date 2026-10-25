# Gate C — performance investigation and release readiness

**Recommendation: Not ready for production acceptance.** Desktop exploration remains below the provisional 60 FPS target in the cloud software renderer, and the final town comparison regresses. This is a material open issue, not a pass or an approved quality exception. The candidate is suitable for owner review and representative-hardware testing. No public deployment or production acceptance has been performed.

The owner accepted Gate B [`c6ba55087e5277d2457ac2e2b82e6f5a56d6035d`](https://github.com/jaychtw/the-last-lantern/commit/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d) as the minimum visual baseline. [Approval record](APPROVALS.md). The supplied GDD and UGDS v1.0.0 pinned to `d5c6696efdd6efc028118600466db44aecae0c9b` remain unchanged. This work preserves that artwork, composition, lighting, character detail, animation and game design. The original concept mockups remain an ambition, not a claim of equivalence.

[Download Gate C review ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-c.zip) · [local play instructions](../playtest/README.md) · [historical Gate B report](GATE-B-REVIEW.md)

## Diagnosis and decisions

The approved ZIP was extracted and served unchanged on loopback as the reference. Its exact archive SHA-256 is `056c2af3cd77229eed62343dfa7883af868015019ca5ba76a89812e32dc7390e`. Representative town, forest, cavern and Guardian battle scenarios were tested on desktop and touch-emulated phone layouts. Static settings/dialogue, actual input and cold/warm scene transitions were measured separately.

The primary bottleneck is sustained rendering work, rather than the deterministic game rules or an asset download. In an intrusive eight-second town profile, the reference used about **8.38 seconds of main-thread task time** and **6.23 seconds of script time including native canvas calls**. About 10,300 image draws were issued. Canvas save/restore can flush previously queued image work: time appearing against a later call must not be mistaken for that asset's independent cost.

The [native trace](evidence/gate-c/trace-baseline-trace.json.gz) and [inclusive event summary](evidence/gate-c/trace-baseline-trace-summary.json) show substantial animation-frame work and compositor raster work: 6,312 RasterTask events total about 4.80 seconds across worker threads, whereas ImageDecodeTask events total about **8 ms**. These are nested/parallel trace durations and must not be added into a single CPU total. This does not support a claim that repeated network/decode activity is the dominant steady-state problem.

Chromium reports `2d_canvas: unavailable_software`, `gpu_compositing: disabled_software` and software rasterization. The reported graphics device is SwiftShader, not a physical GPU. Scene density, full-frame composition, scaling/rotation/alpha work and this backend interact. This evidence identifies an architectural cost under software rendering; it does **not** establish that every desktop has the same problem or that physical hardware meets the target. An explicitly enabled SwiftShader GPU-path control was much slower and is not a production solution.

Several measured prototypes were rejected: broadly cached scaled surfaces, bitmap crop views, materialized caches, tree caches, retained DOM/Canvas scenery layers and alternative context hints. Some reduced JavaScript time while leaving total work unchanged; retained layers moved work away from the main thread but did not improve observed pacing. These prototypes are absent from the delivered runtime. Idle-frame reuse was also withdrawn after the counterbalanced town tails failed to establish non-regression; its CPU savings are not shipped. The exploration render and resize functions are restored verbatim to the accepted baseline. Marker layout batching was also rejected: it reduced layout counters but did not establish a safe frame-pacing benefit. The first ordered comparison and counterbalanced follow-up are retained as rejected-candidate evidence; the baseline marker implementation was restored before final verification. [Experiment ledger](evidence/gate-c/experiments.json), raw CPU profiles and rejected patches preserve the investigation. Diagnostic passes that omit the ground, trees or hero are explicitly labeled and never count as playable or visual acceptance evidence.

Priority remains representative-hardware profiling followed by a measured composition strategy. There is no evidence-based justification here for reducing detail, removing vegetation, lowering render resolution, reducing animation or weakening the approved presentation. A fundamental renderer replacement or any unavoidable perceptible downgrade requires the owner's decision before implementation.

## Changes retained

1. **Battle backdrop:** compose the original sky/environment assets once at the exact physical canvas size, then copy them without resampling behind animated combat. This cache excludes characters, UI and effects; it is not a screenshot substituted for gameplay. It is allocated lazily on entering combat, survives action/phase remounts and rebuilds on size/backdrop changes. It is released when the world scene rebuilds. The extra native surface is accounted for separately from source-texture pixels; hero/enemy poses, effects, rules and turn timing are unchanged.
2. **Development-tool integrity:** replace Vitest 3.2.4 with pinned 4.1.12, retaining the existing Vite and Node requirements. The initial audit found two critical and one moderate development dependency findings; the final audit reports zero known vulnerabilities. No audit suppression, dependency override or weakened test was used. [Before](evidence/gate-c/dependencies-before.json) / [after](evidence/gate-c/dependencies-after.json).

No production asset, game-rule, save-schema, content-catalog, translation, audio or input-binding change is included. The complete single-hero campaign, nine scenes, three bosses, six spells, equipment, puzzles, progression, v1-to-v2 migration, three slots/autosave and saved ending remain intact.

## Reproducible before/after measurements

| Scenario | FPS before → after | p95 ms | p99 ms | 1% low FPS | >50.5 ms intervals |
| --- | ---: | ---: | ---: | ---: | ---: |
| town-desktop | 38.0 → 30.4 | 33.4 → 50.0 | 33.4 → 50.1 | 22.1 → 19.4 | 0 → 1 |
| town-phone | 57.3 → 57.5 | 16.8 → 16.8 | 33.4 → 33.4 | 26.8 → 29.9 | 1 → 0 |
| overworld-desktop | 32.9 → 35.5 | 33.4 → 33.4 | 50.0 → 49.9 | 19.4 → 20.0 | 1 → 0 |
| overworld-phone | 58.6 → 58.9 | 16.8 → 16.8 | 33.3 → 33.3 | 30.0 → 28.1 | 0 → 1 |
| dungeon-desktop | 59.3 → 59.5 | 16.8 → 16.8 | 16.8 → 16.8 | 28.7 → 33.8 | 2 → 1 |
| dungeon-phone | 59.9 → 60.0 | 16.8 → 16.8 | 16.8 → 16.8 | 52.5 → 57.0 | 0 → 0 |
| combat-desktop | 54.9 → 58.2 | 33.3 → 16.8 | 50.1 → 33.4 | 11.3 → 21.7 | 19 → 4 |
| combat-phone | 59.0 → 59.4 | 16.8 → 16.8 | 33.3 → 16.8 | 24.4 → 29.3 | 2 → 0 |

Each row pools three twelve-second active samples. Desktop is 1440×1000/DPR 1; phone is 390×844/DPR 2 with the unchanged renderer cap of 1.5. These are cloud software Chromium results, not physical-device acceptance.

| Scenario | Main-thread task seconds before → after | Sampled peak V8 heap MiB before → after |
| --- | ---: | ---: |
| town-desktop | 36.26 → 36.54 | 2.93 → 3.06 |
| town-phone | 34.65 → 35.30 | 3.06 → 3.01 |
| overworld-desktop | 36.62 → 36.51 | 3.06 → 3.04 |
| overworld-phone | 33.76 → 33.48 | 2.99 → 3.00 |
| dungeon-desktop | 24.31 → 24.58 | 2.89 → 2.81 |
| dungeon-phone | 13.13 → 12.77 | 2.82 → 2.89 |
| combat-desktop | 25.48 → 14.94 | 2.63 → 2.69 |
| combat-phone | 14.08 → 9.51 | 2.72 → 2.70 |

Task time is summed over the three CDP counter windows, approximately 36 seconds per row; raw windows and per-run ranges are retained in [the comparison JSON](evidence/gate-c/comparison.json). V8 heap excludes native image/canvas/compositor resources.

**Town performance regresses in this comparison:** 38.0 → 30.4 FPS (-20.0%), p95 33.4 → 50.0 ms, and 1% low 22.1 → 19.4 FPS. The individual run ranges are 37.0–39.2 before and 27.5–34.0 after. This is an unresolved non-regression failure, not an accepted trade-off or an exploration optimization. Exploration render/resize/update methods and main.ts match the accepted source; that does not prove the cause or dismiss the observed result as environmental. Hardware/backend and reproducibility investigation must resolve it before production acceptance. Combat gains do not offset it.

The final comparison uses [the counterbalanced chronology](evidence/gate-c/benchmark-schedule.json) and all 48 active windows. No bad run is removed. Desktop town/forest remain below 60 FPS; no representative-hardware target is marked passed.

Desktop combat: main-thread task time changes by **41.4% less** over the matched windows. This is work/headroom evidence, not proof of a universal frame-rate gain.

Emulated-phone combat: main-thread task time changes by **32.5% less** over the matched windows. This is work/headroom evidence, not proof of a universal frame-rate gain.


Environment: headless Chromium **154.0.8037.57**, Linux 6.18.55 x64, Intel Xeon Platinum 8370C, 5 exposed logical CPUs; cgroup quota `400000 / 100000` (4 CPU equivalents). [Before raw samples/environment](evidence/gate-c/benchmark-before.json) · [after](evidence/gate-c/benchmark-after.json).

The paired reports contain every raw interval and all three repetitions, including bad runs. Final source order is counterbalanced within each scenario/repetition, using a fresh browser for each active window; individual raw reports and chronology are retained. Measurements use the same Chromium version, launch defaults, viewport, DPR, warmup, twelve-second active window and movement/action schedule. Fresh contexts distinguish cold navigation/Continue from warmed gameplay. Interface windows are single four-second observations per state/width; input uses eight trusted key events per width, and the reduced-motion idle control lasts eight seconds. Phone contexts emulate 390×844 CSS pixels, DPR 2 and touch, while the renderer keeps its existing 1.5 cap; desktop uses 1440×1000, DPR 1. The performance scenarios use default English UI and muted audio; the bilingual functional runs are separate. No CPU throttling is deliberately applied. Container quota/throttling counters are retained per sample. Clean runs exclude other browser QA, Blender, video encoding and heavy trace analysis.

An independent rAF observer captures frame intervals, including while the world is paused. Average FPS is interval count divided by elapsed interval time. p99 is the frame-time tail equivalent; 1% low FPS uses the mean slowest 1% of intervals. Estimated missed 60 Hz slots are derived from intervals and are **not** a hardware/compositor dropped-frame counter. Significant stutters and long tasks remain visible in the raw data. The trace supplies complementary raster/commit evidence; neither rAF nor the silent recording proves physical display presentation or input-to-photon latency.

CDP reports main-thread task/script/layout/style time. V8 heap samples are taken once per second, with forced-GC checkpoints outside the active timing window. The CPU counter window includes diagnostic boundary calls and is recorded explicitly. Synthetic stable scene checkpoints are validated by the domain and loaded through actual Continue/Save UI; they are render fixtures, not complete campaign claims. Complete campaigns are verified separately through real player interactions.

Initial exploratory runs are retained separately. An exploratory after run overlapped trace-file analysis and is excluded from the matched clean comparison for that stated reason, not because of its unfavorable values. It contains visible stutters and is not represented as a passing acceptance run.

To reproduce, install with the frozen lockfile and build. In one terminal, extract and serve the unchanged reference:

```sh
python3 -m zipfile -e playtest/the-last-lantern-gate-b.zip /tmp/lantern-gate-c-baseline
python3 /tmp/lantern-gate-c-baseline/serve-playtest.py --port 8091
```

In another terminal, serve the current production build:

```sh
python3 -m http.server 8092 --bind 127.0.0.1 --directory dist
```

In a third terminal, run the counterbalanced paired benchmark, without other browser/media/trace work:

```sh
npm run measure:gate-c:paired
node scripts/summarize-gate-c.mjs
```

`CHROMIUM_PATH` selects a browser executable. `LANTERN_HEADLESS=0` opens a real desktop window for independent hardware investigation; the reported graphics features/device must still be checked rather than assumed. The published cloud runs use the defaults. This desktop/touch-emulation harness does not certify an actual phone. Visual fixtures alone use a virtual clock; timed performance runs and complete campaigns use real time.

## Memory, loading and response

The same-context desktop load stress measured whole-browser PSS, including browser, renderer and GPU/utility processes—not game-only memory:

| Build | Empty browser | Initial town | After 9 loads | After 18 loads | Explicit pressure control |
| --- | ---: | ---: | ---: | ---: | ---: |
| before | 204.0 MiB | 417.9 MiB | 652.8 MiB | 837.9 MiB | 381.2 MiB |
| after | 208.3 MiB | 418.2 MiB | 647.1 MiB | 828.2 MiB | 380.5 MiB |

Post-GC V8 used heap at the end of the load cycles is **2.18–2.19 MiB**. Native resource/cache growth is substantial in both builds and continues into the second cycle. Explicit diagnostic pressure reclaims much of it while the battle-state assertion passes. This demonstrates reclaimability, **not** a safe normal budget, proof of no leak, or immunity to stutter/tab termination. The pressure control is excluded from ordinary acceptance. Physical-phone memory remains a material release risk. [PSS/load/allocation report](evidence/gate-c/memory-stress.json) · [reference allocation samples](evidence/gate-c/allocations-before.json) · [candidate samples](evidence/gate-c/allocations-after.json).

| Existing reduced-motion idle control | Main-thread task seconds before → after (8 s) |
| --- | ---: |
| 1440 CSS px | 7.988 → 8.029 |
| 390 CSS px | 3.860 → 4.881 |

The existing preference remains functional, but idle-frame reuse was rejected and is not shipped. rAF pacing in a static/paused scene is not evidence of newly rendered FPS.

| Cold start / scene loading | Desktop before → after | Phone emulation before → after |
| --- | ---: | ---: |
| Fresh-context navigation → start dialog, median of 3 | 1082 → 1180 ms | 1118 → 1137 ms |
| First Meadow loading curtain | 156.0 → 165.7 ms | 160.5 → 158.3 ms |
| Warm return to town | 33.1 → 25.5 ms | 12.7 → 14.2 ms |
| Warm return to Meadow | 5.9 → 4.0 ms | 4.5 → 5.7 ms |

Cold means a fresh browser/context; OS/disk caches are not flushed. Curtain timing excludes walking to the exit and includes preparation/build/UI work. Warm/cold curtain controls are one observation per width, not a network benchmark. Resource Timing `decodedBodySize` means HTTP content-decoding, not RGBA texture memory.

| Input response control | Mean event → presentation-opportunity ms before → after | Worst observed ms before → after |
| --- | ---: | ---: |
| Keyboard, 1440 CSS px, 8 events/build | 58.8 → 55.4 | 60.8 → 60.8 |
| Keyboard, 390 CSS px, 8 events/build | 29.8 → 28.2 | 34.0 → 31.7 |
| Trusted d-pad touch, 390 CSS px, 8 taps/build | 46.4 → 39.3 | 52.9 → 51.5 |

These are the next rAF after observed movement, an upper-bound presentation opportunity rather than physical input-to-photon. [Touch probe](evidence/gate-c/touch-response.json). Traversal timing windows use held keyboard input in both viewports; touch response and the complete touch campaign are separate checks.

| Paused interface, single 4 s window | Main-thread task seconds before → after | Observed browser rAF FPS before → after |
| --- | ---: | ---: |
| settings, 1440 CSS px | 0.108 → 0.060 | 60.0 → 59.8 |
| dialogue, 1440 CSS px | 0.055 → 0.055 | 60.0 → 60.0 |
| settings, 390 CSS px | 0.084 → 0.069 | 60.0 → 60.0 |
| dialogue, 390 CSS px | 0.055 → 0.082 | 60.0 → 59.8 |

The world is deliberately paused behind these interfaces; the rAF observer does not imply 60 newly drawn gameplay frames. Exact interface, cold-ready, long-task and input samples remain in the raw reports.


The original 78-texture catalog is unchanged: 7,019,858 encoded bytes and about 183 MiB of full-catalog RGBA pixels. Normal scenes reference roughly 71–83 MiB, rather than all exclusive regions simultaneously. These are logical pixel estimates, not measured process RAM. A cached 1440×1000 DPR-1 battle backdrop adds about 5.49 MiB of pixels; other sizes scale with actual physical dimensions. Browser caches, canvas surfaces, fonts, compositor resources and allocator overhead add further memory.

The load stress uses eighteen confirmed slot loads across all nine scenes in the same context, including resize cycles and a real Guardian battle. Linux process PSS includes native resources; V8 heap is reported separately. Statistical allocation profiles include collected allocations, with sampling limits disclosed. Two cycles are a useful retention check, not a long-session, thermal or mobile-memory certification. Once-per-second heap samples and checkpoint PSS cannot prove the absence of short native allocation spikes.

## Visual and functional verification

Frozen install, strict TypeScript/Vite build and **31 domain tests pass**. The complete final browser suite passes **22/22**, with zero failed, skipped or flaky checks, using 2 workers after withdrawing both marker batching and idle-frame reuse. English desktop complete campaign: **686.4 s**. Traditional Chinese touch complete campaign: **638.4 s**. Both traverse all three lanterns/bosses, ending/credits and meaningful clear-save reload. The two new renderer regressions are included in those 22, not added again. Final JS is `index-ZW57hMnJ.js` (92.31 kB); CSS and all 79 runtime art/manifest files are unchanged. The 250 introductory and 101 finite-resource campaign policies remain in the domain suite; they are not independent human balance review.

[Browser results](evidence/gate-c/browser-results.json) · [summary](evidence/gate-c/browser-summary.json) · [domain log](evidence/gate-c/domain-tests.txt) · [build log](evidence/gate-c/build.txt) · [unchanged authority/art/game files](evidence/gate-c/unchanged-baseline.json).

All **30 image pairs** meet the original numerical threshold; all **12 battle pairs are pixel-identical** after input/RAF alignment. Worst mean channel error is **0.001835/255**, with no pixel over 16 levels. [Comparison data](evidence/gate-c/visual-comparison.json). Tiny exploration differences match per-page clock origin/subpixel animation variation. No experimental downgrade is shipped.

[Town before](evidence/gate-c/visual-before-town-1440-full.png) / [after](evidence/gate-c/visual-after-town-1440-full.png) · [phone before](evidence/gate-c/visual-before-town-390-full.png) / [after](evidence/gate-c/visual-after-town-390-full.png) · [cavern before](evidence/gate-c/visual-before-cavern-1440-full.png) / [after](evidence/gate-c/visual-after-cavern-1440-full.png) · [battle before](evidence/gate-c/visual-before-combat-sanctum-1440-player-full.png) / [after](evidence/gate-c/visual-after-combat-sanctum-1440-player-full.png).

[63-second gameplay recording](evidence/gate-c/gameplay.mp4) · [complete English recording](evidence/campaign-desktop-en.mp4) · [complete Traditional Chinese recording](evidence/campaign-phone-zh-TW.mp4) · [formats, hashes and cuts](evidence/gate-c/recordings.json). These are real-time browser captures, silently recorded at 25 FPS/reduced resolution and H.264-transcoded for size. They are not quantitative performance/physical-device/audio evidence. No interpolation, speed changes or synthetic gameplay frames are used.

The full suite covers 320/390/768/1440 layouts, EN/zh-TW, large text, compact landscape, actual keyboard/mouse/touch movement, failure/retry, storage corruption/blocking, confirmations, migration, exact meaningful reload, routes, atlas consistency, phase feedback and live language switching. Tested axe states report zero violations; manual imagery contrast and assistive-technology checks remain open. [Desktop audit](evidence/campaign-axe-desktop.json) / [phone audit](evidence/campaign-axe-phone.json).

Visual fixtures use identical validated states, viewport/DPR, normal motion and virtual time in both actual runtimes. The references are running-game captures, not concept imagery or substituted screenshots. The comparison covers all nine scenes on desktop and emulated phone, plus battle presentation. Numerical image differences support preservation; they do not replace the owner's aesthetic judgment. Initial attack comparisons exposed a 1 ms per-page virtual-clock origin offset. Trusted Attack events are now aligned to the same virtual RAF grid, with timestamps recorded; the comparison threshold and runtime were not changed to hide the difference. No rejected prototype image is presented as the delivered build.

The initial focused reduced-motion test compared composited screenshots while switching UI language; translated overlays necessarily differed. The assertion was corrected to compare the actual canvas pixels, while keeping state, live input and resize checks. [Initial focused report](evidence/gate-c/focused-initial-results.json) and [corrected focused report](evidence/gate-c/focused-results.json) preserve that history. No game behavior was changed to satisfy the mistaken assertion.

## Review artifact and release boundary

Version **0.4.0-gate-c**, **7,223,098 bytes**, SHA-256 `a5c818100e24ecf369caff191cd52c36eb1f2ae01e450302df528cb878f137de`. All 92 extracted hashes and all 87 HTTP-served game files match. The package matches the production files used by the complete final browser suite. [Manifest](evidence/build-manifest.json) · [integrity](evidence/artifact-integrity.json) · [packaged gameplay](evidence/playtest-verification.json) · [verified build identity](evidence/gate-c/verified-build.json). The accepted Gate B ZIP remains unchanged.

Source publication, local QA, CI, owner acceptance, deployment and public gameplay verification are separate statuses. No Pages workflow, public deployment or release acceptance has been added. The helper binds loopback by default; trusted-LAN access is opt-in for owner phone testing. The package has no backend, account, analytics or runtime CDN.

## Outstanding risks and required review

- **Desktop performance:** cloud town/forest traversal remains below the target, with a 20% town throughput regression in the final paired run; irregular tails/stutters remain material. Establish performance on an ordinary recent desktop with a physical GPU, then profile the actual limiting path. Do not dismiss the remaining architecture cost as an environment-only issue.
- **Memory pressure:** large native cache/resource growth occurs in both builds during repeated region loads. Reclaimability under a forced diagnostic notification does not establish a safe physical-device budget.
- **Mobile:** the emulated results do not certify stable 30 FPS on a midrange physical phone. Touch latency, thermal behavior, memory pressure and long sessions remain Not Verified.
- **Compatibility/accessibility:** Chromium automation and axe/keyboard coverage do not certify Safari, Firefox, screen readers, physical touch ergonomics, manual contrast or motion comfort.
- **Gameplay/audio:** independent first-time-player onboarding, balance, pacing and audible quality remain owner/human review items. The GDD's 2–4-hour aspiration is still unproven; automated traversal time is not a human pacing estimate.
- **Visual ownership:** the Gate B presentation is accepted as a floor. These engineering checks preserve it; they do not declare full concept equivalence or new production acceptance.

UGDS S03 remains **Not Verified** for representative hardware, with a **Fail against the provisional desktop target in the measured cloud exploration scenarios**. P01/P04/P05, L01/L02, S01 and Q01/Q02/Q03 retain supporting automated evidence; A01/A02/Q04 require the disclosed manual review. Q05/Q06 distinguish the verified local artifact/source push from any unperformed CI/deployment. There is no silent exception to the pinned standards.
