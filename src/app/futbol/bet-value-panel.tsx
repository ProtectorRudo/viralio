"use client";

import { useMemo, useState } from "react";
import {
  classifyValue,
  expectedValueEdge,
  fairOdds,
  minimumValueOdds,
  parseDecimalOdds,
} from "./bet-value";
import styles from "./football.module.css";

type Props = {
  homeLabel: string;
  awayLabel: string;
  homeProbability: number;
  drawProbability: number;
  awayProbability: number;
  over25Probability: number;
  bttsProbability: number;
  cornersOver85Probability: number;
  cardsOver35Probability: number;
};

type Outcome = {
  key: "home" | "draw" | "away";
  label: string;
  probability: number;
};

export default function BetValuePanel({
  homeLabel,
  awayLabel,
  homeProbability,
  drawProbability,
  awayProbability,
  over25Probability,
  bttsProbability,
  cornersOver85Probability,
  cardsOver35Probability,
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

  const quickMarkets = [
    { label: "+2.5 goles", probability: over25Probability },
    { label: "Ambos marcan", probability: bttsProbability },
    { label: "+8.5 corners", probability: cornersOver85Probability },
    { label: "+3.5 tarjetas", probability: cardsOver35Probability },
  ];

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
          const bookmaker = parseDecimalOdds(odds[outcome.key]);
          const status = classifyValue(bookmaker, fair, minimum);
          const expectedEdge =
            bookmaker === null
              ? null
              : expectedValueEdge(outcome.probability, bookmaker);

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

      <div className={styles.quickValueMarkets}>
        {quickMarkets.map((market) => (
          <div key={market.label}>
            <span>{market.label}</span>
            <strong>{(market.probability * 100).toFixed(1)}%</strong>
            <small>
              cuota mín {minimumValueOdds(market.probability).toFixed(2)}
            </small>
          </div>
        ))}
      </div>

      <div className={styles.valueLegend}>
        <span><i className={styles.legendRed} /> por debajo del mínimo</span>
        <span><i className={styles.legendAmber} /> alrededor del mínimo</span>
        <span><i className={styles.legendGreen} /> supera el mínimo</span>
      </div>
    </section>
  );
}
