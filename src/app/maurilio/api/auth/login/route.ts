import { NextRequest, NextResponse } from "next/server";
import {
  MAURILIO_AUTH_COOKIE,
  MAURILIO_REFRESH_COOKIE,
  signInMaurilio,
} from "@/lib/maurilio-auth-server";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "credentials_required" }, { status: 400 });
  }

  const result = await signInMaurilio({ email, password });
  if (
    !result.ok ||
    !result.body.access_token ||
    !result.body.refresh_token
  ) {
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: result.status === 503 ? 503 : 401 },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );

  response.cookies.set(MAURILIO_AUTH_COOKIE, result.body.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/maurilio",
    maxAge: Number(result.body.expires_in || 3600),
  });
  response.cookies.set(MAURILIO_REFRESH_COOKIE, result.body.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/maurilio",
    maxAge: 60 * 60 * 24 * 90,
  });

  return response;
}
