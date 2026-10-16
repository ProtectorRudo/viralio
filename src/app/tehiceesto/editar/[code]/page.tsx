import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {getEscapeRoom} from "../../escape-rooms";
import CustomerStudio from "../CustomerStudio";

export const dynamic="force-dynamic";

export const metadata:Metadata={
  title:"Personalizar mi regalo",
  description:"Tu estudio privado para personalizar la experiencia.",
  robots:{index:false,follow:false,nocache:true},
  referrer:"no-referrer",
};

export default async function StudioPage({params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  if(!/^[a-f0-9]{18}$/.test(code))notFound();
  const response=await fetch("https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/order-status?code="+encodeURIComponent(code),{
    headers:{apikey:"sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN",accept:"application/json"},cache:"no-store"
  });
  if(response.ok){
    const gift=await response.json() as {experienceSlug?:string;templateVersion?:string};
    if(gift.experienceSlug==="pareja"&&gift.templateVersion==="premium-v5"){
      const url="https://wa.me/5492215653163?text="+encodeURIComponent("Hola, compré Pareja en Te Hice Esto. Código: "+code.toUpperCase()+". Quiero coordinar la personalización.");
      return <main className="order-status-shell">
        <section className="order-status-hero"><h1>La personalización la hacemos nosotros.</h1><p>Tu experiencia ya está diseñada. Coordinamos los nombres, fotografías, audios y dedicatorias para entregártela lista para compartir.</p></section>
        <section className="order-status-waiting"><div><h2>Contanos tu historia.</h2><p>Tené a mano tu código de compra.</p></div>
          <div className="order-status-actions"><a className="order-status-pay" href={url} target="_blank" rel="noopener noreferrer">Escribirnos por WhatsApp ↗</a><Link href={"/tehiceesto/pedido/"+code} className="order-status-whatsapp">Ver pedido</Link></div>
        </section>
      </main>;
    }
    const room=gift.experienceSlug?.startsWith("escape-")?getEscapeRoom(gift.experienceSlug.slice(7)):undefined;
    if(room){
      const message=encodeURIComponent("Hola, compré "+room.title+" y quiero coordinar la personalización. Código: "+code.toUpperCase());
      return <main className="order-status-shell">
        <header className="order-status-top"><Link href="/tehiceesto" className="order-status-brand">TE HICE ESTO</Link><span>PERSONALIZACIÓN ASISTIDA</span></header>
        <section className="order-status-hero"><span className="order-status-kicker">EXPERIENCIA · {room.title}</span>
          <h1>La sorpresa la preparamos nosotros.</h1><p>Tu recorrido 3D ya está diseñado. Sólo necesitamos los datos que harán único el mensaje final.</p>
        </section>
        <section className="order-status-waiting"><div><span>SIGUIENTE PASO</span><h2>Contanos a quién vas a sorprender.</h2>
          <p>Escribinos por WhatsApp con el código de compra. Nuestro equipo prepara la carta o invitación, revisa los datos y te entrega un enlace privado.</p></div>
          <div className="order-status-actions">
            <a className="order-status-pay" href={"https://wa.me/5492215653163?text="+message} target="_blank" rel="noopener noreferrer">Coordinar personalización ↗</a>
            <Link className="order-status-whatsapp" href={"/pedido/"+code}>Seguir mi pedido</Link>
          </div>
        </section>
      </main>;
    }
  }
  return <CustomerStudio code={code}/>;
}
