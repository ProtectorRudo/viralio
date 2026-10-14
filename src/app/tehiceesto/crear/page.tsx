import type { Metadata } from "next";
import CreatorWizard from "../CreatorWizard";
import { getExperience } from "../data";
import { getEscapeRoom } from "../escape-rooms";

export const metadata: Metadata = {
  title: "Creá tu regalo",
  description:
    "Elegí tu regalo, probá la demo y pagá con Mercado Pago. Personalizá los recuerdos o recibí una sala de escape preparada por nuestro equipo.",
};

export default async function CreatePage({
  searchParams,
}:{
  searchParams:Promise<{experiencia?:string|string[]}>;
}){
  const query=await searchParams;
  const requested=Array.isArray(query.experiencia)?query.experiencia[0]||"":query.experiencia||"";
  const escapeRoom=requested.startsWith("escape-")?getEscapeRoom(requested.slice(7)):undefined;
  const initialExperience=getExperience(requested)?.slug||(escapeRoom?requested:"");

  return <main className="creator-page">
    <div className="creator-backdrop" />
    <CreatorWizard initialExperience={initialExperience}/>
  </main>;
}
