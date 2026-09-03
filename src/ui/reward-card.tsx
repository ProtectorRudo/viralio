import type { Merchant, Reward, RewardStatus } from "@/domain/types";
import { MerchantBrandVisual } from "@/ui/merchant-brand-visual";
import { merchantThemeStyle } from "@/ui/merchant-theme";

const labels: Record<RewardStatus, string> = { AVAILABLE: "Disponible", REDEEMED: "Canjeado", EXPIRED: "Vencido" };

function date(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(value));
}

export function RewardCard({ reward, merchant, initialStatus }: {
  reward: Reward; merchant: Merchant; initialStatus: RewardStatus;
}) {
  return (
    <main
      className={`experience theme-${merchant.slug}`}
      style={merchantThemeStyle(merchant)}
      data-merchant={merchant.slug}
      data-brand-style={merchant.theme.stylePreset ?? "template"}
      data-design-version="020b"
    >
      <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
      <section className="experience-card public-card premium-public-card">
        <header className="merchant-brand premium-brand-header">
          <span className="brand-mark"><MerchantBrandVisual merchant={merchant} mode="mark" size={30} /></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>Tarjeta oficial de premio</small></span>
          <span className="brand-edition" aria-hidden="true">V / REWARD</span>
        </header>
        <div className="stage public-reward-stage">
          <div className="public-reward-kicker">
            <p className="eyebrow public-intro">Tu premio en {merchant.theme.shortName}</p>
            <span className={`status-badge status-${initialStatus.toLowerCase()}`} data-testid="reward-status">{labels[initialStatus]}</span>
          </div>
          <h1>{reward.prizeName}</h1>
          <div className="public-reward-voucher" data-testid="public-reward-voucher">
            <div className="voucher-head"><span>PREMIO · {merchant.theme.shortName.toUpperCase()}</span><small>V / OFFICIAL</small></div>
            <div className="public-code"><span>Código único</span><strong>{reward.shortCode}</strong></div>
            <div className="public-reward-meta"><small>VENCE · {date(reward.expiresAt)}</small><span className={`status-badge status-${initialStatus.toLowerCase()}`}>{labels[initialStatus]}</span></div>
          </div>
          <p className="state-message">Presentá esta tarjeta y tu código al equipo de <strong>{merchant.name}</strong>. El canje se confirma únicamente desde el panel seguro del comercio.</p>
        </div>
        <footer className="viralio-signature premium-signature"><span>Premio administrado por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
