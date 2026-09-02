import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./viralio-003.css";
import "./viralio-005.css";

export const metadata: Metadata = {
  title: "Viralio · Experiencias que se comparten",
  description: "Descubrí y guardá recompensas únicas de tus comercios favoritos.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#251a14",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
