"""Original Blender production assets, revised Gate A. Blender 4.3+ / Cycles CPU.

blender -b -t 4 --python scripts/render-assets.py -- --only cottage,rowan
No concept image is used as scene geometry or a level background. All forms,
materials, lights and poses are inspectable original source below.
"""
import bpy, math, random, os, json, sys, argparse
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'renders'; OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'assets'/'source'; SOURCE.mkdir(parents=True,exist_ok=True)
args=argparse.ArgumentParser();args.add_argument('--only',default='all');args.add_argument('--samples',type=int,default=24)
opts=args.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
ONLY=opts.only.split(',');R=random.Random(74321); manifest={}

def color(h):
    h=h.lstrip('#')
    srgb=[int(h[i:i+2],16)/255 for i in [0,2,4]]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in srgb)+(1,)
def mat(name,c,rough=.55,metal=0,texture=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color(c);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if texture:
        n=m.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=texture;n.inputs['Detail'].default_value=3;n.inputs['Roughness'].default_value=.7
        ramp=m.node_tree.nodes.new('ShaderNodeValToRGB');base=color(c)
        ramp.color_ramp.elements[0].position=.15;ramp.color_ramp.elements[0].color=tuple(v*.58 for v in base[:3])+(1,)
        ramp.color_ramp.elements[1].position=.85;ramp.color_ramp.elements[1].color=tuple(min(1,v*1.15) for v in base[:3])+(1,)
        m.node_tree.links.new(n.outputs['Fac'],ramp.inputs[0]);m.node_tree.links.new(ramp.outputs[0],p.inputs['Base Color'])
        bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.15;bump.inputs['Distance'].default_value=.035
        m.node_tree.links.new(n.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs[0],p.inputs['Normal'])
    return m

M={
 'skin':mat('Rowan | warm skin','#efba86',.48), 'blush':mat('Warm cheek shading','#d88869',.7),
 'hair':mat('Chestnut hair','#4d2415',.42,texture=5), 'hairLight':mat('Chestnut highlights','#75432a',.5),
 'eye':mat('Eye whites','#fff3db',.25), 'iris':mat('Teal irises','#1a797e',.22), 'pupil':mat('Pupils','#10252e',.2),
 'blue':mat('Royal blue woven cloak','#164c99',.65,texture=60), 'blueLight':mat('Cloak fold highlights','#2873b9',.55),
 'leather':mat('Warm oiled leather','#774625',.5,texture=14), 'darkLeather':mat('Leather boots and glove seams','#3f291e',.5,texture=18),
 'linen':mat('Warm linen shirt','#e3d4a5',.8,texture=75), 'trouser':mat('Charcoal trousers','#3a4851',.8),
 'brass':mat('Brushed old brass','#b78a3d',.28,.65,texture=20), 'steel':mat('Forged silver blade','#b8c9ce',.26,.75),
 'wood':mat('Carved dark oak','#593522',.7,texture=9), 'woodLight':mat('Sun-warmed oak','#a97039',.7,texture=14),
 'plaster':mat('Hand-trowelled warm plaster','#f0d6a3',.9,texture=28), 'stone':mat('Weathered limestone','#aaac91',.88,texture=22),
 'slate':mat('Deep blue glazed roof slate','#234d72',.48,texture=18), 'slateLight':mat('Roof slate variation','#356d92',.55,texture=20),
 'terracotta':mat('Weathered copper clay tiles','#a95127',.6,texture=18),
 'leaf':mat('Sunlit foliage','#3c8139',.8,texture=9), 'leafLight':mat('New leaf greens','#76ae42',.8,texture=8),
 'leafDark':mat('Deep foliage','#23542c',.9,texture=11), 'grass':mat('Living meadow ground','#6d9a3c',.95,texture=95),
 'pink':mat('Pink garden flowers','#e16b94',.6), 'cream':mat('Cream garden flowers','#ffe7a3',.6),
 'purple':mat('Lavender flowers','#8c6fb5',.7), 'blob':mat('Dewdrop pearlescent skin','#55b7ad',.25,.15),
 'silver':mat('Mira silver hair','#b8b9a9',.65), 'apron':mat('Mira linen apron','#e7cda3',.8,texture=65),
 'mira':mat('Mira warm plum dress','#71495e',.8,texture=55), 'water':mat('Clear blue stream','#369dad',.22,.25,texture=16),
 'path':mat('Warm path cobbles','#b5ac92',.9,texture=26), 'shadow':mat('Shadow catcher','#c5c5b1',1)
}
M['glow']=mat('Warm lantern glass','#ffce63',.24)
M['darkGlass']=mat('Dormant blue lantern glass','#213645',.35,.2)
p=M['glow'].node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.45,.08,1);p.inputs['Emission Strength'].default_value=2

def smooth(o):
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
    return o
