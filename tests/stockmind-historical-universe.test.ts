import { describe, expect, it } from "vitest";
import {
  normalizeProviderTicker,
  sp500MembersAsOf,
  sp500UniverseDiagnostics,
  sp500UniverseUnion,
} from "@/acciones/historical_universe";

describe("StockMind historical S&P 500 universe", () => {
  it("reverses the latest effective-date change without survivorship leakage", () => {
    const before = new Set(sp500MembersAsOf("2026-09-20"));
    const after = new Set(sp500MembersAsOf("2026-09-21"));

    for (const symbol of ["TAP", "TTD", "BLDR"]) {
      expect(before.has(symbol)).toBe(true);
      expect(after.has(symbol)).toBe(false);
    }

    for (const symbol of ["P", "BE", "ILMN"]) {
      expect(before.has(symbol)).toBe(false);
      expect(after.has(symbol)).toBe(true);
    }
  });

  it("keeps plausible historical index sizes", () => {
    for (const date of ["2001-01-31", "2010-12-31", "2020-12-31", "2026-09-21"]) {
      const count = sp500MembersAsOf(date).length;
      expect(count).toBeGreaterThanOrEqual(480);
      expect(count).toBeLessThanOrEqual(515);
    }
  });

  it("normalizes class-share tickers for market data providers", () => {
    expect(normalizeProviderTicker("BRK.B")).toBe("BRK-B");
    expect(normalizeProviderTicker("BF.B")).toBe("BF-B");
  });

  it("builds a union that includes removed constituents", () => {
    const union = new Set(
      sp500UniverseUnion(["2008-09-30", "2026-09-21"]),
    );

    expect(union.has("LEHMQ")).toBe(true);
    expect(union.has("AAPL")).toBe(true);
  });

  it("exposes pinned source metadata", () => {
    const diagnostics = sp500UniverseDiagnostics("2026-09-21");
    expect(diagnostics.sourceCommit).toBe(
      "019beba2644764db88219cee6a8c43b8aae4904e",
    );
    expect(diagnostics.snapshotDate).toBe("2026-09-27");
  });
});
