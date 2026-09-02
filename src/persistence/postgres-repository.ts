import postgres from "postgres";
import type {
  AnalyticsEvent,
  EventName,
  FlowState,
  MerchantCustomization,
  MerchantMetrics,
  MerchantSettingsRecord,
  Reward,
  Session,
  ShareChannel,
} from "@/domain/types";
import type { Repository, TransactionRepository, UniqueValueKind } from "./repository";

type TransactionSql = postgres.TransactionSql;
type Sql = postgres.Sql;
type Timestamp = Date | string;

interface SessionRow {
  id: string;
  merchantId: string;
  referralToken: string;
  referredBy: string | null;
  state: FlowState;
  rewardId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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

interface MerchantSessionMetricsRow {
  sessions: number;
  referredSessions: number;
}

interface MerchantRewardMetricsRow {
  rewardsIssued: number;
  rewardsRedeemed: number;
}

interface MerchantEventMetricsRow {
  shares: number;
  whatsappSaves: number;
}

interface MerchantShareChannelRow {
  shareChannel: ShareChannel;
  count: number;
}

interface MerchantSettingsRow {
  merchantId: string;
  settings: MerchantCustomization;
  updatedAt: Timestamp;
}

function iso(value: Timestamp): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    merchantId: row.merchantId,
    referralToken: row.referralToken,
    referredBy: row.referredBy ?? undefined,
    state: row.state,
    rewardId: row.rewardId ?? undefined,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
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

class PostgresTransaction implements TransactionRepository {
  constructor(private readonly sql: TransactionSql) {}

  async getSessionById(sessionId: string, merchantId?: string, forUpdate = false): Promise<Session | undefined> {
    let rows: SessionRow[];
    if (merchantId && forUpdate) {
      rows = await this.sql<SessionRow[]>`
        SELECT * FROM sessions WHERE id = ${sessionId} AND merchant_id = ${merchantId} FOR UPDATE
      `;
    } else if (merchantId) {
      rows = await this.sql<SessionRow[]>`
        SELECT * FROM sessions WHERE id = ${sessionId} AND merchant_id = ${merchantId}
      `;
    } else if (forUpdate) {
      rows = await this.sql<SessionRow[]>`SELECT * FROM sessions WHERE id = ${sessionId} FOR UPDATE`;
    } else {
      rows = await this.sql<SessionRow[]>`SELECT * FROM sessions WHERE id = ${sessionId}`;
    }
    return rows[0] ? toSession(rows[0]) : undefined;
  }

  async getSessionByReferralToken(referralToken: string, merchantId?: string): Promise<Session | undefined> {
    const rows = merchantId
      ? await this.sql<SessionRow[]>`SELECT * FROM sessions WHERE referral_token = ${referralToken} AND merchant_id = ${merchantId}`
      : await this.sql<SessionRow[]>`SELECT * FROM sessions WHERE referral_token = ${referralToken}`;
    return rows[0] ? toSession(rows[0]) : undefined;
  }

  async insertSession(session: Session): Promise<void> {
    await this.sql`
      INSERT INTO sessions (
        id, merchant_id, referral_token, referred_by, state, reward_id, created_at, updated_at
      ) VALUES (
        ${session.id}, ${session.merchantId}, ${session.referralToken}, ${session.referredBy ?? null},
        ${session.state}, ${session.rewardId ?? null}, ${session.createdAt}, ${session.updatedAt}
      )
    `;
  }

  async updateSession(session: Session): Promise<void> {
    const result = await this.sql`
      UPDATE sessions SET
        merchant_id = ${session.merchantId}, referral_token = ${session.referralToken},
        referred_by = ${session.referredBy ?? null}, state = ${session.state},
        reward_id = ${session.rewardId ?? null}, updated_at = ${session.updatedAt}
      WHERE id = ${session.id}
      RETURNING id
    `;
    if (!result.length) throw new Error("Session not found");
  }

  async getRewardById(rewardId: string, forUpdate = false): Promise<Reward | undefined> {
    const rows = forUpdate
      ? await this.sql<RewardRow[]>`SELECT * FROM rewards WHERE id = ${rewardId} FOR UPDATE`
      : await this.sql<RewardRow[]>`SELECT * FROM rewards WHERE id = ${rewardId}`;
    return rows[0] ? toReward(rows[0]) : undefined;
  }

