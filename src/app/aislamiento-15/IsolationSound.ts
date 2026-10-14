/** Original synthesized ambience: no stock music, no third-party audio files.
 * AudioContext starts only following an explicit user gesture. */
export class IsolationSound {
  private ctx: AudioContext | null = null;
  private master?: GainNode;
  private drone?: OscillatorNode;
  private modulation?: OscillatorNode;
  private noise?: AudioBufferSourceNode;
  private noiseGain?: GainNode;
  private droneGain?: GainNode;
  private heartbeatAt = 0;
  private footstepAt = 0;
  private pulseAt = 0;
  private muted = false;

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const ctx = new AudioContext();
    this.ctx = ctx;
    const master = ctx.createGain(); master.gain.value = .28; master.connect(ctx.destination);
    this.master = master;
    const dr = ctx.createOscillator(), dg = ctx.createGain(), flt = ctx.createBiquadFilter();
    dr.type = "sawtooth"; dr.frequency.value = 39;
    dg.gain.value = .12; flt.type = "lowpass"; flt.frequency.value = 105;
    dr.connect(flt); flt.connect(dg); dg.connect(master); dr.start();
    this.drone = dr; this.droneGain = dg;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const arr = b.getChannelData(0);
    for (let i=0;i<arr.length;i++) arr[i]=(Math.random()*2-1)*.36;
    const ns = ctx.createBufferSource(); ns.buffer=b; ns.loop=true;
    const filter=ctx.createBiquadFilter(); filter.type="lowpass"; filter.frequency.value=650;
    const ng=ctx.createGain(); ng.gain.value=.12;
    ns.connect(filter); filter.connect(ng); ng.connect(master); ns.start();
    this.noise=ns; this.noiseGain=ng;
    const mod=ctx.createOscillator(), mg=ctx.createGain(); mod.frequency.value=.092; mg.gain.value=.048;
    mod.connect(mg); mg.connect(dg.gain); mod.start(); this.modulation=mod;
  }

  mute(value:boolean) {
    this.muted=value;
    if(this.ctx && this.master) this.master.gain.setTargetAtTime(value?0:.28,this.ctx.currentTime,.08);
  }
  get isMuted(){return this.muted;}

  private tone(freq:number,duration:number,type:OscillatorType="sine",volume=.15,endFreq?:number,pan=0) {
    const ctx=this.ctx, master=this.master;
    if(!ctx||!master)return;
    const t=ctx.currentTime,osc=ctx.createOscillator(),env=ctx.createGain(),stereo=ctx.createStereoPanner();
    osc.type=type; osc.frequency.setValueAtTime(freq,t);
    if(endFreq!==undefined)osc.frequency.exponentialRampToValueAtTime(Math.max(15,endFreq),t+duration);
    env.gain.setValueAtTime(.0001,t);
    env.gain.exponentialRampToValueAtTime(volume,t+.012);
    env.gain.exponentialRampToValueAtTime(.0001,t+duration);
    stereo.pan.value=pan;
    osc.connect(env);env.connect(stereo);stereo.connect(master);osc.start(t);osc.stop(t+duration+.04);
  }

  click(){this.tone(720,.045,"triangle",.25,450);}
  success(){this.tone(380,.19,"sine",.19,750);this.tone(620,.32,"triangle",.18,1080,.4);}
  mistake(){this.tone(115,.55,"sawtooth",.22,45);this.tone(590,.15,"square",.1,210);}
  door(){this.tone(72,1.5,"sawtooth",.23,32);this.tone(160,.9,"triangle",.09,62,-.4);}
  scare(){this.tone(48,.8,"sawtooth",.41,35);this.tone(880,.35,"triangle",.19,110,-.25);}
  step(side:number){this.tone(62,.11,"triangle",.13,44,side);}
  rattle(pan:number){ this.tone(126,.16,"sawtooth",.07,64,pan); this.tone(79,.28,"triangle",.09,35,pan); }
  siren(pan=0){this.tone(436,.55,"triangle",.11,298,pan);this.tone(310,.42,"sawtooth",.08,462,pan);}
  proximity(pan:number, distance:number) {
    if (distance > 7) return;
    const gain = Math.max(.06, .27 * (1-distance / 9));
    this.tone(45,.19,"sine",gain,31,pan);
    this.tone(78,.1,"triangle",gain*.65,49,pan);
  }
  heartbeat(){this.tone(64,.2,"sine",.28,38);this.tone(52,.16,"sine",.17,32);}
  cinematic(kind:"glass"|"lights"|"reactor"|"knock"){
    if(kind==="glass"){
      this.tone(178,.38,"triangle",.28,86,-.7);
      this.tone(1200,.52,"sawtooth",.035,420,-.7);
      this.tone(69,.68,"sine",.22,41,.35);
    } else if(kind==="lights"){
      this.tone(52,1.25,"sawtooth",.29,26);
      this.tone(840,.11,"square",.08,210);
    } else if(kind==="reactor"){
      this.tone(71,2.2,"sawtooth",.27,39,-.25);
      this.tone(260,1.5,"triangle",.12,120,.42);
      this.siren();
    } else {
      this.tone(83,.19,"triangle",.36,42,.8);
      this.tone(68,.28,"triangle",.29,36,.8);
      this.tone(54,.37,"triangle",.25,30,.8);
    }
  }
  message(){this.tone(430,.06,"sine",.1,330);this.tone(580,.09,"sine",.08,480,.55);}
  finale(){this.tone(240,1.3,"triangle",.19,480);this.tone(480,2.1,"sine",.12,720);}
  update(remaining:number,enemyDistance:number,elapsed:number,enemyPan=0) {
    if(!this.ctx||!this.droneGain||!this.noiseGain)return;
    const ctx=this.ctx,danger=Math.min(1,(900-remaining)/900);
    this.droneGain.gain.setTargetAtTime(.1+danger*.055,ctx.currentTime,.3);
    this.noiseGain.gain.setTargetAtTime(.11+danger*.07,ctx.currentTime,.5);
    const interval=enemyDistance<3? .8:remaining<120?1.6:3;
    if(elapsed>this.heartbeatAt+interval) {
      this.heartbeatAt=elapsed;
      if(enemyDistance<5||remaining<120)this.heartbeat();
    }
    // Directional footsteps update from the real-world enemy/player transform,
    // not an invented stationary point in the level.
    if(enemyDistance<9 && elapsed>this.footstepAt+Math.max(.43,enemyDistance/7)) {
      this.footstepAt=elapsed;
      this.proximity(enemyPan,enemyDistance);
      if(enemyDistance<4.5) this.rattle(enemyPan);
    }
    if(remaining<100 && elapsed>this.pulseAt+11) {
      this.pulseAt=elapsed;
      this.siren(enemyPan*.3);
    }
  }
  destroy(){
    try{this.drone?.stop();this.modulation?.stop();this.noise?.stop();void this.ctx?.close();}catch{}
    this.ctx=null;
  }
}
