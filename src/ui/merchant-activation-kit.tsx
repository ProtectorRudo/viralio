"use client";

import Link from "next/link";
import { useState } from "react";
import type { Merchant } from "@/domain/types";
import { merchantThemeStyle } from "@/ui/merchant-theme";

export function MerchantActivationKit({ merchant }: { merchant: Merchant }) {
  const relativePath = `/${merchant.slug}`;
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      const publicUrl = new URL(relativePath, window.location.origin).href;
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className={`activation-shell theme-${merchant.slug}`} style={merchantThemeStyle(merchant)} data-merchant={merchant.slug}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <section className="activation-card" data-testid="merchant-activation-kit">
        <header className="merchant-brand activation-brand">
          <span className="brand-mark"><span>{merchant.theme.monogram}</span></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>Kit de activación</small></span>
          <span className="brand-line" aria-hidden="true" />
        </header>

        <div className="activation-content">
          <div className="activation-heading">
            <div>
              <p className="eyebrow">Llevá gente a tu Viralio</p>
              <h1>Tu campaña ya puede vivir en el mostrador.</h1>
              <p>Usá el QR, compartí el enlace o imprimí el cartel. Todo apunta a la experiencia pública de {merchant.theme.shortName}.</p>
            </div>
            <span className="activation-live">LISTO PARA USAR</span>
          </div>

          <nav className="merchant-panel-switch" aria-label="Panel del comercio">
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/panel`}>Resumen</Link>
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/canjes`}>Canjes</Link>
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/configuracion`}>Configuración</Link>
            <span className="merchant-panel-tab is-active" aria-current="page">Activación</span>
            <Link className="merchant-panel-tab" href={relativePath}>Ver experiencia</Link>
          </nav>

          <section className="activation-grid">
            <article className="activation-panel activation-link-panel">
              <p className="eyebrow">01 · Enlace público</p>
              <h2>Una URL simple para compartir.</h2>
              <div className="activation-url" data-testid="activation-public-url">
                <span>{relativePath}</span>
                <button type="button" onClick={copyLink} data-testid="copy-activation-link">{copied ? "Copiado ✓" : "Copiar enlace"}</button>
              </div>
              <p className="activation-help">Al copiar, Viralio agrega automáticamente el dominio actual. Podés pegarlo en bio, WhatsApp, Google Business, redes o cualquier pieza digital.</p>
            </article>

            <article className="activation-panel activation-qr-panel">
              <div>
                <p className="eyebrow">02 · QR vectorial</p>
                <h2>Escaneable y listo para imprimir.</h2>
                <p className="activation-help">SVG en blanco y negro para máxima lectura y calidad en cualquier tamaño.</p>
              </div>
              <div className="activation-qr-frame" data-testid="activation-qr">
                <object data="/api/merchant/activation/qr" type="image/svg+xml" aria-label={`QR de ${merchant.name}`} />
              </div>
              <a className="activation-action" href="/api/merchant/activation/qr?download=1" download>Descargar QR SVG ↓</a>
            </article>
          </section>

          <section className="activation-poster-section">
            <div className="activation-section-heading">
              <div><p className="eyebrow">03 · Cartel de mostrador</p><h2>Una pieza lista para imprimir.</h2></div>
              <button type="button" className="activation-print-button" onClick={() => window.print()} data-testid="print-activation-poster">Imprimir cartel</button>
            </div>

            <div className="activation-poster" data-testid="activation-poster">
              <div className="poster-topline"><span>{merchant.theme.displayName}</span><em>× VIRALIO</em></div>
              <div className="poster-copy">
                <p>HAY UNA SORPRESA<br />ESPERANDO POR VOS</p>
                <h3>Escaneá.<br />Compartí.<br />Descubrí.</h3>
                <span>Abrí tu pase y descubrí un beneficio para tu próxima visita.</span>
              </div>
              <div className="poster-qr-wrap">
                <object data="/api/merchant/activation/qr" type="image/svg+xml" aria-label={`QR imprimible de ${merchant.name}`} />
                <strong>ESCANEÁ ACÁ</strong>
                <small>{relativePath}</small>
              </div>
              <div className="poster-footer"><span>Una experiencia de</span><strong>VIRALIO</strong></div>
            </div>
          </section>

          <section className="activation-tips">
            <article><strong>Mostrador</strong><span>Ubicalo donde el cliente naturalmente espera o paga.</span></article>
            <article><strong>Mesa / espejo</strong><span>El QR funciona mejor cuando puede escanearse sin pedir permiso.</span></article>
            <article><strong>WhatsApp</strong><span>Mandá el enlace después de una visita para extender la experiencia.</span></article>
          </section>
        </div>

        <footer className="viralio-signature"><span>Activación impulsada por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
