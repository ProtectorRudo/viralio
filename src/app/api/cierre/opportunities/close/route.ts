import {NextRequest,NextResponse} from "next/server";
import {cierreDb} from "@/lib/cierre/db";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const SUPABASE="https://bwsgxpttnrctklrcjmjs.supabase.co";
const PUBLIC_KEY="sb_publishable_2wOSRn_o7M6OqRSikERXUg_2RGQWkFW";
const allowed=new Set(["sold","human_followup","optout","closed"]);
const fail=(message:string,status:number)=>NextResponse.json({ok:false,error:message},{status});
async function ownerFor(token:string):Promise<string|null>{
 const r=await fetch(SUPABASE+"/auth/v1/user",{headers:{"apikey":PUBLIC_KEY,Authorization:"Bearer "+token},cache:"no-store",signal:AbortSignal.timeout(8000)});
 if(!r.ok)return null;
 const json=await r.json() as {id?:string};
 return typeof json.id==="string"?json.id:null;
}
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin")||"";
 if(origin!=="https://viralio.net"&&origin!=="https://www.viralio.net"&&
   !(process.env.NODE_ENV==="development"&&origin==="http://localhost:3000"))return fail("origen_no_autorizado",403);
 const bearer=request.headers.get("authorization")||"";
 if(!bearer.startsWith("Bearer ")||bearer.length>10000)return fail("iniciar_sesion",401);
 const userId=await ownerFor(bearer.slice(7)).catch(()=>null);
 if(!userId)return fail("sesion_no_valida",401);
 const body=await request.json().catch(()=>null) as {opportunity_id?:unknown;action?:unknown}|null;
 const id=String(body?.opportunity_id||""),action=String(body?.action||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!allowed.has(action))return fail("datos_invalidos",400);
 try{
  const sql=cierreDb();
  const result=await sql.begin(async tx=>{
   const op=await tx.unsafe(
    "select o.id,o.business_id,o.contact_ref,o.sent_at from public.cierre_opportunities o join public.cierre_businesses b on b.id=o.business_id where o.id=$1 and b.owner_id=$2 limit 1",
    [id,userId]
   );
   if(!op.length)return null;
   const business=String(op[0].business_id),contact=String(op[0].contact_ref);
   await tx.unsafe("select pg_advisory_xact_lock(hashtext($1))",[business+"|"+contact]);
   const locked=await tx.unsafe("select id from public.cierre_opportunities where id=$1 for update",[id]);
   if(!locked.length)return null;
   await tx.unsafe(
     "insert into public.cierre_manual_actions(business_id,opportunity_id,performed_by,action) values($1,$2,$3,$4) on conflict do nothing",
     [business,id,userId,action]
   );
   if(action==="optout")await tx.unsafe(
     "insert into public.cierre_contact_blocks(business_id,contact_ref,reason) values($1,$2,'optout') on conflict do nothing",
     [business,contact]
   );
   const reason=action==="sold"?"Venta marcada por el comercio":
     action==="human_followup"?"Seguimiento realizado por vendedor":
     action==="optout"?"Cliente solicitó no recibir mensajes":"Cierre manual del comercio";
   await tx.unsafe(
     "update public.cierre_opportunities set status='blocked',reason=$1,eligibility='blocked' where business_id=$2 and contact_ref=$3 and sent_at<=$4 and status not in ('blocked','superseded')",
     [reason,business,contact,op[0].sent_at]
   );
   return {ok:true,status:"blocked",mode:"shadow",messages_sent:0};
  });
  return result?NextResponse.json(result,{headers:{"Cache-Control":"no-store"}}):fail("no_encontrado",404);
 }catch{return fail("no_se_pudo_guardar_el_bloqueo",503);}
}
