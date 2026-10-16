/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef,type CSSProperties,type PointerEvent as ReactPointerEvent } from "react";

type Props={
  accent:string;
  kicker:string;
  title:string;
  secret:string;
  hint:string;
  revealedLabel:string;
  ariaLabel:string;
  revealed:boolean;
  onReveal:()=>void;
  cinematic?:boolean;
  photoUrl?:string;
  photoPosition?:string;
};

export default function LightReveal({
  accent,kicker,title,secret,hint,revealedLabel,ariaLabel,revealed,onReveal,
  cinematic=false,photoUrl,photoPosition="center",
}:Props){
  const ref=useRef<HTMLButtonElement>(null);
  const exploring=useRef(false);
  const lastPoint=useRef<{x:number;y:number}|null>(null);
  const travelled=useRef(0);

  const positionLight=(clientX:number,clientY:number)=>{
    const node=ref.current;
    if(!node)return null;
    const rect=node.getBoundingClientRect();
    const x=Math.max(0,Math.min(rect.width,clientX-rect.left));
    const y=Math.max(0,Math.min(rect.height,clientY-rect.top));
    node.style.setProperty("--light-x",`${x}px`);
    node.style.setProperty("--light-y",`${y}px`);
    return{x,y};
  };

  const beginExploration=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const point=positionLight(event.clientX,event.clientY);
    if(!cinematic||revealed)return;
    exploring.current=true;
    lastPoint.current=point;
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
  };

  const moveLight=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const point=positionLight(event.clientX,event.clientY);
    if(!cinematic||revealed||!exploring.current||!point)return;

    if(lastPoint.current){
      travelled.current+=Math.hypot(point.x-lastPoint.current.x,point.y-lastPoint.current.y);
      const energy=Math.min(1,travelled.current/520);
      ref.current?.style.setProperty("--light-energy",String(energy));
      if(energy>=1){
        exploring.current=false;
        onReveal();
      }
    }
    lastPoint.current=point;
  };

  const finishExploration=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    positionLight(event.clientX,event.clientY);
    if(!cinematic){
      if(!revealed)onReveal();
    }else if(event.pointerType==="mouse"&&!revealed){
      // Desktop keeps click as an accessible shortcut; touch/pen must actually explore.
      onReveal();
    }
    exploring.current=false;
    lastPoint.current=null;
    try{event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };

  if(cinematic){
    return <button
      data-action="light-reveal"
      ref={ref}
      type="button"
      className={`thi-light-reveal thi-light-reveal-cinematic ${revealed?"revealed":""}`}
      style={{"--light-accent":accent,"--light-energy":"0"} as CSSProperties}
      onPointerMove={moveLight}
      onPointerDown={beginExploration}
      onPointerUp={finishExploration}
      onPointerCancel={finishExploration}
      onFocus={()=>{
        const node=ref.current;
        if(!node)return;
        node.style.setProperty("--light-x","50%");
        node.style.setProperty("--light-y","48%");
      }}
      onKeyDown={event=>{
        if((event.key==="Enter"||event.key===" ")&&!revealed){
          event.preventDefault();
          onReveal();
        }
      }}
      aria-label={ariaLabel}
    >
      <span className="thi-light-photo-base" aria-hidden="true">
        {photoUrl&&<img src={photoUrl} alt="" style={{objectPosition:photoPosition}}/>}
      </span>
      <span className="thi-light-photo-reveal" aria-hidden="true">
        {photoUrl&&<img src={photoUrl} alt="" style={{objectPosition:photoPosition}}/>}
      </span>
      <span className="thi-light-beam" aria-hidden="true"/>
      <span className="thi-light-cinema-grain" aria-hidden="true"/>
      <span className="thi-light-cinema-quote">
        <p>{secret}</p>
      </span>
      <em>{revealed?revealedLabel:hint}</em>
    </button>;
  }

  return <button
    data-action="light-reveal"
    ref={ref}
    type="button"
    className={`thi-light-reveal ${revealed?"revealed":""}`}
    style={{"--light-accent":accent} as CSSProperties}
    onPointerMove={event=>positionLight(event.clientX,event.clientY)}
    onPointerDown={event=>positionLight(event.clientX,event.clientY)}
    onPointerUp={finishExploration}
    onPointerCancel={finishExploration}
    onFocus={()=>{
      const node=ref.current;
      if(!node)return;
      node.style.setProperty("--light-x","50%");
      node.style.setProperty("--light-y","50%");
    }}
    onKeyDown={event=>{
      if((event.key==="Enter"||event.key===" ")&&!revealed){
        event.preventDefault();
        onReveal();
      }
    }}
    aria-label={ariaLabel}
  >
    <span className="thi-light-ambient" aria-hidden="true"><i/><i/><i/><i/><i/></span>
    <span className="thi-light-ghost">{secret}</span>
    <span className="thi-light-secret"><small>{kicker}</small><strong>{title}</strong><p>{secret}</p></span>
    <span className="thi-light-lens" aria-hidden="true"/>
    <em>{revealed?revealedLabel:hint}</em>
  </button>;
}
