import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("VIRALIO-020B R2 premium customer funnel", () => {
  it("uses the Soft Prestige campaign, share poster and voucher primitives", () => {
    const experience = source("src/ui/merchant-experience.tsx");
    const prestige = source("src/app/viralio-020b-r2.css");
    expect(experience).toContain('data-design-version="020b-r2"');
    expect(experience).toContain('data-testid="brand-campaign-frame"');
    expect(experience).toContain('data-testid="share-poster-preview"');
    expect(experience).toContain('data-testid="reward-voucher"');
    expect(experience).toContain("Viralio no afirma una publicación que no puede verificar");
    expect(prestige).toContain("Soft Prestige customer funnel");
    expect(prestige).toContain('[data-merchant="joyeria-aurora"]');
    expect(prestige).toContain("--color-surface: #fffaf5 !important");
  });

  it("keeps the shared wheel server-driven while adding stationary premium hardware", () => {
    const wheel = source("src/ui/premium-wheel.tsx");
    expect(wheel).toContain("export const SPIN_TURNS = 9");
    expect(wheel).toContain("export const SPIN_DURATION_MS = 6600");
    expect(wheel).toContain("export const REDUCED_SPIN_DURATION_MS = 1200");
    expect(wheel).toContain('className="wheel-bezel"');
    expect(wheel).toContain('className="wheel-center-cap"');
    expect(wheel).toContain('className="wheel-svg"');
    expect(wheel).toContain("style={{ transform: `rotate(${rotation}deg)` }}");
  });

  it("renders the social card as an editorial poster without revealing a prize", () => {
    const shareCard = source("src/app/api/share-card/[referralToken]/route.ts");
    expect(shareCard).toContain("INVITACIÓN PRIVADA");
    expect(shareCard).toContain("La recompensa de quien comparte permanece oculta");
    expect(shareCard).not.toContain("linear-gradient");
    expect(shareCard).not.toContain("prizeName");
    expect(shareCard).not.toContain("reward.prize");
  });

  it("keeps the public reward card read-only and presents it as an official voucher", () => {
    const rewardCard = source("src/ui/reward-card.tsx");
    expect(rewardCard).toContain('data-testid="public-reward-voucher"');
    expect(rewardCard).toContain("panel seguro del comercio");
    expect(rewardCard).not.toContain("Marcar como canjeado");
  });
});
