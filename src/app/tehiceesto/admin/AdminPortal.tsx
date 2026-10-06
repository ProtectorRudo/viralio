/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCall, SESSION_KEY } from "./api";
import { experiences } from "../data";

type CommerceSettings = {
  default_price_minor: number | null;
  currency: string;
  auto_checkout_enabled: boolean;
  updated_at: string | null;
};

type GiftRow = {
  public_code: string;
  status: string;
  experience_slug: string;
  giver_name: string;
  recipient_name: string;
  created_at: string;
  published_at: string | null;
  story_data?: { creator?: { submitted?: boolean; submittedAt?: string } } | null;
  order?: { status: string; amount_minor: number | null; currency: string; provider: string } | null;
};

export default function AdminPortal() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [loginError, setLoginError] = useState("");
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [commerce, setCommerce] = useState<CommerceSettings|null>(null);
  const [defaultPrice, setDefaultPrice] = useState("");
  const [commerceSaving, setCommerceSaving] = useState(false);
  const [commerceMessage, setCommerceMessage] = useState("");
  const [mpReady, setMpReady] = useState<boolean|null>(null);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function loadGifts() {
    setLoading(true);
    try {
      const [data, commerceData] = await Promise.all([
        adminCall<{ gifts: GiftRow[] }>("listGifts"),
        adminCall<{ settings: CommerceSettings }>("getCommerceSettings"),
      ]);
      setGifts(data.gifts || []);
      setCommerce(commerceData.settings);
      setDefaultPrice(
        commerceData.settings.default_price_minor != null
          ? String(commerceData.settings.default_price_minor / 100)
          : "",
      );
      setLoggedIn(true);
    } catch {
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout?status=1",{cache:"no-store"})
      .then(response=>response.ok?response.json():Promise.reject(new Error("status_failed")))
      .then((data:{configured?:boolean})=>setMpReady(data.configured===true))
      .catch(()=>setMpReady(false));

    const hasSession = Boolean(window.sessionStorage.getItem(SESSION_KEY));
    setLoggedIn(hasSession);
    setSessionReady(true);
    if (hasSession) loadGifts();

    const expire = () => setLoggedIn(false);
    window.addEventListener("thi-admin-session-expired", expire);
    return () => window.removeEventListener("thi-admin-session-expired", expire);
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const data = await adminCall<{ token: string; expiresAt: string }>(
        "login",
        { accessKey },
        false,
      );
      window.sessionStorage.setItem(SESSION_KEY, data.token);
      setAccessKey("");
      setLoggedIn(true);
      await loadGifts();
    } catch {
      setLoginError("Clave incorrecta.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await adminCall("logout");
    } catch {}
    window.sessionStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
    setGifts([]);
  }

  const publishedCount = gifts.filter((gift) => gift.status === "published").length;
  const draftCount = gifts.filter((gift) => ["draft","awaiting_payment","paid"].includes(gift.status)).length;
  const creatorLeadCount = gifts.filter((gift) => gift.story_data?.creator?.submitted).length;
  const pendingPaymentCount = gifts.filter((gift) => gift.order?.status === "pending").length;

  async function saveCommerceSettings() {
    const priceMinor = defaultPrice.trim()===""
      ? null
      : Math.round(Number(defaultPrice.replace(",","."))*100);
    if(priceMinor!==null&&(!Number.isFinite(priceMinor)||priceMinor<=0)){
      setCommerceMessage("Revisá el precio.");
      return;
    }

    setCommerceSaving(true);
    setCommerceMessage("");
    try{
      const data=await adminCall<{settings:CommerceSettings}>("updateCommerceSettings",{
        defaultPriceMinor:priceMinor,
        autoCheckoutEnabled:commerce?.auto_checkout_enabled===true,
      });
      setCommerce({...data.settings,updated_at:new Date().toISOString()});
      setCommerceMessage("Configuración guardada ✓");
    }catch(error){
      const reason=error instanceof Error?error.message:"save_failed";
      setCommerceMessage(reason==="default_price_required"?"Definí un precio antes de activar el cobro automático.":"No se pudo guardar.");
    }finally{
      setCommerceSaving(false);
      setTimeout(()=>setCommerceMessage(""),2500);
    }
  }

  async function toggleAutoCheckout() {
    if(!commerce)return;
    const next=!commerce.auto_checkout_enabled;
    const priceMinor=defaultPrice.trim()===""?null:Math.round(Number(defaultPrice.replace(",","."))*100);
    if(next&&(priceMinor===null||!Number.isFinite(priceMinor)||priceMinor<=0)){
      setCommerceMessage("Primero definí el precio base.");
      return;
    }
    setCommerceSaving(true);
    try{
      const data=await adminCall<{settings:CommerceSettings}>("updateCommerceSettings",{
        defaultPriceMinor:priceMinor,
        autoCheckoutEnabled:next,
      });
      setCommerce({...data.settings,updated_at:new Date().toISOString()});
      setCommerceMessage(next?"Cobro automático activado ✓":"Cobro automático pausado.");
    }catch{
      setCommerceMessage("No se pudo cambiar la automatización.");
    }finally{
      setCommerceSaving(false);
      setTimeout(()=>setCommerceMessage(""),2500);
    }
  }

  async function createGift(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);

    try {
      const data = await adminCall<{ code: string }>("createGift", {
        experienceSlug: String(form.get("experienceSlug") || ""),
        giverName: String(form.get("giverName") || ""),
        recipientName: String(form.get("recipientName") || ""),
        occasion: String(form.get("occasion") || ""),
        feeling: String(form.get("feeling") || ""),
      });

      router.push(`/tehiceesto/admin/${data.code}`);
    } finally {
      setLoading(false);
    }
  }

  if (!sessionReady) {
    return <main className="thi-admin-shell"><div className="thi-admin-loading">Cargando…</div></main>;
  }

  if (!loggedIn) {
    return (
      <main className="thi-admin-shell thi-admin-login-shell">
        <section className="thi-admin-login-card thi-admin-login-premium">
          <div className="thi-admin-login-orbit orbit-a" aria-hidden="true"/>
          <div className="thi-admin-login-orbit orbit-b" aria-hidden="true"/>
          <div className="thi-admin-lockmark" aria-hidden="true"><span>◇</span><i/></div>
          <Link href="/tehiceesto" className="thi-admin-back">← Te Hice Esto</Link>
          <p className="thi-kicker">Panel interno</p>
          <h1>Armado de regalos</h1>
          <p>
            Acceso privado para crear, revisar y publicar experiencias.
          </p>

          <form onSubmit={login}>
            <label>
              <span>Clave de acceso</span>
              <input
                type="password"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                autoFocus
                required
              />
            </label>
            {loginError && <small className="thi-admin-error">{loginError}</small>}
            <button className="thi-primary" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="thi-admin-shell">
      <header className="thi-admin-header thi-admin-header-premium">
        <div className="thi-admin-header-aura" aria-hidden="true"/>
        <div>
          <Link href="/tehiceesto" className="thi-admin-back">← Te Hice Esto</Link>
          <p className="thi-kicker">Operación</p>
          <h1>Regalos</h1>
        </div>

        <div className="thi-admin-header-actions">
          <Link className="thi-ghost" href="/tehiceesto/admin/afiliados">Afiliados ↗</Link>
          <button className="thi-primary" onClick={() => setShowNew(true)}>
            + Nuevo regalo
          </button>
          <button className="thi-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="thi-admin-stat-grid">
        <article><span>Total</span><strong>{gifts.length}</strong><small>regalos creados</small></article>
        <article><span>Publicados</span><strong>{publishedCount}</strong><small>links activos</small></article>
        <article><span>En preparación</span><strong>{draftCount}</strong><small>borradores y pedidos activos</small></article>
        <article className="accent"><span>Pagos pendientes</span><strong>{pendingPaymentCount}</strong><small>{creatorLeadCount} llegaron desde la web</small></article>
      </section>

      <section className="thi-admin-panel thi-commerce-panel">
        <div className="thi-admin-panel-heading">
          <div>
            <p className="thi-kicker">Venta automática</p>
            <h2>Precio y Mercado Pago</h2>
            <p>Definí un precio base una sola vez. Si activás la automatización, cada pedido nuevo puede salir con su cobro preparado sin que tengas que armar el link a mano.</p>
          </div>
          <div className={`thi-commerce-health ${mpReady===true?"ready":mpReady===false?"fallback":"checking"}`}>
            <i/>
            <span>{mpReady===true?"Mercado Pago conectado":mpReady===false?"Modo manual":"Verificando"}</span>
          </div>
        </div>

        <div className="thi-commerce-grid">
          <label>
            <span>Precio base · ARS</span>
            <input
              inputMode="decimal"
              value={defaultPrice}
              onChange={(event)=>setDefaultPrice(event.target.value)}
              placeholder="Definir cuando quieras"
            />
            <small>No inventamos un importe: queda vacío hasta que vos decidas cuánto cobrar.</small>
          </label>

          <div className="thi-commerce-switch-wrap">
            <span>Cobro automático</span>
            <button
              type="button"
              className={commerce?.auto_checkout_enabled?"thi-commerce-switch on":"thi-commerce-switch"}
              onClick={toggleAutoCheckout}
              disabled={commerceSaving||mpReady===false}
              aria-pressed={commerce?.auto_checkout_enabled===true}
            >
              <i/><strong>{commerce?.auto_checkout_enabled?"Activo":"Pausado"}</strong>
            </button>
            <small>{commerce?.auto_checkout_enabled
              ?"Los nuevos pedidos usarán el precio base y recibirán su checkout automáticamente."
              :"Seguís pudiendo generar el cobro manualmente desde cada pedido."}</small>
          </div>
        </div>

        <div className="thi-commerce-actions">
          <button className="thi-primary" type="button" onClick={saveCommerceSettings} disabled={commerceSaving}>
            {commerceSaving?"Guardando…":"Guardar configuración"}
          </button>
          {commerceMessage&&<span>{commerceMessage}</span>}
        </div>
      </section>

      {showNew && (
        <section className="thi-admin-panel thi-admin-new-panel">
          <div className="thi-admin-panel-heading">
            <div>
              <p className="thi-kicker">Nuevo</p>
              <h2>Crear borrador</h2>
            </div>
            <button className="thi-ghost" onClick={() => setShowNew(false)}>Cerrar</button>
          </div>

          <form className="thi-admin-form" onSubmit={createGift}>
            <label>
              <span>Experiencia</span>
              <select name="experienceSlug" defaultValue="pareja">
                {experiences.map((experience) => (
                  <option value={experience.slug} key={experience.slug}>
                    {experience.icon} {experience.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Quién regala</span>
              <input name="giverName" required placeholder="Ej. Mauro" />
            </label>

            <label>
              <span>Quién recibe</span>
              <input name="recipientName" required placeholder="Ej. Ailín" />
            </label>

            <label>
              <span>Ocasión</span>
              <input name="occasion" placeholder="Ej. aniversario 8 años" />
            </label>

            <label className="wide">
              <span>Emoción</span>
              <select name="feeling" defaultValue="Emoción">
                <option>Emoción</option>
                <option>Amor</option>
                <option>Sorpresa</option>
                <option>Diversión</option>
                <option>Nostalgia</option>
              </select>
            </label>

            <div className="wide thi-admin-form-actions">
              <button className="thi-primary" disabled={loading}>
                {loading ? "Creando…" : "Crear borrador →"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="thi-admin-panel">
        <div className="thi-admin-panel-heading">
          <div>
            <p className="thi-kicker">Actividad</p>
            <h2>Últimos regalos</h2>
          </div>
          <button className="thi-ghost" onClick={loadGifts} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>

        {gifts.length === 0 ? (
          <div className="thi-admin-empty">
            <strong>Todavía no hay regalos.</strong>
            <p>El primero que creemos va a aparecer acá.</p>
          </div>
        ) : (
          <div className="thi-admin-table-wrap">
            <table className="thi-admin-table">
              <thead>
                <tr>
                  <th>Destinatario</th>
                  <th>De</th>
                  <th>Experiencia</th>
                  <th>Origen</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Código</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((gift) => (
                  <tr key={gift.public_code}>
                    <td>
                      <Link href={`/tehiceesto/admin/${gift.public_code}`} className="thi-admin-gift-link">
                        <strong>{gift.recipient_name}</strong>
                        <span>Editar →</span>
                      </Link>
                    </td>
                    <td>{gift.giver_name}</td>
                    <td>{gift.experience_slug}</td>
                    <td>
                      <span className={gift.story_data?.creator?.submitted ? "thi-source-badge creator" : "thi-source-badge manual"}>
                        {gift.story_data?.creator?.submitted ? "Web" : "Manual"}
                      </span>
                    </td>
                    <td>
                      {gift.order ? (
                        <span className={`thi-payment-badge ${gift.order.status}`}>
                          {gift.order.status === "approved" ? "Pagado" : gift.order.status === "pending" ? "Pendiente" : gift.order.status}
                        </span>
                      ) : <span className="thi-payment-badge none">—</span>}
                    </td>
                    <td>
                      <span className={`thi-status ${gift.status}`}>
                        {gift.status === "awaiting_payment" ? "esperando pago" : gift.status}
                      </span>
                    </td>
                    <td><code>{gift.public_code}</code></td>
                    <td>{new Date(gift.created_at).toLocaleDateString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
