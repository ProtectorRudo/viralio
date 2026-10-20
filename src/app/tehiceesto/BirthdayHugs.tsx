"use client";

import {useCallback,useEffect,useRef,useState,type CSSProperties} from "react";
import "./BirthdayHugs.css";

type Phase="waiting"|"pouring"|"final-hug"|"complete";
type Props={
  recipient:string; kicker:string; title:string; subtitle:string; prompt:string;
  noteLabel:string; notes:string[]; finaleTitle:string; finaleBody:string;
  signature:string; nextLabel:string;
  onContinue:()=>void;
};
const DURATION=16000;
const TOTAL=100;
const hugs=Array.from({length:28},(_,i)=>({
  angle:(i*137.5077)%360,
  delay:`${((i*37)%43)/10}s`,
  duration:`${3.5+(i%7)*.45}s`,
  shift:`${(i%2?-1:1)*(24+(i*13)%70)}px`,
  size:`${2+(i%4)}px`
}));
const safeVibrate=(pattern:number|number[])=>{
  try{if(typeof navigator!=="undefined"&&typeof navigator.vibrate==="function")navigator.vibrate(pattern)}catch{}
};
function playSound(){
  try{
    const w=window as typeof window & {webkitAudioContext?:typeof AudioContext};
    const Ctx=window.AudioContext||w.webkitAudioContext;if(!Ctx)return;
    const ctx=new Ctx();const start=ctx.currentTime;
    const notes=[392,494,587,784];
    notes.forEach((freq,i)=>{
      const o=ctx.createOscillator();const g=ctx.createGain();
      o.type="sine";o.frequency.setValueAtTime(freq,start+i*.11);
      g.gain.setValueAtTime(0,start+i*.11);
      g.gain.linearRampToValueAtTime(.016,start+i*.11+.07);
      g.gain.exponentialRampToValueAtTime(.001,start+i*.11+.54);
      o.connect(g);g.connect(ctx.destination);
      o.start(start+i*.11);o.stop(start+i*.11+.55);
    });
    window.setTimeout(()=>void ctx.close(),1500);
  }catch{}
}

