import { describe, expect, it } from "vitest";
import { getMerchantBySlug } from "@/config/merchants";
import { resolveShareCardComposition, shareCardLayout } from "@/brand/share-card-layout";

describe("Share Card 2.0 layout", () => {
  it("keeps legacy merchants deterministic", () => {
    const moka = structuredClone(getMerchantBySlug("moka")!);
    moka.theme.artDirection = undefined;
    moka.theme.stylePreset = "warm";
    expect(resolveShareCardComposition(moka.theme)).toBe("product-card");

    const atlas = structuredClone(getMerchantBySlug("atlas-barber")!);
    atlas.theme.artDirection = undefined;
    atlas.theme.stylePreset = "urban";
    expect(resolveShareCardComposition(atlas.theme)).toBe("branded-announcement");
  });

  it("turns the four approved share compositions into materially different geometry", () => {
    const merchant = structuredClone(getMerchantBySlug("moka")!);
    const compositions = ["editorial-poster", "product-card", "branded-announcement", "minimal-quote"] as const;

    const fingerprints = compositions.map((composition) => {
      merchant.theme.artDirection = {
        ...(merchant.theme.artDirection ?? {
          family: "warm-crafted",
          visualMood: "warm-premium",
          layoutMood: "centered-hero",
          shapeLanguage: "organic",
          surfaceLanguage: "paper-editorial",
          motionMood: "calm",
          rewardObjectStyle: "seal",
          shareComposition: "product-card",
        }),
        shareComposition: composition,
      };
      const layout = shareCardLayout(merchant.theme);
      expect(layout.composition).toBe(composition);
      return [
        layout.bodyDirection,
        layout.copyOrder,
        layout.visualOrder,
        layout.textAlign,
        layout.headlineSize,
        layout.visualSize,
        layout.visualRadius,
        layout.frameInset,
      ].join("|");
    });

    expect(new Set(fingerprints).size).toBe(4);
  });

  it("does not expose arbitrary style or markup fields", () => {
    const merchant = structuredClone(getMerchantBySlug("moka")!);
    const layout = shareCardLayout(merchant.theme);
    expect(Object.keys(layout)).not.toContain("css");
    expect(Object.keys(layout)).not.toContain("html");
    expect(Object.values(layout).join(" ")).not.toMatch(/<script|javascript:/i);
  });
});
