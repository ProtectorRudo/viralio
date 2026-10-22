import {describe,it,expect} from "vitest";
import {assessFollowup,type SafetyInput} from "../src/lib/cierre/policy";

const stamp=Date.parse("2026-10-22T12:00:00Z");
const base:SafetyInput={
 nowMs:stamp+40*3600_000,quoteAtMs:stamp,lastActivityMs:stamp,
 hours:36,status:"candidate",pdfVerified:true,aiReviewed:true,
 scope:"all",contactSaved:null,contactSyncVerified:false,
 consentVerified:true,templateApproved:true,echoCoverageVerified:true,
 phoneConnectionHealthy:true,externalSaleCheckVerified:true,saleConfirmed:false,
 alreadyFollowedUp:false,optedOut:false,humanFollowup:false,mode:"shadow"
};
describe("CIERRE safety gate",()=>{
 it("never sends while shadow",()=>{const d=assessFollowup(base);expect(d.status).toBe("shadow_due");expect(d.maySend).toBe(false);});
 it("waits 48h if configured",()=>{const d=assessFollowup({...base,hours:48});expect(d.status).toBe("waiting");});
 it("blocks confirmed sale",()=>expect(assessFollowup({...base,saleConfirmed:true}).maySend).toBe(false));
 it("blocks human follow-up",()=>expect(assessFollowup({...base,humanFollowup:true}).status).toBe("blocked"));
 it("blocks repeated follow-up",()=>expect(assessFollowup({...base,alreadyFollowedUp:true}).status).toBe("blocked"));
 it("blocks opt-out",()=>expect(assessFollowup({...base,optedOut:true}).status).toBe("blocked"));
 it("does not send when Meta templates aren't approved",()=>expect(assessFollowup({...base,templateApproved:false}).reasons).toContain("plantilla_meta_no_aprobada"));
 it("does not send if purchase at counter cannot be ruled out",()=>expect(assessFollowup({...base,externalSaleCheckVerified:false}).reasons).toContain("no_puede_descartar_venta_externa"));
 it("unknown saved contact status cannot pass saved-only",()=>expect(assessFollowup({...base,scope:"saved",contactSaved:null}).status).toBe("review"));
 it("unknown unsaved status cannot pass unsaved-only",()=>expect(assessFollowup({...base,scope:"unsaved",contactSaved:null}).maySend).toBe(false));
 it("rejects an agendado when mode is solo sin agendar",()=>expect(assessFollowup({...base,scope:"unsaved",contactSaved:true,contactSyncVerified:true}).reasons).toContain("contacto_agendado"));
 it("no consent means no send even after 36h",()=>expect(assessFollowup({...base,consentVerified:false}).maySend).toBe(false));
 it("PDF without verified AI fields cannot pass",()=>expect(assessFollowup({...base,pdfVerified:false}).status).toBe("review"));
 it("a model response cannot bypass failed webhook coverage",()=>expect(assessFollowup({...base,echoCoverageVerified:false}).maySend).toBe(false));
 it("only eligible, due production candidate may send",()=>expect(assessFollowup({...base,mode:"production"}).maySend).toBe(true));
 it("invalid or out of order timestamp must not send",()=>expect(assessFollowup({...base,lastActivityMs:stamp-1000,mode:"production"}).maySend).toBe(false));
});
