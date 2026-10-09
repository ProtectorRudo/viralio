"use client";

import type { PointerEvent } from "react";
import styles from "./Artefact.module.css";

type Kind = "portrait" | "clock" | "lock" | "letter" | "music" | "doll" | "circuit" | "door" | "signal";
const INSCRIPTIONS:Record<Kind,string> = {
  portrait:"FOTOGRAFÍA · 013",clock:"RELOJ · 03:13",lock:"MECANISMO · TRES CIFRAS",
  letter:"CORRESPONDENCIA PRIVADA",music:"LA ÚLTIMA CANCIÓN",doll:"PERTENENCIAS DE EVA",
  circuit:"SUBSUELO · 07",door:"NO MIRES ATRÁS",signal:"UN RASTRO EN LA OSCURIDAD"
};

/**
 * Close-up inspection prop. Original photographic textures are shipped locally:
 * no network images, no SVG approximation, no runtime image generation.
 * Pointer movement changes only compositing properties; puzzle controls live
 * outside this purely visual layer and remain fully keyboard-accessible.
 */
export default function Artefact({kind,mark}:{kind:Kind;mark?:string}) {
  function followPointer(e:PointerEvent<HTMLDivElement>) {
    if(e.pointerType==="touch") return;
    const rect=e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--look-x",(((e.clientX-rect.left)/rect.width-.5)*6).toFixed(2)+"px");
    e.currentTarget.style.setProperty("--look-y",(((e.clientY-rect.top)/rect.height-.5)*6).toFixed(2)+"px");
    e.currentTarget.style.setProperty("--light-x",(((e.clientX-rect.left)/rect.width)*100).toFixed(1)+"%");
    e.currentTarget.style.setProperty("--light-y",(((e.clientY-rect.top)/rect.height)*100).toFixed(1)+"%");
  }
  return <div className={styles.stage+" "+styles[kind]} onPointerMove={followPointer} aria-hidden="true">
    <div className={styles.halo}/>
    <div className={styles.photograph}/>
    <div className={styles.glass}/>
    <div className={styles.grain}/>
    <div className={styles.inscription}>{INSCRIPTIONS[kind]}</div>
    {mark&&<div className={styles.plate}><span>AÑO</span><strong>{mark}</strong></div>}
    {(kind==="clock"||kind==="music")&&<div className={styles.mechanicGlow}/>}
    {kind==="doll"&&<div className={styles.eyes}/>}
  </div>;
}
