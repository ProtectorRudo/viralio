import Link from "next/link";
import type { Merchant, MerchantMetrics, ShareChannel } from "@/domain/types";
import { BrandIcon } from "@/ui/brand-icon";
import { merchantThemeStyle } from "@/ui/merchant-theme";

const channelLabels: Array<{ channel: ShareChannel; label: string; hint: string }> = [
  { channel: "whatsapp_status", label: "Estado de WhatsApp", hint: "Difusión pública" },
  { channel: "instagram_story", label: "Instagram Stories", hint: "Difusión pública" },
  { channel: "whatsapp", label: "WhatsApp directo", hint: "Conversación" },
  { channel: "native", label: "Otras apps", hint: "Compartir del teléfono" },
  { channel: "social", label: "Red social", hint: "Destino social" },
];

function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function number(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function MerchantDashboard({ merchant, metrics }: { merchant: Merchant; metrics: MerchantMetrics }) {
  const shareRate = percent(metrics.shares, metrics.sessions);
  const referralRate = percent(metrics.referredSessions, metrics.sessions);
  const redemptionRate = percent(metrics.rewardsRedeemed, metrics.rewardsIssued);

  return (
    <main
      className={`experience merchant-dashboard-shell theme-${merchant.slug}`}
      style={merchantThemeStyle(merchant)}
      data-merchant={merchant.slug}
    >
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <section className="experience-card merchant-dashboard-card" data-testid="merchant-dashboard">
        <header className="merchant-brand merchant-dashboard-brand">
          <span className="brand-mark"><span>{merchant.theme.monogram}</span></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>Panel del comercio</small></span>
          <span className="brand-line" aria-hidden="true" />
        </header>

        <div className="merchant-dashboard-content">
          <div className="merchant-dashboard-hero">
            <div>
              <p className="eyebrow">Rendimiento de la experiencia</p>
              <h1>Tu Viralio, en números.</h1>
              <p className="lead">Una vista simple de cuánto participa la gente, cuánto comparte y cuántos premios vuelven al local.</p>
            </div>
            <div className="merchant-dashboard-seal" aria-hidden="true">
              <BrandIcon category={merchant.theme.category} />
              <span>LIVE</span>
            </div>
          </div>

          <nav className="merchant-panel-switch" aria-label="Panel del comercio">
            <span className="merchant-panel-tab is-active" aria-current="page">Resumen</span>
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/canjes`}>Canjes</Link>
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/configuracion`}>Configuración</Link>
            <Link className="merchant-panel-tab" href={`/${merchant.slug}`}>Ver experiencia</Link>
          </nav>

          <section className="merchant-kpi-grid" aria-label="Indicadores principales">
            <article className="merchant-kpi merchant-kpi-primary">
              <span>Participantes</span>
              <strong data-testid="metric-sessions">{number(metrics.sessions)}</strong>
              <small>personas que iniciaron la experiencia</small>
            </article>
            <article className="merchant-kpi">
              <span>Llegaron por referido</span>
              <strong data-testid="metric-referrals">{number(metrics.referredSessions)}</strong>
              <small>{referralRate}% del total</small>
            </article>
            <article className="merchant-kpi">
              <span>Compartieron</span>
              <strong data-testid="metric-shares">{number(metrics.shares)}</strong>
              <small>{shareRate}% de los participantes</small>
            </article>
            <article className="merchant-kpi">
              <span>Premios canjeados</span>
              <strong data-testid="metric-redeemed">{number(metrics.rewardsRedeemed)}</strong>
              <small>{redemptionRate}% de {number(metrics.rewardsIssued)} emitidos</small>
            </article>
          </section>

          <section className="merchant-dashboard-section merchant-funnel-section">
            <div className="merchant-section-heading">
              <div><p className="eyebrow">Embudo Viralio</p><h2>De una visita a una nueva visita</h2></div>
              <span className="merchant-live-pill">Datos reales</span>
            </div>
            <div className="merchant-funnel">
              <div className="merchant-funnel-step"><strong>{number(metrics.sessions)}</strong><span>Participaron</span></div>
              <i aria-hidden="true">→</i>
              <div className="merchant-funnel-step"><strong>{number(metrics.shares)}</strong><span>Compartieron</span></div>
              <i aria-hidden="true">→</i>
              <div className="merchant-funnel-step"><strong>{number(metrics.referredSessions)}</strong><span>Llegaron referidos</span></div>
              <i aria-hidden="true">→</i>
              <div className="merchant-funnel-step"><strong>{number(metrics.rewardsRedeemed)}</strong><span>Canjearon</span></div>
            </div>
          </section>

          <section className="merchant-dashboard-section">
            <div className="merchant-section-heading">
              <div><p className="eyebrow">Difusión</p><h2>Dónde eligen compartir</h2></div>
              <div className="merchant-share-summary"><strong>{shareRate}%</strong><span>tasa de difusión</span></div>
            </div>
            <div className="merchant-channel-list">
              {channelLabels.map(({ channel, label, hint }) => {
                const count = metrics.shareChannels[channel];
                const channelPercent = percent(count, metrics.shares);
                return (
                  <div className="merchant-channel-row" key={channel}>
                    <div className="merchant-channel-copy"><strong>{label}</strong><span>{hint}</span></div>
                    <div className="merchant-channel-track" aria-hidden="true"><span style={{ width: `${channelPercent}%` }} /></div>
                    <div className="merchant-channel-value"><strong>{number(count)}</strong><span>{channelPercent}%</span></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="merchant-dashboard-section merchant-outcome-grid">
            <article><span>Premios emitidos</span><strong>{number(metrics.rewardsIssued)}</strong><small>después de girar la ruleta</small></article>
            <article><span>Guardados en WhatsApp</span><strong>{number(metrics.whatsappSaves)}</strong><small>intención de conservar el premio</small></article>
            <article><span>Tasa de canje</span><strong>{redemptionRate}%</strong><small>premios emitidos que volvieron al local</small></article>
          </section>
        </div>

        <footer className="viralio-signature"><span>Inteligencia de crecimiento por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
