import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("VIRALIO-021B product feedback refinement", () => {
  it("uses the approved QR-entry promise as real DOM copy", () => {
    const experience = read("src/ui/merchant-experience.tsx");
    expect(experience).toContain("<h1>Tenemos un regalo especial para vos</h1>");
    expect(experience).toContain("Descubrir mi regalo");
    expect(experience).not.toContain("<h1>{merchant.theme.heroTitle}</h1>");
  });

  it("loads after the universal visual system so feedback refinements win deterministically", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toContain('import "./viralio-021b-feedback-refine.css"');
    expect(layout.indexOf("viralio-021b-feedback-refine.css")).toBeGreaterThan(layout.indexOf("viralio-021-visual-system.css"));
  });

  it("keeps the customer wheel materially larger and prize labels contrast-protected", () => {
    const css = read("src/app/viralio-021b-feedback-refine.css");
    expect(css).toContain("width: min(86vw, 338px)");
    expect(css).toContain("font-size: 10.6px");
    expect(css).toContain("paint-order: stroke fill");
    expect(css).toContain("stroke: rgba(0, 0, 0, .58)");
    expect(css).toContain("transform-origin: .5px calc((min(86vw, 338px) + 16px) / 2 - 3px)");
  });

  it("preserves Aurora composition while adopting the new promise and clearer wheel labels", () => {
    const css = read("src/app/viralio-021b-feedback-refine.css");
    expect(css).toContain('.theme-joyeria-aurora .campaign-copy h1::before');
    expect(css).toContain('content: "Tenemos un"');
    expect(css).toContain('content: "regalo especial"');
    expect(css).toContain('content: "para vos"');
    expect(css).toContain("font-size: 10.2px");
  });

  it("keeps a dedicated small-mobile refinement", () => {
    const css = read("src/app/viralio-021b-feedback-refine.css");
    expect(css).toContain("@media (max-width: 380px)");
    expect(css).toContain("width: min(87vw, 316px)");
  });
});
