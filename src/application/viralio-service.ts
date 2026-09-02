import { randomBytes, randomInt, randomUUID } from "node:crypto";
import {
  applyMerchantCustomization,
  defaultMerchantCustomization,
  validateMerchantCustomization,
} from "@/config/merchant-customization";
import { getMerchantById, getMerchantBySlug } from "@/config/merchants";
import { canRecordEvent, transition } from "@/domain/flow";
import { selectPrize } from "@/domain/probabilities";
import { rewardStatus } from "@/domain/rewards";
import { isValidReferralToken } from "@/domain/tokens";
import type {
  AnalyticsEvent,
  EventName,
  Merchant,
  MerchantCustomization,
  MerchantMetrics,
  Reward,
  Session,
  ShareChannel,
} from "@/domain/types";
import type { Repository, TransactionRepository, UniqueValueKind } from "@/persistence/repository";

function token(): string {
  return randomBytes(16).toString("base64url");
}

function shortCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function normalizeShortCode(value: string): string {
  return value.trim().toUpperCase();
}

function analyticsEvent(
  name: EventName,
  session: Session,
  timestamp: string,
  extras: Partial<AnalyticsEvent> = {},
): AnalyticsEvent {
  return {
    id: randomUUID(),
    name,
    merchantId: session.merchantId,
    sessionId: session.id,
    timestamp,
    ...extras,
  };
}

