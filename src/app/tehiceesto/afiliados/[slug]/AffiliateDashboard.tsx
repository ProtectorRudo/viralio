/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AFFILIATE_SESSION_KEY, affiliatePublicCall } from "../../affiliateApi";

type DashboardData={
  affiliate:{slug:string;name:string;email:string;commissionBps:number;status:string};
  stats:{
    clicks?:number;unique_visitors?:number;attributed_orders?:number;approved_sales?:number;
    revenue_minor?:number;commission_earned_minor?:number;commission_pending_minor?:number;commission_available_minor?:number;commission_paid_minor?:number;
    commission_reversed_after_payout_minor?:number;
    clicks_30d?:number;visitors_30d?:number;sales_30d?:number;revenue_30d_minor?:number;
  };
  links:{id:string;code:string;label:string;status:string}[];
  series:{date:string;clicks:number;uniqueVisitors:number;sales:number;revenueMinor:number}[];
  sources:Record<string,{clicks:number;sales:number}>;
  recentSales:{id:string;date:string;experienceSlug:string;saleAmountMinor:number;commissionAmountMinor:number;status:string}[];
  payouts:{id:string;amount_minor:number;status:string;paid_at:string|null;created_at:string;notes:string|null;provider_reference:string|null;period_from:string|null;period_to:string|null;sales_count:number}[];
  updatedAt:string;
};

