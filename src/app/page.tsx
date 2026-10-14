import Link from "next/link";
import type { Metadata } from "next";
import { experiences, collections } from "./escape-platform/catalog";
import ExperienceCatalog from "./escape-platform/ExperienceCatalog";
import { SiteHeader, SiteFooter } from "./escape-platform/SiteShell";
import "./escape-platform/escape-premium.css";

export const metadata: Metadata = {
 title: "Viralio — Historias que no mirás. Historias que vivís.",
 description: "Entrá a mundos 3D, explorá salas de escape cinematográficas y resolvé misterios desde tu celular o computadora. Descubrí las experiencias de Viralio.",
 alternates: { canonical: "https://viralio.net/" },
 openGraph: { title: "Viralio — La realidad termina donde empieza tu historia", description: "Experiencias interactivas 3D, aventuras y misterios para jugar online.", type: "website", url: "https://viralio.net/" }
};
const featured = experiences.find(room=>room.featured) || experiences[0];
export default function Home(){
 return <div className="ve-site">
   <SiteHeader/>
   <main id="contenido">
     <section className="ve-hero" aria-labelledby="ve-hero-title">
       <div className="ve-hero-visual" aria-hidden="true">
         {experiences.map((room,index)=><div key={room.slug} className={`ve-portal ve-portal-${room.theme}`}>
           <div className="ve-portal-photo" style={{backgroundImage:`url("${room.cover}")`}}/>
           <span className="ve-portal-overline">{String(index+1).padStart(2,"0")} / {room.categoryLabel}</span>
           <span className="ve-portal-name">{room.title}</span>
         </div>)}
       </div>
       <div className="ve-hero-noise" aria-hidden="true"/>
       <div className="ve-container ve-hero-content">
         <span className="ve-overline ve-metal">VIRALIO / INTERACTIVE ENTERTAINMENT</span>
         <h1 id="ve-hero-title">La realidad termina<br/> donde empieza <em>tu historia.</em></h1>
         <p>Explorá mundos 3D, resolvé misterios y viví historias que no se pueden contar. Porque no estás mirando la aventura: estás dentro de ella.</p>
         <div className="ve-actions">
           <a href="#experiencias" className="ve-button ve-button-primary">Explorar experiencias <span aria-hidden="true">↗</span></a>
           <a href="#como-funciona" className="ve-button ve-button-ghost"><span className="ve-play-symbol" aria-hidden="true">▷</span> Descubrí cómo se juega</a>
         </div>
       </div>
       <div className="ve-hero-foot ve-container">
         <span>001 — UNIVERSOS INTERACTIVOS</span>
         <span>DESLIZÁ PARA DESCUBRIR <span aria-hidden="true">↓</span></span>
       </div>
     </section>
     <div className="ve-feature-strip"><div className="ve-container">
       <span>EXPERIENCIAS 3D REALES</span><i aria-hidden="true">◆</i><span>JUGÁ DESDE TU CELULAR</span><i aria-hidden="true">◆</i><span>ACERTIJOS INTEGRADOS</span><i aria-hidden="true">◆</i><span>HISTORIAS PARA VIVIR</span>
     </div></div>
     <section className="ve-section ve-featured-section" aria-label="Estreno destacado">
       <div className="ve-container">
         <div className="ve-small-heading"><span className="ve-overline ve-metal">EN PRIMER PLANO</span><span>VIRALIO ORIGINALS — 002</span></div>
         <Link href={`/salas/${featured.slug}`} className="ve-featured" style={{backgroundImage:`linear-gradient(90deg,rgba(6,8,11,.95) 0%, rgba(6,8,11,.72) 43%, rgba(6,8,11,.05) 100%), url("${featured.cover}")`}}>
           <span className="ve-featured-inner"><span className="ve-overline ve-metal">EXPERIENCIA DESTACADA / TERROR PARANORMAL</span><strong>{featured.title}</strong><span className="ve-featured-sub">{featured.subtitle}</span><span className="ve-featured-description">{featured.tagline}</span><span className="ve-featured-cta">Conocé esta historia <span aria-hidden="true">↗</span></span></span>
           <span className="ve-featured-side" aria-hidden="true">ENTRÁ BAJO TU RESPONSABILIDAD</span>
         </Link>
       </div>
     </section>
     <ExperienceCatalog/>
     <section className="ve-section ve-collections" id="colecciones">
       <div className="ve-container">
         <div className="ve-section-top"><div><span className="ve-overline ve-metal">02 / UNIVERSOS</span><h2>Infinitas formas <em>de escapar.</em></h2></div><p>Hoy comienza con unas pocas historias. Mañana, nuevas puertas. Nuestro catálogo está hecho para seguir creciendo.</p></div>
         <div className="ve-collection-grid">{collections.map((c,i)=><a key={c.slug} href="#experiencias" className={`ve-collection ve-collection-${i}`}>
           <span className="ve-collection-n">0{i+1} / COLECCIÓN</span><strong>{c.name}</strong><span>{c.detail}</span><span className="ve-collection-open">{experiences.some(r=>r.category===c.count)?"Explorar historias":"Próximamente"} <span aria-hidden="true">↗</span></span>
         </a>)}</div>
       </div>
     </section>
     <section id="como-funciona" className="ve-section ve-how">
       <div className="ve-container ve-how-layout">
         <div><span className="ve-overline ve-metal">03 / CÓMO FUNCIONA</span><h2>Vos tomás<br/> las <em>decisiones.</em></h2><p>No necesitás instalar un videojuego para entrar en otro mundo. Elegí una sala, abrí la experiencia y jugá directamente desde un navegador compatible.</p><a className="ve-text-link" href="#experiencias">Encontrá tu primera historia <span aria-hidden="true">↗</span></a></div>
         <div className="ve-steps">
           <article><span>01</span><div><h3>Elegí un universo.</h3><p>Descubrí cada historia, su duración y qué clase de desafío te espera.</p></div></article>
           <article><span>02</span><div><h3>Entrá a la experiencia.</h3><p>Explorá escenarios tridimensionales desde un celular o computadora compatibles.</p></div></article>
           <article><span>03</span><div><h3>Investigá. Resolvé. Escapá.</h3><p>Observá los detalles, interactuá con objetos y enfrentate al reloj.</p></div></article>
         </div>
       </div>
     </section>
     <section className="ve-gift" id="regalos">
       <div className="ve-container ve-gift-inner">
         <span className="ve-overline ve-metal">UNA HISTORIA PARA ALGUIEN MÁS</span>
         <h2>Los mejores regalos <em>no se envuelven.</em></h2>
         <p>¿Y si la sorpresa estuviera escondida al final de una aventura? Descubrí cómo transformar una sala en una invitación o una historia personalizada.</p>
         <a className="ve-button ve-button-primary" href="https://tehiceesto.com/#escapes" target="_blank" rel="noopener noreferrer">Descubrir experiencias para regalar <span aria-hidden="true">↗</span></a>
       </div>
     </section>
     <section className="ve-faq ve-section" aria-label="Preguntas frecuentes">
       <div className="ve-container ve-faq-layout"><div><span className="ve-overline ve-metal">04 / LO QUE TENÉS QUE SABER</span><h2>Antes de <em>entrar.</em></h2></div>
       <div>
         <details><summary>¿Necesito descargar una aplicación?</summary><p>No. Las experiencias disponibles se abren desde el navegador; necesitás conexión a internet y un dispositivo compatible con gráficos 3D.</p></details>
         <details><summary>¿Puedo jugar desde mi celular?</summary><p>Sí, en celulares compatibles con WebGL2. Recomendamos un navegador actualizado, una conexión estable y utilizar auriculares.</p></details>
         <details><summary>¿Todas las experiencias son de terror?</summary><p>No. Viralio también desarrolla aventuras, misterios y experiencias pensadas para emocionar y sorprender.</p></details>
         <details><summary>¿Dónde compro una experiencia personalizada?</summary><p>Las sorpresas e invitaciones personalizadas se gestionan actualmente a través de Te Hice Esto, nuestro espacio de regalos digitales. Cada opción informa sus condiciones antes de contratar.</p></details>
       </div></div>
     </section>
     <section className="ve-last"><div className="ve-container"><span className="ve-overline ve-metal">EL PRINCIPIO DE ALGO MÁS GRANDE</span><h2>La puerta está abierta.<br/><em>El tiempo no espera.</em></h2><a className="ve-button ve-button-primary" href="#experiencias">Elegir una experiencia <span aria-hidden="true">↗</span></a></div></section>
   </main>
   <SiteFooter/>
 </div>;
}
