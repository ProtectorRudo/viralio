import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { viralio } from "@/application";
import { getMerchantBySlug } from "@/config/merchants";
import { MERCHANT_SESSION_COOKIE, verifyMerchantSessionToken } from "@/security/merchant-auth";
import { MerchantRedemptionPanel } from "@/ui/merchant-redemption-panel";

export const dynamic = "force-dynamic";

export default async function MerchantRedemptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = getMerchantBySlug(slug);
  if (!base) notFound();

  let authenticated = false;
  try {
    const store = await cookies();
    const session = verifyMerchantSessionToken(store.get(MERCHANT_SESSION_COOKIE)?.value);
    authenticated = session?.merchantId === base.id;
  } catch {
    authenticated = false;
  }

  const merchant = authenticated ? await viralio.getMerchantForExperience(base.slug) : base;
  return <MerchantRedemptionPanel merchant={merchant} authenticated={authenticated} />;
}
