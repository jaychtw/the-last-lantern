# Third-party notices

The static game bundles these open-source fonts; no third-party game artwork or models are included.

- Fraunces Variable 5.2.8 — SIL Open Font License 1.1, Undercase Type. https://github.com/undercasetype/Fraunces
- DM Sans Variable 5.2.8 — SIL Open Font License 1.1, Colophon Foundry and contributors. https://github.com/googlefonts/dm-fonts

Complete font license files are in `docs/licenses/` and included in the local review ZIP. Chinese glyphs use the device's installed fonts. No font CDN is used.

Blender 4.3.2 (GPL) and Pillow 12.3.0 (HPND) are offline asset-authoring tools and are not shipped as game runtime code. Original `.blend` models, scripted geometry, procedural materials and rendered outputs are project assets, with provenance in `ASSETS.md`. This notice does not assign a new license to the game's original source or creative assets.

Vite, TypeScript, Vitest, Playwright and axe are development dependencies pinned in `package-lock.json`. The earlier PixiJS runtime is removed in this revision. No account, analytics service, backend or third-party game-engine asset pack is added.
