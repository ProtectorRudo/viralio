export type Signal = "CANDIDATE" | "WATCH" | "NEUTRAL" | "CAUTION";

export type EngineResult = {
  name: string;
  score: number;
  confidence: number;
  summary: string;
  details: Record<string, unknown>;
};

export type StockMindAnalysis = {
  ticker: string;
  companyName: string;
  currency: string;
  exchange: string;
  price: number;
  dayChange: number | null;
  compositeScore: number;
  confidence: number;
  signal: Signal;
  signalLabel: string;
  reasons: string[];
  risks: string[];
  engines: EngineResult[];
  sparkline: number[];
  asOf: string;
  marketSource: string;
  fundamentalSource: string;
};

type MarketPoint = {
  date: string;
  close: number;
  high: number;
  low: number;
  volume: number;
};

type MarketSeries = {
  symbol: string;
  currency: string;
  exchange: string;
  points: MarketPoint[];
};

type FundamentalSnapshot = {
  ticker: string;
  sharesOutstanding: number | null;
  revenueTtm: number | null;
  netIncomeTtm: number | null;
  ebitTtm: number | null;
  freeCashFlowTtm: number | null;
  operatingCashFlowTtm: number | null;
  capexTtm: number | null;
  cash: number | null;
  totalDebt: number | null;
  equity: number | null;
  interestExpenseTtm: number | null;
  taxRate: number;
  revenueHistory: number[];
  fcfHistory: number[];
  dilutedSharesHistory: number[];
  currentPrice: number;
  marketCap: number | null;
  asOfDate: string;
  sourcePublicationDate: string | null;
  dataSource: string;
  companyName: string;
};

type SecFactRow = {
  form?: string;
  filed?: string;
  start?: string;
  end?: string;
  val?: number;
};

type FactValue = {
  value: number;
  filed: string;
  start?: string;
  end: string;
};

type Alias = readonly [string, string];

type EligibleFact = {
  value: number;
  filed: string;
  filedMs: number;
  start: string | null;
  startMs: number | null;
  end: string;
  endMs: number;
};

const WEIGHTS: Record<string, number> = {
  Fundamental: 0.26,
  Valuation: 0.23,
  Technical: 0.14,
  "Historical analogs": 0.12,
  Seasonality: 0.05,
  Risk: 0.12,
  "Market regime": 0.08,
};

const ALLOWED_FORMS = new Set(["10-Q", "10-Q/A", "10-K", "10-K/A"]);

