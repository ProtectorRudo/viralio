"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AFFILIATE_SESSION_KEY, affiliateCall } from "./api";

type Stats={
  live:boolean;
  period:string;
  affiliate:{slug:string;name:string;email:string;whatsapp:string|null;commissionBps:number};
  links:{code:string;label:string;status:string;url:string}[];
  metrics:{
    clicks:number;uniqueVisitors:number;orders:number;sales:number;conversion:number;
    revenueMinor:number;commissionEarnedMinor:number;commissionPendingMinor:number;commissionPaidMinor:number;currency:string;
  };
  sources:{source:string;clicks:number;visitors:number;sales:number}[];
  daily:{date:string;clicks:number;visitors:number;sales:number;revenueMinor:number}[];
  recentSales:{date:string;experienceSlug:string;amountMinor:number;currency:string;commissionMinor:number;commissionStatus:string;source:string|null}[];
  payouts:{id:string;amount_minor:number;currency:string;status:string;provider_reference:string|null;paid_at:string|null;created_at:string}[];
  updatedAt:string;
};

function money(minor:number){
  return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format((minor||0)/100);
}
function pct(value:number){
  return new Intl.NumberFormat("es-AR",{style:"percent",minimumFractionDigits:1,maximumFractionDigits:1}).format(value||0);
}
function date(value:string){
  return new Date(value).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"});
}
function titleSlug(value:string){
  const map:Record<string,string>={mama:"Mamá",papa:"Papá",pareja:"Pareja",cumpleanos:"Cumpleaños",hijos:"Hijo/a",amistad:"Amistad",abuelos:"Abuelos",aniversario:"Aniversario",propuesta:"Propuesta"};
  return map[value]||value;
}

