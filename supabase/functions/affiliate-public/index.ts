import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
function envDefault(name:string){try{const p=JSON.parse(Deno.env.get(name)||"{}");return typeof p.default==="string"?p.default:"";}catch{return "";}}
const SECRET=envDefault("SUPABASE_SECRET_KEYS");
const db=()=>createClient(SUPABASE_URL,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});

function cors(origin:string|null){
  const allowed=origin==="https://tehiceesto.com"||origin==="https://www.tehiceesto.com"||origin==="https://viralio.net"||origin==="https://www.viralio.net"||origin?.endsWith(".vercel.app")||origin?.startsWith("http://localhost:");
  return {
    "access-control-allow-origin":allowed?origin!:"https://tehiceesto.com",
    "access-control-allow-headers":"content-type, apikey, x-affiliate-session",
    "access-control-allow-methods":"POST, OPTIONS",
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
    "x-content-type-options":"nosniff",
  };
}
function json(origin:string|null,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors(origin)});}
function validKey(req:Request){
  const supplied=req.headers.get("apikey")||"";
  return [envDefault("SUPABASE_PUBLISHABLE_KEYS"),envDefault("SUPABASE_ANON_KEYS")].filter(Boolean).includes(supplied);
}
function clean(v:unknown,max:number){return String(v||"").trim().slice(0,max);}
function randomToken(bytes=32){const b=new Uint8Array(bytes);crypto.getRandomValues(b);return btoa(String.fromCharCode(...b)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,"0")).join("");}
function uuid(v:unknown){const s=clean(v,50).toLowerCase();return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s)?s:"";}
async function passwordHash(password:string,salt:string){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:120000,hash:"SHA-256"},key,256);
  return Array.from(new Uint8Array(bits)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
function equal(a:string,b:string){if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0;}
async function ipHash(req:Request){
  const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||"unknown";
  const day=new Date().toISOString().slice(0,10);
  return sha256(day+":"+ip);
}
function isBot(userAgent:string){
  return /(bot|crawler|spider|preview|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterestbot|googlebot|bingbot)/i.test(userAgent);
}
async function affiliateFromSession(req:Request){
  const raw=req.headers.get("x-affiliate-session")||"";if(raw.length<30)return null;
  const hash=await sha256(raw);const supabase=db();
  const {data:session}=await supabase.from("affiliate_sessions").select("id,affiliate_id,expires_at").eq("token_hash",hash).gt("expires_at",new Date().toISOString()).maybeSingle();
  if(!session)return null;
  await supabase.from("affiliate_sessions").update({last_seen_at:new Date().toISOString()}).eq("id",session.id);
  const {data:affiliate}=await supabase.from("affiliates").select("*").eq("id",session.affiliate_id).maybeSingle();
  if(!affiliate||affiliate.status!=="active")return null;
  return {supabase,session,affiliate};
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{error:"method_not_allowed"},405);
  if(!validKey(req))return json(origin,{error:"unauthorized"},401);
  let body:Record<string,unknown>;try{body=await req.json();}catch{return json(origin,{error:"invalid_json"},400);}
  const action=String(body.action||"");
  const supabase=db();

  if(action==="track"){
    const code=clean(body.code,50).toLowerCase();
    const visitorId=uuid(body.visitorId);
    if(!/^[a-z0-9][a-z0-9-]{2,49}$/.test(code)||!visitorId)return json(origin,{error:"invalid_tracking"},400);

    const {data:link}=await supabase.from("affiliate_links").select("id,affiliate_id,code,status").eq("code",code).maybeSingle();
    if(!link||link.status!=="active")return json(origin,{error:"link_not_found"},404);
    const {data:affiliate}=await supabase.from("affiliates").select("id,slug,status").eq("id",link.affiliate_id).maybeSingle();
    if(!affiliate||affiliate.status!=="active")return json(origin,{error:"affiliate_unavailable"},404);

    const source=clean(body.source,60).toLowerCase()||null;
    const landingPath=clean(body.landingPath,200)||"/";
    const referrerDomain=clean(body.referrerDomain,160).toLowerCase()||null;
    const userAgent=clean(req.headers.get("user-agent"),500);
    if(isBot(userAgent)){
      const expiresAt=new Date(Date.now()+10*60*1000).toISOString();
      return json(origin,{ok:true,tracked:false,bot:true,affiliateSlug:affiliate.slug,affiliateToken:randomToken(32),expiresAt});
    }
    const rawToken=randomToken(32);
    const tokenHash=await sha256(rawToken);
    const now=new Date();
    const expires=new Date(now.getTime()+30*24*60*60*1000).toISOString();

    const {data:attr,error:attrError}=await supabase.from("affiliate_attribution_tokens").insert({
      token_hash:tokenHash,affiliate_id:affiliate.id,link_id:link.id,visitor_id:visitorId,
      source,landing_path:landingPath,last_click_at:now.toISOString(),expires_at:expires,
    }).select("id").single();
    if(attrError||!attr)return json(origin,{error:"track_failed"},500);

    const uaHash=await sha256(userAgent);
    const {error:visitError}=await supabase.from("affiliate_visits").insert({
      affiliate_id:affiliate.id,link_id:link.id,attribution_token_id:attr.id,
      visitor_id:visitorId,source,landing_path:landingPath,referrer_domain:referrerDomain,
      user_agent_hash:uaHash,ip_hash:await ipHash(req),
    });
    if(visitError){
      await supabase.from("affiliate_attribution_tokens").delete().eq("id",attr.id);
      return json(origin,{error:"track_failed"},500);
    }

    return json(origin,{ok:true,affiliateSlug:affiliate.slug,affiliateToken:rawToken,expiresAt:expires});
  }

  if(action==="login"){
    const identifier=clean(body.identifier,180).toLowerCase();
    const password=clean(body.password,200);
    if(!identifier||password.length<8)return json(origin,{error:"invalid_credentials"},401);

    const fingerprint=await ipHash(req);
    const identifierHash=await sha256(identifier);
    const nowMs=Date.now();
    const windowMs=15*60*1000;
    const blockMs=30*60*1000;
    const {data:throttle}=await supabase.from("affiliate_login_throttles")
      .select("attempts,window_started_at,blocked_until")
      .eq("fingerprint",fingerprint)
      .eq("identifier_hash",identifierHash)
      .maybeSingle();

    if(throttle?.blocked_until&&new Date(throttle.blocked_until).getTime()>nowMs){
      await new Promise(r=>setTimeout(r,450));
      return json(origin,{error:"too_many_attempts"},429);
    }

    const windowStarted=throttle?.window_started_at?new Date(throttle.window_started_at).getTime():0;
    let attempts=windowStarted&&nowMs-windowStarted<windowMs?Number(throttle?.attempts||0):0;
    let windowStartedAt=attempts?new Date(windowStarted).toISOString():new Date(nowMs).toISOString();

    const failedLogin=async()=>{
      attempts+=1;
      const blockedUntil=attempts>=8?new Date(nowMs+blockMs).toISOString():null;
      await supabase.from("affiliate_login_throttles").upsert({
        fingerprint,identifier_hash:identifierHash,attempts,window_started_at:windowStartedAt,blocked_until:blockedUntil,updated_at:new Date().toISOString(),
      },{onConflict:"fingerprint,identifier_hash"});
      await new Promise(r=>setTimeout(r,450));
      return json(origin,{error:blockedUntil?"too_many_attempts":"invalid_credentials"},blockedUntil?429:401);
    };

    const query=supabase.from("affiliates").select("*").eq("status","active");
    const {data:affiliate}=identifier.includes("@")
      ? await query.eq("email",identifier).maybeSingle()
      : await query.eq("slug",identifier).maybeSingle();
    if(!affiliate)return await failedLogin();
    const expected=await passwordHash(password,affiliate.password_salt);
    if(!equal(expected,affiliate.password_hash))return await failedLogin();

    await supabase.from("affiliate_login_throttles").delete()
      .eq("fingerprint",fingerprint).eq("identifier_hash",identifierHash);
    await supabase.from("affiliate_sessions").delete().lt("expires_at",new Date().toISOString());
    const raw=randomToken(32),hash=await sha256(raw),expiresAt=new Date(Date.now()+7*24*60*60*1000).toISOString();
    const {error}=await supabase.from("affiliate_sessions").insert({affiliate_id:affiliate.id,token_hash:hash,expires_at:expiresAt});
    if(error)return json(origin,{error:"session_failed"},500);
    await supabase.from("affiliates").update({last_login_at:new Date().toISOString()}).eq("id",affiliate.id);
    return json(origin,{token:raw,expiresAt,mustChangePassword:Boolean(affiliate.password_must_change),affiliate:{slug:affiliate.slug,name:affiliate.name}});
  }
  if(action==="logout"){
    const raw=req.headers.get("x-affiliate-session")||"";if(raw){
      await supabase.from("affiliate_sessions").delete().eq("token_hash",await sha256(raw));
    }
    return json(origin,{ok:true});
  }

  if(action==="changePassword"){
    const auth=await affiliateFromSession(req);
    if(!auth)return json(origin,{error:"affiliate_session_required"},401);
    const password=clean(body.password,200);
    if(password.length<12||password==="tehiceesto7")return json(origin,{error:"weak_password"},400);
    const salt=randomToken(18),hash=await passwordHash(password,salt);
    const {error}=await auth.supabase.from("affiliates")
      .update({password_salt:salt,password_hash:hash,password_must_change:false,updated_at:new Date().toISOString()})
      .eq("id",auth.affiliate.id);
    if(error)return json(origin,{error:"password_change_failed"},500);
    await auth.supabase.from("affiliate_sessions")
      .delete().eq("affiliate_id",auth.affiliate.id).neq("id",auth.session.id);
    return json(origin,{ok:true});
  }
  if(action==="dashboard"){
    const auth=await affiliateFromSession(req);
    if(!auth)return json(origin,{error:"affiliate_session_required"},401);
    const {affiliate}=auth;
    if(affiliate.password_must_change)return json(origin,{error:"password_change_required"},403);

    const [{data:stats},{data:links},{data:commissions},{data:payouts},{data:visits},{data:attrs}]=await Promise.all([
      supabase.from("affiliate_stats").select("*").eq("id",affiliate.id).maybeSingle(),
      supabase.from("affiliate_links").select("id,code,label,status,created_at").eq("affiliate_id",affiliate.id).order("created_at",{ascending:true}),
      supabase.from("affiliate_commissions").select("id,order_id,payout_id,gross_amount_minor,commission_amount_minor,status,approved_at,paid_at,reversed_at,created_at").eq("affiliate_id",affiliate.id).order("created_at",{ascending:false}).limit(5000),
      supabase.from("affiliate_payouts").select("id,amount_minor,status,provider_reference,notes,period_from,period_to,paid_at,created_at,sales_count").eq("affiliate_id",affiliate.id).order("created_at",{ascending:false}).limit(100),
      supabase.from("affiliate_visits").select("visitor_id,source,created_at").eq("affiliate_id",affiliate.id).gte("created_at",new Date(Date.now()-30*24*60*60*1000).toISOString()).order("created_at",{ascending:true}).limit(10000),
      supabase.from("affiliate_order_attributions").select("order_id,source,attributed_at").eq("affiliate_id",affiliate.id).order("attributed_at",{ascending:false}).limit(5000),
    ]);

    const orderIds=(attrs||[]).map((x:any)=>x.order_id);
    const {data:orders}=orderIds.length?await supabase.from("orders").select("id,gift_id,status,amount_minor,paid_at").in("id",orderIds):{data:[] as any[]};
    const giftIds=(orders||[]).map((x:any)=>x.gift_id).filter(Boolean);
    const {data:gifts}=giftIds.length?await supabase.from("gifts").select("id,experience_slug").in("id",giftIds):{data:[] as any[]};
    const orderMap=new Map((orders||[]).map((x:any)=>[x.id,x]));
    const giftMap=new Map((gifts||[]).map((x:any)=>[x.id,x]));

    const days:any[]=[];
    for(let i=29;i>=0;i--){const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-i);days.push({date:d.toISOString().slice(0,10),clicks:0,uniqueVisitors:0,sales:0,revenueMinor:0});}
    const dayMap=new Map(days.map(x=>[x.date,x])),visitorSets=new Map<string,Set<string>>();
    for(const v of visits||[]){const key=String(v.created_at).slice(0,10),day=dayMap.get(key);if(!day)continue;day.clicks++;if(!visitorSets.has(key))visitorSets.set(key,new Set());visitorSets.get(key)!.add(v.visitor_id);}
    for(const [key,set] of visitorSets)dayMap.get(key)!.uniqueVisitors=set.size;
    for(const c of commissions||[]){if(c.status==="reversed")continue;const key=String(c.approved_at||"").slice(0,10),day=dayMap.get(key);if(day){day.sales++;day.revenueMinor+=Number(c.gross_amount_minor||0);}}

    const sources:Record<string,{clicks:number,sales:number}>={};
    for(const v of visits||[]){const key=v.source||"directo";sources[key]??={clicks:0,sales:0};sources[key].clicks++;}
    for(const a of attrs||[]){const order=orderMap.get(a.order_id) as any;if(order?.status==="approved"){const key=a.source||"directo";sources[key]??={clicks:0,sales:0};sources[key].sales++;}}

    const recentSales=(commissions||[]).slice(0,20).map((c:any)=>{
      const order=orderMap.get(c.order_id) as any;const gift=order?giftMap.get(order.gift_id) as any:null;
      return {id:c.id,date:c.approved_at,experienceSlug:gift?.experience_slug||"experiencia",saleAmountMinor:Number(c.gross_amount_minor||0),commissionAmountMinor:Number(c.commission_amount_minor||0),status:c.status,payoutId:c.payout_id||null};
    });

    return json(origin,{
      affiliate:{slug:affiliate.slug,name:affiliate.name,email:affiliate.email,commissionBps:affiliate.commission_bps,status:affiliate.status},
      stats:stats||{},links:links||[],series:days,sources,recentSales,payouts:payouts||[],updatedAt:new Date().toISOString(),
    });
  }

  return json(origin,{error:"unknown_action"},400);
});