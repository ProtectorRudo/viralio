/**
 * UMBRAL / Sound director.
 *
 * Actual CC0 wood-footstep recordings are preferred when available.
 * Every effect has a lightweight synthesized fallback: gameplay still works
 * offline, muted and in browsers that block Web Audio.
 *
 * The audio context is unlocked by pressing "Entrar a la casa", never on load.
 */
export type HorrorCue = "footsteps" | "door" | "knock" | "creak" | "shock" | "heartbeat" | "electric" | "darkness";

const SAMPLES: Partial<Record<HorrorCue,string>> = {
  footsteps: "/escape/audio/footsteps-wood.ogg",
  creak: "/escape/audio/wood-creak.ogg",
  door: "/escape/audio/heavy-door.ogg",
};
let ctx: AudioContext | null = null;
let root: GainNode | null = null;
let master: DynamicsCompressorNode | null = null;
let muted = false;
let generation = 0;
const cache = new Map<string,AudioBuffer>();
const inflight = new Map<string,Promise<void>>();

function context():AudioContext|null {
  if(typeof window==="undefined") return null;
  try {
    if(!ctx || ctx.state==="closed") {
      ctx=new AudioContext();
      root=ctx.createGain();
      root.gain.value=muted?0:0.65;
      master=ctx.createDynamicsCompressor();
      master.threshold.value=-22;
      master.knee.value=18;
      master.ratio.value=5;
      master.attack.value=0.004;
      master.release.value=.25;
      root.connect(master);
      master.connect(ctx.destination);
    }
    return ctx;
  }catch{return null;}
}

/** Shares the already-compressed, mute-aware bus with the original score.
 * A single AudioContext avoids competing iOS/Android playback sessions.
 */
export function getHorrorScoreBus(): { audio: AudioContext; output: AudioNode } | null {
  const audio=context();
  if(!audio || !root) return null;
  return {audio,output:root};
}

export function unlockHorrorAudio(){
  const a=context();
  if(a && a.state==="suspended") void a.resume().catch(()=>{});
  for(const url of Object.values(SAMPLES)) if(url) void load(url);
}

export function setHorrorMuted(value:boolean){
  muted=value;
  if(root&&ctx){root.gain.setTargetAtTime(muted?0:0.65,ctx.currentTime,.09);}
}

export function stopHorrorAudio(){
  generation++;
  if(root&&ctx) {
    root.gain.setTargetAtTime(0,ctx.currentTime,.03);
  }
}
export function resumeHorrorAudio(){
  if(root&&ctx){root.gain.setTargetAtTime(muted?0:0.65,ctx.currentTime,.08);}
}

async function load(url:string):Promise<void>{
  if(cache.has(url)) return;
  const pending=inflight.get(url);
  if(pending) return pending;
  const request=(async()=>{
    try {
      const response=await fetch(url,{cache:"force-cache"});
      if(!response.ok) return;
      const data=await response.arrayBuffer();
      const a=context();
      if(!a) return;
      const buffer=await a.decodeAudioData(data);
      cache.set(url,buffer);
    }catch{/* An offline/unsupported sample degrades to synthesized foley. */}
  })();
  inflight.set(url,request);
  await request;
  inflight.delete(url);
}

function reverb(a:AudioContext, source:AudioNode, gain:number) {
  const delay=a.createDelay(.6);
  delay.delayTime.value=.16;
  const feedback=a.createGain();
  feedback.gain.value=.21;
  const wet=a.createGain();
  wet.gain.value=gain*.35;
  source.connect(delay);
  delay.connect(wet);
  wet.connect(root ?? a.destination);
  delay.connect(feedback);
  feedback.connect(delay);
  // no indefinite tail: disconnect looping feedback when the effect finishes
  window.setTimeout(()=>{try{feedback.disconnect();delay.disconnect();wet.disconnect();}catch{}},2100);
}

function output(a:AudioContext,pan:number,volume:number,sweep=false){
  const gain=a.createGain();
  const panner=a.createStereoPanner();
  panner.pan.setValueAtTime(Math.max(-1,Math.min(1,pan)),a.currentTime);
  if(sweep)panner.pan.linearRampToValueAtTime(-pan,a.currentTime+1.35);
  gain.gain.value=volume;
  gain.connect(panner);
  panner.connect(root ?? a.destination);
  return {gain,panner};
}

function oscillator(a:AudioContext,frequency:number,when:number,length:number,amplitude:number,pan=0,type:OscillatorType="sine"){
  const o=a.createOscillator(),g=a.createGain(),p=a.createStereoPanner();
  o.type=type;o.frequency.setValueAtTime(frequency,when);
  p.pan.value=pan;
  g.gain.setValueAtTime(.0001,when);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,amplitude),when+.02);
  g.gain.exponentialRampToValueAtTime(.0001,when+length);
  o.connect(g);g.connect(p);p.connect(root??a.destination);
  o.start(when);o.stop(when+length+.03);
}

