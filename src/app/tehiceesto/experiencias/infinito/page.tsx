"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./cosmos.css";

/**
 * Modelo autónomo de demostración. Para personalizar una instancia real,
 * reemplazar únicamente COPY: nunca la estructura ni la lógica del recorrido.
 */
const COPY = {
  recipient: "vos",
  giver: "alguien que te quiere muchísimo",
  closing: "No importa cuánto crezca el universo. Siempre voy a encontrar una forma de quererte un poquito más.",
  signature: "Con todo mi amor",
};

const STAGES = [
  {
    name: "La Tierra",
    eyebrow: "MEDICIÓN 01 · PLANETA TIERRA",
    heading: "Empecemos por algo chiquito.",
    intro: "Bueno… chiquito, chiquito, no.",
    hint: "Tocá la Tierra para medir",
    reveal: "12.742 km de diámetro. Nada mal. Aunque mis ganas de verte ya dieron como cinco vueltas.",
    next: "Busquemos algo más grande",
  },
  {
    name: "El Sol",
    eyebrow: "MEDICIÓN 02 · EL SOL",
    heading: "Ah, bueno. Esto sí que es enorme.",
    intro: "Entra más de un millón de Tierras acá adentro.",
    hint: "Tocá el Sol (no quema, prometido)",
    reveal: "Igual se queda corto. Vos me hacés sonreír más fuerte que el Sol… y sin protector solar.",
    next: "Necesitamos algo gigante",
  },
  {
    name: "La galaxia",
    eyebrow: "MEDICIÓN 03 · VÍA LÁCTEA",
    heading: "Probemos con toda una galaxia.",
    intro: "Estrellas, planetas y un montón de espacio.",
    hint: "Tocá la galaxia para explorar",
    reveal: "Calculé millones de estrellas. Pero ninguna explica bien lo que me pasa cuando te reís.",
    next: "Creo que falta espacio",
  },
  {
    name: "El universo",
    eyebrow: "MEDICIÓN 04 · UNIVERSO",
    heading: "Ahora sí. Todo lo que existe.",
    intro: "Esto debería alcanzar. ¿No?",
    hint: "Tocá el universo para comprobar",
    reveal: "ERROR 404: medida del amor no encontrada. La calculadora renunció y Mercurio pidió vacaciones.",
    next: "Queda una última cosa…",
  },
  {
    name: "Lo nuestro",
    eyebrow: "MEDICIÓN 05 · RESULTADO FINAL",
    heading: "Encontré algo más grande.",
    intro: "Y no aparece en ningún telescopio.",
    hint: "Tocá el corazón para descubrirlo",
    reveal: "Mi amor por vos no entra en el universo. Y mirá que espacio le sobra.",
    next: "",
  },
] as const;

const STAR_POINTS = Array.from({ length: 55 }, (_, index) => ({
  left: ((index * 73 + 19) % 97) + "%",
  top: ((index * 41 + index * index * 7) % 96) + "%",
  delay: ((index * 13) % 29) / 10 + "s",
  size: index % 9 === 0 ? "3px" : index % 3 === 0 ? "2px" : "1px",
}));

function NightSky() {
  return (
    <div className="gal-sky" aria-hidden="true">
      {STAR_POINTS.map((point, index) => (
        <span
          key={index}
          className="gal-sky-star"
          style={{ left: point.left, top: point.top, width: point.size, height: point.size, animationDelay: point.delay }}
        />
      ))}
      <span className="gal-sky-haze gal-sky-haze-one" />
      <span className="gal-sky-haze gal-sky-haze-two" />
    </div>
  );
}

function Earth() {
  return (
    <svg className="gal-planet-svg" viewBox="0 0 240 240" role="img" aria-label="Ilustración animada de la Tierra">
      <defs>
        <radialGradient id="gal-ocean" cx="34%" cy="28%" r="78%">
          <stop offset="0" stopColor="#b4f0ff" />
          <stop offset=".40" stopColor="#328bc6" />
          <stop offset="1" stopColor="#0b285a" />
        </radialGradient>
        <clipPath id="gal-earth-clip"><circle cx="120" cy="120" r="100" /></clipPath>
        <radialGradient id="gal-earth-highlight" cx="25%" cy="18%" r="85%">
          <stop offset="0" stopColor="#fff" stopOpacity=".53" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#050a3b" stopOpacity=".38" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="108" fill="#4fbbff" opacity=".12" />
      <circle cx="120" cy="120" r="100" fill="url(#gal-ocean)" stroke="#9fe9ff" strokeOpacity=".48" strokeWidth="2" />
      <g clipPath="url(#gal-earth-clip)" fill="#7ece9f">
        <path d="M46 53 73 27l30 17 6 20 21 8 5 22-18 13-9 27-17 6-19-20-26-2-18-27Z" />
        <path d="m100 152 34 12 9 27-10 21-17 32-18-6-1-31-15-20 8-22Z" />
        <path d="m159 37 32 15 21 28-4 19-19 8-9 27-17-6-18-29-22-5-5-24 22-10Z" />
        <path d="m189 159 26 2 17 20-9 27-36 9-12-19 7-24Z" />
        <path d="m35 145 25 1 10 19-18 18-28-7Z" />
      </g>
      <circle cx="120" cy="120" r="100" fill="url(#gal-earth-highlight)" />
      <ellipse cx="88" cy="90" rx="23" ry="9" fill="#fff" opacity=".26" transform="rotate(-35 88 90)" />
    </svg>
  );
}

