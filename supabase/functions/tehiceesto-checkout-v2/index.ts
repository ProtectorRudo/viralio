import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const BRIDGE="https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/payment-bridge";

function defaultKey(name:string){
  try{
    const parsed=JSON.parse(Deno.env.get(name)||"{}");
    return typeof parsed.default==="string"?parsed.default:"";
  }catch{return "";}
}

const SECRET_KEY=defaultKey("SUPABASE_SECRET_KEYS");

function client(){
  return createClient(SUPABASE_URL,SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}

function reply(body:unknown,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      "x-content-type-options":"nosniff",
      "access-control-allow-origin":"https://tehiceesto.com",
      "access-control-allow-headers":"content-type",
      "access-control-allow-methods":"POST, OPTIONS",
    },
  });
}

async function mpConfig(){
  const sb=client();
  const {data,error}=await sb.rpc("get_tehiceesto_mp_config");
  const row=Array.isArray(data)?data[0]:data;
  if(error||!row)throw new Error("mp_config_unavailable");
  return {
    accessToken:String(row.access_token||""),
    webhookSecret:String(row.webhook_secret||""),
  };
}

function cleanToken(value:unknown){
  const token=String(value||"").trim().toLowerCase();
  if(!/^[a-f0-9]{48}$/.test(token))throw new Error("invalid_token");
  return token;
}

function hex(buffer:ArrayBuffer){
  return Array.from(new Uint8Array(buffer)).map(x=>x.toString(16).padStart(2,"0")).join("");
}

async function sign(token:string,message:string){
  const key=await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(token),
    {name:"HMAC",hash:"SHA-256"},
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message)));
}

async function idempotencyKey(token:string){
  const digest=hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token))).slice(0,32);
  return `${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-8${digest.slice(17,20)}-${digest.slice(20,32)}`;
}

function bridgeStatus(status:string,detail:string){
  if(status==="refunded"||detail==="refunded")return "refunded";
  if(status==="processed"&&(detail==="accredited"||detail==="partially_refunded"))return "approved";
  if(status==="failed")return "rejected";
  if(status==="canceled"||status==="cancelled"||status==="expired")return "cancelled";
  return "pending";
}

function refundedMinor(order:Record<string,unknown>,amountMinor:number,status:string,detail:string){
  if(status==="refunded"||detail==="refunded")return amountMinor;
  const transactions=order.transactions&&typeof order.transactions==="object"
    ? order.transactions as Record<string,unknown>
    : {};
  const refunds=Array.isArray(transactions.refunds)?transactions.refunds:[];
  let total=0;
  for(const item of refunds){
    if(!item||typeof item!=="object")continue;
    const refund=item as Record<string,unknown>;
    const refundStatus=String(refund.status||"").toLowerCase();
    if(!["processed","refunded"].includes(refundStatus))continue;
    const value=Number(refund.amount);
    if(Number.isFinite(value)&&value>=0)total+=Math.round(value*100);
  }
  return Math.min(amountMinor,Math.max(0,total));
}

