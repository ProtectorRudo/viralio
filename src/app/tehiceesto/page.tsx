import Link from "next/link";
import { headers } from "next/headers";
import { experiences } from "./data";
import { formatTeHiceEstoPrice } from "./pricing";

const RECIPIENTS = [
  { slug:"pareja", label:"Pareja", mark:"♡" },
  { slug:"mama", label:"Mamá", mark:"✿" },
  { slug:"papa", label:"Papá", mark:"◇" },
  { slug:"cumpleanos", label:"Cumpleaños", mark:"✦" },
  { slug:"hijos", label:"Hijo/a", mark:"○" },
  { slug:"amistad", label:"Amistad", mark:"⌁" },
];

export default async function TeHiceEstoHome() {
  const host=(await headers()).get("host")?.split(":")[0].toLowerCase()||"";
  const dedicated=host==="tehiceesto.com"||host==="www.tehiceesto.com";
  const prefix=dedicated?"":"/tehiceesto";
  const href=(path="")=>`${prefix}${path}`||"/";
  const bySlug=(slug:string)=>experiences.find((experience)=>experience.slug===slug);

  const mama=bySlug("mama");
  const heroPhoto=mama?.demo.photos?.[0];
  const phonePhoto=mama?.demo.photos?.[1]||mama?.demo.photos?.[0];

  return (
    <>
      <header className="site-header thh-header thh-v2-header">
        <Link className="thh-brand" href={href()}>
          <span>TE HICE ESTO</span>
          <small>historias hechas para alguien</small>
        </Link>
        <nav className="thh-nav thh-v2-nav" aria-label="Navegación principal">
          <a href="#recorrido">Qué recibe</a>
          <a href="#proceso">Cómo funciona</a>
          <a className="thh-nav-cta" href="#para-quien">Elegir para quién</a>
        </nav>
      </header>

      <main className="thh-home thh-home-v2">
        <section className="thh-v2-hero">
          <div className="thh-v2-hero-copy">
            <span className="thh-kicker">EXPERIENCIAS DIGITALES PERSONALIZADAS</span>
            <h1>
              Un regalo hecho<br/>con sus recuerdos.
              <em>Se vuelve a abrir.</em>
            </h1>

            <p className="thh-v2-lead">
              Convertimos tus fotos, audios y mensajes en una experiencia interactiva privada,
              hecha especialmente para esa persona.
            </p>

            <div className="thh-v2-meta">
              <span>Desde <strong>{formatTeHiceEstoPrice()}</strong></span>
              <i/>
              <span>pago único</span>
              <i/>
              <span>nosotros hacemos todo</span>
            </div>

            <div className="thh-v2-chooser" id="para-quien">
              <p>¿Para quién querés hacerlo?</p>
              <div className="thh-v2-recipient-grid">
                {RECIPIENTS.map((item)=>(
                  <Link
                    className="thh-v2-recipient"
                    key={item.slug}
                    href={href(`/experiencias/${item.slug}`)}
                    aria-label={`Ver experiencia para ${item.label}`}
                  >
                    <span aria-hidden="true">{item.mark}</span>
                    <strong>{item.label}</strong>
                    <b aria-hidden="true">→</b>
                  </Link>
                ))}
              </div>
              <div className="thh-v2-more">
                <span>También para</span>
                <Link href={href("/experiencias/abuelos")}>Abuelos</Link>
                <Link href={href("/experiencias/aniversario")}>Aniversario</Link>
                <Link href={href("/experiencias/propuesta")}>Propuesta</Link>
              </div>
            </div>

            <Link className="thh-button thh-button-primary thh-v2-hero-cta" href={href("/experiencias/mama")}>
              Ver una experiencia <span>→</span>
            </Link>
          </div>

          <div className="thh-v2-hero-visual" aria-label="Ejemplo visual de una experiencia Te Hice Esto">
            <div
              className="thh-v2-hero-photo"
              style={heroPhoto?.url?{
                backgroundImage:`linear-gradient(180deg,rgba(34,27,25,.04),rgba(34,27,25,.20)),url("${heroPhoto.url}")`,
                backgroundPosition:heroPhoto.position||"center",
              }:undefined}
            />
            <div className="thh-v2-photo-card thh-v2-photo-card-one" aria-hidden="true">
              <div
                style={phonePhoto?.url?{
                  backgroundImage:`url("${phonePhoto.url}")`,
                  backgroundPosition:phonePhoto.position||"center",
                }:undefined}
              />
            </div>
            <div className="thh-v2-photo-card thh-v2-photo-card-two" aria-hidden="true">
              <div
                style={heroPhoto?.url?{
                  backgroundImage:`url("${heroPhoto.url}")`,
                  backgroundPosition:heroPhoto.position||"center",
                }:undefined}
              />
            </div>

            <div className="thh-phone thh-v2-phone">
              <div className="thh-phone-top"><span>TE HICE ESTO</span><b>03 / 12</b></div>
              <div className="thh-v2-phone-screen">
                <small>UN RECUERDO DE NUESTRA HISTORIA</small>
                <strong>Mamá</strong>
                <div
                  className="thh-v2-phone-photo"
                  style={phonePhoto?.url?{
                    backgroundImage:`linear-gradient(180deg,transparent 48%,rgba(8,7,8,.42)),url("${phonePhoto.url}")`,
                    backgroundPosition:phonePhoto.position||"center",
                  }:undefined}
                />
                <div className="thh-audio-row"><span>▶</span><i/><i/><i/><i/><i/><i/><i/><b>0:28</b></div>
                <p>Gracias por estar siempre.<br/>Por hacer la vida más linda, más simple, más nuestra.</p>
                <em>♡</em>
              </div>
            </div>

            <div className="thh-v2-visual-tag">
              <small>UNA EXPERIENCIA PRIVADA</small>
              <span>Fotos · audios · cartas · recuerdos</span>
            </div>
          </div>
        </section>

        <section className="thh-v2-recorrido" id="recorrido">
          <div className="thh-v2-recorrido-copy">
            <span className="thh-kicker">MÁS QUE UN REGALO, UN RECORRIDO</span>
            <h2>No recibe una página.<em>Recibe un recorrido.</em></h2>
            <p>
              Combinamos tus fotos, audios, cartas y recuerdos en una experiencia digital cuidada
              al detalle, para que pueda volver a su historia una y otra vez.
            </p>
            <Link className="thh-v2-text-link" href={href("/experiencias/pareja")}>
              Ver cómo se siente <span>→</span>
            </Link>
          </div>

          <div className="thh-v2-feature-grid">
            <article>
              <span aria-hidden="true">▧</span>
              <div><strong>Fotos</strong><p>Sus momentos más especiales.</p></div>
            </article>
            <article>
              <span aria-hidden="true">≋</span>
              <div><strong>Audios</strong><p>Tu voz, sus risas, esos sonidos que lo dicen todo.</p></div>
            </article>
            <article>
              <span aria-hidden="true">≡</span>
              <div><strong>Cartas</strong><p>Palabras que aparecen en el momento justo.</p></div>
            </article>
            <article>
              <span aria-hidden="true">✦</span>
              <div><strong>Recuerdos</strong><p>Escenas y detalles que hacen única su historia.</p></div>
            </article>
          </div>
        </section>

        <section className="thh-v2-process" id="proceso">
          <span className="thh-kicker">ASÍ DE SIMPLE</span>
          <div className="thh-v2-process-grid">
            <article>
              <span>01</span>
              <div>
                <h3>Elegís para quién</h3>
                <p>Seleccionás la persona y la experiencia que querés regalar.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Nos pasás sus recuerdos</h3>
                <p>Fotos, audios, nombres, mensajes y los detalles que hacen su historia única.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Nosotros hacemos la magia</h3>
                <p>Armamos todo y te entregamos un link privado listo para regalar.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="thh-v2-pricing">
          <div className="thh-v2-price-main">
            <span className="thh-kicker">UNA EXPERIENCIA HECHA PARA ESA PERSONA</span>
            <h2>Experiencia personalizada</h2>
            <div className="thh-v2-price">
              <strong>{formatTeHiceEstoPrice()}</strong>
              <span>pago único</span>
            </div>
          </div>

          <div className="thh-v2-price-value">
            <ul>
              <li>Experiencia digital privada</li>
              <li>Fotos, audios, mensajes y escenas interactivas</li>
              <li>Armado realizado por nosotros</li>
              <li>Link listo para regalar y volver a abrir</li>
            </ul>
            <a className="thh-button thh-button-primary" href="#para-quien">
              Elegir para quién <span>→</span>
            </a>
          </div>
        </section>

        <footer className="thh-footer thh-v2-footer">
          <div>
            <strong>TE HICE ESTO</strong>
            <p>Historias que siempre se vuelven a abrir.</p>
          </div>
          <nav aria-label="Navegación de pie de página">
            <a href="#para-quien">Para quién</a>
            <a href="#recorrido">Qué recibe</a>
            <a href="#proceso">Cómo funciona</a>
          </nav>
          <span>ARGENTINA · 2026</span>
        </footer>
      </main>
    </>
  );
}
