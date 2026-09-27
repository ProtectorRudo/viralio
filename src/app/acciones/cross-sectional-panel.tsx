"use client";

import { useRef, useState } from "react";
import {
  analyzeCrossSectionalRobustness,
  summarizeCrossSectionalBacktest,
  type CrossSectionalBacktestResult,
  type CrossSectionalBatchResult,
  type CrossSectionalCadence,
  type CrossSectionalEvaluation,
  type CrossSectionalPlan,
  type CrossSectionalRobustnessReport,
} from "@/acciones/cross_sectional_core";
import styles from "./cross-sectional-panel.module.css";

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

function chunk<T>(values: T[], size: number) {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}

function exportResult(
  result: CrossSectionalBacktestResult,
  plan: CrossSectionalPlan,
  failures: CrossSectionalBatchResult["failures"],
  robustness: CrossSectionalRobustnessReport | null,
) {
  const payload = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    methodology: "CROSS_SECTIONAL_PIT_BATCHED",
    source: plan.source,
    parameters: {
      years: result.years,
      cadence: result.cadence,
      topN: result.topN,
      scoreThreshold: result.scoreThreshold,
      transactionCostBps: result.transactionCostBps,
    },
    summary: result,
    robustness,
    failures,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `stockmind-cross-sectional-${result.years}y-${result.cadence}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function CrossSectionalPanel({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const [years, setYears] = useState(3);
  const [cadence, setCadence] =
    useState<CrossSectionalCadence>("quarterly");
  const [topN, setTopN] = useState(10);
  const [scoreThreshold, setScoreThreshold] = useState(72);
  const [transactionCostBps, setTransactionCostBps] = useState(10);
  const [plan, setPlan] = useState<CrossSectionalPlan | null>(null);
  const [result, setResult] =
    useState<CrossSectionalBacktestResult | null>(null);
  const [failures, setFailures] = useState<
    CrossSectionalBatchResult["failures"]
  >([]);
  const [robustness, setRobustness] =
    useState<CrossSectionalRobustnessReport | null>(null);
  const [processedTickers, setProcessedTickers] = useState(0);
  const [evaluationsCount, setEvaluationsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  function cancel() {
    abortRef.current?.abort();
    setNotice("Ejecución cancelada. No se guardó un resultado parcial.");
    setLoading(false);
  }

  async function run() {
    if (loading || disabled) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setNotice("");
    setResult(null);
    setFailures([]);
    setRobustness(null);
    setProcessedTickers(0);
    setEvaluationsCount(0);

    try {
      const planResponse = await fetch(
        `/api/acciones/lab/cross-sectional/plan?years=${encodeURIComponent(
          String(years),
        )}&cadence=${encodeURIComponent(cadence)}`,
        { cache: "no-store", signal: controller.signal },
      );
      const planPayload = (await planResponse.json()) as
        | CrossSectionalPlan
        | { error?: string };

      if (!planResponse.ok || !("periods" in planPayload)) {
        const message =
          "error" in planPayload ? planPayload.error : undefined;
        throw new Error(message || "No se pudo construir el plan transversal.");
      }

      setPlan(planPayload);
      const batches = chunk(planPayload.tickers, 6);
      const allEvaluations: CrossSectionalEvaluation[] = [];
      const allFailures: CrossSectionalBatchResult["failures"] = [];

      for (let index = 0; index < batches.length; index += 2) {
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        const group = batches.slice(index, index + 2);

        const responses = await Promise.all(
          group.map(async (tickers) => {
            const response = await fetch(
              "/api/acciones/lab/cross-sectional/batch",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                signal: controller.signal,
                body: JSON.stringify({
                  years: planPayload.years,
                  cadence: planPayload.cadence,
                  tickers,
                  scoreThreshold: 55,
                }),
              },
            );
            const payload = (await response.json()) as
              | CrossSectionalBatchResult
              | { error?: string };
            if (!response.ok || !("evaluations" in payload)) {
              const message =
                "error" in payload ? payload.error : undefined;
              throw new Error(
                message || "Falló un lote del backtest transversal.",
              );
            }
            return payload;
          }),
        );

        for (const response of responses) {
          allEvaluations.push(...response.evaluations);
          allFailures.push(...response.failures);
          setProcessedTickers(
            (current) => current + response.tickersRequested.length,
          );
          setEvaluationsCount(
            (current) => current + response.evaluations.length,
          );
        }
      }

      const summary = summarizeCrossSectionalBacktest(
        planPayload,
        allEvaluations,
        {
          topN,
          scoreThreshold,
          transactionCostBps,
        },
      );

      const robustnessReport = analyzeCrossSectionalRobustness(
        planPayload,
        allEvaluations,
        {
          topN,
          scoreThreshold,
          transactionCostBps,
        },
      );

      setFailures(allFailures);
      setResult(summary);
      setRobustness(robustnessReport);
      setNotice(
        `Backtest transversal completado: ${planPayload.tickers.length} tickers históricos recorridos, cobertura media ${pct(
          summary.averageCoverage,
        )}.`,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo completar el backtest transversal.",
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }

  const progress =
    plan && plan.tickers.length
      ? processedTickers / plan.tickers.length
      : 0;

  return (
    <section className={styles.cross}>
      <div className={styles.heading}>
        <div>
          <span>Transversal PIT · beta</span>
          <h4>¿Qué habría elegido StockMind entre las empresas que existían entonces?</h4>
          <p>
            Reconstruye el universo histórico del S&amp;P 500, analiza cada
            miembro con información disponible a esa fecha y arma un top-N
            equiponderado para el período siguiente.
          </p>
        </div>
        {result && plan ? (
          <button
            type="button"
            className={styles.exportButton}
            onClick={() => exportResult(result, plan, failures, robustness)}
          >
            Exportar JSON
          </button>
        ) : null}
      </div>

      <div className={styles.controls}>
        <label>
          <span>Historia</span>
          <select
            value={years}
            onChange={(event) => setYears(Number(event.target.value))}
            disabled={loading}
          >
            <option value={3}>3 años</option>
            <option value={5}>5 años</option>
            <option value={8}>8 años</option>
          </select>
        </label>

        <label>
          <span>Rebalanceo</span>
          <select
            value={cadence}
            onChange={(event) =>
              setCadence(
                event.target.value === "monthly" ? "monthly" : "quarterly",
              )
            }
            disabled={loading}
          >
            <option value="quarterly">Trimestral</option>
            <option value="monthly">Mensual · máx. 3 años</option>
          </select>
        </label>

        <label>
          <span>Top N</span>
          <input
            type="number"
            min={1}
            max={30}
            value={topN}
            onChange={(event) => setTopN(Number(event.target.value))}
            disabled={loading}
          />
        </label>

        <label>
          <span>Umbral</span>
          <input
            type="number"
            min={55}
            max={90}
            value={scoreThreshold}
            onChange={(event) =>
              setScoreThreshold(Number(event.target.value))
            }
            disabled={loading}
          />
        </label>

        <label>
          <span>Costo</span>
          <select
            value={transactionCostBps}
            onChange={(event) =>
              setTransactionCostBps(Number(event.target.value))
            }
            disabled={loading}
          >
            <option value={0}>0 bps</option>
            <option value={5}>5 bps</option>
            <option value={10}>10 bps</option>
            <option value={25}>25 bps</option>
            <option value={50}>50 bps</option>
          </select>
        </label>

        {loading ? (
          <button type="button" className={styles.cancelButton} onClick={cancel}>
            Cancelar
          </button>
        ) : (
          <button
            type="button"
            className={styles.runButton}
            onClick={() => void run()}
            disabled={disabled}
          >
            Correr transversal
          </button>
        )}
      </div>

      {notice ? <p className={styles.notice}>{notice}</p> : null}

      {loading && plan ? (
        <div className={styles.progressBlock}>
          <div className={styles.progressTop}>
            <strong>
              {processedTickers}/{plan.tickers.length} tickers
            </strong>
            <span>{pct(progress)} · {evaluationsCount} observaciones PIT válidas</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
          <small>
            {plan.periods.length} períodos · dos lotes en paralelo · seis
            tickers por lote
          </small>
        </div>
      ) : null}

      {result && plan ? (
        <>
          <div className={styles.meta}>
            <span>{result.periods} períodos</span>
            <span>{plan.tickers.length} tickers históricos</span>
            <span>top {result.topN}</span>
            <span>umbral {result.scoreThreshold}</span>
            <span>fuente {plan.source.snapshotDate}</span>
          </div>

          <div className={styles.metrics}>
            <article>
              <span>StockMind acumulado</span>
              <strong>{pct(result.cumulativeReturn)}</strong>
            </article>
            <article>
              <span>SPY acumulado</span>
              <strong>{pct(result.benchmarkCumulativeReturn)}</strong>
            </article>
            <article>
              <span>CAGR StockMind</span>
              <strong>{pct(result.cagr)}</strong>
            </article>
            <article>
              <span>CAGR SPY</span>
              <strong>{pct(result.benchmarkCagr)}</strong>
            </article>
            <article>
              <span>Drawdown</span>
              <strong>{pct(result.maxDrawdown)}</strong>
            </article>
            <article>
              <span>Cobertura media</span>
              <strong>{pct(result.averageCoverage)}</strong>
            </article>
            <article>
              <span>Turnover medio</span>
              <strong>{pct(result.averageTurnover)}</strong>
            </article>
            <article>
              <span>Selecciones medias</span>
              <strong>{num(result.averageSelectedCount, 1)}</strong>
            </article>
          </div>

          <div
            className={
              result.averageCoverage >= 0.8
                ? styles.coverageGood
                : result.averageCoverage >= 0.6
                  ? styles.coverageWarn
                  : styles.coverageBad
            }
          >
            <strong>
              Cobertura PIT {pct(result.averageCoverage)}
            </strong>
            <p>
              La cobertura mide qué proporción del universo histórico pudo
              reconstruirse con precio + fundamentales SEC utilizables. Un
              resultado con cobertura baja no debe interpretarse como validación
              limpia del universo completo.
            </p>
          </div>

          {robustness && robustness.validationPeriods > 0 ? (
            <section className={styles.robustnessSection}>
              <div className={styles.robustnessHeading}>
                <div>
                  <span>Robustez · holdout diagnóstico</span>
                  <h4>¿La señal aguanta cambios razonables de parámetros?</h4>
                  <p>
                    Primeros {robustness.developmentPeriods} períodos como desarrollo
                    y últimos {robustness.validationPeriods} como validación. Se prueban
                    {robustness.parameterCount} combinaciones cercanas de Top-N y umbral
                    sin volver a descargar datos ni cambiar la evidencia PIT.
                  </p>
                </div>
                <strong>
                  corte {robustness.splitDate ?? "—"}
                </strong>
              </div>

              <div className={styles.holdoutGrid}>
                <article>
                  <span>Desarrollo · exceso</span>
                  <strong>
                    {pct(
                      robustness.chosenDevelopment.cumulativeReturn -
                        robustness.chosenDevelopment.benchmarkCumulativeReturn,
                    )}
                  </strong>
                </article>
                <article>
                  <span>Validación · exceso</span>
                  <strong>
                    {pct(
                      robustness.chosenValidation.cumulativeReturn -
                        robustness.chosenValidation.benchmarkCumulativeReturn,
                    )}
                  </strong>
                </article>
                <article>
                  <span>Validación · CAGR</span>
                  <strong>{pct(robustness.chosenValidation.cagr)}</strong>
                </article>
                <article>
                  <span>Validación · drawdown</span>
                  <strong>{pct(robustness.chosenValidation.maxDrawdown)}</strong>
                </article>
                <article>
                  <span>Celdas que superan SPY</span>
                  <strong>{pct(robustness.positiveValidationShare)}</strong>
                </article>
                <article>
                  <span>Positivas en ambos tramos</span>
                  <strong>{pct(robustness.stablePositiveShare)}</strong>
                </article>
                <article>
                  <span>Exceso mediano validación</span>
                  <strong>{pct(robustness.medianValidationExcessReturn)}</strong>
                </article>
                <article>
                  <span>Cobertura validación</span>
                  <strong>{pct(robustness.chosenValidation.averageCoverage)}</strong>
                </article>
              </div>

              <div className={styles.robustnessTable}>
                <div className={styles.robustnessHeader}>
                  <span>Top-N</span>
                  <span>Umbral</span>
                  <span>Exceso desarrollo</span>
                  <span>Exceso validación</span>
                  <span>CAGR validación</span>
                  <span>Estable</span>
                </div>
                {robustness.cells.map((cell) => (
                  <div
                    key={`${cell.topN}-${cell.scoreThreshold}`}
                    className={styles.robustnessRow}
                  >
                    <span>{cell.topN}</span>
                    <span>{cell.scoreThreshold}</span>
                    <span>{pct(cell.developmentExcessReturn)}</span>
                    <span>{pct(cell.validationExcessReturn)}</span>
                    <span>{pct(cell.validationCagr)}</span>
                    <span>{cell.stablePositive ? "Sí" : "No"}</span>
                  </div>
                ))}
              </div>

              <p className={styles.robustnessNote}>
                El holdout es una defensa contra sobreajuste, no una garantía. Si
                cambiás reglas después de mirar este tramo final, deja de ser un
                conjunto realmente intocado y debe volver a validarse con datos
                futuros.
              </p>
            </section>
          ) : null}

          <div className={styles.periodTable}>
            <div className={styles.periodHeader}>
              <span>Señal</span>
              <span>Cobertura</span>
              <span>Elegidas</span>
              <span>StockMind</span>
              <span>SPY</span>
            </div>
            {result.periodsDetail
              .slice(-12)
              .reverse()
              .map((period) => (
                <div key={period.signalDate} className={styles.periodRow}>
                  <span>{period.signalDate}</span>
                  <span>{pct(period.coverage)}</span>
                  <span title={period.selectedTickers.join(", ")}>
                    {period.selectedTickers.length
                      ? period.selectedTickers.slice(0, 4).join(", ") +
                        (period.selectedTickers.length > 4 ? "…" : "")
                      : "Cash"}
                  </span>
                  <span>{pct(period.netReturn)}</span>
                  <span>{pct(period.benchmarkReturn)}</span>
                </div>
              ))}
          </div>

          <div className={styles.audit}>
            <strong>Auditoría del universo</strong>
            <p>
              Dataset histórico pinneado a{" "}
              <code>{plan.source.commit.slice(0, 10)}…</code>. Se incluyen
              miembros removidos y reingresos. {failures.length} símbolos no
              pudieron reconstruirse completamente en al menos un tramo; no se
              inventaron precios ni fundamentales.
            </p>
          </div>
        </>
      ) : null}

      <p className={styles.disclaimer}>
        Investigación cuantitativa, no una orden de inversión. La membresía
        histórica proviene de un dataset abierto y no oficial; precios
        delistados y CIK históricos siguen siendo la principal fuente de
        cobertura incompleta.
      </p>
    </section>
  );
}
