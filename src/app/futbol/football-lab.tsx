"use client";

import { useEffect, useState } from "react";
import styles from "./football.module.css";

type TeamPreset = {
  name: string;
  short: string;
  primary: string;
  secondary: string;
};

type SimulationResult = {
  source: string;
  simulations: number;
  seed: number;
  homeWin: number;
  draw: number;
  awayWin: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  over25: number;
  bothTeamsToScore: number;
  meanTotalCorners: number;
  cornersOver85: number;
  cornersOver105: number;
  meanTotalYellows: number;
  cardsOver35: number;
  cardsOver55: number;
  redCardProbability: number;
  penaltyProbability: number;
  topScorelines: Array<{ score: string; probability: number }>;
  confidence: number;
  modelKey?: string | null;
  modelVersion?: string | null;
  competitionKey?: string | null;
  advancedXgAvailable?: boolean | null;
  validationAlignedPredictions?: number | null;
  validationBrierDelta?: number | null;
  modelGeneratedAt?: string | null;
  profileCutoffAt?: string | null;
  note?: string;
};

const TEAMS: TeamPreset[] = [
  { name: "Boca Juniors", short: "BOC", primary: "#0b2a66", secondary: "#f4cf2f" },
  { name: "Estudiantes", short: "EST", primary: "#d51f2b", secondary: "#ffffff" },
  { name: "River Plate", short: "RIV", primary: "#ffffff", secondary: "#d71920" },
  { name: "Racing Club", short: "RAC", primary: "#78c7f2", secondary: "#ffffff" },
  { name: "FC København", short: "FCK", primary: "#ffffff", secondary: "#1f3f91" },
  { name: "FC Midtjylland", short: "FCM", primary: "#111111", secondary: "#d71920" },
  { name: "Brøndby IF", short: "BIF", primary: "#f2dc24", secondary: "#1d3d86" },
  { name: "AGF", short: "AGF", primary: "#ffffff", secondary: "#111111" },
  { name: "Fredericia", short: "FRE", primary: "#d71920", secondary: "#ffffff" },
  { name: "Horsens", short: "HOR", primary: "#f2d21a", secondary: "#111111" },
  { name: "Lyngby Boldklub", short: "LYN", primary: "#244c9b", secondary: "#ffffff" },
  { name: "Nordsjælland", short: "FCN", primary: "#d71920", secondary: "#f2d21a" },
  { name: "Odense BK", short: "OB", primary: "#174a8b", secondary: "#ffffff" },
  { name: "Randers FC", short: "RFC", primary: "#6db7e8", secondary: "#ffffff" },
  { name: "Silkeborg IF", short: "SIF", primary: "#d71920", secondary: "#ffffff" },
  { name: "Sønderjyske Fodbold", short: "SE", primary: "#5ca4dc", secondary: "#ffffff" },
  { name: "Vejle Boldklub", short: "VB", primary: "#d71920", secondary: "#ffffff" },
  { name: "Viborg FF", short: "VFF", primary: "#2b8a3e", secondary: "#ffffff" },
];

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function FootballLab() {
  const [homeTeam, setHomeTeam] = useState(TEAMS[0].name);
  const [awayTeam, setAwayTeam] = useState(TEAMS[1].name);
  const [scenario, setScenario] = useState<"base" | "without-star">("base");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const home = TEAMS.find((team) => team.name === homeTeam) ?? TEAMS[0];
  const away = TEAMS.find((team) => team.name === awayTeam) ?? TEAMS[1];

  async function simulate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/futbol/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          scenario,
          simulations: 30000,
          seed: 42,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo ejecutar la simulación");
      }

      const data = (await response.json()) as SimulationResult;
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/futbol/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        homeTeam,
        awayTeam,
        scenario,
        simulations: 30000,
        seed: 42,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudo ejecutar la simulación");
        }
        return response.json() as Promise<SimulationResult>;
      })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Error inesperado");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [homeTeam, awayTeam, scenario]);

  function swapTeams() {
    setHomeTeam(awayTeam);
    setAwayTeam(homeTeam);
  }

  function loadRealDataDemo() {
    setHomeTeam("FC København");
    setAwayTeam("FC Midtjylland");
    setScenario("base");
  }

  const data = result;
  const leadingHome = data ? data.homeWin >= data.awayWin && data.homeWin >= data.draw : true;
  const leadingAway = data ? data.awayWin > data.homeWin && data.awayWin >= data.draw : false;
  const leadingLabel = leadingHome
    ? `gana ${home.name}`
    : leadingAway
      ? `gana ${away.name}`
      : "empate";
  const leadingProbability = data
    ? Math.max(data.homeWin, data.draw, data.awayWin)
    : 0;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.kicker}>FOOTBALL PROBABILISTIC DIGITAL TWIN</div>
        <h1>100.000 futuros posibles para un mismo partido.</h1>
        <p>
          Un laboratorio probabilístico que combina fuerza de equipo, goles, corners,
          tarjetas y escenarios de alineación. La capa de datos reales seguirá ampliándose.
        </p>
        <button
          type="button"
          className={styles.realDataButton}
          onClick={loadRealDataDemo}
        >
          Probar modelo con datos reales
        </button>
      </section>

      <section className={styles.selectorCard}>
        <div className={styles.selectorColumn}>
          <label>Local</label>
          <select value={homeTeam} onChange={(event) => setHomeTeam(event.target.value)}>
            {TEAMS.map((team) => (
              <option key={team.name} value={team.name} disabled={team.name === awayTeam}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className={styles.swapButton}
          type="button"
          onClick={swapTeams}
          aria-label="Intercambiar equipos"
        >
          ⇄
        </button>

        <div className={styles.selectorColumn}>
          <label>Visitante</label>
          <select value={awayTeam} onChange={(event) => setAwayTeam(event.target.value)}>
            {TEAMS.map((team) => (
              <option key={team.name} value={team.name} disabled={team.name === homeTeam}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <button className={styles.simulateButton} type="button" onClick={simulate} disabled={loading}>
          {loading ? "Simulando…" : "Simular partido"}
        </button>
      </section>

      {error ? <section className={styles.footer}>{error}</section> : null}

      {data?.modelVersion ? (
        <section className={styles.modelNotice}>
          <div>
            <span className={styles.eyebrow}>DATOS REALES · MODELO PROMOVIDO</span>
            <strong>{data.modelVersion}</strong>
            <p>
              Sportmonks {data.competitionKey ?? "competencia"} · actualizado {data.modelGeneratedAt
                ? new Date(data.modelGeneratedAt).toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                  })
                : "—"}
            </p>
          </div>
          <div className={styles.modelFacts}>
            <span>Validación <b>{data.validationAlignedPredictions ?? "—"} partidos</b></span>
            <span>xG avanzado <b>{data.advancedXgAvailable ? "sí" : "no · plan gratuito"}</b></span>
            <span>Δ Brier <b>{data.validationBrierDelta?.toFixed(4) ?? "—"}</b></span>
          </div>
        </section>
      ) : null}

      <section className={styles.scoreHero}>
        <div className={styles.teamBlock}>
          <div
            className={styles.badge}
            style={{ background: home.primary, color: home.secondary }}
          >
            {home.short}
          </div>
          <h2>{home.name}</h2>
          <span>Local</span>
        </div>

        <div className={styles.mainProbability}>
          <span className={styles.mainLabel}>PROBABILIDAD MÁS ALTA</span>
          <strong>{data ? pct(leadingProbability) : "—"}</strong>
          <span className={styles.mainOutcome}>{data ? leadingLabel : "calculando"}</span>
          <div className={styles.worlds}>
            {data ? `${data.simulations.toLocaleString("es-AR")} mundos simulados` : "preparando mundos…"}
          </div>
        </div>

        <div className={styles.teamBlock}>
          <div
            className={styles.badge}
            style={{ background: away.primary, color: away.secondary }}
          >
            {away.short}
          </div>
          <h2>{away.name}</h2>
          <span>Visitante</span>
        </div>
      </section>

      <section className={styles.probabilityGrid}>
        <article><span>Local</span><strong>{data ? pct(data.homeWin) : "—"}</strong></article>
        <article><span>Empate</span><strong>{data ? pct(data.draw) : "—"}</strong></article>
        <article><span>Visitante</span><strong>{data ? pct(data.awayWin) : "—"}</strong></article>
        <article><span>Confianza</span><strong>{data ? `${data.confidence}/100` : "—"}</strong></article>
      </section>

      <section className={styles.gridTwo}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>DISTRIBUCIÓN</span>
              <h3>Marcadores más probables</h3>
            </div>
          </div>
          <div className={styles.scoreList}>
            {(data?.topScorelines ?? []).map((item) => (
              <div className={styles.scoreRow} key={item.score}>
                <span>{item.score}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${Math.min(item.probability * 500, 100)}%` }}
                  />
                </div>
                <strong>{pct(item.probability)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>GOLES</span>
              <h3>Expectativa ofensiva</h3>
            </div>
          </div>
          <div className={styles.metricPair}>
            <div><span>xG {home.short}</span><strong>{data ? data.expectedHomeGoals.toFixed(2) : "—"}</strong></div>
            <div><span>xG {away.short}</span><strong>{data ? data.expectedAwayGoals.toFixed(2) : "—"}</strong></div>
          </div>
          <div className={styles.miniStats}>
            <div><span>+2.5 goles</span><strong>{data ? pct(data.over25) : "—"}</strong></div>
            <div><span>Ambos marcan</span><strong>{data ? pct(data.bothTeamsToScore) : "—"}</strong></div>
          </div>
        </article>
      </section>

      <section className={styles.marketGrid}>
        <article className={styles.marketCard}>
          <span className={styles.marketIcon}>⌖</span>
          <div><small>CORNERS</small><strong>{data ? data.meanTotalCorners.toFixed(1) : "—"}</strong><span>promedio</span></div>
          <ul>
            <li>+8.5 <b>{data ? pct(data.cornersOver85) : "—"}</b></li>
            <li>+10.5 <b>{data ? pct(data.cornersOver105) : "—"}</b></li>
          </ul>
        </article>

        <article className={styles.marketCard}>
          <span className={styles.marketIcon}>▰</span>
          <div><small>TARJETAS</small><strong>{data ? data.meanTotalYellows.toFixed(1) : "—"}</strong><span>promedio</span></div>
          <ul>
            <li>+3.5 <b>{data ? pct(data.cardsOver35) : "—"}</b></li>
            <li>Roja <b>{data ? pct(data.redCardProbability) : "—"}</b></li>
          </ul>
        </article>

        <article className={styles.marketCard}>
          <span className={styles.marketIcon}>●</span>
          <div><small>PENAL</small><strong>{data ? pct(data.penaltyProbability) : "—"}</strong><span>al menos uno</span></div>
          <ul>
            <li>Motor <b>separado</b></li>
            <li>Seed <b>{data?.seed ?? 42}</b></li>
          </ul>
        </article>
      </section>

      <section className={styles.scenarioPanel}>
        <div>
          <span className={styles.eyebrow}>ESCENARIOS</span>
          <h3>¿Qué pasa si cambia el XI?</h3>
          <p>Compará el mundo base con una ausencia ofensiva importante.</p>
        </div>

        <div className={styles.scenarioButtons}>
          <button
            type="button"
            className={scenario === "base" ? styles.activeScenario : ""}
            onClick={() => setScenario("base")}
          >
            XI esperado
          </button>
          <button
            type="button"
            className={scenario === "without-star" ? styles.activeScenario : ""}
            onClick={() => setScenario("without-star")}
          >
            Sin figura ofensiva
          </button>
        </div>

        <div className={styles.impactBox}>
          <div><span>P({home.short})</span><strong>{data ? pct(data.homeWin) : "—"}</strong></div>
          <div className={styles.arrow}>→</div>
          <div><span>xG {home.short}</span><strong>{data ? data.expectedHomeGoals.toFixed(2) : "—"}</strong></div>
        </div>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>UN MUNDO SIMULADO</span>
            <h3>Ejemplo de cómo puede evolucionar uno de los futuros</h3>
          </div>
          <span className={styles.seed}>seed {data?.seed ?? 42}</span>
        </div>
        <div className={styles.timeline}>
          {[
            ["18'", "🟨", away.short, "Amarilla"],
            ["27'", "🚩", home.short, "Corner"],
            ["34'", "⚽", home.short, "Gol · 1-0"],
            ["63'", "🚩", away.short, "Corner"],
            ["72'", "⚽", away.short, "Gol · 1-1"],
            ["77'", "🟥", away.short, "Roja"],
            ["90+4'", "⚽", home.short, "Gol · 2-1"],
          ].map(([minute, icon, side, text]) => (
            <div className={styles.timelineRow} key={String(minute)}>
              <span className={styles.minute}>{minute}</span>
              <span className={styles.eventIcon}>{icon}</span>
              <strong>{side}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        Motor activo: {data?.source === "football-simulator"
          ? "football-simulator"
          : data?.source === "viralio-learned"
            ? "modelo aprendido promovido"
            : "Monte Carlo integrado en Viralio"}.
        {data?.modelVersion ? ` Modelo ${data.modelVersion} · ${data.competitionKey ?? "competencia sin etiqueta"} · validado en ${data.validationAlignedPredictions ?? "—"} partidos alineados.` : " Los parámetros de fuerza todavía se calibrarán con el feed histórico productivo."}
      </footer>
    </main>
  );
}
