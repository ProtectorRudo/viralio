import Link from "next/link";
import { headers } from "next/headers";
import BrandMark from "./BrandMark";
import { experiences } from "./data";

const occasionOrder = [
  "pareja",
  "cumpleanos",
  "aniversario",
  "amistad",
  "mama-papa",
  "propuesta",
  "hijos",
  "abuelos",
];

const occasionCopy: Record<string, {
  category: string;
  title: string;
  description: string;
  ideal: string;
  demoLabel: string;
  features: string[];
}> = {
  pareja: {
    category: "Pareja",
    title: "Regalo para tu pareja",
    description: "Para sorprender porque sí, celebrar una fecha o decir de una forma distinta todo lo que esa persona significa.",
    ideal: "Ideal para novios, convivencia y sorpresas románticas",
    demoLabel: "Vivir demo para pareja",
    features: ["Puerta", "Recuerdos", "Estrellas", "Raspadita", "Carta"],
  },
  cumpleanos: {
    category: "Cumpleaños",
    title: "Regalo de cumpleaños",
    description: "Un cumpleaños convertido en recorrido: velitas, mensajes, recuerdos, voces y sorpresas que se desbloquean.",
    ideal: "Ideal para amigos, pareja o familia",
    demoLabel: "Vivir demo de cumpleaños",
    features: ["Velitas", "Globos", "Fotos", "Voces", "Carta"],
  },
  aniversario: {
    category: "Aniversario",
    title: "Regalo de aniversario",
    description: "Volver a recorrer la relación desde el comienzo y terminar con algo nuevo que todavía queda por vivir.",
    ideal: "Ideal para aniversarios de pareja",
    demoLabel: "Vivir demo de aniversario",
    features: ["Historia", "Fotos", "Pregunta", "Sorpresa", "Carta"],
  },
  amistad: {
    category: "Amistad",
    title: "Regalo para una amistad",
    description: "Fotos que nunca deberían publicarse, anécdotas, códigos internos y mensajes que sólo ustedes entienden.",
    ideal: "Ideal para mejores amigos y grupos",
    demoLabel: "Vivir demo de amistad",
    features: ["Quiz", "Fotos", "Globos", "Cupón", "Carta"],
  },
  "mama-papa": {
    category: "Familia",
    title: "Regalo para mamá o papá",
    description: "Una forma de agradecer cosas que a veces se sienten toda la vida y tardan demasiado en decirse.",
    ideal: "Ideal para Día de la Madre, del Padre o cualquier día",
    demoLabel: "Vivir demo para mamá o papá",
    features: ["Recuerdos", "Voces", "Estrellas", "Carta", "Sorpresa"],
  },
  propuesta: {
    category: "Propuesta",
    title: "Propuesta de casamiento",
    description: "La historia de ustedes conduce paso a paso hacia una última puerta y una sola pregunta.",
    ideal: "Ideal para una propuesta íntima y distinta",
    demoLabel: "Vivir demo de propuesta",
    features: ["Puerta", "Fotos", "Constelación", "Bóveda", "Pregunta"],
  },
  hijos: {
    category: "Hijos",
    title: "Regalo para tus hijos",
    description: "Una cápsula emocional para guardar etapas, palabras y recuerdos que algún día van a tener todavía más valor.",
    ideal: "Ideal para nacimientos, cumpleaños y cápsulas de tiempo",
    demoLabel: "Vivir demo para hijos",
    features: ["Historia", "Fotos", "Estrellas", "Cápsula", "Carta"],
  },
  abuelos: {
    category: "Legado",
    title: "Regalo para abuelos",
    description: "Décadas de historias familiares convertidas en un museo íntimo para volver a escuchar, mirar y recordar.",
    ideal: "Ideal para homenajes y recuerdos familiares",
    demoLabel: "Vivir demo para abuelos",
    features: ["Línea de tiempo", "Fotos", "Voces", "Recuerdos", "Carta"],
  },
};

