"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  sizePosition,
  type CandidatePortfolioMetrics,
  type PortfolioPositionInput,
  type PortfolioReport,
} from "@/acciones/portfolio";
import type { StockMindAnalysis } from "@/acciones/stockmind";
import styles from "./portfolio-panel.module.css";

const PORTFOLIO_KEY = "stockmind.portfolio.v1";

type PortfolioApiResponse = {
  portfolio?: PortfolioReport;
  candidate?: CandidatePortfolioMetrics | null;
  error?: string;
};

function readPortfolio(): PortfolioPositionInput[] {
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_KEY);
    const parsed = raw ? (JSON.parse(raw) as PortfolioPositionInput[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(value);
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
  }).format(value);
}

export default function PortfolioPanel({
  analysis,
  disabled = false,
}: {
  analysis: StockMindAnalysis | null;
  disabled?: boolean;
}) {
  const [positions, setPositions] = useState<PortfolioPositionInput[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioReport | null>(null);
  const [candidateMetrics, setCandidateMetrics] =
    useState<CandidatePortfolioMetrics | null>(null);
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPositions(readPortfolio());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function persist(next: PortfolioPositionInput[]) {
    const clean = [...next]
      .map((position) => ({
        ticker: position.ticker.trim().toUpperCase(),
        shares: Number(position.shares),
        avgCost: Number(position.avgCost),
      }))
      .filter(
        (position) =>
          /^[A-Z0-9.^-]{1,12}$/.test(position.ticker) &&
          Number.isFinite(position.shares) &&
          Number.isFinite(position.avgCost) &&
          position.shares > 0 &&
          position.avgCost > 0,
      )
      .sort((a, b) => a.ticker.localeCompare(b.ticker));

    setPositions(clean);
    window.localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(clean));
  }

  async function refresh(nextPositions = positions) {
    if (!nextPositions.length || loading) {
      if (!nextPositions.length) {
        setPortfolio(null);
        setCandidateMetrics(null);
      }
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/acciones/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          positions: nextPositions,
          candidateTicker: analysis?.ticker ?? null,
        }),
      });

      const payload = (await response.json()) as PortfolioApiResponse;
      if (!response.ok || !payload.portfolio) {
        throw new Error(payload.error || "No se pudo analizar la cartera.");
      }

      setPortfolio(payload.portfolio);
      setCandidateMetrics(payload.candidate ?? null);
      setNotice(
        payload.portfolio.missingTickers.length
          ? `Cartera actualizada. Sin precios utilizables: ${payload.portfolio.missingTickers.join(", ")}.`
          : "Cartera actualizada con precios recientes.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "No se pudo analizar la cartera.",
      );
    } finally {
      setLoading(false);
    }
  }

  function addPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    const parsedShares = Number(shares.replace(",", "."));
    const parsedCost = Number(avgCost.replace(",", "."));

    if (
      !/^[A-Z0-9.^-]{1,12}$/.test(cleanTicker) ||
      !Number.isFinite(parsedShares) ||
      !Number.isFinite(parsedCost) ||
      parsedShares <= 0 ||
      parsedCost <= 0
    ) {
      setNotice("Revisá ticker, cantidad y costo promedio.");
      return;
    }

    const next = [
      ...positions.filter((position) => position.ticker !== cleanTicker),
      {
        ticker: cleanTicker,
        shares: parsedShares,
        avgCost: parsedCost,
      },
    ].sort((a, b) => a.ticker.localeCompare(b.ticker));

    persist(next);
    setTicker("");
    setShares("");
    setAvgCost("");
    setNotice(`${cleanTicker} guardada en la cartera.`);
    void refresh(next);
  }

  function removePosition(removeTicker: string) {
    const next = positions.filter(
      (position) => position.ticker !== removeTicker,
    );
    persist(next);
    setPortfolio(null);
    setCandidateMetrics(null);
    setNotice(`${removeTicker} eliminada de la cartera.`);
    if (next.length) void refresh(next);
  }

  const sizing = useMemo(
    () =>
      analysis && portfolio
        ? sizePosition(analysis, portfolio, candidateMetrics)
        : null,
    [analysis, portfolio, candidateMetrics],
  );

  if (!hydrated) {
    return <div className={styles.skeleton} aria-hidden="true" />;
  }

  return (
    <div className={styles.portfolio}>
      <div className={styles.heading}>
        <div>
          <h3>Cartera</h3>
          <p>
            Peso, retorno, riesgo conjunto y concentración. Tus posiciones se
            guardan sólo en este navegador.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void refresh()}
          disabled={!positions.length || loading || disabled}
        >
          {loading ? "Calculando…" : "Actualizar cartera"}
        </button>
      </div>

      <form className={styles.positionForm} onSubmit={addPosition}>
        <label>
          <span>Ticker</span>
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
            placeholder="AAPL"
            maxLength={12}
            autoComplete="off"
          />
        </label>
        <label>
          <span>Cantidad</span>
          <input
            value={shares}
            onChange={(event) => setShares(event.target.value)}
            inputMode="decimal"
            placeholder="10"
          />
        </label>
        <label>
          <span>Costo promedio USD</span>
          <input
            value={avgCost}
            onChange={(event) => setAvgCost(event.target.value)}
            inputMode="decimal"
            placeholder="185.50"
          />
        </label>
        <button type="submit" disabled={disabled || loading}>
          Guardar posición
        </button>
      </form>

      {notice ? <p className={styles.notice}>{notice}</p> : null}

      {portfolio ? (
        <>
          <div className={styles.summaryGrid}>
            <div>
              <span>Valor cartera</span>
              <strong>{formatMoney(portfolio.totalValue)}</strong>
            </div>
            <div>
              <span>Volatilidad anual</span>
              <strong>{formatPercent(portfolio.annualizedVolatility)}</strong>
            </div>
            <div>
              <span>Máx. drawdown 2a</span>
              <strong>{formatPercent(portfolio.maxDrawdown)}</strong>
            </div>
            <div>
              <span>Correlación media</span>
              <strong>{formatNumber(portfolio.averageCorrelation, 2)}</strong>
            </div>
            <div>
              <span>Peso mayor</span>
              <strong>{formatPercent(portfolio.topWeight)}</strong>
            </div>
            <div>
              <span>HHI concentración</span>
              <strong>{formatNumber(portfolio.concentrationHhi, 3)}</strong>
            </div>
          </div>

          {sizing && analysis ? (
            <article className={styles.sizingCard}>
              <div>
                <span>Capacidad orientativa · {analysis.ticker}</span>
                <h4>
                  {formatPercent(sizing.currentWeight)} actual →{" "}
                  {formatPercent(sizing.riskBasedMaxWeight)} techo por modelo
                </h4>
              </div>
              <strong className={styles.capacity}>
                +{formatPercent(sizing.additionalWeightCapacity)}
              </strong>
              <p>{sizing.rationale}</p>
              <small>
                Es una guía de exposición basada en riesgo y evidencia, no una
                instrucción automática de compra.
              </small>
            </article>
          ) : null}

          <div className={styles.holdings}>
            <div className={styles.holdingsHeader}>
              <span>Posición</span>
              <span>Precio</span>
              <span>Valor</span>
              <span>Peso</span>
              <span>Retorno</span>
              <span />
            </div>

            {portfolio.holdings.map((holding) => (
              <div key={holding.ticker} className={styles.holdingRow}>
                <div>
                  <strong>{holding.ticker}</strong>
                  <span>
                    {formatNumber(holding.shares, 4)} acc. · costo{" "}
                    {formatMoney(holding.avgCost)}
                  </span>
                </div>
                <span>{formatMoney(holding.currentPrice)}</span>
                <span>{formatMoney(holding.marketValue)}</span>
                <span>{formatPercent(holding.weight)}</span>
                <span
                  className={
                    holding.returnPct >= 0 ? styles.positive : styles.negative
                  }
                >
                  {formatPercent(holding.returnPct)}
                </span>
                <button
                  type="button"
                  onClick={() => removePosition(holding.ticker)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <p className={styles.asOf}>
            Precios al {portfolio.asOf ?? "último cierre disponible"}.
          </p>
        </>
      ) : positions.length ? (
        <div className={styles.blank}>
          <strong>{positions.length} posición(es) guardadas.</strong>
          <p>Tocá “Actualizar cartera” para calcular riesgo y pesos actuales.</p>
        </div>
      ) : (
        <div className={styles.blank}>
          <strong>Tu cartera todavía está vacía.</strong>
          <p>
            Cargá ticker, cantidad y costo promedio. No necesitás conectar un
            broker.
          </p>
        </div>
      )}
    </div>
  );
}
