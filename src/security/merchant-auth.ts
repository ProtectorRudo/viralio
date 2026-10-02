import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getMerchantBySlug } from "@/config/merchants";
import type { MerchantAccount } from "@/domain/types";

export const MERCHANT_SESSION_COOKIE = "viralio_merchant_session";
export const MERCHANT_SESSION_SECONDS = 8 * 60 * 60;
export const OPERATOR_SESSION_COOKIE = "viralio_operator_session";
export const OPERATOR_SESSION_SECONDS = 8 * 60 * 60;

export interface MerchantSession {
  merchantId: string;
  expiresAt: number;
}

export interface OperatorSession {
  role: "operator";
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
  if (!raw) return {};
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

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

function derivePinHash(pin: string, salt: string, environment: NodeJS.ProcessEnv): string {
  const material = `${pin}:${secret(environment)}`;
  return scryptSync(material, Buffer.from(salt, "base64url"), 32).toString("base64url");
}

function signedPayload(value: object, environment: NodeJS.ProcessEnv): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  return `${payload}.${signature(payload, environment)}`;
}

function readSignedPayload(token: string | undefined, environment: NodeJS.ProcessEnv): unknown {
  if (!token) return undefined;
  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra) return undefined;
  const expectedSignature = signature(payload, environment);
  if (!constantTimeEqual(providedSignature, expectedSignature)) return undefined;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
  } catch {
    return undefined;
  }
}

function cookieValue(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const encodedToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!encodedToken) return undefined;
  try {
    return decodeURIComponent(encodedToken);
  } catch {
    return undefined;
  }
}

export function createMerchantPinCredentials(
  pin: string,
  environment: NodeJS.ProcessEnv = process.env,
): Pick<MerchantAccount, "pinSalt" | "pinHash"> {
  if (!/^\d{4,12}$/.test(pin)) throw new Error("Invalid pin");
  const pinSalt = randomBytes(16).toString("base64url");
  return { pinSalt, pinHash: derivePinHash(pin, pinSalt, environment) };
}

export function verifyMerchantAccountPin(
  account: MerchantAccount,
  submittedPin: string,
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!/^\d{4,12}$/.test(submittedPin)) return false;
  try {
    const calculated = derivePinHash(submittedPin, account.pinSalt, environment);
    return constantTimeEqual(calculated, account.pinHash);
  } catch {
    return false;
  }
}

export function verifyOnboardingKey(
  submittedKey: string,
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const configured = environment.VIRALIO_ONBOARDING_KEY ?? "";
  if (!configured) return false;
  if (environment.NODE_ENV === "production" && configured.length < 24) return false;
  return constantTimeEqual(submittedKey, configured);
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
  return signedPayload(session, environment);
}

export function verifyMerchantSessionToken(
  token: string | undefined,
  nowMs = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): MerchantSession | undefined {
  const parsed = readSignedPayload(token, environment) as Partial<MerchantSession> | undefined;
  if (!parsed || typeof parsed.merchantId !== "string" || typeof parsed.expiresAt !== "number") return undefined;
  if (!Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= nowMs) return undefined;
  return { merchantId: parsed.merchantId, expiresAt: parsed.expiresAt };
}

export function createOperatorSessionToken(
  nowMs = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const session: OperatorSession = {
    role: "operator",
    expiresAt: nowMs + OPERATOR_SESSION_SECONDS * 1000,
  };
  return signedPayload(session, environment);
}

export function verifyOperatorSessionToken(
  token: string | undefined,
  nowMs = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): OperatorSession | undefined {
  const parsed = readSignedPayload(token, environment) as Partial<OperatorSession> | undefined;
  if (!parsed || parsed.role !== "operator" || typeof parsed.expiresAt !== "number") return undefined;
  if (!Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= nowMs) return undefined;
  return { role: "operator", expiresAt: parsed.expiresAt };
}

export function merchantSessionFromRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
): MerchantSession | undefined {
  return verifyMerchantSessionToken(cookieValue(request, MERCHANT_SESSION_COOKIE), Date.now(), environment);
}

export function operatorSessionFromRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
): OperatorSession | undefined {
  return verifyOperatorSessionToken(cookieValue(request, OPERATOR_SESSION_COOKIE), Date.now(), environment);
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

export function operatorCookieOptions(environment: NodeJS.ProcessEnv = process.env) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: environment.NODE_ENV === "production",
    path: "/",
    maxAge: OPERATOR_SESSION_SECONDS,
  };
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host = firstHeaderValue(request.headers.get("host"))
      ?? firstHeaderValue(request.headers.get("x-forwarded-host"));
    const protocol = firstHeaderValue(request.headers.get("x-forwarded-proto"))
      ?? requestUrl.protocol.slice(0, -1);
    if (!host || !protocol) return false;
    return originUrl.host.toLowerCase() === host.toLowerCase()
      && originUrl.protocol.toLowerCase() === `${protocol.toLowerCase()}:`;
  } catch {
    return false;
  }
}
