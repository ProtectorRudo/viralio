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
import type { TransactionRepository, UniqueValueKind } from "./repository";

function sessionFallsInWindow(session: Session, window?: MerchantMetricsWindow): boolean {
  if (!window) return true;
  if (window.from && session.createdAt < window.from) return false;
  return session.createdAt < window.to;
}

export class ArrayTransaction implements TransactionRepository {
  constructor(private readonly database: Database) {
    this.database.merchantSettings ??= [];
    this.database.merchantAccounts ??= [];
  }

  async getSessionById(sessionId: string, merchantId?: string): Promise<Session | undefined> {
    return this.database.sessions.find((session) =>
      session.id === sessionId && (!merchantId || session.merchantId === merchantId),
    );
  }

  async getSessionByReferralToken(referralToken: string, merchantId?: string): Promise<Session | undefined> {
    return this.database.sessions.find((session) =>
      session.referralToken === referralToken && (!merchantId || session.merchantId === merchantId),
    );
  }

  async insertSession(session: Session): Promise<void> {
    this.database.sessions.push(session);
  }

  async updateSession(session: Session): Promise<void> {
    const index = this.database.sessions.findIndex((candidate) => candidate.id === session.id);
    if (index < 0) throw new Error("Session not found");
    this.database.sessions[index] = session;
  }

  async getRewardById(rewardId: string): Promise<Reward | undefined> {
    return this.database.rewards.find((reward) => reward.id === rewardId);
  }

  async getRewardByToken(rewardToken: string): Promise<Reward | undefined> {
    return this.database.rewards.find((reward) => reward.token === rewardToken);
  }

  async getRewardByShortCode(shortCode: string, merchantId?: string): Promise<Reward | undefined> {
    return this.database.rewards.find((reward) =>
      reward.shortCode === shortCode && (!merchantId || reward.merchantId === merchantId),
    );
  }

  async insertReward(reward: Reward): Promise<void> {
    if (this.database.rewards.some((candidate) => candidate.sessionId === reward.sessionId)) {
      throw new Error("Session already has a reward");
    }
    this.database.rewards.push(reward);
  }

  async updateReward(reward: Reward): Promise<void> {
    const index = this.database.rewards.findIndex((candidate) => candidate.id === reward.id);
    if (index < 0) throw new Error("Reward not found");
    this.database.rewards[index] = reward;
  }

  async hasEvent(name: EventName, sessionId: string, rewardId?: string): Promise<boolean> {
    return this.database.events.some((event) =>
      event.name === name && event.sessionId === sessionId && (!rewardId || event.rewardId === rewardId),
    );
  }

  async insertEvent(event: AnalyticsEvent): Promise<void> {
    if (
      event.name === "reward_viewed" &&
      event.sessionId &&
      event.rewardId &&
      this.database.events.some((candidate) =>
        candidate.name === "reward_viewed" &&
        candidate.sessionId === event.sessionId &&
        candidate.rewardId === event.rewardId,
      )
    ) return;
    this.database.events.push(event);
  }

  async getMerchantMetrics(merchantId: string, window?: MerchantMetricsWindow): Promise<MerchantMetrics> {
    const sessions = this.database.sessions.filter((session) =>
      session.merchantId === merchantId && sessionFallsInWindow(session, window),
    );
    const sessionIds = new Set(sessions.map((session) => session.id));
    const rewards = this.database.rewards.filter((reward) =>
      reward.merchantId === merchantId && sessionIds.has(reward.sessionId),
    );
    const events = this.database.events.filter((event) =>
      event.merchantId === merchantId && Boolean(event.sessionId && sessionIds.has(event.sessionId)),
    );
    const shareChannels: MerchantMetrics["shareChannels"] = {
      whatsapp: 0,
      whatsapp_status: 0,
      instagram_story: 0,
      native: 0,
      social: 0,
    };

    for (const event of events) {
      if (event.name === "share_initiated" && event.shareChannel) {
        shareChannels[event.shareChannel] += 1;
      }
    }

    return {
      sessions: sessions.length,
      referredSessions: sessions.filter((session) => Boolean(session.referredBy)).length,
      shares: events.filter((event) => event.name === "share_initiated").length,
      rewardsIssued: rewards.length,
      rewardsRedeemed: rewards.filter((reward) => Boolean(reward.redeemedAt)).length,
      whatsappSaves: events.filter((event) => event.name === "whatsapp_save_clicked").length,
      shareChannels,
    };
  }

  async getMerchantAccountBySlug(slug: string): Promise<MerchantAccount | undefined> {
    return this.database.merchantAccounts.find((account) => account.slug === slug);
  }

  async getMerchantAccountById(merchantId: string): Promise<MerchantAccount | undefined> {
    return this.database.merchantAccounts.find((account) => account.id === merchantId);
  }

  async insertMerchantAccount(account: MerchantAccount): Promise<void> {
    if (this.database.merchantAccounts.some((candidate) => candidate.id === account.id || candidate.slug === account.slug)) {
      throw new Error("Merchant already exists");
    }
    this.database.merchantAccounts.push(account);
  }

  async getMerchantSettings(merchantId: string): Promise<MerchantSettingsRecord | undefined> {
    return this.database.merchantSettings.find((settings) => settings.merchantId === merchantId);
  }

  async upsertMerchantSettings(
    merchantId: string,
    customization: MerchantCustomization,
    updatedAt: string,
  ): Promise<void> {
    const record: MerchantSettingsRecord = { merchantId, customization, updatedAt };
    const index = this.database.merchantSettings.findIndex((settings) => settings.merchantId === merchantId);
    if (index < 0) this.database.merchantSettings.push(record);
    else this.database.merchantSettings[index] = record;
  }

  async uniqueValueExists(kind: UniqueValueKind, value: string): Promise<boolean> {
    if (kind === "session_referral") return this.database.sessions.some((session) => session.referralToken === value);
    if (kind === "reward_token") return this.database.rewards.some((reward) => reward.token === value);
    return this.database.rewards.some((reward) => reward.shortCode === value);
  }
}
