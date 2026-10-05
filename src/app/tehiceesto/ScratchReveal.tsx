"use client";

import {
  useEffect,useRef,useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type Point={x:number;y:number};

export default function ScratchReveal({
  accent,eyebrow,reward,note,revealed,onReveal,coverTitle,coverHint,fallbackLabel,
}:{
  accent:string; eyebrow:string; reward:string; note:string; revealed:boolean; onReveal:()=>void;
  coverTitle:string; coverHint:string; fallbackLabel:string;
}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const draggingRef=useRef(false);
  const startedRef=useRef(false);
  const lastPointRef=useRef<Point|null>(null);
  const moveCountRef=useRef(0);
  const coverageRef=useRef(new Set<number>());
  const revealedRef=useRef(revealed);
  const [started,setStarted]=useState(false);

  useEffect(()=>{revealedRef.current=revealed},[revealed]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas||revealed)return;
    const parent=canvas.parentElement;
    if(!parent)return;

    const drawCover=()=>{
      if(startedRef.current)return;
      const rect=parent.getBoundingClientRect();
      const ratio=Math.min(window.devicePixelRatio||1,2);

      canvas.width=Math.max(1,Math.floor(rect.width*ratio));
      canvas.height=Math.max(1,Math.floor(rect.height*ratio));
      canvas.style.width=`${rect.width}px`;
      canvas.style.height=`${rect.height}px`;
      canvas.dataset.scratchProgress="0";

      const ctx=canvas.getContext("2d");
      if(!ctx)return;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      ctx.clearRect(0,0,rect.width,rect.height);

      const gradient=ctx.createLinearGradient(0,0,rect.width,rect.height);
      gradient.addColorStop(0,"#aaa3ad");
      gradient.addColorStop(.24,"#625c65");
      gradient.addColorStop(.48,"#9a929c");
      gradient.addColorStop(.72,"#514b54");
      gradient.addColorStop(1,"#817983");
      ctx.fillStyle=gradient;
      ctx.fillRect(0,0,rect.width,rect.height);

      ctx.save();
      ctx.globalAlpha=.18;
      for(let x=-rect.height;x<rect.width+rect.height;x+=18){
        ctx.strokeStyle=x%36===0?"#fff":"#111";
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x+rect.height,rect.height);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha=.10;
      for(let y=10;y<rect.height;y+=15){
        ctx.strokeStyle="#fff";
        ctx.lineWidth=.5;
        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(rect.width,y+4);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle="rgba(255,255,255,.94)";
      ctx.textAlign="center";
      ctx.font="700 11px Inter, Arial, sans-serif";
      ctx.fillText(coverTitle.toUpperCase(),rect.width/2,rect.height/2-3);
      ctx.fillStyle="rgba(255,255,255,.56)";
      ctx.font="500 9px Inter, Arial, sans-serif";
      ctx.fillText(coverHint,rect.width/2,rect.height/2+18);
    };

    drawCover();
    const observer=new ResizeObserver(drawCover);
    observer.observe(parent);
    return()=>observer.disconnect();
  },[revealed,coverTitle,coverHint]);

  const pointFromClient=(clientX:number,clientY:number):Point|null=>{
    const canvas=canvasRef.current;
    if(!canvas)return null;
    const rect=canvas.getBoundingClientRect();
    return{
      x:Math.max(0,Math.min(rect.width,clientX-rect.left)),
      y:Math.max(0,Math.min(rect.height,clientY-rect.top)),
    };
  };

  const completeReveal=()=>{
    if(revealedRef.current)return true;
    revealedRef.current=true;
    onReveal();
    return true;
  };

  const recordCoverage=(from:Point,to:Point)=>{
    const canvas=canvasRef.current;
    if(!canvas||revealedRef.current)return false;
    const rect=canvas.getBoundingClientRect();
    const cols=20;
    const rows=12;
    const cellW=Math.max(rect.width/cols,1);
    const cellH=Math.max(rect.height/rows,1);
    const distance=Math.hypot(to.x-from.x,to.y-from.y);
    const steps=Math.max(1,Math.ceil(distance/9));

    for(let step=0;step<=steps;step++){
      const t=step/steps;
      const x=from.x+(to.x-from.x)*t;
      const y=from.y+(to.y-from.y)*t;
      const centerCol=Math.floor(x/cellW);
      const centerRow=Math.floor(y/cellH);

      for(let dy=-2;dy<=2;dy++){
        for(let dx=-2;dx<=2;dx++){
          const col=centerCol+dx;
          const row=centerRow+dy;
          if(col<0||col>=cols||row<0||row>=rows)continue;
          const cx=(col+.5)*cellW;
          const cy=(row+.5)*cellH;
          if(Math.hypot(cx-x,cy-y)<=38)coverageRef.current.add(row*cols+col);
        }
      }
    }

    const progress=coverageRef.current.size/(cols*rows);
    canvas.dataset.scratchProgress=progress.toFixed(3);
    if(progress>=.18)return completeReveal();
    return false;
  };

  const eraseSegment=(from:Point,to:Point)=>{
    const canvas=canvasRef.current;
    if(!canvas||revealedRef.current)return;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;

    const drawStroke=(width:number,alpha:number)=>{
      ctx.save();
      ctx.globalCompositeOperation="destination-out";
      ctx.globalAlpha=alpha;
      ctx.strokeStyle="#000";
      ctx.lineWidth=width;
      ctx.lineCap="round";
      ctx.lineJoin="round";
      ctx.beginPath();
      ctx.moveTo(from.x,from.y);
      ctx.lineTo(to.x,to.y);
      ctx.stroke();
      ctx.restore();
    };

    drawStroke(76,.30);
    drawStroke(60,.98);

    ctx.save();
    ctx.globalCompositeOperation="destination-out";
    const radius=38;
    const gradient=ctx.createRadialGradient(to.x,to.y,radius*.18,to.x,to.y,radius);
    gradient.addColorStop(0,"rgba(0,0,0,1)");
    gradient.addColorStop(.58,"rgba(0,0,0,.98)");
    gradient.addColorStop(.82,"rgba(0,0,0,.50)");
    gradient.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gradient;
    ctx.beginPath();
    ctx.arc(to.x,to.y,radius,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    recordCoverage(from,to);
  };

  const measurePixels=()=>{
    const canvas=canvasRef.current;
    if(!canvas||revealedRef.current)return false;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    if(!ctx)return false;
    const {width,height}=canvas;
    if(!width||!height)return false;

    const data=ctx.getImageData(0,0,width,height).data;
    let transparent=0;
    let sampled=0;
    const pixelStride=22;
    for(let pixel=0;pixel<width*height;pixel+=pixelStride){
      sampled+=1;
      if(data[pixel*4+3]<100)transparent+=1;
    }

    const scratched=sampled?transparent/sampled:0;
    if(scratched>=.16)return completeReveal();
    return false;
  };

  const beginAt=(clientX:number,clientY:number)=>{
    if(revealedRef.current)return;
    draggingRef.current=true;
    startedRef.current=true;
    setStarted(true);
    moveCountRef.current=0;
    const point=pointFromClient(clientX,clientY);
    lastPointRef.current=point;
    if(point)eraseSegment(point,point);
  };

  const moveAt=(clientX:number,clientY:number)=>{
    if(!draggingRef.current||revealedRef.current)return;
    const next=pointFromClient(clientX,clientY);
    if(!next)return;
    const previous=lastPointRef.current||next;
    eraseSegment(previous,next);
    lastPointRef.current=next;
    moveCountRef.current+=1;
    if(moveCountRef.current%6===0)measurePixels();
  };

  const endAt=()=>{
    if(!draggingRef.current)return;
    draggingRef.current=false;
    lastPointRef.current=null;
    measurePixels();
  };

  const pointerDown=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    beginAt(event.clientX,event.clientY);
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
  };

  const pointerMove=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(!draggingRef.current)return;
    const native=event.nativeEvent;
    const raw=typeof native.getCoalescedEvents==="function"?native.getCoalescedEvents():[];
    const samples=raw.length?raw:[native];
    for(const sample of samples)moveAt(sample.clientX,sample.clientY);
  };

  const pointerEnd=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    endAt();
    try{event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };

  const mouseDown=(event:ReactMouseEvent<HTMLCanvasElement>)=>{
    event.preventDefault();
    beginAt(event.clientX,event.clientY);
  };
  const mouseMove=(event:ReactMouseEvent<HTMLCanvasElement>)=>{
    if(!draggingRef.current)return;
    moveAt(event.clientX,event.clientY);
  };
  const mouseEnd=()=>endAt();

  const touchStart=(event:ReactTouchEvent<HTMLCanvasElement>)=>{
    const touch=event.touches[0];
    if(!touch)return;
    event.preventDefault();
    beginAt(touch.clientX,touch.clientY);
  };
  const touchMove=(event:ReactTouchEvent<HTMLCanvasElement>)=>{
    const touch=event.touches[0];
    if(!touch)return;
    event.preventDefault();
    moveAt(touch.clientX,touch.clientY);
  };
  const touchEnd=(event:ReactTouchEvent<HTMLCanvasElement>)=>{
    event.preventDefault();
    endAt();
  };

  return <div
    className={`thi-scratch thi-scratch-real ${revealed?"done":""}`}
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
      onMouseDown={mouseDown}
      onMouseMove={mouseMove}
      onMouseUp={mouseEnd}
      onMouseLeave={()=>{if(draggingRef.current)mouseEnd()}}
      onTouchStart={touchStart}
      onTouchMove={touchMove}
      onTouchEnd={touchEnd}
      onTouchCancel={touchEnd}
    />}

    {!revealed&&<button
      data-action="scratch-fallback"
      className={`thi-scratch-fallback ${started?"visible":""}`}
      type="button"
      onClick={onReveal}
    >{fallbackLabel}</button>}
  </div>;
}
