import type { Metadata } from "next";
import FootballEscape from "./FootballEscape";
export const metadata: Metadata = {
  title: "LA ÚLTIMA JUGADA — Escape 3D de fútbol | Viralio",
  description: "Recorré el vestuario, la manga, la sala de videoanálisis y el campo. Encontrá las claves antes de que llegue el último silbatazo.",
  robots: {index:false,follow:false},
};
export default function FootballEscapePage() { return <FootballEscape/>; }
