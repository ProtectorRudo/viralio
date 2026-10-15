import Link from "next/link";
import { experiences } from "./catalog";

const room=experiences.find(item=>item.slug==="aislamiento-15")!;

/** Production footage of the actual React/Three.js hospital, not a stock render. */
export function RealGameplayShowcase({compact=false}:{compact?:boolean}) {
 return <section className={compact?"ve-realfilm ve-realfilm-compact":"ve-realfilm"} id="trailer" aria-label="Tráiler con escenas reales de AISLAMIENTO 15">
  <div className="ve-container ve-realfilm-layout">
   <div className="ve-realfilm-copy">
    <span className="ve-overline ve-metal">MIRÁ ANTES DE ENTRAR / GAMEPLAY REAL</span>
    <h2>No te mostramos<br/><em>un concepto.</em></h2>
    <p>Estas imágenes están grabadas dentro de <strong>AISLAMIENTO 15</strong>, con el motor 3D real del juego. Explorá tres sectores del hospital y decidí si te animás a entrar.</p>
    <div className="ve-realfilm-facts"><span>TRAILER REAL</span><span>THREE.JS / WEBGL</span><span>SIN SPOILERS</span></div>
    <div className="ve-realfilm-actions">
     <Link className="ve-button ve-button-primary" href="/probar">Probar gratis <span aria-hidden="true">↗</span></Link>
     <Link className="ve-text-link" href="/salas/aislamiento-15">Conocer la sala <span aria-hidden="true">↗</span></Link>
    </div>
   </div>
   <div className="ve-realfilm-stage">
    <div className="ve-realfilm-topline"><span>VIRALIO ORIGINALS</span><span>ARCHIVO / HÉLIX 015</span></div>
    <video
     className="ve-realfilm-video"
     controls
     preload="none"
     playsInline
     poster={room.cover}
     aria-label="Tráiler de AISLAMIENTO 15: escenas auténticas de las tres salas 3D del juego, sin audio"
    >
     <source src={room.trailerUrl} type="video/mp4"/>
     Tu navegador no puede reproducir este vídeo. <a href={room.playUrl}>Jugá AISLAMIENTO 15 directamente.</a>
    </video>
    <div className="ve-realfilm-caption"><span><span className="ve-record-dot" aria-hidden="true"/> MATERIAL CAPTURADO EN EL JUEGO REAL</span><span>VÍDEO SIN AUDIO</span></div>
   </div>
  </div>
 </section>;
}
