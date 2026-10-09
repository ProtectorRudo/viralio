import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;

function defaultKey(envName:string){
  try{
    const parsed=JSON.parse(Deno.env.get(envName)||"{}");
    return typeof parsed.default==="string"?parsed.default:"";
  }catch{return ""}
}

const SECRET_KEY=defaultKey("SUPABASE_SECRET_KEYS");
const PUBLIC_KEY=defaultKey("SUPABASE_PUBLISHABLE_KEYS")||defaultKey("SUPABASE_ANON_KEYS");

function adminClient(){
  return createClient(SUPABASE_URL,SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}

function cors(origin:string|null){
  const allowed=
    origin==="https://tehiceesto.com"||
    origin==="https://www.tehiceesto.com"||
    origin==="https://viralio.net"||
    origin?.endsWith(".vercel.app")||
    origin?.startsWith("http://localhost:");
  return {
    "access-control-allow-origin":allowed?origin!:"https://tehiceesto.com",
    "access-control-allow-headers":"apikey, authorization, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
  };
}

function json(origin:string|null,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:cors(origin)});
}

function validPublishableKey(req:Request){
  const supplied=req.headers.get("apikey")||"";
  return [defaultKey("SUPABASE_PUBLISHABLE_KEYS"),defaultKey("SUPABASE_ANON_KEYS")]
    .filter(Boolean).includes(supplied);
}

function normalizeEmail(value:unknown){
  const email=String(value||"").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:"";
}

function cleanCode(value:unknown){
  const code=String(value||"").trim().toLowerCase();
  if(!/^[a-f0-9]{18}$/.test(code))throw new Error("invalid_code");
  return code;
}

