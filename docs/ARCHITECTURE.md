# Full-adventure architecture

Authority: unchanged GDD v1.0, UGDS v1.0.0 pinned to `d5c6696efdd6efc028118600466db44aecae0c9b`, the concept collage and [recorded Gate A approval](APPROVALS.md). Gate B builds the full bounded adventure. Gate C human gameplay acceptance and Gate D public release remain separate. No Match3 Core is used.

## Presentation and asset production

Original Blender-authored prerendered 3D remains the approved pipeline. `render-assets.py` supplies Rowan/Mira, town/introductory scenery, materials/lights and 64 eight-direction walk frames plus 19 battle poses. `render-campaign-assets.py` extends it with twelve new enemy models and matching action presentations, Arlen, region-specific architecture/vegetation/rune tablets/quest icons, six scene grounds and four matching battle environments. These are original meshes/materials, not copied game art or complete concept-image levels. Equipment changes combat values while the hero’s appearance stays fixed, as the GDD requires.

Saved `.blend` files and the generators are editable sources; raw PNGs stay ignored. The packer produces WebP textures, frame atlases, camera anchors and original export hashes. The distant sky/valley matte is an original separately documented production layer; it contributes only far distance behind independent geometry/actors in meadow/quarry battles. Ordinary builds use committed textures and need no Blender/image-generation service.

The native Canvas2D compositor draws independent depth-sorted scenery, animated Rowan frames and enemy action poses, camera following, occlusion, lantern light and battle feedback. Matching authored grounds/backdrops distinguish forest, cavern, quarry and tower. Shared actors/atlases are decoded once; a region preparation step loads its own ground/enemies/backdrop and releases application references to the previous region’s exclusive textures. Logical decoded-pixel counts are diagnostic estimates, not a physical RAM/heap measurement; browser HTTP/decoded caches remain browser-managed.

Transitions and save restoration await scene preparation behind a localized loading curtain, with input held until the new scene can be drawn. Touch/pointer destinations invert the exact affine ground projection used for actors. Region/collision geometry is authored separately from presentation. The following camera preserves legibility on phones. DOM game menus retain keyboard/focus and accessible interaction independent of canvas imagery.

Fixed camera, mostly baked light/shadows, finite pose frames, limited facial deformation and sampled-render grain remain limitations. This Blender build lacks OpenImageDenoise. Production-source rendering costs CPU time independently of browser frame time. The source pipeline alone does not certify that every campaign composition reaches the reference’s visual polish.

## Domain and content

- `src/content.ts`: bounded data catalogs: nine scenes, seventeen authored contact encounters using ten ordinary archetypes/three bosses, six spells, twenty gear/supply/quest entries, shop prices, scene spawns and centralized bilingual campaign strings.
- `src/domain.ts`: deterministic movement/collision/A*, road gates, inventory/equipment/economy, one-time discoveries/runes, quest flags, growth and learned magic, seeded combat, settlement identity, defeat/recovery, validated persistence and v1 migration.
- `src/main.ts`: keyboard/pointer/touch orchestration, localized DOM menus/dialogue/shop/equipment/runes/credits, finite battle presentation locks, loading transitions and safe-boundary saving. It does not delegate damage or rewards to rendering.
- `src/renderer.ts`: independent visual layers, asset preparation, frame/pose animation, scene transitions and read-only performance diagnostics. It cannot grant coins/XP or alter quest outcomes.
- `src/i18n.ts` / campaign resources: EN/zh-TW live switching; user-chosen names remain unchanged.
- `src/audio.ts`: original optional Web Audio cues and quiet procedural pentatonic ambience. No sample/CDN; muted by default, bounded voices/scheduler, menu/background pause and mute/volume.

Movement and visible contact use the same domain coordinates. Explore routes avoid other foes; deliberate encounter selection approaches that foe. Interaction destinations choose reachable points within range and outside other contact zones. This fixes the case where an exit’s nearest approach point landed inside a nearby respawned foe. Normal encounters respawn on reentry/rest, while one-time bosses and discoveries remain cleared.

## Battle and economy integrity

Battle snapshots contain actual hero stats/equipment, resources, enemy identity, RNG, encounter/settlement identity, speed, Ward/Focus and Guardian phase state. Speed determines action order; invalid commands do not spend RNG/resources/turns. Guard/heal, elemental multipliers, costs and enemy telegraphs are observable. Victory does not retaliate after a killing blow. A monotonic settlement identity prevents granting the same battle rewards twice; new ordinary respawns receive a new identity.

Level growth is deterministic. Main-route victories, discoveries and Mira’s travel lesson unlock late spells without requiring repeated encounters in the tested policy. Prices are fixed, supply stacks capped, equipped/quest items protected from sale, and no randomized gear rolls exist. Coins/XP are capped. The free hearth provides recovery even without coins. Finite-resource seeded policy checks demonstrate feasibility; they are not a first-time-player balance or fun certification.

## Saves and compatibility

Version 2 stores meaningful campaign state in `lantern-v2-auto` / three manual slots. Load validates schema, location, stats, known/owned gear and slot consistency, flags/keys, one-time discoveries, RNG and counts. It falls back to validated v1 data only when no v2 entry exists, and migrates without overwriting v1 bytes. Corrupt v2 data is reported instead of silently restoring an old journey. Corrupt bytes are preserved; blocked storage permits session play. Settings keep their independent namespace.

Active resolution is not saved. A reload restores the previous stable boundary without partially committed rewards. Scene restoration prepares textures before exposing movement, and old Gate A first-light progress is retained. No account, backend or telemetry is added.

## Engineering references retained

These earlier inspections inform engineering patterns, not visual identity or inherited acceptance:

| Repository | Inspected revision | Patterns |
| --- | --- | --- |
| `jaychtw/shape-match` | `8b8bee699f1dc66fb335d6584f98417929d652bb` | Typed localization, reduced motion, corruption recovery, static verification |
| `jaychtw/animal-match` | `372016711574bf216b94b9a3eb1490fa824f0090` | Save identities and explicit acceptance states |
| `jaychtw/snacks-match-raohe` | `77c57fd72d04175ec1a3810752e2ff837764823d` | Relative assets, current-run evidence, original local audio |
| `jaychtw/squirrel-control` | `4ce1d4a5997ef300a57cc3cc3a0d5ba8816f8660` | Local Python packaging, layered assets, approval distinct from deployment |

## Delivery boundary

Source/evidence/package publication to `main` follows the owner’s established review workflow. No Pages deployment workflow is added. Local tests, source push, CI, Gate C human acceptance, public deployment and live verification are separate. Stop at the complete review candidate for human gameplay/pacing/polish findings.
