"use client";

// Occasion-first assisted purchase flow. Keep deploy-trigger edits batched.\n
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { experiences } from "./data";
import { formatTeHiceEstoPrice } from "./pricing";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./creatorApi";

type Step = 0 | 1 | 2;
type SubmitState = "idle" | "submitting" | "unavailable" | "error";

type OrderResult = {
  code: string;
  priceMinor: number;
  currency: string;
  checkoutUrl: string | null;
  checkoutReady: boolean;
};

const INITIAL_CONTACT = {
  name: "",
  email: "",
  whatsapp: "",
  consent: false,
};

const OCCASION_META: Record<string, { label: string; filter: string; cta: string }> = {
  pareja: { label: "PARA TU PAREJA", filter: "Pareja", cta: "Elegir para mi pareja" },
  cumpleanos: { label: "CUMPLEAÑOS", filter: "Cumpleaños", cta: "Elegir cumpleaños" },
  mama: { label: "PARA MAMÁ", filter: "Mamá", cta: "Elegir para mamá" },
  papa: { label: "PARA PAPÁ", filter: "Papá", cta: "Elegir para papá" },
  hijos: { label: "PARA TU HIJO/A", filter: "Hijo/a", cta: "Elegir para hijo/a" },
  abuelos: { label: "PARA ABUELOS", filter: "Abuelos", cta: "Elegir para abuelos" },
  amistad: { label: "PARA UN/A AMIGO/A", filter: "Amistad", cta: "Elegir amistad" },
  aniversario: { label: "ANIVERSARIO", filter: "Pareja", cta: "Elegir aniversario" },
  propuesta: { label: "PROPUESTA", filter: "Pareja", cta: "Elegir propuesta" },
};

const EXPERIENCE_FILTERS = ["Todas", "Pareja", "Cumpleaños", "Mamá", "Papá", "Hijo/a", "Abuelos", "Amistad"];

const EXPERIENCE_ORDER = [
  "pareja",
  "cumpleanos",
  "mama",
  "papa",
  "hijos",
  "abuelos",
  "amistad",
  "aniversario",
  "propuesta",
];

function normalizeWhatsApp(value: string) {
  return value.replace(/[^0-9+]/g, "").slice(0, 16);
}

function readCookie(name:string){
  if(typeof document==="undefined")return "";
  const prefix=`${name}=`;
  const item=document.cookie.split("; ").find((part)=>part.startsWith(prefix));
  return item?decodeURIComponent(item.slice(prefix.length)):"";
}

