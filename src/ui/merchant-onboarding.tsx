"use client";

import { useMemo, useState } from "react";

interface OnboardingResult {
  merchant: { id: string; slug: string; name: string };
  experiencePath: string;
  panelPath: string;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function MerchantOnboarding() {
  const [onboardingKey, setOnboardingKey] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [template, setTemplate] = useState<"coffee" | "barber">("coffee");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnboardingResult>();

  const previewSlug = useMemo(() => slug || slugify(name), [name, slug]);

  function changeName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
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
        body: JSON.stringify({ onboardingKey, name, slug, template, whatsappNumber, pin }),
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
          <h1>De cero a campaña activa.</h1>
          <p>Creá el acceso, la experiencia inicial y los premios base sin tocar código.</p>
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
              <div className="onboarding-section-title"><span>02</span><div><strong>Identidad</strong><small>Lo que verá el cliente final</small></div></div>
              <div className="onboarding-grid">
                <label>
                  Nombre del comercio
                  <input data-testid="onboarding-name" value={name} onChange={(event) => changeName(event.target.value)} placeholder="Ej. Bruma Café" required maxLength={60} />
                </label>
                <label>
                  Rubro / plantilla
                  <select data-testid="onboarding-template" value={template} onChange={(event) => setTemplate(event.target.value as "coffee" | "barber")}>
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
            </section>

            <section className="onboarding-section">
              <div className="onboarding-section-title"><span>03</span><div><strong>Operación</strong><small>Canjes y contacto del comercio</small></div></div>
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
              <p className="onboarding-security-note"><span aria-hidden="true">◆</span> El PIN no se guarda en texto plano. Viralio lo deriva con scrypt, salt individual y secreto del servidor.</p>
            </section>

            <button className="onboarding-submit" data-testid="create-merchant" type="submit" disabled={busy}>{busy ? "Creando comercio…" : "Crear comercio y campaña"}</button>
            {error && <p className="onboarding-error" role="alert">{error}</p>}
          </form>
        ) : (
          <section className="onboarding-success" data-testid="onboarding-success">
            <div className="success-mark" aria-hidden="true">✓</div>
            <p className="eyebrow">Comercio activado</p>
            <h2>{result.merchant.name} ya existe en Viralio.</h2>
            <p>La campaña inicial quedó creada con premios, probabilidades y textos editables desde el panel.</p>
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
            <button className="onboarding-secondary" onClick={() => { setResult(undefined); setName(""); setSlug(""); setSlugTouched(false); setWhatsappNumber(""); }}>Crear otro comercio</button>
          </section>
        )}

        <footer className="onboarding-footer"><span>VIRALIO</span><small>Infraestructura multi-comercio · alta protegida</small></footer>
      </section>
    </main>
  );
}
