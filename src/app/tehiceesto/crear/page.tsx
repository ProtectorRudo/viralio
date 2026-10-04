import type { Metadata } from "next";
import CreatorWizard from "../CreatorWizard";

export const metadata: Metadata = {
  title: "Elegí tu experiencia",
  description:
    "Elegí la experiencia, dejá tus datos y pagá. Después nos ponemos en contacto para crearla con vos.",
};

export default function CreatePage(){
  return <main className="creator-page">
    <div className="creator-backdrop" />
    <CreatorWizard/>
  </main>;
}
