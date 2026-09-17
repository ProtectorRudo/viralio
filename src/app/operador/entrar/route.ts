import { NextResponse } from "next/server";
import { viralio } from "@/application";
import {
  createMerchantSessionToken,
  MERCHANT_SESSION_COOKIE,
  merchantCookieOptions,
  operatorSessionFromRequest,
} from "@/security/merchant-auth";

const destinations = new Set(["panel", "configuracion", "activacion", "canjes"]);

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

function publicUrl(request: Request, pathname: string): URL {
  const requestUrl = new URL(request.url);
  const host = firstHeaderValue(request.headers.get("x-forwarded-host"))
    ?? firstHeaderValue(request.headers.get("host"))
    ?? requestUrl.host;
  const protocol = firstHeaderValue(request.headers.get("x-forwarded-proto"))
    ?? requestUrl.protocol.slice(0, -1);
  return new URL(pathname, `${protocol}://${host}`);
}

export async function GET(request: Request) {
  if (!operatorSessionFromRequest(request)) {
    return NextResponse.redirect(publicUrl(request, "/operador"));
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";
  const destination = url.searchParams.get("destino")?.trim() ?? "panel";
  if (!slug || !destinations.has(destination)) {
    return NextResponse.redirect(publicUrl(request, "/operador"));
  }

  try {
    const merchant = await viralio.getMerchantForExperience(slug);
    const response = NextResponse.redirect(publicUrl(request, `/comercio/${merchant.slug}/${destination}`));
    response.cookies.set(
      MERCHANT_SESSION_COOKIE,
      createMerchantSessionToken(merchant.id),
      merchantCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.redirect(publicUrl(request, "/operador"));
  }
}
