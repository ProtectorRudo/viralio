import type { Metadata } from "next";
import CreatorWizard from "../CreatorWizard";
import { getExperience } from "../data";
import { getEscapeRoom } from "../escape-rooms";

export const metadata: Metadata = {
  title: "Creá tu regalo",
  description:
    "Elegí la experiencia, pagá y personalizá tu regalo paso a paso con fotos, audios y tus palabras.",
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
