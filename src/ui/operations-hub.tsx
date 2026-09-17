"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import styles from "./operations-hub.module.css";

interface MerchantOperationsRow {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  createdAt: string;
  qrScans: number;
  starts: number;
  shares: number;
  rewardsIssued: number;
  rewardsRedeemed: number;
  whatsappSaves: number;
  referredSessions: number;
}

function experiencePath(slug: string): string {
  return slug === "el-gordo-leo" ? `/${slug}` : `/experiencia/${slug}`;
}

export function OperationsHub() {
  const [key, setKey] = useState("");
  const [merchants, setMerchants] = useState<MerchantOperationsRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const rows = merchants ?? [];
    return rows.reduce((acc, merchant) => ({
      qrScans: acc.qrScans + merchant.qrScans,
      shares: acc.shares + merchant.shares,
      rewardsRedeemed: acc.rewardsRedeemed + merchant.rewardsRedeemed,
    }), { qrScans: 0, shares: 0, rewardsRedeemed: 0 });
  }, [merchants]);

  async function load(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/operacion/merchants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ onboardingKey: key }),
      });
      const payload = await response.json() as { merchants?: MerchantOperationsRow[]; error?: string };
      if (!response.ok || !payload.merchants) throw new Error(payload.error ?? "No pudimos cargar los comercios");
      setMerchants(payload.merchants);
    } catch (reason) {
      setError((reason as Error).message);
      setMerchants(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell} data-testid="operations-hub">
      <div className={styles.wrap}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Viralio · Operación</p>
            <h1 className={styles.title}>Tus comercios, en un solo lugar.</h1>
            <p className={styles.subtitle}>Vista interna para activar, revisar y acompañar pilotos sin perder tiempo saltando entre enlaces.</p>
          </div>
          <span className={styles.badge}>Uso interno</span>
        </header>

        {merchants === null ? (
          <form className={styles.login} onSubmit={load}>
            <div>
              <strong>Ingresá con la clave de alta</strong>
              <p className={styles.meta}>No se muestran datos de comercios hasta validar la clave privada.</p>
            </div>
            <div className={styles.loginRow}>
              <input className={styles.input} data-testid="operations-key" type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Clave privada" autoComplete="off" required />
              <button className={styles.button} data-testid="operations-submit" disabled={busy} type="submit">{busy ? "Cargando…" : "Entrar"}</button>
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </form>
        ) : (
          <>
            <div className={styles.toolbar}>
              <div className={styles.summary}>
                <span className={styles.summaryItem}><strong>{merchants.length}</strong> comercios</span>
                <span className={styles.summaryItem}><strong>{totals.qrScans}</strong> escaneos</span>
                <span className={styles.summaryItem}><strong>{totals.shares}</strong> compartidos</span>
                <span className={styles.summaryItem}><strong>{totals.rewardsRedeemed}</strong> canjes</span>
              </div>
              <Link className={styles.newLink} href="/alta">+ Nuevo comercio</Link>
            </div>

            {merchants.length === 0 ? <div className={styles.empty}>Todavía no hay comercios dados de alta.</div> : (
              <section className={styles.grid} data-testid="operations-merchants">
                {merchants.map((merchant) => (
                  <article className={styles.card} key={merchant.id} data-testid={`operations-merchant-${merchant.slug}`}>
                    <div className={styles.cardTop}>
                      <div><h2 className={styles.name}>{merchant.name}</h2><p className={styles.meta}>{merchant.businessType} · /{merchant.slug}</p></div>
                      <span className={styles.date}>Alta {new Date(merchant.createdAt).toLocaleDateString("es-AR")}</span>
                    </div>
                    <div className={styles.metrics}>
                      <div className={styles.metric}><strong>{merchant.qrScans}</strong><span>Escaneos</span></div>
                      <div className={styles.metric}><strong>{merchant.shares}</strong><span>Compartidos</span></div>
                      <div className={styles.metric}><strong>{merchant.rewardsIssued}</strong><span>Premios</span></div>
                      <div className={styles.metric}><strong>{merchant.rewardsRedeemed}</strong><span>Canjes</span></div>
                    </div>
                    <div className={styles.actions}>
                      <Link className={`${styles.action} ${styles.actionPrimary}`} href={`/comercio/${merchant.slug}/canjes`}>Resultados y canjes</Link>
                      <Link className={styles.action} href={`/comercio/${merchant.slug}/activacion`}>Kit</Link>
                      <Link className={styles.action} href={`/comercio/${merchant.slug}/configuracion`}>Configuración</Link>
                      <Link className={styles.action} href={experiencePath(merchant.slug)} target="_blank" rel="noreferrer">Experiencia</Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
