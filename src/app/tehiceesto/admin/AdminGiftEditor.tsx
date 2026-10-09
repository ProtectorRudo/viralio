/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExperienceEngine, { type ThiAudio, type ThiPhoto, type ThiVideo } from "../ExperienceEngine";
import { fillPrivateGiftPhotos } from "../privateGiftVisuals";
import PremiumV1Engine from "../template-v1/ExperienceEngine";
import PremiumV2Engine from "../template-v2/ExperienceEngine";
import PremiumV3Engine from "../template-v3/ExperienceEngine";
import PremiumV4Engine from "../template-v4/ExperienceEngine";
import { getExperience, type SceneType } from "../data";
import { getExperience as getPremiumV1Experience } from "../template-v1/data";
import { getExperience as getPremiumV2Experience } from "../template-v2/data";
import { getExperience as getPremiumV3Experience } from "../template-v3/data";
import { getExperience as getPremiumV4Experience } from "../template-v4/data";
import { getExperienceCopy, type DeepPartial, type ExperienceCopy } from "../experienceCopy";
import { getExperienceCopy as getPremiumV1ExperienceCopy } from "../template-v1/experienceCopy";
import { getExperienceCopy as getPremiumV2ExperienceCopy } from "../template-v2/experienceCopy";
import { getExperienceCopy as getPremiumV3ExperienceCopy } from "../template-v3/experienceCopy";
import { getExperienceCopy as getPremiumV4ExperienceCopy } from "../template-v4/experienceCopy";
import { defaultSceneForMedia } from "../mediaRouting";
import { defaultSceneForMedia as defaultPremiumV1SceneForMedia } from "../template-v1/mediaRouting";
import { defaultSceneForMedia as defaultPremiumV2SceneForMedia } from "../template-v2/mediaRouting";
import ScriptEditor from "./ScriptEditor";
import AdminCopyEditor from "./AdminCopyEditor";
import { normalizeSceneTextOverrides,type SceneTextOverrides } from "../sceneText";
import { normalizeSceneTextOverrides as normalizePremiumV1SceneTextOverrides } from "../template-v1/sceneText";
import { normalizeSceneTextOverrides as normalizePremiumV2SceneTextOverrides } from "../template-v2/sceneText";
import { normalizeSceneTextOverrides as normalizePremiumV3SceneTextOverrides } from "../template-v3/sceneText";
import { normalizeSceneTextOverrides as normalizePremiumV4SceneTextOverrides } from "../template-v4/sceneText";
import { adminCall, SESSION_KEY, uploadSignedFile } from "./api";
import { AudioUploadError, prepareCompatibleAudio } from "../audioUpload";

type Gift = {
  public_code: string;
  status: string;
  template_version: string | null;
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
  story_data: {
    relationship?: string;
    keyDate?: string;
    anecdote?: string;
    script?: DeepPartial<ExperienceCopy>;
    sceneContent?: SceneTextOverrides;
    creator?: {
      submitted?: boolean;
      submittedAt?: string;
      contactedAt?: string;
      contact?: { name?: string; email?: string; whatsapp?: string };
    };
  } | null;
  theme_data: { accent?: string } | null;
};

type Order = {
  status: "pending" | "approved" | "rejected" | "refunded" | "cancelled";
  provider: string;
  provider_reference: string | null;
  checkout_url: string | null;
  amount_minor: number | null;
  currency: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
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
    scene?: SceneType;
    role?: "voice" | "soundtrack";
  } | null;
  url: string | null;
};

