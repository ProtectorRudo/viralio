import {createClient} from "npm:@supabase/supabase-js@2";
const endpoint=Deno.env.get("SUPABASE_URL")||"";
function defaultKey(key:string){try{const x=JSON.parse(Deno.env.get(key)||"{}");return typeof x.default==="string"?x.default:""}catch{return""}}
const secret=defaultKey("SUPABASE_SECRET_KEYS");
const keys=[defaultKey("SUPABASE_PUBLISHABLE_KEYS"),defaultKey("SUPABASE_ANON_KEYS")].filter(Boolean);
const hosts=new Set(["https://tehiceesto.com","https://www.tehiceesto.com","https://viralio.net","https://www.viralio.net"]);
function cors(origin:string|null){
 const allowed=origin&&(hosts.has(origin)||/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin));
 return {"access-control-allow-origin":allowed?origin!:"https://tehiceesto.com","access-control-allow-headers":"apikey,content-type,x-admin-session","access-control-allow-methods":"POST,OPTIONS","content-type":"application/json; charset=utf-8","cache-control":"no-store","vary":"Origin"};
}
function json(origin:string|null,payload:unknown,status=200){return new Response(JSON.stringify(payload),{status,headers:cors(origin)})}
function db(){return createClient(endpoint,secret,{auth:{persistSession:false,autoRefreshToken:false}})}
async function sha256(value:string){const x=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));return [...x].map(k=>k.toString(16).padStart(2,"0")).join("")}
async function isAdmin(req:Request){
 const token=req.headers.get("x-admin-session")||"";
 if(token.length<16||token.length>300)return false;
 const hash=await sha256(token);
 const {data,error}=await db().from("admin_sessions").select("id").eq("token_hash",hash).gt("expires_at",new Date().toISOString()).maybeSingle();
 return !error&&Boolean(data);
}
const text=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=="POST")return json(origin,{error:"method_not_allowed"},405);
 if(!keys.includes(req.headers.get("apikey")||""))return json(origin,{error:"unauthorized"},401);
 if(Number(req.headers.get("content-length")||0)>8000)return json(origin,{error:"too_long"},413);
 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>8000)return json(origin,{error:"too_long"},413);body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))throw Error("invalid")}catch{return json(origin,{error:"invalid_request"},400)}
 const action=String(body.action||"submit");
 if(action==="submit"){
   // Honeypot is non-blocking for real shoppers and reduces automated abuse.
   if(text(body.website,100))return json(origin,{error:"invalid_request"},400);
   const name=text(body.name,100),email=text(body.email,180).toLowerCase();
   const orderCode=text(body.orderCode,18).toLowerCase();
   const message=text(body.message,1000);
   if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(origin,{error:"contact_required"},400);
   if(orderCode&&!/^[a-f0-9]{18}$/.test(orderCode))return json(origin,{error:"invalid_order_code"},400);
   const cutoff=new Date(Date.now()-60*60*1000).toISOString();
   const {count,error:rateError}=await db().from("commerce_withdrawal_requests").select("id",{count:"exact",head:true}).eq("email",email).gte("created_at",cutoff);
   if(rateError)return json(origin,{error:"temporarily_unavailable"},503);
   if((count||0)>=3)return json(origin,{error:"rate_limited"},429);
   const code="THI-"+crypto.randomUUID().replaceAll("-","").slice(0,12).toUpperCase();
   const {error}=await db().from("commerce_withdrawal_requests").insert({
     ticket_code:code,name,email,order_code:orderCode||null,message:message||null,status:"received"
   });
   if(error)return json(origin,{error:"temporarily_unavailable"},503);
   return json(origin,{ok:true,ticketCode:code,receivedAt:new Date().toISOString()},201);
 }
 if(!await isAdmin(req))return json(origin,{error:"admin_session_required"},401);
 if(action==="list"){
   const {data,error}=await db().from("commerce_withdrawal_requests").select("id,ticket_code,name,email,order_code,message,status,admin_note,created_at,updated_at").order("created_at",{ascending:false}).limit(150);
   return error?json(origin,{error:"list_failed"},500):json(origin,{requests:data||[]});
 }
 if(action==="update"){
   const id=text(body.id,40),status=text(body.status,20),note=text(body.adminNote,1200);
   if(!/^[a-f0-9-]{36}$/.test(id)||!["received","reviewing","resolved","rejected"].includes(status))return json(origin,{error:"invalid_request"},400);
   const {error}=await db().from("commerce_withdrawal_requests").update({status,admin_note:note||null,updated_at:new Date().toISOString()}).eq("id",id);
   return error?json(origin,{error:"update_failed"},500):json(origin,{ok:true});
 }
 return json(origin,{error:"unknown_action"},400);
});
