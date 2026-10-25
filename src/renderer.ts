import { Application, Assets, Container, Graphics, Sprite, Texture, Rectangle, UPDATE_PRIORITY } from 'pixi.js';
import { type Game, type Scene, type Point, places,trees } from './domain';

export class World {
  app=new Application(); root=new Container(); actors=new Container(); hero=new Container();
  private parts:Record<string,Sprite>={}; private textures:Record<string,Texture>={};
  private enemy?:Sprite; private chest?:Sprite; private beaconFlame?:Sprite;
  private motes:Sprite[]=[]; private scene:Scene='town'; private time=0;
  private moving=false; private face=1; private camera={x:0,y:0}; private zoom=1;
  private observer?:ResizeObserver; private last=performance.now();
  private canvas!:HTMLCanvasElement;private context?:CanvasRenderingContext2D;private gpu='unknown';
  frameTimes:number[]=[];
  reduced=false;
  constructor(private host:HTMLElement,private tick:(dt:number)=>void,private click:(p:Point)=>void){}
  async init(g:Game){
    await this.app.init({background:'#789c72',antialias:false,resolution:Math.min(devicePixelRatio,1.5),autoDensity:true,
      preference:'webgl',powerPreference:'low-power',width:this.host.clientWidth,height:this.host.clientHeight});
    this.app.stop();
    // Software WebGL can be much slower than native Canvas2D. Both paths consume
    // the identical Pixi scene graph/atlas; this is a renderer fallback, not new rules.
    const gl=(this.app.renderer as unknown as {gl?:WebGLRenderingContext}).gl;
    const info=gl?.getExtension('WEBGL_debug_renderer_info');
    this.gpu=gl&&info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):'unknown';
    if(/swiftshader|llvmpipe|software/i.test(this.gpu)){
      this.canvas=document.createElement('canvas');
      this.context=this.canvas.getContext('2d',{alpha:false})??undefined;
    }
    if(!this.context)this.canvas=this.app.canvas;
    this.app.ticker.remove(this.app.render,this.app);
    this.app.ticker.add(()=>this.render(),this,UPDATE_PRIORITY.LOW);
    this.host.appendChild(this.canvas);
    this.canvas.setAttribute('aria-hidden','true');
    const names=['town-ground','meadow-ground','interior-ground','stream'];
    await Promise.all(names.map(async name=>{this.textures[name]=await Assets.load<Texture>(`${import.meta.env.BASE_URL}art/${name}.svg`);}));
    const [atlas,frames]=await Promise.all([
      Assets.load<Texture>(`${import.meta.env.BASE_URL}art/atlas.svg`),
      fetch(`${import.meta.env.BASE_URL}art/atlas.json`).then(r=>{if(!r.ok)throw Error('Atlas metadata unavailable');return r.json() as Promise<Record<string,{x:number;y:number;w:number;h:number}>>;})
    ]);
    for(const [name,r] of Object.entries(frames))this.textures[name]=new Texture({source:atlas.source,frame:new Rectangle(r.x,r.y,r.w,r.h)});
    this.app.stage.addChild(this.root);this.root.sortableChildren=true;
    this.root.addChild(this.actors);this.actors.sortableChildren=true;
    this.build(g);
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.host);this.resize();
    this.canvas.addEventListener('pointerdown',e=>{
      const r=this.canvas.getBoundingClientRect();
      this.click({x:(e.clientX-r.left-this.root.x)/this.zoom,y:(e.clientY-r.top-this.root.y)/this.zoom});
    });
    this.app.ticker.maxFPS=60;
    this.app.ticker.add(()=>{
      const now=performance.now(),dt=Math.min((now-this.last)/1000,.045);this.last=now;
      if(!document.hidden){this.frameTimes.push(this.app.ticker.elapsedMS);if(this.frameTimes.length>3600)this.frameTimes.shift();this.tick(dt);}
    });
  }
  private sprite(name:string,x:number,y:number,scale=1,layer=this.actors):Sprite{
    const s=new Sprite(this.textures[name]);s.anchor.set(.5,1);s.position.set(x,y);s.scale.set(scale);s.zIndex=y;layer.addChild(s);return s;
  }
  private rig(){
    this.hero=new Container();this.hero.label='courier';
    const shadow=new Graphics().ellipse(0,-2,21,7).fill({color:0x244b43,alpha:.25});shadow.label='hero-shadow';this.hero.addChild(shadow);
    const add=(name:string,asset:string,x:number,y:number,scale=.8)=>{
      const s=new Sprite(this.textures[asset]);s.anchor.set(.5,0);s.position.set(x,y);s.scale.set(scale);this.parts[name]=s;this.hero.addChild(s);return s;
    };
    add('cape','hero-cape',0,-73,.82);
    add('leftLeg','hero-leg',-9,-27,.76);add('rightLeg','hero-leg',9,-27,.76);
    add('body','hero-body',0,-66,.8);
    add('leftArm','hero-arm',-20,-63,.76);add('rightArm','hero-arm',21,-63,.76);
    add('lantern','hand-lantern',28,-34,.65);
    add('head','hero-head',0,-96,.8);
    this.hero.scale.set(.84);this.actors.addChild(this.hero);
  }
  build(g:Game){
    this.scene=g.scene;
    for(const child of this.root.removeChildren())child.destroy({children:true});
    this.actors=new Container();this.actors.sortableChildren=true;this.parts={};this.motes=[];
    this.enemy=undefined;this.chest=undefined;this.beaconFlame=undefined;
    const ground=new Sprite(this.textures[`${g.scene}-ground`]);this.root.addChild(ground);
    if(g.scene==='town')this.root.addChild(new Sprite(this.textures.stream));
    this.root.addChild(this.actors);
    const tree=(x:number,y:number,s=1,n=0)=>this.sprite('tree'+n,x,y,s);
    if(g.scene==='town'){
      this.sprite('cottage',350,438,1);this.sprite('cottage',832,367,.95);
      this.sprite('beacon',625,385,.68);this.sprite('flame',625,302,.42);
      this.sprite('lamplighter',635,450,.8);
      this.chest=this.sprite(g.flags.chest?'chest-open':'chest',815,687,.82);
      this.sprite('sign',1183,574,.8);this.sprite('bridge',1045,652,1.05);
      this.sprite('rocks',520,801,1.25);
      trees.town.forEach(([x,y,s],i)=>tree(x,y,s,i%3));
      [[455,490],[760,415],[230,510],[909,410],[725,730],[920,790],[1200,700]].forEach(([x,y])=>this.sprite('bush',x,y,.9));
      [[320,500],[720,480],[845,750],[290,750],[1160,690],[550,430],[870,430]].forEach(([x,y])=>this.sprite('flowers',x,y));
    }else if(g.scene==='meadow'){
      this.sprite('beacon',1140,390,1.2);
      this.beaconFlame=this.sprite('flame',1140,251,.8);this.beaconFlame.visible=g.flags.lit;
      this.sprite('sign',180,575,.8);
      this.sprite('rocks',635,315,1.4);this.sprite('rocks',420,815,1.5);this.sprite('rocks',1080,800,1.6);
      trees.meadow.forEach(([x,y,s],i)=>tree(x,y,s,i%3));
      [[310,410],[565,370],[860,410],[980,500],[640,770],[280,730],[1200,600]].forEach(([x,y])=>this.sprite('bush',x,y));
      [[430,470],[490,700],[970,370],[1070,510],[770,680],[240,480],[915,735]].forEach(([x,y])=>this.sprite('flowers',x,y,1.2));
      this.enemy=this.sprite('blob',770,570,.48);this.enemy.visible=!g.flags.won;
    }else{
      this.sprite('rug',500,590,1.4);this.sprite('desk',330,350,1.05);this.sprite('hearth',775,330,1.1);
      this.sprite('stool',645,450,1.1);this.sprite('stool',280,480,.9);this.sprite('hand-lantern',400,292,1.1);
      this.chest=undefined;this.enemy=undefined;
    }
    this.rig();
    if(g.scene!=='interior'){
      for(let i=0;i<20;i++){
        const s=this.sprite('flame',(i*173+80)%1400,(i*113+200)%1000,.09,this.root);
        s.alpha=.23;s.zIndex=10000;this.motes.push(s);
      }
    }
    this.update(g,0,false);
  }
  private resize(){
    const w=this.host.clientWidth,h=this.host.clientHeight;
    if(w&&h){
      this.app.renderer.resize(w,h);
      if(this.context){this.canvas.width=Math.round(w*this.app.renderer.resolution);this.canvas.height=Math.round(h*this.app.renderer.resolution);}
      this.zoom=w<600?.8:w<1000?.94:1.02;this.root.scale.set(this.zoom);this.render();
    }
  }
  render(){
    if(!this.context){this.app.render();return;}
    const ctx=this.context,dpr=this.app.renderer.resolution;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;
    ctx.fillStyle=this.scene==='interior'?'#293b37':'#789c72';ctx.fillRect(0,0,this.canvas.width/dpr,this.canvas.height/dpr);
    ctx.imageSmoothingEnabled=true;
    const draw=(node:Container)=>{
      if(!node.visible||!node.renderable||node.alpha===0)return;
      ctx.save();ctx.translate(node.x,node.y);if(node.rotation)ctx.rotate(node.rotation);ctx.scale(node.scale.x,node.scale.y);ctx.globalAlpha*=node.alpha;
      if(node instanceof Sprite){
        const f=node.texture.frame,source=node.texture.source.resource as CanvasImageSource;
        ctx.drawImage(source,f.x,f.y,f.width,f.height,-node.anchor.x*f.width,-node.anchor.y*f.height,f.width,f.height);
      }else if(node.label==='hero-shadow'){
        ctx.fillStyle='#244b4340';ctx.beginPath();ctx.ellipse(0,-2,21,7,0,0,Math.PI*2);ctx.fill();
      }
      if(node.sortableChildren)node.sortChildren();
      for(const child of node.children)draw(child);
      ctx.restore();
    };
    draw(this.root);
  }
  update(g:Game,dt:number,moving:boolean,dx=0){
    if(g.scene!==this.scene)this.build(g);
    this.time+=dt;this.moving=moving;
    if(Math.abs(dx)>.01)this.face=dx<0?-1:1;
    const phase=this.time*(moving?13:2.2),bob=this.reduced?0:Math.sin(phase)*(moving?2.1:1.1);
    this.hero.position.set(g.x,g.y+bob);this.hero.zIndex=g.y;
    // Outfit and head remain fixed; articulated limbs and cape generate the walk/idle poses.
    const swing=this.reduced?0:Math.sin(phase)*(moving?.45:.025);
    this.parts.leftLeg.rotation=swing;this.parts.rightLeg.rotation=-swing;
    this.parts.leftArm.rotation=-swing*.7;this.parts.rightArm.rotation=swing*.45;
    this.parts.cape.rotation=this.reduced?0:Math.sin(phase*.55)*.025;
    this.parts.lantern.rotation=this.reduced?0:Math.sin(phase*.7)*.08;
    this.hero.scale.x=.84*this.face;
    if(this.chest)this.chest.texture=this.textures[g.flags.chest?'chest-open':'chest'];
    if(this.enemy){this.enemy.visible=g.scene==='meadow'&&!g.flags.won;
      if(!this.reduced){this.enemy.y=570+Math.sin(this.time*2.4)*5;this.enemy.scale.set(.48*(1+Math.sin(this.time*2.4)*.035),.48*(1-Math.sin(this.time*2.4)*.035));}}
    if(this.beaconFlame)this.beaconFlame.visible=g.scene==='meadow'&&g.flags.lit;
    for(let i=0;i<this.motes.length;i++){
      if(!this.reduced){this.motes[i].x=((i*173+80)+Math.sin(this.time*.3+i)*35)%1400;this.motes[i].y=(i*113+200)+Math.sin(this.time*.5+i)*15;}
    }
    const sw=g.scene==='interior'?1000:1400,sh=g.scene==='interior'?850:1000;
    const width=this.app.screen.width,height=this.app.screen.height;
    this.camera.x=sw*this.zoom<width?(sw*this.zoom-width)/2:Math.max(0,Math.min(sw*this.zoom-width,g.x*this.zoom-width*.5));
    this.camera.y=sh*this.zoom<height?(sh*this.zoom-height)/2:Math.max(0,Math.min(sh*this.zoom-height,g.y*this.zoom-height*.63));
    this.root.position.set(-this.camera.x,-this.camera.y);
  }
  screen(p:Point):Point{return {x:p.x*this.zoom+this.root.x,y:p.y*this.zoom+this.root.y};}
  placePositions(){return places[this.scene].map(p=>({...p,...this.screen(p)}));}
  metrics(){
    const a=this.frameTimes.slice(-600).filter(t=>t>0).sort((x,y)=>x-y);
    return {frames:a.length,frameMs:this.frameTimes.slice(-600),meanMs:a.reduce((s,v)=>s+v,0)/Math.max(1,a.length),p95Ms:a[Math.floor(a.length*.95)]??0,
      renderer:this.context?'canvas2d (software GPU fallback)':this.app.renderer.name,gpu:this.gpu,resolution:this.app.renderer.resolution,viewport:{width:this.app.screen.width,height:this.app.screen.height},moving:this.moving};
  }
}
