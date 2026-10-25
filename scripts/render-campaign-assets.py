"""Gate B original mesh/material asset extensions. Reuses the approved Rowan pipeline.
blender -b -t 4 --python scripts/render-campaign-assets.py -- --samples 48
"""
import runpy,sys,math,json,hashlib,random
from pathlib import Path
import bpy
from mathutils import Vector
D=runpy.run_path(str(Path(__file__).with_name('render-assets.py')))
globals().update({k:D[k] for k in ['clean','setup','render','box','sphere','cylinder','between','curve','mesh','leaf','lantern','tree','ground','mat','M','scene','OUT','SOURCE','R']})
ROOT=Path(__file__).resolve().parents[1]
RNG=random.Random(81025)
M.update({'moss':mat('Velvet forest moss','#46763c',.9,texture=28),'cave':mat('Blue cavern basalt','#405464',.88,texture=25),'crystal':mat('Luminous mineral','#79dbcf',.24,.3),'ember':mat('Old ember light','#ffb54c',.35),'violet':mat('Moth velvet','#786398',.7),'guardian':mat('Guardian weathered blue armour','#40596b',.48,.4)})
for name in ['crystal','ember']:
    p=M[name].node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=p.inputs['Base Color'].default_value;p.inputs['Emission Strength'].default_value=.55

def eyes(x,y,z,s=1):
    for side in [-1,1]:
        sphere('Original expressive eye white',(x+side*.17*s,y,z),(.12*s,.055*s,.15*s),M['eye'])
        sphere('Original curious pupil',(x+side*.17*s,y-.052*s,z),(.065*s,.022*s,.095*s),M['pupil'])
        sphere('Eye glint',(x+(side*.17-.02)*s,y-.075*s,z+.045*s),(.022*s,.01*s,.025*s),M['eye'])
