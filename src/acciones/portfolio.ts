import type { StockMindAnalysis } from "@/acciones/stockmind";

export type PortfolioPositionInput = {
  ticker: string;
  shares: number;
  avgCost: number;
};

export type PortfolioHolding = PortfolioPositionInput & {
  currentPrice: number;
  marketValue: number;
  weight: number;
  returnPct: number;
};

export type PortfolioReport = {
  totalValue: number;
  holdings: PortfolioHolding[];
  annualizedVolatility: number | null;
  maxDrawdown: number | null;
  averageCorrelation: number | null;
  concentrationHhi: number;
  topWeight: number;
  asOf: string | null;
  missingTickers: string[];
};

export type CandidatePortfolioMetrics = {
  ticker: string;
  candidateVolatility: number | null;
  correlationToPortfolio: number | null;
};

export type PositionSizing = CandidatePortfolioMetrics & {
  currentWeight: number;
  riskBasedMaxWeight: number;
  additionalWeightCapacity: number;
  rationale: string;
};

type PricePoint = {
  date: string;
  close: number;
};

type PriceSeries = {
  ticker: string;
  points: PricePoint[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function mean(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function std(values: number[]) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function correlation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 20) return null;
  const aa = a.slice(-n);
  const bb = b.slice(-n);
  const ma = mean(aa);
  const mb = mean(bb);
  let numerator = 0;
  let da = 0;
  let db = 0;

  for (let i = 0; i < n; i += 1) {
    const xa = aa[i] - ma;
    const xb = bb[i] - mb;
    numerator += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }

  const denominator = Math.sqrt(da * db);
  if (denominator <= 0) return null;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

function returnsFromPrices(values: number[]) {
  const out: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1] > 0 && values[i] > 0) {
      out.push(values[i] / values[i - 1] - 1);
    }
  }
  return out;
}

function sanitizePositions(
  positions: PortfolioPositionInput[],
): PortfolioPositionInput[] {
  const byTicker = new Map<string, PortfolioPositionInput>();

  for (const raw of positions.slice(0, 20)) {
    const ticker = raw.ticker.trim().toUpperCase();
    const shares = Number(raw.shares);
    const avgCost = Number(raw.avgCost);

    if (
      !/^[A-Z0-9.^-]{1,12}$/.test(ticker) ||
      !Number.isFinite(shares) ||
      !Number.isFinite(avgCost) ||
      shares <= 0 ||
      avgCost <= 0
    ) {
      continue;
    }

    byTicker.set(ticker, { ticker, shares, avgCost });
  }

  return [...byTicker.values()];
}

async function fetchYahooSeries(ticker: string): Promise<PriceSeries> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      ticker,
    )}?range=2y&interval=1d&events=div%2Csplits&includeAdjustedClose=true`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 StockMind-Web/0.27",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo no devolvió precios para ${ticker}`);
  }

  const payload = (await response.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{ close?: Array<number | null> }>;
          adjclose?: Array<{ adjclose?: Array<number | null> }>;
        };
      }>;
    };
  };

  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const raw = result?.indicators?.quote?.[0]?.close ?? [];
  const adjusted = result?.indicators?.adjclose?.[0]?.adjclose ?? [];
  const points: PricePoint[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const value = adjusted[index] ?? raw[index];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      continue;
    }
    points.push({
      date: new Date(timestamps[index] * 1000).toISOString().slice(0, 10),
      close: value,
    });
  }

  if (points.length < 30) {
    throw new Error(`Historial insuficiente para ${ticker}`);
  }

  return { ticker, points };
}

async function loadSeries(
  tickers: string[],
): Promise<{ series: Map<string, PriceSeries>; missing: string[] }> {
  const series = new Map<string, PriceSeries>();
  const missing: string[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < tickers.length) {
      const index = cursor;
      cursor += 1;
      const ticker = tickers[index];
      try {
        series.set(ticker, await fetchYahooSeries(ticker));
      } catch {
        missing.push(ticker);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(4, tickers.length)) }, () =>
      worker(),
    ),
  );

  return { series, missing: missing.sort() };
}

function alignedReturns(
  series: Map<string, PriceSeries>,
  tickers: string[],
): { dates: string[]; returns: Map<string, number[]> } {
  if (!tickers.length) return { dates: [], returns: new Map() };

  const maps = tickers
    .map((ticker) => series.get(ticker))
    .filter((item): item is PriceSeries => item != null)
    .map(
      (item) =>
        new Map(item.points.map((point) => [point.date, point.close] as const)),
    );

  if (!maps.length) return { dates: [], returns: new Map() };

  let dates = [...maps[0].keys()];
  for (const map of maps.slice(1)) {
    dates = dates.filter((date) => map.has(date));
  }
  dates.sort();

  if (dates.length < 31) return { dates, returns: new Map() };

  const returns = new Map<string, number[]>();
  for (const ticker of tickers) {
    const item = series.get(ticker);
    if (!item) continue;
    const map = new Map(item.points.map((point) => [point.date, point.close]));
    returns.set(
      ticker,
      returnsFromPrices(
        dates
          .map((date) => map.get(date))
          .filter((value): value is number => typeof value === "number"),
      ),
    );
  }

  return { dates, returns };
}

