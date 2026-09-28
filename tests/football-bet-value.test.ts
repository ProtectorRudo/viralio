import { describe, expect, it } from "vitest";

import {
  classifyValue,
  confidenceAdjustedEdgeBuffer,
  expectedValueEdge,
  fairOdds,
  impliedProbability,
  isHighModelMarketDivergence,
  isThinBookmakerMarket,
  minimumValueOdds,
  parseDecimalOdds,
  probabilityEdge,
} from "../src/app/futbol/bet-value";

describe("football betting value math", () => {
  it("computes fair and minimum value odds", () => {
    expect(fairOdds(0.5)).toBeCloseTo(2, 8);
    expect(minimumValueOdds(0.5)).toBeCloseTo(2.1, 8);
  });

  it("computes expected value edge", () => {
    expect(expectedValueEdge(0.5, 2.2)).toBeCloseTo(0.1, 8);
    expect(expectedValueEdge(0.5, 1.9)).toBeCloseTo(-0.05, 8);
  });

  it("classifies bookmaker odds visually", () => {
    expect(classifyValue(2.1, 2.0, 2.1).tone).toBe("positive");
    expect(classifyValue(2.05, 2.0, 2.1).tone).toBe("warning");
    expect(classifyValue(1.95, 2.0, 2.1).tone).toBe("negative");
    expect(classifyValue(null, 2.0, 2.1).tone).toBe("neutral");
  });

  it("computes double-chance probabilities and minimum odds consistently", () => {
    const home = 0.42;
    const draw = 0.28;
    const away = 0.30;

    const oneX = home + draw;
    const xTwo = draw + away;
    const oneTwo = home + away;

    expect(oneX).toBeCloseTo(0.70, 8);
    expect(xTwo).toBeCloseTo(0.58, 8);
    expect(oneTwo).toBeCloseTo(1 - draw, 8);

    expect(minimumValueOdds(oneX)).toBeCloseTo(1.5, 8);
    expect(minimumValueOdds(xTwo)).toBeCloseTo(1.8103448276, 8);
    expect(minimumValueOdds(oneTwo)).toBeCloseTo(1.4583333333, 8);
  });

  it("raises the minimum edge when model confidence is lower", () => {
    expect(confidenceAdjustedEdgeBuffer(100)).toBeCloseTo(0.05, 8);
    expect(confidenceAdjustedEdgeBuffer(50)).toBeCloseTo(0.075, 8);
    expect(confidenceAdjustedEdgeBuffer(0)).toBeCloseTo(0.10, 8);
  });

  it("compares model probability against bookmaker implied probability", () => {
    expect(impliedProbability(2)).toBeCloseTo(0.5, 8);
    expect(probabilityEdge(0.58, 2)).toBeCloseTo(0.08, 8);
  });

  it("flags large model-market disagreement when confidence is low", () => {
    expect(isHighModelMarketDivergence(0.31, 5.0, 50)).toBe(true);
    expect(isHighModelMarketDivergence(0.30, 5.0, 85)).toBe(false);
    expect(isHighModelMarketDivergence(0.22, 5.0, 50)).toBe(false);
  });

  it("flags thin bookmaker coverage", () => {
    expect(isThinBookmakerMarket(1)).toBe(true);
    expect(isThinBookmakerMarket(2)).toBe(false);
    expect(isThinBookmakerMarket(undefined)).toBe(true);
  });

  it("accepts decimal odds with comma or dot", () => {
    expect(parseDecimalOdds("2,15")).toBe(2.15);
    expect(parseDecimalOdds("2.15")).toBe(2.15);
    expect(parseDecimalOdds("1.00")).toBeNull();
  });
});
