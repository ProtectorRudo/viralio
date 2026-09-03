import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ViralioService } from "@/application/viralio-service";
import { PostgresRepository } from "@/persistence/postgres-repository";

const databaseUrl = process.env.DATABASE_URL;
const postgresDescribe = databaseUrl ? describe : describe.skip;
const authEnvironment = {
  NODE_ENV: "test",
  VIRALIO_AUTH_SECRET: "universal-postgres-auth-secret-with-at-least-32-characters",
} as NodeJS.ProcessEnv;

postgresDescribe("universal business type PostgreSQL integration", () => {
  if (!databaseUrl) return;

  const sql = postgres(databaseUrl, { max: 2, transform: postgres.camel });
  const repository = new PostgresRepository(databaseUrl, { maxConnections: 3 });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE merchant_settings, merchant_accounts, analytics_events, rewards, sessions CASCADE`;
  });

  afterAll(async () => {
    await repository.close();
    await sql.end({ timeout: 5 });
  });

  it("stores the real category in merchant_accounts and restores it", async () => {
    const service = new ViralioService(repository, () => 0.5, () => new Date("2026-09-03T12:00:00.000Z"));
    const merchant = await service.createMerchant({
      name: "Lumen Joyas",
      slug: "lumen-pg",
      businessType: "Joyería",
      whatsappNumber: "5492215550000",
      pin: "482619",
    }, authEnvironment);

    const rows = await sql<Array<{ template: string; businessType: string }>>`
      SELECT template, business_type
      FROM merchant_accounts
      WHERE merchant_id = ${merchant.id}
    `;
    expect(rows).toEqual([{ template: "generic", businessType: "Joyería" }]);

    const restored = await service.getMerchantForExperience("lumen-pg");
    expect(restored.theme.category).toBe("generic");
    expect(restored.theme.businessType).toBe("Joyería");
    expect(restored.theme.tone).toBe("Joyería");
  });
});
