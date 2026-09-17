export interface MerchantOnboardingPrizeInput {
  name: string;
  probability: number;
}

export interface MerchantOnboardingRewardOverrides {
  rewardValidityDays?: number;
  prizes?: MerchantOnboardingPrizeInput[];
}

function parseRewardValidityDays(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 90) {
    throw new Error("Invalid rewardValidityDays");
  }
  return value;
}

function parsePrizes(value: unknown): MerchantOnboardingPrizeInput[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length !== 5) throw new Error("Invalid prizes");

  const prizes = value.map((candidate): MerchantOnboardingPrizeInput => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Invalid prizes");
    const record = candidate as Record<string, unknown>;
    if (typeof record.name !== "string") throw new Error("Invalid prize name");
    const name = record.name.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 90 || /[<>]/.test(name)) throw new Error("Invalid prize name");
    if (
      typeof record.probability !== "number" ||
      !Number.isInteger(record.probability) ||
      record.probability < 0 ||
      record.probability > 100
    ) {
      throw new Error("Invalid prize probability");
    }
    return { name, probability: record.probability };
  });

  if (prizes.reduce((sum, prize) => sum + prize.probability, 0) !== 100) {
    throw new Error("Prize probabilities must total 100");
  }
  return prizes;
}

export function parseMerchantOnboardingRewardOverrides(value: unknown): MerchantOnboardingRewardOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid merchant onboarding");
  const candidate = value as Record<string, unknown>;
  return {
    rewardValidityDays: parseRewardValidityDays(candidate.rewardValidityDays),
    prizes: parsePrizes(candidate.prizes),
  };
}
