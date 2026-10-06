import { NextRequest, NextResponse } from "next/server";
import {
  cleanPaymentToken,
  mercadoPagoBridgeStatus,
  moneyMinor,
  syncPaymentBridge,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/tehiceesto-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();

  if (!accessToken || !webhookSecret) {
    return json({ error: "mercadopago_not_configured" }, 503);
  }

  let body: Record<string, any> = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const dataId = String(
    request.nextUrl.searchParams.get("data.id") || body?.data?.id || "",
  ).trim();
  const topic = String(
    request.nextUrl.searchParams.get("type") || body?.type || "",
  )
    .trim()
    .toLowerCase();

  if (!dataId || topic !== "order") {
    return json({ ok: true, ignored: true });
  }

  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";

  if (
    !verifyMercadoPagoWebhookSignature({
      secret: webhookSecret,
      dataId,
      requestId,
      signature,
    })
  ) {
    return json({ error: "invalid_signature" }, 401);
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/orders/${encodeURIComponent(dataId)}`,
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(9_000),
      },
    );

    if (!response.ok) {
      console.error("tehiceesto_mp_order_lookup_failed", response.status);
      return json({ error: "provider_lookup_failed" }, 502);
    }

    const order = (await response.json()) as Record<string, any>;
    const externalReference = String(order.external_reference || "");

    if (!externalReference.startsWith("thi_")) {
      return json({ ok: true, ignored: true });
    }

    const token = cleanPaymentToken(externalReference.slice(4));
    const amountMinor = moneyMinor(order.total_amount);

    if (!Number.isInteger(amountMinor)) {
      return json({ error: "invalid_provider_amount" }, 502);
    }

    const status = mercadoPagoBridgeStatus(order.status, order.status_detail);

    await syncPaymentBridge({
      token,
      providerOrderId: String(order.id || dataId),
      status,
      amountMinor,
    });

    return json({ ok: true, status });
  } catch (error) {
    console.error(
      "tehiceesto_webhook_failed",
      error instanceof Error ? error.message : "unknown",
    );
    return json({ error: "sync_failed" }, 502);
  }
}
