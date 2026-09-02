import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { getMerchantById, getMerchantBySlug } from "@/config/merchants";
import { canRecordEvent, transition } from "@/domain/flow";
import { selectPrize } from "@/domain/probabilities";
import { rewardStatus } from "@/domain/rewards";
import { isValidReferralToken } from "@/domain/tokens";
import type { AnalyticsEvent, Database, EventName, Reward, Session, ShareChannel } from "@/domain/types";
import type { Repository } from "@/persistence/repository";

function token(): string {
  return randomBytes(16).toString("base64url");
}

function uniqueToken(existing: string[]): string {
  let candidate = token();
  while (existing.includes(candidate)) candidate = token();
  return candidate;
}

function uniqueShortCode(existing: string[]): string {
  let candidate = randomBytes(4).toString("hex").toUpperCase();
  while (existing.includes(candidate)) candidate = randomBytes(4).toString("hex").toUpperCase();
  return candidate;
}

function event(database: Database, name: EventName, session: Session, extras: Partial<AnalyticsEvent> = {}): void {
  database.events.push({
    id: randomUUID(),
    name,
    merchantId: session.merchantId,
    sessionId: session.id,
    timestamp: new Date().toISOString(),
    ...extras,
  });
}

export class ViralioService {
  constructor(
    private readonly repository: Repository,
    private readonly random: () => number = () => randomInt(0, 1_000_000) / 1_000_000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async startSession(merchantSlug: string, existingSessionId?: string, referralToken?: string) {
    const merchant = getMerchantBySlug(merchantSlug);
    if (!merchant) throw new Error("Merchant not found");
    return this.repository.transaction((database) => {
      const existing = existingSessionId
        ? database.sessions.find((session) => session.id === existingSessionId && session.merchantId === merchant.id)
        : undefined;
      if (existing) return { session: existing, merchant };

      const referrer = referralToken && isValidReferralToken(referralToken)
        ? database.sessions.find((session) => session.referralToken === referralToken && session.merchantId === merchant.id)
        : undefined;
      const now = this.now().toISOString();
      const session: Session = {
        id: randomUUID(), merchantId: merchant.id,
        referralToken: uniqueToken(database.sessions.map((candidate) => candidate.referralToken)),
        referredBy: referrer?.referralToken, state: "LANDING", createdAt: now, updatedAt: now,
      };
      database.sessions.push(session);
      event(database, "landing_viewed", session, referrer ? { referralToken: referrer.referralToken } : {});
      if (referrer) event(database, "referral_landing_viewed", session, { referralToken: referrer.referralToken });
      return { session, merchant };
    });
  }

  async unlock(sessionId: string): Promise<Session> {
    return this.repository.transaction((database) => {
      const session = this.requireSession(database, sessionId);
      if (session.state === "LANDING") {
        event(database, "unlock_viewed", session);
        session.state = transition(session.state, "unlock_viewed");
        session.updatedAt = this.now().toISOString();
      }
      return session;
    });
  }

  async initiateShare(sessionId: string, channel: ShareChannel): Promise<Session> {
    return this.repository.transaction((database) => {
      const session = this.requireSession(database, sessionId);
      if (session.state === "UNLOCK") {
        event(database, "share_channel_selected", session, { shareChannel: channel });
        event(database, "share_initiated", session, { shareChannel: channel });
        session.state = transition(session.state, "share_initiated");
        session.updatedAt = this.now().toISOString();
        event(database, "wheel_unlocked", session, { shareChannel: channel });
      }
      if (session.state === "LANDING") throw new Error("Unlock step is required before sharing");
      return session;
    });
  }

  async spin(sessionId: string): Promise<Reward> {
    return this.repository.transaction((database) => {
      const session = this.requireSession(database, sessionId);
      if (session.rewardId) return this.requireRewardById(database, session.rewardId);
      if (session.state !== "SHARED") throw new Error("Sharing must be initiated before spinning");
      const merchant = getMerchantById(session.merchantId);
      if (!merchant) throw new Error("Merchant not found");
      event(database, "wheel_spun", session);
      const prize = selectPrize(merchant.prizes, this.random());
      const issuedAt = this.now();
      const expiresAt = new Date(issuedAt);
      expiresAt.setUTCDate(expiresAt.getUTCDate() + merchant.rewardValidityDays);
      const reward: Reward = {
        id: randomUUID(),
        token: uniqueToken(database.rewards.map((candidate) => candidate.token)),
        shortCode: uniqueShortCode(database.rewards.map((candidate) => candidate.shortCode)),
        merchantId: merchant.id, sessionId: session.id, prizeId: prize.id, prizeName: prize.name,
        issuedAt: issuedAt.toISOString(), expiresAt: expiresAt.toISOString(),
      };
      database.rewards.push(reward);
      session.rewardId = reward.id;
      session.state = transition(session.state, "wheel_spun");
      session.updatedAt = issuedAt.toISOString();
      event(database, "reward_issued", session, { rewardId: reward.id });
      return reward;
    });
  }

  async getReward(rewardToken: string, viewerSessionId?: string): Promise<Reward> {
    return this.repository.transaction((database) => {
      const reward = database.rewards.find((candidate) => candidate.token === rewardToken);
      if (!reward) throw new Error("Reward not found");
      const session = viewerSessionId
        ? database.sessions.find((candidate) => candidate.id === viewerSessionId && candidate.merchantId === reward.merchantId)
        : database.sessions.find((candidate) => candidate.id === reward.sessionId);
      if (session && !database.events.some((item) => item.name === "reward_viewed" && item.rewardId === reward.id && item.sessionId === session.id)) {
        event(database, "reward_viewed", session, { rewardId: reward.id });
      }
      return reward;
    });
  }

  async redeem(rewardToken: string): Promise<Reward> {
    return this.repository.transaction((database) => {
      const reward = database.rewards.find((candidate) => candidate.token === rewardToken);
      if (!reward) throw new Error("Reward not found");
      if (rewardStatus(reward, this.now()) !== "AVAILABLE") throw new Error("Reward is not available");
      reward.redeemedAt = this.now().toISOString();
      const session = this.requireSession(database, reward.sessionId);
      event(database, "reward_redeemed", session, { rewardId: reward.id });
      return reward;
    });
  }

  async recordWhatsappSave(sessionId: string): Promise<void> {
    await this.repository.transaction((database) => {
      const session = this.requireSession(database, sessionId);
      if (!canRecordEvent(session.state, "whatsapp_save_clicked") || !session.rewardId) {
        throw new Error("Reward is required before saving");
      }
      event(database, "whatsapp_save_clicked", session, { rewardId: session.rewardId });
    });
  }

  private requireSession(database: Database, sessionId: string): Session {
    const session = database.sessions.find((candidate) => candidate.id === sessionId);
    if (!session) throw new Error("Session not found");
    return session;
  }

  private requireRewardById(database: Database, rewardId: string): Reward {
    const reward = database.rewards.find((candidate) => candidate.id === rewardId);
    if (!reward) throw new Error("Reward not found");
    return reward;
  }
}
