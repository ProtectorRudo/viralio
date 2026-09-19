import { NextResponse } from "next/server";
import { viralio } from "@/application";
import {
  createMerchantSessionToken,
  MERCHANT_SESSION_COOKIE,
  merchantCookieOptions,
  operatorSessionFromRequest,
} from "@/security/merchant-auth";

const destinations = new Set(["panel", "configuracion", "activacion", "canjes"]);

function sameOriginRedirect(pathname: string): NextResponse {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: pathname },
  });
}

export async function GET(request: Request) {
  if (!operatorSessionFromRequest(request)) {
    return sameOriginRedirect("/operador");
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";
  const destination = url.searchParams.get("destino")?.trim() ?? "panel";
  if (!slug || !destinations.has(destination)) {
    return sameOriginRedirect("/operador");
  }

  try {
    const merchant = await viralio.getMerchantForExperience(slug);
    const response = sameOriginRedirect(`/comercio/${merchant.slug}/${destination}`);
    response.cookies.set(
      MERCHANT_SESSION_COOKIE,
      createMerchantSessionToken(merchant.id),
      merchantCookieOptions(),
    );
    return response;
  } catch {
    return sameOriginRedirect("/operador");
  }
}
