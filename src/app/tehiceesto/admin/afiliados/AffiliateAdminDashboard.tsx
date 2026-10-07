/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { affiliateAdminCall } from "../../affiliateApi";
import { SESSION_KEY } from "../api";

type AffiliateRow={
  id:string;slug:string;name:string;email:string;whatsapp:string|null;status:"active"|"paused";
  commission_bps:number;primary_link_code:string|null;clicks:number;unique_visitors:number;
  attributed_orders:number;approved_sales:number;revenue_minor:number;
  commission_earned_minor:number;commission_pending_minor:number;commission_paid_minor:number;
  clicks_30d:number;visitors_30d:number;sales_30d:number;revenue_30d_minor:number;
};

type Totals={clicks:number;uniqueVisitors:number;orders:number;sales:number;revenueMinor:number;commissionMinor:number;pendingMinor:number;paidMinor:number};

type Detail={
  affiliate:AffiliateRow;
  links:{id:string;code:string;label:string;status:string}[];
  commissions:{id:string;gross_amount_minor:number;commission_amount_minor:number;status:string;approved_at:string|null}[];
  payouts:{id:string;amount_minor:number;status:string;paid_at:string|null;created_at:string;provider_reference:string|null;notes:string|null;period_from:string|null;period_to:string|null;sales_count:number}[];
  series:{date:string;clicks:number;uniqueVisitors:number}[];
};

