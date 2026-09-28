"use client";

import { useMemo, useState } from "react";
import { simulateLearned } from "../api/futbol/learned-model";
import upcomingDenmark from "./upcoming-denmark-271.json";
import upcomingOdds from "./upcoming-denmark-271-odds.json";
import {
  classifyValue,
  confidenceAdjustedEdgeBuffer,
  expectedValueEdge,
  fairOdds,
  impliedProbability,
  isHighModelMarketDivergence,
  isThinBookmakerMarket,
  minimumValueOdds,
  parseDecimalOdds,
  probabilityEdge,
} from "./bet-value";
import styles from "./football.module.css";

type UpcomingFixture = {
  fixture_id: number;
  kickoff_at: string;
  home_team: string;
  away_team: string;
};

type MarketCandidate = {
  label: "1" | "X" | "2" | "1X" | "X2" | "12" | "O2.5" | "BTTS";
  probability: number;
};

type OddsQuote = {
  value: number;
  bookmaker_id: number | null;
  bookmaker: string | null;
  updated_at: string | null;
  previous_value?: number;
  delta?: number;
  movement?: "up" | "down" | "flat";
  bookmaker_count?: number;
  median_value?: number;
  best_vs_median?: number;
};

type Props = {
  onSelect?: (homeTeam: string, awayTeam: string) => void;
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

function marketCandidates(
  home: number,
  draw: number,
  away: number,
  over25: number,
  btts: number,
): MarketCandidate[] {
  return [
    { label: "1", probability: home },
    { label: "X", probability: draw },
    { label: "2", probability: away },
    { label: "1X", probability: home + draw },
    { label: "X2", probability: draw + away },
    { label: "12", probability: home + away },
    { label: "O2.5", probability: over25 },
    { label: "BTTS", probability: btts },
  ];
}

function marketLabel(label: MarketCandidate["label"]) {
  if (label === "O2.5") return "+2.5 goles";
  if (label === "BTTS") return "Ambos marcan";
  return label;
}

function quoteFor(
  fixtureOdds: FixtureOdds | undefined,
  label: MarketCandidate["label"],
) {
  if (!fixtureOdds) return null;
  if (label === "1" || label === "X" || label === "2") {
    return fixtureOdds["1X2"][label];
  }
  if (label === "1X" || label === "X2" || label === "12") {
    return fixtureOdds.double_chance[label];
  }
  if (label === "O2.5") {
    return fixtureOdds.secondary?.over_2_5 ?? null;
  }
  return fixtureOdds.secondary?.btts_yes ?? null;
}

export default function ValueScanner({ onSelect }: Props) {
  const fixtures = upcomingDenmark.fixtures as UpcomingFixture[];
  const [bookmakerOdds, setBookmakerOdds] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<
    "all" | "value" | "strong" | "review"
  >("all");

  const rows = useMemo(
    () =>
      fixtures.slice(0, 8).map((fixture) => {
        const prediction = simulateLearned({
          homeTeam: fixture.home_team,
          awayTeam: fixture.away_team,
          simulations: 5000,
          seed: fixture.fixture_id,
          scenario: "base",
        });

        if (!prediction) {
          return null;
        }

        const oddsMap = upcomingOdds.fixtures as Record<string, FixtureOdds>;
        const fixtureOdds = oddsMap[String(fixture.fixture_id)];

        const edgeBuffer = confidenceAdjustedEdgeBuffer(prediction.confidence);

        const candidates = marketCandidates(
          prediction.homeWin,
          prediction.draw,
          prediction.awayWin,
          prediction.over25,
          prediction.bothTeamsToScore,
        ).map((market) => {
          const quote = quoteFor(fixtureOdds, market.label);
          const edge = quote
            ? expectedValueEdge(market.probability, quote.value)
            : null;
          const highDivergence = quote
            ? isHighModelMarketDivergence(
                market.probability,
                quote.value,
                prediction.confidence,
              )
            : false;
          const thinMarket = quote
            ? isThinBookmakerMarket(quote.bookmaker_count)
            : false;
          const reviewReason = highDivergence
            ? "model"
            : thinMarket
              ? "market"
              : null;
          return { market, quote, edge, reviewReason };
        });

        const withQuotes = candidates.filter((candidate) => candidate.quote);
        const actionable = withQuotes.filter(
          (candidate) => !candidate.reviewReason,
        );
        const selectedPool = actionable.length > 0 ? actionable : withQuotes;
        const selected =
          selectedPool.length > 0
            ? selectedPool.sort(
                (a, b) => (b.edge ?? -Infinity) - (a.edge ?? -Infinity),
              )[0]
            : candidates.sort(
                (a, b) => b.market.probability - a.market.probability,
              )[0];

        return {
          fixture,
          market: selected.market,
          quote: selected.quote,
          edge: selected.edge,
          fair: fairOdds(selected.market.probability),
          minimum: minimumValueOdds(selected.market.probability, edgeBuffer),
          edgeBuffer,
          confidence: prediction.confidence,
          reviewReason: selected.reviewReason ?? null,
        };
      })
        .filter(Boolean)
        .sort(
          (a, b) =>
            ((b?.edge ?? -Infinity) as number) -
            ((a?.edge ?? -Infinity) as number),
        ),
    [fixtures],
  );

  const oddsAgeHours =
    (Date.now() - new Date(upcomingOdds.generated_at).getTime()) / 3_600_000;
  const oddsFresh = oddsAgeHours <= 2;

  const quotedRows = rows.filter((row) => row?.quote);
  const reviewRows = quotedRows.filter(
    (row) => row && row.reviewReason,
  );
  const valueRows = quotedRows.filter(
    (row) =>
      row &&
      row.quote &&
      !row.reviewReason &&
      row.quote.value >= row.minimum,
  );
  const strongRows = quotedRows.filter(
    (row) =>
      row &&
      !row.reviewReason &&
      row.edge != null &&
      row.edge >= 0.10 &&
      row.quote &&
      row.quote.value >= row.minimum,
  );
  const topOpportunities = valueRows.slice(0, 3);
  const visibleRows =
    filter === "strong"
      ? strongRows
      : filter === "value"
        ? valueRows
        : filter === "review"
          ? reviewRows
          : rows;

  return (
    <section className={styles.scannerPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>ESCÁNER DE CUOTAS</span>
          <h3>¿Dónde mirar primero?</h3>
          <p className={styles.scannerIntro}>
            Revisa 1, X, 2, 1X, X2, 12, +2.5 goles y ambos marcan con cuotas reales,
            y ordena por mayor edge estimado. Podés editar la cuota para comparar otra casa.
          </p>
        </div>
        <span
          className={
            oddsFresh
              ? styles.valueRule
              : `${styles.valueRule} ${styles.valueRuleStale}`
          }
        >
          {oddsFresh ? "CUOTAS FRESCAS" : "CUOTAS DESACTUALIZADAS"} ·{" "}
          {new Date(upcomingOdds.generated_at).toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {!oddsFresh ? (
        <div className={styles.staleOddsNotice}>
          Las cuotas tienen más de 2 horas. El edge se muestra como referencia,
          pero no debe interpretarse como una oportunidad vigente hasta refrescar el feed.
        </div>
      ) : null}

      <div className={styles.scannerFilters}>
        <button
          type="button"
          className={filter === "all" ? styles.scannerFilterActive : ""}
          onClick={() => setFilter("all")}
        >
          Todos
        </button>
        <button
          type="button"
          className={filter === "value" ? styles.scannerFilterActive : ""}
          onClick={() => setFilter("value")}
        >
          Con valor
        </button>
        <button
          type="button"
          className={filter === "strong" ? styles.scannerFilterActive : ""}
          onClick={() => setFilter("strong")}
        >
          Valor fuerte
        </button>
        <button
          type="button"
          className={filter === "review" ? styles.scannerFilterActive : ""}
          onClick={() => setFilter("review")}
        >
          A revisar
        </button>
      </div>

      <div className={styles.scannerSummary}>
        <div>
          <span>Con cuota real</span>
          <strong>{quotedRows.length}</strong>
        </div>
        <div>
          <span>Con valor</span>
          <strong>{valueRows.length}</strong>
        </div>
        <div>
          <span>Valor fuerte</span>
          <strong>{strongRows.length}</strong>
        </div>
        <div>
          <span>A revisar</span>
          <strong>{reviewRows.length}</strong>
        </div>
      </div>

      {topOpportunities.length > 0 ? (
        <div className={styles.topValueBlock}>
          <div className={styles.topValueHeader}>
            <span className={styles.eyebrow}>TOP OPORTUNIDADES REALES</span>
            <strong>Ordenadas por edge estimado</strong>
          </div>
          <div className={styles.topValueGrid}>
            {topOpportunities.map((row, index) => {
              if (!row || !row.quote) return null;

              return (
                <article className={styles.topValueCard} key={row.fixture.fixture_id}>
                  <span className={styles.topValueRank}>#{index + 1}</span>
                  <div className={styles.topValueFixture}>
                    <span>
                      {new Date(row.fixture.kickoff_at).toLocaleString("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <strong>
                      {row.fixture.home_team} vs {row.fixture.away_team}
                    </strong>
                  </div>

                  <div className={styles.topValueMarket}>
                    <span>Mercado</span>
                    <strong>{marketLabel(row.market.label)}</strong>
                  </div>

                  <div className={styles.topValueNumbers}>
                    <div>
                      <span>Casa</span>
                      <strong>{row.quote.bookmaker ?? "—"}</strong>
                      <small className={styles.oddsMovement}>
                        {row.quote.bookmaker_count ?? 1} casas
                        {row.quote.median_value != null
                          ? ` · mediana ${row.quote.median_value.toFixed(2)}`
                          : ""}
                      </small>
                    </div>
                    <div>
                      <span>Cuota</span>
                      <strong>{row.quote.value.toFixed(2)}</strong>
                      {row.quote.movement ? (
                        <small className={styles.oddsMovement}>
                          {row.quote.movement === "up"
                            ? "↑ subió"
                            : row.quote.movement === "down"
                              ? "↓ bajó"
                              : "= estable"}
                          {row.quote.previous_value != null
                            ? ` · ant ${row.quote.previous_value.toFixed(2)}`
                            : ""}
                        </small>
                      ) : null}
                    </div>
                    <div>
                      <span>Mínima</span>
                      <strong>{row.minimum.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>Edge</span>
                      <strong className={styles.topValueEdge}>
                        +{((row.edge ?? 0) * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                  {onSelect ? (
                    <button
                      type="button"
                      className={styles.topValueAction}
                      onClick={() =>
                        onSelect(
                          row.fixture.home_team,
                          row.fixture.away_team,
                        )
                      }
                    >
                      Ver análisis
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.noValueNotice}>
          No hay mercados que superen el umbral de valor ajustado por confianza.
        </div>
      )}

      <div className={styles.scannerRows}>
        {visibleRows.map((row) => {
          if (!row) return null;

          const raw =
            bookmakerOdds[row.fixture.fixture_id] ??
            (row.quote ? row.quote.value.toFixed(2) : "");
          const bookmaker = parseDecimalOdds(raw);
          const status = classifyValue(bookmaker, row.fair, row.minimum);
          const edge =
            bookmaker === null
              ? null
              : expectedValueEdge(row.market.probability, bookmaker);
          const marketProbability =
            bookmaker === null ? null : impliedProbability(bookmaker);
          const probabilityGap =
            bookmaker === null
              ? null
              : probabilityEdge(row.market.probability, bookmaker);
          const highDivergence =
            bookmaker === null
              ? false
              : isHighModelMarketDivergence(
                  row.market.probability,
                  bookmaker,
                  row.confidence,
                );
          const thinMarket = isThinBookmakerMarket(
            row.quote?.bookmaker_count,
          );
          const reviewReason = highDivergence
            ? "model"
            : thinMarket
              ? "market"
              : null;
          const displayTone = reviewReason ? "warning" : status.tone;

          return (
            <article
              className={`${styles.scannerRow} ${styles[`scannerRow_${displayTone}`]}`}
              key={row.fixture.fixture_id}
            >
              <div className={styles.scannerFixture}>
                <span>
                  {new Date(row.fixture.kickoff_at).toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <strong>
                  {row.fixture.home_team} vs {row.fixture.away_team}
                </strong>
              </div>

              <div className={styles.scannerMarket}>
                <span>Mercado</span>
                <strong>{marketLabel(row.market.label)}</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Prob.</span>
                <strong>{(row.market.probability * 100).toFixed(1)}%</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Justa</span>
                <strong>{row.fair.toFixed(2)}</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Mínima</span>
                <strong className={styles.scannerMinimum}>
                  {row.minimum.toFixed(2)}
                </strong>
              </div>

              <label className={styles.scannerInput}>
                <span>
                  {row.quote?.bookmaker ?? "Casa"}
                  {row.quote?.movement
                    ? row.quote.movement === "up"
                      ? " · ↑"
                      : row.quote.movement === "down"
                        ? " · ↓"
                        : " · ="
                    : ""}
                </span>
                <input
                  inputMode="decimal"
                  placeholder={row.minimum.toFixed(2)}
                  value={raw}
                  onChange={(event) =>
                    setBookmakerOdds((current) => ({
                      ...current,
                      [row.fixture.fixture_id]: event.target.value,
                    }))
                  }
                />
              </label>

              <div className={styles.scannerMarketGap}>
                <span>Modelo vs mercado</span>
                <strong>
                  {marketProbability === null || probabilityGap === null
                    ? "—"
                    : `${(row.market.probability * 100).toFixed(1)}% vs ${(marketProbability * 100).toFixed(1)}% · ${probabilityGap >= 0 ? "+" : ""}${(probabilityGap * 100).toFixed(1)} pp`}
                </strong>
              </div>

              <span
                className={
                  reviewReason
                    ? `${styles.scannerBadge} ${styles.scannerBadgeReview}`
                    : edge !== null && edge >= 0.10
                      ? `${styles.scannerBadge} ${styles.scannerBadgeStrong}`
                      : styles.scannerBadge
                }
              >
                {row.quote
                  ? reviewReason === "model"
                    ? "REVISAR MODELO"
                    : reviewReason === "market"
                      ? "MERCADO FINO"
                      : edge !== null && edge >= 0.10
                        ? "VALOR FUERTE"
                        : status.label
                  : "SIN CUOTA"}
                {edge !== null ? (
                  <small>
                    {edge >= 0 ? "+" : ""}
                    {(edge * 100).toFixed(1)}%
                  </small>
                ) : null}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
