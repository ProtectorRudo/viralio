"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./EvaPledge.module.css";

export type EvaPledgeRecord = {
  signature: string;
  name: string;
  signedAt: string;
};

type Props = {onConfirm:(record:EvaPledgeRecord)=>void;onBack:()=>void;onPaperSound?:()=>void};

export default function EvaPledge({onConfirm,onBack,onPaperSound}:Props){
  const [opened,setOpened]=useState(false);
  const [opening,setOpening]=useState(false);
  const openingClock=useRef<number|null>(null);
  const [written,setWritten]=useState(false);
  const [typedName,setTypedName]=useState("");
  const [alternative,setAlternative]=useState(false);
  const [committed,setCommitted]=useState(false);
  const canvas=useRef<HTMLCanvasElement>(null);
  const pointer=useRef<number|null>(null);
  const last=useRef<{x:number;y:number}|null>(null);
  const distance=useRef(0);

  useEffect(()=>()=>{if(openingClock.current!==null)window.clearTimeout(openingClock.current);},[]);
  function openEnvelope(){
    if(opened||opening)return;
    onPaperSound?.();
    setOpening(true);
    openingClock.current=window.setTimeout(()=>setOpened(true),860);
  }
  useEffect(()=>{
    if(!opened||alternative)return;
    const el=canvas.current;
    if(!el)return;
    const bounds=el.getBoundingClientRect();
    if(!bounds.width||!bounds.height)return;
    const ratio=Math.min(2,window.devicePixelRatio||1);
    el.width=Math.round(bounds.width*ratio);
    el.height=Math.round(bounds.height*ratio);
    const ctx=el.getContext("2d");
    if(!ctx)return;
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.lineWidth=2.7;
    ctx.strokeStyle="#33382d";
    ctx.lineCap="round";
    ctx.lineJoin="round";
    ctx.clearRect(0,0,bounds.width,bounds.height);
    distance.current=0;
    // Letter opens to an empty line: user, not the machine, supplies the signature.
    setWritten(false);
  },[opened,alternative]);

  function point(event:ReactPointerEvent<HTMLCanvasElement>){
    const bounds=event.currentTarget.getBoundingClientRect();
    return {x:event.clientX-bounds.left,y:event.clientY-bounds.top};
  }
  function start(event:ReactPointerEvent<HTMLCanvasElement>){
    if(event.pointerType==="mouse"&&event.button!==0)return;
    if(pointer.current!==null)return;
    event.preventDefault();
    pointer.current=event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    last.current=point(event);
  }
  function move(event:ReactPointerEvent<HTMLCanvasElement>){
    if(pointer.current!==event.pointerId)return;
    event.preventDefault();
    const p=point(event);
    const from=last.current??p;
    const ctx=canvas.current?.getContext("2d");
    if(!ctx)return;
    ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(p.x,p.y);ctx.stroke();
    distance.current+=Math.hypot(p.x-from.x,p.y-from.y);
    last.current=p;
    if(distance.current>33&&!written)setWritten(true);
  }
  function end(event:ReactPointerEvent<HTMLCanvasElement>){
    if(pointer.current!==event.pointerId)return;
    pointer.current=null;last.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function erase(){
    const el=canvas.current;
    if(el){
      el.getContext("2d")?.clearRect(0,0,el.width,el.height);
      distance.current=0;
    }
    setWritten(false);
  }
  function sign(){
    const name=typedName.trim().replace(/\s+/g," ").slice(0,70);
    if(!committed||!(alternative?name.length>=2:written))return;
    const signature=alternative?"":(canvas.current?.toDataURL("image/png")??"");
    if(!alternative && !signature)return;
    onConfirm({signature,name,signedAt:new Date().toISOString()});
  }
  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Carta de compromiso para salvar a Eva" data-testid="umbral-oath" data-stage={opened?"letter":opening?"opening":"envelope"}>
    <div className={styles.haze} aria-hidden="true"/>
    {!opened?
      <div className={styles.envelopeScene} data-opening={opening?"true":"false"}>
        <span className={styles.folio}>EXPEDIENTE CONFIDENCIAL · 013</span>
        <h2>Te llegó una carta.</h2>
        <p>Está dirigida a vos. No tiene remitente.</p>
        <button type="button" className={styles.envelope} onClick={openEnvelope} disabled={opening} aria-label="Abrir el sobre sellado">
          <span className={styles.envelopeBack} aria-hidden="true"/>
          <span className={styles.emergingLetter} aria-hidden="true"><i>CASO 013</i><b>¿DÓNDE ESTÁ EVA?</b></span>
          <span className={styles.flap} aria-hidden="true"/>
          <span className={styles.wax} aria-hidden="true">E</span>
          <span className={styles.envelopeFace} aria-hidden="true"><i>PARA QUIEN TODAVÍA ESCUCHA</i><b>ABRIR ↗</b></span>
        </button>
        <button type="button" className={styles.goBack} onClick={onBack}>← VOLVER</button>
      </div>
    :<div className={styles.paperScroll}>
       <article className={styles.letter}>
         <div className={styles.letterMeta}><span>CASA N.º 13</span><span>ARCHIVO E.V. / SIN FECHA</span></div>
         <div className={styles.rule}/>
         <p className={styles.salutation}>A quien encontró este sobre:</p>
         <p>Hace diez años, <strong>Eva desapareció</strong> dentro de esta casa. La policía cerró el caso. Su habitación, sin embargo, nunca quedó vacía.</p>
         <p>Encontrarás retratos, cerraduras, recuerdos y voces. <em>No confíes en todo lo que veas.</em> Tenés poco tiempo y la casa va a intentar detenerte.</p>
         <p>Hay dos maneras de terminar esta historia: salir con vida o descubrir qué le ocurrió a Eva y <strong>tratar de traerla de regreso.</strong></p>
         <div className={styles.plea}>Si llegaste hasta aquí, te pido algo: <strong>¿te comprometés a intentar salvar a Eva?</strong></div>
         <div className={styles.signatureSection}>
           <div className={styles.signatureHeader}><strong>FIRMA DE QUIEN ASUME EL CASO</strong><span>DOCUMENTO 013 — NO TRANSFERIBLE</span></div>
           <div className={styles.signatureTools}>
             <button type="button" aria-pressed={!alternative} onClick={()=>setAlternative(false)}>✎ FIRMAR CON EL DEDO</button>
             <button type="button" aria-pressed={alternative} onClick={()=>setAlternative(true)}>⌨ USAR NOMBRE</button>
           </div>
           {alternative?
            <label className={styles.typedLabel}>Tu firma escrita
              <input autoComplete="name" value={typedName} onChange={e=>setTypedName(e.target.value)} maxLength={70} placeholder="Escribí tu nombre para firmar" aria-label="Firma por nombre"/>
            </label>
           :<>
             <canvas ref={canvas} className={styles.signaturePad} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={()=>{pointer.current=null;last.current=null}} role="img" aria-label="Espacio para firmar con el dedo o el mouse" data-testid="umbral-signature"/>
             <div className={styles.signatureFoot}><span>DESLIZÁ EL DEDO PARA FIRMAR</span><button type="button" onClick={erase}>BORRAR FIRMA ↺</button></div>
           </>}
         </div>
         <label className={styles.agreement}><input type="checkbox" checked={committed} onChange={e=>setCommitted(e.target.checked)}/> <span>Me comprometo a intentar salvar a Eva y a investigar lo que esta casa oculta.</span></label>
         <button type="button" className={styles.confirm} disabled={!committed||!(alternative?typedName.trim().length>=2:written)} onClick={sign}>SELLAR MI COMPROMISO Y ENTRAR →</button>
         <p className={styles.privacy}>La firma queda guardada solamente en esta partida, en tu navegador. No se envía a ningún servidor.</p>
       </article>
       <button className={styles.letterBack} type="button" onClick={onBack}>← CERRAR SIN FIRMAR</button>
      </div>}
  </div>;
}
