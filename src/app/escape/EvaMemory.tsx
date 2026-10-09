"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./EvaMemory.module.css";

const LENGTH = 8;
const SUBTITLES = [
  { until: 2.5, text: "EVA · 13 DE OCTUBRE · 23:13" },
  { until: 4.4, text: "La casa escuchaba nuestra canción…" },
  { until: 6.2, text: "…y sabía cuándo apagar la luz." },
  { until: LENGTH, text: "No abandones lo que todavía late." },
];

/**
 * Silent footage, timed subtitles and a photographic fallback. No audio is
 * started without the player's consent elsewhere in the game.
 */
export default function EvaMemory({ onClose }: { onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    if (!playing) return;
    const started = performance.now() - elapsedRef.current * 1000;
    const id = window.setInterval(() => {
      const next = Math.min(LENGTH, Math.floor((performance.now() - started) / 100) / 10);
      setElapsed(next);
      if (next >= LENGTH) setPlaying(false);
    }, 100);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const finished = elapsed >= LENGTH;
  const timeCode = "00:" + String(Math.floor(elapsed)).padStart(2, "0");
  const caption = SUBTITLES.find((line) => elapsed < line.until)?.text ?? SUBTITLES[SUBTITLES.length - 1].text;

  function replay() {
    elapsedRef.current = 0;
    setElapsed(0);
    setPlaying(true);
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play().catch(() => setVideoAvailable(false));
    }
  }

  function togglePause() {
    if (finished) {
      replay();
      return;
    }
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
      if (videoAvailable && videoRef.current) {
        void videoRef.current.play().catch(() => setVideoAvailable(false));
      }
    }
  }

  return <div className={styles.tape} aria-label="Cinta encontrada: último recuerdo de Eva">
    <div className={styles.topLine}><span>◉ CASO 013 / CINTA RECUPERADA</span><span>ARCHIVO DAÑADO</span></div>
    <h2>El último recuerdo</h2>
    <p className={styles.lead}>La caja conservaba algo más que una melodía. El último recuerdo comienza a reconstruirse ante tus ojos.</p>
    <div className={styles.viewport}>
      <div className={styles.roomFrame} style={{opacity:elapsed<4.2?1:0}} />
      <div className={styles.dollFrame} style={{opacity:elapsed<3.7?0:1}} />
      {videoAvailable && <video
        ref={videoRef}
        className={styles.filmVideo}
        src="/escape/images/eva-tape-013.mp4"
        poster="/escape/images/room-2.webp"
        autoPlay muted playsInline preload="auto"
        onTimeUpdate={(event) => {
          const current=Math.min(LENGTH,event.currentTarget.currentTime);
          if (playing && Number.isFinite(current) && current>elapsedRef.current) {
            elapsedRef.current=current;
            setElapsed(current);
          }
        }}
        onEnded={() => {setElapsed(LENGTH);setPlaying(false);}}
        onError={() => setVideoAvailable(false)}
        aria-label="Reconstrucción muda: la habitación de Eva y un acercamiento inquietante a su muñeca"
      />}
      <div className={styles.scanlines}/>
      <div className={styles.vignette}/>
      <div className={styles.rec}><span className={playing?styles.recording:""}/> {playing?"REC":"PAUSA"} · {timeCode}</div>
      <div className={styles.caption} aria-label="Subtítulos de la cinta">{caption}</div>
      {finished&&<div className={styles.endCard}><strong>FIN DE CINTA 013</strong><span>Hay una voz detrás de la pared.</span></div>}
    </div>
    <div className={styles.timeline} role="progressbar" aria-label="Progreso del recuerdo" aria-valuemin={0} aria-valuemax={LENGTH} aria-valuenow={Math.floor(elapsed)}><div style={{width:(elapsed/LENGTH*100)+"%"}}/></div>
    <div className={styles.controls}>
      <button type="button" onClick={togglePause} aria-pressed={!playing}>{finished?"↺ VER DE NUEVO":playing?"Ⅱ PAUSAR CINTA":"▶ REANUDAR CINTA"}</button>
      <button type="button" onClick={replay}>↺ DESDE EL PRINCIPIO</button>
      <button type="button" className={styles.closeButton} onClick={onClose}>GUARDAR LA CINTA ↗</button>
    </div>
    <p className={styles.note}>Grabación muda, subtitulada y opcional. Si tu navegador no admite el video, las imágenes reconstruyen el mismo recuerdo.</p>
  </div>;
}
