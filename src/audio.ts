import type {Scene} from './domain';
/** Original procedural cues and quiet pentatonic ambience. No samples/remote audio. */
export class Sound {
  private ctx?:AudioContext;private master?:GainNode;private active=false;private timer?:ReturnType<typeof setInterval>;private mode='';private note=0;private loudness=.3;
  get enabled(){return this.active;}set enabled(value:boolean){this.active=value;if(!value){this.stop();if(this.master&&this.ctx)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.03);}}
  get volume(){return this.loudness;}set volume(value:number){this.loudness=Math.max(0,Math.min(1,value));if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.active?this.loudness:0,this.ctx.currentTime,.03);}
  private context(){this.ctx??=new AudioContext();if(!this.master){this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);}this.master.gain.value=this.active?this.volume:0;void this.ctx.resume().catch(()=>{});return this.ctx;}
  private tone(frequency:number,start:number,duration:number,level:number,type:OscillatorType='sine'){
    const ctx=this.ctx!,oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type=type;oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(level,start+.04);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);oscillator.connect(gain);gain.connect(this.master!);oscillator.start(start);oscillator.stop(start+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  private stop(){if(this.timer)clearInterval(this.timer);this.timer=undefined;this.mode='';}
  sync(scene:Scene,paused:boolean,combat=false){
    if(!this.active||paused||document.hidden){this.stop();return;}const mode=scene+':'+combat;if(this.mode===mode)return;
    this.stop();this.mode=mode;this.note=0;
    try{this.context();const phrase=()=>{
      if(!this.active||document.hidden){this.stop();return;}if(this.ctx!.state!=='running')return;const base=combat?147:scene==='cavern'||scene==='sanctum'?164.81:scene==='forest'?196:220;
      const ratios=[1,1.2,4/3,1.5,1.8],pattern=[0,2,4,1,3,2,1,4],ctx=this.ctx!;this.tone(base*ratios[pattern[this.note%8]],ctx.currentTime,.85,.035,'sine');
      if(this.note%4===0)this.tone(base*.5,ctx.currentTime,2.2,.025,'triangle');this.note++;
    };phrase();this.timer=setInterval(phrase,combat?650:1050);}catch{this.stop();}
  }
  cue(kind:'step'|'open'|'attack'|'magic'|'win'|'light'){
    if(!this.active)return;
    try{const ctx=this.context(),frequencies=kind==='win'||kind==='light'?[392,494,587,784]:kind==='magic'?[523,784]:kind==='attack'?[160,90]:[440];frequencies.forEach((f,i)=>this.tone(f,ctx.currentTime+i*.11,.38,.15,kind==='attack'?'triangle':'sine'));}catch{/* Visible equivalents preserve all meaningful feedback. */}
  }
}
