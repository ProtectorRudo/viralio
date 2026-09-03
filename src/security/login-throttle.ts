import { createHmac } from "node:crypto";
import postgres from "postgres";
import { resolvePersistenceConfig } from "@/persistence/persistence-config";

export const MERCHANT_LOGIN_MAX_FAILURES = 5;
export const MERCHANT_LOGIN_WINDOW_SECONDS = 10 * 60;
export const MERCHANT_LOGIN_BLOCK_SECONDS = 15 * 60;

export interface LoginThrottleState {
  throttleKey: string;
  failureCount: number;
  windowStartedAt: string;
  blockedUntil?: string;
  updatedAt: string;
}

export interface LoginThrottleDecision {
  blocked: boolean;
  retryAfterSeconds: number;
}

type Timestamp = Date | string;

type ThrottleRow = {
  throttleKey: string;
  failureCount: number;
  windowStartedAt: Timestamp;
  blockedUntil: Timestamp | null;
  updatedAt: Timestamp;
};

type Sql = postgres.Sql;

const globalThrottle = globalThis as typeof globalThis & {
  viralioLoginThrottleSql?: Sql;
  viralioLoginThrottleDatabaseUrl?: string;
  viralioLoginThrottleMemory?: Map<string, LoginThrottleState>;
  viralioLoginThrottleQueue?: Promise<void>;
};

function iso(value: Timestamp): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toState(row: ThrottleRow): LoginThrottleState {
  return {
    throttleKey: row.throttleKey,
    failureCount: row.failureCount,
    windowStartedAt: iso(row.windowStartedAt),
    blockedUntil: row.blockedUntil ? iso(row.blockedUntil) : undefined,
    updatedAt: iso(row.updatedAt),
  };
}

function authSecret(environment: NodeJS.ProcessEnv): string {
  const value = environment.VIRALIO_AUTH_SECRET ?? "";
  if (!value) throw new Error("Merchant authentication is not configured");
  if (environment.NODE_ENV === "production" && value.length < 32) {
    throw new Error("Merchant authentication is not configured");
  }
  return value;
}

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

function clientIdentifier(request: Request): string {
  return firstHeaderValue(request.headers.get("x-forwarded-for"))
    ?? firstHeaderValue(request.headers.get("x-real-ip"))
    ?? "unknown";
}

export function merchantLoginThrottleKey(
  request: Request,
  merchantSlug: string,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const normalizedSlug = merchantSlug.trim().toLowerCase();
  const material = `merchant-login:${normalizedSlug}:${clientIdentifier(request)}`;
  return createHmac("sha256", authSecret(environment)).update(material, "utf8").digest("hex");
}

export function loginThrottleDecision(
  state: LoginThrottleState | undefined,
  nowMs = Date.now(),
): LoginThrottleDecision {
  if (!state?.blockedUntil) return { blocked: false, retryAfterSeconds: 0 };
  const blockedUntilMs = Date.parse(state.blockedUntil);
  if (!Number.isFinite(blockedUntilMs) || blockedUntilMs <= nowMs) {
    return { blocked: false, retryAfterSeconds: 0 };
  }
  return {
    blocked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((blockedUntilMs - nowMs) / 1000)),
  };
}

export function nextLoginThrottleState(
  current: LoginThrottleState | undefined,
  throttleKey: string,
  nowMs = Date.now(),
): LoginThrottleState {
  const now = new Date(nowMs).toISOString();
  const currentDecision = loginThrottleDecision(current, nowMs);
  if (current && currentDecision.blocked) return current;

  const windowStartedMs = current ? Date.parse(current.windowStartedAt) : Number.NaN;
  const windowExpired = !Number.isFinite(windowStartedMs)
    || nowMs - windowStartedMs >= MERCHANT_LOGIN_WINDOW_SECONDS * 1000;
  const failureCount = windowExpired ? 1 : (current?.failureCount ?? 0) + 1;
  const blockedUntil = failureCount >= MERCHANT_LOGIN_MAX_FAILURES
    ? new Date(nowMs + MERCHANT_LOGIN_BLOCK_SECONDS * 1000).toISOString()
    : undefined;

  return {
    throttleKey,
    failureCount,
    windowStartedAt: windowExpired ? now : current!.windowStartedAt,
    blockedUntil,
    updatedAt: now,
  };
}

