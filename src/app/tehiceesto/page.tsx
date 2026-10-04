import Link from "next/link";
import { headers } from "next/headers";
import { experiences } from "./data";
import { formatTeHiceEstoPrice } from "./pricing";

export default async function TeHiceEstoHome() {
  const host=(await headers()).get("host")?.split(":")[0].toLowerCase()||"";
  const dedicated=host==="tehiceesto.com"||host==="www.tehiceesto.com";
  const prefix=dedicated?"":"/tehiceesto";
  const href=(path="")=>`${prefix}${path}`||"/";

  return (
    <>
      <header className="site-header">
        <Link className="brand" href={href()}>TE HICE ESTO<span>♥</span></Link>
        <nav>
          <a href="#experiencias">Experiencias</a>
          <a href="#como-funciona">Cómo funciona</a>
          <Link className="header-create" href={href("/crear")}>Elegir una →</Link>
        </nav>
      </header>
      <main className="home-shell">
      <section className="home-hero">
        <div className="home-hero-grid" aria-hidden="true" />
        <div className="home-hero-meta">
          <span>TE HICE ESTO · ESTUDIO DIGITAL</span>
          <span>01—09 EXPERIENCIAS</span>
        </div>

        <div className="home-hero-copy">
          <span className="eyebrow">Una experiencia digital hecha para una sola persona</span>
          <h1>
            No le mandes
            <em> otro mensaje.</em>
            <span>Hacé que lo viva.</span>
          </h1>
          <p>
            Fotos, audios, cartas y recuerdos convertidos en un recorrido privado
            que se abre desde el celular y no se parece a nada que ya haya recibido.
          </p>
          <div className="home-hero-actions">
            <Link className="home-primary" href={href("/crear")}>
              Elegir una experiencia <span>↗</span>
            </Link>
            <Link className="home-secondary" href={href("/experiencias/pareja")}>
              Entrar a un demo <span>→</span>
            </Link>
          </div>
          <div className="home-proof-line" aria-label="Qué incluye">
            <span><b>01</b> Dirección creativa</span>
            <span><b>02</b> Personalización real</span>
            <span><b>03</b> Link privado</span>
          </div>
        </div>

        <div className="artifact-stage" aria-label="Vista previa de una experiencia">
          <div className="artifact-card artifact-card-back">
            <small>03 · UNA VOZ</small>
            <div className="artifact-wave">
              {Array.from({ length: 18 }).map((_, index) => <i key={index} />)}
            </div>
            <strong>00:18</strong>
          </div>
          <div className="artifact-card artifact-card-mid">
            <small>02 · UN RECUERDO</small>
            <div
              className="artifact-photo"
              style={experiences[0]?.demo.photos?.[0]?.url ? {
                backgroundImage: `linear-gradient(180deg,rgba(18,14,15,.02) 35%,rgba(18,14,15,.38)), url("${experiences[0].demo.photos[0].url}")`,
                backgroundSize: "cover",
                backgroundPosition: experiences[0].demo.photos[0].position || "center",
              } : undefined}
            >
              <span>VERANO · 2022</span>
            </div>
            <p>“Ese día todavía no sabíamos que iba a quedar para siempre.”</p>
          </div>
          <div className="artifact-card artifact-card-front">
            <small>01 · SÓLO PARA VOS</small>
            <strong>Emma</strong>
            <p>Hay miles de lugares en Internet. Este existe solamente para vos.</p>
            <span className="artifact-enter">ENTRAR</span>
          </div>
          <div className="artifact-stamp">PRIVADO</div>
        </div>

        <div className="home-scroll-cue">
          <span>DESLIZÁ</span>
          <i />
        </div>
      </section>

      <section className="home-manifesto">
        <div className="manifesto-index">01</div>
        <div className="manifesto-copy">
          <span className="eyebrow">Esto no es una tarjeta digital</span>
          <h2>La diferencia está en lo que pasa <em>antes</em> de llegar al final.</h2>
        </div>
        <div className="manifesto-points">
          <article><span>01</span><p>No ve todas las fotos de golpe. Las va descubriendo.</p></article>
          <article><span>02</span><p>No lee un texto largo. Entra en escenas que cambian de ritmo.</p></article>
          <article><span>03</span><p>No recibe una plantilla. La experiencia toma el lenguaje de esa historia.</p></article>
        </div>
      </section>

      <section className="catalog-section catalog-editorial" id="experiencias">
        <header className="catalog-editorial-head">
          <div>
            <span className="eyebrow">Colección 01—09</span>
            <h2>Nueve historias.<br/><em>Nueve mundos distintos.</em></h2>
          </div>
          <p>
            Cada ocasión tiene su propia dirección de arte, ritmo e interacciones.
            Elegí la persona. Después hacelo suyo.
          </p>
        </header>

        <div className="catalog-list">
          {experiences.map((experience, index) => (
            <Link
              href={href(`/experiencias/${experience.slug}`)}
              className="catalog-row"
              key={experience.slug}
              style={{ "--row-accent": experience.accent } as React.CSSProperties}
            >
              <span className="catalog-row-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="catalog-row-title">
                <small>{experience.eyebrow}</small>
                <h3>{experience.title}</h3>
              </div>
              <p>{experience.short}</p>
              <div className="catalog-row-action">
                <span>VIVIR DEMO</span>
                <b>↗</b>
              </div>
              <i className="catalog-row-line" />
            </Link>
          ))}
        </div>
      </section>

      <section className="home-process" id="como-funciona">
        <div className="process-intro">
          <span className="eyebrow">Simple para vos · personal para esa persona</span>
          <h2>Elegís el punto de partida.<br/>Nosotros hacemos <em>todo lo demás.</em></h2>
        </div>
        <div className="process-timeline">
          <article>
            <span>01</span>
            <div><small>LA EXPERIENCIA</small><h3>Elegís la que más te gusta.</h3><p>Podés entrar a todos los demos antes de decidir.</p></div>
          </article>
          <article>
            <span>02</span>
            <div><small>LA RESERVA</small><h3>Dejás tus datos y pagás {formatTeHiceEstoPrice()}.</h3><p>No tenés que preparar fotos ni textos en ese momento.</p></div>
          </article>
          <article>
            <span>03</span>
            <div><small>EL CONTACTO</small><h3>Te escribimos nosotros.</h3><p>Después del pago te pedimos fotos, audios, nombres, anécdotas y detalles.</p></div>
          </article>
          <article>
            <span>04</span>
            <div><small>LA ENTREGA</small><h3>La creamos y recibís el link privado.</h3><p>Nosotros hacemos la dirección, los textos, el ritmo y los efectos. Vos sólo revisás antes de entregarla.</p></div>
          </article>
        </div>
      </section>

      <section className="home-contrast">
        <div className="contrast-before">
          <span>LO DE SIEMPRE</span>
          <div className="contrast-message">
            <small>Feliz cumple ❤️</small>
            <i>✓✓</i>
          </div>
          <p>Un mensaje más entre cientos.</p>
        </div>
        <div className="contrast-divider"><span>VS</span></div>
        <div className="contrast-after">
          <span>TE HICE ESTO</span>
          <strong>“Este lugar existe solamente para vos.”</strong>
          <div className="contrast-progress"><i /></div>
          <p>Una experiencia que obliga a frenar.</p>
        </div>
      </section>

      <section className="home-final-cta">
        <div className="home-final-orbit" aria-hidden="true" />
        <span className="eyebrow">Hay alguien que ya sabés quién es</span>
        <h2>No busques otro regalo.<br/><em>Hacé algo que sólo pueda ser suyo.</em></h2>
        <div className="home-price-card">
          <span>EXPERIENCIA PERSONALIZADA</span>
          <strong>{formatTeHiceEstoPrice()}</strong>
          <p>Incluye dirección creativa, personalización completa, escenas interactivas y entrega en link privado.</p>
        </div>
        <Link className="home-primary" href={href("/crear")}>
          Empezar ahora <span>↗</span>
        </Link>
        <small>Se crea para celular · link privado · una historia por vez</small>
      </section>

      <footer className="home-footer">
        <Link className="brand" href={href()}>TE HICE ESTO<span>♥</span></Link>
        <p>Un lugar en Internet que existe para una sola persona.</p>
        <span>ARGENTINA · 2026</span>
      </footer>
      </main>
    </>
  );
}
