import { notFound } from "next/navigation";
import { viralio } from "@/application";
import type { Merchant } from "@/domain/types";
import { PreviewFreshSessionBoundary } from "@/ui/preview-fresh-session-boundary";

export const dynamic = "force-dynamic";

export default async function DynamicMerchantRootPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; fresh?: string }>;
}) {
  const [{ slug }, { ref, fresh }] = await Promise.all([params, searchParams]);
  let merchant: Merchant;
  try {
    merchant = await viralio.getMerchantForExperience(slug);
  } catch {
    notFound();
  }

  const forceFreshSession = process.env.VERCEL_ENV === "preview" && fresh === "1";

  return (
    <PreviewFreshSessionBoundary
      merchant={merchant}
      referralToken={ref}
      forceFreshSession={forceFreshSession}
    />
  );
}
