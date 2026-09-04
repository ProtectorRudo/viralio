import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getMerchantBySlug } from "@/config/merchants";
import { brandRenderVariables } from "@/ui/brand-render-contract";

function css(): string {
  return fs.readFileSync(path.join(process.cwd(), "src", "app", "viralio-020f-brand-families.css"), "utf8");
}

describe("Brand Engine 2.0 visual families", () => {
  it("loads the family layer after the shared premium funnel", () => {
    const layout = fs.readFileSync(path.join(process.cwd(), "src", "app", "layout.tsx"), "utf8");
    expect(layout).toContain('import "./viralio-020b-wheel.css"');
    expect(layout).toContain('import "./viralio-020f-brand-families.css"');
    expect(layout.indexOf("viralio-020f-brand-families.css")).toBeGreaterThan(layout.indexOf("viralio-020b-wheel.css"));
  });

  it("never parses serialized style strings and keeps approved Aurora isolated", () => {
    const source = css();
    expect(source).not.toContain('[style*=');
    expect(source).not.toContain("calc(20px *");
    expect(source).not.toContain("scale(min(");
    expect(source).toContain(".experience:not(.theme-joyeria-aurora)");
    expect(source).not.toContain(".theme-joyeria-aurora .campaign-frame");
  });

  it("consumes only deterministic renderer variables for composition", () => {
    const source = css();
    for (const token of [
      "--brand-campaign-min-height",
      "--brand-campaign-align-items",
      "--brand-heading-max",
      "--brand-campaign-visual-width",
      "--brand-layout-media-scale",
      "--brand-share-aspect",
      "--brand-share-width",
      "--brand-reward-radius",
      "--brand-motion-duration",
    ]) expect(source).toContain(token);
  });

  it("gives the four families materially different landing/share fingerprints", () => {
    const merchant = structuredClone(getMerchantBySlug("moka")!);
    const directions = [
      {
        family: "editorial-luxury",
        visualMood: "minimal-luxury",
        layoutMood: "asymmetrical-editorial",
        shapeLanguage: "soft",
        surfaceLanguage: "material-metallic-subtle",
        motionMood: "elegant",
        rewardObjectStyle: "voucher",
        shareComposition: "editorial-poster",
      },
      {
        family: "warm-crafted",
        visualMood: "warm-premium",
        layoutMood: "centered-hero",
        shapeLanguage: "organic",
        surfaceLanguage: "paper-editorial",
        motionMood: "calm",
        rewardObjectStyle: "seal",
        shareComposition: "product-card",
      },
      {
        family: "bold-contemporary",
        visualMood: "bold-modern",
        layoutMood: "immersive-full-bleed",
        shapeLanguage: "geometric",
        surfaceLanguage: "flat",
        motionMood: "energetic",
        rewardObjectStyle: "token",
        shareComposition: "branded-announcement",
      },
      {
        family: "minimal-professional",
        visualMood: "technical-premium",
        layoutMood: "compact-premium",
        shapeLanguage: "sharp",
        surfaceLanguage: "flat",
        motionMood: "calm",
        rewardObjectStyle: "card",
        shareComposition: "minimal-quote",
      },
    ] as const;

    const fingerprints = directions.map((direction) => {
      merchant.theme.artDirection = direction;
      const vars = brandRenderVariables(merchant.theme);
      return [
        vars["--brand-campaign-min-height"],
        vars["--brand-campaign-align-items"],
        vars["--brand-heading-max"],
        vars["--brand-campaign-visual-width"],
        vars["--brand-share-width"],
        vars["--brand-share-aspect"],
        vars["--brand-shape-radius"],
      ].join("|");
    });

    expect(new Set(fingerprints).size).toBe(4);
  });
});
