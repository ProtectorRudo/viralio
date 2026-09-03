import { describe, expect, it } from "vitest";
import { validateProductionEnvironment } from "../scripts/production-preflight.mjs";

const validEnvironment = {
  VIRALIO_PERSISTENCE: "postgres",
  DATABASE_URL: "postgresql://viralio:secret@db.example.com:5432/viralio?sslmode=require",
  NEXT_PUBLIC_APP_URL: "https://app.viralio.example",
  VIRALIO_AUTH_SECRET: "auth-secret-that-is-long-random-and-production-safe-123",
  VIRALIO_ONBOARDING_KEY: "different-onboarding-key-long-enough-456",
  VIRALIO_MERCHANT_PINS: JSON.stringify({ moka: "246810", "atlas-barber": "135790" }),
};

function failedNames(environment) {
  return validateProductionEnvironment(environment)
    .filter((check) => !check.ok)
    .map((check) => check.name);
}

describe("production preflight environment", () => {
  it("accepts a production-shaped configuration", () => {
    expect(failedNames(validEnvironment)).toEqual([]);
  });

  it("rejects local or insecure public URLs", () => {
    expect(failedNames({ ...validEnvironment, NEXT_PUBLIC_APP_URL: "http://localhost:3000" }))
      .toContain("public app URL is HTTPS and non-local");
    expect(failedNames({ ...validEnvironment, NEXT_PUBLIC_APP_URL: "http://viralio.example" }))
      .toContain("public app URL is HTTPS and non-local");
  });

  it("rejects weak, placeholder or reused secrets", () => {
    expect(failedNames({ ...validEnvironment, VIRALIO_AUTH_SECRET: "short" }))
      .toContain("auth secret is strong");
    expect(failedNames({ ...validEnvironment, VIRALIO_ONBOARDING_KEY: "replace-with-onboarding-secret-long-enough" }))
      .toContain("onboarding key is strong");
    expect(failedNames({
      ...validEnvironment,
      VIRALIO_ONBOARDING_KEY: validEnvironment.VIRALIO_AUTH_SECRET,
    })).toContain("auth and onboarding secrets are distinct");
  });

  it("allows no legacy PIN JSON but rejects malformed configured PINs", () => {
    expect(failedNames({ ...validEnvironment, VIRALIO_MERCHANT_PINS: "" })).toEqual([]);
    expect(failedNames({ ...validEnvironment, VIRALIO_MERCHANT_PINS: "not-json" }))
      .toContain("legacy merchant PIN JSON is valid when configured");
    expect(failedNames({ ...validEnvironment, VIRALIO_MERCHANT_PINS: JSON.stringify({ moka: "abc" }) }))
      .toContain("legacy merchant PIN JSON is valid when configured");
  });

  it("rejects non-PostgreSQL persistence and malformed database URLs", () => {
    expect(failedNames({ ...validEnvironment, VIRALIO_PERSISTENCE: "json" }))
      .toContain("persistence is postgres");
    expect(failedNames({ ...validEnvironment, DATABASE_URL: "https://db.example.com" }))
      .toContain("DATABASE_URL is a PostgreSQL URL");
  });
});