export class ViralioService {
  constructor(
    private readonly repository: Repository,
    private readonly random: () => number = () => randomInt(0, 1_000_000) / 1_000_000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getMerchantForExperience(merchantSlug: string): Promise<Merchant> {
    const base = getMerchantBySlug(merchantSlug);
    if (!base) throw new Error("Merchant not found");
    return this.repository.transaction((transaction) => this.resolveMerchant(transaction, base));
  }

  async getMerchantForId(merchantId: string): Promise<Merchant> {
    const base = getMerchantById(merchantId);
    if (!base) throw new Error("Merchant not found");
    return this.repository.transaction((transaction) => this.resolveMerchant(transaction, base));
  }

  async getMerchantCustomization(merchantId: string): Promise<MerchantCustomization> {
    const base = getMerchantById(merchantId);
    if (!base) throw new Error("Merchant not found");
    return this.repository.transaction(async (transaction) => {
      const stored = await transaction.getMerchantSettings(merchantId);
      if (!stored) return defaultMerchantCustomization(base);
      return validateMerchantCustomization(stored.customization, base);
    });
  }

  async updateMerchantCustomization(merchantId: string, value: unknown): Promise<Merchant> {
    const base = getMerchantById(merchantId);
    if (!base) throw new Error("Merchant not found");
    const customization = validateMerchantCustomization(value, base);
    await this.repository.transaction((transaction) =>
      transaction.upsertMerchantSettings(merchantId, customization, this.now().toISOString()),
    );
    return applyMerchantCustomization(base, customization);
  }

  async startSession(merchantSlug: string, existingSessionId?: string, referralToken?: string) {
    const base = getMerchantBySlug(merchantSlug);
    if (!base) throw new Error("Merchant not found");

    return this.repository.transaction(async (transaction) => {
      const merchant = await this.resolveMerchant(transaction, base);
      const existing = existingSessionId
        ? await transaction.getSessionById(existingSessionId, merchant.id)
        : undefined;
      if (existing) return { session: existing, merchant };

      const referrer = referralToken && isValidReferralToken(referralToken)
        ? await transaction.getSessionByReferralToken(referralToken, merchant.id)
        : undefined;
      const now = this.now().toISOString();
      const session: Session = {
        id: randomUUID(),
        merchantId: merchant.id,
        referralToken: await this.uniqueValue(transaction, "session_referral", token),
        referredBy: referrer?.referralToken,
        state: "LANDING",
        createdAt: now,
        updatedAt: now,
      };

      await transaction.insertSession(session);
      await transaction.insertEvent(analyticsEvent(
        "landing_viewed",
        session,
        now,
        referrer ? { referralToken: referrer.referralToken } : {},
      ));
      if (referrer) {
        await transaction.insertEvent(analyticsEvent(
          "referral_landing_viewed",
          session,
          now,
          { referralToken: referrer.referralToken },
        ));
      }
      return { session, merchant };
    });
  }

  async getShareContext(referralToken: string) {
    if (!isValidReferralToken(referralToken)) throw new Error("Invalid referral token");
    return this.repository.transaction(async (transaction) => {
      const session = await transaction.getSessionByReferralToken(referralToken);
      if (!session) throw new Error("Referral not found");
      const base = getMerchantById(session.merchantId);
      if (!base) throw new Error("Merchant not found");
      const merchant = await this.resolveMerchant(transaction, base);
      return { session, merchant };
    });
  }

  async unlock(sessionId: string): Promise<Session> {
    return this.repository.transaction(async (transaction) => {
      const session = await this.requireSession(transaction, sessionId, true);
      if (session.state !== "LANDING") return session;

      const now = this.now().toISOString();
      await transaction.insertEvent(analyticsEvent("unlock_viewed", session, now));
      const updated: Session = {
        ...session,
        state: transition(session.state, "unlock_viewed"),
        updatedAt: now,
      };
      await transaction.updateSession(updated);
      return updated;
    });
  }

  async initiateShare(sessionId: string, channel: ShareChannel): Promise<Session> {
    return this.repository.transaction(async (transaction) => {
      const session = await this.requireSession(transaction, sessionId, true);
      if (session.state === "LANDING") throw new Error("Unlock step is required before sharing");
      if (session.state !== "UNLOCK") return session;

      const now = this.now().toISOString();
      await transaction.insertEvent(analyticsEvent("share_channel_selected", session, now, { shareChannel: channel }));
      await transaction.insertEvent(analyticsEvent("share_initiated", session, now, { shareChannel: channel }));
      const updated: Session = {
        ...session,
        state: transition(session.state, "share_initiated"),
        updatedAt: now,
      };
      await transaction.updateSession(updated);
      await transaction.insertEvent(analyticsEvent("wheel_unlocked", updated, now, { shareChannel: channel }));
      return updated;
    });
  }

  async spin(sessionId: string): Promise<Reward> {
    return this.repository.transaction(async (transaction) => {
      const session = await this.requireSession(transaction, sessionId, true);
      if (session.rewardId) return this.requireRewardById(transaction, session.rewardId);
      if (session.state !== "SHARED") throw new Error("Sharing must be initiated before spinning");

      const base = getMerchantById(session.merchantId);
      if (!base) throw new Error("Merchant not found");
      const merchant = await this.resolveMerchant(transaction, base);
      const issuedAt = this.now();
      const now = issuedAt.toISOString();
      await transaction.insertEvent(analyticsEvent("wheel_spun", session, now));

      const prize = selectPrize(merchant.prizes, this.random());
      const expiresAt = new Date(issuedAt);
      expiresAt.setUTCDate(expiresAt.getUTCDate() + merchant.rewardValidityDays);
      const reward: Reward = {
        id: randomUUID(),
        token: await this.uniqueValue(transaction, "reward_token", token),
        shortCode: await this.uniqueValue(transaction, "short_code", shortCode),
        merchantId: merchant.id,
        sessionId: session.id,
        prizeId: prize.id,
        prizeName: prize.name,
        issuedAt: now,
        expiresAt: expiresAt.toISOString(),
      };

      await transaction.insertReward(reward);
      const updated: Session = {
        ...session,
        rewardId: reward.id,
        state: transition(session.state, "wheel_spun"),
        updatedAt: now,
      };
      await transaction.updateSession(updated);
      await transaction.insertEvent(analyticsEvent("reward_issued", updated, now, { rewardId: reward.id }));
      return reward;
    });
  }

  async getReward(rewardToken: string, viewerSessionId?: string): Promise<Reward> {
    return this.repository.transaction(async (transaction) => {
      const reward = await transaction.getRewardByToken(rewardToken);
      if (!reward) throw new Error("Reward not found");
      const session = viewerSessionId
        ? await transaction.getSessionById(viewerSessionId, reward.merchantId)
        : await transaction.getSessionById(reward.sessionId, reward.merchantId);

      if (session && !await transaction.hasEvent("reward_viewed", session.id, reward.id)) {
        await transaction.insertEvent(analyticsEvent(
          "reward_viewed",
          session,
          this.now().toISOString(),
          { rewardId: reward.id },
        ));
      }
      return reward;
    });
  }

  async getRewardForMerchant(merchantId: string, value: string): Promise<Reward> {
    const code = normalizeShortCode(value);
    if (!/^[A-F0-9]{8}$/.test(code)) throw new Error("Reward not found");
    return this.repository.transaction(async (transaction) => {
      const reward = await transaction.getRewardByShortCode(code, merchantId);
      if (!reward) throw new Error("Reward not found");
      return reward;
    });
  }

  async redeemForMerchant(merchantId: string, value: string): Promise<Reward> {
    const code = normalizeShortCode(value);
    if (!/^[A-F0-9]{8}$/.test(code)) throw new Error("Reward not found");
    return this.repository.transaction(async (transaction) => {
      const reward = await transaction.getRewardByShortCode(code, merchantId, true);
      if (!reward) throw new Error("Reward not found");
      if (rewardStatus(reward, this.now()) !== "AVAILABLE") throw new Error("Reward is not available");

      const now = this.now().toISOString();
      const updated: Reward = { ...reward, redeemedAt: now };
      await transaction.updateReward(updated);
      const session = await this.requireSession(transaction, reward.sessionId);
      await transaction.insertEvent(analyticsEvent("reward_redeemed", session, now, { rewardId: reward.id }));
      return updated;
    });
  }

  async getMerchantMetrics(merchantId: string): Promise<MerchantMetrics> {
    if (!getMerchantById(merchantId)) throw new Error("Merchant not found");
    return this.repository.transaction((transaction) => transaction.getMerchantMetrics(merchantId));
  }

  async recordWhatsappSave(sessionId: string): Promise<void> {
    await this.repository.transaction(async (transaction) => {
      const session = await this.requireSession(transaction, sessionId);
      if (!canRecordEvent(session.state, "whatsapp_save_clicked") || !session.rewardId) {
        throw new Error("Reward is required before saving");
      }
      await transaction.insertEvent(analyticsEvent(
        "whatsapp_save_clicked",
        session,
        this.now().toISOString(),
        { rewardId: session.rewardId },
      ));
    });
  }

  private async resolveMerchant(transaction: TransactionRepository, base: Merchant): Promise<Merchant> {
    const stored = await transaction.getMerchantSettings(base.id);
    if (!stored) return base;
    const customization = validateMerchantCustomization(stored.customization, base);
    return applyMerchantCustomization(base, customization);
  }

  private async uniqueValue(
    transaction: TransactionRepository,
    kind: UniqueValueKind,
    generator: () => string,
  ): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = generator();
      if (!await transaction.uniqueValueExists(kind, candidate)) return candidate;
    }
    throw new Error("Unable to allocate unique value");
  }

  private async requireSession(
    transaction: TransactionRepository,
    sessionId: string,
    forUpdate = false,
  ): Promise<Session> {
    const session = await transaction.getSessionById(sessionId, undefined, forUpdate);
    if (!session) throw new Error("Session not found");
    return session;
  }

  private async requireRewardById(transaction: TransactionRepository, rewardId: string): Promise<Reward> {
    const reward = await transaction.getRewardById(rewardId);
    if (!reward) throw new Error("Reward not found");
    return reward;
  }
}
