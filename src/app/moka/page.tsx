import type { Metadata } from "next";
import { viralio } from "@/application";
import { MerchantExperience } from "@/ui/merchant-experience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moka · Hay algo especial esperando",
  description: "Abrí tu pase Moka, compartí y descubrí un premio para tu próxima pausa.",
};

export default async function MokaPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const merchant = await viralio.getMerchantForExperience("moka");
  return <MerchantExperience merchant={merchant} referralToken={ref} />;
}