const money=(minor:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format((Number(minor)||0)/100);
const pct=(value:number)=>`${(Number(value||0)*100).toFixed(1).replace(".",",")}%`;

export default function AffiliateDashboard({slug}:{slug:string}){
  const [session,setSession]=useState("");
  const [ready,setReady]=useState(false);
  const [data,setData]=useState<DashboardData|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [mustChangePassword,setMustChangePassword]=useState(false);

  async function load(token:string,silent=false){
    if(!token)return;
    if(!silent)setLoading(true);
    try{
      const payload=await affiliatePublicCall<DashboardData>("dashboard",{},token);
      setData(payload);setError("");setMustChangePassword(false);
    }catch(caught){
      if(caught instanceof Error&&caught.message==="password_change_required"){
        setMustChangePassword(true);setData(null);setError("");
        return;
      }
      window.sessionStorage.removeItem(AFFILIATE_SESSION_KEY);
      setSession("");setData(null);setMustChangePassword(false);
      if(!silent)setError("Tu sesión venció. Volvé a ingresar.");
    }finally{setReady(true);if(!silent)setLoading(false);}
  }

  useEffect(()=>{
    const token=window.sessionStorage.getItem(AFFILIATE_SESSION_KEY)||"";
    setSession(token);setReady(true);
    if(token)void load(token);
  },[]);

  useEffect(()=>{
    if(!session)return;
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load(session,true)},8000);
    return()=>window.clearInterval(timer);
  },[session]);

  async function login(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setError("");
    const form=new FormData(event.currentTarget);
    try{
      const result=await affiliatePublicCall<{token:string;mustChangePassword:boolean}>("login",{identifier:slug,password:String(form.get("password")||"")});
      window.sessionStorage.setItem(AFFILIATE_SESSION_KEY,result.token);
      setSession(result.token);
      setMustChangePassword(Boolean(result.mustChangePassword));
      if(!result.mustChangePassword)await load(result.token);
    }catch{setError("La contraseña no es correcta o el acceso está pausado.");}
    finally{setLoading(false);}
  }

  async function changePassword(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!session)return;
    const form=new FormData(event.currentTarget);
    const password=String(form.get("newPassword")||"");
    const confirmation=String(form.get("confirmPassword")||"");
    if(password!==confirmation){setError("Las contraseñas no coinciden.");return;}
    setLoading(true);setError("");
    try{
      await affiliatePublicCall("changePassword",{password},session);
      setMustChangePassword(false);
      await load(session);
    }catch(caught){
      setError(caught instanceof Error&&caught.message==="weak_password"
        ?"Elegí una contraseña personal de al menos 12 caracteres y distinta de la inicial."
        :"No se pudo cambiar la contraseña. Probá otra vez.");
    }finally{setLoading(false);}
  }

  async function logout(){
    if(session)try{await affiliatePublicCall("logout",{},session);}catch{}
    window.sessionStorage.removeItem(AFFILIATE_SESSION_KEY);setSession("");setData(null);setMustChangePassword(false);
  }

  const conversion=useMemo(()=>{
    const visitors=Number(data?.stats?.unique_visitors||0),sales=Number(data?.stats?.approved_sales||0);
    return visitors?sales/visitors:0;
  },[data]);

  const maxClicks=Math.max(1,...(data?.series||[]).map(d=>d.clicks||0));

  if(!ready)return <main className="thi-aff-public-shell"><div className="thi-admin-loading">Cargando…</div></main>;

  if(mustChangePassword&&session)return(
    <main className="thi-aff-public-shell thi-aff-login-shell">
      <section className="thi-aff-login-card">
        <span className="thi-aff-brand">TE HICE ESTO</span>
        <p className="thi-kicker">Primer ingreso</p>
        <h1>Tu espacio.<br/><em>Tu contraseña.</em></h1>
        <p>Para proteger tus ventas y comisiones, reemplazá la contraseña inicial compartida por una personal.</p>
        <form onSubmit={changePassword}>
          <label><span>Nueva contraseña</span><input name="newPassword" type="password" autoComplete="new-password" minLength={12} required/></label>
          <label><span>Confirmar contraseña</span><input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required/></label>
          {error&&<small className="thi-aff-login-error">{error}</small>}
          <button className="thi-primary" disabled={loading}>{loading?"Guardando…":"Proteger mi cuenta →"}</button>
        </form>
        <button className="thi-ghost" onClick={logout}>Salir</button>
      </section>
    </main>
  );

  if(!session||!data)return(
    <main className="thi-aff-public-shell thi-aff-login-shell">
      <section className="thi-aff-login-card">
        <Link href="/tehiceesto" className="thi-aff-brand">TE HICE ESTO</Link>
        <span className="thi-aff-login-mark">↗</span>
        <p className="thi-kicker">Programa de afiliados</p>
        <h1>Tu recomendación.<br/><em>Tus números.</em></h1>
        <p>Entrá a tu panel privado para ver visitas, ventas y comisiones en tiempo real.</p>
        <form onSubmit={login}>
          <label><span>Influencer</span><input value={slug} readOnly/></label>
          <label><span>Contraseña</span><input name="password" type="password" autoFocus required minLength={8}/></label>
          {error&&<small className="thi-aff-login-error">{error}</small>}
          <button className="thi-primary" disabled={loading}>{loading?"Entrando…":"Ver mi dashboard →"}</button>
        </form>
        <small>Los datos de compradores permanecen privados.</small>
      </section>
    </main>
  );

  const primary=data.links.find(link=>link.status==="active")||data.links[0];
  const shareUrl=primary?`https://tehiceesto.com/${primary.code}`:"";

  return(
    <main className="thi-aff-public-shell">
      <header className="thi-aff-public-head">
        <div>
          <Link href="/tehiceesto" className="thi-aff-brand">TE HICE ESTO</Link>
          <p className="thi-kicker">Panel de afiliado</p>
          <h1>Hola, {data.affiliate.name}.</h1>
          <p>Esto es lo que está generando tu recomendación.</p>
        </div>
        <div className="thi-aff-public-actions"><span className="thi-aff-live"><i/> EN VIVO</span><button className="thi-ghost" onClick={logout}>Salir</button></div>
      </header>

      <section className="thi-aff-share-card">
        <div><span>TU LINK PERSONAL</span><strong>{shareUrl||"Sin link activo"}</strong><small>Compartilo en historias, bio, WhatsApp o donde quieras.</small></div>
        <button disabled={!shareUrl} onClick={()=>shareUrl&&navigator.clipboard.writeText(shareUrl)}>Copiar link</button>
      </section>

      <section className="thi-aff-public-kpis">
        <article><span>PERSONAS QUE LLEGARON</span><strong>{Number(data.stats.unique_visitors||0).toLocaleString("es-AR")}</strong><small>{Number(data.stats.clicks||0).toLocaleString("es-AR")} clics</small></article>
        <article><span>COMPRAS APROBADAS</span><strong>{Number(data.stats.approved_sales||0)}</strong><small>{pct(conversion)} conversión</small></article>
        <article><span>VENTAS GENERADAS</span><strong>{money(Number(data.stats.revenue_minor||0))}</strong><small>facturación atribuida</small></article>
        <article className="accent"><span>TU COMISIÓN</span><strong>{money(Number(data.stats.commission_earned_minor||0))}</strong><small>{money(Number(data.stats.commission_available_minor||0))} disponible · {money(Number(data.stats.commission_paid_minor||0))} ya liquidado</small></article>
      </section>

      <section className="thi-aff-public-grid">
        <article className="thi-aff-chart-card">
          <div className="thi-aff-card-head"><div><span>ÚLTIMOS 30 DÍAS</span><h2>Personas que llegaron</h2></div><small>Actualizado {new Date(data.updatedAt).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</small></div>
          <div className="thi-aff-bars" aria-label="Visitas de los últimos 30 días">
            {data.series.map(day=><div key={day.date} title={`${day.date}: ${day.clicks} clics`}><i style={{height:`${Math.max(4,(day.clicks/maxClicks)*100)}%`}}/><span>{day.date.slice(8)}</span></div>)}
          </div>
        </article>

        <article className="thi-aff-money-card">
          <span>COMISIONES</span>
          <div><small>Disponible para liquidar</small><strong>{money(Number(data.stats.commission_available_minor||0))}</strong></div>
          <div><small>Ya pagado</small><strong>{money(Number(data.stats.commission_paid_minor||0))}</strong></div>
          <p>{Number(data.stats.commission_pending_minor||0)>Number(data.stats.commission_available_minor||0)||Number(data.stats.commission_paid_minor||0)>Number(data.stats.commission_earned_minor||0)?`Hubo devoluciones posteriores a una liquidación. El sistema las descuenta automáticamente antes del próximo pago para que el saldo sea correcto.`:"Cada venta aparece cuando Mercado Pago confirma el pago. Si hay una devolución, también se refleja."}</p>
        </article>
      </section>

      <section className="thi-aff-public-table">
        <div className="thi-aff-card-head"><div><span>TRANSPARENCIA</span><h2>Últimas ventas</h2></div><small>Sin datos privados del comprador</small></div>
        {data.recentSales.length===0?<div className="thi-aff-empty"><strong>Todavía no hay ventas aprobadas.</strong><p>Cuando llegue la primera, va a aparecer acá automáticamente.</p></div>:(
          <div className="thi-aff-table-wrap"><table>
            <thead><tr><th>Fecha</th><th>Experiencia</th><th>Venta</th><th>Tu comisión</th><th>Estado</th></tr></thead>
            <tbody>{data.recentSales.map(sale=><tr key={sale.id}><td>{new Date(sale.date).toLocaleDateString("es-AR")}</td><td>{sale.experienceSlug}</td><td>{money(sale.saleAmountMinor)}</td><td>{money(sale.commissionAmountMinor)}</td><td><span className={`thi-aff-sale-status ${sale.status}`}>{sale.status==="pending"?"Por liquidar":sale.status==="paid"?"Liquidada":"Revertida"}</span></td></tr>)}</tbody>
          </table></div>
        )}
      </section>

      <section className="thi-aff-public-table thi-aff-payout-history">
        <div className="thi-aff-card-head"><div><span>LIQUIDACIONES</span><h2>Pagos que ya te registramos</h2></div><small>Historial visible para las dos partes</small></div>
        <p className="thi-aff-payout-intro">Cuando registramos un pago por transferencia u otro medio, queda asentado acá. Esa liquidación cierra las comisiones incluidas y las ventas siguientes vuelven a sumar como pendiente.</p>
        {data.payouts.length===0?<div className="thi-aff-empty"><strong>Todavía no hay liquidaciones registradas.</strong><p>Tu saldo pendiente seguirá acumulándose hasta el primer pago.</p></div>:(
          <div className="thi-aff-table-wrap"><table className="thi-aff-settlement-table">
            <thead><tr><th>Fecha</th><th>Ventas incluidas</th><th>Período</th><th>Monto</th><th>Referencia</th><th>Estado</th></tr></thead>
            <tbody>{data.payouts.map(payout=><tr key={payout.id}>
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
      <footer className="thi-aff-public-footer"><strong>TE HICE ESTO</strong><span>Programa de afiliados · datos actualizados automáticamente</span></footer>
    </main>
  );
}
