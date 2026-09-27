import { describe, expect, it } from "vitest";
import {
  replayHistoricalScenario,
  type HistoricalScenario,
} from "@/acciones/stress";

function series(
  start: string,
  end: string,
  startValue: number,
  endValue: number,
) {
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(`${end}T00:00:00Z`);
  const dates: string[] = [];

  for (
    let cursor = new Date(from);
    cursor <= to;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
  }

  return dates.map((date, index) => ({
    date,
    close:
      startValue +
      ((endValue - startValue) * index) / Math.max(1, dates.length - 1),
  }));
}

describe("StockMind historical portfolio stress", () => {
  const scenario: HistoricalScenario = {
    name: "Crash",
    startDate: "2020-02-19",
    endDate: "2020-03-23",
  };

  it("preserves explicit coverage and loss contributions", () => {
    const prices = new Map([
      ["AAA", series("2020-02-19", "2020-03-23", 100, 60)],
      ["BBB", series("2020-02-19", "2020-03-23", 100, 80)],
    ]);
    const weights = new Map([
      ["AAA", 0.6],
      ["BBB", 0.3],
      ["NEW", 0.1],
    ]);

    const result = replayHistoricalScenario(prices, weights, scenario);

    expect(result.coverage).toBeCloseTo(0.9);
    expect(result.portfolioReturn).not.toBeNull();
    expect(result.portfolioReturn!).toBeLessThan(0);
    expect(result.coveredSubportfolioReturn).not.toBeNull();
    expect(result.missingTickers).toContain("NEW");
    expect(result.topLossContributors[0][0]).toBe("AAA");
  });

  it("does not fabricate a return for missing history", () => {
    const result = replayHistoricalScenario(
      new Map(),
      new Map([["IPO", 1]]),
      {
        name: "Old",
        startDate: "2008-09-15",
        endDate: "2009-03-09",
      },
    );

    expect(result.coverage).toBe(0);
    expect(result.portfolioReturn).toBeNull();
    expect(result.coveredSubportfolioReturn).toBeNull();
    expect(result.missingTickers).toContain("IPO");
  });

  it("rejects a company that listed halfway through the scenario", () => {
    const prices = new Map([
      ["LATE", series("2020-03-05", "2020-03-23", 100, 70)],
    ]);

    const result = replayHistoricalScenario(
      prices,
      new Map([["LATE", 1]]),
      scenario,
    );

    expect(result.coverage).toBe(0);
    expect(result.missingTickers).toContain("LATE");
  });

  it("keeps uncovered weight flat instead of guessing its crash return", () => {
    const prices = new Map([
      ["AAA", series("2020-02-19", "2020-03-23", 100, 50)],
    ]);

    const result = replayHistoricalScenario(
      prices,
      new Map([
        ["AAA", 0.8],
        ["UNKNOWN", 0.2],
      ]),
      scenario,
    );

    expect(result.coverage).toBeCloseTo(0.8);
    expect(result.portfolioReturn).toBeCloseTo(-0.4);
    expect(result.coveredSubportfolioReturn).toBeCloseTo(-0.5);
  });
});
