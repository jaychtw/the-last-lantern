# The Last Lantern

Read `docs/design/GDD-v1.0.txt` and the unmodified pinned `docs/design/UGDS-v1.0.0.md` before implementation. UGDS v1.0.0 is pinned to `jaychtw/game-development-standards@d5c6696efdd6efc028118600466db44aecae0c9b`.

Gate A art/interaction acceptance is pending. Work is limited to the first-lantern vertical slice until the owner explicitly approves the visual and interaction direction. Do not build Gate B regions/bosses/full progression or publicly deploy without the required authorization. Source publication is separate from creative acceptance and public deployment; do not infer push authorization from local tests.

Use the existing isolated checkout, normally `/workspace/the-last-lantern`; do not create a worktree unless requested. Node 24.19.0; frozen install: `npm ci --cache /workspace/.npm-cache` in this cloud environment. Runtime requires no secrets or backend. `npm run build`, `npm test`, and `npm run test:browser` are the verification commands. Browser tests own preview port 4173 and test a real project subpath. See README for host Chromium/FFmpeg and portable package instructions.

Consequential rules stay independent in `src/domain.ts`; this is a new RPG engine and must not use Match3 Core. All user-facing text belongs in typed EN/zh-TW resources. Keep one hero, original artwork, deterministic rewards/RNG, validated non-destructive persistence, keyboard/touch paths and reduced motion. Preserve supplied design documents and explicit approvals. Never report local checks as CI, deployment, physical-device, screen-reader, performance-target or human visual acceptance.

Regenerate original vector assets with `npm run assets`; the source script, individual assets and deterministic atlas form the production candidate. Both software fallback and Pixi WebGL use the same scene graph. Do not replace running layered art with concept images or silently describe this unapproved vector direction as having met the GDD quality target.
