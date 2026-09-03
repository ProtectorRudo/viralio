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
    <main className={`experience theme-${merchant.slug}`} style={merchantThemeStyle(merchant)} data-merchant={merchant.slug}>
      <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
      <section className="experience-card public-card">
        <header className="merchant-brand">
          <span className="brand-mark"><MerchantBrandVisual merchant={merchant} mode="mark" size={30} /></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>Tarjeta oficial de premio</small></span>
          <span className="brand-line" aria-hidden="true" />
        </header>
        <div className="stage">
          <div className="reward-seal"><MerchantBrandVisual merchant={merchant} size={40} /><span>Premio<br />Viralio</span></div>
          <p className="eyebrow public-intro">Tu premio en {merchant.theme.shortName}</p>
          <span className={`status-badge status-${initialStatus.toLowerCase()}`} data-testid="reward-status">{labels[initialStatus]}</span>
          <h1>{reward.prizeName}</h1>
          <div className="public-code"><span>Código único</span><strong>{reward.shortCode}</strong><small>Vence el {date(reward.expiresAt)}</small></div>
          <p className="state-message">Presentá esta tarjeta y tu código al equipo de <strong>{merchant.name}</strong>. El canje se confirma únicamente desde el panel seguro del comercio.</p>
        </div>
        <footer className="viralio-signature"><span>Premio administrado por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
