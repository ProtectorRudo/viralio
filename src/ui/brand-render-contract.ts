import { defaultBrandArtDirection } from "@/brand/art-direction";
import type { BrandStylePreset, MerchantBrandArtDirection, MerchantTheme } from "@/domain/types";

export type BrandRenderDataAttributes = {
  "data-brand-family": MerchantBrandArtDirection["family"];
  "data-visual-mood": MerchantBrandArtDirection["visualMood"];
  "data-layout-mood": MerchantBrandArtDirection["layoutMood"];
  "data-shape-language": MerchantBrandArtDirection["shapeLanguage"];
  "data-surface-language": MerchantBrandArtDirection["surfaceLanguage"];
  "data-motion-mood": MerchantBrandArtDirection["motionMood"];
  "data-reward-object": MerchantBrandArtDirection["rewardObjectStyle"];
  "data-share-composition": MerchantBrandArtDirection["shareComposition"];
};

export type BrandRenderVariables = Record<`--brand-${string}`, string>;

const familyTokens: Record<MerchantBrandArtDirection["family"], BrandRenderVariables> = {
  "editorial-luxury": {
    "--brand-family-density": ".84",
    "--brand-family-whitespace": "1.18",
    "--brand-family-contrast": "1.08",
  },
  "warm-crafted": {
    "--brand-family-density": ".94",
    "--brand-family-whitespace": "1.04",
    "--brand-family-contrast": ".94",
  },
  "bold-contemporary": {
    "--brand-family-density": "1.04",
    "--brand-family-whitespace": ".88",
    "--brand-family-contrast": "1.14",
  },
  "minimal-professional": {
    "--brand-family-density": ".9",
    "--brand-family-whitespace": "1.08",
    "--brand-family-contrast": "1",
  },
};

const layoutTokens: Record<MerchantBrandArtDirection["layoutMood"], BrandRenderVariables> = {
  "centered-hero": {
    "--brand-layout-columns": "1fr",
    "--brand-layout-copy-align": "center",
    "--brand-layout-copy-max": "32rem",
    "--brand-layout-media-scale": ".9",
  },
  "asymmetrical-editorial": {
    "--brand-layout-columns": "minmax(0,1.18fr) minmax(7.5rem,.82fr)",
    "--brand-layout-copy-align": "left",
    "--brand-layout-copy-max": "26rem",
    "--brand-layout-media-scale": "1",
  },
  "immersive-full-bleed": {
    "--brand-layout-columns": "1fr",
    "--brand-layout-copy-align": "left",
    "--brand-layout-copy-max": "30rem",
    "--brand-layout-media-scale": "1.12",
  },
  "compact-premium": {
    "--brand-layout-columns": "1fr",
    "--brand-layout-copy-align": "left",
    "--brand-layout-copy-max": "28rem",
    "--brand-layout-media-scale": ".78",
  },
};

const shapeTokens: Record<MerchantBrandArtDirection["shapeLanguage"], BrandRenderVariables> = {
  sharp: {
    "--brand-shape-radius": ".25rem",
    "--brand-shape-pill": ".35rem",
  },
  soft: {
    "--brand-shape-radius": ".9rem",
    "--brand-shape-pill": "999px",
  },
  organic: {
    "--brand-shape-radius": "1.35rem",
    "--brand-shape-pill": "999px",
  },
  geometric: {
    "--brand-shape-radius": ".55rem",
    "--brand-shape-pill": ".55rem",
  },
};

const surfaceTokens: Record<MerchantBrandArtDirection["surfaceLanguage"], BrandRenderVariables> = {
  flat: {
    "--brand-surface-border-opacity": ".16",
    "--brand-surface-shadow-opacity": "0",
    "--brand-surface-texture-opacity": "0",
  },
  "paper-editorial": {
    "--brand-surface-border-opacity": ".18",
    "--brand-surface-shadow-opacity": ".07",
    "--brand-surface-texture-opacity": ".045",
  },
  "glass-subtle": {
    "--brand-surface-border-opacity": ".22",
    "--brand-surface-shadow-opacity": ".1",
    "--brand-surface-texture-opacity": ".02",
  },
  "material-metallic-subtle": {
    "--brand-surface-border-opacity": ".28",
    "--brand-surface-shadow-opacity": ".08",
    "--brand-surface-texture-opacity": ".035",
  },
};

