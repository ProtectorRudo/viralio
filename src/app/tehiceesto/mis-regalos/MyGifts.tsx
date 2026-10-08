"use client";

import { FormEvent,useEffect,useState } from "react";
import Link from "next/link";
import { getExperience } from "../data";
import { creatorCall } from "../creatorApi";
import { ACCOUNT_TOKEN_KEY,giftAccountCall,requestGiftAccountLink } from "../giftAccountApi";

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

type AccountGift={
  code:string;
  status:string;
  experienceSlug:string;
  giverName:string;
  recipientName:string;
  publishedAt:string|null;
  purchasedAt:string;
};

type AccountListPayload={
  email:string;
  gifts:AccountGift[];
};

type AccountOpenPayload={
  ok:boolean;
  editorToken:string;
  code:string;
};

function publicEditorPath(code:string){
  if(typeof window!=="undefined"&&window.location.hostname.endsWith("tehiceesto.com"))return `/editar/${code}`;
  return `/tehiceesto/editar/${code}`;
}

function publicGiftPath(code:string){
  if(typeof window!=="undefined"&&window.location.hostname.endsWith("tehiceesto.com"))return `/r/${code}`;
  return `/tehiceesto/r/${code}`;
}

function publicHomePath(path=""){
  if(typeof window!=="undefined"&&window.location.hostname.endsWith("tehiceesto.com"))return path||"/";
  return `/tehiceesto${path}`;
}

function editorAccessKey(code:string){return `thi_editor_access:${code}`}

function authTokenFromLocation(){
  if(typeof window==="undefined")return "";
  const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
  const query=new URLSearchParams(window.location.search);
  return hash.get("access_token")||query.get("access_token")||"";
}

function clearAuthResponseFromUrl(){
  if(typeof window==="undefined")return;
  const url=new URL(window.location.href);
  const keepGift=url.searchParams.get("regalo");
  url.hash="";
  url.search="";
  if(keepGift)url.searchParams.set("regalo",keepGift);
  window.history.replaceState({},document.title,url.pathname+url.search);
}

