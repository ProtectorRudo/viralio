/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anuncios que Venden | Playbook + Kit de Anuncios",
  description: "Un sistema práctico para crear anuncios con potencial viral: captar atención, retener, generar deseo y convertir mejor.",
  alternates: { canonical: "/ebook" },
  openGraph: {
    title: "Anuncios que Venden",
    description: "Aprendé a crear anuncios con potencial viral, pensados para captar atención, retener y vender mejor.",
    type: "website",
  },
};

const included = [
  {
    icon: "⚡",
    title: "100 Hooks que frenan el scroll",
    text: "Ideas listas para adaptar y conseguir que más personas se detengan en los primeros segundos.",
    tag: "HOOKS",
  },
  {
    icon: "🎬",
    title: "20 Guiones de alta retención",
    text: "Estructuras para videos de 10, 15, 20 y 30 segundos diseñadas para sostener la atención.",
    tag: "RETENCIÓN",
  },
  {
    icon: "🧠",
    title: "30 Estructuras de anuncio",
    text: "Fórmulas para convertir una idea en una pieza que capte atención, genere deseo y lleve a una acción.",
    tag: "CONVERSIÓN",
  },
  {
    icon: "🤖",
    title: "Prompts para encontrar ideas fuertes",
    text: "Prompts para generar ángulos, hooks, conceptos y variantes sin caer siempre en el mismo anuncio.",
    tag: "IDEACIÓN",
  },
  {
    icon: "🎯",
    title: "Método A.R.D.A.",
    text: "Atención → Retención → Deseo → Acción. El marco para pensar anuncios con potencial de viralizarse y vender.",
    tag: "MÉTODO",
  },
  {
    icon: "🔍",
    title: "Patrones de anuncios que explotan",
    text: "Cómo detectar qué tienen en común las piezas que consiguen vistas, retención y compartidos sin copiarlas.",
    tag: "PATRONES",
  },
  {
    icon: "📊",
    title: "Diagnóstico de viralidad y venta",
    text: "Qué revisar si no miran, abandonan rápido, no comparten, no hacen clic o no compran.",
    tag: "DIAGNÓSTICO",
  },
  {
    icon: "✅",
    title: "Checklist antes de publicar",
    text: "Una revisión rápida de hook, retención, deseo, CTA y claridad antes de invertir en pauta.",
    tag: "PUBLICAR",
  },
];

const audiences = [
  ["🛍️", "Productos físicos"],
  ["💼", "Servicios"],
  ["📍", "Negocios locales"],
  ["💻", "Productos digitales"],
  ["🧑‍💼", "Profesionales"],
];

const faqs = [
  [
    "¿Necesito saber de publicidad?",
    "No. El material está diseñado para empezar desde cero y avanzar con estructuras concretas, ejemplos y checklists.",
  ],
  [
    "¿Sirve si vendo servicios?",
    "Sí. El sistema contempla productos físicos, servicios, negocios locales, profesionales y productos digitales.",
  ],
  [
    "¿Es un curso con videos?",
    "No. Es un playbook práctico + kit de recursos digitales pensado para consultar mientras creás tus anuncios.",
  ],
  [
    "¿Funciona sólo para TikTok?",
    "No. Las estructuras se pueden adaptar a TikTok, Reels, Facebook e Instagram. La idea central es aprender a construir mejores piezas, no depender de una sola plataforma.",
  ],
  [
    "¿Se paga una suscripción?",
    "No. El precio de lanzamiento es un pago único de $14.900.",
  ],
  [
    "¿Esto garantiza que un anuncio se haga viral?",
    "No. Nadie puede garantizar viralidad. El sistema te enseña a aumentar las probabilidades de captar atención, retener, generar interés y crear piezas más compartibles.",
  ],
  [
    "¿El material garantiza ventas?",
    "No. Las ventas también dependen de tu producto, oferta, precio, mercado y ejecución. El objetivo es darte mejores herramientas para crear anuncios y detectar qué mejorar.",
  ],
];

