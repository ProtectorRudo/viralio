"use client";
import {useEffect,useRef,useState,type CSSProperties} from "react";
import "./BirthdayVoicesPremium.css";

type Voice={name:string;message:string;url?:string};
type Props={voices:Voice[];heard:number[];status:"idle"|"playing"|"paused";onHeard:(i:number)=>void;onToggle:(text:string)=>void;onStop:()=>void;onNext:()=>void;cta:string};
const waveform=[9,17,13,25,17,10,22,15,30,21,13,26,12,24,18,32,15,24,12,18,26,11,20,30,18,9,20,25,12,16,28,20,13,17,24,12,19,10];
const formatTime=(seconds:number)=>Number.isFinite(seconds)&&seconds>=0?`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}`:"0:00";

export default function BirthdayVoices({voices,heard,status,onHeard,onToggle,onStop,onNext,cta}:Props){
  const [selected,setSelected]=useState<number|null>(null);
  const [realPlaying,setRealPlaying]=useState(false);
  const [progress,setProgress]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const [durations,setDurations]=useState<Record<number,number>>({});
  const [audioError,setAudioError]=useState<number|null>(null);
  const players=useRef<(HTMLAudioElement|null)[]>([]);
  // Transitions from the tall lantern chapter can retain scroll position,
  // hiding this chapter's heading behind the browser toolbar.
  useEffect(()=>{
    if(typeof window==="undefined")return;
    const reset=()=>window.scrollTo({top:0,left:0,behavior:"instant"});
    const frame=window.requestAnimationFrame(()=>window.requestAnimationFrame(reset));
    const settle=window.setTimeout(reset,440);
    return ()=>{window.cancelAnimationFrame(frame);window.clearTimeout(settle)};
  },[]);

  const playing=selected!==null&&Boolean(voices[selected]?.url)?realPlaying:selected!==null&&status==="playing";

  const toggle=(i:number)=>{
    const voice=voices[i];if(!voice)return;
    if(selected!==i){
      players.current.forEach(player=>player?.pause());
      onStop();
      setSelected(i);
      setRealPlaying(false);
      setProgress(0);
      setElapsed(0);
      setAudioError(null);
    }
    onHeard(i);
    if(!voice.url){onToggle(voice.message);return;}
    const player=players.current[i];if(!player)return;
    if(player.paused){
      setAudioError(null);
      void player.play().catch(()=>{setRealPlaying(false);setAudioError(i)});
    }else player.pause();
  };
  const seek=(index:number,percentage:number)=>{
    const player=players.current[index];
    if(!player||!Number.isFinite(player.duration)||player.duration<=0)return;
    const to=player.duration*percentage/100;
    try{player.currentTime=to;setElapsed(to);setProgress(percentage/100)}catch{}
  };
  const item=selected===null?undefined:voices[selected];
  return <div className="thi-bday-voices thi-bday-voices-premium">
    <div className="thi-bday-voice-ornament" aria-hidden="true"><i/>✦<i/></div>
    <p className="thi-bday-voices-intro">Un regalo también puede tener la voz de quienes te quieren. Podés pausar y volver a escuchar cada mensaje.</p>
    <div className="thi-bday-voices-grid" role="group" aria-label="Mensajes para escuchar">
      {voices.map((v,i)=>{
        const active=selected===i;
        const isPlaying=active&&playing;
        const duration=durations[i]||0;
        const realProgress=active?progress:0;
        const waveBars=waveform.length;
        const hasAudio=Boolean(v.url);
        return <article key={i} className={`thi-bday-voice-tile ${active?"active":""} ${isPlaying?"is-playing":""}`} data-voice-index={i}>
          <div className="thi-bday-voice-inner">
            <span className="thi-bday-voice-icon" aria-hidden="true">♪</span>
            <div className="thi-bday-voice-person">
              <span className="thi-bday-voice-meta">
                <small>MENSAJE {String(i+1).padStart(2,"0")}</small>
                <span className="thi-bday-voice-time">{hasAudio?(duration>0?`${formatTime(active?elapsed:0)} / ${formatTime(duration)}`:"Audio personal"):"Dedicatoria"}</span>
              </span>
              <strong>{v.name}</strong>
              <div className="thi-bday-voice-waveform" role="img" aria-label={hasAudio?"Visualización decorativa de la grabación":"Visualización decorativa de la voz"}>
                {waveform.map((height,k)=><i key={k} className={hasAudio&&realProgress>0&&k/waveBars<=realProgress?"heard":""} style={{height:`${height}px`,animationDelay:`${-k*.047}s`}}/>)}
              </div>
            </div>
            <button type="button" data-action="birthday-voice" className="thi-bday-voice-action"
              aria-label={isPlaying?`Pausar mensaje de ${v.name}`:`Escuchar mensaje de ${v.name}`}
              aria-pressed={isPlaying} onClick={()=>toggle(i)}>
              <span aria-hidden="true">{isPlaying?"Ⅱ":"▶"}</span>
            </button>
          </div>
          {hasAudio&&active&&duration>0&&<div className="thi-bday-voice-seek-row">
            <label className="thi-bday-sr-only" htmlFor={`thi-voice-progress-${i}`}>Posición del audio de {v.name}</label>
            <input id={`thi-voice-progress-${i}`} data-action="birthday-voice-seek"
              type="range" min="0" max="100" step="0.1" value={Math.round(realProgress*1000)/10}
              onChange={event=>seek(i,Number(event.currentTarget.value))}
              style={{"--audio-progress":`${realProgress*100}%`} as CSSProperties}/>
          </div>}
          {active&&audioError===i&&<p className="thi-bday-voice-error" role="alert">Este audio no pudo reproducirse. Probá nuevamente.</p>}
        </article>;
      })}
    </div>
    {voices.map((v,i)=>v.url?<audio key={i}
      ref={node=>{players.current[i]=node}}
      src={v.url} preload="metadata" className="thi-bday-hidden-audio"
      onLoadedMetadata={event=>{const d=event.currentTarget.duration;if(Number.isFinite(d)&&d>0)setDurations(old=>({...old,[i]:d}))}}
      onDurationChange={event=>{const d=event.currentTarget.duration;if(Number.isFinite(d)&&d>0)setDurations(old=>({...old,[i]:d}))}}
      onPlay={()=>{setSelected(i);setRealPlaying(true);setAudioError(null)}}
      onPause={()=>{setRealPlaying(false)}}
      onEnded={()=>{setRealPlaying(false);setProgress(1);if(Number.isFinite(players.current[i]?.duration))setElapsed(players.current[i]?.duration||0)}}
      onTimeUpdate={event=>{const a=event.currentTarget;if(selected===i){setElapsed(a.currentTime);setProgress(a.duration>0?Math.min(1,a.currentTime/a.duration):0)}}}
    />:null)}
    {item&&!item.url&&<div className="thi-bday-voice-player" aria-live="polite">
      <span>{playing?"ESCUCHANDO UNA DEDICATORIA":status==="paused"?"MENSAJE EN PAUSA":"PARA VOLVER A ESCUCHAR"}</span>
      <p>“{item.message}”</p>
      <button data-action="birthday-voice-toggle" type="button" onClick={()=>toggle(selected!)}>{playing?"Ⅱ Pausar":"▶ Volver a escuchar"}</button>
    </div>}
    {item?.url&&<div className="thi-bday-voice-player thi-bday-voice-player-compact" aria-live="polite">
      <span>{playing?"REPRODUCIENDO GRABACIÓN":audioError===selected?"NO SE PUDO REPRODUCIR":"PODÉS VOLVER A ESCUCHAR"}</span>
      <button data-action="birthday-voice-toggle" type="button" onClick={()=>toggle(selected!)}>{playing?"Ⅱ Pausar":"▶ Reproducir"}</button>
    </div>}

    <div className="thi-bday-voice-footer">
      <p className="thi-bday-voice-footer-hint">{heard.length>0
        ?"Este momento queda guardado. ¿Seguimos?"
        :"Escuchá las voces a tu ritmo, o seguí cuando quieras."}</p>
      <button type="button" data-action="advance" className="thi-bday-voice-next" onClick={()=>{
        players.current.forEach(player=>player?.pause());onStop();onNext();
      }}><span>{cta.replace(/\\s*[→➜]\\s*$/,"")}</span><span aria-hidden="true">→</span></button>
      <a className="thi-bday-voice-inline-cta" href="/tehiceesto/crear?experiencia=cumpleanos"><span aria-hidden="true">♥</span> Quiero el mío</a>
    </div>
  </div>;
}
