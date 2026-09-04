import { describe, expect, it } from "vitest";
import { getMerchantBySlug } from "@/config/merchants";
import { merchantThemeStyle } from "@/ui/merchant-theme";
import { brandRenderArtDirection, brandRenderDataAttributes, brandRenderVariables } from "@/ui/brand-render-contract";

describe("Brand Engine 2.0 renderer contract", () => {
  it("maps legacy themes deterministically without AI text becoming renderer instructions", () => {
    const merchant = structuredClone(getMerchantBySlug("moka")!);
    merchant.theme.stylePreset = "warm";
    merchant.theme.artDirection = undefined;

    expect(brandRenderArtDirection(merchant.theme)).toMatchObject({
      family: "warm-crafted",
      layoutMood: "centered-hero",
      shapeLanguage: "organic",
      shareComposition: "product-card",
    });
    expect(brandRenderDataAttributes(merchant.theme)).toMatchObject({
      "data-brand-family": "warm-crafted",
      "data-layout-mood": "centered-hero",
    });
  });

  it("turns every approved preset into finite CSS variables", () => {
    const merchant = structuredClone(getMerchantBySlug("moka")!);
    merchant.theme.artDirection = {
      family: "editorial-luxury",
      visualMood: "minimal-luxury",
      layoutMood: "asymmetrical-editorial",
      shapeLanguage: "soft",
      surfaceLanguage: "material-metallic-subtle",
      motionMood: "elegant",
      rewardObjectStyle: "voucher",
      shareComposition: "editorial-poster",
    };

    const variables = brandRenderVariables(merchant.theme);
    expect(variables).toMatchObject({
      "--brand-layout-columns": "minmax(0,1.18fr) minmax(7.5rem,.82fr)",
      "--brand-layout-copy-align": "left",
      "--brand-shape-radius": ".9rem",
      "--brand-motion-duration": "560ms",
      "--brand-reward-aspect": "1.45 / 1",
      "--brand-share-aspect": "9 / 16",
    });
    expect(Object.keys(variables).every((key) => key.startsWith("--brand-"))).toBe(true);
  });

  it("exposes render variables through the existing merchant theme style without changing the API", () => {
    const merchant = structuredClone(getMerchantBySlug("atlas-barber")!);
    merchant.theme.artDirection = {
      family: "bold-contemporary",
      visualMood: "bold-modern",
      layoutMood: "immersive-full-bleed",
      shapeLanguage: "geometric",
      surfaceLanguage: "flat",
      motionMood: "energetic",
      rewardObjectStyle: "token",
      shareComposition: "branded-announcement",
    };

    const style = merchantThemeStyle(merchant);
    expect(style["--brand-family-density"]).toBe("1.04");
    expect(style["--brand-layout-media-scale"]).toBe("1.12");
    expect(style["--brand-motion-duration"]).toBe("280ms");
    expect(style["--brand-reward-radius"]).toBe(".55rem");
  });

  it("produces materially different composition tokens for all four families", () => {
    const merchant = structuredClone(getMerchantBySlug("moka")!);
    const presets = [
      { style: "luxury" as const, family: "editorial-luxury" },
      { style: "warm" as const, family: "warm-crafted" },
      { style: "urban" as const, family: "bold-contemporary" },
      { style: "minimal" as const, family: "minimal-professional" },
    ];

    const fingerprints = presets.map(({ style, family }) => {
      merchant.theme.stylePreset = style;
      merchant.theme.artDirection = undefined;
      const direction = brandRenderArtDirection(merchant.theme);
      expect(direction.family).toBe(family);
      const vars = brandRenderVariables(merchant.theme);
      return [
        vars["--brand-family-density"],
        vars["--brand-layout-columns"],
        vars["--brand-layout-copy-align"],
        vars["--brand-shape-radius"],
        vars["--brand-share-aspect"],
      ].join("|");
    });

    expect(new Set(fingerprints).size).toBe(4);
  });
});
