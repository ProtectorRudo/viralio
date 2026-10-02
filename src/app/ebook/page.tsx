import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anuncios que Venden | Playbook + Kit de Anuncios",
  description: "Hooks, guiones, estructuras, prompts de IA y checklists para crear anuncios sin empezar desde cero.",
  alternates: { canonical: "/ebook" },
  openGraph: {
    title: "Anuncios que Venden",
    description: "El playbook práctico para pasar de una pantalla en blanco a anuncios estructurados y listos para producir.",
    type: "website",
  },
};

const included = [
  {
    icon: "⚡",
    title: "100 Hooks",
    text: "Ideas listas para adaptar y captar atención desde los primeros segundos.",
    tag: "ATENCIÓN",
  },
  {
    icon: "🎬",
    title: "20 Guiones",
    text: "Estructuras para videos cortos de 10, 15, 20 y 30 segundos.",
    tag: "VIDEO",
  },
  {
    icon: "🧠",
    title: "30 Estructuras",
    text: "Fórmulas publicitarias para dejar de empezar cada anuncio desde cero.",
    tag: "COPY",
  },
  {
    icon: "🤖",
    title: "Prompts para IA",
    text: "Prompts preparados para generar ángulos, hooks y variantes en minutos.",
    tag: "IA",
  },
  {
    icon: "🎯",
    title: "Método A.V.C.",
    text: "Atención → Valor → Conversión. Un marco simple para ordenar cada pieza.",
    tag: "MÉTODO",
  },
  {
    icon: "🔍",
    title: "Investigación",
    text: "Cómo detectar ideas y patrones de competidores sin copiar anuncios.",
    tag: "RESEARCH",
  },
  {
    icon: "📊",
    title: "Diagnóstico",
    text: "Qué revisar cuando hay vistas, clics o interés, pero no llegan las ventas.",
    tag: "OPTIMIZACIÓN",
  },
  {
    icon: "✅",
    title: "Checklist",
    text: "Una revisión final para publicar con criterio y evitar errores básicos.",
    tag: "LANZAMIENTO",
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
    "¿El material garantiza ventas?",
    "No existe una plantilla que pueda garantizar resultados. El objetivo del sistema es darte un proceso mucho más claro para crear, evaluar y mejorar anuncios.",
  ],
];

