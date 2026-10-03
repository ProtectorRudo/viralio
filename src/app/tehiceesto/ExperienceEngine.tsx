"use client";

import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { flushSync } from "react-dom";
import type { Experience, SceneType } from "./data";
import ScratchReveal from "./ScratchReveal";
import CandleBlow from "./CandleBlow";
import LightReveal from "./LightReveal";
import HoldReveal from "./HoldReveal";
import { premiumMoments } from "./premiumMoments";

export type ThiPhoto = { url:string; caption?:string; fit?:"cover"|"contain"; position?:"center"|"top"|"bottom"|"left"|"right" };
export type ThiAudio = { url:string; caption?:string };
export type ThiVideo = { url:string; caption?:string };

const sceneLabels: Record<SceneType,string> = {
  intro:"Comienzo", door:"Puerta", memories:"Recuerdos", stars:"Estrellas",
  scratch:"Sorpresa", letter:"Carta", finale:"Final", candles:"Deseo",
  balloons:"Mensajes", timeline:"Historia", voices:"Voces", quiz:"Pregunta",
  vault:"Bóveda", capsule:"Futuro", proposal:"La pregunta", video:"Video",
  light:"Instante", hold:"Promesa",
};

export default function ExperienceEngine({
  experience,
  letterText,
  photoMedia,
  audioMedia,
  videoMedia,
}: {
  experience: Experience;
  letterText?: string;
  photoMedia?: ThiPhoto[];
  audioMedia?: ThiAudio[];
  videoMedia?: ThiVideo[];
}) {
  const [sceneIndex,setSceneIndex]=useState(0);
  const [runId,setRunId]=useState(0);
  const [transitioning,setTransitioning]=useState(false);
  const [direction,setDirection]=useState<"forward"|"back">("forward");
  const [stars,setStars]=useState<number[]>([]);
  const [letterOpen,setLetterOpen]=useState(false);
  const [scratched,setScratched]=useState(false);
  const [candlesOut,setCandlesOut]=useState(false);
  const [popped,setPopped]=useState<number[]>([]);
  const [quizChoice,setQuizChoice]=useState<number|null>(null);
  const [vaultOpen,setVaultOpen]=useState(false);
  const [capsuleOpen,setCapsuleOpen]=useState(false);
  const [voicesPlayed,setVoicesPlayed]=useState<number[]>([]);
  const [doorOpen,setDoorOpen]=useState(false);
  const [lightRevealed,setLightRevealed]=useState(false);
  const [holdRevealed,setHoldRevealed]=useState(false);

  const scenes=experience.recipe;
  const current=scenes[sceneIndex];
  const total=scenes.length;
  const progress=((sceneIndex+1)/total)*100;

  const defaultMemories=[
    "Ese día todavía no sabíamos todo lo que iba a venir.",
    "Los mejores recuerdos casi nunca avisan que van a ser importantes.",
    "Sin darnos cuenta, empezamos a coleccionar un mundo propio.",
  ];
  const demo=experience.demo;
  const premiumMoment=premiumMoments[experience.slug] || premiumMoments.pareja;
  const memoryLines=demo.memories?.length ? demo.memories : defaultMemories;
  const starLines=demo.stars?.length ? demo.stars : [
    "Tu forma de hacer hogar.",
    "Cómo te reís cuando te olvidás de cuidarte.",
    "La calma que traés sin darte cuenta.",
    "Todo lo que todavía soñamos.",
    "Que te volvería a elegir.",
  ];
  const balloonLines=demo.balloons?.length ? demo.balloons : [
    "Te queremos","Tu risa","Hoy mandás vos","Una salida","Un abrazo","Nunca cambies",
  ];
  const timelineEntries=demo.timeline?.length ? demo.timeline : [
    {title:"El comienzo",body:"Cuando todavía no sabíamos en qué se iba a convertir todo esto."},
    {title:"Ese día",body:"Uno de esos momentos que después entendemos que fueron gigantes."},
    {title:"Hoy",body:"La historia sigue. Y eso es lo mejor."},
  ];
  const voiceEntries=demo.voices?.length ? demo.voices : [
    {name:"Mamá",message:"Te quiero muchísimo. Gracias por estar siempre."},
    {name:"Tomás",message:"Hay personas que hacen más lindos los días sin darse cuenta."},
    {name:"Caro",message:"Gracias por todas las veces que estuviste."},
    {name:"Fran",message:"Esto es sólo una pequeña forma de decirte cuánto importás."},
  ];
  const quizData=demo.quiz || {
    question:"¿Dónde empezó esta historia?",
    answers:["En un mensaje","En una salida que casi se cancela","En un lugar que ya no existe"],
    correctIndex:1,
    after:"La respuesta importa menos que todo lo que vino después.",
  };
  const displayPhotos = photoMedia && photoMedia.length ? photoMedia.slice(0,8) : [];

  const resetAllInteractions=()=>{
    setStars([]);
    setLetterOpen(false);
    setScratched(false);
    setCandlesOut(false);
    setPopped([]);
    setQuizChoice(null);
    setVaultOpen(false);
    setCapsuleOpen(false);
    setVoicesPlayed([]);
    setDoorOpen(false);
    setLightRevealed(false);
    setHoldRevealed(false);
  };

  const resetSceneState=(type:SceneType)=>{
    if(type==="stars") setStars([]);
    if(type==="letter") setLetterOpen(false);
    if(type==="scratch") setScratched(false);
    if(type==="candles") setCandlesOut(false);
    if(type==="balloons") setPopped([]);
    if(type==="quiz") setQuizChoice(null);
    if(type==="vault") setVaultOpen(false);
    if(type==="capsule") setCapsuleOpen(false);
    if(type==="voices") setVoicesPlayed([]);
    if(type==="door") setDoorOpen(false);
    if(type==="light") setLightRevealed(false);
    if(type==="hold") setHoldRevealed(false);
  };

  const restart=()=>{
    resetAllInteractions();
    setDirection("back");
    setTransitioning(false);
    setSceneIndex(0);
    setRunId((value)=>value+1);
    haptic([8,22,8]);
  };

  const haptic=(pattern:number|number[]=10)=>{
    if(typeof navigator!=="undefined"&&"vibrate" in navigator){
      navigator.vibrate(pattern);
    }
  };

  const playDemoVoice=(message:string)=>{
    try{
      if(typeof window==="undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(message);
      utterance.lang="es-AR";
      utterance.rate=.92;
      utterance.pitch=.9;
      const voices=window.speechSynthesis.getVoices();
      const preferred=voices.find((voice)=>voice.lang.toLowerCase().startsWith("es-ar"))
        || voices.find((voice)=>voice.lang.toLowerCase().startsWith("es"));
      if(preferred) utterance.voice=preferred;
      window.speechSynthesis.speak(utterance);
    }catch{}
  };

  const playFx=(kind:"chime"|"pop"|"door"|"seal"|"unlock")=>{
    try{
      const context=new AudioContext();
      const oscillator=context.createOscillator();
      const gain=context.createGain();
      const now=context.currentTime;
      oscillator.connect(gain);
      gain.connect(context.destination);

      const presets={
        chime:{type:"sine" as OscillatorType,start:760,end:1180,duration:.34,volume:.035},
        pop:{type:"triangle" as OscillatorType,start:240,end:72,duration:.12,volume:.05},
        door:{type:"sine" as OscillatorType,start:95,end:48,duration:.42,volume:.035},
        seal:{type:"triangle" as OscillatorType,start:330,end:180,duration:.18,volume:.035},
        unlock:{type:"sine" as OscillatorType,start:420,end:820,duration:.42,volume:.035},
      };
      const preset=presets[kind];
      oscillator.type=preset.type;
      oscillator.frequency.setValueAtTime(preset.start,now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1,preset.end),now+preset.duration);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(preset.volume,now+.02);
      gain.gain.exponentialRampToValueAtTime(.0001,now+preset.duration);
      oscillator.start(now);
      oscillator.stop(now+preset.duration+.02);
      window.setTimeout(()=>void context.close(),Math.ceil((preset.duration+.1)*1000));
    }catch{}
  };

  const moveTo=(nextIndex:number,dir:"forward"|"back")=>{
    if(nextIndex<0||nextIndex>=total||nextIndex===sceneIndex) return;
    const destination=scenes[nextIndex];
    const commitScene=()=>{
      resetSceneState(destination);
      setDirection(dir);
      setTransitioning(false);
      setSceneIndex(nextIndex);
      setRunId((value)=>value+1);
    };

    haptic(8);

    if(typeof document!=="undefined" && typeof window!=="undefined"){
      const viewDocument=document as Document & {
        startViewTransition?: (update:()=>void)=>unknown;
      };
      const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if(viewDocument.startViewTransition && !reduced){
        viewDocument.startViewTransition(()=>flushSync(commitScene));
        return;
      }
    }

    commitScene();
  };

  const next=()=>moveTo(Math.min(total-1,sceneIndex+1),"forward");
  const prev=()=>moveTo(Math.max(0,sceneIndex-1),"back");

  const openDoor=()=>{
    if(doorOpen) return;
    setDoorOpen(true);
    haptic([12,35,9]);
    playFx("door");
  };

  const canAdvance=()=>{
    switch(current){
      case "intro":
      case "memories":
      case "timeline":
      case "video":
        return true;
      case "door":
        return doorOpen;
      case "light":
        return lightRevealed;
      case "hold":
        return holdRevealed;
      case "stars":
        return stars.length>=3;
      case "scratch":
        return scratched;
      case "letter":
        return letterOpen;
      case "candles":
        return candlesOut;
      case "balloons":
        return popped.length>=3;
      case "voices":
        return voicesPlayed.length>0;
      case "quiz":
        return quizChoice!==null;
      case "vault":
        return vaultOpen;
      case "capsule":
        return capsuleOpen;
      case "finale":
      case "proposal":
      default:
        return false;
    }
  };

  function scene(type:SceneType){
    switch(type){
      case "intro": return <section className="thi-scene thi-intro thi-scene-rich">
        <div className="thi-glow a"/><div className="thi-glow b"/>
        <div className="thi-intro-constellation" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
        <p className="thi-kicker">{experience.demoGiver} hizo algo para vos</p>
        <h1>{experience.demoRecipient}</h1>
        <div className="thi-hairline"/>
        <p className="thi-lead">{experience.opening}</p>
        <button className="thi-primary thi-primary-premium" onClick={next}><span>Entrar</span><b>→</b></button>
        <small>Mejor con auriculares · unos minutos sólo para vos</small>
      </section>;

      case "door": return <section className="thi-scene thi-scene-door thi-scene-rich">
        <p className="thi-kicker">Hay algo del otro lado</p>
        <h2>Todo empieza abriendo una puerta.</h2>
        <div className="thi-door-light" aria-hidden="true"/>
        <div className="thi-door-floor" aria-hidden="true"/>
        <button className={`thi-door-wrap ${doorOpen?"opening":""}`} onClick={openDoor}>
          <span className="thi-door-frame">
            <span className="thi-door"><i/><b/></span>
            <span className="thi-door-world"/>
          </span>
        </button>
        {!doorOpen
          ? <p className="thi-hint">Tocá la puerta</p>
          : <button className="thi-primary thi-door-enter" onClick={next}>Entrar →</button>}

      </section>;

      case "memories": return <section className="thi-scene thi-scene-memories thi-scene-rich">
        <p className="thi-kicker">Los recuerdos</p>
        <h2>Hay días que terminan.<br/>Y otros que se quedan.</h2>
        <div className="thi-film">
          {(displayPhotos.length ? displayPhotos : memoryLines.map((caption)=>({url:"",caption,fit:"cover" as const,position:"center" as const}))).map((item,i)=><article className={`thi-memory m${(i%3)+1}`} key={item.url || item.caption || i}>
            <div className="thi-memory-photo" style={item.url?{backgroundImage:`url("${item.url}")`,backgroundSize:item.fit||"cover",backgroundPosition:item.position||"center",backgroundRepeat:"no-repeat"}:undefined}>
              <span>{String(i+1).padStart(2,"0")}</span>
              <i className="thi-photo-sheen"/>
            </div>
            <p>{item.caption || memoryLines[i%memoryLines.length]}</p>
          </article>)}
        </div>
        <button className="thi-primary" onClick={next}>Seguir <span>→</span></button>
      </section>;

      case "light": return <section className="thi-scene thi-scene-light thi-scene-rich">
        <p className="thi-kicker">{premiumMoment.light.kicker}</p>
        <h2>{premiumMoment.light.title}</h2>
        <LightReveal
          accent={experience.accent}
          kicker={premiumMoment.light.kicker}
          title={premiumMoment.light.title}
          secret={premiumMoment.light.secret}
          hint={premiumMoment.light.hint}
          revealed={lightRevealed}
          onReveal={()=>{setLightRevealed(true);haptic([7,20,10]);playFx("chime");}}
        />
        {lightRevealed&&<button className="thi-primary" onClick={next}>Seguir con este recuerdo →</button>}
      </section>;

      case "stars": return <section className="thi-scene thi-scene-stars thi-scene-rich">
        <div className="thi-sky-dust" aria-hidden="true"/>
        <p className="thi-kicker">Cosas que no quiero que olvides</p>
        <h2>Tocá las estrellas.</h2>
        <div className={`thi-stars ${stars.length>=3?"complete":""}`}>
          <svg className="thi-constellation-lines" viewBox="0 0 700 350" aria-hidden="true">
            <path d="M105 66 L585 50 L350 175 L130 305 L570 300 L350 175 Z"/>
          </svg>
          {starLines.map((t,i)=>
            <button key={t} className={stars.includes(i)?"revealed":""} onClick={()=>{setStars(v=>v.includes(i)?v:[...v,i]);haptic(9);playFx("chime");}}>
              <span>✦</span><em>{stars.includes(i)?t:"Tocame"}</em><i/>
            </button>
          )}
          {stars.length>=3&&<div className="thi-constellation-complete"><span>✦</span><small>constelación descubierta</small></div>}
        </div>
        <button className="thi-primary" disabled={stars.length<3} onClick={next}>{stars.length<3?`Descubrí ${3-stars.length} más`:"Continuar →"}</button>
      </section>;

      case "scratch": return <section className="thi-scene thi-scene-scratch thi-scene-rich">
        <p className="thi-kicker">Hay algo escondido</p>
        <h2>Esto sí tenés que descubrirlo.</h2>
        <ScratchReveal
          accent={experience.accent}
          eyebrow={demo.scratchEyebrow || "Vale por"}
          reward={demo.scratchReward || "un recuerdo nuevo juntos"}
          note={demo.scratchNote || "sin vencimiento"}
          revealed={scratched}
          onReveal={()=>{setScratched(true);haptic([8,20,8]);playFx("chime");}}
        />
        <button className="thi-primary" disabled={!scratched} onClick={next}>Ya lo descubrí →</button>
      </section>;

      case "hold": return <section className="thi-scene thi-scene-hold thi-scene-rich">
        <p className="thi-kicker">{premiumMoment.hold.kicker}</p>
        <h2>Hay cosas que merecen<br/>un segundo más.</h2>
        <HoldReveal
          accent={experience.accent}
          symbol={premiumMoment.hold.symbol}
          prompt={premiumMoment.hold.prompt}
          reveal={premiumMoment.hold.reveal}
          revealed={holdRevealed}
          onReveal={()=>{setHoldRevealed(true);haptic([18,45,18,45,28]);playFx("seal");}}
        />
        {holdRevealed&&<button className="thi-primary" onClick={next}>Seguir →</button>}
      </section>;

      case "letter": return <section className="thi-scene thi-scene-letter thi-scene-rich">
        <p className="thi-kicker">La parte que no podía entrar en una foto</p>
        <h2>Hay palabras que merecen abrirse despacio.</h2>
        <div className="thi-letter-aura" aria-hidden="true"/>
        <button className={`thi-envelope ${letterOpen?"open":""}`} onClick={()=>{setLetterOpen(true);haptic([10,30,8]);playFx("seal");}}>
          <span className="back"/><span className="paper"><small>Para {experience.demoRecipient}</small><strong>{letterText || demo.letter || "Gracias por convertir tantos días comunes en recuerdos extraordinarios."}</strong><em>— {experience.demoGiver}</em></span><span className="front"/><span className="wax">♥</span>
        </button>
        {!letterOpen?<p className="thi-hint">Rompé el sello</p>:<button className="thi-primary" onClick={next}>Guardar estas palabras →</button>}
      </section>;

      case "candles": return <section className="thi-scene thi-scene-candles thi-scene-rich">
        <p className="thi-kicker">Pedí un deseo</p>
        <h2>Antes de seguir,<br/>faltan las velitas.</h2>
        <div className={`thi-cake ${candlesOut?"out":""}`}><div className="thi-cake-shadow"/><div className="thi-cake-plate"/><div className="thi-cake-body"><span className="thi-cake-top"/><span className="thi-cake-icing"/><span className="thi-cake-sprinkles"/></div><div className="thi-candles">{[0,1,2,3,4].map(i=><span key={i}><i/><b/></span>)}</div></div>
        <CandleBlow blown={candlesOut} onBlow={()=>{setCandlesOut(true);haptic([10,20,10]);playFx("chime");}}/>
        {candlesOut&&<><p className="thi-wish-made">✦ deseo guardado</p><button className="thi-ghost" onClick={next}>Seguir →</button></>}
      </section>;

      case "balloons": return <section className="thi-scene thi-scene-balloons thi-scene-rich">
        <p className="thi-kicker">No todos los globos están vacíos</p>
        <h2>Reventá tres.</h2>
        <div className="thi-balloons">{balloonLines.map((t,i)=><button key={t} className={popped.includes(i)?"pop":""} onClick={()=>{setPopped(v=>v.includes(i)?v:[...v,i]);haptic(10);playFx("pop");}}><span>{popped.includes(i)?t:""}</span><i>{popped.includes(i)?"✦":"POP"}</i></button>)}</div>
        <button className="thi-primary" disabled={popped.length<3} onClick={next}>{popped.length<3?`Faltan ${3-popped.length}`:"Continuar →"}</button>
      </section>;

      case "timeline": return <section className="thi-scene thi-scene-timeline thi-scene-rich">
        <p className="thi-kicker">El tiempo también cuenta historias</p>
        <h2>Tres momentos.<br/>Una misma historia.</h2>
        <div className="thi-timeline">
          <div className="thi-timeline-line" aria-hidden="true"/>
          {timelineEntries.map((entry,index)=><article key={entry.title}><span>{String(index+1).padStart(2,"0")}</span><i/><strong>{entry.title}</strong><p>{entry.body}</p></article>)}
        </div>
        <button className="thi-primary" onClick={next}>Seguir la historia →</button>
      </section>;

      case "voices": return <section className="thi-scene thi-scene-voices thi-scene-rich">
        <p className="thi-kicker">{experience.slug==="pareja"?"Hay cosas que prefiero decirte con mi voz":"Hay gente esperando decirte algo"}</p>
        <h2>{experience.slug==="pareja"?"Escuchá esto.":"Elegí una voz."}</h2>
        {audioMedia?.length
          ? <div className="thi-voices">{audioMedia.map((a,i)=><article key={a.url} className={voicesPlayed.includes(i)?"thi-voice-audio played":"thi-voice-audio"}><span>♪</span><strong>{a.caption || `Mensaje ${i+1}`}</strong><audio src={a.url} controls preload="metadata" onPlay={()=>{setVoicesPlayed(v=>v.includes(i)?v:[...v,i]);haptic(6);}}/></article>)}</div>
          : experience.slug==="pareja"
            ? <div className="thi-romantic-audio">
                {voiceEntries.slice(0,1).map((voice,i)=><button
                  key={voice.name}
                  className={voicesPlayed.includes(i)?"played":""}
                  onClick={()=>{
                    setVoicesPlayed(v=>v.includes(i)?v:[...v,i]);
                    haptic([7,18,7]);
                    playDemoVoice(voice.message);
                  }}
                  aria-label="Reproducir nota de voz"
                >
                  <span className="thi-audio-avatar">{voice.name.slice(0,1)}</span>
                  <span className="thi-audio-copy">
                    <small>nota de voz · {voice.name}</small>
                    <strong>{voicesPlayed.includes(i)?"Reproduciendo…":"Tocá para escuchar"}</strong>
                    <i className="thi-waveform" aria-hidden="true">{Array.from({length:24}).map((_,bar)=><b key={bar}/>)}</i>
                  </span>
                  <span className="thi-audio-play">{voicesPlayed.includes(i)?"❚❚":"▶"}</span>
                </button>)}
                {voicesPlayed.length>0&&<p>“{voiceEntries[0].message}”</p>}
              </div>
            : <div className="thi-voices">{voiceEntries.map((voice,i)=><button key={voice.name} className={voicesPlayed.includes(i)?"played":""} onClick={()=>{setVoicesPlayed(v=>v.includes(i)?v:[...v,i]);haptic(6);}}><span>{voicesPlayed.includes(i)?"▶":"●"}</span><strong>{voice.name}</strong><small>{voicesPlayed.includes(i)?`“${voice.message}”`:"Tocar para escuchar"}</small></button>)}</div>
        }
        <button className="thi-primary" disabled={!voicesPlayed.length} onClick={next}>{experience.slug==="pareja"?"Guardar esta voz →":"Continuar →"}</button>
      </section>;

      case "quiz": return <section className="thi-scene thi-scene-quiz thi-scene-rich">
        <p className="thi-kicker">A ver cuánto te acordás</p>
        <h2>{quizData.question}</h2>
        <div className="thi-quiz">{quizData.answers.map((answer,i)=><button key={answer} className={quizChoice!==null&&i===quizData.correctIndex?"ok":quizChoice===i?"wrong":""} onClick={()=>{setQuizChoice(i);haptic(8);}}><span>{String.fromCharCode(65+i)}</span>{answer}<i>{quizChoice!==null&&i===quizData.correctIndex?"✓":quizChoice===i?"·":""}</i></button>)}</div>
        {quizChoice!==null&&<p className="thi-lead thi-reveal-copy">{quizData.after}</p>}
        <button className="thi-primary" disabled={quizChoice===null} onClick={next}>Seguir →</button>
      </section>;

      case "vault": return <section className="thi-scene thi-scene-vault thi-scene-rich">
        <p className="thi-kicker">Última cerradura</p>
        <h2>Hay algo guardado para vos.</h2>
        <div className="thi-vault-aura" aria-hidden="true"/>
        <button className={`thi-vault ${vaultOpen?"open":""}`} onClick={()=>{setVaultOpen(true);haptic([12,40,12]);playFx("unlock");}}><span><i>◇</i><b/></span><strong>{vaultOpen?"ABIERTO":"TOCÁ PARA ABRIR"}</strong><small>{vaultOpen?"acceso concedido":"último secreto"}</small></button>
        {vaultOpen&&<><p className="thi-lead thi-reveal-copy">No era un objeto. Era una pregunta.</p><button className="thi-primary" onClick={next}>Abrir la última carta →</button></>}
      </section>;

      case "capsule": return <section className="thi-scene thi-scene-capsule thi-scene-rich">
        <p className="thi-kicker">Para volver algún día</p>
        <h2>Guardamos algo para<br/>tu yo del futuro.</h2>
        <button className={`thi-capsule ${capsuleOpen?"open":""}`} onClick={()=>{setCapsuleOpen(true);haptic([8,25,8]);}}><span>{demo.capsule?.year || "2036"}<i/></span><strong>{capsuleOpen?"Abriste una cápsula del tiempo":"Abrir cápsula"}</strong><p>{capsuleOpen?(demo.capsule?.open || "Ojalá sigas teniendo esa misma curiosidad por el mundo."):(demo.capsule?.closed || "Hay palabras que pueden esperar.")}</p></button>
        {capsuleOpen&&<button className="thi-primary" onClick={next}>Guardar este momento →</button>}
      </section>;

      case "video": return <section className="thi-scene thi-scene-video thi-scene-rich">
        <p className="thi-kicker">Un momento para mirar sin apuro</p>
        <h2>Hay recuerdos que necesitan<br/>movimiento y sonido.</h2>
        {videoMedia?.length ? <div className="thi-video-wrap"><div className="thi-video-frame"><video src={videoMedia[0].url} controls playsInline preload="metadata"/></div>{videoMedia[0].caption&&<p>{videoMedia[0].caption}</p>}</div> : <div className="thi-video-placeholder"><span>▶</span><small>Un video especial vive acá</small></div>}
        <button className="thi-primary" onClick={next}>Continuar →</button>
      </section>;

      case "proposal": return <section className="thi-scene thi-final thi-proposal thi-scene-rich">
        <div className="thi-proposal-rings" aria-hidden="true"><i/><i/><i/></div>
        <p className="thi-kicker">Y ahora sí</p>
        <span className="thi-ring">◇</span>
        <h2>{experience.closing}</h2>
        <p className="thi-lead">No hace falta tocar nada más. Este momento es de ustedes.</p>
        <div className="thi-reactions"><button onClick={()=>haptic([10,20,10])}>Sí ❤️</button><button>😭</button><button>✨</button></div>
        <small>creado con ♥ en Te Hice Esto</small>
      </section>;

      case "finale":
      default: return <section className="thi-scene thi-final thi-scene-rich">
        <div className="thi-final-sparks" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
        <p className="thi-kicker">Una última cosa</p>
        <h2>{experience.closing}</h2>
        <p className="thi-lead">Este lugar va a seguir acá para cuando quieras volver.</p>
        <div className="thi-reactions">{["🥹","❤️","😭","✨"].map(x=><button key={x} onClick={()=>haptic(7)}>{x}</button>)}</div>
        <button className="thi-ghost" onClick={restart}>Volver al comienzo</button>
        <small>creado con ♥ en Te Hice Esto</small>
      </section>;
    }
  }

  const moveAtmosphere=(event:ReactPointerEvent<HTMLElement>)=>{
    const node=event.currentTarget;
    const width=Math.max(window.innerWidth,1);
    const height=Math.max(window.innerHeight,1);
    node.style.setProperty("--pointer-left",`${event.clientX}px`);
    node.style.setProperty("--pointer-top",`${event.clientY}px`);
    node.style.setProperty("--parallax-x",`${((event.clientX/width)-.5)*18}px`);
    node.style.setProperty("--parallax-y",`${((event.clientY/height)-.5)*14}px`);
  };

  return <main className={`thi-experience thi-experience-premium thi-theme-${experience.slug}`} style={{"--accent":experience.accent} as CSSProperties} data-experience={experience.slug} data-scene={current} onPointerMove={moveAtmosphere}>
    <div className="thi-pointer-light" aria-hidden="true"/>
    <div className="thi-experience-noise" aria-hidden="true"/>
    <div className="thi-experience-vignette" aria-hidden="true"/>
    <div className="thi-experience-orb orb-a" aria-hidden="true"/>
    <div className="thi-experience-orb orb-b" aria-hidden="true"/>

    <div className="thi-scene-meta">
      <span>{sceneLabels[current]}</span>
      <i/>
      <small>{String(sceneIndex+1).padStart(2,"0")} / {String(total).padStart(2,"0")}</small>
    </div>

    <button className="thi-reset-journey" type="button" onClick={restart} aria-label="Reiniciar experiencia">
      <span>↻</span><small>Reiniciar</small>
    </button>

    <div className={`thi-scene-stage ${transitioning?"leaving":""} ${direction}`} key={`${runId}-${sceneIndex}-${current}`}>
      {scene(current)}
    </div>

    <div className="thi-progress thi-progress-premium">
      <button onClick={prev} disabled={!sceneIndex||transitioning} aria-label="Escena anterior">←</button>
      <div><span style={{width:`${progress}%`}}/></div>
      <small>{Math.round(progress)}%</small>
      <button
        className="thi-progress-next"
        onClick={next}
        disabled={!canAdvance()||sceneIndex>=total-1}
        aria-label="Escena siguiente"
      >→</button>
    </div>
  </main>;
}
