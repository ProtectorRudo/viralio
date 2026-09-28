export const VALUE_EDGE_BUFFER = 0.05;

export function fairOdds(probability: number) {
  return probability > 0 ? 1 / probability : 0;
}

export function minimumValueOdds(
  probability: number,
  edgeBuffer = VALUE_EDGE_BUFFER,
) {
  return fairOdds(probability) * (1 + edgeBuffer);
}

export function expectedValueEdge(
  probability: number,
  bookmakerOdds: number,
) {
  return probability * bookmakerOdds - 1;
}

export function parseDecimalOdds(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : null;
}

export function classifyValue(
  bookmakerOdds: number | null,
  fair: number,
  minimumOdds: number,
) {
  if (bookmakerOdds === null) {
    return { label: "INGRESÁ CUOTA", tone: "neutral" as const };
  }

  if (bookmakerOdds >= minimumOdds) {
    return { label: "HAY VALOR", tone: "positive" as const };
  }
  if (bookmakerOdds >= fair) {
    return { label: "JUSTA · SIN MARGEN", tone: "warning" as const };
  }
  return { label: "SIN VALOR", tone: "negative" as const };
}
