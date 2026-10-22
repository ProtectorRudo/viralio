"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type FBResponse={authResponse?:{code?:string}};
type FBSDK={init:(args:Record<string,unknown>)=>void;login:(cb:(r:FBResponse)=>void,args:Record<string,unknown>)=>void};
type MetaWindow=Window & {FB?:FBSDK;fbAsyncInit?:()=>void};
type SessionInfo={waba_id:string;phone_number_id:string};
type Config={ready:boolean;app_id:string|null;config_id:string|null};
export default function MetaSignupButton({businessId,accessToken,onConnected}:{
 businessId:string;accessToken:string;onConnected:()=>void;
}){
 const [cfg,setCfg]=useState<Config|null>(null);
 const [sdkReady,setSdkReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const codeRef=useRef<string|null>(null),sessionRef=useRef<SessionInfo|null>(null),finishing=useRef(false);
 const finish=useCallback(async()=>{
  const code=codeRef.current,meta=sessionRef.current;
  if(!code||!meta||finishing.current)return;
  finishing.current=true;
  setBusy(true);setMessage("Validando la vinculación oficial con Meta…");
  try{
   const r=await fetch("/api/cierre/meta/complete",{method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+accessToken},
    body:JSON.stringify({business_id:businessId,code,waba_id:meta.waba_id,phone_number_id:meta.phone_number_id})
   });
   const answer=await r.json() as {ok?:boolean;error?:string};
   if(!r.ok||!answer.ok)throw Error(answer.error||"No se pudo verificar la vinculación.");
   setMessage("Número vinculado. Ahora falta comprobar los mensajes entrantes, salientes y los PDF.");
   onConnected();
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo completar el alta.");}
  finally{setBusy(false);finishing.current=false;codeRef.current=null;sessionRef.current=null;}
 },[businessId,accessToken,onConnected]);
 useEffect(()=>{
  let cancelled=false;
  fetch("/api/cierre/meta/config",{cache:"no-store"}).then(r=>r.json()).then((x:Config)=>{
   if(cancelled)return;setCfg(x);
   if(!x.ready||!x.app_id)return;
   const win=window as MetaWindow;
   const initialize=()=>{
    if(!win.FB||cancelled)return;
    win.FB.init({appId:x.app_id,autoLogAppEvents:false,xfbml:false,version:"v26.0"});
    setSdkReady(true);
   };
   if(win.FB){initialize();return;}
   win.fbAsyncInit=initialize;
   const existing=document.getElementById("cierre-meta-sdk");
   if(!existing){
    const script=document.createElement("script");script.id="cierre-meta-sdk";
    script.src="https://connect.facebook.net/es_LA/sdk.js";script.async=true;script.defer=true;
    script.crossOrigin="anonymous";document.head.appendChild(script);
   }
  }).catch(()=>{if(!cancelled)setCfg({ready:false,app_id:null,config_id:null});});
  return()=>{cancelled=true;};
 },[]);
 useEffect(()=>{
  const listen=(ev:MessageEvent)=>{
   // Session IDs come only from Meta's popup. User-edited browser values aren't trusted:
   // the server independently validates these IDs against the Graph API.
   try{
    const origin=new URL(ev.origin);
    if(origin.protocol!=="https:"||!["www.facebook.com","web.facebook.com","facebook.com"].includes(origin.hostname))return;
    const data=typeof ev.data==="string"?JSON.parse(ev.data):ev.data;
    if(data?.type!=="WA_EMBEDDED_SIGNUP")return;
    if(!String(data.event||"").startsWith("FINISH"))return;
    const waba=String(data.data?.waba_id||""),phone=String(data.data?.phone_number_id||"");
    if(!/^\d{5,35}$/.test(waba)||!/^\d{5,35}$/.test(phone))return;
    sessionRef.current={waba_id:waba,phone_number_id:phone};
    void finish();
   }catch{/* Ignore unrelated postMessage payloads. */}
  };
  window.addEventListener("message",listen);
  return()=>window.removeEventListener("message",listen);
 },[finish]);
 function launch(){
  const fb=(window as MetaWindow).FB;
  if(!cfg?.ready||!cfg.config_id||!fb||busy)return;
  setMessage("");codeRef.current=null;sessionRef.current=null;
  fb.login(response=>{
   const code=response?.authResponse?.code;
   if(!code){setMessage("No se completó el registro en Meta.");return;}
   codeRef.current=code;
   if(sessionRef.current){void finish();}
   else setMessage("Finalizando la verificación del número…");
  },{
   config_id:cfg.config_id,auth_type:"rerequest",
   response_type:"code",override_default_response_type:true,
   extras:{setup:{},featureType:"whatsapp_business_app_onboarding",sessionInfoVersion:"3",version:"v4"}
  });
 }
 return <div className="ci-meta-action">
  <button type="button" className="ci-primary" disabled={!cfg?.ready||!sdkReady||busy} onClick={launch}>
   {busy?"Verificando con Meta…":cfg?.ready?"Conectar WhatsApp con Meta":"Conexión oficial pendiente de habilitación"}
  </button>
  <small className="ci-desc">{cfg?.ready?"Meta abrirá su registro oficial. Si se muestra un QR, confirmalo desde la aplicación WhatsApp Business del comercio.":"Falta configurar una aplicación Meta aprobada con Embedded Signup V4. No alcanza con escribir el número manualmente."}</small>
  {message&&<p className="ci-mini-warning" role="status">{message}</p>}
 </div>;
}
