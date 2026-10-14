export type EscapeField={key:string;label:string;max?:number;multiline?:boolean;required?:boolean;hint?:string;defaultValue?:string};
export type EscapeRoom={slug:string;title:string;subtitle:string;eyebrow:string;description:string;accent:string;url:string;duration:string;fields:EscapeField[]};
const common=[
 {key:"nombre",label:"Nombre de la persona protagonista",max:55,required:true},
 {key:"evento",label:"Título de la celebración",max:95,required:true},
 {key:"fecha",label:"Fecha del encuentro",max:80},
 {key:"hora",label:"Horario",max:80},
 {key:"lugar",label:"Lugar",max:125},
 {key:"mensaje",label:"Mensaje o dedicatoria final",max:650,multiline:true,required:true},
 {key:"firma",label:"Firma de quien invita",max:90},
 {key:"rsvp",label:"WhatsApp para confirmar (con código de país)",max:18},
] satisfies EscapeField[];
export const escapeRooms:EscapeRoom[]=[
 {slug:"caso-m",title:"CASO M · Operación Rescate",eyebrow:"MISTERIO · ESCAPE 3D",subtitle:"Una desaparición. Seis cifras. Un sobre que cambia todo.",
 description:"Una misión contrarreloj, tres evidencias y un cajón cerrado. El mensaje personal aparece después del rescate.",
 accent:"#dcaa7b",url:"https://tehiceesto.com/escape-play/caso-m/",duration:"3 minutos + un último intento",
 fields:[...common,{key:"codigo",label:"Código del candado (6 dígitos)",max:6,required:true,hint:"Cambia también la fotografía, la cinta y el archivo de vigilancia.",defaultValue:"131026"},{key:"voz",label:"Audio de la misión (URL HTTPS MP3, opcional)",max:950}]},
 {slug:"ultima-funcion",title:"La Última Función",eyebrow:"CINE · TERROR 3D",subtitle:"El teatro cerró. Tu butaca sigue esperando.",
 description:"Explorá una sala de cine abandonada, resolvé sus acertijos y descubrí una entrada personalizada al final.",
 accent:"#aa7ab9",url:"https://la-ultima-funcion.vercel.app/",duration:"8 minutos de suspenso",
 fields:common},
 {slug:"ultima-campanada",title:"La Última Campanada",eyebrow:"ROMANCE · JARDÍN 3D",subtitle:"Antes de que se marchiten las flores, descubrí una invitación.",
 description:"Un invernadero misterioso, pistas entre flores y relojes, una carta sellada y un desenlace íntimo.",
 accent:"#df9a9c",url:"https://la-ultima-campanada-desafio-v6.vercel.app/",duration:"9 minutos de exploración y desafío final",
 fields:[
 {key:"nombre",label:"Nombre de la persona destinataria",max:55,required:true},
 {key:"firma",label:"Nombre de quien invita",max:90,required:true},
 {key:"pregunta",label:"Pregunta o titular final",max:190,required:true},
 {key:"mensaje",label:"Carta o mensaje personal",max:650,multiline:true,required:true},
 {key:"fecha",label:"Fecha",max:80},{key:"lugar",label:"Lugar",max:125},
 {key:"rsvp",label:"WhatsApp para responder",max:18},
 {key:"voz",label:"Audio del desenlace (URL HTTPS, opcional)",max:950}
 ]}
];
export function getEscapeRoom(slug:string){return escapeRooms.find(room=>room.slug===slug);}
export function validateEscapeConfig(room:EscapeRoom,input:Record<string,unknown>){
 const result:Record<string,string>={};
 for(const field of room.fields){
  const value=typeof input[field.key]==="string"?(input[field.key] as string).trim().slice(0,field.max||160):"";
  if(field.required&&!value&&!field.defaultValue)throw new Error("missing_"+field.key);
  if(field.key==="codigo"){
   const code=value||field.defaultValue||"131026";
   if(!/^\d{6}$/.test(code))throw new Error("invalid_lock_code");
   result[field.key]=code;
  }else if(field.key==="rsvp"){
   result[field.key]=value.replace(/\D/g,"").slice(0,18);
  }else if(field.key==="voz"){
   if(value&&!/^https:\/\//.test(value))throw new Error("invalid_voice_url");
   result[field.key]=value;
  }else result[field.key]=value;
 }
 return result;
}
export function getEscapeSource(room:EscapeRoom,values:Record<string,string>={}){
 const link=new URL(room.url);
 for(const field of room.fields){
  const value=values[field.key];
  if(value)link.searchParams.set(field.key,value);
 }
 return link.toString();
}
