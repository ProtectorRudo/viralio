"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./maurilio-fallback.module.css";

export default function MercadoPagoCallback({
  code,
  state,
  error,
}: {
  code: string;
  state: string;
  error: string;
}) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    error ? "error" : "loading",
  );

  useEffect(() => {
    if (error || !code || !state) {
      setStatus("error");
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/maurilio/api/tipster/payment-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", code, state }),
        });
        setStatus(response.ok ? "success" : "error");
      } catch {
        setStatus("error");
      }
    })();
  }, [code, state, error]);

  return (
    <section className={styles.simpleProductPage}>
      <span>MERCADO PAGO</span>
      {status === "loading" ? (
        <>
          <h1>Conectando tu cuenta…</h1>
          <p>Estamos validando la autorización con Mercado Pago.</p>
        </>
      ) : status === "success" ? (
        <>
          <h1>Cuenta conectada.</h1>
          <p>Ya podés recibir pagos directamente en tu Mercado Pago.</p>
          <Link className={styles.productPrimaryLink} href="/maurilio/para-tipsters">
            Volver al Studio →
          </Link>
        </>
      ) : (
        <>
          <h1>No pudimos conectar Mercado Pago.</h1>
          <p>Volvé al Studio e intentá nuevamente.</p>
          <Link className={styles.productPrimaryLink} href="/maurilio/para-tipsters">
            Volver al Studio →
          </Link>
        </>
      )}
    </section>
  );
}
