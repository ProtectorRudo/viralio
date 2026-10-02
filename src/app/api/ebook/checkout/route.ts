import { NextResponse } from "next/server";
import { createMercadoPagoCheckout, LEGACY_PAYMENT_LINK } from "@/ebook/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = await createMercadoPagoCheckout();
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("[ebook-checkout]", error);
    return NextResponse.redirect(LEGACY_PAYMENT_LINK, { status: 302 });
  }
}
