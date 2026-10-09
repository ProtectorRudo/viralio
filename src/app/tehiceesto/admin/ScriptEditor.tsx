"use client";

import { useMemo,useState } from "react";
import type { Experience,SceneType } from "../data";
import { getExperienceCopy,type DeepPartial,type ExperienceCopy } from "../experienceCopy";

type FieldKind="text"|"textarea"|"lines"|"number";
type FieldDef={path:string;label:string;kind:FieldKind;hint?:string};

const sceneNames:Record<SceneType,string>={
  intro:"Entrada",door:"Puerta",memories:"Recuerdos",light:"Luz",stars:"Estrellas",everyday:"Un día cualquiera",
  scratch:"Raspadita",hold:"Mantener",letter:"Carta",candles:"Velitas",balloons:"Globos",
  timeline:"Línea de tiempo",voices:"Audio / voces",quiz:"Pregunta",vault:"Bóveda",
  capsule:"Cápsula",video:"Video",proposal:"Propuesta",finale:"Final",
  archive:"Archivo familiar",home:"La casa",legacy:"Legado",rituals:"Rituales",
  chapters:"Capítulos",future:"Futuro",origin:"Origen",reasons:"Razones",
  certainty:"Certeza",threshold:"Umbral",childhood:"Infancia",care:"Cuidados",
  sacrifices:"Sacrificios",return:"Volver",lessons:"Lecciones",presence:"Presencia",
  inheritance:"Herencia",lookback:"Mirar de nuevo",casefile:"Expediente",
  insidejokes:"Códigos internos",incidents:"Incidentes",proof:"Pruebas",pact:"Pacto",
};

const sceneDescriptions:Partial<Record<SceneType,string>>={
  intro:"La primera impresión. Tiene que sonar como la persona que regala.",
  door:"La invitación a entrar y el pequeño suspenso antes de empezar.",
  memories:"El bloque más autobiográfico: fotos, momentos y frases que sólo ellos reconocen.",
  light:"Una frase escondida que aparece al explorar la oscuridad.",
  stars:"Razones, cualidades o pequeñas cosas que la otra persona reconoce como propias.",
  everyday:"Una habitación íntima: las tres frases aparecen al tocar las tazas, la ventana y el portarretrato.",
  scratch:"Una sorpresa concreta: plan, promesa, cupón o próximo recuerdo.",
  hold:"El segundo de pausa antes de una revelación emocional.",
  letter:"La parte más íntima del recorrido.",
  candles:"El ritual de cumpleaños: deseo, instrucción y confirmación.",
  balloons:"Mensajes cortos que aparecen uno a uno.",
  timeline:"Hitos de una historia contados en orden.",
  voices:"Cómo se presenta y acompaña una nota de voz o varios mensajes.",
  quiz:"Pregunta, opciones y frase posterior a la respuesta.",
  vault:"El suspenso previo a una revelación importante.",
  capsule:"Mensaje destinado al futuro.",
  video:"Textos que enmarcan un video real.",
  proposal:"La escena final de una propuesta.",
  finale:"La última frase que queremos que quede resonando.",
  lessons:"Aprendizajes de Papá. Cada renglón usa el formato Título | Texto.",
  presence:"Formas concretas en las que estuvo presente. Formato Título | Texto.",
  inheritance:"Gestos, frases y rasgos que quedaron en quien recibe el regalo. Formato Título | Texto.",
  lookback:"El giro adulto: dejar de mirar sólo al padre y reconocer también al hombre.",
};

