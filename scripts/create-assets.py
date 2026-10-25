"""Original game-ready vector assets. No downloaded/concept art or external runtime resources.
Rebuild deterministically: python3 scripts/create-assets.py. Shapes are separate assets,
not a screenshot background; character limbs are separate files for in-engine animation.
"""
from pathlib import Path
import random, json
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parents[1] / 'public' / 'art'
OUT.mkdir(parents=True, exist_ok=True)
R = random.Random(7711)
DEFS = '''<defs>
<linearGradient id="leaf" x2=".35" y2="1"><stop stop-color="#bed88d"/><stop offset=".5" stop-color="#6f9d68"/><stop offset="1" stop-color="#355b51"/></linearGradient>
<linearGradient id="roof" x2=".25" y2="1"><stop stop-color="#aab3bb"/><stop offset=".35" stop-color="#6c7c90"/><stop offset="1" stop-color="#3c4c64"/></linearGradient>
<linearGradient id="wall" x2=".9" y2=".6"><stop stop-color="#f4dfb2"/><stop offset="1" stop-color="#bca781"/></linearGradient>
<linearGradient id="wood" x2=".7" y2="1"><stop stop-color="#bf946a"/><stop offset="1" stop-color="#684735"/></linearGradient>
<linearGradient id="cloth" x2=".8" y2="1"><stop stop-color="#69b5a7"/><stop offset=".45" stop-color="#387c79"/><stop offset="1" stop-color="#204c54"/></linearGradient>
<radialGradient id="glow"><stop stop-color="#fff3b4" stop-opacity=".9"/><stop offset=".4" stop-color="#edbe6f" stop-opacity=".4"/><stop offset="1" stop-color="#edbe6f" stop-opacity="0"/></radialGradient>
<radialGradient id="blob" cx=".34" cy=".25"><stop stop-color="#e3f7cf"/><stop offset=".4" stop-color="#9eccad"/><stop offset=".85" stop-color="#55948e"/><stop offset="1" stop-color="#346978"/></radialGradient>
<linearGradient id="stone" x2=".7" y2="1"><stop stop-color="#c9d1b9"/><stop offset="1" stop-color="#6f8b7d"/></linearGradient>
</defs>'''

def svg(name,w,h,body):
    (OUT/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{DEFS}{body}</svg>')

def ellipse(x,y,rx,ry,color,extra=''):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{color}" {extra}/>'

def path(d,fill,stroke='',width=1,extra=''):
    return f'<path d="{d}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"' if stroke else '')+f' {extra}/>'

# Mottled, tiled terrain with stone-edged paths. Interactive objects remain separate.
for scene in ['town','meadow']:
    b='<rect width="1400" height="1000" fill="#789c72"/>'
    for i in range(160):
        x,y=R.randrange(1400),R.randrange(1000)
        b+=ellipse(x,y,R.randrange(15,150),R.randrange(8,75),R.choice(['#9bb783','#a6ba83','#597e69','#b4c88d']), 'opacity=".17"')
    for i in range(1900):
        x,y=R.randrange(1400),R.randrange(1000)
        b+=path(f'M{x} {y}l-3 -5m3 5l2 -7','none',R.choice(['#517958','#b5c48a','#89ab77']),1.2,'opacity=".45"')
    if scene=='town':
        roads=['M-80 640 Q300 670 540 600 T1470 570','M540 620 Q490 520 365 432','M650 600 Q650 470 660 380']
    else:
        roads=['M-100 600 Q300 690 540 570 T940 570 Q1130 540 1140 370']
    for d in roads:
        b+=path(d,'none','#557b62',105)+path(d,'none','#b9b78a',94)+path(d,'none','#d2c49b',82)
    for i in range(380):
        x,y=R.randrange(1400),R.randrange(1000)
        if (scene=='town' and abs(y-(630-x*.04))<32) or (scene=='meadow' and abs(y-(620-x*.07))<26):
            b+=ellipse(x,y,R.randrange(2,7),R.randrange(1,3),R.choice(['#a79b79','#e7d6ad','#b7ab85']), 'opacity=".65"')
    # Small watercourse lives on its own transparent layer, below bridge and actors.
    svg(scene+'-ground',1400,1000,b)

b=path('M1110 -100 Q950 80 1050 210 T1030 460 Q975 560 1060 760 T1020 1100','none','#507f75',92)
b+=path('M1110 -100 Q950 80 1050 210 T1030 460 Q975 560 1060 760 T1020 1100','none','#72b0ac',73)
for i in range(75):
    x,y=R.randrange(1010,1070),R.randrange(1000)
    b+=path(f'M{x} {y}q12 -3 24 0','none','#b1d3be',1.4,'opacity=".5"')
