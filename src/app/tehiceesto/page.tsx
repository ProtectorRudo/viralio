import Link from "next/link";
import { experiences } from "./data";

export default function TeHiceEstoHome(){
  return <main className="thi-site thi-premium-site">
    <div className="thi-page-noise" aria-hidden="true"/>
    <div className="thi-page-aura aura-one" aria-hidden="true"/>
    <div className="thi-page-aura aura-two" aria-hidden="true"/>

    <header className="thi-nav">
      <Link href="/tehiceesto" className="thi-brand">TE HICE ESTO<span>♥</span></Link>
      <nav>
        <a href="#experiencias">Experiencias</a>
        <a href="#como-funciona">Cómo funciona</a>
        <Link href="/tehiceesto/crear" className="thi-nav-cta">Crear regalo</Link>
      </nav>
    </header>

    <section className="thi-hero thi-hero-premium">
      <div className="thi-hero-copy">
        <div className="thi-hero-badge">
          <span className="thi-live-dot"/>
          Hecho para una sola persona
        </div>
        <p className="thi-kicker">Experiencias digitales personalizadas</p>
        <h1>Un regalo que no se abre.<em> Se vive.</em></h1>
        <p className="thi-hero-description">Convertí fotos, cartas, audios y recuerdos en un lugar de Internet que existe solamente para esa persona. No mira una página: entra, descubre, toca y siente.</p>
        <div className="thi-hero-actions">
          <Link className="thi-primary thi-primary-premium" href="/tehiceesto/crear">
            <span>Hacerle algo</span><b>♥</b>
          </Link>
          <Link className="thi-text-link thi-demo-link" href="/tehiceesto/experiencias/pareja">
            <span className="thi-play-dot">▶</span>
            Vivir un demo
          </Link>
        </div>
        <div className="thi-hero-signature">
          <span><b>01</b> Privado</span>
          <span><b>02</b> Interactivo</span>
          <span><b>03</b> Irrepetible</span>
        </div>
      </div>

      <div className="thi-phone-wrap thi-phone-premium" aria-hidden="true">
        <div className="thi-phone-orbit orbit-one"/>
        <div className="thi-phone-orbit orbit-two"/>
        <div className="thi-phone-shadow"/>
        <div className="thi-phone">
          <div className="thi-island"/>
          <div className="thi-phone-screen">
            <div className="thi-phone-stars"><i/><i/><i/><i/><i/></div>
            <small>Julián hizo algo para vos</small>
            <strong>Emma</strong>
            <p>Este lugar existe solamente para vos.</p>
            <span className="thi-phone-enter">Entrar <i>→</i></span>
            <em>6 min · mejor con auriculares</em>
          </div>
        </div>
        <div className="thi-float one"><i>✦</i><span>recuerdos<br/><small>que se descubren</small></span></div>
        <div className="thi-float two"><i>♥</i><span>una carta<br/><small>que espera al final</small></span></div>
        <div className="thi-float three"><i>◌</i><span>link privado<br/><small>sólo para esa persona</small></span></div>
      </div>
    </section>

    <section className="thi-trust thi-trust-premium">
      <span><b>✦</b> 100% digital</span><i/>
      <span><b>⌁</b> Link privado</span><i/>
      <span><b>◇</b> Hecho para celular</span><i/>
      <span><b>∞</b> Un recuerdo que queda</span>
    </section>

    <section className="thi-emotion-section">
      <div className="thi-emotion-copy">
        <p className="thi-kicker">No es una página bonita</p>
        <h2>La diferencia está en lo que la persona tiene que hacer.</h2>
        <p>Entrar a una habitación. Abrir una puerta. Encender estrellas. Escuchar una voz. Descubrir una carta. Cada gesto convierte el recuerdo en algo que se vive.</p>
      </div>
      <div className="thi-emotion-visual">
        <article className="thi-mini-scene scene-door"><span>01</span><div className="mini-door"><i/></div><strong>Abrir</strong><small>una puerta que sólo existe para vos</small></article>
        <article className="thi-mini-scene scene-star"><span>02</span><div className="mini-star">✦</div><strong>Descubrir</strong><small>lo que alguien guardó para decirte</small></article>
        <article className="thi-mini-scene scene-letter"><span>03</span><div className="mini-letter">♥</div><strong>Sentir</strong><small>la parte que no entraba en una foto</small></article>
      </div>
    </section>

    <section className="thi-catalog" id="experiencias">
      <div className="thi-section-head">
        <p className="thi-kicker">Elegí una historia</p>
        <h2>¿Para quién querés hacer algo inolvidable?</h2>
        <p>No elegís una plantilla. Elegís el tipo de emoción que querés crear.</p>
      </div>
      <div className="thi-card-grid">
        {experiences.map((x,i)=><Link href={`/tehiceesto/experiencias/${x.slug}`} className="thi-card thi-card-premium" key={x.slug} style={{"--card-accent":x.accent} as React.CSSProperties}>
          <span className="thi-card-glow"/>
          <span className="thi-card-num">{String(i+1).padStart(2,"0")}</span>
          <span className="thi-card-icon">{x.icon}</span>
          <small>{x.eyebrow}</small>
          <h3>{x.title}</h3>
          <p>{x.short}</p>
          <div>{x.tags.map(t=><em key={t}>{t}</em>)}</div>
          <strong>Vivir demo <i>↗</i></strong>
        </Link>)}
      </div>
    </section>

    <section className="thi-how" id="como-funciona">
      <div className="thi-section-head">
        <p className="thi-kicker">Muy fácil para vos. Inolvidable para quien lo recibe.</p>
        <h2>Vos traés la historia. Nosotros construimos el lugar.</h2>
      </div>
      <div className="thi-steps thi-steps-premium">
        <article><span>01</span><i>◇</i><h3>Elegís</h3><p>La persona, la ocasión y qué querés hacerle sentir.</p></article>
        <article><span>02</span><i>✦</i><h3>Nos contás</h3><p>Fotos, audios, recuerdos y pequeñas cosas que sólo ustedes entienden.</p></article>
        <article><span>03</span><i>⌁</i><h3>Lo creamos</h3><p>La historia se convierte en escenas, juegos, cartas y sorpresas.</p></article>
        <article><span>04</span><i>♥</i><h3>Lo vive</h3><p>Le mandás un link privado para descubrirlo paso a paso.</p></article>
      </div>
    </section>

    <section className="thi-private-section">
      <div className="thi-private-card">
        <div>
          <p className="thi-kicker">Íntimo por diseño</p>
          <h2>Lo importante no tiene por qué ser público.</h2>
          <p>El regalo vive detrás de un código privado. Las fotos, audios y videos se guardan en almacenamiento privado y se entregan mediante enlaces temporales.</p>
        </div>
        <div className="thi-private-orb">
          <span>◌</span><strong>PRIVATE</strong><small>one person only</small>
        </div>
      </div>
    </section>

    <section className="thi-final-cta thi-final-cta-premium">
      <div className="thi-final-ring ring-a"/><div className="thi-final-ring ring-b"/>
      <p className="thi-kicker">Hay alguien que se merece esto</p>
      <h2>No le mandes otra cosa.<br/><em>Hacésela vivir.</em></h2>
      <Link className="thi-primary thi-primary-premium" href="/tehiceesto/crear"><span>Empezar mi regalo</span><b>→</b></Link>
      <small>Un regalo digital. Una experiencia privada. Un recuerdo que queda.</small>
    </section>

    <footer className="thi-footer">
      <span className="thi-brand">TE HICE ESTO<span>♥</span></span>
      <p>Un lugar en Internet que existe para una sola persona.</p>
      <Link href="/tehiceesto/crear">Crear algo →</Link>
    </footer>
  </main>;
}
