"use client";

import Image from "next/image";
import { useState } from "react";
import type { Merchant, Session } from "@/domain/types";
import { MerchantBrandVisual } from "@/ui/merchant-brand-visual";
import { merchantThemeStyle } from "@/ui/merchant-theme";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "No pudimos completar la acción");
  return payload;
}

export function StoryBuilder({ merchant, referralToken }: { merchant: Merchant; referralToken: string }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const imageUrl = `/api/share-card/${encodeURIComponent(referralToken)}`;
  const returnUrl = `/${merchant.slug}`;

  async function saveStory() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(imageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("No pudimos preparar tu Story. Probá nuevamente.");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `viralio-${merchant.slug}-story.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5_000);

      const sessionId = localStorage.getItem(`viralio:${merchant.slug}:session`);
      if (!sessionId) throw new Error("Volvé a Viralio y abrí Crear mi Story desde la pantalla Compartir.");

      await json<{ session: Session }>(`/api/sessions/${sessionId}/share`, {
        method: "POST",
        body: JSON.stringify({ channel: "social" }),
      });
      setSaved(true);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className={`story-builder-page theme-${merchant.slug}`}
      style={merchantThemeStyle(merchant)}
      data-testid="story-builder"
    >
      <section className="story-builder-shell">
        <header className="story-builder-brand">
          <MerchantBrandVisual merchant={merchant} mode="mark" size={34} />
          <span><small>STORY BUILDER</small><strong>{merchant.theme.displayName}</strong></span>
        </header>

        <div className="story-builder-copy">
          <p>Tu pieza está lista</p>
          <h1>Guardala y publicala en tu historia</h1>
          <span>Formato vertical 9:16 · preparado por Viralio</span>
        </div>

        <div className="story-builder-preview" data-testid="story-preview">
          <Image
            src={imageUrl}
            alt={`Story de ${merchant.theme.displayName}`}
            width={1080}
            height={1920}
            unoptimized
            priority
          />
        </div>

        <div className="story-builder-actions">
          <button
            className="story-builder-save"
            type="button"
            data-testid="story-save"
            disabled={saving || saved}
            onClick={saveStory}
          >
            {saving ? "Preparando imagen…" : saved ? "Imagen preparada ✓" : "Guardar imagen"}
          </button>

          {!saved && (
            <p className="story-builder-help">
              Al guardar la pieza, tu ruleta queda habilitada. Viralio no afirma que la publicaste: la publicación final siempre la hacés vos.
            </p>
          )}

          {saved && (
            <div className="story-builder-ready" data-testid="story-ready">
              <p><strong>Listo.</strong> La ruleta ya está habilitada.</p>
              <span>Ahora abrí tu app y elegí la imagen desde la galería.</span>
              <div className="story-builder-apps">
                <a href="whatsapp://send">Abrir WhatsApp</a>
                <a href="instagram://app">Abrir Instagram</a>
              </div>
              <a className="story-builder-return" href={returnUrl}>Continuar a la ruleta →</a>
            </div>
          )}

          {error && <p className="story-builder-error" role="alert">{error}</p>}
        </div>

        <footer>Experience by <strong>Viralio</strong></footer>
      </section>
    </main>
  );
}
