import type {
  BrandExperienceFamily,
  BrandLayoutMood,
  BrandMotionMood,
  BrandRewardObjectStyle,
  BrandShapeLanguage,
  BrandShareComposition,
  BrandSurfaceLanguage,
  BrandVisualMood,
  BrandStylePreset,
  MerchantBrandArtDirection,
} from "@/domain/types";

export const BRAND_EXPERIENCE_FAMILIES = [
  "editorial-luxury",
  "warm-crafted",
  "bold-contemporary",
  "minimal-professional",
] as const satisfies readonly BrandExperienceFamily[];

export const BRAND_VISUAL_MOODS = [
  "editorial",
  "warm-premium",
  "minimal-luxury",
  "bold-modern",
  "crafted-artisanal",
  "playful-refined",
  "technical-premium",
] as const satisfies readonly BrandVisualMood[];

export const BRAND_LAYOUT_MOODS = [
  "centered-hero",
  "asymmetrical-editorial",
  "immersive-full-bleed",
  "compact-premium",
] as const satisfies readonly BrandLayoutMood[];

export const BRAND_SHAPE_LANGUAGES = ["sharp", "soft", "organic", "geometric"] as const satisfies readonly BrandShapeLanguage[];

export const BRAND_SURFACE_LANGUAGES = [
  "flat",
  "paper-editorial",
  "glass-subtle",
  "material-metallic-subtle",
] as const satisfies readonly BrandSurfaceLanguage[];

export const BRAND_MOTION_MOODS = ["calm", "elegant", "energetic", "playful"] as const satisfies readonly BrandMotionMood[];

export const BRAND_REWARD_OBJECT_STYLES = ["medallion", "voucher", "seal", "card", "token"] as const satisfies readonly BrandRewardObjectStyle[];

export const BRAND_SHARE_COMPOSITIONS = [
  "editorial-poster",
  "product-card",
  "minimal-quote",
  "branded-announcement",
] as const satisfies readonly BrandShareComposition[];

const FAMILY_SET = new Set<string>(BRAND_EXPERIENCE_FAMILIES);
const VISUAL_SET = new Set<string>(BRAND_VISUAL_MOODS);
const LAYOUT_SET = new Set<string>(BRAND_LAYOUT_MOODS);
const SHAPE_SET = new Set<string>(BRAND_SHAPE_LANGUAGES);
const SURFACE_SET = new Set<string>(BRAND_SURFACE_LANGUAGES);
const MOTION_SET = new Set<string>(BRAND_MOTION_MOODS);
const REWARD_SET = new Set<string>(BRAND_REWARD_OBJECT_STYLES);
const SHARE_SET = new Set<string>(BRAND_SHARE_COMPOSITIONS);

function enumValue<T extends string>(value: unknown, allowed: Set<string>, label: string): T {
  if (typeof value !== "string" || !allowed.has(value)) throw new Error(`Invalid ${label}`);
  return value as T;
}

export function defaultBrandArtDirection(stylePreset: BrandStylePreset): MerchantBrandArtDirection {
  if (stylePreset === "luxury" || stylePreset === "editorial") {
    return {
      family: "editorial-luxury",
      visualMood: stylePreset === "luxury" ? "minimal-luxury" : "editorial",
      layoutMood: "asymmetrical-editorial",
      shapeLanguage: "soft",
      surfaceLanguage: "paper-editorial",
      motionMood: "elegant",
      rewardObjectStyle: "voucher",
      shareComposition: "editorial-poster",
    };
  }

  if (stylePreset === "warm") {
    return {
      family: "warm-crafted",
      visualMood: "warm-premium",
      layoutMood: "centered-hero",
      shapeLanguage: "organic",
      surfaceLanguage: "paper-editorial",
      motionMood: "calm",
      rewardObjectStyle: "seal",
      shareComposition: "product-card",
    };
  }

  if (stylePreset === "bold" || stylePreset === "urban") {
    return {
      family: "bold-contemporary",
      visualMood: "bold-modern",
      layoutMood: "immersive-full-bleed",
      shapeLanguage: "geometric",
      surfaceLanguage: "flat",
      motionMood: "energetic",
      rewardObjectStyle: "token",
      shareComposition: "branded-announcement",
    };
  }

  return {
    family: "minimal-professional",
    visualMood: "technical-premium",
    layoutMood: "compact-premium",
    shapeLanguage: "sharp",
    surfaceLanguage: "flat",
    motionMood: "calm",
    rewardObjectStyle: "card",
    shareComposition: "minimal-quote",
  };
}

export function normalizeBrandArtDirection(value: unknown): MerchantBrandArtDirection {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid brand art direction");
  const candidate = value as Record<string, unknown>;
  const allowedKeys = new Set([
    "family",
    "visualMood",
    "layoutMood",
    "shapeLanguage",
    "surfaceLanguage",
    "motionMood",
    "rewardObjectStyle",
    "shareComposition",
  ]);
  if (Object.keys(candidate).some((key) => !allowedKeys.has(key))) throw new Error("Invalid brand art direction");

  return {
    family: enumValue<BrandExperienceFamily>(candidate.family, FAMILY_SET, "brand experience family"),
    visualMood: enumValue<BrandVisualMood>(candidate.visualMood, VISUAL_SET, "brand visual mood"),
    layoutMood: enumValue<BrandLayoutMood>(candidate.layoutMood, LAYOUT_SET, "brand layout mood"),
    shapeLanguage: enumValue<BrandShapeLanguage>(candidate.shapeLanguage, SHAPE_SET, "brand shape language"),
    surfaceLanguage: enumValue<BrandSurfaceLanguage>(candidate.surfaceLanguage, SURFACE_SET, "brand surface language"),
    motionMood: enumValue<BrandMotionMood>(candidate.motionMood, MOTION_SET, "brand motion mood"),
    rewardObjectStyle: enumValue<BrandRewardObjectStyle>(candidate.rewardObjectStyle, REWARD_SET, "brand reward object style"),
    shareComposition: enumValue<BrandShareComposition>(candidate.shareComposition, SHARE_SET, "brand share composition"),
  };
}
