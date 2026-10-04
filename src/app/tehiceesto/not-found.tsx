import Link from "next/link";

export default function NotFound(){
  return <main className="system-state-page">
    <div className="system-state-orbit" aria-hidden="true"/>
    <span className="eyebrow">404 · Acá no hay una historia esperando</span>
    <h1>Este lugar no existe.<br/><em>Pero podemos crear uno.</em></h1>
    <p>El link puede haber cambiado o simplemente llegaste a una dirección que no existe.</p>
    <div className="system-state-actions">
      <Link className="home-primary" href="/">Volver al inicio <span>→</span></Link>
      <Link className="home-secondary" href="/crear">Crear una experiencia <span>↗</span></Link>
    </div>
  </main>;
}