import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REDUCED_SPIN_DURATION_MS, SPIN_DURATION_MS, SPIN_TURNS } from "@/ui/premium-wheel";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("VIRALIO-021 Visual System v1", () => {
  it("loads as the final shared visual layer after the approved Aurora reference", () => {
    const layout = read("src/app/layout.tsx");
    const visualSystem = 'import "./viralio-021-visual-system.css"';
    expect(layout).toContain(visualSystem);
    expect(layout.indexOf("viralio-021-visual-system.css")).toBeGreaterThan(
      layout.indexOf("viralio-020c-aurora-reward-cleanup.css"),
    );
  });

  it("keeps Aurora untouched while applying one premium grammar to every other merchant", () => {
    const css = read("src/app/viralio-021-visual-system.css");
    expect(css).toContain(".experience:not(.theme-joyeria-aurora)");
    expect(css).toContain(".premium-campaign-stage");
    expect(css).toContain(".premium-share-stage");
    expect(css).toContain(".premium-wheel-stage");
    expect(css).toContain(".premium-reveal-stage");
    expect(css).not.toContain(".theme-moka");
    expect(css).not.toContain(".theme-atlas-barber");
  });

  it("uses Brand Engine tokens instead of hard-coding one rubric's identity", () => {
    const css = read("src/app/viralio-021-visual-system.css");
    expect(css).toContain("var(--color-primary)");
    expect(css).toContain("var(--color-accent)");
    expect(css).toContain("var(--font-display)");
    expect(css).toContain("var(--brand-layout-columns");
    expect(css).toContain("var(--brand-shape-radius");
    expect(css).toContain("var(--brand-layout-media-scale");
    expect(css).toContain("var(--brand-reward-radius");
    expect(css).toContain("var(--brand-share-copy-width");
  });

  it("makes the social asset, wheel and reward object first-class visual surfaces", () => {
    const css = read("src/app/viralio-021-visual-system.css");
    expect(css).toContain(".share-poster-preview");
    expect(css).toContain(".premium-story-grid");
    expect(css).toContain(".wheel-object-shell");
    expect(css).toContain(".wheel-center-cap");
    expect(css).toContain(".reward-voucher");
    expect(css).toContain(".voucher-code");
  });

  it("keeps the approved deliberate spin rhythm instead of a sub-second reveal", () => {
    expect(SPIN_DURATION_MS).toBeGreaterThanOrEqual(4_500);
    expect(SPIN_TURNS).toBeGreaterThanOrEqual(7);
    expect(REDUCED_SPIN_DURATION_MS).toBeGreaterThanOrEqual(1_000);
    expect(REDUCED_SPIN_DURATION_MS).toBeLessThan(SPIN_DURATION_MS);
  });

  it("preserves reduced-motion accessibility", () => {
    const css = read("src/app/viralio-021-visual-system.css");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");
  });
});
