"use client";
import { useRef } from "react";
export default function LightReveal({accent,kicker,title,secret,hint,revealedLabel,ariaLabel,revealed,onReveal}:{accent:string;kicker:string;title:string;secret:string;hint:string;revealedLabel:string;ariaLabel:string;revealed:boolean;onReveal:()=>void}){
  const ref=useRef<HTMLButtonElement>(null);
  const positionLight=(clientX:number,clientY:number)=>{const node=ref.current;if(!node)return;const rect=node.getBoundingClientRect();node.style.setProperty("--light-x",`${clientX-rect.left}px`);node.style.setProperty("--light-y",`${clientY-rect.top}px`)};
  return <button data-action="light-reveal" ref={ref} type="button" className={`thi-light-reveal ${revealed?"revealed":""}`} style={{"--light-accent":accent} as React.CSSProperties}
    onPointerMove={e=>positionLight(e.clientX,e.clientY)} onPointerDown={e=>{positionLight(e.clientX,e.clientY);onReveal()}}
    onFocus={()=>{const node=ref.current;if(!node)return;node.style.setProperty("--light-x","50%");node.style.setProperty("--light-y","50%")}} aria-label={ariaLabel}>
    <span className="thi-light-ambient" aria-hidden="true"><i/><i/><i/><i/><i/></span><span className="thi-light-ghost">{secret}</span>
    <span className="thi-light-secret"><small>{kicker}</small><strong>{title}</strong><p>{secret}</p></span><span className="thi-light-lens" aria-hidden="true"/>
    <em>{revealed?revealedLabel:hint}</em>
  </button>;
}