const fields:Partial<Record<SceneType,FieldDef[]>>={
  intro:[
    {path:"intro.kicker",label:"Frase superior",kind:"text"},
    {path:"intro.title",label:"Nombre / título principal",kind:"text"},
    {path:"intro.lead",label:"Mensaje de apertura",kind:"textarea"},
    {path:"intro.cta",label:"Botón de entrada",kind:"text"},
    {path:"intro.footnote",label:"Texto pequeño inferior",kind:"text"},
  ],
  door:[
    {path:"door.kicker",label:"Frase superior",kind:"text"},
    {path:"door.title",label:"Título",kind:"lines",hint:"Una línea visual por renglón."},
    {path:"door.closedHint",label:"Instrucción antes de abrir",kind:"text"},
    {path:"door.openCta",label:"Botón después de abrir",kind:"text"},
  ],
  memories:[
    {path:"memories.kicker",label:"Frase superior",kind:"text"},
    {path:"memories.title",label:"Título",kind:"lines",hint:"Una línea visual por renglón."},
    {path:"memories.items",label:"Textos de recuerdos",kind:"lines",hint:"Uno por renglón. Se combinan con las fotos cargadas."},
    {path:"memories.cta",label:"Botón para continuar",kind:"text"},
  ],
  light:[
    {path:"light.kicker",label:"Frase superior",kind:"text"},
    {path:"light.title",label:"Título",kind:"text"},
    {path:"light.secret",label:"Frase final de la linterna",kind:"textarea"},
    {path:"light.clues",label:"Tres recuerdos para encontrar con la linterna (Cumpleaños)",kind:"lines",hint:"Escribí tres frases, una para cada recuerdo. Se descubren moviendo la linterna."},
    {path:"light.hint",label:"Instrucción antes de revelar",kind:"text"},
    {path:"light.revealedLabel",label:"Texto después de revelar",kind:"text"},
    {path:"light.cta",label:"Botón para continuar",kind:"text"},
    {path:"light.ariaLabel",label:"Descripción accesible",kind:"text"},
  ],
  stars:[
    {path:"stars.kicker",label:"Frase superior",kind:"text"},
    {path:"stars.title",label:"Título",kind:"lines"},
    {path:"stars.items",label:"Mensajes de las estrellas",kind:"lines",hint:"Uno por renglón."},
    {path:"stars.hiddenLabel",label:"Texto antes de tocar cada estrella",kind:"text"},
    {path:"stars.completeLabel",label:"Mensaje al completar",kind:"text"},
    {path:"stars.remainingOne",label:"Cuando falta una",kind:"text"},
    {path:"stars.remainingMany",label:"Cuando faltan varias",kind:"text",hint:"Usá {count} para mostrar el número."},
    {path:"stars.cta",label:"Botón para continuar",kind:"text"},
  ],
  everyday:[
    {path:"everyday.kicker",label:"Frase superior",kind:"text"},
    {path:"everyday.title",label:"Pregunta de entrada",kind:"text"},
    {path:"everyday.hint",label:"Instrucción al explorar la habitación",kind:"text"},
    {path:"everyday.moments",label:"Las 3 frases: tazas, ventana y portarretrato",kind:"lines",hint:"Exactamente 3 renglones, uno por objeto. Se conservan el orden, los efectos y las interacciones."},
    {path:"everyday.closing",label:"Frase final de la habitación",kind:"textarea"},
    {path:"everyday.cta",label:"Botón de continuación",kind:"text"},
  ],
  scratch:[
    {path:"scratch.kicker",label:"Frase superior",kind:"text"},
    {path:"scratch.title",label:"Título",kind:"lines"},
    {path:"scratch.eyebrow",label:"Texto pequeño del premio",kind:"text"},
    {path:"scratch.reward",label:"Premio / sorpresa",kind:"textarea"},
    {path:"scratch.note",label:"Aclaración inferior",kind:"text"},
    {path:"scratch.coverTitle",label:"Texto sobre la raspadita",kind:"text"},
    {path:"scratch.coverHint",label:"Instrucción para raspar",kind:"text"},
    {path:"scratch.fallbackLabel",label:"Opción para revelar sin raspar",kind:"text"},
    {path:"scratch.cta",label:"Botón después de descubrir",kind:"text"},
  ],
  hold:[
    {path:"hold.kicker",label:"Frase superior",kind:"text"},
    {path:"hold.title",label:"Título",kind:"lines"},
    {path:"hold.prompt",label:"Texto junto al símbolo",kind:"text"},
    {path:"hold.instruction",label:"Instrucción para mantener",kind:"text"},
    {path:"hold.symbol",label:"Símbolo",kind:"text"},
    {path:"hold.reveal",label:"Frase que aparece al completar",kind:"textarea"},
    {path:"hold.cta",label:"Botón para continuar",kind:"text"},
  ],
  letter:[
    {path:"letter.kicker",label:"Frase superior",kind:"text"},
    {path:"letter.title",label:"Título",kind:"lines"},
    {path:"letter.recipientLabel",label:"Encabezado de la carta",kind:"text",hint:"Podés usar {recipient}."},
    {path:"letter.body",label:"Cuerpo de la carta",kind:"textarea"},
    {path:"letter.signature",label:"Firma",kind:"text",hint:"Podés usar {giver}."},
    {path:"letter.sealHint",label:"Instrucción antes de abrir",kind:"text"},
    {path:"letter.cta",label:"Botón después de leer",kind:"text"},
  ],
  candles:[
    {path:"candles.kicker",label:"Frase superior",kind:"text"},
    {path:"candles.title",label:"Título",kind:"lines"},
    {path:"candles.micIdle",label:"Botón para activar micrófono",kind:"text"},
    {path:"candles.micActive",label:"Texto mientras escucha",kind:"text"},
    {path:"candles.tapFallback",label:"Alternativa para apagar tocando",kind:"text"},
    {path:"candles.tapUnavailable",label:"Texto si el micrófono no está disponible",kind:"text"},
    {path:"candles.wishLabel",label:"Confirmación del deseo",kind:"text"},
    {path:"candles.cta",label:"Botón para continuar",kind:"text"},
  ],
  balloons:[
    {path:"balloons.kicker",label:"Frase superior",kind:"text"},
    {path:"balloons.title",label:"Título",kind:"lines"},
    {path:"balloons.items",label:"Mensajes dentro de los globos",kind:"lines",hint:"Uno por renglón."},
    {path:"balloons.popLabel",label:"Texto del globo sin abrir",kind:"text"},
    {path:"balloons.remainingOne",label:"Cuando falta uno",kind:"text"},
    {path:"balloons.remainingMany",label:"Cuando faltan varios",kind:"text",hint:"Usá {count} para mostrar el número."},
    {path:"balloons.cta",label:"Botón para continuar",kind:"text"},
  ],
  timeline:[
    {path:"timeline.kicker",label:"Frase superior",kind:"text"},
    {path:"timeline.title",label:"Título",kind:"lines"},
    {path:"timeline.cta",label:"Botón para continuar",kind:"text"},
  ],
  voices:[
    {path:"voices.kicker",label:"Frase superior",kind:"text"},
    {path:"voices.title",label:"Título",kind:"lines"},
    {path:"voices.intro",label:"Bajada emocional",kind:"textarea"},
    {path:"voices.cardIntros",label:"Introducción de cada voz",kind:"lines",hint:"Una por voz. Se muestra antes de la transcripción."},
    {path:"voices.noteLabel",label:"Etiqueta de la nota",kind:"text",hint:"Podés usar {name}."},
    {path:"voices.playLabel",label:"Texto antes de reproducir",kind:"text"},
    {path:"voices.playingLabel",label:"Texto mientras reproduce",kind:"text"},
    {path:"voices.outroTitle",label:"Frase de cierre",kind:"text"},
    {path:"voices.outroBody",label:"Cierre emocional",kind:"textarea"},
    {path:"voices.cta",label:"Botón para continuar",kind:"text"},
  ],
  quiz:[
    {path:"quiz.kicker",label:"Frase superior",kind:"text"},
    {path:"quiz.question",label:"Pregunta",kind:"textarea"},
    {path:"quiz.answers",label:"Opciones",kind:"lines",hint:"Una por renglón."},
    {path:"quiz.correctIndex",label:"Número de respuesta correcta",kind:"number",hint:"1 = primera opción, 2 = segunda, etc."},
    {path:"quiz.after",label:"Mensaje después de responder",kind:"textarea"},
    {path:"quiz.cta",label:"Botón para continuar",kind:"text"},
  ],
  vault:[
    {path:"vault.kicker",label:"Frase superior",kind:"text"},
    {path:"vault.title",label:"Título",kind:"lines"},
    {path:"vault.closedLabel",label:"Texto de la bóveda cerrada",kind:"text"},
    {path:"vault.closedSmall",label:"Texto pequeño cerrada",kind:"text"},
    {path:"vault.openLabel",label:"Texto de la bóveda abierta",kind:"text"},
    {path:"vault.openSmall",label:"Texto pequeño abierta",kind:"text"},
    {path:"vault.reveal",label:"Revelación",kind:"textarea"},
    {path:"vault.cta",label:"Botón para continuar",kind:"text"},
  ],
  capsule:[
    {path:"capsule.kicker",label:"Frase superior",kind:"text"},
    {path:"capsule.title",label:"Título",kind:"lines"},
    {path:"capsule.year",label:"Año de la cápsula",kind:"text"},
    {path:"capsule.closedLabel",label:"Etiqueta cerrada",kind:"text"},
    {path:"capsule.closed",label:"Mensaje antes de abrir",kind:"textarea"},
    {path:"capsule.openLabel",label:"Etiqueta abierta",kind:"text"},
    {path:"capsule.open",label:"Mensaje después de abrir",kind:"textarea"},
    {path:"capsule.cta",label:"Botón para continuar",kind:"text"},
  ],
  video:[
    {path:"video.kicker",label:"Frase superior",kind:"text"},
    {path:"video.title",label:"Título",kind:"lines"},
    {path:"video.placeholder",label:"Texto si todavía no hay video",kind:"text"},
    {path:"video.cta",label:"Botón para continuar",kind:"text"},
  ],
  lessons:[
    {path:"lessons.kicker",label:"Frase superior",kind:"text"},
    {path:"lessons.title",label:"Título principal",kind:"textarea"},
    {path:"lessons.accentTitle",label:"Línea destacada",kind:"text"},
    {path:"lessons.titleTail",label:"Cierre del título",kind:"textarea"},
    {path:"lessons.items",label:"Recuerdos emocionales",kind:"lines",hint:"Una por renglón: Título | Texto. Mantené al menos 4 para Papá."},
    {path:"lessons.closedLabel",label:"Texto antes de abrir",kind:"text"},
    {path:"lessons.outroTitle",label:"Frase de cierre",kind:"text"},
    {path:"lessons.outroBody",label:"Cierre emocional",kind:"textarea"},
    {path:"lessons.cta",label:"Botón para continuar",kind:"text"},
  ],
  presence:[
    {path:"presence.kicker",label:"Frase superior",kind:"text"},
    {path:"presence.title",label:"Título",kind:"textarea"},
    {path:"presence.subtitle",label:"Bajada emocional",kind:"text"},
    {path:"presence.items",label:"Formas de estar",kind:"lines",hint:"Una por renglón: Título | Texto. Para Papá, mantené 3."},
    {path:"presence.closedLabel",label:"Texto antes de revelar",kind:"text"},
    {path:"presence.outroTitle",label:"Frase de cierre",kind:"text"},
    {path:"presence.outroBody",label:"Cierre emocional",kind:"textarea"},
    {path:"presence.cta",label:"Botón para continuar",kind:"text"},
  ],
  inheritance:[
    {path:"inheritance.kicker",label:"Frase superior",kind:"text"},
    {path:"inheritance.title",label:"Título",kind:"textarea"},
    {path:"inheritance.subtitle",label:"Bajada emocional",kind:"textarea"},
    {path:"inheritance.items",label:"Huellas que quedaron",kind:"lines",hint:"Una por renglón: Título | Texto. Para Papá, mantené 4."},
    {path:"inheritance.closedLabel",label:"Texto antes de revelar",kind:"text"},
    {path:"inheritance.outroTitle",label:"Frase de cierre",kind:"text"},
    {path:"inheritance.outroBody",label:"Cierre emocional",kind:"textarea"},
    {path:"inheritance.cta",label:"Botón para continuar",kind:"text"},
  ],
  lookback:[
    {path:"lookback.kicker",label:"Frase superior",kind:"text"},
    {path:"lookback.closedTitle",label:"Frase antes de revelar",kind:"textarea"},
    {path:"lookback.openTitle",label:"Frase revelada",kind:"textarea"},
    {path:"lookback.openLabel",label:"Botón para revelar",kind:"text"},
    {path:"lookback.cta",label:"Botón para continuar",kind:"text"},
  ],
  finale:[
    {path:"finale.kicker",label:"Frase superior",kind:"text"},
    {path:"finale.title",label:"Frase final",kind:"textarea"},
    {path:"finale.lead",label:"Texto debajo",kind:"textarea"},
    {path:"finale.reactions",label:"Reacciones",kind:"lines",hint:"Una por renglón."},
    {path:"finale.restartLabel",label:"Botón para volver a empezar",kind:"text"},
    {path:"finale.createdWith",label:"Firma de Te Hice Esto",kind:"text"},
    {path:"finale.fromLabel",label:"De quiénes es el regalo (Cumpleaños)",kind:"text",hint:"Ejemplo: Con cariño, Lautaro, papá y Carlos."},
  ],
  proposal:[
    {path:"proposal.kicker",label:"Frase superior",kind:"text"},
    {path:"proposal.title",label:"La pregunta",kind:"textarea"},
    {path:"proposal.lead",label:"Texto debajo",kind:"textarea"},
    {path:"proposal.reactions",label:"Reacciones / respuestas",kind:"lines",hint:"Una por renglón."},
    {path:"proposal.createdWith",label:"Firma inferior",kind:"text"},
  ],
};

