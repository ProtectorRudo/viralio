const CONNECT_URL =
  "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/maurilio-mercadopago-connect";

const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

export async function invokeMaurilioPaymentAccount<T>(
  payload: Record<string, unknown>,
  accessToken: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const response = await fetch(CONNECT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: PUBLIC_SUPABASE_JWT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
        error: body.error || "payment_account_unavailable",
      };
    }

    return { ok: true, data: body };
  } catch {
    return { ok: false, status: 503, error: "payment_account_unavailable" };
  }
}
