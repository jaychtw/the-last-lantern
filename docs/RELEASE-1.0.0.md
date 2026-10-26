# The Last Lantern — 1.0.0 final release

**Released:** [https://jaychtw.github.io/the-last-lantern/](https://jaychtw.github.io/the-last-lantern/)

- Version: **1.0.0**
- Release commit: [`463cc50`](https://github.com/jaychtw/the-last-lantern/commit/463cc507f29d33298dfb225e28072e49386ea5a5)
- Deployment and live checks: **[GitHub Actions — successful](https://github.com/jaychtw/the-last-lantern/actions/runs/40266335881)**
- Critical fixes: **None required. No unresolved critical defect identified.**
- Essential owner action: **None.** Project closed under the owner's frozen release scope.

The owner personally tested desktop and a physical phone, reporting generally smooth, visually accepted and satisfactory play. This is human acceptance evidence; unmeasured FPS, device/backend and native-memory characteristics remain unverified.

## Final verification

| Existing check | Final result |
| --- | --- |
| Frozen install / strict build | Pass |
| Domain/statistics | **35 passed**, 0 failed |
| Browser | **25 passed**, 0 failed/skipped/flaky; both complete EN desktop / zh-TW touch campaigns through ending/credits and meaningful saved reload, recovery and essential controls |
| Visual regression | **30 pairs passed** against the accepted runtime; original thresholds unchanged |
| Dependency audit | 0 known vulnerabilities |
| Public deployment | Successful Pages workflow at the release commit |
| Public game | All **89 published file hashes** match; browser startup, touch movement and Traditional Chinese pass with no page errors |
| Default diagnostics | Optional module and UI do not load on the normal public URL |

[Local verification](evidence/release-1.0.0/verification.json) · [browser results](evidence/release-1.0.0/browser-results.json) · [visual comparisons](evidence/release-1.0.0/visuals/visual-comparison.json) · [build manifest](evidence/release-1.0.0/build-manifest.json) · [deployment/live evidence](evidence/release-1.0.0/deployment.json).

One bounded critical screen covered startup/playability, essential progression/completion, crashes/page errors, save corruption/recovery, essential desktop/touch controls and genuine security/privacy concerns. No critical correction was needed. The accepted executable JavaScript, styles, fonts, artwork, rules, localization and save behavior are unchanged; only release version/HTML-description metadata and conventional Pages deployment/verification configuration were added. Pinned GDD/UGDS copies remain unchanged.

The local execution proxy still rejects the GitHub API and public Pages host. Deployment was confirmed through GitHub's accessible web interface, and **live verification ran on the Pages runner using the existing Playwright dependency**. The successful job contains a nonoptional public index/all-file hash check and actual browser interaction. This is CI/live evidence, not a claim that the blocked local machine reached the site or that CI is a physical phone.

## Known noncritical limitations

- Optional diagnostic JSON export issues and other reported minor observations remain uninvestigated/unfixed in this release. Diagnostics stay disabled by default.
- Cloud software-rendering FPS and browser image-cache growth remain historical technical limitations; no supported-device unusability or serious instability was demonstrated. No further optimization or owner diagnostics are required for release.
- Numerical device/FPS/backend/native-memory budgets, comprehensive Safari/Firefox, screen-reader, audio and independent pacing/balance characteristics are not comprehensively measured. They are not represented as measured passes.
- Saves remain browser/site-local. Local-play progress stays at its original local address and does not automatically transfer to the public origin.
- CI emitted nonblocking upstream action-runtime and runner-image migration notices; build, deployment and the public-start check succeeded.

No new feature, visual redesign, rendering change, diagnostic expansion, general optimization or nonessential game refactor was made. The release is complete; no additional development gate or enhancement roadmap is proposed.
