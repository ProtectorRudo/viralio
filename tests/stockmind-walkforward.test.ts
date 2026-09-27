import { describe, expect, it } from "vitest";
import {
  analyzeDataQuality,
  type EngineResult,
  type MarketPoint,
} from "@/acciones/stockmind";
import {
  cumulativeReturn,
  maxDrawdown,
  passesStrongFilters,
  spearman,
} from "@/acciones/walkforward";

function engine(
  name: string,
  score: number,
  confidence = 0.8,
): EngineResult {
  return {
    name,
    score,
    confidence,
    summary: "ok",
    details: {},
  };
}

describe("StockMind PIT walk-forward helpers", () => {
  it("computes rank correlation without using future data helpers", () => {
    expect(spearman([10, 20, 30, 40, 50], [1, 2, 3, 4, 5])).toBeCloseTo(1);
    expect(spearman([10, 20, 30, 40, 50], [5, 4, 3, 2, 1])).toBeCloseTo(-1);
  });

  it("compounds returns and measures drawdown", () => {
    expect(cumulativeReturn([0.1, -0.1])).toBeCloseTo(-0.01);
    const drawdown = maxDrawdown([0.1, -0.2, 0.05]);
    expect(drawdown).toBeLessThan(0);
    expect(drawdown).toBeGreaterThanOrEqual(-1);
  });

  it("requires the same strong evidence gates as StockMind", () => {
    const engines = [
      engine("Fundamental", 80, 0.85),
      engine("Valuation", 75, 0.8),
      engine("Risk", 70, 0.8),
      engine("Market regime", 68, 0.85),
      engine("Data quality", 90, 0.95),
    ];

    expect(passesStrongFilters(engines, 80, 72)).toBe(true);

    const weakValuation = engines.map((item) =>
      item.name === "Valuation" ? engine("Valuation", 45, 0.8) : item,
    );
    expect(passesStrongFilters(weakValuation, 80, 72)).toBe(false);
  });

  it("scores historical market freshness against the simulated date", () => {
    const points: MarketPoint[] = Array.from({ length: 230 }, (_, index) => ({
      date: new Date(Date.UTC(2019, 5, 1 + index))
        .toISOString()
        .slice(0, 10),
      close: 100 + index,
      high: 101 + index,
      low: 99 + index,
      volume: 1_000_000,
    }));

    const asOf = points.at(-1)!.date;
    const historical = analyzeDataQuality(points, null, "missing", asOf);

    expect(historical.details.market_age_days).toBe(0);
    expect(historical.score).toBeGreaterThanOrEqual(55);
  });
});
