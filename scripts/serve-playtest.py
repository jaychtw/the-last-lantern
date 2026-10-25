"""Serve only the bundled game. Python 3 standard library; no installation needed."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import argparse

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--lan', action='store_true', help='Allow phones on the same trusted local network')
p.add_argument('--port', type=int, default=8090)
args = p.parse_args()
root = Path(__file__).resolve().parent / 'game'
if not (root / 'index.html').exists():
    raise SystemExit('Extract the whole playtest ZIP first. The game/ directory must be beside this script.')
server = ThreadingHTTPServer(('0.0.0.0' if args.lan else '127.0.0.1', args.port), partial(SimpleHTTPRequestHandler, directory=str(root)))
print(f'Play on this computer: http://127.0.0.1:{server.server_port}/', flush=True)
print(f'Optional diagnostics (save first): http://127.0.0.1:{server.server_port}/?diagnostics=1', flush=True)
if args.lan:
    print(f'On your phone, use http://<this-computer-LAN-IP>:{server.server_port}/ on the same Wi-Fi.', flush=True)
print('Press Ctrl+C to stop. Only the bundled game directory is served.', flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
