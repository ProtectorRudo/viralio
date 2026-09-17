import { NextResponse } from "next/server";
import { createQrEntry, QR_ENTRY_COOKIE } from "@/analytics/qr-attribution";
import { recordQrOpen } from "@/analytics/qr-entry";
import { merchantExperiencePath } from "@/config/merchant-accounts";
import { getMerchantBySlug } from "@/config/merchants";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const experiencePath = getMerchantBySlug(slug)
    ? `/${encodeURIComponent(slug)}`
    : merchantExperiencePath(slug);
  const target = new URL(experiencePath, request.url);

  try {
    const merchantId = await recordQrOpen(slug);
    const entryToken = await createQrEntry(merchantId);
    const response = NextResponse.redirect(target, 307);
    response.cookies.set(QR_ENTRY_COOKIE, entryToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }
}
