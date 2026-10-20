"use client";

import {useCallback,useEffect,useRef,useState,type CSSProperties} from "react";
import "./BirthdayHugsScene.css";

type Props={
  kicker:string;
  title:string;
  subtitle:string;
  callouts:string[];
  closing:string;
  finale:string;
  readyLabel:string;
  moreLabel:string;
  continueLabel:string;
  onBurst:()=>void;
  onComplete:()=>void;
  onContinue:()=>void;
};

const ribbons=[
  {id:"a",path:"M -120 120 C 120 165, 160 395, 385 405 S 615 285, 1030 150"},
  {id:"b",path:"M -110 325 C 155 255, 230 540, 422 460 S 670 260, 1050 430"},
  {id:"c",path:"M -110 515 C 150 675, 245 300, 450 397 S 695 690, 1030 570"},
  {id:"d",path:"M -70 720 C 220 660, 235 445, 448 474 S 745 665, 1050 810"},
  {id:"e",path:"M 975 75 C 790 260, 690 315, 505 365 S 265 475, -135 265"},
  {id:"f",path:"M 960 680 C 750 510, 700 575, 512 490 S 280 340, -95 680"},
  {id:"g",path:"M 1055 325 C 840 475, 648 260, 477 380 S 255 625, -155 510"},
  {id:"h",path:"M 1050 560 C 830 400, 712 680, 515 479 S 230 265, -145 90"},
] as const;

const specks=Array.from({length:48},(_,i)=>{
  const x=(i*127+37)%900, y=(i*189+41)%760;
  return {id:i,x,y,delay:`${(i%13)*-.29}s`,size:i%5===0?3.3:i%3===0?2.5:1.4};
});