function memoryStore(): Map<string, LoginThrottleState> {
  globalThrottle.viralioLoginThrottleMemory ??= new Map<string, LoginThrottleState>();
  return globalThrottle.viralioLoginThrottleMemory;
}

async function withMemoryLock<T>(operation: () => Promise<T> | T): Promise<T> {
  const previous = globalThrottle.viralioLoginThrottleQueue ?? Promise.resolve();
  let release!: () => void;
  globalThrottle.viralioLoginThrottleQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

function postgresClient(environment: NodeJS.ProcessEnv): Sql | undefined {
  const config = resolvePersistenceConfig(environment);
  if (config.kind !== "postgres") return undefined;
  if (
    !globalThrottle.viralioLoginThrottleSql
    || globalThrottle.viralioLoginThrottleDatabaseUrl !== config.databaseUrl
  ) {
    globalThrottle.viralioLoginThrottleSql = postgres(config.databaseUrl!, {
      max: 1,
      connect_timeout: 10,
      idle_timeout: 20,
      transform: postgres.camel,
      onnotice: () => undefined,
    });
    globalThrottle.viralioLoginThrottleDatabaseUrl = config.databaseUrl;
  }
  return globalThrottle.viralioLoginThrottleSql;
}

export async function checkMerchantLoginThrottle(
  throttleKey: string,
  nowMs = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): Promise<LoginThrottleDecision> {
  const sql = postgresClient(environment);
  if (!sql) return loginThrottleDecision(memoryStore().get(throttleKey), nowMs);

  const rows = await sql<ThrottleRow[]>`
    SELECT throttle_key, failure_count, window_started_at, blocked_until, updated_at
    FROM merchant_login_throttles
    WHERE throttle_key = ${throttleKey}
    LIMIT 1
  `;
  return loginThrottleDecision(rows[0] ? toState(rows[0]) : undefined, nowMs);
}

export async function recordMerchantLoginFailure(
  throttleKey: string,
  nowMs = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): Promise<LoginThrottleDecision> {
  const sql = postgresClient(environment);
  if (!sql) {
    return withMemoryLock(() => {
      const store = memoryStore();
      const next = nextLoginThrottleState(store.get(throttleKey), throttleKey, nowMs);
      store.set(throttleKey, next);
      return loginThrottleDecision(next, nowMs);
    });
  }

  const state = await sql.begin("read write", async (transaction) => {
    await transaction`SELECT pg_advisory_xact_lock(hashtextextended(${throttleKey}, 0))`;
    const rows = await transaction<ThrottleRow[]>`
      SELECT throttle_key, failure_count, window_started_at, blocked_until, updated_at
      FROM merchant_login_throttles
      WHERE throttle_key = ${throttleKey}
      FOR UPDATE
    `;
    const next = nextLoginThrottleState(rows[0] ? toState(rows[0]) : undefined, throttleKey, nowMs);
    await transaction`
      INSERT INTO merchant_login_throttles (
        throttle_key, failure_count, window_started_at, blocked_until, updated_at
      ) VALUES (
        ${next.throttleKey}, ${next.failureCount}, ${next.windowStartedAt},
        ${next.blockedUntil ?? null}, ${next.updatedAt}
      )
      ON CONFLICT (throttle_key) DO UPDATE SET
        failure_count = EXCLUDED.failure_count,
        window_started_at = EXCLUDED.window_started_at,
        blocked_until = EXCLUDED.blocked_until,
        updated_at = EXCLUDED.updated_at
    `;
    return next;
  });

  return loginThrottleDecision(state as unknown as LoginThrottleState, nowMs);
}

export async function clearMerchantLoginThrottle(
  throttleKey: string,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const sql = postgresClient(environment);
  if (!sql) {
    await withMemoryLock(() => { memoryStore().delete(throttleKey); });
    return;
  }
  await sql`DELETE FROM merchant_login_throttles WHERE throttle_key = ${throttleKey}`;
}
