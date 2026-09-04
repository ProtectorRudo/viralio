import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REDUCED_SPIN_DURATION_MS, SPIN_DURATION_MS, SPIN_TURNS } from "@/ui/premium-wheel";

function source(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("approved Joyería Aurora visual contract", () => {
  it("loads a dedicated reference layer after the shared funnel styles", () => {
    const layout = source("src/app/layout.tsx");
    expect(layout).toContain('import "./viralio-020b.css"');
    expect(layout).toContain('import "./viralio-020c-approved-aurora.css"');
    expect(layout).toContain('import "./viralio-020c-approved-aurora-motion.css"');
    expect(layout.indexOf("viralio-020c-approved-aurora.css")).toBeGreaterThan(layout.indexOf("viralio-020b.css"));
  });

  it("uses the approved Aurora photography and four-screen primitives", () => {
    const css = source("src/app/viralio-020c-approved-aurora.css");
    expect(css).toContain("/brand/aurora-landing-jewelry.webp");
    expect(css).toContain("/brand/aurora-share-jewelry.webp");
    expect(css).toContain('content: "Hay algo"');
    expect(css).toContain('content: "hermoso"');
    expect(css).toContain('content: "Comparte para"');
    expect(css).toContain('content: "¡Gira la ruleta!"');
    expect(css).toContain('content: "¡FELICIDADES!"');
    expect(css).toContain(".reward-voucher");
  });

  it("is scoped to Aurora and does not replace the shared engine", () => {
    const css = source("src/app/viralio-020c-approved-aurora.css");
    expect(css).toContain(".theme-joyeria-aurora");
    expect(css).not.toContain(".theme-moka");
    expect(css).not.toContain(".theme-atlas-barber");
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
