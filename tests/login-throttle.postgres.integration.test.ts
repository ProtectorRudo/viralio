import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  MERCHANT_LOGIN_BLOCK_SECONDS,
  MERCHANT_LOGIN_MAX_FAILURES,
  checkMerchantLoginThrottle,
  clearMerchantLoginThrottle,
  closeMerchantLoginThrottleStore,
  merchantLoginThrottleKey,
  recordMerchantLoginFailure,
} from "@/security/login-throttle";

const databaseUrl = process.env.DATABASE_URL;
const environment: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "test",
  VIRALIO_PERSISTENCE: "postgres",
  DATABASE_URL: databaseUrl,
  VIRALIO_AUTH_SECRET: "postgres-throttle-test-secret-with-more-than-thirty-two-characters",
};

const sql = databaseUrl
  ? postgres(databaseUrl, {
      max: 2,
      transform: postgres.camel,
      onnotice: () => undefined,
    })
  : undefined;

function database() {
  if (!sql) throw new Error("DATABASE_URL is required for PostgreSQL integration tests");
  return sql;
}

const describePostgres = databaseUrl ? describe : describe.skip;

describePostgres("merchant login throttle on PostgreSQL", () => {
  beforeEach(async () => {
    await database()`DELETE FROM merchant_login_throttles`;
    await closeMerchantLoginThrottleStore();
  });

  afterAll(async () => {
    await closeMerchantLoginThrottleStore();
    await sql?.end({ timeout: 5 });
  });

  it("persists the opaque fingerprint and blocks after concurrent failures", async () => {
    const request = new Request("https://viralio.example/api/merchant/auth", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.44" },
    });
    const key = merchantLoginThrottleKey(request, "moka", environment);
    const now = Date.parse("2026-09-03T02:00:00.000Z");

    const decisions = await Promise.all(
      Array.from({ length: MERCHANT_LOGIN_MAX_FAILURES }, () =>
        recordMerchantLoginFailure(key, now, environment),
      ),
    );

    expect(decisions.some((decision) => decision.blocked)).toBe(true);
    expect((await checkMerchantLoginThrottle(key, now, environment)).blocked).toBe(true);

    const rows = await database()<Array<{ throttleKey: string; failureCount: number; blockedUntil: Date | null }>>`
      SELECT throttle_key, failure_count, blocked_until
      FROM merchant_login_throttles
      WHERE throttle_key = ${key}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0].throttleKey).toBe(key);
    expect(rows[0].throttleKey).not.toContain("203.0.113.44");
    expect(rows[0].failureCount).toBe(MERCHANT_LOGIN_MAX_FAILURES);
    expect(rows[0].blockedUntil).not.toBeNull();
  });

  it("keeps merchants isolated and allows a clean state after successful authentication", async () => {
    const request = new Request("https://viralio.example/api/merchant/auth", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.45" },
    });
    const mokaKey = merchantLoginThrottleKey(request, "moka", environment);
    const atlasKey = merchantLoginThrottleKey(request, "atlas-barber", environment);
    const now = Date.parse("2026-09-03T02:00:00.000Z");

    await recordMerchantLoginFailure(mokaKey, now, environment);
    expect((await checkMerchantLoginThrottle(mokaKey, now, environment)).blocked).toBe(false);
    expect((await checkMerchantLoginThrottle(atlasKey, now, environment)).blocked).toBe(false);

    await clearMerchantLoginThrottle(mokaKey, environment);
    const count = await database()<{ count: number }[]>`
      SELECT count(*)::int AS count FROM merchant_login_throttles WHERE throttle_key = ${mokaKey}
    `;
    expect(count[0]?.count).toBe(0);
  });

  it("expires a block without requiring a cleanup job", async () => {
    const key = "a".repeat(64);
    const start = Date.parse("2026-09-03T02:00:00.000Z");
    for (let attempt = 0; attempt < MERCHANT_LOGIN_MAX_FAILURES; attempt += 1) {
      await recordMerchantLoginFailure(key, start, environment);
    }
    expect((await checkMerchantLoginThrottle(key, start, environment)).blocked).toBe(true);

    const afterBlock = start + MERCHANT_LOGIN_BLOCK_SECONDS * 1000 + 1;
    expect((await checkMerchantLoginThrottle(key, afterBlock, environment)).blocked).toBe(false);
    await recordMerchantLoginFailure(key, afterBlock, environment);

    const rows = await database()<{ failureCount: number; blockedUntil: Date | null }[]>`
      SELECT failure_count, blocked_until FROM merchant_login_throttles WHERE throttle_key = ${key}
    `;
    expect(rows[0]?.failureCount).toBe(1);
    expect(rows[0]?.blockedUntil).toBeNull();
  });
});
