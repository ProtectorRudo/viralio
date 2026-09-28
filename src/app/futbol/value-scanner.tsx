"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import auditedSignals from "./upcoming-denmark-271-signals.json";
import scotlandSignals from "./free-scotland-501-signals.json";
import signalHistory from "./free-denmark-271-signal-history.json";
import scotlandSignalHistory from "./free-scotland-501-signal-history.json";
import performanceData from "./free-denmark-271-performance.json";
import scotlandPerformanceData from "./free-scotland-501-performance.json";
import strategyAuditData from "./free-denmark-271-strategy-audit.json";
import scotlandStrategyAuditData from "./free-scotland-501-strategy-audit.json";
import calibrationData from "./free-denmark-271-calibration.json";
import scotlandCalibrationData from "./free-scotland-501-calibration.json";
import stabilityData from "./free-denmark-271-stability.json";
import scotlandStabilityData from "./free-scotland-501-stability.json";
import {
  isOddsSnapshotStale,
  oddsSnapshotAgeMinutes,
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
  priority?: {
    score: number;
    capped_edge_component: number;
    confidence_factor: number;
    market_depth_factor: number;
    max_edge_component: number;
  };
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
  model_type?: string;
  model_cutoff_at?: string;
  model_age_days?: number;
  model_stale?: boolean;
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
  top_opportunities?: AuditedFixture[];
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

type PerformanceSummary = {
  bets: number;
  wins: number;
  losses: number;
  hit_rate: number | null;
  staked_units: number;
  profit_units: number;
  roi: number | null;
  yield: number | null;
  max_drawdown_units: number;
  average_clv: number | null;
};

type PerformanceSnapshot = {
  schema_version: string;
  generated_at: string;
  staking: string;
  summary: PerformanceSummary;
  observed_summary: PerformanceSummary;
};

type StrategyAuditSnapshot = {
  schema_version: string;
  generated_at: string;
  sample_rules: {
    min_clv_sample: number;
    min_roi_sample: number;
    roi_affects_ranking: boolean;
  };
  summary: {
    segments_total: number;
    collecting: number;
    aligned_positive: number;
    mixed: number;
    deteriorating: number;
  };
};

type CalibrationBucket = {
  label: string;
  sample_size: number;
  mean_predicted_probability: number | null;
  observed_hit_rate: number | null;
  calibration_gap: number | null;
  brier_score: number | null;
  mature: boolean;
};

type CalibrationSnapshot = {
  schema_version: string;
  generated_at: string;
  scope: string;
  ranking_impact: boolean;
  sample_rules: {
    min_overall_sample: number;
    min_bucket_sample: number;
  };
  summary: {
    sample_size: number;
    mean_predicted_probability: number | null;
    observed_hit_rate: number | null;
    calibration_gap: number | null;
    brier_score: number | null;
    ece: number | null;
    status: "collecting" | "well_calibrated" | "watch" | "miscalibrated";
  };
  buckets: CalibrationBucket[];
};

type StabilitySignal = {
  history_key: string;
  fixture_id: number;
  home_team: string;
  away_team: string;
  market: string;
  detected_qualifies: boolean | null;
  snapshots: number;
  positive_edge_share: number | null;
  mean_edge: number | null;
  edge_volatility: number | null;
  odds_drift: number | null;
  status: "stable" | "volatile" | "fragile" | "collecting";
};

type StabilitySnapshot = {
  schema_version: string;
  generated_at: string;
  ranking_impact: boolean;
  sample_rules: { min_snapshots: number };
  summary: {
    tracked: number;
    stable: number;
    volatile: number;
    fragile: number;
    collecting: number;
  };
  signals: StabilitySignal[];
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
  if (reason === "stale_model") return "MODELO DESACTUALIZADO";
  if (reason === "extreme_longshot_value") return "LONGSHOT · REVISAR";
  return "A REVISAR";
}

function historyEntry(
  history: HistorySnapshot,
  fixtureId: number,
  market: string,
) {
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

export default function ValueScanner({ onSelect }: Props) {
  const [league, setLeague] = useState<"denmark" | "scotland">("denmark");
  const snapshot = (
    league === "scotland" ? scotlandSignals : auditedSignals
  ) as AuditedSnapshot;
  const historySnapshot = (
    league === "scotland" ? scotlandSignalHistory : signalHistory
  ) as HistorySnapshot;
  const clvSummary = historicalClvSummary(historySnapshot);
  const performance = (
    league === "scotland" ? scotlandPerformanceData : performanceData
  ) as PerformanceSnapshot;
  const strategyAudit = (
    league === "scotland" ? scotlandStrategyAuditData : strategyAuditData
  ) as StrategyAuditSnapshot;
  const calibration = (
    league === "scotland" ? scotlandCalibrationData : calibrationData
  ) as CalibrationSnapshot;
  const stability = (
    league === "scotland" ? scotlandStabilityData : stabilityData
  ) as StabilitySnapshot;
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

  const globalTop = (() => {
    const leagues = [
      {
        key: "denmark",
        label: "Dinamarca",
        snapshot: auditedSignals as AuditedSnapshot,
      },
      {
        key: "scotland",
        label: "Escocia",
        snapshot: scotlandSignals as AuditedSnapshot,
      },
    ];

    return leagues
      .flatMap(({ key, label, snapshot: leagueSnapshot }) => {
        const isStale = isOddsSnapshotStale(
          leagueSnapshot.odds_generated_at,
          MAX_ODDS_AGE_MINUTES,
          nowMs,
        );
        if (isStale) return [];

        return leagueSnapshot.fixtures
          .filter((fixture) => {
            const signal = fixture.selected_signal;
            return Boolean(
              signal &&
                signal.qualifies &&
                !signal.review_reason,
            );
          })
          .map((fixture) => ({
            league: key as "denmark" | "scotland",
            leagueLabel: label,
            fixture,
            score:
              fixture.selected_signal?.priority?.score ??
              fixture.selected_signal?.clv_learning?.ranking_score ??
              fixture.selected_signal?.expected_value_edge ??
              0,
          }));
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  })();

  const rows = useMemo(
    () =>
      snapshot.fixtures
        .filter((fixture) => fixture.selected_signal)
        .sort(
          (a, b) =>
            (
              b.selected_signal?.priority?.score ??
              b.selected_signal?.clv_learning?.ranking_score ??
              b.selected_signal?.expected_value_edge ??
              -Infinity
            ) -
            (
              a.selected_signal?.priority?.score ??
              a.selected_signal?.clv_learning?.ranking_score ??
              a.selected_signal?.expected_value_edge ??
              -Infinity
            ),
        ),
    [snapshot.fixtures],
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
            Elegí el mercado y compará la cuota que encontrás con el umbral mínimo.
            Si es igual o superior, hay valor según el modelo.
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

      {globalTop.length > 0 ? (
        <div className={styles.globalTopBlock}>
          <div className={styles.globalTopHeader}>
            <div>
              <span className={styles.eyebrow}>MEJORES DE TODAS LAS LIGAS</span>
              <strong>Qué mirar primero</strong>
            </div>
            <small>ordenadas por calidad de señal</small>
          </div>

          <div className={styles.globalTopGrid}>
            {globalTop.map(({ league: itemLeague, leagueLabel, fixture }, index) => {
              const signal = fixture.selected_signal;
              if (!signal) return null;
              return (
                <button
                  key={`${itemLeague}-${fixture.fixture_id}`}
                  type="button"
                  className={styles.globalTopCard}
                  onClick={() => setLeague(itemLeague)}
                >
                  <span className={styles.globalTopRank}>#{index + 1}</span>
                  <small>{leagueLabel}</small>
                  <strong>
                    {fixture.home_team} vs {fixture.away_team}
                  </strong>
                  <div>
                    <span>APUESTA</span>
                    <b>{marketLabel(signal.market)}</b>
                  </div>
                  <div className={styles.globalTopThreshold}>
                    <span>HAY VALOR DESDE</span>
                    <b>{signal.minimum_odds.toFixed(2)}</b>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={styles.leagueTabs}>
        <button
          type="button"
          className={league === "denmark" ? styles.scannerFilterActive : ""}
          onClick={() => setLeague("denmark")}
        >
          Dinamarca
        </button>
        <button
          type="button"
          className={league === "scotland" ? styles.scannerFilterActive : ""}
          onClick={() => setLeague("scotland")}
        >
          Escocia · {snapshot.fixtures.length} señales
        </button>
      </div>

      <div className={styles.leagueStatus}>
        <span>
          {league === "scotland" ? "Scottish Premiership" : "Danish Superliga"}
        </span>
        <strong>
          {league === "scotland" ? "Dixon-Coles validado" : "Team Profile promovido"}
        </strong>
        <small>
          corte del modelo {new Date(snapshot.profile_cutoff_at).toLocaleDateString("es-AR")}
        </small>
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
          automáticas quedan suspendidas hasta el próximo refresco.
        </div>
      ) : null}

      <div className={styles.scannerSummary}>
        <div>
          <span>Partidos analizados</span>
          <strong>{rows.length}</strong>
        </div>
        <div>
          <span>Oportunidades</span>
          <strong>{valueRows.length}</strong>
        </div>
        <div>
          <span>Oportunidades fuertes</span>
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
            <strong>Ordenadas por calidad de señal</strong>
          </div>

          <div className={styles.topValueGrid}>
            {topOpportunities.map((row, index) => {
              const signal = row.selected_signal;
              if (!signal) return null;
              const history = historyEntry(historySnapshot, row.fixture_id, signal.market);
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
                    <span>APUESTA</span>
                    <strong>{marketLabel(signal.market)}</strong>
                    <small>
                      Probabilidad estimada {(signal.model_probability * 100).toFixed(1)}%
                    </small>
                  </div>

                  {history ? (
                    <div className={styles.clvOnlyLine}>
                      <span>Seguimiento CLV</span>
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
                    </div>
                  ) : null}

                  <div className={styles.valueThresholdHero}>
                    <span>HAY VALOR DESDE</span>
                    <strong>{signal.minimum_odds.toFixed(2)}</strong>
                    <small>
                      Buscá una cuota igual o superior a {signal.minimum_odds.toFixed(2)}
                    </small>
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
          const history = historyEntry(historySnapshot, row.fixture_id, signal.market);

          const automaticStale = staleFeed;
          const effectiveReviewReason = signal.review_reason;
          const displayTone =
            automaticStale || effectiveReviewReason
              ? "warning"
              : signal.qualifies
                ? "positive"
                : "negative";
          const displayLabel = automaticStale
            ? "DATOS VIEJOS"
            : effectiveReviewReason
              ? reviewLabel(effectiveReviewReason)
              : signal.qualifies
                ? "UMBRAL CALCULADO"
                : "A REVISAR";

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
                <span>APUESTA</span>
                <strong>{marketLabel(signal.market)}</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Prob.</span>
                <strong>{(signal.model_probability * 100).toFixed(1)}%</strong>
              </div>

              <div className={styles.scannerValueThreshold}>
                <span>Hay valor desde</span>
                <strong>{signal.minimum_odds.toFixed(2)}</strong>
              </div>

              <div className={styles.scannerClv}>
                <span>CLV</span>
                {history ? (
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
                ) : (
                  <strong>—</strong>
                )}
              </div>

              <span
                className={
                  signal.qualifies && !automaticStale && !effectiveReviewReason
                    ? `${styles.scannerBadge} ${styles.scannerBadgeStrong}`
                    : automaticStale || effectiveReviewReason
                      ? `${styles.scannerBadge} ${styles.scannerBadgeReview}`
                      : styles.scannerBadge
                }
              >
                {displayLabel}
              </span>
            </article>
          );
        })}
      </div>
      <details className={styles.advancedMetrics}>
        <summary>
          <span>Ver métricas del modelo</span>
          <small>ROI, CLV, calibración y auditoría</small>
        </summary>
        <div className={styles.advancedMetricsBody}>
      <div className={styles.performanceScoreboard}>
        <div className={styles.clvScoreboardHeader}>
          <div>
            <span className={styles.eyebrow}>RESULTADO REAL</span>
            <h4>Performance de apuestas</h4>
          </div>
          <span className={styles.clvTrackingPill}>
            {performance.summary.bets > 0 ? "MUESTRA LIQUIDADA" : "SIN APUESTAS LIQUIDADAS"}
          </span>
        </div>

        <div className={styles.performanceGrid}>
          <div>
            <span>Apuestas</span>
            <strong>{performance.summary.bets}</strong>
            <small>solo señales que calificaban al detectarse</small>
          </div>
          <div>
            <span>ROI / Yield</span>
            <strong className={styles[`performanceText_${clvTone(performance.summary.roi)}`]}>
              {performance.summary.roi == null ? "—" : formatClv(performance.summary.roi)}
            </strong>
            <small>{performance.summary.profit_units >= 0 ? "+" : ""}{performance.summary.profit_units.toFixed(2)} u</small>
          </div>
          <div>
            <span>Acierto</span>
            <strong>
              {performance.summary.hit_rate == null
                ? "—"
                : `${(performance.summary.hit_rate * 100).toFixed(0)}%`}
            </strong>
            <small>
              {performance.summary.bets > 0
                ? `${performance.summary.wins} ganadas · ${performance.summary.losses} perdidas`
                : "se habilita con el primer resultado final"}
            </small>
          </div>
          <div>
            <span>Drawdown máx.</span>
            <strong>{performance.summary.max_drawdown_units.toFixed(2)} u</strong>
            <small>con stake plano de 1 unidad</small>
          </div>
        </div>
      </div>

      <div className={styles.auditScoreboard}>
        <div className={styles.clvScoreboardHeader}>
          <div>
            <span className={styles.eyebrow}>AUDITORÍA DEL MODELO</span>
            <h4>CLV + ROI + riesgo</h4>
          </div>
          <span className={styles.clvTrackingPill}>
            {strategyAudit.summary.segments_total > 0
              ? "SEGMENTOS EN EVALUACIÓN"
              : "RECOLECTANDO EVIDENCIA"}
          </span>
        </div>

        <div className={styles.auditGrid}>
          <div>
            <span>Alineados</span>
            <strong>{strategyAudit.summary.aligned_positive}</strong>
            <small>CLV y ROI positivos con muestra madura</small>
          </div>
          <div>
            <span>Mixtos</span>
            <strong>{strategyAudit.summary.mixed}</strong>
            <small>CLV y ROI todavía no cuentan la misma historia</small>
          </div>
          <div>
            <span>Deterioro</span>
            <strong>{strategyAudit.summary.deteriorating}</strong>
            <small>CLV y ROI negativos con muestra madura</small>
          </div>
          <div>
            <span>Regla de madurez</span>
            <strong>{strategyAudit.sample_rules.min_clv_sample}/{strategyAudit.sample_rules.min_roi_sample}</strong>
            <small>cierres CLV / apuestas liquidadas · ROI aún no mueve ranking</small>
          </div>
        </div>
      </div>

      <div className={styles.calibrationScoreboard}>
        <div className={styles.clvScoreboardHeader}>
          <div>
            <span className={styles.eyebrow}>CALIBRACIÓN</span>
            <h4>¿El 60% se comporta como 60%?</h4>
          </div>
          <span className={styles.clvTrackingPill}>
            {calibration.summary.status === "collecting"
              ? "RECOLECTANDO MUESTRA"
              : calibration.summary.status === "well_calibrated"
                ? "BIEN CALIBRADO"
                : calibration.summary.status === "watch"
                  ? "A VIGILAR"
                  : "DESAJUSTE"}
          </span>
        </div>

        <div className={styles.calibrationGrid}>
          <div>
            <span>Muestra</span>
            <strong>{calibration.summary.sample_size}</strong>
            <small>señales seleccionadas con resultado final</small>
          </div>
          <div>
            <span>Brier Score</span>
            <strong>
              {calibration.summary.brier_score == null
                ? "—"
                : calibration.summary.brier_score.toFixed(3)}
            </strong>
            <small>más bajo es mejor</small>
          </div>
          <div>
            <span>ECE</span>
            <strong>
              {calibration.summary.ece == null
                ? "—"
                : `${(calibration.summary.ece * 100).toFixed(1)}%`}
            </strong>
            <small>error medio de calibración por bandas</small>
          </div>
          <div>
            <span>Previsto vs real</span>
            <strong>
              {calibration.summary.mean_predicted_probability == null
                ? "—"
                : `${(calibration.summary.mean_predicted_probability * 100).toFixed(0)}% → ${((calibration.summary.observed_hit_rate ?? 0) * 100).toFixed(0)}%`}
            </strong>
            <small>
              madura con {calibration.sample_rules.min_overall_sample}+ resultados · no mueve ranking
            </small>
          </div>
        </div>

        {calibration.buckets.length > 0 ? (
          <div className={styles.calibrationBands}>
            {calibration.buckets.map((bucket) => (
              <div key={bucket.label}>
                <span>{bucket.label}</span>
                <strong>
                  {bucket.mean_predicted_probability == null
                    ? "—"
                    : `${(bucket.mean_predicted_probability * 100).toFixed(0)}%`}
                  {" → "}
                  {bucket.observed_hit_rate == null
                    ? "—"
                    : `${(bucket.observed_hit_rate * 100).toFixed(0)}%`}
                </strong>
                <small>{bucket.sample_size} casos{bucket.mature ? " · madura" : ""}</small>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.stabilityScoreboard}>
        <div className={styles.clvScoreboardHeader}>
          <div>
            <span className={styles.eyebrow}>ESTABILIDAD TEMPORAL</span>
            <h4>¿La señal persiste o fue un salto puntual?</h4>
          </div>
          <span className={styles.clvTrackingPill}>
            {stability.summary.collecting > 0 ? "MUESTRA EN CURSO" : "MUESTRA TEMPORAL LISTA"}
          </span>
        </div>

        <div className={styles.stabilityGrid}>
          <div>
            <span>Estables</span>
            <strong>{stability.summary.stable}</strong>
            <small>edge persistente y baja volatilidad</small>
          </div>
          <div>
            <span>Volátiles</span>
            <strong>{stability.summary.volatile}</strong>
            <small>la ventaja cambia demasiado entre capturas</small>
          </div>
          <div>
            <span>Frágiles</span>
            <strong>{stability.summary.fragile}</strong>
            <small>edge positivo en menos de la mitad de capturas</small>
          </div>
          <div>
            <span>Regla</span>
            <strong>{stability.sample_rules.min_snapshots} snapshots</strong>
            <small>diagnóstico solamente · no modifica ranking</small>
          </div>
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


        </div>
      </details>

    </section>
  );
}
