import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("football public value UI contract", () => {
  it("shows only the minimum value threshold in the detailed value panel", () => {
    const panel = source("src/app/futbol/bet-value-panel.tsx");

    expect(panel).toContain("HAY VALOR DESDE");
    expect(panel).toContain("Hay valor desde");

    expect(panel).not.toContain("Cuota de la casa");
    expect(panel).not.toContain("Cuota justa");
    expect(panel).not.toContain("Edge estimado");
    expect(panel).not.toContain("bookmaker");
    expect(panel).not.toContain("<input");
  });

  it("does not render bookmaker price labels in the audited scanner", () => {
    const scanner = source("src/app/futbol/value-scanner.tsx");

    expect(scanner).toContain("HAY VALOR DESDE");
    expect(scanner).not.toContain(">Casa<");
    expect(scanner).not.toContain(">Cuota<");
    expect(scanner).not.toContain("Cuota justa");
    expect(scanner).not.toContain("Edge estimado");
    expect(scanner).not.toContain("<input");
  });
});
