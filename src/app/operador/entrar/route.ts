import { NextResponse } from "next/server";
import { viralio } from "@/application";
import {
  createMerchantSessionToken,
  MERCHANT_SESSION_COOKIE,
  merchantCookieOptions,
  operatorSessionFromRequest,
} from "@/security/merchant-auth";

const destinations = new Set(["panel", "configuracion", "activacion", "canjes"]);

export async function GET(request: Request) {
  if (!operatorSessionFromRequest(request)) {
    return NextResponse.redirect(new URL("/operador", request.url));
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";
  const destination = url.searchParams.get("destino")?.trim() ?? "panel";
  if (!slug || !destinations.has(destination)) {
    return NextResponse.redirect(new URL("/operador", request.url));
  }

  try {
    const merchant = await viralio.getMerchantForExperience(slug);
    const response = NextResponse.redirect(new URL(`/comercio/${merchant.slug}/${destination}`, request.url));
    response.cookies.set(
      MERCHANT_SESSION_COOKIE,
      createMerchantSessionToken(merchant.id),
      merchantCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL("/operador", request.url));
  }
}