function isRecord(value:unknown):value is Record<string,unknown>{
  return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
}
function readPath(root:unknown,path:string):unknown{
  return path.split(".").reduce<unknown>((cursor,key)=>isRecord(cursor)?cursor[key]:undefined,root);
}
function writePath<T>(root:T,path:string,value:unknown):T{
  const clone=JSON.parse(JSON.stringify(root||{})) as Record<string,unknown>;
  const keys=path.split(".");
  let cursor=clone;
  for(const key of keys.slice(0,-1)){
    const current=cursor[key];
    if(!isRecord(current)) cursor[key]={};
    cursor=cursor[key] as Record<string,unknown>;
  }
  cursor[keys[keys.length-1]]=value;
  return clone as T;
}
function removeSection(value:DeepPartial<ExperienceCopy>,section:string){
  const clone=JSON.parse(JSON.stringify(value||{})) as Record<string,unknown>;
  delete clone[section];
  return clone as DeepPartial<ExperienceCopy>;
}
function displayValue(value:unknown,kind:FieldKind){
  if(kind==="lines") return Array.isArray(value)?value.map(String).join("\n"):"";
  if(kind==="number") return String(Number(value||0)+1);
  return typeof value==="string"?value:"";
}
function normalizeValue(raw:string,kind:FieldKind){
  if(kind==="lines") return raw.split("\n").map(line=>line.trim()).filter(Boolean);
  if(kind==="number") return Math.max(0,Number.parseInt(raw||"1",10)-1);
  return raw;
}

