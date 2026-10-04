import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  stage:"received"|"payment"|"production"|"ready";
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
  {key:"received",index:"01",title:"Borrador recibido",copy:"Tu historia ya quedó guardada de forma privada."},
  {key:"payment",index:"02",title:"Pago",copy:"Coordinamos y verificamos el pago antes de producir la versión final."},
  {key:"production",index:"03",title:"Producción",copy:"Estamos afinando textos, recuerdos, sonidos y detalles de la experiencia."},
  {key:"ready",index:"04",title:"Lista para entregar",copy:"La experiencia final ya está publicada en su link privado."},
] as const;

function stageIndex(stage:StatusPayload["stage"]){
  return Math.max(0,stages.findIndex(item=>item.key===stage));
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

  const response=await fetch(`${SUPABASE_URL}/functions/v1/order-status?code=${encodeURIComponent(code)}`,{
    headers:{apikey:PUBLISHABLE_KEY,accept:"application/json"},
    cache:"no-store",
  });
  if(response.status===404)notFound();
  if(!response.ok)throw new Error("order_status_failed");

  const data=(await response.json()) as StatusPayload;
  const experience=getExperience(data.experienceSlug);
  const current=stageIndex(data.stage);
  const amount=data.order?.amountMinor!=null&&data.order.amountMinor>0
    ?new Intl.NumberFormat("es-AR",{style:"currency",currency:data.order.currency||"ARS",maximumFractionDigits:0}).format(data.order.amountMinor/100)
    :null;
  const waText=encodeURIComponent(`Hola! Quiero consultar por mi experiencia Te Hice Esto. Código: ${data.code.toUpperCase()}`);

  return <main className="order-status-shell">
    <div className="order-status-aura aura-a" aria-hidden="true"/>
    <div className="order-status-aura aura-b" aria-hidden="true"/>

    <header className="order-status-top">
      <Link href="/tehiceesto" className="order-status-brand">TE HICE ESTO</Link>
      <span>SEGUIMIENTO PRIVADO</span>
    </header>

    <section className="order-status-hero">
      <span className="order-status-kicker">PEDIDO · {data.code.toUpperCase()}</span>
      <h1>{data.stage==="ready"?"Ya está listo.":data.stage==="production"?"Ya lo estamos haciendo.":data.stage==="payment"?"Tu historia ya llegó.":"Recibimos tu historia."}</h1>
      <p>
        {experience?.icon||"✦"} {experience?.title||"Experiencia"} · de <strong>{data.giverName}</strong> para <strong>{data.recipientName}</strong>
      </p>
      <div className={`order-status-live ${data.stage}`}>
        <i/>
        <span>{data.stage==="ready"?"LISTA PARA ENTREGAR":data.stage==="production"?"EN PRODUCCIÓN":data.stage==="payment"?"ESPERANDO CONFIRMACIÓN DE PAGO":"RECIBIDA"}</span>
      </div>
    </section>

    {pago&&["exitoso","pendiente","fallido"].includes(pago)&&(
      <section className={`order-payment-return ${pago}`}>
        <span>{pago==="fallido"?"×":pago==="pendiente"?"…":"✓"}</span>
        <div>
          <strong>{pago==="exitoso"
            ?data.stage==="payment"?"Pago enviado · verificando acreditación":"Pago confirmado"
            :pago==="pendiente"
              ?"El pago quedó pendiente"
              :"El pago no se completó"}</strong>
          <p>{pago==="exitoso"
            ?data.stage==="payment"
              ?"Mercado Pago ya recibió la operación. La confirmación puede tardar unos segundos; esta pantalla se actualiza sola."
              :"La acreditación ya quedó registrada en tu pedido."
            :pago==="pendiente"
              ?"No hace falta empezar de nuevo. Podés volver al botón de pago o consultarnos por WhatsApp."
              :"Tu pedido sigue guardado. Podés intentar nuevamente cuando quieras sin perder nada."}</p>
        </div>
      </section>
    )}

    <section className="order-status-timeline">
      {stages.map((item,index)=>{
        const done=index<current||data.stage==="ready";
        const active=index===current&&data.stage!=="ready";
        return <article key={item.key} className={done?"done":active?"active":""}>
          <div className="order-status-index">{done?"✓":item.index}</div>
          <div>
            <strong>{item.title}</strong>
            <p>{item.copy}</p>
            {item.key==="payment"&&active&&amount&&<small>Monto registrado: {amount}</small>}
          </div>
          <span className="order-status-line"/>
        </article>;
      })}
    </section>

    {data.stage==="ready"&&data.giftUrl?(
      <section className="order-status-ready">
        <span>VERSIÓN FINAL</span>
        <h2>Antes de mandarlo, vivilo vos.</h2>
        <p>El link ya está activo y es privado. Revisalo una vez más y cuando quieras, compartilo con esa persona.</p>
        <Link href={`/tehiceesto/r/${data.code}`} className="order-status-primary">Abrir experiencia <b>↗</b></Link>
        <small>No publiques capturas si querés conservar la sorpresa.</small>
      </section>
    ):(
      <section className="order-status-waiting">
        <div>
          <span>ESTADO ACTUAL</span>
          <h2>{data.stage==="production"?"Estamos trabajando en los detalles.":data.stage==="payment"?"Seguimos por WhatsApp.":"Ya tenemos el punto de partida."}</h2>
          <p>{data.stage==="production"
            ?"Cuando la versión final quede publicada, este mismo link va a mostrarte el botón para abrirla."
            :data.stage==="payment"
              ?"El valor y el medio de pago se confirman por WhatsApp. Este seguimiento no cobra nada por sí solo."
              :"Podés volver a este link cuando quieras para ver cómo avanza."}</p>
        </div>
        <div className="order-status-actions">
          {data.stage==="payment"&&data.order?.checkoutUrl&&(
            <a href={data.order.checkoutUrl} target="_blank" rel="noreferrer noopener" className="order-status-pay">
              {amount?`Pagar ${amount}`:"Ir al pago"} <b>↗</b>
            </a>
          )}
          <a href={`https://wa.me/5492215653163?text=${waText}`} target="_blank" rel="noreferrer noopener" className="order-status-whatsapp">Consultar por WhatsApp ↗</a>
        </div>
      </section>
    )}

    <footer className="order-status-footer">
      <div className="order-status-footer-left">
        <Link href={`/tehiceesto/pedido/${data.code}`}>Actualizar ahora ↻</Link>
        <OrderStatusAutoRefresh active={data.stage!=="ready"}/>
      </div>
      <span>Tu contenido no aparece en buscadores.</span>
    </footer>
  </main>;
}