function Sun() {
  return (
    <div className="gal-sun-wrap" role="img" aria-label="Sol radiante y animado">
      <div className="gal-sun-rays" />
      <div className="gal-sun-disc" />
      <div className="gal-sun-spark gal-sun-spark-a" />
      <div className="gal-sun-spark gal-sun-spark-b" />
    </div>
  );
}

function Galaxy({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? "gal-galaxy gal-galaxy-small" : "gal-galaxy"} role="img" aria-label="Galaxia espiral luminosa">
      <span className="gal-galaxy-arm gal-galaxy-arm-a" />
      <span className="gal-galaxy-arm gal-galaxy-arm-b" />
      <span className="gal-galaxy-arm gal-galaxy-arm-c" />
      <span className="gal-galaxy-core" />
      <span className="gal-galaxy-spark gal-galaxy-spark-1" />
      <span className="gal-galaxy-spark gal-galaxy-spark-2" />
      <span className="gal-galaxy-spark gal-galaxy-spark-3" />
      <span className="gal-galaxy-spark gal-galaxy-spark-4" />
    </div>
  );
}

function Cosmos() {
  return (
    <div className="gal-universe" role="img" aria-label="Universo con múltiples galaxias de colores">
      <span className="gal-universe-orbit gal-universe-orbit-1" />
      <span className="gal-universe-orbit gal-universe-orbit-2" />
      <span className="gal-universe-orbit gal-universe-orbit-3" />
      <div className="gal-universe-main"><Galaxy /></div>
      <div className="gal-universe-mini gal-universe-mini-a"><Galaxy small /></div>
      <div className="gal-universe-mini gal-universe-mini-b"><Galaxy small /></div>
      <div className="gal-universe-mini gal-universe-mini-c"><Galaxy small /></div>
      <span className="gal-universe-star gal-universe-star-a">✦</span>
      <span className="gal-universe-star gal-universe-star-b">✧</span>
      <span className="gal-universe-star gal-universe-star-c">✦</span>
    </div>
  );
}

function Heart({ discovered }: { discovered: boolean }) {
  return (
    <div className={discovered ? "gal-heart-wrap gal-heart-wrap-open" : "gal-heart-wrap"}>
      <svg viewBox="0 0 350 320" className="gal-heart-svg" role="img" aria-label="Corazón enorme que late">
        <defs>
          <radialGradient id="gal-heart-fill" cx="34%" cy="20%" r="92%">
            <stop offset="0" stopColor="#ffe5db" />
            <stop offset=".42" stopColor="#ff92a8" />
            <stop offset="1" stopColor="#ce477e" />
          </radialGradient>
          <filter id="gal-heart-shadow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
        </defs>
        <path d="M175 299C157 281 20 182 20 105 20 44 61 23 105 23c29 0 55 15 70 41 15-26 41-41 70-41 44 0 85 21 85 82 0 77-137 176-155 194Z" fill="#f75d99" opacity=".32" filter="url(#gal-heart-shadow)" />
        <path d="M175 292C155 272 27 177 27 107 27 54 62 29 107 29c30 0 56 17 68 42 12-25 38-42 68-42 45 0 80 25 80 78 0 70-128 165-148 185Z" fill="url(#gal-heart-fill)" stroke="#ffd6df" strokeWidth="3" />
        <path d="M55 101c4-34 28-51 58-49" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" opacity=".52" />
        <path d="M140 70c11 5 18 12 22 18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".18" />
        {discovered && (
          <g fill="none" stroke="#76294d" strokeWidth="5" strokeLinecap="round">
            <path d="M120 143q17-18 34 0" />
            <path d="M197 143q17-18 34 0" />
            <path d="M159 182q17 26 35 0" />
          </g>
        )}
      </svg>
      <span className="gal-heart-spark gal-heart-spark-a">✦</span>
      <span className="gal-heart-spark gal-heart-spark-b">♡</span>
      <span className="gal-heart-spark gal-heart-spark-c">✧</span>
    </div>
  );
}

