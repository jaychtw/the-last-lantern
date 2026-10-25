# Gate B — full adventure review candidate

Historical report for `c6ba55087e5277d2457ac2e2b82e6f5a56d6035d`. The owner has accepted this presentation as the minimum visual baseline and authorized Gate C optimization. Evidence links below are pinned to that delivery; see the current Gate C report for subsequent measurements.

The owner approved revised Gate A at `aaea025337ae068fe42c5958e7a55ec858823303` with “Approved. Let’s proceed.” See [approval record](APPROVALS.md). Gate B implements the bounded game in the original [GDD](design/GDD-v1.0.txt), under unchanged [UGDS v1.0.0](design/UGDS-v1.0.0.md), pinned to `d5c6696efdd6efc028118600466db44aecae0c9b`.

**Gate C human gameplay acceptance is pending. No public deployment is authorized or performed.** The approved visual direction does not certify every new composition, performance on physical hardware, accessibility, audio quality, balance or narrative pacing. The rejected flat-vector direction remains rejected.

## Play the adventure

[Download Gate B ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-b.zip) · [instructions and checksum](../playtest/README.md) · [source architecture](ARCHITECTURE.md) · [asset provenance](ASSETS.md)

Extract the whole ZIP, run its Python 3 helper and open the printed address. No cloud workspace, npm, Blender, account or backend is required to play. A trusted-LAN option supports a real phone for human review; automated phone evidence uses touch emulation only.

One controllable Rowan travels from Hearthmere to the Meadow Lantern, the Meadow Shrine, Whisperwood, Moss Cavern, Quarry Road, the Old Watchtower and its Lantern Crown. Calm the Thornkeeper, find the Moss Seal and quiet the Rootbound Warden, then uncover the Dim Guardian’s reason for closing the roads. Restore all three lights while keeping the ancient blaze sealed. A clear flag and ending/credits are saved; return home for Mira’s acknowledgement, continue exploring, or restart after confirmation.

The authored world has **nine scenes**, including the village/interior, three wilderness regions, two compact dungeons and boss/lantern spaces; **10 ordinary enemy archetypes and three bosses**, **six spells**, **20 item/equipment entries**, levels **1–12**, weapon/armour/accessory slots, a shop, paid inn and free safe recovery. There are visible contact encounters and region/rest respawns, one-time bosses/rewards/caches, rune sequences with safe reset, quest keys, meaningful dialogue, deterministic growth and an auditable battle log. The hero’s appearance remains fixed as specified by the GDD; gear changes stats rather than generating arbitrary outfit variants.

The campaign is deliberately compact. **The GDD’s 2–4-hour first-play aspiration is not demonstrated.** Automated traversal is supporting feasibility evidence, not a human duration, fun or pacing measurement. Gate C should assess whether the authored breadth and pacing are sufficient; do not infer duration from content counts or pad it with grinding.

## Systems and player guidance

- Equipment purchases do not auto-equip. Open Equipment, inspect actual attack/defense/speed and choose Equip. Spare gear sells for half price after confirmation; equipped and quest items cannot be sold.
- Levels restore HP/MP and unlock Ward (3), Gleam (4), Focus (5) and Greater Mend (7). Ember and Mend start available. Spell costs and effects are shown. Focus strengthens the next attack spell; Ward reduces incoming damage for three enemy attacks.
- Guard reduces damage 65% and restores up to 1 MP. The modest recovery was added after seeded balance work exposed resource pressure; its effect is disclosed in UI and logs. Watch the telegraph and guard heavy attacks; ordinary low-value tonics are not an effective answer to repeated final-phase heavy blows.
- Fast foes act first according to speed. Invalid actions spend no turn/RNG/resources. Ordinary flight is 75%; bosses cannot be fled. The Guardian changes phase below half HP with a visible heavy-attack warning.
- Elemental multipliers are data-driven and displayed. Reliable physical hits have a rare 5% precise-strike bonus with an explicit log. There are no frequent misses or randomized gear rolls.
- Exploration and rune discoveries contribute XP so the main route reaches late spells without mandatory repeated grinding. Mira’s one-time travel lesson also helps accepted Gate A saves join the campaign naturally.
- Explore routes avoid other visible encounters unless the chosen destination is the foe itself. This provides a predictable keyboard/touch alternative to manually walking around enemies. All traversal still uses the same collision geometry and actual movement.
- The inn costs 5 coins. Mira’s hearth always provides free recovery, preventing an empty purse from stranding a player. Defeat returns Rowan there, fully restored, losing 10% of coins rounded down while preserving discoveries.
- Audio adds an original quiet synthesized pentatonic ambience with contextual battle/region timbres, alongside cues. Muted by default; volume/mute and menu/background pause are supported. It is not a licensed or sampled soundtrack. Audible quality still needs human review.

