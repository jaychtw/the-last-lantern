# Gate C follow-up local review package

[Download the ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-c.zip) — **7,236,017 bytes**, version `0.4.1-gate-c-followup`. [Investigation and verification](../docs/GATE-C-FOLLOWUP.md) · [desktop/phone diagnostic procedure](../docs/PHYSICAL-DEVICE-VALIDATION.md).

1. Stop any older helper, extract the entire new ZIP, then run `python3 serve-playtest.py` (Windows: `py serve-playtest.py`).
2. Open the printed local game URL. No Node, SDK, DevTools or extension is needed.
3. Save before changing URLs. Append `?diagnostics=1` to enable optional bilingual recording/export. Diagnostics stay disabled on the normal URL.
4. For a phone on trusted Wi-Fi, run with `--lan` and use the computer's LAN IP. Stop with Ctrl+C afterwards. See the included `DIAGNOSTICS.txt`.

SHA-256:

```text
bfe11367a2812b62911231d3c982fce5939dd33bfce37577f58774193351cb61
```

All **95** extracted hashes and **89** game files match over the actual helper's HTTP interface. [Integrity report](../docs/evidence/artifact-integrity.json).

The owner accepted `b763562` after smooth, visually satisfactory desktop play. That visual baseline is preserved. New controls do not reproduce a consistent 20% Gate C town regression; native dumps identify large reclaimable Chromium image-cache accounting with stable application resources. Quantitative desktop/phone performance and physical-phone memory safety remain unverified. **Not ready for final production acceptance; no public deployment.**

Valid saves remain compatible and browser-local. [Accepted Gate C ZIP](https://github.com/jaychtw/the-last-lantern/raw/b763562fe3b5a23e8d6705cc959310573ee05c77/playtest/the-last-lantern-gate-c.zip) · [Gate B reference](https://github.com/jaychtw/the-last-lantern/raw/c6ba55087e5277d2457ac2e2b82e6f5a56d6035d/playtest/the-last-lantern-gate-b.zip).
