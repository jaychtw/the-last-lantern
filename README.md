# The Last Lantern / 最後的引路燈

An original single-hero fantasy RPG in English and Traditional Chinese. **Gate A visual direction approved; Gate B full-adventure candidate awaiting Gate C gameplay acceptance.** Public deployment remains gated.

[Download the Gate B playable ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-b.zip) · [Playtest instructions](playtest/README.md) · [Gameplay, QA and limits](docs/GATE-B-REVIEW.md) · [Approval record](docs/APPROVALS.md)

Extract the ZIP and run its Python 3 helper. No cloud workspace, Node/npm, Blender or account is needed to play. It serves only bundled files locally; `--lan` optionally supports a phone on trusted Wi-Fi. No public game deployment has been performed.

![Hearthmere, captured from the running game](docs/evidence/gameplay-1440-en.png)

[Forest](docs/evidence/campaign-forest-desktop-en.png) · [Cavern](docs/evidence/campaign-cavern-desktop-en.png) · [Equipment](docs/evidence/campaign-equipment-desktop-en.png) · [Guardian](docs/evidence/campaign-guardian-desktop-en.png) · [Gameplay recording](docs/evidence/gate-b-gameplay.mp4)

## The adventure

One courier, three Waylanterns. Explore Hearthmere, Meadow Path and its shrine, Whisperwood, Moss Cavern, Quarry Road, the Old Watchtower and the Lantern Crown. Calm three original guardians, discover why the roads were sealed, and restore the network without releasing the ancient blaze. The ending and credits save a clear flag; return home to Mira, keep exploring, or restart after confirmation.

The bounded campaign has nine scenes, three wilderness regions, two compact dungeons, ten ordinary enemy archetypes, three bosses, six spells, twenty item/equipment entries and levels 1–12. Equip a weapon, armour and an accessory; buy/sell spare gear, prepare supplies, read rune clues and unlock roads. The 2–4-hour first-play aspiration has not been established; human pacing and balance review remain open.

The approved original Blender/prerendered-3D pipeline supplies independent scenery, consistent Rowan poses, original new monsters and matching region battle environments. The native Canvas2D compositor loads one region’s exclusive textures at a time; the supplied concept collage contributes no runtime pixels. [Source/provenance](docs/ASSETS.md) · [Architecture](docs/ARCHITECTURE.md).

## Controls and preparation

- Desktop: WASD/arrows walk; E/Enter/Space interacts while the scene is focused; Escape pauses. Click terrain or use Explore to walk to a named place. Routes avoid other foes unless you deliberately choose an encounter.
- Touch: direction pad, Interact, Explore and game menus. Portrait/landscape layouts include safe-area spacing and a following camera. Compact landscape uses Journal for objectives; large-text battle menus can scroll on short screens. Portrait offers more artwork.
- Battle: Attack, Magic, Tonic, Guard, Starlight Flask and ordinary Flee. Fast foes act first. Guard the signaled heavy strike; Guard reduces damage 65% and restores up to 1 MP. Bosses cannot be fled.
- Ember and Mend start available; Ward unlocks at level 3, Gleam at 4, Focus at 5, Greater Mend at 7. Costs/effects, elemental multipliers, resources and logs are visible. Levels restore HP/MP.
- Buy gear at Arlen’s, then choose **Equip** in Equipment. The character’s outfit stays fixed while actual combat stats change. Quest items and equipped gear cannot be sold. Spare gear sales require confirmation.
- The inn costs 5 coins; Mira’s hearth always restores HP/MP for free. Defeat returns Rowan safely there at a disclosed 10% coin cost, retaining discoveries.
- Live EN/zh-TW switching, larger text, reduced motion, faster battles, mute/volume, three manual save slots and stable-boundary autosave. Original synthesized ambience/cues are muted by default.
- Version 2 saves preserve meaningful campaign state. Valid Gate A saves migrate without changing their original bytes; corrupt saves stay intact and blocked storage permits session play. No active-turn saves or backend/cloud accounts.

## Development

Use Node **24.19.0**, the existing checkout (normally `/workspace/the-last-lantern`) and the frozen lockfile:

```sh
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173 --strictPort
npm test
npm run build
npm run test:browser
```

Outside this cloud host, omit the cache override. Tests own preview port 4173 and exercise the actual `/the-last-lantern/` project subpath. They use system Chromium/FFmpeg if available; otherwise install matching tools with `npx playwright install chromium ffmpeg`. `CHROMIUM_PATH` selects another Chromium. Tests do not bypass verification.

Runtime assets are committed. Optional offline art tools are Blender **4.3.2** / CPU Cycles and Pillow **12.3.0**:

```sh
python3 -m pip install -r requirements-art.txt
npm run assets:campaign
```

`npm run assets` rebuilds both original and campaign assets. These are substantial CPU authoring operations, separate from normal builds/browser performance. Editable `.blend` sources and original geometry/material/pose scripts are committed; raw PNG exports stay in ignored `assets/renders/`. No online image service is required to rebuild/play the committed game.

`npm run package:playtest` creates a local Gate B review ZIP, without deploying. For performance, serve a production build and run `npm run measure` without rendering assets, recording video or running other browser checks. `LANTERN_MEASURE_URL` selects a different extracted-package URL.

## Acceptance and authority

[Unchanged GDD](docs/design/GDD-v1.0.txt) · [UGDS v1.0.0](docs/design/UGDS-v1.0.0.md), pinned to `jaychtw/game-development-standards@d5c6696efdd6efc028118600466db44aecae0c9b` · [Approved Gate A report](docs/GATE-A-REVIEW.md) · [Current Gate B report](docs/GATE-B-REVIEW.md) · [Third-party notices](docs/THIRD-PARTY-NOTICES.md)

Gate C asks for real human desktop/mobile gameplay, balance, pacing, readability, audio and polish review. Physical-device performance, Safari/Firefox, screen readers and independent first-time-player testing remain separate from cloud automation. Source push, tests, CI, human acceptance and public deployment are distinct. Gate D deployment requires explicit authorization.
