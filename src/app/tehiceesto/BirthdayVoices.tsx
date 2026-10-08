"use client";
import {useRef,useState} from "react";
type Voice={name:string;message:string;url?:string};
export default function BirthdayVoices({voices,heard,status,onHeard,onToggle,onStop,onNext,cta}:{voices:Voice[];heard:number[];status:"idle"|"playing"|"paused";onHeard:(i:number)=>void;onToggle:(text:string)=>void;onStop:()=>void;onNext:()=>void;cta:string}){
 const [selected,setSelected]=useState<number|null>(null),[playing,setPlaying]=useState(false);
 const audio=useRef<HTMLAudioElement|null>(null);
 const toggle=(i:number)=>{
  const v=voices[i];if(!v)return;
  if(selected!==i){audio.current?.pause();onStop();setSelected(i);setPlaying(false)}
  onHeard(i);
  if(!v.url){onToggle(v.message);return}
  if(selected===i){if(audio.current?.paused)void audio.current.play();else audio.current?.pause()}
 };
 const item=selected===null?undefined:voices[selected];
 const livePlaying=item?.url?playing:selected!==null&&status==="playing";
 return <div className="thi-bday-voices">
  <p className="thi-bday-voices-intro">Un regalo también puede tener la voz de quienes te quieren.</p>
  <div className="thi-bday-voices-grid">{voices.map((v,i)=><button type="button" key={i} data-action="birthday-voice" className={`thi-bday-voice-tile ${i===selected?"active":""}`} onClick={()=>toggle(i)}><span className="thi-bday-voice-icon">♪</span><span className="thi-bday-voice-person"><small>MENSAJE {String(i+1).padStart(2,"0")}</small><strong>{v.name}</strong><i aria-hidden="true">{Array.from({length:14},(_,k)=><b key={k} style={{height:6+(k*7)%14}}/>)}</i></span><span className="thi-bday-voice-action">{i===selected&&livePlaying?"Ⅱ":heard.includes(i)?"↻":"▶"}</span></button>)}</div>
  {item&&<div className="thi-bday-voice-player" aria-live="polite"><span>{livePlaying?"ESCUCHANDO":"PARA VOLVER A ESCUCHAR"}</span>{item.url?<audio ref={audio} key={selected} src={item.url} controls preload="metadata" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/>:<p>“{item.message}”</p>}<button data-action="birthday-voice-toggle" type="button" onClick={()=>toggle(selected!)}>{livePlaying?"Ⅱ Pausar":"▶ Escuchar de nuevo"}</button></div>}
  {heard.length>0&&<button type="button" data-action="advance" className="thi-bday-voice-next" onClick={()=>{audio.current?.pause();onStop();onNext()}}>{cta} →</button>}
 </div>;
}