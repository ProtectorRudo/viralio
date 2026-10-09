"use client";

import type { PointerEvent, CSSProperties } from "react";
import styles from "./DiegeticFocus.module.css";

type FocusKind="portrait"|"clock"|"lock"|"doll"|"music";
const SERIAL:Record<FocusKind,string>={
  portrait:"ARCHIVO FAMILIAR",
  clock:"MECANISMO 013",
  lock:"EL UMBRAL · CERRADURA",
  doll:"PERTENENCIA DE EVA",
  music:"CAJA MUSICAL DE EVA",
};

/**
 * Diegetic camera focus. The room never disappears: its photographic backing
 * moves into the inspected object's origin while a materially lit closeup
 * is lifted out of the scene. This sits behind the interactive inspector,
 * not inside a generic boxed modal.
 */
export default function DiegeticFocus({
  room,kind,origin={x:50,y:50},mark
}:{
  room:number;kind:FocusKind;origin?:{x:number;y:number};mark?:string;
}){
  function move(e:PointerEvent<HTMLDivElement>){
    if(e.pointerType!=="mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const b=e.currentTarget.getBoundingClientRect();
    const x=e.clientX/b.width-b.left/b.width, y=e.clientY/b.height-b.top/b.height;
    e.currentTarget.style.setProperty("--move-x",((x-.5)*11).toFixed(1)+"px");
    e.currentTarget.style.setProperty("--move-y",((y-.5)*8).toFixed(1)+"px");
    e.currentTarget.style.setProperty("--shine-x",Math.round(x*100)+"%");
    e.currentTarget.style.setProperty("--shine-y",Math.round(y*100)+"%");
  }
  return <div className={styles.focusWorld} data-focus-object={kind} data-focus-room={room}
    style={{"--origin-x":origin.x+"%","--origin-y":origin.y+"%"} as CSSProperties}
    onPointerMove={move} aria-hidden="true">
    <div className={styles.camera} style={{backgroundImage:`linear-gradient(110deg,rgba(0,2,5,.08),rgba(0,3,6,.52) 61%,rgba(0,1,3,.91)),image-set(url("/escape/images/room-${room}.webp") 1x,url("/escape/images/retina/room-${room}.webp") 2x)`}} />
    <div className={styles.cameraGrain}/>
    <div className={styles.darkVelvet}/>
    <div className={styles.artefact} data-material={kind}>
      <div className={styles.artefactPortrait} style={{backgroundImage:`image-set(url("/escape/images/objects/${kind}.webp") 1x,url("/escape/images/retina/objects/${kind}.webp") 2x)`}}/>
      <div className={styles.glass} />
      <div className={styles.rim} />
      <div className={styles.label}><span>UMB / OBJETO RECONSTRUIDO</span><b>{mark??SERIAL[kind]}</b></div>
    </div>
    <div className={styles.brightDust}/>
    <div className={styles.caption}><span>◈</span> ESTÁS EN LA HABITACIÓN · EXAMINANDO UN OBJETO</div>
  </div>;
}
