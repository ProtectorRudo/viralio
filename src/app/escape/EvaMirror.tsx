"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./EvaMirror.module.css";

type Props = { revealed: boolean; onReveal: () => void };

// A sparse virtual occupancy grid tracks meaningful coverage without repeatedly
// reading high-DPI pixels (expensive on mid-range phones).
const GRID_X = 28;
const GRID_Y = 22;
const REVEAL_FRACTION = 0.43;

export default function EvaMirror({revealed,onReveal}:Props){
  const canvas = useRef<HTMLCanvasElement>(null);
  const context = useRef<CanvasRenderingContext2D|null>(null);
  const activePointer = useRef<number|null>(null);
  const last = useRef<{x:number;y:number}|null>(null);
  const coverage = useRef(new Set<number>());
  const announced = useRef(false);
  const [percent,setPercent] = useState(0);
  const [done,setDone] = useState(revealed);
  const complete = revealed || done;

  useEffect(()=>{
    if(complete) return;
    const el=canvas.current;
    if(!el) return;
    function paint() {
      if(!el) return;
      const rect=el.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const ratio=Math.min(2,typeof window!=="undefined"?window.devicePixelRatio||1:1);
      el.width=Math.max(1,Math.round(rect.width*ratio));
      el.height=Math.max(1,Math.round(rect.height*ratio));
      const ctx=el.getContext("2d",{willReadFrequently:false});
      if(!ctx) return;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      ctx.globalCompositeOperation="source-over";
      const gradient=ctx.createLinearGradient(0,0,rect.width,rect.height);
      gradient.addColorStop(0,"rgba(186,201,204,.98)");
      gradient.addColorStop(.4,"rgba(109,132,145,.985)");
      gradient.addColorStop(.75,"rgba(173,190,196,.99)");
      gradient.addColorStop(1,"rgba(70,95,106,.99)");
      ctx.fillStyle=gradient;
      ctx.fillRect(0,0,rect.width,rect.height);
      // Tiny etched glass irregularities stay crisp at every DPR; no JPEG/PNG.
      for(let i=0;i<210;i++){
        const x=((i*173+41)%1000)/1000*rect.width;
        const y=((i*251+17)%997)/997*rect.height;
        ctx.fillStyle=i%3===0?"rgba(245,250,247,.11)":"rgba(30,50,59,.09)";
        ctx.fillRect(x,y,1+(i%2),.8);
      }
      context.current=ctx;
      coverage.current.clear();
      setPercent(0);
    }
    const observer=new ResizeObserver(paint);
    observer.observe(el);
    paint();
    return ()=>{observer.disconnect();context.current=null;};
  },[complete]);

  function finalize(){
    if(announced.current||complete)return;
    announced.current=true;
    setDone(true);
    setPercent(100);
    onReveal();
  }

  function scrub(x:number,y:number){
    const el=canvas.current,ctx=context.current;
    if(!el||!ctx||complete)return;
    const rect=el.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const radius=Math.min(rect.width,rect.height)*.102;
    ctx.save();
    ctx.globalCompositeOperation="destination-out";
    ctx.lineWidth=radius*2;
    ctx.lineCap="round";
    ctx.lineJoin="round";
    ctx.strokeStyle="#000";
    ctx.beginPath();
    if(last.current)ctx.moveTo(last.current.x,last.current.y);
    else ctx.moveTo(x,y);
    ctx.lineTo(x,y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x,y,radius,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Fill virtual cells touched by a continuous segment, not only end points,
    // so quick mobile swipes count just as slow ones.
    const from=last.current??{x,y};
    const steps=Math.max(1,Math.ceil(Math.hypot(x-from.x,y-from.y)/(radius*.45)));
    for(let step=0;step<=steps;step++){
      const t=step/steps;
      const px=from.x+(x-from.x)*t;
      const py=from.y+(y-from.y)*t;
      for(let gy=0;gy<GRID_Y;gy++){
        for(let gx=0;gx<GRID_X;gx++){
          const cx=(gx+.5)/GRID_X*rect.width;
          const cy=(gy+.5)/GRID_Y*rect.height;
          if((cx-px)**2+(cy-py)**2<=radius**2) coverage.current.add(gy*GRID_X+gx);
        }
      }
    }
    last.current={x,y};
    const fraction=coverage.current.size/(GRID_X*GRID_Y);
    setPercent(Math.min(99,Math.round(fraction*100)));
    if(fraction>=REVEAL_FRACTION)finalize();
  }

  function coords(e:ReactPointerEvent<HTMLCanvasElement>){
    const box=e.currentTarget.getBoundingClientRect();
    return {x:e.clientX-box.left,y:e.clientY-box.top};
  }

  function start(e:ReactPointerEvent<HTMLCanvasElement>){
    if(complete || activePointer.current!==null)return;
    if(e.pointerType==="mouse" && e.button!==0)return;
    e.preventDefault();
    activePointer.current=e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current=null;
    const {x,y}=coords(e);
    scrub(x,y);
  }

  function move(e:ReactPointerEvent<HTMLCanvasElement>){
    if(e.pointerId!==activePointer.current||complete)return;
    e.preventDefault();
    const {x,y}=coords(e);
    scrub(x,y);
  }

  function end(e:ReactPointerEvent<HTMLCanvasElement>){
    if(e.pointerId!==activePointer.current)return;
    activePointer.current=null;
    last.current=null;
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return <div className={styles.experience} data-testid="umbral-mirror" data-revealed={complete?"true":"false"}>
    <div className={styles.header}>
      <span className={styles.kicker}>OBJETO Nº 09 · HABITACIÓN DE EVA</span>
      <h2>El espejo empañado</h2>
      <p>El cristal está helado. Hay algo escrito desde el otro lado. Pasá el dedo sobre el vaho para ver qué quiso dejar Eva.</p>
    </div>
    <div className={styles.ornament} aria-hidden="true">✥</div>
    <div className={styles.frame}>
      <div className={styles.glass}>
        <div className={styles.moon} aria-hidden="true"/>
        <div className={styles.reflection} aria-hidden="true"><i/><i/></div>
        <div className={styles.inscription}>
          <span>EN LA CARA INTERIOR DEL VIDRIO</span>
          <strong>NO ME<br/>DEJES<br/>ATRÁS</strong>
          <em>— E.</em>
        </div>
        {!complete&&<canvas
          ref={canvas}
          className={styles.mist}
          role="img"
          aria-label="Espejo cubierto de vaho. Deslizá el dedo o el mouse para limpiar la superficie."
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={()=>{activePointer.current=null;last.current=null;}}
        />}
        <div className={styles.reflectionLight} aria-hidden="true"/>
        {complete && <div className={styles.revealedSeal}>REGISTRO REVELADO · 013</div>}
      </div>
    </div>
    {complete?<div className={styles.result} role="status"><strong>✧ ENCONTRASTE EL MENSAJE OCULTO</strong><p>La frase está escrita por dentro. Alguien estuvo en ese espejo antes que vos.</p><span>RECUERDO SECRETO · +300 PUNTOS</span></div>
      :<div className={styles.controls}>
        <div className={styles.progress} aria-label={"Superficie limpiada: "+percent+"%"}><span>VAHO RETIRADO</span><div className={styles.track}><i style={{width:percent+"%"}}/></div><b>{percent}%</b></div>
        <button type="button" className={styles.accessible} onClick={finalize}>REVELAR INSCRIPCIÓN SIN DESLIZAR ↗</button>
      </div>}
  </div>;
}