def mesh(name,verts,faces,m):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def box(name,loc,size,m,bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
    if bevel:
        mod=o.modifiers.new('Hand-softened edges','BEVEL');mod.width=bevel;mod.segments=2
        o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
    return o
def sphere(name,loc,scale,m,segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=16,radius=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m);return smooth(o)
def cylinder(name,loc,r,depth,m,vertices=16,r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(m);return smooth(o)
def between(name,a,b,r,m,r2=None):
    a,b=Vector(a),Vector(b);o=cylinder(name,(a+b)/2,r,(b-a).length,m,r2=r2);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def curve(name,pts,r,m):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=10;cu.bevel_depth=r;cu.bevel_resolution=3
    sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
    for b,co in zip(sp.bezier_points,pts):b.co=co;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def leaf(name,loc,size,rot=0,m=None):
    verts=[]
    for t in range(9):
        s=t/8;w=math.sin(s*math.pi)*size*.27
        verts.extend([(-w,s*size,math.sin(s*math.pi)*size*.13),(w,s*size,math.sin(s*math.pi)*size*.13)])
    o=mesh(name,verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(8)],m or M['leafLight']);o.location=loc;o.rotation_euler=(.4,0,rot)
    mod=o.modifiers.new('Leaf thickness','SOLIDIFY');mod.thickness=.008;return smooth(o)

scene=bpy.context.scene
def clean():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def setup(size=512,span=8,target=(0,0,1.5),transparent=True):
    scene.render.engine='CYCLES';scene.cycles.samples=opts.samples;scene.cycles.use_denoising=False
    scene.render.threads_mode='FIXED';scene.render.threads=4
    scene.render.resolution_x=size;scene.render.resolution_y=size;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=transparent
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.2
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.58,.76,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
    bpy.ops.object.camera_add(location=(7,-13,11));camera=bpy.context.object;camera.name='Production orthographic camera';camera.data.type='ORTHO';camera.data.ortho_scale=span
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
    bpy.ops.object.light_add(type='AREA',location=(-5,-8,12));light=bpy.context.object;light.name='Warm afternoon key';light.data.energy=1800;light.data.shape='DISK';light.data.size=5;light.data.color=(1,.83,.61)
    bpy.ops.object.light_add(type='AREA',location=(5,4,8));light=bpy.context.object;light.name='Cool sky rim';light.data.energy=1000;light.data.size=6;light.data.color=(.58,.75,1)
    if transparent:
        plane=box('Invisible ground shadow catcher',(0,0,-.045),(200,200,.05),M['shadow'],0);plane.is_shadow_catcher=True
    return camera
def render(name,anchor=(0,0,0),source=False):
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    ndc=world_to_camera_view(scene,scene.camera,Vector(anchor));manifest[name]={'file':name+'.png','w':scene.render.resolution_x,'h':scene.render.resolution_y,'anchor':[ndc.x,1-ndc.y]}
    saved=json.loads((OUT/'manifest.json').read_text()) if (OUT/'manifest.json').exists() else {};saved.update(manifest);(OUT/'manifest.json').write_text(json.dumps(saved,indent=2)+'\n')
    if source:bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(name+'.blend')),compress=True)

def lantern(loc,scale=1):
    root=bpy.data.objects.new('Lantern',None);bpy.context.collection.objects.link(root);root.location=loc
    def child(o):o.parent=root;return o
    child(box('Amber glass',(0,0,.18),(.23,.19,.32),M['glow'],.04))
    for x in [-.13,.13]:
        for y in [-.105,.105]:child(between('Brass lantern rib',(x,y,0),(x,y,.38),.018,M['brass']))
    child(box('Lantern base',(0,0,0),(.31,.26,.055),M['brass']))
    child(cylinder('Lantern cap',(0,0,.4),.21,.12,M['brass'],8,r2=.03))
    child(curve('Lantern handle',[(-.08,0,.45),(-.09,0,.59),(.09,0,.59),(.08,0,.45)],.015,M['brass']))
    root.scale=(scale,)*3;return root

def cottage(roof='slate',variant=0):
    width,depth=4.6,3.5
    box('Limestone footing',(0,0,.26),(4.9,3.8,.5),M['stone'],.1)
    for row in range(2):
        for i in range(11):box('Individual footing block',(-2.18+i*.43,-1.89,.15+row*.24),(.4,.12,.2),M['stone'],.03)
    box('Plaster house',(0,0,1.8),(width,depth,2.9),M['plaster'],.08)
    # Gables are actual solids with bevelled edges.
    me=mesh('Timbered gable',[(-2.3,-1.75,3.25),(2.3,-1.75,3.25),(0,-1.75,5.15),(-2.3,1.75,3.25),(2.3,1.75,3.25),(0,1.75,5.15)],[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)],M['plaster'])
    for x in [-2.3,2.3]:box('Corner timber',(x,-1.8,1.9),(.18,.2,3.2),M['wood'])
    for z in [.58,2.25,3.25]:box('Horizontal timber',(0,-1.82,z),(4.8,.18,.17),M['wood'])
    for x in [-1.12,1.13]:box('Half-timber stile',(x,-1.82,1.88),(.13,.18,2.6),M['wood'])
    between('Gable diagonal',(-2.4,-1.88,3.24),(0,-1.88,5.23),.12,M['wood']);between('Gable diagonal',(0,-1.88,5.23),(2.4,-1.88,3.24),.12,M['wood'])
    box('Gable kingpost',(0,-1.89,4.15),(.13,.2,1.85),M['wood'])
    # Hundreds of individually pitched overlapping slates, including rounded edges.
    slope=math.atan2(2,2.6)
    for side in [-1,1]:
        for row in range(9):
            x=side*(.13+row*.305);z=5.28-abs(x)*2/2.6
            for j in range(13):
                yy=-2.03+j*.34+(row%2)*.07
                o=box('Hand-laid roof tile',(x,yy,z+R.uniform(-.018,.018)),(.43,.375,.075),M['slateLight'] if roof=='slate' and R.random()<.32 else M[roof],.035);o.rotation_euler.y=side*slope
        box('Carved eave',(side*2.67,0,3.25),(.14,4.65,.19),M['wood'])
    for y in [-2.09,2.18]:
        between('Roof fascia',(-2.75,y,3.18),(0,y,5.39),.11,M['wood']);between('Roof fascia',(0,y,5.39),(2.75,y,3.18),.11,M['wood'])
    between('Ridge cap',(0,-2.22,5.39),(0,2.3,5.39),.12,M[roof])
    box('Chimney',(1.25,.5,4.8),(.64,.64,2.3),M['stone'])
    for z in [4,4.3,4.6,4.9,5.2,5.5,5.8]:box('Chimney mortar',(1.25,.5,z),(.66,.66,.025),M['plaster'],.01)
    box('Chimney cap',(1.25,.5,6.03),(.83,.8,.15),M['stone'])
    # Arched door with visible jambs, planks, metal hardware and masonry arch.
    box('Door recess',(0,-1.88,1.35),(1.04,.15,2.13),M['wood'],.1)
    for i in range(7):box('Door oak plank',(-.42+i*.14,-1.98,1.32),(.13,.12,2.05),M['woodLight'],.02)
    curve('Rounded door lintel',[(-.62,-2.02,2.2),(-.48,-2.02,2.6),(0,-2.02,2.76),(.48,-2.02,2.6),(.62,-2.02,2.2)],.13,M['wood'])
    for z in [.73,1.84]:box('Iron strap hinge',(-.23,-2.065,z),(.43,.03,.05),M['brass'],.01)
    sphere('Brass door knob',(.36,-2.09,1.35),(.065,.05,.065),M['brass'])
    for i in range(3):box('Worn doorstep',(0,-2.04-i*.19,.26-i*.08),(1.48+i*.13,.44,.16),M['stone'],.05)
    for x in [-1.65,1.65]:
        box('Window dark recess',(x,-1.86,1.63),(.85,.14,1.02),M['wood'])
        box('Window amber glass',(x,-1.96,1.63),(.68,.03,.84),M['glow'],.01)
        for xx in [x-.4,x,x+.4]:box('Window mullion',(xx,-2.01,1.63),(.06,.05,1.04),M['woodLight'],.01)
        for z in [1.12,1.63,2.14]:box('Window rail',(x,-2.02,z),(.85,.06,.06),M['woodLight'],.01)
        for side in [-1,1]:
            xx=x+side*.63
            box('Blue wooden shutter',(xx,-1.99,1.65),(.33,.09,1.04),M['blueLight'],.025)
            for z in [1.32,1.9]:box('Shutter brace',(xx,-2.06,z),(.35,.07,.055),M['wood'],.01)
        box('Flower window box',(x,-2.1,.95),(1.25,.42,.33),M['woodLight'],.05)
        for j in range(15):
            xx=x+R.uniform(-.52,.52);yy=R.uniform(-2.31,-2.02);zz=R.uniform(1.06,1.31)
            sphere('Window foliage',(xx,yy,zz),(.13,.12,.12),M['leaf'],12)
            if j%2==0:
                for a in range(5):sphere('Flower petal',(xx+math.cos(a*1.257)*.07,yy-.04,zz+.05+math.sin(a*1.257)*.07),(.05,.035,.05),M['pink'] if variant else M['cream'],12)
    # Side wall details and porch sign, water barrel, sacks and climbing vine.
    for y in [-1.7,0,1.7]:box('Side timber',(2.33,y,1.87),(.14,.16,2.8),M['wood'])
    for z in [.6,2.25,3.25]:box('Side timber',(2.33,0,z),(.15,3.6,.16),M['wood'])
    cylinder('Rain barrel',(2.8,-.9,.55),.43,1.1,M['woodLight'],24)
    for z in [.13,.48,.92]:
        bpy.ops.mesh.primitive_torus_add(major_radius=.43,minor_radius=.025,location=(2.8,-.9,z));bpy.context.object.data.materials.append(M['brass'])
    for i in range(9):
        t=i/8;leaf('Climbing ivy',(-2.5,-1.98,1+t*2),.34,t*1.9,M['leaf'])
    between('Lantern wall bracket',(.8,-1.8,2.45),(.8,-2.5,2.45),.04,M['wood'])
    lantern((.8,-2.46,1.87),.7)

