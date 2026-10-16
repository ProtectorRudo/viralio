"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./PairVoicePremium.css";

type VoiceTrack = { src: string; name: string };
type Props = {
  kicker: string; title: string[]; tracks: VoiceTrack[];
  noteLabel: string; playLabel: string; cta: string; heard: number[];
  onHeard: (index:number)=>void;
  onSoundStart: ()=>void; onSoundStop: ()=>void; onContinue: ()=>void;
};

const fmt = (seconds:number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const n=Math.floor(seconds);
  return Math.floor(n/60)+":"+String(n%60).padStart(2,"0");
};
const heights=Array.from({length:37},(_,i)=>
  14+Math.round(47*(Math.abs(Math.sin(i*1.71)*Math.cos(i*.43))*.64+Math.abs(Math.sin(i*.67+.9))*.36))
);

export default function PairVoicePremium({
  kicker,title,tracks,noteLabel,playLabel,cta,heard,onHeard,onSoundStart,onSoundStop,onContinue
}:Props) {
  const [selected,setSelected]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [currentTime,setCurrentTime]=useState(0);
  const [duration,setDuration]=useState(0);
  const [error,setError]=useState(false);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const stopRef=useRef(onSoundStop);
  useEffect(()=>{stopRef.current=onSoundStop},[onSoundStop]);
  useEffect(()=>{
    const audio=audioRef.current;
    return ()=>{audio?.pause();stopRef.current()};
  },[]);
  const active=tracks[selected]||tracks[0];
  const playable=Boolean(active?.src);
  const progress=duration>0?Math.max(0,Math.min(1,currentTime/duration)):0;
  const trackName=active?.name||"Tu voz";

  const toggle=async()=>{
    const audio=audioRef.current;if(!audio||!playable)return;
    if(!audio.paused){audio.pause();return}
    if(audio.ended)audio.currentTime=0;
    setError(false);
    try {await audio.play()} catch {setPlaying(false);setError(true);onSoundStop()}
  };
  const choose=(i:number)=>{
    if(i===selected)return;
    audioRef.current?.pause();
    setSelected(i);setPlaying(false);setCurrentTime(0);setDuration(0);setError(false);
  };
  const seek=(value:number)=>{
    const audio=audioRef.current;
    if(!audio||!Number.isFinite(audio.duration)||audio.duration<=0)return;
    const time=Math.min(100,Math.max(0,value))/100*audio.duration;
    audio.currentTime=time;setCurrentTime(time);
  };
  return (
    <section className={"thi-scene thi-scene-voices pair-voice-premium"+(playing?" is-playing":"")} data-pair-voice="premium-v1">
      <div className="pvp-atmosphere" aria-hidden="true"><i/><i/><i/><i/></div>
      <div className="pvp-layout">
        <header className="pvp-header">
          <p className="pvp-eyebrow">{kicker}</p>
          <h2>{title.map((line,i)=><span key={i}>{line}</span>)}</h2>
        </header>
        <div className="pvp-player">
          <span className="pvp-edge-light" aria-hidden="true"/>
          <div className="pvp-card-top">
            <div className="pvp-avatar" aria-hidden="true">{trackName.trim().charAt(0).toUpperCase()||"♡"}</div>
            <div className="pvp-track-heading">
              <p>{noteLabel.replace("{name}",trackName)}</p>
              <h3>{playLabel}</h3>
            </div>
            <button className="pvp-play" data-action="demo-voice" type="button" onClick={toggle}
              aria-label={playing?"Pausar esta voz":"Reproducir esta voz"} aria-pressed={playing} disabled={!playable}>
              {playing
                ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none"/></svg>
                : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5 20 12 8 19.5z" fill="currentColor"/></svg>}
            </button>
          </div>
          <div className="pvp-sound-bars" role="img" aria-label={playing?"La voz se está reproduciendo":"Forma de onda de la nota de voz"}>
            {heights.map((h,i)=><i key={i} className={progress>i/heights.length?"has-played":""}
              style={{"--bar-h":String(h)+"%","--bar-i":i} as CSSProperties}/>)}
          </div>
          <div className="pvp-seek">
            <span className="pvp-time pvp-elapsed">{fmt(currentTime)}</span>
            <input data-action="voice-seek" aria-label="Posición del audio" type="range"
              min={0} max={100} step={.1} value={Math.round(progress*1000)/10}
              onChange={event=>seek(Number(event.target.value))}
              disabled={!duration||!playable}
              style={{"--voice-progress":String(progress*100)+"%"} as CSSProperties}/>
            <span className="pvp-time pvp-duration">{duration>0?fmt(duration):"–:––"}</span>
          </div>
          <audio key={active?.src||"no-voice"} ref={audioRef} data-action="real-audio"
            src={active?.src} preload="metadata"
            onLoadedMetadata={e=>{const n=e.currentTarget.duration;if(Number.isFinite(n)&&n>0)setDuration(n)}}
            onDurationChange={e=>{const n=e.currentTarget.duration;if(Number.isFinite(n)&&n>0)setDuration(n)}}
            onTimeUpdate={e=>setCurrentTime(e.currentTarget.currentTime)}
            onPlay={()=>{setPlaying(true);setError(false);onHeard(selected);onSoundStart()}}
            onPause={()=>{setPlaying(false);onSoundStop()}}
            onEnded={()=>{setPlaying(false);setCurrentTime(audioRef.current?.duration||0);onSoundStop()}}
            onError={()=>{setPlaying(false);setError(true);onSoundStop()}}
          />
          {error&&<p role="alert" className="pvp-error">No se pudo reproducir este audio. Tocá para intentar de nuevo.</p>}
        </div>
        {tracks.length>1&&<div className="pvp-multiple" aria-label="Elegí una nota de voz">
          {tracks.map((track,i)=><button key={track.src+"-"+i} type="button" onClick={()=>choose(i)}
            className={selected===i?"active":""} aria-pressed={selected===i}>
            {track.name||"Voz "+(i+1)}
          </button>)}
        </div>}
        <button data-action="advance" type="button" className="pvp-keep" disabled={!heard.length}
          onClick={onContinue} aria-label={cta.replace(/\s*→\s*$/,"")}>
          <span>{cta.replace(/\s*→\s*$/,"")}</span><b aria-hidden="true">→</b>
        </button>
      </div>
    </section>
  );
}
