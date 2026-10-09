import type { Metadata } from "next";
import EscapeGame from "./EscapeGame";

export const metadata: Metadata = {
  title: "UMBRAL · La casa que recuerda — Escape Room",
  description: "Una experiencia de escape inmersiva en cuatro capítulos. Cada objeto cuenta algo. Cada segundo importa.",
  robots: { index: false, follow: false },
};

export default function EscapePage() {
  return <EscapeGame />;
}
