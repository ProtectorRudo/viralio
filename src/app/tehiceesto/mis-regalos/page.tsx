import type { Metadata } from "next";
import MyGifts from "./MyGifts";

export const dynamic="force-dynamic";

export const metadata:Metadata={
  title:"Mis regalos",
  description:"Acceso privado a tus regalos de Te Hice Esto.",
  robots:{index:false,follow:false,nocache:true},
  referrer:"no-referrer",
};

export default function MyGiftsPage(){
  return <MyGifts/>;
}
