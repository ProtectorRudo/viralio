"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import auditedSignals from "./upcoming-denmark-271-signals.json";
import {
  classifyValue,
  expectedValueEdge,
  impliedProbability,
  isHighProbabilityDivergence,
  isOddsSnapshotStale,
  oddsSnapshotAgeMinutes,
  parseDecimalOdds,
} from "./bet-value";
import styles from "./football.module.css";

type MarketLabel = "1" | "X" | "2" | "1X" | "X2" | "12" | "O2.5" | "BTTS";

type AuditedSignal = {
  market: MarketLabel;
  model_probability: number;
  market_probability: number;
  fair_odds: number;
  minimum_odds: number;
  bookmaker_odds: number;
  bookmaker: string | null;
  bookmaker_count: number;
  median_odds: number | null;
  expected_value_edge: number;
  probability_gap: number;
  confidence: number;
  review_reason: string | null;
  qualifies: boolean;
};

type AuditedFixture = {
  fixture_id: number;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  data_confidence: number;
  selected_signal: AuditedSignal | null;
  model: {
    home_win: number;
    draw: number;
    away_win: number;
    over_2_5: number;
    both_teams_to_score: number;
  };
};

type AuditedSnapshot = {
  schema_version: string;
  generated_at: string;
  odds_generated_at: string;
  profile_cutoff_at: string;
  fixtures: AuditedFixture[];
};

type Props = {
  onSelect?: (homeTeam: string, awayTeam: string) => void;
};

const MAX_ODDS_AGE_MINUTES = 90;

function subscribeClock(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}

function getClockSnapshot() {
  return Math.floor(Date.now() / 60_000);
}

function getServerClockSnapshot() {
  return 0;
}

function marketLabel(label: MarketLabel) {
  if (label === "O2.5") return "+2.5 goles";
  if (label === "BTTS") return "Ambos marcan";
  return label;
}

function reviewLabel(reason: string | null) {
  if (reason === "model_divergence") return "REVISAR MODELO";
  if (reason === "thin_market") return "MERCADO FINO";
  return "A REVISAR";
}

