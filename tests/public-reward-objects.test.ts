import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("VIRALIO-020I public reward objects", () => {
  it("loads after Brand Engine and merchant UI layers", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toContain('import "./viralio-020i-reward-objects.css"');
    expect(layout.indexOf("viralio-020i-reward-objects.css")).toBeGreaterThan(layout.indexOf("viralio-020g-merchant-ui.css"));
  });

  it("uses only validated data attributes and keeps Aurora isolated", () => {
    const card = read("src/ui/reward-card.tsx");
    const css = read("src/app/viralio-020i-reward-objects.css");
    expect(card).toContain("brandRenderDataAttributes(merchant.theme)");
    expect(css).toContain('[data-reward-object="seal"]');
    expect(css).toContain('[data-reward-object="medallion"]');
    expect(css).toContain('[data-reward-object="token"]');
    expect(css).toContain('[data-reward-object="card"]');
    expect(css).toContain('[data-reward-object="voucher"]');
    expect(css).toContain(".experience:not(.theme-joyeria-aurora)");
  });

  it("stays flat and read-only", () => {
    const css = read("src/app/viralio-020i-reward-objects.css");
    const card = read("src/ui/reward-card.tsx");
    expect(css).not.toMatch(/linear-gradient|radial-gradient|conic-gradient|drop-shadow\(|text-shadow/i);
    expect(card).not.toContain("Marcar como canjeado");
    expect(card).toContain("panel seguro del comercio");
  });
});
