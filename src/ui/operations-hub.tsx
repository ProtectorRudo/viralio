"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./operations-hub.module.css";

type OperationsPeriod = "today" | "7d" | "30d" | "all";

interface MerchantOperationsRow {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  createdAt: string | null;
  qrScans: number;
  visits: number;
  starts: number;
  shares: number;
  rewardsIssued: number;
  rewardsRedeemed: number;
  whatsappSaves: number;
  referredSessions: number;
}

interface FunnelStage {
  key: string;
  label: string;
  value: number;
  previous?: number;
}

const PERIOD_OPTIONS: Array<{ value: OperationsPeriod; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "all", label: "Todo" },
];

function experiencePath(slug: string): string {
  return slug === "el-gordo-leo" ? `/${slug}` : `/experiencia/${slug}`;
}

function percent(value: number, base: number): string {
  if (base <= 0) return "—";
  return `${Math.round((value / base) * 100)}%`;
}

function funnelStages(merchant: MerchantOperationsRow): FunnelStage[] {
  return [
    { key: "visit", label: "Entró", value: merchant.visits },
    { key: "start", label: "Empezó", value: merchant.starts, previous: merchant.visits },
    { key: "share", label: "Compartió", value: merchant.shares, previous: merchant.starts },
    { key: "reward", label: "Premio", value: merchant.rewardsIssued, previous: merchant.shares },
    { key: "save", label: "Guardó", value: merchant.whatsappSaves, previous: merchant.rewardsIssued },
    { key: "redeem", label: "Canjeó", value: merchant.rewardsRedeemed, previous: merchant.rewardsIssued },
  ];
}

