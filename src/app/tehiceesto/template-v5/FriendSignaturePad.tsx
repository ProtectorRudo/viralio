"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

type Props = {
  signer: string;
  onDismiss: () => void;
  onConfirm: (image: string, signedAt: string) => void;
};

/** Signature captured only on the recipient's device; never sent to third parties. */
export default function FriendSignaturePad({signer,onDismiss,onConfirm}:Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const last = useRef<{x:number;y:number}|null>(null);
  const drawing = useRef(false);
  const previousFocus = useRef<HTMLElement|null>(null);
  const dismissRef=useRef(onDismiss);
  const [hasInk,setHasInk]=useState(false);
  const [hasStroke,setHasStroke]=useState(false);

  useEffect(()=>{dismissRef.current=onDismiss},[onDismiss]);
  useEffect(()=>{
    previousFocus.current=document.activeElement as HTMLElement|null;
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const handler=(event:KeyboardEvent)=>{if(event.key==="Escape")dismissRef.current()};
    window.addEventListener("keydown",handler);
    const close=document.querySelector<HTMLButtonElement>(".friend-signature-close");
    close?.focus();
    return ()=>{
      document.body.style.overflow=oldOverflow;
      window.removeEventListener("keydown",handler);
      previousFocus.current?.focus?.();
    };
  },[]);

  const point=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    const element=canvasRef.current!;
    const rect=element.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*element.width/rect.width,y:(event.clientY-rect.top)*element.height/rect.height};
  };
  const ink=(canvas:HTMLCanvasElement)=>{
    const ctx=canvas.getContext("2d")!;
    ctx.strokeStyle="#583825";
    ctx.fillStyle="#583825";
    ctx.lineWidth=4.5;
    ctx.lineCap="round";
    ctx.lineJoin="round";
    return ctx;
  };
  const start=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(!event.isPrimary||(event.pointerType==="mouse"&&event.button!==0))return;
    const canvas=event.currentTarget;
    const p=point(event);
    drawing.current=true;last.current=p;
    canvas.setPointerCapture(event.pointerId);
    const ctx=ink(canvas);
    ctx.beginPath();ctx.arc(p.x,p.y,2.25,0,Math.PI*2);ctx.fill();
    setHasInk(true);
  };
  const move=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(!drawing.current||!event.isPrimary||!last.current)return;
    const canvas=event.currentTarget;
    const ctx=ink(canvas);
    const points=event.nativeEvent.getCoalescedEvents?.()||[event.nativeEvent];
    for(const e of points){
      const rect=canvas.getBoundingClientRect();
      const p={x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height};
      const prev=last.current!;
      const dx=p.x-prev.x,dy=p.y-prev.y;
      if(Math.abs(dx)+Math.abs(dy)<.5)continue;
      ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();
      last.current=p;
      setHasStroke(true);
    }
  };
  const stop=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    drawing.current=false;last.current=null;
    try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };
  const clear=()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    canvas.getContext("2d")?.clearRect(0,0,canvas.width,canvas.height);
    setHasInk(false);setHasStroke(false);
  };
  const confirm=()=>{
    if(!hasInk||!hasStroke||!canvasRef.current)return;
    onConfirm(canvasRef.current.toDataURL("image/png"),new Date().toISOString());
  };
  return createPortal(
    <div className="friend-signature-overlay" role="presentation" onPointerDown={e=>{if(e.target===e.currentTarget)onDismiss()}}>
      <section role="dialog" aria-modal="true" aria-labelledby="friend-signature-title" aria-describedby="friend-signature-description" className="friend-signature-dialog">
        <button type="button" className="friend-signature-close" onClick={onDismiss} aria-label="Cerrar firma">×</button>
        <p className="friend-signature-overline">EXPEDIENTE 021 · ÚLTIMO ACUERDO</p>
        <h3 id="friend-signature-title">Ahora sí, dejá tu huella.</h3>
        <p id="friend-signature-description">Este pacto no se firma con un clic. Dibujá tu firma con el dedo para hacerlo tuyo.</p>
        <div className="friend-signature-paper">
          <span>FIRMA DE {signer}</span>
          <canvas ref={canvasRef} width={900} height={270} aria-label={"Área para dibujar la firma de "+signer}
            onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}
            className="friend-signature-canvas" style={{touchAction:"none"}} />
          <div className="friend-signature-rule" aria-hidden="true"/>
          <small>Tu firma quedará en este pacto y se conservará en este dispositivo.</small>
        </div>
        <div className="friend-signature-actions">
          <button type="button" className="friend-signature-clear" onClick={clear} disabled={!hasInk}>↺ Borrar y repetir</button>
          <button type="button" data-action="signature-confirm" className="friend-signature-confirm" disabled={!hasStroke} onClick={confirm}>Sellar nuestro pacto <span aria-hidden="true">✦</span></button>
        </div>
      </section>
    </div>,document.body
  );
}
