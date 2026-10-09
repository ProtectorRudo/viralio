"use client";

import { useRef, useState } from "react";
import type { PointerEvent, KeyboardEvent } from "react";
import styles from "./ClockMechanism.module.css";

const FULL=720; // two deliberate turns, with resistance rather than one tap
function normalized(delta:number){return ((delta+540)%360)-180;}

/** Actual tactile winding: Pointer Events, touch capture and keyboard parity. */
export default function ClockMechanism({solved,onSolve}:{solved:boolean;onSolve:()=>void}){
  const [turn,setTurn]=useState(0);
  const [touching,setTouching]=useState(false);
  const pointer=useRef<{id:number;angle:number}|null>(null);
  const complete=useRef(false);
  const angle=turn%360;
  const isSolved=solved||turn>=FULL;
  const progress=isSolved?100:Math.round(turn/FULL*100);
  function advance(delta:number){
    if(isSolved)return;
    const next=Math.min(FULL,Math.max(0,turn+Math.max(0,delta)));
    setTurn(next);
    if(next>=FULL && !complete.current){complete.current=true;onSolve();}
  }
  function angleAt(event:PointerEvent<HTMLElement>){
    const r=event.currentTarget.getBoundingClientRect();
    return Math.atan2(event.clientY-r.top-r.height/2,event.clientX-r.left-r.width/2)*180/Math.PI;
  }
  function begin(event:PointerEvent<HTMLElement>){
    if(isSolved)return;
    pointer.current={id:event.pointerId,angle:angleAt(event)};
    event.currentTarget.setPointerCapture(event.pointerId);
    setTouching(true);
  }
  function move(event:PointerEvent<HTMLElement>){
    if(!pointer.current || pointer.current.id!==event.pointerId || isSolved)return;
    const now=angleAt(event), delta=normalized(now-pointer.current.angle);
    pointer.current.angle=now;
    // Both clockwise winding and the user-friendly manual turn button are supported.
    if(delta>0)advance(Math.min(80,delta));
  }
  function end(){pointer.current=null;setTouching(false);}
  function key(event:KeyboardEvent<HTMLElement>){
    if(["ArrowRight","ArrowUp"," ","Enter"].includes(event.key)){event.preventDefault();advance(45);}
    if(event.key==="End"){event.preventDefault();advance(FULL);}
  }
  return <div className={styles.clockMechanism} data-clock-solved={isSolved?"true":"false"}>
    <div className={styles.titleLine}><span>OBJETO 02 / MECANISMO ORIGINAL</span><span>{isSolved?"◈ RESTAURADO":"◎ DETENIDO"}</span></div>
    <p className={styles.instructions}>El péndulo se detuvo a las 03:13. <strong>Girás la manivela hasta devolverle vida.</strong></p>
    <div className={styles.machine}>
      <div className={styles.engravedRing} aria-hidden="true"><span className={styles.index}>XII</span><span className={styles.index}>III</span><span className={styles.index}>VI</span><span className={styles.index}>IX</span></div>
      <div className={styles.gearOuter} aria-hidden="true"/>
      <div className={styles.mechanism}>
        <div className={styles.pendulum} style={{animationPlayState:isSolved?"running":"paused"}} aria-hidden="true"/>
        <div className={styles.shaft} aria-hidden="true"/>
        <div className={styles.wheel} role="slider" aria-label="Manivela del reloj" tabIndex={0} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={isSolved?"Mecanismo restaurado":progress+" por ciento"} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onKeyDown={key} data-moving={touching?"true":"false"} style={{transform:"rotate("+angle+"deg)"}}>
          <div className={styles.wheelCenter}><b>013</b><small>{isSolved?"✦":"GIRÁ"}</small></div>
          <span className={styles.wheelHandle}/>
        </div>
      </div>
    </div>
    <div className={styles.footer}>
      <div className={styles.meter}><span>RESISTENCIA DEL ENGRANAJE</span><div aria-hidden="true"><i style={{width:progress+"%"}}/></div><small>{progress}%</small></div>
      {!isSolved&&<button className={styles.turnButton} type="button" onClick={()=>advance(90)} aria-label="Girar manivela un cuarto de vuelta">⟳ GIRAR ¼ VUELTA</button>}
    </div>
    {isSolved?<div className={styles.discovery} role="status"><span>◈ GRABADO BAJO EL CRISTAL</span><strong>«La edad sí importa.»</strong><p>Ordená a los habitantes desde quien llegó <em>último</em> hasta quien llegó <em>primero</em>. Las cifras están en los retratos.</p></div>:<p className={styles.note}>Deslizá el engranaje con el dedo en sentido horario, girá la rueda con el mouse o usá el botón. También podés usar las flechas del teclado.</p>}
  </div>;
}
