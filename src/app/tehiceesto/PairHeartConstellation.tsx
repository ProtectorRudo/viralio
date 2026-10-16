"use client";
import {type CSSProperties} from "react";
import "./PairHeartConstellation.css";

type Props={
  kicker:string; title:string[]; lines:string[]; opened:number[];
  lastStar:number|null; giver:string; cta:string;
  onStar:(index:number)=>void; onContinue:()=>void;
};
const nodes=[[124,71],[60,155],[200,304],[340,155],[276,71]];
const heart="M124 71 C81 68 50 99 60 155 C72 219 143 259 200 304 C257 259 328 219 340 155 C350 99 319 68 276 71 C243 73 216 91 200 113 C184 91 157 73 124 71 Z";

export default function PairHeartConstellation({kicker,title,lines,opened,lastStar,giver,cta,onStar,onContinue}:Props){
 const total=lines.length;
 const done=total>0&&opened.length>=total;
 const progress=100-Math.min(100,opened.length*100/Math.max(1,total));
 return <section className={"thi-scene thi-scene-stars pair-heart-cinema"+(done?" is-complete":"")} data-pair-heart="cinematic-v1">
   <div className="phc-sky" aria-hidden="true">
     <div className="phc-nebula phc-nebula-left"/>
     <div className="phc-nebula phc-nebula-right"/>
     <div className="phc-nebula phc-nebula-bottom"/>
     {Array.from({length:48},(_,i)=><i key={i} className={"phc-background-star"+(i%7===0?" is-bright":"")}
        style={{left:((i*73+17)%100)+"%",top:((i*41+9)%100)+"%",animationDelay:(i*-.31).toFixed(2)+"s",opacity:.25+(i%6)*.09}}/>)}
   </div>
   <div className="phc-layout">
     <header className="phc-heading">
       <p className="phc-eyebrow">{kicker}</p>
       <h2>{title.map((line,i)=><span key={i}>{line}</span>)}</h2>
     </header>
     <div className="phc-skyline">
       <div className="phc-aura" aria-hidden="true"/>
       <svg className="phc-illustration" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
         <defs>
           <linearGradient id="phc-gold-trace" x1="0" x2="1" y1="0" y2="1">
             <stop offset="0%" stopColor="#fff0c8"/>
             <stop offset="40%" stopColor="#f2ab9e"/>
             <stop offset="75%" stopColor="#ffe6b9"/>
             <stop offset="100%" stopColor="#ee9890"/>
           </linearGradient>
         </defs>
         <ellipse className="phc-orbit phc-orbit-one" cx="200" cy="185" rx="187" ry="123" transform="rotate(-14 200 185)"/>
         <ellipse className="phc-orbit phc-orbit-two" cx="200" cy="183" rx="180" ry="100" transform="rotate(18 200 183)"/>
         <path className="phc-guide" d={heart}/>
         <path className="phc-glow-path" pathLength={100} d={heart} style={{strokeDashoffset:progress} as CSSProperties}/>
         <path className="phc-trace" pathLength={100} d={heart} style={{strokeDashoffset:progress} as CSSProperties}/>
         {done&&<path className="phc-final-shimmer" d={heart}/>}
       </svg>
       <div className="phc-meteor-shower" aria-hidden="true">
         {Array.from({length:17},(_,i)=><i key={i}
           style={{left:((i*37+7)%94)+"%",animationDelay:(i*.24).toFixed(2)+"s",
             animationDuration:(2.4+i%4*.47).toFixed(2)+"s"}}/>)}
       </div>
       <div className="phc-sparkles" aria-hidden="true">
         {Array.from({length:18},(_,i)=><i key={i}
           style={{left:((i*31+18)%95)+"%",top:((i*43+11)%94)+"%",
             animationDelay:(i*-.28).toFixed(2)+"s"}}/>)}
       </div>
       {nodes.map((pos,i)=>{
         if(i>=total)return null;
         const found=opened.includes(i),active=!found&&opened.length===i;
         return <button key={i} type="button" data-action="star"
           aria-label={found?"Descubierto: "+lines[i]:active?"Descubrir cosa "+(i+1):"Primero descubrí la estrella "+(opened.length+1)}
           aria-pressed={found} disabled={!active}
           onClick={()=>onStar(i)}
           className={"phc-star n"+(i+1)+(found?" is-found":"")+(active?" is-active":"")}
           style={{left:(pos[0]/400*100)+"%",top:(pos[1]/340*100)+"%"}}>
           <span className="phc-star-light" aria-hidden="true"/>
           <span className="phc-star-ring" aria-hidden="true"/>
           <span className="phc-star-cross" aria-hidden="true"/>
         </button>;
       })}
       <div className="phc-breath" aria-hidden="true"/>
     </div>
     <div className="phc-story" aria-live="polite">
       <small>{String(opened.length).padStart(2,"0")+" — "+String(total).padStart(2,"0")}</small>
       <blockquote key={lastStar===null?"begin":lastStar}>
         {lastStar===null?"Tocá la primera estrella.":lines[lastStar]}
       </blockquote>
       {done?<div className="phc-finale">
         <strong>Ya estaban todas ahí.</strong>
         <p>{"Cinco cosas tuyas que "+giver+" no quería dejar sin decir."}</p>
       </div>:<p className="phc-instruction">{lastStar===null?"UNA LUZ GUARDA ALGO PARA VOS":"TOCÁ LA SIGUIENTE ESTRELLA"}</p>}
     </div>
     {done&&<button type="button" data-action="advance" className="phc-cta" onClick={onContinue}>
       <span>{cta.replace(/\s*→\s*$/,"")}</span><b aria-hidden="true">→</b>
     </button>}
   </div>
 </section>;
}
