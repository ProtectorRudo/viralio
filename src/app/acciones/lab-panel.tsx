"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { StockMindAnalysis } from "@/acciones/stockmind";
import type {
  WalkForwardObservation,
  WalkForwardResult,
} from "@/acciones/walkforward";
import {
  compareWalkForwardRuns,
  type SavedWalkForwardRun,
} from "@/acciones/walkforward_compare";
import CrossSectionalPanel from "./cross-sectional-panel";
import styles from "./lab-panel.module.css";

const RUNS_KEY = "stockmind.labRuns.v1";

function readRuns(): SavedWalkForwardRun[] {
  try {
    const raw = window.localStorage.getItem(RUNS_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedWalkForwardRun[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function pct(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(value);
}

function num(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
  }).format(value);
}

function resultTone(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "";
  return value > 0 ? styles.positive : value < 0 ? styles.negative : "";
}

function exportJson(result: WalkForwardResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `stockmind-walkforward-${result.ticker}-${result.endDate ?? "run"}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ObservationRow({ row }: { row: WalkForwardObservation }) {
  return (
    <div className={styles.observationRow}>
      <span>{row.date}</span>
      <strong>{Math.round(row.score)}</strong>
      <span>{row.selected ? "Sí" : "No"}</span>
      <span className={resultTone(row.return20d)}>{pct(row.return20d)}</span>
      <span className={resultTone(row.alpha20d)}>{pct(row.alpha20d)}</span>
    </div>
  );
}

export default function LabPanel({
  analysis,
  disabled = false,
}: {
  analysis: StockMindAnalysis | null;
  disabled?: boolean;
}) {
  const [ticker, setTicker] = useState(analysis?.ticker ?? "AAPL");
  const [historyYears, setHistoryYears] = useState(10);
  const [stepDays, setStepDays] = useState(21);
  const [scoreThreshold, setScoreThreshold] = useState(72);
  const [transactionCostBps, setTransactionCostBps] = useState(10);
  const [result, setResult] = useState<WalkForwardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedRuns, setSavedRuns] = useState<SavedWalkForwardRun[]>([]);
  const [runsHydrated, setRunsHydrated] = useState(false);
  const [leftRunId, setLeftRunId] = useState("");
  const [rightRunId, setRightRunId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const runs = readRuns();
      setSavedRuns(runs);
      setLeftRunId(runs[1]?.id ?? runs[0]?.id ?? "");
      setRightRunId(runs[0]?.id ?? "");
      setRunsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function persistRuns(next: SavedWalkForwardRun[]) {
    const limited = next.slice(0, 12);
    setSavedRuns(limited);
    window.localStorage.setItem(RUNS_KEY, JSON.stringify(limited));
  }

  function saveRun() {
    if (!result) return;

    const createdAt = new Date().toISOString();
    const run: SavedWalkForwardRun = {
      id: `${createdAt}-${result.ticker}-${result.scoreThreshold}`,
      createdAt,
      label: `${result.ticker} · U${result.scoreThreshold} · ${result.historyYears}a · ${new Date(
        createdAt,
      ).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      result,
    };

    const next = [run, ...savedRuns.filter((item) => item.id !== run.id)];
    persistRuns(next);

    if (!rightRunId) {
      setRightRunId(run.id);
    } else {
      setLeftRunId(rightRunId);
      setRightRunId(run.id);
    }

    setNotice("Corrida guardada en este navegador.");
  }

  function removeRun(id: string) {
    const next = savedRuns.filter((item) => item.id !== id);
    persistRuns(next);
    if (leftRunId === id) setLeftRunId(next[1]?.id ?? next[0]?.id ?? "");
    if (rightRunId === id) setRightRunId(next[0]?.id ?? "");
  }

  async function run(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (loading) return;

    const cleanTicker = ticker.trim().toUpperCase();
    if (!/^[A-Z0-9.^-]{1,12}$/.test(cleanTicker)) {
      setNotice("Ticker inválido.");
      return;
    }

    setLoading(true);
    setNotice("");
    setResult(null);

    try {
      const response = await fetch("/api/acciones/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ticker: cleanTicker,
          historyYears,
          stepDays,
          scoreThreshold,
          transactionCostBps,
        }),
      });

      const payload = (await response.json()) as
        | WalkForwardResult
        | { error?: string };

      if (!response.ok || !("methodology" in payload)) {
        const message = "error" in payload ? payload.error : undefined;
        throw new Error(message || "No se pudo ejecutar el laboratorio.");
      }

      setTicker(cleanTicker);
      setResult(payload);
      setNotice(
        payload.observations
          ? `Walk-forward completado: ${payload.observations} fechas evaluadas, ${payload.selectedObservations} señales válidas.`
          : "No hubo observaciones suficientes con datos point-in-time.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo ejecutar el laboratorio.",
      );
    } finally {
      setLoading(false);
    }
  }

  const recent = result?.observationsDetail.slice(-12).reverse() ?? [];

  const comparison = useMemo(() => {
    const left = savedRuns.find((run) => run.id === leftRunId);
    const right = savedRuns.find((run) => run.id === rightRunId);
    return left && right && left.id !== right.id
      ? compareWalkForwardRuns(left, right)
      : null;
  }, [savedRuns, leftRunId, rightRunId]);

  return (
    <div className={styles.lab}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Laboratorio PIT</span>
          <h3>¿El score habría servido antes de conocer el futuro?</h3>
          <p>
            Reconstruye cada señal con precios y filings SEC disponibles en esa
            fecha. Después mide qué ocurrió a 20 y 63 ruedas y lo compara con SPY.
          </p>
        </div>
        {result ? (
          <div className={styles.headingActions}>
            <button
              type="button"
              className={styles.exportButton}
              onClick={() => exportJson(result)}
            >
              Exportar JSON
            </button>
            <button
              type="button"
              className={styles.saveRunButton}
              onClick={saveRun}
            >
              Guardar corrida
            </button>
          </div>
        ) : null}
      </div>

      <form className={styles.controls} onSubmit={(event) => void run(event)}>
        <label>
          <span>Ticker</span>
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
            maxLength={12}
            autoComplete="off"
          />
        </label>

        <label>
          <span>Historia</span>
          <select
            value={historyYears}
            onChange={(event) => setHistoryYears(Number(event.target.value))}
          >
            <option value={5}>5 años</option>
            <option value={10}>10 años</option>
            <option value={15}>15 años</option>
            <option value={20}>20 años</option>
          </select>
        </label>

        <label>
          <span>Frecuencia</span>
          <select
            value={stepDays}
            onChange={(event) => setStepDays(Number(event.target.value))}
          >
            <option value={21}>Mensual</option>
            <option value={42}>Cada 2 meses</option>
            <option value={63}>Trimestral</option>
          </select>
        </label>

        <label>
          <span>Umbral score</span>
          <input
            type="number"
            min={55}
            max={90}
            step={1}
            value={scoreThreshold}
            onChange={(event) => setScoreThreshold(Number(event.target.value))}
          />
        </label>

        <label>
          <span>Costo por lado</span>
          <select
            value={transactionCostBps}
            onChange={(event) =>
              setTransactionCostBps(Number(event.target.value))
            }
          >
            <option value={0}>0 bps</option>
            <option value={5}>5 bps</option>
            <option value={10}>10 bps</option>
            <option value={25}>25 bps</option>
            <option value={50}>50 bps</option>
          </select>
        </label>

        <button type="submit" disabled={loading || disabled}>
          {loading ? "Reconstruyendo historia…" : "Correr walk-forward"}
        </button>
      </form>

      {notice ? <p className={styles.notice}>{notice}</p> : null}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <div>
            <strong>Volviendo atrás fecha por fecha</strong>
            <span>
              Yahoo ajustado + filings SEC PIT + siete motores StockMind
            </span>
          </div>
        </div>
      ) : null}

      {result && !loading ? (
        <>
          <div className={styles.metaBar}>
            <span>{result.ticker}</span>
            <span>
              {result.startDate ?? "—"} → {result.endDate ?? "—"}
            </span>
            <span>{result.observations} observaciones</span>
            <span>{result.skippedNoFundamentals} fechas sin fundamentales</span>
            <span>exposición {pct(result.averageExposure)}</span>
          </div>

          <section className={styles.capitalSection}>
            <div className={styles.sectionTitle}>
              <span>Simulación de capital</span>
              <h4>Señal válida → 20 ruedas invertido; si no → cash</h4>
            </div>

            <div className={styles.metricGrid}>
              <article>
                <span>StockMind acumulado</span>
                <strong className={resultTone(result.cumulativeReturn)}>
                  {pct(result.cumulativeReturn)}
                </strong>
              </article>
              <article>
                <span>SPY acumulado</span>
                <strong className={resultTone(result.benchmarkCumulativeReturn)}>
                  {pct(result.benchmarkCumulativeReturn)}
                </strong>
              </article>
              <article>
                <span>CAGR StockMind</span>
                <strong className={resultTone(result.cagr)}>
                  {pct(result.cagr)}
                </strong>
              </article>
              <article>
                <span>CAGR SPY</span>
                <strong className={resultTone(result.benchmarkCagr)}>
                  {pct(result.benchmarkCagr)}
                </strong>
              </article>
              <article>
                <span>Drawdown StockMind</span>
                <strong>{pct(result.maxDrawdown)}</strong>
              </article>
              <article>
                <span>Drawdown SPY</span>
                <strong>{pct(result.benchmarkMaxDrawdown)}</strong>
              </article>
            </div>
          </section>

          <section className={styles.validationSection}>
            <div className={styles.sectionTitle}>
              <span>Validación predictiva</span>
              <h4>¿Las señales altas precedieron mejores resultados?</h4>
            </div>

            <div className={styles.metricGrid}>
              <article>
                <span>Señales válidas</span>
                <strong>
                  {result.selectedObservations}/{result.observations}
                </strong>
              </article>
              <article>
                <span>Hit rate +20d</span>
                <strong>{pct(result.hitRate20d)}</strong>
              </article>
              <article>
                <span>Mediana señal +20d</span>
                <strong className={resultTone(result.medianReturn20d)}>
                  {pct(result.medianReturn20d)}
                </strong>
              </article>
              <article>
                <span>Mediana base +20d</span>
                <strong className={resultTone(result.baselineMedian20d)}>
                  {pct(result.baselineMedian20d)}
                </strong>
              </article>
              <article>
                <span>Alpha mediana vs SPY +20d</span>
                <strong className={resultTone(result.medianAlpha20d)}>
                  {pct(result.medianAlpha20d)}
                </strong>
              </article>
              <article>
                <span>Alpha mediana vs SPY +63d</span>
                <strong className={resultTone(result.medianAlpha63d)}>
                  {pct(result.medianAlpha63d)}
                </strong>
              </article>
              <article>
                <span>Spearman score → +20d</span>
                <strong>{num(result.spearman20d, 3)}</strong>
              </article>
              <article>
                <span>Spearman score → +63d</span>
                <strong>{num(result.spearman63d, 3)}</strong>
              </article>
              <article>
                <span>Fundamental mediano</span>
                <strong>{num(result.medianFundamentalScore, 0)}</strong>
              </article>
              <article>
                <span>Valuación mediana</span>
                <strong>{num(result.medianValuationScore, 0)}</strong>
              </article>
            </div>
          </section>

          <section className={styles.observations}>
            <div className={styles.observationHeader}>
              <span>Fecha</span>
              <span>Score</span>
              <span>Pasa</span>
              <span>+20d</span>
              <span>Alpha SPY</span>
            </div>
            {recent.map((row) => (
              <ObservationRow key={row.date} row={row} />
            ))}
          </section>

          {runsHydrated ? (
            <section className={styles.compareSection}>
              <div className={styles.compareHeading}>
                <div>
                  <span>Historial local</span>
                  <h4>Comparar corridas del mismo experimento</h4>
                  <p>
                    El umbral puede cambiar; ticker, período, frecuencia, costos y
                    fechas deben coincidir para considerar la comparación limpia.
                  </p>
                </div>
                <strong>{savedRuns.length}/12 guardadas</strong>
              </div>

              {savedRuns.length >= 2 ? (
                <>
                  <div className={styles.compareControls}>
                    <label>
                      <span>Base</span>
                      <select
                        value={leftRunId}
                        onChange={(event) => setLeftRunId(event.target.value)}
                      >
                        <option value="">Elegir corrida</option>
                        {savedRuns.map((run) => (
                          <option key={run.id} value={run.id}>
                            {run.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Nueva</span>
                      <select
                        value={rightRunId}
                        onChange={(event) => setRightRunId(event.target.value)}
                      >
                        <option value="">Elegir corrida</option>
                        {savedRuns.map((run) => (
                          <option key={run.id} value={run.id}>
                            {run.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {comparison ? (
                    <div className={styles.comparisonCard}>
                      <div className={styles.comparisonStatus}>
                        <span
                          className={
                            comparison.compatible
                              ? styles.compatible
                              : styles.incompatible
                          }
                        >
                          {comparison.compatible
                            ? "Comparación limpia"
                            : "Parámetros no equivalentes"}
                        </span>
                        <small>
                          {comparison.commonObservations} fechas comunes ·{" "}
                          {comparison.changedSignalDates} señales cambiaron
                        </small>
                      </div>

                      {!comparison.compatible ? (
                        <ul className={styles.compatibilityIssues}>
                          {comparison.compatibilityIssues.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      ) : null}

                      <div className={styles.deltaGrid}>
                        <article>
                          <span>Δ umbral</span>
                          <strong>{comparison.thresholdDelta >= 0 ? "+" : ""}{comparison.thresholdDelta}</strong>
                        </article>
                        <article>
                          <span>Δ retorno acum.</span>
                          <strong className={resultTone(comparison.cumulativeReturnDelta)}>
                            {pct(comparison.cumulativeReturnDelta)}
                          </strong>
                        </article>
                        <article>
                          <span>Δ CAGR</span>
                          <strong className={resultTone(comparison.cagrDelta)}>
                            {pct(comparison.cagrDelta)}
                          </strong>
                        </article>
                        <article>
                          <span>Δ drawdown</span>
                          <strong className={resultTone(comparison.maxDrawdownDelta)}>
                            {pct(comparison.maxDrawdownDelta)}
                          </strong>
                        </article>
                        <article>
                          <span>Δ exposición</span>
                          <strong>{pct(comparison.exposureDelta)}</strong>
                        </article>
                        <article>
                          <span>Δ hit rate</span>
                          <strong className={resultTone(comparison.hitRateDelta)}>
                            {pct(comparison.hitRateDelta)}
                          </strong>
                        </article>
                        <article>
                          <span>Δ alpha +20d</span>
                          <strong className={resultTone(comparison.medianAlpha20dDelta)}>
                            {pct(comparison.medianAlpha20dDelta)}
                          </strong>
                        </article>
                        <article>
                          <span>Acuerdo señales</span>
                          <strong>{pct(comparison.signalAgreement)}</strong>
                        </article>
                        <article>
                          <span>RMSE retorno período</span>
                          <strong>{pct(comparison.periodReturnRmse)}</strong>
                        </article>
                      </div>
                    </div>
                  ) : null}

                  <div className={styles.savedRuns}>
                    {savedRuns.map((run) => (
                      <div key={run.id} className={styles.savedRunRow}>
                        <div>
                          <strong>{run.label}</strong>
                          <span>
                            Ret. {pct(run.result.cumulativeReturn)} · CAGR{" "}
                            {pct(run.result.cagr)} · DD{" "}
                            {pct(run.result.maxDrawdown)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRun(run.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles.compareEmpty}>
                  Guardá al menos dos corridas para comparar parámetros o futuras
                  versiones del motor.
                </p>
              )}
            </section>
          ) : null}

          <CrossSectionalPanel disabled={disabled} />

          <div className={styles.methodology}>
            <strong>Disciplina PIT</strong>
            <p>
              Cada observación usa sólo historia de precios hasta la fecha señal
              y facts SEC cuyo filing y período ya existían entonces. El costo se
              aplica de ida y vuelta en cada señal seleccionada. Fechas sin
              fundamentales suficientes se saltan y se cuentan.
            </p>
          </div>

          <div className={styles.universeNote}>
            <strong>Backtest transversal PIT</strong>
            <p>
              El modo “elegir las mejores acciones de todo el S&amp;P 500 en cada
              mes histórico” requiere el dataset de membresía histórica con
              empresas removidas/delistadas. StockMind no usa los miembros de hoy
              para fingir el pasado porque introduciría survivorship bias.
            </p>
          </div>
        </>
      ) : !loading ? (
        <div className={styles.blank}>
          <strong>Elegí un ticker y corré el primer walk-forward.</strong>
          <p>
            Para una empresa estadounidense con suficiente historia, StockMind
            puede reconstruir varios años de decisiones sin mirar información
            futura.
          </p>
        </div>
      ) : null}
    </div>
  );
}
