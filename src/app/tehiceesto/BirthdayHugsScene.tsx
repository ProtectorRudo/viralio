"use client";

import {useCallback,useEffect,useRef,useState,type CSSProperties} from "react";
import "./BirthdayHugsScene.css";

type Props={
  kicker:string;title:string;subtitle:string;callouts:string[];
  closing:string;finale:string;readyLabel:string;moreLabel:string;
  continueLabel:string;onBurst:()=>void;onComplete:()=>void;onContinue:()=>void;
};

const sparks=Array.from({length:26},(_,index)=>({
  x:32+(index*71)%336,
  y:30+(index*97)%300,
  radius:index%5===0?2.2:1.2,
  delay:`${(index%9)*-.34}s`
}));

export default function BirthdayHugsScene({
  kicker,title,subtitle,callouts,closing,finale,
  readyLabel,moreLabel,continueLabel,onBurst,onComplete,onContinue
}:Props){
  const [started,setStarted]=useState(false);
  const [count,setCount]=useState(0);
  const [complete,setComplete]=useState(false);
  const finishedRef=useRef(false);
  const completeRef=useRef(onComplete);
  const burstRef=useRef(onBurst);

  useEffect(()=>{completeRef.current=onComplete;burstRef.current=onBurst},[onComplete,onBurst]);
  const finish=useCallback(()=>{
    if(finishedRef.current)return;
    finishedRef.current=true;
    setCount(100);setComplete(true);
    completeRef.current();
  },[]);
  const embrace=useCallback(()=>{
    if(finishedRef.current)return;
    burstRef.current();
    setStarted(true);
    setCount(previous=>Math.min(100,previous+(previous===0?9:15)));
  },[]);
  useEffect(()=>{
    if(!started||complete)return;
    const timer=window.setInterval(()=>setCount(previous=>Math.min(100,previous+2)),210);
    return ()=>window.clearInterval(timer);
  },[started,complete]);
  useEffect(()=>{
    if(count>=100&&!finishedRef.current)finish();
  },[count,finish]);

  const index=Math.min(Math.max(0,callouts.length-1),Math.floor(Math.max(0,count-1)/24));
  const currentNote=callouts[index]||closing;
  const amount=Math.min(100,count);
  const visualStyle={"--hug-power":(amount/100).toFixed(3)} as CSSProperties;

  return <section className={`thi-scene thi-bday-hugs ${started?"is-receiving":""} ${complete?"is-complete":""}`}
    data-hugs-count={amount} data-hugs-complete={complete?"true":"false"} style={visualStyle}>
    <header className="thi-bday-hugs-heading">
      <p className="thi-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p className="thi-bday-hugs-subtitle">{subtitle}</p>
    </header>

    <div className="thi-bday-hugs-theatre" aria-label="Abrazos de luz rodeando un corazón cálido">
      <div className="thi-bday-hugs-depth" aria-hidden="true"/>
      <svg className="thi-bday-hugs-art" viewBox="0 0 400 350" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="thiHugCenter2026">
            <stop offset="0%" stopColor="#fff4d1" stopOpacity=".95"/>
            <stop offset="18%" stopColor="#ffe2b5" stopOpacity=".68"/>
            <stop offset="50%" stopColor="#eeb585" stopOpacity=".18"/>
            <stop offset="100%" stopColor="#dd9d86" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="thiHugRibbon2026" x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="#b97972" stopOpacity=".04"/>
            <stop offset="22%" stopColor="#edbc9c" stopOpacity=".55"/>
            <stop offset="52%" stopColor="#ffebc3" stopOpacity=".95"/>
            <stop offset="77%" stopColor="#deb08f" stopOpacity=".52"/>
            <stop offset="100%" stopColor="#ac7279" stopOpacity=".04"/>
          </linearGradient>
          <linearGradient id="thiHugRibbonRose2026" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d19391" stopOpacity=".03"/>
            <stop offset="39%" stopColor="#f4d0ad" stopOpacity=".66"/>
            <stop offset="58%" stopColor="#ffe7b9" stopOpacity=".86"/>
            <stop offset="100%" stopColor="#bd7b80" stopOpacity=".04"/>
          </linearGradient>
        </defs>
        <ellipse cx="200" cy="176" rx="150" ry="145" fill="url(#thiHugCenter2026)" className="thi-bday-hugs-light-orb"/>
        <g className="thi-bday-hugs-ribbons" fill="none" strokeLinecap="round">
          <path className="thi-bday-hugs-ribbon ribbon-one" d="M 43 117 C 74 75 109 68 146 108 C 189 155 207 232 281 228 C 313 226 337 204 358 174"
            stroke="url(#thiHugRibbon2026)" strokeWidth="19"/>
          <path className="thi-bday-hugs-ribbon ribbon-two" d="M 355 111 C 320 73 289 76 257 112 C 215 163 199 225 135 233 C 98 236 64 218 43 185"
            stroke="url(#thiHugRibbonRose2026)" strokeWidth="19"/>
          <path className="thi-bday-hugs-ribbon ribbon-three" d="M 70 264 C 114 293 149 297 191 273 C 244 244 271 242 328 266"
            stroke="url(#thiHugRibbon2026)" strokeWidth="10" opacity=".58"/>
          <path className="thi-bday-hugs-ribbon ribbon-four" d="M 74 79 C 110 54 149 56 178 87 C 211 119 236 113 273 81 C 298 61 320 64 334 77"
            stroke="url(#thiHugRibbonRose2026)" strokeWidth="7" opacity=".46"/>
          <path className="thi-bday-hugs-ribbon ribbon-five" d="M 78 151 C 111 99 137 100 168 158 C 197 215 226 231 299 191"
            stroke="#ffe6ba" strokeWidth="1.7" opacity=".63"/>
          <path className="thi-bday-hugs-ribbon ribbon-six" d="M 323 157 C 293 107 266 106 234 165 C 206 217 171 239 111 201"
            stroke="#ffe8c8" strokeWidth="1.5" opacity=".54"/>
          <path className="thi-bday-hugs-ribbon ribbon-seven" d="M 86 278 C 147 307 186 289 231 273 C 255 263 280 266 309 277"
            stroke="#e4ae88" strokeWidth="1.3" opacity=".47"/>
          <path className="thi-bday-hugs-ribbon ribbon-eight" d="M 112 68 C 141 52 171 61 199 89 C 230 60 260 56 289 70"
            stroke="#f3cda7" strokeWidth="1.2" opacity=".4"/>
        </g>
        <g className="thi-bday-hugs-particles">
          {sparks.map(p=><circle key={p.x+"-"+p.y} cx={p.x} cy={p.y} r={p.radius} fill="#ffe5be"
            style={{"--spark-delay":p.delay} as CSSProperties}/>)}
        </g>
      </svg>
      <div className="thi-bday-hugs-center-badge" aria-live="off">
        <span>{amount===0?"♡":amount}</span>
        <small>{amount===0?"PARA VOS":"ABRAZOS"}</small>
      </div>
    </div>

    <div className="thi-bday-hugs-footer">
      {complete?<div className="thi-bday-hugs-finale" aria-live="polite">
        <p className="thi-bday-hugs-finale-kicker">100 ABRAZOS, TODOS PARA VOS</p>
        <p className="thi-bday-hugs-finale-text">{finale}</p>
        <small>Y todavía nos queda algo por decirte…</small>
      </div>:<>
        <p className="thi-bday-hugs-closing">{started?currentNote:closing}</p>
        {started&&<div className="thi-bday-hugs-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={amount} aria-label="Abrazos recibidos">
          <span style={{width:`${amount}%`}}/>
        </div>}
        <button type="button" data-action="receive-hugs" className="thi-bday-hugs-receive"
          onClick={embrace}><span aria-hidden="true">♡</span>{started?moreLabel:readyLabel}</button>
        {started&&<button type="button" data-action="finish-hugs" className="thi-bday-hugs-skip"
          onClick={finish}>Recibir todos los abrazos</button>}
      </>}
      {complete&&<button type="button" data-action="advance" className="thi-bday-hugs-continue"
        onClick={onContinue}>{continueLabel.replace(/\s*[→➜]\s*$/,"")} <span aria-hidden="true">→</span></button>}
    </div>
  </section>;
}
