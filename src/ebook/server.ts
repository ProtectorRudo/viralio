import crypto from "node:crypto";
import { gunzipSync } from "node:zlib";
import postgres from "postgres";
import type { EbookPurchase, MercadoPagoPayment } from "./types";

type Sql = postgres.Sql;

export const EBOOK_PRODUCT_REFERENCE = "ebook-anuncios-que-venden-v1";
export const EBOOK_PRICE_ARS = 14900;
export const EBOOK_ACCESS_COOKIE = "viralio_ebook_access";
export const EBOOK_ASSET_KEY = "anuncios-que-venden-2026";
export const LEGACY_PAYMENT_LINK = "https://mpago.la/2yjdJB9";

function databaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

async function withSql<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  const sql = postgres(databaseUrl(), {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
    prepare: false,
  });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 2 }).catch(() => undefined);
  }
}

function authSecret(): string {
  const value = process.env.VIRALIO_AUTH_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error("VIRALIO_AUTH_SECRET is not configured");
  }
  return value;
}

export function publicBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && configured.startsWith("https://") && !configured.includes(".example")) {
    return configured.replace(/\/$/, "");
  }
  return "https://viralio.net";
}

export function mercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

export async function createMercadoPagoCheckout(): Promise<string> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) return LEGACY_PAYMENT_LINK;

  const base = publicBaseUrl();
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      items: [
        {
          id: EBOOK_PRODUCT_REFERENCE,
          title: "ANUNCIOS QUE VENDEN - Playbook + Kit de Anuncios",
          description: "Ebook digital 2026",
          quantity: 1,
          currency_id: "ARS",
          unit_price: EBOOK_PRICE_ARS,
        },
      ],
      external_reference: EBOOK_PRODUCT_REFERENCE,
      metadata: {
        product: EBOOK_PRODUCT_REFERENCE,
      },
      back_urls: {
        success: base + "/ebook/acceso",
        pending: base + "/ebook/acceso?state=pending",
        failure: base + "/ebook?payment=failed",
      },
      auto_return: "approved",
      notification_url: base + "/api/ebook/mercadopago/webhook",
      statement_descriptor: "VIRALIO",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Mercado Pago preference failed (" + response.status + "): " + detail.slice(0, 400));
  }

  const payload = await response.json() as { init_point?: string };
  if (!payload.init_point) throw new Error("Mercado Pago did not return init_point");
  return payload.init_point;
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");

  const response = await fetch(
    "https://api.mercadopago.com/v1/payments/" + encodeURIComponent(paymentId),
    {
      headers: { Authorization: "Bearer " + accessToken },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Mercado Pago payment lookup failed (" + response.status + ")");
  }

  return await response.json() as MercadoPagoPayment;
}

export function isApprovedEbookPayment(payment: MercadoPagoPayment): boolean {
  const amount = Number(payment.transaction_amount);
  const metadataProduct =
    typeof payment.metadata?.product === "string"
      ? payment.metadata.product
      : undefined;

  return payment.status === "approved"
    && payment.currency_id === "ARS"
    && Math.abs(amount - EBOOK_PRICE_ARS) < 0.01
    && (
      payment.external_reference === EBOOK_PRODUCT_REFERENCE
      || metadataProduct === EBOOK_PRODUCT_REFERENCE
    );
}

export async function recordPurchase(payment: MercadoPagoPayment): Promise<EbookPurchase> {
  if (!isApprovedEbookPayment(payment)) {
    throw new Error("Payment is not an approved ebook purchase");
  }

  const paymentId = String(payment.id);
  const payerEmail = payment.payer?.email?.trim().toLowerCase();
  if (!payerEmail) throw new Error("Approved payment does not include payer email");

  return await withSql(async (sql) => {
    const rows = await sql.unsafe(
      "insert into private.ebook_purchases (" +
      "payment_id, payer_email, status, amount, currency_id, external_reference, description, approved_at, updated_at" +
      ") values ($1,$2,$3,$4,$5,$6,$7,$8,now()) " +
      "on conflict (payment_id) do update set " +
      "payer_email=excluded.payer_email,status=excluded.status,amount=excluded.amount," +
      "currency_id=excluded.currency_id,external_reference=excluded.external_reference," +
      "description=excluded.description,approved_at=coalesce(private.ebook_purchases.approved_at,excluded.approved_at)," +
      "updated_at=now() " +
      "returning payment_id,payer_email,status,amount,currency_id,approved_at,delivery_email_status,email_sent_at,download_count",
      [
        paymentId,
        payerEmail,
        payment.status || "approved",
        Number(payment.transaction_amount),
        payment.currency_id || "ARS",
        payment.external_reference || null,
        payment.description || null,
        payment.date_approved || new Date().toISOString(),
      ],
    ) as unknown as EbookPurchase[];

    if (!rows[0]) throw new Error("Could not persist ebook purchase");
    return rows[0];
  });
}

export async function getPurchase(paymentId: string): Promise<EbookPurchase | undefined> {
  return await withSql(async (sql) => {
    const rows = await sql.unsafe(
      "select payment_id,payer_email,status,amount,currency_id,approved_at,delivery_email_status,email_sent_at,download_count " +
      "from private.ebook_purchases where payment_id=$1 limit 1",
      [paymentId],
    ) as unknown as EbookPurchase[];
    return rows[0];
  });
}

export async function recordWebhookEvent(input: {
  requestId?: string | null;
  paymentId?: string | null;
  eventType: string;
  payloadSha256?: string | null;
}): Promise<void> {
  await withSql(async (sql) => {
    await sql.unsafe(
      "insert into private.ebook_webhook_events (request_id,payment_id,event_type,payload_sha256) " +
      "values ($1,$2,$3,$4) on conflict (request_id,payment_id,event_type) do nothing",
      [
        input.requestId || null,
        input.paymentId || null,
        input.eventType,
        input.payloadSha256 || null,
      ],
    );
  });
}