def face(z=1.58,old=False):
    skin=M['skin']
    sphere('Sculpted head',(0,0,z),(.39,.33,.43),skin,48)
    sphere('Rounded jaw',(0,-.055,z-.2),(.29,.27,.24),skin)
    for side in [-1,1]:
        sphere('Ear',(side*.383,-.01,z-.02),(.075,.07,.12),skin)
        sphere('Inner ear',(side*.426,-.045,z-.02),(.018,.042,.07),M['blush'])
        x=side*.145
        sphere('Eye socket white',(x,-.293,z+.025),(.105,.045,.133),M['eye'],32)
        sphere('Teal iris',(x+side*.004,-.333,z+.028),(.066,.023,.093),M['iris'],32)
        sphere('Black pupil',(x,-.354,z+.03),(.036,.012,.061),M['pupil'])
        sphere('Eye catchlight',(x-.022,-.366,z+.07),(.022,.009,.025),M['eye'])
        curve('Upper eyelid',[(x-.095,-.32,z+.08),(x,-.35,z+.16),(x+.095,-.32,z+.08)],.015,M['hair'])
        curve('Expressive eyebrow',[(x-.09,-.293,z+.22),(x,-.32,z+.245),(x+.075,-.29,z+.22)],.023,M['silver'] if old else M['hair'])
        sphere('Soft blush',(side*.235,-.296,z-.13),(.065,.012,.027),M['blush'])
        if old:
            # Reading spectacles and fine smile lines give Mira an older identity.
            pts=[]
            for i in range(17):
                a=i*math.tau/16;pts.append((x+math.cos(a)*.123,-.365,z+.025+math.sin(a)*.145))
            curve('Mira brass spectacles',pts,.008,M['brass'])
            curve('Mira smile line',[(side*.26,-.28,z-.08),(side*.29,-.26,z-.15)],.004,M['woodLight'])
    sphere('Button nose',(0,-.344,z-.07),(.047,.06,.062),skin)
    if old:curve('Spectacle bridge',[(-.025,-.375,z+.05),(0,-.39,z+.07),(.025,-.375,z+.05)],.008,M['brass'])
    curve('Gentle smile',[(-.078,-.293,z-.23),(0,-.321,z-.249),(.084,-.29,z-.218)],.012,M['darkLeather'])
    if old:
        sphere('Silver hair cap',(0,.04,z+.22),(.42,.35,.3),M['silver'])
        for i in range(9):
            a=i*math.pi/8;x=math.cos(a)*.32
            sphere('Mira soft hair wave',(x,-.15,z+.3+math.sin(a)*.03),(.12,.19,.15),M['silver'])
        sphere('Silver bun',(0,.32,z+.2),(.22,.19,.2),M['silver'])
    else:
        sphere('Chestnut crown',(0,.045,z+.24),(.42,.35,.31),M['hair'],40)
        # Tapered curved sculpted locks, not a single spherical hair cap.
        for i in range(11):
            a=(i-5)*.18;xx=math.sin(a)*.36
            p0=(xx,.02,z+.48-R.random()*.04);p1=(xx+.07,-.29,z+.35);p2=(xx-.025,-.34,z+.17+R.random()*.11)
            lock=curve('Smooth swept tapered hair lock',[p0,p1,p2],.065,M['hairLight'] if i%4==0 else M['hair'])
            for pt,r in zip(lock.data.splines[0].bezier_points,[.8,1,.015]):pt.radius=r
        for side in [-1,1]:
            for j in range(3):
                o=sphere('Spiky side lock',(side*(.33+j*.025),.045+j*.1,z+.13-j*.06),(.12,.15,.2),M['hair']);o.rotation_euler.y=-side*.4
        for i in range(5):
            a=i*1.7;start=(math.sin(a)*.18,math.cos(a)*.17,z+.42)
            lock=curve('Adventurous crown flick',[start,(start[0]+.08,start[1]-.02,z+.55),(start[0]+.19,start[1]-.08,z+.57)],.065,M['hair'])
            for pt,r in zip(lock.data.splines[0].bezier_points,[1,.65,.01]):pt.radius=r

