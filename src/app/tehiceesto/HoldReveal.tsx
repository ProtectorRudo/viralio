"use client";
import { useEffect,useRef } from "react";
export default function HoldReveal({accent,symbol,prompt,reveal,instruction,revealed,onReveal}:{accent:string;symbol:string;prompt:string;reveal:string;instruction:string;revealed:boolean;onReveal:()=>void}){
  const buttonRef=useRef<HTMLButtonElement>(null);const frameRef=useRef<number|null>(null);const startedAtRef=useRef<number|null>(null);const completedRef=useRef(false);const duration=1350;
  const reset=()=>{if(frameRef.current)cancelAnimationFrame(frameRef.current);frameRef.current=null;startedAtRef.current=null;if(!completedRef.current)buttonRef.current?.style.setProperty("--hold-progress","0deg")};
  const finish=()=>{if(completedRef.current||revealed)return;completedRef.current=true;buttonRef.current?.style.setProperty("--hold-progress","360deg");onReveal()};
  const begin=()=>{if(revealed||completedRef.current)return;reset();startedAtRef.current=performance.now();const tick=(now:number)=>{const started=startedAtRef.current;if(started===null)return;const progress=Math.min(1,(now-started)/duration);buttonRef.current?.style.setProperty("--hold-progress",`${Math.round(progress*360)}deg`);if(progress>=1){finish();return}frameRef.current=requestAnimationFrame(tick)};frameRef.current=requestAnimationFrame(tick)};
  useEffect(()=>{if(!revealed){completedRef.current=false;buttonRef.current?.style.setProperty("--hold-progress","0deg")}return reset},[revealed]);
  return <div className={`thi-hold-reveal ${revealed?"revealed":""}`} style={{"--hold-accent":accent} as React.CSSProperties}>
    <span className="thi-hold-rings" aria-hidden="true"><i/><i/><i/></span>
    <button data-action="hold" ref={buttonRef} type="button" className="thi-hold-core" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);begin()}} onPointerUp={reset} onPointerCancel={reset} onPointerLeave={reset} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();finish()}}} aria-label={prompt}><span>{symbol}</span><i aria-hidden="true"/></button>
    {!revealed?<><strong>{prompt}</strong><small>{instruction}</small></>:<p>{reveal}</p>}
  </div>;
}
