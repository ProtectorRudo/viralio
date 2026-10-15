"use client";

import {useEffect,useRef,useState} from "react";
import {paintTacticalFeed,type ReplayCamera} from "./TacticSimulation";

function Frame({camera,progress,className}:{
 camera:ReplayCamera;progress:number;className?:string
}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext("2d");
  if(ctx&&el)paintTacticalFeed(ctx,camera,progress,el.width,el.height);
 },[camera,progress]);
 return <canvas className={className||"lj-feed"} ref={canvas} width={640} height={380}
  aria-label={"Repetición "+camera+" de la jugada al instante "+Math.round(progress*100)+" por ciento"}/>;
}

export default function TacticalReplay({selection,onSelect}:{
 selection:string;onSelect:(camera:ReplayCamera)=>void
}){
 const [progress,setProgress]=useState(.28);
 const [playing,setPlaying]=useState(true);
 useEffect(()=>{
  if(!playing)return;
  const id=window.setInterval(()=>setProgress(p=>(p+.025)%1),135);
  return()=>window.clearInterval(id);
 },[playing]);
 const cameras=["C1","C2","C3"] as const;
 const active=cameras.includes(selection as ReplayCamera)?selection as ReplayCamera:"C1";
 return <div className="lj-replay-console">
  <div className="lj-feed-top"><span>ANÁLISIS ORIGINAL / MATCH CONTROL 2030</span><span>● REC</span></div>
  <Frame camera={active} progress={progress} className="lj-feed-large"/>
  <div className="lj-replay-transport">
   <button type="button" onClick={()=>setPlaying(p=>!p)} aria-label={playing?"Pausar repetición":"Reproducir repetición"}>{playing?"❚❚":"▶"}</button>
   <button type="button" onClick={()=>{setPlaying(false);setProgress(p=>(p+.025)%1);}} aria-label="Avanzar un cuadro">▹┃</button>
   <input type="range" aria-label="Avanzar por la grabación" min={0} max={100} step={1}
    value={Math.round(progress*100)} onChange={e=>{setPlaying(false);setProgress(Number(e.target.value)/100);}}/>
   <span>{(progress*5.4).toFixed(1)} s / 5.4 s</span>
  </div>
  <div className="lj-replay-cameras" role="group" aria-label="Seleccionar cámara de análisis">
   {cameras.map(camera=><button key={camera} className={active===camera?"is-active":""} type="button"
    aria-pressed={active===camera} onClick={()=>onSelect(camera)}>
    <Frame camera={camera} progress={progress} className="lj-feed-small"/>
    <strong>CÁMARA {camera.slice(1)}</strong>
    <small>Seleccionar toma</small>
   </button>)}
  </div>
  <p className="lj-replay-guidance">Buscá una toma en la que <strong>ninguna pelota salte de posición ni aparezca duplicada</strong>. Pausá, avanzá cuadro por cuadro y seleccioná la grabación auténtica.</p>
 </div>;
}