export default function Home() {
  const checkoutUrl = "/api/ebook/checkout";

  return (
    <main className="aqv-ebook-page">
      <link rel="stylesheet" href="/ebook/ebook.css" />
      <div className="aqv-announcement">
        <span className="aqv-pulse" />
        PRECIO DE LANZAMIENTO · ACCESO DIGITAL
      </div>

      <section className="aqv-hero aqv-section-shell">
        <div className="aqv-hero-glow aqv-hero-glow-one" />
        <div className="aqv-hero-glow aqv-hero-glow-two" />
        <div className="aqv-hero-grid" />

        <div className="aqv-hero-copy">
          <div className="aqv-eyebrow">
            <span>PARA QUIEN VENDE ALGO</span>
            <strong>Y NO QUIERE IMPROVISAR</strong>
          </div>

          <h1>
            Pasá de “no sé qué anunciar”
            <span> a crear anuncios con potencial de hacerse virales.</span>
          </h1>

          <p className="aqv-hero-subtitle">
            <strong>ANUNCIOS QUE VENDEN</strong> te enseña a crear anuncios con <strong>potencial viral</strong>, pensados para captar atención, generar interés y llevar a más personas hacia tu producto o servicio.
          </p>

          <div className="aqv-hero-transform" aria-label="Transformación antes y después">
            <div className="aqv-transform-side aqv-transform-before">
              <small>ANTES</small>
              <strong>“¿Qué digo?”</strong>
              <span>Ideas sueltas · prueba y error · cero criterio claro</span>
            </div>
            <div className="aqv-transform-mini-arrow">→</div>
            <div className="aqv-transform-side aqv-transform-after">
              <small>DESPUÉS</small>
              <strong>Atención + deseo + acción</strong>
              <span>Anuncios pensados para destacar, compartirse y vender</span>
            </div>
          </div>

          <div className="aqv-hero-points">
            <span>✓ Captá atención desde el primer segundo</span>
            <span>✓ Creá anuncios con potencial de viralizarse</span>
            <span>✓ Convertí más miradas en oportunidades de venta</span>
          </div>

          <div className="aqv-hero-value-line">
            <strong>No comprás teoría.</strong>
            <span>Comprás un sistema para crear anuncios que destaquen y vendan.</span>
          </div>

          <div className="aqv-hero-buy">
            <div className="aqv-price-block">
              <span className="aqv-price-kicker">Precio de lanzamiento</span>
              <div className="aqv-price-row">
                <strong>$14.900</strong>
              </div>
              <small>ARS · pago único</small>
            </div>

            <a className="aqv-button aqv-button-primary" href={checkoutUrl} data-cta="hero">
              QUIERO CREAR ANUNCIOS QUE VENDAN
              <span>→</span>
            </a>
          </div>

          <div className="aqv-microtrust">
            <span>⚡ Acceso digital inmediato</span>
            <span>∞ Lo usás cada vez que creás un anuncio</span>
            <span>📱 Celular + PC</span>
          </div>
        </div>

        <div className="aqv-hero-visual" aria-label="Vista previa del producto">
          <div className="aqv-orbit aqv-orbit-one" />
          <div className="aqv-orbit aqv-orbit-two" />
          <div className="aqv-value-badge">
            <span>OBJETIVO</span>
            <strong>más impacto</strong>
          </div>

          <div className="aqv-product-scene">
            <div className="aqv-book">
              <div className="aqv-book-spine" />
              <div className="aqv-book-cover">
                <span className="aqv-book-mini">PLAYBOOK 2026</span>
                <div className="aqv-book-mark">AV</div>
                <h2>ANUNCIOS<br />QUE <em>VENDEN</em></h2>
                <p>De una pantalla en blanco a anuncios que captan atención.</p>
                <div className="aqv-book-line" />
                <small>HOOKS · GUIONES · IA · CHECKLISTS</small>
              </div>
            </div>

            <div className="aqv-resource-card aqv-card-hooks">
              <span>01</span>
              <strong>100 HOOKS</strong>
              <small>para detener el scroll</small>
            </div>
            <div className="aqv-resource-card aqv-card-ai">
              <span>AI</span>
              <strong>PROMPTS</strong>
              <small>listos para adaptar</small>
            </div>
            <div className="aqv-resource-card aqv-card-script">
              <span>▶</span>
              <strong>20 GUIONES</strong>
              <small>10 · 15 · 20 · 30s</small>
            </div>
          </div>
        </div>
      </section>

      <section className="aqv-proof-strip">
        <div className="aqv-proof-marquee">
          <span>CAPTÁ ATENCIÓN</span><i>◆</i>
          <span>GENERÁ DESEO</span><i>◆</i>
          <span>CREÁ ANUNCIOS COMPARTIBLES</span><i>◆</i>
          <span>PROBÁ VARIANTES</span><i>◆</i>
          <span>CONVERTÍ MÁS</span>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-problem-section">
        <div className="aqv-section-heading aqv-centered">
          <span className="aqv-section-kicker">EL PROBLEMA NO ES “HACER PUBLICIDAD”</span>
          <h2>El problema es que nadie se detiene a mirar tu anuncio.</h2>
          <p>Antes de vender, primero tenés que ganar atención. Después retenerla, generar deseo y recién ahí pedir una acción.</p>
        </div>

        <div className="aqv-before-after">
          <div className="aqv-state-card aqv-state-before">
            <span className="aqv-state-label">ANTES</span>
            <div className="aqv-blank-window">
              <div className="aqv-window-dots"><i/><i/><i/></div>
              <p>|</p>
            </div>
            <h3>“Publico… y nadie reacciona.”</h3>
            <p>Hooks débiles, videos que pierden atención rápido y mensajes que se sienten como publicidad.</p>
          </div>

          <div className="aqv-transform-arrow">→</div>

          <div className="aqv-state-card aqv-state-after">
            <span className="aqv-state-label">CON EL SISTEMA</span>
            <div className="aqv-formula">
              <span>HOOK</span><b>+</b><span>RETENCIÓN</span><b>+</b><span>ACCIÓN</span>
            </div>
            <h3>Anuncios hechos para conseguir atención.</h3>
            <p>Elegís un ángulo, sostenés el interés y construís una pieza que dé ganas de seguir mirando, compartir o comprar.</p>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-audience-section">
        <div className="aqv-section-heading aqv-split-heading">
          <div>
            <span className="aqv-section-kicker">NO IMPORTA QUÉ VENDAS</span>
            <h2>Tu anuncio compite por atención.</h2>
          </div>
          <p>Producto, servicio o negocio local: el principio es el mismo. Si nadie se detiene, no hay clic, consulta ni venta.</p>
        </div>

        <div className="aqv-audience-grid">
          {audiences.map(([icon, label]) => (
            <div className="aqv-audience-card" key={label}>
              <span>{icon}</span>
              <strong>{label}</strong>
              <small>→ ideas y formatos aplicables</small>
            </div>
          ))}
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-stack-section">
        <div className="aqv-section-heading aqv-centered aqv-narrow">
          <span className="aqv-section-kicker">TU CAJA DE HERRAMIENTAS CREATIVA</span>
          <h2>Todo para crear anuncios que tengan más chances de <em>destacar.</em></h2>
          <p>No son capítulos para estudiar y olvidar. Son recursos para abrir mientras creás: hooks, retención, guiones, patrones, IA y diagnóstico.</p>
        </div>

        <div className="aqv-stack-grid">
          {included.map((item, index) => (
            <article className="aqv-stack-card" key={item.title}>
              <div className="aqv-stack-top">
                <span className="aqv-stack-icon">{item.icon}</span>
                <small>{item.tag}</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="aqv-stack-number">{String(index + 1).padStart(2, "0")}</span>
            </article>
          ))}
        </div>

        <div className="aqv-stack-cta">
          <span>Un sistema para pensar mejores anuncios cada vez que tengas que publicar.</span>
          <a className="aqv-text-link" href={checkoutUrl}>Obtener el kit →</a>
        </div>
      </section>

      <section className="aqv-section aqv-preview-section">
        <div className="aqv-section-shell aqv-preview-layout">
          <div className="aqv-preview-copy">
            <span className="aqv-section-kicker">DE “UNA IDEA MÁS” A UNA PIEZA QUE DESTACA</span>
            <h2>Vas a saber qué hace que un anuncio dé ganas de seguir mirando.</h2>
            <p>
              El playbook convierte la viralidad en decisiones concretas: qué mostrar primero, cómo sostener la curiosidad, cómo generar deseo y cuándo pedir la acción.
            </p>
            <ul>
              <li><span>01</span> Frená el scroll con un hook fuerte.</li>
              <li><span>02</span> Mantené la atención con tensión y curiosidad.</li>
              <li><span>03</span> Convertí interés en deseo por tu oferta.</li>
              <li><span>04</span> Cerrá con un CTA claro y testeá variantes.</li>
            </ul>
          </div>

          <div className="aqv-pages-fan">
            <div className="aqv-page-sheet aqv-page-one">
              <div className="aqv-sheet-head"><span>HOOK VIRAL</span><b>01</b></div>
              <h4>“Nadie te cuenta<br/>esto sobre ___.”</h4>
              <div className="aqv-sheet-lines"><i/><i/><i/><i/></div>
              <small>CURIOSIDAD · INTERRUPCIÓN · ATENCIÓN</small>
            </div>
            <div className="aqv-page-sheet aqv-page-two">
              <div className="aqv-sheet-head"><span>RETENCIÓN</span><b>07</b></div>
              <h4>Hook → Tensión<br/>→ Revelación</h4>
              <div className="aqv-flow-row"><span>H</span><i>→</i><span>T</span><i>→</i><span>R</span></div>
              <small>PARA SOSTENER LA ATENCIÓN</small>
            </div>
            <div className="aqv-page-sheet aqv-page-three">
              <div className="aqv-sheet-head"><span>PROMPT IA</span><b>12</b></div>
              <h4>Generá 10 ideas<br/>con potencial viral.</h4>
              <div className="aqv-prompt-box">Mi producto es ___ y mi cliente desea ___...</div>
              <small>ÁNGULOS · HOOKS · VARIANTES</small>
            </div>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-method-section">
        <div className="aqv-method-card">
          <div className="aqv-method-intro">
            <span className="aqv-section-kicker aqv-light">EL MÉTODO A.R.D.A.</span>
            <h2>La secuencia detrás de un anuncio que puede despegar.</h2>
            <p>No alcanza con un hook. La pieza tiene que ganar atención, sostenerla, generar deseo y llevar a una acción.</p>
          </div>
          <div className="aqv-method-steps">
            <div>
              <span>A</span>
              <strong>ATENCIÓN</strong>
              <p>¿Qué hace que alguien deje de deslizar?</p>
            </div>
            <div>
              <span>R</span>
              <strong>RETENCIÓN</strong>
              <p>¿Qué hace que quiera seguir mirando después del hook?</p>
            </div>
            <div>
              <span>D</span>
              <strong>DESEO</strong>
              <p>¿Qué hace que quiera eso que estás mostrando?</p>
            </div>
            <div>
              <span>A</span>
              <strong>ACCIÓN</strong>
              <p>¿Qué querés que haga después: comentar, compartir, consultar o comprar?</p>
            </div>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-steps-section">
        <div className="aqv-section-heading aqv-centered">
          <span className="aqv-section-kicker">DE LA IDEA A LA PRUEBA REAL</span>
          <h2>Creá, lanzá y encontrá qué versión tiene más potencial.</h2>
        </div>

        <div className="aqv-steps-grid">
          <article>
            <span className="aqv-step-number">01</span>
            <div className="aqv-step-icon">◉</div>
            <h3>Encontrá el ángulo</h3>
            <p>Elegí el deseo, problema o curiosidad que puede hacer que la persona se detenga.</p>
          </article>
          <article>
            <span className="aqv-step-number">02</span>
            <div className="aqv-step-icon">✦</div>
            <h3>Construí para retener</h3>
            <p>Hook + tensión + demostración + deseo + CTA. Cada segundo tiene una función.</p>
          </article>
          <article>
            <span className="aqv-step-number">03</span>
            <div className="aqv-step-icon">↗</div>
            <h3>Probá variantes</h3>
            <p>Cambiá hook, ángulo o apertura para descubrir qué versión consigue más atención y respuesta.</p>
          </article>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-clarity-section">
        <div className="aqv-clarity-grid">
          <div className="aqv-clarity-copy">
            <span className="aqv-section-kicker">VIRALIDAD NO ES MAGIA: SE DIAGNOSTICA</span>
            <h2>Descubrí en qué segundo se rompe tu anuncio.</h2>
            <p>El sistema te ayuda a separar un problema de atención, retención, deseo o conversión para no cambiar todo a ciegas.</p>
          </div>
          <div className="aqv-diagnostic">
            <div><span>👀</span><p><strong>No se detienen</strong><small>Revisá el primer segundo y el hook</small></p></div>
            <div><span>⏱️</span><p><strong>Abandonan rápido</strong><small>Revisá tensión, ritmo y promesa</small></p></div>
            <div><span>🔁</span><p><strong>Miran pero no reaccionan</strong><small>Revisá deseo, novedad y motivo para compartir</small></p></div>
            <div><span>🛒</span><p><strong>Interesa pero no vende</strong><small>Revisá oferta, CTA y landing</small></p></div>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-offer-section" id="oferta">
        <div className="aqv-offer-card">
          <div className="aqv-offer-left">
            <span className="aqv-section-kicker aqv-light">PRECIO DE LANZAMIENTO</span>
            <h2>Tu próximo anuncio puede tener una idea mucho más fuerte.</h2>
            <p>Accedé al Playbook + Kit completo y usalo cada vez que quieras crear una pieza con más potencial de captar atención, retener y vender.</p>

            <div className="aqv-offer-list">
              <span>✓ Playbook completo</span>
              <span>✓ 100 Hooks</span>
              <span>✓ 30 Estructuras</span>
              <span>✓ 20 Guiones</span>
              <span>✓ Prompts IA</span>
              <span>✓ Checklists</span>
              <span>✓ Diagnóstico de viralidad</span>
              <span>✓ Swipe File</span>
            </div>
          </div>

          <div className="aqv-checkout-card">
            <span className="aqv-checkout-label">HOY</span>
            <div className="aqv-checkout-price">$14.900</div>
            <div className="aqv-checkout-currency">ARS · PAGO ÚNICO</div>
            <a className="aqv-button aqv-button-dark" href={checkoutUrl} data-cta="offer">
              QUIERO CREAR MEJORES ANUNCIOS
              <span>→</span>
            </a>
            <div className="aqv-checkout-notes">
              <span>⚡ Entrega digital</span>
              <span>🔒 Compra segura</span>
              <span>∞ Sin suscripción</span>
            </div>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-faq-section">
        <div className="aqv-section-heading aqv-centered aqv-narrow">
          <span className="aqv-section-kicker">PREGUNTAS FRECUENTES</span>
          <h2>Antes de comprar.</h2>
        </div>
        <div className="aqv-faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>
                <span>{question}</span>
                <i>+</i>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="aqv-final-cta">
        <div className="aqv-final-glow" />
        <div className="aqv-section-shell aqv-final-inner">
          <span className="aqv-section-kicker aqv-light">ANUNCIOS QUE VENDEN</span>
          <h2>Dejá de crear anuncios que pasan de largo.<br/><em>Creá piezas que den ganas de mirar.</em></h2>
          <p>Más atención. Más retención. Más oportunidades de vender. · $14.900 ARS · pago único.</p>
          <a className="aqv-button aqv-button-primary aqv-final-button" href={checkoutUrl} data-cta="final">
            QUIERO ANUNCIOS CON MÁS IMPACTO
            <span>→</span>
          </a>
          <small>Producto educativo digital. Los resultados dependen de la oferta, mercado, ejecución y otros factores.</small>
        </div>
      </section>

      <footer>
        <div className="aqv-section-shell aqv-footer-inner">
          <strong>ANUNCIOS QUE VENDEN™</strong>
          <p>Un producto digital de Viralio.</p>
          <span>© 2026 · Todos los derechos reservados.</span>
        </div>
      </footer>

      <div className="aqv-mobile-sticky">
        <div>
          <span>PRECIO LANZAMIENTO</span>
          <strong>$14.900</strong>
        </div>
        <a href={checkoutUrl} data-cta="sticky">QUIERO →</a>
      </div>
    </main>
  );
}
