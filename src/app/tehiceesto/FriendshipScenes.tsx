"use client";

import { useEffect, useRef, useState } from "react";
import type { Experience, SceneType } from "./data";
import FriendSignaturePad from "./FriendSignaturePad";


type Photo = { url: string; caption?: string; fit?: "cover" | "contain"; position?: "center" | "top" | "bottom" | "left" | "right" };
type Props = {
  scene: SceneType;
  experience: Experience;
  photos: Photo[];
  memory: string[];
  letterText?: string;
  anecdote?: string;
  date?: string;
  next: () => void;
  restart: () => void;
  onUnlock: (ready:boolean) => void;
};

const codes = [
  ["“YA FUE”", "Frase históricamente pronunciada segundos antes de una decisión que no debía tomarse."],
  ["ESA CARA", "Sistema de comunicación completo. Traducción simultánea innecesaria."],
  ["“5 MINUTOS”", "Unidad temporal sin relación demostrable con cinco minutos reales."],
  ["EL NOMBRE PROHIBIDO", "No hace falta escribirlo. Ya sabés perfectamente de quién estamos hablando."],
];
const incidents = [
  ["CASO 001", "La salida que iba a ser tranqui", "Duración estimada: 2 horas. Duración real: información reservada.", "La salida tranqui"],
  ["CASO 014", "El mensaje que no había que mandar", "Se discutió. Se analizó. Se mandó igual.", "El mensaje prohibido"],
  ["CASO 028", "El plan sin plan", "Logística inexistente. Presupuesto dudoso. Resultado: inexplicablemente memorable.", "El plan sin plan"],
  ["CASO 041", "La vez que dijimos “nunca más”", "El archivo registra múltiples reincidencias posteriores.", "Nunca más"],
];
const presences = [
  ["ESTUVISTE", "Cuando no sabía bien qué decir y tampoco hacía falta que arreglaras nada."],
  ["TE ALEGRASTE", "Por cosas buenas que me pasaban aunque no tuvieran absolutamente nada que ver con vos."],
  ["ME DIJISTE LA VERDAD", "Incluso cuando hubiera sido mucho más cómodo darme la razón."],
  ["TE QUEDASTE", "En versiones mías que ni yo sabía cuánto iban a durar."],
];
const clauses = [
  ["I", "Podemos pasar semanas sin hablar y retomar como si hubieran sido veinte minutos."],
  ["II", "Si alguien está haciendo una estupidez, la otra persona tiene obligación moral de avisar. Una vez."],
  ["III", "Los logros de una se festejan sin medirlos contra la vida de la otra."],
  ["IV", "Si todo se complica, existe siempre el derecho irrestricto a mandar “¿estás?”."],
];

type FriendActionProps = {children: React.ReactNode; onClick: () => void; disabled?: boolean};
function FriendAction({children,onClick,disabled=false}:FriendActionProps) {
  return <button type="button" data-action="advance" className="friend-btn" onClick={onClick} disabled={disabled}>
    <span>{children}</span><span className="friend-btn-icon" aria-hidden="true">↗</span>
  </button>;
}