const motionTokens: Record<MerchantBrandArtDirection["motionMood"], BrandRenderVariables> = {
  calm: {
    "--brand-motion-duration": "420ms",
    "--brand-motion-distance": "8px",
  },
  elegant: {
    "--brand-motion-duration": "560ms",
    "--brand-motion-distance": "12px",
  },
  energetic: {
    "--brand-motion-duration": "280ms",
    "--brand-motion-distance": "16px",
  },
  playful: {
    "--brand-motion-duration": "380ms",
    "--brand-motion-distance": "14px",
  },
};

const rewardTokens: Record<MerchantBrandArtDirection["rewardObjectStyle"], BrandRenderVariables> = {
  medallion: { "--brand-reward-aspect": "1 / 1", "--brand-reward-radius": "50%" },
  voucher: { "--brand-reward-aspect": "1.45 / 1", "--brand-reward-radius": ".35rem" },
  seal: { "--brand-reward-aspect": "1 / 1", "--brand-reward-radius": "50%" },
  card: { "--brand-reward-aspect": "1.58 / 1", "--brand-reward-radius": ".8rem" },
  token: { "--brand-reward-aspect": "1 / 1", "--brand-reward-radius": ".55rem" },
};

const shareTokens: Record<MerchantBrandArtDirection["shareComposition"], BrandRenderVariables> = {
  "editorial-poster": { "--brand-share-aspect": "9 / 16", "--brand-share-copy-width": "62%" },
  "product-card": { "--brand-share-aspect": "4 / 5", "--brand-share-copy-width": "72%" },
  "minimal-quote": { "--brand-share-aspect": "1 / 1", "--brand-share-copy-width": "78%" },
  "branded-announcement": { "--brand-share-aspect": "9 / 16", "--brand-share-copy-width": "84%" },
};

const visualTokens: Record<MerchantBrandArtDirection["visualMood"], BrandRenderVariables> = {
  editorial: { "--brand-visual-emphasis": "1.04", "--brand-visual-decoration": ".34" },
  "warm-premium": { "--brand-visual-emphasis": ".96", "--brand-visual-decoration": ".48" },
  "minimal-luxury": { "--brand-visual-emphasis": "1.08", "--brand-visual-decoration": ".2" },
  "bold-modern": { "--brand-visual-emphasis": "1.16", "--brand-visual-decoration": ".42" },
  "crafted-artisanal": { "--brand-visual-emphasis": ".94", "--brand-visual-decoration": ".56" },
  "playful-refined": { "--brand-visual-emphasis": "1.02", "--brand-visual-decoration": ".62" },
  "technical-premium": { "--brand-visual-emphasis": ".9", "--brand-visual-decoration": ".16" },
};

function fallbackStylePreset(theme: MerchantTheme): BrandStylePreset {
  if (theme.stylePreset) return theme.stylePreset;
  if (theme.category === "coffee") return "warm";
  if (theme.category === "barber") return "urban";
  return "minimal";
}

export function brandRenderArtDirection(theme: MerchantTheme): MerchantBrandArtDirection {
  return theme.artDirection ?? defaultBrandArtDirection(fallbackStylePreset(theme));
}

export function brandRenderDataAttributes(theme: MerchantTheme): BrandRenderDataAttributes {
  const direction = brandRenderArtDirection(theme);
  return {
    "data-brand-family": direction.family,
    "data-visual-mood": direction.visualMood,
    "data-layout-mood": direction.layoutMood,
    "data-shape-language": direction.shapeLanguage,
    "data-surface-language": direction.surfaceLanguage,
    "data-motion-mood": direction.motionMood,
    "data-reward-object": direction.rewardObjectStyle,
    "data-share-composition": direction.shareComposition,
  };
}

export function brandRenderVariables(theme: MerchantTheme): BrandRenderVariables {
  const direction = brandRenderArtDirection(theme);
  return {
    ...familyTokens[direction.family],
    ...layoutTokens[direction.layoutMood],
    ...shapeTokens[direction.shapeLanguage],
    ...surfaceTokens[direction.surfaceLanguage],
    ...motionTokens[direction.motionMood],
    ...rewardTokens[direction.rewardObjectStyle],
    ...shareTokens[direction.shareComposition],
    ...visualTokens[direction.visualMood],
  };
}
