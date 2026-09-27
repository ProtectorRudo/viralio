"use client";

import { FormEvent, useMemo, useState } from "react";
import type { EngineResult, StockMindAnalysis } from "@/acciones/stockmind";
import styles from "./acciones.module.css";

const QUICK_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "MELI"];

const ENGINE_LABELS: Record<string, string> = {
  Fundamental: "Fundamental",
  Valuation: "Valuación",
  Technical: "Técnico",
  "Historical analogs": "Análogos históricos",
  Seasonality: "Estacionalidad",
  Risk: "Riesgo",
  "Market regime": "Régimen de mercado",
  "Data quality": "Calidad de datos",
};

function scoreClass(score: number) {
  if (score >= 70) return styles.scoreStrong;
  if (score >= 55) return styles.scoreMedium;
  return styles.scoreWeak;
}

function signalClass(signal: StockMindAnalysis["signal"]) {
  if (signal === "CANDIDATE") return styles.signalCandidate;
  if (signal === "WATCH") return styles.signalWatch;
  if (signal === "CAUTION") return styles.signalCaution;
  return styles.signalNeutral;
}

function formatPercent(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("es-AR", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value)
    : "—";
}

function formatNumber(value: unknown, digits = 2) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("es-AR", {
        maximumFractionDigits: digits,
      }).format(value)
    : "—";
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(value, 2)}`;
  }
}

function detailRows(engine: EngineResult) {
  const d = engine.details;
  if (engine.name === "Fundamental") {
    return [
      ["ROIC", formatPercent(d.roic)],
      ["ROE", formatPercent(d.roe)],
      ["Margen FCF", formatPercent(d.fcf_margin)],
      ["Crec. ventas", formatPercent(d.revenue_cagr)],
      ["Deuda / FCF", d.debt_to_fcf == null ? "—" : `${formatNumber(d.debt_to_fcf, 1)}x`],
    ];
  }
  if (engine.name === "Valuation") {
    return [
      ["Valor estimado", formatNumber(d.intrinsic_value_per_share, 2)],
      ["Margen seguridad", formatPercent(d.margin_of_safety)],
      ["FCF yield", formatPercent(d.fcf_yield)],
      ["Owner earnings", formatPercent(d.owner_earnings_yield)],
      ["P/E", formatNumber(d.pe, 1)],
    ];
  }
  if (engine.name === "Technical") {
    return [
      ["MA 50", formatNumber(d.ma50, 2)],
      ["MA 200", formatNumber(d.ma200, 2)],
      ["RSI 14", formatNumber(d.rsi14, 1)],
      ["Retorno 63d", formatPercent(d.return_63d)],
    ];
  }
  if (engine.name === "Historical analogs") {
    return [
      ["Muestras", formatNumber(d.samples, 0)],
      ["Hit rate", formatPercent(d.win_rate)],
      ["Mediana +20d", formatPercent(d.median_forward_return)],
      ["Peor +20d", formatPercent(d.worst_forward_return)],
    ];
  }
  if (engine.name === "Seasonality") {
    return [
      ["Muestras", formatNumber(d.samples, 0)],
      ["Mes positivo", formatPercent(d.win_rate)],
      ["Mediana", formatPercent(d.median_return)],
      ["Peor mes", formatPercent(d.worst_return)],
    ];
  }
  if (engine.name === "Risk") {
    return [
      ["Volatilidad", formatPercent(d.annualized_volatility)],
      ["Drawdown actual", formatPercent(d.current_drawdown)],
      ["Máx. drawdown", formatPercent(d.max_drawdown_window)],
    ];
  }
  if (engine.name === "Market regime") {
    return [
      ["Régimen", String(d.regime ?? "—")],
      ["SPY 63d", formatPercent(d.spy_momentum_63d)],
      ["SPY drawdown", formatPercent(d.spy_drawdown)],
      ["VIX", formatNumber(d.vix, 1)],
    ];
  }
  if (engine.name === "Data quality") {
    return [
      ["Cobertura fundamental", formatPercent(d.fundamental_completeness)],
      ["Antigüedad precio", d.market_age_days == null ? "—" : `${d.market_age_days} días`],
      ["Fuente", String(d.data_source ?? "—")],
    ];
  }
  return [];
}

function Sparkline({ values }: { values: number[] }) {
  const points = useMemo(() => {
    if (values.length < 2) return "";
    const width = 720;
    const height = 190;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1e-9);

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / span) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [values]);

  const positive =
    values.length >= 2 && values[values.length - 1] >= values[0];

  return (
    <div className={styles.chartShell} aria-label="Evolución aproximada de los últimos seis meses">
      <svg viewBox="0 0 720 190" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="stockmindArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={positive ? "#42d392" : "#ff7b7b"} stopOpacity="0.28" />
            <stop offset="100%" stopColor={positive ? "#42d392" : "#ff7b7b"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={positive ? "#42d392" : "#ff7b7b"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {points ? (
          <polygon
            fill="url(#stockmindArea)"
            points={`0,190 ${points} 720,190`}
          />
        ) : null}
      </svg>
      <div className={styles.chartCaption}>
        <span>~6 meses</span>
        <span>{positive ? "Tendencia neta positiva" : "Tendencia neta negativa"}</span>
      </div>
    </div>
  );
}

function EngineCard({ engine }: { engine: EngineResult }) {
  const rows = detailRows(engine);

  return (
    <article className={styles.engineCard}>
      <div className={styles.engineHeader}>
        <div>
          <p className={styles.engineEyebrow}>Motor</p>
          <h3>{ENGINE_LABELS[engine.name] || engine.name}</h3>
        </div>
        <div className={`${styles.engineScore} ${scoreClass(engine.score)}`}>
          {Math.round(engine.score)}
        </div>
      </div>

      <div className={styles.scoreTrack} aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, engine.score))}%` }} />
      </div>

      <p className={styles.engineSummary}>{engine.summary}</p>

      {rows.length ? (
        <dl className={styles.metricList}>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className={styles.confidenceLine}>
        Confianza del motor: {Math.round(engine.confidence * 100)}%
      </p>
    </article>
  );
}

