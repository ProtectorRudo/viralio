const BET365_URL =
  "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/maurilio-bet365";

const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

export async function invokeBet365<T>(
  params: URLSearchParams,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const url = new URL(BET365_URL);
    for (const [key, value] of params) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PUBLIC_SUPABASE_JWT}`,
        apikey: PUBLIC_SUPABASE_JWT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(9000),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    } & T;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: body.error || "bet365_feed_unavailable",
      };
    }

    return { ok: true, data: body };
  } catch {
    return { ok: false, status: 503, error: "bet365_feed_unavailable" };
  }
}
