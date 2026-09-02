import { describe, expect, it } from "vitest";
import { ViralioService } from "@/application/viralio-service";
import { defaultMerchantCustomization } from "@/config/merchant-customization";
import { getMerchantBySlug } from "@/config/merchants";
import { MemoryRepository } from "@/persistence/memory-repository";

function setup(random = () => 0) {
  const repository = new MemoryRepository();
  const now = new Date("2026-09-02T12:00:00.000Z");
  return { repository, service: new ViralioService(repository, random, () => now) };
}

function customizedMoka() {
  const base = getMerchantBySlug("moka")!;
  const customization = defaultMerchantCustomization(base);
  customization.copy.displayName = "Moka Centro";
  customization.copy.heroTitle = "Tu premio cambió desde el panel";
  customization.whatsappNumber = "5492215551234";
  customization.rewardValidityDays = 30;
  customization.prizes = customization.prizes.map((prize, index) => ({
    ...prize,
    name: index === 0 ? "Premio configurable" : prize.name,
    probability: index === 0 ? 100 : 0,
  }));
  return customization;
}

describe("merchant customization", () => {
  it("persists settings merchant-scoped and applies them to the live experience", async () => {
    const { repository, service } = setup();
    const customization = customizedMoka();
    const updated = await service.updateMerchantCustomization("merchant_moka", customization);

    expect(updated.name).toBe("Moka Centro");
    expect(updated.theme.heroTitle).toBe("Tu premio cambió desde el panel");
    expect(updated.rewardValidityDays).toBe(30);
    expect(repository.database.merchantSettings).toHaveLength(1);

    const live = await service.getMerchantForExperience("moka");
    expect(live.whatsappNumber).toBe("5492215551234");
    expect(live.prizes[0]?.probability).toBe(100);

    const atlas = await service.getMerchantForExperience("atlas-barber");
    expect(atlas.name).toBe("Atlas Barber");
    expect(atlas.rewardValidityDays).toBe(10);
  });

  it("uses configured prize, name and validity for newly issued rewards", async () => {
    const { service } = setup(() => 0.999999);
    await service.updateMerchantCustomization("merchant_moka", customizedMoka());
    const { session } = await service.startSession("moka");
    await service.unlock(session.id);
    await service.initiateShare(session.id, "native");
    const reward = await service.spin(session.id);

    expect(reward.prizeId).toBe("upgrade");
    expect(reward.prizeName).toBe("Premio configurable");
    expect(reward.expiresAt).toBe("2026-10-02T12:00:00.000Z");
  });

  it("rejects unsafe or inconsistent settings", async () => {
    const { service } = setup();
    const invalidTotal = customizedMoka();
    invalidTotal.prizes[0]!.probability = 99;
    await expect(service.updateMerchantCustomization("merchant_moka", invalidTotal)).rejects.toThrow(/total 100/);

    const invalidWhatsapp = customizedMoka();
    invalidWhatsapp.whatsappNumber = "abc";
    await expect(service.updateMerchantCustomization("merchant_moka", invalidWhatsapp)).rejects.toThrow(/whatsappNumber/);

    const invalidPrize = customizedMoka();
    invalidPrize.prizes[0]!.id = "invented";
    await expect(service.updateMerchantCustomization("merchant_moka", invalidPrize)).rejects.toThrow(/prizes/);
  });
});