export async function markDownload(paymentId: string): Promise<void> {
  await withSql(async (sql) => {
    await sql.unsafe(
      "update private.ebook_purchases set download_count=download_count+1,last_download_at=now(),updated_at=now() " +
      "where payment_id=$1",
      [paymentId],
    );
  });
}

async function markEmailStatus(
  paymentId: string,
  status: EbookPurchase["delivery_email_status"],
  error?: string,
): Promise<void> {
  await withSql(async (sql) => {
    await sql.unsafe(
      "update private.ebook_purchases set delivery_email_status=$1," +
      "email_sent_at=case when $1='sent' then now() else email_sent_at end," +
      "last_email_error=$2,updated_at=now() where payment_id=$3",
      [status, error ? error.slice(0, 900) : null, paymentId],
    );
  });
}

export function createAccessToken(
  paymentId: string,
  lifetimeSeconds = 60 * 60 * 24 * 365,
): string {
  const exp = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  const payload = paymentId + "." + exp;
  const signature = crypto
    .createHmac("sha256", authSecret())
    .update("ebook-access-v1:" + payload)
    .digest("base64url");
  return payload + "." + signature;
}

export function verifyAccessToken(
  token: string | undefined | null,
): { paymentId: string; exp: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const paymentId = parts[0];
  const exp = Number(parts[1]);
  const signature = parts[2];
  if (!paymentId || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", authSecret())
    .update("ebook-access-v1:" + paymentId + "." + exp)
    .digest("base64url");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return { paymentId, exp };
}

export function accessCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 365) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/ebook",
    maxAge: maxAgeSeconds,
  };
}

export function validateMercadoPagoWebhookSignature(input: {
  xSignature?: string | null;
  xRequestId?: string | null;
  dataId?: string | null;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret || !input.xSignature) return false;

  const pieces: Record<string, string> = {};
  for (const piece of input.xSignature.split(",")) {
    const index = piece.indexOf("=");
    if (index > 0) pieces[piece.slice(0, index).trim()] = piece.slice(index + 1).trim();
  }

  const ts = pieces.ts;
  const v1 = pieces.v1;
  if (!ts || !v1) return false;

  let manifest = "";
  if (input.dataId) manifest += "id:" + input.dataId.toLowerCase() + ";";
  if (input.xRequestId) manifest += "request-id:" + input.xRequestId + ";";
  manifest += "ts:" + ts + ";";

  const digest = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const actual = Buffer.from(v1, "hex");
  const expected = Buffer.from(digest, "hex");

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function sendDeliveryEmail(paymentId: string, email: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EBOOK_EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    await markEmailStatus(paymentId, "not_configured");
    return false;
  }

  const token = createAccessToken(paymentId);
  const accessUrl =
    publicBaseUrl() + "/api/ebook/access-link?t=" + encodeURIComponent(token);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Tu acceso a ANUNCIOS QUE VENDEN",
      html:
        "<div style='font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0b0e12'>" +
        "<p style='font-size:12px;letter-spacing:.12em;font-weight:700'>VIRALIO · ACCESO DIGITAL</p>" +
        "<h1 style='font-size:30px;line-height:1.05'>Tu Playbook ya está disponible.</h1>" +
        "<p>Tu pago fue aprobado. Desde el botón de abajo podés abrir <strong>ANUNCIOS QUE VENDEN</strong>.</p>" +
        "<p style='margin:28px 0'><a href='" + accessUrl +
        "' style='background:#c7ff4a;color:#080b10;text-decoration:none;padding:16px 22px;border-radius:12px;font-weight:800;display:inline-block'>" +
        "ABRIR MI PLAYBOOK →</a></p>" +
        "<p style='color:#667085;font-size:13px'>Este enlace es personal. Guardalo junto con tu comprobante de pago.</p>" +
        "</div>",
    }),
  });

  if (response.ok) {
    await markEmailStatus(paymentId, "sent");
    return true;
  }

  const errorText = await response.text().catch(() => "Resend request failed");
  await markEmailStatus(paymentId, "failed", errorText);
  return false;
}

export async function loadEbookPdf(): Promise<{
  filename: string;
  mimeType: string;
  bytes: Buffer;
}> {
  return await withSql(async (sql) => {
    const assets = await sql.unsafe(
      "select filename,mime_type,content_encoding,sha256,size_bytes from private.ebook_assets where asset_key=$1 limit 1",
      [EBOOK_ASSET_KEY],
    ) as unknown as Array<{
      filename: string;
      mime_type: string;
      content_encoding: string;
      sha256: string;
      size_bytes: number;
    }>;

    const asset = assets[0];
    if (!asset) throw new Error("Ebook asset is not installed");

    const chunks = await sql.unsafe(
      "select content from private.ebook_asset_chunks where asset_key=$1 order by chunk_index asc",
      [EBOOK_ASSET_KEY],
    ) as unknown as Array<{ content: Buffer }>;

    if (!chunks.length) throw new Error("Ebook asset has no chunks");

    const packed = Buffer.concat(chunks.map((row) => Buffer.from(row.content)));
    const bytes = asset.content_encoding === "gzip" ? gunzipSync(packed) : packed;

    if (bytes.length !== Number(asset.size_bytes)) {
      throw new Error("Ebook asset size mismatch");
    }

    const digest = crypto.createHash("sha256").update(bytes).digest("hex");
    if (digest !== asset.sha256) throw new Error("Ebook asset checksum mismatch");

    return {
      filename: asset.filename,
      mimeType: asset.mime_type,
      bytes,
    };
  });
}
