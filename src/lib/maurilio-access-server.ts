const ACCESS_URL =
  "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/maurilio-access";

const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

export type AccessTier = "pro" | "elite";

export type AccessStatus = {
  matchday: string | null;
  pro: boolean;
  elite: boolean;
  activeEntitlements: number;
};

export type AccessLibraryReport = {
  id: string;
  tier: AccessTier;
  matchday: string;
  label: string;
  matchDate: string | null;
  status: string;
  grantedAt: string;
  expiresAt: string | null;
};

export type AccessLibrary = {
  reports: AccessLibraryReport[];
};

export type PremiumReport = Record<string, unknown> & {
  public_id?: string;
  tier?: AccessTier;
  competition?: string;
  event?: string;
  market?: string;
  selection?: string | null;
  bookmaker?: string;
  entry_odds?: number | string | null;
  minimum_odds?: number | string | null;
  probability_own?: number | string | null;
  probability_low?: number | string | null;
  probability_high?: number | string | null;
  implied_probability?: number | string | null;
  edge?: number | string | null;
  ev?: number | string | null;
  stake_pct?: number | string | null;
  stake_ars?: number | string | null;
  thesis?: string | null;
  principal_risk?: string | null;
  odds_captured_at?: string | null;
  event_start_at?: string | null;
  sale_status?: string | null;
  sale_closed_reason?: string | null;
  last_observed_odds?: number | string | null;
  result?: string | null;
  closing_odds?: number | string | null;
  pnl_ars?: number | string | null;
  settled_at?: string | null;
  access_tag?: string;
  matchday?: {
    slug: string;
    label: string;
    matchDate: string;
    status: string;
  };
};

export function validSubjectId(value: string | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

export async function invokeMaurilioAccess<T>(
  payload: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const response = await fetch(ACCESS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PUBLIC_SUPABASE_JWT}`,
        apikey: PUBLIC_SUPABASE_JWT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    } & T;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: body.error || "access_unavailable",
      };
    }

    return { ok: true, data: body };
  } catch {
    return { ok: false, status: 503, error: "access_unavailable" };
  }
}
