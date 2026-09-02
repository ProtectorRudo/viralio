import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Viralio · Moka",
    short_name: "Moka",
    description: "Descubrí tu premio oculto en Moka.",
    start_url: "/moka",
    display: "standalone",
    background_color: "#f7efe5",
    theme_color: "#28170f",
  };
}
