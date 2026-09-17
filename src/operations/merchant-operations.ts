import postgres from "postgres";
import { getMerchantBySlug } from "@/config/merchants";

export type OperationsPeriod = "today" | "7d" | "30d" | "all";

export interface MerchantOperationsRow {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  createdAt: string;
  qrScans: number;
  starts: number;
  shares: number;
  rewardsIssued: number;
  rewardsRedeemed: number;
  whatsappSaves: number;
  referredSessions: number;
}

interface MerchantOperationsDbRow {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  createdAt: Date | string;
  qrScans: number;
  starts: number;
  shares: number;
  rewardsIssued: number;
  rewardsRedeemed: number;
  whatsappSaves: number;
  referredSessions: number;
}

interface MerchantMetricsDbRow {
  qrScans: number;
  starts: number;
  shares: number;
  rewardsIssued: number;
  rewardsRedeemed: number;
  whatsappSaves: number;
  referredSessions: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function operationsPeriodStart(period: OperationsPeriod, now = new Date()): string | null {
  if (period === "all") return null;
  if (period === "7d") return new Date(now.getTime() - 7 * DAY_MS).toISOString();
  if (period === "30d") return new Date(now.getTime() - 30 * DAY_MS).toISOString();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00-03:00`).toISOString();
}

export async function listMerchantOperations(
  databaseUrl = process.env.DATABASE_URL ?? "",
  period: OperationsPeriod = "all",
): Promise<MerchantOperationsRow[]> {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for operations");

  const periodStart = operationsPeriodStart(period);
  const sql = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
    transform: postgres.camel,
    onnotice: () => undefined,
  });

  try {
    const rows = await sql<MerchantOperationsDbRow[]>`
      SELECT
        ma.merchant_id AS id,
        ma.slug,
        ma.name,
        ma.business_type,
        ma.created_at,
        COALESCE(events.qr_scans, 0)::int AS qr_scans,
        COALESCE(events.starts, 0)::int AS starts,
        COALESCE(events.shares, 0)::int AS shares,
        COALESCE(events.whatsapp_saves, 0)::int AS whatsapp_saves,
        COALESCE(rewards.rewards_issued, 0)::int AS rewards_issued,
        COALESCE(rewards.rewards_redeemed, 0)::int AS rewards_redeemed,
        COALESCE(sessions.referred_sessions, 0)::int AS referred_sessions
      FROM merchant_accounts ma
      LEFT JOIN LATERAL (
        SELECT
          count(*) FILTER (
            WHERE ae.name = 'qr_opened'
              AND (${periodStart}::timestamptz IS NULL OR ae.timestamp >= ${periodStart})
          ) AS qr_scans,
          count(DISTINCT ae.session_id) FILTER (
            WHERE ae.name = 'unlock_viewed'
              AND ae.session_id IS NOT NULL
              AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
          ) AS starts,
          count(DISTINCT ae.session_id) FILTER (
            WHERE ae.name = 'share_initiated'
              AND ae.session_id IS NOT NULL
              AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
          ) AS shares,
          count(DISTINCT ae.session_id) FILTER (
            WHERE ae.name = 'whatsapp_save_clicked'
              AND ae.session_id IS NOT NULL
              AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
          ) AS whatsapp_saves
        FROM analytics_events ae
        LEFT JOIN sessions s ON s.id = ae.session_id
        WHERE ae.merchant_id = ma.merchant_id
      ) events ON true
      LEFT JOIN LATERAL (
        SELECT
          count(DISTINCT r.session_id) FILTER (
            WHERE ${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart}
          ) AS rewards_issued,
          count(DISTINCT r.session_id) FILTER (
            WHERE r.redeemed_at IS NOT NULL
              AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
          ) AS rewards_redeemed
        FROM rewards r
        JOIN sessions s ON s.id = r.session_id
        WHERE r.merchant_id = ma.merchant_id
      ) rewards ON true
      LEFT JOIN LATERAL (
        SELECT count(DISTINCT id) FILTER (
          WHERE referred_by IS NOT NULL
            AND (${periodStart}::timestamptz IS NULL OR created_at >= ${periodStart})
        ) AS referred_sessions
        FROM sessions
        WHERE merchant_id = ma.merchant_id
      ) sessions ON true
      ORDER BY ma.created_at DESC, ma.name ASC
    `;

    const dynamicRows: MerchantOperationsRow[] = rows.map((row) => ({
      ...row,
      createdAt: iso(row.createdAt),
    }));

    const legacyPilot = getMerchantBySlug("el-gordo-leo");
    if (!legacyPilot || dynamicRows.some((merchant) => merchant.slug === legacyPilot.slug)) {
      return dynamicRows;
    }

    const [metrics] = await sql<MerchantMetricsDbRow[]>`
      SELECT
        (
          SELECT count(*)
          FROM analytics_events
          WHERE merchant_id = ${legacyPilot.id}
            AND name = 'qr_opened'
            AND (${periodStart}::timestamptz IS NULL OR timestamp >= ${periodStart})
        )::int AS qr_scans,
        (
          SELECT count(DISTINCT ae.session_id)
          FROM analytics_events ae
          JOIN sessions s ON s.id = ae.session_id
          WHERE ae.merchant_id = ${legacyPilot.id}
            AND ae.name = 'unlock_viewed'
            AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
        )::int AS starts,
        (
          SELECT count(DISTINCT ae.session_id)
          FROM analytics_events ae
          JOIN sessions s ON s.id = ae.session_id
          WHERE ae.merchant_id = ${legacyPilot.id}
            AND ae.name = 'share_initiated'
            AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
        )::int AS shares,
        (
          SELECT count(DISTINCT ae.session_id)
          FROM analytics_events ae
          JOIN sessions s ON s.id = ae.session_id
          WHERE ae.merchant_id = ${legacyPilot.id}
            AND ae.name = 'whatsapp_save_clicked'
            AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
        )::int AS whatsapp_saves,
        (
          SELECT count(DISTINCT r.session_id)
          FROM rewards r
          JOIN sessions s ON s.id = r.session_id
          WHERE r.merchant_id = ${legacyPilot.id}
            AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
        )::int AS rewards_issued,
        (
          SELECT count(DISTINCT r.session_id)
          FROM rewards r
          JOIN sessions s ON s.id = r.session_id
          WHERE r.merchant_id = ${legacyPilot.id}
            AND r.redeemed_at IS NOT NULL
            AND (${periodStart}::timestamptz IS NULL OR s.created_at >= ${periodStart})
        )::int AS rewards_redeemed,
        (
          SELECT count(DISTINCT id)
          FROM sessions
          WHERE merchant_id = ${legacyPilot.id}
            AND referred_by IS NOT NULL
            AND (${periodStart}::timestamptz IS NULL OR created_at >= ${periodStart})
        )::int AS referred_sessions
    `;

    return [
      {
        id: legacyPilot.id,
        slug: legacyPilot.slug,
        name: legacyPilot.name,
        businessType: legacyPilot.theme.businessType ?? "Mini mercado",
        createdAt: "2026-09-14T00:00:00.000Z",
        qrScans: metrics?.qrScans ?? 0,
        starts: metrics?.starts ?? 0,
        shares: metrics?.shares ?? 0,
        rewardsIssued: metrics?.rewardsIssued ?? 0,
        rewardsRedeemed: metrics?.rewardsRedeemed ?? 0,
        whatsappSaves: metrics?.whatsappSaves ?? 0,
        referredSessions: metrics?.referredSessions ?? 0,
      },
      ...dynamicRows,
    ];
  } finally {
    await sql.end({ timeout: 5 });
  }
}
