import { describe, expect, it } from "vitest";
import {
  BRAND_LOGO_MAX_BYTES,
  buildMerchantBrandProfile,
  contrastRatio,
  normalizeLogoDataUrl,
  validateMerchantBrandProfile,
} from "@/brand/brand-engine";

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl1ZQAAAABJRU5ErkJggg==";

function proposal() {
  return {
    source: "openai" as const,
    logoDataUrl: tinyPng,
    stylePreset: "luxury" as const,
    fontPreset: "editorial" as const,
    tone: "sofisticado, cálido y cercano",
    keywords: ["premium", "artesanal", "cálido"],
    colors: {
      primary: "#E8DCCB",
      secondary: "#6A4B3A",
      accent: "#B87333",
      background: "#F7F2EC",
      surface: "#FFFDF9",
      text: "#F0EAE3",
    },
    ai: { model: "gpt-5.6-terra", generatedAt: "2026-09-03T12:00:00.000Z" },
  };
}

describe("brand engine", () => {
  it("derives a complete palette and corrects unreadable AI contrast", () => {
    const brand = buildMerchantBrandProfile(proposal());
    expect(brand.palette.primary).toBe("#E8DCCB");
    expect(contrastRatio(brand.palette.primary, brand.palette.onPrimary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(brand.palette.canvas, brand.palette.text)).toBeGreaterThanOrEqual(4.5);
    expect(brand.palette.wheel).toHaveLength(5);
    for (const color of brand.palette.wheel) expect(color).toMatch(/^#[0-9A-F]{6}$/);
    expect(validateMerchantBrandProfile(brand)).toEqual(brand);
  });

  it("accepts only bounded raster data URLs and rejects SVG", () => {
    expect(normalizeLogoDataUrl(tinyPng)).toBe(tinyPng);
    expect(() => normalizeLogoDataUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toThrow(/logo/);
    expect(() => normalizeLogoDataUrl("https://example.com/logo.png")).toThrow(/logo/);

    const tooLarge = `data:image/png;base64,${Buffer.alloc(BRAND_LOGO_MAX_BYTES + 1).toString("base64")}`;
    expect(() => normalizeLogoDataUrl(tooLarge)).toThrow(/logo/);
  });

  it("rejects tampered persisted palettes with unsafe contrast", () => {
    const brand = buildMerchantBrandProfile(proposal());
    const tampered = {
      ...brand,
      palette: { ...brand.palette, primary: "#FFFFFF", onPrimary: "#FFFFFF" },
    };
    expect(() => validateMerchantBrandProfile(tampered)).toThrow(/contrast/);
  });
});
