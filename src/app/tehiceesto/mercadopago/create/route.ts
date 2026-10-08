import { NextRequest, NextResponse } from "next/server";
import {
  cleanPaymentToken,
  mercadoPagoIdempotencyKey,
  paymentBridge,
  syncPaymentBridge,
  type BridgeConfig,
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
  if (!accessToken) return json({ error: "mercadopago_not_configured" }, 503);

  let token: string;
  try {
    const body = await request.json();
    token = cleanPaymentToken(body?.token);
  } catch {
    return json({ error: "invalid_token" }, 400);
  }

  try {
    const config = await paymentBridge<BridgeConfig>({ action: "config", token });

    if (
      !/^[a-f0-9]{18}$/.test(String(config.code || "")) ||
      !Number.isInteger(config.amountMinor) ||
      config.amountMinor <= 0 ||
      config.currency !== "ARS"
    ) {
      return json({ error: "invalid_checkout_config" }, 409);
    }

    if (config.currentCheckoutUrl && config.providerReference) {
      return json({
        checkoutUrl: config.currentCheckoutUrl,
        providerOrderId: config.providerReference,
        amountMinor: config.amountMinor,
        currency: config.currency,
        reused: true,
      });
    }

    const amount = (config.amountMinor / 100).toFixed(2);
    const externalReference = `thi_${token}`;
    const root = "https://tehiceesto.com";

    const response = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        accept: "application/json",
        "x-idempotency-key": mercadoPagoIdempotencyKey(token),
      },
      body: JSON.stringify({
        type: "online",
        processing_mode: "manual",
        total_amount: amount,
        external_reference: externalReference,
        description: "Te Hice Esto · experiencia personalizada",
        items: [
          {
            title: "Te Hice Esto · experiencia personalizada",
            quantity: 1,
            unit_measure: "unit",
            unit_price: amount,
            total_amount: amount,
          },
        ],
        config: {
          online: {
            success_url: `${root}/pedido/${config.code}?pago=exitoso`,
            pending_url: `${root}/pedido/${config.code}?pago=pendiente`,
            failure_url: `${root}/pedido/${config.code}?pago=fallido`,
            auto_return: "approved",
          },
          // Cuotas sin interés absorbidas por Te Hice Esto, sin excluir medios.
          payment_method: {
            max_installments: 3,
            installments_cost: "seller",
            installments: {
              interest_free: { type: "range", values: [1, 3] },
            },
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const raw = await response.text();
    let order: Record<string, unknown> = {};
    try {
      order = raw ? JSON.parse(raw) : {};
    } catch {}

    if (
      !response.ok ||
      typeof order.id !== "string" ||
      typeof order.checkout_url !== "string"
    ) {
      console.error("tehiceesto_mp_order_failed", response.status);
      return json({ error: "checkout_create_failed" }, 502);
    }

    await syncPaymentBridge({
      token,
      providerOrderId: order.id,
      status: "pending",
      amountMinor: config.amountMinor,
      checkoutUrl: order.checkout_url,
    });

    return json({
      checkoutUrl: order.checkout_url,
      providerOrderId: order.id,
      amountMinor: config.amountMinor,
      currency: config.currency,
      reused: false,
    });
  } catch (error) {
    console.error(
      "tehiceesto_checkout_failed",
      error instanceof Error ? error.message : "unknown",
    );
    return json({ error: "checkout_unavailable" }, 502);
  }
}
