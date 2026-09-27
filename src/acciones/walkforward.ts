import {
  analyzeAnalogs,
  analyzeDataQuality,
  analyzeFundamental,
  analyzeRegime,
  analyzeRisk,
  analyzeSeasonality,
  analyzeTechnical,
  analyzeValuation,
  composeStockMind,
  fetchFundamentals,
  fetchYahooSeries,
  type EngineResult,
  type MarketPoint,
} from "@/acciones/stockmind";

export type WalkForwardObservation = {
  date: string;
  score: number;
  confidence: number;
  fundamentalScore: number;
  valuationScore: number;
  selected: boolean;
  return20d: number;
  return63d: number;
  spyReturn20d: number | null;
  spyReturn63d: number | null;
  alpha20d: number | null;
  alpha63d: number | null;
};

export type WalkForwardResult = {
  ticker: string;
  methodology: "PIT_SEC_FULL";
  historyYears: number;
  stepDays: number;
  scoreThreshold: number;
  transactionCostBps: number;
  observations: number;
  selectedObservations: number;
  skippedNoFundamentals: number;
  hitRate20d: number | null;
  medianReturn20d: number | null;
  medianReturn63d: number | null;
  baselineMedian20d: number | null;
  baselineMedian63d: number | null;
  medianSpy20d: number | null;
  medianSpy63d: number | null;
  medianAlpha20d: number | null;
  medianAlpha63d: number | null;
  spearman20d: number | null;
  spearman63d: number | null;
  medianFundamentalScore: number | null;
  medianValuationScore: number | null;
  cumulativeReturn: number;
  benchmarkCumulativeReturn: number;
  cagr: number | null;
  benchmarkCagr: number | null;
  maxDrawdown: number;
  benchmarkMaxDrawdown: number;
  averageExposure: number;
  startDate: string | null;
  endDate: string | null;
  observationsDetail: WalkForwardObservation[];
  source: string;
};

