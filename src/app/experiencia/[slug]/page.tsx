import { notFound } from "next/navigation";
import { viralio } from "@/application";
import type { Merchant } from "@/domain/types";
import { MerchantExperience } from "@/ui/merchant-experience";

export const dynamic = "force-dynamic";

export default async function DynamicMerchantExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const [{ slug }, { ref }] = await Promise.all([params, searchParams]);
  let merchant: Merchant;
  try {
    merchant = await viralio.getMerchantForExperience(slug);
  } catch {
    notFound();
  }
  return <MerchantExperience merchant={merchant} referralToken={ref} />;
}
