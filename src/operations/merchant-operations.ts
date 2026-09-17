import postgres from "postgres";
import { getMerchantBySlug } from "@/config/merchants";

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

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function listMerchantOperations(
  databaseUrl = process.env.DATABASE_URL ?? "",
): Promise<MerchantOperationsRow[]> {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for operations");

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
          count(*) FILTER (WHERE name = 'qr_opened') AS qr_scans,
          count(DISTINCT session_id) FILTER (WHERE name = 'unlock_viewed' AND session_id IS NOT NULL) AS starts,
          count(DISTINCT session_id) FILTER (WHERE name = 'share_initiated' AND session_id IS NOT NULL) AS shares,
          count(DISTINCT session_id) FILTER (WHERE name = 'whatsapp_save_clicked' AND session_id IS NOT NULL) AS whatsapp_saves
        FROM analytics_events
        WHERE merchant_id = ma.merchant_id
      ) events ON true
      LEFT JOIN LATERAL (
        SELECT
          count(DISTINCT session_id) AS rewards_issued,
          count(DISTINCT session_id) FILTER (WHERE redeemed_at IS NOT NULL) AS rewards_redeemed
        FROM rewards
        WHERE merchant_id = ma.merchant_id
      ) rewards ON true
      LEFT JOIN LATERAL (
        SELECT count(DISTINCT id) FILTER (WHERE referred_by IS NOT NULL) AS referred_sessions
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
        (SELECT count(*) FROM analytics_events WHERE merchant_id = ${legacyPilot.id} AND name = 'qr_opened')::int AS qr_scans,
        (SELECT count(DISTINCT session_id) FROM analytics_events WHERE merchant_id = ${legacyPilot.id} AND name = 'unlock_viewed' AND session_id IS NOT NULL)::int AS starts,
        (SELECT count(DISTINCT session_id) FROM analytics_events WHERE merchant_id = ${legacyPilot.id} AND name = 'share_initiated' AND session_id IS NOT NULL)::int AS shares,
        (SELECT count(DISTINCT session_id) FROM analytics_events WHERE merchant_id = ${legacyPilot.id} AND name = 'whatsapp_save_clicked' AND session_id IS NOT NULL)::int AS whatsapp_saves,
        (SELECT count(DISTINCT session_id) FROM rewards WHERE merchant_id = ${legacyPilot.id})::int AS rewards_issued,
        (SELECT count(DISTINCT session_id) FROM rewards WHERE merchant_id = ${legacyPilot.id} AND redeemed_at IS NOT NULL)::int AS rewards_redeemed,
        (SELECT count(DISTINCT id) FROM sessions WHERE merchant_id = ${legacyPilot.id} AND referred_by IS NOT NULL)::int AS referred_sessions
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
