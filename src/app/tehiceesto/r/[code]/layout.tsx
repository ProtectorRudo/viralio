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
