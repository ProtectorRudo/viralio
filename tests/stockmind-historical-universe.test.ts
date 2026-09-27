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

  it("keeps plausible sizes throughout the web backtest window", () => {
    for (const date of [
      "2018-12-31",
      "2020-12-31",
      "2022-12-30",
      "2024-12-31",
      "2026-09-21",
    ]) {
      const count = sp500MembersAsOf(date).length;
      expect(count).toBeGreaterThanOrEqual(490);
      expect(count).toBeLessThanOrEqual(515);
    }
  });

  it("normalizes class-share tickers for market data providers", () => {
    expect(normalizeProviderTicker("BRK.B")).toBe("BRK-B");
    expect(normalizeProviderTicker("BF.B")).toBe("BF-B");
  });

  it("builds a union that retains companies later removed from the index", () => {
    const union = new Set(
      sp500UniverseUnion(["2024-09-21", "2026-09-21"]),
    );

    expect(union.has("AAL")).toBe(true);
    expect(union.has("AAPL")).toBe(true);
  });

  it("exposes the pinned full-snapshot source metadata", () => {
    const diagnostics = sp500UniverseDiagnostics("2026-09-21");
    expect(diagnostics.sourceCommit).toBe(
      "019beba2644764db88219cee6a8c43b8aae4904e",
    );
    expect(diagnostics.snapshotBlobSha).toBe(
      "cbe4a55138732c8e2a656ca2fc42b4765bef35ff",
    );
    expect(diagnostics.recommendedWebStartDate).toBe("2018-01-01");
  });
});
