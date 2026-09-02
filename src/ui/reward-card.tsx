"use client";

import { useState } from "react";
import type { Reward, RewardStatus } from "@/domain/types";

const labels: Record<RewardStatus, string> = {
  AVAILABLE: "Disponible",
  REDEEMED: "Canjeado",
  EXPIRED: "Vencido",
};

function date(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(value));
}

export function RewardCard({ reward, initialStatus, validation = false }: { reward: Reward; initialStatus: RewardStatus; validation?: boolean }) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function redeem() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/rewards/${reward.token}`, { method: "PATCH" });
    const result = await response.json() as { status?: RewardStatus; error?: string };
    if (response.ok && result.status) setStatus(result.status);
    else setError(result.error ?? "No se pudo canjear");
    setBusy(false);
  }

  return (
    <main className="shell">
      <section className="card public-card">
        <header className="brand"><span className="brand-mark">M</span><span>Moka</span></header>
        <div className="stage reward">
          <p className="eyebrow">{validation ? "Validación de premio" : "Tu premio en Moka"}</p>
          <span className={`status status-${status.toLowerCase()}`} data-testid="reward-status">{labels[status]}</span>
          <h1>{reward.prizeName}</h1>
          <div className="reward-meta"><span>Código único</span><strong>{reward.shortCode}</strong><span>Vence el {date(reward.expiresAt)}</span></div>
          {validation && status === "AVAILABLE" && <button className="primary" disabled={busy} onClick={redeem}>{busy ? "Canjeando…" : "Marcar como canjeado"}</button>}
          {validation && status !== "AVAILABLE" && <p className="state-message">Este premio no puede volver a canjearse.</p>}
          {!validation && <p className="state-message">Presentá esta tarjeta en Moka para validar tu premio.</p>}
          {error && <p className="error" role="alert">{error}</p>}
        </div>
        <footer>Premio administrado por <strong>Viralio</strong></footer>
      </section>
    </main>
  );
}