export default function BirthdayHugsScene({
 kicker,title,subtitle,callouts,closing,finale,
 readyLabel,moreLabel,continueLabel,onBurst,onComplete,onContinue
}:Props){
  const [started,setStarted]=useState(false);
  const [count,setCount]=useState(0);
  const [complete,setComplete]=useState(false);
  const completedRef=useRef(false);
  const completedCallback=useRef(onComplete);
  const pulseCallback=useRef(onBurst);
  useEffect(()=>{completedCallback.current=onComplete;pulseCallback.current=onBurst},[onComplete,onBurst]);
  // A browser view transition may preserve the scroll of the tall wish chapter.
  // Align the hug chapter at its own header when the scene mounts.
  useEffect(()=>{
    const reset=()=>window.scrollTo({top:0,left:0,behavior:"instant"});
    const initial=window.requestAnimationFrame(reset);
    const settled=window.setTimeout(reset,430);
    return ()=>{window.cancelAnimationFrame(initial);window.clearTimeout(settled)};
  },[]);


  const finish=useCallback(()=>{
    if(completedRef.current)return;
    completedRef.current=true;
    setCount(100);
    setComplete(true);
    completedCallback.current();
  },[]);

  const embrace=useCallback(()=>{
    pulseCallback.current();
    setStarted(true);
    setCount(previous=>Math.min(100,previous+(previous===0?9:15)));
  },[]);

  useEffect(()=>{
    if(!started||complete)return;
    const timer=window.setInterval(()=>{
      setCount(previous=>Math.min(100,previous+2));
    },210);
    return ()=>window.clearInterval(timer);
  },[started,complete]);

  useEffect(()=>{
    if(count>=100&&!completedRef.current)finish();
  },[count,finish]);

  const percent=Math.min(100,count);
  const level=complete?5:count>=76?4:count>=51?3:count>=26?2:count>0?1:0;
  const principal=callouts.slice(0,5);
  const displayCallouts=principal.length>=5?principal:[
    ...principal,
    ...["Un abrazo enorme para vos.","Otro más, porque nunca alcanzan.","Y todos los que todavía faltan.","Siempre cerca, incluso desde lejos.","Que se multipliquen siempre."].slice(0,5-principal.length)
  ];
  const stageStyles={"--hug-power":(percent/100).toFixed(3)} as CSSProperties;

  return <section className={`thi-scene thi-bday-hugs ${started?"is-receiving":""} ${complete?"is-complete":""}`}
    data-hugs-count={count} data-hugs-complete={complete?"true":"false"} style={stageStyles}>
    <header className="thi-bday-hugs-heading">
      <p className="thi-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p className="thi-bday-hugs-subtitle">{subtitle}</p>
    </header>

    <div className="thi-bday-hugs-theatre" aria-label={complete?"Llegaron cien abrazos llenos de cariño":"Abrazos de luz acercándose desde todos lados"}>
      <div className="thi-bday-hugs-depth" aria-hidden="true"/>
      <svg className="thi-bday-hugs-art" viewBox="0 0 900 760" role="img" aria-label="Cintas de luz champagne y rosa que envuelven una esfera dorada">
        <defs>
          <linearGradient id="thiHugSatin" x1="0%" y1="0%" x2="100%" y2="30%">
            <stop offset="0%" stopColor="#945a74" stopOpacity=".02"/>
            <stop offset="23%" stopColor="#b88598" stopOpacity=".57"/>
            <stop offset="48%" stopColor="#fff0c8" stopOpacity=".94"/>
            <stop offset="67%" stopColor="#e5ac8c" stopOpacity=".79"/>
            <stop offset="100%" stopColor="#825170" stopOpacity=".03"/>
          </linearGradient>
          <linearGradient id="thiHugBlush" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#935875" stopOpacity=".04"/>
            <stop offset="38%" stopColor="#f0bba8" stopOpacity=".66"/>
            <stop offset="58%" stopColor="#ffe9bd" stopOpacity=".98"/>
            <stop offset="100%" stopColor="#b6747f" stopOpacity=".02"/>
          </linearGradient>
          <radialGradient id="thiHugHeart">
            <stop offset="0%" stopColor="#fff8de" stopOpacity="1"/>
            <stop offset="21%" stopColor="#ffe4ae" stopOpacity=".95"/>
            <stop offset="49%" stopColor="#e9aa75" stopOpacity=".60"/>
            <stop offset="79%" stopColor="#b96c69" stopOpacity=".17"/>
            <stop offset="100%" stopColor="#8f496e" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="thiHugHalo">
            <stop offset="0%" stopColor="#f5bd85" stopOpacity=".50"/>
            <stop offset="55%" stopColor="#cb806e" stopOpacity=".18"/>
            <stop offset="100%" stopColor="#8b536e" stopOpacity="0"/>
          </radialGradient>
          <filter id="thiHugGlow" x="-75%" y="-75%" width="250%" height="250%">
            <feGaussianBlur stdDeviation="12"/>
          </filter>
          <filter id="thiHugSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5"/>
          </filter>
        </defs>
        <ellipse className="thi-bday-hugs-outer-glow" cx="454" cy="404" rx="350" ry="326" fill="url(#thiHugHalo)"/>
        <circle className="thi-bday-hugs-light-orb" cx="453" cy="408" r="175" fill="url(#thiHugHeart)"/>
        <g className="thi-bday-hugs-ribbons" fill="none" strokeLinecap="round">
          {ribbons.map((r,i)=><g className="thi-bday-hugs-ribbon" key={r.id}
            style={{"--ribbon-index":i,"--ribbon-delay":`${i*-.44}s`} as CSSProperties}>
            <path d={r.path} stroke={i%2?"url(#thiHugBlush)":"url(#thiHugSatin)"} strokeWidth={i%3===0?79:56}
              opacity={i%3===0?".33":".44"} filter="url(#thiHugGlow)"/>
            <path d={r.path} stroke={i%2?"url(#thiHugBlush)":"url(#thiHugSatin)"} strokeWidth={i%3===0?49:33} opacity=".72"/>
            <path d={r.path} stroke="#ffdbac" strokeWidth={i%2===0?"2.5":"1.5"} opacity=".57" filter="url(#thiHugSoftGlow)"/>
          </g>)}
        </g>
        <circle className="thi-bday-hugs-inner-orb" cx="452" cy="406" r="118" fill="url(#thiHugHeart)"/>
        <g className="thi-bday-hugs-particles" aria-hidden="true">
          {specks.map(p=><circle key={p.id} cx={p.x} cy={p.y} r={p.size} fill="#ffe2ad"
            style={{"--spark-delay":p.delay} as CSSProperties}/>)}
        </g>
        <g className="thi-bday-hugs-encircle" fill="none">
          <ellipse cx="451" cy="407" rx="242" ry="160" transform="rotate(-19 451 407)" stroke="#f9c488" strokeWidth="1.4" opacity=".32"/>
          <ellipse cx="451" cy="407" rx="223" ry="210" transform="rotate(26 451 407)" stroke="#f5b989" strokeWidth=".7" opacity=".23"/>
        </g>
      </svg>
      <div className="thi-bday-hugs-message-cloud">
        {displayCallouts.map((msg,index)=><span key={index}
          className={`thi-bday-hugs-callout thi-bday-hugs-callout-${index+1} ${started&&level>=Math.min(index+1,4)?"appeared":""}`}>
          {msg}
        </span>)}
      </div>
      <div className="thi-bday-hugs-center-badge" aria-live="polite">
        <span>{count===0?"♡":complete?"∞":count}</span>
        <small>{count===0?"Para vos":"ABRAZOS"}</small>
      </div>
    </div>

    <div className="thi-bday-hugs-footer">
      {complete?<div className="thi-bday-hugs-finale" aria-live="polite">
        <p className="thi-bday-hugs-finale-kicker">TE LOS MANDAMOS TODOS</p>
        <p className="thi-bday-hugs-finale-text">{finale}</p>
        <small>Y todavía nos queda algo por decirte…</small>
      </div>:<>
        <p className="thi-bday-hugs-closing">{closing}</p>
        {started&&<div className="thi-bday-hugs-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={count} aria-label="Abrazos recibidos">
          <span style={{width:`${count}%`}}/>
        </div>}
        <button type="button" data-action="receive-hugs" className="thi-bday-hugs-receive"
          onClick={embrace}><span aria-hidden="true">♡</span>{started?moreLabel:readyLabel}</button>
        {started&&<button type="button" data-action="finish-hugs" className="thi-bday-hugs-skip"
          onClick={finish}>Recibir todos los abrazos</button>}
      </>}
      {complete&&<button type="button" data-action="advance" className="thi-bday-hugs-continue"
        onClick={onContinue}> {continueLabel.replace(/\s*[→➜]\s*$/,"")} <span aria-hidden="true">→</span></button>}
    </div>
  </section>;
}
