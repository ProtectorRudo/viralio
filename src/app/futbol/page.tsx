import type { Metadata } from "next";
import FootballLab from "./football-lab";

export const metadata: Metadata = {
  title: "Football Simulator · 100.000 futuros posibles",
  description:
    "Laboratorio probabilístico de partidos: 1X2, goles, corners, tarjetas, penales y escenarios de alineación.",
};

export default function FutbolPage() {
  return <FootballLab />;
}
