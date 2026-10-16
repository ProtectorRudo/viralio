"use client";

import { useEffect, useRef, useState } from "react";
import "./CoupleGiftIntro.css";

type Phase = "closed" | "untying" | "opening" | "revealed";

type Props = {
  kicker: string;
  recipient: string;
  footnote: string;
  opening: string;
  cta: string;
  initiallyOpened?: boolean;
  onOpened?: () => void;
  onContinue: () => void;
};

function makeUnwrapSound() {
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    const tone = (frequency: number, start: number, duration: number, volume: number) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.32, now + start + duration);
      envelope.gain.setValueAtTime(.0001, now + start);
      envelope.gain.exponentialRampToValueAtTime(volume, now + start + .025);
      envelope.gain.exponentialRampToValueAtTime(.0001, now + start + duration);
      oscillator.connect(envelope).connect(context.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + duration + .02);
    };
    tone(333, 0, .24, .019);
    tone(497, .08, .35, .014);
    tone(659, .18, .52, .012);
    window.setTimeout(() => void context.close(), 1600);
  } catch {
    // Sound is atmospheric and optional: visual opening always works.
  }
}

export default function CoupleGiftIntro({ kicker, recipient, footnote, opening, cta, initiallyOpened = false, onOpened, onContinue }: Props) {
  const [phase, setPhase] = useState<Phase>(initiallyOpened ? "revealed" : "closed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const started = useRef(initiallyOpened);
  const pointerStart = useRef<{x: number; y: number} | null>(null);

  useEffect(() => () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);

  const openGift = () => {
    if (started.current) return;
    started.current = true;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) makeUnwrapSound();
    if ("vibrate" in navigator) navigator.vibrate?.([14, 45, 12]);
    if (reduced) {
      setPhase("revealed");
      onOpened?.();
      return;
    }
    setPhase("untying");
    timers.current.push(setTimeout(() => setPhase("opening"), 760));
    timers.current.push(setTimeout(() => { setPhase("revealed"); onOpened?.(); }, 1860));
  };

  const revealed = phase === "revealed";
  const activated = phase !== "closed";
  return (
    <section className={"thi-scene couple-gift-intro gift-phase-" + phase} aria-label="Un regalo pensado para vos">
      <div className="couple-gift-backdrop" aria-hidden="true">
        <span className="couple-gift-halo" />
        <span className="couple-gift-ambient ambient-one" />
        <span className="couple-gift-ambient ambient-two" />
        <span className="couple-gift-ambient ambient-three" />
        <span className="couple-gift-grain" />
      </div>

      <div className="couple-gift-content">
        <p className={"couple-gift-prelude" + (activated ? " folded-away" : "")}>ALGUIEN PREPARÓ ALGO QUE ES SÓLO PARA VOS</p>
        <div className="couple-gift-theatre">
          <div className="couple-gift-reveal" aria-hidden={!revealed}>
            <p className="couple-gift-dedication">{kicker}</p>
            <h1>{recipient}</h1>
            <div className="couple-gift-subtitle">
              <i aria-hidden="true" />
              <p>{footnote}</p>
              <i aria-hidden="true" />
            </div>
            <p className="couple-gift-opening">{opening}</p>
          </div>

          <div className="couple-gift-bloom" aria-hidden="true" />
          <div className="couple-gift-dust" aria-hidden="true">
            {Array.from({ length: 19 }, (_, index) => <span key={index} />)}
          </div>
          <div className="couple-gift-object" aria-hidden="true">
            <span className="couple-gift-floor-shadow" />
            <span className="couple-gift-box-interior" />
            <span className="couple-gift-paper tissue-left" />
            <span className="couple-gift-paper tissue-right" />
            <span className="couple-gift-box-base">
              <i className="couple-gift-face-edge edge-left" />
              <i className="couple-gift-face-edge edge-right" />
              <i className="couple-gift-base-ribbon" />
              <i className="couple-gift-base-metallic" />
            </span>
            <span className="couple-gift-lid">
              <i className="couple-gift-lid-top" />
              <i className="couple-gift-lid-front" />
              <i className="couple-gift-lid-ribbon" />
              <i className="couple-gift-bow bow-left" />
              <i className="couple-gift-bow bow-right" />
              <i className="couple-gift-knot" />
              <i className="couple-gift-tail tail-left" />
              <i className="couple-gift-tail tail-right" />
            </span>
          </div>
          <button
            className="couple-gift-unseal"
            onClick={openGift}
            onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; }}
            onPointerUp={(event) => {
              if (!pointerStart.current) return;
              const distance = Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y);
              pointerStart.current = null;
              if (distance >= 35) openGift();
            }}
            onPointerCancel={() => { pointerStart.current = null; }}
            disabled={activated}
            aria-label="Abrí el regalo: deslizá el lazo o tocá la caja"
          >
            <span className="couple-gift-tag">
              <i aria-hidden="true" />
              <span>Abrí<br />el regalo</span>
              <b aria-hidden="true">♡</b>
            </span>
            <span className="couple-gift-tap-hint">Tocá el lazo para abrir</span>
          </button>
        </div>
        <div className={"couple-gift-footer" + (revealed ? " is-visible" : "")}>
          <button data-action="advance" className="couple-gift-continue" onClick={onContinue} disabled={!revealed}>
            {cta} <span aria-hidden="true">→</span>
          </button>
          <small>Un recorrido hecho para una sola persona.</small>
        </div>
      </div>
    </section>
  );
}
