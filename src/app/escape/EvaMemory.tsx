"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./EvaMemory.module.css";

/**
 * A photograph-driven, in-world tape reconstruction.
 * It is deliberately silent: audio is opt-in elsewhere, so subtitles always carry the story.
 */
export default function EvaMemory({ onClose }: {onClose:()=>void}) {
  const [elapsed,setElapsed] = useState(0);
  const [videoAvailable,setVideoAvailable] = useState(true);
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const [playing,setPlaying] = useState(true);
  useEffect(()=>{
    if(!playing) return;
    const started=performance.now()-elapsed*1000;
    const id=window.setInterval(()=>{
      const next=Math.min(8,Math.floor((performance.now()-started)*10)/10);
      setElapsed(next);
      if(next>=8) setPlaying(false);
    },100);
    return ()=>window.clearInterval(id);
    // restarting the tape intentionally resets elapsed and the origin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[playing]);
  const finished=elapsed>=8;
  const timeCode="00:"+String(Math.floor(elapsed)).padStart(2,"0");
  const caption=elapsed<2.5?
     "EVA · 13 DE OCTUBRE · 23:13":
     elapsed<4.4?
     "La casa escuchaba nuestra canción…":
     elapsed<6.2?
     "…y sabía cuándo apagar la luz.":
     "No abandones lo que todavía late.";
  return <div className={styles.tape} aria-label="Cinta encontrada: último recuerdo de Eva">
    <div className={styles.topLine}><span>◉ CASO 013 / CINTA RECUPERADA</span><span>ARCHIVO DAÑADO</span></div>
    <h2>El último recuerdo</h2>
    <p className={styles.lead}>La caja conservaba algo más que una melodía. El último recuerdo comienza a reconstruirse ante tus ojos.</p>
    <div className={styles.viewport}>
      <div className={styles.roomFrame} style={{opacity:elapsed<4.2?1:0}}/>
      <div className={styles.dollFrame} style={{opacity:elapsed<3.7?0:1}}/>
      {videoAvailable&&<video ref={videoRef} className={styles.filmVideo} src="/escape/images/eva-tape-013.mp4" poster="/escape/images/room-2.webp" autoPlay muted playsInline preload="metadata" onEnded={()=>{setElapsed(8);setPlaying(false);}} onError={()=>setVideoAvailable(false)} aria-label="Reconstrucción muda: la habitación de Eva y un acercamiento inquietante a su muñeca"/>}
      <div className={styles.scanlines}/>
      <div className={styles.vignette}/>
      <div className={styles.rec}><span className={playing?styles.recording:""}/> REC · {timeCode}</div>
      <div className={styles.caption}>{caption}</div>
      {finished&&<div className={styles.endCard}><strong>FIN DE CINTA 013</strong><span>Hay una voz detrás de la pared.</span></div>}
    </div>
    <div className={styles.timeline}><div style={{width:(elapsed/8*100)+"%"}}/></div>
    <div className={styles.controls}>
      <button type="button" onClick={()=>{
        setElapsed(0);setPlaying(true);
        if(videoRef.current){videoRef.current.currentTime=0;void videoRef.current.play().catch(()=>{});}
      }}>↺ REPRODUCIR OTRA VEZ</button>
      <button type="button" className={styles.closeButton} onClick={onClose}>GUARDAR LA CINTA ↗</button>
    </div>
    <p className={styles.note}>Cinta muda con subtítulos. Si el video no se puede cargar, se muestra una reconstrucción animada de las mismas escenas.</p>
  </div>;
}
