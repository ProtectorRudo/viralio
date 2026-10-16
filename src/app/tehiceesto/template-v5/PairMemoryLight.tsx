"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import "./PairMemoryLight.css";

type Props = {
  kicker: string; title: string; hint: string; secret: string;
  revealedLabel: string; cta: string; ariaLabel: string;
  photoUrl?: string; photoPosition?: string;
  revealed: boolean; onReveal: () => void; onContinue: () => void;
};

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

export default function PairMemoryLight({
  kicker, title, hint, secret, revealedLabel, cta, ariaLabel,
  photoUrl, photoPosition = "center", revealed, onReveal, onContinue
}: Props) {
  const stageRef = useRef<HTMLButtonElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const gestureRef = useRef<{ id: number | null; last: { x: number; y: number } | null; distance: number; cells: Set<string> }>({
    id: null, last: null, distance: 0, cells: new Set()
  });
  const completedRef = useRef(revealed);
  useEffect(()=>{completedRef.current=revealed},[revealed]);
  const style = { objectPosition: photoPosition } as CSSProperties;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--pml-x", "50%");
    stage.style.setProperty("--pml-y", "49%");
  }, []);

  const updateLight = (clientX: number, clientY: number, counting: boolean) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = clamp(clientX - rect.left, rect.width);
    const y = clamp(clientY - rect.top, rect.height);
    stage.style.setProperty("--pml-x", x + "px");
    stage.style.setProperty("--pml-y", y + "px");
    if (!counting || completedRef.current) return;
    const g = gestureRef.current;
    if (g.last) g.distance += Math.min(80, Math.hypot(x - g.last.x, y - g.last.y));
    g.last = { x, y };
    const cell = Math.floor(x / Math.max(1, rect.width / 7)) + "-" + Math.floor(y / Math.max(1, rect.height / 6));
    g.cells.add(cell);
    const fraction = Math.min(1, (g.distance / 470) * .72 + (g.cells.size / 9) * .28);
    stage.style.setProperty("--pml-explored", String(fraction));
    if (fraction >= 1 && g.cells.size >= 4) {
      completedRef.current = true;
      onReveal();
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (completedRef.current) return;
    setHasInteracted(true);
    const g = gestureRef.current;
    g.id = event.pointerId;
    g.last = null;
    updateLight(event.clientX, event.clientY, true);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* not supported */ }
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (completedRef.current) return;
    updateLight(event.clientX, event.clientY, gestureRef.current.id === event.pointerId);
  };
  const onPointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const g = gestureRef.current;
    if (g.id === event.pointerId) {
      g.id = null; g.last = null;
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* no capture */ }
    }
  };

  return (
    <section className={"thi-scene thi-scene-light pair-memory-light" + (revealed ? " is-revealed" : "")}
      data-pair-light="cinematic-v2">
      <div className="pml-atmosphere" aria-hidden="true" />
      <div className="pml-layout">
        <header className="pml-heading">
          <p className="pml-kicker">{kicker}</p>
          <h2>{title}</h2>
        </header>
        <button
          ref={stageRef} type="button" className={"pml-stage" + (hasInteracted ? " has-interacted" : "")}
          data-action="light-reveal" aria-label={ariaLabel || hint} aria-pressed={revealed}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
          onKeyDown={event => {
            if (!revealed && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault(); completedRef.current = true; onReveal();
            }
          }}>
          <span className="pml-photo pml-photo-shadow" aria-hidden="true">
            {photoUrl && <img src={photoUrl} alt="" draggable={false} style={style} />}
          </span>
          <span className="pml-photo pml-photo-spot" aria-hidden="true">
            {photoUrl && <img src={photoUrl} alt="" draggable={false} style={style} />}
          </span>
          <span className="pml-photo pml-photo-finale" aria-hidden="true">
            {photoUrl && <img src={photoUrl} alt="" draggable={false} style={style} />}
          </span>
          <span className="pml-photo-color" aria-hidden="true" />
          <span className="pml-beam" aria-hidden="true" />
          <span className="pml-dust" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => <i key={i} style={{ "--pml-i": i } as CSSProperties} />)}
          </span>
          <span className="pml-reveal-message">{secret}</span>
          <span className="pml-instruction">
            <span>{revealed ? revealedLabel : hint}</span><i aria-hidden="true" />
          </span>
        </button>
        {revealed && <button type="button" data-action="advance" className="pml-continue" onClick={onContinue}>
          <span>{cta.replace(/\s*→\s*$/, "")}</span><b aria-hidden="true">→</b>
        </button>}
      </div>
    </section>
  );
}
