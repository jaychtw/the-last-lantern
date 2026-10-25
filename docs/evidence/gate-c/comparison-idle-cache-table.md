| Scenario | FPS before → after | p95 ms | p99 ms | 1% low FPS | >50.5 ms intervals |
| --- | ---: | ---: | ---: | ---: | ---: |
| town-desktop | 33.5 → 30.0 | 33.4 → 50.0 | 50.0 → 83.3 | 19.5 → 8.5 | 1 → 19 |
| town-phone | 53.3 → 58.1 | 33.3 → 16.8 | 50.0 → 33.4 | 12.0 → 29.9 | 11 → 0 |
| overworld-desktop | 30.0 → 31.4 | 33.5 → 50.0 | 83.3 → 116.6 | 8.1 → 6.7 | 17 → 28 |
| overworld-phone | 59.4 → 58.0 | 16.7 → 16.8 | 16.8 → 33.3 | 31.4 → 16.5 | 1 → 5 |
| dungeon-desktop | 57.3 → 59.8 | 16.8 → 16.7 | 33.4 → 16.8 | 15.0 → 42.4 | 6 → 1 |
| dungeon-phone | 59.8 → 59.9 | 16.8 → 16.7 | 16.8 → 16.8 | 43.8 → 52.5 | 1 → 0 |
| combat-desktop | 50.5 → 58.1 | 33.4 → 16.8 | 83.3 → 33.4 | 6.6 → 20.0 | 33 → 6 |
| combat-phone | 59.5 → 59.3 | 16.8 → 16.8 | 16.8 → 16.8 | 33.0 → 28.7 | 0 → 1 |

Each row pools three twelve-second active samples. Desktop is 1440×1000/DPR 1; phone is 390×844/DPR 2 with the unchanged renderer cap of 1.5. These are cloud software Chromium results, not physical-device acceptance.

| Scenario | Main-thread task seconds before → after | Sampled peak V8 heap MiB before → after |
| --- | ---: | ---: |
| town-desktop | 36.51 → 36.47 | 2.98 → 3.02 |
| town-phone | 35.64 → 35.27 | 2.98 → 2.80 |
| overworld-desktop | 36.80 → 36.81 | 3.04 → 3.08 |
| overworld-phone | 32.27 → 33.82 | 2.88 → 2.98 |
| dungeon-desktop | 24.60 → 22.62 | 2.83 → 2.84 |
| dungeon-phone | 13.15 → 12.74 | 2.89 → 2.91 |
| combat-desktop | 25.89 → 15.51 | 2.65 → 2.68 |
| combat-phone | 13.37 → 9.85 | 2.72 → 2.70 |

Task time is summed over the three CDP counter windows, approximately 36 seconds per row; raw windows and per-run ranges are retained in [the comparison JSON](comparison-idle-cache.json). V8 heap excludes native image/canvas/compositor resources.
