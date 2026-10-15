"use client";

import {useRef,useState} from "react";

type Slot="centro"|"banda derecha"|"banda izquierda"|"medialuna"|"primer palo"|"segundo palo";
const slots:{id:Slot;x:number;y:number;label:string}[]=[
 {id:"centro",x:49,y:48,label:"Centro"},
 {id:"banda derecha",x:81,y:16,label:"Banda derecha"},
 {id:"banda izquierda",x:19,y:22,label:"Banda izquierda"},
 {id:"medialuna",x:68,y:54,label:"Medialuna"},
 {id:"primer palo",x:90,y:38,label:"Primer palo"},
 {id:"segundo palo",x:90,y:69,label:"Segundo palo"}
];
const jerseys=[7,10,9];

export default function MagneticTactics({
 moves,onChange
}:{moves:string[];onChange:(next:string[])=>void}){
 const [chosen,setChosen]=useState(0);
 const [drag,setDrag]=useState<{index:number;x:number;y:number}|null>(null);
 const board=useRef<HTMLDivElement>(null);
 const update=(index:number,position:string)=>{
  const next=[...moves];next[index]=position;onChange(next);
 };
 const pickAt=(x:number,y:number)=>{
  const el=board.current;if(!el)return null;
  const rect=el.getBoundingClientRect();
  const nx=(x-rect.left)/rect.width*100;
  const ny=(y-rect.top)/rect.height*100;
  const closest=slots.map(s=>({s,d:Math.hypot(nx-s.x,ny-s.y)})).sort((a,b)=>a.d-b.d)[0];
  return closest && closest.d<15?closest.s.id:null;
 };
 return <section className="lj-magnet-system" aria-label="Pizarra magnética táctica">
  <div className="lj-magnet-bar"><strong>PIZARRA / RECONSTRUCCIÓN</strong><span>DESLIZÁ UNA FICHA HACIA SU DESTINO</span></div>
  <div className="lj-magnet-board" ref={board}>
   <div className="lj-magnet-midline"/><div className="lj-magnet-circle"/>
   <div className="lj-magnet-goal" aria-hidden="true">ARCO →</div>
   {slots.map(slot=><button type="button" key={slot.id}
    className="lj-magnet-slot"
    style={{left:slot.x+"%",top:slot.y+"%"}}
    aria-label={"Mover jugador "+jerseys[chosen]+" a "+slot.label.toLowerCase()}
    onClick={()=>update(chosen,slot.id)}>
     <span>{slot.label}</span>
    </button>)}
   {[7,10,9].map((player,index)=>{
    const slot=slots.find(s=>s.id===moves[index])||slots[0];
    const x=drag?.index===index?drag.x:slot.x,y=drag?.index===index?drag.y:slot.y;
    return <button type="button" key={player}
     className={"lj-magnet-player "+(chosen===index?"is-selected":"")+(drag?.index===index?" is-dragging":"")}
     style={{left:x+"%",top:y+"%"}}
     aria-pressed={chosen===index}
     aria-label={"Jugador "+player}
     onClick={()=>setChosen(index)}
     onPointerDown={e=>{
      e.preventDefault();setChosen(index);
      (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      setDrag({index,x,y});
     }}
     onPointerMove={e=>{
      if(!e.currentTarget.hasPointerCapture(e.pointerId))return;
      const rect=board.current?.getBoundingClientRect();if(!rect)return;
      setDrag({index,x:Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100)),
       y:Math.max(0,Math.min(100,(e.clientY-rect.top)/rect.height*100))});
     }}
     onPointerUp={e=>{
      const place=pickAt(e.clientX,e.clientY);
      if(place)update(index,place);
      setDrag(null);
     }}
     onPointerCancel={()=>setDrag(null)}>
     {player}
    </button>;
   })}
  </div>
  <div className="lj-magnet-guide">
   {jerseys.map((n,i)=><button key={n} type="button" aria-pressed={chosen===i}
    className={chosen===i?"is-selected":""} onClick={()=>setChosen(i)}>
     JUGADOR {n} <b>{moves[i].toUpperCase()}</b>
    </button>)}
  </div>
  <p className="lj-replay-guidance">Seleccioná al 7, 10 o 9 y mové la ficha hacia la zona correcta. También podés elegir el jugador y tocar una posición del campo.</p>
 </section>;
}
