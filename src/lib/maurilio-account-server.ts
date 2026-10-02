const SUPABASE_URL = "https://bwsgxpttnrctklrcjmjs.supabase.co";

const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

export async function invokeMaurilioAccountRpc<T>(
  accessToken: string,
  name: string,
  payload: Record<string, unknown> = {},
): Promise<
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }
> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: {
          apikey: PUBLIC_SUPABASE_JWT,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      },
    );

    const body = (await response.json().catch(() => ({}))) as
      | T
      | { message?: string; code?: string };

    if (!response.ok) {
      const errorBody = body as { message?: string; code?: string };
      return {
        ok: false,
        status: response.status,
        error: errorBody.message || errorBody.code || "account_rpc_failed",
      };
    }

    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 503, error: "account_unavailable" };
  }
}
