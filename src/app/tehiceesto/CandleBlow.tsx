"use client";
import { useEffect,useRef,useState } from "react";
export default function CandleBlow({blown,onBlow,labels}:{blown:boolean;onBlow:()=>void;labels:{idle:string;active:string;fallback:string;unavailable:string}}){
  const [listening,setListening]=useState(false);const [unavailable,setUnavailable]=useState(false);const cleanupRef=useRef<(()=>void)|null>(null);
  useEffect(()=>()=>cleanupRef.current?.(),[]);
  async function listenForBlow(){
    if(blown||listening)return;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const AudioContextClass=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
      if(!AudioContextClass)throw new Error("audio_context_unavailable");
      const context=new AudioContextClass();const source=context.createMediaStreamSource(stream);const analyser=context.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.55;source.connect(analyser);
      const values=new Uint8Array(analyser.fftSize);let frame=0,sustained=0;setListening(true);
      const cleanup=()=>{cancelAnimationFrame(frame);stream.getTracks().forEach(track=>track.stop());void context.close();setListening(false)};cleanupRef.current=cleanup;
      const tick=()=>{analyser.getByteTimeDomainData(values);let sum=0;for(const value of values){const normalized=(value-128)/128;sum+=normalized*normalized}const rms=Math.sqrt(sum/values.length);if(rms>.12)sustained+=1;else sustained=Math.max(0,sustained-1);if(sustained>=4){cleanup();cleanupRef.current=null;onBlow();return}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);
    }catch{setUnavailable(true);setListening(false)}
  }
  return <div className="thi-blow-controls">
    {!blown&&<button data-action="blow-mic" type="button" className={`thi-primary thi-blow-mic ${listening?"listening":""}`} onClick={listenForBlow}><span>{listening?labels.active:labels.idle}</span><i>{listening?"◉":"♩"}</i></button>}
    {!blown&&<button data-action="blow-fallback" type="button" className="thi-blow-fallback" onClick={onBlow}>{unavailable?labels.unavailable:labels.fallback}</button>}
  </div>;
}
