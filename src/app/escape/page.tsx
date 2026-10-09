import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import EscapeGame from "./EscapeGame";

export const metadata: Metadata = {
  title: "UMBRAL · La casa que recuerda — Escape Room",
  description: "Una experiencia de escape inmersiva en cuatro capítulos. Cada objeto cuenta algo. Cada segundo importa.",
  robots: { index: false, follow: false },
};

export default async function EscapePage() {
  // Both brands run in the same Vercel project. Keep the horror game
  // off the Te Hice Esto storefront without blocking authenticated previews.
  const host = (await headers()).get("host")?.toLowerCase().split(":")[0];
  if (host === "tehiceesto.com" || host === "www.tehiceesto.com") notFound();
  return <EscapeGame />;
}