export function portfolioStatistics(
  returns: Map<string, number[]>,
  weights: Map<string, number>,
): {
  annualizedVolatility: number | null;
  maxDrawdown: number | null;
  averageCorrelation: number | null;
} {
  const tickers = [...weights.keys()].filter((ticker) => returns.has(ticker));
  if (!tickers.length) {
    return {
      annualizedVolatility: null,
      maxDrawdown: null,
      averageCorrelation: null,
    };
  }

  const lengths = tickers.map((ticker) => returns.get(ticker)!.length);
  const n = Math.min(...lengths);
  if (n < 30) {
    return {
      annualizedVolatility: null,
      maxDrawdown: null,
      averageCorrelation: null,
    };
  }

  const portfolioReturns: number[] = [];
  for (let index = 0; index < n; index += 1) {
    let value = 0;
    for (const ticker of tickers) {
      value += returns.get(ticker)![returns.get(ticker)!.length - n + index] *
        (weights.get(ticker) ?? 0);
    }
    portfolioReturns.push(value);
  }

  const annualizedVolatility = std(portfolioReturns) * Math.sqrt(252);

  let wealth = 1;
  let peak = 1;
  let maxDrawdown = 0;
  for (const value of portfolioReturns) {
    wealth *= 1 + value;
    peak = Math.max(peak, wealth);
    maxDrawdown = Math.min(maxDrawdown, wealth / peak - 1);
  }

  const correlations: number[] = [];
  for (let i = 0; i < tickers.length; i += 1) {
    for (let j = i + 1; j < tickers.length; j += 1) {
      const value = correlation(
        returns.get(tickers[i])!,
        returns.get(tickers[j])!,
      );
      if (value !== null) correlations.push(value);
    }
  }

  return {
    annualizedVolatility: Number.isFinite(annualizedVolatility)
      ? annualizedVolatility
      : null,
    maxDrawdown,
    averageCorrelation: correlations.length ? mean(correlations) : null,
  };
}

export async function analyzePortfolio(
  rawPositions: PortfolioPositionInput[],
  candidateTicker?: string | null,
): Promise<{
  portfolio: PortfolioReport;
  candidate: CandidatePortfolioMetrics | null;
}> {
  const positions = sanitizePositions(rawPositions);
  const requestedCandidate = candidateTicker?.trim().toUpperCase() || null;
  const tickers = [...new Set([
    ...positions.map((position) => position.ticker),
    ...(requestedCandidate ? [requestedCandidate] : []),
  ])];

  const { series, missing } = await loadSeries(tickers);
  const holdings: PortfolioHolding[] = [];

  for (const position of positions) {
    const prices = series.get(position.ticker);
    const currentPrice = prices?.points.at(-1)?.close;
    if (!currentPrice) continue;

    holdings.push({
      ...position,
      currentPrice,
      marketValue: currentPrice * position.shares,
      weight: 0,
      returnPct: currentPrice / position.avgCost - 1,
    });
  }

  const totalValue = holdings.reduce(
    (sum, holding) => sum + holding.marketValue,
    0,
  );

  for (const holding of holdings) {
    holding.weight = totalValue > 0 ? holding.marketValue / totalValue : 0;
  }

  holdings.sort((a, b) => b.marketValue - a.marketValue);

  const holdingTickers = holdings.map((holding) => holding.ticker);
  const aligned = alignedReturns(series, holdingTickers);
  const weights = new Map(
    holdings.map((holding) => [holding.ticker, holding.weight] as const),
  );
  const stats = portfolioStatistics(aligned.returns, weights);

  const concentrationHhi = holdings.reduce(
    (sum, holding) => sum + holding.weight ** 2,
    0,
  );
  const topWeight = Math.max(0, ...holdings.map((holding) => holding.weight));
  const asOfDates = holdings
    .map((holding) => series.get(holding.ticker)?.points.at(-1)?.date)
    .filter((value): value is string => Boolean(value))
    .sort();

  let candidate: CandidatePortfolioMetrics | null = null;
  if (requestedCandidate && series.has(requestedCandidate)) {
    const candidateSeries = series.get(requestedCandidate)!;
    const candidateReturns = returnsFromPrices(
      candidateSeries.points.map((point) => point.close),
    );
    const candidateVolatility =
      candidateReturns.length >= 30
        ? std(candidateReturns.slice(-252)) * Math.sqrt(252)
        : null;

    let correlationToPortfolio: number | null = null;

    if (holdingTickers.length) {
      const allTickers = [...new Set([...holdingTickers, requestedCandidate])];
      const candidateAligned = alignedReturns(series, allTickers);
      const candidateVector = candidateAligned.returns.get(requestedCandidate);

      if (candidateVector && candidateVector.length >= 30) {
        const n = Math.min(
          candidateVector.length,
          ...holdingTickers
            .map((ticker) => candidateAligned.returns.get(ticker)?.length ?? 0)
            .filter((length) => length > 0),
        );

        if (n >= 30) {
          const portfolioReturns: number[] = [];
          for (let index = 0; index < n; index += 1) {
            let value = 0;
            for (const ticker of holdingTickers) {
              const vector = candidateAligned.returns.get(ticker);
              if (!vector) continue;
              value +=
                vector[vector.length - n + index] * (weights.get(ticker) ?? 0);
            }
            portfolioReturns.push(value);
          }
          correlationToPortfolio = correlation(
            candidateVector.slice(-n),
            portfolioReturns,
          );
        }
      }
    }

    candidate = {
      ticker: requestedCandidate,
      candidateVolatility,
      correlationToPortfolio,
    };
  }

  return {
    portfolio: {
      totalValue,
      holdings,
      annualizedVolatility: stats.annualizedVolatility,
      maxDrawdown: stats.maxDrawdown,
      averageCorrelation: stats.averageCorrelation,
      concentrationHhi,
      topWeight,
      asOf: asOfDates.at(-1) ?? null,
      missingTickers: missing.filter((ticker) =>
        positions.some((position) => position.ticker === ticker),
      ),
    },
    candidate,
  };
}