def character(old=False,phase=0,direction=0,pose='walk'):
    random_state=R.getstate();R.seed(119)
    created=set(bpy.data.objects)
    if old:
        cylinder('Mira dress',(0,0,.63),.35,1.2,M['mira'],32,r2=.22)
        box('Mira apron',(0,-.265,.68),(.43,.065,.82),M['apron'],.12)
        for side in [-1,1]:sphere('Mira soft boot',(side*.16,-.045,.1),(.15,.24,.13),M['darkLeather'])
        z=1.61
    else:
        for side in [-1,1]:
            hip=(side*.16,0,.85);swing=math.sin(phase)*side*.24 if pose=='walk' else 0
            knee=(side*.16,-swing,.48);ankle=(side*.16,swing,.19)
            between('Trouser upper leg',hip,knee,.12,M['trouser'],.1);between('Boot shaft',knee,ankle,.115,M['leather'],.13)
            sphere('Rounded leather boot',(side*.16,swing-.07,.12),(.145,.25,.12),M['darkLeather'])
            box('Boot cuff',(side*.16,swing*.3,.4),(.26,.23,.08),M['leather'],.035)
            box('Boot buckle',(side*.16,-.135+swing*.3,.4),(.11,.04,.07),M['brass'],.012)
        sphere('Leather tunic torso',(0,0,1.1),(.29,.19,.4),M['leather'])
        box('Tunic front seam',(0,-.188,1.13),(.025,.025,.45),M['woodLight'],.008)
        cylinder('Leather belt',(0,0,.9),.3,.09,M['darkLeather'],32)
        box('Brass belt buckle',(0,-.29,.9),(.12,.045,.09),M['brass'],.02)
        for side in [-1,1]:
            for z in [.99,1.17,1.33]:sphere('Tunic fastening',(side*.12,-.18,z),(.018,.014,.018),M['brass'],12)
        # Cloth cape has a curved surface, fold ridges and a scalloped moving hem.
        verts=[];faces=[]
        for row in range(11):
            t=row/10
            for col in range(13):
                u=(col/12-.5)*2;w=.29+t*.3
                verts.append((u*w,.15+t*.2+math.cos(u*math.pi*3)*t*.035,1.43-t*.73+math.cos(u*math.pi*3)*t*.025+math.sin(phase+u)*t*.025))
        for r in range(10):
            for c in range(12):
                i=r*13+c;faces.append((i,i+1,i+14,i+13))
        cape=mesh('Folded royal blue travelling cloak',verts,faces,M['blue']);smooth(cape)
        mod=cape.modifiers.new('Cloth thickness','SOLIDIFY');mod.thickness=.025
        mod=cape.modifiers.new('Supple cloth surface','SUBSURF');mod.levels=1
        for side in [-1,1]:
            curve('Cloak gold edge',[(side*.28,.15,1.43),(side*.43,.25,1.1),(side*.59,.35,.72)],.013,M['brass'])
        sphere('Blue folded collar',(0,0,1.43),(.32,.23,.11),M['blueLight'])
        sphere('Cloak clasp',(.17,-.2,1.45),(.047,.025,.047),M['brass'])
        z=1.86
        # Satchel strap and pouch provide a consistent asymmetrical courier silhouette.
        curve('Satchel shoulder strap',[(-.21,-.15,1.42),(0,-.22,1.13),(.26,-.15,.91)],.035,M['darkLeather'])
        box('Courier satchel',(.35,.035,.85),(.3,.2,.32),M['leather'],.065)
        box('Satchel clasp',(.35,-.08,.85),(.08,.025,.07),M['brass'],.01)
    # Animated arms parent-free for deterministic pose export.
    for side in [-1,1]:
        shoulder=(side*.29,0,1.35)
        swing=math.sin(phase)*side*.15 if pose=='walk' and not old else 0
        elbow=(side*.4,swing,1.08);hand=(side*.44,-swing, .86)
        if pose=='attack' and side==1:
            s=math.sin(phase);elbow=(.4+.14*s,-.16-.1*s,1.2+.15*s);hand=(.45+.12*s,-.65*s,1.0+.25*s)
        if pose=='cast' and side==-1:
            s=math.sin(phase*.5);elbow=(-.4-.08*s,-.16*s,1.08+.32*s);hand=(-.44-.01*s,-.44*s,.86+.82*s)
        if pose=='guard':elbow=(side*.35,-.22,1.19);hand=(side*.17,-.4,1.28)
        if old and side==-1:elbow=(-.44,-.1,1.3);hand=(-.48,-.22,1.5)
        between('Tunic sleeve',shoulder,elbow,.125,M['mira'] if old else M['linen'],.1)
        between('Forearm',elbow,hand,.085,M['skin'],.07)
        sphere('Curled hand',hand,(.09,.08,.105),M['skin'])
        if not old and side==1:
            h=Vector(hand)
            if pose=='attack':
                vec=Vector((.12,-.9*math.sin(phase),.65*math.cos(phase)));end=h+vec;tip=end+vec.normalized()*.2
            else:end=h+Vector((.12,-.02,-.65));tip=end+Vector((.02,0,-.17))
            between('Short blade',h,end,.034,M['steel'],.015);between('Blade point',end,tip,.03,M['steel'],0)
            between('Sword crossguard',h+Vector((-.14,0,0)),h+Vector((.14,0,0)),.027,M['brass'])
        if not old and side==-1:lantern((hand[0],hand[1],hand[2]-.45),.6)
    face(z,old)
    new=[o for o in bpy.data.objects if o not in created]
    root=bpy.data.objects.new('Mira rig' if old else 'Rowan rig',None);bpy.context.collection.objects.link(root)
    for o in new:
        if o.parent is None:o.parent=root
    root.rotation_euler.z=direction
    if pose=='hurt':root.rotation_euler.y=.13;root.location.y=.1
    if pose=='victory':root.rotation_euler.z=direction-.12
    R.setstate(random_state)
    return root

