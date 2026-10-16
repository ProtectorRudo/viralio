"use client";
import { useEffect,useRef,useState } from "react";
import RubyHeart from "./RubyHeart";

type HoldPhase="idle"|"holding"|"almost"|"there"|"complete";

export default function HoldReveal({
  accent,symbol,prompt,reveal,instruction,revealed,onReveal,cinematic=false,heartbeat=false,
}:{
  accent:string;symbol:string;prompt:string;reveal:string;instruction:string;revealed:boolean;onReveal:()=>void;cinematic?:boolean;heartbeat?:boolean;
}){
  const buttonRef=useRef<HTMLButtonElement>(null);
  const frameRef=useRef<number|null>(null);
  const startedAtRef=useRef<number|null>(null);
  const completedRef=useRef(false);
  const [phase,setPhase]=useState<HoldPhase>("idle");
  const [soundEnabled,setSoundEnabled]=useState(true);
  const heartbeatAudioRef=useRef<{context:AudioContext;output:GainNode}|null>(null);

  // Playback only starts during a visitor gesture, to respect mobile browser policies.
  const stopHeartbeat=()=>{
    const active=heartbeatAudioRef.current;
    heartbeatAudioRef.current=null;
    if(!active)return;
    const {context,output}=active;
    try{
      const now=context.currentTime;
      output.gain.cancelScheduledValues(now);
      output.gain.setValueAtTime(Math.max(.0001,output.gain.value),now);
      output.gain.exponentialRampToValueAtTime(.0001,now+.055);
      window.setTimeout(()=>{void context.close().catch(()=>{})},110);
    }catch{void context.close().catch(()=>{})}
  };

  const startHeartbeat=()=>{
    if(!heartbeat||!soundEnabled||typeof window==="undefined")return;
    stopHeartbeat();
    try{
      const AudioCtor=window.AudioContext||(window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
      if(!AudioCtor)return;
      const context=new AudioCtor();
      if(context.state==="suspended")void context.resume().catch(()=>{});
      const output=context.createGain();
      output.gain.value=.72;
      output.connect(context.destination);
      heartbeatAudioRef.current={context,output};
      const start=context.currentTime+.025;
      // Two soft, organic sounds per heartbeat, growing toward the reveal.
      const noise=context.createBuffer(1,Math.ceil(context.sampleRate*.16),context.sampleRate);
      const samples=noise.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      const pulses=[
        [0.05,.61,false],[.23,.38,true],
        [.86,.72,false],[1.05,.43,true],
        [1.67,.84,false],[1.86,.55,true],
        [2.47,1.05,false],[2.66,.71,true],
      ] as const;
      for(const [offset,strength,dub] of pulses){
        const at=start+offset;
        const length=dub?.115:.145;
        const oscillator=context.createOscillator();
        const toneGain=context.createGain();
        oscillator.type="triangle";
        oscillator.frequency.setValueAtTime(dub?165:137,at);
        oscillator.frequency.exponentialRampToValueAtTime(dub?97:73,at+length);
        toneGain.gain.setValueAtTime(.0001,at);
        toneGain.gain.exponentialRampToValueAtTime((dub?.07:.12)*strength,at+.017);
        toneGain.gain.exponentialRampToValueAtTime(.0001,at+length);
        oscillator.connect(toneGain);
        toneGain.connect(output);
        oscillator.start(at);
        oscillator.stop(at+length+.02);

        const breath=context.createBufferSource();
        breath.buffer=noise;
        const filter=context.createBiquadFilter();
        filter.type="lowpass";
        filter.frequency.value=270;
        const textureGain=context.createGain();
        textureGain.gain.setValueAtTime(.0001,at);
        textureGain.gain.exponentialRampToValueAtTime(.018*strength,at+.012);
        textureGain.gain.exponentialRampToValueAtTime(.0001,at+length);
        breath.connect(filter);
        filter.connect(textureGain);
        textureGain.connect(output);
        breath.start(at);
        breath.stop(at+length+.005);
      }
    }catch{stopHeartbeat()} // Never block the interactive scene if audio is unavailable.
  };
  const duration=cinematic?2850:1350;

  const setVisualProgress=(progress:number)=>{
    const degrees=Math.round(progress*360);
    const button=buttonRef.current;
    button?.style.setProperty("--hold-progress",`${degrees}deg`);
    button?.style.setProperty("--hold-charge",progress.toFixed(3));
    button?.style.setProperty("--hold-glow",`${Math.round(70+progress*55)}px`);
    button?.style.setProperty("--hold-core-scale",(1+progress*.035).toFixed(3));
    button?.style.setProperty("--hold-heart-scale",(.95+progress*.11).toFixed(3));
    button?.style.setProperty("--hold-halo-opacity",(.18+progress*.7).toFixed(3));
    button?.parentElement?.style.setProperty("--hold-atmosphere-scale",(.92+progress*.13).toFixed(3));
    button?.parentElement?.style.setProperty("--hold-progress-ratio",progress.toFixed(3));
  };

  const reset=()=>{
    if(frameRef.current!==null)cancelAnimationFrame(frameRef.current);
    frameRef.current=null;
    startedAtRef.current=null;
    stopHeartbeat();
    if(!completedRef.current){
      setVisualProgress(0);
      setPhase("idle");
    }
  };

  const finish=()=>{
    if(completedRef.current||revealed)return;
    completedRef.current=true;
    setVisualProgress(1);
    setPhase("complete");
    stopHeartbeat();
    onReveal();
  };

  const begin=()=>{
    if(revealed||completedRef.current)return;
    reset();
    startHeartbeat();
    setPhase("holding");
    startedAtRef.current=performance.now();
    const tick=(now:number)=>{
      const started=startedAtRef.current;
      if(started===null)return;
      const progress=Math.min(1,(now-started)/duration);
      setVisualProgress(progress);
      if(cinematic){
        if(progress>=.76)setPhase("there");
        else if(progress>=.38)setPhase("almost");
        else setPhase("holding");
      }
      if(progress>=1){finish();return}
      frameRef.current=requestAnimationFrame(tick);
    };
    frameRef.current=requestAnimationFrame(tick);
  };

  useEffect(()=>{
    if(!revealed)completedRef.current=false;
    return ()=>{
      if(frameRef.current!==null)cancelAnimationFrame(frameRef.current);
      frameRef.current=null;
      startedAtRef.current=null;
      stopHeartbeat();
    };
  },[revealed]);

  const mainLabel=cinematic
    ? phase==="idle"?prompt:phase==="holding"?"Mantenelo…":phase==="almost"?"Un poquito más…":phase==="there"?"Ahí…":reveal
    : prompt;
  const subLabel=cinematic
    ? phase==="idle"?instruction:phase==="holding"?"no lo sueltes todavía":phase==="almost"?"ya casi":phase==="there"?"sentilo":instruction
    : instruction;

  return <div
    className={`thi-hold-reveal ${cinematic?"cinematic ":""}${heartbeat?"ruby ":""}phase-${phase} ${revealed?"revealed":""}`}
    style={{"--hold-accent":accent} as React.CSSProperties}
    data-hold-phase={phase}
  >
    <span className="thi-hold-atmosphere" aria-hidden="true"><i/><i/><i/><i/></span>
    <span className="thi-hold-rings" aria-hidden="true"><i/><i/><i/></span>
    {heartbeat&&<span className="thi-ruby-light-field" aria-hidden="true"><i/><i/><i/><i/><i/><i/></span>}
    <button
      data-action="hold"
      ref={buttonRef}
      type="button"
      className="thi-hold-core"
      onPointerDown={e=>{try{e.currentTarget.setPointerCapture(e.pointerId)}catch{};begin()}}
      onPointerUp={reset}
      onPointerCancel={reset}
      onPointerLeave={e=>{if(!e.currentTarget.hasPointerCapture?.(e.pointerId))reset()}}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();finish()}}}
      aria-label={revealed?reveal:mainLabel}
    >
      <span className="thi-hold-heart">{heartbeat?<RubyHeart/>:symbol}</span>
      <i aria-hidden="true"/>
      <b aria-hidden="true"/>
    </button>
    {heartbeat&&!revealed&&<span className="thi-ruby-meter" aria-hidden="true"><i/></span>}
    {heartbeat&&!revealed&&<button
      type="button"
      className="thi-ruby-audio-toggle"
      aria-label={soundEnabled?"Silenciar los latidos":"Activar los latidos"}
      aria-pressed={soundEnabled}
      onClick={()=>{if(soundEnabled)stopHeartbeat();setSoundEnabled(value=>!value)}}
    >{soundEnabled?"♪ Sonido":"♪ Silenciado"}</button>}
    {!revealed
      ? <div className="thi-hold-copy"><strong>{mainLabel}</strong><small>{subLabel}</small></div>
      : <p>{reveal}</p>}
  </div>;
}
