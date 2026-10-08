import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getExperience } from "../../data";
import OrderStatusAutoRefresh from "./OrderStatusAutoRefresh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estado de tu experiencia — Te Hice Esto",
  description: "Seguimiento privado de tu experiencia Te Hice Esto.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

const SUPABASE_URL="https://efvvadfxuyieswdqnsjg.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";

type StatusPayload={
  code:string;
  stage:"received"|"payment"|"personalize"|"ready";
  giftStatus:string;
  experienceSlug:string;
  giverName:string;
  recipientName:string;
  createdAt:string;
  updatedAt:string;
  publishedAt:string|null;
  order:{status:string;checkoutUrl:string|null;amountMinor:number|null;currency:string;paidAt:string|null;updatedAt:string}|null;
  giftUrl:string|null;
};

const stages=[
  {index:"01",title:"Elegiste tu experiencia",copy:"Tu pedido y tus datos quedaron guardados de forma privada."},
  {index:"02",title:"Pago confirmado",copy:"Mercado Pago habilita la personalización cuando acredita la compra."},
  {index:"03",title:"La hacés tuya",copy:"Subís fotos y audios, cambiás palabras y elegís qué partes querés mostrar."},
  {index:"04",title:"Lista para compartir",copy:"Publicás y recibís el link privado en el momento."},
] as const;

function journeyIndex(data:StatusPayload){
  if(data.giftStatus==="published"||data.stage==="ready")return 3;
  if(data.order?.status==="approved")return 2;
  if(data.order)return 1;
  return 0;
}

