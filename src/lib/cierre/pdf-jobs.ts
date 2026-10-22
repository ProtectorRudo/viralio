import "server-only";
import {cierreDb} from "./db";
import {extractQuoteFields,retrievePdfInMemory} from "./pdf-ai";
import {tokenForBusiness} from "./provider-tokens";

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
   const prefs=await sql.unsafe(
    "select s.contact_scope,c.contact_sync_state from public.cierre_settings s join public.cierre_connections c on c.business_id=s.business_id where s.business_id=$1",
    [job.business_id]
   );
   const existing=await sql.unsafe("select status,contact_saved,sent_at,last_activity_at from public.cierre_opportunities where id=$1",[job.opportunity_id]);
   if(!existing.length)continue;
   const item=existing[0];
   const sameActivity=new Date(item.sent_at).getTime()===new Date(item.last_activity_at).getTime();
   const allowed=prefs[0]?.contact_scope==="all"||
     (prefs[0]?.contact_sync_state==="verified" && item.contact_saved!==null &&
     (prefs[0]?.contact_scope==="saved"?item.contact_saved===true:item.contact_saved===false));
   const candidate=verified&&sameActivity&&allowed;
   const msg=!verified?"PDF sin número, monto o confianza verificables":
     !allowed?"No se verificó el criterio de contactos guardados":!sameActivity?
     "Hay mensajes posteriores que requieren revisión":"PDF leído; seguimiento todavía desactivado por seguridad";
   await sql.unsafe(
    "update public.cierre_opportunities set quote_number=$1,amount=$2,currency=$3,document_state=$4,ai_state=$5,status=case when status in ('blocked','superseded') then status else $6 end,reason=case when status in ('blocked','superseded') then reason else $7 end,eligibility='blocked' where id=$8",
    [verified?x.quote_number:null,verified?x.amount:null,verified?x.currency:null,x.state,x.state==="unavailable"?"unavailable":verified?"evaluated":"needs_review",candidate?"candidate":"review",msg,job.opportunity_id]
   );
   await sql.unsafe("update public.cierre_pdf_jobs set status=$1,last_error=null,finished_at=now(),locked_at=null where id=$2",[verified?"done":"needs_review",job.id]);
   completed++;
  }catch{
   await sql.unsafe("update public.cierre_pdf_jobs set status=case when attempts>=3 then 'needs_review' else 'pending' end,last_error='PDF no disponible o IA falló',locked_at=null where id=$1",[job.id]);
   await sql.unsafe("update public.cierre_opportunities set document_state='unavailable',ai_state='unavailable',reason=case when status in ('blocked','superseded') then reason else 'No se pudo leer el PDF con seguridad' end where id=$1",[job.opportunity_id]);
  }
 }
 return {processed:completed,seen:jobs.length,mode:"shadow",messages_sent:0};
}
