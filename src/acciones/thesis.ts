import type { StockMindAnalysis } from "@/acciones/stockmind";

export type SavedThesis = {
  ticker: string;
  companyName: string;
  createdAt: string;
  entryPrice: number;
  compositeScore: number;
  fundamentalScore: number;
  valuationScore: number;
  intrinsicValue: number | null;
  roic: number | null;
  fcfMargin: number | null;
  marginOfSafety: number | null;
  lastAction?: ThesisAction;
  lastSummary?: string;
  lastCheckedAt?: string;
  lastPrice?: number;
  lastReturn?: number;
};

export type ThesisAction = "HOLD" | "REVIEW" | "REVIEW_EXIT";

export type ThesisReview = {
  action: ThesisAction;
  health: number;
  summary: string;
  deteriorations: string[];
  observations: string[];
  priceReturn: number | null;
  fundamentalScoreChange: number;
  intrinsicValueChange: number | null;
  roicChange: number | null;
  fcfMarginChange: number | null;
};

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dropRatio(oldValue: number | null, newValue: number | null): number | null {
  if (oldValue === null || newValue === null || oldValue === 0) return null;
  return newValue / oldValue - 1;
}

function engine(analysis: StockMindAnalysis, name: string) {
  return analysis.engines.find((item) => item.name === name);
}

export function createThesisFromAnalysis(analysis: StockMindAnalysis): SavedThesis {
  const fundamental = engine(analysis, "Fundamental");
  const valuation = engine(analysis, "Valuation");

  if (!fundamental || !valuation) {
    throw new Error("La tesis necesita análisis fundamental y de valuación.");
  }

  const entryPrice =
    numberOrNull(valuation.details.current_price) ??
    numberOrNull(engine(analysis, "Technical")?.details.price) ??
    analysis.price;

  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    throw new Error("No hay un precio válido para guardar la tesis.");
  }

  return {
    ticker: analysis.ticker,
    companyName: analysis.companyName,
    createdAt: new Date().toISOString(),
    entryPrice,
    compositeScore: analysis.compositeScore,
    fundamentalScore: fundamental.score,
    valuationScore: valuation.score,
    intrinsicValue: numberOrNull(valuation.details.intrinsic_value_per_share),
    roic: numberOrNull(fundamental.details.roic),
    fcfMargin: numberOrNull(fundamental.details.fcf_margin),
    marginOfSafety: numberOrNull(valuation.details.margin_of_safety),
  };
}

export function evaluateThesis(
  thesis: SavedThesis,
  analysis: StockMindAnalysis,
): ThesisReview {
  const fundamental = engine(analysis, "Fundamental");
  const valuation = engine(analysis, "Valuation");

  if (!fundamental || !valuation) {
    return {
      action: "REVIEW",
      health: 50,
      summary: "No hay evidencia suficiente para revisar la tesis.",
      deteriorations: [],
      observations: ["faltan motores fundamental o de valuación"],
      priceReturn: thesis.entryPrice > 0 ? analysis.price / thesis.entryPrice - 1 : null,
      fundamentalScoreChange: 0,
      intrinsicValueChange: null,
      roicChange: null,
      fcfMarginChange: null,
    };
  }

  const deteriorations: string[] = [];
  const observations: string[] = [];

  const fundamentalScoreChange = fundamental.score - thesis.fundamentalScore;
  if (fundamental.score < 35 || fundamentalScoreChange <= -20) {
    deteriorations.push(
      `calidad fundamental cayó ${Math.abs(fundamentalScoreChange).toFixed(0)} puntos`,
    );
  }

  const currentIntrinsic = numberOrNull(valuation.details.intrinsic_value_per_share);
  const intrinsicValueChange = dropRatio(thesis.intrinsicValue, currentIntrinsic);
  if (intrinsicValueChange !== null && intrinsicValueChange <= -0.2) {
    deteriorations.push(
      `valor intrínseco cayó ${Math.abs(intrinsicValueChange * 100).toFixed(0)}%`,
    );
  }

  const currentRoic = numberOrNull(fundamental.details.roic);
  const roicChange = dropRatio(thesis.roic, currentRoic);
  if (
    thesis.roic !== null &&
    currentRoic !== null &&
    currentRoic < 0.1 &&
    roicChange !== null &&
    roicChange <= -0.35
  ) {
    deteriorations.push("ROIC perdió una parte material de su fortaleza");
  }

  const currentFcfMargin = numberOrNull(fundamental.details.fcf_margin);
  const fcfMarginChange = dropRatio(thesis.fcfMargin, currentFcfMargin);
  if (currentFcfMargin !== null && currentFcfMargin < 0) {
    deteriorations.push("FCF pasó a margen negativo");
  } else if (fcfMarginChange !== null && fcfMarginChange <= -0.5) {
    deteriorations.push("margen FCF se redujo más de la mitad");
  }

  const margin = numberOrNull(valuation.details.margin_of_safety);
  if (margin !== null && margin < -0.35) {
    observations.push("precio muy por encima del DCF conservador");
  }

  const priceReturn =
    thesis.entryPrice > 0 ? analysis.price / thesis.entryPrice - 1 : null;

  if (fundamental.score < 35 || deteriorations.length >= 2) {
    return {
      action: "REVIEW_EXIT",
      health: 25,
      summary: `Revisar salida: ${deteriorations.slice(0, 3).join("; ")}`,
      deteriorations,
      observations,
      priceReturn,
      fundamentalScoreChange,
      intrinsicValueChange,
      roicChange,
      fcfMarginChange,
    };
  }

  if (deteriorations.length || observations.length) {
    return {
      action: "REVIEW",
      health: 50,
      summary: `Revisar posición: ${[...deteriorations, ...observations]
        .slice(0, 3)
        .join("; ")}`,
      deteriorations,
      observations,
      priceReturn,
      fundamentalScoreChange,
      intrinsicValueChange,
      roicChange,
      fcfMarginChange,
    };
  }

  return {
    action: "HOLD",
    health: 82,
    summary:
      "Tesis vigente: no aparecen deterioros materiales frente al momento de entrada.",
    deteriorations,
    observations,
    priceReturn,
    fundamentalScoreChange,
    intrinsicValueChange,
    roicChange,
    fcfMarginChange,
  };
}

export function applyReviewToThesis(
  thesis: SavedThesis,
  analysis: StockMindAnalysis,
  review: ThesisReview,
): SavedThesis {
  return {
    ...thesis,
    companyName: analysis.companyName || thesis.companyName,
    lastAction: review.action,
    lastSummary: review.summary,
    lastCheckedAt: new Date().toISOString(),
    lastPrice: analysis.price,
    lastReturn: review.priceReturn ?? undefined,
  };
}