def limb(name,a,b,r,material):return between(name,a,b,r,material,r*.7)
def monster(kind,pose=0):
    created=set(bpy.data.objects);lean=.16*pose
    if kind=='hopper':
        sphere('Bramble hopper body',(0,0,.7),(.52,.37,.48),M['moss']);sphere('Hopper face',(0,-.3,.87),(.39,.2,.31),M['leafLight']);eyes(0,-.49,.96,.9)
        for side in [-1,1]:
            sphere('Folded spring leg',(side*.48,.08,.35),(.29,.35,.28),M['leaf']);limb('Leaping foot',(side*.5,0,.23),(side*.62,-.5,.1+lean),.12,M['leafLight'])
            curve('Bramble antenna',[(side*.18,0,1.05),(side*.3,-.03,1.45),(side*.45,-.1,1.5)],.035,M['wood']);sphere('Antenna berry',(side*.45,-.1,1.5),(.075,)*3,M['pink'])
        for i in range(5):leaf('Bramble crest',((i-2)*.15,.04,1),.5,(i-2)*.6)
    elif kind=='moth':
        sphere('Soft moss moth thorax',(0,0,.85),(.22,.23,.52),M['cream']);eyes(0,-.23,1.05,.85)
        for side in [-1,1]:
            for row in range(2):
                w=sphere('Velvet moth wing',(side*(.54+pose*.08),.03,.95-row*.48),(.58,.09,.4),M['violet'] if row==0 else M['leafLight']);w.rotation_euler.y=side*(.35+pose*.35)
                sphere('Wing eye pattern',(side*.67,-.07,1.0-row*.48),(.19,.015,.15),M['cream']);sphere('Wing pattern heart',(side*.67,-.09,1.0-row*.48),(.10,.012,.085),M['pink'])
            curve('Feathery antenna',[(side*.08,0,1.2),(side*.18,0,1.6),(side*.29,-.1,1.65)],.023,M['woodLight'])
    elif kind=='pebbleback':
        sphere('Pebbleback shell',(0,.08,.63),(.75,.62,.52),M['stone']);sphere('Friendly stone face',(0,-.59,.48),(.37,.32,.29),M['stone']);eyes(0,-.86,.55,.85)
        for side in [-1,1]:
            for y in [-.35,.42]:sphere('Broad rocky foot',(side*.6,y,.16),(.24,.28,.16),M['cave'])
        for i in range(9):
            a=i*2.4;sphere('Layered rounded shell stone',(math.sin(a)*.47,math.cos(a)*.36,.92+(i%3)*.05),(.22,.23,.14),M['stone'] if i%2 else M['cave'])
        for i in range(3):leaf('Shell moss leaf',((i-1)*.2,0,1.1),.32,i*1.9)
    elif kind in ['wisp','ashling']:
        material=M['crystal'] if kind=='wisp' else M['darkLeather'];sphere('Wandering flame body',(0,0,.85),(.46,.35,.55),material);eyes(0,-.34,.9,.9)
        for i in range(7):
            a=i*math.tau/7;sphere('Soft flame tuft',(math.cos(a)*.28,math.sin(a)*.2,.9+RNG.random()*.35),(.23,.2,.3),material)
        for side in [-1,1]:
            curve('Floating little arm',[(side*.36,0,.8),(side*.62,-lean,.67),(side*.65,-.2-lean,.8)],.07,material)
            sphere('Glowing flame horn',(side*.23,.02,1.35),(.12,.11,.29),M['ember'] if kind=='ashling' else M['glow'])
        lantern((0,0,.05),.35)
    elif kind in ['twig','thorn','root']:
        boss=kind!='twig';h=2 if boss else 1.3
        sphere('Ancient heartwood torso',(0,0,h*.6),(.4*h,.24*h,.48*h),M['wood']);sphere('Friendly bark face',(0,-.05,h*1.1),(.3*h,.25*h,.32*h),M['woodLight']);eyes(0,-.28*h,h*1.12,h*.72)
        for side in [-1,1]:
            limb('Rooted leg',(side*.2*h,0,h*.38),(side*.42*h,-.13,.08),.13*h,M['wood'])
            elbow=(side*.62*h,-lean,h*.67);hand=(side*.8*h,-.1-lean,h*(.55+pose*.18))
            limb('Living branch shoulder',(side*.3*h,0,h*.82),elbow,.14*h,M['wood']);limb('Living branch forearm',elbow,hand,.11*h,M['woodLight'])
            for j in range(3):limb('Rooted fingers',hand,(hand[0]+side*.12*h,hand[1]-.12,hand[2]+(j-1)*.1*h),.025*h,M['wood'])
            for j in range(3):
                a=(side*.14*h,0,h*1.3);b=(side*(.36+j*.12)*h,.05,h*(1.6+j*.12));limb('Branching antler',a,b,.035*h,M['wood'])
                leaf('Antler foliage',b,.4*h,side*j)
        for i in range(12 if boss else 6):
            a=i*2.4;leaf('Layered woodland mantle',(math.sin(a)*.4*h,math.cos(a)*.22*h,h*(.65+(i%3)*.16)),.45*h,a,M['moss'])
        if kind=='thorn':
            for i in range(8):sphere('Thornkeeper blossom',(math.sin(i)*.7,math.cos(i)*.38,2.3+i%2*.15),(.13,)*3,M['pink'])
        if kind=='root':lantern((0,-.55,1.2),.75)
    elif kind=='nibbler':
        sphere('Cave nibbler round body',(0,0,.55),(.5,.4,.46),M['violet']);sphere('Nibbler muzzle',(0,-.35,.53),(.3,.2,.17),M['cream']);eyes(0,-.37,.76,.9)
        for side in [-1,1]:
            o=sphere('Velvety bat ear',(side*.3,0,1.12),(.2,.1,.48),M['violet']);o.rotation_euler.y=side*.4
            sphere('Inner ear',(side*.3,-.095,1.16),(.12,.025,.32),M['pink'])
            for y in [-.2,.25]:sphere('Nibbler paw',(side*.36,y,.14),(.2,.22,.14),M['darkLeather'])
            cylinder('Little ivory fang',(side*.13,-.53,.47),.035,.15,M['eye'],12,r2=0)
    elif kind in ['hollow','guardian']:
        h=1.9 if kind=='guardian' else 1.3;armour=M['guardian'] if kind=='guardian' else M['cave']
        sphere('Weathered sentinel breastplate',(0,0,h*.7),(.32*h,.21*h,.4*h),armour);sphere('Empty sentinel helm',(0,0,h*1.2),(.3*h,.26*h,.32*h),armour)
        box('Kindly glowing visor',(0,-.245*h,h*1.2),(.38*h,.03,.07*h),M['glow'],.02)
        for side in [-1,1]:
            sphere('Shoulder pauldron',(side*.35*h,0,h*.9),(.19*h,.22*h,.17*h),M['brass'])
            limb('Sentinel arm',(side*.34*h,0,h*.9),(side*.5*h,-.12-lean,h*.54),.1*h,armour)
            limb('Sentinel leg',(side*.16*h,0,h*.43),(side*.2*h,-.02,.17),.12*h,armour)
            sphere('Sentinel boot',(side*.2*h,-.11,.12),(.16*h,.25*h,.14),M['darkLeather'])
        lantern((0,-.28*h,h*.7),.45*h)
        hand=Vector((.52*h,-.1-lean,h*.54));limb('Sentinel ceremonial blade',hand,hand+Vector((.13,-.05,-.6*h)),.045*h,M['steel'])
        # A crescent, leaf-shaped shield and lantern heart are original identity cues.
        sphere('Round protective ward',(-.56*h,-.12,h*.65),(.26*h,.075,.34*h),M['brass']);sphere('Shield blue inlay',(-.56*h,-.2,h*.65),(.19*h,.025,.26*h),M['blue'])
        if kind=='guardian':
            for i in range(5):box('Guardian crown vane',((i-2)*.13,0,h*1.49),(.09,.12,.35-abs(i-2)*.06),M['brass'])
    elif kind=='eye':
        sphere('Watchtower floating observatory',(0,0,.9),(.55,.35,.55),M['brass']);sphere('Observatory lens',(0,-.33,.9),(.37,.06,.37),M['crystal']);sphere('Lens pupil',(0,-.4,.9),(.15,.025,.21),M['pupil'])
        for side in [-1,1]:
            for j in range(4):box('Clockwork wing vane',(side*(.52+j*.12),0,.95+j*.08),(.14,.18,.44),M['steel'],.05)
        cylinder('Observatory crown',(0,0,1.5),.12,.25,M['brass'],12,r2=.03)
    root=bpy.data.objects.new('Original '+kind+' pose assembly',None);bpy.context.collection.objects.link(root)
    for o in set(bpy.data.objects)-created:
        if o!=root and o.parent is None:o.parent=root
    root.rotation_euler.z=-.35;root.rotation_euler.y=pose*-.12;return root

