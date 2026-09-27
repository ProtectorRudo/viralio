import { describe, expect, it } from "vitest";
import {
  portfolioStatistics,
  sizePosition,
  type CandidatePortfolioMetrics,
  type PortfolioReport,
} from "@/acciones/portfolio";
import type { EngineResult, StockMindAnalysis } from "@/acciones/stockmind";

function engine(
  name: string,
  score: number,
  details: Record<string, unknown> = {},
): EngineResult {
  return {
    name,
    score,
    confidence: 0.8,
    summary: "ok",
    details,
  };
}

function analysis(): StockMindAnalysis {
  return {
    ticker: "AAA",
    companyName: "AAA Corp",
    currency: "USD",
    exchange: "NMS",
    price: 120,
    dayChange: 0.01,
    compositeScore: 80,
    confidence: 0.82,
    signal: "WATCH",
    signalLabel: "Observar",
    reasons: [],
    risks: [],
    engines: [
      engine("Risk", 70, { annualized_volatility: 0.25 }),
      engine("Market regime", 68, { regime: "BULL" }),
    ],
    sparkline: [100, 110, 120],
    asOf: "2026-09-27",
    marketSource: "test",
    fundamentalSource: "test",
  };
}

function portfolio(): PortfolioReport {
  return {
    totalValue: 10_000,
    holdings: [
      {
        ticker: "BBB",
        shares: 10,
        avgCost: 100,
        currentPrice: 150,
        marketValue: 1_500,
        weight: 0.15,
        returnPct: 0.5,
      },
      {
        ticker: "CCC",
        shares: 20,
        avgCost: 100,
        currentPrice: 200,
        marketValue: 4_000,
        weight: 0.4,
        returnPct: 1,
      },
    ],
    annualizedVolatility: 0.18,
    maxDrawdown: -0.12,
    averageCorrelation: 0.45,
    concentrationHhi: 0.18,
    topWeight: 0.4,
    asOf: "2026-09-27",
    missingTickers: [],
  };
}

describe("StockMind portfolio", () => {
  it("computes bounded portfolio risk statistics", () => {
    const returns = new Map<string, number[]>([
      [
        "AAA",
        Array.from({ length: 80 }, (_, i) =>
          Math.sin(i / 5) * 0.006 + 0.0005,
        ),
      ],
      [
        "BBB",
        Array.from({ length: 80 }, (_, i) =>
          Math.sin(i / 5 + 0.7) * 0.005 + 0.0003,
        ),
      ],
    ]);
    const weights = new Map([
      ["AAA", 0.6],
      ["BBB", 0.4],
    ]);

    const stats = portfolioStatistics(returns, weights);

    expect(stats.annualizedVolatility).not.toBeNull();
    expect(stats.annualizedVolatility!).toBeGreaterThan(0);
    expect(stats.maxDrawdown).not.toBeNull();
    expect(stats.maxDrawdown!).toBeLessThanOrEqual(0);
    expect(stats.averageCorrelation).not.toBeNull();
    expect(stats.averageCorrelation!).toBeGreaterThanOrEqual(-1);
    expect(stats.averageCorrelation!).toBeLessThanOrEqual(1);
  });

  it("returns a capped position size between two and twelve percent", () => {
    const metrics: CandidatePortfolioMetrics = {
      ticker: "AAA",
      candidateVolatility: 0.25,
      correlationToPortfolio: 0.3,
    };

    const sizing = sizePosition(analysis(), portfolio(), metrics);

    expect(sizing.riskBasedMaxWeight).toBeGreaterThanOrEqual(0.02);
    expect(sizing.riskBasedMaxWeight).toBeLessThanOrEqual(0.12);
    expect(sizing.additionalWeightCapacity).toBeGreaterThanOrEqual(0);
  });

  it("reduces capacity when candidate correlation is very high", () => {
    const lowCorrelation = sizePosition(analysis(), portfolio(), {
      ticker: "AAA",
      candidateVolatility: 0.25,
      correlationToPortfolio: 0.2,
    });
    const highCorrelation = sizePosition(analysis(), portfolio(), {
      ticker: "AAA",
      candidateVolatility: 0.25,
      correlationToPortfolio: 0.9,
    });

    expect(highCorrelation.riskBasedMaxWeight).toBeLessThan(
      lowCorrelation.riskBasedMaxWeight,
    );
  });
});
