// CIERRE: official Meta webhook receiver on Supabase Edge.
// Public transport ONLY: the POST body must pass Meta HMAC SHA256 signature validation.
// The RPC is service-role restricted and supports deduplication and conservative shadow states.
// There is NO WhatsApp send API call in this file.
type Json=Record<string,unknown>;
type MetaMessage={id?:unknown;timestamp?:unknown;to?:unknown;from?:unknown;type?:unknown;text?:{body?:unknown};document?:{id?:unknown;filename?:unknown}};
const enc=new TextEncoder();
const maxBody=500_000;
function reply(obj:Json,status=200){return new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});}
function hex(a:ArrayBuffer){return Array.from(new Uint8Array(a),b=>b.toString(16).padStart(2,"0")).join("");}
async function sign(input:Uint8Array,secret:string){
 const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return hex(await crypto.subtle.sign("HMAC",key,input));
}
function constantEqual(a:string,b:string){
 const aa=enc.encode(a),bb=enc.encode(b);let d=aa.length^bb.length;
 for(let i=0;i<Math.max(aa.length,bb.length);i++)d|=(aa[i]??0)^(bb[i]??0);
 return d===0;
}
function adminKey(){
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(legacy)return legacy;
 try{
  const dict=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
  return typeof dict?.default==="string"?dict.default:"";
 }catch{return "";}
}
function cleanPhone(v:unknown){
 const s=String(v??"").replace(/[\s()+-]/g,"");
 return /^\d{6,20}$/.test(s)?s:null;
}
function signal(text:string,direction:"in"|"out",kind:string){
 if(kind!=="text")return "unverified";
 const t=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 if(direction==="out")
  return /(?:pudiste (?:revisar|ver|mirar)|alguna novedad|te (?:consulto|escribo) por (?:el|tu) presupuesto|como venis con (?:el|tu) presupuesto)/.test(t)
   ?"human_followup":"seller_activity";
 if(/(?:no me (?:escrib|contact|mand)|no quiero mensajes|deja de escribirme|dame de baja)/.test(t))return "optout";
 if(/(?:no me interesa|ya lo resolvi|ya resolvi|compre en otro lado|no voy a comprar)/.test(t))return "rejected";
 if(/(?:ya pague|ya compre|te transferi|ya transferi|confirmo el pedido|paso a pagar|manana paso a pagar)/.test(t))return "purchase";
 if(/[?¿]/.test(t)||/^(?:cuanto|cuando|como|incluye|tienen|me confirmas|podes)\b/.test(t))return "question";
 if(/(?:lo voy a pensar|te aviso|cualquier cosa aviso|^(?:dale|listo|ok|perfecto)[. !]*$)/.test(t))return "ambiguous";
 if(/^(?:gracias|muchas gracias|mil gracias)[.! ]*$/.test(t))return "ack";
 return "unknown";
}
function parse(body:unknown){
 const found:{id:string;phoneId:string;contact:string;at:string;direction:"in"|"out";kind:string;signal:string;mediaId:string|null;filename:string|null}[]=[];
 if(!body||typeof body!=="object"||(body as {object?:string}).object!=="whatsapp_business_account")return found;
 const entries=(body as {entry?:unknown[]}).entry;
 for(const ent of Array.isArray(entries)?entries.slice(0,15):[]){
  const changes=(ent as {changes?:unknown[]})?.changes;
  for(const c of Array.isArray(changes)?changes.slice(0,15):[]){
   const change=c as {field?:string;value?:{metadata?:{phone_number_id?:string};messages?:MetaMessage[];message_echoes?:MetaMessage[]}};
   const dir=change.field==="smb_message_echoes"?"out":change.field==="messages"?"in":null;
   if(!dir)continue;
   const phoneId=String(change.value?.metadata?.phone_number_id??"");
   if(!/^\d{5,35}$/.test(phoneId))continue;
   const list=dir==="out"?change.value?.message_echoes:change.value?.messages;
   for(const item of Array.isArray(list)?list.slice(0,80):[]){
    const id=String(item?.id??""),contact=cleanPhone(dir==="out"?item?.to:item?.from);
    const ms=Number(item?.timestamp)*1000;
    if(!id||id.length>250||!contact||!Number.isFinite(ms)||ms<=0)continue;
    const t=String(item?.type??"unknown");
    const kind=["text","document","image","audio","video","sticker","interactive","button","reaction"].includes(t)?t:"other";
    const content=kind==="text"?String(item?.text?.body??"").slice(0,1400):"";
    const mediaId=kind==="document"?String(item?.document?.id??""):null;
    const filename=kind==="document"?String(item?.document?.filename??"").slice(0,160):null;
    found.push({id,phoneId,contact,at:new Date(ms).toISOString(),direction:dir,kind,
      signal:signal(content,dir,kind),
      mediaId:mediaId&&/^\d{5,35}$/.test(mediaId)?mediaId:null,filename:filename||null});
   }
  }
 }
 return found.slice(0,150);
}

