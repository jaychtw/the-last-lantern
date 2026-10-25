"""Encode genuine browser captures for review; no generated frames or speed edits."""
from pathlib import Path
from datetime import datetime
import hashlib, json, subprocess, math, shutil, re

root = Path(__file__).resolve().parents[1]
evidence = root / 'docs/evidence'
out = evidence / 'gate-c'
originals = Path('/tmp/lantern-gate-c-original-recordings')
originals.mkdir(exist_ok=True)

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration:stream=codec_name,width,height,r_frame_rate', '-of', 'json', str(path)]))

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def encode(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

sources = {}
records = []
for name in ['desktop-en', 'phone-zh-TW']:
    source = evidence / f'campaign-{name}.webm'
    if not source.exists():
        source = originals / source.name
    sources[name] = source
    target = evidence / f'campaign-{name}.mp4'
    original = probe(source)
    encode(['-threads', '2', '-i', str(source), '-an', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-pix_fmt', 'yuv420p', '-threads', '2', '-movflags', '+faststart', str(target)])
    final = probe(target)
    assert abs(float(final['format']['duration']) - float(original['format']['duration'])) < .1
    a, b = original['streams'][0], final['streams'][0]
    assert b['width'] == math.ceil(a['width']/2)*2 and b['height'] == math.ceil(a['height']/2)*2
    records.append({'original': source.name, 'originalSha256': digest(source), 'file': target.name, 'sha256': digest(target), 'bytes': target.stat().st_size, 'durationSeconds': float(final['format']['duration']), 'stream': b, 'transcode': 'H.264/yuv420p/CRF 28/fast; original duration retained. Even source dimensions retained; odd dimensions would be padded, never stretched.'})

summary = json.loads((out / 'browser-summary.json').read_text())
test = next(c for c in summary['checks'] if 'complete Gate B campaign with English desktop' in c['title'])
start = datetime.fromisoformat(test['startTime'].replace('Z', '+00:00')).timestamp()
duration = float(probe(sources['desktop-en'])['format']['duration'])
cuts = [[0, 12]]
for scene, length in [('forest', 12), ('cavern', 12), ('guardian', 15), ('ending', 12)]:
    event = (evidence / f'campaign-{scene}-desktop-en.png').stat().st_mtime - start
    begin = max(0, min(math.floor(event) - 3, duration - length))
    cuts.append([begin, begin+length])
filters = ['[0:v]split=5'+''.join(f'[v{i}]' for i in range(5))]
for i, (begin, end) in enumerate(cuts):
    filters.append(f'[v{i}]trim=start={begin}:end={end},setpts=PTS-STARTPTS[s{i}]')
filters.append(''.join(f'[s{i}]' for i in range(5))+'concat=n=5:v=1:a=0[out]')
short = out / 'gameplay.mp4'
encode(['-threads', '2', '-i', str(sources['desktop-en']), '-filter_complex_threads', '1', '-filter_complex', ';'.join(filters), '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-threads', '2', '-movflags', '+faststart', str(short)])
p = probe(short)
assert abs(float(p['format']['duration']) - 63) < .2
report = {'version': '0.4.0-gate-c', 'build': re.search(r'src="[^"]*/([^/"]+\.js)"', (root/'dist/index.html').read_text()).group(1), 'capture': 'Actual successful complete browser campaigns on the final runtime. Recordings are best-effort 25 FPS captures at reduced resolution, not quantitative performance or physical-device evidence.', 'audio': 'Silent: Playwright capture does not record the synthesized game audio.', 'recordings': records, 'excerpt': {'source': sources['desktop-en'].name, 'file': 'gate-c/gameplay.mp4', 'sha256': digest(short), 'bytes': short.stat().st_size, 'durationSeconds': float(p['format']['duration']), 'stream': p['streams'][0], 'cutsSeconds': cuts, 'editing': 'Five real-time excerpts selected around actual campaign capture events; no speed changes, interpolation, generated frames or substituted mockups.'}}
(out / 'recordings.json').write_text(json.dumps(report, indent=2)+'\n')
(evidence / 'recordings.json').write_text(json.dumps(report, indent=2)+'\n')
for source in sources.values():
    target = originals / source.name
    if source != target:
        shutil.move(str(source), str(target))
encode(['-ss', '45', '-i', str(short), '-frames:v', '1', '/tmp/lantern-gate-c-video-frame.png'])
print(json.dumps({'recordings': [{'file': v['file'], 'bytes': v['bytes'], 'duration': v['durationSeconds']} for v in records], 'excerpt': report['excerpt']}, indent=2))
