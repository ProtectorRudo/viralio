"use client";
import { useState } from "react";
import Link from "next/link";
import { experiences, type EscapeExperience, type RoomCategory } from "./catalog";
import { ExperienceIntensity } from "./ExperienceIntensity";
const choices: {label:string;value:"all"|RoomCategory}[] = [
 {label:"Todas",value:"all"},{label:"Terror y suspenso",value:"terror"},
 {label:"Misterio",value:"misterio"},{label:"Emociones",value:"emociones"}
];
export function ExperienceCard({room,index}:{room:EscapeExperience;index:number}) {
 return <Link href={`/salas/${room.slug}`} className={`ve-card ve-card-${room.theme}`} aria-label={`Conocer la experiencia ${room.title}`}>
   <div className="ve-card-image" style={{backgroundImage:`linear-gradient(180deg, rgba(5,7,10,.06) 4%, rgba(5,7,10,.20) 35%, rgba(5,7,10,.95) 100%), url("${room.cover}")`}} aria-hidden="true"/>
   <div className="ve-card-sequence">Nº 0{index+1} / VIRALIO ORIGINALS</div>
   <div className="ve-card-content">
     <div className="ve-overline">{room.categoryLabel}</div>
     <h3>{room.title}</h3><span className="ve-card-subtitle">{room.subtitle}</span>
     <p>{room.synopsis}</p>
     <ExperienceIntensity room={room}/>
     <div className="ve-card-bottom"><div><span>◷ {room.duration}</span><span>{room.difficulty}</span></div><span className="ve-round-arrow" aria-hidden="true">↗</span></div>
   </div>
 </Link>;
}
export default function ExperienceCatalog(){
 const [category,setCategory]=useState<"all"|RoomCategory>("all");
 const filtered=category==="all"?experiences:experiences.filter(room=>room.category===category);
 return <section id="experiencias" className="ve-section ve-experience-section">
   <div className="ve-container">
     <div className="ve-section-top">
       <div><span className="ve-overline ve-metal">01 / EL CATÁLOGO</span><h2>Elegí tu próxima <em>historia.</em></h2></div>
       <p>Cada puerta es un universo. Cada decisión, una consecuencia. Compará dificultad, sustos, sorpresa y tensión antes de elegir.</p>
     </div>
     <div className="ve-filters" aria-label="Filtrar experiencias">
       {choices.map(c=><button key={c.value} onClick={()=>setCategory(c.value)} type="button" className={category===c.value?"ve-filter ve-filter-active":"ve-filter"} aria-pressed={category===c.value}>{c.label}</button>)}
     </div>
     {filtered.length ? <div className="ve-card-grid">{filtered.map((room,index)=><ExperienceCard key={room.slug} room={room} index={index}/>)}</div> :
       <div className="ve-catalog-empty"><span className="ve-overline">UNIVERSO EN EXPANSIÓN</span><h3>Algo nuevo está por abrirse.</h3><p>Estamos preparando nuevas historias. Mientras tanto, descubrí las experiencias disponibles.</p><button type="button" onClick={()=>setCategory("all")}>Ver experiencias disponibles ↗</button></div>}
     <div className="ve-catalog-note"><span aria-hidden="true">✧</span> Intensidades editoriales orientativas, no puntuaciones de usuarios. Arte de catálogo ilustrativo; las escenas reales se descubren al jugar.</div>
   </div>
 </section>;
}
