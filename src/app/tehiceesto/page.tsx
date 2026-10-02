import Link from "next/link";
import { experiences } from "./data";

export default function TeHiceEstoHome(){
  return <main className="thi-site">
    <header className="thi-nav"><Link href="/tehiceesto" className="thi-brand">TE HICE ESTO<span>♥</span></Link><nav><a href="#experiencias">Experiencias</a><Link href="/tehiceesto/crear">Crear regalo</Link></nav></header>
    <section className="thi-hero">
      <div className="thi-hero-copy">
        <p className="thi-kicker">Experiencias digitales personalizadas</p>
        <h1>Un regalo que no se abre.<em> Se vive.</em></h1>
        <p>Convertí fotos, cartas, audios y recuerdos en un lugar de Internet que existe solamente para una persona.</p>
        <div className="thi-hero-actions"><Link className="thi-primary" href="/tehiceesto/crear">Hacerle algo ♥</Link><Link className="thi-text-link" href="/tehiceesto/experiencias/pareja">Vivir un demo →</Link></div>
      </div>
      <div className="thi-phone-wrap">
        <div className="thi-phone"><div className="thi-island"/><div className="thi-phone-screen"><small>Julián hizo algo para vos</small><strong>Emma</strong><p>Este lugar existe solamente para vos.</p><span>Entrar</span></div></div>
        <div className="thi-float one">✦ recuerdos</div><div className="thi-float two">♥ una carta escondida</div>
      </div>
    </section>

    <section className="thi-trust"><span>100% digital</span><i/><span>Link privado</span><i/><span>Hecho para celular</span><i/><span>Pago único</span></section>

    <section className="thi-catalog" id="experiencias">
      <div className="thi-section-head"><p className="thi-kicker">Elegí una historia</p><h2>¿Para quién querés hacer algo inolvidable?</h2><p>No elegís una plantilla. Elegís el tipo de emoción que querés crear.</p></div>
      <div className="thi-card-grid">{experiences.map((x,i)=><Link href={`/tehiceesto/experiencias/${x.slug}`} className="thi-card" key={x.slug} style={{"--card-accent":x.accent} as React.CSSProperties}><span className="thi-card-num">{String(i+1).padStart(2,"0")}</span><span className="thi-card-icon">{x.icon}</span><small>{x.eyebrow}</small><h3>{x.title}</h3><p>{x.short}</p><div>{x.tags.map(t=><em key={t}>{t}</em>)}</div><strong>Vivir demo →</strong></Link>)}</div>
    </section>

    <section className="thi-how"><div className="thi-section-head"><p className="thi-kicker">Muy fácil para vos. Inolvidable para quien lo recibe.</p><h2>Vos traés la historia. Nosotros construimos el lugar.</h2></div><div className="thi-steps"><article><span>01</span><h3>Elegís</h3><p>La persona, la ocasión y qué querés hacerle sentir.</p></article><article><span>02</span><h3>Nos contás</h3><p>Fotos, audios, recuerdos y pequeñas cosas que sólo ustedes entienden.</p></article><article><span>03</span><h3>Lo creamos</h3><p>La historia se convierte en escenas, juegos, cartas y sorpresas.</p></article><article><span>04</span><h3>Lo vive</h3><p>Le mandás un link privado para descubrirlo paso a paso.</p></article></div></section>

    <section className="thi-final-cta"><p className="thi-kicker">Hay alguien que se merece esto</p><h2>No le mandes otra cosa. Hacésela vivir.</h2><Link className="thi-primary" href="/tehiceesto/crear">Empezar mi regalo</Link></section>
    <footer className="thi-footer"><span className="thi-brand">TE HICE ESTO<span>♥</span></span><p>Un lugar en Internet que existe para una sola persona.</p></footer>
  </main>;
}
