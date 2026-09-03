"use client";

import { useEffect, useMemo, useState } from "react";
import type { Merchant, Reward, Session, ShareChannel } from "@/domain/types";
import { BrandIcon } from "@/ui/brand-icon";
import { MerchantBrandVisual } from "@/ui/merchant-brand-visual";
import { merchantThemeStyle } from "@/ui/merchant-theme";
import { PremiumWheel, SPIN_DURATION_MS } from "@/ui/premium-wheel";

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
  const [shareBusy, setShareBusy] = useState<ShareChannel>();
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

  async function shareToSocialDestination(channel: "whatsapp_status" | "instagram_story") {
    if (!payload) return;
    setError("");
    setShareBusy(channel);
    try {
      if (!navigator.share) {
        throw new Error("Tu navegador no puede abrir el menú para compartir. Usá Enviar por WhatsApp como alternativa.");
      }

      const baseShare: ShareData = {
        title: `Pase sorpresa de ${merchant.name}`,
        text: merchant.theme.referralCopy,
        url: referralUrl,
      };
      let shareData: ShareData = baseShare;

      try {
        const response = await fetch(`/api/share-card/${encodeURIComponent(payload.session.referralToken)}`);
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], `viralio-${merchant.slug}-pase.png`, { type: blob.type || "image/png" });
          if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
            shareData = { title: baseShare.title, text: baseShare.text, files: [file] };
          }
        }
      } catch {
        shareData = baseShare;
      }

      await navigator.share(shareData);
      await registerShare(channel);
    } catch (reason) {
      if ((reason as DOMException).name !== "AbortError") setError((reason as Error).message);
    } finally {
      setShareBusy(undefined);
    }
  }

  async function share(channel: "whatsapp" | "native") {
    if (!payload) return;
    setError("");
    setShareBusy(channel);
    try {
      if (channel === "native") {
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
    } finally {
      setShareBusy(undefined);
    }
  }

  async function spin() {
    if (!payload || spinning) return;
    setSpinning(true);
    setError("");
    try {
      const result = await json<{ reward: Reward }>(`/api/sessions/${payload.session.id}/spin`, { method: "POST" });
      setSpinReward(result.reward);
      await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 100 : SPIN_DURATION_MS));
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

  const shareDisabled = Boolean(shareBusy);

  return (
    <main
      className={`experience theme-${merchant.slug}`}
      style={merchantThemeStyle(merchant)}
      data-merchant={merchant.slug}
      data-brand-style={merchant.theme.stylePreset ?? "template"}
      data-design-version="020b"
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
                <h1>{merchant.theme.heroTitle}</h1>
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
              <button className="button button-primary" onClick={unlock}>Descubrir mi premio <span aria-hidden="true">→</span></button>
              <p className="trust-line">Pase personal · premio guardado automáticamente</p>
            </div>
          </div>
        )}

        {payload?.session.state === "UNLOCK" && (
          <div className="stage share-stage premium-share-stage" data-testid="unlock-stage">
            <div className="share-editorial-head">
              <div className="share-progress" data-testid="share-progress" aria-label="Compartir, girar y guardar premio">
                <span className="is-active"><b>1</b><small>Compartí</small></span>
                <i aria-hidden="true" />
                <span><b>2</b><small>Girá</small></span>
                <i aria-hidden="true" />
                <span><b>3</b><small>Guardá</small></span>
              </div>
              <div className="stage-copy share-copy">
                <p className="eyebrow">Primero, hacelo circular</p>
                <h1>{merchant.theme.shareTitle}</h1>
                <p className="lead">{merchant.theme.shareCopy}</p>
              </div>
            </div>

            <div className="share-poster-preview" data-testid="share-poster-preview" aria-label="Vista previa de la pieza para compartir">
              <div className="share-poster-top">
                <span>{merchant.theme.shortName}</span>
                <small>INVITACIÓN · 01</small>
              </div>
              <div className="share-poster-mark"><MerchantBrandVisual merchant={merchant} size={42} /></div>
              <div className="share-poster-copy">
                <strong>{merchant.theme.socialHeadline}</strong>
                <span>{merchant.theme.socialSubcopy}</span>
              </div>
              <div className="share-poster-foot"><span>Tu premio no aparece</span><b>Viralio</b></div>
            </div>

            <div className="story-grid premium-story-grid" aria-label="Compartir en estados e historias">
              <button className="story-option story-whatsapp" data-testid="whatsapp-status-share" disabled={shareDisabled} onClick={() => shareToSocialDestination("whatsapp_status")}>
                <span className="story-sequence" aria-hidden="true">01</span>
                <span className="story-icon" aria-hidden="true">W</span>
                <span><strong>Estado de WhatsApp</strong><small>{shareBusy === "whatsapp_status" ? "Preparando pieza…" : "Compartir pieza 9:16"}</small></span>
                <span className="story-arrow" aria-hidden="true">↗</span>
              </button>
              <button className="story-option story-instagram" data-testid="instagram-story-share" disabled={shareDisabled} onClick={() => shareToSocialDestination("instagram_story")}>
                <span className="story-sequence" aria-hidden="true">02</span>
                <span className="story-icon" aria-hidden="true">◎</span>
                <span><strong>Instagram Stories</strong><small>{shareBusy === "instagram_story" ? "Preparando pieza…" : "Abrir menú de compartir"}</small></span>
                <span className="story-arrow" aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="share-actions" aria-label="Otras opciones para compartir">
              <button className="button button-whatsapp" disabled={shareDisabled} onClick={() => share("whatsapp")}>
                <span className="whatsapp-icon" aria-hidden="true">↗</span><span><small>Mensaje directo</small>Enviar por WhatsApp</span>
              </button>
              <button className="button button-secondary" data-testid="native-share" disabled={shareDisabled || !nativeShare} onClick={() => share("native")}><span aria-hidden="true">↗</span> Compartir por otras apps</button>
            </div>
            <p className="share-guidance">La ruleta se habilita cuando iniciás una acción de compartir. Viralio no afirma una publicación que no puede verificar.</p>
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
            <div className="reward-ticket reward-voucher" data-testid="reward-voucher">
              <div className="voucher-head"><span>PREMIO · VIRALIO</span><small>V / REWARD</small></div>
              <div className="voucher-code"><span>Código único</span><strong>{reward.shortCode}</strong></div>
              <div className="voucher-foot"><span>Válido hasta <b>{formatDate(reward.expiresAt)}</b></span><span className="status-pill">Disponible</span></div>
            </div>
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
