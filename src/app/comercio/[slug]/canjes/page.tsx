import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { viralio } from "@/application";
import { MERCHANT_SESSION_COOKIE, verifyMerchantSessionToken } from "@/security/merchant-auth";
import { MerchantRedemptionPanel } from "@/ui/merchant-redemption-panel";

export const dynamic = "force-dynamic";

export default async function MerchantRedemptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let merchant;
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

  return <MerchantRedemptionPanel merchant={merchant} authenticated={authenticated} />;
}
