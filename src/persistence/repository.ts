import type {
  AnalyticsEvent,
  Database,
  EventName,
  MerchantAccount,
  MerchantCustomization,
  MerchantMetrics,
  MerchantMetricsWindow,
  MerchantSettingsRecord,
  Reward,
  Session,
} from "@/domain/types";

export type UniqueValueKind = "session_referral" | "reward_token" | "short_code";

export interface TransactionRepository {
  getSessionById(sessionId: string, merchantId?: string, forUpdate?: boolean): Promise<Session | undefined>;
  getSessionByReferralToken(referralToken: string, merchantId?: string): Promise<Session | undefined>;
  insertSession(session: Session): Promise<void>;
  updateSession(session: Session): Promise<void>;

  getRewardById(rewardId: string, forUpdate?: boolean): Promise<Reward | undefined>;
  getRewardByToken(rewardToken: string, forUpdate?: boolean): Promise<Reward | undefined>;
  getRewardByShortCode(shortCode: string, merchantId?: string, forUpdate?: boolean): Promise<Reward | undefined>;
  insertReward(reward: Reward): Promise<void>;
  updateReward(reward: Reward): Promise<void>;

  hasEvent(name: EventName, sessionId: string, rewardId?: string): Promise<boolean>;
  insertEvent(event: AnalyticsEvent): Promise<void>;
  getMerchantMetrics(merchantId: string, window?: MerchantMetricsWindow): Promise<MerchantMetrics>;

  getMerchantAccountBySlug(slug: string): Promise<MerchantAccount | undefined>;
  getMerchantAccountById(merchantId: string): Promise<MerchantAccount | undefined>;
  insertMerchantAccount(account: MerchantAccount): Promise<void>;

  getMerchantSettings(merchantId: string): Promise<MerchantSettingsRecord | undefined>;
  upsertMerchantSettings(merchantId: string, customization: MerchantCustomization, updatedAt: string): Promise<void>;
  uniqueValueExists(kind: UniqueValueKind, value: string): Promise<boolean>;
}

export interface Repository {
  readonly kind: "json" | "memory" | "postgres";
  transaction<T>(operation: (transaction: TransactionRepository) => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
}

export function emptyDatabase(): Database {
  return { sessions: [], rewards: [], events: [], merchantSettings: [], merchantAccounts: [] };
}
