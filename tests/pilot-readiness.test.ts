import { describe, expect, it } from "vitest";
import { evaluatePilotReadiness } from "@/application/pilot-readiness";
import type { Repository } from "@/persistence/repository";

function repository(kind: Repository["kind"], healthy: boolean): Repository {
  return {
    kind,
    healthCheck: async () => healthy,
    transaction: async () => {
      throw new Error("transaction should not be used by readiness");
    },
  };
}

const completeEnvironment = {
  NODE_ENV: "production",
  VIRALIO_AUTH_SECRET: "pilot-auth-secret-with-more-than-32-characters",
  OPENAI_API_KEY: "sk-pilot-key-long-enough-for-readiness-check",
  OPENAI_BRAND_MODEL: "gpt-5.6-terra",
} as NodeJS.ProcessEnv;

describe("pilot readiness", () => {
  it("marks a healthy production stack ready without making application transactions", async () => {
    const result = await evaluatePilotReadiness(repository("postgres", true), completeEnvironment, true);
    expect(result).toEqual({
      repository: "postgres",
      database: true,
      auth: true,
      onboarding: true,
      brandAi: true,
      brandModel: "gpt-5.6-terra",
      pilotReady: true,
    });
  });

  it("fails readiness when PostgreSQL is unhealthy or persistence is not postgres", async () => {
    expect((await evaluatePilotReadiness(repository("postgres", false), completeEnvironment, true)).pilotReady).toBe(false);
    const jsonResult = await evaluatePilotReadiness(repository("json", true), completeEnvironment, true);
    expect(jsonResult.database).toBe(false);
    expect(jsonResult.pilotReady).toBe(false);
  });

  it("reports Brand AI unavailable when the key is missing without exposing a secret", async () => {
    const result = await evaluatePilotReadiness(repository("postgres", true), {
      ...completeEnvironment,
      OPENAI_API_KEY: undefined,
    }, true);
    expect(result.brandAi).toBe(false);
    expect(result.brandModel).toBe("gpt-5.6-terra");
    expect(result.pilotReady).toBe(false);
    expect(JSON.stringify(result)).not.toContain("sk-");
  });

  it("fails closed for weak auth, invalid model or missing onboarding authorization", async () => {
    expect((await evaluatePilotReadiness(repository("postgres", true), {
      ...completeEnvironment,
      VIRALIO_AUTH_SECRET: "short",
    }, true)).auth).toBe(false);
    expect((await evaluatePilotReadiness(repository("postgres", true), {
      ...completeEnvironment,
      OPENAI_BRAND_MODEL: "bad model value",
    }, true)).brandAi).toBe(false);
    expect((await evaluatePilotReadiness(repository("postgres", true), completeEnvironment, false)).pilotReady).toBe(false);
  });
});
