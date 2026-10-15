import type { Metadata } from "next";
import LaUltimaJugada from "./LaUltimaJugada";

export const metadata: Metadata = {
 title: "La Última Jugada — Argentina vs Inglaterra | Viralio Escape",
 description: "Una final del mundo. Un informe saboteado. Tres escenarios 3D y 15 minutos para cambiar la historia de Argentina frente a Inglaterra.",
 alternates: {canonical:"https://viralio.net/la-ultima-jugada"},
 openGraph: {title:"LA ÚLTIMA JUGADA — Argentina vs Inglaterra",description:"Llevá la información. Cambiá la final.",type:"website",url:"https://viralio.net/la-ultima-jugada",images:[{url:"https://viralio.net/la-ultima-jugada/cover.svg"}]}
};
export default function Page(){return <LaUltimaJugada/>;}
