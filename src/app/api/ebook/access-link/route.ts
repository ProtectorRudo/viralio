import { NextResponse } from "next/server";
import {
  EBOOK_ACCESS_COOKIE,
  accessCookieOptions,
  getPurchase,
  publicBaseUrl,
  verifyAccessToken,
} from "@/ebook/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("t");
  const token = verifyAccessToken(raw);

  if (!token) {
    return NextResponse.redirect(publicBaseUrl() + "/ebook/acceso?state=invalid_link", { status: 302 });
  }

  const purchase = await getPurchase(token.paymentId).catch(() => undefined);
  if (!purchase || purchase.status !== "approved") {
    return NextResponse.redirect(publicBaseUrl() + "/ebook/acceso?state=invalid_link", { status: 302 });
  }

  const response = NextResponse.redirect(publicBaseUrl() + "/ebook/acceso?ok=1", { status: 302 });
  response.cookies.set(EBOOK_ACCESS_COOKIE, raw!, accessCookieOptions());
  return response;
}
