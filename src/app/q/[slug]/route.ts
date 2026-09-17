import { NextResponse } from "next/server";
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
    await recordQrOpen(slug);
    return NextResponse.redirect(target, 307);
  } catch {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }
}
