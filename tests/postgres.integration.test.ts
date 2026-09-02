import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ViralioService } from "@/application/viralio-service";
import { defaultMerchantCustomization } from "@/config/merchant-customization";
import { getMerchantBySlug } from "@/config/merchants";
import { PostgresRepository } from "@/persistence/postgres-repository";

const databaseUrl = process.env.DATABASE_URL;
const postgresDescribe = databaseUrl ? describe : describe.skip;

postgresDescribe("PostgresRepository integration", () => {
  if (!databaseUrl) return;

  const sql = postgres(databaseUrl, { max: 3, transform: postgres.camel });
  const repository = new PostgresRepository(databaseUrl, { maxConnections: 5 });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE merchant_settings, analytics_events, rewards, sessions CASCADE`;
  });

  afterAll(async () => {
    await repository.close();
    await sql.end({ timeout: 5 });
  });

  function service(now = new Date("2026-09-02T12:00:00.000Z")) {
    return new ViralioService(repository, () => 0.9999, () => now);
  }

  async function sharedSession(instance: ViralioService) {
    const { session } = await instance.startSession("moka");
    await instance.unlock(session.id);
    await instance.initiateShare(session.id, "whatsapp_status");
    return session;
  }

  it("has the migrated schema and reports healthy", async () => {
    const tables = await sql<{ tableName: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('sessions', 'rewards', 'analytics_events', 'merchant_settings', 'viralio_schema_migrations')
      ORDER BY table_name
    `;
    expect(tables.map((row) => row.tableName)).toEqual([
      "analytics_events",
      "merchant_settings",
      "rewards",
      "sessions",
      "viralio_schema_migrations",
    ]);
    expect(await repository.healthCheck()).toBe(true);
  });

  it("persists merchant settings in PostgreSQL without cross-merchant leakage", async () => {
    const instance = service();
    const base = getMerchantBySlug("moka")!;
    const customization = defaultMerchantCustomization(base);
    customization.copy.displayName = "Moka PostgreSQL";
    customization.copy.heroTitle = "Configuración durable";
    customization.rewardValidityDays = 21;

    await instance.updateMerchantCustomization("merchant_moka", customization);

    const moka = await instance.getMerchantForExperience("moka");
    const atlas = await instance.getMerchantForExperience("atlas-barber");
    expect(moka.name).toBe("Moka PostgreSQL");
    expect(moka.rewardValidityDays).toBe(21);
    expect(atlas.name).toBe("Atlas Barber");

    const rows = await sql<{ merchantId: string; updatedAt: Date }[]>`
      SELECT merchant_id, updated_at FROM merchant_settings ORDER BY merchant_id
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.merchantId).toBe("merchant_moka");
  });

  it("persists and resumes a session with referral attribution and share analytics", async () => {
    const instance = service();
    const origin = await instance.startSession("moka");
    const referred = await instance.startSession("moka", undefined, origin.session.referralToken);
    const resumed = await instance.startSession("moka", referred.session.id, origin.session.referralToken);
    await instance.unlock(referred.session.id);
    await instance.initiateShare(referred.session.id, "instagram_story");

    expect(resumed.session.id).toBe(referred.session.id);
    expect(referred.session.referredBy).toBe(origin.session.referralToken);

    const channels = await sql<{ shareChannel: string | null }[]>`
      SELECT share_channel
      FROM analytics_events
      WHERE session_id = ${referred.session.id}
        AND name = 'share_initiated'
    `;
    expect(channels).toEqual([{ shareChannel: "instagram_story" }]);
  });

  it("aggregates merchant dashboard metrics without cross-merchant leakage", async () => {
    const instance = service();
    const origin = await instance.startSession("moka");
    await instance.unlock(origin.session.id);
    await instance.initiateShare(origin.session.id, "whatsapp_status");
    const reward = await instance.spin(origin.session.id);
    await instance.recordWhatsappSave(origin.session.id);
    await instance.redeemForMerchant("merchant_moka", reward.shortCode);

    const referred = await instance.startSession("moka", undefined, origin.session.referralToken);
    await instance.unlock(referred.session.id);
    await instance.initiateShare(referred.session.id, "instagram_story");

    const atlas = await instance.startSession("atlas-barber");
    await instance.unlock(atlas.session.id);
    await instance.initiateShare(atlas.session.id, "whatsapp");

    expect(await instance.getMerchantMetrics("merchant_moka")).toEqual({
      sessions: 2,
      referredSessions: 1,
      shares: 2,
      rewardsIssued: 1,
      rewardsRedeemed: 1,
      whatsappSaves: 1,
      shareChannels: {
        whatsapp: 0,
        whatsapp_status: 1,
        instagram_story: 1,
        native: 0,
        social: 0,
      },
    });

    const atlasMetrics = await instance.getMerchantMetrics("merchant_atlas");
    expect(atlasMetrics.sessions).toBe(1);
    expect(atlasMetrics.shares).toBe(1);
    expect(atlasMetrics.rewardsIssued).toBe(0);
    expect(atlasMetrics.shareChannels.whatsapp).toBe(1);
  });

  it("returns one reward when two spins race on the same session", async () => {
    const instance = service();
    const session = await sharedSession(instance);

    const [first, second] = await Promise.all([
      instance.spin(session.id),
      instance.spin(session.id),
    ]);

    expect(second.id).toBe(first.id);
    const [{ count }] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM rewards WHERE session_id = ${session.id}
    `;
    expect(count).toBe(1);
  });

  it("allows exactly one merchant-scoped redeem when two redeems race", async () => {
    const instance = service();
    const session = await sharedSession(instance);
    const reward = await instance.spin(session.id);

    const results = await Promise.allSettled([
      instance.redeemForMerchant("merchant_moka", reward.shortCode),
      instance.redeemForMerchant("merchant_moka", reward.shortCode),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

    const [{ count }] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM analytics_events
      WHERE reward_id = ${reward.id} AND name = 'reward_redeemed'
    `;
    expect(count).toBe(1);
  });

  it("does not reveal a reward to another merchant", async () => {
    const instance = service();
    const session = await sharedSession(instance);
    const reward = await instance.spin(session.id);
    await expect(instance.getRewardForMerchant("merchant_atlas", reward.shortCode)).rejects.toThrow(/not found/);
    await expect(instance.redeemForMerchant("merchant_atlas", reward.shortCode)).rejects.toThrow(/not found/);
  });

  it("deduplicates reward_viewed even under concurrent reads", async () => {
    const instance = service();
    const session = await sharedSession(instance);
    const reward = await instance.spin(session.id);

    await Promise.all([
      instance.getReward(reward.token, session.id),
      instance.getReward(reward.token, session.id),
      instance.getReward(reward.token, session.id),
    ]);

    const [{ count }] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM analytics_events
      WHERE session_id = ${session.id}
        AND reward_id = ${reward.id}
        AND name = 'reward_viewed'
    `;
    expect(count).toBe(1);
  });

  it("keeps server-side expiry behavior with durable rows", async () => {
    const instance = service();
    const session = await sharedSession(instance);
    const reward = await instance.spin(session.id);
    const expiredService = service(new Date("2026-09-09T12:00:00.000Z"));

    await expect(expiredService.redeemForMerchant("merchant_moka", reward.shortCode)).rejects.toThrow(/not available/);
  });
});

describe("PostgresRepository health failure", () => {
  it("returns false without exposing connection credentials", async () => {
    const repository = new PostgresRepository(
      "postgres://secret-user:secret-password@127.0.0.1:1/viralio",
      { maxConnections: 1, connectTimeoutSeconds: 1, idleTimeoutSeconds: 1 },
    );
    expect(await repository.healthCheck()).toBe(false);
    await repository.close();
  });
});
