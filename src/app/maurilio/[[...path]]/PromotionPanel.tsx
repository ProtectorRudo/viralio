"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./maurilio-fallback.module.css";

type PromotionStatus = {
  configured: boolean;
  provider: string;
  dailyPriceArs: number | null;
  allowedDays: number[];
};

function ars(value: number | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PromotionPanel({
  hasProfile,
}: {
  hasProfile: boolean;
}) {
  const [status, setStatus] = useState<PromotionStatus | null>(null);
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/maurilio/api/promotions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("status_failed");
        return (await response.json()) as PromotionStatus;
      })
      .then((data) => {
        if (!cancelled) {
          setStatus(data);
          if (data.allowedDays.includes(7)) setDays(7);
          else if (data.allowedDays[0]) setDays(data.allowedDays[0]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({
            configured: false,
            provider: "mercado_pago",
            dailyPriceArs: null,
            allowedDays: [3, 7, 14, 30],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(() => {
    if (!status?.dailyPriceArs) return null;
    return status.dailyPriceArs * days;
  }, [days, status]);

  async function promote() {
    if (!hasProfile || !status?.configured || busy) return;

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/maurilio/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign("/maurilio/ingresar?tipo=tipster");
        return;
      }

      if (!response.ok || !body.checkoutUrl) {
        setMessage(
          body.error === "promotion_initializing"
            ? "Ya hay una campaña iniciándose."
            : "No pudimos iniciar la promoción.",
        );
        return;
      }

      window.location.assign(body.checkoutUrl);
    } catch {
      setMessage("No pudimos conectar con Mercado Pago.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.promotionPanel}>
      <div className={styles.studioCardTitle}>
        <span>03</span>
        <div>
          <b>Promocionar perfil</b>
          <p>Publicidad interna, siempre identificada como Patrocinado.</p>
        </div>
      </div>

      <div className={styles.promotionExplain}>
        <b>Subís arriba. No comprás reputación.</b>
        <p>
          La campaña sólo aumenta visibilidad. ROI, CLV, historial y posición
          orgánica siguen saliendo de resultados reales.
        </p>
      </div>

      <div className={styles.promotionDurations}>
        {(status?.allowedDays ?? [3, 7, 14, 30]).map((value) => (
          <button
            type="button"
            key={value}
            className={days === value ? styles.promotionDurationActive : undefined}
            onClick={() => setDays(value)}
          >
            {value} días
          </button>
        ))}
      </div>

      <div className={styles.promotionPrice}>
        <div>
          <span>TOTAL</span>
          <b>{total === null ? "—" : ars(total)}</b>
        </div>
        <small>
          {status?.dailyPriceArs
            ? `${ars(status.dailyPriceArs)} por día`
            : "Precio todavía no configurado"}
        </small>
      </div>

      <button
        type="button"
        className={styles.studioSecondary}
        disabled={!hasProfile || !status?.configured || busy}
        onClick={promote}
      >
        {busy
          ? "Abriendo Mercado Pago…"
          : status?.configured
            ? "Promocionar perfil"
            : "Publicidad próximamente"}
      </button>

      {!hasProfile ? (
        <p className={styles.studioHelp}>
          Primero guardá tu perfil público.
        </p>
      ) : null}

      {message ? <p className={styles.studioMessage}>{message}</p> : null}
    </div>
  );
}
