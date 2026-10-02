"use client";

import { useRef, useState } from "react";
import styles from "./maurilio-fallback.module.css";

type Phase = "ready" | "kicking" | "revealed";

const demoPick = {
  event: "Atlético Norte vs Unión Central",
  market: "Tarjetas",
  selection: "Más de 4.5 tarjetas",
  odds: 1.83,
  minimum: 1.72,
  implied: 54.6,
  model: 63,
  low: 58,
  high: 67,
  edge: 8.4,
  ev: 15.3,
  stake: 0.75,
  thesis:
    "El precio demo infravalora una combinación ficticia de ritmo, disciplina y contexto competitivo.",
  risk:
    "Un partido resuelto demasiado pronto reduciría la intensidad y el volumen de faltas.",
};

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? styles.simpleMetricAccent : styles.simpleMetric}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function playTone(frequency: number) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.018, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.12,
    );

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);

    window.setTimeout(() => void context.close(), 240);
  } catch {
    // Audio is optional.
  }
}

export default function DemoExperience() {
  const [phase, setPhase] = useState<Phase>("ready");
  const timerRef = useRef<number | null>(null);

  function kick() {
    if (phase !== "ready") return;

    setPhase("kicking");
    playTone(130);

    timerRef.current = window.setTimeout(() => {
      playTone(720);
      setPhase("revealed");
    }, 900);
  }

  function reset() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPhase("ready");
  }

  return (
    <section className={styles.simpleDemo}>
      <div className={styles.simpleDemoHead}>
        <div>
          <span>EXPERIENCIA DEMO</span>
          <b>Sin dinero · sin apuesta real</b>
        </div>
        {phase === "revealed" ? (
          <button type="button" onClick={reset}>
            Repetir
          </button>
        ) : null}
      </div>

      {phase !== "revealed" ? (
        <div className={styles.simplePenalty}>
          <div className={styles.simpleGoal} aria-hidden="true">
            <div className={styles.simpleNet} />
            <span className={styles.simpleKeeper}>M</span>
            <span
              className={
                phase === "kicking"
                  ? `${styles.simpleBall} ${styles.simpleBallKicking}`
                  : styles.simpleBall
              }
            >
              ⚽
            </span>
            <span
              className={
                phase === "kicking"
                  ? `${styles.simpleGoalFlash} ${styles.simpleGoalFlashActive}`
                  : styles.simpleGoalFlash
              }
            />
          </div>

          <button
            type="button"
            className={styles.simpleKickButton}
            onClick={kick}
            disabled={phase === "kicking"}
          >
            <b>{phase === "kicking" ? "PATEANDO…" : "PATEAR PENAL"}</b>
            <span>Revelar análisis</span>
          </button>
        </div>
      ) : (
        <div className={styles.simpleReveal}>
          <div className={styles.simpleDecision}>
            <span>ANÁLISIS REVELADO</span>
            <b>DEMO</b>
          </div>

          <small>MAURILIO LAB · DATOS FICTICIOS</small>
          <h1>{demoPick.event}</h1>

          <div className={styles.simpleSelection}>
            <div>
              <span>MERCADO</span>
              <b>{demoPick.market}</b>
              <strong>{demoPick.selection}</strong>
            </div>
            <div>
              <span>BET365</span>
              <b>@{demoPick.odds.toFixed(2)}</b>
            </div>
          </div>

          <div className={styles.simpleMetricGrid}>
            <Metric label="CUOTA MÍN." value={demoPick.minimum.toFixed(2)} />
            <Metric
              label="IMPLÍCITA"
              value={`${demoPick.implied.toFixed(1)}%`}
            />
            <Metric
              label="NUESTRO MODELO"
              value={`${demoPick.model.toFixed(1)}%`}
              accent
            />
            <Metric
              label="RANGO"
              value={`${demoPick.low}–${demoPick.high}%`}
            />
            <Metric
              label="EDGE"
              value={`+${demoPick.edge.toFixed(1)}%`}
            />
            <Metric label="EV" value={`+${demoPick.ev.toFixed(1)}%`} accent />
            <Metric
              label="STAKE"
              value={`${demoPick.stake.toFixed(2)}%`}
            />
          </div>

          <div className={styles.simpleReasonGrid}>
            <article>
              <span>TESIS</span>
              <p>{demoPick.thesis}</p>
            </article>
            <article>
              <span>MEJOR RAZÓN PARA NO ENTRAR</span>
              <p>{demoPick.risk}</p>
            </article>
          </div>

          <div className={styles.simpleDisclaimer}>
            <b>CUOTA BET365 NO VERIFICADA</b>
            <span>
              Equipos, precio, probabilidades y mercado son ficticios. Sólo se
              está demostrando la experiencia de reveal.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
