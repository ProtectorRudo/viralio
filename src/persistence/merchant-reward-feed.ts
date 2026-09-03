import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { rewardStatus } from "@/domain/rewards";
import type { Database, Reward, RewardStatus } from "@/domain/types";
import { resolvePersistenceConfig } from "./persistence-config";

export type MerchantRewardFilter = RewardStatus | "ALL";

export interface MerchantRewardFeedItem {
  shortCode: string;
  prizeName: string;
  expiresAt: string;
  redeemedAt?: string;
  status: RewardStatus;
}

type Timestamp = Date | string;

interface RewardRow {
  id: string;
  token: string;
  shortCode: string;
  merchantId: string;
  sessionId: string;
  prizeId: string;
  prizeName: string;
  issuedAt: Timestamp;
  expiresAt: Timestamp;
  redeemedAt: Timestamp | null;
}

function iso(value: Timestamp): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toReward(row: RewardRow): Reward {
  return {
    id: row.id,
    token: row.token,
    shortCode: row.shortCode,
    merchantId: row.merchantId,
    sessionId: row.sessionId,
    prizeId: row.prizeId,
    prizeName: row.prizeName,
    issuedAt: iso(row.issuedAt),
    expiresAt: iso(row.expiresAt),
    redeemedAt: row.redeemedAt ? iso(row.redeemedAt) : undefined,
  };
}

function feedItem(reward: Reward, now: Date): MerchantRewardFeedItem {
  return {
    shortCode: reward.shortCode,
    prizeName: reward.prizeName,
    expiresAt: reward.expiresAt,
    redeemedAt: reward.redeemedAt,
    status: rewardStatus(reward, now),
  };
}

export function filterMerchantRewards(
  rewards: Reward[],
  merchantId: string,
  filter: MerchantRewardFilter = "AVAILABLE",
  now = new Date(),
  limit = 100,
): MerchantRewardFeedItem[] {
  return rewards
    .filter((reward) => reward.merchantId === merchantId)
    .sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
    .map((reward) => feedItem(reward, now))
    .filter((item) => filter === "ALL" || item.status === filter)
    .slice(0, Math.max(1, Math.min(200, limit)));
}

const globalFeedSql = globalThis as typeof globalThis & { viralioRewardFeedSql?: postgres.Sql };

function postgresClient(databaseUrl: string): postgres.Sql {
  if (!globalFeedSql.viralioRewardFeedSql) {
    globalFeedSql.viralioRewardFeedSql = postgres(databaseUrl, {
      max: 1,
      connect_timeout: 10,
      idle_timeout: 20,
      prepare: false,
      transform: postgres.camel,
      onnotice: () => undefined,
    });
  }
  return globalFeedSql.viralioRewardFeedSql;
}

async function postgresRewards(
  databaseUrl: string,
  merchantId: string,
  filter: MerchantRewardFilter,
  now: Date,
): Promise<Reward[]> {
  const sql = postgresClient(databaseUrl);
  const instant = now.toISOString();
  let rows: RewardRow[];

  if (filter === "AVAILABLE") {
    rows = await sql<RewardRow[]>`
      SELECT * FROM rewards
      WHERE merchant_id = ${merchantId}
        AND redeemed_at IS NULL
        AND expires_at > ${instant}
      ORDER BY issued_at DESC
      LIMIT 100
    `;
  } else if (filter === "REDEEMED") {
    rows = await sql<RewardRow[]>`
      SELECT * FROM rewards
      WHERE merchant_id = ${merchantId}
        AND redeemed_at IS NOT NULL
      ORDER BY issued_at DESC
      LIMIT 100
    `;
  } else if (filter === "EXPIRED") {
    rows = await sql<RewardRow[]>`
      SELECT * FROM rewards
      WHERE merchant_id = ${merchantId}
        AND redeemed_at IS NULL
        AND expires_at <= ${instant}
      ORDER BY issued_at DESC
      LIMIT 100
    `;
  } else {
    rows = await sql<RewardRow[]>`
      SELECT * FROM rewards
      WHERE merchant_id = ${merchantId}
      ORDER BY issued_at DESC
      LIMIT 100
    `;
  }

  return rows.map(toReward);
}

async function jsonRewards(): Promise<Reward[]> {
  const filePath = path.join(process.cwd(), "data", "viralio.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const database = JSON.parse(raw) as Database;
    return Array.isArray(database.rewards) ? database.rewards : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function listMerchantRewardFeed(
  merchantId: string,
  filter: MerchantRewardFilter = "AVAILABLE",
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date(),
): Promise<MerchantRewardFeedItem[]> {
  const config = resolvePersistenceConfig(environment);
  const rewards = config.kind === "postgres"
    ? await postgresRewards(config.databaseUrl!, merchantId, filter, now)
    : await jsonRewards();
  return filterMerchantRewards(rewards, merchantId, filter, now);
}
