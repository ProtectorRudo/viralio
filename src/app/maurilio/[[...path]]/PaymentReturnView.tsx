"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./maurilio-fallback.module.css";

type Tier = "pro" | "elite";
type PaymentState = "success" | "pending" | "failure";

type AccessStatus = {
  matchday: string | null;
  pro: boolean;
  elite: boolean;
  activeEntitlements: number;
};

export default function PaymentReturnView({
  state,
  tier,
}: {
  state: PaymentState;
  tier: string | undefined;
}) {
  const validTier: Tier | null =
    tier === "pro" || tier === "elite" ? tier : null;
  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [checks, setChecks] = useState(0);

  const unlocked = useMemo(() => {
    if (!validTier || !access) return false;
    return access[validTier];
  }, [access, validTier]);

  useEffect(() => {
    if (state === "failure" || !validTier) return;

    let cancelled = false;
    let timer: number | null = null;

    async function verify() {
      try {
        const response = await fetch("/maurilio/api/access", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = (await response.json()) as AccessStatus;
          if (!cancelled) {
            setAccess(data);
            setChecks((value) => value + 1);
            if (data[validTier!]) return;
          }
        }
      } catch {
        // Keep polling briefly. The webhook may still be processing.
      }

      if (!cancelled) {
        timer = window.setTimeout(verify, 1500);
      }
    }

    void verify();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [state, validTier]);

  if (state === "failure") {
    return (
      <section className={styles.paymentReturn}>
        <span>PAYMENT NOT COMPLETED</span>
        <h1>No se desbloqueó ningún informe.</h1>
        <p>
          No mostramos contenido premium sin acreditación confirmada por
          Mercado Pago.
        </p>
        <Link href="/maurilio">Volver al Matchday →</Link>
      </section>
    );
  }

  if (!validTier) {
    return (
      <section className={styles.paymentReturn}>
        <span>INVALID RETURN</span>
        <h1>No pudimos identificar el informe.</h1>
        <Link href="/maurilio/mis-informes">Ir a Mis informes →</Link>
      </section>
    );
  }

  if (unlocked && access?.matchday) {
    const params = new URLSearchParams({
      tier: validTier,
      matchday: access.matchday,
    });

    return (
      <section className={styles.paymentReturn}>
        <span>PAYMENT VERIFIED</span>
        <h1>Acceso acreditado.</h1>
        <p>
          El pronóstico sigue oculto. El siguiente paso es el penal.
        </p>
        <Link
          className={styles.paymentPrimary}
          href={`/maurilio/informe?${params.toString()}`}
        >
          Patear para revelar →
        </Link>
        <Link href="/maurilio/mis-informes">Ver Mis informes</Link>
      </section>
    );
  }

  return (
    <section className={styles.paymentReturn}>
      <span>{state === "pending" ? "PAYMENT PENDING" : "VERIFYING PAYMENT"}</span>
      <h1>Esperando acreditación.</h1>
      <p>
        El informe permanece bloqueado hasta que el webhook firmado confirme el
        pago. Podés dejar esta pantalla abierta o revisar Mis informes después.
      </p>
      <div className={styles.paymentPulse}>
        <i />
        <b>{checks > 0 ? "Verificando acceso…" : "Conectando…"}</b>
      </div>
      <Link href="/maurilio/mis-informes">Ir a Mis informes →</Link>
    </section>
  );
}