const REVENUE: Alias[] = [
  ["us-gaap", "RevenueFromContractWithCustomerExcludingAssessedTax"],
  ["us-gaap", "Revenues"],
  ["us-gaap", "SalesRevenueNet"],
  ["us-gaap", "SalesRevenueGoodsNet"],
];
const NET_INCOME: Alias[] = [
  ["us-gaap", "NetIncomeLoss"],
  ["us-gaap", "ProfitLoss"],
];
const OPERATING_INCOME: Alias[] = [["us-gaap", "OperatingIncomeLoss"]];
const OCF: Alias[] = [["us-gaap", "NetCashProvidedByUsedInOperatingActivities"]];
const CAPEX: Alias[] = [
  ["us-gaap", "PaymentsToAcquirePropertyPlantAndEquipment"],
  ["us-gaap", "PaymentsForAdditionsToPropertyPlantAndEquipment"],
];
const CASH: Alias[] = [
  ["us-gaap", "CashAndCashEquivalentsAtCarryingValue"],
  ["us-gaap", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"],
];
const EQUITY: Alias[] = [
  ["us-gaap", "StockholdersEquity"],
  ["us-gaap", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
];
const SHARES: Alias[] = [
  ["dei", "EntityCommonStockSharesOutstanding"],
  ["us-gaap", "CommonStockSharesOutstanding"],
];
const DEBT_CURRENT: Alias[] = [
  ["us-gaap", "LongTermDebtCurrent"],
  ["us-gaap", "LongTermDebtAndFinanceLeaseObligationsCurrent"],
  ["us-gaap", "ShortTermBorrowings"],
];
const DEBT_NONCURRENT: Alias[] = [
  ["us-gaap", "LongTermDebtNoncurrent"],
  ["us-gaap", "LongTermDebtAndFinanceLeaseObligationsNoncurrent"],
];
const INTEREST: Alias[] = [
  ["us-gaap", "InterestExpenseNonOperating"],
  ["us-gaap", "InterestExpense"],
];
const TAX: Alias[] = [["us-gaap", "IncomeTaxExpenseBenefit"]];
const PRETAX: Alias[] = [
  ["us-gaap", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"],
  ["us-gaap", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments"],
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function finite(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function std(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function ratio(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  const value = a / b;
  return Number.isFinite(value) ? value : null;
}

function cagr(values: number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length < 3 || clean[0] <= 0 || clean.at(-1)! <= 0) return null;
  return (clean.at(-1)! / clean[0]) ** (1 / (clean.length - 1)) - 1;
}

function pctChanges(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1] > 0) out.push(values[i] / values[i - 1] - 1);
  }
  return out;
}

function rollingMean(values: number[], window: number): number | null {
  if (values.length < window) return null;
  return mean(values.slice(-window));
}

function rsi(values: number[], period = 14): number {
  if (values.length <= period) return 50;
  const deltas = values.slice(-(period + 1)).slice(1).map((value, index) => value - values.slice(-(period + 1))[index]);
  const gains = deltas.map((value) => Math.max(0, value));
  const losses = deltas.map((value) => Math.max(0, -value));
  const avgGain = mean(gains);
  const avgLoss = mean(losses);
  if (avgLoss <= 0) return avgGain > 0 ? 100 : 50;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function euclidean(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (!n) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

function normalizedShape(values: number[]): number[] {
  if (values.length < 2) return [];
  const logReturns: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] <= 0 || values[i - 1] <= 0) return [];
    logReturns.push(Math.log(values[i]) - Math.log(values[i - 1]));
  }
  const avg = mean(logReturns);
  const sigma = std(logReturns);
  if (sigma < 1e-12) return logReturns.map(() => 0);
  return logReturns.map((value) => (value - avg) / sigma);
}

async function fetchYahooSeries(symbol: string, range = "10y"): Promise<MarketSeries> {
  const encoded = encodeURIComponent(symbol);
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=${range}&interval=1d&events=div%2Csplits&includeAdjustedClose=true`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 StockMind-Web/0.25",
    },
    next: { revalidate: 900 },
  });
  if (!response.ok) {
    throw new Error(`Yahoo no devolvió precios para ${symbol}`);
  }

  const payload = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: { currency?: string; exchangeName?: string; symbol?: string };
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            close?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            volume?: Array<number | null>;
          }>;
          adjclose?: Array<{ adjclose?: Array<number | null> }>;
        };
      }>;
      error?: { description?: string } | null;
    };
  };

  const result = payload.chart?.result?.[0];
  if (!result) {
    throw new Error(payload.chart?.error?.description || `Sin historial para ${symbol}`);
  }

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0];
  const adjusted = result.indicators?.adjclose?.[0]?.adjclose;
  const points: MarketPoint[] = [];

  for (let i = 0; i < timestamps.length; i += 1) {
    const rawClose = finite(quote?.close?.[i]);
    const adjustedClose = finite(adjusted?.[i]);
    const close = adjustedClose ?? rawClose;
    if (close === null || close <= 0) continue;
    const factor = rawClose && rawClose > 0 ? close / rawClose : 1;
    const high = finite(quote?.high?.[i]);
    const low = finite(quote?.low?.[i]);
    points.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      close,
      high: high === null ? close : high * factor,
      low: low === null ? close : low * factor,
      volume: finite(quote?.volume?.[i]) ?? 0,
    });
  }

  if (points.length < 20) throw new Error(`Historial insuficiente para ${symbol}`);

  return {
    symbol: result.meta?.symbol || symbol,
    currency: result.meta?.currency || "USD",
    exchange: result.meta?.exchangeName || "",
    points,
  };
}

async function fetchSecTicker(ticker: string): Promise<{ cik: string; title: string }> {
  const response = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: {
      Accept: "application/json",
      "User-Agent": "StockMind-Web/0.25 https://viralio.net/acciones",
    },
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error("SEC ticker map no disponible");
  const payload = (await response.json()) as Record<
    string,
    { cik_str?: number; ticker?: string; title?: string }
  >;

  for (const row of Object.values(payload)) {
    if (row.ticker?.toUpperCase() === ticker) {
      return {
        cik: String(row.cik_str ?? "").padStart(10, "0"),
        title: row.title || ticker,
      };
    }
  }
  throw new Error(`SEC no encontró CIK para ${ticker}`);
}

async function fetchCompanyFacts(cik: string): Promise<Record<string, unknown>> {
  const response = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "StockMind-Web/0.25 https://viralio.net/acciones",
    },
    next: { revalidate: 21600 },
  });
  if (!response.ok) throw new Error("SEC Company Facts no disponible");
  return (await response.json()) as Record<string, unknown>;
}

function getConcept(
  facts: Record<string, unknown>,
  taxonomy: string,
  tag: string,
): { units?: Record<string, SecFactRow[]> } | null {
  const taxonomyObject = facts[taxonomy];
  if (!taxonomyObject || typeof taxonomyObject !== "object") return null;
  const concept = (taxonomyObject as Record<string, unknown>)[tag];
  if (!concept || typeof concept !== "object") return null;
  return concept as { units?: Record<string, SecFactRow[]> };
}

function eligibleEntries(
  facts: Record<string, unknown>,
  aliases: Alias[],
  cutoffMs: number,
  unit: string,
): EligibleFact[] {
  for (const [taxonomy, tag] of aliases) {
    const concept = getConcept(facts, taxonomy, tag);
    const rows = concept?.units?.[unit];
    if (!Array.isArray(rows)) continue;
    const eligible: EligibleFact[] = [];

    for (const row of rows) {
      if (!row || !ALLOWED_FORMS.has(row.form || "")) continue;
      const filedMs = Date.parse(row.filed || "");
      const endMs = Date.parse(row.end || "");
      const startMs = row.start ? Date.parse(row.start) : null;
      const value = finite(row.val);
      if (
        value === null ||
        !Number.isFinite(filedMs) ||
        !Number.isFinite(endMs) ||
        filedMs > cutoffMs ||
        endMs > cutoffMs
      ) {
        continue;
      }
      eligible.push({
        value,
        filed: row.filed!,
        filedMs,
        start: row.start || null,
        startMs: startMs !== null && Number.isFinite(startMs) ? startMs : null,
        end: row.end!,
        endMs,
      });
    }

    if (eligible.length) return eligible;
  }
  return [];
}

function dedupeIntervals(entries: EligibleFact[]): EligibleFact[] {
  const best = new Map<string, EligibleFact>();
  for (const row of entries) {
    const key = `${row.start || ""}|${row.end}`;
    const prior = best.get(key);
    if (!prior || row.filedMs > prior.filedMs) best.set(key, row);
  }
  return [...best.values()].sort((a, b) => a.endMs - b.endMs || a.filedMs - b.filedMs);
}

function quarterValues(intervals: EligibleFact[]): Array<{ end: string; value: number; filed: string }> {
  const byEnd = new Map<string, { value: number; filed: string; priority: number }>();

  for (const row of intervals) {
    if (row.startMs === null) continue;
    const days = (row.endMs - row.startMs) / 86400000;
    if (days >= 65 && days <= 125) {
      byEnd.set(row.end, { value: row.value, filed: row.filed, priority: 2 });
    }
  }

  const groups = new Map<number, EligibleFact[]>();
  for (const row of intervals) {
    if (row.startMs === null) continue;
    const days = (row.endMs - row.startMs) / 86400000;
    if (days >= 65 && days <= 400) {
      const group = groups.get(row.startMs) || [];
      group.push(row);
      groups.set(row.startMs, group);
    }
  }

  for (const rows of groups.values()) {
    rows.sort((a, b) => a.endMs - b.endMs);
    let previous: EligibleFact | null = null;
    for (const row of rows) {
      if (!previous) {
        previous = row;
        continue;
      }
      const increment = row.value - previous.value;
      const existing = byEnd.get(row.end);
      if (!existing || existing.priority < 1) {
        byEnd.set(row.end, { value: increment, filed: row.filed, priority: 1 });
      }
      previous = row;
    }
  }

  return [...byEnd.entries()]
    .map(([end, value]) => ({ end, value: value.value, filed: value.filed }))
    .sort((a, b) => a.end.localeCompare(b.end));
}

function ttm(
  facts: Record<string, unknown>,
  aliases: Alias[],
  cutoffMs: number,
  unit: string,
): FactValue | null {
  const intervals = dedupeIntervals(eligibleEntries(facts, aliases, cutoffMs, unit));
  const quarters = quarterValues(intervals);
  if (quarters.length >= 4) {
    const last = quarters.slice(-4);
    return {
      value: last.reduce((sum, row) => sum + row.value, 0),
      filed: last.map((row) => row.filed).sort().at(-1)!,
      end: last.at(-1)!.end,
    };
  }

  const annual = intervals.filter((row) => {
    if (row.startMs === null) return false;
    const days = (row.endMs - row.startMs) / 86400000;
    return days >= 300 && days <= 400;
  });
  const row = annual.at(-1);
  if (!row) return null;
  return { value: row.value, filed: row.filed, start: row.start || undefined, end: row.end };
}

function instant(
  facts: Record<string, unknown>,
  aliases: Alias[],
  cutoffMs: number,
  unit: string,
): FactValue | null {
  const entries = eligibleEntries(facts, aliases, cutoffMs, unit).sort(
    (a, b) => a.endMs - b.endMs || a.filedMs - b.filedMs,
  );
  const row = entries.at(-1);
  return row ? { value: row.value, filed: row.filed, end: row.end } : null;
}

function annualHistory(
  facts: Record<string, unknown>,
  aliases: Alias[],
  cutoffMs: number,
  unit: string,
): Array<{ end: string; value: number }> {
  const entries = dedupeIntervals(eligibleEntries(facts, aliases, cutoffMs, unit));
  const byEnd = new Map<string, number>();
  for (const row of entries) {
    if (row.startMs === null) continue;
    const days = (row.endMs - row.startMs) / 86400000;
    if (days >= 300 && days <= 400) byEnd.set(row.end, row.value);
  }
  return [...byEnd.entries()]
    .map(([end, value]) => ({ end, value }))
    .sort((a, b) => a.end.localeCompare(b.end));
}

function instantHistory(
  facts: Record<string, unknown>,
  aliases: Alias[],
  cutoffMs: number,
  unit: string,
): Array<{ end: string; value: number }> {
  const entries = eligibleEntries(facts, aliases, cutoffMs, unit);
  const byEnd = new Map<string, EligibleFact>();
  for (const row of entries) {
    const prior = byEnd.get(row.end);
    if (!prior || row.filedMs > prior.filedMs) byEnd.set(row.end, row);
  }
  return [...byEnd.values()]
    .sort((a, b) => a.endMs - b.endMs)
    .map((row) => ({ end: row.end, value: row.value }));
}

async function fetchFundamentals(
  ticker: string,
  currentPrice: number,
): Promise<FundamentalSnapshot> {
  const { cik, title } = await fetchSecTicker(ticker);
  const payload = await fetchCompanyFacts(cik);
  const factsObject = payload.facts;
  if (!factsObject || typeof factsObject !== "object") throw new Error("SEC sin facts utilizables");
  const facts = factsObject as Record<string, unknown>;
  const cutoffMs = Date.now();

  const revenue = ttm(facts, REVENUE, cutoffMs, "USD");
  const netIncome = ttm(facts, NET_INCOME, cutoffMs, "USD");
  const operatingIncome = ttm(facts, OPERATING_INCOME, cutoffMs, "USD");
  const ocf = ttm(facts, OCF, cutoffMs, "USD");
  const capex = ttm(facts, CAPEX, cutoffMs, "USD");
  const interest = ttm(facts, INTEREST, cutoffMs, "USD");
  const tax = ttm(facts, TAX, cutoffMs, "USD");
  const pretax = ttm(facts, PRETAX, cutoffMs, "USD");

  const cash = instant(facts, CASH, cutoffMs, "USD");
  const equity = instant(facts, EQUITY, cutoffMs, "USD");
  const shares = instant(facts, SHARES, cutoffMs, "shares");
  const debtCurrent = instant(facts, DEBT_CURRENT, cutoffMs, "USD");
  const debtNonCurrent = instant(facts, DEBT_NONCURRENT, cutoffMs, "USD");

  const totalDebtParts = [debtCurrent?.value, debtNonCurrent?.value].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const totalDebt = totalDebtParts.length
    ? totalDebtParts.reduce((sum, value) => sum + value, 0)
    : null;

  const freeCashFlow =
    ocf !== null ? ocf.value - Math.abs(capex?.value ?? 0) : null;

  let taxRate = 0.21;
  if (tax && pretax && pretax.value !== 0) {
    taxRate = clamp(Math.abs(tax.value / pretax.value), 0, 0.4);
  }

  const publicationDates = [
    revenue,
    netIncome,
    operatingIncome,
    ocf,
    capex,
    interest,
    tax,
    pretax,
    cash,
    equity,
    shares,
    debtCurrent,
    debtNonCurrent,
  ]
    .filter((value): value is FactValue => value !== null)
    .map((value) => value.filed)
    .sort();

  const revenueHistory = annualHistory(facts, REVENUE, cutoffMs, "USD").slice(-5);
  const ocfHistory = annualHistory(facts, OCF, cutoffMs, "USD");
  const capexHistory = annualHistory(facts, CAPEX, cutoffMs, "USD");
  const capexMap = new Map(capexHistory.map((row) => [row.end, row.value]));
  const fcfHistory = ocfHistory
    .filter((row) => capexMap.has(row.end))
    .map((row) => row.value - Math.abs(capexMap.get(row.end)!))
    .slice(-5);

  const sharesHistory = instantHistory(facts, SHARES, cutoffMs, "shares")
    .slice(-5)
    .map((row) => row.value);

  const sharesOutstanding = shares?.value ?? null;
  const marketCap =
    sharesOutstanding && sharesOutstanding > 0 ? currentPrice * sharesOutstanding : null;

  return {
    ticker,
    sharesOutstanding,
    revenueTtm: revenue?.value ?? null,
    netIncomeTtm: netIncome?.value ?? null,
    ebitTtm: operatingIncome?.value ?? null,
    freeCashFlowTtm: freeCashFlow,
    operatingCashFlowTtm: ocf?.value ?? null,
    capexTtm: capex?.value ?? null,
    cash: cash?.value ?? null,
    totalDebt,
    equity: equity?.value ?? null,
    interestExpenseTtm: interest ? Math.abs(interest.value) : null,
    taxRate,
    revenueHistory: revenueHistory.map((row) => row.value),
    fcfHistory,
    dilutedSharesHistory: sharesHistory,
    currentPrice,
    marketCap,
    asOfDate: new Date().toISOString().slice(0, 10),
    sourcePublicationDate: publicationDates.at(-1) ?? null,
    dataSource: "SEC EDGAR",
    companyName: title,
  };
}

export function analyzeFundamental(f: FundamentalSnapshot): EngineResult {
  const nopat = f.ebitTtm !== null ? f.ebitTtm * (1 - f.taxRate) : null;
  const invested =
    f.equity !== null ? f.equity + (f.totalDebt || 0) - (f.cash || 0) : null;
  const roic = invested !== null && invested > 0 ? ratio(nopat, invested) : null;
  const roe = ratio(f.netIncomeTtm, f.equity);
  const fcfMargin = ratio(f.freeCashFlowTtm, f.revenueTtm);
  const netMargin = ratio(f.netIncomeTtm, f.revenueTtm);
  const debtToFcf =
    f.totalDebt !== null && f.freeCashFlowTtm !== null && f.freeCashFlowTtm > 0
      ? ratio(f.totalDebt, f.freeCashFlowTtm)
      : null;
  const interestCover =
    f.interestExpenseTtm !== null && f.interestExpenseTtm > 0
      ? ratio(f.ebitTtm, f.interestExpenseTtm)
      : null;
  const revenueCagr = cagr(f.revenueHistory);
  const fcfCagr = cagr(f.fcfHistory);

  let dilution: number | null = null;
  if (f.dilutedSharesHistory.length >= 2 && f.dilutedSharesHistory[0] > 0) {
    dilution = f.dilutedSharesHistory.at(-1)! / f.dilutedSharesHistory[0] - 1;
  }

  const positiveFcfRatio = f.fcfHistory.length
    ? f.fcfHistory.filter((value) => value > 0).length / f.fcfHistory.length
    : null;

  let score = 50;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (roic !== null) {
    if (roic >= 0.2) {
      score += 18;
      reasons.push(`ROIC alto (${(roic * 100).toFixed(1)}%)`);
    } else if (roic >= 0.12) {
      score += 10;
      reasons.push(`ROIC sólido (${(roic * 100).toFixed(1)}%)`);
    } else if (roic < 0.06) {
      score -= 12;
      risks.push(`ROIC bajo (${(roic * 100).toFixed(1)}%)`);
    }
  }

  if (fcfMargin !== null) {
    if (fcfMargin >= 0.15) {
      score += 12;
      reasons.push(`margen FCF fuerte (${(fcfMargin * 100).toFixed(1)}%)`);
    } else if (fcfMargin >= 0.08) {
      score += 7;
    } else if (fcfMargin < 0) {
      score -= 18;
      risks.push("flujo de caja libre negativo");
    }
  }

  if (positiveFcfRatio !== null) {
    if (positiveFcfRatio >= 0.8) {
      score += 10;
      reasons.push("FCF históricamente consistente");
    } else if (positiveFcfRatio < 0.5) {
      score -= 10;
      risks.push("FCF poco consistente");
    }
  }

  if (revenueCagr !== null) {
    if (revenueCagr >= 0.08) {
      score += 8;
      reasons.push(`ventas creciendo ${(revenueCagr * 100).toFixed(1)}% anual`);
    } else if (revenueCagr >= 0.03) {
      score += 4;
    } else if (revenueCagr < 0) {
      score -= 8;
      risks.push("ventas en contracción");
    }
  }

  if (debtToFcf !== null) {
    if (debtToFcf <= 2) {
      score += 8;
      reasons.push("deuda contenida frente al FCF");
    } else if (debtToFcf <= 4) {
      score += 3;
    } else if (debtToFcf > 6) {
      score -= 10;
      risks.push("deuda elevada frente al FCF");
    }
  }

  if (interestCover !== null) {
    if (interestCover >= 8) score += 6;
    else if (interestCover < 2) {
      score -= 9;
      risks.push("cobertura de intereses débil");
    }
  }

  if (dilution !== null) {
    if (dilution <= 0) {
      score += 5;
      reasons.push("sin dilución neta reciente");
    } else if (dilution > 0.08) {
      score -= 7;
      risks.push(`dilución acumulada ${(dilution * 100).toFixed(1)}%`);
    }
  }

  const available = [
    roic,
    roe,
    fcfMargin,
    netMargin,
    revenueCagr,
    fcfCagr,
    debtToFcf,
    positiveFcfRatio,
  ];
  const completeness = available.filter((value) => value !== null).length / available.length;
  const confidence = clamp(0.3 + completeness * 0.55, 0.25, 0.9);
  score = clamp(score, 0, 100);

  let summary = reasons.slice(0, 3).join("; ") || "fundamentos mixtos o datos limitados";
  if (risks.length) summary += `. Riesgo: ${risks[0]}`;

  return {
    name: "Fundamental",
    score,
    confidence,
    summary,
    details: {
      roic,
      roe,
      fcf_margin: fcfMargin,
      net_margin: netMargin,
      revenue_cagr: revenueCagr,
      fcf_cagr: fcfCagr,
      debt_to_fcf: debtToFcf,
      interest_coverage: interestCover,
      share_dilution: dilution,
      positive_fcf_ratio: positiveFcfRatio,
    },
  };
}

export function analyzeValuation(f: FundamentalSnapshot): EngineResult {
  const price = f.currentPrice;
  const shares = f.sharesOutstanding;
  if (!price || price <= 0 || !shares || shares <= 0) {
    return {
      name: "Valuation",
      score: 50,
      confidence: 0.2,
      summary: "No hay precio o acciones en circulación suficientes para valorar",
      details: {},
    };
  }

  const candidates = [f.freeCashFlowTtm, ...f.fcfHistory.slice(-3)].filter(
    (value): value is number => value !== null && value > 0,
  );
  if (candidates.length < 2) {
    return {
      name: "Valuation",
      score: 45,
      confidence: 0.25,
      summary: "FCF positivo insuficiente para un DCF defendible",
      details: { current_price: price },
    };
  }

  const baseFcf = median(candidates);
  const revenueGrowth = cagr(f.revenueHistory);
  const fcfGrowth = cagr(f.fcfHistory);
  const growthInputs = [revenueGrowth, fcfGrowth].filter(
    (value): value is number => value !== null,
  );
  let rawGrowth = 0.03;
  if (growthInputs.length === 2) rawGrowth = Math.min(...growthInputs);
  else if (growthInputs.length === 1) rawGrowth = growthInputs[0] * 0.75;
  const growth = clamp(rawGrowth, -0.03, 0.12);

  const discount = 0.1;
  const terminalGrowth = 0.025;
  let cashFlow = baseFcf;
  let presentValue = 0;
  const forecast: number[] = [];
  for (let year = 1; year <= 5; year += 1) {
    cashFlow *= 1 + growth;
    forecast.push(cashFlow);
    presentValue += cashFlow / (1 + discount) ** year;
  }

  const terminal =
    (forecast.at(-1)! * (1 + terminalGrowth)) / (discount - terminalGrowth);
  const enterpriseValue = presentValue + terminal / (1 + discount) ** 5;
  const equityValue = enterpriseValue + (f.cash || 0) - (f.totalDebt || 0);
  const intrinsicPerShare = equityValue / shares;
  const marginOfSafety = intrinsicPerShare / price - 1;

  const marketCap = f.marketCap || price * shares;
  const fcfYield =
    f.freeCashFlowTtm !== null && marketCap > 0 ? f.freeCashFlowTtm / marketCap : null;
  const ownerEarningsYield = marketCap > 0 ? baseFcf / marketCap : null;
  const pe =
    f.netIncomeTtm !== null && f.netIncomeTtm > 0 ? marketCap / f.netIncomeTtm : null;

  let score = 50;
  if (marginOfSafety >= 0.35) score += 28;
  else if (marginOfSafety >= 0.15) score += 18;
  else if (marginOfSafety >= 0) score += 8;
  else if (marginOfSafety < -0.3) score -= 25;
  else if (marginOfSafety < -0.1) score -= 15;

  if (ownerEarningsYield !== null) {
    if (ownerEarningsYield >= 0.07) score += 12;
    else if (ownerEarningsYield >= 0.045) score += 6;
    else if (ownerEarningsYield < 0.025) score -= 8;
  }

  const positiveRatio = f.fcfHistory.length
    ? f.fcfHistory.filter((value) => value > 0).length / f.fcfHistory.length
    : 0.5;
  const dataFields = [f.freeCashFlowTtm, f.cash, f.totalDebt, f.netIncomeTtm, revenueGrowth, fcfGrowth];
  const completeness = dataFields.filter((value) => value !== null).length / dataFields.length;
  const confidence = clamp(0.35 + 0.3 * completeness + 0.2 * positiveRatio, 0.3, 0.88);

  return {
    name: "Valuation",
    score: clamp(score, 0, 100),
    confidence,
    summary: `DCF conservador: valor estimado ${intrinsicPerShare.toFixed(
      2,
    )} vs precio ${price.toFixed(2)}; margen de seguridad ${(marginOfSafety * 100).toFixed(1)}%`,
    details: {
      current_price: price,
      intrinsic_value_per_share: intrinsicPerShare,
      margin_of_safety: marginOfSafety,
      normalized_fcf: baseFcf,
      forecast_growth: growth,
      discount_rate: discount,
      terminal_growth: terminalGrowth,
      fcf_yield: fcfYield,
      owner_earnings_yield: ownerEarningsYield,
      pe,
    },
  };
}

export function analyzeTechnical(points: MarketPoint[]): EngineResult {
  const close = points.map((point) => point.close);
  if (close.length < 220) {
    return {
      name: "Technical",
      score: 50,
      confidence: 0.25,
      summary: "Historial insuficiente para tendencia de largo plazo",
      details: {},
    };
  }

  const price = close.at(-1)!;
  const ma50 = rollingMean(close, 50)!;
  const ma200 = rollingMean(close, 200)!;
  const rsi14 = rsi(close);
  const return63 = close.length >= 64 ? price / close.at(-64)! - 1 : 0;

  let score = 50;
  const reasons: string[] = [];
  if (price > ma50) {
    score += 12;
    reasons.push("precio sobre media de 50 días");
  } else score -= 10;

  if (ma50 > ma200) {
    score += 14;
    reasons.push("tendencia primaria positiva");
  } else score -= 12;

  if (return63 > 0) {
    score += Math.min(12, (return63 * 100) / 2);
    reasons.push("momentum trimestral positivo");
  } else {
    score += Math.max(-12, (return63 * 100) / 2);
  }

  if (rsi14 >= 40 && rsi14 <= 68) {
    score += 8;
    reasons.push("RSI en zona saludable");
  } else if (rsi14 > 78) {
    score -= 8;
    reasons.push("RSI muy extendido");
  }

  return {
    name: "Technical",
    score: clamp(score, 0, 100),
    confidence: 0.75,
    summary: reasons.slice(0, 3).join(", ") || "señales técnicas mixtas",
    details: { price, ma50, ma200, rsi14, return_63d: return63 },
  };
}

export function analyzeSeasonality(points: MarketPoint[]): EngineResult {
  if (!points.length) {
    return { name: "Seasonality", score: 50, confidence: 0.2, summary: "Sin datos para estacionalidad", details: {} };
  }

  const monthEnd = new Map<string, MarketPoint>();
  for (const point of points) monthEnd.set(point.date.slice(0, 7), point);
  const months = [...monthEnd.entries()].sort(([a], [b]) => a.localeCompare(b));
  const returns: Array<{ month: number; year: number; value: number }> = [];
  for (let i = 1; i < months.length; i += 1) {
    const previous = months[i - 1][1].close;
    const current = months[i][1].close;
    const [year, month] = months[i][0].split("-").map(Number);
    returns.push({ year, month, value: current / previous - 1 });
  }

  const lastDate = new Date(points.at(-1)!.date + "T00:00:00Z");
  const currentMonth = lastDate.getUTCMonth() + 1;
  const currentYear = lastDate.getUTCFullYear();
  const historical = returns.filter(
    (row) => !(row.year === currentYear && row.month === currentMonth),
  );

  if (historical.length < 36) {
    return {
      name: "Seasonality",
      score: 50,
      confidence: 0.2,
      summary: "Muestra mensual insuficiente",
      details: { month: currentMonth, samples: 0 },
    };
  }

  const sample = historical.filter((row) => row.month === currentMonth).map((row) => row.value);
  if (sample.length < 5) {
    return {
      name: "Seasonality",
      score: 50,
      confidence: 0.25,
      summary: "Muy pocos años comparables",
      details: { month: currentMonth, samples: sample.length },
    };
  }

  const winRate = sample.filter((value) => value > 0).length / sample.length;
  const med = median(sample);
  const avg = mean(sample);
  const worst = Math.min(...sample);
  const score = clamp(50 + (winRate - 0.5) * 55 + clamp(med * 180, -18, 18), 0, 100);
  const confidence = Math.min(0.9, 0.35 + sample.length / 40);

  return {
    name: "Seasonality",
    score,
    confidence,
    summary: `Mes ${currentMonth}: positivo en ${Math.round(winRate * 100)}% de ${sample.length} observaciones completas; mediana ${(med * 100).toFixed(1)}%`,
    details: {
      month: currentMonth,
      samples: sample.length,
      win_rate: winRate,
      median_return: med,
      mean_return: avg,
      worst_return: worst,
    },
  };
}

export function analyzeAnalogs(
  points: MarketPoint[],
  window = 60,
  horizon = 20,
  topK = 12,
): EngineResult {
  const close = points.map((point) => point.close);
  const minimum = window * 3 + horizon;
  if (close.length < minimum) {
    return {
      name: "Historical analogs",
      score: 50,
      confidence: 0.2,
      summary: "Historial insuficiente para buscar análogos",
      details: {},
    };
  }

  const target = normalizedShape(close.slice(-window));
  const candidates: Array<{ distance: number; forward: number }> = [];
  const lastEnd = close.length - window - horizon;
  const step = Math.max(5, Math.floor(window / 6));

  for (let end = window; end < lastEnd; end += step) {
    const shape = normalizedShape(close.slice(end - window, end));
    if (!shape.length || shape.length !== target.length) continue;
    const distance = euclidean(target, shape) / Math.sqrt(shape.length);
    const forward = close[end + horizon - 1] / close[end - 1] - 1;
    candidates.push({ distance, forward });
  }

  const best = candidates.sort((a, b) => a.distance - b.distance).slice(0, topK);
  if (best.length < 5) {
    return {
      name: "Historical analogs",
      score: 50,
      confidence: 0.25,
      summary: "No hay suficientes análogos históricos",
      details: {},
    };
  }

  const returns = best.map((row) => row.forward);
  const distances = best.map((row) => row.distance);
  const wins = returns.filter((value) => value > 0).length / returns.length;
  const med = median(returns);
  const worst = Math.min(...returns);
  const similarity = Math.exp(-mean(distances));
  const score = clamp(50 + (wins - 0.5) * 50 + clamp(med * 160, -20, 20), 0, 100);
  const confidence = clamp(0.25 + similarity * 0.35 + best.length / 40, 0, 0.9);

  return {
    name: "Historical analogs",
    score,
    confidence,
    summary: `${Math.round(wins * best.length)}/${best.length} análogos terminaron positivos a ${horizon} ruedas; mediana ${(med * 100).toFixed(1)}%`,
    details: {
      samples: best.length,
      win_rate: wins,
      median_forward_return: med,
      worst_forward_return: worst,
      similarity,
    },
  };
}

export function analyzeRisk(points: MarketPoint[]): EngineResult {
  const close = points.map((point) => point.close);
  const returns = pctChanges(close);
  if (returns.length < 60) {
    return { name: "Risk", score: 50, confidence: 0.2, summary: "Historial insuficiente para riesgo", details: {} };
  }

  const vol = std(returns.slice(-252)) * Math.sqrt(252);
  const recent = close.slice(-Math.min(756, close.length));
  let peak = recent[0];
  let maxDd = 0;
  let currentDd = 0;
  for (const price of recent) {
    peak = Math.max(peak, price);
    currentDd = price / peak - 1;
    maxDd = Math.min(maxDd, currentDd);
  }

  let score = 85 - clamp(vol * 100, 0, 55) - clamp(Math.abs(currentDd) * 70, 0, 25);
  if (maxDd < -0.55) score -= 8;

  return {
    name: "Risk",
    score: clamp(score, 0, 100),
    confidence: 0.8,
    summary: `volatilidad anualizada ${(vol * 100).toFixed(1)}%; drawdown actual ${(currentDd * 100).toFixed(1)}%`,
    details: {
      annualized_volatility: vol,
      current_drawdown: currentDd,
      max_drawdown_window: maxDd,
    },
  };
}

export function analyzeRegime(
  spy: MarketPoint[],
  qqq: MarketPoint[],
  vix: MarketPoint[],
): EngineResult {
  const close = spy.map((point) => point.close);
  if (close.length < 220) {
    return {
      name: "Market regime",
      score: 50,
      confidence: 0.25,
      summary: "Historial insuficiente para clasificar el mercado",
      details: {},
    };
  }

  const price = close.at(-1)!;
  const ma50 = rollingMean(close, 50)!;
  const ma200 = rollingMean(close, 200)!;
  const mom63 = price / close.at(-64)! - 1;
  const high252 = Math.max(...close.slice(-252));
  const drawdown = price / high252 - 1;
  const vol20 = std(pctChanges(close).slice(-20)) * Math.sqrt(252);

  let score = 50;
  const reasons: string[] = [];
  if (price > ma200) {
    score += 15;
    reasons.push("SPY sobre su media de 200 días");
  } else {
    score -= 18;
    reasons.push("SPY debajo de su media de 200 días");
  }

  if (ma50 > ma200) {
    score += 10;
    reasons.push("estructura 50/200 positiva");
  } else score -= 10;

  if (mom63 > 0) {
    score += 10;
    reasons.push(`momentum trimestral +${(mom63 * 100).toFixed(1)}%`);
  } else {
    score -= 10;
    reasons.push(`momentum trimestral ${(mom63 * 100).toFixed(1)}%`);
  }

  if (drawdown <= -0.2) score -= 18;
  else if (drawdown <= -0.12) score -= 10;
  else if (drawdown >= -0.05) score += 5;

  if (vol20 >= 0.35) score -= 15;
  else if (vol20 >= 0.25) score -= 8;
  else if (vol20 <= 0.15) score += 5;

  const qqqClose = qqq.map((point) => point.close);
  let qqqAbove200: boolean | null = null;
  if (qqqClose.length >= 200) {
    qqqAbove200 = qqqClose.at(-1)! > rollingMean(qqqClose, 200)!;
    score += qqqAbove200 ? 6 : -6;
  }

  const vixLevel = vix.length ? vix.at(-1)!.close : null;
  if (vixLevel !== null) {
    if (vixLevel >= 40) score -= 15;
    else if (vixLevel >= 30) score -= 10;
    else if (vixLevel <= 18) score += 5;
  }

  score = clamp(score, 0, 100);
  const regime = score >= 70 ? "BULL" : score >= 50 ? "NEUTRAL" : score >= 35 ? "DEFENSIVE" : "STRESS";
  const completeness = 1 + Number(qqqAbove200 !== null) + Number(vixLevel !== null);
  const confidence = clamp(0.65 + 0.1 * completeness, 0.65, 0.9);

  let summary = `${regime}: ${reasons.slice(0, 3).join("; ")}`;
  if (vixLevel !== null) summary += `; VIX ${vixLevel.toFixed(1)}`;

  return {
    name: "Market regime",
    score,
    confidence,
    summary,
    details: {
      regime,
      spy_price: price,
      spy_ma50: ma50,
      spy_ma200: ma200,
      spy_momentum_63d: mom63,
      spy_drawdown: drawdown,
      spy_volatility_20d: vol20,
      qqq_above_200d: qqqAbove200,
      vix: vixLevel,
    },
  };
}

function analyzeDataQuality(
  points: MarketPoint[],
  fundamentals: FundamentalSnapshot | null,
  fundamentalError: string | null,
): EngineResult {
  let score = 100;
  const issues: string[] = [];
  const details: Record<string, unknown> = { market_rows: points.length };

  if (!points.length) {
    return {
      name: "Data quality",
      score: 0,
      confidence: 0.95,
      summary: "Sin serie de precios utilizable",
      details: { issues: ["missing_market_data"] },
    };
  }

  const latest = new Date(points.at(-1)!.date + "T00:00:00Z");
  const today = new Date();
  const ageDays = Math.max(0, Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - latest.getTime()) / 86400000));
  details.latest_market_date = points.at(-1)!.date;
  details.market_age_days = ageDays;
  if (ageDays > 14) {
    score -= 30;
    issues.push(`precios desactualizados (${ageDays} días)`);
  } else if (ageDays > 7) {
    score -= 15;
    issues.push(`precios con ${ageDays} días de antigüedad`);
  }

  if (points.length < 220) {
    score -= 10;
    issues.push("historial corto para motores de largo plazo");
  }

  if (!fundamentals) {
    score -= 40;
    details.fundamental_completeness = 0;
    issues.push("fundamentales no disponibles");
    if (fundamentalError) details.fundamental_error = fundamentalError;
  } else {
    const critical = [
      fundamentals.revenueTtm,
      fundamentals.netIncomeTtm,
      fundamentals.ebitTtm,
      fundamentals.freeCashFlowTtm,
      fundamentals.sharesOutstanding,
      fundamentals.cash,
      fundamentals.totalDebt,
      fundamentals.equity,
    ];
    const completeness = critical.filter((value) => value !== null && Number.isFinite(value)).length / critical.length;
    details.fundamental_completeness = completeness;
    if (completeness < 0.4) {
      score -= 35;
      issues.push(`fundamentales muy incompletos (${Math.round(completeness * 100)}%)`);
    } else if (completeness < 0.65) {
      score -= 20;
      issues.push(`fundamentales incompletos (${Math.round(completeness * 100)}%)`);
    } else if (completeness < 0.85) {
      score -= 8;
      issues.push(`fundamentales parciales (${Math.round(completeness * 100)}%)`);
    }
    details.source_publication_date = fundamentals.sourcePublicationDate;
    details.as_of_date = fundamentals.asOfDate;
    details.data_source = fundamentals.dataSource;
  }

  score = clamp(score, 0, 100);
  const summary =
    score >= 85
      ? "Datos sólidos para el análisis actual"
      : score >= 65
        ? "Datos utilizables con algunas limitaciones"
        : score >= 45
          ? `Calidad de datos limitada: ${issues.slice(0, 3).join("; ")}`
          : `Datos insuficientes o poco confiables: ${issues.slice(0, 3).join("; ")}`;

  details.issues = issues;
  return { name: "Data quality", score, confidence: 0.95, summary, details };
}

function compose(ticker: string, engines: EngineResult[]): {
  compositeScore: number;
  confidence: number;
  signal: Signal;
  reasons: string[];
  risks: string[];
} {
  const effective = engines.map((engine) => ({
    engine,
    weight: (WEIGHTS[engine.name] || 0) * Math.max(0.1, engine.confidence),
  }));
  const denominator = effective.reduce((sum, row) => sum + row.weight, 0) || 1;
  const compositeScore =
    effective.reduce((sum, row) => sum + row.engine.score * row.weight, 0) / denominator;
  const baseWeightSum = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let confidence =
    engines.reduce(
      (sum, engine) => sum + engine.confidence * (WEIGHTS[engine.name] || 0),
      0,
    ) / baseWeightSum;

  const byName = new Map(engines.map((engine) => [engine.name, engine]));
  const quality = byName.get("Data quality");
  if (quality) confidence *= 0.55 + 0.45 * (quality.score / 100);

  const fundamental = byName.get("Fundamental");
  const valuation = byName.get("Valuation");
  const risk = byName.get("Risk");
  const regime = byName.get("Market regime");

  let signal: Signal;
  if (quality && quality.score < 40) signal = "CAUTION";
  else if (fundamental && fundamental.score < 35) signal = "CAUTION";
  else if (
    fundamental &&
    valuation &&
    fundamental.confidence >= 0.35 &&
    valuation.confidence >= 0.35 &&
    compositeScore >= 72 &&
    fundamental.score >= 60 &&
    valuation.score >= 55 &&
    (!risk || risk.score >= 45) &&
    (!regime || regime.score >= 35) &&
    (!quality || quality.score >= 65)
  ) {
    signal = "CANDIDATE";
  } else if (compositeScore >= 60) signal = "WATCH";
  else if (compositeScore < 40) signal = "CAUTION";
  else signal = "NEUTRAL";

  const positive = engines
    .filter((engine) => engine.name !== "Data quality")
    .sort((a, b) => b.score * Math.max(b.confidence, 0.2) - a.score * Math.max(a.confidence, 0.2))
    .slice(0, 3);
  const negative = [...engines].sort((a, b) => a.score - b.score).slice(0, 3);

  return {
    compositeScore: clamp(compositeScore, 0, 100),
    confidence: clamp(confidence, 0, 1),
    signal,
    reasons: positive.filter((engine) => engine.score >= 58).map((engine) => `${engine.name}: ${engine.summary}`),
    risks: negative.filter((engine) => engine.score <= 48).map((engine) => `${engine.name}: ${engine.summary}`),
  };
}

const SIGNAL_LABELS: Record<Signal, string> = {
  CANDIDATE: "Candidato",
  WATCH: "Observar",
  NEUTRAL: "Neutral",
  CAUTION: "Precaución",
};

export async function analyzeTicker(rawTicker: string): Promise<StockMindAnalysis> {
  const ticker = rawTicker.trim().toUpperCase();
  if (!/^[A-Z0-9.^-]{1,12}$/.test(ticker)) throw new Error("Ticker inválido");

  const [stock, spy, qqq, vix] = await Promise.all([
    fetchYahooSeries(ticker, "10y"),
    fetchYahooSeries("SPY", "2y"),
    fetchYahooSeries("QQQ", "2y"),
    fetchYahooSeries("^VIX", "1y"),
  ]);

  const price = stock.points.at(-1)!.close;
  const previous = stock.points.at(-2)?.close;
  const dayChange = previous && previous > 0 ? price / previous - 1 : null;

  const marketEngines = [
    analyzeTechnical(stock.points),
    analyzeSeasonality(stock.points),
    analyzeAnalogs(stock.points),
    analyzeRisk(stock.points),
    analyzeRegime(spy.points, qqq.points, vix.points),
  ];

  let fundamentals: FundamentalSnapshot | null = null;
  let fundamentalError: string | null = null;
  let fundamentalEngines: EngineResult[];

  try {
    fundamentals = await fetchFundamentals(ticker, price);
    fundamentalEngines = [analyzeFundamental(fundamentals), analyzeValuation(fundamentals)];
  } catch (error) {
    fundamentalError = error instanceof Error ? error.message : "Fundamentales no disponibles";
    fundamentalEngines = [
      {
        name: "Fundamental",
        score: 50,
        confidence: 0.1,
        summary: `Datos fundamentales no disponibles: ${fundamentalError}`,
        details: {},
      },
      {
        name: "Valuation",
        score: 50,
        confidence: 0.1,
        summary: "Valoración suspendida por falta de datos",
        details: { current_price: price },
      },
    ];
  }

  const quality = analyzeDataQuality(stock.points, fundamentals, fundamentalError);
  const engines = [...fundamentalEngines, ...marketEngines, quality];
  const composed = compose(ticker, engines);

  const sparkline = stock.points
    .slice(-126)
    .map((point) => point.close)
    .filter((value) => Number.isFinite(value));

  return {
    ticker,
    companyName: fundamentals?.companyName || ticker,
    currency: stock.currency,
    exchange: stock.exchange,
    price,
    dayChange,
    compositeScore: composed.compositeScore,
    confidence: composed.confidence,
    signal: composed.signal,
    signalLabel: SIGNAL_LABELS[composed.signal],
    reasons: composed.reasons,
    risks: composed.risks,
    engines,
    sparkline,
    asOf: stock.points.at(-1)!.date,
    marketSource: "Yahoo Finance chart",
    fundamentalSource: fundamentals?.dataSource || "No disponible",
  };
}
