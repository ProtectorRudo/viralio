import { describe, expect, it } from "vitest";
import {
  MERCHANT_LOGIN_BLOCK_SECONDS,
  MERCHANT_LOGIN_MAX_FAILURES,
  MERCHANT_LOGIN_WINDOW_SECONDS,
  loginThrottleDecision,
  merchantLoginThrottleKey,
  nextLoginThrottleState,
} from "@/security/login-throttle";

const environment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  VIRALIO_AUTH_SECRET: "test-secret-with-more-than-thirty-two-characters",
};

function request(ip: string) {
  return new Request("https://viralio.example/api/merchant/auth", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("merchant login throttle", () => {
  it("derives an opaque key per merchant and client without retaining the raw IP", () => {
    const left = merchantLoginThrottleKey(request("203.0.113.10"), "moka", environment);
    const same = merchantLoginThrottleKey(request("203.0.113.10"), "MOKA", environment);
    const otherIp = merchantLoginThrottleKey(request("203.0.113.11"), "moka", environment);
    const otherMerchant = merchantLoginThrottleKey(request("203.0.113.10"), "atlas-barber", environment);

    expect(left).toMatch(/^[a-f0-9]{64}$/);
    expect(left).toBe(same);
    expect(left).not.toContain("203.0.113.10");
    expect(otherIp).not.toBe(left);
    expect(otherMerchant).not.toBe(left);
  });

  it("blocks on the configured failure threshold and returns Retry-After", () => {
    const start = Date.parse("2026-09-03T01:00:00.000Z");
    let state = undefined;
    for (let attempt = 1; attempt <= MERCHANT_LOGIN_MAX_FAILURES; attempt += 1) {
      state = nextLoginThrottleState(state, "opaque-key", start + attempt * 1000);
    }

    const decision = loginThrottleDecision(state, start + MERCHANT_LOGIN_MAX_FAILURES * 1000);
    expect(state.failureCount).toBe(MERCHANT_LOGIN_MAX_FAILURES);
    expect(decision.blocked).toBe(true);
    expect(decision.retryAfterSeconds).toBe(MERCHANT_LOGIN_BLOCK_SECONDS);
  });

  it("allows a clean new window after the block expires", () => {
    const start = Date.parse("2026-09-03T01:00:00.000Z");
    let state = undefined;
    for (let attempt = 1; attempt <= MERCHANT_LOGIN_MAX_FAILURES; attempt += 1) {
      state = nextLoginThrottleState(state, "opaque-key", start);
    }
    const afterBlock = start + MERCHANT_LOGIN_BLOCK_SECONDS * 1000 + 1;
    expect(loginThrottleDecision(state, afterBlock).blocked).toBe(false);

    const reset = nextLoginThrottleState(state, "opaque-key", afterBlock);
    expect(reset.failureCount).toBe(1);
    expect(reset.blockedUntil).toBeUndefined();
    expect(reset.windowStartedAt).toBe(new Date(afterBlock).toISOString());
  });

  it("resets stale failures after the normal attempt window", () => {
    const start = Date.parse("2026-09-03T01:00:00.000Z");
    const first = nextLoginThrottleState(undefined, "opaque-key", start);
    const afterWindow = start + MERCHANT_LOGIN_WINDOW_SECONDS * 1000 + 1;
    const reset = nextLoginThrottleState(first, "opaque-key", afterWindow);
    expect(reset.failureCount).toBe(1);
    expect(reset.windowStartedAt).toBe(new Date(afterWindow).toISOString());
  });
});
