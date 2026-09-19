"use client";

import { FormEvent, useState } from "react";
import styles from "@/app/operador/operator.module.css";

export function OperatorLogin() {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/operator/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) {
        setError("La clave no es válida.");
        return;
      }
      window.location.reload();
    } catch {
      setError("No pudimos iniciar la sesión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.loginCard} data-testid="operator-login">
        <div className={styles.brandMark}>V</div>
        <p className={styles.eyebrow}>Centro de operador</p>
        <h1>Todos tus comercios, en un solo lugar.</h1>
        <p className={styles.loginCopy}>Ingresá con la clave de operador para ver resultados y administrar cada cuenta sin pedir el PIN del comercio.</p>
        <form onSubmit={submit} className={styles.loginForm}>
          <label>
            <span>Clave de operador</span>
            <input
              data-testid="operator-key"
              type="password"
              autoComplete="current-password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              required
            />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={busy}>{busy ? "Ingresando…" : "Entrar a Viralio"}</button>
        </form>
      </section>
    </main>
  );
}

export function OperatorLogout() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/operator/logout", { method: "POST" });
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return <button className={styles.logout} type="button" onClick={logout} disabled={busy}>{busy ? "Saliendo…" : "Cerrar sesión"}</button>;
}
