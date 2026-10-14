"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "../creatorApi";
type Receipt={ok?:boolean;ticketCode?:string;receivedAt?:string;error?:string};
export default function WithdrawalForm(){
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[orderCode,setOrderCode]=useState(""),[message,setMessage]=useState("");
 const [website,setWebsite]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[receipt,setReceipt]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
   event.preventDefault();if(busy||receipt)return;
   setBusy(true);setError("");
   try{
     const response=await fetch(SUPABASE_URL+"/functions/v1/commerce-withdrawals",{
       method:"POST",headers:{"content-type":"application/json",apikey:SUPABASE_PUBLISHABLE_KEY},
       body:JSON.stringify({action:"submit",name,email,orderCode:orderCode.trim().toLowerCase(),message,website}),cache:"no-store"
     });
     const result=await response.json().catch(()=>({error:"request_failed"})) as Receipt;
     if(!response.ok||!result.ticketCode)throw new Error(result.error==="rate_limited"?"Ya recibimos varias solicitudes de este correo. Contactanos por WhatsApp para continuar.":"No pudimos registrar la solicitud. Probá nuevamente o escribinos por WhatsApp.");
     setReceipt(result.ticketCode);
   }catch(e){setError(e instanceof Error?e.message:"No pudimos registrar la solicitud.")}
   finally{setBusy(false)}
 }
 return <main className="thi-legal-page">
   <div className="thi-legal-shell">
     <nav className="thi-legal-nav"><Link href="/">← TE HICE ESTO</Link><span>ATENCIÓN AL CLIENTE</span></nav>
     <div className="thi-legal-grid">
       <section className="thi-legal-intro">
         <span className="thi-legal-eyebrow">COMPRAS ONLINE · GESTIÓN DE SOLICITUDES</span>
         <h1>Botón de <em>arrepentimiento.</em></h1>
         <p>Podés solicitar la revocación de una compra realizada en Te Hice Esto. No necesitás registrarte ni ingresar a una cuenta.</p>
         <div className="thi-legal-steps">
           <div><b>01</b><span>Completá el formulario con un medio de contacto.</span></div>
           <div><b>02</b><span>Recibí en pantalla el código de registro de tu solicitud.</span></div>
           <div><b>03</b><span>El equipo revisa la operación y se comunica con vos para gestionar lo que corresponda.</span></div>
         </div>
         <p className="thi-legal-aside">El envío registra tu pedido de arrepentimiento; no genera por sí mismo una devolución automática del dinero. Conservá el código para cualquier consulta.</p>
         <p className="thi-legal-aside">¿Necesitás hablar con una persona? <a href="https://wa.me/5492215653163?text=Hola%2C%20quiero%20consultar%20por%20el%20arrepentimiento%20de%20una%20compra%20en%20Te%20Hice%20Esto" target="_blank" rel="noopener noreferrer">Atención por WhatsApp ↗</a></p>
       </section>
       <section className="thi-legal-panel">
         {receipt?<div className="thi-legal-confirmation" role="status">
           <span className="thi-legal-eyebrow">SOLICITUD REGISTRADA</span>
           <h2>Recibimos tu solicitud.</h2>
           <p>Guardá este código de identificación:</p>
           <div className="thi-legal-ticket"><strong>{receipt}</strong><button type="button" onClick={()=>void navigator.clipboard.writeText(receipt)}>Copiar</button></div>
           <p>Nos comunicaremos a través del correo que indicaste para revisar la solicitud. Conservá este comprobante.</p>
           <Link className="thi-legal-back" href="/">Volver al inicio →</Link>
         </div>:<form onSubmit={submit}>
           <h2>Registrar mi solicitud</h2>
           <label>Nombre y apellido<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={100} autoComplete="name" required placeholder="Tu nombre completo"/></label>
           <label>Correo de contacto<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required maxLength={180} autoComplete="email" placeholder="tu@email.com"/></label>
           <label>Código de pedido <small>(opcional, si lo tenés)</small><input value={orderCode} onChange={e=>setOrderCode(e.target.value.replace(/[^a-fA-F0-9]/g,"").slice(0,18))} maxLength={18} placeholder="Código que figura en tu compra"/></label>
           <label>Detalles <small>(opcional)</small><textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={1000} rows={4} placeholder="Contanos qué compra querés identificar"/></label>
           <div className="thi-legal-trap" aria-hidden="true"><label>No completar<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
           {error&&<p role="alert" className="thi-legal-error">{error}</p>}
           <button className="thi-legal-submit" type="submit" disabled={busy}>{busy?"Registrando solicitud…":"Registrar solicitud de arrepentimiento →"}</button>
           <small className="thi-legal-footnote">Utilizaremos estos datos únicamente para identificar y gestionar tu solicitud. No hace falta informar motivos ni ingresar un número de tarjeta.</small>
         </form>}
       </section>
     </div>
   </div>
 </main>;
}
