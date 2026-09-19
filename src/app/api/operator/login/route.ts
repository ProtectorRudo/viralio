import { NextResponse } from "next/server";
import {
  createOperatorSessionToken,
  isSameOrigin,
  OPERATOR_SESSION_COOKIE,
  operatorCookieOptions,
  verifyOnboardingKey,
} from "@/security/merchant-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.key !== "string" || !verifyOnboardingKey(body.key)) {
      return NextResponse.json({ error: "Clave inválida" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(OPERATOR_SESSION_COOKIE, createOperatorSessionToken(), operatorCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar la sesión" }, { status: 400 });
  }
}
