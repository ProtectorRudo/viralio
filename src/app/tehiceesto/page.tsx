import Link from "next/link";
import { headers } from "next/headers";
import { experiences } from "./data";
import { formatTeHiceEstoPrice } from "./pricing";

// release: premium editorial home

const OCCASIONS = [
  { slug:"pareja", label:"Pareja", note:"Para decir lo que un mensaje no alcanza." },
  { slug:"cumpleanos", label:"Cumpleaños", note:"Un cumpleaños convertido en recorrido." },
  { slug:"mama", label:"Mamá", note:"Todo eso que hizo y nunca pidió que le agradezcan." },
  { slug:"papa", label:"Papá", note:"Las cosas que enseñó incluso sin decirlas." },
  { slug:"hijos", label:"Hijo/a", note:"Una historia para guardar desde el comienzo." },
  { slug:"amistad", label:"Amistad", note:"Códigos, recuerdos y todo lo que sólo ustedes entienden." },
];

export default async function TeHiceEstoHome() {
  const host=(await headers()).get("host")?.split(":")[0].toLowerCase()||"";
  const dedicated=host==="tehiceesto.com"||host==="www.tehiceesto.com";
  const prefix=dedicated?"":"/tehiceesto";
  const href=(path="")=>`${prefix}${path}`||"/";

  const bySlug=(slug:string)=>experiences.find((experience)=>experience.slug===slug);
  const pareja=bySlug("pareja");
  const heroPhoto=pareja?.demo.photos?.[0];
  const storyPhoto=pareja?.demo.photos?.[1]||pareja?.demo.photos?.[0];
  const detailPhoto=pareja?.demo.photos?.[2]||pareja?.demo.photos?.[0];

  return (
    <>
      <header className="site-header thh-header">
        <Link className="thh-brand" href={href()}>
          <span>TE HICE ESTO</span>
          <small>historias hechas para alguien</small>
        </Link>
        <nav className="thh-nav" aria-label="Navegación principal">
          <a href="#ocasiones">Para quién</a>
          <a href="#experiencia">Qué recibe</a>
          <a href="#proceso">Cómo funciona</a>
          <Link className="thh-nav-cta" href={href("/crear")}>Elegir una experiencia</Link>
        </nav>
      </header>

      <main className="thh-home">
        <section className="thh-hero">
          <div className="thh-hero-copy">
            <span className="thh-kicker">EXPERIENCIAS DIGITALES PERSONALIZADAS</span>
            <h1>
              Hay regalos que se abren una vez.
              <em>Este se vuelve a abrir.</em>
            </h1>
            <p className="thh-hero-lead">
              Creamos una experiencia digital con tus fotos, audios, palabras y recuerdos.
              Hecha especialmente para esa persona.
            </p>

            <div className="thh-hero-actions">
              <Link className="thh-button thh-button-primary" href={href("/crear")}>
                Elegir para quién es <span>→</span>
              </Link>
              <Link className="thh-button thh-button-secondary" href={href("/experiencias/pareja")}>
                <span className="thh-play">▶</span> Ver una experiencia
              </Link>
            </div>

            <div className="thh-hero-meta">
              <span>DESDE {formatTeHiceEstoPrice()}</span>
              <i />
              <span>PAGO ÚNICO</span>
              <i />
              <span>HECHA A MEDIDA</span>
            </div>
          </div>

          <div className="thh-hero-visual" aria-label="Ejemplo de una experiencia Te Hice Esto">
            <div
              className="thh-hero-photo"
              style={heroPhoto?.url?{
                backgroundImage:`linear-gradient(90deg,rgba(30,24,23,.02),rgba(30,24,23,.06)),url("${heroPhoto.url}")`,
                backgroundPosition:heroPhoto.position||"center",
              }:undefined}
            />
            <div className="thh-phone thh-phone-hero">
              <div className="thh-phone-top">
                <span>TE HICE ESTO</span>
                <b>···</b>
              </div>
              <div className="thh-phone-content">
                <small>UNA HISTORIA PARA</small>
                <strong>Emma</strong>
                <p>Gracias por estar siempre. Por hacer la vida más linda, más simple, más nuestra.</p>
                <span className="thh-phone-play">▶</span>
              </div>
              <div
                className="thh-phone-photo"
                style={storyPhoto?.url?{
                  backgroundImage:`linear-gradient(180deg,transparent 45%,rgba(10,9,9,.46)),url("${storyPhoto.url}")`,
                  backgroundPosition:storyPhoto.position||"center",
                }:undefined}
              >
                <em>Siempre vos ♡</em>
              </div>
            </div>
            <div className="thh-hero-caption">
              <small>UNA EXPERIENCIA PRIVADA</small>
              <span>Fotos · audios · cartas · recuerdos</span>
            </div>
          </div>
        </section>

        <section className="thh-occasions" id="ocasiones">
          <header className="thh-section-head thh-section-head-centered">
            <span className="thh-kicker">CADA HISTORIA ES DISTINTA</span>
            <h2>¿Para quién lo estás haciendo?</h2>
            <p>Encontrá primero a la persona. Después elegí la forma de contarle su historia.</p>
          </header>

          <div className="thh-occasion-grid">
            {OCCASIONS.map((item)=>{
              const experience=bySlug(item.slug);
              const photo=experience?.demo.photos?.[0];
              return (
                <Link
                  className="thh-occasion-card"
                  key={item.slug}
                  href={href(`/experiencias/${item.slug}`)}
                >
                  <div
                    className="thh-occasion-photo"
                    style={photo?.url?{
                      backgroundImage:`linear-gradient(180deg,rgba(20,16,17,.02),rgba(20,16,17,.28)),url("${photo.url}")`,
                      backgroundPosition:photo.position||"center",
                    }:undefined}
                  />
                  <div className="thh-occasion-copy">
                    <strong>{item.label}</strong>
                    <span>→</span>
                    <p>{item.note}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="thh-more-occasions">
            <span>También para</span>
            <Link href={href("/experiencias/abuelos")}>Abuelos</Link>
            <i>·</i>
            <Link href={href("/experiencias/aniversario")}>Aniversario</Link>
            <i>·</i>
            <Link href={href("/experiencias/propuesta")}>Propuesta</Link>
          </div>
        </section>

        <section className="thh-story" id="experiencia">
          <div className="thh-story-visual">
            <div
              className="thh-story-surface"
              style={detailPhoto?.url?{
                backgroundImage:`linear-gradient(180deg,rgba(55,40,31,.08),rgba(55,40,31,.18)),url("${detailPhoto.url}")`,
                backgroundPosition:detailPhoto.position||"center",
              }:undefined}
            />
            <div className="thh-polaroid thh-polaroid-one">
              <div
                style={heroPhoto?.url?{
                  backgroundImage:`url("${heroPhoto.url}")`,
                  backgroundPosition:heroPhoto.position||"center",
                }:undefined}
              />
              <span>nosotros · 2024</span>
            </div>
            <div className="thh-note">Las mejores historias siempre son las nuestras. ♡</div>
            <div className="thh-phone thh-phone-story">
              <div className="thh-phone-top"><span>TE HICE ESTO</span><b>03 / 12</b></div>
              <div className="thh-story-screen">
                <small>UN RECUERDO DE NUESTRA HISTORIA</small>
                <div
                  className="thh-screen-photo"
                  style={storyPhoto?.url?{
                    backgroundImage:`url("${storyPhoto.url}")`,
                    backgroundPosition:storyPhoto.position||"center",
                  }:undefined}
                />
                <div className="thh-audio-row"><span>▶</span><i/><i/><i/><i/><i/><i/><i/><i/><b>0:28</b></div>
                <p>Qué suerte la mía de caminar la vida con vos. ♡</p>
              </div>
            </div>
          </div>

          <div className="thh-story-copy">
            <span className="thh-kicker">MÁS QUE UN REGALO, UN RECORRIDO</span>
            <h2>No recibe una página.<em>Recibe un recorrido.</em></h2>
            <p>
              Combinamos tus fotos, audios, mensajes y recuerdos en una experiencia digital
              cuidada al detalle, para que pueda volver a su historia una y otra vez.
            </p>

            <div className="thh-feature-list">
              <article>
                <span className="thh-feature-icon">▣</span>
                <div><strong>Fotos</strong><p>Sus momentos más especiales, puestos en escena.</p></div>
              </article>
              <article>
                <span className="thh-feature-icon">≋</span>
                <div><strong>Audios</strong><p>Tu voz, sus risas, esos sonidos que lo dicen todo.</p></div>
              </article>
              <article>
                <span className="thh-feature-icon">≡</span>
                <div><strong>Mensajes</strong><p>Palabras que aparecen en el momento justo.</p></div>
              </article>
            </div>

            <Link className="thh-text-link" href={href("/experiencias/pareja")}>
              Ver cómo se siente una experiencia <span>→</span>
            </Link>
          </div>
        </section>

        <section className="thh-process" id="proceso">
          <header className="thh-section-head thh-section-head-centered">
            <span className="thh-kicker">ASÍ DE SIMPLE</span>
            <h2>Vos nos das la historia.<br/>Nosotros hacemos el resto.</h2>
          </header>

          <div className="thh-process-grid">
            <article>
              <span>01</span>
              <h3>Elegís la ocasión</h3>
              <p>Elegís para quién es y qué experiencia se acerca más a lo que querés regalar.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Nos contás su historia</h3>
              <p>Después del pago te pedimos fotos, audios, nombres, anécdotas y detalles.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Creamos tu experiencia</h3>
              <p>Nosotros hacemos la dirección, los textos, el ritmo y la entrega final.</p>
            </article>
          </div>
        </section>

        <section className="thh-reactions" id="reacciones">
          <header className="thh-section-head thh-section-head-centered thh-reactions-head">
            <span className="thh-kicker">LO QUE PASÓ DESPUÉS</span>
            <h2>Mensajes que queremos guardar.</h2>
            <p>
              Así puede sentirse una experiencia cuando llega a la persona correcta.
              Estos mensajes son ejemplos ilustrativos hasta sumar reacciones reales autorizadas.
            </p>
          </header>

          <div className="thh-reactions-grid">
            <article className="thh-reaction-card">
              <div className="thh-reaction-card-head">
                <span>PARA MAMÁ</span>
                <small>EJEMPLO VISUAL</small>
              </div>

              <div className="thh-chat-window">
                <div className="thh-chat-meta">
                  <span className="thh-chat-avatar">M</span>
                  <div><strong>Mamá</strong><small>WhatsApp</small></div>
                  <b>•••</b>
                </div>
                <div className="thh-chat-stream">
                  <div className="thh-chat-bubble">
                    No sabés lo que lloró mi mamá 😭
                    <time>21:17</time>
                  </div>
                  <div className="thh-chat-bubble">
                    Gracias de verdad, quedó hermoso. No me esperaba para nada esa parte del audio.
                    <time>21:18</time>
                  </div>
                  <div className="thh-chat-bubble">
                    Ya lo compartió con toda la familia jajaja
                    <time>21:18</time>
                  </div>
                </div>
              </div>

              <div className="thh-reaction-preview thh-reaction-preview-mama">
                <small>PARA VOS</small>
                <strong>Mamá</strong>
                <span>Gracias por estar siempre.</span>
              </div>
            </article>

            <article className="thh-reaction-card">
              <div className="thh-reaction-card-head">
                <span>PARA PAREJA</span>
                <small>EJEMPLO VISUAL</small>
              </div>

              <div className="thh-chat-window">
                <div className="thh-chat-meta">
                  <span className="thh-chat-avatar">P</span>
                  <div><strong>Pareja</strong><small>WhatsApp</small></div>
                  <b>•••</b>
                </div>
                <div className="thh-chat-stream">
                  <div className="thh-chat-bubble">
                    Te juro que pensé que era un link cualquiera...
                    <time>23:02</time>
                  </div>
                  <div className="thh-chat-bubble">
                    Pero cuando apareció el audio me agarró de sorpresa. Está increíble.
                    <time>23:04</time>
                  </div>
                  <div className="thh-chat-audio">
                    <span>▶</span>
                    <i/><i/><i/><i/><i/><i/><i/><i/>
                    <b>0:27</b>
                  </div>
                </div>
              </div>

              <div className="thh-reaction-preview thh-reaction-preview-pareja">
                <small>NUESTRA</small>
                <strong>Historia</strong>
                <span>Un recorrido hecho sólo para ustedes.</span>
              </div>
            </article>

            <article className="thh-reaction-card">
              <div className="thh-reaction-card-head">
                <span>PARA CUMPLEAÑOS</span>
                <small>EJEMPLO VISUAL</small>
              </div>

              <div className="thh-chat-window">
                <div className="thh-chat-meta">
                  <span className="thh-chat-avatar">C</span>
                  <div><strong>Cumpleaños</strong><small>WhatsApp</small></div>
                  <b>•••</b>
                </div>
                <div className="thh-chat-stream">
                  <div className="thh-chat-bubble">
                    Sos un genio!! Le encantó, no paraba de sonreír 😍
                    <time>18:24</time>
                  </div>
                  <div className="thh-chat-bubble">
                    Lo estuvo mirando varias veces durante el día.
                    <time>18:25</time>
                  </div>
                  <div className="thh-chat-bubble">
                    Gracias por los detalles. Se nota el cariño con el que está hecho.
                    <time>18:26</time>
                  </div>
                </div>
              </div>

              <div className="thh-reaction-preview thh-reaction-preview-cumple">
                <small>HOY ES TU DÍA</small>
                <strong>Feliz cumple</strong>
                <span>Velas, recuerdos y sorpresas.</span>
              </div>
            </article>
          </div>

          <div className="thh-reactions-foot">
            <div>
              <span aria-hidden="true">◇</span>
              <p>Cuando tengamos mensajes reales autorizados, reemplazamos estos ejemplos sin cambiar el diseño.</p>
            </div>
            <Link className="thh-button thh-button-primary thh-reactions-cta" href={href("/crear")}>
              Crear la mía <span>→</span>
            </Link>
          </div>
        </section>

        <section className="thh-pricing">
          <div
            className="thh-pricing-photo"
            style={storyPhoto?.url?{
              backgroundImage:`linear-gradient(180deg,rgba(35,27,26,.02),rgba(35,27,26,.16)),url("${storyPhoto.url}")`,
              backgroundPosition:storyPhoto.position||"center",
            }:undefined}
          >
            <span>Un regalo que puede volver a abrirse.</span>
          </div>

          <div className="thh-price-card">
            <span className="thh-kicker">UNA EXPERIENCIA HECHA PARA ESA PERSONA</span>
            <h2>Experiencia personalizada</h2>
            <div className="thh-price-line">
              <strong>{formatTeHiceEstoPrice()}</strong>
              <span>pago único</span>
            </div>
            <ul>
              <li>Experiencia digital única y privada</li>
              <li>Fotos, audios, mensajes y escenas interactivas</li>
              <li>Dirección y armado realizados por nosotros</li>
              <li>Link listo para regalar</li>
            </ul>
            <Link className="thh-button thh-button-primary thh-price-cta" href={href("/crear")}>
              Crear la mía <span>→</span>
            </Link>
          </div>

          <blockquote>“Porque algunas historias merecen un lugar hecho sólo para ellas.”</blockquote>
        </section>

        <footer className="thh-footer">
          <div>
            <strong>TE HICE ESTO</strong>
            <p>Historias que siempre se vuelven a abrir.</p>
          </div>
          <nav aria-label="Navegación de pie de página">
            <a href="#ocasiones">Experiencias</a>
            <a href="#proceso">Cómo funciona</a>
            <Link href={href("/crear")}>Crear la mía</Link>
          </nav>
          <span>ARGENTINA · 2026</span>
        </footer>
      </main>
    </>
  );
}
