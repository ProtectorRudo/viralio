import type {
  MerchantMetricsPeriod,
  MerchantMetricsWindow,
} from "@/domain/types";

const DAY_MS = 24 * 60 * 60 * 1000;

const PERIOD_DAYS: Record<Exclude<MerchantMetricsPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function parseMerchantMetricsPeriod(value: string | undefined): MerchantMetricsPeriod {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all") return value;
  return "30d";
}

export function merchantMetricsWindows(
  period: MerchantMetricsPeriod,
  now: Date,
): { current: MerchantMetricsWindow; previous?: MerchantMetricsWindow } {
  const to = now.toISOString();
  if (period === "all") return { current: { to } };

  const days = PERIOD_DAYS[period];
  const currentFrom = new Date(now.getTime() - days * DAY_MS).toISOString();
  const previousFrom = new Date(now.getTime() - days * 2 * DAY_MS).toISOString();

  return {
    current: { from: currentFrom, to },
    previous: { from: previousFrom, to: currentFrom },
  };
}

export function merchantMetricsPeriodLabel(period: MerchantMetricsPeriod): string {
  if (period === "7d") return "Últimos 7 días";
  if (period === "30d") return "Últimos 30 días";
  if (period === "90d") return "Últimos 90 días";
  return "Todo el historial";
}
