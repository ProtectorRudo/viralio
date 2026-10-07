"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { getExperience } from "../data";
import { creatorCall } from "../creatorApi";

type GiftRow={
  code:string;
  status:string;
  experienceSlug:string;
  recipientName:string;
  publishedAt:string|null;
};

type OpenPayload={
  gift:{
    public_code:string;
    status:string;
    experience_slug:string;
    recipient_name:string;
    published_at:string|null;
  };
};

function publicEditorPath(code:string){
  if(typeof window!=="undefined"&&window.location.hostname.endsWith("tehiceesto.com"))return `/editar/${code}`;
  return `/tehiceesto/editar/${code}`;
}

function publicGiftPath(code:string){
  if(typeof window!=="undefined"&&window.location.hostname.endsWith("tehiceesto.com"))return `/r/${code}`;
  return `/tehiceesto/r/${code}`;
}

function editorAccessKey(code:string){return `thi_editor_access:${code}`}

export default function MyGifts(){
  const [gifts,setGifts]=useState<GiftRow[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let active=true;
    const run=async()=>{
      const entries=Object.keys(window.localStorage)
        .filter(key=>key.startsWith("thi_editor_access:"))
        .map(key=>({
          code:key.slice("thi_editor_access:".length),
          token:window.localStorage.getItem(key)||"",
        }))
        .filter(item=>/^[a-f0-9]{18}$/.test(item.code)&&item.token);

      const rows:GiftRow[]=[];
      for(const entry of entries){
        try{
          const data=await creatorCall<OpenPayload>("openStudio",{code:entry.code,editorToken:entry.token});
          rows.push({
            code:entry.code,
            status:data.gift.status,
            experienceSlug:data.gift.experience_slug,
            recipientName:data.gift.recipient_name,
            publishedAt:data.gift.published_at,
          });
        }catch{
          window.localStorage.removeItem(editorAccessKey(entry.code));
        }
      }

      if(!active)return;
      if(rows.length===1){
        window.location.assign(publicEditorPath(rows[0].code));
        return;
      }
      setGifts(rows);
      setLoading(false);
    };
    void run();
    return()=>{active=false};
  },[]);

  if(loading)return <main className="studio-gate"><div className="studio-loader"><span/><strong>Buscando tus regalos…</strong></div></main>;

  return <main className="account-shell">
    <header className="account-topbar">
      <Link href="/tehiceesto" className="studio-brand">TE HICE ESTO</Link>
      <Link href="/tehiceesto/crear">Crear otro</Link>
    </header>

    <section className="account-hero">
      <p className="studio-eyebrow">MIS REGALOS</p>
      <h1>{gifts.length>1?"Acá están tus regalos.":"Tus regalos, en un solo lugar."}</h1>
      <p>{gifts.length>1
        ?"Elegí cuál querés editar, ver o volver a compartir."
        :"En este dispositivo todavía no encontramos más de un regalo guardado."}</p>
    </section>

    {gifts.length>1?(
      <section className="account-gift-list">
        {gifts.map(gift=>{
          const experience=getExperience(gift.experienceSlug);
          const title=experience?.title||"Experiencia";
          const recipient=gift.recipientName&&gift.recipientName!=="A definir"?gift.recipientName:"Todavía sin destinatario";
          return <article className="account-gift-card" key={gift.code}>
            <div className="account-gift-mark"><span>♥</span></div>
            <div className="account-gift-copy">
              <small>{title.toUpperCase()}</small>
              <h2>Para {recipient}</h2>
              <p>{gift.status==="published"?"Publicado y listo para compartir":"En edición"}</p>
            </div>
            <div className="account-gift-actions">
              <a className="studio-main-button compact" href={publicEditorPath(gift.code)}>Editar <b>→</b></a>
              {gift.publishedAt&&<a className="studio-secondary-button" href={publicGiftPath(gift.code)}>Ver regalo</a>}
            </div>
          </article>;
        })}
      </section>
    ):(
      <section className="account-empty">
        <span>✦</span>
        <h2>¿Cambiaste de celular o borraste los datos del navegador?</h2>
        <p>No te pedimos teléfono ni contraseña. Abrí el enlace de edición de cualquiera de tus pedidos y recuperalo usando solamente el email con el que compraste.</p>
        <Link className="studio-main-button" href="/tehiceesto">Volver a Te Hice Esto <b>→</b></Link>
      </section>
    )}

    <section className="account-new-gift">
      <span>¿Querés hacer otro?</span>
      <Link href="/tehiceesto/crear">Crear un nuevo regalo →</Link>
    </section>
  </main>;
}
