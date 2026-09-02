"use client";

import { useEffect, useMemo, useState } from "react";
import type { Merchant, Reward, Session, ShareChannel } from "@/domain/types";
import { BrandIcon } from "@/ui/brand-icon";
import { merchantThemeStyle } from "@/ui/merchant-theme";
import { PremiumWheel } from "@/ui/premium-wheel";

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
  const [error, setError] = useState("");
  const [nativeShare, setNativeShare] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    media.addEventListener("change", updateMotion);
    const capabilityCheck = window.setTimeout(() => {
      updateMotion();
      setNativeShare(typeof navigator.share === "function");
    }, 0);
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

  async function share(channel: ShareChannel) {
    if (!payload) return;
    setError("");
    try {
      if (channel === "native" || channel === "social") {
        if (!navigator.share) throw new Error("Tu navegador no ofrece el menú para compartir");
        await navigator.share({ title: `Pase sorpresa de ${merchant.name}`, text: merchant.theme.referralCopy, url: referralUrl });
        await registerShare(channel);
        return;
      }
      const popup = window.open("about:blank", "_blank");
      await registerShare(channel);
      const target = `https://wa.me/?text=${encodeURIComponent(`${merchant.theme.referralCopy}\n${referralUrl}`)}`;
      if (popup) popup.location.href = target;
      else window.location.href = target;
    } catch (reason) {
      if ((reason as DOMException).name !== "AbortError") setError((reason as Error).message);
    }
  }

  async function spin() {
    if (!payload || spinning) return;
    setSpinning(true);
    setError("");
    try {
      const result = await json<{ reward: Reward }>(`/api/sessions/${payload.session.id}/spin`, { method: "POST" });
      setSpinReward(result.reward);
      await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 120 : 2500));
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
    <main className={`experience theme-${merchant.slug}`} style={merchantThemeStyle(merchant)} data-merchant={merchant.slug}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <section className="experience-card" aria-live="polite">
        <header className="merchant-brand">
          <span className="brand-mark"><span>{merchant.theme.monogram}</span></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>{merchant.theme.category === "coffee" ? "Café de especialidad" : "Barbería contemporánea"}</small></span>
          <span className="brand-line" aria-hidden="true" />
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
          <div className="stage landing-stage" data-testid="landing-stage">
            <div className="mystery-object" aria-label={merchant.theme.mysteryLabel}>
              <span className="mystery-halo" aria-hidden="true" />
              <span className="mystery-medallion"><BrandIcon category={merchant.theme.category} /></span>
              <span className="mystery-tag">PASE · 01</span>
            </div>
            <div className="stage-copy">
              <p className="eyebrow">{merchant.theme.heroEyebrow}</p>
              <h1>{merchant.theme.heroTitle}</h1>
              <p className="lead">{merchant.theme.heroCopy}</p>
            </div>
            <button className="button button-primary" onClick={unlock}>Descubrir mi premio <span aria-hidden="true">→</span></button>
            <p className="trust-line"><span aria-hidden="true">✦</span> Tu premio es único y queda guardado</p>
          </div>
        )}

        {payload?.session.state === "UNLOCK" && (
          <div className="stage share-stage" data-testid="unlock-stage">
            <div className="pass-stack" aria-hidden="true"><span /><span /><BrandIcon category={merchant.theme.category} /></div>
            <div className="stage-copy">
              <p className="eyebrow">Un gesto abre la experiencia</p>
              <h1>{merchant.theme.shareTitle}</h1>
              <p className="lead">{merchant.theme.shareCopy}</p>
            </div>
            <div className="share-actions" aria-label="Opciones para compartir">
              <button className="button button-whatsapp" onClick={() => share("whatsapp")}>
                <span className="whatsapp-icon" aria-hidden="true">↗</span><span><small>Opción recomendada</small>Compartir por WhatsApp</span>
              </button>
              {nativeShare && <button className="button button-secondary" data-testid="native-share" onClick={() => share("native")}><span aria-hidden="true">↗</span> Compartir desde mi teléfono</button>}
              {nativeShare && <button className="button button-quiet" onClick={() => share("social")}>Instagram y otras redes</button>}
            </div>
            <p className="friend-note"><span aria-hidden="true">◎</span> Tu amigo recibe su propia oportunidad, no tu premio.</p>
          </div>
        )}

        {payload?.session.state === "SHARED" && (
          <div className="stage wheel-stage" data-testid="wheel-stage">
            <div className="stage-copy compact">
              <p className="eyebrow success"><span aria-hidden="true">✓</span> Pase desbloqueado</p>
              <h1>Tu premio ya está en movimiento</h1>
              <p className="lead">Giramos la rueda para revelarlo.</p>
            </div>
            <PremiumWheel merchant={merchant} reward={spinReward} spinning={spinning} reducedMotion={reducedMotion} />
            <button className="button button-primary spin-button" disabled={spinning} onClick={spin}>
              {spinning ? <><span className="button-spinner" aria-hidden="true" /> Revelando…</> : <>Girar la ruleta <span aria-hidden="true">→</span></>}
            </button>
            <p className="sr-only" role="status">{spinning ? "La ruleta está girando" : "La ruleta está lista para girar"}</p>
            <p className="trust-line">Resultado protegido por Viralio</p>
          </div>
        )}

        {payload?.session.state === "REWARDED" && reward && (
          <div className="stage reward-stage" data-testid="reward-stage">
            <div className="celebration" aria-hidden="true"><i /><i /><i /><i /><span>✦</span></div>
            <div className="reward-seal"><BrandIcon category={merchant.theme.category} /><span>Premio<br />revelado</span></div>
            <div className="stage-copy compact">
              <p className="eyebrow success">Es tuyo</p>
              <h1>{reward.prizeName}</h1>
              <p className="lead">Un detalle de {merchant.theme.displayName} para disfrutar en tu próxima visita.</p>
            </div>
            <div className="reward-ticket">
              <div><span>Código único</span><strong>{reward.shortCode}</strong></div>
              <div className="ticket-divider" aria-hidden="true" />
              <div><span>Válido hasta</span><b>{formatDate(reward.expiresAt)}</b></div>
              <span className="status-pill">Disponible</span>
            </div>
            <button className="button button-whatsapp reward-whatsapp" onClick={saveInWhatsapp}><span className="whatsapp-icon" aria-hidden="true">↗</span> Guardar premio en WhatsApp</button>
            <a className="button button-secondary button-link" href={`/premio/${reward.token}`}>Ver tarjeta del premio</a>
          </div>
        )}

        {payload && error && <p className="error" role="alert">{error}</p>}
        <footer className="viralio-signature"><span>Powered by</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
