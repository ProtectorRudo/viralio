import type { Metadata } from "next";
import CierreClient from "./CierreClient";
import "./cierre.css";

export const metadata: Metadata = {
  title: "CIERRE — Presupuestos que no se olvidan",
  description: "Panel privado de seguimiento inteligente de presupuestos por WhatsApp Business. Un comercio, un acceso, un seguimiento oportuno.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://viralio.net/cierre" },
};

export default function CierrePage() {
  return <CierreClient />;
}