const money=(minor:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format((Number(minor)||0)/100);
const pct=(value:number)=>`${(Number(value||0)*100).toFixed(1).replace(".",",")}%`;

export default function AffiliateAdminDashboard(){
  const [ready,setReady]=useState(false);
  const [rows,setRows]=useState<AffiliateRow[]>([]);
  const [totals,setTotals]=useState<Totals>({clicks:0,uniqueVisitors:0,orders:0,sales:0,revenueMinor:0,commissionMinor:0,pendingMinor:0,paidMinor:0});
  const [loading,setLoading]=useState(false);
  const [showCreate,setShowCreate]=useState(false);
  const [detail,setDetail]=useState<Detail|null>(null);
  const [created,setCreated]=useState<{name:string;shareUrl:string;dashboardUrl:string;initialPassword:string}|null>(null);
  const [message,setMessage]=useState("");
  const [payoutReference,setPayoutReference]=useState("");
  const [payoutNotes,setPayoutNotes]=useState("");
  const [payoutBusy,setPayoutBusy]=useState(false);

  const hasSession=()=>typeof window!=="undefined"&&Boolean(window.sessionStorage.getItem(SESSION_KEY));

  async function load(silent=false){
    if(!hasSession()){setReady(true);return;}
    if(!silent)setLoading(true);
    try{
      const data=await affiliateAdminCall<{affiliates:AffiliateRow[];totals:Totals}>("list");
      setRows(data.affiliates||[]);setTotals(data.totals||totals);
      if(detail){
        const updated=await affiliateAdminCall<Detail>("detail",{id:detail.affiliate.id});
        setDetail(updated);
      }
    }catch{}finally{setReady(true);if(!silent)setLoading(false);}
  }

  useEffect(()=>{
    void load();
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load(true)},10000);
    return()=>window.clearInterval(timer);
  },[]);

  async function createAffiliate(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setMessage("");
    const form=new FormData(event.currentTarget);
    try{
      const data=await affiliateAdminCall<{affiliate:AffiliateRow;initialPassword:string;shareUrl:string;dashboardUrl:string}>("create",{
        name:String(form.get("name")||""),
        slug:String(form.get("slug")||""),
        email:String(form.get("email")||""),
        whatsapp:String(form.get("whatsapp")||""),
        commissionBps:Math.round(Number(form.get("commission")||20)*100),
      });
      setCreated({name:data.affiliate.name,initialPassword:data.initialPassword,shareUrl:data.shareUrl,dashboardUrl:data.dashboardUrl});
      setShowCreate(false);event.currentTarget.reset();await load(true);
    }catch(error){setMessage(error instanceof Error&&error.message==="affiliate_exists"?"Ese email o identificador ya existe.":"No pude crear el influencer.");}
    finally{setLoading(false);}
  }

  async function openDetail(id:string){
    setLoading(true);try{setDetail(await affiliateAdminCall<Detail>("detail",{id}));}finally{setLoading(false);}
  }

  async function updateAffiliate(patch:Record<string,unknown>){
    if(!detail)return;
    await affiliateAdminCall("update",{id:detail.affiliate.id,...patch});
    setMessage("Cambios guardados ✓");await load(true);setTimeout(()=>setMessage(""),2200);
  }

  async function resetPassword(){
    if(!detail)return;
    const data=await affiliateAdminCall<{password:string}>("resetPassword",{id:detail.affiliate.id});
    setCreated({
      name:detail.affiliate.name,
      shareUrl:`https://tehiceesto.com/r/${detail.affiliate.primary_link_code||detail.affiliate.slug}`,
      dashboardUrl:`https://tehiceesto.com/afiliados/${detail.affiliate.slug}`,
      initialPassword:data.password,
    });
  }

  async function payout(){
    if(!detail||!detail.affiliate.commission_pending_minor||payoutBusy)return;
    const amount=detail.affiliate.commission_pending_minor;
    if(!window.confirm(`Vas a marcar como liquidado ${money(amount)} para ${detail.affiliate.name}. Esto no envía dinero: deja registrada la liquidación y separa estas ventas de las próximas. ¿Confirmar?`))return;
    setPayoutBusy(true);setMessage("");
    try{
      await affiliateAdminCall("payout",{
        affiliateId:detail.affiliate.id,
        providerReference:payoutReference.trim(),
        notes:payoutNotes.trim()||"Liquidación manual registrada desde Te Hice Esto",
      });
      setPayoutReference("");setPayoutNotes("");
      setMessage(`Pago liquidado registrado por ${money(amount)} ✓`);
      await load(true);
    }catch(error){
      setMessage(error instanceof Error&&error.message==="nothing_to_pay"
        ?"No hay comisiones pendientes para liquidar."
        :"No se pudo registrar la liquidación.");
    }finally{setPayoutBusy(false);}
  }
  const conversion=useMemo(()=>totals.uniqueVisitors?totals.sales/totals.uniqueVisitors:0,[totals]);

  if(!ready)return <main className="thi-aff-admin-shell"><div className="thi-admin-loading">Cargando afiliados…</div></main>;

  if(!hasSession())return(
    <main className="thi-aff-admin-shell">
      <section className="thi-aff-access-card">
        <p className="thi-kicker">Panel interno</p><h1>Afiliados</h1>
        <p>Primero iniciá sesión en el panel de Te Hice Esto.</p>
        <Link className="thi-primary" href="/tehiceesto/admin">Ir al panel →</Link>
      </section>
    </main>
  );

  return(
    <main className="thi-aff-admin-shell">
      <header className="thi-aff-admin-head">
        <div>
          <Link href="/tehiceesto/admin" className="thi-admin-back">← Regalos</Link>
          <p className="thi-kicker">Crecimiento</p>
          <h1>Afiliados</h1>
          <p>Qué influencer trae tráfico, quién convierte y cuánto hay que liquidar.</p>
        </div>
        <div className="thi-aff-head-actions">
          <span className="thi-aff-live"><i/> EN VIVO</span>
          <button className="thi-primary" onClick={()=>setShowCreate(v=>!v)}>+ Nuevo influencer</button>
        </div>
      </header>

      <section className="thi-aff-kpis">
        <article><span>VISITAS</span><strong>{totals.uniqueVisitors.toLocaleString("es-AR")}</strong><small>{totals.clicks.toLocaleString("es-AR")} clics</small></article>
        <article><span>VENTAS</span><strong>{totals.sales}</strong><small>{pct(conversion)} conversión</small></article>
        <article className="accent"><span>FACTURACIÓN</span><strong>{money(totals.revenueMinor)}</strong><small>atribuida a influencers</small></article>
        <article><span>COMISIONES</span><strong>{money(totals.commissionMinor)}</strong><small>{money(totals.pendingMinor)} pendientes · {money(totals.paidMinor)} liquidados</small></article>
      </section>

      {created&&(
        <section className="thi-aff-credentials">
          <button aria-label="Cerrar" onClick={()=>setCreated(null)}>×</button>
          <p className="thi-kicker">Acceso creado · guardalo ahora</p>
          <h2>{created.name} ya puede empezar.</h2>
          <div><span>Link para compartir</span><code>{created.shareUrl}</code><button onClick={()=>navigator.clipboard.writeText(created.shareUrl)}>Copiar</button></div>
          <div><span>Dashboard</span><code>{created.dashboardUrl}</code><button onClick={()=>navigator.clipboard.writeText(created.dashboardUrl)}>Copiar</button></div>
          <div><span>Contraseña inicial</span><code>{created.initialPassword}</code><button onClick={()=>navigator.clipboard.writeText(created.initialPassword)}>Copiar</button></div>
          <small>La contraseña se muestra sólo ahora. Si se pierde, podés generar otra.</small>
        </section>
      )}

      {showCreate&&(
        <section className="thi-aff-create">
          <div><p className="thi-kicker">Nuevo influencer</p><h2>Crear afiliado</h2><p>Le damos un link propio y un dashboard privado.</p></div>
          <form onSubmit={createAffiliate}>
            <label><span>Nombre</span><input name="name" required placeholder="Ej. Sofía López"/></label>
            <label><span>Identificador del link</span><input name="slug" placeholder="sofia" pattern="[a-zA-Z0-9-]{3,39}"/></label>
            <label><span>Email</span><input name="email" type="email" required placeholder="sofia@email.com"/></label>
            <label><span>WhatsApp</span><input name="whatsapp" placeholder="+54 9 ..."/></label>
            <label><span>Comisión</span><div className="thi-aff-percent"><input name="commission" type="number" min="0" max="50" step="0.5" defaultValue="20"/><b>%</b></div></label>
            <button className="thi-primary" disabled={loading}>{loading?"Creando…":"Crear influencer →"}</button>
          </form>
        </section>
      )}

      {message&&<div className="thi-aff-toast">{message}</div>}

      <section className="thi-aff-ranking">
        <div className="thi-aff-section-head"><div><p className="thi-kicker">Rendimiento</p><h2>Todos los influencers</h2></div><button className="thi-ghost" onClick={()=>load()}>{loading?"Actualizando…":"Actualizar"}</button></div>
        {rows.length===0?<div className="thi-admin-empty"><strong>Todavía no hay influencers.</strong><p>Creá el primero y su actividad aparecerá acá en vivo.</p></div>:(
          <div className="thi-aff-table-wrap"><table className="thi-aff-table">
            <thead><tr><th>Influencer</th><th>Visitas</th><th>Ventas</th><th>Conv.</th><th>Facturación</th><th>Comisión</th><th>Pendiente</th><th>Liquidado</th><th>Estado</th></tr></thead>
            <tbody>{rows.map((row)=>(
              <tr key={row.id} onClick={()=>openDetail(row.id)}>
                <td><strong>{row.name}</strong><small>/r/{row.primary_link_code||row.slug}</small></td>
                <td>{Number(row.unique_visitors||0).toLocaleString("es-AR")}</td>
                <td>{Number(row.approved_sales||0)}</td>
                <td>{pct(Number(row.unique_visitors)?Number(row.approved_sales)/Number(row.unique_visitors):0)}</td>
                <td>{money(Number(row.revenue_minor||0))}</td>
                <td>{money(Number(row.commission_earned_minor||0))}</td>
                <td>{money(Number(row.commission_pending_minor||0))}</td>
                <td>{money(Number(row.commission_paid_minor||0))}</td>
                <td><span className={`thi-aff-status ${row.status}`}>{row.status==="active"?"Activo":"Pausado"}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      {detail&&(
        <section className="thi-aff-detail">
          <div className="thi-aff-detail-head">
            <div><p className="thi-kicker">Detalle</p><h2>{detail.affiliate.name}</h2><p>{detail.affiliate.email}</p></div>
            <button className="thi-ghost" onClick={()=>setDetail(null)}>Cerrar</button>
          </div>
          <div className="thi-aff-detail-stats">
            <article><span>VENTAS</span><strong>{detail.affiliate.approved_sales}</strong></article>
            <article><span>FACTURACIÓN</span><strong>{money(detail.affiliate.revenue_minor)}</strong></article>
            <article><span>PENDIENTE</span><strong>{money(detail.affiliate.commission_pending_minor)}</strong></article>
            <article><span>PAGADO</span><strong>{money(detail.affiliate.commission_paid_minor)}</strong></article>
          </div>
          <div className="thi-aff-manage">
            <label><span>Comisión futura</span><div className="thi-aff-inline"><input id="thi-aff-commission" type="number" min="0" max="50" step=".5" defaultValue={detail.affiliate.commission_bps/100}/><b>%</b><button onClick={()=>{
              const el=document.getElementById("thi-aff-commission") as HTMLInputElement|null;
              if(el)void updateAffiliate({commissionBps:Math.round(Number(el.value)*100)});
            }}>Guardar</button></div></label>
            <div><span>Estado</span><button className="thi-ghost" onClick={()=>updateAffiliate({status:detail.affiliate.status==="active"?"paused":"active"})}>{detail.affiliate.status==="active"?"Pausar":"Activar"}</button></div>
            <div><span>Acceso</span><button className="thi-ghost" onClick={resetPassword}>Nueva contraseña</button></div>
          </div>

          <section className="thi-aff-settlement-box">
            <div className="thi-aff-settlement-copy">
              <p className="thi-kicker">Liquidación manual</p>
              <h3>Marcar comisión como pagada</h3>
              <p>No mueve dinero. Cuando vos le pagues por transferencia u otro medio, registralo acá. Las ventas incluidas pasan a “liquidadas” y las nuevas vuelven a acumularse desde cero.</p>
            </div>
            <div className="thi-aff-settlement-form">
              <label><span>Referencia <em>opcional</em></span><input value={payoutReference} onChange={event=>setPayoutReference(event.target.value)} placeholder="Ej. transferencia 07/10"/></label>
              <label><span>Nota <em>opcional</em></span><input value={payoutNotes} onChange={event=>setPayoutNotes(event.target.value)} placeholder="Ej. liquidación quincenal"/></label>
              <button className="thi-primary thi-aff-settle-button" disabled={!detail.affiliate.commission_pending_minor||payoutBusy} onClick={payout}>
                {payoutBusy?"Registrando…":detail.affiliate.commission_pending_minor?`Pago liquidado · ${money(detail.affiliate.commission_pending_minor)}`:"Sin saldo pendiente"}
              </button>
            </div>
          </section>

          <section className="thi-aff-settlement-history">
            <div className="thi-aff-card-head"><div><span>HISTORIAL</span><h3>Liquidaciones registradas</h3></div><small>{detail.payouts.length} movimiento{detail.payouts.length===1?"":"s"}</small></div>
            {detail.payouts.length===0?<div className="thi-aff-empty"><strong>Todavía no hay liquidaciones.</strong><p>Cuando registres la primera, queda guardada acá con fecha, período y monto.</p></div>:(
              <div className="thi-aff-table-wrap"><table className="thi-aff-settlement-table">
                <thead><tr><th>Fecha</th><th>Ventas incluidas</th><th>Período</th><th>Monto</th><th>Referencia / nota</th><th>Estado</th></tr></thead>
                <tbody>{detail.payouts.map(payout=><tr key={payout.id}>
                  <td>{new Date(payout.paid_at||payout.created_at).toLocaleDateString("es-AR")}</td>
                  <td>{Number(payout.sales_count||0)} venta{Number(payout.sales_count||0)===1?"":"s"}</td>
                  <td>{payout.period_from&&payout.period_to?`${new Date(payout.period_from).toLocaleDateString("es-AR")} → ${new Date(payout.period_to).toLocaleDateString("es-AR")}`:"—"}</td>
                  <td><strong>{money(payout.amount_minor)}</strong></td>
                  <td>{payout.provider_reference||payout.notes||"—"}</td>
                  <td><span className={`thi-aff-sale-status ${payout.status}`}>{payout.status==="paid"?"Liquidado":"Cancelado"}</span></td>
                </tr>)}</tbody>
              </table></div>
            )}
          </section>
          <div className="thi-aff-links">
            <h3>Links activos</h3>
            {detail.links.map(link=><div key={link.id}><code>https://tehiceesto.com/r/{link.code}</code><button onClick={()=>navigator.clipboard.writeText(`https://tehiceesto.com/r/${link.code}`)}>Copiar</button></div>)}
          </div>
        </section>
      )}
    </main>
  );
}
