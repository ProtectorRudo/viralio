"use client";

import { useEffect,useRef,useState,type CSSProperties,type ReactNode } from "react";

/**
 * Pareja / Un día cualquiera con vos
 * Entirely reusable. The room and gestures are a frozen visual model;
 * words and the portrait are the only customizable inputs.
 * No sample portraits appear on private gifts without a real uploaded photo.
 */
export type EverydayCopy={
  kicker:string;
  title:string;
  hint:string;
  moments:string[];
  closing:string;
  cta:string;
};

type Spot=0|1|2;
const SPOTS=[
  {key:"cups",title:"LA MESA",accessible:"Descubrir el momento de las tazas"},
  {key:"window",title:"LA VENTANA",accessible:"Descubrir el momento de la lluvia"},
  {key:"frame",title:"LA FOTO",accessible:"Descubrir el momento del portarretrato"},
] as const;

export default function PairEverydayScene({
  copy,photoUrl,photoPosition="center",onContinue,onTouch,
}:{
  copy:EverydayCopy;
  photoUrl?:string;
  photoPosition?:string;
  onContinue:()=>void;
  onTouch?:()=>void;
}){
  const [opened,setOpened]=useState<Spot[]>([]);
  const [focused,setFocused]=useState<Spot|null>(null);
  const [rainPlaying,setRainPlaying]=useState(false);
  const rainAudioRef=useRef<{context:AudioContext;source:AudioBufferSourceNode}|null>(null);
  const total=SPOTS.length;
  const complete=opened.length===total;

  const stopRain=()=>{
    const current=rainAudioRef.current;
    rainAudioRef.current=null;
    if(current){
      try{current.source.stop()}catch{}
      void current.context.close().catch(()=>{});
    }
    setRainPlaying(false);
  };
  useEffect(()=>()=>{const current=rainAudioRef.current;rainAudioRef.current=null;if(current){try{current.source.stop()}catch{}void current.context.close().catch(()=>{})}},[]);

  const toggleRain=()=>{
    if(rainAudioRef.current){stopRain();return}
    try{
      const context=new AudioContext();
      const length=Math.floor(context.sampleRate*1.9);
      const buffer=context.createBuffer(1,length,context.sampleRate);
      const channel=buffer.getChannelData(0);
      for(let i=0;i<length;i++)channel[i]=(Math.random()*2-1)*.55;
      const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=context.createBiquadFilter();filter.type="lowpass";filter.frequency.value=750;
      const gain=context.createGain();gain.gain.value=.055;
      source.connect(filter);filter.connect(gain);gain.connect(context.destination);
      source.start();
      rainAudioRef.current={context,source};setRainPlaying(true);
      void context.resume().catch(()=>stopRain());
    }catch{setRainPlaying(false)}
  };

  const discover=(index:Spot)=>{
    setFocused(index);
    setOpened(previous=>previous.includes(index)?previous:[...previous,index]);
    onTouch?.();
  };

  const renderSpot=(index:Spot,content:ReactNode)=>(
    <button
      type="button"
      data-action={`everyday-${SPOTS[index].key}`}
      className={`thi-everyday-hotspot thi-everyday-hotspot--${SPOTS[index].key} ${opened.includes(index)?"is-discovered":""} ${focused===index?"is-focused":""}`}
      aria-label={SPOTS[index].accessible}
      aria-pressed={opened.includes(index)}
      onClick={()=>discover(index)}
    >
      {content}
      <span className="thi-everyday-touchmark" aria-hidden="true"><i/> <b>+</b></span>
    </button>
  );

  return <section className="thi-scene thi-pair-everyday" data-everyday-complete={complete?"true":"false"}>
    <div className="thi-everyday-ambient" aria-hidden="true"><i/><i/><i/></div>
    <div className="thi-everyday-heading">
      <p className="thi-kicker">{copy.kicker}</p>
      <h2>{copy.title}</h2>
      <p className="thi-everyday-hint">{copy.hint}</p>
    </div>

    <div className={`thi-everyday-room ${complete?"is-complete":""}`} aria-label="Una habitación cálida con lluvia, dos tazas y un recuerdo">
      <div className="thi-everyday-ceiling" aria-hidden="true"/>
      <div className="thi-everyday-wallglow" aria-hidden="true"/>
      <div className="thi-everyday-baseboard" aria-hidden="true"/>
      <div className="thi-everyday-lamp" aria-hidden="true"><i/><b/><span/></div>
      <div className="thi-everyday-table" aria-hidden="true"><i/><b/></div>
      <div className="thi-everyday-dust" aria-hidden="true">{Array.from({length:13},(_,i)=><i key={i} style={{"--j":i} as CSSProperties}/>)}</div>

      {renderSpot(1,
        <span className="thi-everyday-window" aria-hidden="true">
          <span className="thi-everyday-sky"><i/><i/><i/><i/><b/></span>
          <span className="thi-everyday-rain">
            {Array.from({length:19},(_,i)=><i key={i} style={{"--drop-x":`${7+(i*37+13)%87}%`,"--drop-delay":`${(i*-.21).toFixed(2)}s`,"--drop-speed":`${(1.05+(i%5)*.26).toFixed(2)}s`} as CSSProperties}/>)}
          </span>
          <span className="thi-everyday-window-cross"/>
          <span className="thi-everyday-curtain left"/>
          <span className="thi-everyday-curtain right"/>
          <span className="thi-everyday-sill"/>
        </span>
      )}

      {renderSpot(0,
        <span className="thi-everyday-cupset" aria-hidden="true">
          <span className="thi-everyday-cup cup-one"><i className="thi-everyday-steam"/><b/></span>
          <span className="thi-everyday-cup cup-two"><i className="thi-everyday-steam"/><b/></span>
          <span className="thi-everyday-cupsaucer"/>
        </span>
      )}

      {renderSpot(2,
        <span className="thi-everyday-photo" aria-hidden="true">
          <span className="thi-everyday-photo-border">
            {photoUrl
              ? <img src={photoUrl} alt="" draggable={false} style={{objectPosition:photoPosition}}/>
              : <span className="thi-everyday-photo-art"><i/><b>♥</b><i/></span>}
          </span>
          <span className="thi-everyday-photo-base"/>
        </span>
      )}

      <div className="thi-everyday-room-vignette" aria-hidden="true"/>
      <div className="thi-everyday-room-caption" aria-hidden="true">LOS DÍAS QUE TAMBIÉN SON NUESTROS</div>
    </div>

    <div className={`thi-everyday-story ${complete?"is-finale":""}`} aria-live="polite" aria-atomic="true">
      {complete
        ? <div className="thi-everyday-ending" key="ending"><small>Y AL FINAL, ES ESTO</small><p>{copy.closing}</p><span className="thi-everyday-ending-rule" aria-hidden="true">✦</span></div>
        : focused!==null
          ? <div className="thi-everyday-message" key={focused}><small>{String(opened.length).padStart(2,"0")} / 03 · {SPOTS[focused].title}</small><p>{copy.moments[focused]||""}</p></div>
          : <div className="thi-everyday-empty"><span>✧</span><p>Elegí un detalle de este lugar.</p></div>}
    </div>

    <div className="thi-everyday-footer">
      <div className="thi-everyday-discovery" aria-label={`${opened.length} de 3 momentos descubiertos`}>
        {SPOTS.map((spot,i)=><i key={spot.key} className={opened.includes(i as Spot)?"is-lit":""}/>)}
      </div>
      <button type="button" className={`thi-everyday-rain-toggle ${rainPlaying?"is-on":""}`} aria-pressed={rainPlaying} onClick={toggleRain}>
        <span aria-hidden="true">{rainPlaying?"♫":"♩"}</span>{rainPlaying?"Pausar lluvia":"Escuchar la lluvia"}
      </button>
    </div>
    {complete&&<button type="button" data-action="advance" className="thi-everyday-continue" onClick={()=>{stopRain();onContinue()}}>
      {copy.cta}<span aria-hidden="true">→</span>
    </button>}
  </section>;
}
