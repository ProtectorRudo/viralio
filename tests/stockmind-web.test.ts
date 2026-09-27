import { describe, expect, it } from "vitest";
import {
  analyzeAnalogs,
  analyzeRisk,
  analyzeSeasonality,
  analyzeTechnical,
} from "@/acciones/stockmind";

type Points = Parameters<typeof analyzeTechnical>[0];

function syntheticSeries(days: number): Points {
  const start = new Date("2016-01-04T00:00:00Z");
  const points: Points = [];
  let close = 100;

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;

    const drift = 0.0007;
    const wave = Math.sin(i / 19) * 0.0025;
    close *= 1 + drift + wave;

    points.push({
      date: date.toISOString().slice(0, 10),
      close,
      high: close * 1.01,
      low: close * 0.99,
      volume: 1_000_000 + i * 100,
    });
  }

  return points;
}

describe("StockMind web engines", () => {
  it("scores a persistent uptrend above neutral technically", () => {
    const result = analyzeTechnical(syntheticSeries(900));
    expect(result.name).toBe("Technical");
    expect(result.score).toBeGreaterThan(55);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("produces bounded risk and historical-analog scores", () => {
    const points = syntheticSeries(1800);
    const risk = analyzeRisk(points);
    const analogs = analyzeAnalogs(points);

    expect(risk.score).toBeGreaterThanOrEqual(0);
    expect(risk.score).toBeLessThanOrEqual(100);
    expect(analogs.score).toBeGreaterThanOrEqual(0);
    expect(analogs.score).toBeLessThanOrEqual(100);
    expect(Number(analogs.details.samples)).toBeGreaterThanOrEqual(5);
  });

  it("builds a multi-year seasonality sample", () => {
    const seasonality = analyzeSeasonality(syntheticSeries(2600));
    expect(seasonality.name).toBe("Seasonality");
    expect(Number(seasonality.details.samples)).toBeGreaterThanOrEqual(5);
    expect(seasonality.score).toBeGreaterThanOrEqual(0);
    expect(seasonality.score).toBeLessThanOrEqual(100);
  });
});
