import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  fetchMercadoPagoPayment,
  isApprovedEbookPayment,
  recordPurchase,
  recordWebhookEvent,
  sendDeliveryEmail,
  validateMercadoPagoWebhookSignature,
} from "@/ebook/server";

export const dynamic = "force-dynamic";

type Payload = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
  id?: string | number;
};

export async function POST(request: Request) {
  const raw = await request.text();
  let body: Payload = {};
  try {
    body = raw ? JSON.parse(raw) as Payload : {};
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const url = new URL(request.url);
  const paymentId = String(
    body.data?.id
      ?? body.id
      ?? url.searchParams.get("data.id")
      ?? url.searchParams.get("id")
      ?? "",
  ).trim();

  const eventType = body.type ?? body.action ?? url.searchParams.get("type") ?? "unknown";
  const requestId = request.headers.get("x-request-id");
  const signature = request.headers.get("x-signature");
  const secretConfigured = Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim());

  if (secretConfigured) {
    const valid = validateMercadoPagoWebhookSignature({
      xSignature: signature,
      xRequestId: requestId,
      dataId: paymentId || null,
    });
    if (!valid) {
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
    }
  }

  const payloadSha256 = crypto.createHash("sha256").update(raw).digest("hex");
  await recordWebhookEvent({
    requestId,
    paymentId: paymentId || null,
    eventType,
    payloadSha256,
  }).catch((error) => console.error("[ebook-webhook-log]", error));

  if (!paymentId || !String(eventType).toLowerCase().includes("payment")) {
    return NextResponse.json({ ok: true });
  }

  try {
    const payment = await fetchMercadoPagoPayment(paymentId);
    if (!isApprovedEbookPayment(payment)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const purchase = await recordPurchase(payment);
    await sendDeliveryEmail(purchase.payment_id, purchase.payer_email).catch((error) => {
      console.error("[ebook-webhook-email]", error);
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ebook-webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
