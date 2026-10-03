/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExperienceEngine, { type ThiAudio, type ThiPhoto, type ThiVideo } from "../ExperienceEngine";
import { getExperience, type SceneType } from "../data";
import { adminCall, SESSION_KEY, uploadSignedFile } from "./api";

type Gift = {
  public_code: string;
  status: string;
  experience_slug: string;
  giver_name: string;
  recipient_name: string;
  occasion: string | null;
  feeling: string | null;
  opening_text: string | null;
  letter_text: string | null;
  closing_text: string | null;
  music_url: string | null;
  scene_recipe: SceneType[];
  story_data: { relationship?: string; keyDate?: string; anecdote?: string } | null;
  theme_data: { accent?: string } | null;
};

type Media = {
  id: string;
  kind: "image" | "audio" | "video";
  storage_path: string;
  caption: string | null;
  sort_order: number;
  metadata: {
    originalName?: string;
    mimeType?: string;
    size?: number;
    fit?: "cover" | "contain";
    position?: "center" | "top" | "bottom" | "left" | "right";
  } | null;
  url: string | null;
};

const scenes: { type: SceneType; label: string }[] = [
  { type:"intro", label:"Entrada" },
  { type:"door", label:"Puerta" },
  { type:"memories", label:"Recuerdos" },
  { type:"timeline", label:"Línea de tiempo" },
  { type:"stars", label:"Estrellas" },
  { type:"quiz", label:"Pregunta" },
  { type:"scratch", label:"Raspadita" },
  { type:"voices", label:"Voces" },
  { type:"video", label:"Video" },
  { type:"candles", label:"Velitas" },
  { type:"balloons", label:"Globos" },
  { type:"vault", label:"Bóveda" },
  { type:"capsule", label:"Cápsula" },
  { type:"letter", label:"Carta" },
  { type:"proposal", label:"Propuesta" },
  { type:"finale", label:"Final" },
];

function humanSize(size?: number){
  if(!size) return "";
  return size < 1024*1024 ? `${Math.round(size/1024)} KB` : `${(size/(1024*1024)).toFixed(1)} MB`;
}

