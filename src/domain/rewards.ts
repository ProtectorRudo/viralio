import type { Reward, RewardStatus } from "./types";

export function rewardStatus(reward: Reward, now = new Date()): RewardStatus {
  if (reward.redeemedAt) return "REDEEMED";
  if (new Date(reward.expiresAt).getTime() <= now.getTime()) return "EXPIRED";
  return "AVAILABLE";
}
