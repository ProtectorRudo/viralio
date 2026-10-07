/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback,useEffect,useRef,useState } from "react";
import ExperienceEngine from "../ExperienceEngine";
import PremiumV1Engine from "../template-v1/ExperienceEngine";
import { getExperience,type SceneType } from "../data";
import { getExperience as getPremiumV1Experience,type SceneType as PremiumSceneType } from "../template-v1/data";
import { normalizeSceneTextOverrides } from "../sceneText";
import { normalizeSceneTextOverrides as normalizePremiumSceneTextOverrides } from "../template-v1/sceneText";
import { effectiveRecipeForMedia } from "../effectiveRecipe";
import { creatorCall,uploadCreatorFile } from "../creatorApi";
import StudioVisualTextEditor,{type StudioSceneTextOverrides} from "./StudioVisualTextEditor";

type MediaKind="image"|"audio"|"video";
type StudioMedia={
  id:string;
  kind:MediaKind;
  storage_path:string;
  caption:string|null;
  sort_order:number;
  metadata:{
    originalName?:string;
    mimeType?:string;
    size?:number;
    fit?:"cover"|"contain";
    position?:"center"|"top"|"bottom"|"left"|"right";
    scene?:string;
    role?:"voice"|"soundtrack";
  }|null;
  url:string|null;
};

type StudioGift={
  public_code:string;
  status:string;
  template_version:string|null;
  experience_slug:string;
  giver_name:string;
  recipient_name:string;
  occasion:string|null;
  feeling:string|null;
  opening_text:string|null;
  letter_text:string|null;
  closing_text:string|null;
  music_url:string|null;
  scene_recipe:string[];
  story_data:{
    relationship?:string;
    keyDate?:string;
    anecdote?:string;
    script?:unknown;
    sceneContent?:StudioSceneTextOverrides;
    creator?:{contact?:{name?:string;email?:string;whatsapp?:string}};
  }|null;
  theme_data:{accent?:string}|null;
  published_at:string|null;
};

type StudioPayload={
  gift:StudioGift;
  order:{status:string;amount_minor:number|null;currency:string}|null;
  media:StudioMedia[];
};

type Basics={
  giverName:string;
  recipientName:string;
  occasion:string;
  feeling:string;
  relationship:string;
  keyDate:string;
  anecdote:string;
  openingText:string;
  letterText:string;
  closingText:string;
  musicUrl:string;
};

const STEP_LABELS=["Personas","Fotos","Audios","Palabras","Opcional","Revisar"];
const FEELINGS=["Amor","Emoción","Sorpresa","Diversión","Nostalgia"];

const SCENE_LABELS:Record<string,{title:string;copy:string}>={
  intro:{title:"La entrada",copy:"La primera impresión cuando abre el regalo."},
  door:{title:"La puerta",copy:"Una entrada interactiva a la historia."},
  memories:{title:"Los recuerdos",copy:"Fotos y momentos que cuentan lo vivido."},
  stars:{title:"Las pequeñas cosas",copy:"Frases que se van descubriendo una por una."},
  scratch:{title:"La sorpresa para raspar",copy:"Una recompensa escondida para descubrir."},
  letter:{title:"La carta",copy:"Tus palabras más importantes."},
  finale:{title:"El final",copy:"El cierre emocional del recorrido."},
  candles:{title:"Las velas",copy:"Un momento de cumpleaños para apagar."},
  balloons:{title:"Los globos",copy:"Mensajes escondidos para ir encontrando."},
  timeline:{title:"La historia",copy:"Momentos importantes puestos en el tiempo."},
  voices:{title:"Las voces",copy:"Audios de personas que quieren decir algo."},
  capsule:{title:"La cápsula",copy:"Un mensaje guardado para volver a abrir."},
  archive:{title:"El archivo",copy:"Recuerdos que parecen piezas de una vida."},
  home:{title:"La casa",copy:"Pequeños recuerdos que se sienten hogar."},
  legacy:{title:"Lo que queda",copy:"Gestos y huellas que pasan de generación."},
  rituals:{title:"Nuestros rituales",copy:"Esas costumbres que sólo ustedes entienden."},
  chapters:{title:"Los capítulos",copy:"Etapas de una historia compartida."},
  future:{title:"Lo que viene",copy:"Una mirada hacia lo que todavía falta vivir."},
  origin:{title:"El comienzo",copy:"El punto donde empezó todo."},
  reasons:{title:"Las razones",copy:"Por qué llegaste hasta esta decisión."},
  certainty:{title:"La certeza",copy:"Las cosas que te hicieron estar seguro."},
  threshold:{title:"Antes de la pregunta",copy:"El último instante antes del gran momento."},
  proposal:{title:"La pregunta",copy:"El momento final de la propuesta."},
  light:{title:"La luz",copy:"Una frase escondida que se revela iluminando."},
  hold:{title:"Mantené apretado",copy:"Una pequeña pausa interactiva antes de seguir."},
  childhood:{title:"La infancia",copy:"Un regreso a los primeros recuerdos."},
  care:{title:"Las formas de cuidar",copy:"Gestos cotidianos que hoy se entienden distinto."},
  sacrifices:{title:"Todo lo que hizo",copy:"Pequeños esfuerzos que antes pasaban desapercibidos."},
  return:{title:"Volver a casa",copy:"Una escena de regreso y gratitud."},
  lessons:{title:"Lo que enseñó",copy:"Frases y aprendizajes que quedaron."},
  presence:{title:"Estar",copy:"Momentos donde la presencia dijo más que las palabras."},
  inheritance:{title:"Lo que quedó en vos",copy:"Costumbres y gestos que heredaste."},
  lookback:{title:"Mirar atrás",copy:"Una pausa para entender todo lo recorrido."},
  casefile:{title:"El expediente",copy:"La apertura divertida de una gran amistad."},
  insidejokes:{title:"Los códigos",copy:"Chistes y frases que sólo ustedes entienden."},
  incidents:{title:"Las anécdotas",copy:"Esos episodios que merecen quedar registrados."},
  proof:{title:"Las pruebas",copy:"Pequeñas evidencias de una amistad enorme."},
  pact:{title:"El pacto",copy:"El cierre entre dos personas que se eligieron."},
};