const scenes: { type: SceneType; label: string }[] = [
  {type:"intro",label:"Entrada"},{type:"door",label:"Puerta"},{type:"memories",label:"Recuerdos"},
  {type:"light",label:"Luz"},{type:"hold",label:"Mantener"},{type:"timeline",label:"Línea de tiempo"},
  {type:"stars",label:"Estrellas"},{type:"everyday",label:"Un día cualquiera"},{type:"quiz",label:"Pregunta"},{type:"scratch",label:"Raspadita"},
  {type:"voices",label:"Voces"},{type:"video",label:"Video"},{type:"candles",label:"Velitas"},
  {type:"balloons",label:"Globos"},{type:"vault",label:"Bóveda"},{type:"capsule",label:"Cápsula"},
  {type:"letter",label:"Carta"},{type:"proposal",label:"Propuesta"},{type:"finale",label:"Final"},
  {type:"archive",label:"Archivo familiar"},{type:"home",label:"La casa"},{type:"legacy",label:"Legado"},
  {type:"rituals",label:"Rituales"},{type:"chapters",label:"Capítulos"},{type:"future",label:"Futuro"},
  {type:"origin",label:"Origen"},{type:"reasons",label:"Razones"},{type:"certainty",label:"Certeza"},
  {type:"threshold",label:"Umbral"},{type:"childhood",label:"Infancia"},{type:"care",label:"Cuidados"},
  {type:"sacrifices",label:"Sacrificios"},{type:"return",label:"Volver"},{type:"lessons",label:"Lecciones"},
  {type:"presence",label:"Presencia"},{type:"inheritance",label:"Herencia"},{type:"lookback",label:"Mirar de nuevo"},
  {type:"casefile",label:"Expediente"},{type:"insidejokes",label:"Códigos internos"},{type:"incidents",label:"Incidentes"},
  {type:"proof",label:"Pruebas"},{type:"pact",label:"Pacto"},
];

function humanSize(size?: number){
  if(!size) return "";
  return size < 1024*1024 ? `${Math.round(size/1024)} KB` : `${(size/(1024*1024)).toFixed(1)} MB`;
}

function seedLegacyScript(gift:Gift):Gift{
  const script:DeepPartial<ExperienceCopy>=JSON.parse(JSON.stringify(gift.story_data?.script||{}));
  if(gift.opening_text&&!script.intro?.lead) script.intro={...(script.intro||{}),lead:gift.opening_text};
  if(gift.letter_text&&!script.letter?.body) script.letter={...(script.letter||{}),body:gift.letter_text};
  if(gift.closing_text&&!script.finale?.title) script.finale={...(script.finale||{}),title:gift.closing_text};
  if(gift.closing_text&&!script.proposal?.title) script.proposal={...(script.proposal||{}),title:gift.closing_text};
  return {...gift,story_data:{...(gift.story_data||{}),script}};
}

