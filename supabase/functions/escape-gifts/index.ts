import {createClient} from "npm:@supabase/supabase-js@2";
const dburl=Deno.env.get("SUPABASE_URL")||"";
function parseKey(name:string){try{const value=JSON.parse(Deno.env.get(name)||"{}");return typeof value.default==="string"?value.default:""}catch{return""}}
const secret=parseKey("SUPABASE_SECRET_KEYS");
const anonKeys=[parseKey("SUPABASE_PUBLISHABLE_KEYS"),parseKey("SUPABASE_ANON_KEYS")].filter(Boolean);
function db(){return createClient(dburl,secret,{auth:{persistSession:false,autoRefreshToken:false}})}
const trusted=new Set(["https://tehiceesto.com","https://www.tehiceesto.com","https://viralio.net"]);
function cors(origin:string|null){const allowed=origin&& (trusted.has(origin)||/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin));return {"access-control-allow-origin":allowed?origin!:"https://tehiceesto.com","access-control-allow-headers":"apikey,content-type,x-admin-session","access-control-allow-methods":"POST,OPTIONS","cache-control":"no-store","content-type":"application/json; charset=utf-8","vary":"Origin"}}
function json(origin:string|null,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:cors(origin)})}
async function sha256(value:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return [...new Uint8Array(d)].map(v=>v.toString(16).padStart(2,"0")).join("")}
async function adminValid(req:Request){const token=req.headers.get("x-admin-session")||"";if(token.length<16||token.length>300)return false;const hash=await sha256(token);const{data,error}=await db().from("admin_sessions").select("id").eq("token_hash",hash).gt("expires_at",new Date().toISOString()).maybeSingle();return !error&&Boolean(data)}
type Room="caso-m"|"ultima-funcion"|"ultima-campanada";
const rooms=new Set<Room>(["caso-m","ultima-funcion","ultima-campanada"]);
type Field={key:string,max:number,mandatory?:boolean};
const common:Field[]=[{key:"nombre",max:55,mandatory:true},{key:"evento",max:95,mandatory:true},{key:"fecha",max:80},{key:"hora",max:80},{key:"lugar",max:125},{key:"mensaje",max:650,mandatory:true},{key:"firma",max:90},{key:"rsvp",max:18}];
const fieldList:Record<Room,Field[]>={"caso-m":[...common,{key:"codigo",max:6,mandatory:true},{key:"voz",max:950}],"ultima-funcion":common,"ultima-campanada":[{key:"nombre",max:55,mandatory:true},{key:"firma",max:90,mandatory:true},{key:"pregunta",max:190,mandatory:true},{key:"mensaje",max:650,mandatory:true},{key:"fecha",max:80},{key:"lugar",max:125},{key:"rsvp",max:18},{key:"voz",max:950}]};
function isRoom(slug:string):slug is Room{return rooms.has(slug as Room)}
function validate(room:Room,values:unknown){
 if(!values||typeof values!=="object"||Array.isArray(values))throw Error("invalid_config");
 const input=values as Record<string,unknown>,out:Record<string,string>={};
 for(const f of fieldList[room]){
 const original=input[f.key];
 if(typeof original!=="string"&&original!==undefined&&original!==null)throw Error("invalid_"+f.key);
 const str=typeof original==="string"?original.trim():"";
 if(str.length>f.max)throw Error("too_long_"+f.key);
 if(f.mandatory&&!str)throw Error("missing_"+f.key);
 if(f.key==="codigo"&&!/^\d{6}$/.test(str))throw Error("invalid_lock_code");
 if(f.key==="voz"&&str&&!/^https:\/\/[^\s]+$/.test(str))throw Error("invalid_voice_url");
 out[f.key]=f.key==="rsvp"?str.replace(/\D/g,""):str;
 }
 return out;
}
function cleanCode(v:unknown){const code=String(v||"").trim().toLowerCase();if(!/^[a-f0-9]{18}$/.test(code))throw Error("invalid_code");return code}
function roomOf(slug:string){const value=slug.replace(/^escape-/,"");return isRoom(value)&&slug==="escape-"+value?value:null}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=="POST")return json(origin,{error:"method_not_allowed"},405);
 if(!anonKeys.includes(req.headers.get("apikey")||""))return json(origin,{error:"unauthorized"},401);
 let input:Record<string,unknown>;
 try{input=await req.json()}catch{return json(origin,{error:"invalid_json"},400)}
 const action=String(input.action||"");
 const supabase=db();
 try{
  if(action==="publicRead"){
   const code=cleanCode(input.code);
   const {data,error}=await supabase.from("gifts").select("experience_slug,story_data,status,expires_at").eq("public_code",code).eq("status","published").maybeSingle();
   if(error)return json(origin,{error:"read_failed"},500);
   if(!data)return json(origin,{error:"not_found"},404);
   if(data.expires_at&&Date.parse(data.expires_at)<Date.now())return json(origin,{error:"not_found"},404);
   const room=roomOf(String(data.experience_slug||""));
   if(!room)return json(origin,{error:"not_found"},404);
   const config=validate(room,data.story_data?.escapeConfig);
   return json(origin,{room,config});
  }
  if(!(await adminValid(req)))return json(origin,{error:"admin_session_required"},401);
  if(action==="list"){
   const {data,error}=await supabase.from("gifts").select("public_code,status,experience_slug,recipient_name,giver_name,created_at,published_at").like("experience_slug","escape-%").order("created_at",{ascending:false}).limit(100);
   return error?json(origin,{error:"list_failed"},500):json(origin,{gifts:data||[]});
  }
  if(action==="create"){
   const room=String(input.room||"");if(!isRoom(room))return json(origin,{error:"invalid_room"},400);
   const values=validate(room,input.config);
   const {data,error}=await supabase.from("gifts").insert({
    status:"draft",experience_slug:"escape-"+room,giver_name:values.firma||"Alguien especial",
    recipient_name:values.nombre,occasion:values.evento||"Invitación especial",feeling:"Sorpresa",
    opening_text:"Un misterio que lleva a un mensaje para vos.",letter_text:values.mensaje,
    closing_text:values.mensaje,scene_recipe:[],story_data:{escapeConfig:values,escapeRoomVersion:"v1"},
    theme_data:{accent:room==="caso-m"?"#dcaa7b":room==="ultima-funcion"?"#aa7ab9":"#df9a9c"}
   }).select("public_code").single();
   return error||!data?json(origin,{error:"create_failed"},500):json(origin,{code:data.public_code});
  }
  if(action==="get"||action==="save"||action==="publish"||action==="unpublish"){
   const code=cleanCode(input.code);
   const {data,error}=await supabase.from("gifts").select("public_code,experience_slug,status,story_data,recipient_name,giver_name,created_at").eq("public_code",code).maybeSingle();
   if(error)return json(origin,{error:"read_failed"},500);
   if(!data)return json(origin,{error:"not_found"},404);
   const room=roomOf(String(data.experience_slug||""));
   if(!room)return json(origin,{error:"not_found"},404);
   if(action==="get")return json(origin,{gift:{...data,room}});
   if(action==="save"){
    const values=validate(room,input.config);
    const {error:writeError}=await supabase.from("gifts").update({
     giver_name:values.firma||data.giver_name||"Alguien especial",recipient_name:values.nombre,occasion:values.evento||"Invitación especial",
     letter_text:values.mensaje,closing_text:values.mensaje,
     story_data:{...(data.story_data&&typeof data.story_data==="object"?data.story_data:{}),escapeConfig:values,escapeRoomVersion:"v1"}
    }).eq("public_code",code);
    return writeError?json(origin,{error:"save_failed"},500):json(origin,{ok:true});
   }
   const publish=action==="publish";
   if(publish&&data.status==="awaiting_payment")return json(origin,{error:"payment_required"},409);
   const {error:writeError}=await supabase.from("gifts").update({status:publish?"published":"draft",published_at:publish?new Date().toISOString():null}).eq("public_code",code);
   return writeError?json(origin,{error:"publish_failed"},500):json(origin,{ok:true});
  }
  return json(origin,{error:"unknown_action"},400);
 }catch(e){const message=e instanceof Error?e.message:"invalid_input";return json(origin,{error:message},400)}
});