export default function AdminGiftEditor({ code }: { code: string }) {
  const router = useRouter();
  const [gift,setGift]=useState<Gift|null>(null);
  const [media,setMedia]=useState<Media[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [preview,setPreview]=useState(false);
  const [selectedScene,setSelectedScene]=useState<SceneType>("memories");
  const [uploading,setUploading]=useState<string[]>([]);
  const inputRef=useRef<HTMLInputElement>(null);

  async function load(){
    setLoading(true);
    try{
      if(!window.sessionStorage.getItem(SESSION_KEY)){
        router.push("/tehiceesto/admin");
        return;
      }
      const data=await adminCall<{gift:Gift;media:Media[]}>("getGift",{code});
      setGift(data.gift);
      setMedia(data.media||[]);
    }catch{
      router.push("/tehiceesto/admin");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); },[code]);

  const base=gift?getExperience(gift.experience_slug):undefined;

  const previewExperience=useMemo(()=>{
    if(!gift||!base) return null;
    return {
      ...base,
      demoGiver:gift.giver_name,
      demoRecipient:gift.recipient_name,
      opening:gift.opening_text||base.opening,
      closing:gift.closing_text||base.closing,
      recipe:gift.scene_recipe?.length?gift.scene_recipe:base.recipe,
      accent:gift.theme_data?.accent||base.accent,
    };
  },[gift,base]);

  const photoMedia:ThiPhoto[]=media.filter(x=>x.kind==="image"&&x.url).map(x=>({
    url:x.url!,
    caption:x.caption||undefined,
    fit:x.metadata?.fit||"cover",
    position:x.metadata?.position||"center",
  }));
  const audioMedia:ThiAudio[]=media.filter(x=>x.kind==="audio"&&x.url).map(x=>({url:x.url!,caption:x.caption||undefined}));
  const videoMedia:ThiVideo[]=media.filter(x=>x.kind==="video"&&x.url).map(x=>({url:x.url!,caption:x.caption||undefined}));

  function patchGift<K extends keyof Gift>(key:K,value:Gift[K]){
    setGift(current=>current?{...current,[key]:value}:current);
  }

  async function save(){
    if(!gift) return;
    setSaving(true);setMessage("");
    try{
      await adminCall("updateGift",{
        code,
        giverName:gift.giver_name,
        recipientName:gift.recipient_name,
        occasion:gift.occasion||"",
        feeling:gift.feeling||"",
        openingText:gift.opening_text||"",
        letterText:gift.letter_text||"",
        closingText:gift.closing_text||"",
        musicUrl:gift.music_url||"",
        relationship:gift.story_data?.relationship||"",
        keyDate:gift.story_data?.keyDate||"",
        anecdote:gift.story_data?.anecdote||"",
        sceneRecipe:gift.scene_recipe,
      });
      setMessage("Cambios guardados ✓");
      setTimeout(()=>setMessage(""),1800);
    }catch{
      setMessage("No se pudo guardar.");
    }finally{setSaving(false);}
  }

  function moveScene(index:number,dir:-1|1){
    if(!gift) return;
    const next=index+dir;
    if(next<0||next>=gift.scene_recipe.length) return;
    const copy=[...gift.scene_recipe];
    [copy[index],copy[next]]=[copy[next],copy[index]];
    patchGift("scene_recipe",copy);
  }

  function removeScene(index:number){
    if(!gift||gift.scene_recipe.length<=1) return;
    patchGift("scene_recipe",gift.scene_recipe.filter((_,i)=>i!==index));
  }

  function addScene(){
    if(!gift) return;
    patchGift("scene_recipe",[...gift.scene_recipe,selectedScene]);
  }

  async function uploadFiles(files:FileList|null){
    if(!files?.length) return;
    for(const file of Array.from(files).slice(0,20)){
      setUploading(v=>[...v,file.name]);
      try{
        const kind=file.type.startsWith("image/")?"image":file.type.startsWith("audio/")?"audio":file.type.startsWith("video/")?"video":null;
        if(!kind) throw new Error("unsupported");
        const prep=await adminCall<{path:string;token:string}>("prepareUpload",{code,fileName:file.name,mimeType:file.type,size:file.size});
        await uploadSignedFile(prep.path,prep.token,file);
        await adminCall("registerMedia",{code,storagePath:prep.path,kind,originalName:file.name,mimeType:file.type,size:file.size});
      }catch(error){
        console.error(error);
        alert(`No se pudo subir ${file.name}`);
      }finally{
        setUploading(v=>v.filter(x=>x!==file.name));
      }
    }
    if(inputRef.current) inputRef.current.value="";
    await load();
  }

  async function updateMedia(item:Media,patch:Partial<Media> & {fit?:"cover"|"contain";position?:"center"|"top"|"bottom"|"left"|"right"}){
    const metadata={...(item.metadata||{}),fit:patch.fit??item.metadata?.fit??"cover",position:patch.position??item.metadata?.position??"center"};
    setMedia(current=>current.map(x=>x.id===item.id?{...x,caption:patch.caption??x.caption,metadata}:x));
    await adminCall("updateMedia",{code,mediaId:item.id,caption:patch.caption??item.caption??"",fit:metadata.fit,position:metadata.position});
    await load();
  }

  async function moveMedia(index:number,dir:-1|1){
    const next=index+dir;
    if(next<0||next>=media.length) return;
    const copy=[...media];
    [copy[index],copy[next]]=[copy[next],copy[index]];
    setMedia(copy);
    await adminCall("reorderMedia",{code,mediaIds:copy.map(x=>x.id)});
    await load();
  }

  async function deleteMedia(item:Media){
    if(!confirm(`¿Eliminar ${item.metadata?.originalName||"este archivo"}?`)) return;
    await adminCall("deleteMedia",{code,mediaId:item.id});
    await load();
  }

  async function togglePublish(){
    if(!gift) return;
    const action=gift.status==="published"?"unpublish":"publish";
    await adminCall(action,{code});
    await load();
  }

  if(loading||!gift||!base) return <main className="thi-admin-shell"><div className="thi-admin-loading">Cargando regalo…</div></main>;

  if(preview&&previewExperience){
    return <div className="thi-admin-preview-overlay">
      <div className="thi-admin-preview-toolbar">
        <button onClick={()=>setPreview(false)}>← Volver al editor</button>
        <span>PREVIEW PRIVADO · {gift.recipient_name}</span>
      </div>
      <ExperienceEngine experience={previewExperience} letterText={gift.letter_text||undefined} photoMedia={photoMedia} audioMedia={audioMedia} videoMedia={videoMedia}/>
    </div>;
  }

  return <main className="thi-admin-shell">
    <header className="thi-admin-header">
      <div>
        <Link href="/tehiceesto/admin" className="thi-admin-back">← Regalos</Link>
        <p className="thi-kicker">{base.eyebrow}</p>
        <h1>{gift.recipient_name}</h1>
        <p className="thi-admin-sub">De {gift.giver_name} · <code>{gift.public_code}</code></p>
      </div>
      <div className="thi-admin-header-actions">
        <button className="thi-ghost" onClick={()=>setPreview(true)}>Ver preview</button>
        {gift.status==="published"&&<Link className="thi-ghost" href={`/tehiceesto/r/${gift.public_code}`} target="_blank">Abrir regalo ↗</Link>}
        <button className={gift.status==="published"?"thi-publish on":"thi-publish"} onClick={togglePublish}>{gift.status==="published"?"✓ Publicado · despublicar":"Publicar regalo"}</button>
      </div>
    </header>

    <section className="thi-editor-overview">
      <article>
        <span className="thi-editor-overview-icon" style={{"--editor-accent":base.accent} as React.CSSProperties}>{base.icon}</span>
        <div><small>Experiencia</small><strong>{base.title}</strong></div>
      </article>
      <article><small>Escenas</small><strong>{gift.scene_recipe.length}</strong><span>en el recorrido</span></article>
      <article><small>Archivos</small><strong>{media.length}</strong><span>fotos, audio y video</span></article>
      <article><small>Estado</small><strong className={gift.status==="published"?"is-live":""}>{gift.status==="published"?"Publicado":"Borrador"}</strong><span>{gift.status==="published"?"link activo":"todavía privado"}</span></article>
    </section>

    <nav className="thi-editor-nav">
      <a href="#thi-historia">Historia</a>
      <a href="#thi-recorrido">Recorrido</a>
      <a href="#thi-archivos">Archivos</a>
      <button onClick={()=>setPreview(true)}>Preview ↗</button>
    </nav>

    <section className="thi-admin-panel thi-editor-content-panel" id="thi-historia">
      <div className="thi-admin-panel-heading"><div><p className="thi-kicker">Historia</p><h2>Contenido</h2></div><span className={`thi-status ${gift.status}`}>{gift.status}</span></div>
      <div className="thi-admin-form">
        <label><span>Quién regala</span><input value={gift.giver_name} onChange={e=>patchGift("giver_name",e.target.value)}/></label>
        <label><span>Quién recibe</span><input value={gift.recipient_name} onChange={e=>patchGift("recipient_name",e.target.value)}/></label>
        <label><span>Ocasión</span><input value={gift.occasion||""} onChange={e=>patchGift("occasion",e.target.value)}/></label>
        <label><span>Emoción</span><select value={gift.feeling||"Emoción"} onChange={e=>patchGift("feeling",e.target.value)}><option>Emoción</option><option>Amor</option><option>Sorpresa</option><option>Diversión</option><option>Nostalgia</option></select></label>
        <label className="wide"><span>Relación / contexto</span><textarea rows={3} value={gift.story_data?.relationship||""} onChange={e=>patchGift("story_data",{...(gift.story_data||{}),relationship:e.target.value})}/></label>
        <label><span>Fecha importante</span><input type="date" value={gift.story_data?.keyDate||""} onChange={e=>patchGift("story_data",{...(gift.story_data||{}),keyDate:e.target.value})}/></label>
        <label><span>Canción / link</span><input value={gift.music_url||""} onChange={e=>patchGift("music_url",e.target.value)}/></label>
        <label className="wide"><span>Anécdota</span><textarea rows={4} value={gift.story_data?.anecdote||""} onChange={e=>patchGift("story_data",{...(gift.story_data||{}),anecdote:e.target.value})}/></label>
        <label className="wide"><span>Entrada</span><textarea rows={3} value={gift.opening_text||""} onChange={e=>patchGift("opening_text",e.target.value)}/></label>
        <label className="wide"><span>Carta</span><textarea className="thi-admin-letter" rows={8} value={gift.letter_text||""} onChange={e=>patchGift("letter_text",e.target.value)}/></label>
        <label className="wide"><span>Cierre</span><textarea rows={3} value={gift.closing_text||""} onChange={e=>patchGift("closing_text",e.target.value)}/></label>
      </div>

      <div className="thi-admin-scenes" id="thi-recorrido">
        <div className="thi-admin-panel-heading"><div><p className="thi-kicker">Recorrido</p><h2>Escenas</h2></div></div>
        <div className="thi-scene-editor">
          {gift.scene_recipe.map((scene,index)=><div className="thi-scene-row" key={`${scene}-${index}`}><span>{String(index+1).padStart(2,"0")}</span><strong>{scenes.find(x=>x.type===scene)?.label||scene}</strong><div><button disabled={!index} onClick={()=>moveScene(index,-1)}>↑</button><button disabled={index===gift.scene_recipe.length-1} onClick={()=>moveScene(index,1)}>↓</button><button onClick={()=>removeScene(index)}>×</button></div></div>)}
        </div>
        <div className="thi-scene-add"><select value={selectedScene} onChange={e=>setSelectedScene(e.target.value as SceneType)}>{scenes.map(x=><option key={x.type} value={x.type}>{x.label}</option>)}</select><button className="thi-ghost" onClick={addScene}>+ Agregar escena</button></div>
      </div>

      <div className="thi-admin-save-row"><span>{message}</span><button className="thi-primary" disabled={saving} onClick={save}>{saving?"Guardando…":"Guardar cambios"}</button></div>
    </section>

    <section className="thi-admin-panel thi-editor-media-panel" id="thi-archivos">
      <div className="thi-admin-panel-heading">
        <div><p className="thi-kicker">Archivos</p><h2>Fotos, audios y videos</h2><p>Los archivos se guardan en storage privado y se entregan mediante URLs temporales.</p></div>
        <button className="thi-primary" onClick={()=>inputRef.current?.click()}>+ Subir archivos</button>
        <input ref={inputRef} hidden type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,audio/mpeg,audio/mp4,audio/webm,audio/wav,video/mp4,video/webm,video/quicktime" onChange={e=>uploadFiles(e.target.files)}/>
      </div>

      {uploading.length>0&&<div className="thi-uploading">{uploading.map(name=><span key={name}>Subiendo {name}…</span>)}</div>}

      {media.length===0?<div className="thi-admin-empty"><strong>Todavía no hay archivos.</strong><p>Subí el material y revisamos cada encuadre antes de publicar.</p></div>:
      <div className="thi-media-grid">{media.map((item,index)=>{
        const fit=item.metadata?.fit||"cover"; const position=item.metadata?.position||"center";
        return <article className="thi-media-card" key={item.id}>
          <div className="thi-media-preview">
            {item.kind==="image"&&item.url&&<img src={item.url} alt={item.caption||item.metadata?.originalName||"Foto"} style={{objectFit:fit,objectPosition:position}}/>}
            {item.kind==="video"&&item.url&&<video src={item.url} controls preload="metadata"/>}
            {item.kind==="audio"&&item.url&&<div className="thi-media-audio"><span>♪</span><audio src={item.url} controls preload="metadata"/></div>}
            <b>{String(index+1).padStart(2,"0")}</b><em>{item.kind}</em>
          </div>
          <div className="thi-media-body">
            <div className="thi-media-name"><strong>{item.metadata?.originalName||"Archivo"}</strong><small>{humanSize(item.metadata?.size)}</small></div>
            <label><span>Texto</span><input defaultValue={item.caption||""} onBlur={e=>updateMedia(item,{caption:e.target.value})}/></label>
            {item.kind==="image"&&<div className="thi-media-controls">
              <label><span>Encuadre</span><select value={fit} onChange={e=>updateMedia(item,{fit:e.target.value as "cover"|"contain"})}><option value="cover">Llenar marco</option><option value="contain">Mostrar completa</option></select></label>
              <label><span>Foco</span><select value={position} onChange={e=>updateMedia(item,{position:e.target.value as "center"|"top"|"bottom"|"left"|"right"})}><option value="center">Centro</option><option value="top">Arriba</option><option value="bottom">Abajo</option><option value="left">Izquierda</option><option value="right">Derecha</option></select></label>
            </div>}
            <div className="thi-media-actions"><button disabled={!index} onClick={()=>moveMedia(index,-1)}>↑</button><button disabled={index===media.length-1} onClick={()=>moveMedia(index,1)}>↓</button><button className="danger" onClick={()=>deleteMedia(item)}>Eliminar</button></div>
          </div>
        </article>
      })}</div>}
    </section>
  </main>;
}
