"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import auditedSignals from "./upcoming-denmark-271-signals.json";
import signalHistory from "./free-denmark-271-signal-history.json";
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
  clv_learning?: {
    adjustment: number;
    ranking_score: number;
    evidence_samples: number;
    active_segments: number;
    market_sample: number;
    confidence_sample: number;
    edge_sample: number;
    min_segment_sample: number;
    max_adjustment: number;
  };
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

type HistoryPoint = {
  captured_at: string;
  bookmaker_odds: number;
  expected_value_edge: number;
  market_probability: number;
  model_probability: number;
  bookmaker: string | null;
};

type HistoryEntry = {
  fixture_id: number;
  market: string;
  snapshots: number;
  total_snapshots?: number;
  first_odds: number;
  last_odds: number;
  first_edge: number;
  last_edge: number;
  max_edge: number;
  detected_at?: string;
  detected_odds?: number;
  detected_edge?: number;
  detected_bookmaker?: string | null;
  provisional_closing_odds?: number | null;
  provisional_clv?: number | null;
  closing_odds?: number | null;
  clv?: number | null;
  clv_status?: "tracking" | "final" | "unverified_close";
  beat_closing_line?: boolean | null;
  closing_sample_minutes_before_kickoff?: number | null;
  points: HistoryPoint[];
};

