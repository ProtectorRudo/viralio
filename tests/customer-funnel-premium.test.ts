import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("VIRALIO-021F premium customer funnel", () => {
  it("uses editorial campaign, minimal WhatsApp sharing and voucher v3 primitives", () => {
    const experience = source("src/ui/merchant-experience.tsx");
    expect(experience).toContain('data-design-version="021f"');
    expect(experience).toContain('data-testid="brand-campaign-frame"');
    expect(experience).toContain('data-testid="whatsapp-share"');
    expect(experience).toContain('className="referral-primary-title"');
    expect(experience).toContain('aria-label="Las buenas noticias también se comparten"');
    expect(experience).toContain('className="referral-supporting-title">Compartí tu regalo con otra persona</p>');
    expect(experience).toContain("La otra persona también recibe un regalo");
    expect(experience).toContain("<small>Enviar</small>");
    expect(experience).not.toContain('data-testid="share-poster-preview"');
    expect(experience).toContain('className="reward-ticket reward-voucher reward-voucher-v2 reward-voucher-v3"');
    expect(experience).toContain('data-testid="reward-expiration"');
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

  it("keeps referral links free of the sender reward", () => {
    const shareCard = source("src/app/api/share-card/[referralToken]/route.ts");
    expect(shareCard).not.toContain("prizeName");
    expect(shareCard).not.toContain("reward.prize");
  });

  it("keeps the public reward card read-only with an explicit expiration block", () => {
    const rewardCard = source("src/ui/reward-card.tsx");
    expect(rewardCard).toContain('data-testid="public-reward-voucher"');
    expect(rewardCard).toContain('data-testid="public-reward-expiration"');
    expect(rewardCard).toContain("FECHA DE VENCIMIENTO");
    expect(rewardCard).toContain("panel seguro del comercio");
    expect(rewardCard).not.toContain("Marcar como canjeado");
  });
});
