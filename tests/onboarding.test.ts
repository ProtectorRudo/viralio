import { describe, expect, it } from "vitest";
import { ViralioService } from "@/application/viralio-service";
import { parseMerchantOnboarding } from "@/config/merchant-accounts";
import { MemoryRepository } from "@/persistence/memory-repository";

const authEnvironment = {
  NODE_ENV: "test",
  VIRALIO_AUTH_SECRET: "test-auth-secret-with-at-least-32-characters",
} as NodeJS.ProcessEnv;

function setup() {
  const repository = new MemoryRepository();
  const service = new ViralioService(
    repository,
    () => 0.9999,
    () => new Date("2026-09-02T12:00:00.000Z"),
  );
  return { repository, service };
}

const bruma = {
  name: "Bruma Café",
  slug: "bruma-cafe",
  template: "coffee",
  whatsappNumber: "+54 9 221 555 0000",
  pin: "482619",
} as const;

describe("merchant onboarding", () => {
  it("creates a durable merchant account with hashed PIN and usable default campaign", async () => {
    const { repository, service } = setup();
    const merchant = await service.createMerchant(bruma, authEnvironment);

    expect(merchant.slug).toBe("bruma-cafe");
    expect(merchant.name).toBe("Bruma Café");
    expect(merchant.whatsappNumber).toBe("5492215550000");
    expect(merchant.prizes.reduce((sum, prize) => sum + prize.probability, 0)).toBe(100);
    expect(merchant.theme.heroCopy).toContain("Bruma Café");

    expect(repository.database.merchantAccounts).toHaveLength(1);
    const account = repository.database.merchantAccounts[0];
    expect(account.pinHash).not.toContain(bruma.pin);
    expect(account.pinSalt.length).toBeGreaterThan(10);
    expect(repository.database.merchantSettings[0]?.merchantId).toBe(account.id);

    expect(await service.authenticateDynamicMerchant(bruma.slug, bruma.pin, authEnvironment)).toBe(account.id);
    expect(await service.authenticateDynamicMerchant(bruma.slug, "000000", authEnvironment)).toBeUndefined();
  });

  it("runs the standard referral and reward flow for a merchant that never existed in source code", async () => {
    const { service } = setup();
    const merchant = await service.createMerchant(bruma, authEnvironment);
    const { session } = await service.startSession(merchant.slug);
    await service.unlock(session.id);
    await service.initiateShare(session.id, "whatsapp_status");
    const reward = await service.spin(session.id);

    expect(reward.merchantId).toBe(merchant.id);
    expect(merchant.prizes.some((prize) => prize.id === reward.prizeId)).toBe(true);
    expect((await service.getMerchantMetrics(merchant.id)).rewardsIssued).toBe(1);
    expect((await service.getShareContext(session.referralToken)).merchant.slug).toBe(bruma.slug);
  });

  it("rejects duplicate, reserved and malformed merchant identities", async () => {
    const { service } = setup();
    await service.createMerchant(bruma, authEnvironment);
    await expect(service.createMerchant(bruma, authEnvironment)).rejects.toThrow(/already exists/);

    expect(() => parseMerchantOnboarding({ ...bruma, slug: "api" })).toThrow(/reserved/);
    expect(() => parseMerchantOnboarding({ ...bruma, slug: "MAL slug" })).toThrow(/Invalid slug/);
    expect(() => parseMerchantOnboarding({ ...bruma, pin: "12ab" })).toThrow(/Invalid pin/);
  });
});
