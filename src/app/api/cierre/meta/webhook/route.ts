import {after,NextRequest,NextResponse} from "next/server";
import {createHmac,timingSafeEqual} from "node:crypto";
import {cierreDb,contactDigest} from "@/lib/cierre/db";
import {processCierrePdfJobs} from "@/lib/cierre/pdf-jobs";
import {classifyCustomerTextWithAI} from "@/lib/cierre/pdf-ai";
import {assessTimeline, type TimelineEvent} from "@/lib/cierre/timeline";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
type Msg={id:string;phoneId:string;contact:string;at:Date;direction:"in"|"out";kind:string;text:string;filename:string|null;mediaId:string|null};
const json=(data:Record<string,unknown>,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
function same(a:string,b:string){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
function eventsFrom(payload:unknown):Msg[]{
 const out:Msg[]=[];
 if(!payload||typeof payload!=="object"||(payload as {object?:string}).object!=="whatsapp_business_account")return out;
 const entries=(payload as {entry?:unknown[]}).entry;
 for(const entry of Array.isArray(entries)?entries.slice(0,15):[]){
  const changes=(entry as {changes?:unknown[]}).changes;
  for(const change of Array.isArray(changes)?changes.slice(0,15):[]){
   const c=change as {field?:string;value?:{metadata?:{phone_number_id?:string};messages?:unknown[];message_echoes?:unknown[]}};
   const direction=c.field==="messages"?"in":c.field==="smb_message_echoes"?"out":null;
   if(!direction)continue;
   const phoneId=String(c.value?.metadata?.phone_number_id||"");
   if(!/^\d{5,35}$/.test(phoneId))continue;
   const arr=direction==="in"?c.value?.messages:c.value?.message_echoes;
   for(const row of Array.isArray(arr)?arr.slice(0,80):[]){
    const m=row as {id?:string;timestamp?:string;from?:string;to?:string;type?:string;text?:{body?:string};document?:{id?:string;filename?:string;mime_type?:string}};
    const contact=String((direction==="in"?m.from:m.to)||""),stamp=Number(m.timestamp)*1000;
    if(!m.id||m.id.length>250||!/^\d{6,20}$/.test(contact)||!Number.isFinite(stamp)||stamp<=0)continue;
    const kind=String(m.type||"unknown");
    out.push({id:m.id,phoneId,contact,at:new Date(stamp),direction,kind,
      text:kind==="text"?String(m.text?.body||"").slice(0,1400):"",
      filename:kind==="document"?String(m.document?.filename||"").slice(0,160)||null:null,
      mediaId:kind==="document"?String(m.document?.id||"")||null:null});
   }
  }
 }
 return out.slice(0,150);
}
type ContactSync={phoneId:string;phone:string;saved:boolean};
function contactsFrom(payload:unknown):ContactSync[]{
 const out:ContactSync[]=[];
 if(!payload||typeof payload!=="object")return out;
 const entries=(payload as {entry?:unknown[]}).entry;
 for(const e of Array.isArray(entries)?entries.slice(0,15):[]){
  const changes=(e as {changes?:unknown[]}).changes;
  for(const raw of Array.isArray(changes)?changes.slice(0,15):[]){
   const c=raw as {field?:string;value?:{metadata?:{phone_number_id?:string};state_sync?:unknown[]}};
   if(c.field!=="smb_app_state_sync")continue;
   const id=String(c.value?.metadata?.phone_number_id||"");
   if(!/^\d{5,35}$/.test(id))continue;
   for(const rawContact of Array.isArray(c.value?.state_sync)?c.value.state_sync.slice(0,500):[]){
    const item=rawContact as {type?:string;action?:string;contact?:{phone_number?:string}};
    const phone=String(item.contact?.phone_number||"").replace(/\D/g,"");
    if(item.type!=="contact"||!/^\d{6,20}$/.test(phone)||!["add","remove"].includes(item.action||""))continue;
    out.push({phoneId:id,phone,saved:item.action==="add"});
   }
  }
 }
 return out.slice(0,2000);
}
async function applyContactSync(items:ContactSync[]){
 if(!items.length)return;
 const sql=cierreDb();
 for(const row of items){
  const tenants=await sql.unsafe("select business_id from public.cierre_connections where meta_phone_number_id=$1 and state='connected' limit 1",[row.phoneId]);
  if(!tenants.length)continue;
  const b=String(tenants[0].business_id),ref=contactDigest(b,row.phone);
  await sql.unsafe("insert into public.cierre_contact_directory(business_id,contact_ref,is_saved,synced_at) values($1,$2,$3,now()) on conflict(business_id,contact_ref) do update set is_saved=excluded.is_saved,synced_at=now()",[b,ref,row.saved]);
  await sql.unsafe("update public.cierre_connections set contact_sync_state=case when contact_sync_state='verified' then 'verified' else 'partial' end,updated_at=now() where business_id=$1",[b]);
 }
}
async function assessText(m:Msg){
 // AI is a second safety layer, not an authorisation to message clients.
 if(m.direction!=="in"||m.kind!=="text"||!m.text.trim()||!process.env.CIERRE_OPENAI_API_KEY)return;
 const preliminary=classify(m);
 if(!["ambiguous","unknown"].includes(preliminary))return;
 const sql=cierreDb();
 const phone=await sql.unsafe("select business_id from public.cierre_connections where meta_phone_number_id=$1 and state='connected' limit 1",[m.phoneId]);
 if(!phone.length)return;
 const b=String(phone[0].business_id),ref=contactDigest(b,m.contact);
 const active=await sql.unsafe("select 1 from public.cierre_opportunities where business_id=$1 and contact_ref=$2 and sent_at<=$3 and status not in ('blocked','superseded') limit 1",[b,ref,m.at]);
 if(!active.length)return;
 const ai=await classifyCustomerTextWithAI(m.text);
 if(!ai)return;
 const severe=ai.confidence==="high"&&["purchase","rejection","optout"].includes(ai.intent);
 await sql.begin(async tx=>{
  await tx.unsafe("select pg_advisory_xact_lock(hashtext($1))",[b+"|"+ref]);
  await tx.unsafe("update public.cierre_webhook_events set ai_signal=$1 where business_id=$2 and event_id=$3",[ai.intent,b,m.id]);
  if(ai.intent==="optout"&&ai.confidence==="high")
   await tx.unsafe("insert into public.cierre_contact_blocks(business_id,contact_ref,reason) values($1,$2,'optout') on conflict do nothing",[b,ref]);
  if(severe)await tx.unsafe("update public.cierre_opportunities set status='blocked',eligibility='blocked',conversation_ai_state='evaluated',reason='IA detectó compra, rechazo o baja; no contactar' where business_id=$1 and contact_ref=$2 and sent_at<=$3 and status not in ('blocked','superseded')",[b,ref,m.at]);
  else await tx.unsafe("update public.cierre_opportunities set conversation_ai_state=$1 where business_id=$2 and contact_ref=$3 and sent_at<=$4 and status not in ('blocked','superseded')",[ai.confidence==="high"?"evaluated":"needs_review",b,ref,m.at]);
 });
}

function classify(m:Msg){
 if(m.kind!=="text")return "unverified";
 const v=m.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
 if(m.direction==="out")return /(?:pudiste revisar|alguna novedad|te escribo por el presupuesto|como venis con el presupuesto)/.test(v)?"human_followup":"seller_activity";
 if(/(?:no me escrib|no me contact|no me mand|no quiero mensajes|dame de baja|borrame)/.test(v))return "optout";
 if(/(?:no me interesa|ya resolvi|compre en otro lado|no voy a comprar)/.test(v))return "rejected";
 if(/(?:ya pague|ya compre|te transferi|ya transferi|confirmo el pedido|paso a pagar|manana paso a pagar)/.test(v))return "purchase";
 if(/[?¿]/.test(v)||/^(?:cuanto|cuando|como|podes|incluye|tienen|me confirmas)\b/.test(v))return "question";
 if(/(?:lo voy a pensar|te aviso|cualquier cosa aviso|^(?:dale|listo|ok|perfecto)[. !]*$)/.test(v))return "ambiguous";
 if(/^(?:gracias|muchas gracias|mil gracias)[.! ]*$/.test(v))return "ack";
 return "unknown";
}
async function observe(m:Msg):Promise<boolean>{
 const sql=cierreDb();
 const tenants=await sql.unsafe(
  "select c.business_id,c.contact_sync_state,s.contact_scope from public.cierre_connections c join public.cierre_settings s on s.business_id=c.business_id where c.meta_phone_number_id=$1 and c.state='connected' limit 1",
  [m.phoneId]);
 if(!tenants.length)return false;
 const b=String(tenants[0].business_id),ref=contactDigest(b,m.contact),signal=classify(m);
 const known=tenants[0].contact_sync_state==="verified"?
  await sql.unsafe("select is_saved from public.cierre_contact_directory where business_id=$1 and contact_ref=$2 limit 1",[b,ref]):[];
 const saved=known.length?Boolean(known[0].is_saved):null;
 const result=await sql.begin(async tx=>{
  await tx.unsafe("select pg_advisory_xact_lock(hashtext($1))",[b+"|"+ref]);
  const ins=await tx.unsafe(
   "insert into public.cierre_webhook_events(event_id,business_id,contact_ref,event_at,direction,kind,signal) values($1,$2,$3,$4,$5,$6,$7) on conflict do nothing returning event_id",
   [m.id,b,ref,m.at,m.direction,m.kind,signal]);
  if(!ins.length)return false;
  if(signal==="optout")await tx.unsafe("insert into public.cierre_contact_blocks(business_id,contact_ref,reason) values($1,$2,'optout') on conflict do nothing",[b,ref]);
  const active=await tx.unsafe(
   "select id,status,sent_at,last_activity_at from public.cierre_opportunities where business_id=$1 and contact_ref=$2 order by sent_at desc limit 1 for update",
   [b,ref]);
  const pdf=m.direction==="out"&&m.kind==="document"&&
   (Boolean(m.mediaId)||Boolean(m.filename?.toLowerCase().endsWith(".pdf")));
  if(pdf){
   // Any newer PDF can revise an old quote; never send until its content is verified.
   if(active.length && new Date(active[0].sent_at).getTime()<=m.at.getTime() &&
      !["blocked","superseded"].includes(active[0].status))
     await tx.unsafe(
      "update public.cierre_opportunities set status='superseded',reason='Se envió un documento posterior',eligibility='blocked' where id=$1",
      [active[0].id]);
   if(!active.length || new Date(active[0].sent_at).getTime()<=m.at.getTime()){
    const blockedContact=await tx.unsafe("select 1 from public.cierre_contact_blocks where business_id=$1 and contact_ref=$2 limit 1",[b,ref]);
    const later=await tx.unsafe("select signal,ai_signal,event_at from public.cierre_webhook_events where business_id=$1 and contact_ref=$2 and event_at>=$3 and event_id<>$4 order by event_at desc limit 500",[b,ref,m.at,m.id]);
    const mustBlock=blockedContact.length>0||later.some(row=>["optout","purchase","rejected","human_followup"].includes(String(row.signal))||["purchase","rejection","optout"].includes(String(row.ai_signal)));
    const followActivity=later.length>0;
    const startingState=mustBlock?"blocked":"review";
    const initialReason=mustBlock?"Señal de compra, rechazo, baja o seguimiento posterior detectada":followActivity?"Mensajes posteriores pendientes de revisión":"PDF en verificación";
    const latestAt=later.reduce((max,row)=>Math.max(max,new Date(row.event_at).getTime()),m.at.getTime());
    const quoteRef="DOC-"+m.id.slice(-70);
    const created=await tx.unsafe(
     "insert into public.cierre_opportunities(business_id,contact_ref,quote_ref,source_event_id,sent_at,last_activity_at,status,reason,document_state,ai_state,contact_saved,eligibility) values($1,$2,$3,$4,$5,$6,$7,$8,'not_read','not_evaluated',$9,'blocked') on conflict(business_id,quote_ref) do nothing returning id",
     [b,ref,quoteRef,m.id,m.at,new Date(latestAt),startingState,initialReason,saved]);
    if(created.length && m.mediaId && /^\d{5,35}$/.test(m.mediaId))
     await tx.unsafe(
      "insert into public.cierre_pdf_jobs(business_id,opportunity_id,meta_phone_number_id,media_id,filename) values($1,$2,$3,$4,$5) on conflict do nothing",
      [b,created[0].id,m.phoneId,m.mediaId,m.filename||"presupuesto.pdf"]);
    if(created.length && !m.mediaId)
     await tx.unsafe(
      "update public.cierre_opportunities set document_state='unavailable',ai_state='unavailable',reason='Sin acceso al archivo PDF desde Meta' where id=$1",
      [created[0].id]);
   }
  }else if(active.length && new Date(active[0].sent_at).getTime()<=m.at.getTime() &&
    !["blocked","superseded"].includes(active[0].status)){
   // Re-evaluate all signals in event-time order, not delivery-time order.
   // The customer can thank the seller without blocking a legitimate quote,
   // but a purchase/opt-out must block even if received out of order.
   const rows=await tx.unsafe(
    "select event_id,event_at,direction,signal,ai_signal from public.cierre_webhook_events where business_id=$1 and contact_ref=$2 and event_at>=$3 order by event_at,event_id limit 501",
    [b,ref,active[0].sent_at]
   );
   const events:TimelineEvent[]=rows.map(row=>({
    eventId:String(row.event_id),atMs:new Date(row.event_at).getTime(),
    direction:row.direction==="out"?"out":"in",signal:String(row.signal),aiSignal:row.ai_signal?String(row.ai_signal):null
   }));
   const d=assessTimeline(new Date(active[0].sent_at).getTime(),events);
   const safeStatus=d.status==="candidate"?"review":d.status; // PDF validation will later decide whether candidate
   const reason=d.status==="candidate"?"Conversación sin cierre; esperando verificación de PDF":d.reason;
   await tx.unsafe(
    "update public.cierre_opportunities set status=$1,reason=$2,eligibility='blocked',last_activity_at=greatest(last_activity_at,$3) where id=$4 and status not in ('blocked','superseded')",
    [safeStatus,reason,new Date(d.lastActivityMs),active[0].id]);
  }
  await tx.unsafe(
   "update public.cierre_connections set last_event_at=now(),inbound_seen=inbound_seen or $1,seller_echo_seen=seller_echo_seen or $2,pdf_echo_seen=pdf_echo_seen or $3,updated_at=now() where business_id=$4",
   [m.direction==="in",m.direction==="out",pdf,b]);
  await tx.unsafe("update public.cierre_webhook_events set handled_at=now() where business_id=$1 and event_id=$2",[b,m.id]);
  return true;
 });
 return result;
}
export async function GET(req:NextRequest){
 const params=new URL(req.url).searchParams,token=process.env.CIERRE_META_VERIFY_TOKEN||"";
 if(!token||params.get("hub.mode")!=="subscribe"||!same(params.get("hub.verify_token")||"",token))
  return new Response("Forbidden",{status:403});
 return new Response(params.get("hub.challenge")||"",{status:200,headers:{"Content-Type":"text/plain"}});
}
export async function POST(req:NextRequest){
 const secret=process.env.CIERRE_META_APP_SECRET;
 if(!secret||!process.env.CIERRE_CONTACT_HASH_KEY)return json({ok:false,reason:"not_configured"},503);
 const bytes=Buffer.from(await req.arrayBuffer());
 if(bytes.length>300000)return json({ok:false,reason:"too_large"},413);
 const signature="sha256="+createHmac("sha256",secret).update(bytes).digest("hex");
 if(!same(req.headers.get("x-hub-signature-256")||"",signature))return json({ok:false,reason:"invalid_signature"},401);
 let data:unknown;try{data=JSON.parse(bytes.toString("utf8"));}catch{return json({ok:false,reason:"invalid_json"},400);}
 if(!data||typeof data!=="object"||(data as {object?:string}).object!=="whatsapp_business_account")
  return json({ok:false,reason:"invalid_object"},400);
 const messages=eventsFrom(data);
 const contactChanges=contactsFrom(data);
 try{
  await applyContactSync(contactChanges);
  let accepted=0;
  const newMessages:Msg[]=[];
  for(const m of messages){if(await observe(m)){accepted++;newMessages.push(m);}}
  if(accepted)after(async()=>{
   await processCierrePdfJobs(2).catch(()=>undefined);
   for(const m of newMessages.slice(0,8))await assessText(m).catch(()=>undefined);
  });
  return json({ok:true,accepted,contact_changes:contactChanges.length,mode:"shadow",messages_sent:0});
 }catch{return json({ok:false,reason:"database_not_ready"},503);}
}