function accessKey(code:string){return `thi_editor_access:${code}`}

async function optimizeStudioUpload(file:File,kind:MediaKind){
  const heic=/^image\/(heic|heif)$/.test(file.type);
  if(kind!=="image"||!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)||(!heic&&file.size<1_800_000))return file;
  try{
    const bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});
    const maxSide=1800;
    const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*scale));
    const height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement("canvas");
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext("2d");
    if(!context){bitmap.close();return file}
    context.drawImage(bitmap,0,0,width,height);
    bitmap.close();
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",.86));
    if(!blob||blob.size>=file.size*.95)return file;
    const base=file.name.replace(/\.[^.]+$/,"")||"foto";
    return new File([blob],base+".webp",{type:"image/webp",lastModified:file.lastModified});
  }catch{
    return file;
  }
}

function starterLetter(recipient:string,giver:string){
  const to=recipient.trim()||"vos";
  const from=giver.trim();
  return `${to}, hice esto para vos porque hay cosas que a veces cuesta decir en una conversación normal.

Gracias por los momentos, por lo compartido y por todo eso pequeño que termina siendo enorme. Ojalá cuando termines de recorrer este regalo te quede una sola certeza: sos muy importante para mí.${from?`\n\nCon todo mi cariño,\n${from}`:""}`;
}

function giftToBasics(gift:StudioGift):Basics{
  return {
    giverName:gift.giver_name||"",
    recipientName:gift.recipient_name==="A definir"?"":gift.recipient_name||"",
    occasion:gift.occasion||"",
    feeling:gift.feeling||"Emoción",
    relationship:gift.story_data?.relationship||"",
    keyDate:gift.story_data?.keyDate||"",
    anecdote:gift.story_data?.anecdote||"",
    openingText:gift.opening_text||"",
    letterText:gift.letter_text||"",
    closingText:gift.closing_text||"",
    musicUrl:gift.music_url||"",
  };
}

function Preview({
  gift,media,sceneTextOverrides,
}:{
  gift:StudioGift;
  media:StudioMedia[];
  sceneTextOverrides:StudioSceneTextOverrides;
}){
  const ordered=[...media].sort((a,b)=>a.sort_order-b.sort_order);
  const soundtrack=ordered.find(item=>item.kind==="audio"&&item.url&&item.metadata?.role==="soundtrack");
  const photoMedia=ordered.filter(item=>item.kind==="image"&&item.url).map(item=>({
    url:item.url as string,
    caption:item.caption||undefined,
    fit:item.metadata?.fit||"cover",
    position:item.metadata?.position||"center",
    scene:item.metadata?.scene,
  }));
  const audioMedia=ordered.filter(item=>item.kind==="audio"&&item.url&&item.metadata?.role!=="soundtrack").map(item=>({
    url:item.url as string,caption:item.caption||undefined,scene:item.metadata?.scene,
  }));
  const videoMedia=ordered.filter(item=>item.kind==="video"&&item.url).map(item=>({
    url:item.url as string,caption:item.caption||undefined,scene:item.metadata?.scene,
  }));

  if(gift.template_version==="premium-v1"){
    const base=getPremiumV1Experience(gift.experience_slug);
    if(!base)return null;
    const experience={
      ...base,
      demoGiver:gift.giver_name,
      demoRecipient:gift.recipient_name,
      opening:gift.opening_text||base.opening,
      closing:gift.closing_text||base.closing,
      recipe:(gift.scene_recipe.length?gift.scene_recipe:base.recipe) as PremiumSceneType[],
      accent:gift.theme_data?.accent||base.accent,
    };
    return <PremiumV1Engine
      experience={experience}
      copyOverride={gift.story_data?.script as never}
      letterText={gift.letter_text||undefined}
      photoMedia={photoMedia.map(item=>({...item,scene:item.scene as PremiumSceneType|undefined}))}
      audioMedia={audioMedia.map(item=>({...item,scene:item.scene as PremiumSceneType|undefined}))}
      soundtrackMedia={soundtrack?{url:soundtrack.url as string,caption:soundtrack.caption||undefined}:undefined}
      videoMedia={videoMedia.map(item=>({...item,scene:item.scene as PremiumSceneType|undefined}))}
      storyContext={{keyDate:gift.story_data?.keyDate,anecdote:gift.story_data?.anecdote}}
      sceneTextOverrides={normalizePremiumSceneTextOverrides(sceneTextOverrides)}
    />;
  }

  const base=getExperience(gift.experience_slug);
  if(!base)return null;
  const experience={
    ...base,
    demoGiver:gift.giver_name,
    demoRecipient:gift.recipient_name,
    opening:gift.opening_text||base.opening,
    closing:gift.closing_text||base.closing,
    recipe:(gift.scene_recipe.length?gift.scene_recipe:base.recipe) as SceneType[],
    accent:gift.theme_data?.accent||base.accent,
  };
  return <ExperienceEngine
    experience={experience}
    copyOverride={gift.story_data?.script as never}
    letterText={gift.letter_text||undefined}
    photoMedia={photoMedia.map(item=>({...item,scene:item.scene as SceneType|undefined}))}
    audioMedia={audioMedia.map(item=>({...item,scene:item.scene as SceneType|undefined}))}
    soundtrackMedia={soundtrack?{url:soundtrack.url as string,caption:soundtrack.caption||undefined}:undefined}
    videoMedia={videoMedia.map(item=>({...item,scene:item.scene as SceneType|undefined}))}
    storyContext={{keyDate:gift.story_data?.keyDate,anecdote:gift.story_data?.anecdote}}
    sceneTextOverrides={normalizeSceneTextOverrides(sceneTextOverrides)}
  />;
}

