"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./maurilio-fallback.module.css";

type Stage = "tunnel" | "free" | "pro" | "elite" | "complete";
type Tier = "free" | "pro" | "elite";

type DemoPick = {
  tier: Tier;
  label: string;
  event: string;
  market: string;
  selection: string;
  odds: number;
  minimum: number;
  implied: number;
  model: number;
  low: number;
  high: number;
  edge: number;
  ev: number;
  stake: number;
  thesis: string;
  risk: string;
};

const picks: Record<Tier, DemoPick> = {
  free: {
    tier: "free",
    label: "OPEN ANALYSIS",
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
  },
  pro: {
    tier: "pro",
    label: "VAR AUDIT",
    event: "Puerto Azul vs Deportivo Oeste",
    market: "Córners",
    selection: "Más de 8.5 córners",
    odds: 1.91,
    minimum: 1.78,
    implied: 52.4,
    model: 61,
    low: 57,
    high: 65,
    edge: 8.6,
    ev: 16.5,
    stake: 1.25,
    thesis:
      "La demostración combina volumen territorial, centros y un guion de partido favorable al mercado.",
    risk:
      "Una ventaja temprana del equipo dominante podría reducir ataques posicionales y córners.",
  },
  elite: {
    tier: "elite",
    label: "THE LOCKER",
    event: "Racing del Sur vs Capital FC",
    market: "Goles",
    selection: "Ambos marcan — No",
    odds: 2.02,
    minimum: 1.88,
    implied: 49.5,
    model: 59.5,
    low: 55,
    high: 63,
    edge: 10,
    ev: 20.2,
    stake: 1.75,
    thesis:
      "La simulación representa una discrepancia excepcional que sobrevivió varias señales y un rango conservador.",
    risk:
      "Un gol temprano puede romper por completo el guion de baja concesión que sostiene la tesis.",
  },
};

const auditSteps = [
  "Contexto competitivo",
  "Alineaciones y bajas",
  "Métricas del mercado",
  "Precio Bet365",
  "Modelo probabilístico",
  "Auditoría adversarial",
];

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
    <div className={accent ? styles.demoMetricAccent : styles.demoMetric}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function PickSheet({ pick }: { pick: DemoPick }) {
  return (
    <div className={styles.demoPickSheet}>
      <div className={styles.demoPickTop}>
        <div>
          <span>{pick.label}</span>
          <small>MAURILIO LAB · EXPERIENCIA DEMO</small>
        </div>
        <b>DEMO</b>
      </div>

      <h2>{pick.event}</h2>

      <div className={styles.demoSelection}>
        <div>
          <span>{pick.market}</span>
          <strong>{pick.selection}</strong>
        </div>
        <div>
          <span>BET365</span>
          <strong>@{pick.odds.toFixed(2)}</strong>
        </div>
      </div>

      <div className={styles.demoMetricGrid}>
        <Metric label="CUOTA MÍN." value={pick.minimum.toFixed(2)} />
        <Metric label="IMPLÍCITA" value={`${pick.implied.toFixed(1)}%`} />
        <Metric
          label="NUESTRO MODELO"
          value={`${pick.model.toFixed(1)}%`}
          accent
        />
        <Metric label="RANGO" value={`${pick.low}–${pick.high}%`} />
        <Metric label="EDGE" value={`+${pick.edge.toFixed(1)}%`} />
        <Metric label="EV" value={`+${pick.ev.toFixed(1)}%`} accent />
        <Metric label="STAKE" value={`${pick.stake.toFixed(2)}%`} />
      </div>

      <div className={styles.demoReasonGrid}>
        <article>
          <span>TESIS</span>
          <p>{pick.thesis}</p>
        </article>
        <article>
          <span>MEJOR RAZÓN PARA NO ENTRAR</span>
          <p>{pick.risk}</p>
        </article>
      </div>

      <div className={styles.demoDisclaimer}>
        <b>CUOTA BET365 NO VERIFICADA</b>
        <span>
          Equipos, mercado, precio, probabilidades y métricas son ficticios.
          Esta pantalla sólo demuestra la experiencia del producto.
        </span>
      </div>
    </div>
  );
}

