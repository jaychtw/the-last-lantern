# Gate A — revised visual proof of concept

Prepared **2026-10-25 (Asia/Taipei)**. Authority: the owner's new concept collage and [revision brief](VISUAL-REVISION.md), unchanged [GDD v1.0](design/GDD-v1.0.txt), and [UGDS v1.0.0](design/UGDS-v1.0.0.md) pinned to `d5c6696efdd6efc028118600466db44aecae0c9b`.

**Human visual/interaction acceptance is pending.** The previous flat-vector candidate (`4156480a644648e6e92fd8c68193223ff727f79a`) was rejected. This revision replaces its presentation pipeline and retains the established rules. It does not claim to have reached the supplied reference's commercial quality. The owner's existing “Push to main” instruction authorizes source/evidence/package publication for review outside the cloud workspace. Gate B, full RPG production and public game deployment remain unauthorized. No CI success or public deployment is claimed.

## Review the actual game

- [Download the revised playable ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-a.zip), [instructions](../playtest/README.md), [SHA-256](../playtest/SHA256SUMS.txt).
- [Desktop town](evidence/gameplay-1440-en.png), [phone town, Traditional Chinese](evidence/gameplay-390-zh-TW.png).
- [Mira dialogue](evidence/dialogue-1440-en.png), [second expression](evidence/dialogue-thoughtful-1440-en.png), [phone dialogue](evidence/dialogue-390-zh-TW.png).
- [Desktop battle](evidence/battle-1440-en.png), [phone battle](evidence/battle-390-zh-TW.png), [live attack feedback](evidence/battle-attack-phone.png), [cottage interior](evidence/interior-1440-en.png).
- [Lantern completion](evidence/completed-1440-en.png), [phone landscape](evidence/phone-landscape.png).
- [Short gameplay recording](evidence/gate-a-gameplay.mp4), [complete desktop recording](evidence/playthrough-desktop-en.webm), [complete phone recording](evidence/playthrough-phone-zh-TW.webm).
- [Build-file hash manifest](evidence/build-manifest.json), [packaged gameplay checks](evidence/playtest-verification.json).

Extract the ZIP and follow its bilingual `START-HERE.txt`. Python 3 and a recent browser suffice; no Node/npm/Blender installation or cloud workspace is needed to play. The helper serves bundled files locally, with optional trusted-LAN phone access. It does not deploy the game. Saves remain in that browser.

All linked screenshots and recordings are captured from interactions with the running production build. They show live movement/dialogue/combat/state changes, without direct state injection. The 29-second MP4 joins two real-time excerpts from the desktop WebM (0–9 s town/dialogue and 32–52 s meadow/battle/completion), resized to 960×666 for H.264; no synthetic gameplay frames are added. It is silent because Playwright does not capture synthesized audio. Touch recordings use emulation, not a physical phone.

## Pipeline and scope

**Selected: original prerendered Blender 3D assets, articulated frame atlases, native Canvas2D composition and accessible DOM interface.** Separate cottages, vegetation, terrain, props, Rowan and Mira have actual mesh/material/light sources. The same Rowan model supplies portraits, 64 walking frames (eight directions × eight poses), eight attack and eight cast frames, and guard/hurt/victory states. Depth sorting, pointer-ground projection, movement, occlusion, collision, transitions, enemy contact and combat resolution run in the game.

Battle combines a separately authored distant sky/valley matte with a transparent rendered 3D clearing, separate actors and live action effects/UI. The original matte's prompt and hash are committed; it contains no actors, foreground props, buildings or interface. The supplied collage contributes no runtime pixels. This is a layered production asset, not a completed gameplay still. See [provenance](ASSETS.md), [editable models](../assets/source/) and [architecture](ARCHITECTURE.md).

The rejected SVG pipeline was easy to edit but failed the dimensional art target. Layered illustration can provide rich surfaces but needs consistent multi-direction animation and a sustained illustration effort. Real-time 3D offers free cameras/dynamic lights but adds mobile GPU, shadows and engine complexity without solving asset quality by itself. Prerendered 3D was selected for consistent characters/materials and inexpensive runtime composition. It trades away free camera rotation, dynamically correct shadows and continuous mesh animation. [Full decision and authoring commands](VISUAL-REVISION.md).