svg('stream',1400,1000,b)

# Individually painted tree crowns, bark, branch structure and leaf clusters.
for variant in range(3):
    b=ellipse(108,195,85,23,'#274b44','opacity=".23"')
    b+=path('M94 193 Q107 158 96 103 L119 101 Q109 155 126 195 L114 191 L106 201 Z','url(#wood)','#594b38',2)
    b+=path('M108 162L71 115M108 146L141 95','none','#735f41',8)
    b+=path('M104 184Q112 155 108 116','none','#d5b789',2)
    centers=[(69,91,46,43),(140,88,52,47),(104,54,57,43),(48,117,36,36),(162,119,35,32),(105,119,63,46)]
    for x,y,rx,ry in centers:
        b+=ellipse(x,y,rx,ry,'url(#leaf)')
    for i in range(105):
        x,y=R.randrange(25,186),R.randrange(23,150)
        if ((x-106)/87)**2+((y-90)/74)**2<1:
            b+=ellipse(x,y,R.randrange(3,12),R.randrange(2,6),R.choice(['#c5d792','#b3ca88','#91b77c','#547f60']), 'opacity=".45" transform="rotate(-25 '+str(x)+' '+str(y)+')"')
    b+=path('M52 87q20 -19 40 -14M112 35q20 0 31 15M140 105q18 -8 30 0','none','#d8e3a3',3,'opacity=".5"')
    svg('tree'+str(variant),215,220,b)

b=ellipse(67,63,60,18,'#385e50','opacity=".2"')
for x,y,s in [(24,43,23),(48,33,29),(81,39,30),(104,49,20)]:
    b+=ellipse(x,y,s,s*.7,'url(#leaf)')
for i in range(22):
    x,y=R.randrange(15,114),R.randrange(25,55)
    b+=ellipse(x,y,3,2,R.choice(['#c1d195','#b6c789','#ecd0a3']))
svg('bush',130,80,b)

b=''
for i in range(13):
    x,y=R.randrange(7,65),R.randrange(18,45)
    b+=path(f'M{x} 57Q{x+3} {y+5} {x-3} {y}','none','#5c8155',2)
    for dx,dy in [(-3,0),(3,0),(0,-3),(0,3)]:b+=ellipse(x+dx-3,y+dy,3,2,R.choice(['#f3dda4','#e6c4ae','#cedba4']))
    b+=ellipse(x-3,y,1.4,1.4,'#c48b56')
svg('flowers',72,64,b)

# Cottage: full separate building, detailed slate shingles, plaster, beams and lit windows.
b=ellipse(167,282,153,34,'#25443c','opacity=".22"')
b+=path('M49 145L178 91L286 147L277 270Q177 296 61 271Z','url(#wall)','#786e55',3)
b+=path('M178 91L286 147L277 270L182 284Z','#bca882')
b+=path('M56 265Q168 287 280 263L279 277Q166 302 57 278Z','#827b65')
for i in range(32):
    x=R.randrange(65,274);y=R.randrange(160,270)
    b+=path(f'M{x} {y}h{R.randrange(4,13)}','none','#95886c',1,'opacity=".3"')
b+=path('M42 151L174 50L300 147L284 166L176 91L52 170Z','url(#roof)','#3c4b59',4)
b+=path('M39 146Q100 127 174 50Q239 126 303 145L281 159Q223 141 177 94Q116 150 45 163Z','url(#roof)')
for row in range(6):
    yy=87+row*12;left=174-(row+1)*18;right=174+(row+1)*18
    b+=path(f'M{left} {yy+3}Q174 {yy+19} {right} {yy+3}','none','#b1b9c0',1.4,'opacity=".45"')
    for xx in range(int(left)+8,int(right),20):b+=path(f'M{xx} {yy}l-4 10','none','#36495b',1,'opacity=".5"')
b+=path('M224 102L223 49L245 45L248 118Z','url(#wood)','#665d51',2)
b+=path('M216 48L245 40L251 48L222 58Z','#cbbfa4','#726959',2)
b+=path('M142 279L140 213Q158 180 181 207L186 284Z','#493f35','#8a7254',6)
b+=path('M147 279L145 214Q160 194 177 212L180 282Z','url(#wood)')
for xx in [151,160,170]: b+=path(f'M{xx} 217l2 61','none','#78583e',1.6)
b+=ellipse(172,245,3,3,'#e4bb70')
for x in [86,226]:
    b+=path(f'M{x-20} 205L{x-20} 173Q{x} 151 {x+20} 173L{x+20} 205Z','#655b49','#d5b989',4)
    b+=path(f'M{x-14} 200V175Q{x} 161 {x+14} 175V200Z','#f4d197')
    b+=path(f'M{x} 167V202M{x-16} 186H{x+16}','none','#7b654c',3)
    b+=path(f'M{x-25} 208h50l-4 7h-43Z','url(#wood)')
    for j in range(7):b+=ellipse(x-17+j*6,207-R.randrange(0,6),4,3,R.choice(['#8d9c68','#e2bc9b','#f5d5a6']))
