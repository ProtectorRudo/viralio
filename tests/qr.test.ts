import { describe, expect, it } from "vitest";
import { qrFormatBitsForTesting, qrMatrixForTesting, qrSvg } from "@/activation/qr";
import { merchantPublicUrl } from "@/activation/public-url";

describe("activation QR", () => {
  it("uses the QR standard format word for level L and mask 0", () => {
    expect(qrFormatBitsForTesting(0)).toBe(0b111011111000100);
  });

  it("builds finder patterns, quiet zone and vector output for a real merchant URL", () => {
    const url = merchantPublicUrl("https://viralio.example", "bruma-cafe");
    const matrix = qrMatrixForTesting(url);
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix.length).toBeLessThanOrEqual(33);
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);

    // Top-left finder: dark border, white ring, dark 3x3 core.
    expect(matrix[0].slice(0, 7)).toEqual([true, true, true, true, true, true, true]);
    expect(matrix[1].slice(0, 7)).toEqual([true, false, false, false, false, false, true]);
    expect(matrix[3].slice(0, 7)).toEqual([true, false, true, true, true, false, true]);

    const svg = qrSvg(url);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("fill=\"#fff\"");
    expect(svg).toContain("fill=\"#000\"");
    expect(svg).toContain("<path");
  });

  it("chooses larger QR versions as URLs grow and rejects unsafe oversized payloads", () => {
    expect(qrMatrixForTesting("https://v.io/a")).toHaveLength(21);
    expect(qrMatrixForTesting(`https://viralio.example/${"a".repeat(42)}`).length).toBeGreaterThan(21);
    expect(() => qrSvg(`https://viralio.example/${"a".repeat(80)}`)).toThrow(/too long/);
  });
});
