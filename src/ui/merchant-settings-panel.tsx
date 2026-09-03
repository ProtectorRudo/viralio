"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Merchant,
  MerchantCustomization,
  MerchantExperienceCopy,
  PrizeDefinition,
} from "@/domain/types";
import { merchantThemeStyle } from "@/ui/merchant-theme";

type CopyKey = keyof MerchantExperienceCopy;

const copyFields: Array<{ key: CopyKey; label: string; hint: string; multiline?: boolean }> = [
  { key: "heroEyebrow", label: "Frase superior", hint: "Texto breve sobre el título principal." },
  { key: "heroTitle", label: "Título de apertura", hint: "La promesa principal que ve el cliente." },
  { key: "heroCopy", label: "Descripción de apertura", hint: "Explica qué va a descubrir.", multiline: true },
  { key: "mysteryLabel", label: "Nombre del pase", hint: "Etiqueta de la sorpresa antes de revelarla." },
  { key: "shareTitle", label: "Título para compartir", hint: "Encabezado del paso de difusión." },
  { key: "shareCopy", label: "Texto para compartir", hint: "Explica por qué compartir desbloquea la ruleta.", multiline: true },
  { key: "referralCopy", label: "Mensaje de referido", hint: "Texto que acompaña el enlace compartido.", multiline: true },
  { key: "socialHeadline", label: "Titular de Stories / Estado", hint: "Titular de la pieza social 9:16." },
  { key: "socialSubcopy", label: "Bajada de Stories / Estado", hint: "Texto secundario de la pieza social.", multiline: true },
];

function cloneCustomization(value: MerchantCustomization): MerchantCustomization {
  return {
    ...value,
    copy: { ...value.copy },
    prizes: value.prizes.map((prize) => ({ ...prize })),
  };
}

