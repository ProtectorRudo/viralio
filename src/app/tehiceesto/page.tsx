import Link from "next/link";
import { headers } from "next/headers";
import { experiences } from "./data";
import { formatTeHiceEstoPrice } from "./pricing";
import HomeTrustMarquee from "./HomeTrustMarquee";

const RECIPIENTS = [
  { slug:"pareja", label:"Pareja", mark:"♡" },
  { slug:"mama", label:"Mamá", mark:"✿" },
  { slug:"papa", label:"Papá", mark:"◇" },
  { slug:"cumpleanos", label:"Cumpleaños", mark:"✦" },
  { slug:"hijos", label:"Hijo/a", mark:"○" },
  { slug:"amistad", label:"Amistad", mark:"⌁" },
  { slug:"secreto", label:"Sorpresas", mark:"✧" },
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
          <Link href={href("/mis-regalos")}>Mis regalos</Link>
          <a className="thh-nav-cta" href="#para-quien">Elegir para quién</a>
        </nav>
      </header>

      <main className="thh-home thh-home-v2">
        <section className="thh-v2-hero">
          <div className="thh-v2-hero-copy">
            <span className="thh-kicker">EXPERIENCIAS DIGITALES PERSONALIZADAS</span>
            <h1>
              Un regalo que la emociona.
              <em>La hace sonreír. Y le queda para siempre.</em>
            </h1>

            <p className="thh-v2-lead">
              Elegís una experiencia que ya fue diseñada y probada para emocionar. Después del pago
              la personalizás con tus fotos, audios y palabras siguiendo una guía simple, sin tocar el diseño.
            </p>

            <div className="thh-v2-meta" aria-label="Detalles de compra">
              <span className="thh-v2-trust-chip thh-v2-trust-price">
                <b aria-hidden="true">◇</b>
                <span>Desde <strong>{formatTeHiceEstoPrice()}</strong></span>
              </span>
              <span className="thh-v2-trust-chip">
                <b aria-hidden="true">▭</b>
                <span>Pago <strong>único</strong></span>
              </span>
              <span className="thh-v2-trust-chip">
                <b aria-hidden="true">♡</b>
                <span>Diseño <strong>ya resuelto</strong></span>
              </span>
              <span className="thh-v2-trust-chip">
                <b aria-hidden="true">▢</b>
                <span>Link <strong>privado</strong></span>
              </span>
            </div>

            <div className="thh-v2-chooser" id="para-quien">
              <div className="thh-v2-chooser-head">
                <span>Elegí el tipo de historia</span>
                <h2>¿Para quién querés hacerlo?<i aria-hidden="true">♡</i></h2>
              </div>

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
                    <b aria-hidden="true">›</b>
                  </Link>
                ))}
              </div>

              <div className="thh-v2-more">
                <span>También para</span>
                <span className="thh-v2-coming-soon">Abuelos <small>Próximamente</small></span>
                <span className="thh-v2-coming-soon">Aniversario <small>Próximamente</small></span>
                <span className="thh-v2-coming-soon">Propuesta <small>Próximamente</small></span>
              </div>

              <Link className="thh-button thh-button-primary thh-v2-hero-cta" href={href("/crear")}>
                <strong>Crear mi regalo</strong>
                <span aria-hidden="true">→</span>
              </Link>
              <p className="thh-v2-cta-note">
                <span className="thh-v2-mini-lock" aria-hidden="true"/>
                Después elegís la experiencia y pagás de forma segura con <strong>Mercado Pago</strong>.
              </p>
            </div>
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

            <div className="thh-v2-paper-note thh-v2-paper-note-top" aria-hidden="true">
              <span>Pequeños momentos,<br/>grandes historias.</span>
              <b>♡</b>
            </div>

            <div className="thh-v2-audio-float" aria-hidden="true">
              <span>▶</span>
              <i/><i/><i/><i/><i/><i/>
            </div>

            <div className="thh-v2-paper-note thh-v2-paper-note-bottom" aria-hidden="true">
              <span>Gracias por estar<br/>siempre.</span>
              <b>♡</b>
            </div>

            <div className="thh-v2-visual-tag">
              <small>UNA EXPERIENCIA PRIVADA</small>
              <span>Fotos · audios · cartas · recuerdos</span>
            </div>
          </div>
        </section>

        <section className="thh-v2-recorrido" id="recorrido">
          <div className="thh-v2-recorrido-copy">
            <span className="thh-kicker">MÁS QUE UN REGALO, UNA EMOCIÓN</span>
            <h2>No recibe solo un regalo.<em>Recibe ese momento que le queda en el corazón.</em></h2>
            <p>
              Cada experiencia está pensada para emocionar de verdad: hacerla sonreír, sorprenderla,
              recordarle cuánto la aman y dejarle un recuerdo que puede volver a abrir una y otra vez.
            </p>
            <Link className="thh-v2-text-link" href={href("/experiencias/pareja")}>
              Ver cómo se siente <span>→</span>
            </Link>
          </div>

          <div className="thh-v2-feature-grid">
            <article>
              <span aria-hidden="true">▧</span>
              <div><strong>Fotos</strong><p>Sus momentos más especiales, convertidos en escena.</p></div>
            </article>
            <article>
              <span aria-hidden="true">≋</span>
              <div><strong>Audios</strong><p>Tu voz, sus risas y esas palabras que hacen sentir cerca.</p></div>
            </article>
            <article>
              <span aria-hidden="true">≡</span>
              <div><strong>Cartas</strong><p>Mensajes que llegan al corazón en el momento justo.</p></div>
            </article>
            <article>
              <span aria-hidden="true">✦</span>
              <div><strong>Recuerdos</strong><p>Detalles y escenas pensadas para emocionar de verdad.</p></div>
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
                <h3>La hacés de ustedes</h3>
                <p>Subís fotos, audios, nombres y mensajes. Te guiamos paso a paso y el diseño se mantiene intacto.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>La revisás y la publicás</h3>
                <p>Vivís la vista previa completa, ajustás lo que quieras y recibís tu link privado al instante.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="thh-v2-pricing">
          <div className="thh-v2-price-main">
            <span className="thh-kicker">UNA EXPERIENCIA HECHA SÓLO PARA ESA PERSONA</span>
            <h2>No estás comprando una página.<em>Estás regalando un recuerdo que puede volver a sentir.</em></h2>
            <p className="thh-v2-price-story">
              Cada experiencia ya tiene el recorrido, los efectos y el ritmo resueltos de principio a fin.
              Vos sólo reemplazás el contenido previsto con sus recuerdos para conservar toda la calidad del modelo.
            </p>
            <div className="thh-v2-price">
              <strong>{formatTeHiceEstoPrice()}</strong>
              <span>pago único</span>
            </div>
          </div>

          <div className="thh-v2-price-value">
            <p className="thh-v2-price-intro">Todo lo necesario para convertir sus recuerdos en un regalo realmente inolvidable.</p>
            <ul>
              <li><strong>Personalizada con su propia historia</strong><span>Fotos, audios, nombres y mensajes.</span></li>
              <li><strong>El diseño ya viene resuelto</strong><span>No necesitás diseñar ni programar nada; sólo personalizás el contenido.</span></li>
              <li><strong>Lista para regalar</strong><span>Recibís un link privado y terminado.</span></li>
              <li><strong>Para volver a sentirlo</strong><span>Puede abrirla todas las veces que quiera.</span></li>
              <li><strong>Sin suscripciones</strong><span>Un único pago, sin cuotas mensuales del servicio.</span></li>
            </ul>

            <div className="thh-v2-payment-trust" aria-label="Pago seguro con Mercado Pago">
              <span className="thh-v2-payment-lock" aria-hidden="true"/>
              <div>
                <strong>Compra segura</strong>
                <p>Pago procesado de forma segura por Mercado Pago.</p>
              </div>
            </div>

            <Link className="thh-button thh-button-primary" href={href("/crear")}>
              Quiero crear este regalo <span>→</span>
            </Link>
            <p className="thh-v2-price-closing">En el siguiente paso elegís la experiencia, dejás tus datos y pagás de forma segura con Mercado Pago.</p>
          </div>
        </section>

        <HomeTrustMarquee />

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
