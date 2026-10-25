# Gate B full-adventure local playtest

[Download the Gate B ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-b.zip) — **7,222,768 bytes**. [Gameplay, QA and limits](../docs/GATE-B-REVIEW.md).

1. Extract the entire ZIP.
2. In that folder run `python3 serve-playtest.py` (Windows: `py serve-playtest.py`).
3. Open the local address printed by the helper. Use `--lan` and your computer’s LAN IP for a phone on trusted Wi-Fi; stop with Ctrl+C.

No cloud workspace, Node/npm, Blender or account is needed. A recent Canvas2D/WebP browser and Python 3 suffice. Open through the helper, not directly through `index.html`. Bilingual `START-HERE.txt`, bundled fonts/licenses and per-file hashes are inside.

SHA-256:

```text
056c2af3cd77229eed62343dfa7883af868015019ca5ba76a89812e32dc7390e
```

All **92** extracted file hashes match, and all **87** served game files matched over HTTP. See [integrity evidence](../docs/evidence/artifact-integrity.json) and [packaged gameplay checks](../docs/evidence/playtest-verification.json).

The owner approved the Gate A direction. This complete-adventure candidate adds three lights/bosses, equipment, leveling, spells, shops, dungeons, rune puzzles and a saved ending. It now awaits Gate C human gameplay, pacing, balance, audio and polish review. Public deployment remains unauthorized. Physical-device, Safari/Firefox and screen-reader checks remain outstanding.

Valid Gate A saves migrate without overwriting their original bytes. Saves stay in your browser; three manual slots and safe-boundary autosave are provided. The [approved Gate A ZIP](https://github.com/jaychtw/the-last-lantern/raw/aaea025337ae068fe42c5958e7a55ec858823303/playtest/the-last-lantern-gate-a.zip) remains available separately as historical review evidence.