export default function FriendshipScenes({ scene, experience, photos, memory, letterText, anecdote, date, next, restart, onUnlock }: Props) {
  const [doorOpen, setDoorOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [uncovered, setUncovered] = useState<number[]>([]);
  const [activePresence, setActivePresence] = useState(-1);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [pactSealed, setPactSealed] = useState(false);
  const [signatureOpen,setSignatureOpen] = useState(false);
  const [signatureImage,setSignatureImage] = useState<string|null>(null);
  const [signedAt,setSignedAt] = useState<string|null>(null);
  const [activeIncident,setActiveIncident] = useState(-1);
  const [reaction, setReaction] = useState("");
  const pointerStart = useRef<{x:number;y:number}|null>(null);
  const reveal = (i:number) => setUncovered(items => items.includes(i) ? items : [...items,i]);
  const signatureKey = `thi-friendship-signature-v1:${experience.slug}:${experience.demoGiver}:${experience.demoRecipient}`;
  useEffect(()=>{
    if(scene!=="pact")return;
    try{
      const key=signatureKey+":"+window.location.pathname;
      const raw=window.localStorage.getItem(key);
      if(!raw)return;
      const saved=JSON.parse(raw) as {image?:string;signedAt?:string};
      if(saved.image?.startsWith("data:image/png;base64,")&&saved.image.length<350_000){
        setSignatureImage(saved.image);
        setSignedAt(saved.signedAt||null);
        setPactSealed(true);
      }
    }catch{/* Storage can be unavailable in privacy mode. */}
  },[scene,signatureKey]);
  const saveSignature=(image:string,time:string)=>{
    setSignatureImage(image);
    setSignedAt(time);
    setPactSealed(true);
    setSignatureOpen(false);
    try{window.localStorage.setItem(signatureKey+":"+window.location.pathname,JSON.stringify({image,signedAt:time}))}catch{/* Keep signed in current session. */}
  };

  useEffect(() => {
    if (scene !== "intro" || !doorOpen) return;
    const timer = window.setTimeout(next, 1200);
    return () => window.clearTimeout(timer);
  }, [scene, doorOpen, next]);

  useEffect(() => {
    const ready = scene === "intro" ? doorOpen : scene === "casefile" ? folderOpen : scene === "memories" ? true : scene === "insidejokes" || scene === "incidents" || scene === "proof" ? uncovered.length >= 3 : scene === "letter" ? envelopeOpen : scene === "pact" ? pactSealed : false;
    onUnlock(ready);
  }, [scene,doorOpen,folderOpen,uncovered,envelopeOpen,pactSealed,onUnlock]);



  if (scene === "intro") return (
    <section className={"thi-scene friendship-scene friend-entrance" + (doorOpen ? " door-is-open" : "")}>
      <div className="friend-ambient friend-ambient-a" aria-hidden="true" />
      <div className="friend-intro-copy">
        <p className="friend-overline">EXPEDIENTE PERSONAL · ACCESO EXCLUSIVO</p>
        <h1>Algunas amistades no se explican.<br /><em>Se abren.</em></h1>
        <p className="friend-description">Detrás de esta puerta está el archivo confidencial de una amistad legendaria. Pruebas, recuerdos y todo eso que solo ustedes entienden.</p>
        <FriendAction onClick={() => setDoorOpen(true)}>{doorOpen ? "Abriendo recuerdos…" : "Abrir la puerta"}</FriendAction>
        <small>Una experiencia preparada por {experience.demoGiver}</small>
      </div>
      <div className="friend-door-scene">
        <div className="friend-door-halo" aria-hidden="true" />
        <div className="friend-door-portal">
          <span className="friend-door-interior" aria-hidden="true"><i>✦</i></span>
          <button type="button" data-action="open-door" className="friend-real-door" onClick={() => setDoorOpen(true)} aria-label={"Abrir la puerta de " + experience.demoRecipient}>
            <span className="friend-door-panel friend-door-panel-top" />
            <span className="friend-door-name">{experience.demoRecipient}</span>
            <span className="friend-door-flourish">✧</span>
            <span className="friend-door-panel friend-door-panel-bottom" />
            <span className="friend-door-handle" aria-hidden="true" />
          </button>
        </div>
        <span className="friend-door-plate">AMISTAD<br />BAJO INVESTIGACIÓN</span>
      </div>
      <span className="friend-scene-number">01 — EL UMBRAL</span>
    </section>
  );

  if (scene === "casefile") return (
    <section className="thi-scene friendship-scene friend-case-scene">
      <p className="friend-overline">EXPEDIENTE 021 · NIVEL DE ACCESO: CUESTIONABLE</p>
      <h2>Hay pruebas suficientes para confirmar que esto se nos fue de las manos hace años.</h2>
      <p className="friend-subline">Algunas amistades no se explican. Se investigan.</p>
      <div className="friend-file-desk">
        <span className="friend-desk-circle" aria-hidden="true" />
        <span className="friend-desk-photo" aria-hidden="true" style={{backgroundImage:'url("'+photos[0]?.url+'")'}}/>
        <div className="friend-paper-under" />
        <button type="button" data-action="casefile-open" className={"friend-case-folder"+(folderOpen?" open":"")} onClick={()=>setFolderOpen(true)} aria-expanded={folderOpen} aria-label="Desclasificar expediente">
          <span className="friend-case-tab">{experience.demoRecipient.toUpperCase()} + {experience.demoGiver.toUpperCase()}</span>
          <span className="friend-case-inside"><small>INFORME PRELIMINAR · 021</small><strong>Conclusión:</strong><span>Demasiadas historias compartidas como para fingir que esto sigue siendo una amistad normal.</span></span>
          <span className="friend-case-cover">
            <span className="friend-file-mini">ARCHIVO CONFIDENCIAL · 021</span>
            <strong>EXPEDIENTE<br />DE NUESTRA<br />AMISTAD</strong>
            <span className="friend-file-details">Incidentes · evidencia · códigos · reincidencia</span>
            <span className="friend-classified">CLASIFICADO</span>
          </span>
        </button>
      </div>
      {!folderOpen ? <p className="friend-hint">Tocá el expediente para desclasificarlo</p> : <FriendAction onClick={next}>Ver la evidencia</FriendAction>}
    </section>
  );

  if (scene === "memories") return (
    <section className="thi-scene friendship-scene friend-memories">
      <p className="friend-overline">PRUEBAS FOTOGRÁFICAS · IRREFUTABLES</p>
      <h2>Algunas fotos demuestran que claramente nadie estaba tomando buenas decisiones.</h2>
      {date && <p className="friend-date">{date}</p>}
      <div className="friend-photo-gallery">
        {photos.map((photo,index)=>(
          <figure key={index} className="friend-polaroid">
            <div className="friend-photo-image" style={{backgroundImage:'url("'+photo.url+'")',backgroundSize:photo.fit||"cover",backgroundPosition:photo.position||"center"}} />
            <figcaption>{photo.caption || (index === 0 && anecdote?.trim() ? anecdote.trim() : memory[index % memory.length])}</figcaption>
            <small>EVIDENCIA {String(index+1).padStart(2,"0")}</small>
          </figure>
        ))}
      </div>
      <FriendAction onClick={next}>Hay más pruebas</FriendAction>
    </section>
  );

  if (scene === "insidejokes") return (
    <section className="thi-scene friendship-scene friend-codes">
      <p className="friend-overline">DICCIONARIO NO AUTORIZADO · CÓDIGOS COMPARTIDOS</p>
      <h2>Hay un idioma que sólo existe porque nos conocemos demasiado.</h2>
      <p className="friend-subline">Cuatro frases. Miles de significados. Ningún traductor podría entenderlas.</p>
      <div className="friend-code-library">
        {codes.map(([code,meaning],i)=>(
          <button type="button" key={code} data-action="insidejoke-open" className={"friend-code-book" + (uncovered.includes(i)?" open":"")} onClick={()=>{reveal(i);setActiveIncident(i)}} aria-expanded={activeIncident===i}>
            <span className="friend-code-front"><small>CÓDIGO · 0{i+1}</small><b>✧</b><strong>{code}</strong><em>ABRIR Y DESCIFRAR <span>↗</span></em></span>
            <span className="friend-code-reveal"><small>TRADUCCIÓN CONFIDENCIAL</small><strong>{code}</strong><span>{meaning}</span><em>DESCIFRADO ✓</em></span>
          </button>
        ))}
      </div>
      <FriendAction onClick={next} disabled={uncovered.length<3}>{uncovered.length<3 ? "Descifrá al menos tres códigos" : "Revisar los antecedentes"}</FriendAction>
    </section>
  );

  if (scene === "incidents") return (
    <section className="thi-scene friendship-scene friend-incidents">
      <p className="friend-overline">ANTECEDENTES · REINCIDENCIA CONFIRMADA</p>
      <h2>No digo que esta dupla tome malas decisiones. Digo que hay evidencia.</h2>
      <p className="friend-subline">Tocá los papeles. Algunas historias estaban mejor archivadas.</p>
      <div className="friend-evidence-board">
        <span className="friend-thread friend-thread-one" aria-hidden="true" /><span className="friend-thread friend-thread-two" aria-hidden="true" />
        {incidents.map(([number,title,,short],i)=>(
          <button type="button" key={number} data-action="incident-open" className={"friend-evidence-note friend-note-"+i+(uncovered.includes(i)?" open":"")} onClick={()=>reveal(i)} aria-expanded={uncovered.includes(i)}>
            <span className="friend-note-tape" aria-hidden="true" />
            <span className="friend-note-front"><small>{number} · ARCHIVO</small><strong>{short}</strong><span>{uncovered.includes(i)?"✓ EVIDENCIA REVISADA":"TOCÁ PARA ABRIR ↗"}</span></span>
          </button>
        ))}
      </div>
      <aside className={"friend-case-insight"+(activeIncident>=0?" active":"")} aria-live="polite">
        <div className="friend-case-insight-label"><span>✧</span><small>{activeIncident<0?"ARCHIVO 021 · ELEGÍ UNA PRUEBA":incidents[activeIncident][0]+" · EVIDENCIA CONFIRMADA"}</small></div>
        <strong>{activeIncident<0?"Las anécdotas que no entran en una foto.":incidents[activeIncident][1]}</strong>
        <p>{activeIncident<0?"Tocá cualquiera de las cuatro fichas para revelar su historia.":incidents[activeIncident][2]}</p>
        {activeIncident>=0&&<span className="friend-case-insight-stamp">✓ CASO CONFIRMADO</span>}
      </aside>
      <FriendAction onClick={next} disabled={uncovered.length<3}>{uncovered.length<3 ? "Descubrí tres expedientes" : "Las pruebas que importan"}</FriendAction>
    </section>
  );

  if (scene === "proof") return (
    <section className="thi-scene friendship-scene friend-presence">
      <p className="friend-overline">REGISTRO DE PRESENCIAS · PRUEBAS SILENCIOSAS</p>
      <h2>Porque estar de verdad también fue aparecer cuando no había nada divertido para contar.</h2>
      <p className="friend-subline">Hay presencias que no hacen ruido. Pero sostienen toda la historia.</p>
      <div className="friend-presence-layout">
        <div className="friend-presence-timeline">
          {presences.map(([title],i)=>(
            <button type="button" key={title} data-action="proof-open" className={"friend-presence-entry"+(activePresence===i?" active":"")+(uncovered.includes(i)?" visited":"")} onClick={()=>{reveal(i);setActivePresence(i)}} aria-expanded={activePresence===i}>
              <span>{String(i+1).padStart(2,"0")}</span><strong>{title}</strong><span className="friend-presence-icon">{activePresence===i?"✦":"+"}</span>
            </button>
          ))}
        </div>
        <div className={"friend-presence-memory"+(activePresence>=0?" is-lit":"")}>
          <div className="friend-presence-image" style={{backgroundImage:'url("'+photos[0]?.url+'")'}} />
          <div className="friend-presence-note">
            <small>{activePresence>=0?"PRUEBA SILENCIOSA · 0"+(activePresence+1):"UN RECUERDO POR DESCUBRIR"}</small>
            <p>{activePresence>=0 ? presences[activePresence][1] : "Tocá un momento a la izquierda. Algunas cosas se iluminarán por primera vez."}</p>
            <em>{activePresence>=0?"Siempre estuviste.":"✦"}</em>
          </div>
        </div>
      </div>
      <FriendAction onClick={next} disabled={uncovered.length<3}>{uncovered.length<3?"Iluminá tres recuerdos":"Hay algo que quiero decirte"}</FriendAction>
    </section>
  );

  if (scene === "letter") return (
    <section className="thi-scene friendship-scene friend-letter-scene">
      <p className="friend-overline">NO USES ESTO EN MI CONTRA</p>
      <h2>Me voy a poner seria durante treinta segundos.</h2>
      <div className={"friend-envelope-wrap"+(envelopeOpen?" open":"")}>
        <div className="friend-envelope-glow" aria-hidden="true" />
        <div data-action="letter-open" className="friend-envelope-object" role="button" tabIndex={0} aria-expanded={envelopeOpen} aria-label="Abrir la carta personal" onClick={()=>setEnvelopeOpen(true)} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setEnvelopeOpen(true)}}}
          onPointerDown={(e)=>{pointerStart.current={x:e.clientX,y:e.clientY}}} onPointerUp={(e)=>{if(pointerStart.current&&Math.abs(e.clientY-pointerStart.current.y)>35)setEnvelopeOpen(true);pointerStart.current=null}} onPointerCancel={()=>{pointerStart.current=null}}>
          <div className="friend-envelope-back" />
          <div className="friend-envelope-flap" />
          <div className="friend-letter-sheet">
            <small>Para {experience.demoRecipient}</small>
            <p>{letterText || "Gracias por conocer versiones mías que ya ni existen y quererme también en esas. Por celebrar conmigo sin competir, por decirme la verdad cuando no era lo que quería escuchar y por aparecer tantas veces sin que tuviera que pedirlo."}</p>
            <em>— {experience.demoGiver}</em>
          </div>
          <div className="friend-envelope-pocket" />
          <div className="friend-envelope-seal"><span>♥</span></div>
        </div>
      </div>
      <p className="friend-hint">{envelopeOpen?"Una carta que ya es parte de la historia.":"Tocá el sello o deslizá hacia arriba para abrir"}</p>
      {envelopeOpen && <FriendAction onClick={next}>Para que quede por escrito</FriendAction>}
    </section>
  );

  if (scene === "pact") return (
    <section className={"scene friendship-scene friend-pact-scene"+(pactSealed?" fully-sealed":"")}>
      <p className="friend-overline">PACTO NO LEGAL · VIGENCIA INDEFINIDA</p>
      <h2>Para que quede por escrito, por si alguna vez la vida se pone demasiado seria.</h2>
      <div className="friend-pact-desk">
        <div className="friend-pact-document">
          <header><small>EXPEDIENTE · 021</small><span>✧</span><h3>PACTO DE AMISTAD</h3><p>{experience.demoGiver} + {experience.demoRecipient}</p></header>
          <div className="friend-clause-list">
            {clauses.map(([no,copy],i)=>(
              <button type="button" key={no} data-action="pact-open" className={"friend-clause"+(uncovered.includes(i)?" signed":"")} onClick={()=>reveal(i)} aria-pressed={uncovered.includes(i)}>
                <span className="friend-clause-numeral">{no}</span><span className="friend-clause-copy">{copy}</span><span className="friend-clause-seal">{uncovered.includes(i)?"✓":"✦"}<small>{uncovered.includes(i)?"ACEPTADO":"ACEPTAR"}</small></span>
              </button>
            ))}
          </div>
          <footer>
            <small>{pactSealed?"PACTO SELLADO CON TU FIRMA":"FIRMADO PARA QUE NUNCA SE NOS OLVIDE"}</small>
            <div className="friend-pact-signatures">
              <span className="friend-pact-prepared"><em>{experience.demoGiver}</em><small>QUIEN LO HIZO PARA VOS</small></span>
              <span className="friend-pact-join">+</span>
              <span className="friend-pact-personal">
                {signatureImage?<img className="friend-pact-handwritten" src={signatureImage} alt={"Firma manuscrita de "+experience.demoRecipient}/>:<em>{experience.demoRecipient}</em>}
                <small>{pactSealed?"FIRMADO POR "+experience.demoRecipient.toUpperCase():"ESPERANDO TU FIRMA"}</small>
              </span>
            </div>
            {pactSealed&&signedAt&&<p className="friend-pact-date">Sellado el {new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(signedAt))}</p>}
          </footer>
          <span className="friend-pact-stamp">AMISTAD<br />REAL</span>
        </div>
      </div>
      {!pactSealed ? <FriendAction disabled={uncovered.length<4} onClick={()=>setSignatureOpen(true)}>{uncovered.length<4?"Aceptá las cuatro cláusulas":"✧ Firmar nuestro pacto"}</FriendAction> : <><p className="friend-pact-complete">✦ Queda firmado: esta amistad no tiene fecha de vencimiento. ✦</p><button type="button" className="friend-pact-resign" onClick={()=>setSignatureOpen(true)}>Volver a firmar ↗</button><FriendAction onClick={next}>Una última cosa</FriendAction></>}
      {signatureOpen&&<FriendSignaturePad signer={experience.demoRecipient} onDismiss={()=>setSignatureOpen(false)} onConfirm={saveSignature}/>}
      {pactSealed && <div className="friend-pact-burst" aria-hidden="true">{Array.from({length:15},(_,i)=><i key={i} style={{"--i":i} as React.CSSProperties}>✧</i>)}</div>}
    </section>
  );

  return (
    <section className="thi-scene friendship-scene friend-finale">
      <div className="friend-final-halo" aria-hidden="true" />
      <p className="friend-overline">ARCHIVO CERRADO · AMISTAD CONFIRMADA</p>
      <h2>{experience.closing}</h2>
      <p>La familia no siempre llega dada. A veces aparece un día cualquiera, se queda después de demasiadas historias y un día te das cuenta de que ya era casa.</p>
      <div className="friend-final-names">{experience.demoGiver}<span>✧</span>{experience.demoRecipient}</div>
      <div className="friend-reactions">{["🥹","❤️","😭","✨"].map(item=><button key={item} type="button" className={reaction===item?"selected":""} aria-label={"Reaccionar "+item} onClick={()=>setReaction(item)}>{item}</button>)}</div>
      <button type="button" data-action="restart" className="friend-restart" onClick={restart}>↶ Volver a vivirlo</button>
      <small>HECHO CON AMOR · TE HICE ESTO</small>
    </section>
  );
}
