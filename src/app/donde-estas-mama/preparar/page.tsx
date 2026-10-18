import type { Metadata } from "next";
import GiftEditor from "./GiftEditor";
export const metadata: Metadata = {
 title:"Preparar sorpresa del Día de la Madre | Viralio Escape",
 description:"Personalizá un mensaje y compartí la misión de cinco minutos de Viralio Escape.",
 robots:{index:false,follow:false}
};
export default function Page(){return <GiftEditor/>;}
