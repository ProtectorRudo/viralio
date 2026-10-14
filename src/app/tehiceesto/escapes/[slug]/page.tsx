import {notFound} from "next/navigation";
import type {Metadata} from "next";
import EscapeFrame from "../../EscapeFrame";
import {getEscapeRoom} from "../../escape-rooms";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const room=getEscapeRoom(slug);
 return {title:room?room.title+" — Te Hice Esto":"Escape room",robots:{index:false,follow:false}};
}
export default async function EscapeDemo({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const room=getEscapeRoom(slug);
 if(!room)notFound();
 return <EscapeFrame room={room}/>;
}