The POC retains one controllable Rowan, Hearthmere, Mira's cottage, Meadow Path, dialogue/objectives, supplies/rest, an original botanical Dewdrop encounter, deterministic turn-based actions/rewards/recovery and first-lantern completion. Attack, Ember, Mend, Tonic, Guard and Flee remain functional. Versioned saves, three manual slots, safe-boundary autosave, corrupt-save preservation, blocked-storage session play, EN/zh-TW live switching, larger text, reduced motion and optional muted synthesized cues remain. Destination walking now stops beside NPCs/props. Visible enemy contact still triggers combat normally.

There are no additional party members, regions, bosses, campaign progression, shop/equipment system or full dungeon production. This milestone focuses the representative town/dialogue/battle scenes; the existing interior/lantern loop demonstrates the style across transitions. The GDD's equipment and dungeon design remains intact for later gated production.

## Comparison with the supplied reference

| Reference property | Demonstrated in the running game | Still below target / acceptance work |
| --- | --- | --- |
| Dimensional fantasy settlement | Separate half-timbered cottages, individual roof tiles, plaster/stone/wood surfaces, flower boxes, cobbles, river/bridge, layered trees and real light/shadow renders | Fixed elevated camera lacks the reference's long perspective street, dense bespoke architecture and distant town/castle vistas; environmental density/composition need art direction |
| Appealing coherent hero | One chestnut-haired, blue-cloaked Rowan model across exploration/portrait/battle; tunic, boots, satchel, blade and lantern silhouette | Face/hair/hands remain visibly procedural and toy-like; proportions, sculpting and facial expression do not match the reference's character polish |
| Expressive dialogue | Original silver-haired, bespectacled Mira with model-consistent portraits and a second thoughtful presentation | Two posed expressions rather than facial rig, lip-sync or continuous gesture animation; staging needs refinement |
| Color, materials and atmosphere | Warm key/cool rim light, modeled material detail, translucent layered contact shadows, saturated foliage, atmospheric distant battle valley and warm lantern glow | Lighting is mainly baked; model/matte rendering styles differ; sampled render grain, repeated foliage and limited surface storytelling remain |
| Animated turn-based combat | Original leaf-crowned Dewdrop, eight-frame blade/cast motion, lunge, recoil, enemy hop/splash, light/arcs/particles, damage/status/telegraphs and exact rule outcomes | Finite pose animation, no sophisticated deformation/contact choreography; attack timing/effects and enemy animation need commercial animation polish |
| Restrained RPG interface | Fullscreen playable scene, midnight/brass HUD and menus, lower dialogue panel, native battle commands, bilingual responsive layouts | Narrow phones show less environment and require camera following; physical ergonomics/manual contrast still need review |
| Consistency across game modes | Shared Rowan model/materials, matching original props, UI and lantern palette in town/interior/dialogue/battle | Full overworld, equipment and dungeon production are outside this acceptance slice; no claim of campaign-wide art acceptance |

**The desired quality bar has not been lowered or declared met.** This demonstrates the replacement pipeline and a dimensional playable candidate. A production artist/animator should refine sculpted faces/hair/hands, architectural composition, painterly material treatment and animation/contact timing before scaling assets. If the owner still finds these gaps too large, remain in Gate A and revise representative assets or reassess the pipeline; passing functional tests cannot approve the art direction.

## Verification

