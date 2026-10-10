/**
 * CASO M — original looping cinematic thriller underscore.
 * Offline-rendered PCM means mobile Chrome plays an actual soundtrack:
 * bowed-string clusters, dark piano, uneasy airy ambience, low percussion.
 * No live oscillators or platform synth required.
 */
import {writeFileSync} from "node:fs";
const sampleRate=22050,duration=28,N=sampleRate*duration;
const audio=new Float32Array(N);
let seed=91318026;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const fade=(t,start,end)=>smooth((t-start)/.9)*(1-smooth((t-end)/1.25));
const tiny=(t,f)=>Math.sin(2*Math.PI*f*t);
const progress=i=>i/sampleRate;
const chords=[
 [55,82.41,110,138.59,164.81],
 [51.91,77.78,103.83,130.81,155.56],
 [48.999,73.42,98,123.47,146.83],
 [46.25,69.30,92.50,116.54,138.59]
];
const chordLength=7,filterA=new Float32Array(chords.length);
let brown=0,air=0;
for(let i=0;i<N;i++){
 const t=progress(i),bar=Math.min(3,Math.floor(t/chordLength));
 const a=chords[bar],local=t-bar*chordLength,next=chords[(bar+1)%4];
 const blend=smooth((local-5.15)/1.85);
 let bowed=0;
 for(let j=0;j<5;j++){
  const f=a[j]*(1-blend)+next[j]*blend;
  const phase=2*Math.PI*(f*t + .007*Math.sin(t*.43+j*2.1));
  const bow=Math.sin(phase)+.29*Math.sin(phase*2.001)+.12*Math.sin(phase*3.003)+.08*Math.sin(phase*4.02);
  const vibrato=1+.015*Math.sin(2*Math.PI*.28*t+j);
  bowed+=bow*vibrato*[.18,.16,.105,.06,.032][j];
 }
 // Floating choir, not a stable electronic tone; it moves and breathes.
 const choir=tiny(t,164.81+.8*Math.sin(t*.37))*.055
 +tiny(t,218.25+.9*Math.sin(t*.51))*.045;
 const noise=random()*2-1;
 brown=brown*.997+noise*.003;
 air=air*.985+noise*.015;
 const airy=(brown*.18+air*.042)*(1+.55*Math.sin(t*.19));
 // Dark piano pulses every 3.5 sec with 3 inharmonic overtones.
 const hit=t%3.5;
 const attack=Math.exp(-hit*1.10)*(1-smooth((hit-.02)/.16));
 const tone=a[1]*2;
 const piano=(tiny(hit,tone)+.30*tiny(hit,tone*2.01)+.12*tiny(hit,tone*3.08))*attack*.19;
 // Dull physical heart-thuds, distant and warm. No high electronic "beeps".
 const beat=t%1.79,thump=beat<.32?Math.sin(2*Math.PI*(48*beat-30*beat*beat))*Math.exp(-beat*22)*.13:0;
 const swell=.76+.20*Math.sin(t*.16)+.10*Math.sin(t*.41);
 const inOut=Math.min(1,t/.48,(duration-t)/.48);
 audio[i]=(bowed*.47+choir+piano+airy+thump)*swell*clamp(inOut,0,1);
}
// Spacious reverb from multiple long diffused delays, no outside samples.
for(const [delay,amount] of [[.117,.22],[.241,.19],[.377,.14],[.557,.10]]){
 const n=Math.round(delay*sampleRate);
 for(let i=n;i<N;i++)audio[i]+=audio[i-n]*amount;
}
let peak=0;
for(const x of audio)peak=Math.max(peak,Math.abs(x));
const scale=peak?0.69/peak:1;
const wav=Buffer.alloc(44+N*2);
wav.write("RIFF",0);wav.writeUInt32LE(36+N*2,4);wav.write("WAVEfmt ",8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);
wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write("data",36);wav.writeUInt32LE(N*2,40);
for(let i=0;i<N;i++)wav.writeInt16LE(Math.round(clamp(audio[i]*scale,-1,1)*32767),44+i*2);
export function writeSuspenseSoundtrack(output){
 writeFileSync(output,wav);
 return {samples:N,seconds:duration,bytes:wav.length};
}