function playDemoTone(frequency: number) {
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
    gain.gain.setValueAtTime(0.02, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.12,
    );
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    window.setTimeout(() => void context.close(), 260);
  } catch {
    // Audio is optional.
  }
}

export default function DemoExperience() {
  const [stage, setStage] = useState<Stage>("tunnel");
  const [freeKicked, setFreeKicked] = useState(false);
  const [proReviewing, setProReviewing] = useState(false);
  const [proStep, setProStep] = useState(0);
  const [proRevealed, setProRevealed] = useState(false);
  const [eliteOpen, setEliteOpen] = useState(false);

  useEffect(() => {
    if (!proReviewing) return;

    setProStep(0);
    setProRevealed(false);

    const interval = window.setInterval(() => {
      setProStep((value) => {
        if (value >= auditSteps.length - 1) return value;
        playDemoTone(360 + value * 45);
        return value + 1;
      });
    }, 390);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setProReviewing(false);
      setProRevealed(true);
      playDemoTone(760);
    }, auditSteps.length * 390 + 420);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [proReviewing]);

  const progress = useMemo(() => {
    const order: Stage[] = ["tunnel", "free", "pro", "elite", "complete"];
    return order.indexOf(stage);
  }, [stage]);

  function kick() {
    if (freeKicked) return;
    setFreeKicked(true);
    playDemoTone(140);
    window.setTimeout(() => playDemoTone(620), 650);
  }

  function reset() {
    setStage("tunnel");
    setFreeKicked(false);
    setProReviewing(false);
    setProStep(0);
    setProRevealed(false);
    setEliteOpen(false);
  }

  return (
    <section className={styles.demoExperience}>
      <div className={styles.demoTopline}>
        <div>
          <span>MAURILIO EXPERIENCE LAB</span>
          <b>DEMO · SIN DINERO · SIN APUESTA REAL</b>
        </div>
        <button type="button" onClick={reset}>
          Reiniciar
        </button>
      </div>

      <div className={styles.demoProgress} aria-label="Progreso del demo">
        {["TÚNEL", "FREE", "PRO", "ELITE", "FINAL"].map((item, index) => (
          <div
            className={index <= progress ? styles.demoProgressActive : undefined}
            key={item}
          >
            <i>{index < progress ? "✓" : String(index + 1).padStart(2, "0")}</i>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {stage === "tunnel" ? (
        <div className={styles.demoTunnel}>
          <div className={styles.demoTunnelLights} aria-hidden="true">
            <i /><i /><i /><i /><i />
          </div>
          <span>ENTRADA AL VESTUARIO</span>
          <h1>Esta vez vas a vivirlo vos.</h1>
          <p>
            Vas a recorrer los tres niveles como si hubiera un Matchday
            publicado. Todo lo que veas es ficticio y sirve únicamente para
            sentir el producto terminado.
          </p>

          <div className={styles.demoTunnelLockers}>
            <article><small>01</small><b>FREE</b><span>OPEN</span></article>
            <article><small>02</small><b>PRO</b><span>VAR</span></article>
            <article><small>03</small><b>ELITE</b><span>PRIVATE</span></article>
          </div>

          <button
            type="button"
            className={styles.demoPrimary}
            onClick={() => {
              playDemoTone(220);
              setStage("free");
            }}
          >
            Entrar al vestuario →
          </button>
        </div>
      ) : null}

      {stage === "free" ? (
        <div className={styles.demoStage}>
          <div className={styles.demoStageHeading}>
            <span>01 / FREE · PENALTY REVEAL</span>
            <h1>Pateá para revelar.</h1>
            <p>
              En producción, este sería el análisis abierto del Matchday.
            </p>
          </div>

          {!freeKicked ? (
            <div className={styles.demoPenalty}>
              <div className={styles.demoGoal}>
                <span />
                <b>M</b>
              </div>
              <button type="button" onClick={kick}>
                <i>⚽</i>
                <b>PATEAR</b>
                <span>Revelar análisis FREE</span>
              </button>
            </div>
          ) : (
            <div className={styles.demoRevealEnter}>
              <PickSheet pick={picks.free} />
              <button
                type="button"
                className={styles.demoNext}
                onClick={() => setStage("pro")}
              >
                Continuar al VAR PRO →
              </button>
            </div>
          )}
        </div>
      ) : null}

      {stage === "pro" ? (
        <div className={styles.demoStage}>
          <div className={styles.demoStageHeading}>
            <span>02 / PRO · VAR AUDIT</span>
            <h1>El precio entra a revisión.</h1>
            <p>
              Acá la experiencia no revela primero: intenta demostrar que la
              señal es mala antes de mostrarla.
            </p>
          </div>

          {!proRevealed ? (
            <div className={styles.demoVar}>
              <div className={styles.demoVarScreen}>
                <span>CHECKING VALUE</span>
                <b>{proReviewing ? "VAR REVIEW" : "READY"}</b>
              </div>

              <div className={styles.demoAuditList}>
                {auditSteps.map((step, index) => {
                  const active = proReviewing && index <= proStep;
                  const done =
                    proRevealed || (proReviewing && index < proStep);
                  return (
                    <div
                      className={
                        active || done ? styles.demoAuditActive : undefined
                      }
                      key={step}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <b>{step}</b>
                      <i>{done ? "CHECK" : active ? "READING" : "WAIT"}</i>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className={styles.demoPrimary}
                onClick={() => {
                  if (!proReviewing) {
                    playDemoTone(280);
                    setProReviewing(true);
                  }
                }}
                disabled={proReviewing}
              >
                {proReviewing ? "Auditando…" : "Iniciar VAR Review"}
              </button>
            </div>
          ) : (
            <div className={styles.demoRevealEnter}>
              <div className={styles.demoDecision}>
                <span>VAR DECISION</span>
                <b>VALUE CONFIRMED · DEMO</b>
              </div>
              <PickSheet pick={picks.pro} />
              <button
                type="button"
                className={styles.demoNext}
                onClick={() => setStage("elite")}
              >
                Entrar a The Locker →
              </button>
            </div>
          )}
        </div>
      ) : null}

      {stage === "elite" ? (
        <div className={styles.demoStage}>
          <div className={styles.demoStageHeading}>
            <span>03 / ELITE · THE LOCKER</span>
            <h1>La puerta que no siempre se abre.</h1>
            <p>
              Este nivel sólo existiría cuando la discrepancia fuera
              excepcional. En el demo podés abrirlo para sentir el reveal.
            </p>
          </div>

          {!eliteOpen ? (
            <div className={styles.demoEliteDoor}>
              <div className={styles.demoDoor}>
                <span>PRIVATE ACCESS</span>
                <b>M</b>
                <small>HIGH CONVICTION</small>
              </div>
              <button
                type="button"
                className={styles.demoPrimary}
                onClick={() => {
                  playDemoTone(180);
                  setEliteOpen(true);
                  window.setTimeout(() => playDemoTone(840), 380);
                }}
              >
                Abrir The Locker →
              </button>
            </div>
          ) : (
            <div className={styles.demoRevealEnter}>
              <div className={styles.demoJerseyReveal}>
                <span>MAURILIO</span>
                <b>+20.2% EV</b>
                <small>DEMO HIGH CONVICTION</small>
              </div>
              <PickSheet pick={picks.elite} />
              <button
                type="button"
                className={styles.demoNext}
                onClick={() => setStage("complete")}
              >
                Cerrar experiencia →
              </button>
            </div>
          )}
        </div>
      ) : null}

      {stage === "complete" ? (
        <div className={styles.demoComplete}>
          <span>EXPERIENCIA COMPLETA</span>
          <h1>Así se sentiría un Matchday con los tres niveles.</h1>
          <p>
            En producción no aparecerían datos ficticios ni se forzaría un
            nivel premium. FREE, PRO o ELITE existirían únicamente cuando la
            señal real sobreviviera al modelo, al precio mínimo y a la auditoría.
          </p>

          <div className={styles.demoCompleteGrid}>
            <article><b>FREE</b><span>Penalty Reveal</span></article>
            <article><b>PRO</b><span>VAR Decision</span></article>
            <article><b>ELITE</b><span>The Locker</span></article>
          </div>

          <div className={styles.demoCompleteActions}>
            <button type="button" className={styles.demoPrimary} onClick={reset}>
              Vivirla otra vez
            </button>
            <Link href="/maurilio">Volver al Matchday real</Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