b+=path('M122 286Q158 278 195 288L199 299Q159 288 118 299Z','#c8bea1','#8d917a',2)
b+=path('M70 162L67 269M204 166L204 277','none','#6e6049',7)
svg('cottage',330,320,b)

# Footbridge: planks and posts line up with the navigable crossing.
b=ellipse(85,72,82,21,'#3e6e60','opacity=".2"')
b+=path('M5 25L151 18L168 81L15 88Z','#5e4e3c','#514b39',3)
for i in range(12):
    x=10+i*12
    b+=path(f'M{x} 26L{x+10} 25L{x+22} 80L{x+11} 81Z','url(#wood)','#5e4b36',1)
    b+=path(f'M{x+4} 35l8 35','none','#cba67b',1,'opacity=".5"')
for x,y in [(8,18),(145,12),(24,75),(164,68)]:
    b+=path(f'M{x} {y}v-30l7 -2v32Z','url(#wood)','#62513b',1)
svg('bridge',185,105,b)

for opened in [False,True]:
    b=ellipse(42,63,37,12,'#314f43','opacity=".25"')
    b+=path('M12 32L66 28L73 60L21 68Z','url(#wood)','#5b4435',3)
    b+=path('M20 32V63M59 30L65 62','none','#cbb77f',6)
    b+=path('M12 32Q12 10 36 9Q63 7 66 28Z' if not opened else 'M11 27L7 4Q37 -7 61 2L66 22Z','url(#wood)','#5b4435',3)
    b+=path('M20 27Q20 11 29 9M53 27Q53 12 49 9','none','#d5bd7e',5)
    b+=path('M36 29v15h9V29Z','#e4c780','#74603a',1)
    if opened:b+=ellipse(39,27,25,6,'#ffdb80','opacity=".7"')
    svg('chest-open' if opened else 'chest',85,80,b)

b=ellipse(50,114,37,11,'#315c49','opacity=".22"')
b+=path('M46 112L44 30L54 30L57 113Z','url(#wood)','#675944',2)
b+=path('M8 28L70 22L87 37L71 52L9 56Z','url(#wood)','#69533c',2)
b+=path('M18 36L63 32M20 46l29 -3','none','#dfc48d',2)
svg('sign',95,130,b)

# Waylantern masonry, separately animated flame overlay in renderer.
b=ellipse(90,169,80,22,'#345e51','opacity=".25"')
for x,y,w in [(25,143,130),(36,129,108),(47,114,86)]:b+=path(f'M{x} {y}q{w/2} -12 {w} 0v17q-{w/2} 15 -{w} 0Z','url(#stone)','#658575',2)
b+=path('M68 121L73 67L110 67L115 122Q91 134 68 121Z','url(#stone)','#638174',3)
b+=path('M64 73L61 25L91 11L120 26L117 73Z','#607c73','#d3cc9d',4)
b+=path('M71 65V30L91 20L110 31V65Z','#344c48')
b+=path('M62 25L91 4L121 26L91 21Z','#c6d1a6','#728773',2)
b+=path('M90 22V66M65 68L117 67','none','#c0b98e',3)
for x,y in [(46,146),(112,131),(69,111)]:b+=path(f'M{x} {y}q10 -12 16 0','none','#9bb28b',3)
svg('beacon',185,200,b)
svg('flame',80,100,ellipse(40,52,38,46,'url(#glow)')+path('M39 75Q12 64 33 40Q34 27 45 14Q43 40 56 47Q70 70 39 75Z','#efbb65')+path('M39 73Q27 57 43 43Q41 59 49 64Q47 73 39 73Z','#fff4bc'))

