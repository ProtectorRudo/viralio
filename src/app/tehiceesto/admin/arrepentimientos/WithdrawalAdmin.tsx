"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {SESSION_KEY,SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "../api";
type Ticket={id:string;ticket_code:string;name:string;email:string;order_code:string|null;message:string|null;status:string;admin_note:string|null;created_at:string};
async function call<T>(action:string,data:Record<string,unknown>={}):Promise<T>{
 const token=sessionStorage.getItem(SESSION_KEY)||"";
 const result=await fetch(SUPABASE_URL+"/functions/v1/commerce-withdrawals",{
  method:"POST",headers:{"content-type":"application/json",apikey:SUPABASE_PUBLISHABLE_KEY,"x-admin-session":token},
  body:JSON.stringify({action,...data}),cache:"no-store"
 });
 const payload=await result.json().catch(()=>({error:"request_failed"}));
 if(!result.ok)throw Error(payload.error||"No se pudo completar la operación");
 return payload as T;
}
export default function WithdrawalAdmin(){
 const [ready,setReady]=useState(false),[signedIn,setSignedIn]=useState(false),[tickets,setTickets]=useState<Ticket[]>([]);
 const [error,setError]=useState(""),[busy,setBusy]=useState<string|null>(null);
 async function refresh(){
   if(!sessionStorage.getItem(SESSION_KEY)){setReady(true);return}
   setSignedIn(true);
   try{const r=await call<{requests:Ticket[]}>("list");setTickets(r.requests||[]);setError("")}
   catch(e){setError(e instanceof Error?e.message:"No pudimos consultar los pedidos")}
   finally{setReady(true)}
 }
 useEffect(()=>{void refresh()},[]);
 async function save(id:string,status:string,note:string){
  setBusy(id);setError("");
  try{await call("update",{id,status,adminNote:note});setTickets(prev=>prev.map(item=>item.id===id?{...item,status,admin_note:note}:item))}
  catch(e){setError(e instanceof Error?e.message:"No pudimos guardar")}
  finally{setBusy(null)}
 }
 return <main className="thi-legal-page">
  <div className="thi-legal-shell">
   <nav className="thi-legal-nav"><Link href="/admin">← Panel de administración</Link><span>GESTIÓN DE SOLICITUDES</span></nav>
   <div className="thi-legal-admin-head"><div><span className="thi-legal-eyebrow">OPERACIÓN COMERCIAL</span><h1>Arrepentimientos.</h1><p>Solicitudes recibidas, pendientes de verificación o resolución.</p></div><button type="button" onClick={()=>void refresh()}>Actualizar ↻</button></div>
   {!ready&&<p>Consultando solicitudes…</p>}
   {ready&&!signedIn&&<p>Ingresá primero al <Link href="/admin">panel interno</Link>.</p>}
   {error&&<p role="alert" className="thi-legal-error">{error}</p>}
   {ready&&signedIn&&tickets.length===0&&<p>No hay solicitudes registradas.</p>}
   {ready&&signedIn&&<div className="thi-legal-admin-list">
    {tickets.map(ticket=><TicketCard key={ticket.id} ticket={ticket} busy={busy===ticket.id} onSave={save}/>)}
   </div>}
  </div>
 </main>;
}
function TicketCard({ticket,busy,onSave}:{ticket:Ticket;busy:boolean;onSave:(id:string,status:string,note:string)=>Promise<void>}){
 const [status,setStatus]=useState(ticket.status),[note,setNote]=useState(ticket.admin_note||"");
 return <article className="thi-legal-admin-ticket">
   <div className="thi-legal-ticket-top"><strong>{ticket.ticket_code}</strong><span>{new Date(ticket.created_at).toLocaleString("es-AR")}</span></div>
   <h2>{ticket.name}</h2>
   <p><a href={"mailto:"+ticket.email}>{ticket.email}</a>{ticket.order_code&&<> · Pedido <code>{ticket.order_code}</code></>}</p>
   {ticket.message&&<blockquote>{ticket.message}</blockquote>}
   <div className="thi-legal-admin-controls">
    <label>Estado<select value={status} onChange={e=>setStatus(e.target.value)}><option value="received">Recibido</option><option value="reviewing">En revisión</option><option value="resolved">Resuelto</option><option value="rejected">No corresponde</option></select></label>
    <label>Nota interna<textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} maxLength={1200}/></label>
    <button disabled={busy} type="button" onClick={()=>void onSave(ticket.id,status,note)}>{busy?"Guardando…":"Guardar gestión"}</button>
   </div>
 </article>;
}
