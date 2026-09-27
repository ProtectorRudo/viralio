import {
  analyzePortfolio,
  type PortfolioPositionInput,
} from "@/acciones/portfolio";

export type HistoricalScenario = {
  name: string;
  startDate: string;
  endDate: string;
};

export type StressScenarioResult = {
  name: string;
  startDate: string;
  endDate: string;
  coverage: number;
  portfolioReturn: number | null;
  coveredSubportfolioReturn: number | null;
  maxDrawdown: number | null;
  topLossContributors: Array<[string, number]>;
  coveredTickers: string[];
  missingTickers: string[];
};

export type PortfolioStressReport = {
  totalValue: number;
  scenarios: StressScenarioResult[];
};

type PricePoint = {
  date: string;
  close: number;
};

export const DEFAULT_STRESS_SCENARIOS: HistoricalScenario[] = [
  {
    name: "Crisis financiera global",
    startDate: "2008-09-15",
    endDate: "2009-03-09",
  },
  {
    name: "Crash COVID",
    startDate: "2020-02-19",
    endDate: "2020-03-23",
  },
  {
    name: "Shock de tasas 2022",
    startDate: "2022-01-03",
    endDate: "2022-10-14",
  },
];

function dateMs(value: string) {
  return Date.parse(`${value}T00:00:00Z`);
}

function daysBetween(a: string, b: string) {
  return Math.abs(dateMs(b) - dateMs(a)) / 86_400_000;
}

async function fetchMaxHistory(ticker: string): Promise<PricePoint[]> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      ticker,
    )}?range=max&interval=1d&events=div%2Csplits&includeAdjustedClose=true`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 StockMind-Web/0.28",
    },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo no devolvió historia máxima para ${ticker}`);
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
    const close = adjusted[index] ?? raw[index];
    if (
      typeof close !== "number" ||
      !Number.isFinite(close) ||
      close <= 0
    ) {
      continue;
    }

    points.push({
      date: new Date(timestamps[index] * 1000).toISOString().slice(0, 10),
      close,
    });
  }

  return points;
}

async function loadMaxHistories(
  tickers: string[],
): Promise<Map<string, PricePoint[]>> {
  const output = new Map<string, PricePoint[]>();
  let cursor = 0;

  async function worker() {
    while (cursor < tickers.length) {
      const index = cursor;
      cursor += 1;
      const ticker = tickers[index];
      try {
        const points = await fetchMaxHistory(ticker);
        if (points.length >= 2) output.set(ticker, points);
      } catch {
        // Missing history stays explicit in the scenario coverage.
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(4, tickers.length)) }, () =>
      worker(),
    ),
  );

  return output;
}

function pathValueAt(
  normalized: Array<{ date: string; value: number }>,
  date: string,
): number {
  if (!normalized.length) return 1;
  if (date < normalized[0].date) return 1;

  let value = normalized[0].value;
  for (const point of normalized) {
    if (point.date > date) break;
    value = point.value;
  }
  return value;
}

export function replayHistoricalScenario(
  priceMap: Map<string, PricePoint[]>,
  weights: Map<string, number>,
  scenario: HistoricalScenario,
): StressScenarioResult {
  const covered = new Map<string, PricePoint[]>();
  const missing = new Set<string>();

  for (const [ticker, weight] of weights) {
    if (weight <= 0) continue;

    const series = priceMap.get(ticker);
    if (!series?.length) {
      missing.add(ticker);
      continue;
    }

    const window = series.filter(
      (point) =>
        point.date >= scenario.startDate && point.date <= scenario.endDate,
    );

    if (window.length < 2) {
      missing.add(ticker);
      continue;
    }

    if (
      daysBetween(scenario.startDate, window[0].date) > 7 ||
      daysBetween(window.at(-1)!.date, scenario.endDate) > 7
    ) {
      missing.add(ticker);
      continue;
    }

    covered.set(ticker, window);
  }

  const coverage = [...covered.keys()].reduce(
    (sum, ticker) => sum + (weights.get(ticker) ?? 0),
    0,
  );

  if (!covered.size || coverage <= 0) {
    return {
      name: scenario.name,
      startDate: scenario.startDate,
      endDate: scenario.endDate,
      coverage: 0,
      portfolioReturn: null,
      coveredSubportfolioReturn: null,
      maxDrawdown: null,
      topLossContributors: [],
      coveredTickers: [],
      missingTickers: [...new Set([...weights.keys(), ...missing])].sort(),
    };
  }

  const normalized = new Map<
    string,
    Array<{ date: string; value: number }>
  >();
  const dateSet = new Set<string>([scenario.startDate, scenario.endDate]);

  for (const [ticker, series] of covered) {
    const base = series[0].close;
    const path = series.map((point) => ({
      date: point.date,
      value: point.close / base,
    }));
    normalized.set(ticker, path);
    for (const point of path) dateSet.add(point.date);
  }

  const dates = [...dateSet].sort();
  const totalPath: number[] = [];
  const coveredPath: number[] = [];

  for (const date of dates) {
    let total = 1 - coverage;
    let subportfolio = 0;

    for (const [ticker, path] of normalized) {
      const weight = weights.get(ticker) ?? 0;
      const value = pathValueAt(path, date);
      total += weight * value;
      subportfolio += (weight / coverage) * value;
    }

    totalPath.push(total);
    coveredPath.push(subportfolio);
  }

  const portfolioReturn = totalPath.at(-1)! - 1;
  const coveredSubportfolioReturn = coveredPath.at(-1)! - 1;

  let peak = totalPath[0];
  let maxDrawdown = 0;
  for (const value of totalPath) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, value / peak - 1);
  }

  const topLossContributors: Array<[string, number]> = [];
  for (const [ticker, series] of covered) {
    const assetReturn = series.at(-1)!.close / series[0].close - 1;
    topLossContributors.push([
      ticker,
      (weights.get(ticker) ?? 0) * assetReturn,
    ]);
  }
  topLossContributors.sort((a, b) => a[1] - b[1]);

  return {
    name: scenario.name,
    startDate: scenario.startDate,
    endDate: scenario.endDate,
    coverage,
    portfolioReturn,
    coveredSubportfolioReturn,
    maxDrawdown,
    topLossContributors: topLossContributors.slice(0, 3),
    coveredTickers: [...covered.keys()].sort(),
    missingTickers: [...new Set([
      ...missing,
      ...[...weights.keys()].filter((ticker) => !covered.has(ticker)),
    ])].sort(),
  };
}

export async function analyzePortfolioStress(
  positions: PortfolioPositionInput[],
  scenarios: HistoricalScenario[] = DEFAULT_STRESS_SCENARIOS,
): Promise<PortfolioStressReport> {
  const { portfolio } = await analyzePortfolio(positions);

  if (!portfolio.holdings.length) {
    return {
      totalValue: 0,
      scenarios: [],
    };
  }

  const weights = new Map(
    portfolio.holdings.map((holding) => [
      holding.ticker,
      holding.weight,
    ] as const),
  );
  const priceMap = await loadMaxHistories([...weights.keys()]);

  return {
    totalValue: portfolio.totalValue,
    scenarios: scenarios.map((scenario) =>
      replayHistoricalScenario(priceMap, weights, scenario),
    ),
  };
}
