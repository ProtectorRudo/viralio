import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REDUCED_SPIN_DURATION_MS, SPIN_DURATION_MS, SPIN_TURNS } from "@/ui/premium-wheel";

describe("premium wheel motion", () => {
  it("keeps a long nine-turn spin with a dedicated slow-stop timing curve", () => {
    expect(SPIN_TURNS).toBe(9);
    expect(SPIN_DURATION_MS).toBe(6600);

    const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "viralio-020b-r2.css"), "utf8");
    expect(css).toContain("--motion-wheel: 6600ms");
    expect(css).toMatch(/--ease-spin:\s*cubic-bezier\(/);
  });

  it("keeps reduced motion perceptible without using the full nine-turn spin", () => {
    expect(REDUCED_SPIN_DURATION_MS).toBe(1200);

    const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "viralio-020b-r2-motion.css"), "utf8");
    expect(css).toContain("transition-duration: 1200ms !important");
  });
});
