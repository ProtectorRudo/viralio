"use client";

// Occasion-first assisted purchase flow. Keep deploy-trigger edits batched.\n
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { experiences } from "./data";
import { isComingSoon } from "./availability";
import GiftPicker from "./GiftPicker";
import { formatTeHiceEstoPrice } from "./pricing";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./creatorApi";

type Step = 0 | 1;
type SubmitState = "idle" | "submitting" | "unavailable" | "error";

type OrderResult = {
  code: string;
  priceMinor: number;
  currency: string;
  checkoutUrl: string | null;
  checkoutReady: boolean;
  editorToken?: string;
};

const INITIAL_CONTACT = {
  name: "",
  email: "",
  whatsapp: "",
  consent: false,
};

function normalizeWhatsApp(value: string) {
  return value.replace(/[^0-9+]/g, "").slice(0, 16);
}

function readCookie(name:string){
  if(typeof document==="undefined")return "";
  const prefix=`${name}=`;
  const item=document.cookie.split("; ").find((part)=>part.startsWith(prefix));
  return item?decodeURIComponent(item.slice(prefix.length)):"";
}

const ORDER_REQUEST_KEY="thi_order_request";

function storedOrderRequest(scope:string){
  if(typeof window==="undefined")return "";
  try{
    const raw=window.sessionStorage.getItem(ORDER_REQUEST_KEY);
    const parsed=raw?JSON.parse(raw) as {id?:string;scope?:string}:null;
    return parsed?.scope===scope&&typeof parsed.id==="string"?parsed.id:"";
  }catch{return ""}
}

function persistOrderRequest(id:string,scope:string){
  if(typeof window==="undefined")return;
  window.sessionStorage.setItem(ORDER_REQUEST_KEY,JSON.stringify({id,scope}));
}

function clearStoredOrderRequest(){
  if(typeof window==="undefined")return;
  window.sessionStorage.removeItem(ORDER_REQUEST_KEY);
}

