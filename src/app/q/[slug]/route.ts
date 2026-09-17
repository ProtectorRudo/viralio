import { NextResponse } from "next/server";
import { recordQrOpen } from "@/analytics/qr-entry";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const target = new URL(`/${encodeURIComponent(slug)}`, request.url);

  try {
    await recordQrOpen(slug);
    return NextResponse.redirect(target, 307);
  } catch {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }
}
