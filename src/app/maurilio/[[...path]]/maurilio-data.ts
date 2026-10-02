const STATE_URL =
  "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/maurilio-public-state";

const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

export type PublicState = {
  mode: "off_market" | "no_value" | "matchday";
  status: string;
  label: string;
  matchday: {
    slug: string;
    matchDate: string;
    publishedAt: string | null;
  } | null;
  free: Record<string, unknown> | null;
  premium: {
    pro: boolean;
    elite: boolean;
  };
  risk: Record<string, unknown> | null;
  updatedAt: string;
};

export type LedgerItem = Record<string, unknown> & {
  public_id?: string;
  tier?: string;
  competition?: string;
  event?: string;
  market?: string;
  selection?: string | null;
  bookmaker?: string;
  entry_odds?: number | string | null;
  closing_odds?: number | string | null;
  probability_own?: number | string | null;
  probability_low?: number | string | null;
  probability_high?: number | string | null;
  stake_pct?: number | string | null;
  stake_ars?: number | string | null;
  result?: string | null;
  pnl_ars?: number | string | null;
  published_at?: string | null;
  settled_at?: string | null;
  matchday?: {
    slug: string;
    matchDate: string;
    label: string;
  } | null;
};

export type LedgerState = {
  ledger: LedgerItem[];
  risk: Record<string, unknown> | null;
  updatedAt: string;
};

export type IntegrityState = {
  state: PublicState;
  audit: Array<{
    event_type: string;
    created_at: string;
  }>;
  updatedAt: string;
};

export async function fetchMaurilioGateway<T>(
  view: "state" | "ledger" | "integrity" = "state",
): Promise<T | null> {
  try {
    const url = new URL(STATE_URL);
    if (view !== "state") url.searchParams.set("view", view);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PUBLIC_SUPABASE_JWT}`,
        apikey: PUBLIC_SUPABASE_JWT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function numeric(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function pct(value: unknown, digits = 1, signed = false) {
  const number = numeric(value);
  if (number === null) return "—";
  const prefix = signed && number >= 0 ? "+" : "";
  return `${prefix}${(number * 100).toFixed(digits)}%`;
}

export function odds(value: unknown) {
  const number = numeric(value);
  return number === null ? "—" : `@${number.toFixed(2)}`;
}

export function ars(value: unknown) {
  const number = numeric(value);
  return number === null
    ? "—"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(number);
}

export function artDateTime(value: unknown) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return (
    new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date) + " ART"
  );
}