export function OperationsHub() {
  const [period, setPeriod] = useState<OperationsPeriod>("7d");
  const [merchants, setMerchants] = useState<MerchantOperationsRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MerchantOperationsRow | null>(null);
  const [deleteKey, setDeleteKey] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const totals = useMemo(() => {
    const rows = merchants ?? [];
    return rows.reduce((acc, merchant) => ({
      visits: acc.visits + merchant.visits,
      qrScans: acc.qrScans + merchant.qrScans,
      shares: acc.shares + merchant.shares,
      rewardsRedeemed: acc.rewardsRedeemed + merchant.rewardsRedeemed,
      referredSessions: acc.referredSessions + merchant.referredSessions,
    }), { visits: 0, qrScans: 0, shares: 0, rewardsRedeemed: 0, referredSessions: 0 });
  }, [merchants]);

  const fetchMerchants = useCallback(async (nextPeriod: OperationsPeriod) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/operacion/merchants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ period: nextPeriod }),
      });
      const payload = await response.json() as { merchants?: MerchantOperationsRow[]; error?: string };
      if (!response.ok || !payload.merchants) throw new Error(payload.error ?? "No pudimos cargar los comercios");
      setPeriod(nextPeriod);
      setMerchants(payload.merchants);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void fetchMerchants("7d");
  }, [fetchMerchants]);

  function openDelete(merchant: MerchantOperationsRow) {
    setDeleteTarget(merchant);
    setDeleteKey("");
    setDeleteConfirmation("");
    setDeleteError("");
  }

  function closeDelete() {
    if (deleteBusy) return;
    setDeleteTarget(null);
    setDeleteKey("");
    setDeleteConfirmation("");
    setDeleteError("");
  }

  async function deleteMerchant() {
    if (!deleteTarget) return;
    if (deleteConfirmation.trim() !== deleteTarget.name) {
      setDeleteError("Escribí el nombre exacto del comercio para confirmar.");
      return;
    }
    if (!deleteKey.trim()) {
      setDeleteError("Ingresá la clave de administración.");
      return;
    }

    setDeleteBusy(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/operacion/merchants/${encodeURIComponent(deleteTarget.slug)}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ onboardingKey: deleteKey }),
      });
      const payload = await response.json() as { merchant?: { slug: string }; error?: string };
      if (!response.ok || !payload.merchant) throw new Error(payload.error ?? "No pudimos borrar el comercio");

      setMerchants((current) => current?.filter((merchant) => merchant.slug !== deleteTarget.slug) ?? current);
      closeDelete();
    } catch (reason) {
      setDeleteError((reason as Error).message);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <main className={styles.shell} data-testid="operations-hub">
      <div className={styles.wrap}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Viralio · Operación</p>
            <h1 className={styles.title}>Tus comercios, en un solo lugar.</h1>
            <p className={styles.subtitle}>Vista interna para activar, medir y mejorar cada piloto. El embudo muestra cuántas personas avanzan realmente en cada paso.</p>
          </div>
          <span className={styles.badge}>Uso interno</span>
        </header>

        {merchants === null ? (
          <div className={styles.login}>
            <div>
              <strong>{busy ? "Cargando estadísticas…" : "No pudimos cargar las estadísticas"}</strong>
              <p className={styles.meta}>{busy ? "Estamos reuniendo los datos de tus comercios." : "Podés volver a intentar ahora."}</p>
            </div>
            {!busy && (
              <button className={styles.button} type="button" onClick={() => void fetchMerchants(period)}>Reintentar</button>
            )}
            {error && <p className={styles.error} role="alert">{error}</p>}
          </div>
        ) : (
          <>
            <div className={styles.periodBar}>
              <div>
                <strong>Período</strong>
                <span>El embudo sigue a quienes entraron en ese lapso.</span>
              </div>
              <div className={styles.periodOptions} role="group" aria-label="Período de métricas">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    className={`${styles.periodButton} ${period === option.value ? styles.periodButtonActive : ""}`}
                    data-testid={`operations-period-${option.value}`}
                    key={option.value}
                    type="button"
                    aria-pressed={period === option.value}
                    disabled={busy}
                    onClick={() => void fetchMerchants(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <p className={styles.meta}>QR trazable = entrada registrada mediante /q. Los QR antiguos que apuntaban directo a la experiencia no permiten reconstruir ese escaneo histórico; por eso el embudo usa visitas reales.</p>

            <div className={styles.toolbar}>
              <div className={styles.summary}>
                <span className={styles.summaryItem}><strong>{merchants.length}</strong> comercios</span>
                <span className={styles.summaryItem}><strong>{totals.visits}</strong> visitas</span>
                <span className={styles.summaryItem}><strong>{totals.shares}</strong> compartidos</span>
                <span className={styles.summaryItem}><strong>{totals.referredSessions}</strong> nuevos receptores</span>
                <span className={styles.summaryItem}><strong>{totals.rewardsRedeemed}</strong> canjes</span>
              </div>
              <Link className={styles.newLink} href="/alta">+ Nuevo comercio</Link>
            </div>

            {merchants.length === 0 ? <div className={styles.empty}>Todavía no hay comercios dados de alta.</div> : (
              <section className={styles.grid} data-testid="operations-merchants">
                {merchants.map((merchant) => {
                  const stages = funnelStages(merchant);
                  return (
                    <article className={styles.card} key={merchant.id} data-testid={`operations-merchant-${merchant.slug}`}>
                      <div className={styles.cardTop}>
                        <div><h2 className={styles.name}>{merchant.name}</h2><p className={styles.meta}>{merchant.businessType} · /{merchant.slug}</p></div>
                        <span className={styles.date}>{merchant.createdAt ? `Alta ${new Date(merchant.createdAt).toLocaleDateString("es-AR")}` : "Comercio configurado"}</span>
                      </div>

                      <div className={styles.metrics}>
                        <div className={styles.metric}><strong>{merchant.visits}</strong><span>Visitas</span></div>
                        <div className={styles.metric}><strong>{merchant.shares}</strong><span>Compartidos</span></div>
                        <div className={styles.metric}><strong>{merchant.referredSessions}</strong><span>Receptores</span></div>
                        <div className={styles.metric}><strong>{merchant.rewardsRedeemed}</strong><span>Canjes</span></div>
                      </div>

                      <section className={styles.funnel} data-testid={`funnel-${merchant.slug}`} aria-label={`Embudo de ${merchant.name}`}>
                        <div className={styles.funnelHeader}>
                          <div><p className={styles.eyebrow}>Embudo real</p><strong>¿Dónde se cae la gente?</strong></div>
                          <span>{percent(merchant.rewardsIssued, merchant.starts)} completó hasta premio</span>
                        </div>
                        <div className={styles.funnelGrid}>
                          {stages.map((stage, index) => (
                            <div className={styles.funnelStage} key={stage.key} data-testid={`funnel-${merchant.slug}-${stage.key}`}>
                              <div className={styles.funnelNumber}>{stage.value}</div>
                              <div className={styles.funnelLabel}>{stage.label}</div>
                              {index > 0 && (
                                <div className={styles.funnelRate}>
                                  <strong>{percent(stage.value, stage.previous ?? 0)}</strong>
                                  <span>del paso anterior</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className={styles.funnelNotes}>
                          <span><strong>{percent(merchant.starts, merchant.visits)}</strong> empieza después de entrar</span>
                          <span><strong>{percent(merchant.shares, merchant.starts)}</strong> comparte después de empezar</span>
                          <span><strong>{percent(merchant.rewardsRedeemed, merchant.rewardsIssued)}</strong> de los premios termina en canje</span>
                          <span><strong>{Math.max(0, merchant.visits - merchant.referredSessions)}</strong> entradas iniciales · <strong>{merchant.referredSessions}</strong> por recomendación</span>
                          <span><strong>{merchant.qrScans}</strong> QR trazables</span>
                        </div>
                      </section>

                      <div className={styles.actions}>
                        <Link className={`${styles.action} ${styles.actionPrimary}`} href={`/comercio/${merchant.slug}/canjes`}>Resultados y canjes</Link>
                        <Link className={styles.action} href={`/comercio/${merchant.slug}/activacion`}>Kit</Link>
                        <Link className={styles.action} href={`/comercio/${merchant.slug}/configuracion`}>Configuración</Link>
                        <Link className={styles.action} href={experiencePath(merchant.slug)} target="_blank" rel="noreferrer">Experiencia</Link>
                        <button className={`${styles.action} ${styles.actionDanger}`} type="button" onClick={() => openDelete(merchant)}>Borrar comercio</button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {deleteTarget && (
          <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeDelete();
          }}>
            <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="delete-merchant-title">
              <p className={styles.eyebrow}>Acción protegida</p>
              <h2 id="delete-merchant-title" className={styles.modalTitle}>Borrar {deleteTarget.name}</h2>
              <p className={styles.modalCopy}>
                La página pública dejará de estar disponible y el comercio desaparecerá de Operación. Las métricas históricas se conservan para no perder información.
              </p>

              <label className={styles.modalLabel}>
                Escribí <strong>{deleteTarget.name}</strong> para confirmar
                <input
                  className={styles.input}
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  autoComplete="off"
                />
              </label>

              <label className={styles.modalLabel}>
                Clave de administración
                <input
                  className={styles.input}
                  type="password"
                  value={deleteKey}
                  onChange={(event) => setDeleteKey(event.target.value)}
                  autoComplete="off"
                />
              </label>

              {deleteError && <p className={styles.error} role="alert">{deleteError}</p>}

              <div className={styles.modalActions}>
                <button className={styles.action} type="button" disabled={deleteBusy} onClick={closeDelete}>Cancelar</button>
                <button
                  className={styles.deleteConfirm}
                  type="button"
                  disabled={deleteBusy || deleteConfirmation.trim() !== deleteTarget.name || !deleteKey.trim()}
                  onClick={() => void deleteMerchant()}
                >
                  {deleteBusy ? "Borrando…" : "Borrar comercio"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
