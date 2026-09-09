import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("VIRALIO-021H professional share composition", () => {
  it("loads the final share polish after the prior screenshot fixes", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toContain('import "./viralio-021h-share-polish.css"');
    expect(layout.indexOf("viralio-021h-share-polish.css")).toBeGreaterThan(layout.indexOf("viralio-021e-share-voucher-fix.css"));
  });

  it("keeps the share headline editorial but controlled", () => {
    const css = read("src/app/viralio-021h-share-polish.css");
    expect(css).toContain("font-size: clamp(2rem, 8.8vw, 2.72rem)");
    expect(css).toContain("text-align: left");
    expect(css).toContain("text-wrap: balance");
    expect(css).toContain("width: min(100%, 348px)");
    expect(css).toContain("@media (max-width: 390px)");
    expect(css).toContain("width: min(100%, 326px)");
  });

  it("keeps the WhatsApp action compact and aligned", () => {
    const css = read("src/app/viralio-021h-share-polish.css");
    expect(css).toContain("grid-template-columns: 42px minmax(0, 1fr)");
    expect(css).toContain("min-height: 78px");
    expect(css).toContain("border-radius: 20px");
  });
});
