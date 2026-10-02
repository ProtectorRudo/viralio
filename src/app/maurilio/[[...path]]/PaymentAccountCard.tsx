"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./maurilio-fallback.module.css";

type Status = {
  configured?: boolean;
  connected?: boolean;
};

export default function PaymentAccountCard({
  onChange,
}: {
  onChange?: (connected: boolean) => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await fetch("/maurilio/api/tipster/payment-account", {
        cache: "no-store",
      });

      if (cancelled) return;

      if (response.status === 401) {
        router.push("/maurilio/ingresar");
        return;
      }

      if (!response.ok) {
        setStatus({ configured: false, connected: false });
        onChange?.(false);
        return;
      }

      const data = await response.json() as Status;
      if (cancelled) return;
      setStatus(data);
      onChange?.(Boolean(data.connected));
    })();

    return () => {
      cancelled = true;
    };
  }, [onChange, router]);

  async function connect() {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/maurilio/api/tipster/payment-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const body = await response.json() as {
        authorizationUrl?: string;
        error?: string;
      };

      if (!response.ok || !body.authorizationUrl) {
        setMessage(
          body.error === "marketplace_payments_not_configured"
            ? "La conexión de Mercado Pago todavía no está habilitada."
            : "No pudimos iniciar la conexión.",
        );
        return;
      }

      if (!/^https:\/\/auth\.mercadopago\.com\.ar\//i.test(body.authorizationUrl)) {
        setMessage("Mercado Pago devolvió una URL inválida.");
        return;
      }

      window.location.assign(body.authorizationUrl);
    } catch {
      setMessage("No pudimos iniciar la conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("¿Desconectar Mercado Pago de tu perfil?")) return;
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/maurilio/api/tipster/payment-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });

      if (!response.ok) {
        setMessage("No pudimos desconectar Mercado Pago.");
        return;
      }

      setStatus((current) => ({ ...current, connected: false }));
      onChange?.(false);
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return (
      <div className={styles.studioCard}>
        <b>Cargando cobros…</b>
      </div>
    );
  }

  return (
    <div className={styles.studioCard}>
      <div className={styles.studioCardTitle}>
        <span>02</span>
        <div>
          <b>Mercado Pago</b>
          <p>Los cobros van directo a tu propia cuenta.</p>
        </div>
      </div>

      <p className={styles.studioHelp}>
        {status.connected
          ? "Conectado. Maurilio recibe únicamente su comisión."
          : status.configured === false
            ? "La conexión todavía no está habilitada por Maurilio."
            : "Conectá tu cuenta antes de habilitar ventas."}
      </p>

      {status.connected ? (
        <button
          type="button"
          className={styles.studioSecondary}
          onClick={() => void disconnect()}
          disabled={busy}
        >
          {busy ? "Guardando…" : "Desconectar"}
        </button>
      ) : (
        <button
          type="button"
          className={styles.studioSecondary}
          onClick={() => void connect()}
          disabled={busy || status.configured === false}
        >
          {busy ? "Abriendo…" : "Conectar Mercado Pago"}
        </button>
      )}

      {message ? <p className={styles.studioMessage}>{message}</p> : null}
    </div>
  );
}
