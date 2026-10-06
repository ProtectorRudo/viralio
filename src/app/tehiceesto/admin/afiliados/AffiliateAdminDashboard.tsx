"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SESSION_KEY } from "../api";
import { affiliateAdminCall } from "../affiliateApi";

type AffiliateRow={
  id:string;slug:string;name:string;email:string;whatsapp:string|null;status:string;
  commissionBps:number;createdAt:string;lastLoginAt:string|null;primaryLinkCode:string|null;linkUrl:string|null;
  clicks:number;uniqueVisitors:number;clicks30d:number;visitors30d:number;orders:number;sales:number;
  revenueMinor:number;orders30d:number;sales30d:number;revenue30dMinor:number;
  commissionEarnedMinor:number;commissionPendingMinor:number;commissionPaidMinor:number;
};
type Overview={
  affiliates:AffiliateRow[];
  totals:{clicks:number;uniqueVisitors:number;orders:number;sales:number;revenueMinor:number;commissionPendingMinor:number;commissionPaidMinor:number;activeAffiliates:number;totalAffiliates:number;currency:string};
  updatedAt:string;
};
type Credentials={
  name:string;
  linkUrl:string;
  dashboardUrl:string;
  temporaryPassword:string;
  email?:string;
};

function money(minor:number){
  return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format((minor||0)/100);
}
function conversion(row:AffiliateRow){
  return row.uniqueVisitors?row.sales/row.uniqueVisitors:0;
}

