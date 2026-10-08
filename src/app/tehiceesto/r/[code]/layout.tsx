import "../../tehiceesto-premium-v2.css";
import "./purchased-experience.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Te Hice Esto — Tenés algo esperando",
  description: "Te dejaron una experiencia privada. Este link fue creado para una sola persona.",
  referrer: "no-referrer",
  openGraph: {
    title: "Te Hice Esto — Tenés algo esperando",
    description: "Hay algo privado esperando del otro lado. Abrilo cuando tengas un momento.",
    siteName: "Te Hice Esto",
    type: "website",
    images: [{ url: "./opengraph-image", width: 1200, height: 630, alt: "Te Hice Esto — Tenés algo esperando" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Te Hice Esto — Tenés algo esperando",
    description: "Hay algo privado esperando del otro lado. Abrilo cuando tengas un momento.",
    images: ["./opengraph-image"],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function PrivateGiftLayout({ children }: { children: React.ReactNode }) {
  return children;
}
