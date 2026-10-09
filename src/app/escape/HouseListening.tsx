"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HouseListening.module.css";

type Stage = "ready" | "tuning" | "heard";

const RECORDINGS = [
  [
    "Tres pasos atraviesan el vestíbulo. Después, el sonido de un reloj que sigue intentando recordar la hora.",
    "Hay alguien al otro lado de la puerta. Sus nudillos golpean tres veces, cada vez más despacio.",
  ],
  [
    "La casa cruje entre los libros. Una corriente helada mueve el aire, pero ninguna ventana está abierta.",
    "Un pasadizo se abre. Detrás de la madera, algo arrastra lentamente una silla.",
  ],
  [
    "Desde algún lugar llega una melodía infantil. La última nota parece buscar la primera.",
    "La música se detuvo. Escuchás pasos pequeños alejándose de la habitación.",
  ],
  [
    "El corazón de la casa late bajo tus pies. Cada segundo que pasa, el sonido se acerca.",
    "La electricidad regresó. Por primera vez, una voz parece decir tu nombre.",
  ],
] as const;

/**
 * Optional diegetic investigation: a short, tactile sound-focus sequence.
 * One tap initiates the listening moment (no prolonged touch required).
 * Audio is optional; every cue has a readable equivalent.
 */
export default function HouseListening({
  room,
  solved,
  dangerous,
  onStart,
  onReveal,
}: {
  room: number;
  solved: boolean;
  dangerous: boolean;
  onStart: () => void;
  onReveal: () => void;
}) {
  const [stage, setStage] = useState<Stage>("ready");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finish = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (finish.current) clearTimeout(finish.current);
  }, []);

  function listen() {
    if (stage !== "ready") return;
    if (timer.current) clearTimeout(timer.current);
    if (finish.current) clearTimeout(finish.current);
    setStage("tuning");
    onStart();
    timer.current = setTimeout(() => {
      setStage("heard");
      onReveal();
      finish.current = setTimeout(() => setStage("ready"), 6500);
    }, 1850);
  }

  const text = RECORDINGS[room]?.[solved ? 1 : 0] ?? RECORDINGS[0][0];
  return (
    <div
      className={styles.station}
      data-testid="umbral-listening"
      data-stage={stage}
      data-room={room}
      data-danger={dangerous ? "yes" : "no"}
    >
      {stage !== "ready" && (
        <div className={styles.lens} aria-hidden="true">
          <i className={styles.ring} />
          <i className={styles.ringOuter} />
          <i className={styles.scanLine} />
          <span className={styles.focusMarker}>◉</span>
        </div>
      )}
      <div className={styles.control}>
        <button
          className={styles.listenButton}
          type="button"
          onClick={listen}
          disabled={stage !== "ready"}
          aria-label="Escuchar detrás de las paredes"
          aria-describedby="umbral-listen-instructions"
          aria-busy={stage === "tuning"}
        >
          <span aria-hidden="true">{stage === "tuning" ? "◌" : "◉"}</span>
          {stage === "tuning" ? "ESCUCHANDO" : stage === "heard" ? "SEÑAL RECUPERADA" : "ESCUCHAR"}
        </button>
        <span id="umbral-listen-instructions" className={styles.instruction}>
          {stage === "ready" ? "LA CASA TIENE ALGO QUE DECIR" : "EL SILENCIO TAMBIÉN ES UNA PISTA"}
        </span>
      </div>
      {stage === "heard" && (
        <div className={styles.transcript} role="status" aria-live="polite">
          <span className={styles.serial}>TRANSCRIPCIÓN · PARED 0{room + 1}</span>
          <p>{text}</p>
          <span className={styles.noiseMark} aria-hidden="true">⌁ ⌁ ⌁</span>
        </div>
      )}
    </div>
  );
}
