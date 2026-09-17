import Link from "next/link";
import type { MerchantQrFunnel } from "@/analytics/qr-attribution";
import { merchantExperiencePath } from "@/config/merchant-accounts";
import type { Merchant, MerchantMetrics, ShareChannel } from "@/domain/types";
import { BrandIcon } from "@/ui/brand-icon";
import { merchantThemeStyle } from "@/ui/merchant-theme";

const channelLabels: Array<{ channel: ShareChannel; label: string; hint: string }> = [
  { channel: "whatsapp_status", label: "Estado de WhatsApp", hint: "Difusión pública" },
  { channel: "instagram_story", label: "Instagram Stories", hint: "Difusión pública" },
  { channel: "whatsapp", label: "WhatsApp directo", hint: "Recomendación a otra persona" },
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

function drop(previous: number, current: number): number {
  return Math.max(0, previous - current);
}

export function MerchantDashboard({
  merchant,
  metrics,
  qrFunnel,
}: {
  merchant: Merchant;
  metrics: MerchantMetrics;
  qrFunnel: MerchantQrFunnel;
}) {
  const whatsappOnly = merchant.theme.shareMode === "whatsapp_only";
  const shareRate = percent(metrics.shares, metrics.starts);
  const referralRate = percent(metrics.referredSessions, metrics.sessions);
  const redemptionRate = percent(metrics.rewardsRedeemed, metrics.rewardsIssued);
  const qrArrivalRate = percent(qrFunnel.visitors, qrFunnel.scans);
  const qrStartRate = percent(qrFunnel.started, qrFunnel.visitors);
  const qrShareRate = percent(qrFunnel.shared, qrFunnel.started);
  const qrRewardRate = percent(qrFunnel.rewarded, qrFunnel.shared);
  const qrSaveRate = percent(qrFunnel.saved, qrFunnel.rewarded);
  const qrRedeemRate = percent(qrFunnel.redeemed, qrFunnel.rewarded);
  const visibleChannels = whatsappOnly
    ? channelLabels.filter(({ channel }) => channel === "whatsapp")
    : channelLabels;

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
              <p className="lead">Cuánta gente escanea, recomienda tu negocio, llega recomendada y usa sus premios.</p>
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
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/activacion`}>Activación</Link>
            <Link className="merchant-panel-tab" href={merchantExperiencePath(merchant.slug)}>Ver experiencia</Link>
          </nav>

          <section className="merchant-kpi-grid" aria-label="Indicadores principales">
            <article className="merchant-kpi merchant-kpi-primary">
              <span>Escaneos del QR</span>
              <strong data-testid="metric-qr-scans">{number(metrics.qrScans)}</strong>
              <small>entradas desde el QR físico del comercio</small>
            </article>
            <article className="merchant-kpi">
              <span>{whatsappOnly ? "Compartieron por WhatsApp" : "Compartieron"}</span>
              <strong data-testid="metric-shares">{number(metrics.shares)}</strong>
              <small>{shareRate}% de quienes iniciaron</small>
            </article>
            <article className="merchant-kpi">
              <span>Llegaron recomendados</span>
              <strong data-testid="metric-referrals">{number(metrics.referredSessions)}</strong>
              <small>{referralRate}% de las visitas registradas</small>
            </article>
            <article className="merchant-kpi">
              <span>Premios canjeados</span>
              <strong data-testid="metric-redeemed">{number(metrics.rewardsRedeemed)}</strong>
              <small>{redemptionRate}% de {number(metrics.rewardsIssued)} emitidos</small>
            </article>
          </section>

          <section className="merchant-dashboard-section merchant-funnel-section">
            <div className="merchant-section-heading">
              <div>
                <p className="eyebrow">Embudo QR atribuido</p>
                <h2>Dónde avanzan y dónde se pierden.</h2>
              </div>
              <span className="merchant-live-pill">{number(qrFunnel.scans)} escaneos medibles</span>
            </div>
            <div className="merchant-funnel">
              <div className="merchant-funnel-step">
                <strong data-testid="metric-funnel-qr-visitors">{number(qrFunnel.visitors)}</strong>
                <span>Entraron desde QR</span>
                <span>{qrArrivalRate}% de escaneos</span>
              </div>
              <i aria-hidden="true">→</i>
              <div className="merchant-funnel-step">
                <strong data-testid="metric-funnel-started">{number(qrFunnel.started)}</strong>
                <span>Iniciaron</span>
                <span>{qrStartRate}% avanzó · {number(drop(qrFunnel.visitors, qrFunnel.started))} abandonos</span>
              </div>
              <i aria-hidden="true">→</i>
              <div className="merchant-funnel-step">
                <strong data-testid="metric-funnel-shared">{number(qrFunnel.shared)}</strong>
                <span>Compartieron</span>
                <span>{qrShareRate}% avanzó · {number(drop(qrFunnel.started, qrFunnel.shared))} abandonos</span>
              </div>
              <i aria-hidden="true">→</i>
              <div className="merchant-funnel-step">
                <strong data-testid="metric-funnel-rewarded">{number(qrFunnel.rewarded)}</strong>
                <span>Obtuvieron premio</span>
                <span>{qrRewardRate}% completó · {number(drop(qrFunnel.shared, qrFunnel.rewarded))} abandonos</span>
              </div>
            </div>
          </section>

          <section className="merchant-dashboard-section merchant-outcome-grid" aria-label="Resultados del embudo QR">
            <article>
              <span>Guardaron su premio</span>
              <strong data-testid="metric-funnel-saved">{number(qrFunnel.saved)}</strong>
              <small>{qrSaveRate}% de quienes obtuvieron premio</small>
            </article>
            <article>
              <span>Volvieron y canjearon</span>
              <strong data-testid="metric-funnel-redeemed">{number(qrFunnel.redeemed)}</strong>
              <small>{qrRedeemRate}% de quienes obtuvieron premio</small>
            </article>
            <article>
              <span>Nuevos receptores</span>
              <strong>{number(metrics.referredSessions)}</strong>
              <small>personas que entraron desde una recomendación</small>
            </article>
          </section>

          <section className="merchant-dashboard-section">
            <div className="merchant-section-heading">
              <div>
                <p className="eyebrow">{whatsappOnly ? "Recomendaciones" : "Difusión"}</p>
                <h2>{whatsappOnly ? "WhatsApp es tu canal de crecimiento" : "Dónde eligen compartir"}</h2>
              </div>
              <div className="merchant-share-summary"><strong>{shareRate}%</strong><span>tasa sobre quienes iniciaron</span></div>
            </div>
            <div className="merchant-channel-list">
              {visibleChannels.map(({ channel, label, hint }) => {
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
            <article><span>Personas que iniciaron</span><strong data-testid="metric-starts">{number(metrics.starts)}</strong><small>todas las fuentes de tráfico</small></article>
            <article><span>Premios emitidos</span><strong>{number(metrics.rewardsIssued)}</strong><small>beneficios realmente generados</small></article>
            <article><span>Guardados en WhatsApp</span><strong>{number(metrics.whatsappSaves)}</strong><small>intención total de conservar el premio</small></article>
          </section>
        </div>

        <footer className="viralio-signature"><span>Inteligencia de crecimiento por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