def tree():
    between('Gnarled trunk',(0,0,0),(0,.07,2.5),.24,M['wood'],.12)
    for i in range(7):
        a=i*2.4;between('Tree root',(0,0,.1),(math.cos(a)*.7,math.sin(a)*.65,.02),.12,M['wood'],.035)
    for i in range(10):
        a=i*2.4;p=(math.cos(a)*1.04,math.sin(a)*.85,2.3+R.random()*.8)
        between('Sculpted branch',(0,0,1.3),p,.09,M['wood'],.035)
        sphere('Deep canopy core',p,(.58,.5,.45),M['leafDark'],12)
    # Thousands of individually folded leaves replace the rejected round-ball canopy.
    verts=[];faces=[];mats=[]
    for i in range(2800):
        a=R.random()*math.tau;v=R.uniform(-.87,1);r=math.sqrt(1-v*v)*R.uniform(1.48,1.72)
        x,y=math.cos(a)*r,math.sin(a)*r*.82;z=2.95+v*1.0+R.uniform(-.07,.07)
        length=R.uniform(.11,.24);width=length*.36;ang=R.random()*math.tau;k=len(verts)
        normal=Vector((x*.5,y*.5,(z-2.9)*1.7)).normalized();tangent=normal.cross(Vector((.1,.1,1))).normalized();side=normal.cross(tangent).normalized();center=Vector((x,y,z))
        verts.extend([tuple(center-tangent*length*.5),tuple(center+side*width),tuple(center+tangent*length*.5),tuple(center-side*width),tuple(center+normal*.035)])
        faces.extend([(k,k+1,k+4),(k+1,k+2,k+4),(k+2,k+3,k+4),(k+3,k,k+4)]);mats.extend([R.randrange(3)]*4)
    canopy=mesh('Individually folded canopy leaves',verts,faces,M['leaf']);canopy.data.materials.append(M['leafLight']);canopy.data.materials.append(M['leafDark'])
    for polygon,index in zip(canopy.data.polygons,mats):polygon.material_index=index

def shrub(flower=False):
    for i in range(24):
        x,y=R.uniform(-.8,.8),R.uniform(-.45,.45);z=R.uniform(.15,.5)
        if x*x+y*y<.7:
            sphere('Garden foliage',(x,y,z),(.18,.16,.19),M['leafLight' if i%3==0 else 'leaf'],12)
            if flower and i%2==0:
                for j in range(5):
                    a=j*math.tau/5;sphere('Flower petal',(x+math.cos(a)*.07,y+math.sin(a)*.07,z+.16),(.07,.065,.04),M['pink'] if i%4 else M['cream'],12)
                sphere('Flower center',(x,y,z+.18),(.04,.04,.035),M['brass'],12)

def chest(opened=False):
    box('Supply chest body',(0,0,.34),(1.05,.72,.62),M['woodLight'],.07)
    for x in [-.4,.4]:box('Chest metal band',(x,0,.38),(.09,.75,.72),M['brass'],.02)
    lid=box('Carved rounded chest lid',(0,.05,.81 if opened else .69),(1.1,.78,.24),M['wood'],.11)
    if opened:lid.rotation_euler.x=math.radians(-72);lid.location=(0,.38,1.04)
    box('Chest latch',(0,-.41,.47),(.17,.07,.24),M['brass'],.025)
    for i in range(6):box('Chest board seam',(-.45+i*.18,-.367,.36),(.012,.01,.5),M['wood'],.001)
    if opened:
        for i in range(7):cylinder('Found coin',(R.uniform(-.34,.34),R.uniform(-.2,.2),.68),.08,.025,M['brass'],20)

def beacon(lit=True):
    for i in range(3):box('Lantern plinth',(0,0,.13+i*.16),(1.8-i*.3,1.65-i*.3,.25),M['stone'],.06)
    cylinder('Carved waystone',(0,0,1.1),.36,1.1,M['stone'],8,r2=.28)
    for i in range(8):
        a=i*math.tau/8;between('Lantern stone fluting',(math.cos(a)*.31,math.sin(a)*.31,.65),(math.cos(a)*.27,math.sin(a)*.27,1.58),.035,M['plaster'])
    lamp=lantern((0,0,1.75),1.8)
    if not lit:
        for o in lamp.children:
            if o.name.startswith('Amber glass'):o.data.materials.clear();o.data.materials.append(M['darkGlass'])
    for i in range(6):leaf('Ivy at the old lantern',(math.cos(i)*.5,math.sin(i)*.5,.22),.5,i)

def blob(phase=0):
    body=sphere('Dewdrop body',(0,0,.67+math.sin(phase)*.04),(.7,.55,.65),M['blob'],48)
    # Soft lobe feet and botanical crown distinguish the original creature.
    for side in [-1,1]:sphere('Dewdrop foot',(side*.48,-.2,.15),(.27,.3,.14),M['blob'])
    for x in [-.24,.24]:
        sphere('Dewdrop eye white',(x,-.48,.78),(.13,.07,.17),M['eye'])
        sphere('Dewdrop teal pupil',(x,-.543,.78),(.069,.025,.11),M['pupil'])
        sphere('Dewdrop eye glint',(x-.025,-.566,.83),(.028,.012,.035),M['eye'])
        sphere('Dewdrop cheek',(x*1.5,-.45,.55),(.09,.03,.04),M['pink'])
    curve('Dewdrop smile',[(-.11,-.546,.49),(0,-.57,.45),(.11,-.546,.49)],.018,M['pupil'])
    for i in range(3):leaf('Dewdrop leaf crown',(-.07+i*.1,0,1.2),.55,i*1.9+phase*.04)
    for i in range(11):sphere('Pearly dewdrop spots',(R.uniform(-.45,.45),R.uniform(-.3,.3),R.uniform(.9,1.16)),(.035,.03,.03),M['eye'],12)