export default function CustomerStudio({code}:{code:string}){
  const [editorToken,setEditorToken]=useState("");
  const [payload,setPayload]=useState<StudioPayload|null>(null);
  const [basics,setBasics]=useState<Basics|null>(null);
  const [step,setStep]=useState(0);
  const [loading,setLoading]=useState(true);
  const [accessState,setAccessState]=useState<"checking"|"missing"|"payment"|"ready"|"error">("checking");
  const [saveState,setSaveState]=useState<"saved"|"saving"|"error">("saved");
  const [saveRetry,setSaveRetry]=useState(0);
  const [dirty,setDirty]=useState(false);
  const [uploading,setUploading]=useState<string[]>([]);
  const [message,setMessage]=useState("");
  const [recovery,setRecovery]=useState({email:"",whatsapp:""});
  const [recovering,setRecovering]=useState(false);
  const [published,setPublished]=useState(false);
  const fileInputRef=useRef<HTMLInputElement|null>(null);
  const audioInputRef=useRef<HTMLInputElement|null>(null);
  const videoInputRef=useRef<HTMLInputElement|null>(null);
  const replaceInputRef=useRef<HTMLInputElement|null>(null);
  const recipientInputRef=useRef<HTMLInputElement|null>(null);
  const giverInputRef=useRef<HTMLInputElement|null>(null);
  const [replaceTarget,setReplaceTarget]=useState<StudioMedia|null>(null);

  const loadStudio=useCallback(async(token:string)=>{
    setLoading(true);setMessage("");
    try{
      const data=await creatorCall<StudioPayload>("openStudio",{code,editorToken:token});
      setPayload(data);
      setBasics(current=>current??giftToBasics(data.gift));
      setPublished(data.gift.status==="published");
      setAccessState("ready");
    }catch(error){
      const reason=error instanceof Error?error.message:"studio_failed";
      if(reason==="payment_required")setAccessState("payment");
      else if(reason==="studio_unauthorized"){
        window.localStorage.removeItem(accessKey(code));
        setEditorToken("");
        setAccessState("missing");
      }else setAccessState("error");
    }finally{setLoading(false)}
  },[code]);

  useEffect(()=>{
    const timer=window.setTimeout(()=>{
      const token=window.localStorage.getItem(accessKey(code))||"";
      setEditorToken(token);
      if(token)void loadStudio(token);
      else {setAccessState("missing");setLoading(false)}
    },0);
    return()=>window.clearTimeout(timer);
  },[code,loadStudio]);

  useEffect(()=>{
    if(!dirty||!basics||!editorToken||accessState!=="ready")return;
    const timer=window.setTimeout(async()=>{
      setSaveState("saving");
      try{
        await creatorCall("saveStudioBasics",{code,editorToken,...basics});
        setDirty(false);setSaveState("saved");
        setPayload(current=>current?{
          ...current,
          gift:{
            ...current.gift,
            giver_name:basics.giverName,
            recipient_name:basics.recipientName,
            occasion:basics.occasion||null,
            feeling:basics.feeling||null,
            opening_text:basics.openingText||null,
            letter_text:basics.letterText||null,
            closing_text:basics.closingText||null,
            music_url:basics.musicUrl||null,
            story_data:{...(current.gift.story_data||{}),relationship:basics.relationship,keyDate:basics.keyDate,anecdote:basics.anecdote},
          },
        }:current);
      }catch{
        setSaveState("error");
      }
    },700);
    return()=>window.clearTimeout(timer);
  },[dirty,basics,editorToken,accessState,code,saveRetry]);

  const updateBasic=<K extends keyof Basics>(key:K,value:Basics[K])=>{
    setBasics(current=>current?{...current,[key]:value}:current);
    setDirty(true);setSaveState("saving");
  };

  async function recoverAccess(event:React.FormEvent){
    event.preventDefault();setRecovering(true);setMessage("");
    try{
      const result=await creatorCall<{editorToken:string}>("recoverStudioAccess",{code,...recovery});
      window.localStorage.setItem(accessKey(code),result.editorToken);
      setEditorToken(result.editorToken);
      await loadStudio(result.editorToken);
    }catch(error){
      const reason=error instanceof Error?error.message:"";
      setMessage(reason==="payment_required"
        ?"El pago todavía no figura aprobado. Volvé al seguimiento del pedido."
        :"No coinciden con los datos usados en la compra.");
    }finally{setRecovering(false)}
  }

  async function uploadFiles(files:FileList|null,kind:MediaKind){
    if(!files||!editorToken)return;
    const all=Array.from(files);
    const limit=kind==="image"?20:6;
    const selected=all.slice(0,limit);
    if(!selected.length)return;
    const limitNotice=all.length>limit
      ?`Podés usar hasta ${limit} archivos acá. Vamos a subir los primeros ${limit} que elegiste.`
      :"";
    setUploading(selected.map(file=>file.name));setMessage("");
    try{
      for(const file of selected){
        const uploadFile=await optimizeStudioUpload(file,kind);
        const prepared=await creatorCall<{path:string;token:string;kind:MediaKind}>("prepareStudioUpload",{
          code,editorToken,fileName:uploadFile.name,mimeType:uploadFile.type,size:uploadFile.size,
        });
        await uploadCreatorFile(prepared.path,prepared.token,uploadFile);
        await creatorCall("registerStudioMedia",{
          code,editorToken,storagePath:prepared.path,kind:prepared.kind,
          originalName:file.name,mimeType:uploadFile.type,size:uploadFile.size,
        });
      }
      await loadStudio(editorToken);
      setMessage(limitNotice||(selected.length===1?"Listo, ya está adentro ✓":`Listo, subimos ${selected.length} archivos ✓`));
    }catch(error){
      const reason=error instanceof Error?error.message:"";
      setMessage(reason==="media_limit"
        ?"Llegaste al máximo de archivos de esta experiencia."
        :"Uno de los archivos no pudo subirse. Probá con otro.");
    }finally{
      setUploading([]);
      if(kind==="image"&&fileInputRef.current)fileInputRef.current.value="";
      if(kind==="audio"&&audioInputRef.current)audioInputRef.current.value="";
      if(kind==="video"&&videoInputRef.current)videoInputRef.current.value="";
    }
  }

  async function replaceMediaFile(files:FileList|null){
    const file=files?.[0];
    const target=replaceTarget;
    if(!file||!target||!editorToken)return;
    setUploading([file.name]);setMessage("");
    try{
      const uploadFile=await optimizeStudioUpload(file,target.kind);
      const prepared=await creatorCall<{path:string;token:string;kind:MediaKind}>("prepareStudioUpload",{
        code,editorToken,fileName:uploadFile.name,mimeType:uploadFile.type,size:uploadFile.size,
      });
      if(prepared.kind!==target.kind){
        setMessage(target.kind==="image"?"Elegí una imagen.":target.kind==="audio"?"Elegí un audio.":"Elegí un video.");
        return;
      }
      await uploadCreatorFile(prepared.path,prepared.token,uploadFile);
      await creatorCall("replaceStudioMedia",{
        code,editorToken,mediaId:target.id,storagePath:prepared.path,kind:prepared.kind,
        originalName:file.name,mimeType:uploadFile.type,size:uploadFile.size,
      });
      await loadStudio(editorToken);
      setMessage("Listo, lo cambiamos sin mover nada ✓");
    }catch{
      setMessage("No pudimos reemplazar ese archivo. Probá con otro.");
    }finally{
      setUploading([]);
      setReplaceTarget(null);
      if(replaceInputRef.current)replaceInputRef.current.value="";
    }
  }

  function chooseReplacement(item:StudioMedia){
    setReplaceTarget(item);
    window.setTimeout(()=>replaceInputRef.current?.click(),0);
  }

  async function updateMedia(item:StudioMedia,patch:Record<string,unknown>){
    if(!editorToken)return;
    setMessage("");
    try{
      await creatorCall("updateStudioMedia",{
        code,editorToken,mediaId:item.id,
        caption:patch.caption??item.caption??"",
        scene:patch.scene??item.metadata?.scene??"",
        fit:patch.fit??item.metadata?.fit??"cover",
        position:patch.position??item.metadata?.position??"center",
        role:patch.role??item.metadata?.role??"voice",
      });
      await loadStudio(editorToken);
    }catch{setMessage("No se pudo guardar ese cambio.")}
  }

  async function deleteMedia(item:StudioMedia){
    if(!editorToken)return;
    if(!window.confirm(item.kind==="image"?"¿Sacamos esta foto del regalo?":"¿Sacamos este archivo del regalo?"))return;
    try{
      await creatorCall("deleteStudioMedia",{code,editorToken,mediaId:item.id});
      await loadStudio(editorToken);
    }catch{setMessage("No se pudo eliminar. Probá de nuevo.")}
  }

  async function moveMedia(item:StudioMedia,direction:-1|1){
    if(!payload||!editorToken)return;
    const ordered=[...payload.media].sort((a,b)=>a.sort_order-b.sort_order);
    const same=ordered.filter(media=>media.kind===item.kind);
    const index=same.findIndex(media=>media.id===item.id);
    const target=same[index+direction];
    if(!target)return;
    const a=ordered.findIndex(media=>media.id===item.id);
    const b=ordered.findIndex(media=>media.id===target.id);
    [ordered[a],ordered[b]]=[ordered[b],ordered[a]];
    try{
      await creatorCall("reorderStudioMedia",{code,editorToken,mediaIds:ordered.map(media=>media.id)});
      await loadStudio(editorToken);
    }catch{setMessage("No pudimos moverlo.")}
  }

  async function toggleScene(scene:string,visible:boolean){
    if(!payload||!editorToken)return;
    const current=new Set(payload.gift.scene_recipe);
    if(visible)current.add(scene);else current.delete(scene);
    try{
      const result=await creatorCall<{sceneRecipe:string[]}>("saveStudioRecipe",{
        code,editorToken,sceneRecipe:Array.from(current),
      });
      setPayload(value=>value?{...value,gift:{...value.gift,scene_recipe:result.sceneRecipe}}:value);
    }catch{setMessage("Esa parte no pudo cambiarse.")}
  }

  async function publishGift(){
    if(!editorToken||!payload)return;
    if(!basics?.recipientName.trim()){
      setStep(0);setMessage("Primero decinos quién recibe el regalo.");return;
    }
    setSaveState("saving");setMessage("");
    try{
      if(dirty&&basics){
        await creatorCall("saveStudioBasics",{code,editorToken,...basics});
        setDirty(false);
      }
      await creatorCall("publishStudio",{code,editorToken});
      setPublished(true);setSaveState("saved");
      setPayload(value=>value?{...value,gift:{...value.gift,status:"published"}}:value);
      window.scrollTo({top:0,behavior:"smooth"});
    }catch{
      setSaveState("error");setMessage("No pudimos publicar todavía. Revisá los datos e intentá de nuevo.");
    }
  }

  function shareGift(){
    const url=`https://tehiceesto.com/r/${code}`;
    const text=encodeURIComponent(`Hice algo para vos ❤️\n${url}`);
    window.open(`https://wa.me/?text=${text}`,"_blank","noopener,noreferrer");
  }

  async function copyGiftLink(){
    try{
      await navigator.clipboard.writeText(`https://tehiceesto.com/r/${code}`);
      setMessage("Link copiado ✓");
    }catch{
      setMessage("No pudimos copiarlo. Podés abrir el regalo y copiar la dirección.");
    }
  }

  const gift=payload?.gift;
  const currentBase=gift?getExperience(gift.experience_slug):undefined;
  const frozenBase=gift?getPremiumV1Experience(gift.experience_slug):undefined;
  const canonical=(gift?.template_version==="premium-v1"?frozenBase?.recipe:currentBase?.recipe)||[];
  const media=payload?.media||[];
  const photos=media.filter(item=>item.kind==="image");
  const audios=media.filter(item=>item.kind==="audio");
  const voiceAudios=audios.filter(item=>item.metadata?.role!=="soundtrack");
  const videos=media.filter(item=>item.kind==="video");
  const effectiveRecipe=effectiveRecipeForMedia(gift?.scene_recipe||[],{
    hasPhoto:photos.length>0,
    hasVoice:voiceAudios.length>0,
    hasVideo:videos.length>0,
  });
  const sceneTextOverrides=gift?.story_data?.sceneContent||{};
  const progress=Math.round(((step+1)/STEP_LABELS.length)*100);

  function goToStep(next:number){
    if(uploading.length){
      setMessage("Esperá un momento: todavía estamos subiendo tus archivos.");
      return;
    }
    if(next>0&&basics){
      if(!basics.recipientName.trim()){
        setMessage("Primero escribí el nombre de quien recibe el regalo.");
        recipientInputRef.current?.focus();
        return;
      }
      if(!basics.giverName.trim()){
        setMessage("Ahora escribí tu nombre para poder seguir.");
        giverInputRef.current?.focus();
        return;
      }
    }
    const target=Math.max(0,Math.min(STEP_LABELS.length-1,next));
    setMessage("");
    setStep(target);
    window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"smooth"}));
  }

  if(loading&&accessState==="checking")return <main className="studio-gate"><div className="studio-loader"><span/><strong>Preparando tu regalo…</strong></div></main>;

  if(accessState==="payment")return <main className="studio-gate">
    <section className="studio-gate-card">
      <span className="studio-gate-mark">✓</span>
      <p className="studio-eyebrow">TU COMPRA ESTÁ GUARDADA</p>
      <h1>Falta que se confirme el pago.</h1>
      <p>En cuanto Mercado Pago lo apruebe, este mismo acceso te deja empezar a personalizar automáticamente.</p>
      <Link className="studio-main-button" href={`/tehiceesto/pedido/${code}`}>Ver estado del pago <b>→</b></Link>
    </section>
  </main>;

  if(accessState==="missing")return <main className="studio-gate">
    <section className="studio-gate-card">
      <span className="studio-gate-mark">✦</span>
      <p className="studio-eyebrow">RECUPERAR MI EDICIÓN</p>
      <h1>Volvamos a abrir tu regalo.</h1>
      <p>Ingresá los mismos datos que usaste al comprar. No necesitás contraseña.</p>
      <form className="studio-recovery" onSubmit={recoverAccess}>
        <label><span>Email de la compra</span><input type="email" required value={recovery.email} onChange={event=>setRecovery(current=>({...current,email:event.target.value}))} placeholder="tu@email.com"/></label>
        <label><span>WhatsApp de la compra</span><input autoComplete="tel" inputMode="tel" required value={recovery.whatsapp} onChange={event=>setRecovery(current=>({...current,whatsapp:event.target.value}))} placeholder="+54 9 221 ..."/></label>
        <button className="studio-main-button" disabled={recovering}>{recovering?"Buscando…":"Entrar a mi regalo"} <b>→</b></button>
      </form>
      {message&&<p className="studio-alert">{message}</p>}
      <Link className="studio-text-link" href={`/tehiceesto/pedido/${code}`}>Ver seguimiento del pedido</Link>
    </section>
  </main>;

  if(accessState==="error"||!gift||!basics)return <main className="studio-gate">
    <section className="studio-gate-card"><span className="studio-gate-mark">!</span><h1>No pudimos abrir el estudio.</h1><p>Tu pedido sigue guardado. Probá actualizar o entrá desde el seguimiento.</p><Link className="studio-main-button" href={`/tehiceesto/pedido/${code}`}>Ir al pedido <b>→</b></Link></section>
  </main>;

  if(published&&step===5)return <main className="studio-success">
    <section>
      <div className="studio-success-orbit" aria-hidden="true"/>
      <span className="studio-success-mark">♥</span>
      <p className="studio-eyebrow">YA EXISTE</p>
      <h1>Tu regalo está listo para vivirlo.</h1>
      <p>Este link es privado y ya tiene todo lo que acabás de crear. Podés abrirlo, compartirlo o volver a editarlo cuando quieras.</p>
      <div className="studio-success-link"><span>tehiceesto.com/r/</span><strong>{code}</strong></div>
      <div className="studio-success-actions">
        <button className="studio-main-button" onClick={shareGift}>Enviar por WhatsApp <b>→</b></button>
        <a className="studio-secondary-button" href={`/tehiceesto/r/${code}`} target="_blank" rel="noreferrer">Abrir antes de enviar ↗</a>
      </div>
      <div className="studio-success-links">
        <button className="studio-text-link" onClick={copyGiftLink}>Copiar link</button>
        <button className="studio-text-link" onClick={()=>setPublished(false)}>Quiero cambiar algo</button>
      </div>
    </section>
  </main>;

  return <main className="studio-shell">
    <header className="studio-topbar">
      <div>
        <Link href="/tehiceesto" className="studio-brand">TE HICE ESTO</Link>
        <span className="studio-order-code">REGALO · {code.toUpperCase()}</span>
      </div>
      {saveState==="error"?(
        <button type="button" className="studio-save-state error retry" onClick={()=>{setSaveState("saving");setSaveRetry(value=>value+1)}} aria-live="polite">
          <i/>No se guardó · Reintentar
        </button>
      ):(
        <div className={`studio-save-state ${saveState}`} aria-live="polite">
          <i/>{saveState==="saving"?"Guardando…":"Todo guardado"}
        </div>
      )}
    </header>

    <div className="studio-progress-wrap">
      <div className="studio-progress-meta"><span>PASO {step+1} DE {STEP_LABELS.length} · {STEP_LABELS[step].toUpperCase()}</span><strong>{progress}%</strong></div>
      <div className="studio-progress"><i style={{width:progress+"%"}}/></div>
    </div>

    <nav className="studio-stepper" aria-label="Pasos de personalización">
      {STEP_LABELS.map((label,index)=><button key={label} type="button" className={index===step?"active":index<step?"done":""} onClick={()=>goToStep(index)}>
        <span>{index<step?"✓":index+1}</span><strong>{label}</strong>
      </button>)}
    </nav>

    <section className="studio-work">
      {step===0&&<div className="studio-panel studio-people">
        <header><p className="studio-eyebrow">PRIMERO, LO ESENCIAL</p><h1>¿Quién va a recibir esto?</h1><p>Con dos nombres ya empezamos a convertir la experiencia en algo de ustedes.</p></header>
        <div className="studio-big-fields">
          <label><span>Nombre de quien recibe el regalo</span><input ref={recipientInputRef} value={basics.recipientName} onChange={event=>updateBasic("recipientName",event.target.value)} placeholder="Ej. Ailín" autoFocus/><small>Este nombre va a aparecer dentro del regalo.</small></label>
          <label><span>Tu nombre</span><input ref={giverInputRef} value={basics.giverName} onChange={event=>updateBasic("giverName",event.target.value)} placeholder="Ej. Mauro"/><small>Para que sepa quién se lo hizo.</small></label>
        </div>
        <details className="studio-optional-details">
          <summary><span>Agregar un poco más</span><small>opcional</small><b>＋</b></summary>
          <div>
            <label className="studio-field"><span>¿Qué es esta persona para vos?</span><textarea rows={3} value={basics.relationship} onChange={event=>updateBasic("relationship",event.target.value)} placeholder="Mi pareja, mi compañera, la persona con la que quiero compartir todo…"/></label>
            <div className="studio-feelings"><span>¿Qué querés que sienta?</span><div>{FEELINGS.map(feeling=><button type="button" key={feeling} className={basics.feeling===feeling?"selected":""} onClick={()=>updateBasic("feeling",feeling)}>{feeling}</button>)}</div></div>
          </div>
        </details>
      </div>}

      {step===1&&<div className="studio-panel">
        <header><p className="studio-eyebrow">TUS RECUERDOS</p><h1>Elegí las fotos que cuentan la historia.</h1><p>No hace falta que sean perfectas. Las mejores casi siempre son las que significan algo.</p></header>
        <button className="studio-upload-hero" type="button" disabled={uploading.length>0} onClick={()=>fileInputRef.current?.click()}>
          <span>＋</span><div><strong>{photos.length?"Agregar más fotos":"Elegir fotos"}</strong><small>Podés elegir varias de una sola vez · hasta 20</small></div><b>→</b>
        </button>
        <input ref={fileInputRef} hidden type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={event=>uploadFiles(event.target.files,"image")}/>
        {uploading.length>0&&<div className="studio-uploading"><span/><div><strong>Preparando y subiendo…</strong><small>{uploading[0]}{uploading.length>1?` y ${uploading.length-1} más`:""}</small></div></div>}
        {photos.length>0?<div className="studio-photo-grid">{photos.map((item,index)=><article key={item.id}>
          <div className="studio-photo"><img src={item.url||""} alt={item.caption||"Recuerdo"} style={{objectFit:item.metadata?.fit||"cover",objectPosition:item.metadata?.position||"center"}}/><span>{String(index+1).padStart(2,"0")}</span></div>
          <input defaultValue={item.caption||""} onBlur={event=>updateMedia(item,{caption:event.target.value})} placeholder="Podés escribir una frase acá · opcional"/>
          <div className="studio-media-primary-actions">
            <button type="button" onClick={()=>chooseReplacement(item)}>Cambiar foto</button>
            <button type="button" className="danger" onClick={()=>deleteMedia(item)}>Quitar</button>
          </div>
          <details className="studio-media-options">
            <summary><span>Orden y encuadre</span><small>opcional</small><b>＋</b></summary>
            <div className="studio-media-mini-actions">
              {photos.length>1&&<button type="button" onClick={()=>moveMedia(item,-1)} disabled={index===0}>↑ Mover antes</button>}
              {photos.length>1&&<button type="button" onClick={()=>moveMedia(item,1)} disabled={index===photos.length-1}>↓ Mover después</button>}
              <button type="button" onClick={()=>updateMedia(item,{fit:item.metadata?.fit==="contain"?"cover":"contain"})}>{item.metadata?.fit==="contain"?"Llenar el marco":"Ver foto completa"}</button>
            </div>
          </details>
        </article>)}</div>:<div className="studio-empty-soft"><span>▧</span><strong>Todavía no elegiste fotos.</strong><p>Podés seguir y volver después. Nada se pierde.</p></div>}
        {videos.length===0?(
          <button className="studio-extra-upload" type="button" disabled={uploading.length>0} onClick={()=>videoInputRef.current?.click()}><span>▶</span><div><strong>¿Tenés un video especial?</strong><small>Es opcional. Podés agregar uno acá.</small></div></button>
        ):(
          <div className="studio-video-card">
            {videos[0].url&&<video src={videos[0].url} controls playsInline preload="metadata"/>}
            <div>
              <strong>Tu video especial</strong>
              <small>También podés cambiarlo o quitarlo cuando quieras.</small>
              <span>
                <button type="button" onClick={()=>chooseReplacement(videos[0])}>Cambiar video</button>
                <button type="button" className="danger" onClick={()=>deleteMedia(videos[0])}>Quitar</button>
              </span>
            </div>
          </div>
        )}
        <input ref={videoInputRef} hidden type="file" accept="video/mp4,video/webm,video/quicktime" onChange={event=>uploadFiles(event.target.files,"video")}/>
      </div>}

      {step===2&&<div className="studio-panel">
        <header><p className="studio-eyebrow">LAS VOCES</p><h1>Hay cosas que emocionan distinto cuando se escuchan.</h1><p>Subí audios de WhatsApp, notas de voz o una canción que sea de ustedes.</p></header>
        <button className="studio-upload-hero audio" type="button" disabled={uploading.length>0} onClick={()=>audioInputRef.current?.click()}>
          <span>♪</span><div><strong>{audios.length?"Agregar otro audio":"Elegir un audio"}</strong><small>Audio de WhatsApp, MP3, M4A, OGG u OPUS · hasta 6</small></div><b>→</b>
        </button>
        <input ref={audioInputRef} hidden type="file" multiple accept="audio/mpeg,audio/mp4,audio/webm,audio/wav,audio/x-m4a,audio/ogg,audio/opus,.m4a,.mp3,.wav,.ogg,.opus" onChange={event=>uploadFiles(event.target.files,"audio")}/>
        {audios.length>0?<div className="studio-audio-list">{audios.map((item,index)=><article key={item.id}>
          <span className="studio-audio-number">{String(index+1).padStart(2,"0")}</span>
          <div className="studio-audio-main"><input defaultValue={item.caption||""} onBlur={event=>updateMedia(item,{caption:event.target.value})} placeholder={item.metadata?.role==="soundtrack"?"Nombre de la canción":"Ej. Mensaje de mamá"}/>{item.url&&<audio src={item.url} controls preload="metadata"/>}</div>
          <label className="studio-audio-role"><span>¿Cómo querés usarlo?</span><select value={item.metadata?.role||"voice"} onChange={event=>updateMedia(item,{role:event.target.value})}><option value="voice">Como mensaje de voz</option><option value="soundtrack">Como música de fondo</option></select></label>
          <div className="studio-audio-actions">
            <button type="button" onClick={()=>chooseReplacement(item)}>Cambiar audio</button>
            <button type="button" className="studio-remove" onClick={()=>deleteMedia(item)}>Quitar</button>
          </div>
          {audios.length>1&&<details className="studio-media-options audio-order">
            <summary><span>Cambiar el orden</span><small>opcional</small><b>＋</b></summary>
            <div className="studio-media-mini-actions">
              <button type="button" onClick={()=>moveMedia(item,-1)} disabled={index===0}>↑ Mover antes</button>
              <button type="button" onClick={()=>moveMedia(item,1)} disabled={index===audios.length-1}>↓ Mover después</button>
            </div>
          </details>}
        </article>)}</div>:<div className="studio-empty-soft"><span>♪</span><strong>Los audios son opcionales.</strong><p>La experiencia funciona igual sin ellos. Si tenés uno, acá puede convertirse en uno de los momentos más fuertes.</p></div>}
      </div>}

      {step===3&&<div className="studio-panel studio-words">
        <header><p className="studio-eyebrow">TUS PALABRAS</p><h1>Decile lo importante. Lo demás ya está resuelto.</h1><p>No hace falta escribir “lindo”. Escribí como hablás. Y si preferís no tocar nada, el regalo ya tiene textos preparados.</p></header>
        <label className="studio-field important"><span>Tu carta <em>opcional</em></span><textarea rows={9} value={basics.letterText} onChange={event=>updateBasic("letterText",event.target.value)} placeholder="¿Qué te gustaría que esta persona recuerde después de cerrar la pantalla?"/><small>Podés escribir dos líneas o mucho más. No hay una forma correcta.</small></label>
        {!basics.letterText.trim()&&<button type="button" className="studio-writing-help" onClick={()=>updateBasic("letterText",starterLetter(basics.recipientName,basics.giverName))}><span>✦</span><div><strong>No sé qué escribir</strong><small>Poner un texto de ayuda que después puedo cambiar</small></div><b>→</b></button>}
        <details className="studio-optional-details studio-more-words">
          <summary><span>Personalizar más frases</span><small>opcional</small><b>＋</b></summary>
          <div>
            <label className="studio-field"><span>La primera frase</span><textarea rows={3} value={basics.openingText} onChange={event=>updateBasic("openingText",event.target.value)} placeholder={currentBase?.opening||frozenBase?.opening||"Una frase para empezar…"}/><small>Es lo primero que va a leer.</small></label>
            <label className="studio-field"><span>Un recuerdo que sólo ustedes entienden</span><textarea rows={4} value={basics.anecdote} onChange={event=>updateBasic("anecdote",event.target.value)} placeholder="Ese viaje, esa frase, esa tarde, ese papelón…"/></label>
            <label className="studio-field"><span>La última frase</span><textarea rows={3} value={basics.closingText} onChange={event=>updateBasic("closingText",event.target.value)} placeholder={currentBase?.closing||frozenBase?.closing||"Una frase para cerrar…"}/></label>
            <label className="studio-field compact"><span>Una fecha importante</span><input type="date" value={basics.keyDate} onChange={event=>updateBasic("keyDate",event.target.value)}/></label>
          </div>
        </details>
      </div>}

      {step===4&&<div className="studio-panel">
        <header><p className="studio-eyebrow">OPCIONAL</p><h1>Tu regalo ya viene armado.</h1><p>Recomendamos dejarlo así. Sólo entrá acá si hay una parte que de verdad no querés mostrar.</p></header>
        <div className="studio-ready-structure">
          <span>✓</span>
          <div><strong>La estructura ya está resuelta</strong><p>Las partes están ordenadas para que la emoción crezca de principio a fin.</p></div>
        </div>
        <details className="studio-parts-details">
          <summary><span>Quiero quitar o recuperar una parte</span><small>opcional</small><b>＋</b></summary>
          <div className="studio-section-list">{canonical.map((scene,index)=>{
            const terminal=scene==="finale"||scene==="proposal";
            const locked=scene==="intro"||terminal;
            const needsPhoto=scene==="memories"&&photos.length===0;
            const needsVoice=scene==="voices"&&voiceAudios.length===0;
            const needsVideo=scene==="video"&&videos.length===0;
            const missingMedia=needsPhoto||needsVoice||needsVideo;
            const visible=gift.scene_recipe.includes(scene)&&!missingMedia;
            const meta=SCENE_LABELS[scene]||{title:"Una parte de la experiencia",copy:"Un momento del recorrido."};
            return <article key={scene} className={visible?"visible":missingMedia?"needs-media":""}>
              <span className="studio-section-index">{String(index+1).padStart(2,"0")}</span>
              <div><strong>{meta.title}</strong><p>{missingMedia?(needsPhoto?"Se activa cuando agregás al menos una foto.":needsVoice?"Se activa cuando agregás un mensaje de voz.":"Se activa cuando agregás un video."):meta.copy}</p></div>
              {locked
                ?<span className="studio-section-required">ESENCIAL</span>
                :missingMedia
                  ?<button type="button" className="studio-section-add" onClick={()=>goToStep(needsVoice?2:1)}>+ {needsVoice?"Audio":needsVideo?"Video":"Foto"}</button>
                  :<button type="button" className={visible?"studio-switch on":"studio-switch"} aria-pressed={visible} onClick={()=>toggleScene(scene,!visible)}><i/><span>{visible?"Visible":"Oculta"}</span></button>}
            </article>;
          })}</div>
        </details>
      </div>}

      {step===5&&<div className="studio-preview-wrap">
        <div className="studio-preview-head">
          <div><p className="studio-eyebrow">ÚLTIMO PASO</p><h1>Vivilo antes de mandarlo.</h1><p>Esta es la experiencia real. Recorré cada parte como la va a ver {basics.recipientName||"esa persona"}.</p></div>
          <div className="studio-preview-actions"><button type="button" className="studio-secondary-button" onClick={()=>goToStep(3)}>← Cambiar palabras</button><button type="button" className="studio-main-button compact" onClick={publishGift}>{published?"Guardar y actualizar":"Publicar mi regalo"} <b>→</b></button></div>
        </div>
        <StudioVisualTextEditor code={code} editorToken={editorToken} initialOverrides={sceneTextOverrides} onChange={next=>setPayload(current=>current?{...current,gift:{...current.gift,story_data:{...(current.gift.story_data||{}),sceneContent:next}}}:current)}/>
        <div className="studio-preview-stage"><Preview gift={{...gift,scene_recipe:effectiveRecipe}} media={media} sceneTextOverrides={sceneTextOverrides}/></div>
        <div className="studio-preview-bottom">
          <span>¿Todo se siente como ustedes?</span>
          <button className="studio-main-button" type="button" onClick={publishGift}>{published?"Guardar cambios":"Sí, publicar mi regalo"} <b>→</b></button>
        </div>
      </div>}
    </section>

    <input
      data-studio-replace-input
      ref={replaceInputRef}
      hidden
      type="file"
      accept={replaceTarget?.kind==="image"?"image/jpeg,image/png,image/webp,image/heic,image/heif":replaceTarget?.kind==="audio"?"audio/mpeg,audio/mp4,audio/webm,audio/wav,audio/x-m4a,audio/ogg,audio/opus,.m4a,.mp3,.wav,.ogg,.opus":"video/mp4,video/webm,video/quicktime"}
      onChange={event=>replaceMediaFile(event.target.files)}
    />

    {message&&<div className="studio-toast" role="status">{message}<button onClick={()=>setMessage("")}>×</button></div>}

    {step<5&&<footer className="studio-bottom-nav">
      <button type="button" className="studio-back-button" onClick={()=>goToStep(step-1)} disabled={step===0}>← Atrás</button>
      <div><small>{uploading.length?"Subiendo archivos…":saveState==="saving"?"Guardando cambios…":"Se guarda automáticamente"}</small><button type="button" className="studio-main-button compact" onClick={()=>goToStep(step+1)}>{step===4?"Ver mi regalo":"Continuar"} <b>→</b></button></div>
    </footer>}
  </main>;
}
