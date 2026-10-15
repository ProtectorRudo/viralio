import Link from "next/link";
import type { Metadata } from "next";
import { experiences } from "../escape-platform/catalog";
import { RealGameplayShowcase } from "../escape-platform/RealGameplayShowcase";
import { SiteHeader, SiteFooter } from "../escape-platform/SiteShell";
import "../escape-platform/escape-premium.css";

const sample=experiences.find(room=>room.slug==="aislamiento-15")!;

export const metadata: Metadata={
 title:"Probá una sala gratis — Viralio Escape",
 description:"Entrá gratis a AISLAMIENTO 15 y experimentá un escape room de terror 3D auténtico en tu navegador, sin instalar nada y sin registrarte.",
 alternates:{canonical:"https://viralio.net/probar"},
 openGraph:{title:"Probá gratis AISLAMIENTO 15 | Viralio",description:"Conocé un escape room 3D real. Prueba abierta y acceso inmediato desde tu celular.",url:"https://viralio.net/probar"}
};

export default function FreeTrialPage(){
 return <div className="ve-site">
  <SiteHeader/>
  <main id="contenido">
   <section className="ve-trial-hero">
    <div className="ve-container ve-trial-layout">
     <div className="ve-trial-intro">
      <Link className="ve-room-back" href="/#experiencias">← Todas las experiencias</Link>
      <span className="ve-overline ve-metal">TU PRIMERA PUERTA / SIN PAGAR NADA</span>
      <h1>Antes de creerlo,<br/><em>vivilo.</em></h1>
      <p>Entrá a <strong>AISLAMIENTO 15</strong>: un hospital 3D que podés recorrer, tocar y explorar desde el navegador. Descubrí si Viralio es para vos en una prueba real, no un video promocional.</p>
      <div className="ve-trial-conditions">
       <span>◷ Hasta 15 minutos</span><span>◈ Exploración 3D real</span>
       <span>◎ Sin registro</span><span>✓ Sin tarjeta</span>
      </div>
      <a className="ve-button ve-button-primary" href={sample.playUrl} target="_blank" rel="noopener noreferrer">Empezar la prueba gratis <span aria-hidden="true">↗</span></a>
      <p className="ve-trial-honesty"><strong>Prueba abierta temporal.</strong> Actualmente se puede jugar la experiencia completa sin pagar; no existe una compra obligatoria ni un límite artificial de demostración. Cuando se habiliten las versiones comerciales, sus precios y condiciones se informarán antes de contratar.</p>
     </div>
     <div className="ve-trial-poster" style={{backgroundImage:"linear-gradient(180deg,rgba(4,10,12,.08),rgba(4,10,12,.83)),url('"+sample.cover+"')"}}>
      <span>VIRALIO ORIGINALS / 004</span>
      <strong>{sample.title}</strong>
      <small>{sample.subtitle}</small>
      <a href={sample.playUrl} target="_blank" rel="noopener noreferrer" aria-label="Entrar a AISLAMIENTO 15">ENTRAR AHORA <span aria-hidden="true">↗</span></a>
     </div>
    </div>
   </section>
   <RealGameplayShowcase compact/>
   <section className="ve-section ve-trial-help" aria-labelledby="ve-trial-help">
    <div className="ve-container">
     <span className="ve-overline ve-metal">CÓMO PROBARLA</span>
     <h2 id="ve-trial-help">Tres pasos. <em>Una salida.</em></h2>
     <div className="ve-trial-steps">
      <article><span>01 / ABRÍ</span><h3>Elegí entrar</h3><p>Se abre el juego en otra pestaña. No pedimos email ni datos de pago.</p></article>
      <article><span>02 / EXPLORÁ</span><h3>Movete libremente</h3><p>En celular, caminá con el control izquierdo y deslizá para mirar. Usá dos dedos para acercar la cámara.</p></article>
      <article><span>03 / ESCAPÁ</span><h3>Vencé al reloj</h3><p>Investigá los tres sectores del hospital. Tenés 15 minutos para encontrar la salida.</p></article>
     </div>
     <p className="ve-trial-requirements">Necesitás un navegador actualizado compatible con WebGL2. Recomendamos auriculares y una conexión estable. Puede haber sonidos fuertes, destellos breves y escenas de terror.</p>
     <Link className="ve-text-link" href="/#experiencias">Explorar todas las salas <span aria-hidden="true">↗</span></Link>
    </div>
   </section>
  </main>
  <SiteFooter/>
 </div>;
}
