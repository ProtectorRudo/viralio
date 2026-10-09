"use client";

import {useRef,useState} from "react";
import type {PointerEvent,WheelEvent,KeyboardEvent} from "react";
import styles from "./LockTumblers.module.css";

type Drag={index:number;id:number;last:number};
/**
 * Three physical brass number drums. Turning a wheel is a repeatable
 * mechanical input, not a decorative dial; the existing keyboard remains a
 * secondary accessible option. Never silently accepts an incorrect code.
 */
export default function LockTumblers({
  code,onChange,onConfirm,onTick
}:{
  code:string;onChange:(next:string)=>void;onConfirm:()=>void;onTick?:()=>void
}){
  const drag=useRef<Drag|null>(null);
  const [holding,setHolding]=useState(-1);
  const current=Array.from({length:3},(_,i)=>Number(code[i]||"0"));
  function turn(index:number,delta:number){
    const digits=Array.from({length:3},(_,i)=>Number(code[i]||"0"));
    digits[index]=(digits[index]+delta%10+10)%10;
    onChange(digits.join(""));
    onTick?.();
  }
  function grab(event:PointerEvent<HTMLDivElement>,index:number){
    if(!event.isPrimary)return;
    drag.current={index,id:event.pointerId,last:event.clientY};
    event.currentTarget.setPointerCapture(event.pointerId);
    setHolding(index);
  }
  function move(event:PointerEvent<HTMLDivElement>,index:number){
    if(!drag.current || drag.current.index!==index||drag.current.id!==event.pointerId)return;
    const difference=drag.current.last-event.clientY;
    if(Math.abs(difference)>=19){
      const count=Math.min(7,Math.floor(Math.abs(difference)/19));
      turn(index,Math.sign(difference)*count);
      drag.current.last+=Math.sign(difference)*-19*count;
    }
  }
  function release(){drag.current=null;setHolding(-1);}
  function wheel(event:WheelEvent<HTMLDivElement>,index:number){
    // Wheel is optional: keyboard and touch buttons remain full-featured.
    if(Math.abs(event.deltaY)<1)return;
    turn(index,event.deltaY<0?1:-1);
  }
  function key(event:KeyboardEvent<HTMLDivElement>,index:number){
    if(event.key==="ArrowUp"||event.key==="ArrowRight"){event.preventDefault();turn(index,1);}
    else if(event.key==="ArrowDown"||event.key==="ArrowLeft"){event.preventDefault();turn(index,-1);}
    else if(event.key==="Enter" && code.length===3){event.preventDefault();onConfirm();}
  }
  return <div className={styles.case} data-lock-dials aria-label="Combinación mecánica de tres discos">
    <div className={styles.header}><span>◈ CERRADURA VÉLEZ · 1891</span><span>MODELO 013</span></div>
    <p className={styles.instruction}>Girás los tambores metálicos hasta encontrar la combinación.</p>
    <div className={styles.mechanism}>
      <div className={styles.brassRail} aria-hidden="true"/>
      <div className={styles.wheels}>
        {current.map((number,index)=><div className={styles.wheelBay} key={index}>
          <span className={styles.index}>DISCO {index+1}</span>
          <button type="button" className={styles.smallArrow} aria-label={"Girar dial "+(index+1)+" hacia adelante"} onClick={()=>turn(index,1)}>▴</button>
          <div className={styles.drum} role="slider" tabIndex={0} aria-label={"Dial mecánico "+(index+1)} aria-valuemin={0} aria-valuemax={9} aria-valuenow={number} aria-valuetext={"Número "+number} data-grabbing={holding===index?"true":"false"} onPointerDown={e=>grab(e,index)} onPointerMove={e=>move(e,index)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onWheel={e=>wheel(e,index)} onKeyDown={e=>key(e,index)}>
            <span className={styles.previous}>{(number+9)%10}</span>
            <span className={styles.current}>{number}</span>
            <span className={styles.next}>{(number+1)%10}</span>
            <span className={styles.glass}/>
          </div>
          <button type="button" className={styles.smallArrow} aria-label={"Girar dial "+(index+1)+" hacia atrás"} onClick={()=>turn(index,-1)}>▾</button>
        </div>)}
      </div>
      <span className={styles.centerBolt} aria-hidden="true">◈</span>
    </div>
    <button type="button" className={styles.unlock} disabled={code.length!==3} onClick={onConfirm}>DESBLOQUEAR MECANISMO <span>↗</span></button>
    <p className={styles.helper}>Arrastrá los discos verticalmente o usá las flechas. El teclado numérico también funciona.</p>
  </div>;
}
