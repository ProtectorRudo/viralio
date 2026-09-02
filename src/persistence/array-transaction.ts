import type { AnalyticsEvent, Database, EventName, Reward, Session } from "@/domain/types";
import type { TransactionRepository, UniqueValueKind } from "./repository";

export class ArrayTransaction implements TransactionRepository {
  constructor(private readonly database: Database) {}

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

  async uniqueValueExists(kind: UniqueValueKind, value: string): Promise<boolean> {
    if (kind === "session_referral") return this.database.sessions.some((session) => session.referralToken === value);
    if (kind === "reward_token") return this.database.rewards.some((reward) => reward.token === value);
    return this.database.rewards.some((reward) => reward.shortCode === value);
  }
}