export default function BirthdayHugs({
  recipient,kicker,title,subtitle,prompt,noteLabel,notes,finaleTitle,finaleBody,signature,nextLabel,onContinue
}:Props){
  const [phase,setPhase]=useState<Phase>("waiting");
  const [count,setCount]=useState(0);
  const [activeNote,setActiveNote]=useState(0);
  const raf=useRef<number|null>(null);
  const begun=useRef<number|null>(null);
  const lastTick=useRef(-1);
  const completionTimer=useRef<number|null>(null);
  const phaseRef=useRef<Phase>("waiting");
  const spoken=notes.length?notes:[subtitle];

  const complete=useCallback(()=>{
    if(phaseRef.current==="complete")return;
    if(raf.current!==null)cancelAnimationFrame(raf.current);
    raf.current=null;
    if(completionTimer.current!==null)window.clearTimeout(completionTimer.current);
    completionTimer.current=null;
    setCount(TOTAL);setActiveNote(Math.max(spoken.length-1,0));
    phaseRef.current="complete";setPhase("complete");
    safeVibrate([14,48,22]);
  },[spoken.length]);

  const grandFinale=useCallback(()=>{
    if(phaseRef.current!=="pouring")return;
    phaseRef.current="final-hug";setPhase("final-hug");setCount(TOTAL);
    safeVibrate([12,90,20,80,25]);
    completionTimer.current=window.setTimeout(complete,2100);
  },[complete]);

  const tick=useCallback(function frame(time:number){
    if(phaseRef.current!=="pouring"){raf.current=null;return}
    if(begun.current===null)begun.current=time;
    const progress=Math.min(1,(time-begun.current)/DURATION);
    const eased=1-Math.pow(1-progress,1.36);
    const value=Math.min(TOTAL,Math.floor(TOTAL*eased));
    if(value!==lastTick.current){
      lastTick.current=value;
      setCount(value);
      const index=Math.min(spoken.length-1,Math.floor(progress*spoken.length));
      setActiveNote(index);
      if(value>0&&value%20===0)safeVibrate(8);
    }
    if(progress>=1){grandFinale();return}
    raf.current=requestAnimationFrame(frame);
  },[grandFinale,spoken.length]);

  const begin=()=>{
    if(phaseRef.current!=="waiting")return;
    phaseRef.current="pouring";setPhase("pouring");
    begun.current=null;lastTick.current=-1;
    safeVibrate([10,38,12]);playSound();
    raf.current=requestAnimationFrame(tick);
  };
  const skip=()=>{
    if(phaseRef.current==="complete")return;
    complete();
  };
  useEffect(()=>()=>{
    if(raf.current!==null)cancelAnimationFrame(raf.current);
    if(completionTimer.current!==null)window.clearTimeout(completionTimer.current);
  },[]);

  const active=phase==="pouring"||phase==="final-hug";
  const completed=phase==="complete";
  const visualCount=Math.min(TOTAL,count);
  const uniqueNote=spoken[Math.min(activeNote,spoken.length-1)];
  return <section className={`thi-scene thi-scene-rich thi-bday-hugs ${active?"is-running":""} ${phase==="final-hug"?"is-climax":""} ${completed?"is-complete":""}`}
    aria-label="Un abrazo de todos para vos" data-hugs-phase={phase}>
    <header className="thi-bday-hugs-header">
      <p className="thi-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p className="thi-bday-hugs-subtitle">{subtitle}</p>
    </header>
    <div className="thi-bday-hugs-theatre" aria-label={active?`Llegaron ${visualCount} abrazos`:completed?"Cien abrazos recibidos":"Hay abrazos esperándote"}>
      <div className="thi-bday-hugs-aura" aria-hidden="true"/>
      <div className="thi-bday-hugs-dust" aria-hidden="true">
        {hugs.map((h,i)=><i key={i} style={{"--hg-angle":`${h.angle}deg`,"--hg-delay":h.delay,"--hg-duration":h.duration,"--hg-shift":h.shift,"--hg-size":h.size} as CSSProperties}/>)}
      </div>
      <svg className="thi-bday-hugs-art" viewBox="0 0 360 350" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="bday-hug-core">
            <stop offset="0%" stopColor="#fff3cc" stopOpacity=".89"/>
            <stop offset="15%" stopColor="#ffd39d" stopOpacity=".48"/>
            <stop offset="53%" stopColor="#c87865" stopOpacity=".16"/>
            <stop offset="100%" stopColor="#a86d84" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="bday-hug-silk" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#ab674f" stopOpacity=".05"/>
            <stop offset="37%" stopColor="#f6d39e" stopOpacity=".84"/>
            <stop offset="51%" stopColor="#fff0c7" stopOpacity=".97"/>
            <stop offset="77%" stopColor="#d69a77" stopOpacity=".68"/>
            <stop offset="100%" stopColor="#a66b63" stopOpacity=".03"/>
          </linearGradient>
          <filter id="bday-hug-soft"><feGaussianBlur stdDeviation="7"/></filter>
        </defs>
        <ellipse className="thi-bday-hugs-core" cx="180" cy="174" rx="163" ry="161" fill="url(#bday-hug-core)"/>
        <g className="thi-bday-hugs-ribbon thi-bday-hugs-ribbon-a">
          <path d="M-28 118 C 60 -29 96 257 183 180 C 258 104 279 20 396 99" fill="none" stroke="#f8cb91" strokeWidth="23" strokeOpacity=".2" filter="url(#bday-hug-soft)"/>
          <path d="M-28 118 C 60 -29 96 257 183 180 C 258 104 279 20 396 99" fill="none" stroke="url(#bday-hug-silk)" strokeWidth="6" strokeLinecap="round"/>
          <path d="M-28 110 C 55 -24 104 251 181 171 C 254 111 287 20 396 91" fill="none" stroke="#ffe7ba" strokeWidth="1.3" strokeOpacity=".8"/>
        </g>
        <g className="thi-bday-hugs-ribbon thi-bday-hugs-ribbon-b">
          <path d="M-31 247 C 68 363 88 82 182 158 C 268 235 291 343 397 231" fill="none" stroke="#ebae7f" strokeWidth="26" strokeOpacity=".18" filter="url(#bday-hug-soft)"/>
          <path d="M-31 247 C 68 363 88 82 182 158 C 268 235 291 343 397 231" fill="none" stroke="url(#bday-hug-silk)" strokeWidth="7" strokeLinecap="round"/>
          <path d="M-31 254 C 76 358 92 90 182 166 C 265 241 295 340 397 240" fill="none" stroke="#ffe4b5" strokeWidth="1.2" strokeOpacity=".64"/>
        </g>
        <g className="thi-bday-hugs-ribbon thi-bday-hugs-ribbon-c">
          <path d="M-45 32 C 86 166 124 94 180 165 S 290 271 409 317" fill="none" stroke="url(#bday-hug-silk)" strokeWidth="3.5" strokeLinecap="round" opacity=".7"/>
          <path d="M-47 315 C 73 211 110 234 182 166 S 311 116 404 33" fill="none" stroke="url(#bday-hug-silk)" strokeWidth="3.5" strokeLinecap="round" opacity=".7"/>
        </g>
        <g className="thi-bday-hugs-center-spark">
          <path d="M180 137 C186 161 195 169 218 174 C195 179 186 189 180 214 C174 189 164 179 141 174 C164 169 174 161 180 137Z" fill="#ffe1a9" opacity=".86"/>
        </g>
      </svg>
      <div className="thi-bday-hugs-core-text">
        <span className="thi-bday-hugs-small">{completed?"PARA SIEMPRE":active?"TE ESTÁN ABRAZANDO":"PARA VOS"}</span>
        <strong>{phase==="waiting"?recipient:visualCount}</strong>
        <span className="thi-bday-hugs-number-caption">{phase==="waiting"?"hay mucho cariño esperando":completed?"abrazos, todos tuyos":"abrazos llegando"}</span>
      </div>
      <div className="thi-bday-hugs-flare" aria-hidden="true"/>
    </div>
    <div className="thi-bday-hugs-status">
      {phase==="waiting"?<>
        <p className="thi-bday-hugs-prompt">{prompt}</p>
        <button type="button" className="thi-bday-hugs-main-btn" data-action="begin-hugs" onClick={begin}>Recibir mis abrazos <span aria-hidden="true">♡</span></button>
      </>:phase==="pouring"||phase==="final-hug"?<>
        <div className="thi-bday-hugs-note" aria-live="off">
          <span>{noteLabel}</span><p key={activeNote}>{uniqueNote}</p>
        </div>
        <div className="thi-bday-hugs-progress" role="progressbar" aria-label="Abrazos recibidos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={visualCount}><i style={{width:`${visualCount}%`}}/></div>
        <button type="button" className="thi-bday-hugs-skip" data-action="skip-hugs" onClick={skip}>Recibirlos todos ahora →</button>
      </>:<>
        <div className="thi-bday-hugs-finale" aria-live="polite" data-hugs-complete="true">
          <span>100 ABRAZOS. UNA SOLA COSA QUE DECIRTE.</span>
          <h3>{finaleTitle}</h3>
          <p>{finaleBody}</p>
          <small>{signature}</small>
          <p className="thi-bday-hugs-letter-hint">Y todavía nos queda algo por decirte…</p>
          <button type="button" className="thi-bday-hugs-next" data-action="advance" onClick={onContinue}>{nextLabel} <span aria-hidden="true">→</span></button>
        </div>
      </>}
    </div>
  </section>;
}
