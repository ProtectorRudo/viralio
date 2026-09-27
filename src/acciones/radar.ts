import { analyzeTicker, type StockMindAnalysis } from "@/acciones/stockmind";

const SCREENERS = [
  "undervalued_large_caps",
  "undervalued_growth_stocks",
  "growth_technology_stocks",
  "most_actives",
] as const;

const FALLBACK_UNIVERSE = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "NVDA",
  "BRK-B",
  "JPM",
  "V",
  "MA",
  "COST",
  "HD",
  "UNH",
  "MELI",
  "CRM",
  "ADBE",
  "AMD",
  "QCOM",
  "KO",
  "PEP",
];

type YahooScreenerPayload = {
  finance?: {
    result?: Array<{
      quotes?: Array<{
        symbol?: string;
        quoteType?: string;
      }>;
    }>;
  };
};

function validTicker(value: string) {
  return /^[A-Z0-9.^-]{1,12}$/.test(value);
}

async function screenOne(name: string, count: number): Promise<string[]> {
  const url =
    `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?count=${count}&scrIds=${encodeURIComponent(name)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 StockMind-Web/0.26",
      },
      next: { revalidate: 900 },
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as YahooScreenerPayload;
    const quotes = payload.finance?.result?.[0]?.quotes ?? [];

    return quotes
      .filter((quote) => {
        const type = (quote.quoteType || "EQUITY").toUpperCase();
        return type === "EQUITY" || type === "";
      })
      .map((quote) => (quote.symbol || "").trim().toUpperCase())
      .filter((symbol) => symbol && validTicker(symbol));
  } catch {
    return [];
  }
}

export async function discoverRadarTickers(limit = 12): Promise<string[]> {
  const target = Math.max(8, Math.min(24, limit));
  const perScreen = Math.min(25, Math.max(8, target));
  const batches = await Promise.all(
    SCREENERS.map((screener) => screenOne(screener, perScreen)),
  );

  const seen = new Set<string>();
  const symbols: string[] = [];

  for (const batch of batches) {
    for (const symbol of batch) {
      if (seen.has(symbol)) continue;
      seen.add(symbol);
      symbols.push(symbol);
      if (symbols.length >= target) return symbols;
    }
  }

  for (const symbol of FALLBACK_UNIVERSE) {
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    symbols.push(symbol);
    if (symbols.length >= target) break;
  }

  return symbols;
}

export function rankRadarAnalysis(report: StockMindAnalysis): number {
  const engineMap = new Map(report.engines.map((engine) => [engine.name, engine]));
  const fundamental = engineMap.get("Fundamental");
  const valuation = engineMap.get("Valuation");
  const regime = engineMap.get("Market regime");

  const evidenceFloor = Math.min(
    fundamental?.confidence ?? 0,
    valuation?.confidence ?? 0,
  );
  const regimeFactor = regime ? 0.85 + 0.15 * (regime.score / 100) : 1;

  return (
    report.compositeScore *
    (0.55 + 0.45 * report.confidence) *
    (0.75 + 0.25 * evidenceFloor) *
    regimeFactor
  );
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
): Promise<Array<R | null>> {
  const output: Array<R | null> = new Array(values.length).fill(null);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        output[index] = await mapper(values[index]);
      } catch {
        output[index] = null;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, values.length)) }, () =>
      worker(),
    ),
  );
  return output;
}

export async function scanRadar(limit = 6): Promise<StockMindAnalysis[]> {
  const safeLimit = Math.max(3, Math.min(6, limit));
  const discoveryLimit = Math.max(safeLimit * 2, 10);
  const tickers = await discoverRadarTickers(discoveryLimit);

  const reports = await mapWithConcurrency(tickers, 4, (ticker) =>
    analyzeTicker(ticker),
  );

  return reports
    .filter((report): report is StockMindAnalysis => report !== null)
    .sort((a, b) => rankRadarAnalysis(b) - rankRadarAnalysis(a))
    .slice(0, safeLimit);
}