export default function MyGifts(){
  const [gifts,setGifts]=useState<GiftRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [accountEmail,setAccountEmail]=useState("");
  const [recoveryEmail,setRecoveryEmail]=useState("");
  const [recoveryState,setRecoveryState]=useState<"idle"|"sending"|"sent"|"error">("idle");
  const [recoveryMessage,setRecoveryMessage]=useState("");

  useEffect(()=>{
    let active=true;

    const run=async()=>{
      const merged=new Map<string,GiftRow>();
      const requestedCode=new URLSearchParams(window.location.search).get("regalo")?.trim().toLowerCase()||"";

      const callbackToken=authTokenFromLocation();
      if(callbackToken){
        window.localStorage.setItem(ACCOUNT_TOKEN_KEY,callbackToken);
        clearAuthResponseFromUrl();
      }

      let accountToken=callbackToken||window.localStorage.getItem(ACCOUNT_TOKEN_KEY)||"";
      if(accountToken){
        try{
          const account=await giftAccountCall<AccountListPayload>("list",{},accountToken);
          if(!active)return;
          setAccountEmail(account.email||"");

          for(const gift of account.gifts||[]){
            if(!/^[a-f0-9]{18}$/.test(gift.code))continue;
            const localEditorToken=window.localStorage.getItem(editorAccessKey(gift.code))||"";
            if(!localEditorToken){
              try{
                const opened=await giftAccountCall<AccountOpenPayload>("open",{code:gift.code},accountToken);
                if(opened.editorToken){
                  window.localStorage.setItem(editorAccessKey(gift.code),opened.editorToken);
                }
              }catch{
                // The list still renders even if editor access cannot be refreshed.
              }
            }
            merged.set(gift.code,{
              code:gift.code,
              status:gift.status,
              experienceSlug:gift.experienceSlug,
              recipientName:gift.recipientName,
              publishedAt:gift.publishedAt,
            });
          }
        }catch(error){
          const reason=error instanceof Error?error.message:"";
          if(reason==="account_unauthorized"){
            window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
            accountToken="";
          }
        }
      }

      const entries=Object.keys(window.localStorage)
        .filter(key=>key.startsWith("thi_editor_access:"))
        .map(key=>({
          code:key.slice("thi_editor_access:".length),
          token:window.localStorage.getItem(key)||"",
        }))
        .filter(item=>/^[a-f0-9]{18}$/.test(item.code)&&item.token);

      for(const entry of entries){
        if(merged.has(entry.code))continue;
        try{
          const data=await creatorCall<OpenPayload>("openStudio",{code:entry.code,editorToken:entry.token});
          merged.set(entry.code,{
            code:entry.code,
            status:data.gift.status,
            experienceSlug:data.gift.experience_slug,
            recipientName:data.gift.recipient_name,
            publishedAt:data.gift.published_at,
          });
        }catch(error){
          const reason=error instanceof Error?error.message:"";
          if(reason==="studio_unauthorized"||reason==="studio_not_found"){
            window.localStorage.removeItem(editorAccessKey(entry.code));
          }
        }
      }

      if(!active)return;
      const rows=Array.from(merged.values());
      setGifts(rows);
      setLoading(false);

      if(
        requestedCode&&
        /^[a-f0-9]{18}$/.test(requestedCode)&&
        merged.has(requestedCode)&&
        window.localStorage.getItem(editorAccessKey(requestedCode))
      ){
        window.location.replace(publicEditorPath(requestedCode));
      }
    };

    void run();
    return()=>{active=false};
  },[]);

  async function requestAccess(event:FormEvent){
    event.preventDefault();
    const email=recoveryEmail.trim().toLowerCase();
    if(!email)return;
    setRecoveryState("sending");
    setRecoveryMessage("");
    try{
      await requestGiftAccountLink(email);
      setRecoveryState("sent");
    }catch(error){
      const reason=error instanceof Error?error.message:"";
      setRecoveryState("error");
      setRecoveryMessage(
        reason==="email_rate_limited"
          ?"Pediste varios accesos seguidos. Esperá unos minutos y volvé a intentar."
          :"No pudimos enviar el acceso ahora. Probá nuevamente en unos minutos."
      );
    }
  }

  if(loading)return <main className="studio-gate"><div className="studio-loader"><span/><strong>Buscando tus regalos…</strong></div></main>;

  return <main className="account-shell">
    <header className="account-topbar">
      <Link href={publicHomePath()} className="studio-brand">TE HICE ESTO</Link>
      <Link href={publicHomePath("/crear")}>Crear otro</Link>
    </header>

    <section className="account-hero">
      <p className="studio-eyebrow">MIS REGALOS</p>
      <h1>{gifts.length?"Acá están tus regalos.":"Recuperá tus regalos."}</h1>
      <p>{gifts.length
        ?"Podés editarlos, abrir los que ya publicaste y volver a compartirlos cuando quieras."
        :"Ingresá el email con el que compraste y te mandamos un acceso privado. No necesitás recordar ningún código."}</p>
      {accountEmail&&<small>Acceso verificado con {accountEmail}</small>}
    </section>

    {gifts.length>0&&(
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
    )}

    <section className={gifts.length?"account-recovery-card compact":"account-recovery-card"}>
      <div className="account-recovery-copy">
        <span>{gifts.length?"¿FALTA ALGUNO?":"RECUPERACIÓN PRIVADA"}</span>
        <h2>{gifts.length?"Traé también tus compras de otro dispositivo.":"Te mandamos un acceso a tu email."}</h2>
        <p>
          Usá el mismo email con el que pagaste. El mensaje no confirma públicamente si existe una compra y el acceso queda protegido.
        </p>
      </div>

      {recoveryState==="sent"?(
        <div className="account-email-sent">
          <span>✓</span>
          <div>
            <strong>Revisá tu email.</strong>
            <small>Si encontramos compras aprobadas con {recoveryEmail.trim().toLowerCase()}, vas a recibir un enlace para abrirlas acá.</small>
          </div>
        </div>
      ):(
        <form className="account-recovery-form" onSubmit={requestAccess}>
          <label>
            <span>Email de la compra</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={recoveryEmail}
              onChange={event=>setRecoveryEmail(event.target.value)}
              required
            />
          </label>
          <button className="studio-main-button" disabled={recoveryState==="sending"}>
            {recoveryState==="sending"?"Enviando…":"Recuperar mis regalos"} <b>→</b>
          </button>
          <small className="account-privacy-note">Por seguridad mostramos la misma respuesta exista o no una compra con ese email.</small>
        </form>
      )}

      {recoveryState==="error"&&<p className="account-alert">{recoveryMessage}</p>}
    </section>

    <section className="account-new-gift">
      <span>¿Querés hacer otro?</span>
      <Link href={publicHomePath("/crear")}>Crear un nuevo regalo →</Link>
    </section>
  </main>;
}
