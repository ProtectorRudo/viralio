"use client";

import { useEffect, useRef, useState } from "react";

const TRUST_ITEMS=[
  {eyebrow:"PAGO SEGURO",title:"Mercado Pago",copy:"Tu pago se procesa a través de Mercado Pago.",mark:"⌁"},
  {eyebrow:"UNA SOLA VEZ",title:"Sin suscripciones",copy:"Un único pago. Sin abonos mensuales.",mark:"01"},
  {eyebrow:"HECHO PARA ESA PERSONA",title:"Historia personalizada",copy:"Fotos, audios, nombres y mensajes propios.",mark:"♡"},
  {eyebrow:"NOSOTROS LO ARMAMOS",title:"Diseño y dirección",copy:"No necesitás editar ni diseñar nada.",mark:"✦"},
  {eyebrow:"LISTO PARA REGALAR",title:"Link privado",copy:"Recibís la experiencia terminada para compartir.",mark:"→"},
  {eyebrow:"HECHO EN ARGENTINA",title:"Te Hice Esto",copy:"Diseñado y armado con cuidado, de principio a fin.",mark:"AR"},
];

export default function HomeTrustMarquee(){
  const scrollerRef=useRef<HTMLDivElement|null>(null);
  const pausedRef=useRef(false);
  const resumeTimerRef=useRef<number|null>(null);
  const [reducedMotion,setReducedMotion]=useState(false);

  useEffect(()=>{
    const query=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>setReducedMotion(query.matches);
    sync();
    query.addEventListener?.("change",sync);
    return()=>query.removeEventListener?.("change",sync);
  },[]);

  useEffect(()=>{
    if(reducedMotion)return;
    const el=scrollerRef.current;
    if(!el)return;

    let frame=0;
    let last=performance.now();
    let position=el.scrollLeft;
    const tick=(now:number)=>{
      const delta=Math.min(40,now-last);
      last=now;
      if(pausedRef.current){
        position=el.scrollLeft;
      }else{
        position+=delta*0.025;
        const loopPoint=el.scrollWidth/2;
        if(loopPoint>0 && position>=loopPoint)position-=loopPoint;
        el.scrollLeft=position;
      }
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[reducedMotion]);

  const pause=()=>{
    pausedRef.current=true;
    if(resumeTimerRef.current!==null)window.clearTimeout(resumeTimerRef.current);
  };

  const resumeSoon=()=>{
    if(resumeTimerRef.current!==null)window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current=window.setTimeout(()=>{pausedRef.current=false},1100);
  };

  useEffect(()=>()=>{if(resumeTimerRef.current!==null)window.clearTimeout(resumeTimerRef.current)},[]);

  const renderItems=(duplicate=false)=>TRUST_ITEMS.map((item,index)=>(
    <article
      className="thh-trust-card"
      key={`${duplicate?"duplicate":"primary"}-${index}`}
      aria-hidden={duplicate||undefined}
    >
      <span className="thh-trust-mark" aria-hidden="true">{item.mark}</span>
      <div>
        <small>{item.eyebrow}</small>
        <strong>{item.title}</strong>
        <p>{item.copy}</p>
      </div>
    </article>
  ));

  return(
    <section className="thh-trust-marquee" aria-labelledby="thh-trust-title">
      <div className="thh-trust-heading">
        <span>PARA REGALAR CON TRANQUILIDAD</span>
        <h2 id="thh-trust-title">Cuidado en cada detalle.<br/><em>Confianza hasta el final.</em></h2>
        <p>Porque algo tan personal también merece sentirse seguro, simple y bien hecho.</p>
      </div>

      <div
        className="thh-trust-scroller"
        ref={scrollerRef}
        onPointerDown={pause}
        onPointerUp={resumeSoon}
        onPointerCancel={resumeSoon}
        onMouseEnter={pause}
        onMouseLeave={resumeSoon}
        aria-label="Señales de confianza de Te Hice Esto"
      >
        <div className="thh-trust-track">
          {renderItems(false)}
          {renderItems(true)}
        </div>
      </div>

      <p className="thh-trust-swipe">Deslizá para recorrer <span aria-hidden="true">→</span></p>
    </section>
  );
}
