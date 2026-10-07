"use client";

import { FormEvent,useEffect,useState } from "react";
import Link from "next/link";
import { getExperience } from "../data";
import { ACCOUNT_TOKEN_KEY,giftAccountCall,requestGiftAccountLink } from "../giftAccountApi";

type GiftRow={
  code:string;
  status:string;
  experienceSlug:string;
  giverName:string;
  recipientName:string;
  publishedAt:string|null;
  purchasedAt:string|null;
};

type GiftListPayload={email:string;gifts:GiftRow[]};

function publicEditorPath(code:string){
  if(typeof window!=="undefined"&&window.location.hostname.endsWith("tehiceesto.com"))return `/editar/${code}`;
  return `/tehiceesto/editar/${code}`;
}

function publicGiftPath(code:string){
  if(typeof window!=="undefined"&&window.location.hostname.endsWith("tehiceesto.com"))return `/r/${code}`;
  return `/tehiceesto/r/${code}`;
}

export default function MyGifts(){
  const [accessToken,setAccessToken]=useState("");
  const [email,setEmail]=useState("");
  const [gifts,setGifts]=useState<GiftRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);
  const [opening,setOpening]=useState("");
  const [message,setMessage]=useState("");

  async function openGift(code:string,token=accessToken){
    if(!token||opening)return;
    setOpening(code);setMessage("");
    try{
      const result=await giftAccountCall<{editorToken:string;code:string}>("open",{code},token);
      window.localStorage.setItem(`thi_editor_access:${code}`,result.editorToken);
      window.location.assign(publicEditorPath(code));
    }catch(error){
      const reason=error instanceof Error?error.message:"";
      if(reason==="account_unauthorized"){
        window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
        setAccessToken("");
        setGifts([]);
        setMessage("El acceso venció. Pedí un nuevo enlace a tu email.");
      }else{
        setMessage("No pudimos abrir ese regalo. Probá otra vez.");
      }
      setOpening("");
    }
  }

  useEffect(()=>{
    let active=true;
    const run=async()=>{
      const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
      const hashToken=hash.get("access_token")||"";
      if(hashToken){
        window.localStorage.setItem(ACCOUNT_TOKEN_KEY,hashToken);
        window.history.replaceState(null,"",window.location.pathname+window.location.search);
      }
      const token=hashToken||window.localStorage.getItem(ACCOUNT_TOKEN_KEY)||"";
      if(!active)return;
      setAccessToken(token);
      if(!token){setLoading(false);return}

      try{
        const data=await giftAccountCall<GiftListPayload>("list",{},token);
        if(!active)return;
        setEmail(data.email||"");
        setGifts(data.gifts||[]);

        const requested=new URLSearchParams(window.location.search).get("regalo")||"";
        const target=requested
          ?data.gifts.find(gift=>gift.code===requested)
          :data.gifts.length===1?data.gifts[0]:undefined;

        if(target){
          const result=await giftAccountCall<{editorToken:string;code:string}>("open",{code:target.code},token);
          if(!active)return;
          window.localStorage.setItem(`thi_editor_access:${target.code}`,result.editorToken);
          window.location.assign(publicEditorPath(target.code));
          return;
        }
      }catch{
        window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
        if(!active)return;
        setAccessToken("");
        setGifts([]);
        setMessage("El enlace venció. Pedí uno nuevo y te lo enviamos enseguida.");
      }finally{
        if(active)setLoading(false);
      }
    };
    void run();
    return()=>{active=false};
  },[]);

  async function requestLink(event:FormEvent){
    event.preventDefault();
    const clean=email.trim().toLowerCase();
    if(!clean)return;
    setSending(true);setMessage("");
    try{
      await requestGiftAccountLink(clean);
      setSent(true);
    }catch(error){
      const reason=error instanceof Error?error.message:"";
      setMessage(reason==="email_rate_limited"
        ?"Esperá un minuto antes de pedir otro enlace."
        :"No pudimos enviar el email ahora. Probá otra vez en unos minutos.");
    }finally{setSending(false)}
  }

  function signOut(){
    window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
    setAccessToken("");setGifts([]);setSent(false);setEmail("");setMessage("");
  }

  if(loading)return <main className="studio-gate"><div className="studio-loader"><span/><strong>Buscando tus regalos…</strong></div></main>;

  if(!accessToken)return <main className="studio-gate account-gate">
    <section className="studio-gate-card">
      <span className="studio-gate-mark">♥</span>
      <p className="studio-eyebrow">MIS REGALOS</p>
      {!sent?<>
        <h1>Entrá solamente con tu email.</h1>
        <p>Sin contraseña y sin teléfono. Te mandamos un enlace seguro para abrir todas tus compras.</p>
        <form className="studio-recovery" onSubmit={requestLink}>
          <label><span>Email de tus compras</span><input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="tu@email.com"/></label>
          <button className="studio-main-button" disabled={sending}>{sending?"Enviando…":"Enviarme acceso"} <b>→</b></button>
        </form>
        <small className="account-privacy-note">Por seguridad no mostramos compras hasta que abras el enlace que llega a ese email.</small>
      </>:<>
        <h1>Revisá tu email.</h1>
        <p>Te enviamos un enlace de acceso. Tocándolo volvés acá y abrimos tus regalos sin pedirte ningún otro dato.</p>
        <div className="account-email-sent"><span>✓</span><strong>{email}</strong></div>
        <button type="button" className="studio-text-link" onClick={()=>setSent(false)}>Usar otro email</button>
      </>}
      {message&&<p className="studio-alert">{message}</p>}
      <Link className="studio-text-link" href="/tehiceesto">Volver a Te Hice Esto</Link>
    </section>
  </main>;

  return <main className="account-shell">
    <header className="account-topbar">
      <Link href="/tehiceesto" className="studio-brand">TE HICE ESTO</Link>
      <button type="button" onClick={signOut}>Salir</button>
    </header>
    <section className="account-hero">
      <p className="studio-eyebrow">MIS REGALOS</p>
      <h1>{gifts.length>1?"Acá están tus regalos.":"Tu regalo está acá."}</h1>
      <p>{gifts.length>1?"Elegí cuál querés editar, ver o volver a compartir.":"Podés volver a editarlo cuando quieras."}</p>
      <small>{email}</small>
    </section>

    {gifts.length?(
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
              <button type="button" className="studio-main-button compact" disabled={Boolean(opening)} onClick={()=>void openGift(gift.code)}>{opening===gift.code?"Abriendo…":"Editar"} <b>→</b></button>
              {gift.publishedAt&&<a className="studio-secondary-button" href={publicGiftPath(gift.code)}>Ver regalo</a>}
            </div>
          </article>;
        })}
      </section>
    ):(
      <section className="account-empty">
        <span>✦</span><h2>No encontramos compras aprobadas con este email.</h2>
        <p>Si pagaste hace muy poquito, Mercado Pago puede tardar unos minutos en confirmarlo.</p>
      </section>
    )}

    {message&&<p className="studio-alert account-alert">{message}</p>}
    <section className="account-new-gift">
      <span>¿Querés hacer otro?</span>
      <Link href="/tehiceesto/crear">Crear un nuevo regalo →</Link>
    </section>
  </main>;
}