async function bridge(body:Record<string,unknown>){
  const response=await fetch(BRIDGE,{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(8000),
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error("bridge_failed");
  return data as Record<string,unknown>;
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:reply({}).headers});

  if(req.method==="GET"&&new URL(req.url).searchParams.get("status")==="1"){
    let accessToken="",webhookSecret="",tokenValid=false;
    try{
      const config=await mpConfig();
      accessToken=config.accessToken;
      webhookSecret=config.webhookSecret;
      const check=await fetch("https://api.mercadopago.com/users/me",{
        headers:{Authorization:`Bearer ${accessToken}`,accept:"application/json"},
        signal:AbortSignal.timeout(7000),
      });
      tokenValid=check.ok;
    }catch{}
    return reply({
      configured:Boolean(accessToken&&webhookSecret&&tokenValid),
      tokenValid,
      webhookSecretPresent:Boolean(webhookSecret),
      provider:"mercadopago",
    });
  }

  if(req.method!=="POST")return reply({error:"method_not_allowed"},405);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return reply({error:"invalid_json"},400);}

  const action=String(body.action||"");
  if(!["create","sync-status"].includes(action))return reply({error:"invalid_action"},400);

  let token:string;
  try{token=cleanToken(body.token);}catch{return reply({error:"invalid_token"},400);}

  const accessToken=(await mpConfig()).accessToken;
  if(!accessToken)return reply({error:"mercadopago_not_configured"},503);

  const config=await bridge({action:"config",token,syncStatusOnly:action==="sync-status"});
  const code=String(config.code||"");
  const amountMinor=Number(config.amountMinor);
  const currency=String(config.currency||"ARS");
  const currentCheckoutUrl=typeof config.currentCheckoutUrl==="string"?config.currentCheckoutUrl:"";
  const providerReference=typeof config.providerReference==="string"?config.providerReference:"";

  if(!/^[a-f0-9]{18}$/.test(code)||!Number.isInteger(amountMinor)||amountMinor<=0||currency!=="ARS"){
    return reply({error:"invalid_checkout_config"},409);
  }

  if(action==="sync-status"){
    if(!providerReference)return reply({ok:true,status:"pending",providerOrderId:null});

    const providerResponse=await fetch(
      `https://api.mercadopago.com/v1/orders/${encodeURIComponent(providerReference)}`,
      {
        headers:{Authorization:`Bearer ${accessToken}`,accept:"application/json"},
        signal:AbortSignal.timeout(9000),
      },
    );

    if(!providerResponse.ok)return reply({error:"provider_lookup_failed"},502);

    const providerOrder=await providerResponse.json() as Record<string,unknown>;
    const providerAmount=Math.round(Number(providerOrder.total_amount||0)*100);
    if(providerAmount!==amountMinor)return reply({error:"amount_mismatch"},409);

    const rawStatus=String(providerOrder.status||"");
    const rawDetail=String(providerOrder.status_detail||"");
    const status=bridgeStatus(rawStatus,rawDetail);
    const refundedAmountMinor=refundedMinor(providerOrder,amountMinor,rawStatus,rawDetail);
    const canonical=`${token}|${providerReference}|${status}|${amountMinor}||refund:${refundedAmountMinor}`;
    const signature=await sign(token,canonical);

    await bridge({
      action:"sync",
      token,
      providerOrderId:providerReference,
      status,
      amountMinor,
      refundedAmountMinor,
      checkoutUrl:"",
      signature,
    });

    return reply({ok:true,status,providerOrderId:providerReference,refundedAmountMinor});
  }

  if(currentCheckoutUrl&&providerReference){
    return reply({
      checkoutUrl:currentCheckoutUrl,
      providerOrderId:providerReference,
      amountMinor,
      currency,
      reused:true,
    });
  }

  const amount=(amountMinor/100).toFixed(2);
  const orderResponse=await fetch("https://api.mercadopago.com/v1/orders",{
    method:"POST",
    headers:{
      Authorization:`Bearer ${accessToken}`,
      "content-type":"application/json",
      accept:"application/json",
      "x-idempotency-key":await idempotencyKey(token),
    },
    body:JSON.stringify({
      type:"online",
      processing_mode:"manual",
      total_amount:amount,
      external_reference:`thi_${token}`,
      description:"Te Hice Esto · experiencia personalizada",
      items:[{
        external_code:code,
        title:"Te Hice Esto · experiencia personalizada",
        quantity:1,
        unit_price:amount,
      }],
      config:{
        online:{
          success_url:`https://tehiceesto.com/pedido/${code}?pago=exitoso`,
          pending_url:`https://tehiceesto.com/pedido/${code}?pago=pendiente`,
          failure_url:`https://tehiceesto.com/pedido/${code}?pago=fallido`,
          auto_return:"approved",
        },
      },
    }),
    signal:AbortSignal.timeout(10000),
  });

  const raw=await orderResponse.text();
  let order:Record<string,unknown>={};
  try{order=raw?JSON.parse(raw):{};}catch{}

  if(!orderResponse.ok||typeof order.id!=="string"||typeof order.checkout_url!=="string"){
    console.error("tehiceesto_order_failed",orderResponse.status,raw.slice(0,1200));
    return reply({error:"checkout_create_failed",providerStatus:orderResponse.status},502);
  }

  const canonical=`${token}|${order.id}|pending|${amountMinor}|${order.checkout_url}`;
  const signature=await sign(token,canonical);

  await bridge({
    action:"sync",
    token,
    providerOrderId:order.id,
    status:"pending",
    amountMinor,
    checkoutUrl:order.checkout_url,
    signature,
  });

  return reply({
    checkoutUrl:order.checkout_url,
    providerOrderId:order.id,
    amountMinor,
    currency,
    reused:false,
  });
});