export type CrossSectionalCadence = "monthly" | "quarterly";

export type CrossSectionalPeriodPlan = {
  signalDate: string;
  executionDate: string;
  exitDate: string;
  universeSize: number;
  benchmarkReturn: number;
};

export type CrossSectionalPlan = {
  years: number;
  cadence: CrossSectionalCadence;
  periods: CrossSectionalPeriodPlan[];
  tickers: string[];
  source: {
    repository: string;
    commit: string;
    snapshotDate: string;
  };
};

export type CrossSectionalEvaluation = {
  ticker: string;
  providerTicker: string;
  signalDate: string;
  score: number;
  confidence: number;
  fundamentalScore: number;
  valuationScore: number;
  passes: boolean;
  forwardReturn: number;
  proxyExit: boolean;
};

export type CrossSectionalBatchResult = {
  tickersRequested: string[];
  evaluations: CrossSectionalEvaluation[];
  failures: Array<{
    ticker: string;
    reason: string;
  }>;
};

export type CrossSectionalPeriodResult = {
  signalDate: string;
  executionDate: string;
  exitDate: string;
  universeSize: number;
  analyzedCount: number;
  coverage: number;
  selectedTickers: string[];
  selectedScores: number[];
  grossReturn: number;
  netReturn: number;
  benchmarkReturn: number;
  turnover: number;
  transactionCost: number;
  proxyExitCount: number;
};

export type CrossSectionalBacktestResult = {
  years: number;
  cadence: CrossSectionalCadence;
  topN: number;
  scoreThreshold: number;
  transactionCostBps: number;
  periods: number;
  cumulativeReturn: number;
  benchmarkCumulativeReturn: number;
  cagr: number | null;
  benchmarkCagr: number | null;
  annualizedVolatility: number | null;
  benchmarkAnnualizedVolatility: number | null;
  maxDrawdown: number | null;
  benchmarkMaxDrawdown: number | null;
  averageTurnover: number;
  averageCoverage: number;
  averageSelectedCount: number;
  historicalProxyExits: number;
  periodsDetail: CrossSectionalPeriodResult[];
};

