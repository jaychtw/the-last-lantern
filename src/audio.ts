// Original short Web Audio cues; no audio files, music samples or remote requests.
export class Sound {
  private ctx?:AudioContext; enabled=false; volume=.3;
  cue(kind:'step'|'open'|'attack'|'magic'|'win'|'light'){
    if(!this.enabled)return;
    try{
      this.ctx??=new AudioContext();void this.ctx.resume();
      const frequencies=kind==='win'||kind==='light'?[392,494,587,784]:kind==='magic'?[523,784]:kind==='attack'?[160,90]:[440];
      frequencies.forEach((f,i)=>{
        const ctx=this.ctx!,o=ctx.createOscillator(),g=ctx.createGain(),start=ctx.currentTime+i*.11;
        o.type=kind==='attack'?'triangle':'sine';o.frequency.value=f;
        g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(this.volume*.15,start+.015);g.gain.exponentialRampToValueAtTime(.0001,start+.38);
        o.connect(g);g.connect(ctx.destination);o.start(start);o.stop(start+.4);
      });
    }catch{/* Audio is optional; every event has a visible equivalent. */}
  }
}
