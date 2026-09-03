import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ViralioService } from "@/application/viralio-service";
import { buildMerchantBrandProfile } from "@/brand/brand-engine";
import { PostgresRepository } from "@/persistence/postgres-repository";

const databaseUrl = process.env.DATABASE_URL;
const postgresDescribe = databaseUrl ? describe : describe.skip;
const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl1ZQAAAABJRU5ErkJggg==";
const authEnvironment = {
  NODE_ENV: "test",
  VIRALIO_AUTH_SECRET: "brand-postgres-auth-secret-with-at-least-32-characters",
} as NodeJS.ProcessEnv;

postgresDescribe("Brand Profile PostgreSQL integration", () => {
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

  it("persists and restores approved ChatGPT branding with the merchant", async () => {
    const service = new ViralioService(repository, () => 0.9, () => new Date("2026-09-03T12:00:00.000Z"));
    const brand = buildMerchantBrandProfile({
      source: "openai",
      logoDataUrl: tinyPng,
      stylePreset: "luxury",
      fontPreset: "editorial",
      tone: "sofisticado, cálido y cercano",
      keywords: ["premium", "artesanal", "barrio"],
      colors: {
        primary: "#653D2C",
        secondary: "#365E50",
        accent: "#C78555",
        background: "#F6F0E7",
        surface: "#FFFDF8",
        text: "#241B17",
      },
      ai: { model: "gpt-5.6-terra", generatedAt: "2026-09-03T12:00:00.000Z" },
    });

    const created = await service.createMerchant({
      name: "Bruma Café",
      slug: "bruma-brand",
      template: "coffee",
      whatsappNumber: "5492215550000",
      pin: "482619",
      brand,
      brandCopy: {
        heroTitle: "Tu visita guarda una sorpresa",
        socialHeadline: "Bruma dejó algo esperando por vos",
      },
    }, authEnvironment);

    const restored = await service.getMerchantForExperience("bruma-brand");
    expect(restored.id).toBe(created.id);
    expect(restored.theme.logoDataUrl).toBe(tinyPng);
    expect(restored.theme.palette.primary).toBe("#653D2C");
    expect(restored.theme.stylePreset).toBe("luxury");
    expect(restored.theme.heroTitle).toBe("Tu visita guarda una sorpresa");
    expect(restored.theme.socialHeadline).toContain("Bruma");

    const rows = await sql<Array<{ source: string | null; model: string | null }>>`
      SELECT
        settings->'brand'->>'source' AS source,
        settings->'brand'->'ai'->>'model' AS model
      FROM merchant_settings
      WHERE merchant_id = ${created.id}
    `;
    expect(rows[0]?.source).toBe("openai");
    expect(rows[0]?.model).toBe("gpt-5.6-terra");
  });
});
