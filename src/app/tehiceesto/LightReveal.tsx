"use client";

import { useRef,type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

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

  const positionLight=(clientX:number,clientY:number)=>{
    const node=ref.current;
    if(!node)return;
    const rect=node.getBoundingClientRect();
    const x=Math.max(0,Math.min(rect.width,clientX-rect.left));
    const y=Math.max(0,Math.min(rect.height,clientY-rect.top));
    node.style.setProperty("--light-x",`${x}px`);
    node.style.setProperty("--light-y",`${y}px`);
  };

  const move=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    positionLight(event.clientX,event.clientY);
  };

  const start=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    positionLight(event.clientX,event.clientY);
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
  };

  const finish=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    positionLight(event.clientX,event.clientY);
    if(!revealed)onReveal();
    try{event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };

  if(cinematic){
    return <button
      data-action="light-reveal"
      ref={ref}
      type="button"
      className={`thi-light-reveal thi-light-reveal-cinematic ${revealed?"revealed":""}`}
      style={{"--light-accent":accent} as CSSProperties}
      onPointerMove={move}
      onPointerDown={start}
      onPointerUp={finish}
      onPointerCancel={finish}
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
    onPointerMove={move}
    onPointerDown={start}
    onPointerUp={finish}
    onPointerCancel={finish}
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
