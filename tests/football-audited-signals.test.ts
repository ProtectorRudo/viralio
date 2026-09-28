import { describe, expect, it } from "vitest";

import signals from "../src/app/futbol/upcoming-denmark-271-signals.json";

describe("audited football value signals contract", () => {
  it("has the expected schema and freshness metadata", () => {
    expect(signals.schema_version).toBe("football-value-signals-v1");
    expect(typeof signals.generated_at).toBe("string");
    expect(typeof signals.odds_generated_at).toBe("string");
    expect(typeof signals.profile_cutoff_at).toBe("string");
  });

  it("contains audited fixture signals with required fields", () => {
    expect(signals.fixtures.length).toBeGreaterThan(0);

    for (const fixture of signals.fixtures) {
      expect(typeof fixture.fixture_id).toBe("number");
      expect(typeof fixture.home_team).toBe("string");
      expect(typeof fixture.away_team).toBe("string");
      expect(typeof fixture.kickoff_at).toBe("string");
      expect(fixture.selected_signal).toBeTruthy();

      const signal = fixture.selected_signal;
      if (!signal) continue;

      expect(signal.model_probability).toBeGreaterThan(0);
      expect(signal.model_probability).toBeLessThan(1);
      expect(signal.market_probability).toBeGreaterThan(0);
      expect(signal.market_probability).toBeLessThan(1);
      expect(signal.fair_odds).toBeGreaterThan(1);
      expect(signal.minimum_odds).toBeGreaterThan(signal.fair_odds);
      expect(signal.bookmaker_odds).toBeGreaterThan(1);
      expect(signal.bookmaker_count).toBeGreaterThanOrEqual(1);
      expect(typeof signal.qualifies).toBe("boolean");
    }
  });

  it("keeps promoted opportunities internally consistent", () => {
    for (const fixture of signals.top_opportunities) {
      const signal = fixture.selected_signal;
      expect(signal.review_reason).toBeNull();
      expect(signal.qualifies).toBe(true);
      expect(signal.bookmaker_odds).toBeGreaterThanOrEqual(signal.minimum_odds);
      expect(signal.expected_value_edge).toBeGreaterThan(0);
    }
  });
});