| Command/check | Result |
| --- | --- |
| `npm ci --cache /workspace/.npm-cache` | Pass; frozen installation, 64 packages; no verification bypass |
| `npm run build` | Pass; strict TypeScript + Vite; relative asset URLs, 51.92 kB JS (21.28 kB gzip) and 30.45 kB CSS (7.71 kB gzip) |
| `npm test` | **16 passed**, 0 failed/skipped; independent combat/RNG/costs/telegraphs, quests, collision/navigation, persistence and localization |
| Introductory battle policy | **250/250 seeds won** without consumables under the tested guard/heal/magic policy; feasibility evidence, not human balance acceptance |
| `npm run test:browser` | **14 passed**, 0 failed/skipped/flaky, 201.2 s, one worker; [raw report](evidence/browser-results.json) |
| Complete browser flows | English keyboard/mouse and zh-TW touch chapter, dialogue/portrait changes, cottage/rest/notes, chest, encounter, lantern completion, manual save/reload, live language switch |
| Recovery/input coverage | Defeat/retry, corruption preservation, blocked storage, overwrite/load/restart confirmations, pause/focus, inverse-projected mouse/touch ground traversal |
| Rendered layouts | 320/390/768/1440 px, both languages and larger text; no horizontal overflow; desktop/phone battle fills full viewport |
| Animation assets | 64 decoded, nonempty, distinct walk frames across eight directions; attack/cast each eight frames, guard/hurt/victory states |
| Portable archive integrity | **3,980,067 bytes**, all **46** extracted per-file hashes match; all **41** game files match when fetched from the actual Python helper; [integrity report](evidence/artifact-integrity.json) |
| `node scripts/verify-playtest.mjs` | Pass on the extracted ZIP; touch traversal/contact battle, live language switching, both sides of Attack, no page exceptions; 844×390 landscape capture |
| Accessibility automation | Zero reported axe violations in the tested settings/journal/exploration/battle states; manual incomplete checks remain |
| Design/rule preservation | `git diff --exit-code 4156480 -- src/domain.ts docs/design/GDD-v1.0.txt docs/design/UGDS-v1.0.0.md` passes; rules and pinned authority unchanged |

Browser: Chromium **154.0.8037.57**, cloud Linux. The full suite exercised the real `/the-last-lantern/` project subpath. The extracted ZIP was separately checked at its helper's root URL. The final build retains the same tested JavaScript (`index-Bwo6_aPY.js`) and stylesheet (`index-D9jl7ANa.css`); the final metadata description and archive were separately rebuilt/checked. Read-only diagnostics support assertions; no direct game-state mutation is used for playthroughs.

Final archive SHA-256: `064f6e317e1088fd1da65cb80788bede6f7022fc3996dc956282de19f6b7a712`. The same identifier is recorded in the package verification, extracted/HTTP integrity report and build-file manifest.

Automated axe scans report only the states actually audited. Incomplete/manual checks, including `color-contrast` involving imagery/canvas and `aria-prohibited-attr` in journal scans, plus assistive-technology behavior, remain open. Zero automated violations does not certify accessibility. Physical phones, Safari/WebKit, Firefox, screen readers, audible quality, thermal/long-session performance and independent first-time-player balance/comfort are **Not Verified**.

## Performance and technical limitations

[Raw final performance snapshot](evidence/performance.json): the exact extracted ZIP, with actual Hearthmere movement/hero/scenery/camera updates, approximately 4.4 seconds sampled after warm-up per viewport. No Blender render, video capture or other browser verification workload ran concurrently. Phone device scale was 2, capped to 1.5× canvas rendering; tablet/desktop scale was 1.

| CSS width | Sampled frames | Mean FPS | 95th-percentile frame time |
| --- | ---: | ---: | ---: |
| 320 | 271 | 60.0 | 16.7 ms |
| 390 | 269 | 58.7 | 16.8 ms |
| 768 | 267 | 58.3 | 16.8 ms |
| 1440 | 164 | 34.5 | 33.4 ms |

**The 1440 px cloud result is below the 60 FPS desktop target.** It does not demonstrate ordinary-hardware desktop or midrange-phone performance. All samples are short headless Chromium cloud measurements; no physical-device, thermal, long-session or battle-FPS benchmark is claimed. Native Canvas2D removes a runtime WebGL requirement but still depends on browser compositing cost. Physical hardware profiling, scene caching/overdraw work and an explicit quality/performance budget remain before production. Do not treat these results as performance acceptance.

During integration, visual capture exposed the browser dialog's default maximum width (a right-side unused strip) and a distant matte occluded by the foreground. Both were corrected; a fullscreen-width assertion now checks the actual battle at desktop and phone sizes. The earlier interrupted run is not counted as final verification. A negative animation-clock resume edge case and rectangular shadow-catcher spill were also corrected during development.

