/**
 * CIERRE: deterministic safety gate for future follow-up scheduler.
 * Pure logic, no database, network, credentials or WhatsApp sending.
 * The AI can provide observations, but can NEVER bypass these conditions.
 */
export type RecipientScope="all"|"saved"|"unsaved";
export type SafetyInput={
 nowMs:number;quoteAtMs:number;lastActivityMs:number;
 hours:24|36|48|72;
 status:"candidate"|"review"|"waiting"|"blocked"|"superseded";
 pdfVerified:boolean;aiReviewed:boolean;
 scope:RecipientScope;contactSaved:boolean|null;contactSyncVerified:boolean;
 consentVerified:boolean;templateApproved:boolean;
 echoCoverageVerified:boolean;phoneConnectionHealthy:boolean;
 externalSaleCheckVerified:boolean;saleConfirmed:boolean;
 alreadyFollowedUp:boolean;optedOut:boolean;humanFollowup:boolean;
 mode:"shadow"|"production";
};
export type SafetyDecision={status:"blocked"|"review"|"waiting"|"due"|"shadow_due";reasons:string[];dueAtMs:number|null;maySend:boolean};
export function assessFollowup(input:SafetyInput):SafetyDecision{
 const reasons:string[]=[];
 const ageOk=[24,36,48,72].includes(input.hours);
 const validTimes=Number.isFinite(input.nowMs)&&Number.isFinite(input.lastActivityMs)&&Number.isFinite(input.quoteAtMs)
  &&input.quoteAtMs>0&&input.lastActivityMs>=input.quoteAtMs&&input.nowMs>=input.quoteAtMs;
 const dueAtMs=ageOk&&validTimes?input.lastActivityMs+input.hours*3600_000:null;
 if(!ageOk||!validTimes)return {status:"review",reasons:["fecha_o_plazo_invalido"],dueAtMs:null,maySend:false};
 if(["blocked","superseded"].includes(input.status)||input.optedOut||input.saleConfirmed||
    input.humanFollowup||input.alreadyFollowedUp)
  return {status:"blocked",reasons:["venta_rechazo_baja_o_seguimiento_previo"],dueAtMs,maySend:false};
 if(input.status!=="candidate")reasons.push("oportunidad_no_confirmada");
 if(!input.pdfVerified)reasons.push("pdf_no_verificado");
 if(!input.aiReviewed)reasons.push("conversacion_no_verificada");
 if(!input.phoneConnectionHealthy||!input.echoCoverageVerified)reasons.push("cobertura_whatsapp_incompleta");
 if(input.scope!=="all"){
  if(!input.contactSyncVerified||input.contactSaved===null)reasons.push("agenda_sincronizada_incompleta");
  else if(input.scope==="saved"&&!input.contactSaved)reasons.push("contacto_no_agendado");
  else if(input.scope==="unsaved"&&input.contactSaved)reasons.push("contacto_agendado");
 }
 if(!input.externalSaleCheckVerified)reasons.push("no_puede_descartar_venta_externa");
 if(!input.consentVerified)reasons.push("consentimiento_no_verificado");
 if(!input.templateApproved)reasons.push("plantilla_meta_no_aprobada");
 if(reasons.length)return {status:"review",reasons,dueAtMs,maySend:false};
 if(input.nowMs<dueAtMs!)return {status:"waiting",reasons:["aun_no_cumple_plazo"],dueAtMs,maySend:false};
 if(input.mode==="shadow")return {status:"shadow_due",reasons:["modo_sombra_obligatorio"],dueAtMs,maySend:false};
 return {status:"due",reasons:[],dueAtMs,maySend:true};
}
