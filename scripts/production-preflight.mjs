import path from "node:path";
import { pathToFileURL } from "node:url";
import postgres from "postgres";

export const REQUIRED_TABLES = [
  "sessions",
  "rewards",
  "analytics_events",
  "merchant_settings",
  "merchant_accounts",
  "merchant_login_throttles",
];

const PLACEHOLDER_PATTERN = /(replace[-_ ]?with|change[-_ ]?me|placeholder|example|dummy|your[-_ ])/i;

function result(name, ok) {
  return { name, ok };
}

function validDatabaseUrl(raw) {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return (url.protocol === "postgres:" || url.protocol === "postgresql:")
      && Boolean(url.hostname)
      && Boolean(url.pathname.replace(/^\//, ""));
  } catch {
    return false;
  }
}

function validPublicAppUrl(raw) {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    const local = hostname === "localhost"
      || hostname === "127.0.0.1"
      || hostname === "::1"
      || hostname.endsWith(".localhost");
    return url.protocol === "https:"
      && !local
      && !url.username
      && !url.password
      && !url.hash;
  } catch {
    return false;
  }
}

function strongSecret(value, minimumLength) {
  return typeof value === "string"
    && value.length >= minimumLength
    && !PLACEHOLDER_PATTERN.test(value);
}

function validMerchantPins(raw) {
  if (!raw) return true;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return Object.entries(value).every(([slug, pin]) =>
      slug.trim().length > 0 && typeof pin === "string" && /^\d{4,12}$/.test(pin),
    );
  } catch {
    return false;
  }
}

export function validateProductionEnvironment(environment = process.env) {
  const authSecret = environment.VIRALIO_AUTH_SECRET ?? "";
  const onboardingKey = environment.VIRALIO_ONBOARDING_KEY ?? "";

  return [
    result("persistence is postgres", environment.VIRALIO_PERSISTENCE?.trim().toLowerCase() === "postgres"),
    result("DATABASE_URL is a PostgreSQL URL", validDatabaseUrl(environment.DATABASE_URL)),
    result("public app URL is HTTPS and non-local", validPublicAppUrl(environment.NEXT_PUBLIC_APP_URL)),
    result("auth secret is strong", strongSecret(authSecret, 32)),
    result("onboarding key is strong", strongSecret(onboardingKey, 24)),
    result("auth and onboarding secrets are distinct", Boolean(authSecret && onboardingKey && authSecret !== onboardingKey)),
    result("legacy merchant PIN JSON is valid when configured", validMerchantPins(environment.VIRALIO_MERCHANT_PINS)),
  ];
}

export async function validateProductionDatabase(databaseUrl) {
  const checks = [];
  if (!validDatabaseUrl(databaseUrl)) {
    return [
      result("database connection succeeds", false),
      result("required tables are present", false),
      result("RLS is enabled on required tables", false),
    ];
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 8,
    idle_timeout: 3,
    prepare: false,
    transform: postgres.camel,
    onnotice: () => undefined,
  });

  try {
    await sql`SELECT 1`;
    checks.push(result("database connection succeeds", true));

    const rows = await sql`
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
    `;
    const tables = new Map(rows.map((row) => [row.tableName, Boolean(row.rlsEnabled)]));
    checks.push(result(
      "required tables are present",
      REQUIRED_TABLES.every((table) => tables.has(table)),
    ));
    checks.push(result(
      "RLS is enabled on required tables",
      REQUIRED_TABLES.every((table) => tables.get(table) === true),
    ));
  } catch {
    checks.length = 0;
    checks.push(result("database connection succeeds", false));
    checks.push(result("required tables are present", false));
    checks.push(result("RLS is enabled on required tables", false));
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined);
  }

  return checks;
}

export async function runProductionPreflight(environment = process.env) {
  const environmentChecks = validateProductionEnvironment(environment);
  const databaseChecks = environmentChecks.find((check) => check.name === "DATABASE_URL is a PostgreSQL URL")?.ok
    ? await validateProductionDatabase(environment.DATABASE_URL)
    : await validateProductionDatabase(undefined);
  return [...environmentChecks, ...databaseChecks];
}

function printChecks(checks) {
  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}`);
  }
  const failed = checks.filter((check) => !check.ok).length;
  console.log(failed === 0
    ? `PASS production preflight (${checks.length}/${checks.length})`
    : `FAIL production preflight (${failed} gate${failed === 1 ? "" : "s"} failed)`);
  return failed;
}

async function main() {
  const checks = await runProductionPreflight(process.env);
  process.exitCode = printChecks(checks) === 0 ? 0 : 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;
if (invokedPath === import.meta.url) {
  main().catch(() => {
    console.error("FAIL production preflight (unexpected error; secrets were not printed)");
    process.exitCode = 1;
  });
}
