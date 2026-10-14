import {notFound} from "next/navigation";
import EscapeFrame from "../../EscapeFrame";
import {getEscapeRoom,validateEscapeConfig} from "../../escape-rooms";
export const dynamic="force-dynamic";
export const metadata={title:"Tu sorpresa · Te Hice Esto",robots:{index:false,follow:false,noarchive:true}};
const URL="https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/escape-gifts";
const KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";
export default async function EscapeGift({params}:{params:Promise<{code:string}>}){
 const {code}=await params;if(!/^[a-f0-9]{18}$/.test(code))notFound();
 const response=await fetch(URL,{method:"POST",headers:{"content-type":"application/json",apikey:KEY},body:JSON.stringify({action:"publicRead",code}),cache:"no-store"});
 if(response.status===404)notFound();
 if(!response.ok)throw new Error("escape_private_read_failed");
 const payload=(await response.json()) as {room:string;config:Record<string,string>};
 const room=getEscapeRoom(payload.room);if(!room)notFound();
 let config:Record<string,string>;
 try{config=validateEscapeConfig(room,payload.config)}catch{notFound()}
 return <EscapeFrame room={room} config={config} customer/>;
}