import { describe, expect, it } from "vitest";
import {
  summarizeCrossSectionalBacktest,
  type CrossSectionalEvaluation,
  type CrossSectionalPlan,
} from "@/acciones/cross_sectional_core";

function plan(): CrossSectionalPlan {
  return {
    years: 3,
    cadence: "quarterly",
    source: {
      repository: "test",
      commit: "abc",
      snapshotDate: "2026-09-27",
    },
    tickers: ["AAA", "BBB", "CCC"],
    periods: [
      {
        signalDate: "2025-03-31",
        executionDate: "2025-04-01",
        exitDate: "2025-07-01",
        universeSize: 3,
        benchmarkReturn: 0.04,
      },
      {
        signalDate: "2025-06-30",
        executionDate: "2025-07-01",
        exitDate: "2025-10-01",
        universeSize: 3,
        benchmarkReturn: -0.02,
      },
    ],
  };
}

function row(
  ticker: string,
  signalDate: string,
  score: number,
  forwardReturn: number,
  passes = true,
): CrossSectionalEvaluation {
  return {
    ticker,
    providerTicker: ticker,
    signalDate,
    score,
    confidence: 0.8,
    fundamentalScore: 75,
    valuationScore: 70,
    passes,
    forwardReturn,
    proxyExit: false,
  };
}

describe("StockMind cross-sectional backtest summary", () => {
  it("selects top-N candidates and compares against benchmark", () => {
    const evaluations = [
      row("AAA", "2025-03-31", 85, 0.1),
      row("BBB", "2025-03-31", 80, 0.05),
      row("CCC", "2025-03-31", 70, -0.03, false),
      row("AAA", "2025-06-30", 74, -0.02),
      row("BBB", "2025-06-30", 88, 0.08),
      row("CCC", "2025-06-30", 82, 0.03),
    ];

    const result = summarizeCrossSectionalBacktest(plan(), evaluations, {
      topN: 2,
      scoreThreshold: 72,
      transactionCostBps: 10,
    });

    expect(result.periods).toBe(2);
    expect(result.periodsDetail[0].selectedTickers).toEqual(["AAA", "BBB"]);
    expect(result.periodsDetail[1].selectedTickers).toEqual(["BBB", "CCC"]);
    expect(result.averageCoverage).toBeCloseTo(1);
    expect(result.cumulativeReturn).not.toBe(0);
    expect(result.benchmarkCumulativeReturn).not.toBe(0);
  });

  it("stays in cash when no name passes filters", () => {
    const evaluations = [
      row("AAA", "2025-03-31", 60, 0.2, false),
      row("BBB", "2025-03-31", 65, 0.1, false),
      row("AAA", "2025-06-30", 61, -0.2, false),
    ];

    const result = summarizeCrossSectionalBacktest(plan(), evaluations, {
      topN: 10,
      scoreThreshold: 72,
      transactionCostBps: 10,
    });

    expect(result.averageSelectedCount).toBe(0);
    expect(result.cumulativeReturn).toBe(0);
    expect(
      result.periodsDetail.every(
        (period) => period.selectedTickers.length === 0,
      ),
    ).toBe(true);
  });

  it("charges turnover costs when portfolio composition changes", () => {
    const evaluations = [
      row("AAA", "2025-03-31", 85, 0.1),
      row("BBB", "2025-03-31", 80, 0.05),
      row("BBB", "2025-06-30", 90, 0.02),
      row("CCC", "2025-06-30", 88, 0.04),
    ];

    const free = summarizeCrossSectionalBacktest(plan(), evaluations, {
      topN: 2,
      scoreThreshold: 72,
      transactionCostBps: 0,
    });
    const costly = summarizeCrossSectionalBacktest(plan(), evaluations, {
      topN: 2,
      scoreThreshold: 72,
      transactionCostBps: 50,
    });

    expect(costly.cumulativeReturn).toBeLessThan(free.cumulativeReturn);
    expect(costly.averageTurnover).toBeGreaterThan(0);
  });

  it("reports partial coverage instead of fabricating missing members", () => {
    const evaluations = [
      row("AAA", "2025-03-31", 85, 0.1),
      row("AAA", "2025-06-30", 82, 0.03),
    ];

    const result = summarizeCrossSectionalBacktest(plan(), evaluations, {
      topN: 2,
      scoreThreshold: 72,
      transactionCostBps: 10,
    });

    expect(result.averageCoverage).toBeCloseTo(1 / 3);
    expect(result.periodsDetail[0].analyzedCount).toBe(1);
  });
});
