"""Plot measured follow-up memory controls; optional Matplotlib 3.10.8 tooling."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

folder = Path(__file__).resolve().parents[1] / 'docs/evidence/gate-c-followup'
summary = json.loads((folder/'investigation-summary.json').read_text())
fig, axes = plt.subplots(1, 2, figsize=(11, 4.7), gridspec_kw={'width_ratios': [1.8, 1]})
names = {'scene-fixed': 'Nine scenes, fixed viewport', 'scene-resize': 'Nine scenes, resize control',
         'town-fixed': 'Town reload control', 'decode-only': 'Decode only; no game/canvas'}
for row in summary['memory']:
    values = [row['startMiB'], *row['pssMiBByCycle']]
    axes[0].plot([0, *range(9, 109, 9)], values, marker='o', markersize=3, linewidth=1.6, label=names[row['arm']])
axes[0].set(xlabel='Completed loads', ylabel='Whole-browser PSS (MiB)', ylim=(0, 1000), title='108-load controls (fresh browser per arm)')
axes[0].grid(alpha=.2)
axes[0].legend(fontsize=8, loc='lower right')
rows = summary['nativeCache']
values = [r['imageCacheBytes']/1048576 for r in rows]
axes[1].bar(['Initial town', '36 loads', 'Forced\npressure'], values, color=['#4587ad', '#d78c40', '#598f63'])
for i, value in enumerate(values):
    axes[1].text(i, value+8, f'{value:.2f}', ha='center', fontsize=10)
axes[1].set(ylabel='Cache allocator accounting (MiB)', ylim=(0, 600), title='Separate native-dump control')
axes[1].text(.5, .91, 'cc/image_memory\nNot PSS; shared aliases are not additive', transform=axes[1].transAxes, ha='center', fontsize=8)
axes[1].grid(axis='y', alpha=.2)
fig.suptitle('The Last Lantern — Chromium software-renderer memory investigation', fontsize=13)
fig.text(.5, .012, 'Checkpoint GC / live-object queries; pressure is diagnostic only. Native drift continues; physical-phone safety is unverified.', ha='center', fontsize=8)
fig.tight_layout(rect=(0, .04, 1, .94))
fig.savefig(folder/'memory-controls.png', dpi=160)
fig.savefig(folder/'memory-controls.svg')
plt.close(fig)

# Matplotlib emits optional spaces at SVG line ends; normalize only formatting.
p = folder/'memory-controls.svg'
p.write_text('\n'.join(line.rstrip() for line in p.read_text().splitlines())+'\n')
