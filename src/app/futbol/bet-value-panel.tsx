"use client";

import { useMemo, useState } from "react";
import styles from "./football.module.css";

type Props = {
  homeLabel: string;
  awayLabel: string;
  homeProbability: number;
  drawProbability: number;
  awayProbability: number;
};

type Outcome = {
  key: "home" | "draw" | "away";
  label: string;
  probability: number;
};

const EDGE_BUFFER = 0.05;

function fairOdds(probability: number) {
  return probability > 0 ? 1 / probability : 0;
}

function minimumValueOdds(probability: number) {
  return fairOdds(probability) * (1 + EDGE_BUFFER);
}

function parseOdds(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : null;
}

function statusFor(bookmakerOdds: number | null, minimumOdds: number) {
  if (bookmakerOdds === null) {
    return { label: "INGRESÁ CUOTA", tone: "neutral" as const };
  }

  const ratio = bookmakerOdds / minimumOdds;
  if (ratio >= 1.02) {
    return { label: "HAY VALOR", tone: "positive" as const };
  }
  if (ratio >= 0.98) {
    return { label: "CUOTA JUSTA", tone: "warning" as const };
  }
  return { label: "SIN VALOR", tone: "negative" as const };
}

export default function BetValuePanel({
  homeLabel,
  awayLabel,
  homeProbability,
  drawProbability,
  awayProbability,
}: Props) {
  const [odds, setOdds] = useState({
    home: "",
    draw: "",
    away: "",
  });

  const outcomes = useMemo<Outcome[]>(
    () => [
      { key: "home", label: homeLabel, probability: homeProbability },
      { key: "draw", label: "Empate", probability: drawProbability },
      { key: "away", label: awayLabel, probability: awayProbability },
    ],
    [homeLabel, awayLabel, homeProbability, drawProbability, awayProbability],
  );

  return (
    <section className={styles.valuePanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>VALOR DE APUESTA · 1X2</span>
          <h3>¿Desde qué cuota empieza a haber valor?</h3>
        </div>
        <span className={styles.valueRule}>+5% edge mínimo</span>
      </div>

      <p className={styles.valueIntro}>
        Compará la cuota de la casa contra nuestro mínimo. Verde significa que la cuota
        supera el umbral del modelo; no garantiza un resultado.
      </p>

      <div className={styles.valueGrid}>
        {outcomes.map((outcome) => {
          const fair = fairOdds(outcome.probability);
          const minimum = minimumValueOdds(outcome.probability);
          const bookmaker = parseOdds(odds[outcome.key]);
          const status = statusFor(bookmaker, minimum);
          const expectedEdge =
            bookmaker === null
              ? null
              : outcome.probability * bookmaker - 1;

          return (
            <article
              className={`${styles.valueCard} ${styles[`valueCard_${status.tone}`]}`}
              key={outcome.key}
            >
              <div className={styles.valueCardTop}>
                <div>
                  <span>{outcome.label}</span>
                  <strong>{(outcome.probability * 100).toFixed(1)}%</strong>
                </div>
                <span className={styles.valueBadge}>{status.label}</span>
              </div>

              <div className={styles.oddsNumbers}>
                <div>
                  <span>Cuota justa</span>
                  <strong>{fair.toFixed(2)}</strong>
                </div>
                <div className={styles.minimumOdds}>
                  <span>Cuota mínima</span>
                  <strong>{minimum.toFixed(2)}</strong>
                </div>
              </div>

              <label className={styles.bookmakerInput}>
                <span>Cuota de la casa</span>
                <input
                  inputMode="decimal"
                  placeholder={minimum.toFixed(2)}
                  value={odds[outcome.key]}
                  onChange={(event) =>
                    setOdds((current) => ({
                      ...current,
                      [outcome.key]: event.target.value,
                    }))
                  }
                />
              </label>

              {expectedEdge !== null ? (
                <div className={styles.edgeLine}>
                  Edge estimado{" "}
                  <b>
                    {expectedEdge >= 0 ? "+" : ""}
                    {(expectedEdge * 100).toFixed(1)}%
                  </b>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className={styles.valueLegend}>
        <span><i className={styles.legendRed} /> por debajo del mínimo</span>
        <span><i className={styles.legendAmber} /> alrededor del mínimo</span>
        <span><i className={styles.legendGreen} /> supera el mínimo</span>
      </div>
    </section>
  );
}
