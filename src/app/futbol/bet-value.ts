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


export function confidenceAdjustedEdgeBuffer(
  confidencePercent: number | null | undefined,
) {
  const confidence =
    confidencePercent == null || !Number.isFinite(confidencePercent)
      ? 0.5
      : Math.min(Math.max(confidencePercent / 100, 0), 1);

  return VALUE_EDGE_BUFFER + (1 - confidence) * 0.05;
}


export function impliedProbability(decimalOdds: number) {
  return decimalOdds > 1 ? 1 / decimalOdds : 0;
}

export function probabilityEdge(
  modelProbability: number,
  decimalOdds: number,
) {
  return modelProbability - impliedProbability(decimalOdds);
}


export function isHighModelMarketDivergence(
  modelProbability: number,
  decimalOdds: number,
  confidencePercent: number,
  probabilityGapThreshold = 0.10,
  confidenceThreshold = 70,
) {
  return (
    confidencePercent < confidenceThreshold &&
    Math.abs(probabilityEdge(modelProbability, decimalOdds)) >
      probabilityGapThreshold
  );
}

export function isThinBookmakerMarket(
  bookmakerCount: number | null | undefined,
  minimumBookmakers = 2,
) {
  return (bookmakerCount ?? 0) < minimumBookmakers;
}
