import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REDUCED_SPIN_DURATION_MS, SPIN_DURATION_MS, SPIN_TURNS } from "@/ui/premium-wheel";

function source(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("approved Joyería Aurora visual contract", () => {
  it("loads Mauro feedback after the shared funnel and Aurora reference layers", () => {
    const layout = source("src/app/layout.tsx");
    expect(layout).toContain('import "./viralio-020b.css"');
    expect(layout).toContain('import "./viralio-020c-approved-aurora.css"');
    expect(layout).toContain('import "./viralio-020c-approved-aurora-motion.css"');
    expect(layout).toContain('import "./viralio-020c-aurora-feedback.css"');
    expect(layout).not.toContain("viralio-020k-story-builder.css");
    expect(layout.indexOf("viralio-020c-aurora-feedback.css")).toBeGreaterThan(layout.indexOf("viralio-020c-approved-aurora.css"));
  });

  it("removes rejected photography and keeps Aurora typography, wheel and reward primitives", () => {
    const baseCss = source("src/app/viralio-020c-approved-aurora.css");
    const feedbackCss = source("src/app/viralio-020c-aurora-feedback.css");

    expect(feedbackCss).toContain(".campaign-visual");
    expect(feedbackCss).toContain("display: none !important");
    expect(feedbackCss).toContain("background: none !important");
    expect(feedbackCss).toContain('content: "Compartí la magia"');
    expect(feedbackCss).toContain('content: "de Aurora"');

    expect(fs.existsSync(path.join(process.cwd(), "public/brand/aurora-landing-jewelry.webp"))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "public/brand/aurora-share-jewelry.webp"))).toBe(false);

    expect(baseCss).toContain('content: "¡Gira la ruleta!"');
    expect(baseCss).toContain('content: "¡FELICIDADES!"');
    expect(baseCss).toContain(".reward-voucher");
  });

  it("keeps WhatsApp message as Aurora's only sharing action", () => {
    const experience = source("src/ui/merchant-experience.tsx");
    const feedbackCss = source("src/app/viralio-020c-aurora-feedback.css");

    expect(experience).toContain("https://wa.me/?text=");
    expect(experience).not.toContain("Crear mi Story");
    expect(experience).not.toContain("/story/${merchant.slug}");
    expect(feedbackCss).toContain('[data-testid="native-share"]');
    expect(feedbackCss).toContain(".premium-story-grid");
    expect(feedbackCss).toContain("direct WhatsApp message");
    expect(fs.existsSync(path.join(process.cwd(), "src/ui/story-builder.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "src/app/viralio-020k-story-builder.css"))).toBe(false);
  });

  it("is scoped to Aurora and does not replace the shared engine", () => {
    const feedbackCss = source("src/app/viralio-020c-aurora-feedback.css");
    expect(feedbackCss).toContain(".theme-joyeria-aurora");
    expect(feedbackCss).not.toContain(".theme-moka");
    expect(feedbackCss).not.toContain(".theme-atlas-barber");
  });

  it("keeps the normal nine-turn wheel and makes reduced motion visible rather than instant", () => {
    expect(SPIN_TURNS).toBe(9);
    expect(SPIN_DURATION_MS).toBe(5600);
    expect(REDUCED_SPIN_DURATION_MS).toBe(1600);

    const experience = source("src/ui/merchant-experience.tsx");
    const motion = source("src/app/viralio-020c-approved-aurora-motion.css");
    expect(experience).toContain("reducedMotion ? REDUCED_SPIN_DURATION_MS : SPIN_DURATION_MS");
    expect(motion).toContain("transition: transform 1600ms");
  });
});