## Save compatibility

Version 2 stores inventory/equipment, XP/stats, three lights, boss/quest flags, discovered keys/caches, cleared encounters, rune progress, RNG, playtime, location and battle settlement identity. Settings keep their existing independent namespace. Three manual slots and stable-boundary autosave remain. Active turn resolution is not saved.

Loading checks `lantern-v2-*` first, then validates/migrates `lantern-v1-*` without overwriting the original bytes. Names, location, HP/MP, XP, coins, tonics, RNG, time and accepted first-lantern progress are retained. A corrupt v2 save is reported rather than silently falling back to an older v1 journey. Invalid gear, mismatched slots, impossible progression, duplicate discoveries and unsupported versions are rejected. Battle identities prevent duplicate settlement/loot; ordinary respawns receive new identities.

## Running-game evidence

- [Town](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/gameplay-1440-en.png), [phone town](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/gameplay-390-zh-TW.png).
- [Meadow Shrine](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-shrine-desktop-en.png), [Whisperwood](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-forest-desktop-en.png), [Moss Cavern](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-cavern-desktop-en.png), [Quarry Road](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-quarry-desktop-en.png), [Old Watchtower](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-tower-desktop-en.png).
- [Equipment](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-equipment-desktop-en.png), [phone equipment](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-equipment-phone-zh-TW.png), [carved rune puzzle](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-runes-cave-runes-desktop-en.png).
- [Dim Guardian encounter](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-guardian-desktop-en.png), [phone encounter](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-guardian-phone-zh-TW.png), [ending](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-ending-desktop-en.png), [phone ending](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-ending-phone-zh-TW.png), [credits](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-credits-desktop-en.png).
- [320 px English large-text battle](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/battle-320-large-en.png), [Traditional Chinese](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/battle-320-large-zh-TW.png), [compact landscape](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/phone-compact-landscape.png), [compact battle controls](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/battle-compact-landscape.png).
- [Short gameplay recording](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/gate-b-gameplay.mp4), [complete desktop recording](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-desktop-en.mp4), [complete phone recording](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-phone-zh-TW.mp4).
- [Built-file manifest](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/build-manifest.json), [ZIP extraction/HTTP integrity](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/artifact-integrity.json), [packaged gameplay checks](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/playtest-verification.json), [asset sizes/hashes](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/art-assets.json).

Captures are actual browser interactions. The 63-second MP4 joins five real-time excerpts. Full recordings are H.264 transcodes at reduced recording resolution (desktop 720×500; phone 312×674), with preserved durations. They are silent; synthesized audio quality needs human review. [Recording formats, hashes and cut list](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/recordings.json). Neither the supplied collage nor gameplay screenshots are used as playable levels. The approved Rowan model and animation atlases remain; new enemies, props, foreground scenery and battle environments have original Blender source. Scene assets load on demand and the renderer releases application references to the preceding region’s exclusive textures. Shared actors/atlases remain cached. A loading curtain protects movement/state during transitions and save restoration.

## Verification and performance