def prop(name):
    if name=='tree':tree()
    elif name=='bush':shrub()
    elif name=='flowers':shrub(True)
    elif name.startswith('chest'):chest(name=='chest-open')
    elif name=='beacon':beacon()
    elif name=='blob':blob()
    elif name=='rocks':
        for i in range(7):
            o=sphere('Weather-worn boulder',(R.uniform(-.7,.7),R.uniform(-.5,.5),.22),(.3+R.random()*.25,.3,.3+R.random()*.18),M['stone'],12);o.rotation_euler=(R.random(),R.random(),R.random())
    elif name=='sign':
        cylinder('Signpost',(0,0,.65),.08,1.3,M['wood']);box('Carved road sign',(0,-.04,1.17),(1.05,.14,.36),M['woodLight'],.07)
        for i in range(3):box('Sign engraving',(-.25+i*.19,-.12,1.17),(.11,.015,.025),M['brass'],.005)
    elif name=='bridge':
        for i in range(13):box('Bridge plank',(-1.4+i*.23,0,.18+math.sin(i/12*math.pi)*.15),(.215,1.9,.14),M['woodLight'],.025)
        for x in [-1.5,1.5]:
            for y in [-.98,.98]:cylinder('Bridge post',(x,y,.55),.07,1.1,M['wood'])
        for y in [-.98,.98]:between('Bridge rail',(-1.5,y,1.03),(1.5,y,1.03),.045,M['wood'])
    elif name=='desk':
        box('Desk top',(0,0,.95),(2.3,1.2,.15),M['woodLight'],.07)
        for x in [-.95,.95]:
            for y in [-.43,.43]:box('Carved desk leg',(x,y,.47),(.12,.12,.9),M['wood'])
        for i in range(4):box('Old book',(R.uniform(-.7,.6),R.uniform(-.3,.3),1.09+i*.055),(.4,.5,.08),M['blue'] if i%2 else M['leather'])
        lantern((.7,.2,1.04),.8)
    elif name=='stool':
        cylinder('Stool seat',(0,0,.55),.4,.14,M['woodLight'],32)
        for i in range(3):
            a=i*math.tau/3;between('Stool leg',(math.cos(a)*.27,math.sin(a)*.27,.5),(math.cos(a)*.35,math.sin(a)*.35,.03),.06,M['wood'])
    elif name=='hearth':
        box('Stone chimney breast',(0,.1,1.2),(2,1,2.4),M['stone'],.08)
        box('Dark fireplace opening',(0,-.44,.7),(1.12,.1,1.25),M['darkLeather'],.15)
        box('Hearth mantle',(0,-.07,1.7),(2.3,1.3,.2),M['wood'],.05)
        for i in range(3):between('Hearth log',(-.5,-.6+i*.15,.18),(.5,-.6+i*.15,.18),.12,M['wood'])
        for i in range(7):sphere('Firelight',(R.uniform(-.4,.4),-.58,R.uniform(.26,.72)),(.12,.12,.23),M['glow'])
        lantern((-.74,-.1,1.82),.6)

