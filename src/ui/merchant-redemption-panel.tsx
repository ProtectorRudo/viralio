"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

interface MerchantRewardListItem extends MerchantRewardView {
  status: RewardStatus;
}

type RewardFilter = RewardStatus | "ALL";

const labels: Record<RewardStatus, string> = {
  AVAILABLE: "Disponible",
  REDEEMED: "Canjeado",
  EXPIRED: "Vencido",
};

const filterLabels: Record<RewardFilter, string> = {
  AVAILABLE: "Vigentes",
  REDEEMED: "Canjeados",
  EXPIRED: "Vencidos",
  ALL: "Todos",
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
  const [filter, setFilter] = useState<RewardFilter>("AVAILABLE");
  const [rewardList, setRewardList] = useState<MerchantRewardListItem[]>([]);
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState("");
  const [listVersion, setListVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authenticated) return undefined;

    let cancelled = false;
    async function loadList() {
      setListBusy(true);
      setListError("");
      try {
        const response = await fetch(`/api/merchant/rewards?status=${filter}`, { cache: "no-store" });
        const result = await response.json() as { rewards?: MerchantRewardListItem[]; error?: string };
        if (!response.ok || !result.rewards) throw new Error(result.error ?? "No pudimos cargar los canjes");
        if (!cancelled) setRewardList(result.rewards);
      } catch (reason) {
        if (!cancelled) setListError((reason as Error).message);
      } finally {
        if (!cancelled) setListBusy(false);
      }
    }

    void loadList();
    const interval = window.setInterval(() => { void loadList(); }, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [authenticated, filter, listVersion]);

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
      setListVersion((version) => version + 1);
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    try {
      await fetch("/api/merchant/logout", { method: "POST" });
      setReward(undefined); setStatus(undefined); setCode(""); setRewardList([]);
      router.refresh();
    } finally { setBusy(false); }
  }

  function selectFromList(item: MerchantRewardListItem) {
    setReward(item);
    setStatus(item.status);
    setCode(item.shortCode);
    setError("");
  }

  return (
    <main className={`experience merchant-redemption-shell theme-${merchant.slug}`} style={merchantThemeStyle(merchant)} data-merchant={merchant.slug}>
      <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
      <section className="experience-card public-card merchant-redemption-card">
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
              <h1>Canjes</h1>
              <p className="lead">Los premios vigentes aparecen primero. Los vencidos salen solos de esta vista y quedan guardados en el historial.</p>
              <nav className="merchant-panel-switch" aria-label="Panel del comercio">
                <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/panel`}>Resumen</Link>
                <span className="merchant-panel-tab is-active" aria-current="page">Canjes</span>
                <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/configuracion`}>Configuración</Link>
                <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/activacion`}>Activación</Link>
                <Link className="merchant-panel-tab" href={`/${merchant.slug}`}>Ver experiencia</Link>
              </nav>

              <section className="merchant-reward-feed" data-testid="merchant-reward-feed" aria-label="Lista de canjes">
                <div className="merchant-reward-feed-head">
                  <div><strong>Premios</strong><small>Se actualiza automáticamente</small></div>
                  {listBusy && <span className="merchant-feed-loading">Actualizando…</span>}
                </div>
                <div className="merchant-reward-filters" role="group" aria-label="Filtrar premios">
                  {(Object.keys(filterLabels) as RewardFilter[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={filter === value ? "is-active" : ""}
                      data-testid={`reward-filter-${value.toLowerCase()}`}
                      onClick={() => setFilter(value)}
                    >
                      {filterLabels[value]}
                    </button>
                  ))}
                </div>
                {listError && <p className="error merchant-feed-error" role="alert">{listError}</p>}
                {!listError && !listBusy && rewardList.length === 0 && (
                  <p className="merchant-feed-empty">No hay premios en esta categoría.</p>
                )}
                <div className="merchant-reward-list" data-testid="merchant-reward-list">
                  {rewardList.map((item) => (
                    <button key={`${item.shortCode}-${item.status}`} type="button" className="merchant-reward-row" onClick={() => selectFromList(item)}>
                      <span><strong>{item.prizeName}</strong><small>{item.shortCode} · vence {formatDate(item.expiresAt)}</small></span>
                      <span className={`status-badge status-${item.status.toLowerCase()}`}>{labels[item.status]}</span>
                    </button>
                  ))}
                </div>
              </section>

              <form onSubmit={lookup} className="merchant-form merchant-code-lookup" data-testid="merchant-reward-search">
                <label htmlFor="reward-code">Buscar por código</label>
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
