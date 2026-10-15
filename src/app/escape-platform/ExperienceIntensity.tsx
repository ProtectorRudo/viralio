import type { EscapeExperience } from "./catalog";

type Dimension = keyof EscapeExperience["intensity"];

const dimensions: readonly {
  key: Dimension;
  name: string;
  hint: string;
}[] = [
  { key: "difficulty", name: "Dificultad", hint: "Cuánto esfuerzo requieren los acertijos." },
  { key: "scares", name: "Sustos", hint: "Intensidad de sobresaltos y momentos de miedo." },
  { key: "surprise", name: "Sorpresa", hint: "Cantidad e impacto de giros inesperados, sin spoilers." },
  { key: "tension", name: "Tensión", hint: "Presión, urgencia y sensación de peligro." }
];

export function ExperienceIntensity({
  room,
  variant = "card"
}: {
  room: EscapeExperience;
  variant?: "card" | "detail";
}) {
  return (
    <div
      className={`ve-intensity ve-intensity-${variant}`}
      role="group"
      aria-label={`Perfil estimado de intensidad de ${room.title}`}
    >
      <div className="ve-intensity-top">
        <span className="ve-intensity-heading">TU EXPERIENCIA</span>
        <span className="ve-intensity-range">ESCALA 01 — 05</span>
      </div>
      <div className="ve-intensity-grid">
        {dimensions.map(({ key, name, hint }) => {
          const level = room.intensity[key];
          return (
            <div
              className={`ve-intensity-metric ve-intensity-metric-${key}`}
              key={key}
              title={hint}
              aria-label={`${name}: ${level} de 5. ${hint}`}
            >
              <span className="ve-intensity-metric-name" aria-hidden="true">{name}</span>
              <span className="ve-intensity-metric-track" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < level ? "ve-intensity-segment is-filled" : "ve-intensity-segment"} />
                ))}
              </span>
              <span className="ve-intensity-value" aria-hidden="true">{String(level).padStart(2, "0")}<small>/05</small></span>
            </div>
          );
        })}
      </div>
      {variant === "detail" && (
        <p className="ve-intensity-disclaimer">
          Intensidades orientativas definidas por el equipo de Viralio, no opiniones de jugadores.
          Miden tipos de experiencia; no revelan soluciones ni sorpresas.
        </p>
      )}
    </div>
  );
}