  async getRewardByToken(rewardToken: string, forUpdate = false): Promise<Reward | undefined> {
    const rows = forUpdate
      ? await this.sql<RewardRow[]>`SELECT * FROM rewards WHERE token = ${rewardToken} FOR UPDATE`
      : await this.sql<RewardRow[]>`SELECT * FROM rewards WHERE token = ${rewardToken}`;
    return rows[0] ? toReward(rows[0]) : undefined;
  }

  async getRewardByShortCode(shortCode: string, merchantId?: string, forUpdate = false): Promise<Reward | undefined> {
    let rows: RewardRow[];
    if (merchantId && forUpdate) {
      rows = await this.sql<RewardRow[]>`
        SELECT * FROM rewards WHERE short_code = ${shortCode} AND merchant_id = ${merchantId} FOR UPDATE
      `;
    } else if (merchantId) {
      rows = await this.sql<RewardRow[]>`
        SELECT * FROM rewards WHERE short_code = ${shortCode} AND merchant_id = ${merchantId}
      `;
    } else if (forUpdate) {
      rows = await this.sql<RewardRow[]>`SELECT * FROM rewards WHERE short_code = ${shortCode} FOR UPDATE`;
    } else {
      rows = await this.sql<RewardRow[]>`SELECT * FROM rewards WHERE short_code = ${shortCode}`;
    }
    return rows[0] ? toReward(rows[0]) : undefined;
  }

  async insertReward(reward: Reward): Promise<void> {
    await this.sql`
      INSERT INTO rewards (
        id, token, short_code, merchant_id, session_id, prize_id, prize_name,
        issued_at, expires_at, redeemed_at
      ) VALUES (
        ${reward.id}, ${reward.token}, ${reward.shortCode}, ${reward.merchantId}, ${reward.sessionId},
        ${reward.prizeId}, ${reward.prizeName}, ${reward.issuedAt}, ${reward.expiresAt}, ${reward.redeemedAt ?? null}
      )
    `;
  }

  async updateReward(reward: Reward): Promise<void> {
    const result = await this.sql`
      UPDATE rewards SET
        token = ${reward.token}, short_code = ${reward.shortCode}, merchant_id = ${reward.merchantId},
        session_id = ${reward.sessionId}, prize_id = ${reward.prizeId}, prize_name = ${reward.prizeName},
        issued_at = ${reward.issuedAt}, expires_at = ${reward.expiresAt}, redeemed_at = ${reward.redeemedAt ?? null}
      WHERE id = ${reward.id}
      RETURNING id
    `;
    if (!result.length) throw new Error("Reward not found");
  }

  async hasEvent(name: EventName, sessionId: string, rewardId?: string): Promise<boolean> {
    const rows = rewardId
      ? await this.sql`SELECT 1 FROM analytics_events WHERE name = ${name} AND session_id = ${sessionId} AND reward_id = ${rewardId} LIMIT 1`
      : await this.sql`SELECT 1 FROM analytics_events WHERE name = ${name} AND session_id = ${sessionId} LIMIT 1`;
    return rows.length > 0;
  }

  async insertEvent(event: AnalyticsEvent): Promise<void> {
    await this.sql`
      INSERT INTO analytics_events (
        id, name, merchant_id, session_id, reward_id, referral_token, share_channel, timestamp
      ) VALUES (
        ${event.id}, ${event.name}, ${event.merchantId}, ${event.sessionId ?? null},
        ${event.rewardId ?? null}, ${event.referralToken ?? null}, ${event.shareChannel ?? null}, ${event.timestamp}
      )
      ON CONFLICT DO NOTHING
    `;
  }

