import { describe, expect, it } from "vitest";
import {
  analyzeCrossSectionalRobustness,
  type CrossSectionalEvaluation,
  type CrossSectionalPlan,
} from "@/acciones/cross_sectional_core";

function plan(): CrossSectionalPlan {
  const dates = [
    ["2024-03-28", "2024-04-01", "2024-07-01"],
    ["2024-06-28", "2024-07-01", "2024-10-01"],
    ["2024-09-30", "2024-10-01", "2025-01-02"],
    ["2024-12-31", "2025-01-02", "2025-04-01"],
    ["2025-03-31", "2025-04-01", "2025-07-01"],
    ["2025-06-30", "2025-07-01", "2025-10-01"],
  ];

  return {
    years: 3,
    cadence: "quarterly",
    tickers: ["AAA", "BBB", "CCC"],
    source: {
      repository: "test",
      commit: "abc",
      snapshotDate: "2026-09-27",
    },
    periods: dates.map(([signalDate, executionDate, exitDate]) => ({
      signalDate,
      executionDate,
      exitDate,
      universeSize: 3,
      benchmarkReturn: 0.01,
    })),
  };
}

function evaluations(): CrossSectionalEvaluation[] {
  return plan().periods.flatMap((period, index) => [
    {
      ticker: "AAA",
      providerTicker: "AAA",
      signalDate: period.signalDate,
      score: 82,
      confidence: 0.85,
      fundamentalScore: 80,
      valuationScore: 76,
      passes: true,
      forwardReturn: 0.04 + index * 0.001,
      proxyExit: false,
    },
    {
      ticker: "BBB",
      providerTicker: "BBB",
      signalDate: period.signalDate,
      score: 74,
      confidence: 0.8,
      fundamentalScore: 72,
      valuationScore: 68,
      passes: true,
      forwardReturn: 0.02,
      proxyExit: false,
    },
    {
      ticker: "CCC",
      providerTicker: "CCC",
      signalDate: period.signalDate,
      score: 60,
      confidence: 0.75,
      fundamentalScore: 65,
      valuationScore: 60,
      passes: true,
      forwardReturn: -0.02,
      proxyExit: false,
    },
  ]);
}

describe("StockMind cross-sectional robustness", () => {
  it("splits development and holdout chronologically without overlap", () => {
    const report = analyzeCrossSectionalRobustness(plan(), evaluations(), {
      topN: 10,
      scoreThreshold: 72,
      transactionCostBps: 10,
    });

    expect(report.developmentPeriods).toBe(4);
    expect(report.validationPeriods).toBe(2);
    expect(report.splitDate).toBe("2025-03-31");
    expect(report.chosenDevelopment.periodsDetail.at(-1)?.signalDate).toBe(
      "2024-12-31",
    );
    expect(report.chosenValidation.periodsDetail[0]?.signalDate).toBe(
      "2025-03-31",
    );
  });

  it("tests a neighborhood of thresholds and top-N values on the same evidence", () => {
    const report = analyzeCrossSectionalRobustness(plan(), evaluations(), {
      topN: 10,
      scoreThreshold: 72,
      transactionCostBps: 10,
    });

    expect(report.parameterCount).toBe(15);
    expect(new Set(report.cells.map((cell) => cell.topN))).toEqual(
      new Set([5, 10, 15]),
    );
    expect(new Set(report.cells.map((cell) => cell.scoreThreshold))).toEqual(
      new Set([66, 69, 72, 75, 78]),
    );
  });

  it("reports how broadly validation beats the benchmark instead of picking one winning cell", () => {
    const report = analyzeCrossSectionalRobustness(plan(), evaluations(), {
      topN: 10,
      scoreThreshold: 72,
      transactionCostBps: 0,
    });

    expect(report.positiveValidationShare).toBeGreaterThan(0.5);
    expect(report.stablePositiveShare).toBeGreaterThan(0.5);
    expect(report.medianValidationExcessReturn).not.toBeNull();
    expect(report.medianValidationExcessReturn!).toBeGreaterThan(0);
  });

  it("still returns a safe diagnostic when the period sample is too short", () => {
    const shortPlan: CrossSectionalPlan = {
      ...plan(),
      periods: plan().periods.slice(0, 3),
    };

    const report = analyzeCrossSectionalRobustness(
      shortPlan,
      evaluations(),
      {
        topN: 10,
        scoreThreshold: 72,
        transactionCostBps: 10,
      },
    );

    expect(report.validationPeriods).toBe(0);
    expect(report.parameterCount).toBe(0);
    expect(report.cells).toEqual([]);
  });
});
