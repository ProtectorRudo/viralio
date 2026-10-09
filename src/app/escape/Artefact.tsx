"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import styles from "./Artefact.module.css";

type Kind = "portrait" | "clock" | "lock" | "letter" | "music" | "doll" | "circuit" | "door" | "signal";

const DETAILS:Record<Kind,{number:string;label:string}> = {
  portrait:{number:"01",label:"ARCHIVO FAMILIAR"},
  clock:{number:"02",label:"MECANISMO DETENIDO"},
  lock:{number:"03",label:"CERRADURA / PROPIEDAD 013"},
  letter:{number:"04",label:"CORRESPONDENCIA RECUPERADA"},
  music:{number:"05",label:"MELODÍA DE EVA"},
  doll:{number:"06",label:"PERTENENCIA DE EVA"},
  circuit:{number:"07",label:"CONTROL ELÉCTRICO"},
  door:{number:"08",label:"ÚLTIMO UMBRAL"},
  signal:{number:"09",label:"MENSAJE SIN REMITENTE"}
};

/** A physically photographed evidence close-up, rather than a UI icon. */
export default function Artefact({kind,mark,speaking=false}:{kind:Kind;mark?:string;speaking?:boolean}) {
  const info=DETAILS[kind];
  function moveLens(event: ReactPointerEvent<HTMLDivElement>) {
    if (typeof window!=="undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box=event.currentTarget.getBoundingClientRect();
    const x=Math.min(1,Math.max(0,(event.clientX-box.left)/box.width));
    const y=Math.min(1,Math.max(0,(event.clientY-box.top)/box.height));
    event.currentTarget.style.setProperty("--look-x",Math.round(x*100)+"%");
    event.currentTarget.style.setProperty("--look-y",Math.round(y*100)+"%");
    event.currentTarget.style.setProperty("--tilt-x",((.5-y)*9).toFixed(2)+"deg");
    event.currentTarget.style.setProperty("--tilt-y",((x-.5)*-12).toFixed(2)+"deg");
    event.currentTarget.style.setProperty("--shift-x",((x-.5)*-9).toFixed(2)+"px");
    event.currentTarget.style.setProperty("--shift-y",((y-.5)*-8).toFixed(2)+"px");
  }
  return (
    <div className={styles.stage+" "+styles[kind]+" "+(speaking?styles.speaking:"")} aria-hidden="true" onPointerMove={moveLens} onPointerLeave={e=>{e.currentTarget.style.setProperty("--tilt-x","0deg");e.currentTarget.style.setProperty("--tilt-y","0deg");e.currentTarget.style.setProperty("--shift-x","0px");e.currentTarget.style.setProperty("--shift-y","0px");}}>
      <div className={styles.photograph} style={{backgroundImage:`url("/escape/images/objects/${kind}.webp")`}}/>
      <div className={styles.lens}/>
      <div className={styles.glassReflection}/>
      <div className={styles.depthShadow}/>
      <div className={styles.vhsGrain}/>
      <div className={styles.filmEdge}/>
      {kind==="portrait"&&<div className={styles.brassPlate}>{mark||"1891"}</div>}
      {kind==="doll"&&<div className={styles.heartbeat}><span/><span/><span/><span/><span/><span/><span/></div>}
      <div className={styles.evidenceTag}><span>UMB / {info.number}</span><span>{info.label}</span></div>
    </div>
  );
}
