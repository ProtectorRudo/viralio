"use client";

import { useEffect, useRef } from "react";
import styles from "./ThresholdSequence.module.css";

const CHAPTERS = [
  {
    name: "EL VESTÍBULO",
    line: "Algunas puertas no se abren desde adentro.",
    signal: "03:13",
  },
  {
    name: "EL DESPACHO",
    line: "Tres golpes. Del otro lado nadie debería estar despierto.",
    signal: "ARCHIVO 02",
  },
  {
    name: "LA HABITACIÓN DE EVA",
    line: "Hay una canción que nadie se atreve a terminar.",
    signal: "CINTA 013",
  },
  {
    name: "EL CORAZÓN DE LA CASA",
    line: "Si la electricidad vuelve, tal vez ella también.",
    signal: "CIRCUITO 07",
  },
] as const;

/**
 * Fullscreen cinematic chapter passage. It stages the NEXT room's real
 * photographic scene behind an opening wooden door. The gameplay clock
 * begins only AFTER the intro and is frozen for chapter crossings.
 *
 * Automatic progression, visible skip and reduced-motion fast-path avoid
 * trapping users in a cinematic sequence. No independent audio is started
 * here; the parent triggers the existing licensed door sound on a real tap.
 */
export default function ThresholdSequence({
  toRoom,
  arrival,
  onComplete,
}: {
  toRoom: number;
  arrival: boolean;
  onComplete: () => void;
}) {
  const finished = useRef(false);
  const callback = useRef(onComplete);

  useEffect(() => {
    callback.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      callback.current();
    }, reduced ? 280 : arrival ? 2200 : 2050);
    return () => window.clearTimeout(timeout);
  }, [arrival, toRoom]);

  function skip() {
    if (finished.current) return;
    finished.current = true;
    callback.current();
  }

  const chapter = CHAPTERS[toRoom] ?? CHAPTERS[0];

  return (
    <div
      className={styles.sequence}
      data-testid="umbral-threshold"
      data-to={toRoom}
      data-type={arrival ? "arrival" : "chapter"}
      role="dialog"
      aria-modal="true"
      aria-label={arrival ? "Ingreso cinematográfico a la casa" : "Pasaje cinematográfico al siguiente capítulo"}
    >
      <div
        className={styles.nextRoom}
        data-testid="umbral-threshold-destination"
        style={{
          backgroundImage:
            `linear-gradient(180deg,rgba(2,7,9,.32),transparent 38%,rgba(2,5,8,.63)),image-set(url("/escape/images/room-${toRoom}.webp") 1x,url("/escape/images/retina/room-${toRoom}.webp") 2x)`,
        }}
        aria-hidden="true"
      />
      <div className={styles.aperture} aria-hidden="true" />
      <div className={styles.arch} aria-hidden="true">
        <div className={styles.door}>
          <div className={styles.wornPaint} />
          <div className={styles.panelTop}><span /></div>
          <div className={styles.panelMiddle}><span /></div>
          <div className={styles.panelBottom}><span /></div>
          <div className={styles.hardware}><i /><b /><i /></div>
          <div className={styles.doorNumber}>{arrival ? "13" : String(toRoom + 1).padStart(2, "0")}</div>
          <div className={styles.doorEdge} />
        </div>
        <div className={styles.hinge} />
      </div>
      <div className={styles.lightSpill} aria-hidden="true" />
      <div className={styles.filmGrain} aria-hidden="true" />
      <div className={styles.letterboxTop} aria-hidden="true" />
      <div className={styles.letterboxBottom} aria-hidden="true" />
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{arrival ? "CASO 013 · NADIE ABRIÓ LA PUERTA" : `EXPEDIENTE 013 · PASO 0${toRoom + 1}`}</span>
        <h2>{arrival ? "LA CASA TE ESTABA ESPERANDO." : chapter.name}</h2>
        <p>{chapter.line}</p>
        <span className={styles.signal}>◉ &nbsp;{chapter.signal}</span>
      </div>
      <div className={styles.floorMark} aria-hidden="true">UMBRAL // 013</div>
      <button className={styles.skip} onClick={skip} type="button" aria-label="Omitir secuencia cinematográfica">
        OMITIR SECUENCIA <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
