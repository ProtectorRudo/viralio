import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("VIRALIO-021C funnel reset route", () => {
  it("removes only Viralio funnel session keys", () => {
    const page = read("src/app/reset/page.tsx");
    expect(page).toContain("/^viralio:.*:session$/");
    expect(page).toContain("localStorage.removeItem(key)");
    expect(page).not.toContain("localStorage.clear()");
  });

  it("redirects only to an internal safe merchant slug", () => {
    const page = read("src/app/reset/page.tsx");
    expect(page).toContain("/^[a-z0-9-]+$/");
    expect(page).toContain('window.location.replace(`/${slug}`)');
    expect(page).toContain('?? "moka"');
  });
});
