import {type Game,type Scene,type Point,places,trees} from './domain';
type Frame={x:number;y:number;w:number;h:number;anchor:[number,number]};
type Asset={file:string;w:number;h:number;anchor:[number,number];scale:number};
type Manifest={assets:Record<string,Asset>;walk:Record<string,Frame[]>;poses:Record<string,{file:string;frames:Frame[]}>};
type Actor={name:string;x:number;y:number;scale:number;depth:number};
const project=(p:Point)=>({x:p.x,y:500+(p.y-500)*Math.SQRT1_2});

/** Original Blender geometry and articulated poses, composited as independent layers.
 * No concept image or complete-game screenshot is used as a playable scene. */
export class World {
  private canvas=document.createElement('canvas');private ctx!:CanvasRenderingContext2D;
  private images:Record<string,HTMLImageElement>={};private manifest!:Manifest;private actors:Actor[]=[];
  private scene:Scene='town';private time=0;private direction=0;private frame=0;private game!:Game;
  private x=0;private y=0;private zoom=1;private width=1;private height=1;private dpr=1;
  private running=false;private last=performance.now();private isMoving=false;private battleRaf=0;private fade=0;
  frameTimes:number[]=[];reduced=false;
  app={start:()=>{this.last=performance.now();this.running=true;},stop:()=>{this.running=false;}};
  constructor(private host:HTMLElement,private tick:(dt:number)=>void,private click:(p:Point)=>void){}
  private async image(name:string,file:string){const image=new Image();image.src=`${import.meta.env.BASE_URL}art3d/${file}`;await image.decode();this.images[name]=image;}
  async init(g:Game){
    const response=await fetch(`${import.meta.env.BASE_URL}art3d/runtime.json`);if(!response.ok)throw Error('3D asset manifest unavailable');this.manifest=await response.json() as Manifest;
    await Promise.all([...Object.entries(this.manifest.assets).map(([name,a])=>this.image(name,a.file)),this.image('walk','rowan-walk.webp'),...Object.entries(this.manifest.poses).map(([name,p])=>this.image(name,p.file))]);
    const context=this.canvas.getContext('2d',{alpha:false});if(!context)throw Error('Canvas unavailable');this.ctx=context;
    this.canvas.setAttribute('aria-hidden','true');this.host.appendChild(this.canvas);new ResizeObserver(()=>this.resize()).observe(this.host);this.resize();this.build(g);
    this.canvas.addEventListener('pointerdown',e=>{const r=this.canvas.getBoundingClientRect(),x=(e.clientX-r.left-this.x)/this.zoom,y=(e.clientY-r.top-this.y)/this.zoom;this.click({x,y:500+(y-500)/Math.SQRT1_2});});
    const loop=(now:number)=>{if(this.running&&!document.hidden){const ms=Math.max(0,now-this.last);this.last=now;this.collect(ms);this.tick(Math.min(ms/1000,.045));this.render();}requestAnimationFrame(loop);};requestAnimationFrame(loop);
  }
  private collect(ms:number){if(ms>0&&ms<2000){this.frameTimes.push(ms);if(this.frameTimes.length>3600)this.frameTimes.shift();}}
  private add(name:string,x:number,y:number,scale=1){this.actors.push({name,x,y,scale,depth:y});}
  build(g:Game){
    this.scene=g.scene;this.game=g;this.actors=[];this.fade=this.reduced?0:1;
    if(g.scene==='town'){
      this.add('cottage-copper',250,105,.7);this.add('cottage',800,90,.65);this.add('cottage-copper',1170,150,.6);
      this.add('cottage',350,415);this.add('cottage-copper',832,355,.98);this.add('beacon',625,335,.78);this.add('mira',635,450,.9);
      this.add('chest',815,690,.9);this.add('sign',1183,574,.9);this.add('bridge',1045,620,1.05);this.add('rocks',520,801,1.15);
      trees.town.forEach(([x,y,s])=>this.add('tree',x,y-23*s,s));
      [[455,490],[760,415],[230,510],[909,410],[725,730],[920,790],[1200,700]].forEach(([x,y])=>this.add('bush',x,y,.85));
      [[320,500],[720,480],[845,750],[290,750],[1160,690],[550,430],[870,430]].forEach(([x,y])=>this.add('flowers',x,y,.85));
    }else if(g.scene==='meadow'){
      this.add('beacon',1140,350,1.1);this.add('sign',180,575,.9);[[635,315],[420,815],[1080,800]].forEach(([x,y])=>this.add('rocks',x,y,1.3));
      trees.meadow.forEach(([x,y,s])=>this.add('tree',x,y-23*s,s));
      [[310,410],[565,370],[860,410],[980,500],[640,770],[280,730],[1200,600]].forEach(([x,y])=>this.add('bush',x,y,.9));
      [[430,470],[490,700],[970,370],[1070,510],[770,680],[240,480],[915,735]].forEach(([x,y])=>this.add('flowers',x,y));this.add('blob',770,570,.88);
    }else{this.add('desk',330,365,1.1);this.add('hearth',775,330,1.1);this.add('stool',645,450);this.add('stool',280,480,.9);}
    this.update(g,0,false);this.render();
  }
  private resize(){this.width=this.host.clientWidth;this.height=this.host.clientHeight;this.dpr=Math.min(devicePixelRatio,1.5);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);this.zoom=this.width<600?.88:this.width<1000?1.02:1.13;if(this.game){this.update(this.game,0,false);this.render();}}
  update(g:Game,dt:number,moving:boolean,dx=0,dy=0){
    if(g.scene!==this.scene)this.build(g);this.game=g;this.time+=dt;this.isMoving=moving;
    if(moving&&(dx||dy))this.direction=(Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8;
    this.frame=this.reduced?0:moving?Math.floor(this.time*12)%8:(Math.floor(this.time*1.1)%2)*4;this.fade=Math.max(0,this.fade-dt*2.7);
    const p=project(g),sw=g.scene==='interior'?1000:1400,sh=g.scene==='interior'?850:1000;
    this.x=sw*this.zoom<this.width?(this.width-sw*this.zoom)/2:-Math.max(0,Math.min(sw*this.zoom-this.width,p.x*this.zoom-this.width*.5));
    this.y=sh*this.zoom<this.height?(this.height-sh*this.zoom)/2:-Math.max(0,Math.min(sh*this.zoom-this.height,p.y*this.zoom-this.height*.64));
  }
  private asset(ctx:CanvasRenderingContext2D,name:string,x:number,y:number,scale=1){const a=this.manifest.assets[name],image=this.images[name];if(!a||!image)return;const s=a.scale*scale,w=a.w*s,h=a.h*s;ctx.drawImage(image,x-a.anchor[0]*w,y-a.anchor[1]*h,w,h);}
  private pose(ctx:CanvasRenderingContext2D,image:HTMLImageElement,f:Frame,x:number,y:number,size:number){const h=size*f.h/f.w;ctx.drawImage(image,f.x,f.y,f.w,f.h,x-f.anchor[0]*size,y-f.anchor[1]*h,size,h);}
  render(){
    if(!this.ctx||!this.manifest||!this.game)return;const ctx=this.ctx,g=this.game;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.globalAlpha=1;ctx.fillStyle=g.scene==='interior'?'#211e19':'#699a40';ctx.fillRect(0,0,this.width,this.height);
    ctx.save();ctx.translate(this.x,this.y);ctx.scale(this.zoom,this.zoom);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(this.images[g.scene+'-ground'],0,0,g.scene==='interior'?1000:1400,g.scene==='interior'?850:1000);
    for(const a of [...this.actors,{name:'hero',x:g.x,y:g.y,scale:.86,depth:g.y}].sort((a,b)=>a.depth-b.depth)){
      if(a.name==='blob'&&g.flags.won)continue;const p=project(a);if(p.x+400<-this.x/this.zoom||p.x-400>(this.width-this.x)/this.zoom||p.y+400<-this.y/this.zoom||p.y-500>(this.height-this.y)/this.zoom)continue;
      if(a.name==='hero')this.pose(ctx,this.images.walk,this.manifest.walk[String(this.direction)][this.frame],p.x,p.y,150*.86);
      else{ctx.save();const meta=this.manifest.assets[a.name];
        if(a.name==='tree'&&a.depth>g.y){const hero=project(g),w=meta.w*meta.scale*a.scale,h=meta.h*meta.scale*a.scale,left=p.x-meta.anchor[0]*w,top=p.y-meta.anchor[1]*h;if(hero.x>left+w*.15&&hero.x<left+w*.85&&hero.y>top&&hero.y-65<top+h*.78)ctx.globalAlpha=.38;}
        ctx.translate(p.x,p.y);if(a.name==='tree'&&!this.reduced)ctx.rotate(Math.sin(this.time*.75)*.003);if(a.name==='blob'&&!this.reduced)ctx.translate(0,Math.sin(this.time*2.5)*4);const name=a.name==='chest'&&g.flags.chest?'chest-open':a.name==='beacon'&&g.scene==='meadow'&&!g.flags.lit?'beacon-dormant':a.name;this.asset(ctx,name,0,0,a.scale);ctx.restore();}
    }
    if(g.flags.lit&&g.scene==='meadow'){const p=project({x:1140,y:350}),glow=ctx.createRadialGradient(p.x,p.y-100,0,p.x,p.y-100,120);glow.addColorStop(0,'#ffd77f66');glow.addColorStop(1,'#ffb13d00');ctx.fillStyle=glow;ctx.fillRect(p.x-120,p.y-220,240,240);}
    if(!this.reduced&&g.scene!=='interior')for(let i=0;i<14;i++){const p=project({x:(i*173+80)%1400+Math.sin(this.time*.3+i)*24,y:(i*113+180)%1000});ctx.globalAlpha=.3+Math.sin(this.time+i)*.15;ctx.fillStyle='#fff4af';ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fill();}
    ctx.restore();ctx.globalAlpha=1;if(this.fade){ctx.fillStyle=`rgba(8,19,27,${this.fade*.6})`;ctx.fillRect(0,0,this.width,this.height);}
  }
  screen(p:Point):Point{const q=project(p);return {x:q.x*this.zoom+this.x,y:q.y*this.zoom+this.y};}
  placePositions(){return places[this.scene].map(p=>({...p,...this.screen(p)}));}
  stopBattle(){cancelAnimationFrame(this.battleRaf);this.battleRaf=0;}
  mountBattle(stage:HTMLElement,action:string,phase:string,busy:boolean){
    this.stopBattle();const canvas=document.createElement('canvas');canvas.className='battle-canvas';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
    const ctx=canvas.getContext('2d')!,start=performance.now();let previous=start;
    const draw=(now:number)=>{
      if(!stage.isConnected)return;const w=stage.clientWidth,h=stage.clientHeight,dpr=Math.min(devicePixelRatio,1.5);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);for(const key of ['battle-sky','battle-environment']){const bg=this.images[key],cover=Math.max(w/bg.width,h/bg.height);ctx.drawImage(bg,(w-bg.width*cover)/2,(h-bg.height*cover)/2-(key==='battle-sky'?h*.22:0),bg.width*cover,bg.height*cover);}
      const mobile=w<600,floor=h*(mobile?.54:.72),hx=w*(mobile?.27:.32),ex=w*(mobile?.73:.69),size=Math.min(w*(mobile?.64:.27),h*.55),es=size*.86;
      const elapsed=Math.max(0,(now-start)/1000),progress=this.reduced?0:Math.min(1,elapsed/(phase==='enemy'?.55:.85));
      const name=busy?(phase==='enemy'?'hurt':action==='attack'?'attack':action==='ember'||action==='mend'?'cast':action==='guard'?'guard':'victory'):'victory',p=this.manifest.poses[name];
      const leap=busy&&phase==='player'&&action==='attack'&&!this.reduced?Math.sin(progress*Math.PI)*size*.17:0,knock=busy&&phase==='enemy'&&!this.reduced?Math.sin(progress*Math.PI)*-12:0;
      this.pose(ctx,this.images[name],p.frames[Math.min(p.frames.length-1,Math.floor(progress*p.frames.length))],hx+leap+knock,floor,size);
      const em=this.manifest.assets.blob,hop=busy&&phase==='enemy'&&!this.reduced?Math.sin(progress*Math.PI)*-w*.08:0,bob=this.reduced?0:Math.sin(elapsed*2.6)*4;
      ctx.drawImage(this.images.blob,ex-es*em.anchor[0]+hop,floor-es*em.anchor[1]+bob,es,es);
      if(busy){const magic=action==='ember'||action==='mend',tx=phase==='enemy'?hx:action==='mend'||action==='guard'||action==='tonic'?hx:ex,ty=floor-size*.42;ctx.save();ctx.globalCompositeOperation='screen';const light=ctx.createRadialGradient(tx,ty,0,tx,ty,size*.42);light.addColorStop(0,magic?'#ffe28caa':'#fff4ca88');light.addColorStop(1,'#ffb02a00');ctx.fillStyle=light;ctx.fillRect(tx-size*.45,ty-size*.45,size*.9,size*.9);
        if(!this.reduced){ctx.strokeStyle=action==='guard'?'#ace8ffaa':'#fff0b2dd';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(tx,ty,size*.3,size*.34,-.4,progress*.5,Math.PI*1.5+progress);ctx.stroke();for(let i=0;i<12;i++){const angle=i*2.4,rad=progress*size*.34;ctx.fillStyle=i%2?'#ffe7a6':'#ffb467';ctx.beginPath();ctx.arc(tx+Math.cos(angle)*rad,ty+Math.sin(angle)*rad-progress*25,Math.max(.5,3*(1-progress)),0,Math.PI*2);ctx.fill();}}ctx.restore();}
      if(stage.dataset.ready!=='true')stage.dataset.ready='true';
      this.collect(now-previous);previous=now;if(!this.reduced)this.battleRaf=requestAnimationFrame(draw);
    };this.battleRaf=requestAnimationFrame(draw);
  }
  metrics(){const ms=this.frameTimes.slice(-600),sorted=[...ms].sort((a,b)=>a-b);return {frames:ms.length,frameMs:ms,meanMs:ms.reduce((s,v)=>s+v,0)/Math.max(1,ms.length),p95Ms:sorted[Math.floor(sorted.length*.95)]??0,renderer:'Canvas2D · Blender prerendered 3D',gpu:'Not required by runtime compositor',resolution:this.dpr,viewport:{width:this.width,height:this.height},heroScreen:this.game?this.screen(this.game):{x:0,y:0},moving:this.isMoving};}
}
