import { describe, expect, it } from "vitest";
import { rankRadarAnalysis } from "@/acciones/radar";
import {
  createThesisFromAnalysis,
  evaluateThesis,
  type SavedThesis,
} from "@/acciones/thesis";
import type { EngineResult, StockMindAnalysis } from "@/acciones/stockmind";

function engine(
  name: string,
  score: number,
  confidence = 0.8,
  details: Record<string, unknown> = {},
): EngineResult {
  return { name, score, confidence, summary: "ok", details };
}

function report(
  ticker: string,
  compositeScore = 75,
  fundamentalScore = 80,
  valuationScore = 70,
): StockMindAnalysis {
  return {
    ticker,
    companyName: ticker,
    currency: "USD",
    exchange: "NMS",
    price: 110,
    dayChange: 0.01,
    compositeScore,
    confidence: 0.8,
    signal: "WATCH",
    signalLabel: "Observar",
    reasons: [],
    risks: [],
    engines: [
      engine("Fundamental", fundamentalScore, 0.85, {
        roic: 0.22,
        fcf_margin: 0.18,
      }),
      engine("Valuation", valuationScore, 0.8, {
        current_price: 110,
        intrinsic_value_per_share: 145,
        margin_of_safety: 0.32,
      }),
      engine("Market regime", 70, 0.85, { regime: "BULL" }),
      engine("Risk", 65, 0.8),
    ],
    sparkline: [100, 105, 110],
    asOf: "2026-09-26",
    marketSource: "test",
    fundamentalSource: "test",
  };
}

describe("StockMind radar and thesis", () => {
  it("ranks stronger evidence above weaker evidence", () => {
    const strong = report("AAA", 82, 85, 78);
    const weak = report("BBB", 68, 62, 58);

    expect(rankRadarAnalysis(strong)).toBeGreaterThan(rankRadarAnalysis(weak));
  });

  it("creates a thesis from the current analysis", () => {
    const thesis = createThesisFromAnalysis(report("AAA"));
    expect(thesis.ticker).toBe("AAA");
    expect(thesis.entryPrice).toBe(110);
    expect(thesis.fundamentalScore).toBe(80);
    expect(thesis.intrinsicValue).toBe(145);
  });

  it("keeps a healthy thesis vigente", () => {
    const thesis: SavedThesis = {
      ticker: "AAA",
      companyName: "AAA",
      createdAt: "2026-01-01T00:00:00Z",
      entryPrice: 100,
      compositeScore: 80,
      fundamentalScore: 84,
      valuationScore: 74,
      intrinsicValue: 145,
      roic: 0.23,
      fcfMargin: 0.19,
      marginOfSafety: 0.45,
    };

    const review = evaluateThesis(thesis, report("AAA", 78, 82, 70));
    expect(review.action).toBe("HOLD");
    expect(review.health).toBeGreaterThan(70);
  });

  it("flags multiple material deteriorations for exit review", () => {
    const thesis: SavedThesis = {
      ticker: "AAA",
      companyName: "AAA",
      createdAt: "2026-01-01T00:00:00Z",
      entryPrice: 100,
      compositeScore: 80,
      fundamentalScore: 84,
      valuationScore: 74,
      intrinsicValue: 145,
      roic: 0.23,
      fcfMargin: 0.19,
      marginOfSafety: 0.45,
    };

    const deteriorated = report("AAA", 48, 55, 45);
    const fundamental = deteriorated.engines.find((item) => item.name === "Fundamental")!;
    fundamental.details = { roic: 0.08, fcf_margin: 0.07 };
    const valuation = deteriorated.engines.find((item) => item.name === "Valuation")!;
    valuation.details = {
      current_price: 110,
      intrinsic_value_per_share: 105,
      margin_of_safety: -0.05,
    };

    const review = evaluateThesis(thesis, deteriorated);
    expect(review.action).toBe("REVIEW_EXIT");
    expect(review.deteriorations.length).toBeGreaterThanOrEqual(2);
  });
});
