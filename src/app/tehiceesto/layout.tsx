import type { Metadata, Viewport } from "next";
import "./tehiceesto-premium-v1.css";
import "./tehiceesto-live.css";
import "./affiliate.css";
import FloatingWhatsApp from "./FloatingWhatsApp";

export const metadata: Metadata = {
  metadataBase: new URL("https://tehiceesto.com"),
  title: {
    default: "Te Hice Esto — Un regalo que se vive",
    template: "%s — Te Hice Esto",
  },
  description: "Fotos, voces, cartas y recuerdos convertidos en una experiencia digital privada creada para una sola persona.",
  applicationName: "Te Hice Esto",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://tehiceesto.com",
    siteName: "Te Hice Esto",
    title: "Te Hice Esto — Un regalo que se vive",
    description: "Experiencias digitales privadas hechas con recuerdos reales y diseñadas para una sola persona.",
    images: [{
      url: "/brand-image",
      width: 1200,
      height: 630,
      alt: "Te Hice Esto — Regalos digitales para el alma",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Te Hice Esto — Un regalo que se vive",
    description: "Fotos, voces, cartas y recuerdos convertidos en una experiencia privada que se vive desde el celular.",
    images: ["/brand-image"],
  },
  icons: {
    icon: "/brand-icon",
    shortcut: "/brand-icon",
    apple: "/brand-icon",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Te Hice Esto",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3ed",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function TeHiceEstoLayout({children}:{children:React.ReactNode}){
  return <div className="thi-root">{children}<FloatingWhatsApp/></div>;
}
