import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { viralio } from "@/application";
import { MERCHANT_SESSION_COOKIE, verifyMerchantSessionToken } from "@/security/merchant-auth";
import { MerchantSettingsPanel } from "@/ui/merchant-settings-panel";

export const dynamic = "force-dynamic";

export default async function MerchantSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
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

  if (!authenticated) redirect(`/comercio/${merchant.slug}/canjes`);

  const customization = await viralio.getMerchantCustomization(merchant.id);
  return <MerchantSettingsPanel merchant={merchant} initialCustomization={customization} />;
}
