import { NextResponse } from "next/server";
import { MERCHANT_SESSION_COOKIE, isSameOrigin, merchantCookieOptions } from "@/security/merchant-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(MERCHANT_SESSION_COOKIE, "", { ...merchantCookieOptions(), maxAge: 0 });
  return response;
}
