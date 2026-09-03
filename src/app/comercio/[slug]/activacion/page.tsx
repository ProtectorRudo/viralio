import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { viralio } from "@/application";
import type { Merchant } from "@/domain/types";
import { MERCHANT_SESSION_COOKIE, verifyMerchantSessionToken } from "@/security/merchant-auth";
import { MerchantActivationKit } from "@/ui/merchant-activation-kit";

export const dynamic = "force-dynamic";

export default async function MerchantActivationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let merchant: Merchant;
  try {
    merchant = await viralio.getMerchantForExperience(slug);
  } catch {
    notFound();
  }

  let authenticated = false;
  try {
    const store = await cookies();
    const session = verifyMerchantSessionToken(store.get(MERCHANT_SESSION_COOKIE)?.value);
    authenticated = session?.merchantId === merchant.id;
  } catch {
    authenticated = false;
  }

  if (!authenticated) redirect(`/comercio/${merchant.slug}/canjes`);
  return <MerchantActivationKit merchant={merchant} />;
}
