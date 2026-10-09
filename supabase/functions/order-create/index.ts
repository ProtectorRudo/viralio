import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;

function envDefault(name:string){
  try{
    const parsed=JSON.parse(Deno.env.get(name)||"{}");
    return typeof parsed.default==="string"?parsed.default:"";
  }catch{return "";}
}

const SECRET=envDefault("SUPABASE_SECRET_KEYS");
// SYNCHRONIZED with frozen premium-v3 demo snapshot. Tests guard all nine journeys.
const recipes:Record<string,string[]>={
  pareja: ["intro","door","memories","voices","light","stars","everyday","scratch","hold","letter","finale"],
  cumpleanos: ["intro","candles","balloons","memories","light","voices","hold","letter","finale"],
  hijos: ["intro","timeline","memories","voices","light","stars","capsule","hold","letter","finale"],
  abuelos: ["intro","archive","timeline","memories","home","voices","letter","legacy","finale"],
  aniversario: ["intro","timeline","memories","rituals","chapters","letter","future","finale"],
  propuesta: ["intro","origin","memories","reasons","certainty","letter","threshold","proposal"],
  mama: ["intro","childhood","memories","care","sacrifices","voices","letter","finale"],
  papa: ["intro","memories","lessons","presence","inheritance","voices","letter","lookback","finale"],
  amistad: ["intro","casefile","memories","insidejokes","incidents","proof","letter","pact","finale"],
  secreto: ["invitation","portal","gallery","timepiece","recording","clues","confession","passage","reveal","keepsake"],
};

function cors(origin:string|null){
  const allowed=origin==="https://tehiceesto.com"||origin==="https://www.tehiceesto.com"||origin==="https://viralio.net"||origin==="https://www.viralio.net"||origin?.endsWith(".vercel.app")||origin?.startsWith("http://localhost:");
  return {
    "access-control-allow-origin":allowed?origin!:"https://tehiceesto.com",
    "access-control-allow-headers":"apikey, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
  };
}

function reply(origin:string|null,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:cors(origin)});
}

function validKey(req:Request){
  const supplied=req.headers.get("apikey")||"";
  return [envDefault("SUPABASE_PUBLISHABLE_KEYS"),envDefault("SUPABASE_ANON_KEYS")].filter(Boolean).includes(supplied);
}

function clean(value:unknown,max:number){
  return String(value||"").trim().slice(0,max);
}

