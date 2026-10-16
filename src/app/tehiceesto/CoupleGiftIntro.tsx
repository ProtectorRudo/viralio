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
    <section className={"thi-scene couple-gift-intro gift-phase-" + phase} data-gift-design="satin-bow-v3" aria-label="Un regalo pensado para vos">
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
              <i className="couple-gift-emboss">HECHO PARA VOS</i>
            </span>
            <span className="couple-gift-lid">
              <i className="couple-gift-lid-top" />
              <i className="couple-gift-lid-front" />
              <i className="couple-gift-lid-ribbon" />
              <svg className="couple-gift-satin-bow" viewBox="0 0 320 174" role="presentation" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="coupleSilkGold" x1="0" x2="1" y1=".12" y2=".86">
                    <stop offset="0" stopColor="#7b6243" />
                    <stop offset=".12" stopColor="#ddc59a" />
                    <stop offset=".28" stopColor="#fff3d7" />
                    <stop offset=".49" stopColor="#c2a277" />
                    <stop offset=".7" stopColor="#ecd7ad" />
                    <stop offset=".88" stopColor="#94734b" />
                    <stop offset="1" stopColor="#645038" />
                  </linearGradient>
                  <linearGradient id="coupleSilkEdge" x1="0" x2=".9" y1="0" y2="1">
                    <stop offset="0" stopColor="#e2c99b"/>
                    <stop offset=".43" stopColor="#866943"/>
                    <stop offset="1" stopColor="#f5deb4"/>
                  </linearGradient>
                  <radialGradient id="coupleSilkInner" cx=".55" cy=".46" r=".7">
                    <stop offset="0" stopColor="#443929"/>
                    <stop offset=".6" stopColor="#7f694a"/>
                    <stop offset="1" stopColor="#cfb68c"/>
                  </radialGradient>
                </defs>
                <g className="couple-silk-tail couple-silk-tail-left">
                  <path d="M154 91 C139 101 107 109 80 139 C72 149 59 150 48 163 L65 116 C80 95 118 83 146 75 Z" fill="url(#coupleSilkGold)" stroke="#977a55" strokeWidth="1.4"/>
                  <path d="M145 85 Q99 102 72 136" fill="none" stroke="#fff5d7" strokeWidth="2.6" opacity=".59"/>
                  <path d="M137 91 Q108 108 60 148" fill="none" stroke="#634d37" strokeWidth="5" opacity=".2"/>
                </g>
                <g className="couple-silk-tail couple-silk-tail-right">
                  <path d="M167 89 C185 100 219 108 246 139 L264 160 C250 154 238 155 229 163 C218 133 193 102 174 76 Z" fill="url(#coupleSilkEdge)" stroke="#977a55" strokeWidth="1.4"/>
                  <path d="M176 88 Q214 101 246 142" fill="none" stroke="#fff2d3" strokeWidth="2.6" opacity=".58"/>
                  <path d="M182 89 Q217 117 255 148" fill="none" stroke="#514331" strokeWidth="5" opacity=".18"/>
                </g>
                <g className="couple-silk-loop couple-silk-loop-left">
                  <path d="M153 79 C119 57 95 30 61 30 C25 27 15 58 28 79 C47 106 95 98 153 85 Z" fill="url(#coupleSilkGold)" stroke="#dfc59a" strokeWidth="2"/>
                  <path d="M147 78 C109 66 88 45 63 47 C42 48 36 65 47 76 C62 91 105 83 147 82 Z" fill="url(#coupleSilkInner)" opacity=".92"/>
                  <path d="M34 66 C46 34 85 41 111 61" fill="none" stroke="#fff6d9" strokeWidth="5" opacity=".34" strokeLinecap="round"/>
                  <path d="M116 75 Q92 92 47 81" fill="none" stroke="#705539" strokeWidth="5" opacity=".24"/>
                </g>
                <g className="couple-silk-loop couple-silk-loop-right">
                  <path d="M166 77 C204 50 231 29 260 33 C295 38 300 67 285 86 C264 108 215 92 165 85 Z" fill="url(#coupleSilkEdge)" stroke="#dfc59a" strokeWidth="2"/>
                  <path d="M175 78 C211 61 238 48 259 50 C279 53 277 72 264 81 C246 92 214 82 175 82 Z" fill="url(#coupleSilkInner)" opacity=".92"/>
                  <path d="M203 57 Q241 37 273 54" fill="none" stroke="#fff6d9" strokeWidth="5" opacity=".4" strokeLinecap="round"/>
                  <path d="M195 79 Q233 94 272 82" fill="none" stroke="#675137" strokeWidth="5" opacity=".22"/>
                </g>
                <g className="couple-silk-knot">
                  <path d="M146 63 Q158 56 173 62 Q184 75 177 89 Q161 101 144 89 Q137 78 146 63 Z" fill="url(#coupleSilkGold)" stroke="#e2c99b" strokeWidth="1.4"/>
                  <path d="M150 66 Q158 60 162 70 Q164 78 155 91" fill="none" stroke="#fff8df" strokeWidth="4" strokeLinecap="round" opacity=".48"/>
                  <path d="M173 67 Q169 80 175 86" fill="none" stroke="#675034" strokeWidth="5" opacity=".34"/>
                </g>
              </svg>
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
          </button>
          <span className="couple-gift-tap-hint" aria-hidden="true">Tocá el lazo para abrir <i>↗</i></span>
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
