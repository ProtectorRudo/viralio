"use client";

import { FormEvent, useState } from "react";
import styles from "./maurilio-fallback.module.css";

export default function AccessRecoveryClient({
  hasAccess,
}: {
  hasAccess: boolean;
}) {
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState<{ code: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState<"issue" | "redeem" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function issueRecovery() {
    if (!hasAccess || loading) return;
    setLoading("issue");
    setMessage(null);

    try {
      const response = await fetch("/maurilio/api/access/recovery/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await response.json()) as {
        code?: string;
        expiresAt?: string;
        error?: string;
      };

      if (!response.ok || !body.code || !body.expiresAt) {
        throw new Error(body.error || "issue_failed");
      }

      setIssued({ code: body.code, expiresAt: body.expiresAt });
    } catch {
      setMessage("No pudimos generar el Recovery Code.");
    } finally {
      setLoading(null);
    }
  }

  async function redeemRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim() || loading) return;
    setLoading("redeem");
    setMessage(null);

    try {
      const response = await fetch("/maurilio/api/access/recovery/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await response.json()) as {
        activeEntitlements?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error || "redeem_failed");
      }

      setMessage(
        `Acceso recuperado · ${body.activeEntitlements ?? 0} informe(s) activo(s).`,
      );
      window.setTimeout(() => window.location.reload(), 650);
    } catch {
      setMessage("El código es inválido, expiró o ya fue utilizado.");
      setLoading(null);
    }
  }

  return (
    <section className={styles.recoveryPanel}>
      <div className={styles.recoveryIntro}>
        <span>ACCESS RECOVERY</span>
        <h2>Tu acceso viaja con un código, no con una cuenta.</h2>
        <p>
          El Recovery Code es de un solo uso. Sirve para mover tus informes
          premium a otro navegador sin exponer datos personales.
        </p>
      </div>

      <form className={styles.recoveryForm} onSubmit={redeemRecovery}>
        <label htmlFor="maurilio-recovery">Recovery Code</label>
        <input
          id="maurilio-recovery"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="MB-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" disabled={loading !== null || !code.trim()}>
          {loading === "redeem" ? "Verificando…" : "Recuperar acceso"}
        </button>
      </form>

      {hasAccess ? (
        <div className={styles.recoveryIssue}>
          <div>
            <span>YA TENÉS ACCESO EN ESTE NAVEGADOR</span>
            <p>
              Generá un código sólo cuando necesites moverlo. Al generar uno
              nuevo, el anterior deja de ser válido.
            </p>
          </div>
          <button
            type="button"
            onClick={issueRecovery}
            disabled={loading !== null}
          >
            {loading === "issue" ? "Generando…" : "Generar Recovery Code"}
          </button>
        </div>
      ) : null}

      {issued ? (
        <div className={styles.recoveryCode}>
          <span>RECOVERY CODE · UNA SOLA VEZ</span>
          <b>{issued.code}</b>
          <small>
            Guardalo fuera del navegador. Expira automáticamente y no vuelve a
            mostrarse después de abandonar esta pantalla.
          </small>
        </div>
      ) : null}

      {message ? <p className={styles.recoveryMessage}>{message}</p> : null}
    </section>
  );
}
