import { NextResponse } from "next/server";
import { viralio } from "@/application";
import {
  MERCHANT_SESSION_COOKIE,
  createMerchantSessionToken,
  isSameOrigin,
  merchantCookieOptions,
  verifyMerchantPin,
} from "@/security/merchant-auth";
import {
  checkMerchantLoginThrottle,
  clearMerchantLoginThrottle,
  merchantLoginThrottleKey,
  recordMerchantLoginFailure,
} from "@/security/login-throttle";

function rateLimited(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Demasiados intentos. Probá nuevamente en unos minutos." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) },
    },
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as { merchantSlug?: unknown; pin?: unknown };
    if (typeof body.merchantSlug !== "string" || typeof body.pin !== "string") {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const throttleKey = merchantLoginThrottleKey(request, body.merchantSlug);
    const throttle = await checkMerchantLoginThrottle(throttleKey);
    if (throttle.blocked) return rateLimited(throttle.retryAfterSeconds);

    const merchantId = verifyMerchantPin(body.merchantSlug, body.pin)
      ?? await viralio.authenticateDynamicMerchant(body.merchantSlug, body.pin);
    if (!merchantId) {
      const failure = await recordMerchantLoginFailure(throttleKey);
      if (failure.blocked) return rateLimited(failure.retryAfterSeconds);
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    await clearMerchantLoginThrottle(throttleKey);
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
