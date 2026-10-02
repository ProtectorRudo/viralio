"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./maurilio-fallback.module.css";

type SubscriptionRow = {
  id?: string;
  status?: string;
  monthly_price_ars?: number | string;
  current_period_end?: string | null;
  last_payment_at?: string | null;
  tipster?: {
    id?: string;
    slug?: string;
    display_name?: string;
    headline?: string | null;
    avatar_url?: string | null;
  } | null;
};

type TipRow = {
  public_id?: string;
  sport?: string;
  competition?: string;
  event?: string;
  market?: string;
  selection?: string;
  bookmaker?: string;
  entry_odds?: number | string;
  stake_units?: number | string;
  event_start_at?: string;
  content_hash?: string;
  odds_captured_at?: string | null;
  tipster?: {
    slug?: string;
    display_name?: string;
  } | null;
};

function ars(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function dateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function activeAccess(item: SubscriptionRow, now: number) {
  if (item.status !== "active" || !item.current_period_end) return false;
  const end = new Date(item.current_period_end).getTime();
  return Number.isFinite(end) && end > now;
}

function odds(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? `@${n.toFixed(2)}` : "—";
}

function stake(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}u` : "—";
}

export default function SubscriptionsView() {
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [tips, setTips] = useState<TipRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [renderNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetch("/maurilio/api/subscriptions?view=mine", { cache: "no-store" }),
      fetch("/maurilio/api/feed", { cache: "no-store" }),
    ])
      .then(async ([subscriptionsResponse, feedResponse]) => {
        if (cancelled) return;

        if (subscriptionsResponse.status === 401 || feedResponse.status === 401) {
          setUnauthenticated(true);
          return;
        }

        if (subscriptionsResponse.ok) {
          const body = (await subscriptionsResponse.json()) as {
            subscriptions?: SubscriptionRow[];
          };
          setSubscriptions(body.subscriptions ?? []);
        }

        if (feedResponse.ok) {
          const body = (await feedResponse.json()) as { tips?: TipRow[] };
          setTips(body.tips ?? []);
        }

        if (!subscriptionsResponse.ok || !feedResponse.ok) {
          setMessage("No pudimos cargar toda tu cuenta.");
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("No pudimos conectar con tu cuenta.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = useMemo(
    () => subscriptions.filter((item) => activeAccess(item, renderNow)).length,
    [renderNow, subscriptions],
  );

  if (loading) {
    return (
      <section className={styles.simpleProductPage}>
        <span>MI CUENTA</span>
        <h1>Cargando tus accesos…</h1>
      </section>
    );
  }

  if (unauthenticated) {
    return (
      <section className={styles.simpleProductPage}>
        <span>MI CUENTA</span>
        <h1>Ingresá para ver tus tipsters.</h1>
        <p>Tus accesos y tips privados sólo se muestran dentro de tu cuenta.</p>
        <Link className={styles.productPrimaryLink} href="/maurilio/ingresar">
          Ingresar →
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.subscriptionsView}>
      <div className={styles.subscriptionsHero}>
        <span>MI CUENTA</span>
        <h1>Mis accesos.</h1>
        <p>{activeCount} activos · {tips.length} tips futuros desbloqueados.</p>
      </div>

      <div className={styles.subscriptionSection}>
        <div className={styles.tipsterSectionTitle}>
          <div>
            <span>ACCESOS</span>
            <h2>Tipsters que seguís</h2>
          </div>
          <p>Cada compra habilita 30 días. No hay débito automático.</p>
        </div>

        {subscriptions.length > 0 ? (
          <div className={styles.subscriptionList}>
            {subscriptions.map((subscription, index) => {
              const tipster = subscription.tipster;
              const slug = typeof tipster?.slug === "string" ? tipster.slug : null;
              const active = activeAccess(subscription, renderNow);
              const pending = subscription.status === "pending";

              return (
                <article
                  className={styles.subscriptionCard}
                  key={subscription.id ?? String(index)}
                >
                  <div>
                    <span>{active ? "ACTIVO" : pending ? "PAGO PENDIENTE" : "VENCIDO"}</span>
                    <h3>{tipster?.display_name ?? "Tipster"}</h3>
                    <p>{tipster?.headline ?? "Perfil de Maurilio"}</p>
                  </div>

                  <div className={styles.subscriptionMeta}>
                    <div>
                      <span>PRECIO</span>
                      <b>{ars(subscription.monthly_price_ars)} · 30 días</b>
                    </div>
                    <div>
                      <span>{active ? "ACCESO HASTA" : "ÚLTIMO PERÍODO"}</span>
                      <b>{dateTime(subscription.current_period_end)}</b>
                    </div>
                  </div>

                  <div className={styles.subscriptionActions}>
                    {slug ? (
                      <Link href={`/maurilio/tipsters/${slug}`}>
                        {active || pending ? "Ver perfil →" : "Renovar →"}
                      </Link>
                    ) : null}
                    {active ? <span>Sin débito automático</span> : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.tipsterEmpty}>
            <b>Todavía no seguís a ningún tipster.</b>
            <p>Explorá perfiles y elegí por historial, no por promesas.</p>
            <Link className={styles.inlineAction} href="/maurilio">
              Explorar tipsters →
            </Link>
          </div>
        )}
      </div>

      <div className={styles.subscriptionSection}>
        <div className={styles.tipsterSectionTitle}>
          <div>
            <span>FEED PRIVADO</span>
            <h2>Tips futuros</h2>
          </div>
          <p>Sólo aparecen picks con acceso vigente y antes del inicio del evento.</p>
        </div>

        {tips.length > 0 ? (
          <div className={styles.privateTipList}>
            {tips.map((tip, index) => (
              <article
                className={styles.privateTipCard}
                key={tip.public_id ?? String(index)}
              >
                <div className={styles.privateTipTop}>
                  <div>
                    <span>
                      {tip.tipster?.display_name ?? "Tipster"} ·{" "}
                      {tip.competition ?? tip.sport ?? "Evento"}
                    </span>
                    <h3>{tip.event ?? "—"}</h3>
                  </div>
                  <b>{dateTime(tip.event_start_at)}</b>
                </div>

                <div className={styles.privateTipSelection}>
                  <div>
                    <span>{tip.market ?? "Mercado"}</span>
                    <b>{tip.selection ?? "—"}</b>
                  </div>
                  <strong>{odds(tip.entry_odds)}</strong>
                </div>

                <div className={styles.privateTipMeta}>
                  <div><span>STAKE</span><b>{stake(tip.stake_units)}</b></div>
                  <div><span>BOOKMAKER</span><b>{tip.bookmaker ?? "Bet365"}</b></div>
                  <div><span>CAPTURA</span><b>{dateTime(tip.odds_captured_at)}</b></div>
                </div>

                {tip.content_hash ? (
                  <small>HASH {tip.content_hash.slice(0, 12).toUpperCase()}…</small>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.tipsterEmpty}>
            <b>No hay tips futuros desbloqueados.</b>
            <p>Puede que tus tipsters no tengan picks abiertos en este momento.</p>
          </div>
        )}
      </div>

      {message ? <p className={styles.studioMessage}>{message}</p> : null}
    </section>
  );
}