| Check | Actual result |
| --- | --- |
| `npm ci --cache /workspace/.npm-cache` | Pass; frozen lockfile, 64 packages; no verification bypass |
| `npm run build` | Pass; strict TypeScript + Vite. Final JS 91.60 kB / 35.73 kB gzip; CSS 34.28 kB / 8.39 kB gzip |
| `npm test` | **31 passed**, 0 failed/skipped; domain, inventory/economy, growth/spells, battle/status/phase/RNG, routes, migration/validation and localized catalogs |
| Seeded feasibility | **250/250** introductory policies won without consumables; **101/101** finite-resource main-route campaign policies won, using earned resources/XP and safe preparation, without mandatory encounter repetition |
| Full browser campaigns | English desktop **passed (679.0 s)** and zh-TW touch **passed (623.3 s)** from opening through all lights/bosses/ending/credits and exact clear-save reload; no direct progress mutation |
| Final browser regressions | **18 passed**, 0 failed/skipped/flaky, 238.6 s, one worker; [raw final report](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/browser-results.json) |
| Combined browser coverage | **20 distinct checks have passing latest results**, including the two full campaigns; [summary](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/browser-verification-summary.json) preserves run boundaries and initial failure history |
| Layout/input coverage | 320/390/768/1440 px in EN/zh-TW and larger text; actual keyboard/mouse/touch movement, projected pointer destinations, 320 px battle controls and 568×320 compact landscape/scroll access |
| Recovery/persistence | Defeat/retry, corrupt/blocked storage, overwrite/load/restart confirmations, exact meaningful reload, migration preserving original v1 bytes |
| Animation assets | Eight directions × eight nonempty/distinct Rowan walk frames; eight attack/eight cast frames plus guard/hurt/victory, original enemy action presentations |
| Archive integrity | **7,222,768 bytes**; **92** extracted hashes match, **87** game files match over the actual Python helper's HTTP interface; [integrity report](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/artifact-integrity.json) |
| Packaged gameplay | `node scripts/verify-playtest.mjs` passes: touch traversal, contact encounter, live EN/zh-TW switch, both sides of Attack, landscape rendering, zero page exceptions |
| Automated accessibility | Zero reported axe violations in tested settings/journal/exploration/battle/equipment states; `color-contrast` manual checks involving imagery remain incomplete |
| Pinned authority | Original GDD/UGDS copies unchanged; owner’s Gate A approval recorded separately |

The final build is `index-Q4S8ARqg.js` / `index-R7wCqtNX.css`. Full campaigns passed on the same rules/renderer/assets/input logic before a shared completion-note wording correction. The note now follows the current journal instead of repeating the first chapter’s instruction; two checkpoint presentation tests verify that correction in both languages on the final build. Checkpoint fixtures are identified as presentation/benchmark checks, not claimed as full playthroughs.

The [integration run](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/campaign-integration-results.json) preserves its actual history: the complete campaigns passed, then a retained introductory regression read state too early after asynchronous Continue and stopped the run. The regression was corrected to wait for scene restoration, and the clean final regression run passed. Earlier failed/interrupted navigation runs are not counted as passing suites. The 320 px larger-text battle layout and compact landscape command navigation also passed their actual geometry/visibility checks. Grid-only route checks were strengthened after a real column-corner movement stall; a separate regression actually moves the hero along that route. Interaction approach points now avoid other enemy contact zones.

Final archive SHA-256: `056c2af3cd77229eed62343dfa7883af868015019ca5ba76a89812e32dc7390e`. This identifier matches the manifest, extracted/HTTP integrity, package verification and performance report. Chromium version and cloud environment are recorded in the raw reports. No CI, physical-device or public deployment success is inferred from these local checks.

