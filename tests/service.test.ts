import { describe, expect, it } from "vitest";
import { ViralioService } from "@/application/viralio-service";
import { rewardStatus } from "@/domain/rewards";
import { MemoryRepository } from "@/persistence/memory-repository";

function setup(now = new Date("2026-09-02T12:00:00.000Z")) {
  const repository = new MemoryRepository();
  return { repository, service: new ViralioService(repository, () => 0.9999, () => now) };
}

async function sharedSession(service: ViralioService, merchantSlug = "moka") {
  const { session } = await service.startSession(merchantSlug);
  await service.unlock(session.id);
  await service.initiateShare(session.id, "native");
  return session;
}

describe("ViralioService", () => {
  it("issues at most one server-selected reward per session", async () => {
    const { repository, service } = setup();
    const session = await sharedSession(service);
    const first = await service.spin(session.id);
    const second = await service.spin(session.id);
    expect(second.id).toBe(first.id);
    expect(first.prizeId).toBe("special");
    expect(repository.database.rewards).toHaveLength(1);
    expect(repository.database.events.filter((event) => event.name === "reward_issued")).toHaveLength(1);
  });

  it("redeems a reward only through the owning merchant and only once", async () => {
    const { repository, service } = setup();
    const session = await sharedSession(service);
    const reward = await service.spin(session.id);

    await expect(service.getRewardForMerchant("merchant_atlas", reward.shortCode)).rejects.toThrow(/not found/);
    await expect(service.redeemForMerchant("merchant_atlas", reward.shortCode)).rejects.toThrow(/not found/);

    expect(rewardStatus(await service.redeemForMerchant("merchant_moka", reward.shortCode))).toBe("REDEEMED");
    await expect(service.redeemForMerchant("merchant_moka", reward.shortCode)).rejects.toThrow(/not available/);
    expect(repository.database.events.filter((event) => event.name === "reward_redeemed")).toHaveLength(1);
  });

  it("normalizes merchant short codes without exposing cross-merchant rewards", async () => {
    const { service } = setup();
    const session = await sharedSession(service);
    const reward = await service.spin(session.id);
    const found = await service.getRewardForMerchant("merchant_moka", `  ${reward.shortCode.toLowerCase()}  `);
    expect(found.id).toBe(reward.id);
    await expect(service.getRewardForMerchant("merchant_atlas", reward.shortCode)).rejects.toThrow(/not found/);
  });

  it("reports expiration based on server time", async () => {
    const { service } = setup();
    const session = await sharedSession(service);
    const reward = await service.spin(session.id);
    expect(rewardStatus(reward, new Date("2026-09-09T11:59:59.000Z"))).toBe("AVAILABLE");
    expect(rewardStatus(reward, new Date("2026-09-09T12:00:00.000Z"))).toBe("EXPIRED");
  });

  it("attributes only valid referrals and does not inflate views on refresh", async () => {
    const { repository, service } = setup();
    const origin = await service.startSession("moka");
    const referred = await service.startSession("moka", undefined, origin.session.referralToken);
    const refreshed = await service.startSession("moka", referred.session.id, origin.session.referralToken);
    const invalid = await service.startSession("moka", undefined, "invalid");
    expect(referred.session.referredBy).toBe(origin.session.referralToken);
    expect(refreshed.session.id).toBe(referred.session.id);
    expect(invalid.session.referredBy).toBeUndefined();
    expect(repository.database.events.filter((event) => event.name === "referral_landing_viewed")).toHaveLength(1);
    expect(repository.database.events.filter((event) => event.name === "landing_viewed")).toHaveLength(3);
    expect(new Set(repository.database.sessions.map((session) => session.referralToken)).size).toBe(3);
  });

  it("resolves a share-card context only from a valid existing referral token", async () => {
    const { service } = setup();
    const origin = await service.startSession("moka");
    const context = await service.getShareContext(origin.session.referralToken);
    expect(context.merchant.slug).toBe("moka");
    expect(context.session.id).toBe(origin.session.id);
    await expect(service.getShareContext("invalid")).rejects.toThrow(/Invalid referral/);
  });

  it("records Status and Stories as distinct share intent channels", async () => {
    const { repository, service } = setup();
    const whatsappStatus = await service.startSession("moka");
    await service.unlock(whatsappStatus.session.id);
    await service.initiateShare(whatsappStatus.session.id, "whatsapp_status");

    const instagramStory = await service.startSession("moka");
    await service.unlock(instagramStory.session.id);
    await service.initiateShare(instagramStory.session.id, "instagram_story");

    const initiated = repository.database.events.filter((event) => event.name === "share_initiated");
    expect(initiated.map((event) => event.shareChannel)).toEqual(["whatsapp_status", "instagram_story"]);
    expect(repository.database.events.some((event) => (event.name as string) === "share_published")).toBe(false);
  });

  it("does not record impossible analytics events", async () => {
    const { repository, service } = setup();
    const { session } = await service.startSession("moka");
    await expect(service.initiateShare(session.id, "native")).rejects.toThrow(/Unlock/);
    await expect(service.recordWhatsappSave(session.id)).rejects.toThrow(/Reward/);
    expect(repository.database.events.map((event) => event.name)).toEqual(["landing_viewed"]);
  });

  it("runs the identical secure flow with Atlas Barber configuration", async () => {
    const { repository, service } = setup();
    const { session, merchant } = await service.startSession("atlas-barber");
    await service.unlock(session.id);
    await service.initiateShare(session.id, "whatsapp");
    const reward = await service.spin(session.id);
    expect(merchant.id).toBe("merchant_atlas");
    expect(reward.merchantId).toBe(merchant.id);
    expect(merchant.prizes.some((prize) => prize.id === reward.prizeId)).toBe(true);
    expect(repository.database.events.map((event) => event.name)).toContain("reward_issued");
  });
});
