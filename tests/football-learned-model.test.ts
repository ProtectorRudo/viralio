import { describe, expect, it } from "vitest";

import {
  hasLearnedCoverage,
  simulateLearned,
} from "../src/app/api/futbol/learned-model";

describe("promoted football model", () => {
  it("recognizes covered Denmark teams", () => {
    expect(hasLearnedCoverage("FC København", "FC Midtjylland")).toBe(true);
    expect(hasLearnedCoverage("Boca Juniors", "Estudiantes")).toBe(false);
  });

  it("returns traceable learned probabilities", () => {
    const result = simulateLearned({
      homeTeam: "FC København",
      awayTeam: "FC Midtjylland",
      simulations: 5000,
      seed: 42,
    });

    expect(result).not.toBeNull();
    expect(result?.source).toBe("viralio-learned");
    expect(result?.modelVersion).toBe("team-profile-v1");
    expect(result?.competitionKey).toBe("sportmonks:271");
    expect(result?.validationAlignedPredictions).toBe(138);
    expect(result?.advancedXgAvailable).toBe(false);
    expect(result?.homeWin).toBeGreaterThan(result?.awayWin ?? 1);
    expect(
      (result?.homeWin ?? 0) + (result?.draw ?? 0) + (result?.awayWin ?? 0),
    ).toBeCloseTo(1, 4);
    expect(result?.topScorelines.length).toBeGreaterThan(0);
    expect(result?.events.length).toBeGreaterThan(0);

    const repeated = simulateLearned({
      homeTeam: "FC København",
      awayTeam: "FC Midtjylland",
      simulations: 5000,
      seed: 42,
    });
    expect(repeated?.events).toEqual(result?.events);

    let previousHome = 0;
    let previousAway = 0;
    for (const event of result?.events ?? []) {
      expect(event.homeScore).toBeGreaterThanOrEqual(previousHome);
      expect(event.awayScore).toBeGreaterThanOrEqual(previousAway);
      previousHome = event.homeScore;
      previousAway = event.awayScore;
    }
  });
});
