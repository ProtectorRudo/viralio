import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./viralio-public-landing.css";
import "./viralio-003.css";
import "./viralio-005.css";
import "./viralio-007.css";
import "./viralio-008.css";
import "./viralio-009.css";
import "./viralio-010.css";
import "./viralio-019.css";
import "./viralio-020a.css";
import "./viralio-020b.css";
import "./viralio-020b-wheel.css";
import "./viralio-020f-brand-families.css";
import "./viralio-020g-merchant-ui.css";
import "./viralio-020i-reward-objects.css";
import "./viralio-020j-visual-qa.css";

export const metadata: Metadata = {
  title: "Viralio · Dale a tus clientes una razón para volver",
  description: "Viralio ayuda a comercios físicos a generar recomendaciones por WhatsApp y motivos concretos para que sus clientes vuelvan.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1110",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
