import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getMerchantBySlug } from "@/config/merchants";

export const MERCHANT_SESSION_COOKIE = "viralio_merchant_session";
export const MERCHANT_SESSION_SECONDS = 8 * 60 * 60;

export interface MerchantSession {
  merchantId: string;
  expiresAt: number;
}

function secret(environment: NodeJS.ProcessEnv): string {
  const value = environment.VIRALIO_AUTH_SECRET ?? "";
  if (!value) throw new Error("Merchant authentication is not configured");
  if (environment.NODE_ENV === "production" && value.length < 32) {
    throw new Error("Merchant authentication is not configured");
  }
  return value;
}

function pins(environment: NodeJS.ProcessEnv): Record<string, string> {
  const raw = environment.VIRALIO_MERCHANT_PINS;
  if (!raw) throw new Error("Merchant authentication is not configured");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Merchant authentication is not configured");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Merchant authentication is not configured");
  }

  const result: Record<string, string> = {};
  for (const [slug, pin] of Object.entries(value)) {
    if (typeof pin !== "string" || !/^\d{4,12}$/.test(pin)) {
      throw new Error("Merchant authentication is not configured");
    }
    result[slug] = pin;
  }
  return result;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function constantTimeEqual(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

function signature(payload: string, environment: NodeJS.ProcessEnv): string {
  return createHmac("sha256", secret(environment)).update(payload, "utf8").digest("base64url");
}

export function verifyMerchantPin(
  merchantSlug: string,
  submittedPin: string,
  environment: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const merchant = getMerchantBySlug(merchantSlug);
  const configuredPins = pins(environment);
  const configuredPin = configuredPins[merchantSlug] ?? "00000000";
  const valid = constantTimeEqual(submittedPin, configuredPin);
  if (!merchant || !configuredPins[merchantSlug] || !valid) return undefined;
  return merchant.id;
}

export function createMerchantSessionToken(
  merchantId: string,
  nowMs = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const session: MerchantSession = {
    merchantId,
    expiresAt: nowMs + MERCHANT_SESSION_SECONDS * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${signature(payload, environment)}`;
}

export function verifyMerchantSessionToken(
  token: string | undefined,
  nowMs = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): MerchantSession | undefined {
  if (!token) return undefined;
  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra) return undefined;

  const expectedSignature = signature(payload, environment);
  if (!constantTimeEqual(providedSignature, expectedSignature)) return undefined;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<MerchantSession>;
    if (typeof parsed.merchantId !== "string" || typeof parsed.expiresAt !== "number") return undefined;
    if (!Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= nowMs) return undefined;
    return { merchantId: parsed.merchantId, expiresAt: parsed.expiresAt };
  } catch {
    return undefined;
  }
}

export function merchantSessionFromRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
): MerchantSession | undefined {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${MERCHANT_SESSION_COOKIE}=`))
    ?.slice(MERCHANT_SESSION_COOKIE.length + 1);
  return verifyMerchantSessionToken(token ? decodeURIComponent(token) : undefined, Date.now(), environment);
}

export function merchantCookieOptions(environment: NodeJS.ProcessEnv = process.env) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: environment.NODE_ENV === "production",
    path: "/",
    maxAge: MERCHANT_SESSION_SECONDS,
  };
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
