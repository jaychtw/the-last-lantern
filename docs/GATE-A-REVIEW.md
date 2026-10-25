# Gate A — playable art and interaction candidate

Prepared **2026-10-25 (Asia/Taipei)**. Governing documents: [GDD v1.0](design/GDD-v1.0.txt) and unaltered [UGDS v1.0.0](design/UGDS-v1.0.0.md), pinned to `d5c6696efdd6efc028118600466db44aecae0c9b`.

**Gate A human approval is pending.** This is a review candidate, not the full game or an accepted visual direction. Per GDD §10: “STOP after Gate A.” The owner explicitly authorized publishing this candidate to `main` on 2026-10-25 (Asia/Taipei) so it can be reviewed outside the cloud workspace. That authorization covers source, screenshots, recordings and the tested playtest ZIP. Gate B and public game deployment still require explicit approval. No CI success or public game deployment is claimed. The repository was initially empty.

## What to play

One controllable courier explores Hearthmere and Meadow Path, enters Mira's cottage, talks, reads notes, collects a chest, rests, and fights an original Dewdrop Blob in a contact encounter. Attack, Ember, Mend, Tonic, Guard and Flee use independent deterministic rules. The enemy telegraphs its heavy splash. Player strikes/casts, enemy reactions/counterattacks, damage numbers, HP/MP changes and readable logs are presented in the running game. Victory clears the path; the courier can relight the first lantern for a completion state and return to Mira. Defeat brings the hero home at the disclosed modest coin cost, retaining discoveries.

Keyboard/mouse and phone touch are implemented, including named collision-aware destination walking. English/Traditional Chinese switches live. Settings includes text size, reduced motion, faster battles, mute/volume, three manual saves and safe-boundary autosave. Unreadable saves are retained, blocked storage permits session play, and destructive replacement/load/restart actions require confirmation. There are no later regions, bosses, party, full progression, shops or campaign content in this candidate.

## Review artifact and evidence

- [Download the tested playtest ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-a.zip) — **404,406 bytes**; [instructions](../playtest/README.md).
- SHA-256: `e3763acd073127111090d59c484ac49fbff52b2deeacea629f8fc59f9681be68`.
- Extract the ZIP and follow `START-HERE.txt`; run its Python 3 helper. No Node/npm installation is needed to play the package. It serves only bundled game files and does not publish them.
- [Built-file hash manifest](evidence/build-manifest.json), [packaged gameplay verification](evidence/playtest-verification.json).
- [Desktop exploration](evidence/gameplay-1440-en.png), [phone exploration, zh-TW](evidence/gameplay-390-zh-TW.png).
- [Cottage interior](evidence/interior-1440-en.png), [phone interior](evidence/interior-390-zh-TW.png).
- [Desktop battle](evidence/battle-1440-en.png), [phone battle, zh-TW](evidence/battle-390-zh-TW.png).
- [Desktop completion](evidence/completed-1440-en.png), [phone completion](evidence/completed-390-zh-TW.png).
- [34-second gameplay excerpt](evidence/gate-a-gameplay.mp4), [complete desktop recording](evidence/playthrough-desktop-en.webm), [complete phone recording](evidence/playthrough-phone-zh-TW.webm).

All screenshots/recordings come from actual browser interactions with the running production build. The MP4 is a real-time excerpt (38–72 seconds) from the desktop recording, resized to an even height for H.264 compatibility. It is silent; Playwright does not capture the synthesized audio. Video is supporting evidence, not a substitute for human hands-on play. Recorded phone interactions use touch emulation; no physical phone is claimed.

## Verification results

| Command/check | Result |
| --- | --- |
| `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` | Pass; frozen installation, 77 packages; no verification bypass |
| `npm run build` | Pass; strict TypeScript and Vite production build with relative asset URLs |
| `npm test` | **16 passed**, 0 failed, 0 skipped; battle/RNG, costs, telegraphs, settlement, defeat, quests, collision/navigation, save validation, localization resources |
| Introductory battle simulation | **250/250 seeds won** with the documented guard/heal/magic policy and no consumables; feasibility evidence, not first-time-player balance acceptance |
| `npm run test:browser` | **11 passed**, 0 failed, 0 skipped, 0 flaky; final run 227.5 s, one worker; [raw report](evidence/browser-results.json) |
| Browser flow coverage | Complete EN desktop and zh-TW touch chapter, cottage, chest, encounter, lantern, manual save, reload, language switching, defeat/retry, corrupt/blocked storage, overwrite/load/new-journey confirmation, keyboard pause/focus |
| Layout coverage | 320, 390, 768 and 1440 px in both languages with larger text; no horizontal overflow; screenshots `layout-*` and `settings-*` |
| Packaged helper | ZIP extracted; every file hash checked; helper served every compiled asset with expected bytes; packaged touch traversal and two-sided attack checked without state injection |
| Additional packaged layouts/audits | 844×390 phone landscape screenshot; exploration and battle audited in EN/zh-TW; no page exceptions |
| Asset generation | Identical regeneration; all SVG XML parses; unchanged pinned UGDS copy verified |

