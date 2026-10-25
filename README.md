# The Last Lantern / 最後的引路燈

An original single-hero 2.5D fantasy RPG. **Revised Gate A visual candidate — human acceptance pending.** The first-lantern slice now uses original Blender-authored 3D scenery and character animations, with English/Traditional Chinese and desktop/touch play. Full RPG production and public deployment remain gated.

## Review the revised Gate A

[Download the playable ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-a.zip) · [Watch captured gameplay](docs/evidence/gate-a-gameplay.mp4) · [QA, reference comparison and limits](docs/GATE-A-REVIEW.md)

Extract the ZIP, follow `START-HERE.txt`, and run its Python 3 helper. No cloud workspace, Node.js, npm, Blender installation or game account is needed to play. [Playtest instructions](playtest/README.md).

![Revised Hearthmere gameplay, captured from the running game](docs/evidence/gameplay-1440-en.png)

[Phone gameplay, zh-TW](docs/evidence/gameplay-390-zh-TW.png) · [Dialogue](docs/evidence/dialogue-1440-en.png) · [Battle](docs/evidence/battle-1440-en.png) · [Cottage interior](docs/evidence/interior-1440-en.png)

The supplied concept collage is the primary visual reference. It is not inserted into the game. The first flat-vector candidate was rejected; this revision replaces that pipeline. Whether the new candidate approaches the requested commercial indie quality bar still needs human review. [Visual brief and pipeline alternatives](docs/VISUAL-REVISION.md).

## Develop

Node **24.19.0** and npm. Use the existing isolated checkout at `/workspace/the-last-lantern`; no worktree is needed for ordinary cloud tasks.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173 --strictPort
npm test
npm run build
npm run test:browser
```

Outside this cloud machine, use your checkout directory and omit the cache override. Browser tests own preview port 4173 and mount the production build under `/the-last-lantern/`. They use the host's `/usr/bin/chromium` and `/usr/bin/ffmpeg` if present. Elsewhere install the matching tools with `npx playwright install chromium ffmpeg`; `CHROMIUM_PATH` overrides Chromium. Verification is never disabled.

The game uses native Canvas2D/WebP and locally bundled assets/fonts/audio; no WebGL, backend, credentials, analytics, remote font or image service is required. Three-dimensional assets are rendered offline rather than on the player's GPU. Committed runtime textures let `npm run build` work without Blender.

To reauthor artwork, use Blender **4.3.2**, Python and Pillow **12.3.0**:

```sh
python3 -m pip install -r requirements-art.txt
npm run assets
```

This CPU render operation is intentionally separate from ordinary builds. Source models are in `assets/source/`; raw exports are ignored under `assets/renders/`; runtime WebP atlases/material renders are in `public/art3d/`. See [asset provenance](docs/ASSETS.md) and [architecture](docs/ARCHITECTURE.md).

## Play

Speak with Mira, visit her cottage, read notes/rest, collect optional supplies, then follow the eastern road to Meadow Path. Calm the Dewdrop Blob and rekindle the lantern. Return to Mira or restart the chapter after confirmation.

- Desktop: WASD/arrows walk; Enter/E/Space interacts when the scene is focused; Escape pauses. Pointer clicks and Explore walk along collision-aware routes.
- Touch: visible direction pad, Interact, and named destinations in Explore. Fullscreen portrait and landscape layouts keep the scene and controls in the viewport; the camera follows Rowan.
- Battle: Attack, Ember (3 MP), Mend (4 MP), Tonic, Guard and Flee. A breath telegraphs the heavy splash; Guard reduces damage by 65%. Defeat costs 10% of coins (rounded down) and returns Rowan fully restored to the cottage.
- Language switches live. Settings provides larger text, reduced motion, faster battle feedback, sound/volume, three manual save slots and load. Audio is original synthesized cues, muted by default. Menus pause world movement; saving is disabled during turn resolution.
- Saves validate schema/version and meaningful state. Corrupt saves are preserved; blocked storage allows session play. Destructive overwrite/load/restart actions require confirmation.

## Local review package and measurement

`npm run package:playtest` bundles the static build and Python helper without deploying it. Extract the ZIP and run the helper; `--lan` is optional for a physical phone on trusted Wi-Fi. Only bundled game files are served. There is no installable service worker/PWA in this candidate.

For performance, run a production preview on port 4173 under `/the-last-lantern/`, then `npm run measure` without Blender rendering or another browser recording workload. `LANTERN_MEASURE_URL` can select the extracted package served by its helper. Physical-phone, hardware/browser compatibility, screen-reader and independent first-time-player verification remain separate from cloud automation.

## Authority

[Original GDD](docs/design/GDD-v1.0.txt) · [Unmodified UGDS v1.0.0](docs/design/UGDS-v1.0.0.md), pinned to `jaychtw/game-development-standards@d5c6696efdd6efc028118600466db44aecae0c9b` · [Revision brief](docs/VISUAL-REVISION.md) · [Third-party notices](docs/THIRD-PARTY-NOTICES.md)

There is exactly one controllable hero. No full campaign, extra party members, later bosses or public release is authorized. Source publication for review is distinct from visual approval, CI success and game deployment.
