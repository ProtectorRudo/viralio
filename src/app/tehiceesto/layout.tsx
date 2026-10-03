import type { Metadata, Viewport } from "next";
import "./tehiceesto.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tehiceesto.com"),
  title: {
    default: "Te Hice Esto | Regalos digitales personalizados para el alma",
    template: "%s | Te Hice Esto",
  },
  description: "Convertimos tus fotos, audios, videos, cartas y recuerdos en una experiencia digital privada e interactiva para regalar.",
  applicationName: "Te Hice Esto",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://tehiceesto.com",
    siteName: "Te Hice Esto",
    title: "Te Hice Esto | Regalos digitales para el alma",
    description: "Tus recuerdos convertidos en un regalo privado e interactivo que se descubre desde el celular.",
    images: [{
      url: "/brand-image",
      width: 1200,
      height: 630,
      alt: "Te Hice Esto — Regalos digitales para el alma",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Te Hice Esto | Regalos digitales para el alma",
    description: "Tus recuerdos convertidos en una experiencia digital privada para regalar.",
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
    statusBarStyle: "black-translucent",
    title: "Te Hice Esto",
  },
};

export const viewport: Viewport = {
  themeColor: "#08070a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function TeHiceEstoLayout({children}:{children:React.ReactNode}){
  return <div className="thi-root">{children}</div>;
}
