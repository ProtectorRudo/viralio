import type { Metadata } from "next";
import StockMindWeb from "./stockmind-web";

export const metadata: Metadata = {
  title: "StockMind Web · Análisis de acciones",
  description:
    "Análisis de acciones con fundamentos SEC, valoración, técnico, estacionalidad, patrones, riesgo y régimen de mercado.",
};

export default function AccionesPage() {
  return <StockMindWeb />;
}
