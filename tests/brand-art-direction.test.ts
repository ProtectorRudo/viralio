import { describe, expect, it } from "vitest";
import {
  BRAND_EXPERIENCE_FAMILIES,
  BRAND_LAYOUT_MOODS,
  BRAND_MOTION_MOODS,
  BRAND_REWARD_OBJECT_STYLES,
  BRAND_SHAPE_LANGUAGES,
  BRAND_SHARE_COMPOSITIONS,
  BRAND_SURFACE_LANGUAGES,
  BRAND_VISUAL_MOODS,
  defaultBrandArtDirection,
  normalizeBrandArtDirection,
} from "@/brand/art-direction";
import { buildMerchantBrandProfile, validateMerchantBrandProfile } from "@/brand/brand-engine";

const baseProposal = {
  source: "openai" as const,
  stylePreset: "luxury" as const,
  fontPreset: "editorial" as const,
  tone: "sofisticado, cálido y cercano",
  keywords: ["premium", "editorial", "cálido"],
  colors: {
    primary: "#8B5E52",
    secondary: "#D3B49F",
    accent: "#B98268",
    background: "#F7F0EA",
    surface: "#FFF9F4",
    text: "#332824",
  },
};

describe("Brand Engine 2.0 art direction", () => {
  it("exposes only finite renderer-controlled preset catalogs", () => {
    expect(BRAND_EXPERIENCE_FAMILIES).toEqual([
      "editorial-luxury",
      "warm-crafted",
      "bold-contemporary",
      "minimal-professional",
    ]);
    expect(BRAND_VISUAL_MOODS).toContain("minimal-luxury");
    expect(BRAND_LAYOUT_MOODS).toContain("asymmetrical-editorial");
    expect(BRAND_SHAPE_LANGUAGES).toContain("organic");
    expect(BRAND_SURFACE_LANGUAGES).toContain("material-metallic-subtle");
    expect(BRAND_MOTION_MOODS).toContain("elegant");
    expect(BRAND_REWARD_OBJECT_STYLES).toContain("voucher");
    expect(BRAND_SHARE_COMPOSITIONS).toContain("editorial-poster");
  });

  it("derives deterministic fallbacks for legacy style presets", () => {
    expect(defaultBrandArtDirection("luxury")).toMatchObject({
      family: "editorial-luxury",
      layoutMood: "asymmetrical-editorial",
      rewardObjectStyle: "voucher",
      shareComposition: "editorial-poster",
    });
    expect(defaultBrandArtDirection("warm")).toMatchObject({ family: "warm-crafted", shapeLanguage: "organic" });
    expect(defaultBrandArtDirection("urban")).toMatchObject({ family: "bold-contemporary", motionMood: "energetic" });
    expect(defaultBrandArtDirection("minimal")).toMatchObject({ family: "minimal-professional", layoutMood: "compact-premium" });
  });

  it("rejects arbitrary renderer instructions and unknown values", () => {
    const valid = defaultBrandArtDirection("luxury");
    expect(normalizeBrandArtDirection(valid)).toEqual(valid);
    expect(() => normalizeBrandArtDirection({ ...valid, css: "body { display:none }" })).toThrow(/art direction/);
    expect(() => normalizeBrandArtDirection({ ...valid, layoutMood: "whatever-the-model-wants" })).toThrow(/layout mood/);
  });

  it("persists a validated direction while still accepting legacy profiles without it", () => {
    const brand = buildMerchantBrandProfile({
      ...baseProposal,
      artDirection: {
        family: "editorial-luxury",
        visualMood: "minimal-luxury",
        layoutMood: "asymmetrical-editorial",
        shapeLanguage: "soft",
        surfaceLanguage: "material-metallic-subtle",
        motionMood: "elegant",
        rewardObjectStyle: "seal",
        shareComposition: "editorial-poster",
      },
    });
    expect(validateMerchantBrandProfile(brand).artDirection).toEqual(brand.artDirection);

    const { artDirection: _removed, ...legacy } = brand;
    expect(validateMerchantBrandProfile(legacy).artDirection).toBeUndefined();
  });
});