Offline Blender authoring uses CPU Cycles at 48 samples. This Blender 4.3.2 build lacks OpenImageDenoise; denoising is explicitly disabled and some grain remains. Editable models and runtime assets are committed, so normal builds do not rerender art. Art generation is substantially slower than ordinary TypeScript builds. The current 32 compressed textures total 3,801,314 bytes and approximately 83.18 MiB of uncompressed RGBA pixels before browser/canvas overhead; eager texture decode is a mobile memory risk to profile on hardware. [Asset sizes, dimensions and hashes](evidence/art-assets.json). The source script and original distant-matte image/prompt preserve maintainability, while more assets/animation directions would increase atlas size, texture decode cost and authoring work.

The runtime has a fixed camera and primarily baked light/shadows. Tree sway/bobbing/action lights are presentation effects, not dynamic 3D simulation. Layer contact shadows approximate scene-wide lighting; free camera, dynamic shadow interaction and arbitrary equipment variants require additional exports or a new pipeline decision. Device system fonts supply Traditional Chinese glyphs. No sampled score, controller support, installable PWA/service worker or backend is included. No claim of browser/device compatibility beyond tested Chromium emulation is made.

## UGDS acceptance status

| Requirement | Status | Evidence/boundary |
| --- | --- | --- |
| P01/P04/P05 complete loop, observable mechanics, recovery | Pass | Actual chapter completion/retry, deterministic domain checks, collision-aware routes, defeat/save confirmations |
| P02 desktop/touch | Pass | Keyboard/mouse and real touch-emulated controls; physical acceptance separate |
| P03 responsive | Pass | Four required widths/both languages, larger text and additional landscape capture |
| L01/L02 bilingual/live switching | Pass | Typed resources, complete EN/zh-TW flows and preserved state |
| A01 accessibility | Not Verified | Keyboard/focus and automated evidence supplied; manual contrast/screen-reader review outstanding |
| A02 motion/sound | Not Verified | Reduced-motion path and mute/volume implemented; independent comfort/audible acceptance outstanding |
| V01 production assets | Pass | Original separate mesh/material/light exports, articulated atlases, production matte provenance; no supplied concept/game screenshot inserted |
| V02 separate quality gates | Pass | Revised candidate awaiting owner approval; no full production/deployment |
| V03/V04 coherent representative visual approval | Not Verified | Town/dialogue/battle candidate and evidence delivered; explicit quality gaps and human approval pending |
| V05 no silent downgrade | Pass | Original target retained; model/animation/composition gaps and proposed refinement disclosed |
| V06 visual evidence | Pass | Fresh actual desktop/phone screenshots and gameplay recordings |
| S01 persistence | Pass | Slots/autosave/validation/corruption/blocked-storage and meaningful reload checks |
| S02 runtime independence | Pass | Bundled local assets/fonts/audio; no account/telemetry/external runtime services |
| S03 target-device performance | Not Verified | Cloud desktop snapshot below 60 FPS; physical target devices and stable ordinary-desktop performance unproven |
| S04 age-appropriate honesty | Pass | Gentle original encounter/recovery; limitations disclosed |
| Q01/Q02/Q03 rules/gameplay/integrity | Pass | Current domain/browser suite and seeded introductory-battle policy checks; fun/human balance not inferred |
| Q04 accessibility validation | Not Verified | Automated/keyboard checks completed within scope; manual incomplete checks remain |
| Q05 release integrity | Pass | Build/test, source publication, CI, acceptance and deployment distinguished |
| Q06 evidence and limits | Pass | Actual build/artifact identifiers, commands, raw reports and open checks recorded |
| C01/C02 authority/change control | Pass | Unchanged pinned design/standards; Gate A boundary and replacement pipeline documented |
| C03 standards improvement | Not Applicable | No UGDS changes proposed |

The cloud configuration draft from onboarding remains separate from game source publication and creative approval. No public deployment has been performed. Review the package, screenshots and recording against the collage; explicit Gate A acceptance is required before any Gate B work.
