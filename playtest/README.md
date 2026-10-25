# Revised Gate A local playtest

[Download the playable ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-a.zip) — **3,980,067 bytes**. [Review report and reference comparison](../docs/GATE-A-REVIEW.md).

1. Extract the entire ZIP.
2. In that folder run `python3 serve-playtest.py` (Windows: `py serve-playtest.py`).
3. Open the printed local address. Use `--lan` and your computer's LAN IP for a phone on trusted Wi-Fi; stop with Ctrl+C.

No cloud workspace, Node/npm, Blender or account is needed. Recent Canvas2D/WebP-capable browser and Python 3 are required. Open through the helper, not directly through `index.html`. Bilingual `START-HERE.txt`, local fonts/licenses and per-file hashes are inside.

SHA-256:

```text
064f6e317e1088fd1da65cb80788bede6f7022fc3996dc956282de19f6b7a712
```

The exact extracted artifact passed all 46 per-file hashes; all 41 served game files matched over HTTP. Gameplay and accessibility checks are separately recorded in [packaged verification](../docs/evidence/playtest-verification.json). These are local checks, not public deployment or human visual approval.

This is the replacement Blender/prerendered-3D visual candidate. The previous vector-art candidate was rejected. Review the town, Mira dialogue, animated battle, desktop/touch comfort and EN/zh-TW against the supplied concept collage. The collage is not inserted in the game. Saves remain in your browser. Human visual approval, physical-device performance, Safari/Firefox and screen-reader verification remain pending. Gate B and public game deployment are not authorized.
