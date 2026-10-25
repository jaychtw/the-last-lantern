# Editable source assets — revised Gate A

These original project assets were authored for this slice. `.blend` scenes contain the meshes, material nodes, cameras and lights used to prerender the runtime layers. `scripts/render-assets.py` is the canonical generator, including articulated walk/attack/cast pose construction; character identity is seeded consistently across directions/poses. Use Blender 4.3.2 and the commands in `docs/VISUAL-REVISION.md`. `.blend1` backups and raw PNG exports are not versioned.

| Source | Contents |
| --- | --- |
| `cottage.blend`, `cottage-copper.blend` | Original half-timbered buildings, geometry tiles/gables/shutters/planters/hardware, materials/lights |
| `rowan-idle.blend` | Rowan mesh/material hierarchy; pose/frame construction is in the generator |
| `mira.blend` | Silver-haired Mira with spectacles, plum dress/apron and original face |
| `tree.blend` | Trunk, branches, foliage geometry and material/light setup |
| `town-ground.blend`, `meadow-ground.blend`, `interior-ground.blend` | Ground/road/water/interior environment geometry and material sources |
| `battle-environment.blend` | Transparent near-field 3D clearing; distant ground fades to a separate matte |
| `battle-sky.png`, `battle-sky.provenance.json` | Original generated distant sky/valley production layer, generation prompt and hash; no foreground/characters/UI |

Other original props and animated frame exports are reproducible from the source generator. The runtime packer preserves raw-render hashes and frame anchors in `public/art3d/runtime.json`. Source rendering is an offline authoring task; players download only compressed WebP outputs and do not need Blender. The owner's concept collage is not included in these production assets or the runtime. Human visual acceptance is pending.

Gate B adds `enemy-*.blend`, `smith.blend`, `arch/pillar/crystal/fern/runes.blend`, `weapon/armour/ring/seed/seal/key.blend`, six named region ground scenes and four `battle-*.blend` environments. The original generator is reused through `render-campaign-assets.py`; `--only` supports targeted names/regions. Material families and original Rowan remain consistent. Action presentations use the same model, with articulated source construction/assembly posing; they are not an exported skeletal animation system.
