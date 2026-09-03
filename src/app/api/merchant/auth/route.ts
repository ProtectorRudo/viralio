import { NextResponse } from "next/server";
import { viralio } from "@/application";
import {
  MERCHANT_SESSION_COOKIE,
  createMerchantSessionToken,
  isSameOrigin,
  merchantCookieOptions,
  verifyMerchantPin,
} from "@/security/merchant-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as { merchantSlug?: unknown; pin?: unknown };
    if (typeof body.merchantSlug !== "string" || typeof body.pin !== "string") {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const merchantId = verifyMerchantPin(body.merchantSlug, body.pin)
      ?? await viralio.authenticateDynamicMerchant(body.merchantSlug, body.pin);
    if (!merchantId) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(
      MERCHANT_SESSION_COOKIE,
      createMerchantSessionToken(merchantId),
      merchantCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Acceso de comercio no disponible" }, { status: 503 });
  }
}