export function MerchantSettingsPanel({
  merchant,
  initialCustomization,
}: {
  merchant: Merchant;
  initialCustomization: MerchantCustomization;
}) {
  const router = useRouter();
  const [customization, setCustomization] = useState(() => cloneCustomization(initialCustomization));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const probabilityTotal = useMemo(
    () => customization.prizes.reduce((sum, prize) => sum + (Number.isFinite(prize.probability) ? prize.probability : 0), 0),
    [customization.prizes],
  );

  function updateCopy(key: CopyKey, value: string) {
    setCustomization((current) => ({ ...current, copy: { ...current.copy, [key]: value } }));
    setSaved("");
  }

  function updatePrize(id: string, patch: Partial<PrizeDefinition>) {
    setCustomization((current) => ({
      ...current,
      prizes: current.prizes.map((prize) => prize.id === id ? { ...prize, ...patch } : prize),
    }));
    setSaved("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (probabilityTotal !== 100) {
      setError("Las probabilidades de los premios deben sumar exactamente 100%.");
      return;
    }
    setBusy(true); setError(""); setSaved("");
    try {
      const response = await fetch("/api/merchant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customization),
      });
      const result = await response.json() as { customization?: MerchantCustomization; error?: string };
      if (!response.ok || !result.customization) {
        setError(result.error ?? "No se pudo guardar la configuración.");
        return;
      }
      setCustomization(cloneCustomization(result.customization));
      setSaved("Cambios publicados. La experiencia ya usa esta configuración.");
      router.refresh();
    } catch {
      setError("No se pudo guardar la configuración.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className={`experience merchant-settings-shell theme-${merchant.slug}`}
      style={merchantThemeStyle(merchant)}
      data-merchant={merchant.slug}
    >
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <section className="experience-card merchant-settings-card" data-testid="merchant-settings-panel">
        <header className="merchant-brand merchant-dashboard-brand">
          <span className="brand-mark"><span>{merchant.theme.monogram}</span></span>
          <span className="brand-copy"><strong>{merchant.theme.displayName}</strong><small>Centro de control</small></span>
          <span className="brand-line" aria-hidden="true" />
        </header>

        <div className="merchant-settings-content">
          <div className="merchant-settings-hero">
            <div>
              <p className="eyebrow">Configuración en vivo</p>
              <h1>Hacé tuya la experiencia.</h1>
              <p className="lead">Premios, probabilidades, vigencia y textos se publican sin tocar código. Los premios ya emitidos conservan sus condiciones originales.</p>
            </div>
            <span className="merchant-settings-live">LIVE</span>
          </div>

          <nav className="merchant-panel-switch" aria-label="Panel del comercio">
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/panel`}>Resumen</Link>
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/canjes`}>Canjes</Link>
            <span className="merchant-panel-tab is-active" aria-current="page">Configuración</span>
            <Link className="merchant-panel-tab" href={`/comercio/${merchant.slug}/activacion`}>Activación</Link>
            <Link className="merchant-panel-tab" href={`/${merchant.slug}`}>Ver experiencia</Link>
          </nav>

          <form className="merchant-settings-form" onSubmit={save}>
            <section className="merchant-settings-section">
              <div className="merchant-settings-heading">
                <div><p className="eyebrow">Datos del comercio</p><h2>Identidad y reglas</h2></div>
                <span>Los cambios afectan nuevas participaciones</span>
              </div>
              <div className="merchant-settings-grid">
                <label>
                  <span>Nombre visible</span>
                  <input value={customization.copy.displayName} maxLength={60} onChange={(event) => updateCopy("displayName", event.target.value)} required />
                </label>
                <label>
                  <span>Nombre corto</span>
                  <input value={customization.copy.shortName} maxLength={30} onChange={(event) => updateCopy("shortName", event.target.value)} required />
                </label>
                <label>
                  <span>WhatsApp del comercio</span>
                  <input inputMode="tel" value={customization.whatsappNumber} onChange={(event) => setCustomization((current) => ({ ...current, whatsappNumber: event.target.value }))} required />
                  <small>Sólo números, con código de país y área.</small>
                </label>
                <label>
                  <span>Vigencia del premio</span>
                  <div className="merchant-settings-number"><input type="number" min={1} max={90} value={customization.rewardValidityDays} onChange={(event) => setCustomization((current) => ({ ...current, rewardValidityDays: Number(event.target.value) }))} required /><em>días</em></div>
                </label>
              </div>
            </section>

            <section className="merchant-settings-section">
              <div className="merchant-settings-heading">
                <div><p className="eyebrow">Ruleta</p><h2>Premios y probabilidades</h2></div>
                <div className={`merchant-probability-total ${probabilityTotal === 100 ? "is-valid" : "is-invalid"}`} data-testid="probability-total">
                  <strong>{probabilityTotal}%</strong><span>de 100%</span>
                </div>
              </div>
              <div className="merchant-prize-editor">
                {customization.prizes.map((prize, index) => (
                  <div className="merchant-prize-row" key={prize.id}>
                    <span className="merchant-prize-index">{String(index + 1).padStart(2, "0")}</span>
                    <label><span>Premio</span><input value={prize.name} maxLength={90} onChange={(event) => updatePrize(prize.id, { name: event.target.value })} required /></label>
                    <label className="merchant-probability-field"><span>Probabilidad</span><div><input type="number" min={0} max={100} value={prize.probability} onChange={(event) => updatePrize(prize.id, { probability: Number(event.target.value) })} required /><em>%</em></div></label>
                  </div>
                ))}
              </div>
              <p className="merchant-settings-note">Los identificadores internos de los premios quedan bloqueados para proteger recompensas ya emitidas y estadísticas históricas.</p>
            </section>

            <section className="merchant-settings-section">
              <div className="merchant-settings-heading">
                <div><p className="eyebrow">Copy</p><h2>Textos de la experiencia</h2></div>
                <span>Lo que el cliente lee y comparte</span>
              </div>
              <div className="merchant-copy-editor">
                {copyFields.map((field) => (
                  <label key={field.key}>
                    <span>{field.label}</span>
                    {field.multiline ? (
                      <textarea rows={3} value={customization.copy[field.key]} onChange={(event) => updateCopy(field.key, event.target.value)} required />
                    ) : (
                      <input value={customization.copy[field.key]} onChange={(event) => updateCopy(field.key, event.target.value)} required />
                    )}
                    <small>{field.hint}</small>
                  </label>
                ))}
              </div>
            </section>

            <div className="merchant-settings-actions">
              <div aria-live="polite">
                {error && <p className="error" role="alert">{error}</p>}
                {saved && <p className="merchant-settings-success">{saved}</p>}
              </div>
              <button className="button button-primary" data-testid="save-settings" type="submit" disabled={busy || probabilityTotal !== 100}>
                {busy ? "Publicando…" : "Guardar y publicar"}
              </button>
            </div>
          </form>
        </div>

        <footer className="viralio-signature"><span>Configuración segura por</span> <strong><i aria-hidden="true">V</i> Viralio</strong></footer>
      </section>
    </main>
  );
}