function mean(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function std(values: number[]) {
  if (values.length < 2) return null;
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function cumulative(returns: number[]) {
  return returns.reduce((wealth, value) => wealth * (1 + value), 1) - 1;
}

function maxDrawdown(returns: number[]) {
  if (!returns.length) return null;
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

function cagr(
  cumulativeReturn: number,
  startDate: string | null,
  endDate: string | null,
) {
  if (!startDate || !endDate || cumulativeReturn <= -1) return null;
  const days =
    (Date.parse(`${endDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
    86_400_000;
  if (!Number.isFinite(days) || days <= 0) return null;
  return (1 + cumulativeReturn) ** (365.25 / days) - 1;
}

function turnover(
  previous: Record<string, number>,
  target: Record<string, number>,
) {
  const keys = new Set([...Object.keys(previous), ...Object.keys(target)]);
  let total = 0;
  for (const key of keys) {
    total += Math.abs((target[key] ?? 0) - (previous[key] ?? 0));
  }
  return total * 0.5;
}

function endingWeights(
  target: Record<string, number>,
  returns: Record<string, number>,
  grossReturn: number,
) {
  const denominator = 1 + grossReturn;
  if (denominator <= 0) return { CASH: 1 };

  const ending: Record<string, number> = {};
  for (const [ticker, weight] of Object.entries(target)) {
    const value =
      ticker === "CASH"
        ? weight
        : weight * (1 + (returns[ticker] ?? 0));
    if (value > 0) ending[ticker] = value / denominator;
  }

  const total = Object.values(ending).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return { CASH: 1 };
  for (const ticker of Object.keys(ending)) {
    ending[ticker] /= total;
  }
  return ending;
}

export function summarizeCrossSectionalBacktest(
  plan: CrossSectionalPlan,
  evaluations: CrossSectionalEvaluation[],
  options: {
    topN: number;
    scoreThreshold: number;
    transactionCostBps: number;
  },
): CrossSectionalBacktestResult {
  const topN = Math.max(1, Math.min(30, Math.round(options.topN)));
  const scoreThreshold = Math.max(
    55,
    Math.min(90, Number(options.scoreThreshold)),
  );
  const transactionCostBps = Math.max(
    0,
    Math.min(100, Number(options.transactionCostBps)),
  );

  const bySignal = new Map<string, CrossSectionalEvaluation[]>();
  for (const row of evaluations) {
    const list = bySignal.get(row.signalDate) ?? [];
    list.push(row);
    bySignal.set(row.signalDate, list);
  }

  let previousEndWeights: Record<string, number> = { CASH: 1 };
  const periods: CrossSectionalPeriodResult[] = [];

  for (const period of plan.periods) {
    const rows = bySignal.get(period.signalDate) ?? [];
    const candidates = rows
      .filter((row) => row.passes && row.score >= scoreThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    const target: Record<string, number> = {};
    if (candidates.length) {
      const weight = 1 / candidates.length;
      for (const candidate of candidates) target[candidate.ticker] = weight;
      target.CASH = 0;
    } else {
      target.CASH = 1;
    }

    const periodTurnover = turnover(previousEndWeights, target);
    const transactionCost =
      periodTurnover * (transactionCostBps / 10_000);

    let grossReturn = 0;
    const assetReturns: Record<string, number> = {};
    let proxyExitCount = 0;

    for (const candidate of candidates) {
      const weight = target[candidate.ticker] ?? 0;
      grossReturn += weight * candidate.forwardReturn;
      assetReturns[candidate.ticker] = candidate.forwardReturn;
      if (candidate.proxyExit) proxyExitCount += 1;
    }

    const netReturn = grossReturn - transactionCost;
    periods.push({
      signalDate: period.signalDate,
      executionDate: period.executionDate,
      exitDate: period.exitDate,
      universeSize: period.universeSize,
      analyzedCount: rows.length,
      coverage:
        period.universeSize > 0 ? rows.length / period.universeSize : 0,
      selectedTickers: candidates.map((row) => row.ticker),
      selectedScores: candidates.map((row) => row.score),
      grossReturn,
      netReturn,
      benchmarkReturn: period.benchmarkReturn,
      turnover: periodTurnover,
      transactionCost,
      proxyExitCount,
    });

    previousEndWeights = endingWeights(target, assetReturns, grossReturn);
  }

  const strategyReturns = periods.map((period) => period.netReturn);
  const benchmarkReturns = periods.map((period) => period.benchmarkReturn);
  const cumulativeReturn = cumulative(strategyReturns);
  const benchmarkCumulativeReturn = cumulative(benchmarkReturns);
  const annualization = plan.cadence === "monthly" ? 12 : 4;
  const sigma = std(strategyReturns);
  const benchmarkSigma = std(benchmarkReturns);

  return {
    years: plan.years,
    cadence: plan.cadence,
    topN,
    scoreThreshold,
    transactionCostBps,
    periods: periods.length,
    cumulativeReturn,
    benchmarkCumulativeReturn,
    cagr: cagr(
      cumulativeReturn,
      periods[0]?.executionDate ?? null,
      periods.at(-1)?.exitDate ?? null,
    ),
    benchmarkCagr: cagr(
      benchmarkCumulativeReturn,
      periods[0]?.executionDate ?? null,
      periods.at(-1)?.exitDate ?? null,
    ),
    annualizedVolatility:
      sigma === null ? null : sigma * Math.sqrt(annualization),
    benchmarkAnnualizedVolatility:
      benchmarkSigma === null ? null : benchmarkSigma * Math.sqrt(annualization),
    maxDrawdown: maxDrawdown(strategyReturns),
    benchmarkMaxDrawdown: maxDrawdown(benchmarkReturns),
    averageTurnover: mean(periods.map((period) => period.turnover)),
    averageCoverage: mean(periods.map((period) => period.coverage)),
    averageSelectedCount: mean(
      periods.map((period) => period.selectedTickers.length),
    ),
    historicalProxyExits: periods.reduce(
      (sum, period) => sum + period.proxyExitCount,
      0,
    ),
    periodsDetail: periods,
  };
}
