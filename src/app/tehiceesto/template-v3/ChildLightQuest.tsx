"use client";
import {useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from "react";

type Props={
  photoUrl?:string; photoPosition?:string; secret:string; hint:string;
  revealed:boolean; onReveal:()=>void;
};
const SEALS=[{x:.21,y:.28,text:"Los primeros días"},{x:.78,y:.43,text:"La luz de tu risa"},{x:.5,y:.78,text:"Nuestro lugar seguro"}];
export default function ChildLightQuest({photoUrl,photoPosition="center",secret,hint,revealed,onReveal}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const pointer=useRef<number|null>(null);
  const prev=useRef<{x:number;y:number}|null>(null);
  const distance=useRef(0);
  const unlocked=useRef(false);
  const [visited,setVisited]=useState<number[]>([]);
  const [exploring,setExploring]=useState(false);
  const found=useRef<number[]>([]);
  const move=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const area=ref.current;if(!area)return;
    const rect=area.getBoundingClientRect();
    const x=Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width));
    const y=Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height));
    area.style.setProperty("--beam-x",`${x*100}%`);
    area.style.setProperty("--beam-y",`${y*100}%`);
    if(pointer.current!==event.pointerId||revealed)return;
    const last=prev.current;
    if(last)distance.current+=Math.hypot((x-last.x)*rect.width,(y-last.y)*rect.height);
    prev.current={x,y};
    let changed=false;
    SEALS.forEach((target,i)=>{
      if(found.current.includes(i))return;
      if(Math.hypot((x-target.x)*rect.width,(y-target.y)*rect.height)<Math.min(rect.width,rect.height)*.2){
        found.current=[...found.current,i];changed=true;
      }
    });
    if(changed)setVisited([...found.current]);
    area.style.setProperty("--beam-strength",String(Math.min(1,.4+distance.current/620)));
    if(found.current.length===3&&distance.current>240&&!unlocked.current){
      unlocked.current=true;setExploring(false);onReveal();
    }
  };
  const begin=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(revealed)return;
    pointer.current=event.pointerId;setExploring(true);
    prev.current=null;
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
    move(event);
  };
  const end=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(pointer.current!==event.pointerId)return;
    pointer.current=null;prev.current=null;setExploring(false);
    try{event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };
  const style={"--beam-x":"50%","--beam-y":"65%","--beam-strength":".4","--quest-image":photoUrl?`url("${photoUrl}")`:"linear-gradient(145deg,#2c484f,#14252e)","--quest-photo-position":photoPosition} as CSSProperties;
  return <div className={`thi-child-lantern ${revealed?"is-revealed":""} ${exploring?"is-exploring":""}`} ref={ref}
    data-action="child-light-quest" data-found={visited.length}
    style={style} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
    onKeyDown={event=>{if((event.key==="Enter"||event.key===" ")&&!revealed){event.preventDefault();found.current=[0,1,2];setVisited([0,1,2]);unlocked.current=true;onReveal()}}}
    role="button" tabIndex={0} aria-label={revealed?"Mensaje descubierto":"Deslizá el dedo por la escena para encontrar las tres luces. Con teclado, Enter revela el mensaje."}>
    <div className="thi-child-lantern-photo" aria-hidden="true"/>
    <div className="thi-child-lantern-darkness" aria-hidden="true"/>
    <div className="thi-child-lantern-light" aria-hidden="true"/>
    <div className="thi-child-lantern-drawings" aria-hidden="true"><span>✧</span><span>⌂</span><span>♡</span><span>✧</span></div>
    {SEALS.map((seal,i)=><span key={i} className={`thi-child-lantern-seal s${i+1} ${visited.includes(i)?"is-found":""}`} style={{left:`${seal.x*100}%`,top:`${seal.y*100}%`}}><b>✦</b><small>{visited.includes(i)?seal.text:""}</small></span>)}
    <div className="thi-child-lantern-message"><small>UN PEDACITO DE NUESTRO UNIVERSO</small><strong>{secret}</strong></div>
    <div className="thi-child-lantern-bottom"><div className="thi-child-lantern-counter"><span>{revealed?"✦":`${visited.length} / 3`}</span><div>{SEALS.map((_,i)=><i key={i} className={visited.includes(i)||revealed?"is-found":""}/>)}</div></div><p>{revealed?"Ahora sí, descubriste nuestra luz.":visited.length===3?"Mové un poquito más la luz…":visited.length?"Seguí buscando las luces escondidas":hint||"Arrastrá la luz con el dedo para descubrir tres recuerdos"}</p></div>
    {!revealed&&<span className="thi-child-lantern-finger" aria-hidden="true">☞</span>}
  </div>;
}
