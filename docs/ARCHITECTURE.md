# Revised Gate A architecture

Authority: unchanged GDD v1.0 and UGDS v1.0.0 pinned to `d5c6696efdd6efc028118600466db44aecae0c9b`, plus the owner's [visual revision](VISUAL-REVISION.md). The first vector-art candidate was rejected. The new slice uses a new presentation pipeline while retaining the independent RPG rules and versioned saves. No Match3 Core is used.

## Offline original 3D, fixed-camera browser composition

`scripts/render-assets.py` authors actual Blender meshes, procedural materials, warm key/cool rim lighting, transparent shadow-catching ground, articulated Rowan/Mira poses, botanical enemy and terrain/architecture. Individual roof tiles, timbers, shutters, planters, brass hardware, folded cloak surfaces and sculpted hair are geometry. Saved `.blend` files are editable sources; no downloaded character/model pack or concept image is used.

Character identity comes from one procedural articulated model: the same face/hair/outfit/satchel/lantern in eight directions, eight walking poses each, portraits and battle. Battle exports include eight attack and eight cast poses, with guard, hurt and victory states. The renderer uses actual exported pose frames, smooth movement/camera interpolation and independent action feedback. NPC dialogue has consistent source-model portrait presentations. This is not a collection of unrelated generated character stills.

`scripts/pack-3d-assets.py` converts source renders to WebP and packs 64 walking frames into a 2048×2048 atlas; battle pose strips remain at or below 1536×768. The runtime manifest preserves camera-ground anchors and original PNG hashes. Generated runtime textures are committed; ordinary frozen-install builds do not rerender art. Blender 4.3.2 and Pillow 12.3.0 are optional authoring tools, absent from the player's runtime.

The browser renderer is a small native Canvas2D compositor (`src/renderer.ts`). It decodes local textures once, draws scenery in ground-depth order, animates articulated frame atlases and applies a following camera. It has no WebGL initialization requirement. Native standard Canvas2D is appropriate for this finite fixed-camera slice and avoids the prior software-WebGL bottleneck. PixiJS was removed; adding a larger 2D framework would not create better asset quality for this workload. Real-time 3D and illustrated-layer alternatives/tradeoffs are recorded in `VISUAL-REVISION.md`.

Ground coordinates use the same affine projection for rendered actor feet, camera following and inverse pointer destinations. Scenery anchors preserve the original map's collision landmarks. Destination walking stops in interaction range for NPCs/props, while visible enemy contact retains its actual contact trigger. Trees/buildings can occlude Rowan according to depth. Assets are separate, with static material lighting plus runtime foliage motion, motes, lantern ignition glow, slash/cast/counterattack effects and damage numbers.

A battle is presented as a fullscreen scene with an original distant sky/valley matte behind an independently rendered transparent 3D clearing, moving character/enemy and accessible DOM HP/MP/commands/logs. It uses the same source character as exploration, rendered from a suitable battle view. Dialogue occupies the lower portion of the game with a source-model character portrait. Exploration HUD is compact and overlays the playable scene rather than framing it as a webpage. Reduced motion freezes decorative animation/pose cycling and retains exact status feedback.

Important limits: fixed camera, primarily baked shadows, finite animation frames, no dynamic scene-wide 3D shadow response, limited facial deformation and possible sampled-render grain (this Blender build lacks OpenImageDenoise). Per-layer approximation is not equivalent to a freely navigable real-time 3D world. The visual target and physical-device comfort/performance remain for human acceptance.

## Independent mechanics and state

- `src/domain.ts`: unchanged deterministic RPG rules, authored scene geometry/places, bounded A* routes, collision, seeded combat RNG, costs/guard/telegraphs, victory rewards, defeat recovery, quest prerequisites and schema-validated persistence.
- `src/main.ts`: input/menu/state orchestration, bilingual DOM UI, safe-boundary autosave/manual save confirmations, presentation locks during finite turn animation. It does not let the renderer decide damage or rewards.
- `src/renderer.ts`: asset loading/projection/composition, animation, transitions, action light/effects, frame metrics. It cannot grant rewards, change HP or alter quests.
- `src/i18n.ts`: typed EN/zh-TW resources including dynamic battle logs. User-chosen names remain unchanged across language switches.
- `src/audio.ts`: original bounded Web Audio cues; no sampled track or external audio service. Muted by default, with visible equivalents for all consequential cues.

The original `lantern-v1-auto` and three manual slot namespaces remain. Stats, inventory, flags, location, RNG and meaningful progress persist independently of visual assets. Unreadable bytes stay intact; blocked storage permits session play. Active turn resolution is not saved; interruption restores the previous stable checkpoint without partially committed loot. No new backend, account or privacy model is introduced.

## Engineering references retained

The earlier inspection remains applicable for engineering patterns only, never visual identity, mechanics or inherited approval:

| Repository | Inspected revision | Patterns |
| --- | --- | --- |
| `jaychtw/shape-match` | `8b8bee699f1dc66fb335d6584f98417929d652bb` | Typed localization, reduced motion, corrupt-storage recovery, static verification boundaries |
| `jaychtw/animal-match` | `372016711574bf216b94b9a3eb1490fa824f0090` | Independent save identities and explicit acceptance status |
| `jaychtw/snacks-match-raohe` | `77c57fd72d04175ec1a3810752e2ff837764823d` | Relative static assets, current-run evidence, local synthesized audio |
| `jaychtw/squirrel-control` | `4ce1d4a5997ef300a57cc3cc3a0d5ba8816f8660` | Local Python review packaging, layered assets, human approval separate from deployment |

## Delivery boundary

Build/test results, source push, CI status, human visual acceptance, public deployment and live verification are separate. No Pages deployment workflow is added. The existing `main` review workflow carries source, screenshots, recordings and the tested local ZIP so the owner can review outside the cloud workspace. It does not authorize Gate B, full campaign production or public gameplay deployment.
