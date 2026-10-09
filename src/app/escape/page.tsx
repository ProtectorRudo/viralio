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
  return <>
    {/* A hero rendered through CSS would otherwise wait until the stylesheet
        loads. Mobile 2x/3x screens can request the crisp photographed master
        immediately, with no extra fetch on standard-density displays. */}
    <link
      rel="preload"
      as="image"
      href="/escape/images/retina/mansion.webp"
      media="(min-resolution: 2dppx)"
      fetchPriority="high"
    />
    <EscapeGame />
  </>;
}
