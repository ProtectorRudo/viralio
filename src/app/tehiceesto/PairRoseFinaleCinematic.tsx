"use client";
import {useEffect,useLayoutEffect,useRef,useState} from "react";
// Rose stills are rendered from full-resolution local assets with independent frames.

type Stage="bud"|"bloom"|"envelope"|"letter"|"farewell";
type Props={message:string;subtitle:string;lead:string; roseKicker?:string; roseTapLabel?:string; roseTapHint?:string; roseBloomHint?:string; roseEnvelopeHint?:string; roseSaveLabel?:string; roseFarewellKicker?:string; roseFarewellTitle?:string};

function haptic(pattern:number|number[]){
  try{if(typeof navigator!=="undefined" && "vibrate" in navigator)navigator.vibrate(pattern)}catch{}
}
function softChime(){
  // Sound is exclusively initiated by touch; muted/unsupported devices stay silent.
  try{
    const context=new AudioContext();
    const now=context.currentTime;
    for(const [frequency,delay] of [[610,0],[915,.12]]){
      const osc=context.createOscillator();
      const gain=context.createGain();
      osc.type="sine";
      osc.frequency.setValueAtTime(frequency,now+delay);
      osc.frequency.exponentialRampToValueAtTime(frequency*.72,now+delay+.52);
      gain.gain.setValueAtTime(.0001,now+delay);
      gain.gain.exponentialRampToValueAtTime(.018,now+delay+.042);
      gain.gain.exponentialRampToValueAtTime(.0001,now+delay+.56);
      osc.connect(gain);gain.connect(context.destination);
      osc.start(now+delay);osc.stop(now+delay+.59);
    }
    window.setTimeout(()=>void context.close().catch(()=>{}),900);
  }catch{}
}

/** Pair finale model. Only message and subtitle vary from gift to gift. */
export default function PairRoseFinaleCinematic({message,subtitle,lead,roseKicker="Un secretito para vos",roseTapLabel="Tocá la rosa",roseTapHint="Hay algo más para vos",roseBloomHint="Un momento más…",roseEnvelopeHint="Un secreto para vos…",roseSaveLabel="Guardar este instante",roseFarewellKicker="Un final que permanece",roseFarewellTitle="Gracias por llegar hasta acá."}:Props){
  const [stage,setStage]=useState<Stage>("bud");
  const timers=useRef<number[]>([]);
  const started=useRef(false);
  const schedule=(callback:()=>void,ms:number)=>timers.current.push(window.setTimeout(callback,ms));
  useEffect(()=>()=>{for(const t of timers.current)window.clearTimeout(t)},[]);
  // Navigating from the previous letter can preserve its scroll offset on Android.
  // Set the next scene to its actual beginning, even through view transitions.
  useLayoutEffect(()=>{
    const reset=()=>{
      if(typeof window==="undefined")return;
      window.scrollTo(0,0);
      const scrolling=document.scrollingElement;
      if(scrolling)scrolling.scrollTop=0;
      for(const el of document.querySelectorAll<HTMLElement>(".thi-demo-page,.thi-scene-stage")){
        if(el.scrollTop>0)el.scrollTop=0;
      }
    };
    reset();
    const frame=window.requestAnimationFrame(reset);
    const timeout=window.setTimeout(reset,140);
    return()=>{window.cancelAnimationFrame(frame);window.clearTimeout(timeout)};
  },[]);

  const bloom=()=>{
    if(started.current)return;
    started.current=true;
    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??false;
    haptic(15);softChime();
    if(reduced){setStage("letter");return}
    setStage("bloom");
    schedule(()=>{setStage("envelope");haptic([7,30,7])},1600);
    schedule(()=>setStage("letter"),2930);
  };
  const farewell=()=>{
    setStage("farewell");
    haptic(12);
  };
  return <div className="prc-root" data-rose-stage={stage}>
    <div className="prc-stage" aria-label="La última rosa, una sorpresa para vos">
      <div className="prc-glow" aria-hidden="true"/>
      <div className="prc-petals" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div>
      <button
        type="button" className="prc-rose-touch" data-action="rose-open"
        aria-label={stage==="bud"?"Tocá la rosa para descubrir el último mensaje":"La rosa ya reveló su secreto"}
        disabled={stage!=="bud"} onClick={bloom}
      >
        <span className="prc-rose-photograph prc-rose-closed" aria-hidden="true"/>
        <span className="prc-rose-photograph prc-rose-bloom" aria-hidden="true"/>
        <span className="prc-rose-light" aria-hidden="true"/>
      </button>
      <div className="prc-bloom-core" aria-hidden="true"/>
      <div className="prc-secret" aria-hidden={stage!=="envelope"&&stage!=="letter"}>
        <div className="prc-envelope">
          <span className="prc-envelope-flap"/>
          <span className="prc-envelope-seal">♥</span>
        </div>
        <div className="prc-letter">
          <span className="prc-letter-kicker">{roseKicker}</span>
          <strong>{message}</strong>
          <span className="prc-letter-footer">{subtitle}</span>
          <span className="prc-letter-flourish">♥</span>
        </div>
      </div>
    </div>
    {stage==="bud"&&<div className="prc-instruction"><span>{roseTapLabel}</span><small>{roseTapHint}</small></div>}
    {stage==="bloom"&&<div className="prc-instruction prc-instruction-bloom"><span>{roseBloomHint}</span><i aria-hidden="true"/></div>}
    {stage==="envelope"&&<div className="prc-instruction"><span>{roseEnvelopeHint}</span></div>}
    {stage==="letter"&&<div className="prc-letter-action"><p>{lead}</p><button type="button" data-action="rose-farewell" onClick={farewell}>{roseSaveLabel} <span aria-hidden="true">→</span></button></div>}
    {stage==="farewell"&&<div className="prc-farewell" aria-live="polite"><span className="prc-farewell-kicker">{roseFarewellKicker}</span><h3>{roseFarewellTitle}</h3><p>{lead}</p><span className="prc-farewell-heart" aria-hidden="true">♥</span></div>}
  </div>;
}
