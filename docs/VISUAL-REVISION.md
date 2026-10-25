# Revised Gate A visual brief — 2026-10-25

The owner subsequently approved this direction. [Approval record](APPROVALS.md) authorizes Gate B; the pre-approval boundary below is historical. The same visual quality target remains in force.

The creative director rejected the first Gate A graphical quality and flat-vector direction. The concept collage attached in the revision request is the primary visual reference and quality target. It is a reference, not a reusable game asset sheet. The original GDD and pinned UGDS remain governing documents; this brief supersedes the earlier visual treatment.

Target: colorful polished Switch-generation fantasy RPG presentation. Prioritize dimensional architecture, expressive stylized characters, coherent proportions/silhouettes, vibrant material colors, atmospheric light/natural shadows, layered depth and restrained attractive game UI. Preserve one playable Rowan, classic solitary-hero exploration/progression, turn-based combat, dialogue/objectives, English/Traditional Chinese and desktop/mobile support. Do not add party members or alter mechanics to accommodate artwork.

The representative proof must run: a town with Rowan/buildings/vegetation/movement, an expressive NPC and dialogue, an original enemy and functioning turn-based battle, representative animation/transitions/lighting, and responsive desktop/mobile layouts. Prioritize those scenes over expanding content. No full campaign or public deployment is authorized. Human visual/interaction acceptance remains a separate gate.

The reference shows a brown-haired blue-cloaked courier, warm half-timbered towns with individual roof tiles/window boxes/cobbles, layered greenery, inviting character faces, sunny battle meadows, warm lantern illumination and dark translucent gold-trimmed UI. This revision uses those broad art-direction properties in original assets. It does not copy franchise monsters, maps, logos or the collage's individual images.

## Pipeline decision

The chosen approach is **original Blender-authored prerendered 3D with a fixed-camera 2.5D runtime**. The source generator and saved `.blend` models expose real meshes, individually layered roof tiles, timber/plaster/stone materials, botanical foliage, lighting, shadow-catching ground and articulated character poses. Character frames come from the same model/outfit/face; they are not unrelated generated portraits. Town geometry, actors and props remain separate depth-sorted assets in the game. Battle uses an additional original generated distant sky/valley matte behind a transparent Blender foreground; the matte contains no characters, foreground props or interface. Its prompt/hash are committed beside the source image. The owner's collage contributes no runtime pixels. Hero movement, collision, scene transitions, contact encounters, action resolution and feedback run normally.

| Alternative | Strength | Cost/constraint | Decision |
| --- | --- | --- | --- |
| Retain SVG/vector-art production | Small files, easy edits | The owner rejected this visual direction; more SVG detail would not solve its dimensional character/material gap | Replaced |
| Illustrated layered sprites | Can achieve rich surfaces and strong art direction | Consistent multi-direction motion, character proportions and matching lighting require a substantial illustration/animation pipeline | Viable later, not selected for this proof |
| Real-time Three.js/Godot 3D | Free camera, dynamic lights and mesh animation | More mobile GPU, shadow, draw-call and engine/export complexity; cloud software WebGL was already costly | Not selected without evidence of a visual/mobile advantage |
| Prerender original 3D assets | Consistent characters, ray-traced materials/lighting, inexpensive browser compositing, inspectable source | Fixed camera, baked shadows, finite exported animation frames; source rendering costs CPU time | Selected |

Canvas2D now composites the prerendered assets directly. The earlier Pixi/vector scene graph and its software-WebGL branch are removed from the active renderer. A small fixed-camera compositor is sufficient for this finite authored slice; deterministic rules and accessible DOM menus remain separate. This decision concerns runtime cost and maintainability, not a claim that a renderer alone establishes visual quality.

The pose exporter constructs articulated geometry procedurally; it does not yet provide a production skeletal armature or runtime blend tree. A visually changing equipment set multiplies export/atlas work across directions and actions. Before a large outfit catalogue or free camera, reassess a professional skeletal or real-time 3D pipeline after Gate A approval.

The reference's long perspective streets and sweeping vistas remain a human-review comparison point: a fixed-camera top-down slice has different composition constraints. The final report must identify actual gaps rather than silently lower the target. Static concept art, screenshots, generic placeholder geometry and unverified aesthetic claims cannot satisfy this gate.

## Rebuild the art

Tested source tools: Blender 4.3.2, CPU Cycles, Pillow 12.3.0. No Blender executable or Python package is needed to play the bundled static game. This host's Blender lacks OpenImageDenoise; denoising is disabled explicitly, not silently bypassed. Exports use sampled lighting; residual render grain is a limitation to inspect at target scale.

```sh
blender -b -t 4 --python scripts/render-assets.py -- --only all --samples 48
python3 scripts/pack-3d-assets.py
npm run build
```

`--only` supports targeted source refreshes so unchanged render outputs can be retained. Raw PNGs and camera anchors are saved under ignored `assets/renders/`; reusable source models are in `assets/source/`. The packer encodes local WebP textures and animation atlases to `public/art3d/`, preserving transparency and frame anchors. A bounded ground-shadow alpha matte removes the infinite shadow-catcher plane's rectangular low-opacity spill without recoloring the model. Committed runtime textures allow ordinary frozen-install builds without rerendering art. Rendering source assets is an offline authoring operation, distinct from browser frame time.

The runtime uses the same affine ground projection for sprite positions, touch/pointer destinations and camera following. Depth order changes as Rowan moves behind architecture/trees. Baked key/rim lighting is complemented by runtime motes, gentle foliage motion, lantern glow, action light/slash effects and damage feedback. Reduced motion freezes decorative movement and retains readable turn results.

## Validation and delivery

Retain domain-rule/save tests and rerun actual full EN/zh-TW browser playthroughs after replacing the renderer. Verify rendered layouts at 320/390/768/1440 px, desktop/touch controls, dialogue/interior/encounter/lantern transitions, recovery, meaningful persistence, keyboard focus, reduced motion and accessibility audits. Capture fresh screenshots and actual gameplay recording. Measure the new runtime separately from CPU asset rendering and video capture. Hardware/physical-device/screen-reader claims require their own evidence.

Publish the reviewable source/evidence/package through the established `main` review workflow. Source publication does not authorize public gameplay deployment or Gate B. Stop for creative-director acceptance after this revised proof.
