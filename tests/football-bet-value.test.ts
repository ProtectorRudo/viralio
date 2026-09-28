import { describe, expect, it } from "vitest";

import {
  classifyValue,
  expectedValueEdge,
  fairOdds,
  minimumValueOdds,
  parseDecimalOdds,
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
    expect(classifyValue(2.2, 2.1).tone).toBe("positive");
    expect(classifyValue(2.1, 2.1).tone).toBe("warning");
    expect(classifyValue(1.95, 2.1).tone).toBe("negative");
    expect(classifyValue(null, 2.1).tone).toBe("neutral");
  });

  it("accepts decimal odds with comma or dot", () => {
    expect(parseDecimalOdds("2,15")).toBe(2.15);
    expect(parseDecimalOdds("2.15")).toBe(2.15);
    expect(parseDecimalOdds("1.00")).toBeNull();
  });
});
