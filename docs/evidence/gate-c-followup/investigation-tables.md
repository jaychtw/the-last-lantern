| Control | Source | Runs | FPS | p95 ms | p99 ms | 1% low | >50.5 ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| controls / traversal | b | 4 | 30.9 | 33.5 | 50.1 | 15.0 | 6 |
| controls / traversal | c | 4 | 32.1 | 33.4 | 50.1 | 14.3 | 13 |
| controls / traversal | replica | 4 | 33.2 | 33.4 | 50.0 | 20.0 | 0 |
| controls / animated-idle | b | 4 | 34.0 | 33.4 | 50.1 | 12.9 | 14 |
| controls / animated-idle | c | 4 | 34.3 | 33.4 | 50.0 | 15.0 | 10 |
| controls / animated-idle | replica | 4 | 37.0 | 33.4 | 33.4 | 24.5 | 0 |
| identical-url / traversal | c | 4 | 31.6 | 33.4 | 50.0 | 16.8 | 6 |
| identical-url / traversal | replica | 4 | 29.6 | 50.0 | 83.3 | 7.2 | 39 |
| long-window / traversal | c | 1 | 31.8 | 33.4 | 50.0 | 19.0 | 1 |
| long-window / traversal | replica | 1 | 32.9 | 33.4 | 50.1 | 13.2 | 14 |

| Memory control (108 loads) | Start MiB | 18 loads | 54 loads | 108 loads | 30 s idle | Diagnostic pressure | Images / canvases |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| scene-fixed | 418.1 | 836.4 | 856.2 | 884.8 | 874.1 | 371.2 | 42 / 1 |
| scene-resize | 423.6 | 845.6 | 861.9 | 887.9 | 878.8 | 377.5 | 42 / 1 |
| town-fixed | 417.6 | 420.7 | 413.6 | 407.5 | 401.6 | 290.2 | 39 / 1 |
| decode-only | 217.5 | 546.2 | 790.8 | 808.8 | 773.2 | 296.4 | 42 / 0 |

| Detailed native dump | cc/image_memory accounting MiB | Renderer malloc accounting MiB |
| --- | ---: | ---: |
| start | 110.38 | 24.12 |
| end | 509.00 | 33.63 |
| pressure | 17.25 | 25.26 |
