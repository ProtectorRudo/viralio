const TIPSTERS_URL =
  "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/maurilio-tipsters-public";

const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

export type PublicTipsterCard = {
  id: string;
  slug: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  sports: string[];
  specialties: string[];
  monthly_price_ars: number | null;
  currency: string;
  is_verified: boolean;
  accepting_subscribers: boolean;
  picks_count_90d: number;
  roi_pct_90d: number | null;
  win_rate_pct_90d: number | null;
  avg_odds_90d: number | null;
  avg_clv_pct_90d: number | null;
  max_drawdown_units_90d: number | null;
  open_tips_count: number;
  sponsored: boolean;
  sponsor_priority: number;
};

export type TipsterSearchResponse = {
  sponsored: PublicTipsterCard[];
  results: PublicTipsterCard[];
  sports: string[];
  total: number;
  note: string;
};

export type TipsterHistoryRow = {
  public_id: string;
  sport: string;
  competition: string;
  event: string;
  market: string;
  selection: string;
  bookmaker: string;
  entry_odds: number | string;
  closing_odds: number | string | null;
  stake_units: number | string;
  event_start_at: string;
  published_at: string;
  settled_at: string;
  result: "win" | "loss" | "push" | "void";
  profit_units: number | string;
  clv_pct: number | string | null;
  content_hash: string;
};

export type TipsterProfileResponse = {
  tipster: PublicTipsterCard;
  history: TipsterHistoryRow[];
  future: {
    locked: true;
    count: number;
  };
};

export async function fetchTipsters(): Promise<TipsterSearchResponse | null> {
  try {
    const response = await fetch(TIPSTERS_URL, {
      headers: {
        Authorization: `Bearer ${PUBLIC_SUPABASE_JWT}`,
        apikey: PUBLIC_SUPABASE_JWT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) return null;
    return (await response.json()) as TipsterSearchResponse;
  } catch {
    return null;
  }
}

export async function fetchTipsterProfile(
  slug: string,
): Promise<TipsterProfileResponse | null> {
  try {
    const url = new URL(TIPSTERS_URL);
    url.searchParams.set("view", "profile");
    url.searchParams.set("slug", slug);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PUBLIC_SUPABASE_JWT}`,
        apikey: PUBLIC_SUPABASE_JWT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) return null;
    return (await response.json()) as TipsterProfileResponse;
  } catch {
    return null;
  }
}
