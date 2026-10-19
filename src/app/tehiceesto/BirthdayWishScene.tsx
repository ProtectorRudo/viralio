"use client";

import type { ReactNode, CSSProperties } from "react";
import CandleBlow from "./CandleBlow";
import BirthdayCakeIllustration from "./BirthdayCakeIllustration";
import "./BirthdayWishScene.css";

type Labels = { idle:string; active:string; fallback:string; unavailable:string };
type Props = {
  kicker:string;
  title:ReactNode;
  blown:boolean;
  micLabels:Labels;
  wishLabel:string;
  continueLabel:string;
  onBlow:()=>void;
  onContinue:()=>void;
};

const sparks = [
  [6,14,.3],[18,23,1.1],[34,9,.5],[47,19,2.6],[69,9,1.9],[91,17,3.2],
  [8,41,1.8],[28,40,3.1],[81,36,.4],[96,50,2.2],[12,66,2.7],[90,75,.8],
  [25,80,1.4],[57,70,2.8],[76,84,.9],[18,94,3.3],[52,91,.3],[87,94,2.7],
] as const;

export default function BirthdayWishScene({
  kicker,title,blown,micLabels,wishLabel,continueLabel,onBlow,onContinue,
}:Props){
  return <section className="thi-scene thi-scene-candles thi-scene-rich thi-birthday-wish">
    <div className="thi-wish-lightshaft" aria-hidden="true"/>
    <div className="thi-wish-glimmer" aria-hidden="true">
      {sparks.map(([x,y,delay],i)=><i key={i} style={{"--sx":`${x}%`,"--sy":`${y}%`,"--sd":`${delay}s`} as CSSProperties}/>)}
    </div>
    <div className="thi-wish-heading">
      <p className="thi-kicker">{kicker}</p>
      <h2>{title}</h2>
      <div className="thi-wish-heading-ornament" aria-hidden="true"><span/>✦<span/></div>
    </div>
    <div className={`thi-birthday-ritual ${blown?"out":""}`}>
      <div className="thi-wish-cake-halo" aria-hidden="true"/>
      <div className="thi-wish-ribbon thi-wish-ribbon-left" aria-hidden="true"/>
      <div className="thi-wish-ribbon thi-wish-ribbon-right" aria-hidden="true"/>
      <BirthdayCakeIllustration blown={blown}/>
      <p>{blown ? "Tu deseo queda entre vos y las velas." : "Cerrá los ojos un segundo."}</p>
    </div>
    <div className="thi-wish-actions">
      <CandleBlow birthdayMode blown={blown} labels={micLabels} onBlow={onBlow}/>
      {blown && <p className="thi-wish-made">{wishLabel}</p>}
      {blown && <button data-action="advance" className="thi-wish-continue" onClick={onContinue}>{continueLabel} <span aria-hidden="true">→</span></button>}
    </div>
  </section>;
}