export default function AffiliateAdminDashboard(){
  const [ready,setReady]=useState(false);
  const [hasSession,setHasSession]=useState(false);
  const [overview,setOverview]=useState<Overview|null>(null);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [showNew,setShowNew]=useState(false);
  const [credentials,setCredentials]=useState<Credentials|null>(null);
  const [commissionEdits,setCommissionEdits]=useState<Record<string,string>>({});
  const [copied,setCopied]=useState("");

  async function load(silent=false){
    if(!silent)setLoading(true);
    try{
      const data=await affiliateAdminCall<Overview>("overview");
      setOverview(data);
      setCommissionEdits(current=>{
        const next={...current};
        for(const row of data.affiliates)if(next[row.id]===undefined)next[row.id]=String(row.commissionBps/100);
        return next;
      });
    }catch(error){
      setMessage(error instanceof Error&&error.message==="admin_session_required"?"Tu sesión venció. Volvé al panel principal.":"No pude cargar afiliados.");
    }finally{
      if(!silent)setLoading(false);
    }
  }

  useEffect(()=>{
    const active=Boolean(window.sessionStorage.getItem(SESSION_KEY));
    setHasSession(active);
    setReady(true);
    if(active)void load();
    const expired=()=>setHasSession(false);
    window.addEventListener("thi-admin-session-expired",expired);
    const id=window.setInterval(()=>{if(window.sessionStorage.getItem(SESSION_KEY))void load(true)},10000);
    return()=>{
      window.clearInterval(id);
      window.removeEventListener("thi-admin-session-expired",expired);
    };
  },[]);

  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setMessage("");
    const form=new FormData(event.currentTarget);
    try{
      const result=await affiliateAdminCall<{
        affiliate:{name:string;email:string;linkUrl:string};
        temporaryPassword:string;dashboardUrl:string;
      }>("createAffiliate",{
        name:String(form.get("name")||""),
        email:String(form.get("email")||""),
        whatsapp:String(form.get("whatsapp")||""),
        slug:String(form.get("slug")||""),
        commissionBps:Math.round(Number(form.get("commission")||20)*100),
      });
      setCredentials({
        name:result.affiliate.name,email:result.affiliate.email,linkUrl:result.affiliate.linkUrl,
        dashboardUrl:result.dashboardUrl,temporaryPassword:result.temporaryPassword,
      });
      setShowNew(false);
      event.currentTarget.reset();
      await load();
    }catch(error){
      const reason=error instanceof Error?error.message:"create_failed";
      setMessage(reason==="affiliate_already_exists"?"Ya existe un influencer con ese email o usuario.":"No se pudo crear el influencer.");
    }finally{setLoading(false)}
  }

  async function updateStatus(row:AffiliateRow){
    await affiliateAdminCall("updateAffiliate",{id:row.id,status:row.status==="active"?"paused":"active"});
    await load();
  }

  async function saveCommission(row:AffiliateRow){
    const value=Number(commissionEdits[row.id]);
    if(!Number.isFinite(value)||value<0||value>50){setMessage("La comisión debe estar entre 0% y 50%.");return}
    await affiliateAdminCall("updateAffiliate",{id:row.id,commissionBps:Math.round(value*100)});
    setMessage(`Comisión de ${row.name} actualizada ✓`);
    window.setTimeout(()=>setMessage(""),1800);
    await load();
  }

  async function resetPassword(row:AffiliateRow){
    if(!window.confirm(`¿Generar una nueva contraseña para ${row.name}? La anterior dejará de funcionar.`))return;
    const result=await affiliateAdminCall<{temporaryPassword:string;dashboardUrl:string}>("resetPassword",{id:row.id});
    setCredentials({name:row.name,email:row.email,linkUrl:row.linkUrl||"",dashboardUrl:result.dashboardUrl,temporaryPassword:result.temporaryPassword});
  }

  async function payPending(row:AffiliateRow){
    if(row.commissionPendingMinor<=0)return;
    if(!window.confirm(`Vas a registrar como pagadas ${money(row.commissionPendingMinor)} para ${row.name}. ¿Continuar?`))return;
    const reference=window.prompt("Referencia del pago (opcional):","")||"";
    try{
      await affiliateAdminCall("payPending",{affiliateId:row.id,providerReference:reference});
      setMessage(`Liquidación de ${row.name} registrada ✓`);
      await load();
    }catch{setMessage("No se pudo registrar la liquidación.")}
  }

  async function copy(label:string,value:string){
    await navigator.clipboard.writeText(value);setCopied(label);
    window.setTimeout(()=>setCopied(""),1400);
  }

  const sorted=useMemo(()=>[...(overview?.affiliates||[])].sort((a,b)=>b.sales-a.sales||b.uniqueVisitors-a.uniqueVisitors),[overview]);

  if(!ready)return <main className="thi-admin-shell"><div className="thi-admin-loading">Cargando…</div></main>;

  if(!hasSession){
    return <main className="thi-admin-shell thi-aff-admin-locked">
      <section><span>PANEL INTERNO</span><h1>Afiliados</h1><p>Necesitás iniciar sesión en el panel principal.</p><Link href="/tehiceesto/admin">Volver al admin →</Link></section>
    </main>;
  }

  return <main className="thi-admin-shell thi-aff-admin-shell">
    <header className="thi-admin-header thi-admin-header-premium thi-aff-admin-header">
      <div>
        <Link href="/tehiceesto/admin" className="thi-admin-back">← Regalos</Link>
        <p className="thi-kicker">Crecimiento</p>
        <h1>Afiliados</h1>
        <p className="thi-aff-admin-sub">Quién trae atención, quién convierte y cuánto tenemos que liquidar.</p>
      </div>
      <div className="thi-admin-header-actions">
        <span className="thi-aff-admin-live"><i/> LIVE · 10 s</span>
        <button className="thi-primary" onClick={()=>setShowNew(true)}>+ Nuevo influencer</button>
        <button className="thi-ghost" onClick={()=>load()} disabled={loading}>{loading?"Actualizando…":"Actualizar"}</button>
      </div>
    </header>

    {message&&<div className="thi-aff-admin-message">{message}</div>}

    {credentials&&<section className="thi-aff-credentials">
      <div><span>CREDENCIALES NUEVAS · MOSTRAR UNA SOLA VEZ</span><h2>{credentials.name}</h2><p>Copiá estos datos y mandáselos al influencer.</p></div>
      <dl>
        <div><dt>Panel</dt><dd>{credentials.dashboardUrl}</dd><button onClick={()=>copy("panel",credentials.dashboardUrl)}>{copied==="panel"?"✓":"Copiar"}</button></div>
        {credentials.email&&<div><dt>Usuario</dt><dd>{credentials.email}</dd><button onClick={()=>copy("email",credentials.email||"")}>{copied==="email"?"✓":"Copiar"}</button></div>}
        <div><dt>Contraseña temporal</dt><dd>{credentials.temporaryPassword}</dd><button onClick={()=>copy("pass",credentials.temporaryPassword)}>{copied==="pass"?"✓":"Copiar"}</button></div>
        {credentials.linkUrl&&<div><dt>Link para compartir</dt><dd>{credentials.linkUrl}</dd><button onClick={()=>copy("link",credentials.linkUrl)}>{copied==="link"?"✓":"Copiar"}</button></div>}
      </dl>
      <button className="thi-ghost" onClick={()=>setCredentials(null)}>Cerrar</button>
    </section>}

    {showNew&&<section className="thi-admin-panel thi-aff-new">
      <div className="thi-admin-panel-heading"><div><p className="thi-kicker">Alta</p><h2>Nuevo influencer</h2></div><button className="thi-ghost" onClick={()=>setShowNew(false)}>Cerrar</button></div>
      <form onSubmit={create} className="thi-aff-new-form">
        <label><span>Nombre</span><input name="name" required placeholder="Ej. Sofía López"/></label>
        <label><span>Email</span><input name="email" type="email" required placeholder="sofia@email.com"/></label>
        <label><span>WhatsApp</span><input name="whatsapp" inputMode="tel" placeholder="+54 9 ..."/></label>
        <label><span>Usuario / link</span><input name="slug" required placeholder="sofia"/><small>Genera tehiceesto.com/a/sofia</small></label>
        <label><span>Comisión</span><div className="thi-aff-percent-input"><input name="commission" type="number" min="0" max="50" step=".5" defaultValue="20" required/><b>%</b></div></label>
        <button className="thi-primary" disabled={loading}>{loading?"Creando…":"Crear influencer →"}</button>
      </form>
    </section>}

    <section className="thi-aff-admin-kpis">
      <article><span>INFLUENCERS ACTIVOS</span><strong>{overview?.totals.activeAffiliates||0}</strong><small>{overview?.totals.totalAffiliates||0} totales</small></article>
      <article><span>PERSONAS REFERIDAS</span><strong>{(overview?.totals.uniqueVisitors||0).toLocaleString("es-AR")}</strong><small>{(overview?.totals.clicks||0).toLocaleString("es-AR")} clics</small></article>
      <article className="accent"><span>VENTAS APROBADAS</span><strong>{overview?.totals.sales||0}</strong><small>{overview?.totals.orders||0} pedidos iniciados</small></article>
      <article><span>FACTURACIÓN ATRIBUIDA</span><strong>{money(overview?.totals.revenueMinor||0)}</strong><small>Mercado Pago aprobado</small></article>
      <article><span>COMISIONES PENDIENTES</span><strong>{money(overview?.totals.commissionPendingMinor||0)}</strong><small>{money(overview?.totals.commissionPaidMinor||0)} ya pagado</small></article>
    </section>

    <section className="thi-admin-panel thi-aff-admin-table-panel">
      <div className="thi-admin-panel-heading"><div><p className="thi-kicker">Rendimiento</p><h2>Todos los influencers</h2><p>Ordenados por ventas aprobadas. Las comisiones se calculan con el porcentaje vigente al momento de crear cada pedido.</p></div></div>
      {!sorted.length?<div className="thi-admin-empty"><strong>Todavía no hay influencers.</strong><p>Creá el primero y su link queda listo para compartir.</p></div>:
      <div className="thi-admin-table-wrap"><table className="thi-admin-table thi-aff-admin-table">
        <thead><tr><th>Influencer</th><th>Link</th><th>Personas</th><th>Pedidos</th><th>Ventas</th><th>Conversión</th><th>Facturación</th><th>Comisión</th><th>Pendiente</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{sorted.map((row,index)=><tr key={row.id}>
          <td><div className="thi-aff-rank"><span>{String(index+1).padStart(2,"0")}</span><div><strong>{row.name}</strong><small>{row.email}</small></div></div></td>
          <td>{row.linkUrl?<button className="thi-aff-link-copy" onClick={()=>copy(row.id,row.linkUrl||"")}>{copied===row.id?"Copiado ✓":row.primaryLinkCode}</button>:"—"}</td>
          <td><strong>{row.uniqueVisitors}</strong><small className="thi-aff-cell-note">{row.clicks} clics</small></td>
          <td>{row.orders}</td>
          <td><strong>{row.sales}</strong></td>
          <td>{(conversion(row)*100).toLocaleString("es-AR",{maximumFractionDigits:1})}%</td>
          <td>{money(row.revenueMinor)}</td>
          <td><div className="thi-aff-commission-edit"><input value={commissionEdits[row.id]??String(row.commissionBps/100)} onChange={e=>setCommissionEdits(v=>({...v,[row.id]:e.target.value}))}/><span>%</span><button onClick={()=>saveCommission(row)}>✓</button></div></td>
          <td><strong>{money(row.commissionPendingMinor)}</strong><small className="thi-aff-cell-note">{money(row.commissionPaidMinor)} pagado</small></td>
          <td><span className={row.status==="active"?"thi-aff-status active":"thi-aff-status paused"}>{row.status==="active"?"Activo":"Pausado"}</span></td>
          <td><div className="thi-aff-row-actions">
            <button onClick={()=>updateStatus(row)}>{row.status==="active"?"Pausar":"Activar"}</button>
            <button onClick={()=>resetPassword(row)}>Clave</button>
            <button className="pay" disabled={row.commissionPendingMinor<=0} onClick={()=>payPending(row)}>Pagar</button>
          </div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </main>;
}
