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

export default function PairCinematicUmbral({ kicker, title, cta, onOpen, onAdvance }: Props) {
  const [entering, setEntering] = useState(false);
  const proceeding = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timeout.current !== null) clearTimeout(timeout.current);
  }, []);

  const enter = () => {
    if (proceeding.current) return;
    proceeding.current = true;
    onOpen();
    setEntering(true);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    timeout.current = setTimeout(onAdvance, reduced ? 100 : 1220);
  };

  return (
    <section className={"thi-scene pair-cinematic-umbral" + (entering ? " is-entering" : "")} data-cinematic-umbral="2026-10-door">
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

        <button type="button" data-action="open-door" className="pcu-door-hit" onClick={enter} disabled={entering} aria-label="Abrir la puerta y seguir entrando">
          <span className="pcu-door-scene" aria-hidden="true">
            <span className="pcu-door-bloom" />
            <span className="pcu-door-picture" />
            <span className="pcu-threshold-glimmer" />
          </span>
        </button>

        <div className="pcu-invitation">
          <p>Del otro lado estamos nosotros.</p>
          <button data-action="advance" type="button" onClick={enter} disabled={entering} aria-label={cta.replace(/\s*→\s*$/,"")}>
            <span>{cta.replace(/\s*→\s*$/,"")}</span><b aria-hidden="true">→</b>
          </button>
        </div>
      </div>
      <div className="pcu-veil" aria-hidden="true"/>
    </section>
  );
}
