import { describe, expect, it } from "vitest";
import { defaultBrandArtDirection } from "@/brand/art-direction";
import { shareCardLayout } from "@/brand/share-card-layout";
import { getMerchantBySlug } from "@/config/merchants";
import type { BrandStylePreset } from "@/domain/types";
import { brandRenderVariables } from "@/ui/brand-render-contract";

const families: Array<{ style: BrandStylePreset; family: string; reward: string; share: string }> = [
  { style: "luxury", family: "editorial-luxury", reward: "voucher", share: "editorial-poster" },
  { style: "warm", family: "warm-crafted", reward: "seal", share: "product-card" },
  { style: "urban", family: "bold-contemporary", reward: "token", share: "branded-announcement" },
  { style: "minimal", family: "minimal-professional", reward: "card", share: "minimal-quote" },
];

describe("VIRALIO-020 final four-family contract", () => {
  it("keeps all four art directions materially distinct from landing through share and reward", () => {
    const merchant = structuredClone(getMerchantBySlug("moka")!);
    const renderFingerprints = new Set<string>();
    const shareFingerprints = new Set<string>();
    const rewardObjects = new Set<string>();

    for (const expected of families) {
      const direction = defaultBrandArtDirection(expected.style);
      expect(direction).toMatchObject({
        family: expected.family,
        rewardObjectStyle: expected.reward,
        shareComposition: expected.share,
      });

      merchant.theme.stylePreset = expected.style;
      merchant.theme.artDirection = direction;
      const vars = brandRenderVariables(merchant.theme);
      const share = shareCardLayout(merchant.theme);

      renderFingerprints.add([
        vars["--brand-family-density"],
        vars["--brand-campaign-min-height"],
        vars["--brand-campaign-visual-width"],
        vars["--brand-shape-radius"],
        vars["--brand-share-aspect"],
      ].join("|"));

      shareFingerprints.add([
        share.composition,
        share.bodyDirection,
        share.textAlign,
        share.headlineSize,
        share.visualSize,
        share.visualRadius,
      ].join("|"));

      rewardObjects.add(direction.rewardObjectStyle);
    }

    expect(renderFingerprints.size).toBe(4);
    expect(shareFingerprints.size).toBe(4);
    expect(rewardObjects.size).toBe(4);
  });

  it("never needs arbitrary model-authored rendering instructions", () => {
    for (const { style } of families) {
      const direction = defaultBrandArtDirection(style);
      expect(Object.keys(direction).sort()).toEqual([
        "family",
        "layoutMood",
        "motionMood",
        "rewardObjectStyle",
        "shapeLanguage",
        "shareComposition",
        "surfaceLanguage",
        "visualMood",
      ].sort());
      expect(JSON.stringify(direction)).not.toMatch(/<style|<script|linear-gradient|url\(|position\s*:/i);
    }
  });
});
