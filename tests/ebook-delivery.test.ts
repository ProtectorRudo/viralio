import { beforeEach, describe, expect, it } from "vitest";
import {
  createAccessToken,
  isApprovedEbookPayment,
  verifyAccessToken,
  EBOOK_PRODUCT_REFERENCE,
  EBOOK_PRICE_ARS,
} from "@/ebook/server";

describe("ebook delivery security", () => {
  beforeEach(() => {
    process.env.VIRALIO_AUTH_SECRET = "ebook-test-secret-that-is-longer-than-thirty-two-characters";
  });

  it("accepts only the expected approved product and amount", () => {
    expect(isApprovedEbookPayment({
      id: "123",
      status: "approved",
      transaction_amount: EBOOK_PRICE_ARS,
      currency_id: "ARS",
      external_reference: EBOOK_PRODUCT_REFERENCE,
      payer: { email: "buyer@example.com" },
    })).toBe(true);

    expect(isApprovedEbookPayment({
      id: "124",
      status: "approved",
      transaction_amount: 1,
      currency_id: "ARS",
      external_reference: EBOOK_PRODUCT_REFERENCE,
    })).toBe(false);
  });

  it("signs and validates personal access tokens", () => {
    const token = createAccessToken("123", 3600);
    expect(verifyAccessToken(token)?.paymentId).toBe("123");
    expect(verifyAccessToken(token + "tampered")).toBeNull();
  });
});