export default function CreatorWizard({initialExperience=""}:{initialExperience?:string}) {
  const validInitial=experiences.some((experience)=>experience.slug===initialExperience&&!isComingSoon(experience.slug))?initialExperience:"";
  const [step, setStep] = useState<Step>(validInitial?1:0);
  const [selectedSlug, setSelectedSlug] = useState(validInitial);
  const [contact, setContact] = useState(INITIAL_CONTACT);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const orderRequestId = useRef("");

  const selected = useMemo(
    () => experiences.find((experience) => experience.slug === selectedSlug),
    [selectedSlug],
  );

  const contactValid =
    contact.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) &&
    /^\+?[0-9]{8,15}$/.test(normalizeWhatsApp(contact.whatsapp)) &&
    contact.consent;

  function chooseTemplate(slug: string) {
    if(isComingSoon(slug))return;
    orderRequestId.current="";
    clearStoredOrderRequest();
    setSelectedSlug(slug);
    setSubmitState("idle");
    setErrorMessage("");
    setOrderCode("");
    setStep(1);
    window.scrollTo({top:0,behavior:"auto"});
  }

  function submitPayment(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    void createOrder();
  }

  async function createOrder() {
    if (!selected || isComingSoon(selected.slug) || !contactValid || submitState === "submitting") return;

    setSubmitState("submitting");
    setErrorMessage("");
    const requestScope=`${selected.slug}|${contact.email.trim().toLowerCase()}`;
    if(!orderRequestId.current){
      orderRequestId.current=storedOrderRequest(requestScope)||window.crypto.randomUUID();
      persistOrderRequest(orderRequestId.current,requestScope);
    }

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
          clientRequestId: orderRequestId.current,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<OrderResult> & {
        error?: string;
      };

      if (!response.ok || !data.code) {
        throw new Error(data.error || "order_create_failed");
      }

      setOrderCode(data.code);
      if (data.editorToken) {
        window.localStorage.setItem(`thi_editor_access:${data.code}`, data.editorToken);
      }

      if (data.checkoutUrl) {
        clearStoredOrderRequest();
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
    <div className="order-flow thi-purchase-page" data-active-step={step}>
      <header className="thi-buy-topbar">
        <div className="thi-buy-topline">
          <Link href="/tehiceesto" className="thi-buy-brand"><span aria-hidden="true">♡</span> TeHiceEsto<span className="thi-buy-brand-domain">.com</span></Link>
          <span className="thi-buy-trust"><i aria-hidden="true">♧</i> Pago seguro</span>
        </div>
        <nav className="thi-buy-progress" aria-label="Pasos de compra">
          {["Elegir regalo","Datos y pago"].map((label,index)=>(
            <div key={label} className={index===step?"active":index<step?"done":""} aria-current={index===step?"step":undefined}>
              <span>{index<step?"✓":String(index+1).padStart(2,"0")}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </nav>
      </header>
      <section className="order-flow-main">
        {step === 0 && <GiftPicker onSelect={chooseTemplate}/>}

        {step === 1 && selected && (
          <div className="order-step order-contact-step">
            <header className="order-step-head compact">
              <button className="order-back" type="button" onClick={() => setStep(0)}>← Cambiar experiencia</button>
              <span className="eyebrow">02 · TUS DATOS Y PAGO</span>
              <h1>Último paso. <em>Ya casi es suyo.</em></h1>
              <p>Dejá tus datos y pagá de forma segura con Mercado Pago. Personalizás el regalo después del pago, sin crear una cuenta.</p>
            </header>

            <div className="order-selected-template">
              <span>{selected.icon}</span>
              <div>
                <small>ELEGISTE</small>
                <strong>{selected.title}</strong>
              </div>
              <Link href={`/tehiceesto/experiencias/${selected.slug}`} target="_blank">Ver cómo se ve</Link>
            </div>

            <form className="order-contact-form" onSubmit={submitPayment}>
              <label>
                <span>Tu nombre</span>
                <input
                  autoComplete="name"
                  value={contact.name}
                  onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ej. Mauro"
                  minLength={2}
                  required
                />
              </label>

              <label>
                <span>WhatsApp</span>
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  value={contact.whatsapp}
                  onChange={(event) => setContact((current) => ({ ...current, whatsapp: normalizeWhatsApp(event.target.value) }))}
                  placeholder="Ej. 2215653163"
                  minLength={8}
                  maxLength={16}
                  pattern="\+?[0-9]{8,15}"
                  title="Escribí tu número con al menos 8 dígitos."
                  required
                />
                <small>Escribilo con números. Lo usamos sólo para acompañar tu compra si necesitás ayuda.</small>
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
                <small>Usá un email al que tengas acceso para identificar tu pedido y recuperar el regalo.</small>
              </label>

              <label className="order-consent">
                <input
                  type="checkbox"
                  checked={contact.consent}
                  onChange={(event) => setContact((current) => ({ ...current, consent: event.target.checked }))}
                  required
                />
                <span>
                  Acepto que Te Hice Esto use estos datos para gestionar mi compra,
                  habilitar mi edición y ayudarme a recuperar el acceso si lo necesito.
                </span>
              </label>

              {submitState==="unavailable" ? (
                <div className="order-payment-unavailable" role="status">
                  <span>○</span>
                  <div>
                    <strong>Tu pedido quedó registrado.</strong>
                    <p>No pudimos preparar el enlace de Mercado Pago. Tu pedido se guardó y todavía no se realizó ningún cobro. Podés reintentar sin duplicarlo.</p>
                    <button type="button" className="order-primary thi-simple-pay" onClick={()=>void createOrder()} style={{width:"100%",margin:"14px 0 10px"}}>Reintentar pago seguro →</button>
                    {orderCode&&<Link href={`/tehiceesto/pedido/${orderCode}`}>Ver seguimiento privado ↗</Link>}
                  </div>
                </div>
              ) : (
                <button className="order-primary thi-simple-pay" type="submit" disabled={submitState==="submitting"}>
                  <span>{submitState==="submitting"?"Preparando pago…":"Ir a Mercado Pago"}</span>
                  <strong>{submitState==="submitting"?"":formatTeHiceEstoPrice()}</strong>
                  <span aria-hidden="true">{submitState==="submitting"?"…":"→"}</span>
                </button>
              )}
              {submitState==="error"&&<div className="order-submit-error" role="alert">
                <strong>No pudimos iniciar el pago.</strong>
                <p>Todavía no se realizó ningún cobro. Revisá los datos e intentá nuevamente.</p>
                <small>{errorMessage}</small>
              </div>}
              <p className="thi-simple-pay-note">Pago único · sin suscripción · Personalizás después de pagar.</p>
            </form>
          </div>
        )}

      </section>
    </div>
  );
}
