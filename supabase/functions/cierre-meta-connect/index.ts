// Official Meta Embedded Signup completion for CIERRE.
// GET provides PUBLIC SDK config status; POST requires Supabase user JWT and
// ownership validation, then verifies WABA phone against Graph API.
// Meta token stored AES-256-GCM encrypted. No WhatsApp messages are sent.
const enc=new TextEncoder();
function cors(origin:string|null){
 return ["https://protectorrudo.github.io","https://viralio.net","https://www.viralio.net"].includes(origin||"")?{
  "Access-Control-Allow-Origin":origin!,"Vary":"Origin",
  "Access-Control-Allow-Headers":"authorization,content-type,apikey",
  "Access-Control-Allow-Methods":"GET,POST,OPTIONS"
 }:{};
}
function res(obj:Record<string,unknown>,status=200,origin:string|null=null){
 return new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store",...cors(origin)}});
}
function keys(){
 let secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",publicKey=Deno.env.get("SUPABASE_ANON_KEY")||"";
 try{if(!secret)secret=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||"";}catch{/* unconfigured */}
 try{if(!publicKey)publicKey=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||"";}catch{/* unconfigured */}
 return {secret,publicKey};
}
async function backend(base:string,key:string,path:string,init:RequestInit={}){
 const r=await fetch(base+"/rest/v1/"+path,{
  ...init,cache:"no-store",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...init.headers}
 });
 if(!r.ok)throw Error("database_"+r.status);
 return await r.json().catch(()=>null);
}
function fromB64(s:string){
 const a=atob(s.replace(/-/g,"+").replace(/_/g,"/"));
 return Uint8Array.from(a,c=>c.charCodeAt(0));
}
function b64url(a:Uint8Array){return btoa(String.fromCharCode(...a)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");}
async function encryptToken(token:string,secret:string){
 const bytes=fromB64(secret);
 if(bytes.length!==32)throw Error("invalid_encryption_key");
 const key=await crypto.subtle.importKey("raw",bytes,{name:"AES-GCM"},false,["encrypt"]);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(token)));
 const cipher=encrypted.subarray(0,encrypted.length-16),tag=encrypted.subarray(encrypted.length-16);
 return [b64url(iv),b64url(tag),b64url(cipher)].join(".");
}
async function proof(token:string,secret:string){
 const k=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=await crypto.subtle.sign("HMAC",k,enc.encode(token));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS"){
  if(!Object.keys(cors(origin)).length)return res({error:"origin_denied"},403);
  return new Response(null,{status:204,headers:cors(origin)});
 }
 const appId=Deno.env.get("CIERRE_META_APP_ID")||"";
 const configId=Deno.env.get("CIERRE_META_CONFIG_ID")||"";
 const appSecret=Deno.env.get("CIERRE_META_APP_SECRET")||"";
 const encryption=Deno.env.get("CIERRE_TOKEN_ENCRYPTION_KEY")||"";
 const url=Deno.env.get("SUPABASE_URL")||"",key=keys();
 const ready=Boolean(appId&&configId&&appSecret&&encryption&&
   Deno.env.get("CIERRE_META_VERIFY_TOKEN")&&key.secret&&key.publicKey);
 if(req.method==="GET")return res({ready,app_id:ready?appId:null,config_id:ready?configId:null,
   mode:"shadow",version:"v4"},200,origin);
 if(req.method!=="POST")return res({error:"method_not_allowed"},405,origin);
 if(!Object.keys(cors(origin)).length)return res({error:"origin_denied"},403);
 if(!ready)return res({error:"meta_not_configured"},503,origin);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer /,"");
 if(!token||token.length>10000)return res({error:"login_required"},401,origin);
 let owner:string;
 try{
  const user=await fetch(url+"/auth/v1/user",{headers:{apikey:key.publicKey,Authorization:"Bearer "+token},
   signal:AbortSignal.timeout(9000),cache:"no-store"});
  if(!user.ok)return res({error:"invalid_login"},401,origin);
  const who=await user.json() as {id?:string};
  if(!who.id)return res({error:"invalid_login"},401,origin);
  owner=who.id;
 }catch{return res({error:"login_verification_unavailable"},503,origin);}
 let body:{business_id?:unknown;code?:unknown;waba_id?:unknown;phone_number_id?:unknown};
 try{body=await req.json();}catch{return res({error:"invalid_json"},400,origin);}
 const businessId=String(body.business_id||""),code=String(body.code||"");
 const waba=String(body.waba_id||""),phone=String(body.phone_number_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(businessId)||code.length<8||code.length>3000||
  !/^\d{5,35}$/.test(waba)||!/^\d{5,35}$/.test(phone))
  return res({error:"invalid_request"},400,origin);
 try{
  const own=await backend(url,key.secret,"cierre_businesses?select=id&id=eq."+businessId+
    "&owner_id=eq."+owner+"&limit=1") as {id:string}[];
  if(!own?.length)return res({error:"business_not_owned"},403,origin);
  const exchange=await fetch("https://graph.facebook.com/v26.0/oauth/access_token",{
   method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({client_id:appId,client_secret:appSecret,code}),
   signal:AbortSignal.timeout(15000),cache:"no-store"
  });
  if(!exchange.ok)return res({error:"meta_authorization_failed"},502,origin);
  const grant=await exchange.json() as {access_token?:string;expires_in?:number};
  if(!grant.access_token||grant.access_token.length<20)return res({error:"no_meta_token"},502,origin);
  const tokenProof=await proof(grant.access_token,appSecret);
  const phonesURL=new URL("https://graph.facebook.com/v26.0/"+waba+"/phone_numbers");
  phonesURL.searchParams.set("fields","id,display_phone_number");
  phonesURL.searchParams.set("appsecret_proof",tokenProof);
  phonesURL.searchParams.set("limit","100");
  const phones=await fetch(phonesURL,{headers:{Authorization:"Bearer "+grant.access_token},
   cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!phones.ok)return res({error:"meta_phone_lookup_failed"},502,origin);
  const payload=await phones.json() as {data?:Array<{id?:string;display_phone_number?:string}>};
  const verified=payload.data?.find(p=>p.id===phone);
  if(!verified)return res({error:"phone_not_in_waba"},403,origin);
  const sub=await fetch("https://graph.facebook.com/v26.0/"+waba+"/subscribed_apps",{
   method:"POST",headers:{Authorization:"Bearer "+grant.access_token,"Content-Type":"application/json"},
   body:JSON.stringify({appsecret_proof:tokenProof}),
   cache:"no-store",signal:AbortSignal.timeout(15000)
  });
  if(!sub.ok || !(await sub.json() as {success?:boolean}).success)
   return res({error:"meta_webhook_subscription_failed"},502,origin);
  const ciphertext=await encryptToken(grant.access_token,encryption);
  const expires=grant.expires_in && grant.expires_in>0?new Date(Date.now()+grant.expires_in*1000).toISOString():null;
  const display=verified.display_phone_number||"";
  const masked=display.length>=4?"•••• "+display.slice(-4):"Número verificado";
  await backend(url,key.secret,"rpc/cierre_confirm_meta_connection",{
   method:"POST",body:JSON.stringify({p_business_id:businessId,p_phone_id:phone,p_waba_id:waba,
    p_phone_masked:masked,p_encrypted_token:ciphertext,p_expires_at:expires})
  });
  return res({ok:true,state:"connected",requires_coverage_test:true,mode:"shadow",messages_sent:0},200,origin);
 }catch{return res({error:"meta_signup_incomplete"},503,origin);}
});
