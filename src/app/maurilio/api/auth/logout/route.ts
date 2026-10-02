import { NextRequest, NextResponse } from "next/server";
import {
  MAURILIO_AUTH_COOKIE,
  MAURILIO_REFRESH_COOKIE,
} from "@/lib/maurilio-auth-server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MAURILIO_AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/maurilio",
    maxAge: 0,
  });
  response.cookies.set(MAURILIO_REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/maurilio",
    maxAge: 0,
  });
  return response;
}
