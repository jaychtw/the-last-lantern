"""Compare actual deterministic runtime captures; never edits game artwork."""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
import hashlib, json, math

root = Path(__file__).resolve().parents[1] / 'docs/evidence/gate-c'
samples = []
for after in sorted(root.glob('visual-after-*.png')):
    if after.stem.endswith('-full'):
        continue
    before = after.with_name(after.name.replace('visual-after-', 'visual-before-', 1))
    assert before.exists(), before
    a, b = Image.open(before).convert('RGB'), Image.open(after).convert('RGB')
    assert a.size == b.size, after.name
    delta = ImageChops.difference(a, b)
    stats = ImageStat.Stat(delta)
    mse = sum(value * value for value in stats.rms) / 3
    channels = delta.split()
    histogram = ImageChops.lighter(ImageChops.lighter(channels[0], channels[1]), channels[2]).histogram()
    pixels = a.width * a.height
    sample = {'before': before.name, 'after': after.name, 'size': a.size,
              'meanAbsoluteChannelError': sum(stats.mean) / 3,
              'psnrDb': 10 * math.log10(255 * 255 / mse) if mse else None,
              'identicalPixels': histogram[0], 'pixels': pixels,
              'over16LevelsPercent': sum(histogram[17:]) * 100 / pixels,
              'beforeSha256': hashlib.sha256(before.read_bytes()).hexdigest(),
              'afterSha256': hashlib.sha256(after.read_bytes()).hexdigest()}
    samples.append(sample)
assert len(samples) == 30, f'Expected 18 exploration + 12 battle pairs, got {len(samples)}'
report = {'method': 'RGB pixel comparison of identical runtime presentation fixtures/virtual time; null PSNR means zero MSE. Full UI screenshots are supporting views; no concept/mock images are compared.',
          'pairs': len(samples), 'samples': samples,
          'maxMeanAbsoluteChannelError': max(s['meanAbsoluteChannelError'] for s in samples),
          'maxOver16LevelsPercent': max(s['over16LevelsPercent'] for s in samples)}
(root / 'visual-comparison.json').write_text(json.dumps(report, indent=2) + '\n')
assert report['maxMeanAbsoluteChannelError'] <= .2, report
assert report['maxOver16LevelsPercent'] <= .05, report
print(json.dumps({key: value for key, value in report.items() if key != 'samples'}, indent=2))
