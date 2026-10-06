import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  mercadoPagoBridgeStatus,
  mercadoPagoIdempotencyKey,
  moneyMinor,
  verifyMercadoPagoWebhookSignature,
} from "../src/lib/tehiceesto-payments";

describe("Te Hice Esto Mercado Pago integration", () => {
  it("maps accredited orders to approved and refunds to reversed flow", () => {
    expect(mercadoPagoBridgeStatus("processed", "accredited")).toBe("approved");
    expect(mercadoPagoBridgeStatus("refunded", "refunded")).toBe("refunded");
    expect(mercadoPagoBridgeStatus("failed", "cc_rejected")).toBe("rejected");
    expect(mercadoPagoBridgeStatus("created", "created")).toBe("pending");
  });

  it("builds a deterministic UUID idempotency key per local payment token", () => {
    const key = mercadoPagoIdempotencyKey("0123456789abcdef0123456789abcdef0123456789abcdef");
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(key).toBe(
      mercadoPagoIdempotencyKey("0123456789abcdef0123456789abcdef0123456789abcdef"),
    );
  });

  it("converts Mercado Pago decimal amounts to minor units", () => {
    expect(moneyMinor("25000.00")).toBe(2_500_000);
  });

  it("validates Mercado Pago order webhook signatures using lowercase data.id", () => {
    const secret = "whsec_test";
    const dataId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";
    const requestId = "2066ca19-c6f1-498a-be75-1923005edd06";
    const ts = "1742505638683";
    const manifest =
      `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      verifyMercadoPagoWebhookSignature({
        secret,
        dataId,
        requestId,
        signature: `ts=${ts},v1=${v1}`,
      }),
    ).toBe(true);
  });
});