function TimelineRows({entries,onChange}:{entries:{title:string;body:string}[];onChange:(entries:{title:string;body:string}[])=>void}){
  return <div className="thi-script-structured">
    <div className="thi-script-field-heading"><span>Momentos de la línea de tiempo</span><small>Título + texto de cada hito.</small></div>
    {entries.map((entry,index)=><article key={index}>
      <b>{String(index+1).padStart(2,"0")}</b>
      <input value={entry.title} onChange={e=>onChange(entries.map((item,i)=>i===index?{...item,title:e.target.value}:item))} placeholder="Título del momento"/>
      <textarea rows={3} value={entry.body} onChange={e=>onChange(entries.map((item,i)=>i===index?{...item,body:e.target.value}:item))} placeholder="Qué pasó y por qué importa"/>
      <button type="button" onClick={()=>onChange(entries.filter((_,i)=>i!==index))}>Eliminar</button>
    </article>)}
    <button type="button" className="thi-script-add" onClick={()=>onChange([...entries,{title:"Nuevo momento",body:""}])}>+ Agregar momento</button>
  </div>;
}

function VoiceRows({entries,onChange}:{entries:{name:string;message:string}[];onChange:(entries:{name:string;message:string}[])=>void}){
  return <div className="thi-script-structured">
    <div className="thi-script-field-heading"><span>Mensajes de voz del demo</span><small>En un regalo real, el audio cargado reemplaza la voz simulada; este texto queda como transcripción.</small></div>
    {entries.map((entry,index)=><article key={index}>
      <b>♪</b>
      <input value={entry.name} onChange={e=>onChange(entries.map((item,i)=>i===index?{...item,name:e.target.value}:item))} placeholder="Quién habla"/>
      <textarea rows={3} value={entry.message} onChange={e=>onChange(entries.map((item,i)=>i===index?{...item,message:e.target.value}:item))} placeholder="Qué dice"/>
      <button type="button" onClick={()=>onChange(entries.filter((_,i)=>i!==index))}>Eliminar</button>
    </article>)}
    <button type="button" className="thi-script-add" onClick={()=>onChange([...entries,{name:"Nueva voz",message:""}])}>+ Agregar voz</button>
  </div>;
}