export default function InfinitoExperience() {
  const [stage, setStage] = useState(0);
  const [discovered, setDiscovered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const activeStage = STAGES[stage - 1];

  function moveTo(next: number) {
    if (transitioning || next < 0 || next > 5) return;
    setTransitioning(true);
    window.setTimeout(() => {
      setStage(next);
      setDiscovered(false);
      setFinished(false);
      setTransitioning(false);
    }, 250);
  }

  function reveal() {
    if (discovered) return;
    setDiscovered(true);
    if (navigator.vibrate) navigator.vibrate(stage === 5 ? [35, 55, 35] : 24);
    if (stage === 5) {
      window.setTimeout(() => setFinished(true), 850);
    }
  }

  // Re-entering always starts with the same polished introductory scene.
  useEffect(() => {
    document.title = "Hasta el infinito… y un poquito más · Te Hice Esto";
  }, []);

  function onTouchStart(event: React.TouchEvent<HTMLElement>) {
    touch.current = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }

  function onTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (!touch.current) return;
    const dx = event.changedTouches[0].clientX - touch.current.x;
    const dy = event.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 95 || Math.abs(dy) > 65) return;
    if (dx < 0 && stage > 0 && stage < 5 && discovered) moveTo(stage + 1);
    if (dx > 0 && stage > 1) moveTo(stage - 1);
  }

  return (
    <main className="gal-experience" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <NightSky />
      <div className="gal-topbar">
        <Link href="/tehiceesto" className="gal-brand" aria-label="Volver a Te Hice Esto">te hice esto <span>✳</span></Link>
        <span className="gal-progress" aria-live="polite">{stage === 0 ? "UNA HISTORIA PARA VOS" : String(stage).padStart(2, "0") + " / 05"}</span>
      </div>

      {stage > 0 && (
        <div className="gal-step-trail" role="progressbar" aria-label="Progreso del viaje" aria-valuemin={0} aria-valuemax={5} aria-valuenow={stage}>
          {STAGES.map((item, index) => <span key={item.name} className={index + 1 <= stage ? "gal-step-dot gal-step-dot-on" : "gal-step-dot"} />)}
        </div>
      )}

      <div className={transitioning ? "gal-frame gal-frame-exit" : "gal-frame"} key={stage}>
        {stage === 0 ? (
          <section className="gal-intro">
            <p className="gal-eyebrow">UNA HISTORIA POCO CIENTÍFICA</p>
            <div className="gal-intro-orbit" aria-hidden="true"><span className="gal-orbit-a" /><span className="gal-orbit-b" /><span className="gal-intro-heart">♥</span></div>
            <h1>¿Cuánto <em>te quiero?</em></h1>
            <p className="gal-intro-description">Quise averiguarlo usando cosas enormes del espacio. La ciencia no estaba preparada.</p>
            <button className="gal-primary" onClick={() => moveTo(1)}>Empezar a medir <span>↗</span></button>
            <p className="gal-intro-small">5 descubrimientos · 1 final muy nuestro</p>
          </section>
        ) : (
          <section className="gal-chapter" aria-labelledby="gal-title">
            <div className="gal-chapter-copy">
              <p className="gal-eyebrow">{activeStage.eyebrow}</p>
              <h1 id="gal-title">{activeStage.heading}</h1>
              <p className="gal-chapter-intro">{activeStage.intro}</p>
            </div>

            <div className={"gal-object-stage gal-object-stage-" + stage}>
              <div className="gal-orbit-ambient" aria-hidden="true" />
              <button
                className={"gal-discover-object gal-discover-object-" + stage + (discovered ? " gal-object-discovered" : "")}
                onClick={reveal}
                aria-label={activeStage.hint}
                aria-pressed={discovered}
              >
                {stage === 1 && <Earth />}
                {stage === 2 && <Sun />}
                {stage === 3 && <Galaxy />}
                {stage === 4 && <Cosmos />}
                {stage === 5 && <Heart discovered={discovered} />}
              </button>
              {!discovered && <p className="gal-touch-hint"><span aria-hidden="true">✧</span> {activeStage.hint}</p>}
            </div>

            <div className="gal-reveal-area" aria-live="polite">
              {discovered && (
                <div className="gal-reveal">
                  {stage === 4 && <span className="gal-error-label">ALERTA CÓSMICA · SIN ESCALA</span>}
                  {stage === 5 && <span className="gal-error-label">MEDIDOR DE AMOR: ∞</span>}
                  <p>{activeStage.reveal}</p>
                </div>
              )}
              {stage === 5 && finished && (
                <div className="gal-final-note">
                  <p>Para {COPY.recipient}: {COPY.closing}</p>
                  <span>{COPY.signature} · {COPY.giver} ♡</span>
                </div>
              )}
            </div>

            <div className="gal-controls">
              {stage > 1 && <button className="gal-back" onClick={() => moveTo(stage - 1)} aria-label="Volver al descubrimiento anterior">←</button>}
              {discovered && stage < 5 && <button className="gal-primary" onClick={() => moveTo(stage + 1)}>{activeStage.next} <span>↗</span></button>}
              {finished && stage === 5 && <button className="gal-primary" onClick={() => moveTo(0)}>Volver a vivirlo <span>↺</span></button>}
            </div>
          </section>
        )}
      </div>
      <div className="gal-bottom-brand">UN PEQUEÑO UNIVERSO HECHO PARA ALGUIEN <span>✦</span> TE HICE ESTO</div>
    </main>
  );
}