function foley(a:AudioContext,cue:HorrorCue,pan:number){
  const now=a.currentTime;
  const duration=cue==="darkness"?2.25:cue==="shock"?.85:cue==="heartbeat"?1.45:cue==="electric"?.8:cue==="door"?1.7:.88;
  const count=Math.max(1,Math.floor(a.sampleRate*duration));
  const buffer=a.createBuffer(1,count,a.sampleRate);
  const data=buffer.getChannelData(0);
  // Physically-inspired envelopes: pressure waves, mechanical rattle and rustle.
  for(let i=0;i<count;i++){
    const t=i/a.sampleRate;
    let env=0;
    if(cue==="footsteps")env=Math.exp(-t*18)+.38*Math.exp(-Math.max(0,t-.12)*25)*(t>.12?1:0);
    else if(cue==="knock")env=Math.exp(-t*26)+(t>.24?.5*Math.exp(-(t-.24)*28):0);
    else if(cue==="door")env=Math.sin(Math.min(1,t/duration)*Math.PI)*(.5+.3*Math.sin(t*17));
    else if(cue==="creak")env=Math.sin(t/duration*Math.PI)*(.8+.1*Math.sin(t*22));
    else if(cue==="darkness")env=.28*Math.sin(t/duration*Math.PI)+.08;
    else if(cue==="shock")env=Math.exp(-t*7);
    else if(cue==="heartbeat")env=((t%0.74)<.12?Math.exp(-(t%.74)*21):0);
    else env=Math.exp(-t*5)*(.75+.25*Math.sin(t*55));
    const n=(Math.random()*2-1);
    const metallic=(Math.sin(t*105)+(Math.sin(t*73)*.55))*Math.exp(-t*5);
    data[i]=Math.max(-1,Math.min(1,(n*.65+metallic*.28)*env*.45));
  }
  const src=a.createBufferSource();src.buffer=buffer;
  const filter=a.createBiquadFilter();filter.type="lowpass";
  filter.frequency.value=cue==="darkness"?650:cue==="shock"?2400:cue==="electric"?1750:cue==="creak"?980:920;
  const highpass=a.createBiquadFilter();highpass.type="highpass";highpass.frequency.value=35;
  const chain=output(a,pan,cue==="shock"?.19:cue==="darkness"?.21:.18,cue==="footsteps");
  src.connect(filter);filter.connect(highpass);highpass.connect(chain.gain);
  src.start(now);src.stop(now+duration);
  if(cue==="door"||cue==="creak"||cue==="darkness")reverb(a,highpass,.18);
  if(cue==="darkness"){
    oscillator(a,55,now,2.25,.15,0);
    oscillator(a,79,now+.25,1.7,.035,-.65);
  }
  if(cue==="shock"){
    oscillator(a,82,now,.65,.16,0);
    oscillator(a,145,now,.3,.035,-.55,"sawtooth");
  }
  if(cue==="heartbeat"){
    oscillator(a,57,now,.18,.13,-.15);
    oscillator(a,47,now+.36,.23,.1,.15);
    oscillator(a,57,now+.78,.18,.13,-.15);
    oscillator(a,47,now+1.1,.23,.1,.15);
  }
}

function playSample(a:AudioContext,buffer:AudioBuffer,cue:HorrorCue,pan:number,velocity:number){
  const source=a.createBufferSource();
  source.buffer=buffer;
  source.playbackRate.value=cue==="footsteps"?.9:1;
  const out=output(a,pan,Math.min(.44,.23*velocity),cue==="footsteps");
  source.connect(out.gain);
  if(cue==="door")reverb(a,out.panner,.09);
  source.start();
}

export function playHorror(cue:HorrorCue,options?:{pan?:number;intensity?:number}){
  if(muted || (typeof document!=="undefined"&&document.hidden))return;
  const a=context();
  if(!a || a.state!=="running")return;
  const pan=options?.pan??0;
  const url=SAMPLES[cue];
  if(url && cache.has(url)){
    playSample(a,cache.get(url)!,cue,pan,options?.intensity??1);
    return;
  }
  foley(a,cue,pan);
  if(url)void load(url);
}

export function playFootstepsAcrossRoom(){
  const current=++generation;
  const pans=[.8,.52,.17,-.24,-.7];
  pans.forEach((pan,i)=>window.setTimeout(()=>{
    if(generation===current)playHorror("footsteps",{pan,intensity:.7+(i*.055)});
  },i*430));
}
