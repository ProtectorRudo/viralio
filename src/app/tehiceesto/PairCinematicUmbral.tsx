"use client";

import { useEffect, useRef, useState } from "react";
import "./PairCinematicUmbral.css";

type Props = {
  kicker: string;
  title: string[];
  cta: string;
  onOpen: () => void;
  onAdvance: () => void;
};

type DoorPhase = "closed" | "opening" | "open" | "entering";

export default function PairCinematicUmbral({ kicker, title, cta, onOpen, onAdvance }: Props) {
  const [phase, setPhase] = useState<DoorPhase>("closed");
  const phaseRef = useRef<DoorPhase>("closed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);

  const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const setDoorPhase = (next: DoorPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const openDoor = () => {
    if (phaseRef.current !== "closed") return;
    setDoorPhase("opening");
    if ("vibrate" in navigator) navigator.vibrate?.(12);
    timers.current.push(setTimeout(() => {
      setDoorPhase("open");
      onOpen();
    }, reducedMotion() ? 30 : 1190));
  };

  const proceed = () => {
    if (phaseRef.current !== "open") return;
    setDoorPhase("entering");
    timers.current.push(setTimeout(onAdvance, reducedMotion() ? 30 : 1080));
  };

  const opened = phase === "open" || phase === "entering";
  return (
    <section className={"thi-scene pair-cinematic-umbral is-" + phase} data-cinematic-umbral="closed-then-open-v2">
      <div className="pcu-atmosphere" aria-hidden="true">
        <div className="pcu-orbit pcu-orbit-one" />
        <div className="pcu-orbit pcu-orbit-two" />
        <div className="pcu-airlight" />
      </div>

      <div className="pcu-content">
        <div className="pcu-heading">
          <p className="pcu-eyebrow">{kicker}</p>
          <h2>{title.map((line, index) => <span key={index}>{line}</span>)}</h2>
        </div>

        <button
          type="button"
          data-action="open-door"
          className="pcu-door-hit"
          onClick={openDoor}
          disabled={phase !== "closed"}
          aria-label={phase === "closed" ? "Tocá la puerta para abrirla" : opened ? "La puerta está abierta" : "La puerta se está abriendo"}
        >
          <span className="pcu-door-scene" aria-hidden="true">
            <span className="pcu-door-bloom" />
            <span className="pcu-door-picture" />
            <span className="pcu-door-closed-leaf">
              <i className="pcu-door-panel-upper" />
              <i className="pcu-door-panel-lower" />
              <i className="pcu-door-knob" />
            </span>
            <span className="pcu-threshold-glimmer" />
          </span>
        </button>

        <div className="pcu-invitation">
          <p>Del otro lado estamos nosotros.</p>
          {!opened ? (
            <span className="pcu-open-instruction" role="status">
              {phase === "opening" ? "Abriendo para vos…" : "Tocá la puerta para abrir"}
            </span>
          ) : (
            <button data-action="advance" type="button" onClick={proceed} disabled={phase === "entering"} aria-label={cta.replace(/\s*→\s*$/, "")}>
              <span>{cta.replace(/\s*→\s*$/, "")}</span><b aria-hidden="true">→</b>
            </button>
          )}
        </div>
      </div>
      <div className="pcu-veil" aria-hidden="true"/>
    </section>
  );
}
