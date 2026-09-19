"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Merchant, Reward, Session } from "@/domain/types";
import { MerchantBrandVisual } from "@/ui/merchant-brand-visual";
import { merchantThemeStyle } from "@/ui/merchant-theme";

type SessionPayload = { session: Session; merchant: Merchant };

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "No pudimos completar la acción");
  return payload;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function MaluScratchCard({
  merchant,
  prepareReward,
  onContinue,
}: {
  merchant: Merchant;
  prepareReward: () => Promise<Reward>;
  onContinue: (reward: Reward) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rewardRef = useRef<Reward>();
  const preparingRef = useRef<Promise<Reward>>();
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const lastCheckRef = useRef(0);
  const completeRef = useRef(false);
  const [reward, setReward] = useState<Reward>();
  const [scratchedEnough, setScratchedEnough] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [scratchError, setScratchError] = useState("");

  const ensureReward = async () => {
    if (rewardRef.current) return rewardRef.current;
    if (preparingRef.current) return preparingRef.current;
    setPreparing(true);
    setScratchError("");
    const promise = prepareReward()
      .then((result) => {
        rewardRef.current = result;
        setReward(result);
        return result;
      })
      .catch((error: Error) => {
        setScratchError(error.message);
        throw error;
      })
      .finally(() => {
        setPreparing(false);
        preparingRef.current = undefined;
      });
    preparingRef.current = promise;
    return promise;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#d8b58f");
    gradient.addColorStop(.48, "#b98966");
    gradient.addColorStop(1, "#8f5d45");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = "rgba(255,250,244,.96)";
    ctx.textAlign = "center";
    ctx.font = '700 11px Inter, system-ui, sans-serif';
    ctx.fillText("DESLIZÁ EL DEDO", rect.width / 2, rect.height / 2 - 34);
    ctx.font = '600 29px Georgia, "Times New Roman", serif';
    ctx.fillText("Descubrí tu regalo", rect.width / 2, rect.height / 2 + 6);
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.fillText(merchant.theme.shortName, rect.width / 2, rect.height / 2 + 36);

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const point = (event: PointerEvent) => {
      const current = canvas.getBoundingClientRect();
      return { x: event.clientX - current.left, y: event.clientY - current.top };
    };

    const scratchedPercent = () => {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      let sampled = 0;
      for (let i = 3; i < pixels.length; i += 72) {
        sampled++;
        if (pixels[i] < 45) transparent++;
      }
      return sampled ? transparent / sampled : 0;
    };

    const check = async () => {
      const now = performance.now();
      if (now - lastCheckRef.current < 130 || completeRef.current) return;
      lastCheckRef.current = now;
      if (scratchedPercent() >= .46) {
        completeRef.current = true;
        setScratchedEnough(true);
        try {
          await ensureReward();
        } catch {
          completeRef.current = false;
        }
      }
    };

    const begin = (event: PointerEvent) => {
      if (completeRef.current) return;
      event.preventDefault();
      drawingRef.current = true;
      canvas.setPointerCapture?.(event.pointerId);
      void ensureReward();
      const p = point(event);
      lastPointRef.current = p;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
    };

    const move = (event: PointerEvent) => {
      if (!drawingRef.current || completeRef.current) return;
      event.preventDefault();
      const p = point(event);
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
      ctx.fill();
      lastPointRef.current = p;
      void check();
    };

    const end = (event: PointerEvent) => {
      drawingRef.current = false;
      try { canvas.releasePointerCapture?.(event.pointerId); } catch {}
      void check();
    };

    canvas.addEventListener("pointerdown", begin, { passive: false });
    canvas.addEventListener("pointermove", move, { passive: false });
    canvas.addEventListener("pointerup", end, { passive: false });
    canvas.addEventListener("pointercancel", end, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", begin);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", end);
    };
  }, [merchant.theme.shortName]);

  return (
    <div className="malu-scratch-wrap">
      <div className="malu-scratch-card">
        <div className="malu-scratch-under">
          <span>Tu regalo de {merchant.theme.shortName}</span>
          <strong>{reward?.prizeName ?? (preparing ? "Preparando tu regalo…" : "Tu sorpresa")}</strong>
          <small>{reward ? "para tu próxima visita" : "seguí raspando"}</small>
        </div>
        <canvas ref={canvasRef} className="malu-scratch-canvas" aria-label="Raspá para descubrir tu regalo" />
      </div>
      <p className="malu-scratch-hint">
        {scratchError ? scratchError : scratchedEnough ? "🎁 ¡Lo encontraste!" : "☝️ Raspá con el dedo para descubrirlo"}
      </p>
      {scratchedEnough && reward && (
        <button className="malu-button malu-button-primary" onClick={() => onContinue(reward)}>
          Guardar mi regalo <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}

export function MaluPremiumExperience({
  merchant: initialMerchant,
  referralToken,
}: {
  merchant: Merchant;
  referralToken?: string;
}) {
  const storageKey = `viralio:${initialMerchant.slug}:session`;
  const [payload, setPayload] = useState<SessionPayload>();
  const [reward, setReward] = useState<Reward>();
  const [error, setError] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [scratchReward, setScratchReward] = useState<Reward>();

  useEffect(() => {
    const sessionId = localStorage.getItem(storageKey) ?? undefined;
    json<SessionPayload>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        merchantSlug: initialMerchant.slug,
        sessionId,
        referralToken,
      }),
    })
      .then(async (result) => {
        localStorage.setItem(storageKey, result.session.id);
        setPayload(result);
        if (result.session.state === "REWARDED") {
          const existing = await json<{ reward: Reward }>(`/api/sessions/${result.session.id}/spin`, {
            method: "POST",
          });
          setReward(existing.reward);
        }
      })
      .catch((reason: Error) => setError(reason.message));
  }, [initialMerchant.slug, referralToken, storageKey]);

  const merchant = payload?.merchant ?? initialMerchant;
  const referralUrl = useMemo(() => {
    if (!payload || typeof window === "undefined") return "";
    return `${window.location.origin}/experiencia/${merchant.slug}?ref=${encodeURIComponent(payload.session.referralToken)}`;
  }, [merchant.slug, payload]);

  async function unlock() {
    if (!payload) return;
    setError("");
    try {
      const result = await json<{ session: Session }>(`/api/sessions/${payload.session.id}/unlock`, {
        method: "POST",
      });
      setPayload({ ...payload, session: result.session });
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  async function shareGift() {
    if (!payload) return;
    setError("");
    setShareBusy(true);
    const popup = window.open("about:blank", "_blank");
    try {
      const result = await json<{ session: Session }>(`/api/sessions/${payload.session.id}/share`, {
        method: "POST",
        body: JSON.stringify({ channel: "whatsapp" }),
      });
      setPayload({ ...payload, session: result.session });
      const message = `🎁 Te mandé un regalo de ${merchant.name}.\nA mí también me dieron uno por compartirlo.\nAbrí el tuyo acá 👇\n${referralUrl}`;
      const target = `https://wa.me/?text=${encodeURIComponent(message)}`;
      if (popup) popup.location.href = target;
      else window.location.href = target;
    } catch (reason) {
      popup?.close();
      setError((reason as Error).message);
    } finally {
      setShareBusy(false);
    }
  }

  async function prepareScratchReward(): Promise<Reward> {
    if (!payload) throw new Error("Esperá un segundo y volvé a intentar.");
    if (scratchReward) return scratchReward;
    const result = await json<{ reward: Reward }>(`/api/sessions/${payload.session.id}/spin`, {
      method: "POST",
    });
    setScratchReward(result.reward);
    return result.reward;
  }

  function acceptScratchReward(result: Reward) {
    if (!payload) return;
    setReward(result);
    setPayload({
      ...payload,
      session: {
        ...payload.session,
        state: "REWARDED",
        rewardId: result.id,
      },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveInWhatsapp() {
    if (!payload || !reward) return;
    const rewardUrl = `${window.location.origin}/premio/${reward.token}`;
    const message =
      `Hola ${merchant.name} 👋\n\n` +
      `Quiero guardar mi regalo de Viralio 🎁\n\n` +
      `🎁 Premio: ${reward.prizeName}\n` +
      `📅 Válido hasta: ${formatDate(reward.expiresAt)}\n` +
      `🔑 Código: ${reward.shortCode}\n\n` +
      `Tarjeta: ${rewardUrl}`;
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

  const state = payload?.session.state;

  return (
    <main
      className="malu-experience"
      style={merchantThemeStyle(merchant)}
      data-merchant={merchant.slug}
      data-design-version="malu-gift-v1"
    >
      <section className="malu-shell">
        <header className="malu-header">
          <div className="malu-brand-mark"><MerchantBrandVisual merchant={merchant} size={38} /></div>
          <div className="malu-brand-copy">
            <strong>{merchant.theme.displayName}</strong>
            <small>{merchant.theme.businessType ?? merchant.theme.tone ?? "Café & jardín"}</small>
          </div>
        </header>

        {!payload && (
          <div className="malu-stage malu-loading">
            <div className="malu-loading-mark"><MerchantBrandVisual merchant={merchant} size={50} /></div>
            <p className="malu-eyebrow">Preparando algo para vos</p>
            <h1>Tu regalo está por aparecer.</h1>
          </div>
        )}

        {state === "LANDING" && (
          <div className="malu-stage malu-home">
            <div className="malu-home-copy">
              <p className="malu-eyebrow">Un detalle para vos</p>
              <h1>Tenemos un regalo para vos.</h1>
            </div>
            <div className="malu-hero">
              <div className="malu-hero-photo" aria-hidden="true" />
              <div className="malu-gift-seal">HECHO<br />PARA VOS</div>
              <div className="malu-hero-overlay">
                <div className="malu-hero-logo"><MerchantBrandVisual merchant={merchant} size={46} /></div>
                <h2>Gracias por elegir {merchant.theme.shortName}.</h2>
                <p>Tu regalo tarda menos de un minuto.</p>
              </div>
            </div>
            <button className="malu-button malu-button-primary" onClick={unlock}>
              Descubrir mi regalo <span aria-hidden="true">→</span>
            </button>
            <p className="malu-fine">Sin registros. Sin instalar nada.</p>
          </div>
        )}

        {state === "UNLOCK" && (
          <div className="malu-stage malu-share">
            <p className="malu-eyebrow">Antes de descubrir el tuyo</p>
            <h1>Regalale uno a alguien.</h1>
            <p className="malu-lead">Compartilo por WhatsApp. La otra persona también recibe su propio regalo y el tuyo sigue siendo solo tuyo.</p>

            <div className="malu-share-card">
              <div className="malu-share-photo" aria-hidden="true" />
              <div className="malu-share-body">
                <small>MENSAJE QUE VA A RECIBIR</small>
                <strong>Un regalo de {merchant.theme.shortName} 🎁</strong>
                <p>“Te mandé un regalo de {merchant.name}. A mí también me dieron uno por compartirlo. Abrí el tuyo acá 👇”</p>
              </div>
            </div>

            <div className="malu-prosocial-note">
              <span aria-hidden="true">♡</span>
              <p>No es una publicidad: es un regalo de alguien que pensó en vos.</p>
            </div>

            <button className="malu-button malu-button-whatsapp" disabled={shareBusy} onClick={shareGift}>
              {shareBusy ? "Preparando regalo…" : "Compartir por WhatsApp"}
            </button>
            <p className="malu-fine">Después volvé acá para descubrir el tuyo.</p>
          </div>
        )}

        {state === "SHARED" && (
          <div className="malu-stage malu-scratch-stage">
            <p className="malu-eyebrow">Ahora sí</p>
            <h1>Tu regalo está acá.</h1>
            <p className="malu-lead">Raspá la tarjeta con el dedo para descubrirlo.</p>
            <MaluScratchCard
              merchant={merchant}
              prepareReward={prepareScratchReward}
              onContinue={acceptScratchReward}
            />
          </div>
        )}

        {state === "REWARDED" && reward && (
          <div className="malu-stage malu-reward">
            <div className="malu-heart">♡</div>
            <p className="malu-eyebrow">Un regalo de {merchant.theme.shortName}</p>
            <h1>Gracias por elegirnos.</h1>
            <p className="malu-lead">Este regalo es para tu próxima visita. Una linda excusa para volver.</p>

            <div className="malu-coupon">
              <small>TU REGALO PERSONAL</small>
              <strong>{reward.prizeName}</strong>
              <span>para tu próxima visita</span>
              <i aria-hidden="true" />
              <div>
                <b>Válido hasta {formatDate(reward.expiresAt)}</b>
                <b>Código {reward.shortCode}</b>
              </div>
            </div>

            <button className="malu-button malu-button-primary" onClick={saveInWhatsapp}>
              Guardar cupón en WhatsApp
            </button>
            <p className="malu-fine">El mensaje incluye premio, vencimiento y código para el comercio.</p>
          </div>
        )}

        {error && <p className="malu-error" role="alert">{error}</p>}
        <footer className="malu-footer">Experiencia impulsada por <strong>VIRALIO</strong></footer>
      </section>
    </main>
  );
}
