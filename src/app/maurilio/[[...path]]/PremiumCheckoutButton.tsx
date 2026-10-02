"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./maurilio-fallback.module.css";

type Tier = "pro" | "elite";

type CheckoutStatus = {
  enabled: boolean;
  provider: "mercado_pago";
  prices: {
    pro: number | null;
    elite: number | null;
  };
  availability: {
    pro: boolean;
    elite: boolean;
  };
};

function ars(value: number | null) {
  if (value === null) return "";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PremiumCheckoutButton({
  tier,
}: {
  tier: Tier;
}) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/maurilio/api/checkout", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("status_failed");
        return (await response.json()) as CheckoutStatus;
      })
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const price = useMemo(
    () => status?.prices[tier] ?? null,
    [status, tier],
  );

  const available = status?.availability[tier] ?? false;

  async function checkout() {
    if (!status?.enabled || !available || busy) return;
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/maurilio/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const body = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !body.checkoutUrl) {
        if (body.error === "already_unlocked") {
          window.location.reload();
          return;
        }

        if (body.error === "sale_closed" || body.error === "event_started") {
          setMessage("La entrada ya no está disponible.");
        } else if (body.error === "checkout_initializing") {
          setMessage("El checkout ya se está iniciando. Reintentá en unos segundos.");
        } else {
          setMessage("El pago todavía no está disponible.");
        }
        return;
      }

      window.location.assign(body.checkoutUrl);
    } catch {
      setMessage("No pudimos iniciar Mercado Pago.");
    } finally {
      setBusy(false);
    }
  }

  if (!status?.enabled) {
    return (
      <span className={styles.premiumPending}>
        Pago todavía no habilitado
      </span>
    );
  }

  if (!available) {
    return (
      <span className={styles.premiumPending}>
        Venta cerrada
      </span>
    );
  }

  return (
    <div className={styles.checkoutAction}>
      <button type="button" onClick={checkout} disabled={busy}>
        {busy
          ? "Abriendo Mercado Pago…"
          : `Desbloquear ${tier.toUpperCase()}${price ? ` · ${ars(price)}` : ""}`}
      </button>
      <small>Mercado Pago · acceso después de acreditación</small>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
