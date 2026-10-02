"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./maurilio-fallback.module.css";

export default function SubscribeButton({
  slug,
  enabled,
}: {
  slug: string;
  enabled: boolean;
}) {
  const [configured, setConfigured] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void fetch("/maurilio/api/subscriptions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("status_failed");
        return (await response.json()) as { configured?: boolean };
      })
      .then((data) => {
        if (!cancelled) setConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe() {
    if (!enabled || !configured || busy) return;
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/maurilio/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipsterSlug: slug }),
      });

      const body = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (response.status === 401) {
        router.push("/maurilio/ingresar");
        return;
      }

      if (!response.ok || !body.checkoutUrl) {
        if (body.error === "subscription_already_active") {
          setMessage("Ya tenés acceso vigente a este tipster.");
        } else if (body.error === "tipster_payment_account_required") {
          setMessage("Este tipster todavía no habilitó sus cobros.");
        } else if (body.error === "seller_payment_account_reconnect_required") {
          setMessage("El tipster necesita reconectar Mercado Pago.");
        } else {
          setMessage("No pudimos abrir el pago.");
        }
        return;
      }

      window.location.assign(body.checkoutUrl);
    } catch {
      setMessage("No pudimos conectar con Mercado Pago.");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return <button type="button" disabled>Acceso no disponible</button>;
  }

  if (loadingStatus) {
    return <button type="button" disabled>Cargando…</button>;
  }

  if (!configured) {
    return <button type="button" disabled>Pagos próximamente</button>;
  }

  return (
    <>
      <button type="button" onClick={subscribe} disabled={busy}>
        {busy ? "Abriendo Mercado Pago…" : "Comprar 30 días"}
      </button>
      <small className={styles.subscribeNote}>
        Pago único · sin débito automático
      </small>
      {message ? <p className={styles.subscribeMessage}>{message}</p> : null}
    </>
  );
}
