| Scenario | FPS before → after | p95 ms | p99 ms | 1% low FPS | >50.5 ms intervals |
| --- | ---: | ---: | ---: | ---: | ---: |
| town-desktop | 34.0 → 32.4 | 33.4 → 33.4 | 50.0 → 50.0 | 19.5 → 17.5 | 1 → 3 |
| town-phone | 57.3 → 55.5 | 16.8 → 33.3 | 49.9 → 33.4 | 18.3 → 23.3 | 5 → 1 |
| overworld-desktop | 34.8 → 30.6 | 33.4 → 33.4 | 33.5 → 50.0 | 19.0 → 18.4 | 2 → 1 |
| overworld-phone | 59.4 → 59.0 | 16.8 → 16.8 | 16.8 → 33.3 | 30.0 → 26.4 | 1 → 1 |
| dungeon-desktop | 59.3 → 59.7 | 16.8 → 16.8 | 16.8 → 16.8 | 28.7 → 39.9 | 1 → 1 |
| dungeon-phone | 60.0 → 59.9 | 16.8 → 16.7 | 16.8 → 16.8 | 57.0 → 54.6 | 0 → 0 |
| combat-desktop | 58.4 → 58.4 | 16.8 → 16.8 | 33.4 → 33.4 | 23.6 → 23.1 | 3 → 3 |
| combat-phone | 59.4 → 59.6 | 16.7 → 16.8 | 16.8 → 16.8 | 30.0 → 37.6 | 1 → 1 |

Each row pools three twelve-second active samples. Desktop is 1440×1000/DPR 1; phone is 390×844/DPR 2 with the unchanged renderer cap of 1.5. These are cloud software Chromium results, not physical-device acceptance.

| Scenario | Main-thread task seconds before → after | Sampled peak V8 heap MiB before → after |
| --- | ---: | ---: |
| town-desktop | 36.37 → 36.39 | 2.97 → 3.01 |
| town-phone | 34.51 → 35.29 | 2.80 → 2.95 |
| overworld-desktop | 36.48 → 36.57 | 2.97 → 3.06 |
| overworld-phone | 31.55 → 31.96 | 2.85 → 2.92 |
| dungeon-desktop | 23.82 → 23.12 | 2.90 → 2.86 |
| dungeon-phone | 13.72 → 13.05 | 2.89 → 2.76 |
| combat-desktop | 23.06 → 14.69 | 2.65 → 2.58 |
| combat-phone | 13.86 → 9.33 | 2.71 → 2.70 |

Task time is summed over the three CDP counter windows, approximately 36 seconds per row; raw windows and per-run ranges are retained in [the comparison JSON](comparison-batched.json). V8 heap excludes native image/canvas/compositor resources.
