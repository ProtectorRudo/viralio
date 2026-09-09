"use client";

import { useEffect, useMemo, useState } from "react";
import type { Merchant, Reward, Session, ShareChannel } from "@/domain/types";
import { BrandIcon } from "@/ui/brand-icon";
import { MerchantBrandVisual } from "@/ui/merchant-brand-visual";
import { merchantThemeStyle } from "@/ui/merchant-theme";
import { PremiumWheel, REDUCED_SPIN_DURATION_MS, SPIN_DURATION_MS } from "@/ui/premium-wheel";

type SessionPayload = { session: Session; merchant: Merchant };

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "No pudimos completar la acción");
  return payload;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function MerchantExperience({ merchant: initialMerchant, referralToken }: { merchant: Merchant; referralToken?: string }) {
  const storageKey = `viralio:${initialMerchant.slug}:session`;
  const [payload, setPayload] = useState<SessionPayload>();
  const [reward, setReward] = useState<Reward>();
  const [spinReward, setSpinReward] = useState<Reward>();
  const [spinning, setSpinning] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [error, setError] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    media.addEventListener("change", updateMotion);
    const capabilityCheck = window.setTimeout(updateMotion, 0);
    const sessionId = localStorage.getItem(storageKey) ?? undefined;
    json<SessionPayload>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ merchantSlug: initialMerchant.slug, sessionId, referralToken }),
    }).then(async (result) => {
      localStorage.setItem(storageKey, result.session.id);
      setPayload(result);
      if (result.session.state === "REWARDED") {
        const existing = await json<{ reward: Reward }>(`/api/sessions/${result.session.id}/spin`, { method: "POST" });
        setReward(existing.reward);
      }
    }).catch((reason: Error) => setError(reason.message));
    return () => {
      window.clearTimeout(capabilityCheck);
      media.removeEventListener("change", updateMotion);
    };
  }, [initialMerchant.slug, referralToken, storageKey]);

  const merchant = payload?.merchant ?? initialMerchant;
  const referralUrl = useMemo(() => payload
    ? `${window.location.origin}/${merchant.slug}?ref=${encodeURIComponent(payload.session.referralToken)}`
    : "", [merchant.slug, payload]);

  async function unlock() {
    if (!payload) return;
    setError("");
    try {
      const result = await json<{ session: Session }>(`/api/sessions/${payload.session.id}/unlock`, { method: "POST" });
      setPayload({ ...payload, session: result.session });
    } catch (reason) { setError((reason as Error).message); }
  }

  async function registerShare(channel: ShareChannel) {
    if (!payload) return;
    const result = await json<{ session: Session }>(`/api/sessions/${payload.session.id}/share`, {
      method: "POST", body: JSON.stringify({ channel }),
    });
    setPayload({ ...payload, session: result.session });
  }

  async function shareWhatsapp() {
    if (!payload || shareBusy) return;
    setError("");
    setShareBusy(true);
    const popup = window.open("about:blank", "_blank");
    try {
      await registerShare("whatsapp");
      const shareMessage = [
        `🎁 Te comparto un regalo de ${merchant.theme.displayName}.`,
        "",
        "Cuando abras este link vos también recibís tu propio regalo.",
        "",
        "Descubrí qué te toca:",
        referralUrl,
      ].join("\n");
      const target = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
      if (popup) popup.location.href = target;
      else window.location.href = target;
    } catch (reason) {
      popup?.close();
      setError((reason as Error).message);
    } finally {
      setShareBusy(false);
    }
  }

  async function spin() {
    if (!payload || spinning) return;
    setSpinning(true);
    setError("");
    try {
      const result = await json<{ reward: Reward }>(`/api/sessions/${payload.session.id}/spin`, { method: "POST" });
      setSpinReward(result.reward);
      await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? REDUCED_SPIN_DURATION_MS : SPIN_DURATION_MS));
      setReward(result.reward);
      setPayload({ ...payload, session: { ...payload.session, state: "REWARDED", rewardId: result.reward.id } });
    } catch (reason) { setError((reason as Error).message); }
    finally { setSpinning(false); }
  }

  async function saveInWhatsapp() {
    if (!payload || !reward) return;
    const rewardUrl = `${window.location.origin}/premio/${reward.token}`;
    const message = `Hola ${merchant.name}, guardo mi premio: ${reward.prizeName}. Código: ${reward.shortCode}. Vence: ${formatDate(reward.expiresAt)}. Tarjeta: ${rewardUrl}`;
    const popup = window.open("about:blank", "_blank");
    try {
      await json(`/api/sessions/${payload.session.id}/whatsapp`, { method: "POST" });
      const target = `https://wa.me/${merchant.whatsappNumber}?text=${encodeURIComponent(message)}`;
      if (popup) popup.location.href = target;
      else window.location.href = target;
    } catch (reason) {
      popup?.close();
      setError((reason as Error).message);
    }
  }

  return (
    <main
      className={`experience theme-${merchant.slug}`}
      style={merchantThemeStyle(merchant)}
      data-merchant={merchant.slug}
      data-brand-style={merchant.theme.stylePreset ?? "template"}
      data-design-version="021d"
    >
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <section className="experience-card" aria-live="polite">
        <header className="merchant-brand premium-brand-header">
          <span className="brand-mark"><MerchantBrandVisual merchant={merchant} mode="mark" size={30} /></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>{merchant.theme.tone ?? merchant.theme.businessType ?? "Experiencia Viralio"}</small></span>
          <span className="brand-edition" aria-hidden="true">V / 01</span>
        </header>

        {!payload && (
          <div className="stage loading-stage" aria-busy="true">
            <div className="loading-orbit"><BrandIcon category={merchant.theme.category} /></div>
            <p className="eyebrow">Preparando tu pase</p>
            <h1>Un momento especial está por empezar</h1>
            {error && <p className="error" role="alert">{error}</p>}
          </div>
        )}

        {payload?.session.state === "LANDING" && (
          <div className="stage landing-stage premium-campaign-stage" data-testid="landing-stage">
            <div className="campaign-frame" data-testid="brand-campaign-frame">
              <div className="campaign-copy stage-copy">
                <p className="eyebrow">{merchant.theme.heroEyebrow}</p>
                <h1>Tenemos un regalo especial para vos</h1>
                <p className="lead">{merchant.theme.heroCopy}</p>
              </div>
              <div className="campaign-visual">
                <span className="campaign-index" aria-hidden="true">01</span>
                <div className="mystery-object" aria-label={merchant.theme.mysteryLabel}>
                  <span className="mystery-halo" aria-hidden="true" />
                  <span className="mystery-medallion"><MerchantBrandVisual merchant={merchant} size={58} /></span>
                </div>
                <span className="campaign-caption">{merchant.theme.mysteryLabel}</span>
              </div>
            </div>
            <div className="campaign-action">
              <button className="button button-primary" onClick={unlock}>Descubrir mi regalo <span aria-hidden="true">→</span></button>
              <p className="trust-line">Pase personal · premio guardado automáticamente</p>
            </div>
          </div>
        )}

        {payload?.session.state === "UNLOCK" && (
          <div className="stage share-stage premium-share-stage referral-gift-stage referral-gift-stage-minimal" data-testid="unlock-stage">
            <div className="stage-copy share-copy referral-minimal-copy">
              <h1>La otra persona también recibe un regalo</h1>
            </div>
            <div className="share-actions whatsapp-only-share referral-minimal-action" aria-label="Compartir regalo por WhatsApp">
              <button className="button button-whatsapp referral-whatsapp-button" data-testid="whatsapp-share" disabled={shareBusy} onClick={shareWhatsapp}>
                <span className="whatsapp-icon" aria-hidden="true">↗</span>
                <span>{shareBusy ? "Abriendo WhatsApp…" : "Compartí tu regalo con otra persona"}</span>
              </button>
            </div>
          </div>
        )}

        {payload?.session.state === "SHARED" && (
          <div className="stage wheel-stage premium-wheel-stage" data-testid="wheel-stage">
            <div className="stage-sequence" aria-hidden="true"><span>02</span><i /></div>
            <div className="stage-copy compact wheel-copy">
              <p className="eyebrow success">Pase desbloqueado</p>
              <h1>Ahora sí: que gire</h1>
              <p className="lead">Tu premio está en juego. Dejá que la ruleta haga el resto.</p>
            </div>
            <div className="wheel-object-shell">
              <PremiumWheel merchant={merchant} reward={spinReward} spinning={spinning} reducedMotion={reducedMotion} />
            </div>
            <button className="button button-primary spin-button" disabled={spinning} onClick={spin}>
              {spinning ? <><span className="button-spinner" aria-hidden="true" /> Revelando…</> : <>Girar la ruleta <span aria-hidden="true">→</span></>}
            </button>
            <p className="sr-only" role="status">{spinning ? "La ruleta está girando" : "La ruleta está lista para girar"}</p>
            <p className="trust-line">Resultado protegido por Viralio</p>
          </div>
        )}

        {payload?.session.state === "REWARDED" && reward && (
          <div className="stage reward-stage premium-reveal-stage" data-testid="reward-stage">
            <div className="stage-sequence reward-sequence" aria-hidden="true"><span>03</span><i /></div>
            <div className="reward-reveal-brand">
              <MerchantBrandVisual merchant={merchant} size={44} />
              <span>{merchant.theme.shortName}</span>
            </div>
            <div className="stage-copy compact reward-copy">
              <p className="eyebrow success">Es tuyo</p>
              <h1>{reward.prizeName}</h1>
              <p className="lead">Un detalle de {merchant.theme.displayName} para tu próxima visita.</p>
            </div>

            <article className="reward-ticket reward-voucher reward-voucher-v2 reward-voucher-v3" data-testid="reward-voucher">
              <header className="voucher-v2-head">
                <div className="voucher-v2-brand"><MerchantBrandVisual merchant={merchant} mode="mark" size={28} /><span>{merchant.theme.shortName}</span></div>
                <span className="voucher-v2-type">CUPÓN DE REGALO</span>
              </header>

              <section className="voucher-v2-prize">
                <span className="voucher-v2-label">TU REGALO</span>
                <strong>{reward.prizeName}</strong>
              </section>

              <section className="voucher-v2-details">
                <div className="voucher-v2-detail voucher-v2-code">
                  <span>CÓDIGO DE CANJE</span>
                  <strong>{reward.shortCode}</strong>
                </div>
                <div className="voucher-v2-detail voucher-v2-expiration" data-testid="reward-expiration">
                  <span>FECHA DE VENCIMIENTO</span>
                  <strong>{formatDate(reward.expiresAt)}</strong>
                  <small>Canjealo hasta ese día inclusive.</small>
                </div>
              </section>

              <footer className="voucher-v2-foot">
                <span className="status-pill">Disponible</span>
                <small>Premio único · protegido por Viralio</small>
              </footer>
            </article>

            <div className="reward-actions">
              <button className="button button-whatsapp reward-whatsapp" onClick={saveInWhatsapp}><span className="whatsapp-icon" aria-hidden="true">↗</span> Guardar premio en WhatsApp</button>
              <a className="button button-secondary button-link" href={`/premio/${reward.token}`}>Ver tarjeta del premio</a>
            </div>
          </div>
        )}

        {payload && error && <p className="error" role="alert">{error}</p>}
        <footer className="viralio-signature premium-signature"><span>Experience by</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
