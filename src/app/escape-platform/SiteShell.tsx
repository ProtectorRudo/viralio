import Link from "next/link";
export function SiteHeader() {
  return <header className="ve-header">
    <div className="ve-navwrap">
      <Link href="/" className="ve-mark" aria-label="Viralio — inicio">
        <span className="ve-mark-icon" aria-hidden="true">V</span>
        <span className="ve-mark-word">VIRALIO<small>INTERACTIVE ENTERTAINMENT</small></span>
      </Link>
      <nav className="ve-desktop-nav" aria-label="Navegación principal">
        <Link href="/#experiencias">Experiencias</Link>
        <Link href="/#colecciones">Colecciones</Link>
        <Link href="/#como-funciona">Cómo se juega</Link>
        <Link href="/#regalos">Regalos</Link>
      </nav>
      <Link className="ve-nav-action" href="/#experiencias">Explorar experiencias <span aria-hidden="true">↗</span></Link>
      <details className="ve-mobile-menu">
        <summary aria-label="Abrir menú de navegación"><span></span><span></span><span></span></summary>
        <nav aria-label="Menú móvil">
          <Link href="/#experiencias">Experiencias</Link>
          <Link href="/#colecciones">Colecciones</Link>
          <Link href="/#como-funciona">Cómo se juega</Link>
          <Link href="/#regalos">Regalos</Link>
          <Link href="/comercios">Para comercios</Link>
        </nav>
      </details>
    </div>
  </header>;
}
export function SiteFooter() {
 return <footer className="ve-footer">
   <div className="ve-container ve-footer-inside">
     <div><Link href="/" className="ve-footer-logo">VIRALIO<span>®</span></Link><p>Historias que no mirás. Historias que vivís.</p></div>
     <div className="ve-footer-links"><Link href="/#experiencias">Experiencias</Link><Link href="/#como-funciona">Cómo se juega</Link><Link href="/#regalos">Regalar</Link><Link href="/comercios">Viralio para comercios</Link></div>
     <small>© {new Date().getFullYear()} Viralio · Hecho para jugar.</small>
   </div>
 </footer>;
}
