import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("VIRALIO-020G merchant UI premium", () => {
  it("loads the merchant backoffice layer after the shared funnel styles", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toContain('import "./viralio-020g-merchant-ui.css"');
    expect(layout.indexOf("viralio-020g-merchant-ui.css")).toBeGreaterThan(layout.indexOf("viralio-020b-wheel.css"));
  });

  it("keeps the backoffice sober instead of relying on generic AI decoration", () => {
    const css = read("src/app/viralio-020g-merchant-ui.css");
    expect(css).not.toMatch(/linear-gradient|radial-gradient|conic-gradient/i);
    expect(css).not.toMatch(/drop-shadow\(|text-shadow/i);
    expect(css).toContain(".merchant-dashboard-shell .ambient");
    expect(css).toContain("display: none");
  });

  it("scopes redemption styling away from the public reward card", () => {
    const redemption = read("src/ui/merchant-redemption-panel.tsx");
    const css = read("src/app/viralio-020g-merchant-ui.css");
    expect(redemption).toContain("merchant-redemption-shell");
    expect(redemption).toContain("merchant-redemption-card");
    expect(css).toContain(".merchant-redemption-shell .reward-seal");
    expect(css).not.toContain(".public-card .reward-seal");
  });

  it("adds an actual live settings preview without changing persistence contracts", () => {
    const settings = read("src/ui/merchant-settings-panel.tsx");
    expect(settings).toContain('data-testid="merchant-settings-preview"');
    expect(settings).toContain("customization.copy.heroTitle");
    expect(settings).toContain("customization.copy.socialHeadline");
    expect(settings).toContain("customization.rewardValidityDays");
    expect(settings).toContain("probabilityTotal");
    expect(settings).toContain('fetch("/api/merchant/settings"');
  });
});