export default function AffiliateDashboard(){
  const [ready,setReady]=useState(false);
  const [logged,setLogged]=useState(false);
  const [identifier,setIdentifier]=useState("");
  const [password,setPassword]=useState("");
  const [loginError,setLoginError]=useState("");
  const [stats,setStats]=useState<Stats|null>(null);
  const [period,setPeriod]=useState<"7"|"30"|"all">("30");
  const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [currentPassword,setCurrentPassword]=useState("");
  const [nextPassword,setNextPassword]=useState("");
  const [passwordMessage,setPasswordMessage]=useState("");

  async function load(nextPeriod=period,silent=false){
    if(!silent)setLoading(true);
    try{
      const data=await affiliateCall<Stats>("stats",{period:nextPeriod});
      setStats(data);
      setLogged(true);
    }catch{
      setLogged(false);
      setStats(null);
    }finally{
      if(!silent)setLoading(false);
    }
  }

  useEffect(()=>{
    const token=window.localStorage.getItem(AFFILIATE_SESSION_KEY);
    setLogged(Boolean(token));
    setReady(true);
    if(token)void load("30");
    const expired=()=>{setLogged(false);setStats(null)};
    window.addEventListener("thi-affiliate-session-expired",expired);
    return()=>window.removeEventListener("thi-affiliate-session-expired",expired);
  },[]);

  useEffect(()=>{
    if(!logged)return;
    const id=window.setInterval(()=>{void load(period,true)},5000);
    return()=>window.clearInterval(id);
  },[logged,period]);

  async function login(event:FormEvent){
    event.preventDefault();
    setLoginError("");setLoading(true);
    try{
      const data=await affiliateCall<{token:string}>("login",{identifier,password},false);
      window.localStorage.setItem(AFFILIATE_SESSION_KEY,data.token);
      setPassword("");
      setLogged(true);
      await load(period);
    }catch{
      setLoginError("No pudimos validar tus datos.");
    }finally{setLoading(false)}
  }

  async function logout(){
    try{await affiliateCall("logout")}catch{}
    window.localStorage.removeItem(AFFILIATE_SESSION_KEY);
    setLogged(false);setStats(null);
  }

  async function copy(label:string,value:string){
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(()=>setCopied(""),1600);
  }

  async function changePeriod(next:"7"|"30"|"all"){
    setPeriod(next);await load(next);
  }

  async function changePassword(event:FormEvent){
    event.preventDefault();setPasswordMessage("");
    try{
      await affiliateCall("changePassword",{currentPassword,nextPassword});
      setCurrentPassword("");setNextPassword("");setPasswordMessage("Contraseña actualizada ✓");
    }catch(error){
      setPasswordMessage(error instanceof Error&&error.message==="invalid_current_password"?"La contraseña actual no coincide.":"No se pudo cambiar.");
    }
  }

  const primary=stats?.links.find(link=>link.status==="active")||stats?.links[0];
  const channels=primary?[
    ["TikTok",`${primary.url}?src=tiktok`],
    ["Instagram",`${primary.url}?src=instagram`],
    ["YouTube",`${primary.url}?src=youtube`],
  ]:[];
  const maxChart=useMemo(()=>Math.max(1,...(stats?.daily||[]).map(row=>Math.max(row.visitors,row.sales*4))),[stats]);

  if(!ready)return <main className="thi-aff-shell"><div className="thi-aff-loading">Cargando…</div></main>;

  if(!logged){
    return <main className="thi-aff-shell thi-aff-login-shell">
      <section className="thi-aff-login">
        <Link href="/tehiceesto" className="thi-aff-brand">TE HICE ESTO</Link>
        <span className="thi-aff-kicker">PROGRAMA DE CREADORES</span>
        <h1>Tu impacto,<br/><em>sin secretos.</em></h1>
        <p>Entrá para ver en vivo cuántas personas llegaron desde tu link, cuántas compraron y cuánto generaste.</p>
        <form onSubmit={login}>
          <label><span>Email o usuario</span><input value={identifier} onChange={e=>setIdentifier(e.target.value)} autoComplete="username" required/></label>
          <label><span>Contraseña</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required minLength={8}/></label>
          {loginError&&<small className="thi-aff-error">{loginError}</small>}
          <button disabled={loading}>{loading?"Entrando…":"Ver mi panel →"}</button>
        </form>
      </section>
    </main>;
  }

  if(!stats)return <main className="thi-aff-shell"><div className="thi-aff-loading">Actualizando panel…</div></main>;

  return <main className="thi-aff-shell">
    <header className="thi-aff-top">
      <div>
        <Link href="/tehiceesto" className="thi-aff-brand">TE HICE ESTO</Link>
        <span className="thi-aff-live"><i/> EN VIVO · actualiza cada 5 s</span>
      </div>
      <button onClick={logout}>Cerrar sesión</button>
    </header>

    <section className="thi-aff-hero">
      <div>
        <span className="thi-aff-kicker">TU PANEL</span>
        <h1>Hola, {stats.affiliate.name.split(" ")[0]}.</h1>
        <p>Esto es lo que generó tu recomendación.</p>
      </div>
      <div className="thi-aff-rate"><span>TU COMISIÓN</span><strong>{(stats.affiliate.commissionBps/100).toLocaleString("es-AR")}%</strong><small>por cada venta aprobada</small></div>
    </section>

    {primary&&<section className="thi-aff-link-card">
      <div>
        <span>TU LINK PRINCIPAL</span>
        <strong>{primary.url.replace("https://","")}</strong>
        <p>La atribución dura 30 días. Si esa persona compra después, la venta sigue quedando registrada a tu nombre.</p>
      </div>
      <button onClick={()=>copy("principal",primary.url)}>{copied==="principal"?"Copiado ✓":"Copiar link"}</button>
      <div className="thi-aff-channel-links">
        {channels.map(([label,url])=><button key={label} onClick={()=>copy(label,url)}>{copied===label?"Copiado ✓":label}</button>)}
      </div>
    </section>}

    <section className="thi-aff-periods">
      <span>PERÍODO</span>
      {([["7","7 días"],["30","30 días"],["all","Total"]] as const).map(([value,label])=>
        <button key={value} className={period===value?"active":""} onClick={()=>changePeriod(value)}>{label}</button>
      )}
    </section>

    <section className="thi-aff-kpis">
      <article><span>PERSONAS</span><strong>{stats.metrics.uniqueVisitors.toLocaleString("es-AR")}</strong><small>{stats.metrics.clicks.toLocaleString("es-AR")} clics</small></article>
      <article><span>PEDIDOS</span><strong>{stats.metrics.orders.toLocaleString("es-AR")}</strong><small>iniciados desde tu link</small></article>
      <article className="accent"><span>COMPRAS</span><strong>{stats.metrics.sales.toLocaleString("es-AR")}</strong><small>{pct(stats.metrics.conversion)} conversión</small></article>
      <article><span>VENTAS GENERADAS</span><strong>{money(stats.metrics.revenueMinor)}</strong><small>pagos aprobados</small></article>
    </section>

    <section className="thi-aff-money-grid">
      <article className="main">
        <span>TU COMISIÓN GENERADA</span>
        <strong>{money(stats.metrics.commissionEarnedMinor)}</strong>
        <p>Cálculo automático sobre ventas realmente aprobadas por Mercado Pago.</p>
      </article>
      <article><span>PENDIENTE DE COBRO</span><strong>{money(stats.metrics.commissionPendingMinor)}</strong><small>todavía no liquidado</small></article>
      <article><span>YA PAGADO</span><strong>{money(stats.metrics.commissionPaidMinor)}</strong><small>historial confirmado</small></article>
    </section>

    <section className="thi-aff-panel">
      <div className="thi-aff-panel-head"><div><span>ÚLTIMOS 30 DÍAS</span><h2>Tu movimiento</h2></div><small>Visitantes / ventas</small></div>
      <div className="thi-aff-chart" aria-label="Actividad de los últimos 30 días">
        {stats.daily.map(row=><div className="thi-aff-chart-day" key={row.date} title={`${date(row.date)} · ${row.visitors} visitantes · ${row.sales} ventas`}>
          <div className="thi-aff-chart-bar">
            <i style={{height:`${Math.max(3,(row.visitors/maxChart)*100)}%`}}/>
            {row.sales>0&&<b style={{height:`${Math.max(8,((row.sales*4)/maxChart)*100)}%`}}/>}
          </div>
          <span>{new Date(row.date+"T12:00:00").getDate()}</span>
        </div>)}
      </div>
    </section>

    <section className="thi-aff-grid-2">
      <article className="thi-aff-panel">
        <div className="thi-aff-panel-head"><div><span>POR CANAL</span><h2>De dónde llegan</h2></div></div>
        <div className="thi-aff-source-list">
          {stats.sources.length?stats.sources.map(source=><div key={source.source}>
            <strong>{source.source==="directo"?"Link principal":source.source}</strong>
            <span>{source.visitors} personas</span>
            <b>{source.sales} ventas</b>
          </div>):<p className="thi-aff-empty">Todavía no hay actividad en este período.</p>}
        </div>
      </article>

      <article className="thi-aff-panel">
        <div className="thi-aff-panel-head"><div><span>TRANSPARENCIA</span><h2>Últimas compras</h2></div></div>
        <div className="thi-aff-sales-list">
          {stats.recentSales.length?stats.recentSales.map((sale,index)=><div key={`${sale.date}-${index}`}>
            <span>{date(sale.date)}</span>
            <strong>{titleSlug(sale.experienceSlug)}</strong>
            <b>{money(sale.amountMinor)}</b>
            <em>+ {money(sale.commissionMinor)}</em>
          </div>):<p className="thi-aff-empty">Cuando llegue la primera compra aprobada, va a aparecer acá.</p>}
        </div>
      </article>
    </section>

    <section className="thi-aff-panel thi-aff-security">
      <button className="thi-aff-settings-toggle" onClick={()=>setShowPassword(v=>!v)}>Seguridad de mi cuenta {showPassword?"−":"+"}</button>
      {showPassword&&<form onSubmit={changePassword}>
        <label><span>Contraseña actual</span><input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required/></label>
        <label><span>Nueva contraseña</span><input type="password" minLength={8} value={nextPassword} onChange={e=>setNextPassword(e.target.value)} required/></label>
        <button>Cambiar contraseña</button>
        {passwordMessage&&<small>{passwordMessage}</small>}
      </form>}
    </section>

    <footer className="thi-aff-footer">
      <div><strong>TE HICE ESTO</strong><span>Programa de creadores</span></div>
      <p>Los datos de compradores permanecen privados. Sólo mostramos métricas y ventas atribuidas.</p>
    </footer>
  </main>;
}
