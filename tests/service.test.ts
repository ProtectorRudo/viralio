import { describe, expect, it } from "vitest";
import { ViralioService } from "@/application/viralio-service";
import { rewardStatus } from "@/domain/rewards";
import { MemoryRepository } from "@/persistence/memory-repository";

function setup(now = new Date("2026-09-02T12:00:00.000Z")) {
  const repository = new MemoryRepository();
  return { repository, service: new ViralioService(repository, () => 0.9999, () => now) };
}

async function sharedSession(service: ViralioService) {
  const { session } = await service.startSession("moka");
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

  it("redeems a reward only once", async () => {
    const { repository, service } = setup();
    const session = await sharedSession(service);
    const reward = await service.spin(session.id);
    expect(rewardStatus(await service.redeem(reward.token))).toBe("REDEEMED");
    await expect(service.redeem(reward.token)).rejects.toThrow(/not available/);
    expect(repository.database.events.filter((event) => event.name === "reward_redeemed")).toHaveLength(1);
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

  it("does not record impossible analytics events", async () => {
    const { repository, service } = setup();
    const { session } = await service.startSession("moka");
    await expect(service.initiateShare(session.id, "native")).rejects.toThrow(/Unlock/);
    await expect(service.recordWhatsappSave(session.id)).rejects.toThrow(/Reward/);
    expect(repository.database.events.map((event) => event.name)).toEqual(["landing_viewed"]);
  });
});
