"use client";

import { useMemo, useState } from "react";
import styles from "./football.module.css";

type TeamPreset = {
  name: string;
  short: string;
  primary: string;
  secondary: string;
};

const TEAMS: TeamPreset[] = [
  { name: "Boca Juniors", short: "BOC", primary: "#0b2a66", secondary: "#f4cf2f" },
  { name: "Estudiantes", short: "EST", primary: "#d51f2b", secondary: "#ffffff" },
  { name: "River Plate", short: "RIV", primary: "#ffffff", secondary: "#d71920" },
  { name: "Racing Club", short: "RAC", primary: "#78c7f2", secondary: "#ffffff" },
];

const SCORELINES = [
  ["1-0", 13.8],
  ["1-1", 12.6],
  ["2-0", 9.7],
  ["2-1", 9.3],
  ["0-0", 8.4],
  ["0-1", 7.6],
];

const BASE = {
  home: 47.8,
  draw: 28.4,
  away: 23.8,
  xgHome: 1.52,
  xgAway: 0.99,
  corners: 9.6,
  cards: 5.1,
  red: 17.4,
  penalty: 22.1,
  confidence: 86,
};

export default function FootballLab() {
  const [homeTeam, setHomeTeam] = useState(TEAMS[0].name);
  const [awayTeam, setAwayTeam] = useState(TEAMS[1].name);
  const [scenario, setScenario] = useState<"base" | "without-star">("base");
  const [simulated, setSimulated] = useState(false);

  const home = TEAMS.find((team) => team.name === homeTeam) ?? TEAMS[0];
  const away = TEAMS.find((team) => team.name === awayTeam) ?? TEAMS[1];

  const result = useMemo(() => {
    const penalty = scenario === "without-star" ? 4.7 : 0;
    const newHome = BASE.home - penalty;
    const redistributed = penalty / 2;
    return {
      ...BASE,
      home: newHome,
      draw: BASE.draw + redistributed,
      away: BASE.away + redistributed,
      xgHome: scenario === "without-star" ? 1.34 : BASE.xgHome,
      confidence: scenario === "without-star" ? 82 : BASE.confidence,
    };
  }, [scenario]);

  function swapTeams() {
    setHomeTeam(awayTeam);
    setAwayTeam(homeTeam);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.kicker}>FOOTBALL PROBABILISTIC DIGITAL TWIN</div>
        <h1>100.000 futuros posibles para un mismo partido.</h1>
        <p>
          Un laboratorio de simulación que combina fuerza de equipo, forma, XI, contexto,
          goles, corners, tarjetas y escenarios de alineación.
        </p>
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

        <button className={styles.swapButton} type="button" onClick={swapTeams} aria-label="Intercambiar equipos">
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

        <button
          className={styles.simulateButton}
          type="button"
          onClick={() => setSimulated(true)}
        >
          {simulated ? "Volver a simular" : "Simular partido"}
        </button>
      </section>

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
          <strong>{result.home.toFixed(1)}%</strong>
          <span className={styles.mainOutcome}>gana {home.name}</span>
          <div className={styles.worlds}>100.000 mundos simulados</div>
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
        <article>
          <span>Local</span>
          <strong>{result.home.toFixed(1)}%</strong>
        </article>
        <article>
          <span>Empate</span>
          <strong>{result.draw.toFixed(1)}%</strong>
        </article>
        <article>
          <span>Visitante</span>
          <strong>{result.away.toFixed(1)}%</strong>
        </article>
        <article>
          <span>Confianza</span>
          <strong>{result.confidence}/100</strong>
        </article>
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
            {SCORELINES.map(([score, pct]) => (
              <div className={styles.scoreRow} key={String(score)}>
                <span>{score}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${Number(pct) * 5}%` }} />
                </div>
                <strong>{pct}%</strong>
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
            <div>
              <span>xG {home.short}</span>
              <strong>{result.xgHome.toFixed(2)}</strong>
            </div>
            <div>
              <span>xG {away.short}</span>
              <strong>{result.xgAway.toFixed(2)}</strong>
            </div>
          </div>
          <div className={styles.miniStats}>
            <div><span>+2.5 goles</span><strong>44%</strong></div>
            <div><span>Ambos marcan</span><strong>47%</strong></div>
          </div>
        </article>
      </section>

      <section className={styles.marketGrid}>
        <article className={styles.marketCard}>
          <span className={styles.marketIcon}>⌖</span>
          <div><small>CORNERS</small><strong>{result.corners}</strong><span>promedio</span></div>
          <ul><li>+8.5 <b>57%</b></li><li>+10.5 <b>34%</b></li></ul>
        </article>
        <article className={styles.marketCard}>
          <span className={styles.marketIcon}>▰</span>
          <div><small>TARJETAS</small><strong>{result.cards}</strong><span>promedio</span></div>
          <ul><li>+3.5 <b>72%</b></li><li>Roja <b>{result.red}%</b></li></ul>
        </article>
        <article className={styles.marketCard}>
          <span className={styles.marketIcon}>●</span>
          <div><small>PENAL</small><strong>{result.penalty}%</strong><span>al menos uno</span></div>
          <ul><li>Modelo <b>separado</b></li><li>Árbitro <b>incluido</b></li></ul>
        </article>
      </section>

      <section className={styles.scenarioPanel}>
        <div>
          <span className={styles.eyebrow}>ESCENARIOS</span>
          <h3>¿Qué pasa si cambia el XI?</h3>
          <p>
            Probá el impacto de una ausencia importante sin tocar el modelo base del equipo.
          </p>
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
          <div>
            <span>P({home.short})</span>
            <strong>{scenario === "base" ? "47.8%" : "43.1%"}</strong>
          </div>
          <div className={styles.arrow}>→</div>
          <div>
            <span>xG {home.short}</span>
            <strong>{result.xgHome.toFixed(2)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>UN MUNDO SIMULADO</span>
            <h3>Así podría desarrollarse uno de los futuros</h3>
          </div>
          <span className={styles.seed}>seed 42</span>
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
        Versión laboratorio · Los valores actuales son demostrativos hasta conectar el feed histórico y la calibración productiva.
      </footer>
    </main>
  );
}
