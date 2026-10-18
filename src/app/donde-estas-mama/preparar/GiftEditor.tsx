"use client";
import {useState} from "react";
import Link from "next/link";
import "../mother-escape.css";

export default function GiftEditor(){
 const [mother,setMother]=useState("");
 const [child,setChild]=useState("");
 const [letter,setLetter]=useState("");
 const [status,setStatus]=useState("");
 const url=(()=>{
   const p=new URLSearchParams();
   if(mother.trim())p.set("mama",mother.trim().slice(0,46));
   if(child.trim())p.set("hijo",child.trim().slice(0,46));
   if(letter.trim())p.set("mensaje",letter.trim().slice(0,420));
   return "/donde-estas-mama"+(p.size?"?"+p.toString():"");
 })();
 const full=()=>window.location.origin+url;
 const copy=async()=>{
   try{await navigator.clipboard.writeText(full());setStatus("¡Enlace copiado! Ya podés enviárselo a mamá.");}
   catch{setStatus("Copiá el enlace desde la barra de direcciones al abrir la vista previa.");}
 };
 const share=async()=>{
   if(navigator.share){
     try{await navigator.share({title:"Tengo una misión para vos",text:"Mamá, ¿te animás a jugar? Tenés cinco minutos.",url:full()});}
     catch{/* el usuario puede cancelar */}
   }else void copy();
 };
 return <main className="mom-game">
   <section className="mom-screen mom-creator">
     <div className="mom-mark">VIRALIO ORIGINALS <span>/ REGALO PERSONALIZADO</span></div>
     <Link className="mom-creator-back" href="/">← VOLVER A VIRALIO</Link>
     <span className="mom-pretitle">UNA SORPRESA QUE NO SE PUEDE ENVOLVER</span>
     <h1>Prepará su<br/><em>gran misión.</em></h1>
     <p>Tu mamá recibirá una invitación a resolver una misteriosa desaparición en cinco minutos. Vos preparás el mensaje especial que encontrará al final.</p>
     <div className="mom-creator-form">
       <label>¿Cómo se llama mamá?
         <input maxLength={46} value={mother} onChange={e=>setMother(e.target.value)} placeholder="Ej.: Cecilia" autoComplete="off"/>
       </label>
       <label>¿Quién firma la sorpresa?
         <input maxLength={46} value={child} onChange={e=>setChild(e.target.value)} placeholder="Ej.: Tus hijos, Lautaro, Allegra..." autoComplete="off"/>
       </label>
       <label>Tu dedicatoria al final del juego
         <textarea maxLength={420} rows={5} value={letter} onChange={e=>setLetter(e.target.value)} placeholder="Mamá, quiero agradecerte por..."/>
         <small>{letter.length}/420 caracteres · Si lo dejás vacío, aparecerá una carta especial escrita por Viralio.</small>
       </label>
       <div className="mom-creator-actions">
         <button className="mom-primary" onClick={share}>COMPARTIR SORPRESA ↗</button>
         <button className="mom-outline" onClick={copy}>COPIAR ENLACE</button>
         <Link className="mom-creator-test" href={url} target="_blank" rel="noopener noreferrer">Probar la misión ↗</Link>
       </div>
       <div className="mom-creator-status" role="status">{status}</div>
       <small>La dedicatoria se incluye en el enlace, sin guardarse en un servidor. Compartilo solo con la persona destinataria. No revela la sorpresa antes del final.</small>
     </div>
   </section>
 </main>;
}