  async getMerchantMetrics(merchantId: string): Promise<MerchantMetrics> {
    const sessionRows = await this.sql<MerchantSessionMetricsRow[]>`
      SELECT
        count(*)::int AS sessions,
        count(*) FILTER (WHERE referred_by IS NOT NULL)::int AS referred_sessions
      FROM sessions
      WHERE merchant_id = ${merchantId}
    `;
    const rewardRows = await this.sql<MerchantRewardMetricsRow[]>`
      SELECT
        count(*)::int AS rewards_issued,
        count(*) FILTER (WHERE redeemed_at IS NOT NULL)::int AS rewards_redeemed
      FROM rewards
      WHERE merchant_id = ${merchantId}
    `;
    const eventRows = await this.sql<MerchantEventMetricsRow[]>`
      SELECT
        count(*) FILTER (WHERE name = 'share_initiated')::int AS shares,
        count(*) FILTER (WHERE name = 'whatsapp_save_clicked')::int AS whatsapp_saves
      FROM analytics_events
      WHERE merchant_id = ${merchantId}
    `;
    const channelRows = await this.sql<MerchantShareChannelRow[]>`
      SELECT share_channel, count(*)::int AS count
      FROM analytics_events
      WHERE merchant_id = ${merchantId}
        AND name = 'share_initiated'
        AND share_channel IS NOT NULL
      GROUP BY share_channel
    `;

    const shareChannels: MerchantMetrics["shareChannels"] = {
      whatsapp: 0,
      whatsapp_status: 0,
      instagram_story: 0,
      native: 0,
      social: 0,
    };
    for (const row of channelRows) {
      if (row.shareChannel in shareChannels) shareChannels[row.shareChannel] = row.count;
    }

    return {
      sessions: sessionRows[0]?.sessions ?? 0,
      referredSessions: sessionRows[0]?.referredSessions ?? 0,
      shares: eventRows[0]?.shares ?? 0,
      rewardsIssued: rewardRows[0]?.rewardsIssued ?? 0,
      rewardsRedeemed: rewardRows[0]?.rewardsRedeemed ?? 0,
      whatsappSaves: eventRows[0]?.whatsappSaves ?? 0,
      shareChannels,
    };
  }

  async getMerchantSettings(merchantId: string): Promise<MerchantSettingsRecord | undefined> {
    const rows = await this.sql<MerchantSettingsRow[]>`
      SELECT merchant_id, settings, updated_at
      FROM merchant_settings
      WHERE merchant_id = ${merchantId}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return undefined;
    return { merchantId: row.merchantId, customization: row.settings, updatedAt: iso(row.updatedAt) };
  }

  async upsertMerchantSettings(
    merchantId: string,
    customization: MerchantCustomization,
    updatedAt: string,
  ): Promise<void> {
    await this.sql`
      INSERT INTO merchant_settings (merchant_id, settings, updated_at)
      VALUES (${merchantId}, ${JSON.stringify(customization)}::jsonb, ${updatedAt})
      ON CONFLICT (merchant_id) DO UPDATE SET
        settings = EXCLUDED.settings,
        updated_at = EXCLUDED.updated_at
    `;
  }

  async uniqueValueExists(kind: UniqueValueKind, value: string): Promise<boolean> {
    if (kind === "session_referral") {
      return (await this.sql`SELECT 1 FROM sessions WHERE referral_token = ${value} LIMIT 1`).length > 0;
    }
    if (kind === "reward_token") {
      return (await this.sql`SELECT 1 FROM rewards WHERE token = ${value} LIMIT 1`).length > 0;
    }
    return (await this.sql`SELECT 1 FROM rewards WHERE short_code = ${value} LIMIT 1`).length > 0;
  }
}

export interface PostgresRepositoryOptions {
  maxConnections?: number;
  connectTimeoutSeconds?: number;
  idleTimeoutSeconds?: number;
}

export class PostgresRepository implements Repository {
  readonly kind = "postgres" as const;
  private readonly sql: Sql;

  constructor(databaseUrl: string, options: PostgresRepositoryOptions = {}) {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for postgres persistence");
    this.sql = postgres(databaseUrl, {
      max: options.maxConnections ?? 5,
      connect_timeout: options.connectTimeoutSeconds ?? 10,
      idle_timeout: options.idleTimeoutSeconds ?? 20,
      transform: postgres.camel,
      onnotice: () => undefined,
    });
  }

  async transaction<T>(operation: (transaction: TransactionRepository) => Promise<T>): Promise<T> {
    const result = await this.sql.begin("read write", async (sql) => operation(new PostgresTransaction(sql)));
    return result as unknown as T;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const rows = await this.sql`SELECT 1 AS ok`;
      return rows.length === 1;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}