def stone_floor(kind):
    scene.render.resolution_x=1600;scene.render.resolution_y=1143;scene.camera.location=(0,-28,28);scene.camera.rotation_euler=(Vector((0,0,0))-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.ortho_scale=28
    material=M['cave'] if kind=='cavern' else M['stone'];box('Deep foundation',(0,0,-.22),(42,38,.4),material,0)
    for iy in range(17):
        for ix in range(24):
            x=-14+ix*1.2;y=-10+iy*1.2
            box('Individually worn stone paving',(x,y,-.03+RNG.uniform(-.015,.015)),(1.17,1.17,.12),material,.035)
    for i in range(25):
        x=-14+i*1.2
        for row in range(4):box('Rear masonry courses',(x+(row%2)*.6,6.1,row*.43), (1.17,.65,.4),material,.04)
    for side in [-1,1]:
        for iy in range(13):box('Low side masonry',(side*12.5,-8+iy*1.2,.26),(.55,1.18,.5),material,.04)
    if kind=='cavern':
        for i in range(20):
            x=RNG.choice([-1,1])*RNG.uniform(10,14);y=RNG.uniform(-9,7)
            cylinder('Angular cavern crystal',(x,y,.6),.22,1.3,M['crystal'],5,r2=0)
        scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22
    else:
        for i in range(10):
            x=-10+i*2.2;box('Tower brass floor inlay',(x,0,.05),(.06,17,.015),M['brass'],0)

def simple_prop(kind):
    if kind=='arch':
        for side in [-1,1]:
            for i in range(7):box('Ancient arch pier',(side*1.2,0,.2+i*.38),(.62,.8,.36),M['stone'])
        for i in range(9):
            a=i*math.pi/8;o=box('Arch voussoir',(math.cos(a)*1.2,0,2.4+math.sin(a)*1.2),(.46,.82,.5),M['stone']);o.rotation_euler.y=a-math.pi/2
        leaf('Growing arch ivy',(-1.2,-.42,1.2),.9,.2)
    elif kind=='pillar':
        cylinder('Pillar foot',(0,0,.15),.65,.3,M['stone'],12);cylinder('Carved stone pillar',(0,0,1.3),.4,2.2,M['stone'],12);cylinder('Pillar capital',(0,0,2.4),.62,.25,M['brass'],12);lantern((0,0,2.55),.65)
    elif kind=='crystal':
        for i in range(7):
            a=i*2.4;o=cylinder('Clustered cavern mineral',(math.sin(a)*.45,math.cos(a)*.35,.45+i%3*.15),.16,.9+i%3*.3,M['crystal'],5,r2=0);o.rotation_euler.y=math.sin(a)*.3
    elif kind=='fern':
        for i in range(13):leaf('Woodland fern frond',(0,0,.1),.9+(i%3)*.2,i*2.4,M['moss'])
    elif kind=='weapon':
        between('Bronze wayblade grip',(0,0,.2),(0,0,.65),.09,M['darkLeather']);box('Forged blade guard',(0,0,.65),(.65,.13,.13),M['brass']);between('Wayblade steel',(0,0,.7),(0,0,2),.105,M['steel'],0)
    elif kind=='armour':
        sphere('Leather armour body',(0,0,1),(.6,.3,.8),M['leather']);cylinder('Armour collar',(0,0,1.65),.28,.25,M['brass']);box('Armour belt',(0,-.25,.6),(1.2,.13,.12),M['darkLeather'])
    elif kind=='ring':
        bpy.ops.mesh.primitive_torus_add(major_radius=.55,minor_radius=.12,location=(0,0,.8),rotation=(math.pi/2,0,0));bpy.context.object.data.materials.append(M['brass']);sphere('Ring blue stone',(0,-.05,1.4),(.22,.17,.23),M['crystal'])
    elif kind=='runes':
        for i in range(3):
            x=(i-1)*.9;box('Rune stone pedestal',(x,0,.14),(.78,.7,.28),M['stone'],.08);box('Carved rune tablet',(x,0,.57),(.68,.3,.8),M['cave'],.12)
            z=.62
            if i==0:
                pts=[(x+math.cos(a)*.16,-.17,z+math.sin(a)*.16) for a in [j*math.tau/16 for j in range(17)]];curve('Sun rune engraved ring',pts,.018,M['glow'])
                for j in range(8):
                    a=j*math.tau/8;between('Sun rune ray',(x+math.cos(a)*.21,-.17,z+math.sin(a)*.21),(x+math.cos(a)*.27,-.17,z+math.sin(a)*.27),.016,M['brass'])
            elif i==1:
                curve('Leaf rune outline',[(x,-.17,z-.25),(x-.18,-.17,z),(x,-.17,z+.25),(x+.18,-.17,z),(x,-.17,z-.25)],.02,M['leafLight']);between('Leaf rune vein',(x,-.18,z-.2),(x,-.18,z+.2),.016,M['glow'])
            else:curve('Moon rune crescent',[(x+.13,-.17,z+.23),(x-.16,-.17,z+.13),(x-.18,-.17,z-.12),(x+.12,-.17,z-.23),(x-.025,-.17,z),(x+.13,-.17,z+.23)],.025,M['glow'])
    elif kind=='key':
        bpy.ops.mesh.primitive_torus_add(major_radius=.3,minor_radius=.075,location=(0,0,1.65),rotation=(math.pi/2,0,0));bpy.context.object.data.materials.append(M['brass']);between('Watchtower key stem',(0,0,.2),(0,0,1.4),.075,M['brass'])
        for z in [.25,.48,.7]:box('Key ward',(0.15,0,z),(.3,.16,.1),M['brass'])
    elif kind=='seed':
        sphere('Sunseed golden husk',(0,0,.9),(.4,.27,.58),M['brass']);leaf('Sunseed living leaf',(0,0,1.2),.65,.3,M['leafLight']);curve('Sunseed living vein',[(0,-.27,.4),(.12,-.28,.9),(0,-.25,1.3)],.025,M['glow'])
    elif kind=='seal':
        cylinder('Ancient moss seal',(0,0,.3),.58,.5,M['stone'],12);box('Moss seal gold rune',(0,-.5,.35),(.12,.08,.3),M['glow'])
        for i in range(7):leaf('Moss seal growing frond',(math.sin(i)*.3,math.cos(i)*.3,.5),.4,i*2.4,M['moss'])
    elif kind=='smith':
        D['character'](True)
        for o in list(bpy.data.objects):
            if 'spectacle' in o.name.lower():bpy.data.objects.remove(o,do_unlink=True)
            elif 'hair' in o.name.lower() or 'bun' in o.name.lower():
                if o.type=='MESH':o.data.materials.clear();o.data.materials.append(M['hair'])
            elif 'dress' in o.name.lower():o.data.materials.clear();o.data.materials.append(M['leather'])
        for i in range(6):sphere('Smith beard curl',((i-2.5)*.07,-.3,1.28+abs(i-2.5)*.025),(.09,.06,.14),M['hair'])
        between('Smith hammer shaft',(.5,-.25,1.5),(.5,-.25,1.9),.04,M['wood']);box('Smith hammer head',(.5,-.25,1.9),(.38,.14,.17),M['steel'])

ONLY=D['ONLY']
extra={}
for kind in ['hopper','moth','pebbleback','wisp','twig','nibbler','ashling','hollow','eye','thorn','root','guardian']:
    if 'all' not in ONLY and 'enemies' not in ONLY and kind not in ONLY:continue
    for pose in [0,1]:
        clean();span=6.6 if kind in ['thorn','root','guardian'] else 3.4;setup(512,span,(0,0,1.8 if span>4 else .8));monster(kind,pose);name='enemy-'+kind+('-attack' if pose else '');render(name,(0,0,0),not pose);extra[name]=span
for kind,span in [('arch',5),('pillar',4),('crystal',2.3),('fern',2.8),('weapon',2.7),('armour',2.6),('ring',2.3),('smith',2.8),('runes',3.5),('key',2.6),('seed',2.7),('seal',2.4)]:
    if 'all' not in ONLY and 'props' not in ONLY and kind not in ONLY:continue
    clean();setup(512,span,(0,0,1 if kind=='smith' else 1.2));simple_prop(kind);render(kind,(0,0,0),True);extra[kind]=span
for kind in ['shrine','forest','cavern','quarry','tower','sanctum']:
    if 'all' not in ONLY and kind+'-ground' not in ONLY:continue
    clean();setup(1600,28,(0,0,0),False)
    if kind in ['cavern','tower','sanctum']:stone_floor(kind)
    else:
        ground('meadow')
        if kind=='forest':
            scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
            for o in list(bpy.data.objects):
                if o.type=='LIGHT':o.data.color=(.7,1,.78)
        if kind=='quarry':
            for o in list(bpy.data.objects):
                if o.type=='MESH' and o.name.startswith('Continuous grassy'):o.data.materials.clear();o.data.materials.append(M['stone'])
            for i in range(20):sphere('Quarry rim boulder',(-12+i*1.2,6.2,.5),(.8,.7,.6+RNG.random()),M['stone'],16)
        if kind=='shrine':
            for i in range(12):box('Shrine perimeter foundation',(-7+i*1.2,6,.2),(1.1,1,.5),M['stone'])
    render(kind+'-ground',(0,0,0),True)
# Matching battle perspective: actors stay independent of the environment.
for kind in ['forest','cavern','quarry','tower']:
    if 'all' not in ONLY and 'battle-'+kind not in ONLY:continue
    clean();setup(1600,28,(0,0,0),False);scene.render.resolution_y=900;scene.camera.data.type='PERSP';scene.camera.data.lens=43;scene.camera.location=(8,-16,4.6);scene.camera.rotation_euler=(Vector((0,5,2))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    material=M['grass'] if kind=='forest' else M['cave'] if kind=='cavern' else M['stone'];box('Battle terrain',(0,0,-.17),(150,170,.3),material,0)
    back=mat('Distant '+kind+' ambience',{'forest':'#294d42','cavern':'#172e3a','quarry':'#86afc2','tower':'#233747'}[kind],1,texture=8)
    if kind=='quarry':scene.render.film_transparent=True
    else:box('Distant chamber or forest',(0,48,8),(120,.5,30),back,0)
    if kind=='forest':
        for j in range(9):
            before=set(bpy.data.objects);tree();assembly=bpy.data.objects.new('Tall layered forest canopy',None);bpy.context.collection.objects.link(assembly)
            for o in set(bpy.data.objects)-before:
                if o!=assembly and o.parent is None:o.parent=assembly
            assembly.location=(-24+j*6,29+(j%2)*5,0);assembly.scale=(3.5,)*3
        for i,(x,y) in enumerate([(-6,3),(7,5),(-10,10),(11,12),(-8,19),(2,25),(11,25)]):
            before=set(bpy.data.objects);tree();assembly=bpy.data.objects.new('Forest battle tree',None);bpy.context.collection.objects.link(assembly)
            for o in set(bpy.data.objects)-before:
                if o!=assembly and o.parent is None:o.parent=assembly
            assembly.location=(x,y,0)
        for i in range(35):
            a=i*2.4;x=math.sin(a)*RNG.uniform(5,14);y=RNG.uniform(-5,20);before=set(bpy.data.objects);simple_prop('fern')
            for o in set(bpy.data.objects)-before:o.location.x+=x;o.location.y+=y
    else:
        for side in [-1,1]:
            for j in range(5):
                x=side*(6+j*.8);y=2+j*5
                if kind=='quarry':sphere('Quarry battle escarpment',(x,y,1), (2.5,2,2+RNG.random()*2),M['stone'],16)
                else:
                    cylinder('Battle chamber column',(x,y,2),.7,4,M['cave'] if kind=='cavern' else M['stone'],12);lantern((x,y-1,2.5),1)
                if kind=='cavern':cylinder('Cavern battle crystal',(x-.8,y-.8,.8),.35,1.8,M['crystal'],5,r2=0)
        if kind=='tower':
            for row in range(9):
                for j in range(18):box('Distant tower masonry',(-18+j*2+(row%2),30,.7+row*1.4),(1.92,1,1.32),M['stone'],.08)
        if kind=='cavern':
            for j in range(18):
                cylinder('Cavern ceiling stalactite',(-18+j*2,15+(j%3)*6,5.5+(j%2)*.6),0,2.5+(j%3)*.4,M['cave'],8,r2=.55)
    render('battle-'+kind,(0,0,0),True)
span_file=ROOT/'assets/renders/campaign-spans.json';saved=json.loads(span_file.read_text()) if span_file.exists() else {};saved.update(extra);span_file.write_text(json.dumps(saved,indent=2)+'\n')
print('Campaign source assets complete',flush=True)