export default function Home() {
  const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL || "https://mpago.la/2yjdJB9";

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
          <span className="aqv-section-kicker">NO ES MÁS TEORÍA</span>
          <h2>No necesitás otro PDF que te explique qué es el marketing.</h2>
          <p>Necesitás abrirlo, elegir qué vendés y saber qué hacer después.</p>
        </div>

        <div className="aqv-before-after">
          <div className="aqv-state-card aqv-state-before">
            <span className="aqv-state-label">ANTES</span>
            <div className="aqv-blank-window">
              <div className="aqv-window-dots"><i/><i/><i/></div>
              <p>|</p>
            </div>
            <h3>“¿Qué pongo en el anuncio?”</h3>
            <p>Ideas sueltas, horas mirando la pantalla y cambios sin un criterio claro.</p>
          </div>

          <div className="aqv-transform-arrow">→</div>

          <div className="aqv-state-card aqv-state-after">
            <span className="aqv-state-label">CON EL PLAYBOOK</span>
            <div className="aqv-formula">
              <span>HOOK</span><b>+</b><span>VALOR</span><b>+</b><span>CTA</span>
            </div>
            <h3>Una estructura para empezar.</h3>
            <p>Elegís un ángulo, adaptás una fórmula y construís una pieza con intención.</p>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-audience-section">
        <div className="aqv-section-heading aqv-split-heading">
          <div>
            <span className="aqv-section-kicker">ELEGÍ TU CAMINO</span>
            <h2>¿Qué vendés?</h2>
          </div>
          <p>El sistema está pensado para que no tengas que traducir teoría genérica a tu realidad.</p>
        </div>

        <div className="aqv-audience-grid">
          {audiences.map(([icon, label]) => (
            <div className="aqv-audience-card" key={label}>
              <span>{icon}</span>
              <strong>{label}</strong>
              <small>→ estructuras aplicables</small>
            </div>
          ))}
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-stack-section">
        <div className="aqv-section-heading aqv-centered aqv-narrow">
          <span className="aqv-section-kicker">TODO EN UN SOLO SISTEMA</span>
          <h2>Esto es lo que te llevás por <em>$14.900</em></h2>
          <p>No son “capítulos”. Son recursos para usar mientras pensás, escribís y producís anuncios.</p>
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
          <span>Valor percibido: mucho más que un “ebook”</span>
          <a className="aqv-text-link" href={checkoutUrl}>Obtener el kit →</a>
        </div>
      </section>

      <section className="aqv-section aqv-preview-section">
        <div className="aqv-section-shell aqv-preview-layout">
          <div className="aqv-preview-copy">
            <span className="aqv-section-kicker">MIRÁ ANTES DE COMPRAR</span>
            <h2>No te pedimos que imagines el contenido.</h2>
            <p>
              El playbook está construido para ser visual, escaneable y accionable. Abrís una sección y encontrás una decisión concreta para tomar.
            </p>
            <ul>
              <li><span>01</span> Elegí un hook.</li>
              <li><span>02</span> Completá una estructura.</li>
              <li><span>03</span> Generá variantes con IA.</li>
              <li><span>04</span> Revisá antes de publicar.</li>
            </ul>
          </div>

          <div className="aqv-pages-fan">
            <div className="aqv-page-sheet aqv-page-one">
              <div className="aqv-sheet-head"><span>100 HOOKS</span><b>01</b></div>
              <h4>“Si vendés ___,<br/>probá esto.”</h4>
              <div className="aqv-sheet-lines"><i/><i/><i/><i/></div>
              <small>HOOK DE CURIOSIDAD</small>
            </div>
            <div className="aqv-page-sheet aqv-page-two">
              <div className="aqv-sheet-head"><span>ESTRUCTURA</span><b>07</b></div>
              <h4>Problema → Cambio<br/>→ Solución</h4>
              <div className="aqv-flow-row"><span>P</span><i>→</i><span>C</span><i>→</i><span>S</span></div>
              <small>PLANTILLA EDITABLE</small>
            </div>
            <div className="aqv-page-sheet aqv-page-three">
              <div className="aqv-sheet-head"><span>PROMPT IA</span><b>12</b></div>
              <h4>Generá 5 ángulos<br/>para tu oferta.</h4>
              <div className="aqv-prompt-box">Mi producto es ___ y ayuda a ___...</div>
              <small>COPIÁ · PEGÁ · ADAPTÁ</small>
            </div>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-method-section">
        <div className="aqv-method-card">
          <div className="aqv-method-intro">
            <span className="aqv-section-kicker aqv-light">EL MÉTODO A.V.C.</span>
            <h2>Tres preguntas antes de tocar “publicar”.</h2>
            <p>Una forma simple de darle orden al anuncio antes de gastar un peso en pauta.</p>
          </div>
          <div className="aqv-method-steps">
            <div>
              <span>A</span>
              <strong>ATENCIÓN</strong>
              <p>¿Qué hace que alguien deje de deslizar?</p>
            </div>
            <div>
              <span>V</span>
              <strong>VALOR</strong>
              <p>¿Por qué debería importarle lo que ofrecés?</p>
            </div>
            <div>
              <span>C</span>
              <strong>CONVERSIÓN</strong>
              <p>¿Qué querés que haga después?</p>
            </div>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-steps-section">
        <div className="aqv-section-heading aqv-centered">
          <span className="aqv-section-kicker">SIN COMPLICARLO</span>
          <h2>De la idea al anuncio en 3 pasos.</h2>
        </div>

        <div className="aqv-steps-grid">
          <article>
            <span className="aqv-step-number">01</span>
            <div className="aqv-step-icon">◉</div>
            <h3>Elegí qué vendés</h3>
            <p>Ubicá tu tipo de negocio, producto o servicio y elegí el enfoque.</p>
          </article>
          <article>
            <span className="aqv-step-number">02</span>
            <div className="aqv-step-icon">✦</div>
            <h3>Armá la pieza</h3>
            <p>Hook + estructura + demostración + CTA. Sin improvisar todo desde cero.</p>
          </article>
          <article>
            <span className="aqv-step-number">03</span>
            <div className="aqv-step-icon">↗</div>
            <h3>Adaptá y publicá</h3>
            <p>Creá variantes, pasá el checklist y prepará el anuncio para testear.</p>
          </article>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-clarity-section">
        <div className="aqv-clarity-grid">
          <div className="aqv-clarity-copy">
            <span className="aqv-section-kicker">CUANDO ALGO NO FUNCIONA</span>
            <h2>Dejá de cambiar todo al mismo tiempo.</h2>
            <p>Una parte del kit te ayuda a pensar dónde puede estar el cuello de botella.</p>
          </div>
          <div className="aqv-diagnostic">
            <div><span>👀</span><p><strong>No miran</strong><small>Revisá hook y creativo</small></p></div>
            <div><span>🖱️</span><p><strong>Miran, no hacen clic</strong><small>Revisá propuesta y CTA</small></p></div>
            <div><span>🛒</span><p><strong>Hacen clic, no compran</strong><small>Revisá oferta y landing</small></p></div>
          </div>
        </div>
      </section>

      <section className="aqv-section aqv-section-shell aqv-offer-section" id="oferta">
        <div className="aqv-offer-card">
          <div className="aqv-offer-left">
            <span className="aqv-section-kicker aqv-light">PRECIO DE LANZAMIENTO</span>
            <h2>Tu próxima idea no tiene que empezar en blanco.</h2>
            <p>Accedé al Playbook + Kit completo y usalo como sistema de consulta cada vez que tengas que crear un anuncio.</p>

            <div className="aqv-offer-list">
              <span>✓ Playbook completo</span>
              <span>✓ 100 Hooks</span>
              <span>✓ 30 Estructuras</span>
              <span>✓ 20 Guiones</span>
              <span>✓ Prompts IA</span>
              <span>✓ Checklists</span>
              <span>✓ Diagnóstico</span>
              <span>✓ Swipe File</span>
            </div>
          </div>

          <div className="aqv-checkout-card">
            <span className="aqv-checkout-label">HOY</span>
            <div className="aqv-checkout-price">$14.900</div>
            <div className="aqv-checkout-currency">ARS · PAGO ÚNICO</div>
            <a className="aqv-button aqv-button-dark" href={checkoutUrl} data-cta="offer">
              OBTENER ACCESO AHORA
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
          <h2>Menos “¿qué publico?”<br/><em>Más claridad para crear.</em></h2>
          <p>Playbook + kit completo · $14.900 ARS · pago único.</p>
          <a className="aqv-button aqv-button-primary aqv-final-button" href={checkoutUrl} data-cta="final">
            QUIERO EL KIT COMPLETO
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
        <a href={checkoutUrl} data-cta="sticky">OBTENER →</a>
      </div>
    </main>
  );
}
