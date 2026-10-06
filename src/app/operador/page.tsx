import Link from "next/link";
import { cookies } from "next/headers";
import { getOperatorMerchantOverviews } from "@/application/operator-service";
import {
  OPERATOR_SESSION_COOKIE,
  verifyOperatorSessionToken,
} from "@/security/merchant-auth";
import { OperatorLogin, OperatorLogout } from "@/ui/operator-access";
import styles from "./operator.module.css";

export const dynamic = "force-dynamic";

const demoSlugs = new Set(["moka", "atlas-barber"]);

function merchantLabel(slug: string, source: "configured" | "onboarding") {
  if (demoSlugs.has(slug)) return "Demo";
  if (slug === "el-gordo-leo") return "Piloto";
  return source === "onboarding" ? "Alta" : "Configurado";
}

function operatorLink(slug: string, destino: string) {
  return `/operador/entrar?slug=${encodeURIComponent(slug)}&destino=${encodeURIComponent(destino)}`;
}

export default async function OperatorPage() {
  const store = await cookies();
  const session = verifyOperatorSessionToken(store.get(OPERATOR_SESSION_COOKIE)?.value);
  if (!session) return <OperatorLogin />;

  const overviews = await getOperatorMerchantOverviews();
  const ordered = [...overviews].sort((left, right) => {
    const demoDelta = Number(demoSlugs.has(left.merchant.slug)) - Number(demoSlugs.has(right.merchant.slug));
    if (demoDelta !== 0) return demoDelta;
    return (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
  });
  const realMerchants = ordered.filter(({ merchant }) => !demoSlugs.has(merchant.slug));
  const totals = realMerchants.reduce((result, item) => ({
    qrScans: result.qrScans + item.metrics.qrScans,
    shares: result.shares + item.metrics.shares,
    rewardsRedeemed: result.rewardsRedeemed + item.metrics.rewardsRedeemed,
  }), { qrScans: 0, shares: 0, rewardsRedeemed: 0 });

  return (
    <main className={styles.shell}>
      <div className={styles.dashboard} data-testid="operator-dashboard">
        <header className={styles.topbar}>
          <div className={styles.brand}><i>V</i><span>Viralio Operador</span></div>
          <OperatorLogout />
        </header>

        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Operación multi-comercio</p>
            <h1>Todo Viralio desde un solo lugar.</h1>
            <p className={styles.heroCopy}>Revisá resultados y entrá a cada comercio sin buscar URLs ni pedir su PIN. Lo importante para vender, medir y operar está acá.</p>
          </div>
          <Link className={styles.primaryAction} href="/alta">+ Nuevo comercio</Link>
        </section>

        <section className={styles.summary} aria-label="Resumen de comercios reales">
          <div className={styles.summaryCard}><span>Comercios</span><strong>{realMerchants.length}</strong></div>
          <div className={styles.summaryCard}><span>Escaneos QR</span><strong>{totals.qrScans}</strong></div>
          <div className={styles.summaryCard}><span>Compartidos</span><strong>{totals.shares}</strong></div>
          <div className={styles.summaryCard}><span>Canjes</span><strong>{totals.rewardsRedeemed}</strong></div>
        </section>

        <section>
          <div className={styles.sectionTitle}>
            <h2>Comercios</h2>
            <p>{ordered.length} cuentas visibles · las demos no suman al resumen</p>
          </div>

          <div className={styles.merchantGrid}>
            {ordered.map(({ merchant, metrics, source }) => (
              <article className={styles.merchantCard} key={merchant.id} data-testid={`operator-merchant-${merchant.slug}`}>
                <div className={styles.merchantHead}>
                  <div
                    className={styles.monogram}
                    style={{ backgroundColor: merchant.theme.palette.primary, color: merchant.theme.palette.onPrimary }}
                  >
                    {merchant.theme.monogram}
                  </div>
                  <div className={styles.merchantIdentity}>
                    <strong>{merchant.theme.displayName}</strong>
                    <small>{merchant.theme.businessType ?? "Comercio"} · /{merchant.slug}</small>
                  </div>
                  <span className={styles.badge}>{merchantLabel(merchant.slug, source)}</span>
                </div>

                <div className={styles.metrics}>
                  <div className={styles.metric}><span>Escaneos</span><strong>{metrics.qrScans}</strong></div>
                  <div className={styles.metric}><span>Inicios</span><strong>{metrics.starts}</strong></div>
                  <div className={styles.metric}><span>Compartidos</span><strong>{metrics.shares}</strong></div>
                  <div className={styles.metric}><span>Premios</span><strong>{metrics.rewardsIssued}</strong></div>
                  <div className={styles.metric}><span>Canjes</span><strong>{metrics.rewardsRedeemed}</strong></div>
                </div>

                <div className={styles.actions}>
                  <a className={styles.action} href={operatorLink(merchant.slug, "panel")}>Métricas</a>
                  <a className={styles.action} href={operatorLink(merchant.slug, "configuracion")}>Configuración</a>
                  <a className={styles.action} href={operatorLink(merchant.slug, "activacion")}>QR y material</a>
                  <a className={styles.action} href={operatorLink(merchant.slug, "canjes")}>Canjes</a>
                  <a className={styles.action} href={`/q/${merchant.slug}`} target="_blank" rel="noreferrer">Ver experiencia</a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
