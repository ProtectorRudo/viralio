import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const PAYMENT_BRIDGE =
  "https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/payment-bridge";

export type BridgeConfig = {
  code: string;
  amountMinor: number;
  currency: string;
  currentCheckoutUrl?: string | null;
  providerReference?: string | null;
};

export function cleanPaymentToken(value: unknown) {
  const token = String(value || "").trim().toLowerCase();
  if (!/^[a-f0-9]{48}$/.test(token)) throw new Error("invalid_token");
  return token;
}

export function mercadoPagoIdempotencyKey(token: string) {
  const hex = createHash("sha256").update(`checkout-pro-config-v2:${token}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function signPaymentBridge(token: string, message: string) {
  return createHmac("sha256", token).update(message).digest("hex");
}

export function moneyMinor(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : NaN;
}

export function mercadoPagoBridgeStatus(status: unknown, detail: unknown) {
  const normalizedStatus = String(status || "").toLowerCase();
  const normalizedDetail = String(detail || "").toLowerCase();

  if (normalizedStatus === "processed" && normalizedDetail === "accredited") {
    return "approved" as const;
  }
  if (normalizedStatus === "refunded" || normalizedDetail === "refunded") {
    return "refunded" as const;
  }
  if (normalizedStatus === "failed") return "rejected" as const;
  if (["canceled", "cancelled", "expired"].includes(normalizedStatus)) {
    return "cancelled" as const;
  }
  return "pending" as const;
}

export async function paymentBridge<T = Record<string, unknown>>(
  body: Record<string, unknown>,
) {
  const response = await fetch(PAYMENT_BRIDGE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "payment_bridge_failed");
  }

  return data;
}

export async function syncPaymentBridge(input: {
  token: string;
  providerOrderId: string;
  status: "pending" | "approved" | "rejected" | "refunded" | "cancelled";
  amountMinor: number;
  checkoutUrl?: string;
}) {
  const checkoutUrl = input.checkoutUrl || "";
  const canonical =
    `${input.token}|${input.providerOrderId}|${input.status}|${input.amountMinor}|${checkoutUrl}`;

  return paymentBridge({
    action: "sync",
    token: input.token,
    providerOrderId: input.providerOrderId,
    status: input.status,
    amountMinor: input.amountMinor,
    checkoutUrl,
    signature: signPaymentBridge(input.token, canonical),
  });
}

function parseSignature(value: string) {
  const parts = new Map<string, string>();
  for (const item of value.split(",")) {
    const index = item.indexOf("=");
    if (index > 0) {
      parts.set(item.slice(0, index).trim(), item.slice(index + 1).trim());
    }
  }
  return {
    ts: parts.get("ts") || "",
    v1: (parts.get("v1") || "").toLowerCase(),
  };
}

export function verifyMercadoPagoWebhookSignature(input: {
  secret: string;
  dataId: string;
  requestId: string;
  signature: string;
}) {
  const { ts, v1 } = parseSignature(input.signature);
  if (!/^\d{10,16}$/.test(ts) || !/^[a-f0-9]{64}$/.test(v1)) return false;

  const normalizedDataId = input.dataId.toLowerCase();
  let manifest = `id:${normalizedDataId};`;
  if (input.requestId) manifest += `request-id:${input.requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", input.secret)
    .update(manifest)
    .digest("hex");

  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(v1, "hex");

  return left.length === right.length && timingSafeEqual(left, right);
}
