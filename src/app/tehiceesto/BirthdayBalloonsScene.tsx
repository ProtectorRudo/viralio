"use client";

import {useRef, type CSSProperties, type ReactNode} from "react";
import "./BirthdayBalloonsScene.css";

const MAX_OPENED = 3;
const shades = [
  ["#f0b5a9","#9e627c","#fedad0"],
  ["#cabbd9","#827094","#f7e8f0"],
  ["#ead0a8","#a47862","#fff0d4"],
  ["#a6c6c4","#577a82","#e3ece3"],
  ["#e7b7cb","#91617b","#ffe4e4"],
  ["#e3bdaf","#966d72","#fff0e1"],
] as const;
const confetti = Array.from({length:12},(_,i)=>({
  "--burst-rotation":`${i*30}deg`,
  "--burst-distance":`${44+(i%3)*12}px`,
  "--burst-delay":`${i%4*36}ms`
} as CSSProperties));

export default function BirthdayBalloonsScene({
  kicker,title,messages,opened,nextLabel,onPop,onContinue
}:{
  kicker:string;
  title:ReactNode;
  messages:string[];
  opened:number[];
  nextLabel:string;
  onPop:(index:number)=>void;
  onContinue:()=>void;
}){
  // A synchronous guard prevents >3 choices when several taps arrive
  // before React has committed a render (common on touchscreens).
  const chosenRef=useRef<Set<number>>(new Set(opened));
  const chosenCount=opened.length;
  const complete=chosenCount>=MAX_OPENED;
  const choose=(index:number)=>{
    if(index<0||index>=messages.length||chosenRef.current.has(index)||chosenRef.current.size>=MAX_OPENED)return;
    chosenRef.current.add(index);
    onPop(index);
  };
  return <section className="thi-scene thi-scene-balloons thi-scene-rich thi-bday-balloon-scene"
      aria-label="Tres sorpresas entre seis globos">
    <div className="thi-bday-balloon-atmosphere" aria-hidden="true">
      <i/><i/><i/><i/><i/><i/><i/><i/><i/>
    </div>
    <header className="thi-bday-balloon-header">
      <p className="thi-kicker">{kicker}</p>
      <h2>{title}</h2>
      <div className="thi-bday-balloon-divider" aria-hidden="true"><span/>✦<span/></div>
      <p className="thi-bday-balloon-instruction">Seis globos. Sólo tres sorpresas para descubrir.</p>
    </header>
    <div className="thi-bday-satin-gallery" role="group" aria-label="Elegí tres globos para descubrir mensajes">
      {messages.slice(0,6).map((message,i)=>{
        const selected=opened.includes(i);
        const locked=!selected&&complete;
        const colors=shades[i%shades.length];
        return <button key={i} type="button"
          data-action="balloon"
          data-balloon-index={i}
          className={`thi-bday-balloon-btn ${selected?"pop is-revealed":""} ${locked?"is-locked":""}`}
          style={{"--balloon-light":colors[0],"--balloon-dark":colors[1],"--balloon-pearl":colors[2],"--balloon-seq":i,"--balloon-delay":`${-i*.71}s`,"--balloon-duration":`${4.6+i*.29}s`} as CSSProperties}
          aria-label={selected?`Globo ${i+1}: ${message}`:locked?`Globo ${i+1} bloqueado: ya elegiste tres`:`Explotar globo ${i+1}`}
          aria-pressed={selected}
          disabled={locked||selected}
          onClick={()=>choose(i)}>
          <span className="thi-bday-satin-body" aria-hidden="true">
            <span className="thi-bday-satin-highlight"/>
            <span className="thi-bday-satin-sheen"/>
            <span className="thi-bday-satin-filigree">✧</span>
            <span className="thi-bday-satin-knot"/>
            <svg className="thi-bday-satin-string" viewBox="0 0 50 70" aria-hidden="true">
              <path d="M25 1 C8 18 42 27 24 44 S11 56 28 68" />
            </svg>
          </span>
          <span className="thi-bday-burst" aria-hidden="true">
            {confetti.map((style,k)=><i key={k} style={style}/>)}
          </span>
          <span className="thi-bday-reveal-note" aria-hidden="true">
            <span className="thi-bday-note-decoration">✦</span>
            <span className="thi-bday-note-word">{message}</span>
            <span className="thi-bday-note-underline"/>
          </span>
        </button>;
      })}
    </div>
    <div className="thi-bday-balloon-progress" aria-live="polite" aria-atomic="true">
      <p className="thi-birthday-balloons-count">
        {complete?"Tus tres sorpresas ya están descubiertas.":`Te quedan ${MAX_OPENED-chosenCount} ${MAX_OPENED-chosenCount===1?"globo":"globos"} por elegir.`}
      </p>
      <div className="thi-bday-progress-jewels" aria-label={`${chosenCount} de ${MAX_OPENED} globos elegidos`}>
        {Array.from({length:MAX_OPENED},(_,i)=><span key={i} className={i<chosenCount?"lit":""} aria-hidden="true">✦</span>)}
      </div>
      <p className="thi-bday-balloon-little-note">
        {complete?"Los otros tres quedan guardados para otra historia.":"Cada globo guarda algo que alguien quiso decirte."}
      </p>
      <button type="button" data-action="advance" className="thi-bday-balloon-continue"
        disabled={!complete} onClick={onContinue}>
        <span>{complete?nextLabel:"Elegí tres globos para seguir"}</span>
        <span aria-hidden="true">{complete?"→":"✧"}</span>
      </button>
    </div>
  </section>;
}
