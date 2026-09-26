import { NextResponse } from "next/server";
import { isSameOrigin, OPERATOR_SESSION_COOKIE, operatorCookieOptions } from "@/security/merchant-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OPERATOR_SESSION_COOKIE, "", { ...operatorCookieOptions(), maxAge: 0 });
  return response;
}
