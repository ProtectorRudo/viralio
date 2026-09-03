import { notFound } from "next/navigation";
import { viralio } from "@/application";
import { MerchantExperience } from "@/ui/merchant-experience";

export const dynamic = "force-dynamic";

export default async function DynamicMerchantRootPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const [{ slug }, { ref }] = await Promise.all([params, searchParams]);
  try {
    const merchant = await viralio.getMerchantForExperience(slug);
    return <MerchantExperience merchant={merchant} referralToken={ref} />;
  } catch {
    notFound();
  }
}
