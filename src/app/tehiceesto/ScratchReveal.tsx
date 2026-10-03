"use client";

import { useEffect, useRef, useState } from "react";

export default function ScratchReveal({
  accent,
  eyebrow,
  reward,
  note,
  revealed,
  onReveal,
}: {
  accent: string;
  eyebrow: string;
  reward: string;
  note: string;
  revealed: boolean;
  onReveal: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const draw = () => {
      const rect = parent.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#a8a1aa");
      gradient.addColorStop(.28, "#5d5760");
      gradient.addColorStop(.52, "#918a94");
      gradient.addColorStop(.76, "#49444c");
      gradient.addColorStop(1, "#7d7680");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.globalAlpha = .22;
      for (let x = -rect.height; x < rect.width + rect.height; x += 20) {
        ctx.strokeStyle = x % 40 === 0 ? "#fff" : "#111";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + rect.height, rect.height);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.textAlign = "center";
      ctx.font = "700 11px Inter, Arial, sans-serif";
      ctx.fillText("RASPÁ PARA DESCUBRIR", rect.width / 2, rect.height / 2 - 3);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.font = "500 9px Inter, Arial, sans-serif";
      ctx.fillText("con el dedo o el mouse", rect.width / 2, rect.height / 2 + 18);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [revealed]);

  const erase = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = canvas.width / Math.max(rect.width, 1);
    const x = (clientX - rect.left) * ratio;
    const y = (clientY - rect.top) * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    const radius = 28 * ratio;
    const gradient = ctx.createRadialGradient(x, y, radius * .25, x, y, radius);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(.72, "rgba(0,0,0,.9)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const measure = () => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const { width, height } = canvas;
    if (!width || !height) return;

    const data = ctx.getImageData(0, 0, width, height).data;
    let transparent = 0;
    let sampled = 0;
    const stride = 28 * 4;
    for (let index = 3; index < data.length; index += stride) {
      sampled += 1;
      if (data[index] < 70) transparent += 1;
    }
    if (sampled > 0 && transparent / sampled > .3) onReveal();
  };

  return (
    <div
      className={`thi-scratch thi-scratch-real ${revealed ? "done" : ""}`}
      style={{ "--scratch-accent": accent } as React.CSSProperties}
    >
      <div className="thi-scratch-prize">
        <span>{eyebrow}</span>
        <strong>{reward}</strong>
        <small>{note}</small>
        <i>✦</i>
      </div>

      {!revealed && (
        <canvas
          ref={canvasRef}
          className="thi-scratch-canvas"
          onPointerDown={(event) => {
            draggingRef.current = true;
            setStarted(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            erase(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (!draggingRef.current) return;
            erase(event.clientX, event.clientY);
          }}
          onPointerUp={() => {
            draggingRef.current = false;
            measure();
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
            measure();
          }}
        />
      )}

      {!revealed && (
        <button
          className={`thi-scratch-fallback ${started ? "visible" : ""}`}
          type="button"
          onClick={onReveal}
        >
          revelar sin raspar
        </button>
      )}
    </div>
  );
}
