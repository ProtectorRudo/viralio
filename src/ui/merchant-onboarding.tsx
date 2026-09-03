"use client";

import { useMemo, useState } from "react";
import type { MerchantBrandProfile, MerchantExperienceCopy } from "@/domain/types";

interface OnboardingResult {
  merchant: { id: string; slug: string; name: string };
  experiencePath: string;
  panelPath: string;
}

interface BrandDraft {
  brand: MerchantBrandProfile;
  copy: Partial<MerchantExperienceCopy>;
}

const MAX_LOGO_BYTES = 700 * 1024;
const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function fileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el logo"));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo leer el logo"));
    reader.readAsDataURL(file);
  });
}

export function MerchantOnboarding() {
  const [onboardingKey, setOnboardingKey] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [template, setTemplate] = useState<"coffee" | "barber">("coffee");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [pin, setPin] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [brandBrief, setBrandBrief] = useState("");
  const [useAiBranding, setUseAiBranding] = useState(true);
  const [brandDraft, setBrandDraft] = useState<BrandDraft>();
  const [brandBusy, setBrandBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnboardingResult>();

  const previewSlug = useMemo(() => slug || slugify(name), [name, slug]);

  function invalidateDraft() {
    setBrandDraft(undefined);
  }

  function changeName(value: string) {
    setName(value);
    invalidateDraft();
    if (!slugTouched) setSlug(slugify(value));
  }

  async function changeLogo(file?: File) {
    setError("");
    invalidateDraft();
    if (!file) {
      setLogoDataUrl("");
      return;
    }
    if (!LOGO_TYPES.has(file.type) || file.size > MAX_LOGO_BYTES) {
      setLogoDataUrl("");
      setError("El logo debe ser PNG, JPG o WebP y pesar menos de 700 KB");
      return;
    }
    try {
      setLogoDataUrl(await fileDataUrl(file));
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  async function generateBrand() {
    setError("");
    setBrandBusy(true);
    setBrandDraft(undefined);
    try {
      const response = await fetch("/api/onboarding/brand-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingKey, name, template, brief: brandBrief, logoDataUrl: logoDataUrl || undefined }),
      });
      const payload = await response.json() as BrandDraft & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "No se pudo generar la identidad");
        return;
      }
      setBrandDraft(payload);
    } catch {
      setError("No se pudo conectar con ChatGPT para branding");
    } finally {
      setBrandBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      const response = await fetch("/api/onboarding/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingKey,
          name,
          slug,
          template,
          whatsappNumber,
          pin,
          logoDataUrl: logoDataUrl || undefined,
          brand: brandDraft?.brand,
          brandCopy: brandDraft?.copy,
        }),
      });
      const payload = await response.json() as OnboardingResult & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "No se pudo crear el comercio");
        return;
      }
      setResult(payload);
      setPin("");
    } catch {
      setError("No se pudo conectar con Viralio");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(undefined);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setWhatsappNumber("");
    setLogoDataUrl("");
    setBrandBrief("");
    setBrandDraft(undefined);
    setUseAiBranding(true);
  }

  return (
    <main className="onboarding-shell">
      <div className="onboarding-glow onboarding-glow-one" aria-hidden="true" />
      <div className="onboarding-glow onboarding-glow-two" aria-hidden="true" />
      <section className="onboarding-card" data-testid="merchant-onboarding">
        <header className="onboarding-brand">
          <span className="onboarding-logo">V</span>
          <div><strong>Viralio</strong><small>Alta de comercio</small></div>
          <span className="onboarding-badge">OPERADOR</span>
        </header>

        <div className="onboarding-hero">
          <p className="eyebrow">Nuevo comercio</p>
          <h1>De marca real a experiencia Viralio.</h1>
          <p>Cargá su identidad y ChatGPT propone un funnel coherente con el comercio, sin tocar código.</p>
        </div>

        {!result ? (
          <form className="onboarding-form" onSubmit={submit}>
            <section className="onboarding-section">
              <div className="onboarding-section-title"><span>01</span><div><strong>Acceso de operador</strong><small>Protege el alta de cuentas nuevas</small></div></div>
              <label>
                Clave privada de alta
                <input data-testid="onboarding-key" type="password" autoComplete="off" value={onboardingKey} onChange={(event) => setOnboardingKey(event.target.value)} required />
              </label>
            </section>

            <section className="onboarding-section">
              <div className="onboarding-section-title"><span>02</span><div><strong>Identidad</strong><small>Marca, logo y rubro del comercio</small></div></div>
              <div className="onboarding-grid">
                <label>
                  Nombre del comercio
                  <input data-testid="onboarding-name" value={name} onChange={(event) => changeName(event.target.value)} placeholder="Ej. Bruma Café" required maxLength={60} />
                </label>
                <label>
                  Rubro / plantilla base
                  <select data-testid="onboarding-template" value={template} onChange={(event) => { setTemplate(event.target.value as "coffee" | "barber"); invalidateDraft(); }}>
                    <option value="coffee">Café / gastronomía</option>
                    <option value="barber">Barbería / peluquería</option>
                  </select>
                </label>
              </div>
              <label>
                URL corta
                <div className="slug-input"><span>/</span><input data-testid="onboarding-slug" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(slugify(event.target.value)); }} placeholder="bruma-cafe" required /></div>
                <small className="field-hint">Quedará como: viralio / {previewSlug || "tu-comercio"}</small>
              </label>

              <div className="onboarding-grid">
                <label>
                  Logo del comercio
                  <input data-testid="onboarding-logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void changeLogo(event.target.files?.[0])} />
                  <small className="field-hint">PNG, JPG o WebP · máximo 700 KB</small>
                </label>
                <label>
                  Breve descripción de la marca
                  <textarea data-testid="brand-brief" value={brandBrief} onChange={(event) => { setBrandBrief(event.target.value); invalidateDraft(); }} maxLength={700} rows={4} placeholder="Ej. Café de especialidad de barrio, cálido, artesanal, público joven-adulto, queremos vernos premium sin ser pretenciosos." />
                </label>
              </div>

              {logoDataUrl && (
                <div data-testid="logo-preview" style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, border: "1px solid rgba(127,127,127,.25)", borderRadius: 16 }}>
                  <span style={{ width: 64, height: 64, borderRadius: 14, background: `#fff center / contain no-repeat url(${logoDataUrl})`, border: "1px solid rgba(127,127,127,.2)" }} aria-hidden="true" />
                  <div><strong>Logo listo</strong><br /><small>Viralio lo usará en funnel, premio y estados.</small></div>
                </div>
              )}
            </section>

            <section className="onboarding-section">
              <div className="onboarding-section-title"><span>03</span><div><strong>Brand Engine</strong><small>Identidad asistida por ChatGPT, render controlado por Viralio</small></div></div>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input data-testid="brand-ai-toggle" type="checkbox" checked={useAiBranding} onChange={(event) => { setUseAiBranding(event.target.checked); if (!event.target.checked) setBrandDraft(undefined); }} />
                Generar identidad con ChatGPT
              </label>
              {useAiBranding && (
                <button className="onboarding-secondary" data-testid="generate-brand" type="button" onClick={() => void generateBrand()} disabled={brandBusy || !onboardingKey || name.trim().length < 2 || brandBrief.trim().length < 3}>
                  {brandBusy ? "ChatGPT está diseñando…" : brandDraft ? "Regenerar identidad con ChatGPT" : "Generar identidad con ChatGPT"}
                </button>
              )}

              {brandDraft && (
                <div data-testid="brand-preview" style={{ display: "grid", gap: 14, padding: 16, border: `1px solid ${brandDraft.brand.palette.border}`, borderRadius: 18, background: brandDraft.brand.palette.canvas, color: brandDraft.brand.palette.text }}>
                  <div><strong>{brandDraft.brand.stylePreset.toUpperCase()}</strong> · {brandDraft.brand.fontPreset} · <small>{brandDraft.brand.tone}</small></div>
                  <div style={{ display: "flex", gap: 8 }} aria-label="Paleta sugerida">
                    {[brandDraft.brand.palette.primary, brandDraft.brand.palette.accent, brandDraft.brand.palette.accentSecondary, brandDraft.brand.palette.canvas, brandDraft.brand.palette.surface].map((color) => (
                      <span key={color} title={color} style={{ width: 34, height: 34, borderRadius: 999, background: color, border: `1px solid ${brandDraft.brand.palette.border}` }} />
                    ))}
                  </div>
                  <strong style={{ fontSize: 20 }}>{brandDraft.copy.heroTitle}</strong>
                  <small>{brandDraft.copy.heroCopy}</small>
                  <small>Story/Estado: {brandDraft.copy.socialHeadline}</small>
                </div>
              )}
              {!useAiBranding && <p className="field-hint">Sin IA, Viralio usa la plantilla segura y conserva el logo cargado. Podés personalizar después.</p>}
            </section>

            <section className="onboarding-section">
              <div className="onboarding-section-title"><span>04</span><div><strong>Operación</strong><small>Canjes y contacto del comercio</small></div></div>
              <div className="onboarding-grid">
                <label>
                  WhatsApp con código de país
                  <input data-testid="onboarding-whatsapp" inputMode="tel" value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="5492215550000" required />
                </label>
                <label>
                  PIN del comercio
                  <input data-testid="onboarding-pin" type="password" inputMode="numeric" pattern="[0-9]{4,12}" minLength={4} maxLength={12} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} placeholder="6 dígitos" required />
                </label>
              </div>
              <p className="onboarding-security-note"><span aria-hidden="true">◆</span> El PIN no se guarda en texto plano. La API key de OpenAI tampoco llega al navegador.</p>
            </section>

            <button className="onboarding-submit" data-testid="create-merchant" type="submit" disabled={busy || brandBusy}>{busy ? "Creando comercio…" : "Crear comercio y campaña"}</button>
            {error && <p className="onboarding-error" role="alert">{error}</p>}
          </form>
        ) : (
          <section className="onboarding-success" data-testid="onboarding-success">
            <div className="success-mark" aria-hidden="true">✓</div>
            <p className="eyebrow">Comercio activado</p>
            <h2>{result.merchant.name} ya existe en Viralio.</h2>
            <p>La campaña y su identidad visual quedaron guardadas. El mismo Brand Engine se usa en funnel, premios y piezas para compartir.</p>
            <div className="onboarding-link-card">
              <span>Experiencia del cliente</span>
              <strong data-testid="created-experience-path">{result.experiencePath}</strong>
              <a href={result.experiencePath} target="_blank" rel="noreferrer">Abrir experiencia ↗</a>
            </div>
            <div className="onboarding-link-card">
              <span>Acceso del comercio</span>
              <strong data-testid="created-panel-path">{result.panelPath}</strong>
              <a href={result.panelPath}>Ir al panel →</a>
            </div>
            <button className="onboarding-secondary" onClick={reset}>Crear otro comercio</button>
          </section>
        )}

        <footer className="onboarding-footer"><span>VIRALIO</span><small>Brand Engine · identidad asistida por ChatGPT</small></footer>
      </section>
    </main>
  );
}
