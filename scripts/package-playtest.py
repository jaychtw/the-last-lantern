"""Package a local review build; this does not publish or deploy anything."""
from pathlib import Path
import zipfile, hashlib, json

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
if not (dist / 'index.html').exists():
    raise SystemExit('Run npm run build first.')
out = root / 'playtest'
out.mkdir(exist_ok=True)
archive = out / 'the-last-lantern-gate-a.zip'
instructions = '''THE LAST LANTERN / 最後的引路燈 — Gate A review

This is a local playable art-and-interaction candidate, not an approved release.
Requires Python 3 and a recent browser with WebGL. No Node.js needed to play.

1. Extract the entire ZIP to a folder.
2. Open a terminal in that folder.
3. Run: python3 serve-playtest.py
   On Windows you may use: py serve-playtest.py
4. Open the computer address the helper prints.
   Do not open index.html directly; ES modules need a local HTTP server.
5. To use a phone on your trusted Wi-Fi, run with --lan and use your
   computer's LAN IP address. Stop the helper with Ctrl+C when finished.

請完整解壓縮 ZIP，在資料夾中執行 python3 serve-playtest.py
（Windows 可用 py serve-playtest.py），再開啟終端機顯示的網址。
使用 --lan 可讓同一個可信任 Wi-Fi 的手機連線。Ctrl+C 停止。

PLAY / 遊玩
WASD/arrows: walk. Enter/E/Space: interact while scene is focused.
Touch: four direction buttons and Interact; or use Explore to walk to a place.
Tap the visible world to walk there. Escape opens pause/settings.
探索可選擇地點並沿路前往；設定提供語言、動態效果、文字與存檔。

Speak with Mira, visit her cottage, find the supplies, and follow the eastern
road. Meet the Dewdrop Blob in the clearing, then relight the Meadow Lantern.
Combat: Attack, Ember (3 MP), Mend (4 MP), Tonic, Guard and Flee. When the
dewdrop gathers itself, Guard reduces damage. Defeat brings you safely home
at a 10% coin cost (rounded down), retaining discoveries.

Please review the original art, hero movement, dialogue/battle feedback,
desktop/touch usability, English/Traditional Chinese readability and comfort.
The current art is an authored layered-vector candidate. Whether it reaches
the GDD's Switch-era indie quality ambition is awaiting human review.

Gate B and public deployment require separate explicit approval.
Physical-phone performance, screen readers and first-time player balance
have not been verified in this cloud environment. Three manual save slots
and autosave stay in this browser; private mode may block persistence.
All assets and fonts are local; no account, backend, analytics or runtime
network services. First delivery/refresh still requires serving these files.
This candidate has no service worker/installable PWA yet.
'''
files = {'START-HERE.txt': instructions.encode(), 'serve-playtest.py': (root/'scripts/serve-playtest.py').read_bytes()}
for p in sorted(dist.rglob('*')):
    if p.is_file():
        files['game/'+p.relative_to(dist).as_posix()] = p.read_bytes()
notices=root/'docs/THIRD-PARTY-NOTICES.md'
if notices.exists(): files['THIRD-PARTY-NOTICES.md']=notices.read_bytes()
for p in (root/'docs/licenses').glob('*'):
    if p.is_file(): files['licenses/'+p.name]=p.read_bytes()
manifest={name:hashlib.sha256(data).hexdigest() for name,data in files.items()}
files['SHA256SUMS.txt']=''.join(f'{digest}  {name}\n' for name,digest in manifest.items()).encode()
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for name,data in files.items(): z.writestr(name,data)
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
(out/'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n')
(root/'docs/evidence/build-manifest.json').write_text(json.dumps({'archive':archive.name,'archive_sha256':digest,'files':manifest},indent=2)+'\n')
print(f'{archive} ({archive.stat().st_size} bytes)\nSHA-256: {digest}')
