import type { PrizeDefinition } from "./types";

export function validateProbabilities(prizes: PrizeDefinition[]): void {
  if (prizes.length === 0) throw new Error("At least one prize is required");
  if (prizes.some((prize) => !Number.isFinite(prize.probability) || prize.probability < 0)) {
    throw new Error("Prize probabilities must be finite and non-negative");
  }
  const total = prizes.reduce((sum, prize) => sum + prize.probability, 0);
  if (Math.abs(total - 100) > 1e-9) throw new Error("Prize probabilities must total 100");
}

export function selectPrize(prizes: PrizeDefinition[], randomValue: number): PrizeDefinition {
  validateProbabilities(prizes);
  if (randomValue < 0 || randomValue >= 1) throw new Error("Random value must be in [0, 1)");
  const target = randomValue * 100;
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += prize.probability;
    if (target < cumulative) return prize;
  }
  return prizes[prizes.length - 1];
}
