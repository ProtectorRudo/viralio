"use client";

import { useEffect, useRef, useState } from "react";

type PairRoseFinaleProps = {
  message: string;
  subtitle: string;
};

type Spark = {
  x: number; y: number; vx: number; vy: number;
  born: number; life: number; radius: number; color: readonly [number,number,number];
};

const COLORS = [
  [248, 194, 154], [243, 143, 154], [255, 220, 163],
  [236, 168, 212], [255, 236, 209], [216, 92, 125],
] as const;

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Haptic feedback is an enhancement, not an interaction requirement.
  }
}

/** A one-time, bounded canvas animation: no permanent GPU loop or third-party dependency. */
function Fireworks({active}:{active:boolean}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas=canvasRef.current;
    if(!canvas) return;
    const ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx) return;

    let width=0;
    let height=0;
    let raf=0;
    let particles:Spark[]=[];
    let nextBurst=0;
    const timings=[270,810,1370,1930,2560,3170];
    const centers=[
      [.17,.30],[.84,.24],[.28,.55],[.74,.56],[.47,.22],[.58,.40],
    ];
    const started=performance.now();
    const resize=()=>{
      const bounds=canvas.getBoundingClientRect();
      const dpr=Math.min(window.devicePixelRatio||1,1.5);
      width=Math.max(bounds.width,1);height=Math.max(bounds.height,1);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize();
    window.addEventListener("resize",resize,{passive:true});

    const burst=(index:number,now:number)=>{
      const [px,py]=centers[index];
      const originX=width*px;
      const originY=height*py;
      const count=width<450?25:32;
      for(let i=0;i<count;i++){
        const angle=(Math.PI*2*i/count)+(index*.38);
        const velocity=width<450?36+(i%5)*7:48+(i%5)*11;
        particles.push({
          x:originX,y:originY,
          vx:Math.cos(angle)*velocity,
          vy:Math.sin(angle)*velocity,
          born:now,
          life:1.04+(i%7)*.09,
          radius:i%5===0?1.95:1.25,
          color:COLORS[(index+i)%COLORS.length],
        });
      }
    };

    const tick=(now:number)=>{
      const elapsed=now-started;
      ctx.clearRect(0,0,width,height);
      while(nextBurst<timings.length&&elapsed>=timings[nextBurst]){
        burst(nextBurst,now);
        nextBurst++;
      }
      particles=particles.filter(p=>(now-p.born)/1000<p.life);
      for(const p of particles){
        const age=(now-p.born)/1000;
        const t=Math.min(age/p.life,1);
        const ease=1-t;
        const x=p.x+p.vx*age;
        const y=p.y+p.vy*age+16*age*age;
        const [r,g,b]=p.color;
        ctx.fillStyle=`rgba(${r},${g},${b},${(ease*ease*.96).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x,y,Math.max(.45,p.radius*(.85+ease*.3)),0,Math.PI*2);
        ctx.fill();
      }
      if(elapsed<4900&&document.visibilityState!=="hidden"){
        raf=requestAnimationFrame(tick);
      }else{
        ctx.clearRect(0,0,width,height);
      }
    };
    raf=requestAnimationFrame(tick);
    return()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",resize);
      ctx.clearRect(0,0,width,height);
    };
  },[active]);

  return <canvas className="thi-rose-fireworks" ref={canvasRef} aria-hidden="true"/>;
}

export default function PairRoseFinale({message,subtitle}:PairRoseFinaleProps){
  const [opened,setOpened]=useState(false);
  const timeout=useRef<number|null>(null);

  useEffect(()=>()=>{if(timeout.current!==null)window.clearTimeout(timeout.current)},[]);

  const open=()=>{
    if(opened)return;
    setOpened(true);
    if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      vibrate(13);
      timeout.current=window.setTimeout(()=>vibrate([10,28,13]),1020);
    }
  };

  return <div className={`thi-rose-finale${opened?" is-open":""}`} data-rose-open={opened?"true":"false"}>
    <Fireworks active={opened}/>
    <div className="thi-rose-aura" aria-hidden="true"/>
    <button
      type="button"
      data-action="rose-open"
      className="thi-rose-touch"
      onClick={open}
      aria-label={opened?"Rosa abierta, sorpresa revelada":"Tocá la rosa para descubrir el último mensaje"}
      aria-pressed={opened}
    >
      <svg className="thi-rose-svg" viewBox="0 0 260 320" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rosa roja con pétalos que se abren">
        <defs>
          <linearGradient id="thiRoseStem" x1="113" y1="147" x2="155" y2="310" gradientUnits="userSpaceOnUse">
            <stop stopColor="#87A575"/><stop offset=".38" stopColor="#406C55"/><stop offset="1" stopColor="#17392E"/>
          </linearGradient>
          <linearGradient id="thiRoseLeaf" x1="70" y1="201" x2="165" y2="284" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9CB28B"/><stop offset=".34" stopColor="#3E775D"/><stop offset="1" stopColor="#142E2B"/>
          </linearGradient>
          <radialGradient id="thiRosePetal" cx=".35" cy=".18" r=".96">
            <stop stopColor="#DF8790"/><stop offset=".27" stopColor="#B74B67"/><stop offset=".63" stopColor="#8B2046"/><stop offset="1" stopColor="#4A122C"/>
          </radialGradient>
          <linearGradient id="thiRoseCore" x1="92" y1="58" x2="170" y2="173" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ED9C9B"/><stop offset=".32" stopColor="#C24F67"/><stop offset=".69" stopColor="#8E2446"/><stop offset="1" stopColor="#47142D"/>
          </linearGradient>
          <filter id="thiRoseShadow" x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy="13" stdDeviation="9" floodColor="#000000" floodOpacity=".30"/>
          </filter>
        </defs>
        <ellipse cx="131" cy="300" rx="53" ry="6" fill="#D89097" opacity=".07"/>
        <path d="M132 142C124 189 153 215 130 310" stroke="url(#thiRoseStem)" strokeWidth="8" strokeLinecap="round"/>
        <path d="M134 236C105 199 76 204 52 209C59 240 93 255 133 249" fill="url(#thiRoseLeaf)"/>
        <path d="M129 249C102 230 78 218 60 213" stroke="#A2BF8F" strokeOpacity=".48" strokeWidth="1.5"/>
        <path d="M143 205C171 178 205 182 219 190C207 219 181 234 141 221" fill="url(#thiRoseLeaf)"/>
        <path d="M148 219C175 202 191 195 210 192" stroke="#A3C19D" strokeOpacity=".39" strokeWidth="1.5"/>
        <g className="thi-rose-flower" filter="url(#thiRoseShadow)">
          <path className="thi-rose-petal thi-rose-petal-back" d="M131 163C77 168 63 105 97 69C120 45 164 60 168 82C211 121 175 163 131 163Z" fill="url(#thiRosePetal)"/>
          <path className="thi-rose-petal thi-rose-petal-left" d="M131 158C86 161 57 132 73 90C84 62 102 58 120 70C108 89 103 120 131 158Z" fill="url(#thiRosePetal)"/>
          <path className="thi-rose-petal thi-rose-petal-right" d="M128 158C166 159 197 136 193 100C188 75 171 66 153 72C166 101 157 131 128 158Z" fill="url(#thiRosePetal)"/>
          <path className="thi-rose-petal thi-rose-petal-front-left" d="M129 159C82 152 75 115 86 97C102 77 123 95 134 111C115 126 113 143 129 159Z" fill="url(#thiRoseCore)"/>
          <path className="thi-rose-petal thi-rose-petal-front-right" d="M131 160C171 148 176 112 165 97C150 78 131 97 126 112C143 133 149 144 131 160Z" fill="url(#thiRoseCore)"/>
          <path className="thi-rose-heart" d="M128 144C110 131 110 104 126 94C144 93 155 112 146 131C142 141 134 145 128 144Z" fill="url(#thiRoseCore)"/>
          <path className="thi-rose-fold" d="M117 104C133 96 144 109 138 121C131 130 122 122 128 113" stroke="#F4B1AE" strokeOpacity=".68" strokeWidth="2.8" strokeLinecap="round"/>
          <path className="thi-rose-cup" d="M101 152C118 168 143 169 160 152" stroke="#526949" strokeWidth="6" strokeLinecap="round"/>
        </g>
      </svg>
      <span className="thi-rose-touch-glimmer" aria-hidden="true">✧</span>
    </button>
    <p className="thi-rose-instruction" aria-hidden={opened}>{opened?"":"TOCÁ LA ROSA · HAY ALGO MÁS PARA VOS"}</p>
    <div className="thi-rose-reveal" aria-live="polite">
      {opened&&<>
        <span className="thi-rose-reveal-kicker">LO QUE MÁS IMPORTA</span>
        <strong className="thi-rose-love">{message}</strong>
        <span className="thi-rose-afterword">{subtitle}</span>
      </>}
    </div>
  </div>;
}
