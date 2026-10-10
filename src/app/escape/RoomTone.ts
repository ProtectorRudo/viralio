/**
 * UMBRAL / Room tone, the sound of the house itself.
 *
 * An original procedural, quietly animated ambience for each chapter:
 * 0 = air in the vestibule, 1 = breathing timbers of the study,
 * 2 = hollow nursery / glass, 3 = electrical substation.
 *
 * One shared AudioContext, one compressed/mute-aware mixer. Only four very
 * low-level generators at once. No third-party streamed assets or autoplay.
 */
import { getHorrorScoreBus } from "./SoundDirector";

type RoomTexture = {
  output: GainNode;
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  audio: AudioContext;
};

let texture: RoomTexture | null = null;
let noiseCache: { audio: AudioContext; buffer: AudioBuffer } | null = null;

const ROOMS = [
  { base: 41, interval: 1.007, filter: 260, hiss: 0.021, low: 0.025, air: 0.009, cycle: 0.076, pan: -0.18 },
  { base: 58, interval: 1.014, filter: 340, hiss: 0.015, low: 0.020, air: 0.012, cycle: 0.052, pan: 0.25 },
  { base: 48, interval: 1.018, filter: 580, hiss: 0.020, low: 0.012, air: 0.017, cycle: 0.036, pan: -0.32 },
  { base: 46, interval: 1.036, filter: 870, hiss: 0.014, low: 0.033, air: 0.015, cycle: 0.13, pan: 0.08 },
] as const;

function getNoiseBuffer(audio: AudioContext) {
  if(noiseCache?.audio===audio)return noiseCache.buffer;
  const size=Math.round(audio.sampleRate*1.8);
  const buffer=audio.createBuffer(1,size,audio.sampleRate);
  const values=buffer.getChannelData(0);
  // A deterministic noise source: the room texture is reproducible on reload,
  // never allocates fresh white-noise sample arrays on every room change.
  let seed=0x0130adfa;
  for(let i=0;i<size;i++){
    seed ^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
    values[i]=((seed>>>0)/4294967295)*2-1;
  }
  noiseCache={audio,buffer};
  return buffer;
}

export function stopRoomTone(){
  const current=texture;
  if(!current)return;
  texture=null;
  const {audio,output,sources,nodes}=current;
  const now=audio.currentTime;
  try{
    output.gain.cancelScheduledValues(now);
    output.gain.setTargetAtTime(0,now,.045);
  }catch{}
  for(const source of sources){
    try{source.stop(now+.24)}catch{}
  }
  // Let the compressor settle before unlinking. Separate outgoing/incoming
  // generators briefly crossfade to avoid sudden gaps or clicks.
  window.setTimeout(()=>{
    for(const node of nodes){
      try{node.disconnect()}catch{}
    }
  },420);
}

export function startRoomTone(room:number){
  stopRoomTone();
  if(typeof document!=="undefined"&&document.hidden)return;
  const bus=getHorrorScoreBus();
  if(!bus || bus.audio.state!=="running")return;
  const {audio,output:master}=bus;
  const conf=ROOMS[Math.max(0,Math.min(3,room))] ?? ROOMS[0];
  const out=audio.createGain();
  const spatial=audio.createStereoPanner();
  const lowpass=audio.createBiquadFilter();
  const wash=audio.createGain();
  const bottom=audio.createGain();
  const breath=audio.createOscillator();
  const lfo=audio.createGain();
  const core=audio.createOscillator();
  const echo=audio.createOscillator();
  const hiss=audio.createBufferSource();
  const highpass=audio.createBiquadFilter();
  const toneFilter=audio.createBiquadFilter();
  const now=audio.currentTime;

  out.gain.setValueAtTime(0,now);
  out.gain.setTargetAtTime(.54,now,.75);
  spatial.pan.value=conf.pan;
  out.connect(spatial);
  spatial.connect(master);

  hiss.buffer=getNoiseBuffer(audio);
  hiss.loop=true;
  highpass.type="highpass";
  highpass.frequency.value=75;
  lowpass.type="lowpass";
  lowpass.frequency.value=conf.filter;
  wash.gain.value=conf.hiss;
  hiss.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(wash);
  wash.connect(out);

  toneFilter.type="lowpass";
  toneFilter.frequency.value=room===3?180:room===2?125:105;
  bottom.gain.value=conf.low;
  core.type="sine";
  core.frequency.value=conf.base;
  echo.type=room===3?"triangle":"sine";
  echo.frequency.value=conf.base*conf.interval;
  core.connect(toneFilter);
  echo.connect(toneFilter);
  toneFilter.connect(bottom);
  bottom.connect(out);

  // Slow movement, the house has breath rather than a static loop.
  breath.type="sine";
  breath.frequency.value=conf.cycle;
  lfo.gain.value=conf.air;
  breath.connect(lfo);
  lfo.connect(bottom.gain);

  const sources:AudioScheduledSourceNode[]=[hiss,core,echo,breath];
  texture={
    audio,output:out,sources,
    nodes:[out,spatial,lowpass,wash,bottom,breath,lfo,core,echo,hiss,highpass,toneFilter],
  };
  for(const source of sources)source.start(now);
}

/** Exposed for smoke diagnostics; never leaks hardware or audio settings. */
export function roomToneActive():boolean{return texture!==null;}
