const SUPABASE_URL = "https://bwsgxpttnrctklrcjmjs.supabase.co";

const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: Record<string, unknown>;
  error?: string;
  error_description?: string;
  msg?: string;
};

async function authFetch(
  path: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; body: AuthResponse }> {
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: PUBLIC_SUPABASE_JWT,
        Authorization: `Bearer ${PUBLIC_SUPABASE_JWT}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });

    const body = (await response.json().catch(() => ({}))) as AuthResponse;
    return { ok: response.ok, status: response.status, body };
  } catch {
    return {
      ok: false,
      status: 503,
      body: { error: "auth_unavailable" },
    };
  }
}

export async function signUpMaurilio(input: {
  email: string;
  password: string;
  displayName: string;
  role: "user" | "tipster";
}) {
  return authFetch("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: {
        display_name: input.displayName,
        maurilio_role: input.role,
      },
    }),
  });
}

export async function signInMaurilio(input: {
  email: string;
  password: string;
}) {
  return authFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function refreshMaurilio(refreshToken: string) {
  return authFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function getMaurilioUser(accessToken: string) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: PUBLIC_SUPABASE_JWT,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } catch {
    return {
      ok: false,
      status: 503,
      body: {},
    };
  }
}

export const MAURILIO_AUTH_COOKIE = "maurilio_auth";
export const MAURILIO_REFRESH_COOKIE = "maurilio_refresh";
