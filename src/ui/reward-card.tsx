import type { Merchant, Reward, RewardStatus } from "@/domain/types";
import { MerchantBrandVisual } from "@/ui/merchant-brand-visual";
import { brandRenderDataAttributes } from "@/ui/brand-render-contract";
import { merchantThemeStyle } from "@/ui/merchant-theme";

const labels: Record<RewardStatus, string> = { AVAILABLE: "Disponible", REDEEMED: "Canjeado", EXPIRED: "Vencido" };

function date(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
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
      data-design-version="021c"
      {...brandRenderDataAttributes(merchant.theme)}
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

          <article className="public-reward-voucher reward-voucher-v2" data-testid="public-reward-voucher">
            <header className="voucher-v2-head">
              <div className="voucher-v2-brand"><MerchantBrandVisual merchant={merchant} mode="mark" size={28} /><span>{merchant.theme.shortName}</span></div>
              <span className="voucher-v2-type">CUPÓN DE REGALO</span>
            </header>

            <section className="voucher-v2-prize">
              <span className="voucher-v2-label">TU REGALO</span>
              <strong>{reward.prizeName}</strong>
              <small>Presentá este cupón para canjearlo.</small>
            </section>

            <div className="voucher-v2-divider" aria-hidden="true"><span /></div>

            <section className="voucher-v2-details">
              <div className="voucher-v2-detail voucher-v2-code">
                <span>CÓDIGO DE CANJE</span>
                <strong>{reward.shortCode}</strong>
              </div>
              <div className="voucher-v2-detail voucher-v2-expiration" data-testid="public-reward-expiration">
                <span>FECHA DE VENCIMIENTO</span>
                <strong>{date(reward.expiresAt)}</strong>
                <small>Canjealo hasta ese día inclusive.</small>
              </div>
            </section>

            <footer className="voucher-v2-foot">
              <span className={`status-badge status-${initialStatus.toLowerCase()}`}>{labels[initialStatus]}</span>
              <small>Premio único · protegido por Viralio</small>
            </footer>
          </article>

          <p className="state-message">Presentá esta tarjeta y tu código al equipo de <strong>{merchant.name}</strong>. El canje se confirma únicamente desde el panel seguro del comercio.</p>
        </div>
        <footer className="viralio-signature premium-signature"><span>Premio administrado por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
