import { describe, expect, it } from "vitest";
import {
  compareWalkForwardRuns,
  type SavedWalkForwardRun,
} from "@/acciones/walkforward_compare";
import type {
  WalkForwardObservation,
  WalkForwardResult,
} from "@/acciones/walkforward";

function observation(
  date: string,
  selected: boolean,
  return20d: number,
): WalkForwardObservation {
  return {
    date,
    score: selected ? 80 : 65,
    confidence: 0.8,
    fundamentalScore: 75,
    valuationScore: 70,
    selected,
    return20d,
    return63d: return20d * 1.5,
    spyReturn20d: 0.01,
    spyReturn63d: 0.02,
    alpha20d: return20d - 0.01,
    alpha63d: return20d * 1.5 - 0.02,
  };
}

function result(
  threshold: number,
  observations: WalkForwardObservation[],
  overrides: Partial<WalkForwardResult> = {},
): WalkForwardResult {
  return {
    ticker: "AAA",
    methodology: "PIT_SEC_FULL",
    historyYears: 10,
    stepDays: 21,
    scoreThreshold: threshold,
    transactionCostBps: 10,
    observations: observations.length,
    selectedObservations: observations.filter((row) => row.selected).length,
    skippedNoFundamentals: 0,
    hitRate20d: 0.7,
    medianReturn20d: 0.03,
    medianReturn63d: 0.05,
    baselineMedian20d: 0.015,
    baselineMedian63d: 0.025,
    medianSpy20d: 0.01,
    medianSpy63d: 0.02,
    medianAlpha20d: 0.02,
    medianAlpha63d: 0.03,
    spearman20d: 0.2,
    spearman63d: 0.25,
    medianFundamentalScore: 75,
    medianValuationScore: 70,
    cumulativeReturn: 0.2,
    benchmarkCumulativeReturn: 0.15,
    cagr: 0.08,
    benchmarkCagr: 0.06,
    maxDrawdown: -0.12,
    benchmarkMaxDrawdown: -0.18,
    averageExposure: 0.5,
    startDate: "2020-01-31",
    endDate: "2025-12-31",
    observationsDetail: observations,
    source: "test",
    ...overrides,
  };
}

function saved(
  id: string,
  threshold: number,
  observations: WalkForwardObservation[],
  overrides: Partial<WalkForwardResult> = {},
): SavedWalkForwardRun {
  return {
    id,
    createdAt: "2026-09-27T00:00:00Z",
    label: id,
    result: result(threshold, observations, overrides),
  };
}

describe("StockMind walk-forward comparator", () => {
  it("allows threshold changes while preserving a clean comparison", () => {
    const dates = [
      observation("2025-01-31", true, 0.04),
      observation("2025-02-28", true, -0.01),
      observation("2025-03-31", false, 0.02),
    ];
    const stricter = [
      observation("2025-01-31", true, 0.04),
      observation("2025-02-28", false, -0.01),
      observation("2025-03-31", false, 0.02),
    ];

    const comparison = compareWalkForwardRuns(
      saved("base", 72, dates),
      saved("strict", 76, stricter, {
        cumulativeReturn: 0.25,
        cagr: 0.09,
        averageExposure: 1 / 3,
      }),
    );

    expect(comparison.compatible).toBe(true);
    expect(comparison.thresholdDelta).toBe(4);
    expect(comparison.changedSignalDates).toBe(1);
    expect(comparison.signalAgreement).toBeCloseTo(2 / 3);
    expect(comparison.cumulativeReturnDelta).toBeCloseTo(0.05);
  });

  it("marks different sampling cadence as incompatible", () => {
    const rows = [observation("2025-01-31", true, 0.03)];

    const comparison = compareWalkForwardRuns(
      saved("monthly", 72, rows),
      saved("quarterly", 72, rows, { stepDays: 63 }),
    );

    expect(comparison.compatible).toBe(false);
    expect(
      comparison.compatibilityIssues.some((issue) =>
        issue.includes("stepDays"),
      ),
    ).toBe(true);
  });

  it("computes period-return RMSE only on common dates", () => {
    const left = [
      observation("2025-01-31", true, 0.05),
      observation("2025-02-28", false, 0.02),
    ];
    const right = [
      observation("2025-01-31", false, 0.05),
      observation("2025-02-28", false, 0.02),
    ];

    const comparison = compareWalkForwardRuns(
      saved("left", 72, left),
      saved("right", 76, right),
    );

    expect(comparison.commonObservations).toBe(2);
    expect(comparison.periodReturnRmse).not.toBeNull();
    expect(comparison.periodReturnRmse!).toBeGreaterThan(0);
  });
});
