/**
 * CASO M — original cinematic horror underscore, offline-rendered PCM.
 * Designed for PHONE SPEAKERS: audible mid-frequency strings, brushed metal,
 * dark evolving cello chords, heartbeat and room noise. No sustained beep.
 * Public-domain-free original synthesis; no external music dependencies.
 */
import {writeFileSync} from "node:fs";
const sr=22050, duration=32, N=sr*duration, out=new Float32Array(N);
let seed=1302613;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const sin=Math.sin,PI=Math.PI;
const notes=[
 [65.406,97.999,138.591,196.0],
 [61.735,92.499,130.813,184.998],
 [58.270,87.307,123.471,174.614],
 [55.000,82.407,116.541,164.814]
];
let brown=0,wind=0,pink=0,bright=0;
for(let i=0;i<N;i++){
 const t=i/sr,bar=Math.min(3,Math.floor(t/8)),section=t%8;
 const current=notes[bar],next=notes[(bar+1)%4],xfade=smooth((section-6.1)/1.9);
 const breath=.73+.15*sin(2*PI*.085*t)+.1*sin(2*PI*.21*t);
 const flutter=.88+.12*sin(2*PI*(1.8+.25*sin(t*.16))*t);
 let strings=0;
 for(let j=0;j<4;j++){
  const frequency=current[j]*(1-xfade)+next[j]*xfade;
  const detune=(j-1.5)*.012+.0023*sin(t*(.34+j*.07));
  // Bowed harmonics deliberately detuned, with moving formants.
  const phase=2*PI*frequency*(1+detune)*t;
  const bow=sin(phase)+.21*sin(phase*2.006)+.12*sin(phase*3.015);
  const muted=.65+.35*sin(2*PI*(.4+j*.07)*t+j);
  strings+=bow*muted*[.10,.085,.064,.041][j];
 }
 const raw=random();brown=brown*.994+raw*.006;pink=pink*.81+raw*.19;
 wind=wind*.969+raw*.031;
 bright=bright*.3+raw*.7;
 // Wind through a ventilation shaft rises and falls to expose the texture.
 const draft=(brown*.55+wind*.20+pink*.025)*(1+.5*sin(2*PI*.055*t));
 // Distant irregular metal strike, not a clean note.
 let metal=0;
 for(const at of [5.3,14.2,22.45,28.2]){
  const dt=t-at;if(dt<0||dt>2.5)continue;
  const e=(1-Math.exp(-dt*35))*Math.exp(-dt*2.5);
  metal+=e*(sin(2*PI*391*dt)+.43*sin(2*PI*527.3*dt)
       +.25*sin(2*PI*721.9*dt)+.13*bright)*.055;
 }
 // Soft rhythmic pressure pulses feel like a heartbeat, never like a ping.
 const period=1.8,beat=(t+.15)%period;
 let pulse=0;
 for(const offset of [0,.23]){
  const dt=beat-offset;if(dt<0||dt>.33)continue;
  const fall=Math.exp(-dt*22);
  pulse+=fall*sin(2*PI*(57*dt-24*dt*dt))*(offset===0?.098:.067);
 }
 // Pizzicato low-string gesture appears between ambient changes.
 const stabT=(t+1.2)%8;
 const stab=stabT<1.65?(sin(2*PI*current[1]*stabT)+.19*sin(2*PI*current[2]*stabT*1.009))
       *.057*Math.exp(-stabT*3):0;
 // Deep unsettling swell with scraped airy overtones is the dominant texture.
 const swell=.21+.12*sin(2*PI*.045*t)+.10*sin(2*PI*.11*t+1.2);
 const ominous=sin(2*PI*76.1*t+sin(2*PI*.32*t)*.04)*.037
   +sin(2*PI*114.7*t)*.027;
 const fade=Math.min(1,t/1.3,(duration-t)/1.3);
 out[i]=(strings*breath*flutter +draft*.35+metal+pulse+stab+
   ominous+swell*wind*.44)*clamp(fade,0,1);
}
// Four short delays broaden the room and soften string edges.
for(const [sec,amount] of [[.093,.14],[.167,.13],[.277,.10],[.411,.07]]){
 const lag=Math.round(sec*sr);
 for(let i=lag;i<N;i++)out[i]+=out[i-lag]*amount;
}
let peak=0;for(const v of out)peak=Math.max(peak,Math.abs(v));
const scale=peak>0?.76/peak:1;
const wav=Buffer.alloc(44+N*2);
wav.write("RIFF",0);wav.writeUInt32LE(36+N*2,4);
wav.write("WAVEfmt ",8);wav.writeUInt32LE(16,16);
wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*2,28);
wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write("data",36);wav.writeUInt32LE(N*2,40);
for(let i=0;i<N;i++)wav.writeInt16LE(Math.round(clamp(out[i]*scale,-1,1)*32767),44+i*2);
export function writeSuspenseSoundtrack(output){
 writeFileSync(output,wav);return {seconds:duration,bytes:wav.length,sampleRate:sr};
}