Chromium **154.0.8037.57** on cloud Linux was used. The full browser suite exercised the genuine `/the-last-lantern/` project subpath. The portable ZIP was separately exercised at the root served by its actual Python helper. No fake passing checks or direct state mutation were used for the playthroughs. Read-only `window.__lantern()` diagnostics support assertions on engine state and frame timings.

Automated axe scans reported **zero violations** in the tested settings, journal, exploration and battle states. They also reported **incomplete checks requiring manual review**, including contrast against canvas/decorative imagery and an ARIA check in journal scans. See [desktop journal audit](evidence/axe-desktop.json), [phone journal audit](evidence/axe-phone.json), and [packaged exploration/battle audits](evidence/playtest-verification.json). Zero reported violations is not complete contrast or assistive-technology certification. Physical-device ergonomics, screen readers and independent accessibility review remain Not Verified.

Earlier development runs found a malformed SVG and a menu/world resume integration bug; both were fixed. A test helper initially counted hidden dialog contents and was corrected to wait on visible controls. The recording environment needed the already-installed system FFmpeg. Resource-contended two-worker desktop recording exceeded the earlier two-minute test deadline. The final single-worker run with a smaller recording frame passed, including real attack and enemy counterattack animation. Those earlier failed/interrupted runs are not counted as successful verification.

## Measured performance

[Raw performance snapshot](evidence/performance.json), measured separately from video recording and browser test workloads. Each sample used actual movement in Hearthmere, including animated hero/environment; ~4.4 seconds of sampled frames after warm-up. Phone DPR was 2, with rendering capped at 1.5×.

| CSS width | Sampled frames | Mean FPS | 95th-percentile frame time |
| --- | ---: | ---: | ---: |
| 320 | 262 | 57.4 | 16.8 ms |
| 390 | 263 | 58.4 | 16.8 ms |
| 768 | 256 | 56.1 | 33.3 ms |
| 1440 | 191 | 40.8 | 33.4 ms |

The cloud GPU is **SwiftShader software rendering**. Initial software WebGL samples were too slow; a Canvas2D adapter now draws the same Pixi scene graph/atlas on detected software GPUs. Hardware GPUs retain Pixi WebGL. The atlas and lack of unnecessary multisample antialiasing also reduce work; paused menus stop world rendering.

These are short cloud-browser samples, not physical-device benchmarks. **Stable 60 FPS on ordinary desktop hardware has not been demonstrated.** Hardware WebGL, thermal behavior, representative long sessions and midrange-phone performance remain Not Verified. Do not generalize the emulated-phone numbers to actual phones.

## Visual comparison and limitations

| GDD ambition | Candidate evidence | Remaining review |
| --- | --- | --- |
| Original cohesive storybook fantasy | Teal courier, brass lantern, moss/sage environments, slate/plaster cottages, botanical enemy and restrained parchment UI; independent game assets | Human aesthetic/cohesion acceptance pending |
| Layered production pipeline | Original source generator, 29 separate assets, deterministic atlas, y-sorted scene objects, articulated character parts, lighting particles and transparent overlays | Not a concept-still background; richer environment detail may be needed |
| Consistent expressive character animation | Same head, outfit, limbs and accessories in idle/walk/battle; stride, cape sway, strike, cast, hurt and enemy splash | Front/mirrored locomotion and simple rig poses are less expressive than a polished hand-animated indie RPG |
| Rich 2.5D lighting/depth | Directional asset shading, soft ground shadows, overlapping canopies, foreground layers and following camera | Mostly authored vector shading; no advanced dynamic shadow/parallax system or painterly surface treatment |
| Mobile usability | Real touch-emulated chapter, legible DOM battle controls, camera following rather than whole-map shrink, Explore alternative | Physical-phone thumb comfort and readability need human testing |

