import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "src/app/ebook/page.tsx"), "utf8");

describe("ebook sales landing", () => {
  it("publishes the launch price and viral creative toolkit", () => {
    expect(source).toContain("$14.900");
    expect(source).toContain("100 Hooks");
    expect(source).toContain("20 Guiones");
    expect(source).toContain("30 Estructuras");
    expect(source).toContain("Prompts para encontrar ideas fuertes");
    expect(source).toContain("Método A.R.D.A.");
  });

  it("routes checkout through the verified purchase flow and avoids guaranteed-viral claims", () => {
    expect(source).toContain("/api/ebook/checkout");
    expect(source).toContain("Nadie puede garantizar viralidad");
    expect(source).toContain("potencial viral");
  });

  it("loads an isolated stylesheet for /ebook", () => {
    expect(source).toContain('href="/ebook/ebook.css"');
    expect(fs.existsSync(path.join(root, "public/ebook/ebook.css"))).toBe(true);
  });
});