export default async function OrderStatusPage({
  params,
  searchParams,
}:{
  params:Promise<{code:string}>;
  searchParams:Promise<{pago?:string}>;
}){
  const {code}=await params;
  const {pago}=await searchParams;
  if(!/^[a-f0-9]{18}$/.test(code))notFound();

  const host=(await headers()).get("host")?.split(":")[0].toLowerCase()||"";
  const dedicated=host==="tehiceesto.com"||host==="www.tehiceesto.com";
  const prefix=dedicated?"":"/tehiceesto";
  const href=(value:string)=>`${prefix}${value}`;

  const response=await fetch(`${SUPABASE_URL}/functions/v1/order-status?code=${encodeURIComponent(code)}`,{
    headers:{apikey:PUBLISHABLE_KEY,accept:"application/json"},
    cache:"no-store",
  });
  if(response.status===404)notFound();
  if(!response.ok)throw new Error("order_status_failed");

  const data=(await response.json()) as StatusPayload;
  const experience=getExperience(data.experienceSlug);
  const current=journeyIndex(data);
  const paid=data.order?.status==="approved";
  const ready=current===3;
  const amount=data.order?.amountMinor!=null&&data.order.amountMinor>0
    ?new Intl.NumberFormat("es-AR",{style:"currency",currency:data.order.currency||"ARS",maximumFractionDigits:0}).format(data.order.amountMinor/100)
    :null;
  const waText=encodeURIComponent(`Hola! Quiero consultar por mi experiencia Te Hice Esto. Código: ${data.code.toUpperCase()}`);

  return <main className="order-status-shell">
    <div className="order-status-aura aura-a" aria-hidden="true"/>
    <div className="order-status-aura aura-b" aria-hidden="true"/>

    <header className="order-status-top">
      <Link href={href("/")} className="order-status-brand">TE HICE ESTO</Link>
      <span>SEGUIMIENTO PRIVADO</span>
    </header>

    <section className="order-status-hero">
      <span className="order-status-kicker">PEDIDO · {data.code.toUpperCase()}</span>
      <h1>{ready?"Ya está listo.":paid?"Ahora lo hacés tuyo.":"Tu pedido ya quedó reservado."}</h1>
      <p>
        {experience?.icon||"✦"} {experience?.title||"Experiencia"} · de <strong>{data.giverName}</strong>{data.recipientName&&data.recipientName!=="A definir"?<> para <strong>{data.recipientName}</strong></>:""}
      </p>
      <div className={`order-status-live ${ready?"ready":paid?"production":"payment"}`}>
        <i/>
        <span>{ready?"LISTA PARA COMPARTIR":paid?"YA PODÉS PERSONALIZAR":"ESPERANDO CONFIRMACIÓN DE PAGO"}</span>
      </div>
    </section>

    {pago&&["exitoso","pendiente","fallido"].includes(pago)&&(
      <section className={`order-payment-return ${pago}`}>
        <span>{pago==="fallido"?"×":pago==="pendiente"?"…":"✓"}</span>
        <div>
          <strong>{pago==="exitoso"
            ?paid?"Pago confirmado · ya podés personalizar":"Pago enviado · verificando acreditación"
            :pago==="pendiente"
              ?"El pago quedó pendiente"
              :"El pago no se completó"}</strong>
          <p>{pago==="exitoso"
            ?paid
              ?"El pago está confirmado. Ya podés empezar a personalizar tu regalo."
              :"Mercado Pago ya recibió la operación. La confirmación puede tardar unos segundos; esta pantalla se actualiza sola."
            :pago==="pendiente"
              ?"No hace falta empezar de nuevo. Podés volver al botón de pago cuando quieras."
              :"Tu pedido sigue guardado. Podés intentar nuevamente sin perder nada."}</p>
        </div>
      </section>
    )}

    {ready?(
      <section className="order-status-ready">
        <span>TU REGALO ESTÁ PUBLICADO</span>
        <h2>Ya podés mandarlo.</h2>
        <p>El link es privado. Podés abrirlo, compartirlo o volver a personalizarlo cuando quieras.</p>
        <div className="order-status-actions">
          <Link href={href(`/r/${data.code}`)} className="order-status-primary">Abrir mi regalo <b>↗</b></Link>
          <Link href={href(`/editar/${data.code}`)} className="order-status-whatsapp">Cambiar algo</Link>
          <Link href={href("/mis-regalos")} className="order-status-whatsapp">Mis regalos</Link>
        </div>
        <small>No publiques capturas si querés conservar la sorpresa.</small>
      </section>
    ):paid?(
      <section className="order-status-waiting">
        <div>
          <span>SIGUIENTE PASO</span>
          <h2>Ahora hacelo tuyo.</h2>
          <p>Te vamos guiando pantalla por pantalla. No necesitás saber editar ni diseñar nada. Todo se guarda automáticamente y también te mandamos un acceso privado por email.</p>
        </div>
        <div className="order-status-actions">
          <Link href={href(`/editar/${data.code}`)} className="order-status-pay">
            Empezar a personalizar <b>→</b>
          </Link>
          <a href={`https://wa.me/5492215653163?text=${waText}`} target="_blank" rel="noreferrer noopener" className="order-status-whatsapp">Necesito ayuda</a>
        </div>
      </section>
    ):null}

    <section className="order-status-timeline">
      {stages.map((item,index)=>{
        const done=index<current||ready;
        const active=index===current&&!ready;
        return <article key={item.index} className={done?"done":active?"active":""}>
          <div className="order-status-index">{done?"✓":item.index}</div>
          <div>
            <strong>{item.title}</strong>
            <p>{item.copy}</p>
            {index===1&&active&&amount&&<small>Monto: {amount}</small>}
          </div>
          <span className="order-status-line"/>
        </article>;
      })}
    </section>

    {!paid&&!ready&&(
      <section className="order-status-waiting">
        <div>
          <span>ESTADO ACTUAL</span>
          <h2>Falta confirmar el pago.</h2>
          <p>Cuando Mercado Pago lo acredite, acá mismo va a aparecer el botón para empezar a personalizar.</p>
        </div>
        <div className="order-status-actions">
          {data.order?.checkoutUrl&&(
            <a href={data.order.checkoutUrl} target="_blank" rel="noreferrer noopener" className="order-status-pay">
              {amount?`Pagar ${amount}`:"Ir al pago"} <b>↗</b>
            </a>
          )}
          <a href={`https://wa.me/5492215653163?text=${waText}`} target="_blank" rel="noreferrer noopener" className="order-status-whatsapp">Consultar por WhatsApp</a>
        </div>
      </section>
    )}

    <footer className="order-status-footer">
      <div className="order-status-footer-left">
        <Link href={href(`/pedido/${data.code}`)}>Actualizar ahora ↻</Link>
        <Link href={href("/mis-regalos")}>Mis regalos</Link>
        <OrderStatusAutoRefresh active={!ready}/>
      </div>
      <span>Tu contenido no aparece en buscadores.</span>
    </footer>
  </main>;
}
