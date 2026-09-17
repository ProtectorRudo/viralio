import Link from "next/link";

const demos = [
  {
    href: "/moka",
    name: "Moka",
    type: "Café de especialidad",
    description: "Una experiencia cálida, editorial y sofisticada.",
    monogram: "M",
    className: "landing-demo landing-demo-moka",
  },
  {
    href: "/atlas-barber",
    name: "Atlas Barber",
    type: "Barbería contemporánea",
    description: "Una experiencia oscura, geométrica y urbana.",
    monogram: "A",
    className: "landing-demo landing-demo-atlas",
  },
] as const;

export default function Home() {
  return (
    <main className="viralio-landing">
      <header className="landing-nav">
        <Link href="/" className="landing-brand" aria-label="Viralio inicio">
          <span className="landing-logo">V</span>
          <span>VIRALIO</span>
        </Link>
        <a className="landing-nav-link" href="#demos">Ver demos</a>
      </header>

      <section className="landing-hero">
        <p className="landing-kicker">Para comercios físicos</p>
        <h1>Dale a tus clientes una razón para volver.</h1>
        <p className="landing-lead">
          Después de una compra, Viralio convierte un QR en una experiencia simple: el cliente recomienda tu negocio por WhatsApp, recibe un regalo y tiene un motivo concreto para volver.
        </p>
        <div className="landing-actions">
          <a className="landing-cta landing-cta-primary" href="#demos">Probar una experiencia</a>
          <a className="landing-cta landing-cta-secondary" href="#como-funciona">Cómo funciona</a>
        </div>
      </section>

      <section className="landing-benefits" id="como-funciona" aria-label="Cómo funciona Viralio">
        <article>
          <span>01</span>
          <strong>Compra</strong>
          <p>El cliente compra y escanea el QR del comercio.</p>
        </article>
        <article>
          <span>02</span>
          <strong>Recomienda</strong>
          <p>Antes de descubrir su regalo, comparte el negocio por WhatsApp.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Vuelve</strong>
          <p>Recibe un premio pensado principalmente para una próxima compra.</p>
        </article>
      </section>

      <section className="landing-proof">
        <p>El cliente siente que recibió algo.</p>
        <h2>El comercio consigue recomendación, recompra y datos para medir qué funciona.</h2>
      </section>

      <section className="landing-demos" id="demos">
        <div className="landing-section-heading">
          <p className="landing-kicker">Probalo</p>
          <h2>La misma lógica, adaptada a cada marca.</h2>
          <p>Estas demos muestran cómo Viralio puede sentirse propio en rubros y estilos distintos.</p>
        </div>

        <div className="landing-demo-grid">
          {demos.map((demo, index) => (
            <Link key={demo.href} href={demo.href} className={demo.className}>
              <span className="landing-demo-number">0{index + 1}</span>
              <span className="landing-demo-mark">{demo.monogram}</span>
              <span className="landing-demo-copy">
                <small>{demo.type}</small>
                <strong>{demo.name}</strong>
                <span>{demo.description}</span>
              </span>
              <span className="landing-demo-open">Abrir demo ↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <p className="landing-kicker">VIRALIO</p>
        <h2>No vendemos un QR. Vendemos una razón para que el cliente vuelva.</h2>
      </section>

      <footer className="landing-footer">
        <span>Viralio</span>
        <span>viralio.net</span>
      </footer>
    </main>
  );
}
