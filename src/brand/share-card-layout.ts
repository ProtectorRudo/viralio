import { defaultBrandArtDirection } from "@/brand/art-direction";
import type { BrandStylePreset, MerchantBrandArtDirection, MerchantTheme } from "@/domain/types";

export type ShareCardComposition = MerchantBrandArtDirection["shareComposition"];

export interface ShareCardLayout {
  composition: ShareCardComposition;
  frameInset: number;
  frameBorderWidth: number;
  bodyDirection: "row" | "column";
  bodyAlign: "stretch" | "center";
  bodyPadding: string;
  copyOrder: number;
  visualOrder: number;
  textWidth: string;
  visualWidth: string;
  textAlign: "left" | "center";
  headlineSize: number;
  headlineWeight: number;
  headlineMaxWidth: number;
  visualSize: number;
  visualRadius: number;
  visualBorderWidth: number;
  visualMarginTop: number;
  eyebrow: string;
  invitationLabel: string;
}

const layouts: Record<ShareCardComposition, ShareCardLayout> = {
  "editorial-poster": {
    composition: "editorial-poster",
    frameInset: 42,
    frameBorderWidth: 2,
    bodyDirection: "row",
    bodyAlign: "stretch",
    bodyPadding: "92px 0 74px",
    copyOrder: 0,
    visualOrder: 1,
    textWidth: "58%",
    visualWidth: "42%",
    textAlign: "left",
    headlineSize: 78,
    headlineWeight: 500,
    headlineMaxWidth: 530,
    visualSize: 278,
    visualRadius: 999,
    visualBorderWidth: 2,
    visualMarginTop: 0,
    eyebrow: "HAY ALGO PARA VOS",
    invitationLabel: "INVITACIÓN PRIVADA",
  },
  "product-card": {
    composition: "product-card",
    frameInset: 54,
    frameBorderWidth: 1,
    bodyDirection: "column",
    bodyAlign: "center",
    bodyPadding: "70px 30px 62px",
    copyOrder: 1,
    visualOrder: 0,
    textWidth: "100%",
    visualWidth: "100%",
    textAlign: "center",
    headlineSize: 64,
    headlineWeight: 560,
    headlineMaxWidth: 760,
    visualSize: 430,
    visualRadius: 38,
    visualBorderWidth: 1,
    visualMarginTop: 0,
    eyebrow: "UNA INVITACIÓN PARA VOS",
    invitationLabel: "PIEZA DE LA MARCA",
  },
  "branded-announcement": {
    composition: "branded-announcement",
    frameInset: 0,
    frameBorderWidth: 0,
    bodyDirection: "column",
    bodyAlign: "stretch",
    bodyPadding: "74px 0 58px",
    copyOrder: 0,
    visualOrder: 1,
    textWidth: "100%",
    visualWidth: "100%",
    textAlign: "left",
    headlineSize: 96,
    headlineWeight: 760,
    headlineMaxWidth: 880,
    visualSize: 460,
    visualRadius: 16,
    visualBorderWidth: 3,
    visualMarginTop: 54,
    eyebrow: "ESTO ES PARA COMPARTIR",
    invitationLabel: "ANUNCIO DE MARCA",
  },
  "minimal-quote": {
    composition: "minimal-quote",
    frameInset: 66,
    frameBorderWidth: 1,
    bodyDirection: "column",
    bodyAlign: "stretch",
    bodyPadding: "126px 34px 100px",
    copyOrder: 0,
    visualOrder: 1,
    textWidth: "100%",
    visualWidth: "100%",
    textAlign: "left",
    headlineSize: 68,
    headlineWeight: 520,
    headlineMaxWidth: 790,
    visualSize: 168,
    visualRadius: 8,
    visualBorderWidth: 1,
    visualMarginTop: 88,
    eyebrow: "UNA OPORTUNIDAD PARA VOS",
    invitationLabel: "INVITACIÓN",
  },
};

function fallbackStylePreset(theme: MerchantTheme): BrandStylePreset {
  if (theme.stylePreset) return theme.stylePreset;
  if (theme.category === "coffee") return "warm";
  if (theme.category === "barber") return "urban";
  return "minimal";
}

export function resolveShareCardComposition(theme: MerchantTheme): ShareCardComposition {
  return theme.artDirection?.shareComposition
    ?? defaultBrandArtDirection(fallbackStylePreset(theme)).shareComposition;
}

export function shareCardLayout(theme: MerchantTheme): ShareCardLayout {
  return layouts[resolveShareCardComposition(theme)];
}
