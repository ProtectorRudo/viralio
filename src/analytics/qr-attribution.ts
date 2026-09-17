import "server-only";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

export const QR_ENTRY_COOKIE = "viralio_qr_entry";

export interface MerchantQrFunnel {
  scans: number;
  visitors: number;
  started: number;
  shared: number;
  rewarded: number;
  saved: number;
  redeemed: number;
}

type FunnelRow = MerchantQrFunnel;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function client(databaseUrl: string) {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for QR attribution");
  return postgres(databaseUrl, {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
    transform: postgres.camel,
    onnotice: () => undefined,
  });
}

export async function createQrEntry(
  merchantId: string,
  databaseUrl = process.env.DATABASE_URL ?? "",
): Promise<string> {
  const entryToken = randomUUID();
  const sql = client(databaseUrl);
  try {
    await sql`
      INSERT INTO qr_entries (entry_token, merchant_id, opened_at)
      VALUES (${entryToken}, ${merchantId}, now())
    `;
    return entryToken;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function linkQrEntry(
  merchantId: string,
  entryToken: string,
  sessionId: string,
  databaseUrl = process.env.DATABASE_URL ?? "",
): Promise<void> {
  if (!uuidPattern.test(entryToken)) return;
  const sql = client(databaseUrl);
  try {
    await sql`
      UPDATE qr_entries
      SET session_id = ${sessionId}, linked_at = COALESCE(linked_at, now())
      WHERE entry_token = ${entryToken}::uuid
        AND merchant_id = ${merchantId}
        AND opened_at >= now() - interval '30 minutes'
        AND (session_id IS NULL OR session_id = ${sessionId}::uuid)
    `;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function getMerchantQrFunnel(
  merchantId: string,
  databaseUrl = process.env.DATABASE_URL ?? "",
): Promise<MerchantQrFunnel> {
  const sql = client(databaseUrl);
  try {
    const [row] = await sql<FunnelRow[]>`
      WITH cohort AS (
        SELECT DISTINCT session_id
        FROM qr_entries
        WHERE merchant_id = ${merchantId}
          AND session_id IS NOT NULL
      )
      SELECT
        (SELECT count(*) FROM qr_entries WHERE merchant_id = ${merchantId})::int AS scans,
        (SELECT count(*) FROM cohort)::int AS visitors,
        (
          SELECT count(DISTINCT c.session_id)
          FROM cohort c
          JOIN analytics_events e ON e.session_id = c.session_id
          WHERE e.merchant_id = ${merchantId} AND e.name = 'unlock_viewed'
        )::int AS started,
        (
          SELECT count(DISTINCT c.session_id)
          FROM cohort c
          JOIN analytics_events e ON e.session_id = c.session_id
          WHERE e.merchant_id = ${merchantId} AND e.name = 'share_initiated'
        )::int AS shared,
        (
          SELECT count(DISTINCT c.session_id)
          FROM cohort c
          JOIN rewards r ON r.session_id = c.session_id
          WHERE r.merchant_id = ${merchantId}
        )::int AS rewarded,
        (
          SELECT count(DISTINCT c.session_id)
          FROM cohort c
          JOIN analytics_events e ON e.session_id = c.session_id
          WHERE e.merchant_id = ${merchantId} AND e.name = 'whatsapp_save_clicked'
        )::int AS saved,
        (
          SELECT count(DISTINCT c.session_id)
          FROM cohort c
          JOIN rewards r ON r.session_id = c.session_id
          WHERE r.merchant_id = ${merchantId} AND r.redeemed_at IS NOT NULL
        )::int AS redeemed
    `;

    return row ?? { scans: 0, visitors: 0, started: 0, shared: 0, rewarded: 0, saved: 0, redeemed: 0 };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