def ground(kind):
    # Author in the domain's coordinate system, then render its orthographic plane.
    # The runtime uses the exact same affine projection for actors and pointer input.
    def xy(x,y,z=0):return ((x-700)/50,(500-y)/50,z)
    scene.render.resolution_x=1600;scene.render.resolution_y=1143
    scene.camera.location=(0,-28,28);scene.camera.rotation_euler=(Vector((0,0,0))-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.ortho_scale=28
    box('Continuous grassy ground',(0,0,-.13),(50,42,.2),M['grass'],0)
    if kind=='interior':
        scene.camera.data.ortho_scale=20
        scene.render.resolution_x=1200;scene.render.resolution_y=1020
        box('Interior floor base',(-4,0,-.06),(22,22,.1),M['wood'])
        for iy in range(25):
            for ix in range(8):
                o=box('Worn oak floorboard',(-11+ix*2.3+(iy%2)*.9,-8+iy*.64,0),(2.27,.615,.09),M['woodLight'] if (ix+iy)%4 else M['wood'],.016)
        for x in [-9.5,9.5]:box('Low cottage side wall',(x,0,.45),(.35,17,.9),M['plaster'])
        box('Cottage rear wall',(0,8.25,1.5),(19,.4,3),M['plaster'])
        for x in [-9,-6,-3,0,3,6,9]:box('Interior oak stud',(x,8,1.6),(.2,.22,3),M['wood'])
        # A woven geometric rug is real floor geometry rather than a UI panel.
        box('Woven cottage rug',(0,-.6,.065),(6.5,4.2,.035),M['mira'],.03)
        for side in [-1,1]:
            box('Rug gold border',(side*3,-.6,.089),(.12,4,.005),M['linen'],0)
            box('Rug gold border',(0,-.6+side*1.8,.089),(6,.1,.005),M['linen'],0)
        return
    roads=([(0,640),(280,640),(540,600),(840,585),(1150,590),(1400,575)],[(540,600),(470,510),(350,447)],[(650,600),(650,450),(625,380)]) if kind=='town' else ([(0,610),(230,640),(480,590),(760,570),(980,560),(1140,435)],)
    segments=[]
    for road in roads:
        for a,b in zip(road,road[1:]):segments.append((a,b))
    earth=mat('Packed earth under the cobbled road','#817453',.98,texture=35)
    def road_distance(x,y):
        best=9999
        if kind=='town':
            ellipse=math.sqrt(((x-650)/235)**2+((y-560)/165)**2)
            if ellipse<1:best=0
        for (ax,ay),(bx,by) in segments:
            dx,dy=bx-ax,by-ay;t=max(0,min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)))
            best=min(best,math.hypot(x-ax-t*dx,y-ay-t*dy))
        return best
    baseverts=[];basefaces=[]
    for y in range(-100,1100,12):
        for x in range(-100,1500,12):
            if road_distance(x+6,y+6)>55:continue
            k=len(baseverts);baseverts.extend([xy(x,y,.002),xy(x+12,y,.002),xy(x+12,y+12,.002),xy(x,y+12,.002)])
            basefaces.append((k+3,k+2,k+1,k))
    mesh('Continuous non-overlapping road foundation',baseverts,basefaces,earth)
    # Combined stone mesh: bevelled irregular cobbles with real top/side faces.
    verts=[];faces=[];indices=[]
    for row,y in enumerate(range(-100,1100,15)):
        for x0 in range(-100,1500,19):
            x=x0+(row%2)*9+R.uniform(-2,2);yy=y+R.uniform(-2,2)
            if road_distance(x,yy)>47:continue
            cx,cy,_=xy(x,yy);w=R.uniform(.15,.185);h=R.uniform(.12,.14);z=R.uniform(.015,.04);idx=len(verts)
            corners=[(-w,-h),(w,-h),(w,h),(-w,h)]
            verts.extend([(cx+dx,cy+dy,z) for dx,dy in corners]+[(cx+dx*.92,cy+dy*.92,z+.055) for dx,dy in corners])
            faces.extend([(idx+4,idx+5,idx+6,idx+7),(idx,idx+1,idx+5,idx+4),(idx+1,idx+2,idx+6,idx+5),(idx+2,idx+3,idx+7,idx+6),(idx+3,idx,idx+4,idx+7)])
            indices.extend([R.randrange(4)]*5)
    cobbles=mesh('Individual authored road cobbles',verts,faces,M['path'])
    for c in ['#b1ad94','#c3bba2','#96967e']:cobbles.data.materials.append(mat('Cobbled stone variation '+c,c,.9,texture=20))
    for p,i in zip(cobbles.data.polygons,indices):p.material_index=i
    mod=cobbles.modifiers.new('Soft worn cobble edges','BEVEL');mod.width=.012;mod.segments=1
    # Merge grass blades and little flowers to keep source construction/render bounded.
    verts=[];faces=[]
    for i in range(4200):
        x,y=R.uniform(0,1400),R.uniform(0,1000)
        if road_distance(x,y)<56:continue
        cx,cy,_=xy(x,y)
        if kind=='town' and abs(cx-(6.8+math.sin(cy*.35)*.55))<.9:continue
        for j in range(3):
            a=R.random()*math.tau;h=R.uniform(.06,.16);w=.02;k=len(verts)
            verts.extend([(cx-w,cy,0),(cx+w,cy,0),(cx+math.cos(a)*.05,cy+math.sin(a)*.05,h)])
            faces.append((k,k+1,k+2))
    mesh('Fine meadow grass blades',verts,faces,M['leafLight'])
    for i in range(90):
        x,y=R.uniform(120,1300),R.uniform(180,900)
        if 53<road_distance(x,y)<95:
            cx,cy,_=xy(x,y)
            for j in range(5):
                a=j*math.tau/5;sphere('Roadside little flower',(cx+math.cos(a)*.06,cy+math.sin(a)*.06,.09),(.055,.055,.035),M['cream'] if i%3 else M['pink'],8)
    if kind=='town':
        # One continuous water ribbon with natural banks, not a row of blocks.
        verts=[];faces=[];bankverts=[];bankfaces=[]
        for i in range(121):
            y=-20+i*.34;x=6.8+math.sin(y*.35)*.55;w=.72+math.sin(y*.74)*.07
            verts.extend([(x-w,y,.009),(x+w,y,.009)])
            bankverts.extend([(x-w-.2,y,.004),(x-w,y,.01),(x+w,y,.01),(x+w+.2,y,.004)])
            if i:
                k=i*2;faces.append((k-2,k-1,k+1,k));k=i*4
                bankfaces.extend([(k-4,k-3,k+1,k),(k-2,k-1,k+3,k+2)])
        mesh('Flowing stream surface',verts,faces,M['water']);mesh('Soft earthen stream banks',bankverts,bankfaces,earth)
        for i in range(42):
            y=R.uniform(-11,11);side=R.choice([-1,1]);x=6.8+math.sin(y*.35)*.55+side*R.uniform(.78,.9)
            sphere('Rounded bank stone',(x,y,.06),(.1,.13,.09),M['stone'],12)
        for i in range(55):
            y=R.uniform(-11,11);x=6.8+math.sin(y*.35)*.55+R.uniform(-.55,.55)
            curve('Stream ripple',[(x-.13,y,.035),(x,y+.03,.037),(x+.13,y,.035)],.009,M['eye'])

def battle_environment():
    scene.render.resolution_x=1600;scene.render.resolution_y=900
    scene.camera.data.type='PERSP';scene.camera.data.lens=43
    scene.camera.location=(8,-16,4.6);scene.camera.rotation_euler=(Vector((0,5,2))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.film_transparent=True
    # A transparent far edge blends the authored 3D clearing into the separate
    # original sky/valley matte; actors and all nearby scenery remain live layers.
    meadow=M['grass'].copy();meadow.name='Clearing ground with distant alpha fade'
    n=meadow.node_tree.nodes;links=meadow.node_tree.links
    geometry=n.new('ShaderNodeNewGeometry');split=n.new('ShaderNodeSeparateXYZ')
    fade=n.new('ShaderNodeMapRange');fade.inputs['From Min'].default_value=12;fade.inputs['From Max'].default_value=54;fade.clamp=True
    transparent=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader')
    links.new(geometry.outputs['Position'],split.inputs[0]);links.new(split.outputs['Y'],fade.inputs['Value'])
    links.new(fade.outputs['Result'],mix.inputs[0]);links.new(n.get('Principled BSDF').outputs[0],mix.inputs[1]);links.new(transparent.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],n.get('Material Output').inputs['Surface'])
    box('Meadow battle clearing',(0,0,-.16),(150,170,.3),meadow,0)
    for x,y,s in [(-5,2,1.3),(6,4,1.3),(-9,7,1.8),(10,10,1.6)]:
        before=set(bpy.data.objects);tree();root=bpy.data.objects.new('Battle tree assembly',None);bpy.context.collection.objects.link(root)
        for o in set(bpy.data.objects)-before:
            if o!=root and o.parent is None:o.parent=root
        root.location=(x,y,0);root.scale=(s,)*3
    for i in range(45):
        x,y=R.uniform(-12,12),R.uniform(-7,15)
        if abs(x)<2.5 and y<3:continue
        sphere('Clearing stone',(x,y,.12),(.18+R.random()*.35,.3,.22),M['stone'],12)
        for j in range(4):leaf('Meadow foreground frond',(x,y,.05),R.uniform(.3,.7),j*1.8)
    for i in range(80):
        x,y=R.uniform(-10,10),R.uniform(-6,9)
        if abs(x)<3 and abs(y)<2:continue
        height=R.uniform(.22,.48);between('Wildflower stem',(x,y,0),(x+.02,y,height),.012,M['leaf'])
        leaf('Wildflower leaf',(x,y,height*.4),.22,R.random()*6)
        for j in range(5):
            a=j*math.tau/5;sphere('Battle meadow flower',(x+math.cos(a)*.09,y+math.sin(a)*.09,height),(.08,.08,.035),M['cream'] if i%3 else M['pink'],8)
    verts=[];faces=[]
    for i in range(2400):
        x,y=R.uniform(-15,15),R.uniform(-9,18)
        if abs(x)<2.6 and abs(y)<2:continue
        a=R.random()*math.tau;h=R.uniform(.06,.22);k=len(verts)
        verts.extend([(x-.025,y,0),(x+.025,y,0),(x+math.cos(a)*.06,y+math.sin(a)*.06,h)]);faces.append((k,k+1,k+2))
    mesh('Clearing grass blades',verts,faces,M['leafLight'])
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.36,.61,.9,1)

