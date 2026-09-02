"use client";

import { useState } from "react";
import type { Merchant, Reward, RewardStatus } from "@/domain/types";
import { BrandIcon } from "@/ui/brand-icon";
import { merchantThemeStyle } from "@/ui/merchant-theme";

const labels: Record<RewardStatus, string> = { AVAILABLE: "Disponible", REDEEMED: "Canjeado", EXPIRED: "Vencido" };

function date(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(value));
}

export function RewardCard({ reward, merchant, initialStatus, validation = false }: {
  reward: Reward; merchant: Merchant; initialStatus: RewardStatus; validation?: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function redeem() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/rewards/${reward.token}`, { method: "PATCH" });
      const result = await response.json() as { status?: RewardStatus; error?: string };
      if (response.ok && result.status) setStatus(result.status);
      else setError(result.error ?? "No se pudo canjear");
    } finally { setBusy(false); }
  }

  return (
    <main className={`experience theme-${merchant.slug}`} style={merchantThemeStyle(merchant)} data-merchant={merchant.slug}>
      <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
      <section className="experience-card public-card">
        <header className="merchant-brand">
          <span className="brand-mark"><span>{merchant.theme.monogram}</span></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>{validation ? "Validación en comercio" : "Tarjeta oficial de premio"}</small></span>
          <span className="brand-line" aria-hidden="true" />
        </header>
        <div className="stage">
          <div className="reward-seal"><BrandIcon category={merchant.theme.category} /><span>Premio<br />Viralio</span></div>
          <p className="eyebrow public-intro">{validation ? "Control de beneficio" : `Tu premio en ${merchant.theme.shortName}`}</p>
          <span className={`status-badge status-${status.toLowerCase()}`} data-testid="reward-status">{labels[status]}</span>
          <h1>{reward.prizeName}</h1>
          <div className="public-code"><span>Código único</span><strong>{reward.shortCode}</strong><small>Vence el {date(reward.expiresAt)}</small></div>
          {validation && status === "AVAILABLE" && <p className="validation-note"><span aria-hidden="true">!</span><span>Confirmá el código con la persona antes de marcar el premio como canjeado. Esta acción es irreversible.</span></p>}
          {validation && status === "AVAILABLE" && <button className="button button-primary" disabled={busy} onClick={redeem}>{busy ? "Confirmando canje…" : "Marcar como canjeado"}</button>}
          {validation && status !== "AVAILABLE" && <p className="state-message"><strong>{labels[status]}.</strong> Este premio no puede volver a canjearse.</p>}
          {!validation && <p className="state-message">Presentá esta tarjeta al equipo de <strong>{merchant.name}</strong>. El estado se valida online al momento del canje.</p>}
          {error && <p className="error" role="alert">{error}</p>}
        </div>
        <footer className="viralio-signature"><span>Premio administrado por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