export default function StockMindWeb() {
  const [ticker, setTicker] = useState("AAPL");
  const [analysis, setAnalysis] = useState<StockMindAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis(symbol = ticker) {
    const clean = symbol.trim().toUpperCase();
    if (!clean || loading) return;

    setTicker(clean);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/acciones/analyze?ticker=${encodeURIComponent(clean)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as StockMindAnalysis | { error?: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error || "No se pudo analizar." : "No se pudo analizar.");
      }
      setAnalysis(payload);
    } catch (reason) {
      setAnalysis(null);
      setError(reason instanceof Error ? reason.message : "No se pudo analizar el ticker.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAnalysis();
  }

  const coreEngines = analysis?.engines.filter((engine) => engine.name !== "Data quality") ?? [];
  const quality = analysis?.engines.find((engine) => engine.name === "Data quality");

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />
      <section className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brandBlock}>
            <div className={styles.mark}>S</div>
            <div>
              <strong>StockMind</strong>
              <span>Web · motor v0.25</span>
            </div>
          </div>
          <a className={styles.viralioLink} href="/">
            viralio.net
          </a>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>Decision support · acciones</span>
            <h1>Una lectura completa antes de decidir.</h1>
            <p>
              Fundamentales oficiales SEC, valuación conservadora, tendencia,
              análogos históricos, estacionalidad, riesgo y contexto de mercado.
            </p>
          </div>

          <form className={styles.searchCard} onSubmit={submit}>
            <label htmlFor="stockmind-ticker">Ticker</label>
            <div className={styles.searchRow}>
              <input
                id="stockmind-ticker"
                value={ticker}
                onChange={(event) => setTicker(event.target.value.toUpperCase())}
                placeholder="AAPL"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={12}
              />
              <button type="submit" disabled={loading}>
                {loading ? "Analizando…" : "Analizar"}
              </button>
            </div>
            <div className={styles.quickRow}>
              {QUICK_TICKERS.map((symbol) => (
                <button
                  type="button"
                  key={symbol}
                  onClick={() => void runAnalysis(symbol)}
                  disabled={loading}
                >
                  {symbol}
                </button>
              ))}
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
          </form>
        </section>

        {loading ? (
          <section className={styles.loadingPanel}>
            <div className={styles.spinner} />
            <div>
              <strong>Reconstruyendo la evidencia</strong>
              <span>Precio + SEC + patrones + riesgo + régimen</span>
            </div>
          </section>
        ) : null}

        {!analysis && !loading ? (
          <section className={styles.emptyState}>
            <div className={styles.emptyCard}>
              <span>01</span>
              <h2>Calidad del negocio</h2>
              <p>ROIC, FCF, crecimiento, deuda y consistencia histórica.</p>
            </div>
            <div className={styles.emptyCard}>
              <span>02</span>
              <h2>Precio vs. valor</h2>
              <p>DCF conservador, owner earnings y margen de seguridad.</p>
            </div>
            <div className={styles.emptyCard}>
              <span>03</span>
              <h2>Momento y riesgo</h2>
              <p>Tendencia, patrones, estacionalidad, drawdown y régimen.</p>
            </div>
          </section>
        ) : null}

        {analysis ? (
          <>
            <section className={styles.resultHero}>
              <div className={styles.resultIdentity}>
                <div className={styles.resultTicker}>{analysis.ticker}</div>
                <div>
                  <p>{analysis.companyName}</p>
                  <span>
                    {analysis.exchange || "Mercado"} · cierre {analysis.asOf}
                  </span>
                </div>
              </div>

              <div className={styles.priceBlock}>
                <strong>{formatMoney(analysis.price, analysis.currency)}</strong>
                <span
                  className={
                    (analysis.dayChange ?? 0) >= 0
                      ? styles.positiveText
                      : styles.negativeText
                  }
                >
                  {analysis.dayChange == null
                    ? "—"
                    : `${analysis.dayChange >= 0 ? "+" : ""}${(
                        analysis.dayChange * 100
                      ).toFixed(2)}% día`}
                </span>
              </div>

              <div className={styles.verdictBlock}>
                <div className={`${styles.signalBadge} ${signalClass(analysis.signal)}`}>
                  {analysis.signalLabel}
                </div>
                <div className={styles.masterScore}>
                  <strong>{Math.round(analysis.compositeScore)}</strong>
                  <span>/100</span>
                </div>
                <p>Confianza global {Math.round(analysis.confidence * 100)}%</p>
              </div>
            </section>

            <Sparkline values={analysis.sparkline} />

            <section className={styles.thesisGrid}>
              <article className={styles.thesisCard}>
                <span className={styles.thesisLabel}>A favor</span>
                <h2>Qué sostiene la lectura</h2>
                {analysis.reasons.length ? (
                  <ul>
                    {analysis.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay todavía suficiente confluencia positiva fuerte.</p>
                )}
              </article>

              <article className={styles.thesisCard}>
                <span className={styles.thesisLabel}>En contra</span>
                <h2>Qué vigilar</h2>
                {analysis.risks.length ? (
                  <ul>
                    {analysis.risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No aparecen alertas fuertes entre los tres motores más débiles.</p>
                )}
              </article>
            </section>

            <section className={styles.engineSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.kicker}>Motores</span>
                  <h2>La decisión, separada por evidencia</h2>
                </div>
                <p>
                  No hay un “número mágico”: cada bloque conserva su score y su
                  confianza.
                </p>
              </div>
              <div className={styles.engineGrid}>
                {coreEngines.map((engine) => (
                  <EngineCard key={engine.name} engine={engine} />
                ))}
              </div>
            </section>

            {quality ? (
              <section className={styles.qualityBar}>
                <div>
                  <span>Calidad de datos</span>
                  <strong>{Math.round(quality.score)}/100</strong>
                </div>
                <p>{quality.summary}</p>
                <small>
                  Mercado: {analysis.marketSource} · Fundamentales:{" "}
                  {analysis.fundamentalSource}
                </small>
              </section>
            ) : null}
          </>
        ) : null}

        <footer className={styles.footer}>
          <p>
            StockMind es una herramienta de investigación y soporte de decisión.
            Los resultados son probabilísticos, no garantizan retornos ni sustituyen
            tu propio criterio.
          </p>
          <span>StockMind Web · v0.25</span>
        </footer>
      </section>
    </main>
  );
}