def environment_assets():
    for name in ['town','meadow','interior']:
        clean();setup(1600,28,(0,0,0),False);ground(name);render(name+'-ground',(0,0,0),True)
    clean();setup(1600,28,(0,0,0),False);battle_environment();render('battle-environment',(0,0,0),True)

def run():
    if 'all' in ONLY or 'cottage' in ONLY:
        clean();setup(768,8.4,(0,0,2.4));cottage();render('cottage',(0,-2.3,0),True)
        if 'all' in ONLY:cottage_alt()
    if 'all' in ONLY or 'rowan' in ONLY:
        clean();setup(384,3,(0,0,1.13));character();render('rowan-idle',(0,0,0),True)
        clean();setup(768,1.8,(0,-.02,1.78));character(pose='cast');render('rowan-portrait',(0,0,0))
    if 'portrait-proof' in ONLY:
        clean();setup(768,1.8,(0,-.02,1.78));character(pose='cast');render('rowan-portrait',(0,0,0))
    if 'all' in ONLY or 'mira' in ONLY:
        clean();setup(384,2.8,(0,0,1));character(True);render('mira',(0,0,0),True)
        clean();setup(768,1.65,(0,-.02,1.6));character(True);render('mira-portrait',(0,0,0))
    if 'all' in ONLY or 'expression' in ONLY:
        clean();setup(768,1.65,(0,-.02,1.6));rig=character(True,pose='guard');rig.rotation_euler.x=.07;render('mira-thoughtful',(0,0,0))
    if 'all' in ONLY or 'props' in ONLY:
        spans={'tree':5.7,'bush':2.4,'flowers':2.4,'chest':1.6,'chest-open':1.8,'beacon':4.3,'blob':2.3,'rocks':2.4,'sign':2.1,'bridge':4.5,'desk':3.5,'stool':1.6,'hearth':3.8}
        for name,span in spans.items():
            clean();setup(512,span,(0,0,1.5 if name=='tree' else .8));prop(name);render(name,(0,0,0))
    if 'all' in ONLY or 'environment' in ONLY:environment_assets()
    if 'battle-environment' in ONLY:
        clean();setup(1600,28,(0,0,0),False);battle_environment();render('battle-environment',(0,0,0),True)
    if 'terrain' in ONLY:
        for name in ['town','meadow']:
            clean();setup(1600,28,(0,0,0),False);ground(name);render(name+'-ground',(0,0,0),True)
    if 'town-ground' in ONLY:
        clean();setup(1600,28,(0,0,0),False);ground('town');render('town-ground',(0,0,0),True)
    if 'foliage' in ONLY:
        clean();setup(512,5.7,(0,0,1.5));tree();render('tree',(0,0,0),True)
        clean();setup(1600,28,(0,0,0),False);battle_environment();render('battle-environment',(0,0,0),True)
    if 'tree' in ONLY:
        clean();setup(512,5.7,(0,0,1.5));tree();render('tree',(0,0,0),True)
    if 'all' in ONLY or 'beacon-states' in ONLY:
        clean();setup(512,4.3,(0,0,.8));beacon(False);render('beacon-dormant',(0,0,0))
    if 'all' in ONLY or 'animation' in ONLY:
        for direction in range(8):
            for frame in range(8):
                clean();setup(256,3,(0,0,1.13));character(phase=frame*math.pi/4,direction=direction*math.pi/4);render(f'rowan-walk-{direction}-{frame}')
        for pose in ['attack','cast','guard','hurt','victory']:
            for frame in range(8 if pose in ['attack','cast'] else 1):
                clean();setup(384,3.4,(0,0,1.1));scene.camera.location=(7,-13,6.5);scene.camera.rotation_euler=(Vector((0,0,1.1))-scene.camera.location).to_track_quat('-Z','Y').to_euler();character(phase=frame*math.pi/7,direction=1.15,pose=pose);render(f'rowan-{pose}-{frame}')
    if 'combat-poses' in ONLY:
        for pose in ['attack','cast','guard','hurt','victory']:
            for frame in range(8 if pose in ['attack','cast'] else 1):
                clean();setup(384,3.4,(0,0,1.1));scene.camera.location=(7,-13,6.5);scene.camera.rotation_euler=(Vector((0,0,1.1))-scene.camera.location).to_track_quat('-Z','Y').to_euler();character(phase=frame*math.pi/7,direction=1.15,pose=pose);render(f'rowan-{pose}-{frame}')
    if 'animation-inbetweens' in ONLY:
        for direction in range(8):
            for frame in [1,3,5,7]:
                clean();setup(256,3,(0,0,1.13));character(phase=frame*math.pi/4,direction=direction*math.pi/4);render(f'rowan-walk-{direction}-{frame}')
    old=json.loads((OUT/'manifest.json').read_text()) if (OUT/'manifest.json').exists() else {}
    old.update(manifest);(OUT/'manifest.json').write_text(json.dumps(old,indent=2)+'\n')
def cottage_alt():
    clean();setup(768,8.4,(0,0,2.4));cottage('terracotta',1);render('cottage-copper',(0,-2.3,0),True)
if __name__=='__main__':run()