function parseContacts(body:unknown){
 const out:{phoneId:string;contact:string;saved:boolean;at:string}[]=[];
 if(!body||typeof body!=="object")return out;
 const entries=(body as {entry?:unknown[]}).entry;
 for(const entry of Array.isArray(entries)?entries.slice(0,15):[]){
  const changes=(entry as {changes?:unknown[]})?.changes;
  for(const raw of Array.isArray(changes)?changes.slice(0,15):[]){
   const change=raw as {field?:string;value?:{metadata?:{phone_number_id?:string};state_sync?:unknown[]}};
   if(change.field!=="smb_app_state_sync")continue;
   const phoneId=String(change.value?.metadata?.phone_number_id??"");
   if(!/^\d{5,35}$/.test(phoneId))continue;
   for(const item of Array.isArray(change.value?.state_sync)?change.value.state_sync.slice(0,1000):[]){
    const row=item as {type?:string;action?:string;contact?:{phone_number?:string};metadata?:{timestamp?:string}};
    const contact=cleanPhone(row.contact?.phone_number);
    const stamp=Number(row.metadata?.timestamp||"0")*1000;
    if(row.type!=="contact"||!["add","remove"].includes(row.action||"")||!contact||
       !Number.isFinite(stamp)||stamp<=0)continue;
    out.push({phoneId,contact,saved:row.action==="add",at:new Date(stamp).toISOString()});
   }
  }
 }
 return out.slice(0,1000);
}

