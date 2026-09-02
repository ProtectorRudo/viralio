"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Merchant, RewardStatus } from "@/domain/types";
import { BrandIcon } from "@/ui/brand-icon";
import { merchantThemeStyle } from "@/ui/merchant-theme";

interface MerchantRewardView {
  shortCode: string;
  prizeName: string;
  expiresAt: string;
  redeemedAt?: string;
}

const labels: Record<RewardStatus, string> = {
  AVAILABLE: "Disponible",
  REDEEMED: "Canjeado",
  EXPIRED: "Vencido",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(value));
}

export function MerchantRedemptionPanel({ merchant, authenticated }: { merchant: Merchant; authenticated: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [reward, setReward] = useState<MerchantRewardView>();
  const [status, setStatus] = useState<RewardStatus>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/merchant/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantSlug: merchant.slug, pin }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        setError(result.error ?? "No se pudo iniciar sesión");
        return;
      }
      setPin("");
      router.refresh();
    } finally { setBusy(false); }
  }

  async function lookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setReward(undefined); setStatus(undefined);
    try {
      const response = await fetch(`/api/merchant/rewards?code=${encodeURIComponent(code)}`);
      const result = await response.json() as { reward?: MerchantRewardView; status?: RewardStatus; error?: string };
      if (!response.ok || !result.reward || !result.status) {
        setError(result.error ?? "Premio no encontrado");
        return;
      }
      setReward(result.reward);
      setStatus(result.status);
      setCode(result.reward.shortCode);
    } finally { setBusy(false); }
  }

  async function redeem() {
    if (!reward || status !== "AVAILABLE") return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/merchant/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortCode: reward.shortCode }),
      });
      const result = await response.json() as { reward?: MerchantRewardView; status?: RewardStatus; error?: string };
      if (!response.ok || !result.reward || !result.status) {
        setError(result.error ?? "No se pudo canjear");
        return;
      }
      setReward(result.reward);
      setStatus(result.status);
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    try {
      await fetch("/api/merchant/logout", { method: "POST" });
      setReward(undefined); setStatus(undefined); setCode("");
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <main className={`experience theme-${merchant.slug}`} style={merchantThemeStyle(merchant)} data-merchant={merchant.slug}>
      <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
      <section className="experience-card public-card">
        <header className="merchant-brand">
          <span className="brand-mark"><span>{merchant.theme.monogram}</span></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>Panel seguro de canjes</small></span>
          <span className="brand-line" aria-hidden="true" />
        </header>
        <div className="stage">
          <div className="reward-seal"><BrandIcon category={merchant.theme.category} /><span>Equipo<br />Viralio</span></div>
          {!authenticated ? (
            <>
              <p className="eyebrow public-intro">Acceso del comercio</p>
              <h1>Ingresá tu PIN</h1>
              <p className="lead">Sólo el equipo autorizado de {merchant.name} puede validar y canjear premios.</p>
              <form onSubmit={login} className="merchant-form" data-testid="merchant-login-form">
                <label htmlFor="merchant-pin">PIN del comercio</label>
                <input id="merchant-pin" data-testid="merchant-pin" inputMode="numeric" autoComplete="current-password" type="password" value={pin} onChange={(event) => setPin(event.target.value)} required minLength={4} maxLength={12} />
                <button className="button button-primary" disabled={busy} type="submit">{busy ? "Ingresando…" : "Ingresar al panel"}</button>
              </form>
            </>
          ) : (
            <>
              <p className="eyebrow public-intro">Canje autenticado</p>
              <h1>Validar premio</h1>
              <p className="lead">Ingresá el código de 8 caracteres que muestra el cliente.</p>
              <form onSubmit={lookup} className="merchant-form" data-testid="merchant-reward-search">
                <label htmlFor="reward-code">Código del premio</label>
                <input id="reward-code" data-testid="reward-code" inputMode="text" autoCapitalize="characters" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="AB12CD34" required maxLength={8} />
                <button className="button button-primary" disabled={busy} type="submit">{busy ? "Buscando…" : "Buscar premio"}</button>
              </form>

              {reward && status && (
                <div className="merchant-reward-result" data-testid="merchant-reward-result">
                  <span className={`status-badge status-${status.toLowerCase()}`} data-testid="merchant-reward-status">{labels[status]}</span>
                  <h2>{reward.prizeName}</h2>
                  <div className="public-code"><span>Código verificado</span><strong>{reward.shortCode}</strong><small>Vence el {formatDate(reward.expiresAt)}</small></div>
                  {status === "AVAILABLE" ? (
                    <>
                      <p className="validation-note"><span aria-hidden="true">!</span><span>Confirmá el código con el cliente. El canje es irreversible.</span></p>
                      <button className="button button-primary" data-testid="merchant-redeem" disabled={busy} onClick={redeem}>{busy ? "Confirmando…" : "Marcar como canjeado"}</button>
                    </>
                  ) : (
                    <p className="state-message"><strong>{labels[status]}.</strong> Este premio no puede volver a canjearse.</p>
                  )}
                </div>
              )}

              <button className="button button-secondary" data-testid="merchant-logout" disabled={busy} onClick={logout}>Cerrar sesión</button>
            </>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </div>
        <footer className="viralio-signature"><span>Operación protegida por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
