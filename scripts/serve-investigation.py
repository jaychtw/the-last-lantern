"""Serve immutable Gate B/C controls on one loopback origin (developer reproduction)."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse, tempfile, subprocess, zipfile, io, hashlib, json, shutil

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--port', type=int, default=8095)
args = p.parse_args()
root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='lantern-controls-') as folder:
    folder = Path(folder)
    references = []
    for tag, commit, expected in [
        ('b', 'c6ba55087e5277d2457ac2e2b82e6f5a56d6035d', '056c2af3cd77229eed62343dfa7883af868015019ca5ba76a89812e32dc7390e'),
        ('c', 'b763562fe3b5a23e8d6705cc959310573ee05c77', 'a5c818100e24ecf369caff191cd52c36eb1f2ae01e450302df528cb878f137de'),
    ]:
        archive = subprocess.check_output(['git', 'show', f'{commit}:playtest/the-last-lantern-gate-{tag}.zip'], cwd=root)
        assert hashlib.sha256(archive).hexdigest() == expected
        with zipfile.ZipFile(io.BytesIO(archive)) as z:
            for name in z.namelist():
                if name.startswith('game/') and not name.endswith('/'):
                    relative = Path(name).relative_to('game')
                    assert '..' not in relative.parts
                    target = folder / tag / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(z.read(name))
        references.append(dict(source=tag, commit=commit, archiveSha256=expected, bytes=len(archive)))
    shutil.copytree(folder/'c', folder/'replica')
    print(json.dumps(references, indent=2), flush=True)
    print(f'Immutable controls: http://127.0.0.1:{args.port}/b/ /c/ /replica/', flush=True)
    with ThreadingHTTPServer(('127.0.0.1', args.port), partial(SimpleHTTPRequestHandler, directory=str(folder))) as server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
