import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Viralio · Experiencias que se comparten",
    short_name: "Viralio",
    description: "Descubrí recompensas únicas de tus comercios favoritos.",
    start_url: "/moka",
    display: "standalone",
    background_color: "#f1e7d8",
    theme_color: "#251a14",
  };
}
