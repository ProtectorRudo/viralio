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
  type MarketPoint,
} from "@/acciones/stockmind";
import {
  SP500_UNIVERSE_SOURCE,
  normalizeProviderTicker,
  sp500MembersAsOf,
  sp500UniverseUnion,
} from "@/acciones/historical_universe";
import { passesStrongFilters } from "@/acciones/walkforward";
import type {
  CrossSectionalBatchResult,
  CrossSectionalCadence,
  CrossSectionalEvaluation,
  CrossSectionalPeriodPlan,
  CrossSectionalPlan,
} from "@/acciones/cross_sectional_core";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function exactPoint(points: MarketPoint[], date: string) {
  return points.find((point) => point.date === date) ?? null;
}

function lastPointOnOrBefore(points: MarketPoint[], date: string) {
  let answer: MarketPoint | null = null;
  for (const point of points) {
    if (point.date > date) break;
    answer = point;
  }
  return answer;
}

function nextPointAfter(points: MarketPoint[], date: string) {
  return points.find((point) => point.date > date) ?? null;
}

function exitPrice(
  points: MarketPoint[],
  entryDate: string,
  exitDate: string,
): { price: number | null; proxy: boolean } {
  const exact = exactPoint(points, exitDate);
  if (exact) return { price: exact.close, proxy: false };

  const terminal = points.at(-1);
  if (
    terminal &&
    terminal.date >= entryDate &&
    terminal.date < exitDate
  ) {
    return { price: terminal.close, proxy: true };
  }

  return { price: null, proxy: false };
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthlySignals(
  points: MarketPoint[],
  startDate: string,
  endDate: string,
) {
  const byMonth = new Map<string, MarketPoint>();
  for (const point of points) {
    if (point.date < startDate || point.date > endDate) continue;
    byMonth.set(monthKey(point.date), point);
  }
  return [...byMonth.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function allowedYears(raw: number, cadence: CrossSectionalCadence) {
  const years = clamp(Math.round(raw), 3, 8);
  return cadence === "monthly" ? Math.min(years, 3) : years;
}

async function loadPlanContext(
  rawYears: number,
  cadence: CrossSectionalCadence,
) {
  const years = allowedYears(rawYears, cadence);
  const [spy, qqq, vix] = await Promise.all([
    fetchYahooSeries("SPY", "max"),
    fetchYahooSeries("QQQ", "max"),
    fetchYahooSeries("^VIX", "max"),
  ]);

  const lastDate = spy.points.at(-1)?.date;
  if (!lastDate) throw new Error("SPY sin historia utilizable.");

  const start = new Date(`${lastDate}T00:00:00Z`);
  start.setUTCFullYear(start.getUTCFullYear() - years);
  const startDate = start.toISOString().slice(0, 10);

  let signals = monthlySignals(spy.points, startDate, lastDate);
  if (cadence === "quarterly") {
    signals = signals.filter((point) => {
      const month = Number(point.date.slice(5, 7));
      return month === 3 || month === 6 || month === 9 || month === 12;
    });
  }

  const periods: CrossSectionalPeriodPlan[] = [];
  for (let index = 0; index < signals.length - 1; index += 1) {
    const signal = signals[index];
    const nextSignal = signals[index + 1];
    const execution = nextPointAfter(spy.points, signal.date);
    const exit = nextPointAfter(spy.points, nextSignal.date);

    if (!execution || !exit || exit.date <= execution.date) continue;

    const universeSize = sp500MembersAsOf(signal.date).length;
    periods.push({
      signalDate: signal.date,
      executionDate: execution.date,
      exitDate: exit.date,
      universeSize,
      benchmarkReturn: exit.close / execution.close - 1,
    });
  }

  if (periods.length < 2) {
    throw new Error("Período insuficiente para un backtest transversal.");
  }

  const tickers = sp500UniverseUnion(
    periods.map((period) => period.signalDate),
  );

  const plan: CrossSectionalPlan = {
    years,
    cadence,
    periods,
    tickers,
    source: {
      repository: SP500_UNIVERSE_SOURCE.repository,
      commit: SP500_UNIVERSE_SOURCE.commit,
      snapshotDate: SP500_UNIVERSE_SOURCE.currentSnapshotDate,
    },
  };

  return { plan, spy, qqq, vix };
}

export async function buildCrossSectionalPlan(
  rawYears = 5,
  cadence: CrossSectionalCadence = "quarterly",
): Promise<CrossSectionalPlan> {
  const { plan } = await loadPlanContext(rawYears, cadence);
  return plan;
}

async function evaluateTicker(
  rawTicker: string,
  plan: CrossSectionalPlan,
  benchmarks: {
    spy: MarketPoint[];
    qqq: MarketPoint[];
    vix: MarketPoint[];
  },
): Promise<{
  rows: CrossSectionalEvaluation[];
  failure?: string;
}> {
  const ticker = rawTicker.trim().toUpperCase();
  const providerTicker = normalizeProviderTicker(ticker);
  let stock;

  try {
    stock = await fetchYahooSeries(providerTicker, "max");
  } catch (error) {
    return {
      rows: [],
      failure:
        error instanceof Error
          ? error.message
          : "Precios históricos no disponibles.",
    };
  }

  const rows: CrossSectionalEvaluation[] = [];
  let eligiblePeriods = 0;
  let pitFailures = 0;

  for (const period of plan.periods) {
    const members = sp500MembersAsOf(period.signalDate);
    if (!members.includes(ticker)) continue;
    eligiblePeriods += 1;

    const signalPoint = exactPoint(stock.points, period.signalDate)
      ?? lastPointOnOrBefore(stock.points, period.signalDate);
    const entry = exactPoint(stock.points, period.executionDate);
    const exit = exitPrice(
      stock.points,
      period.executionDate,
      period.exitDate,
    );

    if (
      !signalPoint ||
      !entry ||
      entry.close <= 0 ||
      exit.price === null
    ) {
      continue;
    }

    const history = stock.points.filter(
      (point) => point.date <= period.signalDate,
    );
    if (history.length < 756) continue;

    const spyHistory = benchmarks.spy.filter(
      (point) => point.date <= period.signalDate,
    );
    const qqqHistory = benchmarks.qqq.filter(
      (point) => point.date <= period.signalDate,
    );
    const vixHistory = benchmarks.vix.filter(
      (point) => point.date <= period.signalDate,
    );

    try {
      const fundamentals = await fetchFundamentals(
        providerTicker,
        signalPoint.close,
        period.signalDate,
      );
      const fundamental = analyzeFundamental(fundamentals);
      const valuation = analyzeValuation(fundamentals);
      const engines = [
        fundamental,
        valuation,
        analyzeTechnical(history),
        analyzeAnalogs(history),
        analyzeSeasonality(history),
        analyzeRisk(history),
        analyzeRegime(spyHistory, qqqHistory, vixHistory),
        analyzeDataQuality(
          history,
          fundamentals,
          null,
          period.signalDate,
        ),
      ];
      const composed = composeStockMind(providerTicker, engines);

      rows.push({
        ticker,
        providerTicker,
        signalDate: period.signalDate,
        score: composed.compositeScore,
        confidence: composed.confidence,
        fundamentalScore: fundamental.score,
        valuationScore: valuation.score,
        passes: passesStrongFilters(
          engines,
          composed.compositeScore,
          55,
        ),
        forwardReturn: exit.price / entry.close - 1,
        proxyExit: exit.proxy,
      });
    } catch {
      pitFailures += 1;
    }
  }

  if (!rows.length && eligiblePeriods > 0) {
    return {
      rows,
      failure:
        pitFailures > 0
          ? "Sin fundamentales SEC point-in-time utilizables en los períodos elegibles."
          : "Sin precios/ejecuciones históricas suficientes.",
    };
  }

  return { rows };
}

export async function evaluateCrossSectionalBatch(options: {
  years: number;
  cadence: CrossSectionalCadence;
  tickers: string[];
  scoreThreshold: number;
}): Promise<CrossSectionalBatchResult> {
  const tickers = [...new Set(
    options.tickers
      .map((ticker) => ticker.trim().toUpperCase())
      .filter((ticker) => /^[A-Z0-9.^-]{1,12}$/.test(ticker)),
  )].slice(0, 6);

  if (!tickers.length) {
    throw new Error("El lote no contiene tickers válidos.");
  }

  const { plan, spy, qqq, vix } = await loadPlanContext(
    options.years,
    options.cadence,
  );

  const evaluations: CrossSectionalEvaluation[] = [];
  const failures: CrossSectionalBatchResult["failures"] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < tickers.length) {
      const index = cursor;
      cursor += 1;
      const ticker = tickers[index];
      const result = await evaluateTicker(
        ticker,
        plan,
        {
          spy: spy.points,
          qqq: qqq.points,
          vix: vix.points,
        },
      );
      evaluations.push(...result.rows);
      if (result.failure) {
        failures.push({ ticker, reason: result.failure });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(3, tickers.length) }, () => worker()),
  );

  return {
    tickersRequested: tickers,
    evaluations,
    failures,
  };
}
