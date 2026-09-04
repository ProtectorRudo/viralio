import { notFound } from "next/navigation";
import { viralio } from "@/application";
import type { Merchant } from "@/domain/types";
import { StoryBuilder } from "@/ui/story-builder";

export const dynamic = "force-dynamic";

export default async function StoryBuilderPage({
  params,
}: {
  params: Promise<{ merchantSlug: string; referralToken: string }>;
}) {
  const { merchantSlug, referralToken } = await params;
  let merchant: Merchant;
  try {
    merchant = await viralio.getMerchantForExperience(merchantSlug);
  } catch {
    notFound();
  }

  return <StoryBuilder merchant={merchant} referralToken={referralToken} />;
}
