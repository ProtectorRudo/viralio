import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { experiences, getExperience } from "../../escape-platform/catalog";
import { SiteFooter, SiteHeader } from "../../escape-platform/SiteShell";
import "../../escape-platform/escape-premium.css";

type Props = { params: Promise<{slug:string}> };
export function generateStaticParams() { return experiences.map(room=>({slug:room.slug})); }
export async function generateMetadata({params}:Props):Promise<Metadata> {
 const {slug}=await params; const room=getExperience(slug);
 if(!room)return {title:"Sala no encontrada — Viralio"};
 return {
   title:`${room.title} — ${room.subtitle} | Viralio`,
   description:room.synopsis,
   alternates:{canonical:`https://viralio.net/salas/${room.slug}`},
   openGraph:{title:`${room.title} — Viralio`,description:room.synopsis,type:"website",url:`https://viralio.net/salas/${room.slug}`}
 };
}
export default async function ExperiencePage({params}:Props) {
 const {slug}=await params;
 const room=getExperience(slug);
 if(!room)notFound();
 return <div className="ve-site">
   <SiteHeader />
   <main id="contenido">
     <section className={`ve-room-hero ve-room-${room.theme}`} style={{backgroundImage:`url("${room.cover}")`}}>
       <div className="ve-container ve-room-heading">
         <Link className="ve-room-back" href="/#experiencias">← Volver a experiencias</Link>
         <span className="ve-overline ve-metal">VIRALIO ORIGINALS / {room.categoryLabel}</span>
         <h1>{room.title}</h1>
         <span className="ve-room-subtitle">{room.subtitle}</span>
         <p>{room.tagline}</p>
         <div className="ve-room-facts">
           <span>◷ {room.duration}</span><span>Dificultad: {room.difficulty}</span><span>Modo: {room.mode}</span>
         </div>
         <div className="ve-actions">
           <a className="ve-button ve-button-primary" href={room.playUrl} target="_blank" rel="noopener noreferrer">Jugar experiencia <span aria-hidden="true">↗</span></a>
           <a className="ve-button ve-button-ghost" href="https://tehiceesto.com/#escapes" target="_blank" rel="noopener noreferrer">Explorar versiones para regalar <span aria-hidden="true">↗</span></a>
         </div>
       </div>
     </section>
     <section className="ve-room-detail">
       <div className="ve-container ve-room-detail-grid">
         <div><span className="ve-overline ve-metal">LA HISTORIA / SIN SPOILERS</span><h2>Hay algo que debés descubrir.</h2>
           {room.story.map((p,i)=><p key={i}>{p}</p>)}
           <p className="ve-catalog-note">{room.photoCredit}. La portada es ilustrativa y no es una captura de la partida.</p>
         </div>
         <aside className="ve-room-panel">
           <span className="ve-overline ve-metal">TU PRÓXIMO DESAFÍO</span>
           <p><strong>Duración:</strong> {room.duration}</p>
           <p><strong>Dificultad:</strong> {room.difficulty}</p>
           <p><strong>Dispositivos:</strong> celular o computadora compatibles con gráficos 3D (WebGL2).</p>
           <p><strong>Recomendación:</strong> jugá con auriculares y en un lugar tranquilo.</p>
           <a className="ve-button ve-button-primary" href={room.playUrl} target="_blank" rel="noopener noreferrer">Entrar a la sala <span aria-hidden="true">↗</span></a>
           <small>La partida se abre en el sitio donde está alojado el juego. Las modalidades comerciales se anunciarán con condiciones y precios visibles.</small>
         </aside>
       </div>
     </section>
     <section className="ve-last"><div className="ve-container"><span className="ve-overline ve-metal">EXPLORÁ MÁS HISTORIAS</span><h2>Una puerta se cierra.<br/><em>Otras te esperan.</em></h2><Link className="ve-button ve-button-primary" href="/#experiencias">Volver al catálogo <span aria-hidden="true">↗</span></Link></div></section>
   </main>
   <SiteFooter />
 </div>;
}
