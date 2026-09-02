import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { viralio } from "@/application";
import { getMerchantBySlug } from "@/config/merchants";
import { MERCHANT_SESSION_COOKIE, verifyMerchantSessionToken } from "@/security/merchant-auth";
import { MerchantSettingsPanel } from "@/ui/merchant-settings-panel";

export const dynamic = "force-dynamic";

export default async function MerchantSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
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

  if (!authenticated) redirect(`/comercio/${base.slug}/canjes`);

  const [merchant, customization] = await Promise.all([
    viralio.getMerchantForExperience(base.slug),
    viralio.getMerchantCustomization(base.id),
  ]);
  return <MerchantSettingsPanel merchant={merchant} initialCustomization={customization} />;
}
