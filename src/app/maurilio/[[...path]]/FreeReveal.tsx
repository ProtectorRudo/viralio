"use client";

import { useMemo, useRef, useState } from "react";
import styles from "./maurilio-fallback.module.css";

type FreePick = Record<string, unknown>;
type Phase = "ready" | "kicking" | "revealed";

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pct(value: number | null, digits = 1, signed = false) {
  if (value === null) return "—";
  const prefix = signed && value >= 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(digits)}%`;
}

function odds(value: number | null) {
  return value === null ? "—" : `@${value.toFixed(2)}`;
}

function artTime(value: unknown) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return (
    new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date) + " ART"
  );
}

export default function FreeReveal({ pick }: { pick: FreePick }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const timerRef = useRef<number | null>(null);

  const metrics = useMemo(() => {
    const entry = num(pick.entry_odds);
    const minimum = num(pick.minimum_odds);
    const own = num(pick.probability_own);
    const low = num(pick.probability_low);
    const high = num(pick.probability_high);
    const stake = num(pick.stake_pct);
    const implied = entry ? 1 / entry : null;
    const edge = own !== null && implied !== null ? own - implied : null;
    const ev = own !== null && entry !== null ? own * entry - 1 : null;
    const floorEv = low !== null && entry !== null ? low * entry - 1 : null;
    return { entry, minimum, own, low, high, stake, implied, edge, ev, floorEv };
  }, [pick]);

  function kick() {
    if (phase !== "ready") return;
    setPhase("kicking");

    timerRef.current = window.setTimeout(() => {
      setPhase("revealed");
    }, 900);
  }

  function reset() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPhase("ready");
  }

  return (
    <section className={styles.revealShell} id="free-reveal">
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
            <span>Revelar análisis FREE</span>
          </button>
        </div>
      ) : (
        <div className={styles.revealedPanel}>
          <div className={styles.decision}>
            <span>ANÁLISIS REVELADO</span>
            <b>VALUE DETECTED</b>
          </div>

          <small className={styles.competition}>
            {String(pick.competition ?? "—")}
          </small>
          <h3>{String(pick.event ?? "—")}</h3>

          <div className={styles.eventTiming}>
            <div>
              <span>CAPTURA BET365</span>
              <b>{artTime(pick.odds_captured_at)}</b>
            </div>
            <div>
              <span>INICIO EVENTO</span>
              <b>{artTime(pick.event_start_at)}</b>
            </div>
          </div>

          <div className={styles.marketHero}>
            <div>
              <small>MERCADO</small>
              <strong>{String(pick.market ?? "—")}</strong>
              {pick.selection ? <b>{String(pick.selection)}</b> : null}
            </div>
            <div>
              <small>BET365</small>
              <strong>{odds(metrics.entry)}</strong>
            </div>
          </div>

          <div className={styles.revealMetrics}>
            <div><span>CUOTA MÍNIMA</span><b>{odds(metrics.minimum)}</b></div>
            <div><span>IMPLÍCITA</span><b>{pct(metrics.implied)}</b></div>
            <div className={styles.accentMetric}><span>NUESTRO MODELO</span><b>{pct(metrics.own)}</b><small>{metrics.low !== null && metrics.high !== null ? `${pct(metrics.low)} — ${pct(metrics.high)}` : "—"}</small></div>
            <div><span>EDGE</span><b>{pct(metrics.edge, 1, true)}</b></div>
            <div><span>EV</span><b>{pct(metrics.ev, 1, true)}</b></div>
            <div><span>EV PISO</span><b>{pct(metrics.floorEv, 1, true)}</b></div>
            <div><span>STAKE</span><b>{pct(metrics.stake)}</b></div>
          </div>

          <div className={styles.thesisGrid}>
            <article>
              <span>TESIS</span>
              <p>{String(pick.thesis ?? "—")}</p>
            </article>
            <article>
              <span>MEJOR RAZÓN PARA NO ENTRAR</span>
              <p>{String(pick.principal_risk ?? "—")}</p>
            </article>
          </div>

          <div className={styles.revealProof}>
            <span>{String(pick.bookmaker ?? "Bet365")}</span>
            <b>REGISTRO PUBLICADO · PICK INMUTABLE</b>
          </div>

          <button
            className={styles.repeatButton}
            type="button"
            onClick={reset}
          >
            Repetir experiencia
          </button>
        </div>
      )}
    </section>
  );
}