async function dbCall(url:string,key:string,path:string,init:RequestInit={}){
 const result=await fetch(url+"/rest/v1/"+path,{
  ...init,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...init.headers},cache:"no-store"
 });
 if(!result.ok)throw new Error("database_"+result.status);
 return await result.json().catch(()=>null);
}
Deno.serve(async request=>{
 const metaSecret=Deno.env.get("CIERRE_META_APP_SECRET")||"";
 const verifyToken=Deno.env.get("CIERRE_META_VERIFY_TOKEN")||"";
 const hashSecret=Deno.env.get("CIERRE_CONTACT_HASH_KEY")||"";
 const base=Deno.env.get("SUPABASE_URL")||"",key=adminKey();
 if(request.method==="GET"){
  const url=new URL(request.url);
  if(url.searchParams.get("hub.mode")==="subscribe"&&verifyToken.length>=18&&constantEqual(url.searchParams.get("hub.verify_token")||"",verifyToken))
   return new Response(url.searchParams.get("hub.challenge")||"",{status:200,headers:{"Content-Type":"text/plain"}});
  return reply({mode:"shadow",configured:Boolean(metaSecret&&verifyToken&&hashSecret&&key),can_send:false},200);
 }
 if(request.method!=="POST")return reply({error:"method_not_allowed"},405);
 if(!metaSecret||!hashSecret||!key||!base)return reply({error:"not_configured",mode:"shadow"},503);
 if(Number(request.headers.get("content-length")||0)>maxBody)return reply({error:"too_large"},413);
 const raw=new Uint8Array(await request.arrayBuffer());
 if(raw.byteLength>maxBody)return reply({error:"too_large"},413);
 const expected="sha256="+await sign(raw,metaSecret);
 if(!constantEqual(request.headers.get("x-hub-signature-256")||"",expected))return reply({error:"invalid_signature"},401);
 let data:unknown;
 try{data=JSON.parse(new TextDecoder().decode(raw));}catch{return reply({error:"invalid_json"},400);}
 if(!data||typeof data!=="object"||(data as {object?:string}).object!=="whatsapp_business_account")
  return reply({error:"invalid_object"},400);
 const messages=parse(data);
 const contacts=parseContacts(data);
 try{
  let accepted=0;
  const mapping=new Map<string,string>();
  for(const event of messages){
   let businessId=mapping.get(event.phoneId);
   if(!businessId){
     const rows=await dbCall(base,key,"cierre_connections?select=business_id&meta_phone_number_id=eq."+event.phoneId+"&state=eq.connected&limit=1") as {business_id:string}[];
     businessId=rows?.[0]?.business_id;
     if(!businessId)continue;
     mapping.set(event.phoneId,businessId);
   }
   const digest=await sign(enc.encode(businessId+"|"+event.contact),hashSecret);
   const result=await dbCall(base,key,"rpc/cierre_ingest_verified_event",{
    method:"POST",body:JSON.stringify({
     p_phone_id:event.phoneId,p_event_id:event.id,p_contact_ref:digest,p_at:event.at,
     p_direction:event.direction,p_kind:event.kind,p_signal:event.signal,
     p_media_id:event.mediaId,p_filename:event.filename
    })
   }) as {accepted?:boolean};
   if(result?.accepted)accepted++;
  }
  let contactsAccepted=0;
  for(const c of contacts){
   let businessId=mapping.get(c.phoneId);
   if(!businessId){
    const rows=await dbCall(base,key,"cierre_connections?select=business_id&meta_phone_number_id=eq."+c.phoneId+"&state=eq.connected&limit=1") as {business_id:string}[];
    businessId=rows?.[0]?.business_id;
    if(!businessId)continue;
    mapping.set(c.phoneId,businessId);
   }
   const digest=await sign(enc.encode(businessId+"|"+c.contact),hashSecret);
   const result=await dbCall(base,key,"rpc/cierre_sync_verified_contact",{
    method:"POST",body:JSON.stringify({
     p_phone_id:c.phoneId,p_contact_ref:digest,p_is_saved:c.saved,p_at:c.at
    })
   }) as {accepted?:boolean};
   if(result?.accepted)contactsAccepted++;
  }
  // Optional best-effort immediate PDF processing, separate from signed ingest.
  // Durable jobs remain in PostgreSQL for manual/hourly retry if the worker fails.
  const jobSecret=Deno.env.get("CIERRE_JOB_SECRET")||"";
  const hasPdf=messages.some(m=>m.direction==="out"&&m.kind==="document");
  if(accepted>0&&hasPdf&&jobSecret.length>=24){
    const background=fetch(base+"/functions/v1/cierre-pdf-worker",{
      method:"POST",headers:{"Authorization":"Bearer "+jobSecret,"Content-Type":"application/json"},
      body:"{}",cache:"no-store"
    }).then(async response=>{await response.arrayBuffer();}).catch(()=>{});
    const runtime=(globalThis as typeof globalThis&{
      EdgeRuntime?:{waitUntil:(promise:Promise<unknown>)=>void}
    }).EdgeRuntime;
    if(runtime?.waitUntil)runtime.waitUntil(background);
  }
  return reply({ok:true,accepted,received:messages.length,contacts_accepted:contactsAccepted,mode:"shadow",sent:0});
 }catch{
  // Must return 503 for retry; the RPC is idempotent on business + event ID.
  return reply({error:"temporary_processing_failure"},503);
 }
});
