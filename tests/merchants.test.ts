import { describe, expect, it } from "vitest";
import { getMerchantById, getMerchantBySlug, merchants } from "@/config/merchants";
import { merchantThemeStyle } from "@/ui/merchant-theme";
import { SPIN_TURNS, winningRotation } from "@/ui/premium-wheel";
import type { Reward } from "@/domain/types";

describe("merchant theming", () => {
  it("configures independent brands for the same engine", () => {
    const moka = getMerchantBySlug("moka");
    const atlas = getMerchantBySlug("atlas-barber");
    const leo = getMerchantBySlug("el-gordo-leo");
    const volga = getMerchantBySlug("volga");
    expect(merchants).toHaveLength(4);
    expect(moka?.theme.category).toBe("coffee");
    expect(atlas?.theme.category).toBe("barber");
    expect(leo?.theme.category).toBe("generic");
    expect(leo?.name).toBe("Mini Mercado El Gordo Leo");
    expect(leo?.whatsappNumber).toBe("5492236818230");
    expect(leo?.rewardValidityDays).toBe(7);
    expect(volga?.name).toBe("Volga");
    expect(volga?.whatsappNumber).toBe("5493544568000");
    expect(volga?.rewardValidityDays).toBe(30);
    expect(volga?.theme.businessType).toBe("Almacén");
    expect(volga?.prizes.map(({ id, probability }) => ({ id, probability }))).toEqual([
      { id: "nuts_20", probability: 34 },
      { id: "deli_10", probability: 33 },
      { id: "beer_10", probability: 33 },
    ]);
    expect(leo?.prizes.map(({ id, probability }) => ({ id, probability }))).toEqual([
      { id: "discount_5", probability: 35 },
      { id: "discount_10", probability: 25 },
      { id: "discount_15", probability: 10 },
      { id: "cassata", probability: 15 },
      { id: "bombon", probability: 15 },
    ]);
    expect(moka?.theme.palette.primary).not.toBe(atlas?.theme.palette.primary);
    expect(leo?.theme.palette.primary).not.toBe(moka?.theme.palette.primary);
    expect(moka?.theme.socialHeadline).toMatch(/Moka/);
    expect(atlas?.theme.socialHeadline).toMatch(/Atlas/);
    expect(leo?.theme.socialHeadline).toMatch(/Gordo Leo/);
    expect(getMerchantById("merchant_atlas")).toBe(atlas);
    expect(getMerchantById("merchant_el_gordo_leo")).toBe(leo);
    expect(getMerchantById("merchant_volga")).toBe(volga);
  });

  it("exposes only validated color tokens as CSS variables", () => {
    const moka = getMerchantBySlug("moka");
    if (!moka) throw new Error("Moka fixture missing");
    expect(merchantThemeStyle(moka)["--color-primary"]).toBe("#8F4327");
    const unsafe = { ...moka, theme: { ...moka.theme, palette: { ...moka.theme.palette, primary: "red;display:none" } } };
    expect(merchantThemeStyle(unsafe)["--color-primary"]).toBe("#000000");
  });

  it("maps every server-selected prize to a distinct angle after nine full turns", () => {
    const merchant = getMerchantBySlug("moka");
    if (!merchant) throw new Error("Moka fixture missing");
    expect(SPIN_TURNS).toBeGreaterThanOrEqual(8);
    expect(SPIN_TURNS).toBeLessThanOrEqual(10);
    const angles = merchant.prizes.map((prize) => winningRotation(merchant, {
      id: "reward", token: "token", shortCode: "CODE", merchantId: merchant.id,
      sessionId: "session", prizeId: prize.id, prizeName: prize.name,
      issuedAt: "2026-09-02T00:00:00.000Z", expiresAt: "2026-09-09T00:00:00.000Z",
    } satisfies Reward));
    expect(new Set(angles).size).toBe(merchant.prizes.length);
    expect(angles.every((angle) => angle > ((SPIN_TURNS - 1) * 360) && angle < (SPIN_TURNS * 360))).toBe(true);
  });
});
