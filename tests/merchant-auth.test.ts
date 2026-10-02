import { describe, expect, it } from "vitest";
import {
  MERCHANT_SESSION_SECONDS,
  OPERATOR_SESSION_COOKIE,
  OPERATOR_SESSION_SECONDS,
  createMerchantSessionToken,
  createOperatorSessionToken,
  isSameOrigin,
  operatorSessionFromRequest,
  verifyMerchantPin,
  verifyMerchantSessionToken,
  verifyOperatorSessionToken,
} from "@/security/merchant-auth";

const environment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  VIRALIO_AUTH_SECRET: "test-secret-with-more-than-thirty-two-characters",
  VIRALIO_MERCHANT_PINS: JSON.stringify({ moka: "246810", "atlas-barber": "135790" }),
};

describe("merchant authentication", () => {
  it("accepts only the PIN configured for an existing merchant", () => {
    expect(verifyMerchantPin("moka", "246810", environment)).toBe("merchant_moka");
    expect(verifyMerchantPin("moka", "000000", environment)).toBeUndefined();
    expect(verifyMerchantPin("missing", "246810", environment)).toBeUndefined();
  });

  it("signs merchant sessions and rejects tampering and expiry", () => {
    const now = Date.parse("2026-09-02T12:00:00.000Z");
    const token = createMerchantSessionToken("merchant_moka", now, environment);
    expect(verifyMerchantSessionToken(token, now + 1_000, environment)?.merchantId).toBe("merchant_moka");

    const [payload, signature] = token.split(".");
    expect(verifyMerchantSessionToken(`${payload}x.${signature}`, now + 1_000, environment)).toBeUndefined();
    expect(verifyMerchantSessionToken(token, now + MERCHANT_SESSION_SECONDS * 1000, environment)).toBeUndefined();
  });

  it("keeps operator sessions signed, scoped and separate from merchant sessions", () => {
    const now = Date.parse("2026-09-17T12:00:00.000Z");
    const token = createOperatorSessionToken(now, environment);
    expect(verifyOperatorSessionToken(token, now + 1_000, environment)?.role).toBe("operator");
    expect(verifyMerchantSessionToken(token, now + 1_000, environment)).toBeUndefined();
    expect(verifyOperatorSessionToken(token, now + OPERATOR_SESSION_SECONDS * 1000, environment)).toBeUndefined();

    const request = new Request("https://viralio.example/operador", {
      headers: { cookie: `${OPERATOR_SESSION_COOKIE}=${encodeURIComponent(token)}` },
    });
    expect(operatorSessionFromRequest(request, environment)?.role).toBe("operator");
  });

  it("requires a strong auth secret in production", () => {
    expect(() => createMerchantSessionToken("merchant_moka", Date.now(), {
      ...environment,
      NODE_ENV: "production",
      VIRALIO_AUTH_SECRET: "short",
    })).toThrow(/not configured/);
  });

  it("accepts writes only from the public application origin", () => {
    expect(isSameOrigin(new Request("http://internal:3000/api/merchant/auth", {
      method: "POST",
      headers: {
        origin: "https://viralio.example",
        host: "viralio.example",
        "x-forwarded-proto": "https",
        "sec-fetch-site": "same-origin",
      },
    }))).toBe(true);

    expect(isSameOrigin(new Request("https://viralio.example/api/merchant/auth", {
      method: "POST",
      headers: { origin: "https://evil.example", host: "viralio.example" },
    }))).toBe(false);

    expect(isSameOrigin(new Request("https://viralio.example/api/merchant/auth", {
      method: "POST",
      headers: {
        origin: "https://viralio.example",
        host: "viralio.example",
        "sec-fetch-site": "cross-site",
      },
    }))).toBe(false);
  });
});
