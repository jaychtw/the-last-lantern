# The Last Lantern — 1.0.0 final release

- Production target: **https://jaychtw.github.io/the-last-lantern/**
- Version: **1.0.0**. Release commit and live status will be recorded after deployment.
- Owner acceptance: desktop and a physical phone personally tested; generally smooth, visually accepted and satisfactory. Unmeasured hardware/FPS/backend/native-memory characteristics remain unverified.
- Scope: frozen accepted game. No new feature, visual change, optimization, diagnostic expansion or nonessential refactor.

## Bounded critical-defect screen

**Critical screen passed: no unresolved critical defect identified; no critical fix required.** The final existing suites cover startup/playability, full progression/ending, crash/page errors, save/load and corruption recovery, essential desktop/touch controls and bilingual operation. Dependency audit reports zero known vulnerabilities; runtime assets are local, with no account, backend or telemetry. No game-code change was made.

Release JavaScript, styles, fonts and art are byte-identical to the accepted `be6b4bf` package. The only built-file difference is the HTML release-description metadata. [Build manifest](evidence/release-1.0.0/build-manifest.json).

## Final verification

| Existing check | Final result |
| --- | --- |
| Frozen install / strict build | Pass |
| Domain/statistics | **35 passed**, 0 failed |
| Browser | **25 passed**, 0 failed/skipped/flaky; both complete EN desktop / zh-TW touch campaigns, ending/credits, meaningful saved reload, failure/retry and storage recovery |
| Visual regression | **30 pairs passed** against the accepted runtime; original thresholds unchanged |
| Default diagnostics | Optional module/UI do not load on normal game URLs |
| Dependency audit | 0 known vulnerabilities |

[Verification summary](evidence/release-1.0.0/verification.json) · [browser results](evidence/release-1.0.0/browser-results.json) · [visual comparisons](evidence/release-1.0.0/visuals/visual-comparison.json). Existing game code/art/styles/saves remain unchanged. These are local automated results; human acceptance is the owner's separate desktop/physical-phone report.

## Known noncritical limitations

- Optional diagnostic JSON export issues and other reported minor observations are not fully investigated and are not fixed in this release. Diagnostics are disabled by default.
- Cloud software-rendering FPS and browser image-cache growth are documented historical limitations; no supported-device unusability or serious instability has been demonstrated. No new optimization campaign is required.
- Numerical FPS, device/backend specifications, native-memory budgets, detailed Safari/Firefox, screen-reader, audio and independent pacing/balance characteristics are not comprehensively measured. Owner desktop/phone experience acceptance is recorded separately.
- Saves remain browser/site-local. Existing local-play progress is not destroyed, but it does not automatically transfer to the new public origin.

## Deployment

A minimal conventional GitHub Pages workflow builds the verified candidate using Node 24.19.0 and the frozen lockfile, uploads `dist`, and deploys through the `github-pages` environment. No workflow previously existed. Documentation-only follow-up commits do not redeploy the game.

The environment granted network permission, but its **upstream proxy still rejects CONNECT to `api.github.com` and `jaychtw.github.io` with HTTP 403 before GitHub responds**. GitHub API, Actions status and public startup cannot currently be verified here. This is an access restriction, not an observed HTTP error from the game. [Exact access result](evidence/release-1.0.0/deployment-access.json).

The release/workflow push is the authorized deployment request. The release commit and push outcome are recorded after publication. No further development gate or owner diagnostics are required.

**Minimum owner action if this restriction persists:** open the repository's **Actions → Deploy game to GitHub Pages**, confirm/run the pushed workflow, then open the target URL and press Begin. If GitHub reports Pages has not been enabled, select **Settings → Pages → Source: GitHub Actions** and rerun that workflow. No game changes are needed.
