import { createClient } from "npm:@supabase/supabase-js@2";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
function envDefault(name:string){try{const p=JSON.parse(Deno.env.get(name)||"{}");return typeof p.default==="string"?p.default:"";}catch{return "";}}
const SECRET=envDefault("SUPABASE_SECRET_KEYS");
const db=()=>createClient(SUPABASE_URL,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});
function cors(origin:string|null){const allowed=origin==="https://tehiceesto.com"||origin==="https://www.tehiceesto.com"||origin==="https://viralio.net"||origin==="https://www.viralio.net"||origin?.endsWith(".vercel.app")||origin?.startsWith("http://localhost:");return {"access-control-allow-origin":allowed?origin!:"https://tehiceesto.com","access-control-allow-headers":"content-type, apikey, x-admin-session","access-control-allow-methods":"POST, OPTIONS","content-type":"application/json; charset=utf-8","cache-control":"no-store"};}
function json(origin:string|null,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors(origin)});}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,"0")).join("");}
function validKey(req:Request){const supplied=req.headers.get("apikey")||"";return [envDefault("SUPABASE_PUBLISHABLE_KEYS"),envDefault("SUPABASE_ANON_KEYS")].filter(Boolean).includes(supplied);}
async function sessionValid(req:Request){const raw=req.headers.get("x-admin-session")||"";if(!raw)return false;const {data}=await db().from("admin_sessions").select("id").eq("token_hash",await sha256(raw)).gt("expires_at",new Date().toISOString()).maybeSingle();return Boolean(data);}
function slugify(v:unknown){return String(v||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,39);}
function randomPassword(){const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@";const b=new Uint8Array(16);crypto.getRandomValues(b);return Array.from(b).map(x=>alphabet[x%alphabet.length]).join("");}
function randomSalt(){const b=new Uint8Array(18);crypto.getRandomValues(b);return Array.from(b).map(x=>x.toString(16).padStart(2,"0")).join("");}
async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:120000,hash:"SHA-256"},key,256);return Array.from(new Uint8Array(bits)).map(x=>x.toString(16).padStart(2,"0")).join("");}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{error:"method_not_allowed"},405);
  if(!validKey(req))return json(origin,{error:"unauthorized"},401);
  if(!(await sessionValid(req)))return json(origin,{error:"admin_session_required"},401);
  let body:Record<string,unknown>;try{body=await req.json();}catch{return json(origin,{error:"invalid_json"},400);}
  const action=String(body.action||""),supabase=db();

  if(action==="list"){
    const {data,error}=await supabase.from("affiliate_stats").select("*").order("revenue_30d_minor",{ascending:false});
    if(error)return json(origin,{error:"list_failed"},500);
    const rows=data||[];
    const totals=rows.reduce((t:any,r:any)=>({clicks:t.clicks+Number(r.clicks||0),uniqueVisitors:t.uniqueVisitors+Number(r.unique_visitors||0),orders:t.orders+Number(r.attributed_orders||0),sales:t.sales+Number(r.approved_sales||0),revenueMinor:t.revenueMinor+Number(r.revenue_minor||0),commissionMinor:t.commissionMinor+Number(r.commission_earned_minor||0),pendingMinor:t.pendingMinor+Number(r.commission_pending_minor||0),availableMinor:t.availableMinor+Number(r.commission_available_minor||0),paidMinor:t.paidMinor+Number(r.commission_paid_minor||0)}),{clicks:0,uniqueVisitors:0,orders:0,sales:0,revenueMinor:0,commissionMinor:0,pendingMinor:0,availableMinor:0,paidMinor:0});
    return json(origin,{affiliates:rows,totals,updatedAt:new Date().toISOString()});
  }

  if(action==="create"){
    const name=String(body.name||"").trim().slice(0,100);
    const email=String(body.email||"").trim().toLowerCase().slice(0,180);
    const whatsapp=String(body.whatsapp||"").trim().slice(0,40)||null;
    const slug=slugify(body.slug||name);
    const commissionBps=Number(body.commissionBps??2000);
    if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||slug.length<3||/^[a-f0-9]{18}$/i.test(slug)||!Number.isInteger(commissionBps)||commissionBps<0||commissionBps>5000)return json(origin,{error:"invalid_input"},400);
    const initialPassword=String(body.password||"").trim()||"tehiceesto7";
    if(initialPassword.length<8)return json(origin,{error:"weak_password"},400);
    const salt=randomSalt(),hash=await passwordHash(initialPassword,salt);
    const {data:affiliate,error}=await supabase.from("affiliates").insert({slug,name,email,whatsapp,status:"active",commission_bps:commissionBps,password_salt:salt,password_hash:hash,password_must_change:true}).select("*").single();
    if(error||!affiliate)return json(origin,{error:String(error?.code)==="23505"?"affiliate_exists":"create_failed"},409);
    const {error:linkError}=await supabase.from("affiliate_links").insert({affiliate_id:affiliate.id,code:slug,label:"Principal",status:"active"});
    if(linkError){await supabase.from("affiliates").delete().eq("id",affiliate.id);return json(origin,{error:"link_create_failed"},500);}
    return json(origin,{affiliate,initialPassword,shareUrl:`https://tehiceesto.com/${slug}`,dashboardUrl:`https://tehiceesto.com/afiliados/${slug}`});
  }

  if(action==="update"){
    const id=String(body.id||"");const patch:any={updated_at:new Date().toISOString()};
    if(body.name!==undefined)patch.name=String(body.name||"").trim().slice(0,100);
    if(body.email!==undefined)patch.email=String(body.email||"").trim().toLowerCase().slice(0,180);
    if(body.whatsapp!==undefined)patch.whatsapp=String(body.whatsapp||"").trim().slice(0,40)||null;
    if(body.notes!==undefined)patch.notes=String(body.notes||"").trim().slice(0,1200)||null;
    if(body.status!==undefined&&["active","paused"].includes(String(body.status)))patch.status=String(body.status);
    if(body.commissionBps!==undefined){const n=Number(body.commissionBps);if(!Number.isInteger(n)||n<0||n>5000)return json(origin,{error:"invalid_commission"},400);patch.commission_bps=n;}
    const {data,error}=await supabase.from("affiliates").update(patch).eq("id",id).select("*").maybeSingle();
    if(error||!data)return json(origin,{error:"update_failed"},500);
    return json(origin,{affiliate:data});
  }

  if(action==="resetPassword"){
    const id=String(body.id||"");const password=String(body.password||"").trim()||"tehiceesto7";if(password.length<8)return json(origin,{error:"weak_password"},400);
    const salt=randomSalt(),hash=await passwordHash(password,salt);
    const {error}=await supabase.from("affiliates").update({password_salt:salt,password_hash:hash,password_must_change:true,updated_at:new Date().toISOString()}).eq("id",id);
    if(error)return json(origin,{error:"reset_failed"},500);
    await supabase.from("affiliate_sessions").delete().eq("affiliate_id",id);
    return json(origin,{password});
  }

  if(action==="payout"){
    const affiliateId=String(body.affiliateId||"");
    const providerReference=String(body.providerReference||"").trim().slice(0,160)||null;
    const notes=String(body.notes||"").trim().slice(0,500)||null;
    const rawCount=body.commissionCount;
    const commissionCount=rawCount===undefined||rawCount===null||rawCount===""?null:Number(rawCount);
    if(commissionCount!==null&&(!Number.isInteger(commissionCount)||commissionCount<1||commissionCount>10000)){
      return json(origin,{error:"invalid_commission_count"},400);
    }
    const {data,error}=await supabase.rpc("record_affiliate_payout_v2",{
      p_affiliate_id:affiliateId,
      p_provider_reference:providerReference,
      p_notes:notes,
      p_commission_count:commissionCount,
    });
    if(error){
      const message=String(error.message||"payout_failed");
      if(message.includes("no_pending_commissions"))return json(origin,{error:"nothing_to_pay"},409);
      if(message.includes("no_available_balance"))return json(origin,{error:"no_available_balance"},409);
      if(message.includes("payout_exceeds_available_balance"))return json(origin,{error:"payout_exceeds_available_balance"},409);
      if(message.includes("invalid_commission_count"))return json(origin,{error:"invalid_commission_count"},400);
      return json(origin,{error:"payout_failed"},409);
    }
    return json(origin,{ok:true,payout:data});
  }

  if(action==="detail"){
    const id=String(body.id||"");
    const [{data:stats},{data:links},{data:commissions},{data:payouts},{data:visits}]=await Promise.all([
      supabase.from("affiliate_stats").select("*").eq("id",id).maybeSingle(),
      supabase.from("affiliate_links").select("*").eq("affiliate_id",id).order("created_at",{ascending:true}),
      supabase.from("affiliate_commissions").select("id,order_id,payout_id,gross_amount_minor,commission_bps,commission_amount_minor,status,approved_at,paid_at,reversed_at,created_at").eq("affiliate_id",id).order("created_at",{ascending:false}).limit(5000),
      supabase.from("affiliate_payouts").select("*").eq("affiliate_id",id).order("created_at",{ascending:false}).limit(100),
      supabase.from("affiliate_visits").select("visitor_id,source,created_at").eq("affiliate_id",id).gte("created_at",new Date(Date.now()-30*24*60*60*1000).toISOString()).order("created_at",{ascending:true}).limit(10000),
    ]);
    if(!stats)return json(origin,{error:"not_found"},404);
    const series:any[]=[];for(let i=29;i>=0;i--){const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-i);series.push({date:d.toISOString().slice(0,10),clicks:0,uniqueVisitors:0});}
    const map=new Map(series.map(x=>[x.date,x])),sets=new Map<string,Set<string>>();
    for(const v of visits||[]){const key=String(v.created_at).slice(0,10),day=map.get(key);if(!day)continue;day.clicks++;if(!sets.has(key))sets.set(key,new Set());sets.get(key)!.add(v.visitor_id);}
    for(const [k,s] of sets)map.get(k)!.uniqueVisitors=s.size;
    const payoutHistory=payouts||[];
    return json(origin,{affiliate:stats,links:links||[],commissions:commissions||[],payouts:payoutHistory,series});
  }

  return json(origin,{error:"unknown_action"},400);
});