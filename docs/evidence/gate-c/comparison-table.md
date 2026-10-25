| Scenario | FPS before → after | p95 ms | p99 ms | 1% low FPS | >50.5 ms intervals |
| --- | ---: | ---: | ---: | ---: | ---: |
| town-desktop | 38.0 → 30.4 | 33.4 → 50.0 | 33.4 → 50.1 | 22.1 → 19.4 | 0 → 1 |
| town-phone | 57.3 → 57.5 | 16.8 → 16.8 | 33.4 → 33.4 | 26.8 → 29.9 | 1 → 0 |
| overworld-desktop | 32.9 → 35.5 | 33.4 → 33.4 | 50.0 → 49.9 | 19.4 → 20.0 | 1 → 0 |
| overworld-phone | 58.6 → 58.9 | 16.8 → 16.8 | 33.3 → 33.3 | 30.0 → 28.1 | 0 → 1 |
| dungeon-desktop | 59.3 → 59.5 | 16.8 → 16.8 | 16.8 → 16.8 | 28.7 → 33.8 | 2 → 1 |
| dungeon-phone | 59.9 → 60.0 | 16.8 → 16.8 | 16.8 → 16.8 | 52.5 → 57.0 | 0 → 0 |
| combat-desktop | 54.9 → 58.2 | 33.3 → 16.8 | 50.1 → 33.4 | 11.3 → 21.7 | 19 → 4 |
| combat-phone | 59.0 → 59.4 | 16.8 → 16.8 | 33.3 → 16.8 | 24.4 → 29.3 | 2 → 0 |

Each row pools three twelve-second active samples. Desktop is 1440×1000/DPR 1; phone is 390×844/DPR 2 with the unchanged renderer cap of 1.5. These are cloud software Chromium results, not physical-device acceptance.

| Scenario | Main-thread task seconds before → after | Sampled peak V8 heap MiB before → after |
| --- | ---: | ---: |
| town-desktop | 36.26 → 36.54 | 2.93 → 3.06 |
| town-phone | 34.65 → 35.30 | 3.06 → 3.01 |
| overworld-desktop | 36.62 → 36.51 | 3.06 → 3.04 |
| overworld-phone | 33.76 → 33.48 | 2.99 → 3.00 |
| dungeon-desktop | 24.31 → 24.58 | 2.89 → 2.81 |
| dungeon-phone | 13.13 → 12.77 | 2.82 → 2.89 |
| combat-desktop | 25.48 → 14.94 | 2.63 → 2.69 |
| combat-phone | 14.08 → 9.51 | 2.72 → 2.70 |

Task time is summed over the three CDP counter windows, approximately 36 seconds per row; raw windows and per-run ranges are retained in [the comparison JSON](comparison.json). V8 heap excludes native image/canvas/compositor resources.
