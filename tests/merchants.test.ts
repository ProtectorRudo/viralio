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
    const saimond = getMerchantBySlug("saimond");
    const carnesRoma = getMerchantBySlug("carnes-roma");
    const lindy = getMerchantBySlug("centro-estetica-lindy");
    const elvira = getMerchantBySlug("despensa-elvira");
    const losChiquis = getMerchantBySlug("los-chiquis");
    const fusion = getMerchantBySlug("fusion-de-sabores");
    expect(merchants).toHaveLength(10);
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
    expect(saimond?.name).toBe("Saimond");
    expect(saimond?.whatsappNumber).toBe("5492645845990");
    expect(saimond?.rewardValidityDays).toBe(30);
    expect(saimond?.theme.businessType).toBe("Petshop");
    expect(saimond?.prizes).toEqual([
      { id: "discount_10", name: "10% de descuento en tu próxima compra", probability: 100 },
    ]);
    expect(carnesRoma?.name).toBe("Carnes Roma");
    expect(carnesRoma?.whatsappNumber).toBe("5493804478760");
    expect(carnesRoma?.rewardValidityDays).toBe(30);
    expect(carnesRoma?.theme.businessType).toBe("Carnicería");
    expect(carnesRoma?.prizes).toEqual([
      { id: "discount_10", name: "10% de descuento en tu próxima compra", probability: 100 },
    ]);
    expect(lindy?.name).toBe("Centro Estética Lindy");
    expect(lindy?.whatsappNumber).toBe("5493813874434");
    expect(lindy?.rewardValidityDays).toBe(30);
    expect(lindy?.theme.businessType).toBe("Estética");
    expect(lindy?.prizes).toEqual([
      { id: "discount_15", name: "15% de descuento en la próxima sesión", probability: 50 },
      { id: "feet_massage_2x1", name: "2 x 1 en masajes de pies", probability: 50 },
    ]);
    expect(elvira?.name).toBe("Despensa Elvira");
    expect(elvira?.whatsappNumber).toBe("5491138199795");
    expect(elvira?.rewardValidityDays).toBe(30);
    expect(elvira?.theme.businessType).toBe("Almacén / Despensa");
    expect(elvira?.prizes).toEqual([
      { id: "discount_10", name: "10% de descuento en la próxima compra", probability: 100 },
    ]);
    expect(losChiquis?.name).toBe("Los chiquis");
    expect(losChiquis?.whatsappNumber).toBe("5491131568065");
    expect(losChiquis?.rewardValidityDays).toBe(30);
    expect(losChiquis?.theme.businessType).toBe("Peluquería Canina");
    expect(losChiquis?.theme.heroEyebrow).toBe("Peluquería canina");
    expect(losChiquis?.prizes).toEqual([
      { id: "discount_10", name: "10% de descuento en tu próxima sesión", probability: 100 },
    ]);
    expect(fusion?.name).toBe("Fusión de sabores");
    expect(fusion?.whatsappNumber).toBe("5493437520637");
    expect(fusion?.rewardValidityDays).toBe(14);
    expect(fusion?.theme.businessType).toBe("Heladería y panadería");
    expect(fusion?.theme.heroEyebrow).toBe("Heladería & panadería");
    expect(fusion?.prizes).toEqual([
      { id: "discount_10", name: "10% de descuento en tu próxima compra", probability: 100 },
    ]);
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
    expect(getMerchantById("merchant_saimond")).toBe(saimond);
    expect(getMerchantById("merchant_carnes_roma")).toBe(carnesRoma);
    expect(getMerchantById("merchant_centro_estetica_lindy")).toBe(lindy);
    expect(getMerchantById("merchant_despensa_elvira")).toBe(elvira);
    expect(getMerchantById("merchant_los_chiquis")).toBe(losChiquis);
    expect(getMerchantById("merchant_fusion_de_sabores")).toBe(fusion);
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