The current clean vector style is an **unapproved candidate**, not a claim to have reached the Switch-era indie quality bar. If the creative director considers it too flat/simple, revise the representative assets/posing/lighting in Gate A before scaling production. Do not silently lower the quality target or start full-content production based on functional tests.

Portrait is recommended on phones for this candidate. Narrow scenes crop and follow the hero. Short landscape layouts preserve a minimum scene height and scroll vertically to controls; Explore remains an alternative when the world and direction pad cannot fit simultaneously. This is documented, tested for horizontal overflow, and still needs physical-device ergonomic acceptance. [Landscape evidence](evidence/phone-landscape.png).

Additional limits: no ambient musical score, controller support, installable service worker/PWA, full leveling/equipment/economy or campaign content. All runtime assets/fonts are bundled locally; offline installation is distinct from running a locally served package. Audio cues exist, but audible quality was not independently reviewed. Firefox, Safari/WebKit, physical devices, screen readers and first-time-player testing were not performed.

## UGDS status for this Gate A candidate

| Requirement | Status | Basis |
| --- | --- | --- |
| P01 complete loop, P04 observable rules, P05 recovery | Pass | Playthrough/completion/restart, independent rule tests, collision paths, disclosed defeat and save confirmations |
| P02 desktop/touch | Pass | Real keyboard and touch-emulated primary interactions; physical-device acceptance separate |
| P03 responsive | Pass | Four required widths/both languages; landscape behavior documented and separately captured |
| L01/L02 bilingual/live switching | Pass | Typed resources, full EN/zh-TW chapter and mid-session switching |
| A01 accessibility | Not Verified | Keyboard/focus and automated audits pass within tested scope; manual contrast/assistive-technology checks remain |
| A02 motion/sound | Not Verified | Reduced motion and sound/volume controls implemented/tested at UI level; independent audible/comfort acceptance pending |
| V01 production assets | Pass | Original individual assets/atlas; no concept-image level substitute |
| V02 separate gates | Pass | Candidate explicitly awaiting human visual gate; no full production |
| V03/V04 consistency/representative visual approval | Not Verified | Running slice and evidence delivered; creative-director approval pending |
| V05 no silent downgrade | Pass | Vector candidate and quality gap explicitly disclosed; no target change asserted |
| V06 visual evidence | Pass | Desktop/phone screenshots and actual movement/combat recordings |
| S01 persistence | Pass | Three slots, autosave, schema validation, corruption preservation, blocked-storage session, exact meaningful reload |
| S02 runtime independence | Pass | Local assets/fonts/audio; no backend, analytics or runtime external service |
| S03 performance | Not Verified | Cloud snapshot recorded; desktop 60 FPS and target physical hardware not established |
| S04 family-friendly/honest | Pass | Gentle battle/recovery; original fictional mechanics; test limitations disclosed |
| Q01 rules, Q02 browser gameplay, Q03 integrity/balance evidence | Pass | 16 domain checks, 11 browser checks, 250 seeded simulations; human balance remains pending |
| Q04 accessibility validation | Not Verified | Automated/keyboard evidence supplied; manual incomplete checks remain |
| Q05 release integrity | Pass | Local build, source push, CI, deployment and public verification explicitly distinguished; no release authorized |
| Q06 evidence/limits | Pass | Commands, counts, viewports/languages, screenshots, recordings, artifact hashes and unverified checks recorded |
| C01/C02 authority/change control | Pass | Gate A boundary retained; engineering choices documented; human creative decision pending |
| C03 standards improvement | Not Applicable | No UGDS change proposed; pinned source remains unchanged |

## Cloud environment configuration

Frozen installation and service-start/QA instructions were saved in the cloud configuration draft (`install_script`, `start_skill`). Saving did not execute or publish the draft. To retain those settings for future tasks, review and save them in environment settings, then publish the **cloud environment**. This is separate from publishing the game, which remains unauthorized.

## Decision needed

Play the local package on desktop and a physical phone. Review the hero/art style, scene composition, walking and battle feel, bilingual readability and control comfort against the stated quality ambition. Approve or request Gate A revisions before any Gate B work. Physical-device/performance/accessibility limitations above remain open even if the visual direction is accepted.