# Rig parts use matching coordinates/anchors and a fixed outfit in all poses.
svg('hero-cape',66,72,path('M17 6Q6 27 6 64Q31 77 59 62Q53 31 49 7Z','url(#cloth)','#234e53',2)+path('M19 16Q16 47 13 62M47 15Q45 44 52 62','none','#83c0ad',2,'opacity=".55"'))
svg('hero-body',60,58,path('M17 4L42 4L49 40Q32 51 11 40Z','url(#cloth)','#204d52',2)+path('M15 32L46 32L45 39L14 39Z','#76543c')+path('M33 33h9v7h-9Z','#dfbd7d')+path('M15 3Q31 11 43 3L46 14L23 21L14 11Z','#d89a62','#a86943',1)+path('M39 14L49 39L39 43L34 24Z','#b37b52')+path('M37 29L52 27L54 44Q44 51 36 44Z','url(#wood)','#594333',2)+path('M40 31L50 30L50 36L40 38Z','#c79c69'))
svg('hero-head',60,54,ellipse(31,28,19,21,'#dfb08c')+path('M12 29Q1 8 25 5Q49 -2 51 24L45 32L42 19L30 24L31 17L20 27L16 23L17 34Z','#554a3b','#403d34',1.5)+path('M17 12Q30 1 41 13','none','#8f7756',3)+ellipse(24,33,1.5,2,'#3a4540')+ellipse(38,33,1.5,2,'#3a4540')+path('M28 41q4 2 7 -1','none','#9a7057',1.4)+ellipse(18,37,3,1.5,'#d9957e')+ellipse(43,37,3,1.5,'#d9957e'))
svg('hero-leg',22,35,path('M4 0L18 0L16 22L20 27Q19 34 2 31L2 23Z','#4d5f58','#344a44',1.3)+path('M3 20L16 20L20 27Q20 34 1 31L1 26Z','#74543d','#4d4135',1.4)+path('M3 28L17 28','none','#b49262',1.5))
svg('hero-arm',25,46,path('M4 4Q12 -3 19 6L17 25L20 32Q14 41 8 33L5 24Z','url(#cloth)','#244f50',1.5)+path('M5 24L18 25L17 29L7 29Z','#d5ad72')+path('M8 30Q20 27 19 35Q19 43 11 39Z','#e1b38b'))
svg('hand-lantern',40,60,ellipse(20,32,20,27,'url(#glow)')+path('M14 18Q12 3 20 3Q29 4 26 18','none','#605640',3)+path('M9 19L30 19L33 43L7 43Z','#8d8056','#62563c',2)+path('M13 22H26L29 39H11Z','#ffe4a1')+path('M20 22V40M7 43H33','none','#b29a63',2))

# Lamplighter with distinct silhouette, apron, soft silver hair, and a walking staff.
b=ellipse(41,101,27,8,'#35534a','opacity=".22"')
b+=path('M24 82L24 103L36 103L39 85L46 103L60 101L56 78Z','#615744','#3d463d',2)
b+=path('M23 39Q42 26 59 41L63 83Q44 95 18 81Z','#ab7758','#6c5643',2)
b+=path('M29 40L49 39L57 82Q39 89 24 80Z','#c3b88f','#8a8564',1.5)
b+=path('M25 47L17 69L24 73M58 46L68 63L70 57','none','#a97657',9)
b+=path('M72 99L75 35Q72 26 67 34','none','#6a5940',4)
b+=ellipse(41,25,18,20,'#dfb991')
b+=path('M22 27Q12 3 40 4Q63 -1 60 28L51 20Q37 17 25 27Z','#c8cbbb','#62756a',2)
b+=path('M26 32Q40 51 55 31Q55 57 40 54Q27 49 26 32Z','#d7d7c1')
b+=ellipse(34,29,2,2,'#4e5950')+ellipse(47,29,2,2,'#4e5950')
svg('lamplighter',90,116,b)

# Original Dewdrop Blob: leaf antenna, pearly droplet body and botanical details.
b=ellipse(115,168,91,18,'#254b4f','opacity=".25"')
b+=path('M26 139Q12 98 48 66Q52 24 96 41Q141 22 174 73Q204 82 202 131Q209 174 117 176Q34 177 26 139Z','url(#blob)','#477e79',3)
b+=ellipse(68,82,29,18,'#ebf6d7','opacity=".4" transform="rotate(-28 68 82)"')
b+=path('M104 45Q101 11 127 6Q135 28 104 45Z','url(#leaf)','#527e5c',2)
b+=path('M105 42L123 12','none','#cadb9d',2)
b+=ellipse(81,118,6,10,'#2e585b')+ellipse(145,117,6,10,'#2e585b')
b+=ellipse(79,115,2,3,'#e9f4d7')+ellipse(143,114,2,3,'#e9f4d7')
b+=path('M102 137Q113 145 126 135','none','#396462',3)
b+=ellipse(64,132,12,5,'#dcbfa5','opacity=".6"')+ellipse(162,131,12,5,'#dcbfa5','opacity=".6"')
for x,y in [(44,120),(168,88),(155,155),(81,157)]:b+=ellipse(x,y,5,3,'#c5e5c2','opacity=".7"')
svg('blob',230,200,b)