async function sha256(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

function createEditorToken(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

async function requestFingerprint(req:Request){
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip=forwarded||req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||"unknown";
  const day=new Date().toISOString().slice(0,10);
  return sha256(`${day}:${ip}`);
}

function objectValue(value:unknown){
  return value&&typeof value==="object"&&!Array.isArray(value)
    ?value as Record<string,unknown>
    :{};
}

function withEditorToken(storyValue:unknown,editorTokenHash:string,contact:{name:string;email:string;whatsapp:string},now:string,fingerprint:string,templateRecipe?:string[]){
  const story=objectValue(storyValue);
  const creator=objectValue(story.creator);
  const hashes:string[]=[];
  const primary=String(creator.editorTokenHash||"").trim().toLowerCase();
  if(/^[a-f0-9]{64}$/.test(primary))hashes.push(primary);
  if(Array.isArray(creator.editorTokenHashes)){
    for(const item of creator.editorTokenHashes){
      const hash=String(item||"").trim().toLowerCase();
      if(/^[a-f0-9]{64}$/.test(hash)&&!hashes.includes(hash))hashes.push(hash);
    }
  }
  const editorTokenHashes=[...hashes.filter(hash=>hash!==editorTokenHash),editorTokenHash].slice(-8);
  return {
    ...story,
    creator:{
      ...creator,
      submitted:true,
      mode:"selfserve",
      editorTokenHash,
      editorTokenHashes,
      submittedAt:creator.submittedAt||now,
      contact,
      consentAt:creator.consentAt||now,
      ipHash:creator.ipHash||fingerprint,
      ...(templateRecipe?.length?{
        templateVersion:templateRecipe?.[0]==="invitation"?"secret-v1":"premium-v3",
        templateRecipe:[...templateRecipe],
      }:{}),
    },
  };
}

async function ensureCheckout(order:{payment_token?:string|null;checkout_url?:string|null},enabled:boolean){
  let checkoutUrl=typeof order.checkout_url==="string"&&order.checkout_url?order.checkout_url:null;
  if(!checkoutUrl&&enabled&&order.payment_token){
    try{
      const response=await fetch("https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"create",token:order.payment_token}),
        signal:AbortSignal.timeout(12000),
      });
      const payload=await response.json().catch(()=>({}));
      if(response.ok&&typeof payload?.checkoutUrl==="string")checkoutUrl=payload.checkoutUrl;
    }catch{}
  }
  return checkoutUrl;
}

async function resolveAffiliateAttribution(
  supabase: ReturnType<typeof createClient>,
  rawToken: unknown,
  orderId: string,
){
  const token=String(rawToken||"").trim();
  if(!/^[A-Za-z0-9_-]{30,90}$/.test(token))return false;

  try{
    const tokenHash=await sha256(token);
    const now=new Date().toISOString();
    const {data:attribution}=await supabase
      .from("affiliate_attribution_tokens")
      .select("affiliate_id,link_id,visitor_id,source,expires_at")
      .eq("token_hash",tokenHash)
      .gt("expires_at",now)
      .maybeSingle();

    if(!attribution)return false;

    const [{data:affiliate},{data:link}]=await Promise.all([
      supabase.from("affiliates")
        .select("id,commission_bps")
        .eq("id",attribution.affiliate_id)
        .maybeSingle(),
      supabase.from("affiliate_links")
        .select("id")
        .eq("id",attribution.link_id)
        .maybeSingle(),
    ]);

    // Pausing stops new referral clicks, but already-issued 30-day
    // attribution tokens remain fair and valid until they expire.
    if(!affiliate||!link)return false;

    const {error}=await supabase.from("affiliate_order_attributions").insert({
      order_id:orderId,
      affiliate_id:affiliate.id,
      link_id:link.id,
      visitor_id:attribution.visitor_id,
      source:attribution.source||null,
      commission_bps_snapshot:Number(affiliate.commission_bps)||0,
    });

    return !error;
  }catch{
    return false;
  }
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return reply(origin,{error:"method_not_allowed"},405);
  if(!validKey(req))return reply(origin,{error:"unauthorized"},401);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return reply(origin,{error:"invalid_json"},400);}

  const experienceSlug=clean(body.experienceSlug,40);
  const customerName=clean(body.customerName,100);
  const email=clean(body.email,180).toLowerCase();
  const whatsapp=clean(body.whatsapp,40).replace(/[^0-9+]/g,"");
  const consent=body.consent===true;
  const website=clean(body.website,120);
  const clientRequestId=clean(body.clientRequestId,64).toLowerCase();

  if(website)return reply(origin,{error:"invalid_input"},400);
  if(clientRequestId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(clientRequestId)){
    return reply(origin,{error:"invalid_request_id"},400);
  }
  if(
    !recipes[experienceSlug]||
    customerName.length<2||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
    !/^\+?[0-9]{8,15}$/.test(whatsapp)||
    !consent
  )return reply(origin,{error:"invalid_input"},400);

  const db=createClient(SUPABASE_URL,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:commerce}=await db
    .from("commerce_settings")
    .select("default_price_minor,currency,auto_checkout_enabled")
    .eq("id","default")
    .maybeSingle();

  const priceMinor=Number(commerce?.default_price_minor);
  if(!Number.isInteger(priceMinor)||priceMinor<=0)return reply(origin,{error:"price_not_configured"},503);

  const now=new Date().toISOString();
  const fingerprint=await requestFingerprint(req);

  if(clientRequestId){
    const {data:existingOrder}=await db
      .from("orders")
      .select("id,gift_id,status,amount_minor,currency,buyer_email,payment_token,checkout_url")
      .eq("client_request_id",clientRequestId)
      .maybeSingle();

    if(existingOrder){
      if(String(existingOrder.buyer_email||"").toLowerCase()!==email){
        return reply(origin,{error:"request_conflict"},409);
      }

      const {data:existingGift}=await db
        .from("gifts")
        .select("id,public_code,experience_slug,story_data")
        .eq("id",existingOrder.gift_id)
        .maybeSingle();

      if(!existingGift||existingGift.experience_slug!==experienceSlug){
        return reply(origin,{error:"request_conflict"},409);
      }

      const editorToken=createEditorToken();
      const editorTokenHash=await sha256(editorToken);
      const nextStory=withEditorToken(
        existingGift.story_data,
        editorTokenHash,
        {name:customerName,email,whatsapp},
        now,
        fingerprint,
      );
      await db.from("gifts").update({giver_name:customerName,story_data:nextStory}).eq("id",existingGift.id);

      const checkoutUrl=await ensureCheckout(existingOrder,commerce?.auto_checkout_enabled===true);
      const {count:attributionCount}=await db
        .from("affiliate_order_attributions")
        .select("*",{count:"exact",head:true})
        .eq("order_id",existingOrder.id);

      return reply(origin,{
        code:existingGift.public_code,
        priceMinor:Number(existingOrder.amount_minor)||priceMinor,
        currency:String(existingOrder.currency||"ARS"),
        checkoutUrl,
        checkoutReady:Boolean(checkoutUrl),
        affiliateAttributed:(attributionCount||0)>0,
        editorToken,
        reused:true,
      });
    }
  }

  if(!clientRequestId){
    const retrySince=new Date(Date.now()-2*60*1000).toISOString();
    const {data:recentGifts}=await db
      .from("gifts")
      .select("id,public_code,experience_slug,story_data")
      .eq("experience_slug",experienceSlug)
      .gte("created_at",retrySince)
      .eq("story_data->creator->>ipHash",fingerprint)
      .order("created_at",{ascending:false})
      .limit(3);

    const giftIds=(recentGifts||[]).map(item=>item.id).filter(Boolean);
    if(giftIds.length){
      const {data:recentOrders}=await db
        .from("orders")
        .select("id,gift_id,status,amount_minor,currency,buyer_email,payment_token,checkout_url,created_at")
        .in("gift_id",giftIds)
        .eq("buyer_email",email)
        .eq("status","pending")
        .gte("created_at",retrySince)
        .order("created_at",{ascending:false})
        .limit(1);

      const existingOrder=recentOrders?.[0];
      const existingGift=existingOrder
        ?(recentGifts||[]).find(item=>item.id===existingOrder.gift_id)
        :null;

      if(existingOrder&&existingGift){
        const editorToken=createEditorToken();
        const editorTokenHash=await sha256(editorToken);
        const nextStory=withEditorToken(
          existingGift.story_data,
          editorTokenHash,
          {name:customerName,email,whatsapp},
          now,
          fingerprint,
        );
        await db.from("gifts")
          .update({giver_name:customerName,story_data:nextStory})
          .eq("id",existingGift.id);

        const checkoutUrl=await ensureCheckout(existingOrder,commerce?.auto_checkout_enabled===true);
        const {count:attributionCount}=await db
          .from("affiliate_order_attributions")
          .select("*",{count:"exact",head:true})
          .eq("order_id",existingOrder.id);

        return reply(origin,{
          code:existingGift.public_code,
          priceMinor:Number(existingOrder.amount_minor)||priceMinor,
          currency:String(existingOrder.currency||"ARS"),
          checkoutUrl,
          checkoutReady:Boolean(checkoutUrl),
          affiliateAttributed:(attributionCount||0)>0,
          editorToken,
          reused:true,
          retryRecovered:true,
        });
      }
    }
  }

  const editorToken=createEditorToken();
  const editorTokenHash=await sha256(editorToken);
  const since=new Date(Date.now()-60*60*1000).toISOString();
  const {count}=await db
    .from("gifts")
    .select("*",{count:"exact",head:true})
    .gte("created_at",since)
    .eq("story_data->creator->>ipHash",fingerprint);
  if((count||0)>=5)return reply(origin,{error:"too_many_orders"},429);

  const {data:gift,error:giftError}=await db
    .from("gifts")
    .insert({
      status:"awaiting_payment",
      experience_slug:experienceSlug,
      // New purchases reproduce the exact live demo snapshot premium-v3 at sale time.
      // Future demo improvements must never mutate an already-sold gift.
      template_version:experienceSlug==="secreto"?"secret-v1":"premium-v3",
      giver_name:customerName,
      recipient_name:"A definir",
      scene_recipe:recipes[experienceSlug],
      story_data:withEditorToken(
        {},
        editorTokenHash,
        {name:customerName,email,whatsapp},
        now,
        fingerprint,
        recipes[experienceSlug],
      ),
      theme_data:{},
    })
    .select("id,public_code")
    .single();

  if(giftError||!gift)return reply(origin,{error:"order_create_failed"},500);

  const {data:order,error:orderError}=await db
    .from("orders")
    .insert({
      gift_id:gift.id,
      provider:"mercadopago",
      status:"pending",
      amount_minor:priceMinor,
      currency:"ARS",
      buyer_email:email,
      client_request_id:clientRequestId||null,
    })
    .select("id,payment_token,checkout_url")
    .single();

  if(orderError||!order){
    await db.from("gifts").delete().eq("id",gift.id);
    return reply(origin,{error:"order_create_failed"},500);
  }

  const affiliateAttributed=await resolveAffiliateAttribution(db,body.affiliateToken,order.id);

  const checkoutUrl=await ensureCheckout(order,commerce?.auto_checkout_enabled===true);

  return reply(origin,{
    code:gift.public_code,
    priceMinor,
    currency:"ARS",
    checkoutUrl,
    checkoutReady:Boolean(checkoutUrl),
    affiliateAttributed,
    editorToken,
  });
});