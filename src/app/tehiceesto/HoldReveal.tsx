"use client";
import { useEffect,useRef,useState } from "react";

type HoldPhase="idle"|"holding"|"almost"|"there"|"complete";

export default function HoldReveal({
  accent,symbol,prompt,reveal,instruction,revealed,onReveal,cinematic=false,
}:{
  accent:string;symbol:string;prompt:string;reveal:string;instruction:string;revealed:boolean;onReveal:()=>void;cinematic?:boolean;
}){
  const buttonRef=useRef<HTMLButtonElement>(null);
  const frameRef=useRef<number|null>(null);
  const startedAtRef=useRef<number|null>(null);
  const completedRef=useRef(false);
  const [phase,setPhase]=useState<HoldPhase>("idle");
  const duration=cinematic?2850:1350;

  const setVisualProgress=(progress:number)=>{
    const degrees=Math.round(progress*360);
    buttonRef.current?.style.setProperty("--hold-progress",`${degrees}deg`);
    buttonRef.current?.style.setProperty("--hold-charge",progress.toFixed(3));
  };

  const reset=()=>{
    if(frameRef.current!==null)cancelAnimationFrame(frameRef.current);
    frameRef.current=null;
    startedAtRef.current=null;
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
    onReveal();
  };

  const begin=()=>{
    if(revealed||completedRef.current)return;
    reset();
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
    if(!revealed){
      completedRef.current=false;
      setVisualProgress(0);
      setPhase("idle");
    }
    return reset;
  },[revealed]);

  const mainLabel=cinematic
    ? phase==="idle"?prompt:phase==="holding"?"Mantenelo…":phase==="almost"?"Un poquito más…":phase==="there"?"Ahí…":reveal
    : prompt;
  const subLabel=cinematic
    ? phase==="idle"?instruction:phase==="holding"?"no lo sueltes todavía":phase==="almost"?"ya casi":phase==="there"?"sentilo":instruction
    : instruction;

  return <div
    className={`thi-hold-reveal ${cinematic?"cinematic ":""}phase-${phase} ${revealed?"revealed":""}`}
    style={{"--hold-accent":accent} as React.CSSProperties}
    data-hold-phase={phase}
  >
    <span className="thi-hold-atmosphere" aria-hidden="true"><i/><i/><i/><i/></span>
    <span className="thi-hold-rings" aria-hidden="true"><i/><i/><i/></span>
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
      <span className="thi-hold-heart">{symbol}</span>
      <i aria-hidden="true"/>
      <b aria-hidden="true"/>
    </button>
    {!revealed
      ? <div className="thi-hold-copy"><strong>{mainLabel}</strong><small>{subLabel}</small></div>
      : <p>{reveal}</p>}
  </div>;
}
