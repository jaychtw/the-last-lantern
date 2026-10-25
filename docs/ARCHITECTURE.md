# Architecture and decisions — Gate A

Authority: supplied GDD v1.0; unaltered UGDS v1.0.0 at `d5c6696efdd6efc028118600466db44aecae0c9b`. This is a new RPG-specific codebase. No Match3 Core dependency or source is used.

## Rendering decision

TypeScript, Vite and PixiJS 8.14.3 provide a locally bundled WebGL 2D renderer. Separate SVG production assets are rasterized as textures, then composed in a depth-sorted world. The authored ground layer contains terrain/path markings; water, buildings, bridge, trees, shrubs, props, characters and particles are independently placed layers. It is not a concept image used as a level. Character head, body, cape, arms, legs and lantern are separate assets; limb rotation, opposing steps, small vertical interpolation, cape sway and light sway produce movement. Battle reuses the same outfit assets and adds a strike, cast, impact, guard and recovery presentation. Decorative motion stops in reduced-motion mode. Menus stop the world ticker and retain state.

The build also ships a deterministic 1024×976 atlas generated from the same individual source SVGs. When the browser identifies a software WebGL renderer (SwiftShader/llvmpipe/software), a small Canvas2D adapter draws the identical Pixi scene graph, atlas frames, transforms, opacity and depth order. The hero's simple ground-shadow ellipse is reproduced explicitly. This avoids the measured software-WebGL bottleneck without substituting different art or consequential rules. Hardware GPUs retain Pixi WebGL. Antialiasing is provided by rasterized assets; WebGL multisample antialiasing is unnecessary for these textured quads. Render resolution is capped at 1.5× for scalable mobile costs. Cloud tests measure the software fallback; hardware WebGL performance remains unverified.

PixiJS was selected over Phaser because this small slice needs scene composition and a controlled DOM interaction layer, without physics/scene-system dependencies. Its imperative renderer leaves consequential rules independent and keeps text/forms accessible DOM elements. Phaser would provide more framework structure, but is not required for these authored scenes. Godot Web would add a larger export/runtime and an additional toolchain; there is no demonstrated visual/mobile advantage in this environment to justify it. Neither engine choice establishes visual quality by itself.

**Visual limitation:** this is a deliberately authored vector pipeline under review, not an accepted substitute for the GDD's polished Switch-era indie ambition. It demonstrates consistency, individual layers and working animation. Richer character posing, painterly detail, lighting and motion may be necessary after human review. No full art set or later regions should be produced before that review.

## Rules and state

- `src/domain.ts`: versioned state, authored scene geometry and places, bounded A* walking, collision, deterministic LCG battle RNG, bounded damage, resource costs, turn outcomes, one-time rewards, defeat recovery, quest prerequisites and validated persistence. No renderer dependency. This slice has one hero and one enemy. More combatants, equipment/leveling and later content belong to Gate B after approval.
- `src/renderer.ts`: scene asset loading, y-sorted objects, articulated courier, enemy idle, lightweight lighting particles, responsive camera, render metrics. No battle/economy decisions.
- `src/main.ts`: input, menus, localization presentation, safe-transition autosave, manual slots, confirmation flows and animation scheduling. Input is locked while an action resolves; save controls are unavailable during combat. Settlement is committed only once at the outcome boundary.
- `src/i18n.ts`: typed EN/zh-TW resources. Language changes preserve state, including RNG and progress. The hero's chosen name is not translated.
- `src/audio.ts`: original bounded Web Audio tones, muted by default. No audio samples or remote music. There is no ambient musical score in this slice.

Map geometry is finite, visible encounters use contact, and the camera follows the hero instead of fitting the full map onto a phone. Keyboard, pointer/touch navigation and the Explore menu use the same collision model. Named destination navigation is an accessible alternative to precision walking; it moves the character rather than teleporting it. The cottage fire is a free recovery point for the introductory slice. No paid inn/shop/equipment system is implied.

`lantern-v1-auto` and `lantern-v1-1..3` store validated stable exploration snapshots; `lantern-preferences` stores nonsecret preferences. Corrupt snapshots are retained. A corrupt autosave suppresses automatic replacement for that session. Existing manual slots require confirmation before overwrite/load; restart preserves manual saves. No accounts or backend. An interrupted active battle restores the previous stable snapshot; partial-turn loot cannot be duplicated.

## Engineering references inspected

Only documentation and applicable patterns were studied. No artwork, UI composition, game engine, approval or release claims were inherited.

| Repository | Inspected revision | Applicable observations |
| --- | --- | --- |
| `jaychtw/shape-match` | `8b8bee699f1dc66fb335d6584f98417929d652bb` | Typed bilingual resources, reduced motion, corrupt-storage handling, local Chromium testing, frozen install and separation of public verification |
| `jaychtw/animal-match` (Cute Animal Match) | `372016711574bf216b94b9a3eb1490fa824f0090` | Independent save namespaces, localized identity mapping, layer consistency and explicit acceptance status |
| `jaychtw/snacks-match-raohe` | `77c57fd72d04175ec1a3810752e2ff837764823d` | Static relative asset delivery, current-run QA evidence, locally synthesized audio and separate deployment authority |
| `jaychtw/squirrel-control` | `4ce1d4a5997ef300a57cc3cc3a0d5ba8816f8660` | Local Python playtest packaging, authored layered art, clear Gate A acceptance, phone evidence and explicit release limits |

Initial discovery of Cute Animal Match by its display-title slug failed; its actual `animal-match` identity was established from the other projects' immutable references, then inspected successfully. Git reads used the existing platform authentication. The GitHub API route was denied; no additional credentials were requested or required.

## Delivery and scope

`npm run build` produces a static local artifact with relative URLs. Browser tests mount that artifact at the project subpath. Packaging produces an independently hashable ZIP, not a publication. Source push, CI, Gate A acceptance and public release are separate actions. There is no Pages deployment workflow in this candidate.

Three-lantern campaign, bosses, full progression/economy, shops, all regions/dungeons, score, PWA installation and release QA remain outside Gate A. On 2026-10-25 (Asia/Taipei), the owner authorized pushing the Gate A candidate and its review artifacts to `main`. That source-publication authorization does not approve Gate B or public game deployment.