export default function CreatorWizard() {
  const [step, setStep] = useState<Step>(0);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [contact, setContact] = useState(INITIAL_CONTACT);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");

  const selected = useMemo(
    () => experiences.find((experience) => experience.slug === selectedSlug),
    [selectedSlug],
  );

  const visibleExperiences = useMemo(() => {
    const rank = new Map(EXPERIENCE_ORDER.map((slug, index) => [slug, index]));
    return experiences
      .filter((experience) => {
        if (activeFilter === "Todas") return true;
        return OCCASION_META[experience.slug]?.filter === activeFilter;
      })
      .sort((a, b) => (rank.get(a.slug) ?? 99) - (rank.get(b.slug) ?? 99));
  }, [activeFilter]);

  const contactValid =
    contact.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) &&
    /^\+?[0-9]{8,15}$/.test(normalizeWhatsApp(contact.whatsapp)) &&
    contact.consent;

  function chooseTemplate(slug: string) {
    setSelectedSlug(slug);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToReview(event: FormEvent) {
    event.preventDefault();
    if (!contactValid) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function createOrder() {
    if (!selected || !contactValid || submitState === "submitting") return;

    setSubmitState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/order-create`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          experienceSlug: selected.slug,
          customerName: contact.name.trim(),
          email: contact.email.trim(),
          whatsapp: normalizeWhatsApp(contact.whatsapp),
          consent: contact.consent,
          website: "",
          affiliateToken: readCookie("thi_affiliate_token"),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<OrderResult> & {
        error?: string;
      };

      if (!response.ok || !data.code) {
        throw new Error(data.error || "order_create_failed");
      }

      setOrderCode(data.code);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setSubmitState("unavailable");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "order_create_failed";
      setErrorMessage(reason);
      setSubmitState("error");
    }
  }

  return (
    <div className="order-flow">
      <aside className="order-flow-rail">
        <Link href="/tehiceesto" className="order-flow-brand">TE HICE ESTO</Link>
        <div className="order-flow-progress" aria-label="Progreso">
          {[
            ["01", "Elegir"],
            ["02", "Tus datos"],
            ["03", "Pagar"],
          ].map(([index, label], itemIndex) => (
            <div
              key={index}
              className={itemIndex < step ? "done" : itemIndex === step ? "active" : ""}
            >
              <span>{itemIndex < step ? "✓" : index}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
        <div className="order-flow-price">
          <small>PRECIO FINAL</small>
          <strong>{formatTeHiceEstoPrice()}</strong>
          <span>Pago único</span>
        </div>
      </aside>

      <section className="order-flow-main">
        {step === 0 && (
          <div className="order-step order-template-step">
            <header className="order-step-head">
              <span className="eyebrow">01 · Elegí la experiencia</span>
              <h1>Elegí la que más se parece a <em>esa persona.</em></h1>
              <p>
                No comprás una plantilla para completar. Elegís una dirección creativa y,
                después del pago, nosotros transformamos tus fotos, audios y recuerdos en una
                experiencia hecha para esa persona.
              </p>
              <div className="order-step-trust" aria-label="Cómo trabajamos">
                <span><b>01</b> Elegís el mundo</span>
                <span><b>02</b> Nos contás la historia</span>
                <span><b>03</b> Nosotros la diseñamos</span>
              </div>
            </header>

            <div className="order-occasion-picker">
              <div className="order-occasion-picker-head">
                <strong>¿PARA QUIÉN O PARA QUÉ OCASIÓN?</strong>
                <span>Filtrá para encontrarla más rápido</span>
              </div>
              <div className="order-occasion-filters" role="group" aria-label="Filtrar experiencias por ocasión">
                {EXPERIENCE_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={activeFilter === filter ? "active" : ""}
                    aria-pressed={activeFilter === filter}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="order-template-grid">
              {visibleExperiences.map((experience) => {
                const index = experiences.findIndex((item) => item.slug === experience.slug);
                const number = String(index + 1).padStart(2, "0");
                const occasion = OCCASION_META[experience.slug] ?? {
                  label: experience.tags[0].toUpperCase(),
                  filter: experience.tags[0],
                  cta: "Elegir experiencia",
                };
                return (
                  <article
                    className={`order-template-card order-template-${experience.slug}`}
                    key={experience.slug}
                    style={{ "--template-accent": experience.accent } as React.CSSProperties}
                  >
                    <div
                      className={`order-template-art ${experience.demo.photos?.[0]?.url ? "has-photo" : ""}`}
                      aria-hidden="true"
                      style={experience.demo.photos?.[0]?.url ? {
                        backgroundImage: `linear-gradient(180deg,rgba(24,19,21,.10),rgba(24,19,21,.50)), url("${experience.demo.photos[0].url}")`,
                        backgroundSize: "cover",
                        backgroundPosition: experience.demo.photos[0].position || "center",
                      } : undefined}
                    >
                      <span>TH / {number}</span>
                      <b>{experience.icon}</b>
                      <em>{occasion.label.replace("PARA ", "")}</em>
                    </div>
                    <div className="order-template-copy">
                      <div className="order-template-overline">
                        <span>{number}</span>
                        <small>{experience.eyebrow}</small>
                      </div>
                      <strong className="order-template-occasion">{occasion.label}</strong>
                      <h2>{experience.title}</h2>
                      <p>{experience.short}</p>
                      <div className="order-template-actions">
                        <button type="button" onClick={() => chooseTemplate(experience.slug)}>
                          {occasion.cta} <span>→</span>
                        </button>
                        <Link href={`/tehiceesto/experiencias/${experience.slug}`} target="_blank">
                          Ver demo ↗
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && selected && (
          <div className="order-step order-contact-step">
            <header className="order-step-head compact">
              <button className="order-back" type="button" onClick={() => setStep(0)}>← Cambiar experiencia</button>
              <span className="eyebrow">02 · Tus datos</span>
              <h1>Nosotros hacemos el resto.</h1>
              <p>
                Estos datos se usan únicamente para gestionar tu pedido y contactarte
                después del pago para pedirte fotos, audios, textos y detalles.
              </p>
            </header>

            <div className="order-selected-template">
              <span>{selected.icon}</span>
              <div>
                <small>ELEGISTE</small>
                <strong>{selected.title}</strong>
              </div>
              <Link href={`/tehiceesto/experiencias/${selected.slug}`} target="_blank">Ver demo ↗</Link>
            </div>

            <form className="order-contact-form" onSubmit={goToReview}>
              <label>
                <span>Tu nombre</span>
                <input
                  autoComplete="name"
                  value={contact.name}
                  onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ej. Mauro"
                  required
                />
              </label>

              <label>
                <span>WhatsApp</span>
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  value={contact.whatsapp}
                  onChange={(event) => setContact((current) => ({ ...current, whatsapp: event.target.value }))}
                  placeholder="Ej. +54 9 221 ..."
                  required
                />
                <small>Por acá coordinamos la creación después del pago.</small>
              </label>

              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  inputMode="email"
                  type="email"
                  value={contact.email}
                  onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))}
                  placeholder="tu@email.com"
                  required
                />
              </label>

              <label className="order-consent">
                <input
                  type="checkbox"
                  checked={contact.consent}
                  onChange={(event) => setContact((current) => ({ ...current, consent: event.target.checked }))}
                />
                <span>
                  Acepto que Te Hice Esto use estos datos para gestionar mi pedido y
                  contactarme para producir la experiencia.
                </span>
              </label>

              <button className="order-primary" type="submit" disabled={!contactValid}>
                Revisar y pagar <span>→</span>
              </button>
            </form>
          </div>
        )}

        {step === 2 && selected && (
          <div className="order-step order-review-step">
            <header className="order-step-head compact">
              <button className="order-back" type="button" onClick={() => setStep(1)}>← Editar datos</button>
              <span className="eyebrow">03 · Confirmar y pagar</span>
              <h1>Tu experiencia empieza acá.</h1>
              <p>
                Después del pago nos ponemos en contacto con vos. Recién ahí te pedimos
                todo lo necesario para crear una versión realmente personal.
              </p>
            </header>

            <div className="order-review-card">
              <div className="order-review-template">
                <span>{selected.icon}</span>
                <div>
                  <small>EXPERIENCIA</small>
                  <strong>{selected.title}</strong>
                </div>
              </div>

              <dl>
                <div><dt>Nombre</dt><dd>{contact.name}</dd></div>
                <div><dt>WhatsApp</dt><dd>{contact.whatsapp}</dd></div>
                <div><dt>Email</dt><dd>{contact.email}</dd></div>
              </dl>

              <div className="order-review-price">
                <div>
                  <small>TOTAL</small>
                  <strong>{formatTeHiceEstoPrice()}</strong>
                </div>
                <span>Pago único · sin suscripción</span>
              </div>

              {submitState === "unavailable" ? (
                <div className="order-payment-unavailable">
                  <span>○</span>
                  <div>
                    <strong>Tu pedido quedó reservado.</strong>
                    <p>
                      El cobro online está temporalmente fuera de servicio. No vamos a
                      iniciar la producción ni contactarte como pedido pago hasta que el
                      pago quede habilitado.
                    </p>
                    {orderCode && (
                      <Link href={`/tehiceesto/pedido/${orderCode}`}>
                        Ver seguimiento privado ↗
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  className="order-pay-button"
                  type="button"
                  onClick={createOrder}
                  disabled={submitState === "submitting"}
                >
                  <span>{submitState === "submitting" ? "PREPARANDO PAGO" : "PAGAR CON MERCADO PAGO"}</span>
                  <strong>{submitState === "submitting" ? "Un momento…" : formatTeHiceEstoPrice()}</strong>
                  <b>{submitState === "submitting" ? "…" : "↗"}</b>
                </button>
              )}

              {submitState === "error" && (
                <div className="order-submit-error">
                  <strong>No pudimos iniciar el pago.</strong>
                  <p>Tu información todavía no fue cobrada. Probá nuevamente en unos segundos.</p>
                  <button type="button" onClick={createOrder}>Reintentar</button>
                  <small>{errorMessage}</small>
                </div>
              )}

              <div className="order-after-payment">
                <article><span>01</span><p>Elegís y pagás.</p></article>
                <article><span>02</span><p>Te escribimos nosotros.</p></article>
                <article><span>03</span><p>Nos pasás recuerdos y detalles.</p></article>
                <article><span>04</span><p>Diseñamos y entregamos el link privado.</p></article>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
