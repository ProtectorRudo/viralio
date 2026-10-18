import type { Metadata } from "next";
import MotherEscape from "./MotherEscape";

export const metadata: Metadata = {
 title: "¿DÓNDE ESTÁS, MAMÁ? — Una misión de cinco minutos | Viralio Escape",
 description: "Una casa silenciosa. Un hijo desaparecido. Tres habitaciones y cinco minutos para encontrarlo. Escape room 3D especial Día de la Madre.",
 alternates: { canonical: "https://viralio.net/donde-estas-mama" },
 openGraph: { title: "¿DÓNDE ESTÁS, MAMÁ? | Viralio Escape", description: "Tenés cinco minutos para encontrarlo. ¿Te animás a entrar?", type: "website", url: "https://viralio.net/donde-estas-mama", images: [{url:"https://viralio.net/donde-estas-mama/cover.svg"}] }
};
export default function Page(){return <MotherEscape/>;}
