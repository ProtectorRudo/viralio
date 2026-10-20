"use client";

import {useCallback,useEffect,useRef,useState,type CSSProperties,type KeyboardEvent as ReactKeyboardEvent,type PointerEvent as ReactPointerEvent} from "react";
import "./BirthdayWishOrb.css";

const HOLD_MS=3000;
type Props={
  kicker:string;title:string;subtitle:string;prompt:string;instruction:string;
  reveal:string;signature:string;cta:string;revealed:boolean;onReveal:()=>void;onContinue:()=>void;
};
const flecks=[
  [-112,-42,0],[-70,-108,.4],[8,-127,.9],[93,-99,1.6],
  [131,-20,.6],[108,76,1.1],[48,117,1.8],[-43,126,.2],
  [-115,76,1.4],[-139,10,.8],[53,-113,2.3],[132,44,1.5]
] as const;

export default function BirthdayWishOrb({
  kicker,title,subtitle,prompt,instruction,reveal,signature,cta,revealed,onReveal,onContinue,
}:Props){
  const [charge,setCharge]=useState(revealed?1:0);
  const [holding,setHolding]=useState(false);
  const [wasReleased,setWasReleased]=useState(false);
  const [phase,setPhase]=useState<"idle"|"warming"|"glowing"|"nearly"|"revealed">(revealed?"revealed":"idle");
  const chargeRef=useRef(revealed?1:0);
  const pressedRef=useRef(false);
  const doneRef=useRef(revealed);
  const lastRef=useRef<number|null>(null);
  const rafRef=useRef<number|null>(null);
  const revealRef=useRef(onReveal);
  useEffect(()=>{revealRef.current=onReveal},[onReveal]);

  const complete=useCallback(()=>{
    if(doneRef.current)return;
    doneRef.current=true;pressedRef.current=false;
    chargeRef.current=1;setCharge(1);setHolding(false);setPhase("revealed");
    if(typeof navigator!=="undefined"&&"vibrate" in navigator)navigator.vibrate?.([18,45,23]);
    revealRef.current();
  },[]);

  const tick=useCallback(function animateFrame(now:number){
    const dt=Math.max(0,lastRef.current===null?0:now-lastRef.current);
    lastRef.current=now;
    if(doneRef.current){rafRef.current=null;return}
    const prev=chargeRef.current;
    const next=pressedRef.current?Math.min(1,prev+dt/HOLD_MS):Math.max(0,prev-dt/1750);
    chargeRef.current=next;
    setCharge(next);
    if(next>=1){complete();rafRef.current=null;return}
    if(pressedRef.current)setPhase(next>.83?"nearly":next>.43?"glowing":"warming");
    else if(next===0)setPhase("idle");
    if(pressedRef.current||next>0)rafRef.current=requestAnimationFrame(animateFrame);
    else{rafRef.current=null;lastRef.current=null}
  },[complete]);

  const start=()=>{
    if(doneRef.current||pressedRef.current||revealed)return;
    pressedRef.current=true;setHolding(true);setWasReleased(false);
    setPhase(chargeRef.current>.4?"glowing":"warming");
    lastRef.current=null;
    if(typeof navigator!=="undefined"&&"vibrate" in navigator)navigator.vibrate?.(7);
    if(rafRef.current===null)rafRef.current=requestAnimationFrame(tick);
  };
  const stop=()=>{
    if(!pressedRef.current||doneRef.current)return;
    pressedRef.current=false;setHolding(false);setWasReleased(true);
    if(rafRef.current===null){lastRef.current=null;rafRef.current=requestAnimationFrame(tick)}
  };

  useEffect(()=>{
    if(revealed&&!doneRef.current){doneRef.current=true;chargeRef.current=1}
  },[revealed]);
  useEffect(()=>()=>{if(rafRef.current!==null)cancelAnimationFrame(rafRef.current);pressedRef.current=false},[]);

  const pointerStart=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    if(!event.isPrimary)return;
    event.preventDefault();
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
    start();
  };
  const pointerEnd=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    stop();
    try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };
  const keyStart=(event:ReactKeyboardEvent<HTMLButtonElement>)=>{
    if(event.key!==" "&&event.key!=="Enter")return;
    event.preventDefault();if(!event.repeat)start();
  };
  const keyEnd=(event:ReactKeyboardEvent<HTMLButtonElement>)=>{
    if(event.key!==" "&&event.key!=="Enter")return;
    event.preventDefault();stop();
  };

  const completed=revealed||phase==="revealed";
  const lines=reveal.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return <section className={`thi-scene thi-scene-rich thi-birthday-wish-orb ${completed?"is-revealed":""} ${holding?"is-holding":""}`}
      style={{"--wish-charge":`${Math.round(charge*100)}%`,"--wish-energy":charge.toFixed(3)} as CSSProperties}>
    <div className="thi-wish-orb-ambient" aria-hidden="true"/>
    <header className="thi-wish-orb-header">
      <p className="thi-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>

    <div className="thi-wish-orb-theatre">
      <div className="thi-wish-orb-background-glow" aria-hidden="true"/>
      {flecks.map(([x,y,delay],i)=><i className="thi-wish-orb-fleck" key={i}
        style={{"--fx":`${x}px`,"--fy":`${y}px`,"--fd":`${delay}s`} as CSSProperties} aria-hidden="true"/>)}
      <button type="button" data-action="hold" className="thi-wish-orb-interactive"
        aria-label={completed?"Deseo revelado":`${prompt}. Mantené presionado tres segundos.`}
        aria-describedby="thi-wish-orb-instructions" disabled={completed}
        onPointerDown={pointerStart} onPointerUp={pointerEnd} onPointerCancel={stop}
        onLostPointerCapture={stop} onKeyDown={keyStart} onKeyUp={keyEnd} onBlur={stop}>
        <span className="thi-wish-orb-hold-ring" aria-hidden="true"/>
        <span className="thi-wish-orb-sphere" aria-hidden="true">
          <span className="thi-wish-orb-depth"/>
          <span className="thi-wish-orb-internal-light"/>
          <span className="thi-wish-orb-glass"/>
          <span className="thi-wish-orb-shine"/>
          <span className="thi-wish-orb-star">✧</span>
          <span className="thi-wish-orb-rim"/>
        </span>
        <span className="thi-wish-orb-touch-point" aria-hidden="true"/>
      </button>
      <p className="thi-wish-orb-instruction" id="thi-wish-orb-instructions" aria-live="polite">
        {completed?"El deseo ya es tuyo.":holding?
          phase==="nearly"?"Ya casi… mantené un poquito más.":phase==="glowing"?"Está despertando…":"No lo sueltes todavía…":
          wasReleased&&charge>0?"Casi. Mantenela un poquito más.":prompt}
      </p>
      {!completed&&<p className="thi-wish-orb-microcopy">{instruction}</p>}
      {!completed&&<button type="button" className="thi-wish-orb-access" data-action="hold-accessible" onClick={complete}>
        ¿No podés mantener presionado? Revelar igual
      </button>}
    </div>

    {completed&&<div className="thi-wish-orb-message" aria-live="polite" data-wish-revealed="true">
      <div className="thi-wish-orb-message-edge" aria-hidden="true"/>
      <span className="thi-wish-orb-message-seal" aria-hidden="true">✦</span>
      <span className="thi-wish-orb-message-label">NUESTRO DESEO PARA VOS</span>
      <div className="thi-wish-orb-message-lines">
        {lines.map((line,i)=><p key={i} style={{"--line-index":i} as CSSProperties}>{line}</p>)}
      </div>
      <p className="thi-wish-orb-message-signature">{signature}</p>
      <button type="button" className="thi-wish-orb-continue" data-action="advance"
        onClick={onContinue}><span>{cta.replace(/\s*[→➜]\s*$/,"")}</span><span aria-hidden="true">→</span></button>
    </div>}
  </section>;
}
