"use client";

import { useEffect, useMemo, useState } from "react";
import type { Merchant, Reward, Session, ShareChannel } from "@/domain/types";

type SessionPayload = { session: Session; merchant: Merchant };
const storageKey = "viralio:moka:session";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "No pudimos completar la acción");
  return payload;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function MokaExperience({ referralToken }: { referralToken?: string }) {
  const [payload, setPayload] = useState<SessionPayload>();
  const [reward, setReward] = useState<Reward>();
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState("");
  const [nativeShare, setNativeShare] = useState(false);

  useEffect(() => {
    const capabilityCheck = window.setTimeout(() => setNativeShare(typeof navigator.share === "function"), 0);
    const sessionId = localStorage.getItem(storageKey) ?? undefined;
    json<SessionPayload>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ merchantSlug: "moka", sessionId, referralToken }),
    }).then(async (result) => {
      localStorage.setItem(storageKey, result.session.id);
      setPayload(result);
      if (result.session.state === "REWARDED") {
        const spin = await json<{ reward: Reward }>(`/api/sessions/${result.session.id}/spin`, { method: "POST" });
        setReward(spin.reward);
      }
    }).catch((reason: Error) => setError(reason.message));
    return () => window.clearTimeout(capabilityCheck);
  }, [referralToken]);

  const referralUrl = useMemo(() => payload
    ? `${window.location.origin}/moka?ref=${encodeURIComponent(payload.session.referralToken)}`
    : "", [payload]);

  async function unlock() {
    if (!payload) return;
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
    const text = "Tengo un premio oculto en Moka ☕ ¿Querés probar vos también?";
    try {
      if (channel === "native" || channel === "social") {
        if (!navigator.share) throw new Error("El navegador no ofrece el menú de compartir");
        await navigator.share({ title: "Premio oculto en Moka", text, url: referralUrl });
        await registerShare(channel);
        return;
      }
      const popup = window.open("about:blank", "_blank");
      await registerShare(channel);
      const target = `https://wa.me/?text=${encodeURIComponent(`${text}\n${referralUrl}`)}`;
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
      await new Promise((resolve) => window.setTimeout(resolve, 1600));
      setReward(result.reward);
      setPayload({ ...payload, session: { ...payload.session, state: "REWARDED", rewardId: result.reward.id } });
    } catch (reason) { setError((reason as Error).message); }
    finally { setSpinning(false); }
  }

  async function saveInWhatsapp() {
    if (!payload || !reward) return;
    const rewardUrl = `${window.location.origin}/premio/${reward.token}`;
    const message = `Hola Moka, guardo mi premio: ${reward.prizeName}. Código: ${reward.shortCode}. Vence: ${formatDate(reward.expiresAt)}. Tarjeta: ${rewardUrl}`;
    const popup = window.open("about:blank", "_blank");
    try {
      await json(`/api/sessions/${payload.session.id}/whatsapp`, { method: "POST" });
      const target = `https://wa.me/${payload.merchant.whatsappNumber}?text=${encodeURIComponent(message)}`;
      if (popup) popup.location.href = target;
      else window.location.href = target;
    } catch (reason) {
      popup?.close();
      setError((reason as Error).message);
    }
  }

  if (!payload) return <main className="shell"><section className="card loading"><span className="bean">☕</span><p>Preparando tu sorpresa…</p>{error && <p className="error">{error}</p>}</section></main>;

  const { session, merchant } = payload;
  return (
    <main className="shell">
      <section className="card" aria-live="polite">
        <header className="brand"><span className="brand-mark">M</span><span>{merchant.name}</span></header>
        {session.state === "LANDING" && (
          <div className="stage intro">
            <div className="mystery" aria-hidden="true">?</div>
            <p className="eyebrow">Un mimo para tu visita</p>
            <h1>Tenés un premio oculto</h1>
            <p className="lead">Está esperando atrás de una pequeña sorpresa.</p>
            <button className="primary" onClick={unlock}>Descubrir mi premio</button>
          </div>
        )}
        {session.state === "UNLOCK" && (
          <div className="stage" data-testid="unlock-stage">
            <div className="lock" aria-hidden="true">✦</div>
            <p className="eyebrow">Tu premio sigue en secreto</p>
            <h1>Compartí tu pase para desbloquearlo</h1>
            <p className="lead">Invitá a alguien a descubrir su propia sorpresa. No revelaremos la tuya.</p>
            <button className="primary whatsapp" onClick={() => share("whatsapp")}>Enviar a una persona por WhatsApp</button>
            {nativeShare && <button className="secondary" data-testid="native-share" onClick={() => share("native")}>Compartir desde mi teléfono</button>}
            {nativeShare && <button className="text-button" onClick={() => share("social")}>Instagram u otras redes</button>}
            <p className="fineprint">La ruleta se habilita cuando iniciás la acción de compartir. Viralio no afirma que el contenido haya sido publicado.</p>
          </div>
        )}
        {session.state === "SHARED" && (
          <div className="stage" data-testid="wheel-stage">
            <p className="eyebrow success">¡Desbloqueado!</p>
            <h1>Ahora sí, girá la ruleta</h1>
            <div className={`wheel ${spinning ? "is-spinning" : ""}`}><span>☕</span></div>
            <button className="primary" disabled={spinning} onClick={spin}>{spinning ? "Girando…" : "Girar ahora"}</button>
            <p className="fineprint">El premio se define de forma segura en el servidor.</p>
          </div>
        )}
        {session.state === "REWARDED" && reward && (
          <div className="stage reward" data-testid="reward-stage">
            <div className="confetti" aria-hidden="true">✦ · ✧ · ✦</div>
            <p className="eyebrow success">¡Ganaste!</p>
            <h1>{reward.prizeName}</h1>
            <div className="reward-meta"><span>Código</span><strong>{reward.shortCode}</strong><span>Válido hasta el {formatDate(reward.expiresAt)}</span></div>
            <button className="primary whatsapp" onClick={saveInWhatsapp}>Guardar premio en WhatsApp</button>
            <a className="secondary link" href={`/premio/${reward.token}`}>Ver tarjeta del premio</a>
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <footer>Una experiencia de <strong>Viralio</strong></footer>
      </section>
    </main>
  );
}
