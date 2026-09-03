import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getMerchantBySlug } from "@/config/merchants";
import { merchantThemeStyle } from "@/ui/merchant-theme";

describe("premium visual foundations", () => {
  it("defines restrained system tokens, mobile full-bleed behavior and reduced motion", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "viralio-020a.css"), "utf8");

    expect(css).toContain("--font-code:");
    expect(css).toContain("--radius-control:");
    expect(css).toContain("--radius-shell:");
    expect(css).toContain("--shadow-button: none");
    expect(css).toContain("@media (max-width: 520px)");
    expect(css).toMatch(/\.experience-card\s*\{[\s\S]*?border-radius:\s*0;/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");
  });

  it("turns luxury into typography and proportion, not oversized shadows", () => {
    const merchant = structuredClone(getMerchantBySlug("moka")!);
    merchant.theme.stylePreset = "luxury";
    merchant.theme.fontPreset = "editorial";

    const style = merchantThemeStyle(merchant) as Record<string, string>;
    expect(style["--radius-shell"]).toBe(".7rem");
    expect(style["--radius-control"]).toBe(".32rem");
    expect(style["--display-weight"]).toBe("480");
    expect(style["--shadow-button"]).toBe("none");
    expect(style["--font-display"]).toContain("Iowan Old Style");
  });
});
