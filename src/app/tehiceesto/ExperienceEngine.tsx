"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { Experience, SceneType } from "./data";

export type ThiPhoto = { url:string; caption?:string; fit?:"cover"|"contain"; position?:"center"|"top"|"bottom"|"left"|"right" };
export type ThiAudio = { url:string; caption?:string };
export type ThiVideo = { url:string; caption?:string };

const sceneLabels: Record<SceneType,string> = {
  intro:"Comienzo", door:"Puerta", memories:"Recuerdos", stars:"Estrellas",
  scratch:"Sorpresa", letter:"Carta", finale:"Final", candles:"Deseo",
  balloons:"Mensajes", timeline:"Historia", voices:"Voces", quiz:"Pregunta",
  vault:"Bóveda", capsule:"Futuro", proposal:"La pregunta", video:"Video",
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
  const [quizDone,setQuizDone]=useState(false);
  const [vaultOpen,setVaultOpen]=useState(false);
  const [capsuleOpen,setCapsuleOpen]=useState(false);
  const [voicesPlayed,setVoicesPlayed]=useState<number[]>([]);
  const [doorOpen,setDoorOpen]=useState(false);

  const scenes=experience.recipe;
  const current=scenes[sceneIndex];
  const total=scenes.length;
  const progress=((sceneIndex+1)/total)*100;

  const memories=useMemo(()=>[
    "Ese día todavía no sabíamos todo lo que iba a venir.",
    "Los mejores recuerdos casi nunca avisan que van a ser importantes.",
    "Sin darnos cuenta, empezamos a coleccionar un mundo propio."
  ],[]);
  const displayPhotos = photoMedia && photoMedia.length ? photoMedia.slice(0,8) : [];

  const resetAllInteractions=()=>{
    setStars([]);
    setLetterOpen(false);
    setScratched(false);
    setCandlesOut(false);
    setPopped([]);
    setQuizDone(false);
    setVaultOpen(false);
    setCapsuleOpen(false);
    setVoicesPlayed([]);
    setDoorOpen(false);
  };

  const resetSceneState=(type:SceneType)=>{
    if(type==="stars") setStars([]);
    if(type==="letter") setLetterOpen(false);
    if(type==="scratch") setScratched(false);
    if(type==="candles") setCandlesOut(false);
    if(type==="balloons") setPopped([]);
    if(type==="quiz") setQuizDone(false);
    if(type==="vault") setVaultOpen(false);
    if(type==="capsule") setCapsuleOpen(false);
    if(type==="voices") setVoicesPlayed([]);
    if(type==="door") setDoorOpen(false);
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

  const moveTo=(nextIndex:number,dir:"forward"|"back")=>{
    if(nextIndex<0||nextIndex>=total||nextIndex===sceneIndex) return;
    const destination=scenes[nextIndex];
    resetSceneState(destination);
    setDirection(dir);
    setTransitioning(true);
    haptic(8);
    window.setTimeout(()=>{
      setSceneIndex(nextIndex);
      setTransitioning(false);
    },160);
  };

  const next=()=>moveTo(Math.min(total-1,sceneIndex+1),"forward");
  const prev=()=>moveTo(Math.max(0,sceneIndex-1),"back");

  const openDoor=()=>{
    if(doorOpen) return;
    setDoorOpen(true);
    haptic([12,35,9]);
    window.setTimeout(next,680);
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
        <button className={`thi-door-wrap ${doorOpen?"opening":""}`} onClick={openDoor}>
          <span className="thi-door-frame">
            <span className="thi-door"><i/><b/></span>
            <span className="thi-door-world"/>
          </span>
        </button>
        <p className="thi-hint">{doorOpen?"Entrando…":"Tocá la puerta"}</p>
      </section>;

      case "memories": return <section className="thi-scene thi-scene-memories thi-scene-rich">
        <p className="thi-kicker">Los recuerdos</p>
        <h2>Hay días que terminan.<br/>Y otros que se quedan.</h2>
        <div className="thi-film">
          {(displayPhotos.length ? displayPhotos : memories.map((caption)=>({url:"",caption,fit:"cover" as const,position:"center" as const}))).map((item,i)=><article className={`thi-memory m${(i%3)+1}`} key={item.url || item.caption || i}>
            <div className="thi-memory-photo" style={item.url?{backgroundImage:`url("${item.url}")`,backgroundSize:item.fit||"cover",backgroundPosition:item.position||"center",backgroundRepeat:"no-repeat"}:undefined}>
              <span>{String(i+1).padStart(2,"0")}</span>
              <i className="thi-photo-sheen"/>
            </div>
            <p>{item.caption || memories[i%memories.length]}</p>
          </article>)}
        </div>
        <button className="thi-primary" onClick={next}>Seguir <span>→</span></button>
      </section>;

      case "stars": return <section className="thi-scene thi-scene-stars thi-scene-rich">
        <div className="thi-sky-dust" aria-hidden="true"/>
        <p className="thi-kicker">Cosas que no quiero que olvides</p>
        <h2>Tocá las estrellas.</h2>
        <div className="thi-stars">
          {["Tu forma de hacer hogar.","Cómo te reís cuando te olvidás de cuidarte.","La calma que traés sin darte cuenta.","Todo lo que todavía soñamos.","Que te volvería a elegir."].map((t,i)=>
            <button key={t} className={stars.includes(i)?"revealed":""} onClick={()=>{setStars(v=>v.includes(i)?v:[...v,i]);haptic(9);}}>
              <span>✦</span><em>{stars.includes(i)?t:"Tocame"}</em><i/>
            </button>
          )}
        </div>
        <button className="thi-primary" disabled={stars.length<3} onClick={next}>{stars.length<3?`Descubrí ${3-stars.length} más`:"Continuar →"}</button>
      </section>;

      case "scratch": return <section className="thi-scene thi-scene-scratch thi-scene-rich">
        <p className="thi-kicker">Hay algo escondido</p>
        <h2>Esto sí tenés que descubrirlo.</h2>
        <button className={`thi-scratch ${scratched?"done":""}`} onClick={()=>{setScratched(true);haptic([8,20,8]);}}>
          <div><span>Vale por</span><strong>un recuerdo nuevo juntos</strong><small>sin vencimiento</small></div>
          <i><b>DESCUBRÍ ACÁ</b><small>tocá para revelar</small><span className="thi-scratch-shine"/></i>
        </button>
        <button className="thi-primary" disabled={!scratched} onClick={next}>Ya lo descubrí →</button>
      </section>;

      case "letter": return <section className="thi-scene thi-scene-letter thi-scene-rich">
        <p className="thi-kicker">La parte que no podía entrar en una foto</p>
        <h2>Hay palabras que merecen abrirse despacio.</h2>
        <div className="thi-letter-aura" aria-hidden="true"/>
        <button className={`thi-envelope ${letterOpen?"open":""}`} onClick={()=>{setLetterOpen(true);haptic([10,30,8]);}}>
          <span className="back"/><span className="paper"><small>Para {experience.demoRecipient}</small><strong>{letterText || "Gracias por convertir tantos días comunes en recuerdos extraordinarios."}</strong><em>— {experience.demoGiver}</em></span><span className="front"/><span className="wax">♥</span>
        </button>
        {!letterOpen?<p className="thi-hint">Rompé el sello</p>:<button className="thi-primary" onClick={next}>Guardar estas palabras →</button>}
      </section>;

      case "candles": return <section className="thi-scene thi-scene-candles thi-scene-rich">
        <p className="thi-kicker">Pedí un deseo</p>
        <h2>Antes de seguir,<br/>faltan las velitas.</h2>
        <div className={`thi-cake ${candlesOut?"out":""}`}><div className="thi-cake-shadow"/><div className="thi-cake-body"/><div className="thi-candles">{[0,1,2,3,4].map(i=><span key={i}><i/><b/></span>)}</div></div>
        <button className="thi-primary" onClick={()=>{setCandlesOut(true);haptic([10,20,10]);}}>{candlesOut?"Deseo pedido ✦":"Soplar las velitas"}</button>
        {candlesOut&&<button className="thi-ghost" onClick={next}>Seguir →</button>}
      </section>;

      case "balloons": return <section className="thi-scene thi-scene-balloons thi-scene-rich">
        <p className="thi-kicker">No todos los globos están vacíos</p>
        <h2>Reventá tres.</h2>
        <div className="thi-balloons">{["Te queremos","Tu risa","Hoy mandás vos","Una salida","Un abrazo","Nunca cambies"].map((t,i)=><button key={t} className={popped.includes(i)?"pop":""} onClick={()=>{setPopped(v=>v.includes(i)?v:[...v,i]);haptic(10);}}><span>{popped.includes(i)?t:""}</span><i>{popped.includes(i)?"✦":"POP"}</i></button>)}</div>
        <button className="thi-primary" disabled={popped.length<3} onClick={next}>{popped.length<3?`Faltan ${3-popped.length}`:"Continuar →"}</button>
      </section>;

      case "timeline": return <section className="thi-scene thi-scene-timeline thi-scene-rich">
        <p className="thi-kicker">El tiempo también cuenta historias</p>
        <h2>Tres momentos.<br/>Una misma historia.</h2>
        <div className="thi-timeline">
          <div className="thi-timeline-line" aria-hidden="true"/>
          <article><span>01</span><i/><strong>El comienzo</strong><p>Cuando todavía no sabíamos en qué se iba a convertir todo esto.</p></article>
          <article><span>02</span><i/><strong>Ese día</strong><p>Uno de esos momentos que después entendemos que fueron gigantes.</p></article>
          <article><span>03</span><i/><strong>Hoy</strong><p>La historia sigue. Y eso es lo mejor.</p></article>
        </div>
        <button className="thi-primary" onClick={next}>Seguir la historia →</button>
      </section>;

      case "voices": return <section className="thi-scene thi-scene-voices thi-scene-rich">
        <p className="thi-kicker">Hay gente esperando decirte algo</p>
        <h2>Elegí una voz.</h2>
        <div className="thi-voices">{audioMedia?.length ? audioMedia.map((a,i)=><article key={a.url} className={voicesPlayed.includes(i)?"thi-voice-audio played":"thi-voice-audio"}><span>♪</span><strong>{a.caption || `Mensaje ${i+1}`}</strong><audio src={a.url} controls preload="metadata" onPlay={()=>{setVoicesPlayed(v=>v.includes(i)?v:[...v,i]);haptic(6);}}/></article>) : ["Mamá","Tomás","Caro","Fran"].map((n,i)=><button key={n} className={voicesPlayed.includes(i)?"played":""} onClick={()=>{setVoicesPlayed(v=>v.includes(i)?v:[...v,i]);haptic(6);}}><span>{voicesPlayed.includes(i)?"▶":"●"}</span><strong>{n}</strong><small>{voicesPlayed.includes(i)?"“Te quiero muchísimo. Gracias por estar siempre.”":"Tocar para escuchar"}</small></button>)}</div>
        <button className="thi-primary" disabled={!voicesPlayed.length} onClick={next}>Continuar →</button>
      </section>;

      case "quiz": return <section className="thi-scene thi-scene-quiz thi-scene-rich">
        <p className="thi-kicker">A ver cuánto te acordás</p>
        <h2>¿Dónde empezó esta historia?</h2>
        <div className="thi-quiz">{["En un mensaje","En una salida que casi se cancela","En un lugar que ya no existe"].map((a,i)=><button key={a} className={quizDone&&i===1?"ok":""} onClick={()=>{setQuizDone(true);haptic(8);}}><span>{String.fromCharCode(65+i)}</span>{a}<i>{quizDone&&i===1?"✓":""}</i></button>)}</div>
        {quizDone&&<p className="thi-lead thi-reveal-copy">La respuesta importa menos que todo lo que vino después.</p>}
        <button className="thi-primary" disabled={!quizDone} onClick={next}>Seguir →</button>
      </section>;

      case "vault": return <section className="thi-scene thi-scene-vault thi-scene-rich">
        <p className="thi-kicker">Última cerradura</p>
        <h2>Hay algo guardado para vos.</h2>
        <div className="thi-vault-aura" aria-hidden="true"/>
        <button className={`thi-vault ${vaultOpen?"open":""}`} onClick={()=>{setVaultOpen(true);haptic([12,40,12]);}}><span><i>◇</i><b/></span><strong>{vaultOpen?"ABIERTO":"TOCÁ PARA ABRIR"}</strong><small>{vaultOpen?"acceso concedido":"último secreto"}</small></button>
        {vaultOpen&&<><p className="thi-lead thi-reveal-copy">No era un objeto. Era una pregunta.</p><button className="thi-primary" onClick={next}>Abrir la última carta →</button></>}
      </section>;

      case "capsule": return <section className="thi-scene thi-scene-capsule thi-scene-rich">
        <p className="thi-kicker">Para volver algún día</p>
        <h2>Guardamos algo para<br/>tu yo del futuro.</h2>
        <button className={`thi-capsule ${capsuleOpen?"open":""}`} onClick={()=>{setCapsuleOpen(true);haptic([8,25,8]);}}><span>2036<i/></span><strong>{capsuleOpen?"Abriste una cápsula del tiempo":"Abrir cápsula"}</strong><p>{capsuleOpen?"Ojalá sigas teniendo esa misma curiosidad por el mundo.":"Hay palabras que pueden esperar."}</p></button>
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

  return <main className={`thi-experience thi-experience-premium thi-theme-${experience.slug}`} style={{"--accent":experience.accent} as CSSProperties} data-experience={experience.slug} data-scene={current}>
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
    </div>
  </main>;
}
