import "server-only";
import {cierreDb} from "./db";
import {extractQuoteFields,retrievePdfInMemory} from "./pdf-ai";
import {tokenForBusiness} from "./provider-tokens";
import {assessTimeline,type TimelineEvent} from "./timeline";

/** Durable queue. No WhatsApp send operation exists anywhere in this module. */
export async function processCierrePdfJobs(maxJobs=2){
 // Do not exhaust retry attempts while the pilot is not provisioned with AI/media keys.
 if(!process.env.CIERRE_OPENAI_API_KEY||!process.env.CIERRE_TOKEN_ENCRYPTION_KEY)
  return {processed:0,seen:0,mode:"shadow",messages_sent:0,paused:"credentials_not_configured"};
 const sql=cierreDb();
 const jobs=await sql.unsafe(
  "with next as (select id from public.cierre_pdf_jobs where (status='pending' or (status='processing' and locked_at < now()-interval '3 minutes')) and attempts<3 order by created_at limit $1 for update skip locked) update public.cierre_pdf_jobs j set status='processing', attempts=attempts+1,locked_at=now() from next where j.id=next.id returning j.id,j.business_id,j.opportunity_id,j.meta_phone_number_id,j.media_id,j.filename",
  [Math.min(Math.max(maxJobs,1),5)]
 );
 let completed=0;
 for(const job of jobs){
  try{
   const token=await tokenForBusiness(String(job.business_id));
   const pdf=await retrievePdfInMemory(String(job.media_id),String(job.meta_phone_number_id),token);
   const x=await extractQuoteFields(pdf,String(job.filename));
   const verified=x.state==="extracted"&&x.is_quote;
   // Serialize evaluation with the same per-contact advisory lock as the webhook.
   // Without this, a delayed PDF processing task could clear a newly observed sale.
   await sql.begin(async tx=>{
     const first=await tx.unsafe(
       "select id,business_id,contact_ref,source_event_id,status,sent_at,contact_saved from public.cierre_opportunities where id=$1",
       [job.opportunity_id]
     );
     if(!first.length)return;
     const item=first[0],b=String(item.business_id),ref=String(item.contact_ref);
     await tx.unsafe("select pg_advisory_xact_lock(hashtext($1))",[b+"|"+ref]);
     const records=await tx.unsafe(
       "select event_id,event_at,direction,signal,ai_signal from public.cierre_webhook_events where business_id=$1 and contact_ref=$2 and event_at>=$3 and event_id<>$4 order by event_at,event_id limit 501",
       [b,ref,item.sent_at,item.source_event_id||""]
     );
     const events:TimelineEvent[]=records.map(row=>({
       eventId:String(row.event_id),atMs:new Date(row.event_at).getTime(),
       direction:row.direction==="out"?"out":"in",
       signal:String(row.signal),aiSignal:row.ai_signal?String(row.ai_signal):null
     }));
     const decision=assessTimeline(new Date(item.sent_at).getTime(),events);
     const prefs=await tx.unsafe(
       "select s.contact_scope,c.contact_sync_state from public.cierre_settings s join public.cierre_connections c on c.business_id=s.business_id where s.business_id=$1",[b]
     );
     const mode=String(prefs[0]?.contact_scope||"all");
     const saved=item.contact_saved;
     const allowed=mode==="all"||
       (prefs[0]?.contact_sync_state==="verified" && typeof saved==="boolean" &&
        (mode==="saved"?saved===true:saved===false));
     const alreadyBlocked=["blocked","superseded"].includes(String(item.status));
     const wasQuote=verified&&!alreadyBlocked;
     let next: "candidate"|"waiting"|"review"|"blocked"|"superseded" =
        alreadyBlocked?String(item.status) as "blocked"|"superseded":decision.status;
     if(!wasQuote || !allowed || decision.status==="review")next=alreadyBlocked?next:"review";
     // Files that aren't quotes do NOT supersede any previous quote.
     const reason=alreadyBlocked?"Estado bloqueado: no reactivar":!verified?
       "Documento no confirmado como presupuesto":!allowed?
       "Filtro de contactos sin agenda verificada":decision.reason;
     const lastActivity=new Date(decision.lastActivityMs);
     await tx.unsafe(
       "update public.cierre_opportunities set quote_number=$1,amount=$2,currency=$3,document_state=$4,ai_state=$5,status=case when status in ('blocked','superseded') then status else $6 end,reason=case when status in ('blocked','superseded') then reason else $7 end,last_activity_at=greatest(last_activity_at,$8),eligibility='blocked' where id=$9",
       [verified?x.quote_number:null,verified?x.amount:null,verified?x.currency:null,x.state,
        x.state==="unavailable"?"unavailable":verified?"evaluated":"needs_review",
        next,reason,lastActivity,job.opportunity_id]
     );
     if(verified){
       await tx.unsafe(
         "update public.cierre_opportunities set status='superseded',eligibility='blocked',reason='Presupuesto posterior verificado por IA' where business_id=$1 and contact_ref=$2 and sent_at<$3 and status not in ('blocked','superseded')",
         [b,ref,item.sent_at]
       );
     }
   });
   await sql.unsafe("update public.cierre_pdf_jobs set status=$1,last_error=null,finished_at=now(),locked_at=null where id=$2",[verified?"done":"needs_review",job.id]);
   completed++;
  }catch{
   await sql.unsafe("update public.cierre_pdf_jobs set status=case when attempts>=3 then 'needs_review' else 'pending' end,last_error='PDF no disponible o IA falló',locked_at=null where id=$1",[job.id]);
   await sql.unsafe("update public.cierre_opportunities set document_state='unavailable',ai_state='unavailable',reason=case when status in ('blocked','superseded') then reason else 'No se pudo leer el PDF con seguridad' end where id=$1",[job.opportunity_id]);
  }
 }
 return {processed:completed,seen:jobs.length,mode:"shadow",messages_sent:0};
}
