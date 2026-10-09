"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Experience } from "./data";
import type { SceneTextOverrides } from "./sceneText";
import type { ThiPhoto as ExperiencePhoto, ThiAudio as ExperienceAudio } from "./ExperienceEngine";
import "./SecretExperience.css";

type SecretProps = {
  experience: Experience;
  letterText?: string;
  photoUrls?: string[];
  photoMedia?: ExperiencePhoto[];
  audioMedia?: ExperienceAudio[];
  soundtrackMedia?: ExperienceAudio;
  storyContext?: { keyDate?: string; anecdote?: string };
  customerGift?: boolean;
  sceneTextOverrides?: SceneTextOverrides;
};

const demoPhotos = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=83",
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=83",
  "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=83",
];

const chapters = [
  "La invitación", "El umbral", "El museo invisible", "El tiempo",
  "Una voz", "Las señales", "La carta", "El último paso",
  "La revelación", "Para siempre",
];
const twinkles = Array.from({ length: 32 }, (_, i) => i);

export default function SecretExperience({
  experience, letterText, photoUrls, photoMedia, audioMedia, soundtrackMedia,
  storyContext, sceneTextOverrides, customerGift=false,
}: SecretProps) {
  const [step, setStep] = useState(0);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [viewed, setViewed] = useState<number[]>([]);
  const [turns, setTurns] = useState(0);
  const [voiceOpened, setVoiceOpened] = useState(false);
  const [clues, setClues] = useState<number[]>([]);
  const [letterOpen, setLetterOpen] = useState(false);
  const [passageOpen, setPassageOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const [ribbons, setRibbons] = useState(0);
  const [boxOpen, setBoxOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundtrackRef = useRef<HTMLAudioElement>(null);

  const scene = experience.recipe[step] || "keepsake";
  const t = (original: string) => sceneTextOverrides?.[scene]?.[original] ?? original;
  const name = experience.demoRecipient;
  const giver = experience.demoGiver;
  const gallery = [0, 1, 2].map((i) => ({
    url: photoMedia?.[i]?.url || photoUrls?.[i] || (customerGift ? "" : (experience.demo?.photos?.[i]?.url || demoPhotos[i])),
    caption: photoMedia?.[i]?.caption,
    fit: photoMedia?.[i]?.fit || "cover",
    position: photoMedia?.[i]?.position || "center",
  }));
  const pulse = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(18);
  };
  const advance = () => {
    pulse();
    setStep((n) => Math.min(9, n + 1));
  };
  const back = () => setStep((n) => Math.max(0, n - 1));
  const mark = (n: number, current: number[], setter: (n: number[]) => void) => {
    pulse();
    if (!current.includes(n)) setter([...current, n]);
  };
  const toggleMusic = async () => {
    const audio = soundtrackRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setMusicOn(true); } catch { setMusicOn(false); }
    } else { audio.pause(); setMusicOn(false); }
  };
  const startHolding = () => {
    if (passageOpen) return;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setPassageOpen(true);
      setHolding(false);
      pulse();
    }, 1750);
  };
  const stopHolding = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  };
  const share = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Te guardé un secreto", url }); return; }
      catch { /* Cancelación o navegador sin permiso */ }
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); }
    catch { window.prompt("Copiá el enlace:", url); }
  };
  useEffect(() => {
    return () => { if (holdTimer.current) clearTimeout(holdTimer.current); };
  }, []);
  useEffect(() => {
    document.title = "Te guardé un secreto · " + name + " | Te Hice Esto";
  }, [name]);
  useEffect(() => {
    const audio = soundtrackRef.current;
    if (step === 4 && audio && !audio.paused) { audio.pause(); }
  }, [step]);

  const canContinue = [
    envelopeOpen, doorOpen, viewed.length >= 3, turns >= 3,
    voiceOpened, clues.length >= 3, letterOpen, passageOpen, boxOpen, true,
  ][step];

  return (
    <main className={"experience-shell secret-experience secret-step-" + step} aria-label="Experiencia Te guardé un secreto">
      <div className="secret-grain" aria-hidden="true" />
      <div className="secret-ambient" aria-hidden="true" />
      {soundtrackMedia && (
        <audio ref={soundtrackRef} src={soundtrackMedia.url} preload="none" loop playsInline />
      )}
      <div className="secret-toolbar" data-copy-ignore="true">
        <button type="button" onClick={back} disabled={step === 0} aria-label="Volver a la escena anterior">←</button>
        <div className="secret-toolbar-center">
          <span>UN SECRETO PARA {name.toLocaleUpperCase("es-AR")}</span>
          <div className="secret-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={10} aria-label="Progreso del recorrido">
            {chapters.map((chapter, i) => <i key={chapter} className={i <= step ? "active" : ""} />)}
          </div>
        </div>
        {soundtrackMedia
          ? <button type="button" className="secret-audio-toggle" onClick={() => void toggleMusic()} aria-label={musicOn ? "Pausar música" : "Activar música"}>{musicOn ? "♫" : "♪"}</button>
          : <span className="secret-toolbar-placeholder" aria-hidden="true">✧</span>}
      </div>

      <div className="secret-content" key={step}>
        {step === 0 && (
          <section className="secret-scene secret-invitation">
            <p className="secret-kicker">CAPÍTULO I · UNA INVITACIÓN</p>
            <h1>{t("Hay algo que todavía no sabés.")}</h1>
            <p className="secret-intro-copy">{t("No quería contártelo con un mensaje. Quería que lo descubrieras.")}</p>
            <button type="button" className={"secret-envelope " + (envelopeOpen ? "is-open" : "")} onClick={() => { setEnvelopeOpen(true); pulse(); }} aria-label={envelopeOpen ? "Sobre abierto" : "Romper el sello y abrir el sobre"}>
              <span className="secret-envelope-shadow" />
              <span className="secret-envelope-body" />
              <span className="secret-envelope-flap" />
              <span className="secret-envelope-front" />
              <span className="secret-envelope-letter">
                <small>ESPECIALMENTE PARA</small>
                <strong>{name}</strong>
                <em>{t("Esto no es una carta. Es el comienzo de algo.")}</em>
              </span>
              <span className="secret-wax">✦</span>
            </button>
            <p className="secret-gesture">{envelopeOpen ? t("La primera pista ya está en tus manos.") : "Tocá el sello para abrir la invitación"}</p>
          </section>
        )}

        {step === 1 && (
          <section className="secret-scene secret-threshold">
            <p className="secret-kicker">CAPÍTULO II · EL UMBRAL</p>
            <h2>{t("Algunas historias tienen una puerta que sólo se abre para una persona.")}</h2>
            <button type="button" className={"secret-doorframe " + (doorOpen ? "is-open" : "")} onClick={() => { setDoorOpen(true); pulse(); }} aria-label="Girar la llave y abrir la puerta">
              <span className="secret-doorlight" />
              <span className="secret-inside"><span>BIENVENIDA, {name.toLocaleUpperCase("es-AR")}</span>✧</span>
              <span className="secret-door"><span className="secret-door-mould" /><span className="secret-doorknob">✧</span></span>
              <span className="secret-key">⚿</span>
            </button>
            <p className="secret-gesture">{doorOpen ? t("Adelante. Todo esto está hecho para vos.") : "Tocá la llave para abrir tu puerta"}</p>
          </section>
        )}

        {step === 2 && (
          <section className="secret-scene secret-gallery">
            <p className="secret-kicker">CAPÍTULO III · EL MUSEO INVISIBLE</p>
            <h2>{t("Todo empezó mucho antes de este secreto.")}</h2>
            <p className="secret-scene-copy">{t("Hay instantes que quedaron guardados, esperando este momento.")}</p>
            <div className="secret-gallery-frames">
              {gallery.map((photo, i) => (
                <button type="button" key={i} className={"secret-gallery-frame " + (viewed.includes(i) ? "is-open" : "")} onClick={() => mark(i, viewed, setViewed)}>
                  <span className="secret-frame-photo">
                    {photo.url ? <img src={photo.url} alt={"Recuerdo " + (i + 1)} style={{ objectFit: photo.fit, objectPosition: photo.position }} /> : <span className="secret-photo-placeholder" aria-label="Espacio reservado para fotografía personalizada">✧</span>}
                  </span>
                  <span className="secret-frame-caption">
                    <small>RECUERDO 0{i + 1}</small>
                    <strong>{viewed.includes(i) ? (photo.caption || t(["El comienzo de algo hermoso.", "Los días que se vuelven hogar.", "Lo mejor todavía estaba por llegar."][i])) : "Tocá para descubrir"}</strong>
                  </span>
                </button>
              ))}
            </div>
            <p className="secret-gesture">{viewed.length}/3 recuerdos descubiertos</p>
          </section>
        )}

        {step === 3 && (
          <section className="secret-scene secret-time">
            <p className="secret-kicker">CAPÍTULO IV · LA MÁQUINA DEL TIEMPO</p>
            <h2>{t("Si pudiéramos detener el tiempo…")}</h2>
            <p className="secret-scene-copy">{t("Guardaríamos algunos segundos para volver a sentirlos.")}</p>
            <div className="secret-clock" aria-label="Reloj mecánico interactivo">
              <div className="secret-clock-face">
                <span className="secret-clock-mark mark-top">XII</span><span className="secret-clock-mark mark-right">III</span>
                <span className="secret-clock-mark mark-bottom">VI</span><span className="secret-clock-mark mark-left">IX</span>
                <span className="secret-clock-hand hour" style={{ transform: "rotate(" + (turns * 84 + 38) + "deg)" }} />
                <span className="secret-clock-hand minute" style={{ transform: "rotate(" + (turns * 180 + 120) + "deg)" }} />
                <i className="secret-clock-pivot" />
                <small>LOS INSTANTES QUE IMPORTAN</small>
              </div>
            </div>
            <div className="secret-time-note" aria-live="polite">
              <span>INSTANTE 0{Math.min(3, turns || 1)}</span>
              <p>{turns === 0 ? t("Hay fechas que marcan un antes y un después.") : turns === 1 ? (storyContext?.keyDate ? "Todo cambió alrededor del " + storyContext.keyDate + "." : t("Ese día algo empezó a cambiar.")) : turns === 2 ? (storyContext?.anecdote || t("Hay detalles que sólo nosotros conocemos.")) : t("Y sin saberlo, estábamos llegando hasta acá.")}</p>
            </div>
            <button type="button" className="secret-mechanical-btn" disabled={turns >= 3} onClick={() => { setTurns((n) => Math.min(3, n + 1)); pulse(); }}>
              {turns >= 3 ? "El tiempo nos trajo hasta acá ✓" : "Girar la corona ↻"}
            </button>
          </section>
        )}

        {step === 4 && (
          <section className="secret-scene secret-recording">
            <p className="secret-kicker">CAPÍTULO V · UNA VOZ</p>
            <h2>{t("Hay cosas que merecen escucharse.")}</h2>
            <p className="secret-scene-copy">{t("Antes de continuar, reservé unas palabras para vos.")}</p>
            <div className="secret-tape">
              <div className={"secret-reels " + (voiceOpened ? "is-playing" : "")}>
                <div className="secret-reel"><i/><i/><i/></div>
                <div className="secret-reel"><i/><i/><i/></div>
              </div>
              <div className="secret-tape-label">GRABACIÓN PERSONAL · {giver.toLocaleUpperCase("es-AR")}</div>
              <div className="secret-tape-window">{Array.from({length:25},(_,i)=><i key={i} style={{height: (8+((i*17)%25))+"px",animationDelay:((i%7)*.11)+"s"}} />)}</div>
              {audioMedia?.[0]?.url ? (
                <audio className="secret-voice-player" src={audioMedia[0].url} controls preload="none" onPlay={() => setVoiceOpened(true)} onEnded={() => setVoiceOpened(true)} />
              ) : (
                <button className="secret-play" type="button" onClick={() => { setVoiceOpened(true); pulse(); }}>
                  {voiceOpened ? "✓ MENSAJE ABIERTO" : "▷ DESCUBRIR EL MENSAJE"}
                </button>
              )}
            </div>
            {voiceOpened && (
              <blockquote className="secret-voice-transcript">
                <small>{audioMedia?.[0] ? "UN MENSAJE PARA VOS" : "DEMO · MENSAJE ESCRITO DE EJEMPLO"}</small>
                <p>{t("Si estás escuchando esto, significa que ya estás muy cerca. Quería que este momento fuera tan especial como vos.")}</p>
              </blockquote>
            )}
          </section>
        )}

        {step === 5 && (
          <section className="secret-scene secret-clues">
            <p className="secret-kicker">CAPÍTULO VI · LAS SEÑALES</p>
            <h2>{t("Las pistas siempre estuvieron ahí.")}</h2>
            <p className="secret-scene-copy">{t("Tres señales. Una sola historia. ¿Podés descubrirlas?")}</p>
            <div className="secret-orbs">
              {["✧", "∞", "♡"].map((symbol, i) => (
                <button type="button" key={i} className={"secret-glass-orb orb-" + i + (clues.includes(i) ? " is-open" : "")} onClick={() => mark(i, clues, setClues)} aria-label={"Descubrir señal " + (i + 1)}>
                  <span className="secret-orb-inner">{clues.includes(i) ? "✦" : symbol}</span>
                  <span className="secret-orb-caption">{clues.includes(i) ? t(["Un comienzo inesperado.", "Una conexión que creció.", "Algo maravilloso se acerca."][i]) : "SEÑAL 0" + (i + 1)}</span>
                </button>
              ))}
            </div>
            <p className="secret-gesture">{clues.length === 3 ? t("Ya tenés todas las piezas.") : "Descubrí las tres señales"}</p>
          </section>
        )}

        {step === 6 && (
          <section className="secret-scene secret-confession">
            <p className="secret-kicker">CAPÍTULO VII · LO QUE NO TE DIJE</p>
            <h2>{t("Hay palabras que se guardan para el momento correcto.")}</h2>
            <button type="button" className={"secret-folded-letter " + (letterOpen ? "is-open" : "")} onClick={() => { setLetterOpen(true); pulse(); }} aria-label="Desplegar la carta personal">
              <span className="secret-paper-fold" />
              <span className="secret-paper-content">
                <small>UNA CARTA PARA {name.toLocaleUpperCase("es-AR")}</small>
                <strong>{letterOpen ? t("Quería que supieras esto…") : "Desplegá esta carta"}</strong>
                {letterOpen && <p>{letterText || t("No todos los días tenemos la oportunidad de preparar algo así. Quiero que sepas que cada parte de este recorrido tiene un pedacito de lo que significás para mí. Y todavía falta lo más importante.")}</p>}
                <em>Con cariño, {giver}</em>
              </span>
              <span className="secret-letter-seal">✦</span>
            </button>
            <p className="secret-gesture">{letterOpen ? t("Guardá estas palabras. Lo siguiente es lo más importante.") : "Tocá el papel para desplegarlo"}</p>
          </section>
        )}

        {step === 7 && (
          <section className="secret-scene secret-passage">
            <div className={"secret-passage-tunnel " + (passageOpen ? "is-open" : "")} aria-hidden="true">
              {Array.from({length:8},(_,i)=><i key={i}/>)}
              <span className="secret-endlight" />
            </div>
            <div className="secret-passage-foreground">
              <p className="secret-kicker">CAPÍTULO VIII · EL ÚLTIMO PASO</p>
              <h2>{t("Todo te trajo hasta este momento.")}</h2>
              <p className="secret-scene-copy">{t("Del otro lado hay una noticia que tenía que llegar de una manera diferente.")}</p>
              <button type="button" className={"secret-hold " + (holding ? "is-holding" : "") + (passageOpen ? " is-complete" : "")}
                onPointerDown={startHolding} onPointerUp={stopHolding} onPointerCancel={stopHolding} onPointerLeave={stopHolding}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPassageOpen(true); pulse(); } }}
                aria-label="Mantener pulsado para iluminar el camino">
                <i/><span>{passageOpen ? "EL CAMINO ESTÁ ABIERTO ✓" : "MANTENÉ PRESIONADO"}</span>
              </button>
              <small>En teclado, presioná Enter para continuar</small>
            </div>
          </section>
        )}

        {step === 8 && (
          <section className="secret-scene secret-revelation">
            <p className="secret-kicker">CAPÍTULO IX · LA REVELACIÓN</p>
            <h2>{boxOpen ? t("Y ahora, ya lo sabés.") : t("Todo este camino era para llegar hasta acá.")}</h2>
            <div className={"secret-gift-stage " + (ribbons >= 3 ? "unwrapped" : "") + (boxOpen ? " is-open" : "")}>
              <div className="secret-gift-halo" />
              <div className="secret-gift-lid" />
              <div className="secret-gift-box">
                <span className="secret-gift-silhouette">✦</span>
              </div>
              <span className="secret-ribbon vertical" />
              <span className="secret-ribbon horizontal" />
              <span className="secret-bow">✧</span>
              {boxOpen && (
                <div className="secret-big-reveal" role="status" aria-live="polite">
                  <small>EL SECRETO ERA ESTE</small>
                  <strong>{experience.closing}</strong>
                  <span>✦ ✧ ✦</span>
                </div>
              )}
              {boxOpen && <div className="secret-celebration" aria-hidden="true">{twinkles.map((i)=><i key={i} style={{left:((i*37)%98)+"%",top:((i*23)%85)+"%",animationDelay:((i%9)*.13)+"s"}} />)}</div>}
            </div>
            {!boxOpen && (
              <button type="button" className="secret-mechanical-btn" onClick={() => {
                pulse(); if (ribbons < 3) setRibbons((n) => n + 1); else setBoxOpen(true);
              }}>
                {ribbons < 3 ? "Desatar la cinta · " + (ribbons + 1) + "/3" : "Abrir mi sorpresa ✦"}
              </button>
            )}
            {boxOpen && <p className="secret-reveal-signature">Con todo mi cariño, {giver}</p>}
          </section>
        )}

        {step === 9 && (
          <section className="secret-scene secret-keepsake">
            <p className="secret-kicker">EPÍLOGO · PARA SIEMPRE</p>
            <h2>{t("Hay noticias que merecen quedarse para siempre.")}</h2>
            <div className="secret-keepsake-card">
              <div className="secret-keepsake-ornament">✦</div>
              <span>UN RECUERDO ÚNICO</span>
              <p>Para {name}</p>
              <strong>{experience.closing}</strong>
              <small>CON AMOR, {giver}</small>
              <em>TE HICE ESTO · 2026</em>
            </div>
            <div className="secret-keepsake-actions">
              <button type="button" onClick={() => void share()}>{copied ? "Enlace copiado ✓" : "Compartir este recuerdo ↗"}</button>
              <button type="button" onClick={() => { setStep(0); setCopied(false); }}>Volver a vivirlo ↺</button>
            </div>
            <p className="secret-gesture">{t("Hay regalos que se abren. Este se queda con vos.")}</p>
            {!customerGift && <Link href="/crear?experiencia=secreto" className="secret-demo-cta">Quiero crear una sorpresa así →</Link>}
          </section>
        )}
      </div>

      {step < 9 && (
        <div className="secret-bottom-nav">
          <span>{String(step + 1).padStart(2, "0")} / 10 <i/> {chapters[step]}</span>
          <button type="button" disabled={!canContinue} onClick={advance}>{step === 8 ? "Guardar este momento" : "Continuar"} <b>↗</b></button>
        </div>
      )}
    </main>
  );
}
