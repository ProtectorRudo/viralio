import { NextRequest, NextResponse } from "next/server";
import {
  MAURILIO_AUTH_COOKIE,
  MAURILIO_REFRESH_COOKIE,
  signUpMaurilio,
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

function setSession(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  maxAge: number,
) {
  response.cookies.set(MAURILIO_AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/maurilio",
    maxAge,
  });

  response.cookies.set(MAURILIO_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/maurilio",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  let body: {
    email?: unknown;
    password?: unknown;
    displayName?: unknown;
    role?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const role = body.role === "tipster" ? "tipster" : "user";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "invalid_password" }, { status: 400 });
  }
  if (displayName.length < 2 || displayName.length > 60) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const result = await signUpMaurilio({
    email,
    password,
    displayName,
    role,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.body.error || result.body.msg || "signup_failed" },
      { status: result.status },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      needsConfirmation: !result.body.access_token,
      role,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );

  if (result.body.access_token && result.body.refresh_token) {
    setSession(
      response,
      result.body.access_token,
      result.body.refresh_token,
      Number(result.body.expires_in || 3600),
    );
  }

  return response;
}
