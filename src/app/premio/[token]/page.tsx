import { notFound } from "next/navigation";
import { viralio } from "@/application";
import { rewardStatus } from "@/domain/rewards";
import type { Merchant, Reward } from "@/domain/types";
import { RewardCard } from "@/ui/reward-card";

export const dynamic = "force-dynamic";

export default async function PublicRewardPage({ params }: { params: Promise<{ token: string }> }) {
  let reward: Reward;
  let merchant: Merchant;
  try {
    const { token } = await params;
    reward = await viralio.getReward(token);
    merchant = await viralio.getMerchantForId(reward.merchantId);
  } catch { notFound(); }
  return <RewardCard reward={reward} merchant={merchant} initialStatus={rewardStatus(reward)} />;
}
