import { NextResponse } from "next/server";
import {
  EBOOK_ACCESS_COOKIE,
  accessCookieOptions,
  createAccessToken,
  fetchMercadoPagoPayment,
  isApprovedEbookPayment,
  publicBaseUrl,
  recordPurchase,
  sendDeliveryEmail,
} from "@/ebook/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "success";
  const paymentId =
    url.searchParams.get("payment_id")
    ?? url.searchParams.get("collection_id");

  if (state === "failure") {
    return NextResponse.redirect(publicBaseUrl() + "/ebook?payment=failed", { status: 302 });
  }

  if (!paymentId) {
    return NextResponse.redirect(publicBaseUrl() + "/ebook/acceso?state=" + encodeURIComponent(state), { status: 302 });
  }

  try {
    const payment = await fetchMercadoPagoPayment(paymentId);
    if (!isApprovedEbookPayment(payment)) {
      const paymentState = payment.status ?? state;
      return NextResponse.redirect(
        publicBaseUrl() + "/ebook/acceso?state=" + encodeURIComponent(paymentState),
        { status: 302 },
      );
    }

    const purchase = await recordPurchase(payment);
    await sendDeliveryEmail(purchase.payment_id, purchase.payer_email).catch((error) => {
      console.error("[ebook-email]", error);
    });

    const token = createAccessToken(purchase.payment_id);
    const response = NextResponse.redirect(publicBaseUrl() + "/ebook/acceso?ok=1", { status: 302 });
    response.cookies.set(EBOOK_ACCESS_COOKIE, token, accessCookieOptions());
    return response;
  } catch (error) {
    console.error("[ebook-return]", error);
    return NextResponse.redirect(publicBaseUrl() + "/ebook/acceso?state=verification_error", { status: 302 });
  }
}
