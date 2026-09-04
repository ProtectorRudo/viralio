import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("VIRALIO-020B premium customer funnel", () => {
  it("uses editorial campaign, share poster and voucher primitives", () => {
    const experience = source("src/ui/merchant-experience.tsx");
    expect(experience).toContain('data-design-version="020b"');
    expect(experience).toContain('data-testid="brand-campaign-frame"');
    expect(experience).toContain('data-testid="share-poster-preview"');
    expect(experience).toContain('data-testid="reward-voucher"');
    expect(experience).toContain("Viralio no afirma una publicación que no puede verificar");
  });

  it("keeps the shared wheel server-driven while adding stationary premium hardware", () => {
    const wheel = source("src/ui/premium-wheel.tsx");
    expect(wheel).toContain("export const SPIN_TURNS = 9");
    expect(wheel).toContain("export const SPIN_DURATION_MS = 5600");
    expect(wheel).toContain('className="wheel-bezel"');
    expect(wheel).toContain('className="wheel-center-cap"');
    expect(wheel).toContain('className="wheel-svg"');
    expect(wheel).toContain("style={{ transform: `rotate(${rotation}deg)` }}");
  });

  it("renders the social card from validated layouts without revealing a prize", () => {
    const shareCard = source("src/app/api/share-card/[referralToken]/route.ts");
    const layouts = source("src/brand/share-card-layout.ts");
    expect(shareCard).toContain("shareCardLayout(merchant.theme)");
    expect(layouts).toContain("INVITACIÓN PRIVADA");
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
