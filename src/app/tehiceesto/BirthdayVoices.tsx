"use client";
import {useRef,useState} from "react";
type Voice={name:string;message:string;url?:string};
export default function BirthdayVoices({voices,heard,status,onHeard,onToggle,onStop,onNext,cta}:{voices:Voice[];heard:number[];status:"idle"|"playing"|"paused";onHeard:(i:number)=>void;onToggle:(text:string)=>void;onStop:()=>void;onNext:()=>void;cta:string}){
 const [selected,setSelected]=useState<number|null>(null),[realPlaying,setRealPlaying]=useState(false),[progress,setProgress]=useState(0);
 const players=useRef<(HTMLAudioElement|null)[]>([]);
 const toggle=(i:number)=>{
  const v=voices[i];if(!v)return;
  if(selected!==i){
    players.current.forEach(player=>player?.pause());
    onStop();setSelected(i);setRealPlaying(false);setProgress(0);
  }
  onHeard(i);
  if(!v.url){onToggle(v.message);return}
  const player=players.current[i];if(!player)return;
  if(player.paused)void player.play().catch(()=>setRealPlaying(false));else player.pause();
 };
 const item=selected===null?undefined:voices[selected];
 const livePlaying=item?.url?realPlaying:selected!==null&&status==="playing";
 return <div className="thi-bday-voices">
  <p className="thi-bday-voices-intro">Un regalo también puede tener la voz de quienes te quieren.</p>
  <div className="thi-bday-voices-grid">{voices.map((v,i)=><button type="button" key={i} data-action="birthday-voice" className={`thi-bday-voice-tile ${i===selected?"active":""}`} onClick={()=>toggle(i)}>
    <span className="thi-bday-voice-icon">♪</span>
    <span className="thi-bday-voice-person"><small>MENSAJE {String(i+1).padStart(2,"0")}</small><strong>{v.name}</strong><i aria-hidden="true">{Array.from({length:14},(_,k)=><b key={k} style={{height:6+(k*7)%14}}/>)}</i></span>
    <span className="thi-bday-voice-action">{i===selected&&livePlaying?"Ⅱ":heard.includes(i)?"↻":"▶"}</span>
   </button>)}</div>
   {voices.map((v,i)=>v.url?<audio key={i} ref={node=>{players.current[i]=node}} src={v.url} preload="metadata" className="thi-bday-hidden-audio" onPlay={()=>{setSelected(i);setRealPlaying(true)}} onPause={()=>{if(selected===i)setRealPlaying(false)}} onEnded={()=>{if(selected===i){setRealPlaying(false);setProgress(1)}}} onTimeUpdate={e=>{if(selected===i){const a=e.currentTarget;setProgress(a.duration?Math.min(1,a.currentTime/a.duration):0)}}}/>:null)}
  {item&&<div className="thi-bday-voice-player" aria-live="polite"><span>{livePlaying?"REPRODUCIENDO":"PARA VOLVER A ESCUCHAR"}</span>{item.url?<div className="thi-bday-audio-progress"><i style={{width:`${Math.round(progress*100)}%`}}/></div>:<p>“{item.message}”</p>}<button data-action="birthday-voice-toggle" type="button" onClick={()=>toggle(selected!)}>{livePlaying?"Ⅱ Pausar":"▶ Escuchar de nuevo"}</button></div>}
  {heard.length>0&&<button type="button" data-action="advance" className="thi-bday-voice-next" onClick={()=>{players.current.forEach(player=>player?.pause());onStop();onNext()}}>{cta} →</button>}
 </div>;
}