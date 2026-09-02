import type { Metadata } from "next";
import { getMerchantBySlug } from "@/config/merchants";
import { MerchantExperience } from "@/ui/merchant-experience";

export const metadata: Metadata = {
  title: "Atlas Barber · Tu pase privado",
  description: "Abrí tu pase Atlas, compartí y descubrí un beneficio para tu próximo corte.",
};

export default async function AtlasPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const merchant = getMerchantBySlug("atlas-barber");
  if (!merchant) throw new Error("Merchant not found");
  return <MerchantExperience merchant={merchant} referralToken={ref} />;
}
