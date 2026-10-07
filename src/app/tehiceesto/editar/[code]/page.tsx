import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CustomerStudio from "../CustomerStudio";

export const dynamic="force-dynamic";

export const metadata:Metadata={
  title:"Personalizar mi regalo",
  description:"Tu estudio privado para personalizar la experiencia.",
  robots:{index:false,follow:false,nocache:true},
  referrer:"no-referrer",
};

export default async function StudioPage({params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  if(!/^[a-f0-9]{18}$/.test(code))notFound();
  return <CustomerStudio code={code}/>;
}
