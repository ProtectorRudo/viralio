import type { Metadata } from "next";
import { OperationsHub } from "@/ui/operations-hub";

export const metadata: Metadata = {
  title: "Operación · Viralio",
  description: "Vista interna de comercios, métricas y accesos operativos de Viralio.",
};

export default function OperationsPage() {
  return <OperationsHub />;
}
