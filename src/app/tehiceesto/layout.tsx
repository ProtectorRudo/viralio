import type { Metadata } from "next";
import "./tehiceesto.css";

export const metadata: Metadata = {
  title: "Te Hice Esto · Un regalo que no se abre. Se vive.",
  description: "Experiencias digitales personalizadas con recuerdos, cartas, juegos y sorpresas.",
};

export default function TeHiceEstoLayout({children}:{children:React.ReactNode}){
  return <div className="thi-root">{children}</div>;
}
