"use client";

import Link from "next/link";

export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <main className="system-state-page">
    <div className="system-state-orbit" aria-hidden="true"/>
    <span className="eyebrow">Algo no salió como debía</span>
    <h1>La experiencia sigue acá.<br/><em>Probemos abrirla de nuevo.</em></h1>
    <p>No se perdió tu información. Podés reintentar ahora o volver al inicio.</p>
    <div className="system-state-actions">
      <button className="home-primary" type="button" onClick={reset}>Reintentar <span>↻</span></button>
      <Link className="home-secondary" href="/">Ir al inicio <span>→</span></Link>
    </div>
  </main>;
}