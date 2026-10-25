# Gate C local review package

[Download the Gate C ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-c.zip) — **7,223,098 bytes**. [Performance, screenshots, verification and limits](../docs/GATE-C-REVIEW.md).

1. Extract the entire ZIP.
2. Run `python3 serve-playtest.py` in that folder (Windows: `py serve-playtest.py`).
3. Open the printed local address. For a phone on trusted Wi-Fi, use `--lan` and the computer's LAN IP; stop the helper with Ctrl+C.

No cloud workspace, Node/npm, Blender or account is needed. A recent Canvas2D/WebP browser and Python 3 suffice. Use the helper rather than opening `index.html` directly. Bilingual instructions, fonts/licenses and per-file hashes are inside.

SHA-256:

```text
a5c818100e24ecf369caff191cd52c36eb1f2ae01e450302df528cb878f137de
```

All **92** extracted file hashes match; all **87** game files also match over the actual Python helper’s HTTP interface. [Integrity report](../docs/evidence/artifact-integrity.json) · [packaged gameplay checks](../docs/evidence/playtest-verification.json).

The owner accepted Gate B's presentation as the minimum visual baseline. This candidate preserves its full single-hero campaign and adds conservative rendering/tooling improvements. **Production acceptance is pending. Desktop exploration remains below target in cloud software Chromium.** Physical-device performance, independent gameplay/audio review, Safari/Firefox and screen readers remain outstanding. No public deployment was performed.

Valid Gate A saves still migrate without overwriting their original bytes. The v2 campaign format, browser-local slots and autosave are unchanged. The [accepted Gate B package](https://github.com/jaychtw/the-last-lantern/raw/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/playtest/the-last-lantern-gate-b.zip) and [approved Gate A package](https://github.com/jaychtw/the-last-lantern/raw/aaea025337ae068fe42c5958e7a55ec858823303/playtest/the-last-lantern-gate-a.zip) remain historical references.
