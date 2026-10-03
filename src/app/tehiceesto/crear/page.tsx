import type { Metadata } from "next";
import CreatorWizard from "../CreatorWizard";

export const metadata: Metadata = {
  title: "Crear una experiencia",
  description:
    "Elegí para quién es, contá la historia y armá una primera versión privada de su experiencia.",
};

export default function CreatePage(){
  return <main className="creator-page">
    <div className="creator-backdrop" />
    <CreatorWizard/>
  </main>;
}