export default function ScriptEditor({experience,recipe,value,onChange,onPreviewScene}:{experience:Experience;recipe:SceneType[];value:DeepPartial<ExperienceCopy>;onChange:(value:DeepPartial<ExperienceCopy>)=>void;onPreviewScene:(scene:SceneType)=>void}){
  const uniqueScenes=useMemo(()=>Array.from(new Set(recipe)),[recipe]);
  const [selected,setSelected]=useState<"global"|SceneType>("global");
  const active=selected!=="global";
  const selectedScene=active?selected as SceneType:uniqueScenes[0];
  const scene=uniqueScenes.includes(selectedScene)?selectedScene:uniqueScenes[0];
  const resolved=getExperienceCopy(experience,value);
  const section:SceneType|null=active?scene:null;
  const sectionCustom=section?readPath(value,section)!==undefined:readPath(value,"ui")!==undefined;

  const update=(path:string,next:unknown)=>onChange(writePath(value,path,next));

  return <div className="thi-script-editor">
    <aside className="thi-script-nav">
      <button type="button" className={selected==="global"?"active":""} onClick={()=>setSelected("global")}>
        <span>00</span><strong>Global</strong><small>Navegación</small>
      </button>
      {uniqueScenes.map((item,index)=><button type="button" key={item} className={selected===item?"active":""} onClick={()=>setSelected(item)}>
        <span>{String(index+1).padStart(2,"0")}</span><strong>{sceneNames[item]}</strong><small>{resolved.ui.sceneLabels[item]}</small>
      </button>)}
    </aside>

    <div className="thi-script-workspace">
      {selected==="global"?<>
        <header className="thi-script-head">
          <div><p className="thi-kicker">Guion global</p><h3>Las palabras pequeñas también importan.</h3><p>Podés cambiar los nombres de las escenas, el texto de reinicio y hasta las descripciones accesibles.</p></div>
          {sectionCustom&&<button type="button" className="thi-script-reset" onClick={()=>onChange(removeSection(value,"ui"))}>Restaurar global</button>}
        </header>
        <div className="thi-script-global-grid">
          <label><span>Texto del botón reiniciar</span><input value={resolved.ui.resetLabel} onChange={e=>update("ui.resetLabel",e.target.value)}/></label>
          <label><span>Descripción de reinicio</span><input value={resolved.ui.resetAria} onChange={e=>update("ui.resetAria",e.target.value)}/></label>
          <label><span>Descripción de volver</span><input value={resolved.ui.previousAria} onChange={e=>update("ui.previousAria",e.target.value)}/></label>
          <label><span>Descripción de avanzar</span><input value={resolved.ui.nextAria} onChange={e=>update("ui.nextAria",e.target.value)}/></label>
        </div>
        <div className="thi-script-scene-labels">
          <div className="thi-script-field-heading"><span>Nombre visible de cada escena</span><small>Aparece en la barra superior durante el recorrido.</small></div>
          {uniqueScenes.map((item,index)=><label key={item}><b>{String(index+1).padStart(2,"0")}</b><span>{sceneNames[item]}</span><input value={resolved.ui.sceneLabels[item]} onChange={e=>update(`ui.sceneLabels.${item}`,e.target.value)}/></label>)}
        </div>
      </>:section?<>
        <header className="thi-script-head">
          <div><p className="thi-kicker">{sceneNames[section]} · {resolved.ui.sceneLabels[section]}</p><h3>{sceneDescriptions[section]||"Texto de la escena"}</h3><p>Los cambios se reflejan en la preview aunque todavía no los hayas guardado.</p></div>
          <div className="thi-script-head-actions">
            <button type="button" className="thi-ghost" onClick={()=>onPreviewScene(section)}>Ver esta escena ↗</button>
            {sectionCustom&&<button type="button" className="thi-script-reset" onClick={()=>onChange(removeSection(value,section))}>Restaurar escena</button>}
          </div>
        </header>
        <div className="thi-script-token-hint"><span>Variables disponibles</span><code>{"{giver}"}</code><code>{"{recipient}"}</code><code>{"{count}"}</code><small>Se reemplazan solas al publicar.</small></div>
        <div className="thi-script-fields">
          {(fields[section]||[]).map(field=>{
            const current=readPath(resolved,field.path);
            return <label key={field.path} className={field.kind==="textarea"||field.kind==="lines"?"wide":""}>
              <span>{field.label}</span>
              {field.kind==="textarea"
                ? <textarea rows={field.path==="letter.body"?8:4} value={displayValue(current,field.kind)} onChange={e=>update(field.path,normalizeValue(e.target.value,field.kind))}/>
                : field.kind==="lines"
                  ? <textarea rows={Math.max(3,Math.min(8,Array.isArray(current)?current.length+1:4))} value={displayValue(current,field.kind)} onChange={e=>update(field.path,normalizeValue(e.target.value,field.kind))}/>
                  : <input type={field.kind==="number"?"number":"text"} min={field.kind==="number"?1:undefined} value={displayValue(current,field.kind)} onChange={e=>update(field.path,normalizeValue(e.target.value,field.kind))}/>}
              {field.hint&&<small>{field.hint}</small>}
            </label>;
          })}
        </div>
        {section==="timeline"&&<TimelineRows entries={resolved.timeline.entries} onChange={entries=>update("timeline.entries",entries)}/>}
        {section==="voices"&&<VoiceRows entries={resolved.voices.entries} onChange={entries=>update("voices.entries",entries)}/>}
      </>:null}
    </div>
  </div>;
}
