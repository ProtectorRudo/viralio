import { describe, expect, it } from "vitest";
import { isValidReferralToken } from "@/domain/tokens";

describe("referral tokens", () => {
  it("accepts opaque base64url tokens and rejects malformed values", () => {
    expect(isValidReferralToken("abcdefghijklmnopqrstuv")).toBe(true);
    expect(isValidReferralToken("12")).toBe(false);
    expect(isValidReferralToken("../../sequential-id-1")).toBe(false);
  });
});
