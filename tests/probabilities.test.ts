import { describe, expect, it } from "vitest";
import { selectPrize, validateProbabilities } from "@/domain/probabilities";

const prizes = [
  { id: "a", name: "A", probability: 35 },
  { id: "b", name: "B", probability: 65 },
];

describe("prize probabilities", () => {
  it("accepts a distribution totaling 100", () => expect(() => validateProbabilities(prizes)).not.toThrow());
  it("rejects invalid totals and negative values", () => {
    expect(() => validateProbabilities([{ id: "a", name: "A", probability: 99 }])).toThrow(/total 100/);
    expect(() => validateProbabilities([{ id: "a", name: "A", probability: -1 }, { id: "b", name: "B", probability: 101 }])).toThrow(/non-negative/);
  });
  it("selects deterministic weighted boundaries server-side", () => {
    expect(selectPrize(prizes, 0).id).toBe("a");
    expect(selectPrize(prizes, 0.349999).id).toBe("a");
    expect(selectPrize(prizes, 0.35).id).toBe("b");
    expect(selectPrize(prizes, 0.999999).id).toBe("b");
  });
});