export default async function TeHiceEstoHome(){
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase() || "";
  const dedicated = host === "tehiceesto.com" || host === "www.tehiceesto.com";
  const prefix = dedicated ? "" : "/tehiceesto";
  const href = (path = "") => `${prefix}${path}` || "/";

  const orderedExperiences = occasionOrder
    .map((slug) => experiences.find((experience) => experience.slug === slug))
    .filter((experience): experience is NonNullable<typeof experience> => Boolean(experience));

  return <main className="thi-site thi-premium-site thi-home-v3">
    <div className="thi-page-noise" aria-hidden="true"/>
    <div className="thi-page-aura aura-one" aria-hidden="true"/>
    <div className="thi-page-aura aura-two" aria-hidden="true"/>

    <header className="thi-nav thi-nav-v3">
      <BrandMark href={href()} compact />
      <nav>
        <a href="#ocasiones">Elegí la ocasión</a>
        <a href="#como-funciona">Cómo funciona</a>
        <Link href={href("/crear")} className="thi-nav-cta">Crear mi regalo</Link>
      </nav>
    </header>

    <section className="thi-hero-v3">
      <div className="thi-hero-v3-copy">
        <div className="thi-hero-badge">
          <span className="thi-live-dot"/>
          Regalos digitales para el alma
        </div>
        <p className="thi-kicker">Experiencias personalizadas con tus recuerdos</p>
        <h1>Convertimos tus recuerdos en <em>un regalo que se vive.</em></h1>
        <p className="thi-hero-v3-description">
          Elegís la ocasión. Nos mandás fotos, audios, videos, cartas y anécdotas.
          Nosotros los convertimos en una experiencia privada e interactiva que esa persona descubre desde su celular.
        </p>

        <div className="thi-hero-actions">
          <a className="thi-primary thi-primary-premium" href="#ocasiones">
            <span>Elegir la ocasión</span><b>↓</b>
          </a>
          <Link className="thi-text-link thi-demo-link" href={href("/experiencias/pareja")}>
            <span className="thi-play-dot">▶</span>
            Probar una demo
          </Link>
        </div>

        <div className="thi-hero-proofline">
          <span><i>✓</i> Link privado</span>
          <span><i>✓</i> Hecho para celular</span>
          <span><i>✓</i> Fotos, audio y video</span>
          <span><i>✓</i> Sin instalar nada</span>
        </div>
      </div>

      <div className="thi-hero-gift-object" aria-hidden="true">
        <div className="thi-gift-aura"/>
        <div className="thi-gift-card">
          <div className="thi-gift-card-top">
            <span>Una experiencia para</span>
            <strong>Emma</strong>
          </div>
          <div className="thi-gift-scene-preview">
            <div className="thi-gift-preview-stars"><i/><i/><i/><i/></div>
            <small>Julián hizo algo para vos</small>
            <p>Hay miles de lugares en Internet.<br/>Este existe solamente para vos.</p>
            <span className="thi-gift-preview-button">Entrar <i>→</i></span>
          </div>
          <div className="thi-gift-card-bottom">
            <span>7 escenas</span><i/><span>privado</span><i/><span>interactivo</span>
          </div>
        </div>
        <div className="thi-wax-seal-hero"><span>♥</span><i/></div>
        <div className="thi-gift-float float-a"><span>✦</span><small>recuerdos que se descubren</small></div>
        <div className="thi-gift-float float-b"><span>♪</span><small>audios que vuelven a sonar</small></div>
      </div>
    </section>

    <section className="thi-occasion-section" id="ocasiones">
      <div className="thi-occasion-heading">
        <div>
          <p className="thi-kicker">Elegí la ocasión</p>
          <h2>Hay una experiencia distinta para cada persona y cada momento.</h2>
        </div>
        <p>
          Cada demo tiene su propia historia, estética e interacciones.
          Entrá a la que más se parezca al regalo que querés hacer.
        </p>
      </div>

      <div className="thi-occasion-grid">
        {orderedExperiences.map((experience, index) => {
          const copy = occasionCopy[experience.slug];
          return <article
            className={`thi-occasion-card ${index < 2 ? "featured" : ""}`}
            key={experience.slug}
            style={{"--occasion-accent":experience.accent} as React.CSSProperties}
          >
            <div className="thi-occasion-card-glow"/>
            <div className="thi-occasion-card-head">
              <span className="thi-occasion-icon">{experience.icon}</span>
              <div>
                <small>{copy.category}</small>
                <em>Demo {String(index+1).padStart(2,"0")}</em>
              </div>
            </div>

            <h3>{copy.title}</h3>
            <p>{copy.description}</p>
            <span className="thi-occasion-ideal">{copy.ideal}</span>

            <div className="thi-occasion-features">
              {copy.features.map((feature)=><span key={feature}>{feature}</span>)}
            </div>

            <div className="thi-occasion-actions">
              <Link href={href(`/experiencias/${experience.slug}`)} className="thi-occasion-demo">
                <span className="thi-play-dot">▶</span>{copy.demoLabel}
              </Link>
              <Link href={href("/crear")} className="thi-occasion-create">Crear este regalo →</Link>
            </div>
          </article>;
        })}
      </div>
    </section>

    <section className="thi-what-is-section">
      <div className="thi-section-head">
        <p className="thi-kicker">¿Qué recibe la otra persona?</p>
        <h2>No recibe una web. Recibe un recorrido hecho con su historia.</h2>
      </div>

      <div className="thi-journey-strip">
        <article><span>01</span><i>◇</i><strong>Abre un link privado</strong><p>Sin app, sin registro y desde su propio celular.</p></article>
        <article><span>02</span><i>✦</i><strong>Empieza a descubrir</strong><p>Fotos, puertas, recuerdos, preguntas y pequeños secretos.</p></article>
        <article><span>03</span><i>♥</i><strong>Interactúa con la historia</strong><p>Raspa, sopla velitas, escucha voces, abre cartas y desbloquea escenas.</p></article>
        <article><span>04</span><i>∞</i><strong>Llega a un final único</strong><p>Una carta, una propuesta, una cápsula o aquello que quieras decir.</p></article>
      </div>
    </section>

    <section className="thi-material-section">
      <div className="thi-material-copy">
        <p className="thi-kicker">Vos nos mandás los recuerdos</p>
        <h2>Nosotros hacemos la magia.</h2>
        <p>
          No necesitás diseñar nada. Nos contás para quién es, qué querés provocar
          y nos enviás el material. Nosotros elegimos el ritmo, las escenas y la forma de contarlo.
        </p>
        <Link href={href("/crear")} className="thi-primary thi-primary-premium"><span>Empezar mi regalo</span><b>→</b></Link>
      </div>

      <div className="thi-material-cloud">
        <span className="large">Fotos <i>▧</i></span>
        <span>Audios <i>♪</i></span>
        <span>Videos <i>▶</i></span>
        <span className="large">Cartas <i>♥</i></span>
        <span>Fechas <i>◌</i></span>
        <span>Anécdotas <i>✦</i></span>
        <span>Frases de ustedes <i>“ ”</i></span>
        <span>Una canción <i>♫</i></span>
      </div>
    </section>

    <section className="thi-how thi-how-v3" id="como-funciona">
      <div className="thi-section-head">
        <p className="thi-kicker">Cómo funciona</p>
        <h2>Fácil para vos. Personal hasta el último detalle.</h2>
      </div>
      <div className="thi-steps thi-steps-premium">
        <article><span>01</span><i>◇</i><h3>Elegís la ocasión</h3><p>Pareja, cumpleaños, aniversario, amistad, familia o una propuesta.</p></article>
        <article><span>02</span><i>✦</i><h3>Nos mandás la historia</h3><p>Fotos, audios, videos, mensajes y todo lo que tenga significado.</p></article>
        <article><span>03</span><i>⌁</i><h3>La convertimos en experiencia</h3><p>Ordenamos el relato y construimos las escenas, efectos y sorpresas.</p></article>
        <article><span>04</span><i>♥</i><h3>Le mandás el link</h3><p>La persona entra desde su celular y descubre su regalo paso a paso.</p></article>
      </div>
    </section>

    <section className="thi-private-section">
      <div className="thi-private-card">
        <div>
          <p className="thi-kicker">Íntimo por diseño</p>
          <h2>Lo importante no tiene por qué ser público.</h2>
          <p>Los regalos viven en enlaces privados. Las fotos, audios y videos se guardan en almacenamiento privado y no aparecen en buscadores.</p>
        </div>
        <div className="thi-private-orb">
          <span>◌</span><strong>PRIVATE</strong><small>one person only</small>
        </div>
      </div>
    </section>

    <section className="thi-final-cta thi-final-cta-premium">
      <div className="thi-final-ring ring-a"/><div className="thi-final-ring ring-b"/>
      <BrandMark href={href()} tagline />
      <h2>Hay regalos que se guardan.<br/><em>Y otros que se recuerdan.</em></h2>
      <Link className="thi-primary thi-primary-premium" href={href("/crear")}><span>Crear algo para alguien</span><b>→</b></Link>
    </section>

    <footer className="thi-footer thi-footer-v3">
      <BrandMark href={href()} compact />
      <p>Regalos digitales para el alma.</p>
      <div><a href="#ocasiones">Ver ocasiones</a><Link href={href("/crear")}>Crear regalo →</Link></div>
    </footer>
  </main>;
}