# Floor boards, rug and cottage furniture are independent scene layers.
b='<rect width="1000" height="850" fill="#293b37"/>'
b+=path('M90 160H910V750H90Z','#856a4e','#4e4b3d',12)
for y in range(165,745,29):
    b+=path(f'M95 {y}H904','none','#514d3e',2)
    for x in range(100,900,115):
        xx=x+(y%3)*12
        b+=path(f'M{xx} {y}v28m8 -8h63','none','#a48b64',1,'opacity=".5"')
b+=path('M90 160V95H910V160Z','#a8946c','#5d5c47',5)
for x in range(110,911,125):b+=path(f'M{x} 98V155','none','#766346',8)
svg('interior-ground',1000,850,b)
svg('rug',310,220,path('M15 25L284 12L301 192L29 210Z','#a77155','#d6b486',7)+path('M35 43L267 31L279 174L47 189Z','none','#d9b283',3)+path('M75 120L155 57L237 112L164 175Z','none','#c6a57a',4)+path('M123 119L157 91L192 117L161 145Z','#657567'))
svg('desk',235,150,ellipse(120,122,110,23,'#1e302b','opacity=".3"')+path('M23 45L216 37L211 111L26 119Z','url(#wood)','#544934',4)+path('M30 53L32 135M201 47L205 127','none','#574932',10)+path('M14 17L217 9L229 60L23 72Z','url(#wood)','#66523b',3)+path('M50 27L96 25L98 53L52 55Z','#d4c28e','#8c7650',2)+path('M74 26V53M57 33h12m-11 7h12m10 -9h11m-10 8h11','none','#9c9066',1.5)+path('M127 23L163 21L168 44L132 46Z','#52726b','#42594c',3))
svg('hearth',200,195,ellipse(100,171,89,17,'#213b31','opacity=".2"')+path('M21 155V45H175V155Z','url(#stone)','#59695a',3)+path('M66 156V101Q98 57 133 100V156Z','#37463a','#778371',5)+path('M56 145L142 144L150 163L49 167Z','#bbab7c','#6f765c',2)+path('M12 37L184 34L188 55L10 59Z','url(#wood)','#63573e',3)+path('M83 139Q70 119 94 100Q93 119 107 112Q133 133 113 143Z','#e6ad62')+path('M92 140Q84 128 100 122L109 141Z','#ffe0a0'))
svg('stool',85,75,ellipse(43,62,36,9,'#233c33','opacity=".25"')+path('M20 31L15 66M62 30L70 63','none','#685438',8)+ellipse(43,29,36,17,'url(#wood)')+ellipse(43,23,34,13,'#ba9666')+path('M20 21q22 -8 44 0','none','#d0b383',2))
svg('rocks',110,75,ellipse(53,62,51,10,'#32594b','opacity=".2"')+path('M5 53L17 31L42 27L56 48L51 62L15 65Z','url(#stone)','#6d8b75',2)+path('M45 56L52 19L81 13L103 37L99 59L65 65Z','url(#stone)','#6d8b75',2)+path('M56 22L73 29L82 17M20 35L29 43L40 31','none','#d0d7b7',2))
# Deterministic texture atlas reduces texture switches/draw calls on mobile GPUs.
# Original individual SVG sources remain available for inspection and reauthoring.
frames={}; pieces=[]; x=y=2; row=0; atlas_width=1024
for p in sorted(OUT.glob('*.svg')):
    if p.stem.endswith('-ground') or p.stem in ['stream','atlas']:continue
    source=p.read_text(); doc=ET.fromstring(source)
    w,h=int(doc.attrib['width']),int(doc.attrib['height'])
    if x+w+2>atlas_width:x=2;y+=row+4;row=0
    frames[p.stem]={'x':x,'y':y,'w':w,'h':h}
    pieces.append(source.replace('<svg ',f'<svg x="{x}" y="{y}" ',1))
    x+=w+4;row=max(row,h)
atlas_height=y+row+2
if atlas_height>2048:raise RuntimeError('Atlas exceeds the minimum mobile texture budget')
(OUT/'atlas.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{atlas_width}" height="{atlas_height}">'+''.join(pieces)+'</svg>')
(OUT/'atlas.json').write_text(json.dumps(frames,indent=2)+'\n')
print(f'Wrote 29 original assets and a {atlas_width}×{atlas_height} runtime atlas to {OUT}')
