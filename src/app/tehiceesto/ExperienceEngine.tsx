"use client";

import { useMemo, useState } from "react";
import type { Experience, SceneType } from "./data";

export type ThiPhoto = { url:string; caption?:string; fit?:"cover"|"contain"; position?:"center"|"top"|"bottom"|"left"|"right" };
export type ThiAudio = { url:string; caption?:string };
export type ThiVideo = { url:string; caption?:string };

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
  const [stars,setStars]=useState<number[]>([]);
  const [letterOpen,setLetterOpen]=useState(false);
  const [scratched,setScratched]=useState(false);
  const [candlesOut,setCandlesOut]=useState(false);
  const [popped,setPopped]=useState<number[]>([]);
  const [quizDone,setQuizDone]=useState(false);
  const [vaultOpen,setVaultOpen]=useState(false);
  const [capsuleOpen,setCapsuleOpen]=useState(false);
  const [voicesPlayed,setVoicesPlayed]=useState<number[]>([]);

  const scenes=experience.recipe;
  const current=scenes[sceneIndex];
  const total=scenes.length;
  const progress=((sceneIndex+1)/total)*100;
  const next=()=>setSceneIndex(v=>Math.min(total-1,v+1));
  const prev=()=>setSceneIndex(v=>Math.max(0,v-1));
  const memories=useMemo(()=>[
    "Ese día todavía no sabíamos todo lo que iba a venir.",
    "Los mejores recuerdos casi nunca avisan que van a ser importantes.",
    "Sin darnos cuenta, empezamos a coleccionar un mundo propio."
  ],[]);
  const displayPhotos = photoMedia && photoMedia.length ? photoMedia.slice(0,8) : [];

  function scene(type:SceneType){
    switch(type){
      case "intro": return <section className="thi-scene thi-intro">
        <div className="thi-glow a"/><div className="thi-glow b"/>
        <p className="thi-kicker">{experience.demoGiver} hizo algo para vos</p>
        <h1>{experience.demoRecipient}</h1>
        <p className="thi-lead">{experience.opening}</p>
        <button className="thi-primary" onClick={next}>Entrar</button>
        <small>Mejor con auriculares · 6 min</small>
      </section>;

      case "door": return <section className="thi-scene">
        <p className="thi-kicker">Hay algo del otro lado</p><h2>Todo empieza abriendo una puerta.</h2>
        <button className="thi-door-wrap" onClick={next}><span className="thi-door"><i/></span></button>
        <p className="thi-hint">Tocá la puerta</p>
      </section>;

      case "memories": return <section className="thi-scene">
        <p className="thi-kicker">Los recuerdos</p><h2>Hay días que terminan. Y otros que se quedan.</h2>
        <div className="thi-film">
          {(displayPhotos.length ? displayPhotos : memories.map((caption,i)=>({url:"",caption,fit:"cover" as const,position:"center" as const}))).map((item,i)=><article className={`thi-memory m${(i%3)+1}`} key={item.url || item.caption || i}>
            <div className="thi-memory-photo" style={item.url?{backgroundImage:`url("${item.url}")`,backgroundSize:item.fit||"cover",backgroundPosition:item.position||"center",backgroundRepeat:"no-repeat"}:undefined}><span>{String(i+1).padStart(2,"0")}</span></div>
            <p>{item.caption || memories[i%memories.length]}</p>
          </article>)}
        </div>
        <button className="thi-primary" onClick={next}>Seguir</button>
      </section>;

      case "stars": return <section className="thi-scene">
        <p className="thi-kicker">Cosas que no quiero que olvides</p><h2>Tocá las estrellas.</h2>
        <div className="thi-stars">
          {["Tu forma de hacer hogar.","Cómo te reís cuando te olvidás de cuidarte.","La calma que traés sin darte cuenta.","Todo lo que todavía soñamos.","Que te volvería a elegir."].map((t,i)=>
            <button key={t} className={stars.includes(i)?"revealed":""} onClick={()=>setStars(v=>v.includes(i)?v:[...v,i])}><span>✦</span><em>{stars.includes(i)?t:"Tocame"}</em></button>
          )}
        </div>
        <button className="thi-primary" disabled={stars.length<3} onClick={next}>{stars.length<3?`Descubrí ${3-stars.length} más`:"Continuar"}</button>
      </section>;

      case "scratch": return <section className="thi-scene">
        <p className="thi-kicker">Hay algo escondido</p><h2>Esto sí tenés que descubrirlo.</h2>
        <button className={`thi-scratch ${scratched?"done":""}`} onClick={()=>setScratched(true)}>
          <div><span>Vale por</span><strong>un recuerdo nuevo juntos</strong><small>sin vencimiento</small></div>
          <i><b>RASPÁ ACÁ</b><small>deslizá el dedo</small></i>
        </button>
        <button className="thi-primary" disabled={!scratched} onClick={next}>Ya lo descubrí</button>
      </section>;

      case "letter": return <section className="thi-scene">
        <p className="thi-kicker">La parte que no podía entrar en una foto</p><h2>Hay palabras que merecen abrirse despacio.</h2>
        <button className={`thi-envelope ${letterOpen?"open":""}`} onClick={()=>setLetterOpen(true)}>
          <span className="back"/><span className="paper"><small>Para {experience.demoRecipient}</small><strong>{letterText || "Gracias por convertir tantos días comunes en recuerdos extraordinarios."}</strong><em>— {experience.demoGiver}</em></span><span className="front"/><span className="wax">♥</span>
        </button>
        {!letterOpen?<p className="thi-hint">Rompé el sello</p>:<button className="thi-primary" onClick={next}>Seguir</button>}
      </section>;

      case "candles": return <section className="thi-scene">
        <p className="thi-kicker">Pedí un deseo</p><h2>Antes de seguir, faltan las velitas.</h2>
        <div className={`thi-cake ${candlesOut?"out":""}`}><div className="thi-cake-body"/><div className="thi-candles">{[0,1,2,3,4].map(i=><span key={i}><i/></span>)}</div></div>
        <button className="thi-primary" onClick={()=>setCandlesOut(true)}>{candlesOut?"Deseo pedido ✦":"Soplar las velitas"}</button>
        {candlesOut&&<button className="thi-ghost" onClick={next}>Seguir</button>}
      </section>;

      case "balloons": return <section className="thi-scene">
        <p className="thi-kicker">No todos los globos están vacíos</p><h2>Reventá tres.</h2>
        <div className="thi-balloons">{["Te queremos","Tu risa","Hoy mandás vos","Una salida","Un abrazo","Nunca cambies"].map((t,i)=><button key={t} className={popped.includes(i)?"pop":""} onClick={()=>setPopped(v=>v.includes(i)?v:[...v,i])}>{popped.includes(i)?t:"POP"}</button>)}</div>
        <button className="thi-primary" disabled={popped.length<3} onClick={next}>{popped.length<3?`Faltan ${3-popped.length}`:"Continuar"}</button>
      </section>;

      case "timeline": return <section className="thi-scene">
        <p className="thi-kicker">El tiempo también cuenta historias</p><h2>Tres momentos. Una misma historia.</h2>
        <div className="thi-timeline"><article><span>01</span><strong>El comienzo</strong><p>Cuando todavía no sabíamos en qué se iba a convertir todo esto.</p></article><article><span>02</span><strong>Ese día</strong><p>Uno de esos momentos que después entendemos que fueron gigantes.</p></article><article><span>03</span><strong>Hoy</strong><p>La historia sigue. Y eso es lo mejor.</p></article></div>
        <button className="thi-primary" onClick={next}>Seguir la historia</button>
      </section>;

      case "voices": return <section className="thi-scene">
        <p className="thi-kicker">Hay gente esperando decirte algo</p><h2>Elegí una voz.</h2>
        <div className="thi-voices">{audioMedia?.length ? audioMedia.map((a,i)=><article key={a.url} className={voicesPlayed.includes(i)?"thi-voice-audio played":"thi-voice-audio"}><span>♪</span><strong>{a.caption || `Mensaje ${i+1}`}</strong><audio src={a.url} controls preload="metadata" onPlay={()=>setVoicesPlayed(v=>v.includes(i)?v:[...v,i])}/></article>) : ["Mamá","Tomás","Caro","Fran"].map((n,i)=><button key={n} className={voicesPlayed.includes(i)?"played":""} onClick={()=>setVoicesPlayed(v=>v.includes(i)?v:[...v,i])}><span>{voicesPlayed.includes(i)?"▶":"●"}</span><strong>{n}</strong><small>{voicesPlayed.includes(i)?"“Te quiero muchísimo. Gracias por estar siempre.”":"Tocar para escuchar"}</small></button>)}</div>
        <button className="thi-primary" disabled={!voicesPlayed.length} onClick={next}>Continuar</button>
      </section>;

      case "quiz": return <section className="thi-scene">
        <p className="thi-kicker">A ver cuánto te acordás</p><h2>¿Dónde empezó esta historia?</h2>
        <div className="thi-quiz">{["En un mensaje","En una salida que casi se cancela","En un lugar que ya no existe"].map((a,i)=><button key={a} className={quizDone&&i===1?"ok":""} onClick={()=>setQuizDone(true)}>{a}</button>)}</div>
        {quizDone&&<p className="thi-lead">La respuesta importa menos que todo lo que vino después.</p>}
        <button className="thi-primary" disabled={!quizDone} onClick={next}>Seguir</button>
      </section>;

      case "vault": return <section className="thi-scene">
        <p className="thi-kicker">Última cerradura</p><h2>Hay algo guardado para vos.</h2>
        <button className={`thi-vault ${vaultOpen?"open":""}`} onClick={()=>setVaultOpen(true)}><span>◇</span><strong>{vaultOpen?"ABIERTO":"TOCÁ PARA ABRIR"}</strong></button>
        {vaultOpen&&<><p className="thi-lead">No era un objeto. Era una pregunta.</p><button className="thi-primary" onClick={next}>Abrir la última carta</button></>}
      </section>;

      case "capsule": return <section className="thi-scene">
        <p className="thi-kicker">Para volver algún día</p><h2>Guardamos algo para tu yo del futuro.</h2>
        <button className={`thi-capsule ${capsuleOpen?"open":""}`} onClick={()=>setCapsuleOpen(true)}><span>2036</span><strong>{capsuleOpen?"Abriste una cápsula del tiempo":"Abrir cápsula"}</strong><p>{capsuleOpen?"Ojalá sigas teniendo esa misma curiosidad por el mundo.":"Hay palabras que pueden esperar."}</p></button>
        {capsuleOpen&&<button className="thi-primary" onClick={next}>Guardar este momento</button>}
      </section>;

      case "video": return <section className="thi-scene">
        <p className="thi-kicker">Un momento para mirar sin apuro</p><h2>Hay recuerdos que necesitan movimiento y sonido.</h2>
        {videoMedia?.length ? <div className="thi-video-wrap"><video src={videoMedia[0].url} controls playsInline preload="metadata"/>{videoMedia[0].caption&&<p>{videoMedia[0].caption}</p>}</div> : <div className="thi-video-placeholder">▶</div>}
        <button className="thi-primary" onClick={next}>Continuar</button>
      </section>;

      case "proposal": return <section className="thi-scene thi-final"><p className="thi-kicker">Y ahora sí</p><span className="thi-ring">◇</span><h2>{experience.closing}</h2><p className="thi-lead">No hace falta tocar nada más. Este momento es de ustedes.</p><div className="thi-reactions"><button>Sí ❤️</button><button>😭</button><button>✨</button></div><small>creado con ♥ en Te Hice Esto</small></section>;

      case "finale":
      default: return <section className="thi-scene thi-final"><p className="thi-kicker">Una última cosa</p><h2>{experience.closing}</h2><p className="thi-lead">Este lugar va a seguir acá para cuando quieras volver.</p><div className="thi-reactions">{["🥹","❤️","😭","✨"].map(x=><button key={x}>{x}</button>)}</div><button className="thi-ghost" onClick={()=>setSceneIndex(0)}>Volver al comienzo</button><small>creado con ♥ en Te Hice Esto</small></section>;
    }
  }

  return <main className="thi-experience" style={{"--accent":experience.accent} as React.CSSProperties}>
    <div className="thi-progress"><button onClick={prev} disabled={!sceneIndex}>←</button><div><span style={{width:`${progress}%`}}/></div><small>{sceneIndex+1}/{total}</small></div>
    {scene(current)}
  </main>;
}
