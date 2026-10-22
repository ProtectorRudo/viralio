/**
 * CIERRE outbound worker — DEPLOYED DISABLED. Never invoked by a schedule.
 * Live sending requires CIERRE_SEND_ENABLED=true, an internal Vault credential,
 * explicit tenant approval, a matching Meta-approved template, verified consent,
 * a fresh external sales check, PDF and conversation coverage.
 *
 * No blind resend after a timeout: unknown deliveries are marked "uncertain".
 */
const base=Deno.env.get("SUPABASE_URL")||"";
const encoder=new TextEncoder(),decoder=new TextDecoder();
function reply(data:Record<string,unknown>,status=200){
 return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
}
function key(){
 let legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(legacy)return legacy;
 try{legacy=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||"";}catch{/* no key */}
 return legacy;
}
async function rpc(secret:string,name:string,data:unknown={}):Promise<unknown>{
 const r=await fetch(base+"/rest/v1/rpc/"+name,{
  method:"POST",headers:{"apikey":secret,"Authorization":"Bearer "+secret,"Content-Type":"application/json"},
  body:JSON.stringify(data),cache:"no-store",signal:AbortSignal.timeout(12000)
 });
 if(!r.ok)throw Error("internal_rpc_unavailable_"+r.status);
 return r.json();
}
function fromB64(input:string){
 const s=atob(input.replace(/-/g,"+").replace(/_/g,"/"));
 return Uint8Array.from(s,c=>c.charCodeAt(0));
}
function decodeKey(){
 const bytes=fromB64(Deno.env.get("CIERRE_TOKEN_ENCRYPTION_KEY")||"");
 if(bytes.length!==32)throw Error("missing_or_invalid_encryption_key");
 return bytes;
}
async function decryptToken(ciphertext:string,keyBytes:Uint8Array){
 const parts=ciphertext.split(".");
 if(parts.length!==3)throw Error("invalid_meta_token");
 const iv=fromB64(parts[0]),tag=fromB64(parts[1]),body=fromB64(parts[2]);
 if(iv.length!==12||tag.length!==16)throw Error("invalid_meta_token");
 const content=new Uint8Array(body.length+tag.length);
 content.set(body,0);content.set(tag,body.length);
 const key=await crypto.subtle.importKey("raw",keyBytes,{name:"AES-GCM"},false,["decrypt"]);
 const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,content);
 return decoder.decode(plain);
}
async function decryptRecipient(ciphertext:string,keyBytes:Uint8Array,businessId:string,contactRef:string){
 const parts=ciphertext.split(".");
 if(parts.length!==3||parts[0]!=="v1")throw Error("invalid_encrypted_recipient");
 const iv=fromB64(parts[1]),body=fromB64(parts[2]);
 if(iv.length!==12||body.length<20)throw Error("invalid_encrypted_recipient");
 const key=await crypto.subtle.importKey("raw",keyBytes,{name:"AES-GCM"},false,["decrypt"]);
 const aad=encoder.encode("cierre:recipient:v1:"+businessId+":"+contactRef);
 const plaintext=await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:aad},key,body);
 const number=decoder.decode(plaintext);
 if(!/^\d{6,20}$/.test(number))throw Error("invalid_recipient_phone");
 return number;
}
type Claim={
 ready?:boolean;delivery_id?:string;business_id?:string;quote_id?:string;
 contact_ref?:string;phone_id?:string;template_name?:string;
 template_language?:string;recipient_cipher?:string;meta_token_cipher?:string;
};
Deno.serve(async(req)=>{
 if(req.method!=="POST")return reply({mode:"disabled",messages_sent:0},200);
 // Even a valid internal token cannot start live sending unless the operator
 // explicitly sets this secret environment switch after business approval.
 if(Deno.env.get("CIERRE_SEND_ENABLED")!=="true")
  return reply({mode:"disabled",messages_sent:0,reason:"operator_approval_required"},200);
 const admin=key(),authorization=(req.headers.get("authorization")||"").replace(/^Bearer /,"");
 if(!admin||!base)return reply({error:"database_unavailable"},503);
 if(authorization.length!==64||!/^[0-9a-f]{64}$/.test(authorization))
  return reply({error:"unauthorized"},401);
 const authorized=await rpc(admin,"cierre_verify_send_worker",{p_token:authorization}).catch(()=>false);
 if(authorized!==true)return reply({error:"unauthorized"},401);
 let payload:Claim;
 try{
  payload=await rpc(admin,"cierre_claim_one_safe_send") as Claim;
 }catch{return reply({error:"outbox_unavailable"},503);}
 if(!payload?.ready)return reply({mode:"shadow",claimed:0,messages_sent:0,reason:"no_safe_followups"});
 const id=String(payload.delivery_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return reply({error:"invalid_outbox_id"},503);
 async function finish(status:"sent"|"uncertain"|"failed",messageId:string|null=null){
  return rpc(admin,"cierre_complete_safe_send",{
   p_delivery_id:id,p_external_message_id:messageId,p_state:status
  }).catch(()=>null);
 }
 try{
  // Recheck conditions immediately before the irreversible Meta call.
  const stillSafe=await rpc(admin,"cierre_validate_claimed_send",{p_delivery_id:id});
  if(stillSafe!==true){
   await finish("failed");
   return reply({mode:"blocked",messages_sent:0,reason:"fresh_safety_check_failed"});
  }
  const keyBytes=decodeKey();
  const number=await decryptRecipient(String(payload.recipient_cipher||""),keyBytes,
   String(payload.business_id||""),String(payload.contact_ref||""));
  const providerToken=await decryptToken(String(payload.meta_token_cipher||""),keyBytes);
  const phoneId=String(payload.phone_id||"");
  const template=String(payload.template_name||"");
  const language=String(payload.template_language||"");
  if(!/^\d{5,35}$/.test(phoneId)||!/^[a-z0-9_]{1,128}$/.test(template)||
      !/^[a-z]{2}_[A-Z]{2}$/.test(language))throw Error("invalid_template_metadata");
  const body={
   messaging_product:"whatsapp",recipient_type:"individual",to:number,
   type:"template",template:{name:template,language:{code:language}}
  };
  const response=await fetch("https://graph.facebook.com/v26.0/"+phoneId+"/messages",{
   method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+providerToken},
   body:JSON.stringify(body),cache:"no-store",signal:AbortSignal.timeout(16000)
  });
  const answer=await response.json().catch(()=>null) as {messages?:Array<{id?:string}>}|null;
  const messageId=String(answer?.messages?.[0]?.id||"");
  if(response.ok&&/^wamid[.][a-zA-Z0-9_=.-]{5,250}$/.test(messageId)){
   const receipt=await finish("sent",messageId) as {ok?:boolean}|null;
   return reply({mode:"production",messages_sent:1,
    delivery_recorded:receipt?.ok===true,
    requires_reconciliation:receipt?.ok!==true});
  }
  // Distinguish neither transient errors nor 5xx by retrying: a request may
  // have been accepted even when the HTTP result was lost.
  await finish("uncertain");
  return reply({mode:"production",messages_sent:0,reason:"delivery_not_confirmed",review_required:true},202);
 }catch{
  await finish("uncertain");
  return reply({mode:"production",messages_sent:0,reason:"unknown_delivery_state",review_required:true},202);
 }
});