export function sizePosition(
  analysis: StockMindAnalysis,
  portfolio: PortfolioReport,
  metrics: CandidatePortfolioMetrics | null,
): PositionSizing {
  const currentWeight =
    portfolio.holdings.find((holding) => holding.ticker === analysis.ticker)
      ?.weight ?? 0;

  const candidateVolatility = metrics?.candidateVolatility ?? null;
  const correlationToPortfolio = metrics?.correlationToPortfolio ?? null;

  const volatilityCap =
    candidateVolatility === null || candidateVolatility <= 0
      ? 0.06
      : clamp(0.02 / candidateVolatility, 0.025, 0.12);

  const evidenceFactor = clamp((analysis.compositeScore - 40) / 45, 0.45, 1);
  const confidenceFactor = clamp(analysis.confidence / 0.8, 0.55, 1);

  let correlationFactor = 1;
  if (correlationToPortfolio !== null) {
    if (correlationToPortfolio >= 0.8) correlationFactor = 0.55;
    else if (correlationToPortfolio >= 0.65) correlationFactor = 0.72;
    else if (correlationToPortfolio >= 0.45) correlationFactor = 0.88;
  }

  const concentrationFactor =
    portfolio.topWeight >= 0.25 || portfolio.concentrationHhi >= 0.18
      ? 0.78
      : 1;

  const riskEngine = analysis.engines.find((engine) => engine.name === "Risk");
  const regimeEngine = analysis.engines.find(
    (engine) => engine.name === "Market regime",
  );

  let regimeFactor = 1;
  if (regimeEngine) {
    if (regimeEngine.score < 35) regimeFactor = 0.65;
    else if (regimeEngine.score < 50) regimeFactor = 0.8;
    else if (regimeEngine.score < 65) regimeFactor = 0.92;
  }

  let riskCap = 0.12;
  if (riskEngine && riskEngine.score < 45) riskCap = 0.05;
  else if (riskEngine && riskEngine.score < 60) riskCap = 0.08;

  const riskBasedMaxWeight = clamp(
    Math.min(
      0.12,
      riskCap,
      volatilityCap *
        evidenceFactor *
        confidenceFactor *
        correlationFactor *
        concentrationFactor *
        regimeFactor,
    ),
    0.02,
    0.12,
  );

  const additionalWeightCapacity = Math.max(
    0,
    riskBasedMaxWeight - currentWeight,
  );

  const rationale = [
    `techo por volatilidad ${(volatilityCap * 100).toFixed(1)}%`,
    `convicción ${analysis.compositeScore.toFixed(0)}/100`,
    `confianza ${(analysis.confidence * 100).toFixed(0)}%`,
    ...(correlationToPortfolio !== null
      ? [`correlación con cartera ${correlationToPortfolio.toFixed(2)}`]
      : []),
    ...(regimeEngine
      ? [
          `régimen ${String(regimeEngine.details.regime ?? "N/D")} (${regimeEngine.score.toFixed(0)}/100)`,
        ]
      : []),
    ...(currentWeight > 0
      ? [`peso actual ${(currentWeight * 100).toFixed(1)}%`]
      : []),
  ].join("; ");

  return {
    ticker: analysis.ticker,
    currentWeight,
    riskBasedMaxWeight,
    additionalWeightCapacity,
    candidateVolatility,
    correlationToPortfolio,
    rationale,
  };
}
