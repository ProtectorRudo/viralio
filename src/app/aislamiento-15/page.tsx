import type { Metadata } from "next";
import IsolationGame from "./IsolationGame";

export const metadata: Metadata = {
  title: "AISLAMIENTO 15 — Hospital de contención | Viralio Escape",
  description: "Tres sectores. Quince minutos. Una anomalía que puede imitar voces humanas. Jugá AISLAMIENTO 15, escape room 3D de terror y supervivencia.",
  alternates: { canonical: "https://viralio.net/aislamiento-15" },
  openGraph: { title: "AISLAMIENTO 15 | Viralio", description: "Tenés quince minutos para salir del hospital. Algo quiere salir con vos.", type: "website", url: "https://viralio.net/aislamiento-15", images: [{ url: "https://viralio.net/aislamiento-15/cover.svg" }] }
};

export default function Page() {
  return <IsolationGame />;
}
