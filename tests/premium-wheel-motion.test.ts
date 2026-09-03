import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SPIN_DURATION_MS, SPIN_TURNS } from "@/ui/premium-wheel";

describe("premium wheel motion", () => {
  it("keeps a longer nine-turn spin with a dedicated slow-stop timing curve", () => {
    expect(SPIN_TURNS).toBe(9);
    expect(SPIN_DURATION_MS).toBe(5600);

    const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "viralio-019.css"), "utf8");
    expect(css).toContain("--motion-wheel: 5600ms");
    expect(css).toMatch(/--ease-spin:\s*cubic-bezier\(/);
  });
});