type HistorySnapshot = {
  schema_version?: string;
  generated_at?: string;
  clv_definition?: string;
  max_verified_closing_age_minutes?: number;
  entries: Record<string, HistoryEntry>;
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

function historyEntry(fixtureId: number, market: string) {
  const history = signalHistory as HistorySnapshot;
  return history.entries[`${fixtureId}:${market}`] ?? null;
}

function formatClv(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function clvTone(value: number | null | undefined) {
  if (value == null) return "pending" as const;
  if (value > 0.002) return "positive" as const;
  if (value < -0.002) return "negative" as const;
  return "flat" as const;
}

function historicalClvSummary(history: HistorySnapshot) {
  const entries = Object.values(history.entries);
  const finals = entries.filter(
    (entry) => entry.clv_status === "final" && entry.clv != null,
  );
  const verifiedWins = finals.filter((entry) => entry.beat_closing_line === true);
  const avgClv =
    finals.length > 0
      ? finals.reduce((sum, entry) => sum + (entry.clv ?? 0), 0) / finals.length
      : null;

  const byMarket = new Map<string, { count: number; sum: number; wins: number }>();
  for (const entry of finals) {
    const current = byMarket.get(entry.market) ?? { count: 0, sum: 0, wins: 0 };
    current.count += 1;
    current.sum += entry.clv ?? 0;
    current.wins += entry.beat_closing_line ? 1 : 0;
    byMarket.set(entry.market, current);
  }

  const bestMarket = [...byMarket.entries()]
    .map(([market, stats]) => ({
      market,
      count: stats.count,
      avgClv: stats.sum / stats.count,
      hitRate: stats.wins / stats.count,
    }))
    .sort((a, b) => b.avgClv - a.avgClv)[0] ?? null;

  return {
    tracked: entries.length,
    finals: finals.length,
    wins: verifiedWins.length,
    hitRate: finals.length > 0 ? verifiedWins.length / finals.length : null,
    avgClv,
    bestMarket,
  };
}

function historyTrend(entry: HistoryEntry | null) {
  if (!entry || entry.snapshots < 2 || entry.points.length < 2) {
    return {
      label: "NUEVA",
      tone: "new" as const,
      edgeDelta: null,
      oddsDelta: null,
    };
  }

  const previous = entry.points[entry.points.length - 2];
  const current = entry.points[entry.points.length - 1];
  const edgeDelta =
    current.expected_value_edge - previous.expected_value_edge;
  const oddsDelta = current.bookmaker_odds - previous.bookmaker_odds;

  if (edgeDelta >= 0.01) {
    return { label: "↑ MEJORA", tone: "up" as const, edgeDelta, oddsDelta };
  }
  if (edgeDelta <= -0.01) {
    return { label: "↓ EMPEORA", tone: "down" as const, edgeDelta, oddsDelta };
  }
  return { label: "= ESTABLE", tone: "flat" as const, edgeDelta, oddsDelta };
}

export default function ValueScanner({ onSelect }: Props) {
  const snapshot = auditedSignals as AuditedSnapshot;
  const historySnapshot = signalHistory as HistorySnapshot;
  const clvSummary = historicalClvSummary(historySnapshot);
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

      <div className={styles.clvScoreboard}>
        <div className={styles.clvScoreboardHeader}>
          <div>
            <span className={styles.eyebrow}>PRUEBA CONTRA EL MERCADO</span>
            <h4>Closing Line Value</h4>
          </div>
          <span className={styles.clvTrackingPill}>
            {clvSummary.finals > 0 ? "MUESTRA VERIFICADA" : "CONSTRUYENDO MUESTRA"}
          </span>
        </div>

        <div className={styles.clvScoreGrid}>
          <div>
            <span>Señales siguiendo cierre</span>
            <strong>{clvSummary.tracked}</strong>
            <small>mercados con precio de entrada guardado</small>
          </div>
          <div>
            <span>Cierres verificados</span>
            <strong>{clvSummary.finals}</strong>
            <small>muestra tomada ≤ 120 min antes del inicio</small>
          </div>
          <div>
            <span>Batimos al cierre</span>
            <strong>
              {clvSummary.hitRate == null
                ? "—"
                : `${(clvSummary.hitRate * 100).toFixed(0)}%`}
            </strong>
            <small>
              {clvSummary.finals > 0
                ? `${clvSummary.wins} de ${clvSummary.finals}`
                : "todavía no hay partidos cerrados"}
            </small>
          </div>
          <div>
            <span>CLV promedio</span>
            <strong className={styles[`clvText_${clvTone(clvSummary.avgClv)}`]}>
              {formatClv(clvSummary.avgClv)}
            </strong>
            <small>
              {clvSummary.bestMarket
                ? `mejor mercado: ${marketLabel(clvSummary.bestMarket.market as MarketLabel)} · ${formatClv(clvSummary.bestMarket.avgClv)}`
                : "se habilita con el primer cierre verificado"}
            </small>
          </div>
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
              const history = historyEntry(row.fixture_id, signal.market);
              const trend = historyTrend(history);

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
                    <em className={styles[`signalTrend_${trend.tone}`]}>
                      {trend.label}
                    </em>
                    <small>
                      Modelo {(signal.model_probability * 100).toFixed(1)}% ·
                      mercado {(signal.market_probability * 100).toFixed(1)}% ·
                      confianza {(signal.confidence * 100).toFixed(0)}%
                    </small>
                    <small className={styles.clvLearningLine}>
                      {signal.clv_learning?.active_segments
                        ? `Aprendizaje CLV activo · ${signal.clv_learning.evidence_samples} evidencias · ajuste ${formatClv(signal.clv_learning.adjustment)}`
                        : "Aprendizaje CLV en espera · se activa con 5+ cierres por segmento"}
                    </small>
                  </div>

                  {history ? (
                    <div className={styles.clvStrip}>
                      <div>
                        <span>Detectada</span>
                        <strong>{(history.detected_odds ?? history.first_odds).toFixed(2)}</strong>
                      </div>
                      <span className={styles.clvArrow}>→</span>
                      <div>
                        <span>{history.clv_status === "final" ? "Cierre" : "Ahora"}</span>
                        <strong>
                          {(history.clv_status === "final"
                            ? history.closing_odds
                            : history.provisional_closing_odds ?? history.last_odds
                          )?.toFixed(2) ?? "—"}
                        </strong>
                      </div>
                      <span
                        className={`${styles.clvBadge} ${styles[`clvBadge_${clvTone(
                          history.clv_status === "final"
                            ? history.clv
                            : history.provisional_clv,
                        )}`]}`}
                      >
                        CLV {formatClv(
                          history.clv_status === "final"
                            ? history.clv
                            : history.provisional_clv,
                        )}
                      </span>
                    </div>
                  ) : null}

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
          const history = historyEntry(row.fixture_id, signal.market);
          const trend = historyTrend(history);

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
                <small className={styles[`signalTrend_${trend.tone}`]}>
                  {trend.label}
                  {trend.edgeDelta != null
                    ? ` · ${trend.edgeDelta >= 0 ? "+" : ""}${(trend.edgeDelta * 100).toFixed(1)} pp edge`
                    : ""}
                </small>
                <small className={styles.clvLearningMini}>
                  {signal.clv_learning?.active_segments
                    ? `rank ${(signal.clv_learning.ranking_score * 100).toFixed(1)}% · CLV ${formatClv(signal.clv_learning.adjustment)}`
                    : "CLV learn: espera"}
                </small>
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

              <div className={styles.scannerClv}>
                <span>CLV</span>
                {history ? (
                  <>
                    <strong className={styles[`clvText_${clvTone(
                      history.clv_status === "final"
                        ? history.clv
                        : history.provisional_clv,
                    )}`]}>
                      {formatClv(
                        history.clv_status === "final"
                          ? history.clv
                          : history.provisional_clv,
                      )}
                    </strong>
                    <small>
                      {(history.detected_odds ?? history.first_odds).toFixed(2)}
                      {" → "}
                      {(history.clv_status === "final"
                        ? history.closing_odds
                        : history.provisional_closing_odds ?? history.last_odds
                      )?.toFixed(2) ?? "—"}
                    </small>
                  </>
                ) : (
                  <strong>—</strong>
                )}
              </div>

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
