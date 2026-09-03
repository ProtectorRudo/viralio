import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  healthCheck: vi.fn(async () => true),
  transaction: vi.fn(),
}));

vi.mock("@/persistence", () => ({
  repository: {
    kind: "postgres" as const,
    healthCheck: mocks.healthCheck,
    transaction: mocks.transaction,
  },
}));

import { POST } from "@/app/api/onboarding/readiness/route";

const onboardingKey = "pilot-onboarding-key-with-24-characters";

function request(body: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/onboarding/readiness", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Host: "localhost",
      "Sec-Fetch-Site": "same-origin",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/onboarding/readiness", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VIRALIO_ONBOARDING_KEY", onboardingKey);
    vi.stubEnv("VIRALIO_AUTH_SECRET", "pilot-auth-secret-with-more-than-32-characters");
    vi.stubEnv("OPENAI_API_KEY", "sk-pilot-key-long-enough-for-readiness-check");
    vi.stubEnv("OPENAI_BRAND_MODEL", "gpt-5.6-terra");
    mocks.healthCheck.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects cross-origin requests before checking configuration", async () => {
    const response = await POST(request({ onboardingKey }, "https://evil.example"));
    expect(response.status).toBe(403);
    expect(mocks.healthCheck).not.toHaveBeenCalled();
  });

  it("rejects an invalid onboarding key", async () => {
    const response = await POST(request({ onboardingKey: "wrong-key" }));
    expect(response.status).toBe(401);
    expect(mocks.healthCheck).not.toHaveBeenCalled();
  });

  it("returns only non-secret readiness metadata for an authorized operator", async () => {
    const response = await POST(request({ onboardingKey }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const payload = await response.json();
    expect(payload).toMatchObject({
      repository: "postgres",
      database: true,
      auth: true,
      onboarding: true,
      brandAi: true,
      brandModel: "gpt-5.6-terra",
      pilotReady: true,
    });
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(onboardingKey);
    expect(serialized).not.toContain("sk-pilot");
    expect(serialized).not.toContain("DATABASE_URL");
  });

  it("fails readiness rather than failing the endpoint when Brand AI is not configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await POST(request({ onboardingKey }));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.brandAi).toBe(false);
    expect(payload.pilotReady).toBe(false);
  });
});
