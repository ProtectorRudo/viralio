import {NextRequest,NextResponse} from "next/server";
import {createHmac} from "node:crypto";
import {cierreDb} from "@/lib/cierre/db";
import {encryptProviderToken} from "@/lib/cierre/provider-tokens";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=30;
const GRAPH="https://graph.facebook.com/v26.0";
const SUPABASE="https://bwsgxpttnrctklrcjmjs.supabase.co";
const PUB_KEY="sb_publishable_2wOSRn_o7M6OqRSikERXUg_2RGQWkFW";
const fail=(reason:string,status:number)=>NextResponse.json({ok:false,error:reason},{status,headers:{"Cache-Control":"no-store"}});
type MetaToken={access_token?:string;expires_in?:number};
async function getUser(jwt:string){
 const r=await fetch(SUPABASE+"/auth/v1/user",{
  headers:{"apikey":PUB_KEY,"Authorization":"Bearer "+jwt},cache:"no-store",signal:AbortSignal.timeout(9000)
 });
 if(!r.ok)return null;
 const data=await r.json() as {id?:string};
 return typeof data.id==="string"?data.id:null;
}
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin")||"";
 if(origin!=="https://viralio.net"&&origin!=="https://www.viralio.net"&&
   !(process.env.NODE_ENV==="development"&&origin==="http://localhost:3000"))
  return fail("invalid_origin",403);
 const jwt=(req.headers.get("authorization")||"").replace(/^Bearer /,"");
 if(!jwt||jwt.length>10000)return fail("login_required",401);
 const ownerId=await getUser(jwt).catch(()=>null);
 if(!ownerId)return fail("invalid_session",401);
 const appId=process.env.CIERRE_META_APP_ID,secret=process.env.CIERRE_META_APP_SECRET;
 if(!appId||!secret||!process.env.CIERRE_TOKEN_ENCRYPTION_KEY)return fail("meta_setup_not_configured",503);
 const payload=await req.json().catch(()=>null) as {code?:unknown;business_id?:unknown;waba_id?:unknown;phone_number_id?:unknown}|null;
 if(!payload)return fail("invalid_request",400);
 const code=String(payload.code||""),business=String(payload.business_id||""),
       waba=String(payload.waba_id||""),phone=String(payload.phone_number_id||"");
 if(code.length<8||code.length>3000||
   !/^[a-f0-9-]{36}$/i.test(business)||!/^\d{5,35}$/.test(waba)||!/^\d{5,35}$/.test(phone))
  return fail("invalid_signup_payload",400);
 const sql=cierreDb();
 const membership=await sql.unsafe("select id from public.cierre_businesses where id=$1 and owner_id=$2 limit 1",[business,ownerId]);
 if(!membership.length)return fail("business_access_denied",403);
 let granted="";
 try{
  const oauth=await fetch(GRAPH+"/oauth/access_token",{
   method:"POST",cache:"no-store",signal:AbortSignal.timeout(12000),
   headers:{"Content-Type":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({client_id:appId,client_secret:secret,code})
  });
  if(!oauth.ok)return fail("meta_authorization_failed",502);
  const token=await oauth.json() as MetaToken;
  if(!token.access_token||token.access_token.length<30)return fail("meta_authorization_incomplete",502);
  granted=token.access_token;
  const proof=createHmac("sha256",secret).update(granted).digest("hex");
  const phonesUrl=new URL(GRAPH+"/"+waba+"/phone_numbers");
  phonesUrl.searchParams.set("fields","id,display_phone_number");
  phonesUrl.searchParams.set("limit","100");
  phonesUrl.searchParams.set("appsecret_proof",proof);
  const phones=await fetch(phonesUrl,{headers:{"Authorization":"Bearer "+granted},signal:AbortSignal.timeout(12000),cache:"no-store"});
  if(!phones.ok)return fail("meta_phone_verification_failed",502);
  const info=await phones.json() as {data?:Array<{id?:string;display_phone_number?:string}>};
  const verified=info.data?.find(p=>p.id===phone);
  if(!verified)return fail("phone_does_not_belong_to_waba",403);
  const subs=await fetch(GRAPH+"/"+waba+"/subscribed_apps",{
   method:"POST",headers:{"Authorization":"Bearer "+granted,"Content-Type":"application/json"},
   body:JSON.stringify({appsecret_proof:proof}),signal:AbortSignal.timeout(12000),cache:"no-store"
  });
  if(!subs.ok)return fail("meta_webhook_subscription_failed",502);
  const subscription=await subs.json() as {success?:boolean};
  if(subscription.success!==true)return fail("meta_subscription_not_confirmed",502);
  const encrypted=encryptProviderToken(granted);
  const until=token.expires_in&&token.expires_in>0?new Date(Date.now()+token.expires_in*1000):null;
  const visible=verified.display_phone_number||"";
  const masked=visible.length>=4?"•••• "+visible.slice(-4):"Número verificado";
  await sql.begin(async tx=>{
   await tx.unsafe(
    "insert into public.cierre_provider_tokens(business_id,encrypted_access_token,expires_at) values($1,$2,$3) on conflict(business_id) do update set encrypted_access_token=excluded.encrypted_access_token,expires_at=excluded.expires_at,updated_at=now()",
    [business,encrypted,until]);
   await tx.unsafe(
    "insert into public.cierre_connections(business_id,state,provider,meta_phone_number_id,meta_waba_id,phone_masked,contact_sync_state,inbound_seen,seller_echo_seen,pdf_echo_seen) values($1,'connected','meta_cloud_api',$2,$3,$4,'unverified',false,false,false) on conflict(business_id) do update set state='connected',meta_phone_number_id=excluded.meta_phone_number_id,meta_waba_id=excluded.meta_waba_id,phone_masked=excluded.phone_masked,contact_sync_state='unverified',inbound_seen=false,seller_echo_seen=false,pdf_echo_seen=false,updated_at=now()",
    [business,phone,waba,masked]);
  });
  return NextResponse.json({ok:true,state:"connected",mode:"shadow",messages_sent:0,requires_coverage_test:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return fail("meta_signup_not_completed",503);}
 finally{granted="";}
}
