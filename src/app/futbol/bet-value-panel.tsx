"use client";

import { useMemo, useState } from "react";
import {
  classifyValue,
  expectedValueEdge,
  fairOdds,
  minimumValueOdds,
  parseDecimalOdds,
} from "./bet-value";
import upcomingFixtures from "./upcoming-denmark-271.json";
import upcomingOdds from "./upcoming-denmark-271-odds.json";
import styles from "./football.module.css";

type Props = {
  homeLabel: string;
  awayLabel: string;
  homeTeamName: string;
  awayTeamName: string;
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

type DoubleChanceKey = "homeDraw" | "drawAway" | "homeAway";

type OddsQuote = {
  value: number;
  bookmaker_id: number | null;
  bookmaker: string | null;
  updated_at: string | null;
};

type FixtureOdds = {
  "1X2": Record<"1" | "X" | "2", OddsQuote | null>;
  double_chance: Record<"1X" | "X2" | "12", OddsQuote | null>;
  secondary: {
    over_2_5: OddsQuote | null;
    btts_yes: OddsQuote | null;
    btts_no: OddsQuote | null;
  };
};

export default function BetValuePanel({
  homeLabel,
  awayLabel,
  homeTeamName,
  awayTeamName,
  homeProbability,
  drawProbability,
  awayProbability,
  over25Probability,
  bttsProbability,
  cornersOver85Probability,
  cardsOver35Probability,
}: Props) {
  const [oddsOverrides, setOddsOverrides] = useState<Record<string, string>>({});
  const [doubleChanceOverrides, setDoubleChanceOverrides] = useState<Record<string, string>>({});

  const selectedFixtureOdds = useMemo(() => {
    const fixture = upcomingFixtures.fixtures.find(
      (item) =>
        item.home_team === homeTeamName &&
        item.away_team === awayTeamName,
    );
    if (!fixture) return null;

    const oddsMap = upcomingOdds.fixtures as Record<string, FixtureOdds>;
    return oddsMap[String(fixture.fixture_id)] ?? null;
  }, [homeTeamName, awayTeamName]);

  const fixtureKey = `${homeTeamName}::${awayTeamName}`;

  const defaultOneXTwo = {
    home: selectedFixtureOdds?.["1X2"]?.["1"]?.value.toFixed(2) ?? "",
    draw: selectedFixtureOdds?.["1X2"]?.["X"]?.value.toFixed(2) ?? "",
    away: selectedFixtureOdds?.["1X2"]?.["2"]?.value.toFixed(2) ?? "",
  };

  const defaultDoubleChance: Record<DoubleChanceKey, string> = {
    homeDraw: selectedFixtureOdds?.double_chance?.["1X"]?.value.toFixed(2) ?? "",
    drawAway: selectedFixtureOdds?.double_chance?.["X2"]?.value.toFixed(2) ?? "",
    homeAway: selectedFixtureOdds?.double_chance?.["12"]?.value.toFixed(2) ?? "",
  };

  const outcomes = useMemo<Outcome[]>(
    () => [
      { key: "home", label: homeLabel, probability: homeProbability },
      { key: "draw", label: "Empate", probability: drawProbability },
      { key: "away", label: awayLabel, probability: awayProbability },
    ],
    [homeLabel, awayLabel, homeProbability, drawProbability, awayProbability],
  );

  const doubleChance = [
    {
      key: "homeDraw" as const,
      label: "1X",
      detail: `${homeLabel} o empate`,
      probability: homeProbability + drawProbability,
    },
    {
      key: "drawAway" as const,
      label: "X2",
      detail: `Empate o ${awayLabel}`,
      probability: drawProbability + awayProbability,
    },
    {
      key: "homeAway" as const,
      label: "12",
      detail: "Sin empate",
      probability: homeProbability + awayProbability,
    },
  ];

  const quickMarkets = [
    {
      label: "+2.5 goles",
      probability: over25Probability,
      quote: selectedFixtureOdds?.secondary?.over_2_5 ?? null,
    },
    {
      label: "Ambos marcan",
      probability: bttsProbability,
      quote: selectedFixtureOdds?.secondary?.btts_yes ?? null,
    },
    { label: "+8.5 corners", probability: cornersOver85Probability, quote: null },
    { label: "+3.5 tarjetas", probability: cardsOver35Probability, quote: null },
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
        {selectedFixtureOdds
          ? "Cuotas reales precargadas con el mejor precio disponible en el feed. Podés editarlas para comparar otra casa."
          : "Compará la cuota de la casa contra nuestro mínimo. Verde significa que la cuota supera el umbral del modelo; no garantiza un resultado."}
      </p>

      <div className={styles.valueGrid}>
        {outcomes.map((outcome) => {
          const fair = fairOdds(outcome.probability);
          const minimum = minimumValueOdds(outcome.probability);
          const overrideKey = `${fixtureKey}:1X2:${outcome.key}`;
          const displayedOdds =
            oddsOverrides[overrideKey] ?? defaultOneXTwo[outcome.key];
          const bookmaker = parseDecimalOdds(displayedOdds);
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
                <span>
                  {outcome.key === "home"
                    ? selectedFixtureOdds?.["1X2"]?.["1"]?.bookmaker ?? "Cuota de la casa"
                    : outcome.key === "draw"
                      ? selectedFixtureOdds?.["1X2"]?.["X"]?.bookmaker ?? "Cuota de la casa"
                      : selectedFixtureOdds?.["1X2"]?.["2"]?.bookmaker ?? "Cuota de la casa"}
                </span>
                <input
                  inputMode="decimal"
                  placeholder={minimum.toFixed(2)}
                  value={displayedOdds}
                  onChange={(event) =>
                    setOddsOverrides((current) => ({
                      ...current,
                      [overrideKey]: event.target.value,
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

      <div className={styles.doubleChanceHeader}>
        <div>
          <span className={styles.eyebrow}>DOBLE OPORTUNIDAD</span>
          <h4>1X · X2 · 12</h4>
        </div>
        <span>mismo umbral: +5% edge</span>
      </div>

      <div className={styles.doubleChanceGrid}>
        {doubleChance.map((market) => {
          const fair = fairOdds(market.probability);
          const minimum = minimumValueOdds(market.probability);
          const overrideKey = `${fixtureKey}:dc:${market.key}`;
          const displayedOdds =
            doubleChanceOverrides[overrideKey] ?? defaultDoubleChance[market.key];
          const bookmaker = parseDecimalOdds(displayedOdds);
          const status = classifyValue(bookmaker, fair, minimum);
          const expectedEdge =
            bookmaker === null
              ? null
              : expectedValueEdge(market.probability, bookmaker);

          return (
            <article
              className={`${styles.doubleChanceCard} ${styles[`valueCard_${status.tone}`]}`}
              key={market.key}
            >
              <div className={styles.valueCardTop}>
                <div>
                  <span>{market.detail}</span>
                  <strong>{market.label}</strong>
                </div>
                <span className={styles.valueBadge}>{status.label}</span>
              </div>

              <div className={styles.doubleChanceProbability}>
                <span>Probabilidad</span>
                <strong>{(market.probability * 100).toFixed(1)}%</strong>
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
                <span>
                  {market.key === "homeDraw"
                    ? selectedFixtureOdds?.double_chance?.["1X"]?.bookmaker ?? "Cuota de la casa"
                    : market.key === "drawAway"
                      ? selectedFixtureOdds?.double_chance?.["X2"]?.bookmaker ?? "Cuota de la casa"
                      : selectedFixtureOdds?.double_chance?.["12"]?.bookmaker ?? "Cuota de la casa"}
                </span>
                <input
                  inputMode="decimal"
                  placeholder={minimum.toFixed(2)}
                  value={displayedOdds}
                  onChange={(event) =>
                    setDoubleChanceOverrides((current) => ({
                      ...current,
                      [overrideKey]: event.target.value,
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
        {quickMarkets.map((market) => {
          const fair = fairOdds(market.probability);
          const minimum = minimumValueOdds(market.probability);
          const actual = market.quote?.value ?? null;
          const status = classifyValue(actual, fair, minimum);
          const edge =
            actual === null
              ? null
              : expectedValueEdge(market.probability, actual);

          return (
            <div
              className={styles[`valueCard_${status.tone}`]}
              key={market.label}
            >
              <span>{market.label}</span>
              <strong>{(market.probability * 100).toFixed(1)}%</strong>
              <small>mín {minimum.toFixed(2)}</small>
              {actual !== null ? (
                <small>
                  {market.quote?.bookmaker ?? "Casa"} {actual.toFixed(2)}
                  {edge !== null ? ` · ${edge >= 0 ? "+" : ""}${(edge * 100).toFixed(1)}%` : ""}
                </small>
              ) : (
                <small>sin cuota real</small>
              )}
            </div>
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
