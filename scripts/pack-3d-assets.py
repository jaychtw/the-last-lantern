"""Encode Blender exports and pack animation frames, without repainting them."""
from pathlib import Path
from PIL import Image, ImageChops
import json,hashlib,math
root=Path(__file__).resolve().parents[1];out=root/'public/art3d';raw=root/'assets/renders';out.mkdir(parents=True,exist_ok=True)
manifest=json.loads((raw/'manifest.json').read_text())
spans={'cottage':8.4,'cottage-copper':8.4,'rowan-idle':3,'rowan-portrait':1.8,'mira':2.8,'mira-portrait':1.65,'mira-thoughtful':1.65,'tree':5.7,'bush':2.4,'flowers':2.4,'chest':1.6,'chest-open':1.8,'beacon':4.3,'blob':2.3,'rocks':2.4,'sign':2.1,'bridge':4.5,'desk':3.5,'stool':1.6,'hearth':3.8}
campaign=raw/'campaign-spans.json'
if campaign.exists():spans.update(json.loads(campaign.read_text()))
result={'assets':{},'walk':{},'poses':{},'provenance':{}}
sky=root/'assets/source/battle-sky.png'
sky_image=Image.open(sky).convert('RGB');sky_image.save(out/'battle-sky.webp','WEBP',quality=92,method=3)
result['assets']['battle-sky']={'file':'battle-sky.webp','w':sky_image.width,'h':sky_image.height,'anchor':[.5,.5],'scale':1}
result['provenance']['battle-sky']=hashlib.sha256(sky.read_bytes()).hexdigest()
spans['beacon-dormant']=4.3
def shadow_matte(im,anchor):
    # Cycles shadow-catcher spill is black low-alpha across the infinite plane.
    # Keep the actual object untouched and feather only that ground matte to a
    # bounded contact region, avoiding visible rectangular sprite backgrounds.
    r,g,b,a=im.split();dark=ImageChops.lighter(ImageChops.lighter(r,g),b).point(lambda v:255 if v<8 else 0)
    shadow=ImageChops.multiply(dark,a.point(lambda v:255 if v<200 else 0))
    fade=Image.new('L',im.size,0);pixels=fade.load();w,h=im.size;cx=anchor[0]*w;cy=anchor[1]*h-h*.035;rx=w*.5;ry=h*.17
    for y in range(max(0,int(cy-ry)),min(h,int(cy+ry)+1)):
        for x in range(max(0,int(cx-rx)),min(w,int(cx+rx)+1)):
            d=((x-cx)/rx)**2+((y-cy)/ry)**2
            pixels[x,y]=round(255*max(0,min(1,(1-d)/.55)))
    im.putalpha(Image.composite(ImageChops.multiply(a,fade),a,shadow));return im
for name,meta in manifest.items():
    p=raw/meta['file'];im=Image.open(p).convert('RGBA')
    if name not in spans and not name.endswith('-ground') and not name.startswith('battle-'):continue
    if name in spans:im=shadow_matte(im,meta['anchor'])
    im.save(out/(name+'.webp'),'WEBP',quality=92,method=3)
    result['assets'][name]={'file':name+'.webp','w':im.width,'h':im.height,'anchor':meta['anchor'],'scale':50*spans[name]/im.width if name in spans else 1}
    result['provenance'][name]=hashlib.sha256(p.read_bytes()).hexdigest()
walk=Image.new('RGBA',(2048,2048))
for direction in range(8):
    result['walk'][str(direction)]=[]
    for frame in range(8):
        im=shadow_matte(Image.open(raw/f'rowan-walk-{direction}-{frame}.png').convert('RGBA'),manifest[f'rowan-walk-{direction}-{frame}']['anchor'])
        result['provenance'][f'rowan-walk-{direction}-{frame}']=hashlib.sha256((raw/f'rowan-walk-{direction}-{frame}.png').read_bytes()).hexdigest()
        index=direction*8+frame;x=(index%8)*256;y=(index//8)*256
        walk.paste(im,(x,y));result['walk'][str(direction)].append({'x':x,'y':y,'w':256,'h':256,'anchor':manifest[f'rowan-walk-{direction}-{frame}']['anchor']})
walk.save(out/'rowan-walk.webp','WEBP',quality=93,method=3)
for pose in ['attack','cast','guard','hurt','victory']:
    count=8 if pose in ['attack','cast'] else 1;sheet=Image.new('RGBA',(384*min(count,4),384*math.ceil(count/4)));frames=[]
    for i in range(count):
        x=(i%4)*384;y=(i//4)*384
        im=shadow_matte(Image.open(raw/f'rowan-{pose}-{i}.png').convert('RGBA'),manifest[f'rowan-{pose}-{i}']['anchor']);sheet.paste(im,(x,y));frames.append({'x':x,'y':y,'w':384,'h':384,'anchor':manifest[f'rowan-{pose}-{i}']['anchor']})
        result['provenance'][f'rowan-{pose}-{i}']=hashlib.sha256((raw/f'rowan-{pose}-{i}.png').read_bytes()).hexdigest()
    sheet.save(out/f'rowan-{pose}-sheet.webp','WEBP',quality=93,method=3)
    result['poses'][pose]={'file':f'rowan-{pose}-sheet.webp','frames':frames}
(out/'runtime.json').write_text(json.dumps(result,indent=2)+'\n')
print('Packed original 3D exports, eight-direction walk frames and battle poses.')
