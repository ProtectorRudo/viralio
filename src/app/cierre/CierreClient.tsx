"use client";

import { useEffect, useState, type FormEvent } from "react";

const SUPABASE_URL = "https://bwsgxpttnrctklrcjmjs.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_2wOSRn_o7M6OqRSikERXUg_2RGQWkFW";
const DEFAULT_TEXT = "Hola {nombre}, ¿cómo estás? Te escribimos por el presupuesto que te enviamos. ¿Pudiste revisarlo? Si necesitás algo, estamos para ayudarte.";
const SESSION_KEY = "cierre_tenant_session_v1";

type AuthSession = { access_token: string; refresh_token: string; expires_at?: number; user?: {id: string; email?: string} };
type Business = { id:string; owner_id:string; name:string; industry:string; created_at:string };
type Settings = { business_id:string; followup_hours:number; followup_text:string; shadow_only:boolean };
type Connection = { state:string; phone_masked:string|null; last_event_at:string|null; inbound_seen:boolean; seller_echo_seen:boolean };
type Opportunity = { id:string; contact_ref:string; quote_ref:string; sent_at:string; last_activity_at:string; status:string; reason:string };
type View = "overview" | "quotes" | "connect" | "settings";
const money = (num:number) => num.toLocaleString("es-AR");
function ago(d:string){return new Date(d).toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"});}
function safeError(e:unknown){return e instanceof Error ? e.message : "No se pudo completar la operación.";}

async function endpoint(path:string, init:RequestInit={}, token?:string) {
 const headers:Record<string,string> = {"apikey":PUBLISHABLE_KEY,"Content-Type":"application/json"};
 if(token)headers.Authorization="Bearer "+token;
 const response=await fetch(SUPABASE_URL+path,{...init,headers:{...headers,...(init.headers as Record<string,string> | undefined)},cache:"no-store"});
 const txt=await response.text();
 let result:unknown;try{result=txt?JSON.parse(txt):null;}catch{result=null;}
 if(!response.ok){
  const data=result as {msg?:string;message?:string;error_description?:string;error?:string;code?:string}|null;
  if(response.status===429)throw Error("Demasiados intentos. Probá nuevamente más tarde.");
  throw Error(data?.msg || data?.error_description || data?.message || data?.error || "Error de conexión ("+response.status+")");
 }
 return result;
}
async function rest(table:string, token:string, query:string, method="GET", body?:unknown, extras:Record<string,string>={}){
 return endpoint("/rest/v1/"+table+query,{method,body:body===undefined?undefined:JSON.stringify(body),headers:extras},token);
}
async function loginWithPassword(email:string,password:string){
 return await endpoint("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})}) as AuthSession;
}
async function renewSession(s:AuthSession){
 if(!s.refresh_token)throw Error("La sesión venció. Ingresá nuevamente.");
 return await endpoint("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:s.refresh_token})}) as AuthSession;
}
async function account(s:AuthSession){return await endpoint("/auth/v1/user",{},s.access_token) as {id:string;email?:string};}
function summaryText(status:string) {
 return ({candidate:"Posible seguimiento",waiting:"Esperando",review:"Revisión",blocked:"Bloqueado",superseded:"Reemplazado"} as Record<string,string>)[status]||"Sin clasificar";
}
export default function CierreClient(){
 const [session,setSession] = useState<AuthSession|null>(null);
 const [business,setBusiness] = useState<Business|null>(null);
 const [settings,setSettings] = useState<Settings|null>(null);
 const [connection,setConnection] = useState<Connection|null>(null);
 const [opportunities,setOpportunities] = useState<Opportunity[]>([]);
 const [view,setView] = useState<View>("overview");
 const [loginMode,setLoginMode] = useState<"login"|"signup"|"reset"|"newpass">("login");
 const [recoverySession,setRecoverySession] = useState<AuthSession|null>(null);
 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");
 const [businessName,setBusinessName] = useState("");
 const [industry,setIndustry] = useState("corralon");
 const [hours,setHours] = useState("36");
 const [message,setMessage] = useState(DEFAULT_TEXT);
 const [busy,setBusy] = useState(false);
 const [booting,setBooting] = useState(true);
 const [notice,setNotice] = useState("");
 const [saving,setSaving] = useState(false);
 const [filter,setFilter] = useState("all");

 async function reload(s:AuthSession){
  const u=await account(s);
  const list=await rest("cierre_businesses",s.access_token,"?select=id,owner_id,name,industry,created_at&owner_id=eq."+encodeURIComponent(u.id)+"&limit=1") as Business[];
  if(list?.length){
    const b=list[0];
    const id=encodeURIComponent(b.id);
    const [prefs, conn, quotes]=await Promise.all([
      rest("cierre_settings",s.access_token,"?select=business_id,followup_hours,followup_text,shadow_only&business_id=eq."+id+"&limit=1"),
      rest("cierre_connections",s.access_token,"?select=state,phone_masked,last_event_at,inbound_seen,seller_echo_seen&business_id=eq."+id+"&limit=1"),
      rest("cierre_opportunities",s.access_token,"?select=id,contact_ref,quote_ref,sent_at,last_activity_at,status,reason&business_id=eq."+id+"&order=last_activity_at.desc&limit=150")
    ]) as [Settings[],Connection[],Opportunity[]];
    setBusiness(b);setSettings(prefs?.[0]||null);
    setConnection(conn?.[0]||null);setOpportunities(quotes||[]);
    setHours(String(prefs?.[0]?.followup_hours||36));setMessage(prefs?.[0]?.followup_text||DEFAULT_TEXT);
  }else{setBusiness(null);setSettings(null);setConnection(null);setOpportunities([]);}
 }
 useEffect(()=>{
   let active=true;
   async function bootstrap(){
    try{
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/,""));
      const access_token=fragment.get("access_token"), refresh_token=fragment.get("refresh_token");
      if(access_token&&refresh_token){
        const fromEmail:AuthSession={access_token,refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(fragment.get("expires_in")||3600)};
        window.history.replaceState(null,"",window.location.pathname+window.location.search);
        if(fragment.get("type")==="recovery"){
          setRecoverySession(fromEmail);setLoginMode("newpass");return;
        }
        await reload(fromEmail);setSession(fromEmail);sessionStorage.setItem(SESSION_KEY,JSON.stringify(fromEmail));return;
      }
      const raw=sessionStorage.getItem(SESSION_KEY);
      if(raw){
        let s=JSON.parse(raw) as AuthSession;
        if(!s?.access_token)throw Error("Sesión inválida");
        if(s.expires_at && s.expires_at < Math.floor(Date.now()/1000)+50)s=await renewSession(s);
        if(!active)return;
        await reload(s);
        setSession(s);
        sessionStorage.setItem(SESSION_KEY,JSON.stringify(s));
      }
    }catch{sessionStorage.removeItem(SESSION_KEY);}
    finally{if(active)setBooting(false);}
   }
   void bootstrap();
   return()=>{active=false;};
 // The initialization is intentionally one-time; later changes use explicit reload.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 async function submitAuth(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setNotice("");setBusy(true);
  try{
   if(loginMode==="newpass"){
      if(!recoverySession)throw Error("El enlace de recuperación venció. Solicitalo nuevamente.");
      if(password.length<8)throw Error("La contraseña nueva debe tener al menos 8 caracteres.");
      await endpoint("/auth/v1/user",{method:"PUT",body:JSON.stringify({password})},recoverySession.access_token);
      setRecoverySession(null);setLoginMode("login");setPassword("");
      setNotice("Contraseña actualizada. Ingresá con tus nuevas credenciales.");return;
   }
   const clean=email.trim().toLowerCase();
   if(!clean||!clean.includes("@"))throw Error("Ingresá un correo válido.");
   if(loginMode==="reset"){
    await endpoint("/auth/v1/recover?redirect_to="+encodeURIComponent("https://viralio.net/cierre"),{method:"POST",body:JSON.stringify({email:clean})});
    setNotice("Si el correo está registrado, te llegará un enlace para recuperar el acceso.");return;
   }
   if(password.length<8)throw Error("La contraseña debe tener al menos 8 caracteres.");
   if(loginMode==="signup"){
    const result=await endpoint("/auth/v1/signup?redirect_to="+encodeURIComponent("https://viralio.net/cierre"),{method:"POST",body:JSON.stringify({email:clean,password})}) as AuthSession;
    if(!result?.access_token){setNotice("Cuenta solicitada. Revisá tu correo para confirmar el registro y después ingresá.");setLoginMode("login");setPassword("");return;}
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(result));setSession(result);await reload(result);setNotice("Cuenta creada correctamente.");return;
   }
   const data=await loginWithPassword(clean,password);
   if(!data?.access_token)throw Error("No se obtuvo una sesión válida.");
   sessionStorage.setItem(SESSION_KEY,JSON.stringify(data));setSession(data);await reload(data);setPassword("");setNotice("");
  }catch(err){setNotice(safeError(err));}
  finally{setBusy(false);}
 }
 async function createBusiness(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!session)return;
  setBusy(true);setNotice("");
  try{
   const user=await account(session);
   const name=businessName.trim();
   if(name.length<2||name.length>100)throw Error("Ingresá un nombre de comercio válido.");
   await rest("cierre_businesses",session.access_token,"?select=id","POST",{owner_id:user.id,name,industry},{Prefer:"return=representation"});
   await reload(session);setView("overview");setNotice("Comercio creado. Ya tenés un panel privado para configurar CIERRE.");
  }catch(err){setNotice(safeError(err));}
  finally{setBusy(false);}
 }
 async function updateSettings(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!session||!business)return;
  setSaving(true);setNotice("");
  try{
    if(message.trim().length<35||message.length>800)throw Error("El mensaje debe tener entre 35 y 800 caracteres.");
    const obj={business_id:business.id,followup_hours:Number(hours),followup_text:message.trim(),shadow_only:true};
    await rest("cierre_settings",session.access_token,"?on_conflict=business_id","POST",obj,{Prefer:"resolution=merge-duplicates,return=minimal"});
    await reload(session);setNotice("Configuración guardada. Los envíos reales siguen desactivados.");
  }catch(err){setNotice(safeError(err));}
  finally{setSaving(false);}
 }
 async function manualReload(){
  if(!session)return;setBusy(true);setNotice("");
  try{let s=session;
   if(s.expires_at && s.expires_at<Math.floor(Date.now()/1000)+60){s=await renewSession(s);sessionStorage.setItem(SESSION_KEY,JSON.stringify(s));setSession(s);}
   await reload(s);setNotice("Datos actualizados.");
  }catch(e){setNotice(safeError(e));}
  finally{setBusy(false);}
 }
 async function logout(){
  const s=session;sessionStorage.removeItem(SESSION_KEY);setSession(null);setBusiness(null);setSettings(null);setOpportunities([]);setConnection(null);setNotice("");
  if(s){void endpoint("/auth/v1/logout",{method:"POST"},s.access_token).catch(()=>undefined);}
 }
 const count=(status:string)=>opportunities.filter(o=>o.status===status).length;
 const visible=filter==="all"?opportunities:opportunities.filter(o=>o.status===filter);
 const isReady=connection?.state==="connected"&&connection.inbound_seen&&connection.seller_echo_seen;
 return <div className="ci-app">
  {booting?<div className="ci-loading"><span className="ci-symbol">↗</span><b>CIERRE</b><p>Preparando acceso seguro…</p></div>:
  !session?<main className="ci-auth-grid">
   <section className="ci-auth-side">
     <a className="ci-brand" href="/cierre"><span className="ci-symbol">↗</span><span>CIERRE<small>POR VIRALIO</small></span></a>
     <div className="ci-auth-promise"><span className="ci-eyebrow">VENTAS QUE NO SE OLVIDAN</span><h1>El presupuesto se envió.<br/><em>La oportunidad sigue viva.</em></h1><p>Detectá presupuestos pendientes y elegí cuándo hacer un seguimiento, sin cambiar el trabajo de tus vendedores.</p>
      <div className="ci-steps"><span><b>01</b> Tu comercio crea su cuenta</span><span><b>02</b> Conecta WhatsApp oficialmente</span><span><b>03</b> CIERRE observa antes de actuar</span></div>
     </div>
     <div className="ci-bottomline">Un mensaje oportuno. Cero conversaciones automáticas.</div>
   </section>
   <section className="ci-auth-panel"><div className="ci-auth-box">
    <div className="ci-auth-icon">⌁</div>
    <span className="ci-eyebrow">ACCESO A COMERCIOS</span>
    <h2>{loginMode==="login"?"Entrá a tu negocio":loginMode==="signup"?"Creá tu cuenta":loginMode==="newpass"?"Elegí una contraseña nueva":"Recuperá tu acceso"}</h2>
    <p>{loginMode==="login"?"Tu panel comercial privado.":loginMode==="signup"?"Un usuario para cada comercio, con acceso protegido.":loginMode==="newpass"?"Actualizá tu clave para volver a ingresar.":"Te enviaremos instrucciones a tu correo."}</p>
    <form onSubmit={submitAuth}>
     {loginMode!=="newpass"&&<label>Correo electrónico<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@corralon.com"/></label>}
     {loginMode!=="reset"&&<label>Contraseña<input type="password" minLength={8} required autoComplete={loginMode==="signup"||loginMode==="newpass"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Al menos 8 caracteres"/></label>}
     {notice&&<div className="ci-notice" role="status">{notice}</div>}
     <button className="ci-primary" type="submit" disabled={busy}>{busy?"Procesando…":loginMode==="login"?"Ingresar a CIERRE":loginMode==="signup"?"Crear cuenta":loginMode==="newpass"?"Actualizar contraseña":"Enviar enlace"}</button>
    </form>
    {loginMode!=="newpass"&&<div className="ci-auth-links"><button type="button" onClick={()=>{setLoginMode(loginMode==="signup"?"login":"signup");setNotice("");}}>{loginMode==="signup"?"Ya tengo cuenta": "Crear cuenta nueva"}</button><button type="button" onClick={()=>{setLoginMode(loginMode==="reset"?"login":"reset");setNotice("");}}>{loginMode==="reset"?"Volver":"Olvidé mi contraseña"}</button></div>}
    <p className="ci-safe-note">Acceso por correo y contraseña. El panel no se conecta ni accede a WhatsApp sin autorización explícita del comercio.</p>
   </div></section>
  </main>:
  !business?<main className="ci-setup"><a className="ci-brand" href="/cierre"><span className="ci-symbol">↗</span><span>CIERRE<small>POR VIRALIO</small></span></a><article className="ci-setup-box">
   <span className="ci-eyebrow">PASO 01 / IDENTIFICÁ TU NEGOCIO</span><h1>Bienvenido a CIERRE.</h1><p>Creemos un espacio exclusivo para tu comercio. Nadie más podrá consultar sus presupuestos ni configuración.</p>
   <form onSubmit={createBusiness}><label>Nombre del negocio<input value={businessName} minLength={2} maxLength={100} required onChange={e=>setBusinessName(e.target.value)} placeholder="Ej. Corralón Central"/></label>
   <label>Tipo de comercio<select value={industry} onChange={e=>setIndustry(e.target.value)}><option value="corralon">Corralón de materiales</option><option value="distribuidor">Distribuidora</option><option value="otro">Otro negocio con presupuestos</option></select></label>
   {notice&&<div className="ci-notice">{notice}</div>}<button className="ci-primary" type="submit" disabled={busy}>{busy?"Creando…":"Crear mi panel →"}</button></form>
   <button className="ci-link" onClick={logout}>Salir de la cuenta</button>
  </article></main>:
  <div className="ci-dashboard">
   <aside className="ci-sidebar">
    <a className="ci-brand" href="/cierre"><span className="ci-symbol">↗</span><span>CIERRE<small>POR VIRALIO</small></span></a>
    <div className="ci-workspace"><span className="ci-avatar">{business.name.charAt(0).toUpperCase()}</span><div><b>{business.name}</b><small>Panel del negocio</small></div><span>⌄</span></div>
    <div className="ci-navcaption">ESPACIO DE TRABAJO</div>
    <nav aria-label="Secciones del panel">
     <button className={view==="overview"?"active":""} onClick={()=>setView("overview")}><span>◫</span> Resumen</button>
     <button className={view==="quotes"?"active":""} onClick={()=>setView("quotes")}><span>▤</span> Presupuestos <small>{opportunities.length}</small></button>
     <button className={view==="connect"?"active":""} onClick={()=>setView("connect")}><span>◉</span> WhatsApp</button>
     <button className={view==="settings"?"active":""} onClick={()=>setView("settings")}><span>⚙</span> Configuración</button>
    </nav>
    <div className="ci-sidebottom"><div className="ci-safety"><span className="ci-led"/> Modo sombra activado<small>CIERRE no envía mensajes.</small></div><button className="ci-logout" onClick={logout}>↪ Cerrar sesión</button></div>
   </aside>
   <div className="ci-main">
    <header className="ci-topbar"><span>ESPACIO / {business.name.toUpperCase()}</span><div><span className="ci-topstatus">● {isReady?"Eventos observados":"Sin conexión completa"}</span><button onClick={()=>void manualReload()} disabled={busy}>↻ Actualizar</button></div></header>
    <div className="ci-content">
    {notice&&<div className="ci-notice ci-notice-main" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Cerrar aviso">×</button></div>}
    {view==="overview"&&<>
     <section className="ci-pagelead"><div><span className="ci-eyebrow">CENTRO COMERCIAL</span><h1>Tu radar de oportunidades.</h1><p>Los presupuestos que nadie debería perder de vista.</p></div><span className="ci-outline-tag">MODO OBSERVACIÓN</span></section>
     <div className="ci-alert"><span className="ci-alert-icon">!</span><div><b>{isReady?"Conexión en observación":"Conectemos WhatsApp Business para empezar"}</b><p>{isReady?"Llegan eventos, pero todavía debemos comprobar cobertura y consentimiento antes de enviar seguimientos.":"Todavía no recibimos presupuestos del WhatsApp del comercio. La plataforma no inventa estadísticas ni contacta clientes."}</p></div><button onClick={()=>setView("connect")}>Configurar conexión ↗</button></div>
     <section className="ci-stats">
      <article><span>Presupuestos registrados</span><strong>{money(opportunities.length)}</strong><small>Detectados y guardados</small></article>
      <article><span>Posibles seguimientos</span><strong className="ci-green">{money(count("candidate"))}</strong><small>Aún sin autorización de envío</small></article>
      <article><span>En revisión o espera</span><strong>{money(count("review")+count("waiting"))}</strong><small>Requieren más contexto</small></article>
      <article><span>Bloqueados o reemplazados</span><strong>{money(count("blocked")+count("superseded"))}</strong><small>Protección contra molestias</small></article>
     </section>
     <div className="ci-main-grid">
      <section className="ci-card"><div className="ci-card-header"><div><h2>Actividad comercial</h2><p>Información del negocio, sin datos ficticios</p></div><button className="ci-action-link" onClick={()=>setView("quotes")}>Ver todos ↗</button></div>
       {opportunities.length===0?<div className="ci-empty"><div className="ci-empty-circle">▤</div><h3>Acá aparecerán los presupuestos</h3><p>Cuando terminemos de conectar WhatsApp, cada PDF detectado tendrá su estado y su motivo.</p><button onClick={()=>setView("connect")}>Conectar mi WhatsApp</button></div>:
       <div className="ci-quote-list">{opportunities.slice(0,5).map(q=><article key={q.id}><div><b>{q.quote_ref}</b><span>{q.contact_ref} · {ago(q.sent_at)}</span></div><span className={"ci-status "+q.status}>{summaryText(q.status)}</span></article>)}</div>}
      </section>
      <section className="ci-card ci-how"><div className="ci-card-header"><div><h2>Cómo trabaja CIERRE</h2><p>Automático cuando se habilite la conexión</p></div></div>
       <div className="ci-flow"><div><span>01</span><p><b>Detecta</b> el presupuesto PDF enviado</p></div><div><span>02</span><p><b>Interpreta</b> lo que sucede después</p></div><div><span>03</span><p><b>Bloquea</b> compras y seguimientos previos</p></div><div><span>04</span><p><b>Observa</b> antes de habilitar un único mensaje</p></div></div>
       <div className="ci-quiet">◈ La conversación siempre queda a cargo del vendedor.</div>
      </section>
     </div>
    </>}
    {view==="quotes"&&<>
      <section className="ci-pagelead"><div><span className="ci-eyebrow">OPERACIONES</span><h1>Presupuestos.</h1><p>Historial exclusivo de {business.name}.</p></div></section>
      <section className="ci-card"><div className="ci-card-header"><h2>Oportunidades observadas</h2><select value={filter} onChange={e=>setFilter(e.target.value)} className="ci-filter"><option value="all">Todos los estados</option><option value="candidate">Posible seguimiento</option><option value="review">Revisión</option><option value="waiting">Esperando</option><option value="blocked">Bloqueados</option><option value="superseded">Reemplazados</option></select></div>
      {visible.length?<div className="ci-quote-list">{visible.map(q=><article key={q.id}><div><b>{q.quote_ref}</b><span>Contacto: {q.contact_ref} · {ago(q.sent_at)} · {q.reason}</span></div><span className={"ci-status "+q.status}>{summaryText(q.status)}</span></article>)}</div>:
       <div className="ci-empty"><div className="ci-empty-circle">▤</div><h3>No hay presupuestos en este estado</h3><p>Los datos llegarán mediante una conexión oficial de WhatsApp, no por mensajes inventados.</p></div>}</section>
    </>}
    {view==="connect"&&<>
      <section className="ci-pagelead"><div><span className="ci-eyebrow">INTEGRACIONES</span><h1>Conectar WhatsApp.</h1><p>El vendedor sigue usando su WhatsApp Business habitual.</p></div></section>
      <div className="ci-connect-grid">
       <section className="ci-card ci-connect-card"><div className="ci-whatsapp-mark">◉</div><h2>WhatsApp Business</h2><p>La conexión debe hacerse desde el flujo oficial de Meta. Según la cuenta y el proveedor, el proceso puede incluir escanear un QR desde WhatsApp Business.</p>
       <div className="ci-connection-status"><span className="ci-led muted"/><div><b>{connection?.state==="connected"?"Vinculación registrada":connection?.state==="pending"?"Verificación pendiente":"No conectado"}</b><small>{connection?.phone_masked||"Ningún número vinculado todavía"}</small></div></div>
       <button className="ci-primary" disabled>Conectar con Meta (pendiente de habilitación)</button>
       <small className="ci-desc">Para activarlo necesitamos la configuración aprobada de Meta Embedded Signup y el receptor de webhooks. No solicitamos códigos ni contraseñas de WhatsApp.</small>
       </section>
       <section className="ci-card ci-connect-steps"><h2>Así será la vinculación</h2><div className="ci-flow"><div><span>01</span><p><b>Iniciás sesión</b> en la plataforma de Meta</p></div><div><span>02</span><p><b>Elegís el número</b> existente de WhatsApp Business</p></div><div><span>03</span><p><b>Verificás desde el celular</b>, escaneando el QR oficial si aparece</p></div><div><span>04</span><p><b>Validamos eventos</b> de cliente, empleado y documentos</p></div></div>
        <div className="ci-quiet">La conexión nunca supone autorización para enviar mensajes. Primero comprobamos recepción y seguridad.</div></section>
      </div>
      <section className="ci-card ci-checks"><div className="ci-card-header"><h2>Estado técnico de la integración</h2><span className="ci-outline-tag">PRUEBA PILOTO</span></div>
       <div className="ci-check-list"><div><b>Mensajes del cliente</b><span>{connection?.inbound_seen?"Detectados":"Pendiente"}</span></div><div><b>Mensajes del vendedor</b><span>{connection?.seller_echo_seen?"Detectados":"Pendiente"}</span></div><div><b>Último evento</b><span>{connection?.last_event_at?ago(connection.last_event_at):"Sin actividad"}</span></div><div><b>Mensajes enviados automáticamente</b><span>Desactivados</span></div></div>
      </section>
    </>}
    {view==="settings"&&<>
      <section className="ci-pagelead"><div><span className="ci-eyebrow">PREFERENCIAS</span><h1>Un mensaje. Una oportunidad.</h1><p>Configurás el seguimiento una sola vez; el negocio sigue atendiendo normalmente.</p></div></section>
      <div className="ci-connect-grid"><section className="ci-card ci-form-card"><h2>Política de seguimiento</h2><p>Guardamos la configuración por negocio, incluso mientras los envíos están desactivados.</p>
      <form onSubmit={updateSettings}><label>Esperar desde la última interacción<select value={hours} onChange={e=>setHours(e.target.value)}><option value="24">24 horas</option><option value="36">36 horas</option><option value="48">48 horas</option><option value="72">72 horas</option></select></label>
       <label>Mensaje fijo del comercio<textarea rows={6} value={message} maxLength={800} onChange={e=>setMessage(e.target.value)}/></label>
       <p className="ci-desc">La variable {"{nombre}"} requiere datos verificados. El texto deberá adaptarse a una plantilla aprobada por Meta cuando habilitemos envíos reales.</p>
       <button className="ci-primary" type="submit" disabled={saving}>{saving?"Guardando…":"Guardar configuración"}</button></form>
      </section>
      <section className="ci-card ci-connect-steps"><h2>Protecciones obligatorias</h2><div className="ci-guarantees"><div>✓ Una sola oportunidad por presupuesto</div><div>✓ Bloqueo al detectar rechazo o compra</div><div>✓ Revisión de preguntas pendientes</div><div>✓ Sin chatbot respondiendo al cliente</div><div>✓ Sin mensajes reales durante el piloto</div></div><div className="ci-quiet">Modo sombra: {settings?.shadow_only!==false?"activo y obligatorio":"no disponible"}. No puede desactivarse desde el panel.</div></section></div>
    </>}
    <footer className="ci-footer">CIERRE · Tecnología por Viralio <span>Privacidad y seguridad primero · Versión piloto</span></footer>
    </div>
   </div>
  </div>}
 </div>;
}
