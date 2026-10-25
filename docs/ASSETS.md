# Original asset provenance and pipeline

All 29 game SVG files under `public/art/` are original assets authored for The Last Lantern in `scripts/create-assets.py`. They are created from geometric contours, gradients and a fixed deterministic decoration seed (7711). No third-party game imagery, logos, music, sprites, maps or characters, generative image service, external art pack or concept-background image was used. The supplied GDD provided only the written creative brief; prior projects informed engineering patterns only.

Authorship is AI-assisted source creation by Codex in this task; these are not claimed to be human-painted assets. The inspectable generator and individual shapes provide provenance and consistency evidence. No third-party game design identity or proprietary asset was traced or reproduced.

Run `npm run assets` to regenerate the exact files. The fixed hero uses dark chestnut hair, a teal coat/cape, warm orange scarf, leather boots/satchel and a small brass lantern. The same head/body/limb/outfit files are used for exploration and battle. Character consistency is enforced through asset reuse rather than separately generated poses. The original Dewdrop Blob has a leaf antenna, translucent botanical palette and a rounded droplet silhouette. There is no claim that all poses or expressions needed for full production exist yet.

The same generator packs 25 prop/character source assets into `atlas.svg` with `atlas.json` frame metadata (1024×976 pixels). The four full-scene terrain/water layers stay separate. Both rendering paths consume this atlas. Source SVGs also support DOM dialogue/battle illustrations. No screenshot or concept image is used as a playable scene.

Assets are intentionally separate: two terrain/path layers, a watercourse, an interior floor, three tree variations, shrub/flower clusters, cottage, bridge, closed/open chest, sign, beacon/flame, seven courier parts, Mira, Dewdrop Blob, rug, desk, hearth, stool and rocks. Mottling, highlights, leaf texture, window frames, roof shingles, wood grain and surface shadows are embedded in individual assets. World composition, character articulation, depth sorting, light movement and encounter state are performed in the actual engine. A screenshot alone is not the pipeline evidence; the script, individual files, running scenes and captured interactions are all available for review.

The UI uses locally bundled Fraunces and DM Sans under the SIL Open Font License. Traditional Chinese uses the device's installed Chinese system fonts; no font CDN or network fetch. Review Chinese glyph rendering on target physical devices. See third-party notices for dependency licenses.

Audio cues are original short sine/triangle oscillator envelopes in `src/audio.ts`; there is no sampled music. Sound is optional and muted by default; all consequential cues are also visible. Full ambience/music and richer battle posing are future production tasks subject to Gate A acceptance.

**Acceptance remains pending.** The current layered-vector style is a candidate for evaluation. It should not be described as having met the GDD's Switch-era indie quality bar. Human review should focus on silhouette/pose consistency, depth/lighting, composition, locomotion and attack feedback, and readability at actual gameplay size.
