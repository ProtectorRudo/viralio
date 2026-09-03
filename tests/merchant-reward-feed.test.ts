import { describe, expect, it } from "vitest";
import type { Reward } from "@/domain/types";
import { filterMerchantRewards } from "@/persistence/merchant-reward-feed";

function reward(overrides: Partial<Reward> & Pick<Reward, "id" | "shortCode" | "merchantId" | "issuedAt" | "expiresAt">): Reward {
  return {
    token: `token-${overrides.id}`,
    sessionId: `session-${overrides.id}`,
    prizeId: `prize-${overrides.id}`,
    prizeName: `Premio ${overrides.id}`,
    ...overrides,
  } as Reward;
}

describe("merchant reward feed", () => {
  const now = new Date("2026-09-03T16:00:00.000Z");
  const rewards: Reward[] = [
    reward({
      id: "available-new",
      shortCode: "AAAABBBB",
      merchantId: "merchant_moka",
      issuedAt: "2026-09-03T15:00:00.000Z",
      expiresAt: "2026-09-13T16:00:00.000Z",
    }),
    reward({
      id: "expired",
      shortCode: "CCCCDDDD",
      merchantId: "merchant_moka",
      issuedAt: "2026-09-02T15:00:00.000Z",
      expiresAt: "2026-09-03T15:59:59.000Z",
    }),
    reward({
      id: "redeemed",
      shortCode: "EEEEFFFF",
      merchantId: "merchant_moka",
      issuedAt: "2026-09-01T15:00:00.000Z",
      expiresAt: "2026-09-10T16:00:00.000Z",
      redeemedAt: "2026-09-02T10:00:00.000Z",
    }),
    reward({
      id: "other-merchant",
      shortCode: "11112222",
      merchantId: "merchant_atlas",
      issuedAt: "2026-09-03T15:30:00.000Z",
      expiresAt: "2026-09-13T16:00:00.000Z",
    }),
  ];

  it("shows only current rewards by default", () => {
    const result = filterMerchantRewards(rewards, "merchant_moka", "AVAILABLE", now);
    expect(result.map((item) => item.shortCode)).toEqual(["AAAABBBB"]);
    expect(result[0]?.status).toBe("AVAILABLE");
  });

  it("keeps expired and redeemed rewards available as explicit history filters", () => {
    expect(filterMerchantRewards(rewards, "merchant_moka", "EXPIRED", now).map((item) => item.shortCode)).toEqual(["CCCCDDDD"]);
    expect(filterMerchantRewards(rewards, "merchant_moka", "REDEEMED", now).map((item) => item.shortCode)).toEqual(["EEEEFFFF"]);
  });

  it("all history is merchant-scoped and ordered newest first", () => {
    const result = filterMerchantRewards(rewards, "merchant_moka", "ALL", now);
    expect(result.map((item) => item.shortCode)).toEqual(["AAAABBBB", "CCCCDDDD", "EEEEFFFF"]);
    expect(result.some((item) => item.shortCode === "11112222")).toBe(false);
  });
});