export default function AdminGiftEditor({ code }: { code: string }) {
  const router = useRouter();
  const [gift,setGift]=useState<Gift|null>(null);
  const [order,setOrder]=useState<Order|null>(null);
  const [paymentAmount,setPaymentAmount]=useState("");
  const [paymentReference,setPaymentReference]=useState("");
  const [paymentUrl,setPaymentUrl]=useState("");
  const [paymentSaving,setPaymentSaving]=useState(false);
  const [checkoutCreating,setCheckoutCreating]=useState(false);
  const [mpAutomaticReady,setMpAutomaticReady]=useState<boolean|null>(null);
  const [media,setMedia]=useState<Media[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [preview,setPreview]=useState(false);
  const [previewScene,setPreviewScene]=useState<SceneType|null>(null);
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
      const data=await adminCall<{gift:Gift;order:Order|null;media:Media[]}>("getGift",{code});
      setGift(seedLegacyScript(data.gift));
      setOrder(data.order||null);
      setPaymentAmount(data.order?.amount_minor != null ? String(data.order.amount_minor / 100) : "");
      setPaymentReference(data.order?.provider_reference||"");
      setPaymentUrl(data.order?.checkout_url||"");
      setMedia(data.media||[]);
    }catch{
      router.push("/tehiceesto/admin");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); },[code]);

  useEffect(()=>{
    let active=true;
    fetch("https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2?status=1",{cache:"no-store"})
      .then(response=>response.ok?response.json():Promise.reject(new Error("status_failed")))
      .then((data:{configured?:boolean})=>{if(active)setMpAutomaticReady(data.configured===true)})
      .catch(()=>{if(active)setMpAutomaticReady(false)});
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    if(order?.status!=="pending")return;
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")load()},20_000);
    return()=>window.clearInterval(timer);
  },[order?.status,code]);

  const liveBase=gift?getExperience(gift.experience_slug):undefined;
  const frozenV1Base=gift?getPremiumV1Experience(gift.experience_slug):undefined;
  const frozenV2Base=gift?getPremiumV2Experience(gift.experience_slug):undefined;
  const frozenV3Base=gift?getPremiumV3Experience(gift.experience_slug):undefined;
  const frozenV4Base=gift?getPremiumV4Experience(gift.experience_slug):undefined;
  const base=gift?.template_version==="premium-v1"
    ?frozenV1Base
    :gift?.template_version==="premium-v2"
      ?frozenV2Base
      :gift?.template_version==="premium-v3"
        ?frozenV3Base
        :gift?.template_version==="premium-v4"
          ?frozenV4Base
          :liveBase;
  const PreviewEngine=(gift?.template_version==="premium-v1"
    ?PremiumV1Engine
    :gift?.template_version==="premium-v2"
      ?PremiumV2Engine
      :gift?.template_version==="premium-v3"
        ?PremiumV3Engine
        :gift?.template_version==="premium-v4"
          ?PremiumV4Engine
          :ExperienceEngine) as typeof ExperienceEngine;
  const normalizePreviewSceneText=gift?.template_version==="premium-v1"
    ?normalizePremiumV1SceneTextOverrides
    :gift?.template_version==="premium-v2"
      ?normalizePremiumV2SceneTextOverrides
      :gift?.template_version==="premium-v3"
        ?normalizePremiumV3SceneTextOverrides
        :gift?.template_version==="premium-v4"
          ?normalizePremiumV4SceneTextOverrides
          :normalizeSceneTextOverrides;
  const creatorContact=gift?.story_data?.creator?.contact;
  const creatorWhatsApp=String(creatorContact?.whatsapp||"").replace(/\D/g,"");
  const creatorMessage=gift
    ? order?.status==="approved"
      ? `Hola ${creatorContact?.name||gift.giver_name}, ya recibimos tu pago de Te Hice Esto ✨. Tu regalo ya está habilitado para personalizar. Si necesitás ayuda con algo, seguimos por acá.`
      : `Hola ${creatorContact?.name||gift.giver_name}, recibimos tu pedido de Te Hice Esto ✨. Si necesitás algo, seguimos por acá.`
    : "";

  const previewExperience=useMemo(()=>{
    if(!gift||!base) return null;
    return {
      ...base,
      demo:{...base.demo,photos:[]},
      demoGiver:gift.giver_name,
      demoRecipient:gift.recipient_name,
      opening:gift.opening_text||base.opening,
      closing:gift.closing_text||base.closing,
      recipe:["premium-v3","premium-v4"].includes(gift.template_version||"")?[...base.recipe]:(gift.scene_recipe?.length?gift.scene_recipe:base.recipe),
      accent:gift.theme_data?.accent||base.accent,
    };
  },[gift,base]);

  const resolvedCopy=useMemo(()=>{
    if(!previewExperience||!gift)return null;
    if(gift.template_version==="premium-v1")return getPremiumV1ExperienceCopy(previewExperience as never,gift.story_data?.script as never);
    if(gift.template_version==="premium-v2")return getPremiumV2ExperienceCopy(previewExperience as never,gift.story_data?.script as never);
    if(gift.template_version==="premium-v3")return getPremiumV3ExperienceCopy(previewExperience as never,gift.story_data?.script as never);
    if(gift.template_version==="premium-v4")return getPremiumV4ExperienceCopy(previewExperience as never,gift.story_data?.script as never);
    return getExperienceCopy(previewExperience,gift.story_data?.script);
  },[previewExperience,gift]);

  const photoMedia:ThiPhoto[]=media.filter(x=>x.kind==="image"&&x.url).map(x=>({
    url:x.url!,
    caption:x.caption||undefined,
    fit:x.metadata?.fit||"cover",
    position:x.metadata?.position||"center",
    scene:x.metadata?.scene,
  }));
  const soundtrackItem=media.find(x=>x.kind==="audio"&&x.url&&x.metadata?.role==="soundtrack");
  const soundtrackMedia:ThiAudio|undefined=soundtrackItem?{url:soundtrackItem.url!,caption:soundtrackItem.caption||undefined}:undefined;
  const audioMedia:ThiAudio[]=media.filter(x=>x.kind==="audio"&&x.url&&x.metadata?.role!=="soundtrack").map(x=>({url:x.url!,caption:x.caption||undefined,scene:x.metadata?.scene}));
  const videoMedia:ThiVideo[]=media.filter(x=>x.kind==="video"&&x.url).map(x=>({url:x.url!,caption:x.caption||undefined,scene:x.metadata?.scene}));

  function patchGift<K extends keyof Gift>(key:K,value:Gift[K]){
    setGift(current=>current?{...current,[key]:value}:current);
  }

  async function save(){
    if(!gift||!previewExperience||!resolvedCopy) return;
    setSaving(true);setMessage("");
    try{
      await adminCall("updateGift",{
        code,
        giverName:gift.giver_name,
        recipientName:gift.recipient_name,
        occasion:gift.occasion||"",
        feeling:gift.feeling||"",
        openingText:resolvedCopy.intro.lead,
        letterText:resolvedCopy.letter.body,
        closingText:gift.scene_recipe.includes("proposal")?resolvedCopy.proposal.title:resolvedCopy.finale.title,
        musicUrl:gift.music_url||"",
        relationship:gift.story_data?.relationship||"",
        keyDate:gift.story_data?.keyDate||"",
        anecdote:gift.story_data?.anecdote||"",
        script:gift.story_data?.script||{},
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
        const kind=file.type.startsWith("image/")?"image":file.type.startsWith("audio/")||/\.(opus|ogg|oga|webm|weba|mp3|m4a|wav|aac)$/i.test(file.name)?"audio":file.type.startsWith("video/")?"video":null;
        if(!kind) throw new Error("unsupported");
        const uploadFile=kind==="audio"?await prepareCompatibleAudio(file):file;
        const prep=await adminCall<{path:string;token:string}>("prepareUpload",{code,fileName:uploadFile.name,mimeType:uploadFile.type,size:uploadFile.size});
        await uploadSignedFile(prep.path,prep.token,uploadFile);
        await adminCall("registerMedia",{code,storagePath:prep.path,kind,originalName:file.name,mimeType:uploadFile.type,size:uploadFile.size});
      }catch(error){
        console.error(error);
        alert(error instanceof AudioUploadError?error.message:`No se pudo subir ${file.name}`);
      }finally{
        setUploading(v=>v.filter(x=>x!==file.name));
      }
    }
    if(inputRef.current) inputRef.current.value="";
    await load();
  }

  async function updateMedia(item:Media,patch:Partial<Media> & {fit?:"cover"|"contain";position?:"center"|"top"|"bottom"|"left"|"right";scene?:SceneType;role?:"voice"|"soundtrack"}){
    if(!gift) return;
    const sceneResolver=gift.template_version==="premium-v1"
      ?defaultPremiumV1SceneForMedia
      :gift.template_version==="premium-v2"
        ?defaultPremiumV2SceneForMedia
        :defaultSceneForMedia;
    // The chosen resolver is always tied to the gift template version. Frozen recipes cannot contain live-only scenes.
    const fallbackScene=sceneResolver(item.kind,gift.scene_recipe as never);
    const metadata={
      ...(item.metadata||{}),
      fit:patch.fit??item.metadata?.fit??"cover",
      position:patch.position??item.metadata?.position??"center",
      scene:patch.scene??item.metadata?.scene??fallbackScene,
      ...(item.kind==="audio"?{role:patch.role??item.metadata?.role??"voice"}:{}),
    };
    setMedia(current=>current.map(x=>x.id===item.id?{...x,caption:patch.caption??x.caption,metadata}:x));
    await adminCall("updateMedia",{code,mediaId:item.id,caption:patch.caption??item.caption??"",fit:metadata.fit,position:metadata.position,scene:metadata.scene,role:metadata.role});
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

  async function createAutomaticCheckout(){
    if(!gift)return;
    const normalizedAmount=paymentAmount.trim()===""?null:Math.round(Number(paymentAmount.replace(",","."))*100);
    if(normalizedAmount===null||!Number.isFinite(normalizedAmount)||normalizedAmount<=0){
      setMessage("Ingresá primero el monto acordado.");
      return;
    }

    setCheckoutCreating(true);
    setMessage("");
    try{
      const prepared=await adminCall<{paymentToken:string;amountMinor:number;currency:string}>("prepareAutomaticCheckout",{
        code,
        amountMinor:normalizedAmount,
      });

      const response=await fetch("https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"create",token:prepared.paymentToken}),
      });
      const data=await response.json().catch(()=>({})) as {checkoutUrl?:string;error?:string};
      if(!response.ok||!data.checkoutUrl){
        throw new Error(data.error||"checkout_create_failed");
      }

      setPaymentUrl(data.checkoutUrl);
      setMessage("Link de Mercado Pago generado y conectado ✓");
      await load();
    }catch(error){
      const reason=error instanceof Error?error.message:"checkout_create_failed";
      setMessage(reason==="mercadopago_not_configured"
        ?"Mercado Pago automático todavía no está configurado. Podés usar un link manual."
        :"No pude generar el link automático. El link manual sigue disponible.");
    }finally{
      setCheckoutCreating(false);
      setTimeout(()=>setMessage(""),3500);
    }
  }

  async function setPayment(status:Order["status"]){
    if(!gift) return;
    setPaymentSaving(true);
    setMessage("");
    try{
      const normalizedAmount=paymentAmount.trim()===""?null:Math.round(Number(paymentAmount.replace(",","."))*100);
      if(normalizedAmount!==null&&(!Number.isFinite(normalizedAmount)||normalizedAmount<0)){
        setMessage("Revisá el monto.");
        return;
      }
      await adminCall("setPaymentStatus",{
        code,
        status,
        amountMinor:normalizedAmount,
        providerReference:paymentReference.trim(),
        checkoutUrl:paymentUrl.trim(),
      });
      setMessage(status==="approved"?"Pago marcado como aprobado ✓":"Estado de pago actualizado ✓");
      await load();
    }catch{
      setMessage("No se pudo actualizar el pago.");
    }finally{
      setPaymentSaving(false);
      setTimeout(()=>setMessage(""),2200);
    }
  }

  async function togglePublish(){
    if(!gift) return;
    const action=gift.status==="published"?"unpublish":"publish";
    setMessage("");
    try{
      await adminCall(action,{code});
      await load();
    }catch(error){
      setMessage(error instanceof Error&&error.message==="payment_required"
        ?"Este pedido todavía no tiene el pago aprobado."
        :"No se pudo cambiar la publicación.");
    }
  }

  function deliveryMessage(){
    if(!gift) return "";
    return [
      `Ya está lista la experiencia para ${gift.recipient_name} ✨`,
      "",
      "Antes de enviársela, abrila vos una vez para revisarla:",
      `https://tehiceesto.com/r/${gift.public_code}`,
      "",
      "Cuando quieras, ese mismo link es el que podés compartir.",
      `Seguimiento del pedido: https://tehiceesto.com/pedido/${gift.public_code}`,
    ].join("\n");
  }

  async function copyDelivery(kind:"link"|"message"){
    if(!gift) return;
    const value=kind==="link"?`https://tehiceesto.com/r/${gift.public_code}`:deliveryMessage();
    try{
      await navigator.clipboard.writeText(value);
      setMessage(kind==="link"?"Link copiado ✓":"Mensaje de entrega copiado ✓");
    }catch{
      setMessage("No se pudo copiar automáticamente.");
    }finally{
      setTimeout(()=>setMessage(""),2200);
    }
  }

  if(loading||!gift||!base||!previewExperience||!resolvedCopy) return <main className="thi-admin-shell"><div className="thi-admin-loading">Cargando regalo…</div></main>;

  if(preview&&previewExperience){
    return <div className="thi-admin-preview-overlay">
      <div className="thi-admin-preview-toolbar">
        <button onClick={()=>setPreview(false)}>← Volver al editor</button>
        <span>PREVIEW PRIVADO · {gift.recipient_name}</span>
      </div>
      <PreviewEngine customerGift key={previewScene||"start"} experience={previewExperience} initialScene={previewScene||undefined} copyOverride={gift.story_data?.script} letterText={gift.letter_text||undefined} photoMedia={fillPrivateGiftPhotos(gift.experience_slug,previewExperience.recipe,photoMedia)} audioMedia={audioMedia} soundtrackMedia={soundtrackMedia} videoMedia={videoMedia} storyContext={{keyDate:gift.story_data?.keyDate,anecdote:gift.story_data?.anecdote}} sceneTextOverrides={normalizePreviewSceneText(gift.story_data?.sceneContent)}/>
      <AdminCopyEditor code={gift.public_code} initialOverrides={normalizePreviewSceneText(gift.story_data?.sceneContent)} onChange={sceneContent=>patchGift("story_data",{...(gift.story_data||{}),sceneContent})}/>
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
        <button className="thi-ghost" onClick={()=>{setPreviewScene(null);setPreview(true)}}>Ver preview</button>
        {gift.status==="published"&&<Link className="thi-ghost" href={`/tehiceesto/r/${gift.public_code}`} target="_blank">Abrir regalo ↗</Link>}
        <button
          className={gift.status==="published"?"thi-publish on":"thi-publish"}
          onClick={togglePublish}
          disabled={gift.status!=="published"&&Boolean(gift.story_data?.creator?.submitted)&&order?.status!=="approved"}
          title={gift.status!=="published"&&gift.story_data?.creator?.submitted&&order?.status!=="approved"?"Primero aprobá el pago":undefined}
        >
          {gift.status==="published"
            ?"✓ Publicado · despublicar"
            :gift.story_data?.creator?.submitted&&order?.status!=="approved"
              ?"Pago pendiente"
              :"Publicar regalo"}
        </button>
      </div>
    </header>

    <section className="thi-editor-overview">
      <article>
        <span className="thi-editor-overview-icon" style={{"--editor-accent":base.accent} as React.CSSProperties}>{base.icon}</span>
        <div><small>Experiencia</small><strong>{base.title}</strong></div>
      </article>
      <article><small>Escenas</small><strong>{gift.scene_recipe.length}</strong><span>en el recorrido</span></article>
      <article><small>Archivos</small><strong>{media.length}</strong><span>fotos, audio y video</span></article>
      <article><small>Estado</small><strong className={gift.status==="published"?"is-live":""}>{gift.status==="published"?"Publicado":gift.status==="paid"?"Pagado":gift.status==="awaiting_payment"?"Esperando pago":"Borrador"}</strong><span>{gift.status==="published"?"link activo":gift.status==="paid"?"listo para terminar":"todavía privado"}</span></article>
    </section>

    {gift.story_data?.creator?.submitted&&(
      <section className="thi-admin-panel thi-payment-panel" id="thi-pago">
        <div className="thi-admin-panel-heading">
          <div>
            <p className="thi-kicker">Pedido comercial</p>
            <h2>Pago</h2>
            <p>El precio no se publica hasta que vos lo definas. Acá registrás el cobro real y recién entonces habilitamos la entrega.</p>
          </div>
          <span className={`thi-payment-badge ${order?.status||"pending"}`}>
            {order?.status==="approved"?"Pagado":order?.status==="pending"||!order?"Pendiente":order.status}
          </span>
        </div>
        {creatorContact&&(
          <div className={order?.status==="approved"?"thi-order-contact-card paid":"thi-order-contact-card"}>
            <div>
              <span>{order?.status==="approved"?"CLIENTE PAGADO · CONTACTAR":"DATOS DEL CLIENTE"}</span>
              <strong>{creatorContact.name||gift.giver_name}</strong>
              <small>{creatorContact.whatsapp||"Sin WhatsApp"} · {creatorContact.email||"Sin email"}</small>
            </div>
            <div className="thi-order-contact-actions">
              {creatorWhatsApp&&(
                <a
                  className="thi-primary"
                  href={`https://wa.me/${creatorWhatsApp}?text=${encodeURIComponent(creatorMessage)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Abrir WhatsApp ↗
                </a>
              )}
              {creatorContact.email&&(
                <a className="thi-ghost" href={`mailto:${creatorContact.email}`}>Enviar email</a>
              )}
            </div>
          </div>
        )}
        <div className="thi-payment-grid">
          <label>
            <span>Monto acordado · ARS</span>
            <input inputMode="decimal" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} placeholder="Ej. 25000"/>
          </label>
          <label>
            <span>Referencia de Mercado Pago · opcional</span>
            <input value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="ID o referencia del cobro"/>
          </label>
          <label className="wide">
            <span>Link de pago · opcional</span>
            <input value={paymentUrl} onChange={e=>setPaymentUrl(e.target.value)} placeholder="https://mpago.la/..."/>
          </label>
        </div>
        <div className="thi-payment-actions">
          {order?.status!=="approved"&&mpAutomaticReady!==false&&(
            <button className="thi-payment-auto" disabled={checkoutCreating||paymentSaving||mpAutomaticReady===null} onClick={createAutomaticCheckout}>
              {mpAutomaticReady===null
                ?"Verificando Mercado Pago…"
                :checkoutCreating
                  ?"Creando cobro…"
                  :order?.checkout_url
                    ?"Regenerar link automático"
                    :"Generar link automático"}
            </button>
          )}
          <button className="thi-payment-approve" disabled={paymentSaving||checkoutCreating} onClick={()=>setPayment("approved")}>
            {paymentSaving?"Guardando…":"✓ Marcar pago aprobado manualmente"}
          </button>
          {order?.status==="approved"
            ?<button className="thi-ghost" disabled={paymentSaving||checkoutCreating} onClick={()=>setPayment("pending")}>Volver a pendiente</button>
            :<button className="thi-ghost" disabled={paymentSaving||checkoutCreating} onClick={()=>setPayment("cancelled")}>Cancelar pedido</button>}
        </div>
        <div className={`thi-payment-provider-health ${mpAutomaticReady===true?"ready":mpAutomaticReady===false?"fallback":"checking"}`}>
          <i/>
          <span>{mpAutomaticReady===true
            ?"Mercado Pago automático conectado"
            :mpAutomaticReady===false
              ?"Modo manual disponible"
              :"Verificando conexión con Mercado Pago"}</span>
        </div>
        <small className="thi-payment-note">{mpAutomaticReady===false
          ?"La automatización no respondió. Podés pegar un link de pago manual y marcar la acreditación desde acá sin frenar el pedido."
          :"Con “Generar link automático”, Mercado Pago crea el cobro y el pedido pasa a Pagado solo cuando la plataforma confirma la acreditación. El botón manual queda como respaldo."}</small>
      </section>
    )}

    {gift.status==="published"&&(
      <section className="thi-admin-panel thi-delivery-panel" id="thi-entrega">
        <div className="thi-admin-panel-heading">
          <div>
            <p className="thi-kicker">Entrega</p>
            <h2>Listo para mandar</h2>
            <p>El regalo ya está online. Podés revisar el link, copiarlo o abrir WhatsApp con el mensaje de entrega preparado.</p>
          </div>
          <span className="thi-payment-badge approved">Link activo</span>
        </div>
        <div className="thi-delivery-link">
          <code>tehiceesto.com/r/{gift.public_code}</code>
          <button type="button" onClick={()=>copyDelivery("link")}>Copiar link</button>
        </div>
        <div className="thi-delivery-actions">
          <button className="thi-primary" type="button" onClick={()=>copyDelivery("message")}>Copiar mensaje de entrega</button>
          <a className="thi-ghost" href={`https://wa.me/?text=${encodeURIComponent(deliveryMessage())}`} target="_blank" rel="noreferrer noopener">Abrir WhatsApp ↗</a>
          <Link className="thi-ghost" href={`/tehiceesto/r/${gift.public_code}`} target="_blank">Revisar regalo ↗</Link>
        </div>
      </section>
    )}

    <nav className="thi-editor-nav">
      <a href="#thi-historia">Historia</a>
      <a href="#thi-guion">Guion</a>
      <a href="#thi-recorrido">Recorrido</a>
      <a href="#thi-archivos">Archivos</a>
      <button onClick={()=>{setPreviewScene(null);setPreview(true)}}>Preview ↗</button>
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
        <label><span>Canción de referencia</span><input value={gift.music_url||""} onChange={e=>patchGift("music_url",e.target.value)}/></label>
        <label className="wide"><span>Anécdota</span><textarea rows={4} value={gift.story_data?.anecdote||""} onChange={e=>patchGift("story_data",{...(gift.story_data||{}),anecdote:e.target.value})}/></label>
      </div>

      <div className="thi-copy-moved">
        <span>✦</span><div><strong>Entrada, carta, globos, luz, botones y final ahora se editan en el Guion.</strong><small>El panel sincroniza automáticamente los campos antiguos al guardar.</small></div>
      </div>

      <div className="thi-admin-script-section" id="thi-guion">
        <div className="thi-admin-panel-heading"><div><p className="thi-kicker">Guion emocional</p><h2>Cada palabra del regalo</h2><p>Editá escena por escena. Nada del texto visible queda bloqueado en el motor.</p></div></div>
        <ScriptEditor
          experience={previewExperience}
          recipe={gift.scene_recipe}
          value={gift.story_data?.script||{}}
          onChange={script=>patchGift("story_data",{...(gift.story_data||{}),script})}
          onPreviewScene={scene=>{setPreviewScene(scene);setPreview(true)}}
        />
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
        <div><p className="thi-kicker">Archivos</p><h2>Fotos, audios y videos</h2><p>Cada archivo pertenece a una escena concreta. Ahí aparece —y no antes— durante el recorrido.</p></div>
        <button className="thi-primary" onClick={()=>inputRef.current?.click()}>+ Subir archivos</button>
        <input ref={inputRef} hidden type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,audio/*,.opus,.ogg,.oga,.m4a,.mp3,.wav,.webm,.weba,.aac,video/mp4,video/webm,video/quicktime" onChange={e=>uploadFiles(e.target.files)}/>
      </div>

      {uploading.length>0&&<div className="thi-uploading">{uploading.map(name=><span key={name}>Subiendo {name}…</span>)}</div>}

      {media.length>0&&<div className="thi-media-scene-map">
        {Array.from(new Set(gift.scene_recipe)).map((scene,index)=>{
          const count=media.filter(item=>(item.metadata?.scene||defaultSceneForMedia(item.kind,gift.scene_recipe))===scene).length;
          return <button key={scene} type="button" className={count?"has-media":""} onClick={()=>{setPreviewScene(scene);setPreview(true)}}>
            <span>{String(index+1).padStart(2,"0")}</span><strong>{scenes.find(item=>item.type===scene)?.label||scene}</strong><b>{count}</b>
          </button>;
        })}
      </div>}
      {media.length===0?<div className="thi-admin-empty"><strong>Todavía no hay archivos.</strong><p>Subí el material y después elegí exactamente en qué escena aparece cada archivo.</p></div>:
      <div className="thi-media-grid">{media.map((item,index)=>{
        const fit=item.metadata?.fit||"cover"; const position=item.metadata?.position||"center";
        const assignedScene=item.metadata?.scene||defaultSceneForMedia(item.kind,gift.scene_recipe);
        return <article className="thi-media-card" key={item.id}>
          <div className="thi-media-preview">
            {item.kind==="image"&&item.url&&<img src={item.url} alt={item.caption||item.metadata?.originalName||"Foto"} style={{objectFit:fit,objectPosition:position}}/>}
            {item.kind==="video"&&item.url&&<video src={item.url} controls preload="metadata"/>}
            {item.kind==="audio"&&item.url&&<div className="thi-media-audio"><span>♪</span><audio src={item.url} controls preload="metadata"/></div>}
            <b>{String(index+1).padStart(2,"0")}</b><em>{item.kind==="audio"&&item.metadata?.role==="soundtrack"?"música":item.kind}</em>
          </div>
          <div className="thi-media-body">
            <div className="thi-media-name"><strong>{item.metadata?.originalName||"Archivo"}</strong><small>{humanSize(item.metadata?.size)}</small></div>
            {item.kind==="audio"&&<label className="thi-media-scene-select"><span>Uso del audio</span><select value={item.metadata?.role==="soundtrack"?"soundtrack":"voice"} onChange={e=>updateMedia(item,{role:e.target.value as "voice"|"soundtrack"})}><option value="voice">Mensaje de voz</option><option value="soundtrack">Música de fondo</option></select></label>}
            {!(item.kind==="audio"&&item.metadata?.role==="soundtrack")&&<label className="thi-media-scene-select"><span>Aparece en</span><select value={assignedScene} onChange={e=>updateMedia(item,{scene:e.target.value as SceneType})}>{Array.from(new Set(gift.scene_recipe)).map(scene=><option key={scene} value={scene}>{scenes.find(x=>x.type===scene)?.label||scene}</option>)}</select></label>}
            <label><span>{item.kind==="audio"&&item.metadata?.role==="soundtrack"?"Nombre de la música":"Texto / pie"}</span><input defaultValue={item.caption||""} onBlur={e=>updateMedia(item,{caption:e.target.value})}/></label>
            {item.kind==="image"&&<div className="thi-media-controls">
              <label><span>Encuadre</span><select value={fit} onChange={e=>updateMedia(item,{fit:e.target.value as "cover"|"contain"})}><option value="cover">Llenar marco</option><option value="contain">Mostrar completa</option></select></label>
              <label><span>Foco</span><select value={position} onChange={e=>updateMedia(item,{position:e.target.value as "center"|"top"|"bottom"|"left"|"right"})}><option value="center">Centro</option><option value="top">Arriba</option><option value="bottom">Abajo</option><option value="left">Izquierda</option><option value="right">Derecha</option></select></label>
            </div>}
            <div className="thi-media-actions"><button disabled={!index} onClick={()=>moveMedia(index,-1)}>↑</button><button disabled={index===media.length-1} onClick={()=>moveMedia(index,1)}>↓</button><button onClick={()=>{setPreviewScene(assignedScene);setPreview(true)}}>Ver escena ↗</button><button className="danger" onClick={()=>deleteMedia(item)}>Eliminar</button></div>
          </div>
        </article>
      })}</div>}
    </section>
  </main>;
}
