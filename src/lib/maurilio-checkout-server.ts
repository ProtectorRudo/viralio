const CHECKOUT_URL =
  "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/maurilio-checkout";

const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

export type CheckoutTier = "pro" | "elite";

export type CheckoutStatus = {
  enabled: boolean;
  provider: "mercado_pago";
  prices: {
    pro: number | null;
    elite: number | null;
  };
  availability: {
    pro: boolean;
    elite: boolean;
  };
  saleEndsAt: {
    pro: string | null;
    elite: string | null;
  };
};

export async function invokeMaurilioCheckout<T>(
  payload: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const response = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PUBLIC_SUPABASE_JWT}`,
        apikey: PUBLIC_SUPABASE_JWT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    } & T;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: body.error || "checkout_unavailable",
      };
    }

    return { ok: true, data: body };
  } catch {
    return { ok: false, status: 503, error: "checkout_unavailable" };
  }
}
