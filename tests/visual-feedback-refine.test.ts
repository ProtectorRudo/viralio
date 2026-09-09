import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("VIRALIO-021E screenshot-driven refinement", () => {
  it("uses the approved QR-entry promise as real DOM copy", () => {
    const experience = read("src/ui/merchant-experience.tsx");
    expect(experience).toContain("<h1>Tenemos un regalo especial para vos</h1>");
    expect(experience).toContain("Descubrir mi regalo");
    expect(experience).toContain('data-design-version="021e"');
  });

  it("loads the final screenshot correction after every previous visual layer", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toContain('import "./viralio-021d-mobile-refine.css"');
    expect(layout).toContain('import "./viralio-021e-share-voucher-fix.css"');
    expect(layout.indexOf("viralio-021e-share-voucher-fix.css")).toBeGreaterThan(layout.indexOf("viralio-021d-mobile-refine.css"));
  });

  it("keeps the customer wheel materially larger and prize labels contrast-protected", () => {
    const css = read("src/app/viralio-021b-feedback-refine.css");
    expect(css).toContain("width: min(90vw, 356px)");
    expect(css).toContain("paint-order: stroke fill");
  });

  it("uses the approved referral hierarchy and one WhatsApp action", () => {
    const experience = read("src/ui/merchant-experience.tsx");
    const css = read("src/app/viralio-021e-share-voucher-fix.css");
    expect(experience).toContain("Las buenas noticias también se comparten");
    expect(experience).toContain("Compartí tu regalo con otra persona");
    expect(experience).toContain("La otra persona también recibe un regalo");
    expect(experience).toContain("<small>Enviar</small>");
    expect(experience).toContain('data-testid="whatsapp-share"');
    expect(experience).not.toContain('data-testid="share-poster-preview"');
    expect(experience).not.toContain("Abrí este pase y recibí tu regalo");
    expect(experience).not.toContain('data-testid="whatsapp-status-share"');
    expect(experience).not.toContain('data-testid="instagram-story-share"');
    expect(experience).not.toContain('data-testid="native-share"');
    expect(css).toContain("font-family: var(--font-display)");
    expect(css).toContain("font-size: clamp(1.45rem, 5.8vw, 2rem)");
    expect(css).toContain("text-transform: none");
  });

  it("renders expiration as real visible DOM content", () => {
    const experience = read("src/ui/merchant-experience.tsx");
    const publicReward = read("src/ui/reward-card.tsx");
    expect(experience).toContain('data-testid="reward-expiration"');
    expect(experience).toContain("FECHA DE VENCIMIENTO");
    expect(experience).toContain("Canjealo hasta ese día inclusive.");
    expect(experience).toContain("formatDate(reward.expiresAt)");
    expect(publicReward).toContain('data-testid="public-reward-expiration"');
    expect(publicReward).toContain("FECHA DE VENCIMIENTO");
  });

  it("hard-resets legacy oval reward geometry", () => {
    const css = read("src/app/viralio-021d-mobile-refine.css");
    expect(css).toContain("aspect-ratio: auto !important");
    expect(css).toContain("border-radius: 28px !important");
    expect(css).toContain('experience[data-reward-object="seal"]');
    expect(css).toContain('experience[data-reward-object="medallion"]');
    expect(css).toContain('experience[data-reward-object="token"]');
    expect(css).toContain("background: #211d19 !important");
    expect(css).toContain("color: #fff !important");
  });

  it("keeps the availability badge inside the voucher footer", () => {
    const css = read("src/app/viralio-021e-share-voucher-fix.css");
    expect(css).toContain("position: static !important");
    expect(css).toContain("min-height: 28px !important");
    expect(css).toContain("white-space: nowrap !important");
    expect(css).toContain("overflow: visible !important");
    expect(css).toContain("min-height: 54px !important");
  });

  it("keeps dedicated small-mobile corrections", () => {
    const legacyFix = read("src/app/viralio-021d-mobile-refine.css");
    const finalFix = read("src/app/viralio-021e-share-voucher-fix.css");
    expect(legacyFix).toContain("@media (max-width: 390px)");
    expect(legacyFix).toContain("max-width: 100% !important");
    expect(legacyFix).toContain("border-radius: 24px !important");
    expect(finalFix).toContain("min-height: 88px");
  });
});
