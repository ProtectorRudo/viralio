import type { IsolationWorld, Chamber } from "./IsolationWorld";

/**
 * Hints are deliberately progressive. An initial request gives a direction,
 * not a walkthrough; a second request points to a specific station. The
 * existing exact context hint is shown only on the third request.
 */
export function earlyHint(w: IsolationWorld, room: Chamber, stage: 1 | 2): string {
  const second = stage === 2;
  if (room === 0) {
    if (!w.hasFuse) return second
      ? "Hay una pieza de alimentación etiquetada sobre el mostrador de recepción."
      : "El edificio perdió su energía auxiliar: buscá qué falta en el circuito.";
    if (!w.fusePlaced) return second
      ? "El tablero de fusibles está instalado en una pared lateral."
      : "Encontrar la pieza no alcanza: hay que alimentar el circuito.";
    if (!w.hasBadge) return second
      ? "Una credencial quedó olvidada sobre una de las camillas."
      : "La terminal necesita identificar a un empleado del hospital.";
    if (!w.readTriage) return second
      ? "Buscá el pequeño expediente junto a una de las camillas."
      : "Las prioridades médicas están archivadas en un registro físico.";
    if (w.relays.length < 3) return second
      ? "La pizarra del fondo indica el orden exacto de los tres relés."
      : "Las palancas del circuito no pueden accionarse al azar.";
    if (!w.firstDoor) return second
      ? "Las habitaciones de los pacientes P1, P2 y P3 forman las tres cifras."
      : "La clave se obtiene a partir de las prioridades médicas.";
    return "La primera compuerta ya está abierta. Atravesala.";
  }
  if (room === 1) {
    if (w.oxygenCells.length < 2) return second
      ? "Buscá dos cartuchos cerca de los módulos de aislamiento."
      : "Antes de purgar el aire se necesita oxígeno de reserva.";
    if (!w.oxygenInstalled) return second
      ? "Las celdas se conectan a un regulador en el lateral izquierdo."
      : "Las celdas tienen que alimentar el circuito de presión.";
    if (w.valves.length < 3) return second
      ? "La pizarra técnica del fondo indica un orden de colores."
      : "La purga funciona siguiendo una secuencia, no por tanteo.";
    if (!w.secondDoor) return second
      ? "Buscá el extractor y accioná su control principal."
      : "Todavía falta expulsar la presión del sector.";
    return "La siguiente compuerta está abierta. Avanzá.";
  }
  if (!w.foundLog) return second
    ? "Encontrá la grabación de identidad cerca del muro izquierdo."
    : "Alguien dejó un testimonio sobre la anomalía.";
  if (w.breakers.join(",") !== "true,false,true") return second
    ? "La inscripción eléctrica del sector indica qué líneas deben quedar activas."
    : "La evacuación requiere que algunos circuitos se apaguen.";
  return second
    ? "Revisá la grabación antes de contestar al intercomunicador y activar la salida."
    : "La voz que escuchás podría estar imitando a otra persona.";
}
