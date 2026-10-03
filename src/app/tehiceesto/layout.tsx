import type { Metadata, Viewport } from "next";
import "./tehiceesto.css";

export const metadata: Metadata = {
  title: "Te Hice Esto · Un regalo que no se abre. Se vive.",
  description: "Experiencias digitales personalizadas con recuerdos, cartas, juegos y sorpresas.",
  applicationName: "Te Hice Esto",
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
