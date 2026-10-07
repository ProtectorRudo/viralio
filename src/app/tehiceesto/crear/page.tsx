import type { Metadata } from "next";
import CreatorWizard from "../CreatorWizard";
import { getExperience } from "../data";

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
  const initialExperience=getExperience(requested)?.slug||"";

  return <main className="creator-page">
    <div className="creator-backdrop" />
    <CreatorWizard initialExperience={initialExperience}/>
  </main>;
}
