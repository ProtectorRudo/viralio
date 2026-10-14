"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {SESSION_KEY,SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "../api";
import {escapeRooms,getEscapeRoom,getEscapeSource} from "../../escape-rooms";
import styles from "../../escapes/escape.module.css";
type Gift={public_code:string;experience_slug:string;recipient_name:string;status:string;story_data?:{escapeConfig?:Record<string,string>}};
const blank=(slug:string)=>Object.fromEntries((getEscapeRoom(slug)||escapeRooms[0]).fields.map(f=>[f.key,f.defaultValue||""])) as Record<string,string>;
async function call<T>(action:string,options:Record<string,unknown>={}):Promise<T>{
 const token=sessionStorage.getItem(SESSION_KEY)||"";
 const resp=await fetch(SUPABASE_URL+"/functions/v1/escape-gifts",{method:"POST",headers:{"content-type":"application/json",apikey:SUPABASE_PUBLISHABLE_KEY,"x-admin-session":token},body:JSON.stringify({action,...options}),cache:"no-store"});
 const data=await resp.json().catch(()=>({error:"request_failed"}));if(!resp.ok)throw Error(String(data.error||"request_failed"));return data as T;
}
export default function EscapeAdmin({code}:{code?:string}){
 const [ready,setReady]=useState(false),[authorized,setAuthorized]=useState(false);
 const [slug,setSlug]=useState("caso-m"),[values,setValues]=useState<Record<string,string>>(()=>blank("caso-m"));
 const [status,setStatus]=useState("draft"),[gifts,setGifts]=useState<Gift[]>([]);
 const [message,setMessage]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[preview,setPreview]=useState(false);
 const room=getEscapeRoom(slug)||escapeRooms[0];
 const prefix=typeof window==="undefined"?"":location.pathname.startsWith("/tehiceesto")?"/tehiceesto":"";
 useEffect(()=>{
  if(!sessionStorage.getItem(SESSION_KEY)){setReady(true);return}
  let active=true;setAuthorized(true);
  const task=code?call<{gift:Gift&{room:string}}>("get",{code}).then(({gift})=>{
   if(!active)return;
   const found=getEscapeRoom(gift.room);if(!found)throw Error("Sala no encontrada");
   setSlug(found.slug);setValues({...blank(found.slug),...(gift.story_data?.escapeConfig||{})});setStatus(gift.status);
  }):call<{gifts:Gift[]}>("list").then(data=>{if(active)setGifts(data.gifts)});
  task.catch(e=>{if(active)setError(e instanceof Error?e.message:"No se pudo cargar")}).finally(()=>{if(active)setReady(true)});
  return()=>{active=false};
 },[code]);
 const setRoom=(next:string)=>{setSlug(next);setValues(blank(next));setMessage("");setPreview(false)};
 async function perform(action:"create"|"save"|"publish"|"unpublish"){
  setBusy(true);setError("");setMessage("");
  try{
   for(const f of room.fields){const v=(values[f.key]||"").trim();if(f.required&&!v)throw Error("Completá "+f.label);
    if(f.key==="codigo"&&!/^\d{6}$/.test(v))throw Error("El código del candado debe tener seis cifras.");
    if(f.key==="voz"&&v&&!/^https:\/\//.test(v))throw Error("La dirección del audio debe usar HTTPS.");
   }
   if(action==="create"){const result=await call<{code:string}>("create",{room:room.slug,config:values});
    location.href=prefix+"/admin/escapes/"+result.code;return;}
   if(!code)throw Error("Invitación sin código");
   await call("save",{code,config:values});
   if(action==="publish"||action==="unpublish"){await call(action,{code});setStatus(action==="publish"?"published":"draft")}
   setMessage(action==="publish"?"¡Experiencia publicada! Compartí el enlace privado.":action==="unpublish"?"Experiencia despublicada.":"Cambios guardados.");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo completar la operación")}finally{setBusy(false)}
 }
 const source=getEscapeSource(room,values);
 const publicUrl=typeof window==="undefined"?"":window.location.origin+"/escape-r/"+code;
 return <main className={styles.editor}>
  <header className={styles.editHead}><div><span className={styles.eyebrow}>TE HICE ESTO · EDITOR PRIVADO</span>
   <h1>{code?"Editar invitación":"Invitaciones escape"}</h1><p>El mismo juego premium. Una sorpresa diferente para cada persona.</p>
   </div><Link href={prefix+"/admin"}>← Panel de administración</Link></header>
  {!ready&&<p>Consultando invitaciones…</p>}
  {ready&&!authorized&&<p>Necesitás iniciar sesión en el panel interno. <Link href={prefix+"/admin"}>Ingresar →</Link></p>}
  {error&&<p className={styles.error} role="alert">{error}</p>}
  {message&&<p className={styles.success} role="status">{message}</p>}
  {authorized&&<div className={styles.editGrid}>
   <section className={styles.editCard}>
    <label><span>Modelo de sala</span><select disabled={Boolean(code)} value={slug} onChange={e=>setRoom(e.target.value)}>
     {escapeRooms.map(r=><option key={r.slug} value={r.slug}>{r.title}</option>)}</select></label>
    <p className={styles.editDescription}>{room.description}</p>
    {room.fields.map(f=><label key={f.key}><span>{f.label}{f.required?" *":""}</span>
      {f.hint&&<small>{f.hint}</small>}
      {f.multiline?<textarea rows={5} maxLength={f.max||650} value={values[f.key]||""} onChange={e=>setValues(old=>({...old,[f.key]:e.target.value}))}/>:<input value={values[f.key]||""} maxLength={f.max||160} inputMode={f.key==="codigo"||f.key==="rsvp"?"numeric":undefined} onChange={e=>setValues(old=>({...old,[f.key]:e.target.value}))}/>}
     </label>)}
    <div className={styles.editActions}>
     <button disabled={busy||!ready} onClick={()=>void perform(code?"save":"create")}>{busy?"Guardando…":code?"Guardar cambios":"Crear invitación privada →"}</button>
     {code&&<button className={styles.subtle} disabled={busy||!ready} onClick={()=>void perform(status==="published"?"unpublish":"publish")}>{status==="published"?"Despublicar":"Publicar"}</button>}
    </div>
   </section>
   <aside className={styles.previewCard}>
    <span className={styles.eyebrow}>MODELO ORIGINAL · SIN CAMBIOS DE DISEÑO</span><h2>{room.title}</h2>
    <div className={styles.previewIllustration} style={{"--accent":room.accent} as React.CSSProperties}><span>✦</span><strong>{room.title}</strong><small>UNA SORPRESA EN EL FINAL</small></div>
    <button className={styles.subtle} onClick={()=>setPreview(p=>!p)}>{preview?"Cerrar vista previa":"Jugar vista previa →"}</button>
    {preview&&(room.slug==="caso-m"?<a className={styles.previewOpen} href={source} target="_blank" rel="noopener noreferrer">Abrir CASO M en pantalla completa ↗</a>:<iframe title={"Vista previa "+room.title} className={styles.previewFrame} src={source} allow="autoplay; fullscreen" allowFullScreen/>)}
    {code&&status==="published"&&<><p>Enlace privado para compartir</p><input value={publicUrl} readOnly onFocus={e=>e.currentTarget.select()}/><button onClick={()=>void navigator.clipboard.writeText(publicUrl)}>Copiar enlace</button></>}
    <p className={styles.previewNote}>Este editor es interno. La persona que recibe el regalo sólo ve la aventura y descubre el final.</p>
   </aside>
  </div>}
  {authorized&&!code&&gifts.length>0&&<div className={styles.history}><h2>Regalos creados</h2>{gifts.map(g=><Link href={prefix+"/admin/escapes/"+g.public_code} key={g.public_code}>{g.recipient_name} · {g.experience_slug.replace("escape-","")} <small>{g.status} ↗</small></Link>)}</div>}
 </main>;
}
