import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {getEscapeRoom} from "../../../escape-rooms";
import EscapeCheckout from "../../EscapeCheckout";
export const metadata:Metadata={title:"Comprar un escape room para regalar · Te Hice Esto",robots:{index:false,follow:false}};
export default async function EscapePurchasePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const room=getEscapeRoom(slug);
 if(!room)notFound();
 return <EscapeCheckout room={room}/>;
}
