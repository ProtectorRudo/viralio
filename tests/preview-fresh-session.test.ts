import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("preview-only fresh session mode", () => {
  it("is gated by Vercel preview environment", () => {
    const page = source("src/app/[slug]/page.tsx");
    expect(page).toContain('process.env.VERCEL_ENV === "preview"');
    expect(page).toContain('fresh === "1"');
  });

  it("clears only the current merchant session before mounting the funnel", () => {
    const boundary = source("src/ui/preview-fresh-session-boundary.tsx");
    expect(boundary).toContain('localStorage.removeItem(`viralio:${merchant.slug}:session`)');
    expect(boundary).toContain("<MerchantExperience");
  });
});
