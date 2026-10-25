# Third-party notices

The application bundles the following open-source libraries/fonts; no third-party game assets are included.

- PixiJS 8.14.3 — MIT; https://github.com/pixijs/pixijs. Its distributed license remains in `node_modules/pixi.js/LICENSE` after installation.
- Fraunces Variable 5.2.8 font package — SIL Open Font License 1.1; font by Undercase Type. https://github.com/undercasetype/Fraunces
- DM Sans Variable 5.2.8 font package — SIL Open Font License 1.1; Colophon Foundry and contributors. https://github.com/googlefonts/dm-fonts

Complete font license files are copied under `docs/licenses/` and included in the local playtest package. Build/test tools (Vite, TypeScript, Vitest, Playwright and axe) are development dependencies recorded in `package-lock.json`; they are not additional runtime web services. Browser tests use the host's installed Chromium and FFmpeg when available.

Game artwork and synthesized cues were authored specifically for this project; provenance is in `ASSETS.md`. No broader license for the game's original source or creative assets is asserted by these dependency notices.
