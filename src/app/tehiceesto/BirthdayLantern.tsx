"use client";
import {useRef,useState,useEffect,type PointerEvent as PE,type CSSProperties} from "react";
const targets=[{x:24,y:32},{x:73,y:28},{x:47,y:72}];
export type BirthdayMemoryPhoto={url:string;position?:string};
export default function BirthdayLantern({clues,closing,completed,onComplete,photos=[]}:{clues:string[];closing:string;completed:boolean;onComplete:()=>void;photos?:BirthdayMemoryPhoto[]}){
 const root=useRef<HTMLDivElement>(null),pressed=useRef(false);
 const [found,setFound]=useState<number[]>([]),[selected,setSelected]=useState<number|null>(null),[active,setActive]=useState(false);
 useEffect(()=>{if(found.length===3&&!completed)onComplete()},[found.length,completed,onComplete]);
 const discover=(i:number)=>{if(completed||found.includes(i))return;setSelected(i);setFound(old=>old.includes(i)?old:[...old,i])};
 const scan=(e:PE<HTMLDivElement>,force=false)=>{const node=root.current;if(!node)return;const rect=node.getBoundingClientRect();const x=Math.max(0,Math.min(rect.width,e.clientX-rect.left));const y=Math.max(0,Math.min(rect.height,e.clientY-rect.top));node.style.setProperty("--fx",x+"px");node.style.setProperty("--fy",y+"px");setActive(true);if(!pressed.current&&!force)return;const i=targets.findIndex((p,j)=>!found.includes(j)&&Math.hypot(x-rect.width*p.x/100,y-rect.height*p.y/100)<Math.min(110,rect.width*.3));if(i>=0)discover(i)};
 return <div className="thi-bday-lantern">
  <div className="thi-bday-lantern-status"><span>BUSCÁ TRES RECUERDOS ESCONDIDOS</span><b>{found.length} / 3</b></div>
  <div ref={root} className={`thi-bday-lantern-surface ${active?"active":""} ${completed?"complete":""}`} data-action="light-reveal" role="group" aria-label="Explorar tres recuerdos con la linterna" style={{"--fx":"50%","--fy":"50%"} as CSSProperties}
   onPointerDown={e=>{pressed.current=true;try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}scan(e,true)}}
   onPointerMove={e=>scan(e)} onPointerUp={e=>{scan(e,true);pressed.current=false;try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}}} onPointerCancel={()=>{pressed.current=false}}>
   <div className="thi-bday-lantern-dusk" aria-hidden="true"><i/><i/><i/></div>
   {targets.map((p,i)=><button type="button" data-action={`birthday-light-${i+1}`} key={i} className={`thi-bday-lantern-card n${i+1} ${found.includes(i)?"found":""}`} style={{left:p.x+"%",top:p.y+"%"}} onClick={()=>discover(i)} aria-label={`Descubrir recuerdo ${i+1}`}><span className="thi-bday-lantern-photo">{photos[i]?.url?<img src={photos[i].url} alt="" draggable={false} loading="eager" decoding="async" referrerPolicy="no-referrer" style={{objectPosition:photos[i].position||"center"}}/>:<span className="thi-bday-lantern-glyph">{["✦","♡","✳"][i]}</span>}</span><small>{found.includes(i)?`RECUERDO ${i+1}`:"ACÁ HAY ALGO"}</small></button>)}
   <div className="thi-bday-lantern-darkness" aria-hidden="true"/>
   <div className="thi-bday-lantern-beam" aria-hidden="true"/>
   <p className="thi-bday-lantern-instruction">{active?"Seguís cerca. Iluminá los otros rincones.":"Deslizá el dedo para encontrar los recuerdos."}</p>
  </div>
  <div className="thi-bday-lantern-story" aria-live="polite">{completed?<div><small>AHORA PODÉS VERLO TODO</small><p>{closing}</p></div>:selected===null?<p>Tres momentos para encontrar despacio.</p>:<div key={selected}><small>RECUERDO {selected+1} DESCUBIERTO</small><p>{clues[selected]||""}</p></div>}</div>
  <div className="thi-bday-lantern-marks" aria-label={`${found.length} de tres recuerdos`}>{targets.map((_,i)=><i key={i} className={found.includes(i)?"seen":""}/>)}</div>
 </div>;
}