[Final eight-scenario snapshot](https://github.com/jaychtw/the-last-lantern/blob/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/docs/evidence/performance.json), Chromium **154.0.8037.57**, cloud Linux. Measurements ran separately from Blender, video capture/transcoding and browser QA. Town samples use a fresh game with actual keyboard movement. New-region/battle samples use domain-validated synthetic stable checkpoints loaded through the actual save/Continue interface, then actual movement or attack/counterattack/Guard. These fixtures are explicitly not claimed as narrative playthroughs; the separate complete campaign recordings establish that evidence.

| Scene | CSS width | Sampled frames | Mean FPS | p95 frame time | Referenced texture pixels |
| --- | ---: | ---: | ---: | ---: | ---: |
| town | 320 | 269 | 59.6 | 16.7 ms | 71.0 MiB |
| town | 390 | 272 | 59.8 | 16.7 ms | 71.0 MiB |
| town | 768 | 203 | 40.9 | 50.0 ms | 71.0 MiB |
| town | 1440 | 140 | 28.7 | 50.0 ms | 71.0 MiB |
| forest | 390 | 261 | 57.6 | 16.8 ms | 82.5 MiB |
| cavern | 390 | 266 | 60.0 | 16.8 ms | 82.5 MiB |
| tower | 1440 | 265 | 59.3 | 16.7 ms | 82.5 MiB |
| sanctum · active battle | 390 | 170 | 59.1 | 16.8 ms | 78.5 MiB |

**The town remains below the stable 60 FPS desktop target in this cloud browser.** Other measured scenes do not erase that gap. These are short software/cloud Chromium samples, with no CPU throttling or physical-device, thermal or long-session certification. Ordinary-hardware desktop and midrange-phone targets remain Not Verified. The 320/390 px contexts emulate device scale 2 and cap canvas rendering at 1.5; tablet/desktop use scale 1.

The full 78-texture catalog is **7,019,858 compressed bytes / 183.0 MiB of RGBA pixels**. The application retains only shared textures/atlases and current-region layers, approximately 71–83 MiB of referenced pixels in these cases. This is a logical texture estimate, not measured resident memory; browser caches/canvas surfaces add their own costs. Scene caching/overdraw work and real hardware profiling remain technical priorities before release.

## Limits and Gate C review

- Review the new forest/cavern/quarry/tower compositions and monster posing against the approved direction. Procedural sculpting, finite pose animation and mainly baked light/shadows retain the Gate A pipeline’s limits. New content is not automatically aesthetically accepted because the initial direction was approved.
- The fixed elevated camera, repeated material/foliage families and simplified enemy deformation remain less refined than the supplied commercial-quality concept. Source rendering is offline CPU Cycles; no claim of freely navigable real-time 3D or dynamic scene-wide shadows is made.
- Human pacing, first-time-player onboarding, difficulty, audio, physical-phone ergonomics/performance, thermal/long-session behavior, Safari/Firefox and screen readers remain Not Verified. Automated seeded policy wins do not prove that a first-time player knows the policy or enjoys the balance.
- Chinese glyphs use system fonts. The game is a locally served static package with bundled assets/fonts/audio; it has no account, telemetry, runtime CDN, installable PWA/service worker or controller support. Those are not claimed complete.
- Build/test success, source push, CI, human acceptance, public deployment and public gameplay verification are separate statuses. No Pages deployment workflow or release has been added.

## UGDS status

| Requirement | Status | Basis |
| --- | --- | --- |
| P01/P04/P05 complete loop, observable mechanics, recovery | Pass | Full opening-to-clear loop, shared collision/rules, logs, confirmations and safe defeat/recovery |
| P02/P03 desktop/touch and responsive layout | Pass | Actual keyboard/mouse and touch-emulated flows; four widths/two languages and orientation evidence |
| L01/L02 bilingual/live switching | Pass | Centralized EN/zh-TW campaign resources and saved-state-preserving switching |
| A01/A02 accessibility/motion/sound | Not Verified | Automated/keyboard/reduced-motion controls and sound settings; independent assistive-technology/comfort/audio review open |
| V01/V02 production assets and separate gates | Pass | Original independent mesh/material/pose exports, approved Gate A, Gate C pending |
| V03/V04 consistency/representative approval | Not Verified | Gate A direction approved; new full-campaign scenes await human review |
| V05/V06 quality honesty and visual evidence | Pass | Original target retained, real captures and limitations supplied |
| S01 persistence | Pass | Versioned migration, corruption preservation, meaningful exact reload and settlement identity |
| S02/S04 independence and honesty | Pass | Local assets/audio, no backend, gentle recovery and evidence limits disclosed |
| S03 target-device performance | Not Verified | Cloud measurements only; physical hardware/long sessions remain unproven |
| Q01/Q02/Q03 domain, browser and integrity/balance | Pass | Meaningful rule tests, full gameplay and finite-resource seeded policy evidence |
| Q04 accessibility validation | Not Verified | Automated evidence supports, but does not replace, manual review |
| Q05/Q06 release integrity and evidence | Pass | Artifact identifiers, actual commands/results and open gates recorded |
| C01/C02 authority/change control | Pass | Gate A approval recorded; unchanged pinned GDD/UGDS; no deployment inferred |
| C03 standards improvement | Not Applicable | No UGDS revision proposed |
