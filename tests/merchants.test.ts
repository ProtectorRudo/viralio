import { describe, expect, it } from "vitest";
import { getMerchantById, getMerchantBySlug, merchants } from "@/config/merchants";
import { merchantThemeStyle } from "@/ui/merchant-theme";
import { winningRotation } from "@/ui/premium-wheel";
import type { Reward } from "@/domain/types";

describe("merchant theming", () => {
  it("configures two independent brands for the same engine", () => {
    const moka = getMerchantBySlug("moka");
    const atlas = getMerchantBySlug("atlas-barber");
    expect(merchants).toHaveLength(2);
    expect(moka?.theme.category).toBe("coffee");
    expect(atlas?.theme.category).toBe("barber");
    expect(moka?.theme.palette.primary).not.toBe(atlas?.theme.palette.primary);
    expect(getMerchantById("merchant_atlas")).toBe(atlas);
  });

  it("exposes only validated color tokens as CSS variables", () => {
    const moka = getMerchantBySlug("moka");
    if (!moka) throw new Error("Moka fixture missing");
    expect(merchantThemeStyle(moka)["--color-primary"]).toBe("#A84F2A");
    const unsafe = { ...moka, theme: { ...moka.theme, palette: { ...moka.theme.palette, primary: "red;display:none" } } };
    expect(merchantThemeStyle(unsafe)["--color-primary"]).toBe("#000000");
  });

  it("maps every server-selected prize to a distinct winning angle", () => {
    const merchant = getMerchantBySlug("moka");
    if (!merchant) throw new Error("Moka fixture missing");
    const angles = merchant.prizes.map((prize) => winningRotation(merchant, {
      id: "reward", token: "token", shortCode: "CODE", merchantId: merchant.id,
      sessionId: "session", prizeId: prize.id, prizeName: prize.name,
      issuedAt: "2026-09-02T00:00:00.000Z", expiresAt: "2026-09-09T00:00:00.000Z",
    } satisfies Reward));
    expect(new Set(angles).size).toBe(merchant.prizes.length);
    expect(angles.every((angle) => angle > 1440 && angle < 1800)).toBe(true);
  });
});
