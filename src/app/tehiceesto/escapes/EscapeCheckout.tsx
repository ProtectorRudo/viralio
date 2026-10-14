"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import type {EscapeRoom} from "../escape-rooms";
import {formatTeHiceEstoPrice} from "../pricing";
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "../creatorApi";
import styles from "./escape.module.css";

type CheckoutResponse={code?:string;checkoutUrl?:string|null;editorToken?:string;error?:string};
function getCookie(name:string){
 if(typeof document==="undefined")return "";
 const prefix=name+"=";
 const val=document.cookie.split("; ").find(x=>x.startsWith(prefix));
 return val?decodeURIComponent(val.slice(prefix.length)):"";
}
export default function EscapeCheckout({room}:{room:EscapeRoom}){
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[phone,setPhone]=useState("");
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [code,setCode]=useState("");
 const [requestId,setRequestId]=useState("");
 async function purchase(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  setError("");setBusy(true);
  try{
   const normalizedPhone=phone.replace(/[^0-9+]/g,"").slice(0,16);
   if(name.trim().length<2||!/^\+?[0-9]{8,15}$/.test(normalizedPhone)||!consent)throw new Error("Revisá los datos y aceptá las condiciones.");
   const id=requestId||crypto.randomUUID();setRequestId(id);
   const response=await fetch(SUPABASE_URL+"/functions/v1/order-create",{
    method:"POST",headers:{"content-type":"application/json",apikey:SUPABASE_PUBLISHABLE_KEY},
    body:JSON.stringify({
     experienceSlug:"escape-"+room.slug,
     customerName:name.trim(),email:email.trim().toLowerCase(),whatsapp:normalizedPhone,
     consent,website:"",affiliateToken:getCookie("thi_affiliate_token"),clientRequestId:id
    }),cache:"no-store"
   });
   const result=(await response.json().catch(()=>({}))) as CheckoutResponse;
   if(!response.ok||!result.code)throw new Error(result.error||"No se pudo registrar el pedido.");
   setCode(result.code);
   if(result.editorToken)localStorage.setItem("thi_editor_access:"+result.code,result.editorToken);
   if(result.checkoutUrl){window.location.assign(result.checkoutUrl);return;}
   setError("Tu pedido quedó registrado, pero el cobro aún no está disponible. Podés reintentar sin duplicarlo.");
  }catch(e){setError(e instanceof Error?e.message:"No pudimos preparar el pago.");}
  finally{setBusy(false);}
 }
 return <main className={styles.checkout}>
  <nav className={styles.purchaseNav}><Link href={"/escapes/"+room.slug}>← Volver a la experiencia</Link><span>TE HICE ESTO · PAGO SEGURO</span></nav>
  <div className={styles.purchaseGrid}>
   <section>
    <span className={styles.eyebrow}>UNA AVENTURA PARA ALGUIEN ESPECIAL</span>
    <h1>El misterio es suyo.<em>La sorpresa, tuya.</em></h1>
    <p>Elegís la sala, completás tus datos y pagás con Mercado Pago. Nuestro equipo se contacta para personalizar la invitación o carta final. La persona que recibe el regalo sólo tiene que jugar.</p>
    <article className={styles.purchaseProduct}><span>{room.eyebrow}</span><h2>{room.title}</h2><p>{room.subtitle}</p>
     <strong>{formatTeHiceEstoPrice()}</strong><small>Pago único · experiencia digital personalizada</small></article>
   </section>
   <form className={styles.purchaseForm} onSubmit={purchase}>
    <h2>Datos para preparar tu regalo</h2>
    <label>Tu nombre<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={100} autoComplete="name" required placeholder="Nombre y apellido"/></label>
    <label>WhatsApp<input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" minLength={8} maxLength={16} autoComplete="tel" required placeholder="Ej. 5492215653163"/></label>
    <label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={180} autoComplete="email" required placeholder="tu@email.com"/></label>
    <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/>Acepto que mis datos se utilicen para gestionar el pago, la personalización y la entrega de mi regalo.</label>
    {error&&<p className={styles.error} role="alert">{error}</p>}
    <button disabled={busy} type="submit">{busy?"Preparando pago…":"Comprar con Mercado Pago →"}</button>
    {code&&<Link href={"/pedido/"+code} className={styles.tracking}>Consultar mi pedido ↗</Link>}
    <small>El cobro se realiza exclusivamente en Mercado Pago. No se solicitan datos de tarjeta en esta página.</small>
   </form>
  </div>
 </main>;
}
