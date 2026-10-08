"use client";

import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import { getScratchCoverPalette } from "./scratchCoverThemes";

type Point={x:number;y:number};

export default function ScratchReveal({
  accent,themeSlug,eyebrow,reward,note,revealed,onReveal,coverTitle,coverHint,fallbackLabel,
}:{
  accent:string; themeSlug:string; eyebrow:string; reward:string; note:string; revealed:boolean; onReveal:()=>void;
  coverTitle:string; coverHint:string; fallbackLabel:string;
}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const activePointerRef=useRef<number|null>(null);
  const lastPointRef=useRef<Point|null>(null);
  const coverageRef=useRef(new Set<number>());
  const revealedRef=useRef(revealed);
  const startedRef=useRef(false);
  const [started,setStarted]=useState(false);

  useEffect(()=>{revealedRef.current=revealed},[revealed]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas||revealed)return;
    const parent=canvas.parentElement;
    if(!parent)return;

    const paintCover=()=>{
      if(startedRef.current)return;
      const rect=parent.getBoundingClientRect();
      const ratio=Math.min(window.devicePixelRatio||1,2);

      canvas.width=Math.max(1,Math.round(rect.width*ratio));
      canvas.height=Math.max(1,Math.round(rect.height*ratio));
      canvas.style.width=`${rect.width}px`;
      canvas.style.height=`${rect.height}px`;
      canvas.dataset.scratchProgress="0";
      coverageRef.current.clear();

      const ctx=canvas.getContext("2d");
      if(!ctx)return;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      ctx.clearRect(0,0,rect.width,rect.height);

      // Theme-driven premium foil, painted directly onto the scratch canvas.
      // No change to pointer capture, coverage, erasing or reveal thresholds.
      const palette=getScratchCoverPalette(themeSlug);
      const gradient=ctx.createLinearGradient(0,0,rect.width,rect.height);
      palette.stops.forEach((color,index)=>gradient.addColorStop([0,.20,.45,.70,1][index],color));
      ctx.fillStyle=gradient;
      ctx.fillRect(0,0,rect.width,rect.height);

      ctx.save();
      ctx.globalAlpha=.14;
      for(let x=-rect.height;x<rect.width+rect.height;x+=16){
        ctx.strokeStyle=x%32===0?palette.lineLight:palette.lineDark;
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x+rect.height,rect.height);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha=.075;
      for(let y=9;y<rect.height;y+=13){
        ctx.strokeStyle=palette.lineLight;
        ctx.lineWidth=.55;
        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(rect.width,y+3);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle=palette.textPrimary;
      ctx.textAlign="center";
      ctx.font="700 11px Inter, Arial, sans-serif";
      ctx.fillText(coverTitle.toUpperCase(),rect.width/2,rect.height/2-3);
      ctx.fillStyle=palette.textSecondary;
      ctx.font="500 9px Inter, Arial, sans-serif";
      ctx.fillText(coverHint,rect.width/2,rect.height/2+18);
    };

    paintCover();
    const observer=new ResizeObserver(paintCover);
    observer.observe(parent);
    return()=>observer.disconnect();
  },[revealed,coverTitle,coverHint,themeSlug]);

  const toPoint=(clientX:number,clientY:number):Point|null=>{
    const canvas=canvasRef.current;
    if(!canvas)return null;
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    return{
      x:Math.max(0,Math.min(rect.width,clientX-rect.left)),
      y:Math.max(0,Math.min(rect.height,clientY-rect.top)),
    };
  };

  const completeReveal=()=>{
    if(revealedRef.current)return;
    revealedRef.current=true;
    onReveal();
  };

  const updateCoverage=(from:Point,to:Point,brushRadius:number)=>{
    const canvas=canvasRef.current;
    if(!canvas||revealedRef.current)return;
    const rect=canvas.getBoundingClientRect();
    const cols=28;
    const rows=16;
    const cellW=rect.width/cols;
    const cellH=rect.height/rows;
    const distance=Math.hypot(to.x-from.x,to.y-from.y);
    const steps=Math.max(1,Math.ceil(distance/5));

    for(let step=0;step<=steps;step++){
      const t=step/steps;
      const x=from.x+(to.x-from.x)*t;
      const y=from.y+(to.y-from.y)*t;
      const minCol=Math.max(0,Math.floor((x-brushRadius)/cellW));
      const maxCol=Math.min(cols-1,Math.floor((x+brushRadius)/cellW));
      const minRow=Math.max(0,Math.floor((y-brushRadius)/cellH));
      const maxRow=Math.min(rows-1,Math.floor((y+brushRadius)/cellH));

      for(let row=minRow;row<=maxRow;row++){
        for(let col=minCol;col<=maxCol;col++){
          const cx=(col+.5)*cellW;
          const cy=(row+.5)*cellH;
          if(Math.hypot(cx-x,cy-y)<=brushRadius)coverageRef.current.add(row*cols+col);
        }
      }
    }

    const progress=coverageRef.current.size/(cols*rows);
    canvas.dataset.scratchProgress=progress.toFixed(3);
    if(progress>=.56)completeReveal();
  };

  const erase=(from:Point,to:Point)=>{
    const canvas=canvasRef.current;
    if(!canvas||revealedRef.current)return;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    const rect=canvas.getBoundingClientRect();
    const radius=Math.max(22,Math.min(34,Math.min(rect.width,rect.height)*.105));
    const distance=Math.hypot(to.x-from.x,to.y-from.y);
    const steps=Math.max(1,Math.ceil(distance/(radius*.36)));

    ctx.save();
    ctx.globalCompositeOperation="destination-out";
    ctx.lineCap="round";
    ctx.lineJoin="round";

    for(let step=0;step<=steps;step++){
      const t=step/steps;
      const x=from.x+(to.x-from.x)*t;
      const y=from.y+(to.y-from.y)*t;

      const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
      gradient.addColorStop(0,"rgba(0,0,0,1)");
      gradient.addColorStop(.62,"rgba(0,0,0,.98)");
      gradient.addColorStop(.84,"rgba(0,0,0,.62)");
      gradient.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=gradient;
      ctx.beginPath();
      ctx.arc(x,y,radius,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    updateCoverage(from,to,radius*.88);
  };

  const pointerDown=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(revealedRef.current||activePointerRef.current!==null)return;
    event.preventDefault();
    activePointerRef.current=event.pointerId;
    startedRef.current=true;
    setStarted(true);
    const point=toPoint(event.clientX,event.clientY);
    lastPointRef.current=point;
    if(point)erase(point,point);
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
  };

  const pointerMove=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(revealedRef.current||activePointerRef.current!==event.pointerId)return;
    event.preventDefault();

    const native=event.nativeEvent;
    const samples=typeof native.getCoalescedEvents==="function"
      ? native.getCoalescedEvents()
      : [];

    const events=samples.length?samples:[native];
    for(const sample of events){
      const next=toPoint(sample.clientX,sample.clientY);
      if(!next)continue;
      const previous=lastPointRef.current||next;
      erase(previous,next);
      lastPointRef.current=next;
      if(revealedRef.current)break;
    }
  };

  const pointerEnd=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(activePointerRef.current!==event.pointerId)return;
    event.preventDefault();
    activePointerRef.current=null;
    lastPointRef.current=null;
    try{event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };

  return <div
    className={`thi-scratch thi-scratch-real ${revealed?"done":""}`}
    data-scratch-cover-theme={themeSlug}
    style={{"--scratch-accent":accent} as React.CSSProperties}
  >
    <div className="thi-scratch-prize">
      <span>{eyebrow}</span>
      <strong>{reward}</strong>
      <small>{note}</small>
      <i>✦</i>
    </div>

    {!revealed&&<canvas
      data-action="scratch-canvas"
      data-scratch-progress="0"
      ref={canvasRef}
      className="thi-scratch-canvas"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd}
      onLostPointerCapture={pointerEnd}
    />}

    {!revealed&&<button
      data-action="scratch-fallback"
      className={`thi-scratch-fallback ${started?"visible":""}`}
      type="button"
      onClick={onReveal}
    >{fallbackLabel}</button>}
  </div>;
}