function newStudioToken(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

async function sha256(value:string){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

async function authenticatedEmail(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.replace(/^Bearer\s+/i,"").trim();
  if(!token)return "";
  const {data,error}=await adminClient().auth.getUser(token);
  if(error||!data.user?.email)return "";
  return normalizeEmail(data.user.email);
}


const EXPERIENCE_NAMES:Record<string,string>={
  pareja:"para tu pareja",mama:"para mamá",papa:"para papá",abuelos:"para tus abuelos",
  cumpleanos:"de cumpleaños",cumple:"de cumpleaños",amistad:"para una amistad",
  propuesta:"para una propuesta especial",aniversario:"de aniversario",
};
function safeHtml(value:unknown){
  return String(value||"").replace(/[&<>"']/g,(character)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;",
  }[character]||character));
}
function premiumMail(name:string,experience:string,actionLink:string,isPurchase:boolean){
  const firstName=safeHtml(name.trim().split(/\s+/)[0]||"");
  const experienceName=safeHtml(EXPERIENCE_NAMES[experience]||"personalizada");
  const link=safeHtml(actionLink);
  const title=isPurchase?"Tu regalo ya está esperando que lo hagas tuyo.":"Tus recuerdos siguen esperándote.";
  const intro=isPurchase
    ?"Gracias por confiar en Te Hice Esto. Tu compra está confirmada. Ahora empieza la parte más linda: transformar una idea en algo que alguien va a recordar para siempre."
    :"Preparamos un acceso privado para que puedas continuar creando, editar o volver a compartir tus experiencias.";
  const greeting=firstName?"Hola, "+firstName+".":"Hola.";
  const button=isPurchase?"Empezar a crear mi regalo":"Entrar a mis regalos";
  const html=[
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    '<body style="margin:0;background:#f5f1ec;color:#292321;font-family:Arial,Helvetica,sans-serif;">',
    '<div style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">',
    isPurchase?'Tu pago fue confirmado. Tu experiencia privada está lista para personalizar.':'Tu acceso privado a Te Hice Esto está listo.',
    '</div><div style="padding:34px 12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;margin:auto;border:1px solid #e9e0d7;background:#fffdf9;border-radius:20px;overflow:hidden;">',
    '<tr><td style="padding:36px 32px 22px;text-align:center;"><div style="font-size:12px;font-weight:700;letter-spacing:3px;color:#7d5853;">TE HICE ESTO</div>',
    '<div style="width:44px;height:1px;background:#d8a79d;margin:22px auto 0;"></div></td></tr>',
    '<tr><td style="padding:8px 38px 30px;"><div style="font-size:14px;color:#966e69;margin-bottom:14px;">',greeting,'</div>',
    '<h1 style="font-size:31px;line-height:1.18;letter-spacing:-.8px;font-family:Georgia,serif;font-weight:400;margin:0 0 22px;color:#302522;">',title,'</h1>',
    '<p style="font-size:15px;line-height:1.85;color:#685d57;margin:0 0 17px;">',intro,'</p>',
    isPurchase?'<p style="font-size:14px;color:#88685e;margin:0 0 22px;">Tu experiencia '+experienceName+' ya tiene su espacio reservado. Podés agregar tus palabras, fotos y audios a tu ritmo.</p>':'',
    '<div style="text-align:center;padding:14px 0 26px;"><a href="',link,'" style="background:#382a29;border-radius:40px;color:#ffffff;display:inline-block;font-weight:700;text-decoration:none;padding:17px 30px;font-size:14px;">',button,' &nbsp;→</a></div>',
    '<p style="color:#817772;font-size:13px;line-height:1.75;margin:0;">El acceso es personal. Por seguridad, no compartas este correo. No necesitás instalar nada ni recordar una contraseña.</p>',
    '</td></tr><tr><td style="padding:26px 32px;background:#f9f4ee;text-align:center;">',
    '<p style="font-family:Georgia,serif;font-style:italic;color:#6a5551;font-size:17px;margin:0 0 12px;">Hay cosas que merecen algo más que un mensaje.</p>',
    '<p style="font-size:12px;line-height:1.8;color:#94837b;margin:0;">¿Necesitás ayuda? Escribinos por WhatsApp: +54 9 221 565-3163.<br>Con cariño, el equipo de Te Hice Esto.</p>',
    '</td></tr></table></div></body></html>'
  ].join("");
  const text=[greeting,title,intro,
    isPurchase?"Tu experiencia "+(EXPERIENCE_NAMES[experience]||"personalizada")+" está lista para personalizar.":"",
    button+": "+actionLink,
    "Este enlace es privado. No lo compartas.",
    "¿Necesitás ayuda? WhatsApp: +54 9 221 565-3163.",
    "Con cariño, Te Hice Esto."].filter(Boolean).join("\n\n");
  return {html,text,subject:isPurchase?"Gracias por elegir Te Hice Esto ♥ Tu regalo te espera":"Tu acceso privado a Te Hice Esto ♥"};
}
async function sendCustomAccessEmail(email:string,redirect:string,code:string,orderGiftId:string){
  let apiKey=(Deno.env.get("RESEND_API_KEY")||"").trim();
  const db=adminClient();
  if(!apiKey){
    const {data,error}=await db.rpc("tehiceesto_private_resend_key");
    if(error){
      console.error("thi_email_secret_lookup_failed",error.code||"rpc_error");
      return {ok:false,status:503};
    }
    apiKey=String(data||"").trim();
  }
  if(!apiKey)return null; // Legacy transport only while no provider has been configured.
  let gift:any=null;
  if(code){
    const {data}=await db.from("gifts").select("id,public_code,giver_name,experience_slug")
      .eq("public_code",code).maybeSingle();
    if(data){
      const {data:owned}=await db.from("orders").select("id").eq("gift_id",data.id)
        .eq("buyer_email",email).eq("status","approved").limit(1).maybeSingle();
      if(owned)gift=data;
    }
  }
  if(!gift&&orderGiftId){
    const {data}=await db.from("gifts").select("id,public_code,giver_name,experience_slug")
      .eq("id",orderGiftId).maybeSingle();
    if(data&&!code)gift=data;
  }
  const safeRedirect=new URL("https://tehiceesto.com/mis-regalos");
  if(gift?.public_code&&code)safeRedirect.searchParams.set("regalo",gift.public_code);
  const {data:link,error:linkError}=await db.auth.admin.generateLink({
    type:"magiclink",email,options:{redirectTo:safeRedirect.toString()},
  });
  // Deliver a first-party URL with a one-time token hash. Never email Supabase's
  // action_link: its redirect may fall back to the auth project's localhost SITE_URL.
  const hashedToken=String(link?.properties?.hashed_token||"").trim();
  if(linkError||!hashedToken||!/^[a-f0-9]{32,128}$/i.test(hashedToken)){
    console.error("thi_access_generate_link_failed",linkError?.message||"missing_hashed_token");
    return {ok:false,status:503};
  }
  const brandedAccess=new URL("https://tehiceesto.com/mis-regalos");
  if(gift?.public_code&&code)brandedAccess.searchParams.set("regalo",gift.public_code);
  brandedAccess.hash=new URLSearchParams({token_hash:hashedToken,type:"magiclink"}).toString();
  const mail=premiumMail(String(gift?.giver_name||""),String(gift?.experience_slug||""),
    brandedAccess.toString(),Boolean(code));
  const sender=(Deno.env.get("TEHICEESTO_EMAIL_FROM")||"Te Hice Esto <hola@tehiceesto.com>").trim();
  try{
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"authorization":"Bearer "+apiKey,"content-type":"application/json"},
      body:JSON.stringify({
        from:sender,to:[email],
        ...(code?{
          template:{id:"tehiceesto-bienvenida-compra",variables:{
            CUSTOMER_NAME:String(gift?.giver_name||"").trim().split(/\s+/)[0]||"Hola",
            EXPERIENCE_NAME:EXPERIENCE_NAMES[String(gift?.experience_slug||"")]||"personalizada",
            ACCESS_LINK:brandedAccess.toString(),
          }},
        }:{subject:mail.subject,html:mail.html,text:mail.text}),
        reply_to:"hola@tehiceesto.com",
        tags:[{name:"product",value:"tehiceesto"},{name:"flow",value:code?"purchase":"account_recovery"}],
      }),
      signal:AbortSignal.timeout(12000),
    });
    if(!response.ok){
      console.error("thi_email_provider_rejected",response.status);
      return {ok:false,status:503};
    }
    return {ok:true,status:200};
  }catch{
    console.error("thi_email_provider_unreachable");
    return {ok:false,status:503};
  }
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{error:"method_not_allowed"},405);
  if(!validPublishableKey(req))return json(origin,{error:"unauthorized"},401);

  let body:Record<string,unknown>;
  try{body=await req.json()}catch{return json(origin,{error:"invalid_json"},400)}
  const action=String(body.action||"");

  if(action==="requestLink"){
    const email=normalizeEmail(body.email);
    if(!email)return json(origin,{error:"invalid_email"},400);

    const db=adminClient();
    const {data:order}=await db
      .from("orders")
      .select("id,gift_id")
      .eq("buyer_email",email)
      .eq("status","approved")
      .limit(1)
      .maybeSingle();

    // Never reveal whether an email has purchases.
    if(!order)return json(origin,{ok:true});

    let giftCode="";
    try{giftCode=body.code?cleanCode(body.code):""}catch{giftCode=""}
    const redirect=new URL("https://tehiceesto.com/mis-regalos");
    if(giftCode)redirect.searchParams.set("regalo",giftCode);

    try{
      const premium=await sendCustomAccessEmail(email,redirect.toString(),giftCode,String(order.gift_id||""));
      if(premium)return json(origin,premium.ok?{ok:true}:{error:"email_unavailable"},premium.status);
      const response=await fetch(
        `${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect.toString())}`,
        {
          method:"POST",
          headers:{"apikey":PUBLIC_KEY,"content-type":"application/json"},
          body:JSON.stringify({email,create_user:true}),
          signal:AbortSignal.timeout(12000),
        },
      );
      if(!response.ok){
        const status=response.status===429?429:503;
        return json(origin,{error:status===429?"email_rate_limited":"email_unavailable"},status);
      }
      return json(origin,{ok:true});
    }catch{
      return json(origin,{error:"email_unavailable"},503);
    }
  }

  const email=await authenticatedEmail(req);
  if(!email)return json(origin,{error:"account_unauthorized"},401);

  if(action==="list"){
    const db=adminClient();
    const {data:orders,error:ordersError}=await db
      .from("orders")
      .select("gift_id,status,created_at,paid_at")
      .eq("buyer_email",email)
      .eq("status","approved")
      .order("created_at",{ascending:false})
      .limit(50);
    if(ordersError)return json(origin,{error:"account_list_failed"},500);

    const ids=[...new Set((orders||[]).map(item=>item.gift_id).filter(Boolean))];
    if(!ids.length)return json(origin,{email,gifts:[]});

    const {data:gifts,error:giftsError}=await db
      .from("gifts")
      .select("id,public_code,status,experience_slug,giver_name,recipient_name,published_at,created_at")
      .in("id",ids);
    if(giftsError)return json(origin,{error:"account_list_failed"},500);

    const byId=new Map((gifts||[]).map(gift=>[gift.id,gift]));
    const result=(orders||[]).map(order=>{
      const gift=byId.get(order.gift_id);
      if(!gift)return null;
      return {
        code:gift.public_code,
        status:gift.status,
        experienceSlug:gift.experience_slug,
        giverName:gift.giver_name,
        recipientName:gift.recipient_name,
        publishedAt:gift.published_at,
        purchasedAt:order.paid_at||order.created_at,
      };
    }).filter(Boolean);

    return json(origin,{email,gifts:result});
  }

  if(action==="open"){
    let code:string;
    try{code=cleanCode(body.code)}catch{return json(origin,{error:"invalid_code"},400)}
    const db=adminClient();

    const {data:gift}=await db
      .from("gifts")
      .select("id,story_data")
      .eq("public_code",code)
      .maybeSingle();
    if(!gift)return json(origin,{error:"gift_not_found"},404);

    const {data:order}=await db
      .from("orders")
      .select("id")
      .eq("gift_id",gift.id)
      .eq("buyer_email",email)
      .eq("status","approved")
      .limit(1)
      .maybeSingle();
    if(!order)return json(origin,{error:"gift_not_found"},404);

    const rawStory=gift.story_data&&typeof gift.story_data==="object"&&!Array.isArray(gift.story_data)
      ?gift.story_data as Record<string,unknown>
      :{};
    const rawCreator=rawStory.creator&&typeof rawStory.creator==="object"&&!Array.isArray(rawStory.creator)
      ?rawStory.creator as Record<string,unknown>
      :{};

    const editorToken=newStudioToken();
    const editorTokenHash=await sha256(editorToken);
    const existingHashes:string[]=[];
    const primaryHash=String(rawCreator.editorTokenHash||"").trim().toLowerCase();
    if(/^[a-f0-9]{64}$/.test(primaryHash))existingHashes.push(primaryHash);
    if(Array.isArray(rawCreator.editorTokenHashes)){
      for(const item of rawCreator.editorTokenHashes){
        const hash=String(item||"").trim().toLowerCase();
        if(/^[a-f0-9]{64}$/.test(hash)&&!existingHashes.includes(hash))existingHashes.push(hash);
      }
    }
    const editorTokenHashes=[...existingHashes.filter(hash=>hash!==editorTokenHash),editorTokenHash].slice(-8);
    const creator={
      ...rawCreator,
      editorTokenHash,
      editorTokenHashes,
      accountOpenedAt:new Date().toISOString(),
    };

    const {error}=await db
      .from("gifts")
      .update({story_data:{...rawStory,creator}})
      .eq("id",gift.id);
    if(error)return json(origin,{error:"account_open_failed"},500);

    return json(origin,{ok:true,editorToken,code});
  }

  return json(origin,{error:"unknown_action"},400);
});