type WalkForwardOptions = {
  ticker: string;
  historyYears?: number;
  stepDays?: number;
  scoreThreshold?: number;
  transactionCostBps?: number;
  warmup?: number;
  horizonShort?: number;
  horizonLong?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function median(values: number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function ranks(values: number[]): number[] {
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value);
  const output = new Array(values.length).fill(0);

  let cursor = 0;
  while (cursor < indexed.length) {
    let end = cursor + 1;
    while (
      end < indexed.length &&
      indexed[end].value === indexed[cursor].value
    ) {
      end += 1;
    }
    const averageRank = (cursor + 1 + end) / 2;
    for (let i = cursor; i < end; i += 1) {
      output[indexed[i].index] = averageRank;
    }
    cursor = end;
  }

  return output;
}

function pearson(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 5) return null;
  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length;
  let numerator = 0;
  let da = 0;
  let db = 0;

  for (let i = 0; i < a.length; i += 1) {
    const xa = a[i] - meanA;
    const xb = b[i] - meanB;
    numerator += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }

  const denominator = Math.sqrt(da * db);
  if (denominator <= 0) return null;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

export function spearman(scores: number[], returns: number[]): number | null {
  if (scores.length < 5 || new Set(scores).size < 2) return null;
  return pearson(ranks(scores), ranks(returns));
}

function pointOnOrBefore(points: MarketPoint[], date: string): MarketPoint | null {
  let low = 0;
  let high = points.length - 1;
  let answer: MarketPoint | null = null;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const point = points[middle];
    if (point.date <= date) {
      answer = point;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return answer;
}

function forwardReturn(
  points: MarketPoint[],
  startDate: string,
  endDate: string,
): number | null {
  const start = pointOnOrBefore(points, startDate);
  const end = pointOnOrBefore(points, endDate);
  if (!start || !end || start.close <= 0 || end.date <= start.date) return null;
  return end.close / start.close - 1;
}

export function maxDrawdown(returns: number[]): number {
  let wealth = 1;
  let peak = 1;
  let worst = 0;

  for (const value of returns) {
    wealth *= 1 + value;
    peak = Math.max(peak, wealth);
    worst = Math.min(worst, wealth / peak - 1);
  }

  return worst;
}

export function cumulativeReturn(returns: number[]): number {
  return returns.reduce((wealth, value) => wealth * (1 + value), 1) - 1;
}

function cagrFromDates(
  cumulative: number,
  startDate: string | null,
  endDate: string | null,
): number | null {
  if (!startDate || !endDate || cumulative <= -1) return null;
  const elapsedDays =
    (Date.parse(`${endDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
    86_400_000;
  const years = elapsedDays / 365.25;
  if (!Number.isFinite(years) || years <= 0.25) return null;
  return (1 + cumulative) ** (1 / years) - 1;
}

export function passesStrongFilters(
  engines: EngineResult[],
  compositeScore: number,
  threshold: number,
): boolean {
  const byName = new Map(engines.map((engine) => [engine.name, engine]));
  const fundamental = byName.get("Fundamental");
  const valuation = byName.get("Valuation");
  const risk = byName.get("Risk");
  const regime = byName.get("Market regime");
  const quality = byName.get("Data quality");

  return Boolean(
    fundamental &&
      valuation &&
      fundamental.confidence >= 0.35 &&
      valuation.confidence >= 0.35 &&
      compositeScore >= threshold &&
      fundamental.score >= 60 &&
      valuation.score >= 55 &&
      (!risk || risk.score >= 45) &&
      (!regime || regime.score >= 35) &&
      (!quality || quality.score >= 65),
  );
}

function emptyResult(
  ticker: string,
  historyYears: number,
  stepDays: number,
  scoreThreshold: number,
  transactionCostBps: number,
  skipped = 0,
): WalkForwardResult {
  return {
    ticker,
    methodology: "PIT_SEC_FULL",
    historyYears,
    stepDays,
    scoreThreshold,
    transactionCostBps,
    observations: 0,
    selectedObservations: 0,
    skippedNoFundamentals: skipped,
    hitRate20d: null,
    medianReturn20d: null,
    medianReturn63d: null,
    baselineMedian20d: null,
    baselineMedian63d: null,
    medianSpy20d: null,
    medianSpy63d: null,
    medianAlpha20d: null,
    medianAlpha63d: null,
    spearman20d: null,
    spearman63d: null,
    medianFundamentalScore: null,
    medianValuationScore: null,
    cumulativeReturn: 0,
    benchmarkCumulativeReturn: 0,
    cagr: null,
    benchmarkCagr: null,
    maxDrawdown: 0,
    benchmarkMaxDrawdown: 0,
    averageExposure: 0,
    startDate: null,
    endDate: null,
    observationsDetail: [],
    source: "Yahoo adjusted prices + SEC EDGAR point-in-time filings",
  };
}

export async function runPointInTimeWalkForward(
  options: WalkForwardOptions,
): Promise<WalkForwardResult> {
  const ticker = options.ticker.trim().toUpperCase();
  if (!/^[A-Z0-9.^-]{1,12}$/.test(ticker)) {
    throw new Error("Ticker inválido");
  }

  const historyYears = clamp(Math.round(options.historyYears ?? 10), 5, 20);
  const stepDays = clamp(Math.round(options.stepDays ?? 21), 21, 63);
  const scoreThreshold = clamp(options.scoreThreshold ?? 72, 55, 90);
  const transactionCostBps = clamp(options.transactionCostBps ?? 10, 0, 100);
  const warmup = Math.max(756, Math.round(options.warmup ?? 756));
  const horizonShort = Math.max(20, Math.round(options.horizonShort ?? 20));
  const horizonLong = Math.max(63, Math.round(options.horizonLong ?? 63));

  const [stock, spy, qqq, vix] = await Promise.all([
    fetchYahooSeries(ticker, "max"),
    fetchYahooSeries("SPY", "max"),
    fetchYahooSeries("QQQ", "max"),
    fetchYahooSeries("^VIX", "max"),
  ]);

  const points = stock.points;
  if (points.length < warmup + horizonLong + 1) {
    return emptyResult(
      ticker,
      historyYears,
      stepDays,
      scoreThreshold,
      transactionCostBps,
    );
  }

  const finalDate = points.at(-1)!.date;
  const limit = new Date(`${finalDate}T00:00:00Z`);
  limit.setUTCFullYear(limit.getUTCFullYear() - historyYears);
  const limitDate = limit.toISOString().slice(0, 10);

  const requestedStart = points.findIndex((point) => point.date >= limitDate);
  const firstIndex = Math.max(
    warmup - 1,
    requestedStart >= 0 ? requestedStart : warmup - 1,
  );
  const stop = points.length - horizonLong;

  const observations: WalkForwardObservation[] = [];
  let skippedNoFundamentals = 0;

  for (let index = firstIndex; index < stop; index += stepDays) {
    const asOf = points[index].date;
    const history = points.slice(0, index + 1);
    const price = points[index].close;

    let fundamentals;
    try {
      fundamentals = await fetchFundamentals(ticker, price, asOf);
    } catch {
      skippedNoFundamentals += 1;
      continue;
    }

    const spyHistory = spy.points.filter((point) => point.date <= asOf);
    const qqqHistory = qqq.points.filter((point) => point.date <= asOf);
    const vixHistory = vix.points.filter((point) => point.date <= asOf);

    if (spyHistory.length < 220) {
      skippedNoFundamentals += 1;
      continue;
    }

    const fundamental = analyzeFundamental(fundamentals);
    const valuation = analyzeValuation(fundamentals);
    const technical = analyzeTechnical(history);
    const analogs = analyzeAnalogs(history);
    const seasonality = analyzeSeasonality(history);
    const risk = analyzeRisk(history);
    const regime = analyzeRegime(spyHistory, qqqHistory, vixHistory);
    const quality = analyzeDataQuality(history, fundamentals, null, asOf);

    const engines = [
      fundamental,
      valuation,
      technical,
      analogs,
      seasonality,
      risk,
      regime,
      quality,
    ];

    const composed = composeStockMind(ticker, engines);
    const selected = passesStrongFilters(
      engines,
      composed.compositeScore,
      scoreThreshold,
    );

    const return20d = points[index + horizonShort].close / price - 1;
    const return63d = points[index + horizonLong].close / price - 1;
    const spyReturn20d = forwardReturn(
      spy.points,
      asOf,
      points[index + horizonShort].date,
    );
    const spyReturn63d = forwardReturn(
      spy.points,
      asOf,
      points[index + horizonLong].date,
    );

    observations.push({
      date: asOf,
      score: composed.compositeScore,
      confidence: composed.confidence,
      fundamentalScore: fundamental.score,
      valuationScore: valuation.score,
      selected,
      return20d,
      return63d,
      spyReturn20d,
      spyReturn63d,
      alpha20d:
        spyReturn20d === null ? null : return20d - spyReturn20d,
      alpha63d:
        spyReturn63d === null ? null : return63d - spyReturn63d,
    });
  }

  if (!observations.length) {
    return emptyResult(
      ticker,
      historyYears,
      stepDays,
      scoreThreshold,
      transactionCostBps,
      skippedNoFundamentals,
    );
  }

  const selected = observations.filter((row) => row.selected);
  const selectedReturns20 = selected.map((row) => row.return20d);
  const selectedReturns63 = selected.map((row) => row.return63d);
  const selectedSpy20 = selected
    .map((row) => row.spyReturn20d)
    .filter((value): value is number => value !== null);
  const selectedSpy63 = selected
    .map((row) => row.spyReturn63d)
    .filter((value): value is number => value !== null);
  const selectedAlpha20 = selected
    .map((row) => row.alpha20d)
    .filter((value): value is number => value !== null);
  const selectedAlpha63 = selected
    .map((row) => row.alpha63d)
    .filter((value): value is number => value !== null);

  const roundTripCost = (transactionCostBps * 2) / 10_000;
  const strategyPeriodReturns = observations.map((row) =>
    row.selected ? row.return20d - roundTripCost : 0,
  );
  const benchmarkPeriodReturns = observations.map(
    (row) => row.spyReturn20d ?? 0,
  );

  const cumulative = cumulativeReturn(strategyPeriodReturns);
  const benchmarkCumulative = cumulativeReturn(benchmarkPeriodReturns);
  const startDate = observations[0].date;
  const endDate = observations.at(-1)!.date;

  return {
    ticker,
    methodology: "PIT_SEC_FULL",
    historyYears,
    stepDays,
    scoreThreshold,
    transactionCostBps,
    observations: observations.length,
    selectedObservations: selected.length,
    skippedNoFundamentals,
    hitRate20d: selected.length
      ? selected.filter((row) => row.return20d > 0).length / selected.length
      : null,
    medianReturn20d: median(selectedReturns20),
    medianReturn63d: median(selectedReturns63),
    baselineMedian20d: median(observations.map((row) => row.return20d)),
    baselineMedian63d: median(observations.map((row) => row.return63d)),
    medianSpy20d: median(selectedSpy20),
    medianSpy63d: median(selectedSpy63),
    medianAlpha20d: median(selectedAlpha20),
    medianAlpha63d: median(selectedAlpha63),
    spearman20d: spearman(
      observations.map((row) => row.score),
      observations.map((row) => row.return20d),
    ),
    spearman63d: spearman(
      observations.map((row) => row.score),
      observations.map((row) => row.return63d),
    ),
    medianFundamentalScore: median(
      observations.map((row) => row.fundamentalScore),
    ),
    medianValuationScore: median(
      observations.map((row) => row.valuationScore),
    ),
    cumulativeReturn: cumulative,
    benchmarkCumulativeReturn: benchmarkCumulative,
    cagr: cagrFromDates(cumulative, startDate, endDate),
    benchmarkCagr: cagrFromDates(benchmarkCumulative, startDate, endDate),
    maxDrawdown: maxDrawdown(strategyPeriodReturns),
    benchmarkMaxDrawdown: maxDrawdown(benchmarkPeriodReturns),
    averageExposure: selected.length / observations.length,
    startDate,
    endDate,
    observationsDetail: observations,
    source: "Yahoo adjusted prices + SEC EDGAR point-in-time filings",
  };
}
