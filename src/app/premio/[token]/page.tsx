import { notFound } from "next/navigation";
import { viralio } from "@/application";
import { getMerchantById } from "@/config/merchants";
import { rewardStatus } from "@/domain/rewards";
import type { Reward } from "@/domain/types";
import { RewardCard } from "@/ui/reward-card";

export const dynamic = "force-dynamic";

export default async function PublicRewardPage({ params }: { params: Promise<{ token: string }> }) {
  let reward: Reward;
  try {
    const { token } = await params;
    reward = await viralio.getReward(token);
  } catch { notFound(); }
  const merchant = getMerchantById(reward.merchantId);
  if (!merchant) notFound();
  return <RewardCard reward={reward} merchant={merchant} initialStatus={rewardStatus(reward)} />;
}