export default function ValueScanner({ onSelect }: Props) {
  const snapshot = auditedSignals as AuditedSnapshot;
  const [bookmakerOdds, setBookmakerOdds] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<
    "all" | "value" | "strong" | "review"
  >("all");

  const minuteTick = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );

  const nowMs =
    minuteTick === 0
      ? Date.parse(snapshot.odds_generated_at)
      : minuteTick * 60_000;

  const oddsAgeMinutes = oddsSnapshotAgeMinutes(
    snapshot.odds_generated_at,
    nowMs,
  );
  const staleFeed = isOddsSnapshotStale(
    snapshot.odds_generated_at,
    MAX_ODDS_AGE_MINUTES,
    nowMs,
  );

  const rows = useMemo(
    () =>
      snapshot.fixtures
        .filter((fixture) => fixture.selected_signal)
        .sort(
          (a, b) =>
            (b.selected_signal?.expected_value_edge ?? -Infinity) -
            (a.selected_signal?.expected_value_edge ?? -Infinity),
        ),
    [snapshot.fixtures],
  );

  const quotedRows = rows.filter(
    (row) => row.selected_signal?.bookmaker_odds != null,
  );

  const reviewRows = rows.filter(
    (row) => row.selected_signal?.review_reason,
  );

  const valueRows = staleFeed
    ? []
    : rows.filter(
        (row) =>
          row.selected_signal?.qualifies &&
          !row.selected_signal.review_reason &&
          row.selected_signal.bookmaker_odds >=
            row.selected_signal.minimum_odds,
      );

  const strongRows = valueRows.filter(
    (row) => (row.selected_signal?.expected_value_edge ?? 0) >= 0.10,
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
          <span className={styles.eyebrow}>ESCÁNER AUDITADO DE CUOTAS</span>
          <h3>¿Dónde mirar primero?</h3>
          <p className={styles.scannerIntro}>
            Señales calculadas por el backend con modelo, consenso sin vig,
            profundidad de mercado y umbral ajustado por confianza.
          </p>
        </div>
        <span
          className={
            staleFeed
              ? `${styles.valueRule} ${styles.oddsFeedStale}`
              : `${styles.valueRule} ${styles.oddsFeedFresh}`
          }
          suppressHydrationWarning
        >
          <strong>{staleFeed ? "CUOTAS VIEJAS" : "CUOTAS FRESCAS"}</strong>
          <small>
            capturadas{" "}
            {new Date(snapshot.odds_generated_at).toLocaleTimeString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {Math.round(oddsAgeMinutes)} min
            {" · auto cada 1h"}
          </small>
        </span>
      </div>

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

      {staleFeed ? (
        <div className={styles.staleOddsNotice}>
          El feed de cuotas superó {MAX_ODDS_AGE_MINUTES} minutos. Las señales
          automáticas quedan suspendidas hasta el próximo refresco. Podés ingresar
          una cuota manual para evaluarla puntualmente.
        </div>
      ) : null}

      <div className={styles.scannerSummary}>
        <div>
          <span>Con cuota real</span>
          <strong>{quotedRows.length}</strong>
        </div>
        <div>
          <span>Con valor vigente</span>
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
            <span className={styles.eyebrow}>TOP OPORTUNIDADES AUDITADAS</span>
            <strong>Ordenadas por edge estimado</strong>
          </div>

          <div className={styles.topValueGrid}>
            {topOpportunities.map((row, index) => {
              const signal = row.selected_signal;
              if (!signal) return null;

              return (
                <article className={styles.topValueCard} key={row.fixture_id}>
                  <span className={styles.topValueRank}>#{index + 1}</span>

                  <div className={styles.topValueFixture}>
                    <span>
                      {new Date(row.kickoff_at).toLocaleString("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <strong>
                      {row.home_team} vs {row.away_team}
                    </strong>
                  </div>

                  <div className={styles.topValueMarket}>
                    <span>Mercado</span>
                    <strong>{marketLabel(signal.market)}</strong>
                    <small>
                      Modelo {(signal.model_probability * 100).toFixed(1)}% ·
                      mercado {(signal.market_probability * 100).toFixed(1)}% ·
                      confianza {(signal.confidence * 100).toFixed(0)}%
                    </small>
                  </div>

                  <div className={styles.topValueNumbers}>
                    <div>
                      <span>Casa</span>
                      <strong>{signal.bookmaker ?? "—"}</strong>
                      <small className={styles.oddsMovement}>
                        {signal.bookmaker_count} casas
                        {signal.median_odds != null
                          ? ` · mediana ${signal.median_odds.toFixed(2)}`
                          : ""}
                      </small>
                    </div>
                    <div>
                      <span>Cuota</span>
                      <strong>{signal.bookmaker_odds.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>Mínima</span>
                      <strong>{signal.minimum_odds.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>Edge</span>
                      <strong className={styles.topValueEdge}>
                        +{(signal.expected_value_edge * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>

                  {onSelect ? (
                    <button
                      type="button"
                      className={styles.topValueAction}
                      onClick={() => onSelect(row.home_team, row.away_team)}
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
          {staleFeed
            ? "Esperando refresco de cuotas para habilitar oportunidades automáticas."
            : "No hay mercados que superen el umbral de valor auditado."}
        </div>
      )}

      <div className={styles.scannerRows}>
        {visibleRows.map((row) => {
          const signal = row.selected_signal;
          if (!signal) return null;

          const override = bookmakerOdds[row.fixture_id];
          const hasManualOverride = override !== undefined;
          const displayedOdds =
            override ?? signal.bookmaker_odds.toFixed(2);
          const bookmaker = parseDecimalOdds(displayedOdds);
          const manualEdge =
            bookmaker == null
              ? null
              : expectedValueEdge(signal.model_probability, bookmaker);
          const manualMarketProbability =
            bookmaker == null ? null : impliedProbability(bookmaker);
          const manualDivergence =
            manualMarketProbability == null
              ? false
              : isHighProbabilityDivergence(
                  signal.model_probability,
                  manualMarketProbability,
                  signal.confidence * 100,
                );

          const automaticStale = staleFeed && !hasManualOverride;
          const effectiveReviewReason = hasManualOverride
            ? manualDivergence
              ? "model_divergence"
              : null
            : signal.review_reason;

          const status = classifyValue(
            bookmaker,
            signal.fair_odds,
            signal.minimum_odds,
          );

          const effectiveEdge =
            hasManualOverride ? manualEdge : signal.expected_value_edge;

          const displayTone =
            automaticStale || effectiveReviewReason ? "warning" : status.tone;

          const displayLabel = automaticStale
            ? "CUOTA VIEJA"
            : effectiveReviewReason
              ? reviewLabel(effectiveReviewReason)
              : effectiveEdge != null &&
                  effectiveEdge >= 0.10 &&
                  bookmaker != null &&
                  bookmaker >= signal.minimum_odds
                ? "VALOR FUERTE"
                : status.label;

          const marketProbability = hasManualOverride
            ? manualMarketProbability
            : signal.market_probability;

          const probabilityGap =
            marketProbability == null
              ? null
              : signal.model_probability - marketProbability;

          return (
            <article
              className={`${styles.scannerRow} ${styles[`scannerRow_${displayTone}`]}`}
              key={row.fixture_id}
            >
              <div className={styles.scannerFixture}>
                <span>
                  {new Date(row.kickoff_at).toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <strong>
                  {row.home_team} vs {row.away_team}
                </strong>
              </div>

              <div className={styles.scannerMarket}>
                <span>Mercado</span>
                <strong>{marketLabel(signal.market)}</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Prob.</span>
                <strong>{(signal.model_probability * 100).toFixed(1)}%</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Justa</span>
                <strong>{signal.fair_odds.toFixed(2)}</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Mínima</span>
                <strong className={styles.scannerMinimum}>
                  {signal.minimum_odds.toFixed(2)}
                </strong>
              </div>

              <label className={styles.scannerInput}>
                <span>{hasManualOverride ? "Manual" : signal.bookmaker ?? "Casa"}</span>
                <input
                  inputMode="decimal"
                  placeholder={signal.minimum_odds.toFixed(2)}
                  value={displayedOdds}
                  onChange={(event) =>
                    setBookmakerOdds((current) => ({
                      ...current,
                      [row.fixture_id]: event.target.value,
                    }))
                  }
                />
              </label>

              <div className={styles.scannerMarketGap}>
                <span>Modelo vs mercado</span>
                <strong>
                  {marketProbability == null || probabilityGap == null
                    ? "—"
                    : `${(signal.model_probability * 100).toFixed(1)}% vs ${(marketProbability * 100).toFixed(1)}% · ${probabilityGap >= 0 ? "+" : ""}${(probabilityGap * 100).toFixed(1)} pp`}
                </strong>
              </div>

              <span
                className={
                  displayLabel === "VALOR FUERTE"
                    ? `${styles.scannerBadge} ${styles.scannerBadgeStrong}`
                    : automaticStale || effectiveReviewReason
                      ? `${styles.scannerBadge} ${styles.scannerBadgeReview}`
                      : styles.scannerBadge
                }
              >
                {displayLabel}
                {effectiveEdge != null ? (
                  <small>
                    {effectiveEdge >= 0 ? "+" : ""}
                    {(effectiveEdge * 100).toFixed(1)}%
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
